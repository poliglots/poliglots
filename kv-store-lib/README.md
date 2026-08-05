# 💾 KV Store Library

A lightweight, concurrent key-value store library written in Go. Designed for use in IoT edge devices and microservices.

## Features

- **In-memory** — Fast RAM-based storage with configurable TTL
- **Snapshotting** — Persist state to disk for recovery
- **Concurrent Safe** — Lock-free reads with mutex-protected writes
- **TTL Support** — Automatic key expiration
- **Eviction Policies** — LRU (Least Recently Used) support
- **Memory Efficient** — Memory-mapped storage for large datasets
- **Simple API** — Clean, Go-idiomatic interface

## Quick Start

```go
import "github.com/poliglots/kv-store-lib/pkg/store"

// Create new store
s := store.New(store.Options{
    MaxSize:  1_000_000,
    Eviction: store.EvictLRU,
})

// Set/Get/Delete
s.Set("device:001", []byte("online"))
val, _ := s.Get("device:001")

// Snapshot to disk
s.Snapshot("snapshot.db")
s.LoadSnapshot("snapshot.db")
```

## Project Structure

```
kv-store-lib/
├── pkg/
│   ├── store/     # Main store implementation
│   ├── cache/     # LRU cache implementation
│   └── index/     # B-tree index for ordered access
└── README.md
```

## API

| Method | Description |
|--------|-------------|
| `Set(key, value)` | Insert or update a key-value pair |
| `Get(key)` | Retrieve value by key |
| `Delete(key)` | Remove a key |
| `Exists(key)` | Check if key exists |
| `Keys()` | List all keys |
| `Count()` | Get total key count |
| `Snapshot(path)` | Save state to disk |
| `Load(path)` | Restore state from disk |
| `Close()` | Clean up resources |

## Performance Targets

- **Read:** < 100ns per operation
- **Write:** < 200ns per operation
- **Memory:** ~20 bytes per entry overhead

## Tech Stack

- **Language:** Go 1.21+
- **Testing:** Table-driven tests with race detection
- **Benchmarking:** Go benchmark suite
