"""Kafka consumer for streaming telemetry data."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Callable

from confluent_kafka import Consumer, KafkaError

logger = logging.getLogger("streaming.consumer")


class TelemetryConsumer:
    """Consumes and deserializes telemetry data from Kafka."""

    def __init__(self, brokers: list[str], group_id: str, topic: str):
        self.consumer = Consumer(
            {
                "bootstrap.servers": ",".join(brokers),
                "group.id": group_id,
                "auto.offset.reset": "earliest",
                "enable.auto.commit": True,
                "session.timeout.ms": "10000",
            }
        )
        self.topic = topic
        self.consumer.subscribe([topic])

    def consume(self, handler: Callable[[dict], None], max_messages: int = 0) -> int:
        """Consume messages and pass to handler.

        Args:
            handler: Callback for processing each message.
            max_messages: Max messages to consume (0 = unlimited).

        Returns:
            Number of messages processed.
        """
        count = 0
        try:
            while max_messages == 0 or count < max_messages:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.info("End of partition reached")
                        continue
                    logger.error("Kafka error: %s", msg.error())
                    continue

                record = self._deserialize(msg.value())
                if record:
                    handler(record)
                    count += 1

        except KeyboardInterrupt:
            logger.info("Consumer interrupted")
        finally:
            self.consumer.close()

        logger.info("Consumer finished: %d messages processed", count)
        return count

    def _deserialize(self, value: bytes) -> dict | None:
        """Deserialize Kafka message bytes to dict."""
        try:
            return json.loads(value.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.warning("Failed to deserialize: %s", e)
            return None


class StreamProcessor:
    """Base class for stream processing stages."""

    def process(self, record: dict) -> dict | None:
        """Process a single record. Return None to filter it out."""
        raise NotImplementedError

    def batch_process(self, records: list[dict]) -> list[dict]:
        """Process a batch of records."""
        return [r for r in (self.process(rec) for rec in records) if r is not None]
