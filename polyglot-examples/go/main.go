//go:build ignore
// +build ignore

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

// Message represents a telemetry data point.
type Message struct {
	DeviceID  string  `json:"device_id"`
	Metric    string  `json:"metric"`
	Value     float64 `json:"value"`
	Timestamp int64   `json:"timestamp"`
}

// Result represents processed output.
type Result struct {
	DeviceID  string    `json:"device_id"`
	Average   float64   `json:"average"`
	Processed time.Time `json:"processed"`
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Println("🔧 Go: Starting polyglot example")

	// 1. Load configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("📋 Config: server port = %s", port)

	// 2. Process a sample message
	msg := Message{
		DeviceID:  "sensor-001",
		Metric:    "temperature",
		Value:     24.5,
		Timestamp: time.Now().Unix(),
	}

	// 3. Process the message
	result := processMessage(msg)

	// 4. Output the result
	data, _ := json.MarshalIndent(result, "", "  ")
	fmt.Printf("✅ Result: %s\n", data)

	log.Println("🔚 Go: Done")
}

func processMessage(msg Message) Result {
	log.Printf("📊 Processing: device=%s metric=%s value=%.2f", msg.DeviceID, msg.Metric, msg.Value)

	// Simple transformation: round the value
	average := float64(int(msg.Value*10)) / 10

	return Result{
		DeviceID:  msg.DeviceID,
		Average:   average,
		Processed: time.Now(),
	}
}
