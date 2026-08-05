# 📊 Data Pipeline Framework

Python framework for building robust ETL pipelines that process, transform, and load IoT telemetry data.

## Architecture

```
[Kafka Source] → [Extractor] → [Transformer] → [Validator] → [Sink: HBase/PostgreSQL/S3]
```

## Features

- **Kafka Source/Sink** — Read from and write to Kafka topics
- **Modular Transformers** — Chain transformations with a fluent API
- **Validation Layer** — Schema validation with Pydantic
- **Error Handling** — Dead letter queue for failed records
- **Monitoring** — Prometheus metrics and structured logging
- **Scheduling** — Cron-based and event-driven execution
- **Batch & Stream** — Unified interface for both modes

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run a pipeline
python -m pipeline.run --config configs/pipeline.yaml

# Run with streaming mode
python -m pipeline.run --stream --config configs/streaming.yaml
```

## Project Structure

```
data-pipeline/
├── etl/                 # ETL orchestration
│   ├── engine.py        # Pipeline engine
│   └── scheduler.py     # Cron/event scheduler
├── streaming/           # Stream processing
│   ├── consumer.py      # Kafka consumer
│   └── processors.py    # Stream processors
├── transformers/        # Data transformation modules
│   ├── aggregator.py    # Metric aggregation
│   ├── normalizer.py    # Unit normalization
│   └── enricher.py      # Enrich with device metadata
├── sources/             # Data sources
│   ├── kafka_source.py  # Kafka consumer source
│   └── file_source.py   # CSV/JSON file source
├── sinks/               # Data sinks
│   ├── hbase_sink.py    # HBase writer
│   ├── postgres_sink.py # PostgreSQL writer
│   └── s3_sink.py       # S3/Parquet writer
├── configs/             # Pipeline configurations
└── requirements.txt
```

## Example Pipeline

```python
from pipeline import Pipeline, Transformer

pipeline = (
    Pipeline(source="kafka", topic="telemetry.raw")
    .add_transform(
        FilterTransformer(device_types=["sensor", "actuator"]),
        AggregatorTransformer(interval="5m"),
        NormalizerTransformer(),
    )
    .add_sink("hbase", table="telemetry_processed")
    .run()
)
```

## Tech Stack

- **Language:** Python 3.11+
- **Streaming:** Kafka (confluent-kafka)
- **Validation:** Pydantic v2
- **Serialization:** Apache Arrow / Parquet
- **Monitoring:** Prometheus + Grafana
- **Scheduling:** APScheduler / Cron
