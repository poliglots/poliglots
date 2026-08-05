# 🏭 IoT Platform

A production-ready IoT ingestion and streaming platform built with Go, Kafka, and HBase.

## Architecture

```
[Devices] → (MQTT/TCP) → [Go Ingestion Service] → Kafka Topics → [Stream Processors] → HBase Time-Series Storage → API → Dashboard
```

## Features

- **Device Management** — Registration, authentication, and OTA updates
- **Real-time Ingestion** — Handle 10K+ concurrent device connections
- **Event Streaming** — Kafka-based event pipeline with partitioning and fault tolerance
- **Time-Series Storage** — HBase for high-write throughput telemetry storage
- **Key-Value Cache** — Redis-compatible hot data caching layer
- **REST & gRPC APIs** — Double API surface for flexibility

## Quick Start

```bash
# 1. Start dependencies
docker-compose up -d kafka hbase zookeeper redis

# 2. Run migrations
go run cmd/server/main.go migrate

# 3. Start the server
go run cmd/server/main.go serve
```

## Project Structure

```
iot-platform/
├── cmd/server/          # Entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── device/          # Device registry & auth
│   ├── handler/         # Message handlers
│   ├── kafka/           # Kafka producer/consumer
│   └── storage/         # HBase & KV store layer
├── pkg/kafka/           # Reusable Kafka package
├── configs/             # Environment configs
├── docs/                # API docs & architecture diagrams
└── Makefile
```

## Tech Stack

- **Language:** Go 1.21+
- **Streaming:** Apache Kafka
- **Storage:** Apache HBase (time-series), Redis (cache)
- **Protocol:** MQTT, gRPC, REST
- **Containerization:** Docker, Docker Compose

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/devices` | Register a new device |
| GET | `/api/v1/devices/:id` | Get device details |
| POST | `/api/v1/telemetry` | Ingest telemetry data |
| GET | `/api/v1/telemetry?device=:id&from=&to=` | Query time-series data |
| WS | `/ws/telemetry` | Real-time telemetry stream |

---

*Built for scale. Designed for reliability.*
