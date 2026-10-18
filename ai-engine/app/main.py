from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Kafka consumer is intentionally not started by default during the skeleton phase.
    # Wire it here when the local Kafka environment is ready.
    yield

app = FastAPI(title="ourcut-ai-engine", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "kafka_topic": settings.kafka_topic}
