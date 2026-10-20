import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.graph import compose_graph
from app.integration.callback import report_done, report_failed, report_progress, report_started

logger = logging.getLogger(__name__)


async def process_request(payload: dict[str, Any]) -> None:
    job_id = str(payload.get("job_id", ""))
    if not job_id:
        logger.error("compose request has no job_id")
        return

    await report_started(job_id)
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
    except NotImplementedError:
        logger.exception("pipeline is not implemented", extra={"job_id": job_id})
        await report_failed(job_id, "UNSUPPORTED_PIPELINE", retryable=False)
    except (ValueError, FileNotFoundError):
        logger.exception("invalid compose request", extra={"job_id": job_id})
        await report_failed(job_id, "INVALID_INPUT", retryable=False)
    except Exception:
        logger.exception("compose request failed", extra={"job_id": job_id})
        await report_failed(job_id, "ENGINE_ERROR", retryable=True)


async def consume_requests() -> None:
    consumer = AIOKafkaConsumer(
        settings.kafka_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_group_id,
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )
    await consumer.start()
    try:
        async for message in consumer:
            logger.info("received compose request", extra={"offset": message.offset})
            await process_request(message.value)
    finally:
        await consumer.stop()
