#!/usr/bin/env python3
"""
Python: Process a telemetry message.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class Message:
    device_id: str
    metric: str
    value: float
    timestamp: int


@dataclass
class Result:
    device_id: str
    average: float
    processed: str


def process_message(msg: Message) -> Result:
    print(f"📊 Processing: device={msg.device_id} metric={msg.metric} value={msg.value}")

    # Simple transformation: round the value
    average = round(msg.value * 10) / 10

    return Result(
        device_id=msg.device_id,
        average=average,
        processed=datetime.now(timezone.utc).isoformat(),
    )


def main() -> None:
    print("🔧 Python: Starting polyglot example")

    port = os.getenv("PORT", "8080")
    print(f"📋 Config: server port = {port}")

    msg = Message(
        device_id="sensor-001",
        metric="temperature",
        value=24.5,
        timestamp=int(datetime.now().timestamp()),
    )

    result = process_message(msg)
    print(f"✅ Result: {json.dumps(result.__dict__, indent=2)}")

    print("🔚 Python: Done")


if __name__ == "__main__":
    main()
