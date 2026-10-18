import asyncio
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI

from app.config import settings
from app.messaging.consumer import consume_requests

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    consumer_task = None
    if settings.kafka_enabled:
        consumer_task = asyncio.create_task(consume_requests(), name="compose-kafka-consumer")
        logger.info("Kafka consumer started")
    try:
        yield
    finally:
        if consumer_task:
            consumer_task.cancel()
            await asyncio.gather(consumer_task, return_exceptions=True)
            logger.info("Kafka consumer stopped")

app = FastAPI(title="ourcut-ai-engine", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "kafka_topic": settings.kafka_topic,
        "kafka_enabled": settings.kafka_enabled,
    }
