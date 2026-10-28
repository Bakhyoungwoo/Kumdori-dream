import asyncio
import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.config import settings
from app.graph import compose_graph
from app.integration.callback import report_done, report_failed, report_progress, report_started

logger = logging.getLogger(__name__)


async def process_request(payload: dict[str, Any], notify_failure: bool = True) -> None:
    job_id = str(payload.get("job_id", ""))
    if not job_id:
        logger.error("compose request has no job_id")
        return

    try:
        await report_started(job_id)
    except Exception as exception:
        logger.exception("unable to notify Core API that job started", extra={"job_id": job_id})
        raise exception
    try:
        result: dict[str, Any] = dict(payload)
        run_config = {
            "run_name": f"compose:{job_id}",
            "tags": ["compose", str(payload.get("media_type", "IMAGE")), str(payload.get("pipeline_type", "CV"))],
            "metadata": {
                "job_id": job_id,
                "user_id": str(payload.get("user_id", "")),
            },
        }
        async for update in compose_graph.astream(
            payload,
            config=run_config,
            stream_mode="updates",
        ):
            for node_state in update.values():
                if isinstance(node_state, dict):
                    result.update(node_state)
                    if node_state.get("current_step") and node_state.get("progress") is not None:
                        await report_progress(
                            job_id,
                            node_state["current_step"],
                            int(node_state["progress"]),
                        )
        await report_done(job_id, result.get("result_keys", []), result.get("thumbnail_key"))
    except NotImplementedError as exception:
        logger.exception("pipeline is not implemented", extra={"job_id": job_id})
        if notify_failure:
            await _safe_report_failed(job_id, "UNSUPPORTED_PIPELINE")
        raise exception
    except (ValueError, FileNotFoundError) as exception:
        logger.exception("invalid compose request", extra={"job_id": job_id})
        if notify_failure:
            await _safe_report_failed(job_id, "INVALID_INPUT")
        raise exception
    except Exception as exception:
        logger.exception("compose request failed", extra={"job_id": job_id})
        if notify_failure:
            await _safe_report_failed(job_id, "ENGINE_ERROR")
        raise exception


async def _safe_report_failed(job_id: str, error_code: str) -> None:
    try:
        await report_failed(job_id, error_code, retryable=True)
    except Exception:
        logger.exception("unable to notify Core API that job failed", extra={"job_id": job_id})


async def consume_requests() -> None:
    consumer = AIOKafkaConsumer(
        settings.kafka_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_group_id,
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_serializer=lambda value: json.dumps(value).encode("utf-8"),
    )
    await consumer.start()
    await producer.start()
    try:
        async for message in consumer:
            logger.info("received compose request", extra={"offset": message.offset})
            last_error: Exception | None = None
            for attempt in range(1, settings.kafka_max_retries + 1):
                try:
                    await process_request(message.value, notify_failure=False)
                    last_error = None
                    break
                except Exception as exception:
                    last_error = exception
                    logger.exception("compose request attempt failed", extra={"attempt": attempt})
                    if attempt < settings.kafka_max_retries:
                        await asyncio.sleep(settings.kafka_retry_backoff_seconds * attempt)
            if last_error is not None:
                await _safe_report_failed(str(message.value.get("job_id", "")), "ENGINE_ERROR")
                await producer.send_and_wait(settings.kafka_dlq_topic, {
                    "original": message.value,
                    "partition": message.partition,
                    "offset": message.offset,
                    "error": str(last_error),
                })
    finally:
        await producer.stop()
        await consumer.stop()
