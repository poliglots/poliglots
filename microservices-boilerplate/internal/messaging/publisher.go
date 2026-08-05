package messaging

import (
	"fmt"
	"time"

	"github.com/IBM/sarama"
	"go.uber.org/zap"
)

// Publisher handles publishing events to message brokers.
type Publisher struct {
	producer sarama.SyncProducer
	logger   *zap.Logger
}

// NewPublisher creates a new Kafka publisher.
func NewPublisher(brokers []string, logger *zap.Logger) (*Publisher, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Return.Successes = true

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create producer: %w", err)
	}

	return &Publisher{
		producer: producer,
		logger:   logger,
	}, nil
}

// PublishEvent publishes a structured event to a topic.
func (p *Publisher) PublishEvent(topic string, key, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic:     topic,
		Key:       sarama.StringEncoder(key),
		Value:     sarama.StringEncoder(value),
		Timestamp: time.Now(),
	}

	partition, offset, err := p.producer.SendMessage(msg)
	if err != nil {
		p.logger.Error("publish failed",
			zap.String("topic", topic),
			zap.Error(err),
		)
		return fmt.Errorf("publish failed: %w", err)
	}

	p.logger.Debug("event published",
		zap.String("topic", topic),
		zap.Int32("partition", partition),
		zap.Int64("offset", offset),
	)

	return nil
}

// Close shuts down the publisher.
func (p *Publisher) Close() error {
	return p.producer.Close()
}
