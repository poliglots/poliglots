# 🔧 Microservices Boilerplate

Production-ready Go microservices scaffold with gRPC, distributed tracing, structured logging, and health checks.

## Features

- **gRPC + REST** — Dual API surface via gRPC-gateway
- **Health Checks** — Ready, live, and readiness probes
- **Structured Logging** — Zap logger with trace IDs
- **Request Tracing** — OpenTelemetry integration
- **Configuration** — Multi-environment config with viper
- **Error Handling** — Centralized error package with gRPC status codes
- **Testing** — Table-driven tests, mock interfaces, test helpers
- **Docker** — Multi-stage builds, slim images

## Quick Start

```bash
# Generate protobuf code
make proto

# Run the service
go run cmd/api/main.go

# Run tests
make test
```

## Project Structure

```
microservices-boilerplate/
├── cmd/api/             # Entry point
├── internal/
│   ├── auth/            # JWT middleware, token validation
│   ├── messaging/       # Kafka/rabbitmq publisher
│   └── router/          # HTTP/gRPC router
├── pkg/errors/          # Error types with gRPC status mapping
├── configs/             # dev.yaml, prod.yaml, test.yaml
└── Makefile
```

## API

### gRPC Service Definition

```protobuf
syntax = "proto3";
package api.v1;

service ApiService {
  rpc Health (HealthRequest) returns (HealthResponse);
  rpc CreateUser (CreateUserRequest) returns (UserResponse);
  rpc GetUser (GetUserRequest) returns (UserResponse);
}
```

## Tech Stack

- **Language:** Go 1.21+
- **RPC:** gRPC + Protobuf
- **HTTP Gateway:** grpc-gateway
- **Logging:** Uber Zap
- **Config:** Viper
- **Tracing:** OpenTelemetry
