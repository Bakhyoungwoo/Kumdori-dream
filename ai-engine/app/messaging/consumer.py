import json
import logging

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.graph import compose_graph

logger = logging.getLogger(__name__)


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
            await compose_graph.ainvoke(message.value)
    finally:
        await consumer.stop()
