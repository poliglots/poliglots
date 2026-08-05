package kafka

import (
	"fmt"

	"github.com/IBM/sarama"
	"go.uber.org/zap"
)

// Producer wraps Sarama synchronous producer for IoT message publishing.
type Producer struct {
	producer sarama.SyncProducer
	logger   *zap.Logger
}

// NewProducer creates a new Kafka producer.
func NewProducer(brokers []string) (*Producer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Return.Successes = true
	config.Producer.Return.Errors = true

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %w", err)
	}

	return &Producer{
		producer: producer,
		logger:   zap.L(),
	}, nil
}

// Publish sends a message to the specified topic.
func (p *Producer) Publish(topic string, key, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(key),
		Value: sarama.StringEncoder(value),
	}

	partition, offset, err := p.producer.SendMessage(msg)
	if err != nil {
		return fmt.Errorf("failed to publish message to %s: %w", topic, err)
	}

	p.logger.Debug("message published",
		zap.String("topic", topic),
		zap.Int32("partition", partition),
		zap.Int64("offset", offset),
	)

	return nil
}

// PublishTelemetry publishes raw telemetry to the telemetry topic.
func (p *Producer) PublishTelemetry(deviceID, data string) error {
	return p.Publish("telemetry.raw", []byte(deviceID), []byte(data))
}

// Close shuts down the producer.
func (p *Producer) Close() error {
	return p.producer.Close()
}
