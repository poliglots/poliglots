package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/poliglots/iot-platform/internal/config"
	"github.com/poliglots/iot-platform/internal/handler"
	"github.com/poliglots/iot-platform/internal/kafka"
	"github.com/poliglots/iot-platform/internal/storage"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize HBase storage
	store, err := storage.NewHBaseStore(cfg.HBase)
	if err != nil {
		log.Fatalf("Failed to connect to HBase: %v", err)
	}
	defer store.Close()

	// Initialize Kafka producer
	producer, err := kafka.NewProducer(cfg.Kafka.Brokers)
	if err != nil {
		log.Fatalf("Failed to create Kafka producer: %v", err)
	}
	defer producer.Close()

	// Initialize Kafka consumers for device events
	consumer, err := kafka.NewConsumer(cfg.Kafka.Brokers, cfg.Kafka.Consumers)
	if err != nil {
		log.Fatalf("Failed to create Kafka consumer: %v", err)
	}
	defer consumer.Close()

	// Setup HTTP server
	mux := http.NewServeMux()
	h := handler.New(store, producer, consumer, cfg)

	mux.HandleFunc("/api/v1/devices", h.RegisterDevice)
	mux.HandleFunc("/api/v1/devices/", h.GetDevice)
	mux.HandleFunc("/api/v1/telemetry", h.IngestTelemetry)
	mux.HandleFunc("/api/v1/telemetry/query", h.QueryTelemetry)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Server.Port),
		Handler: mux,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down server...")
		server.Shutdown(nil)
	}()

	log.Printf("IoT Platform starting on port %d", cfg.Server.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
