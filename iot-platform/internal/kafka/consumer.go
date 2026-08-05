package kafka

import (
	"fmt"

	"github.com/IBM/sarama"
	"go.uber.org/zap"
)

// ConsumerGroup wraps Sarama consumer group for IoT event consumption.
type ConsumerGroup struct {
	group  sarama.ConsumerGroup
	logger *zap.Logger
}

// NewConsumer creates a new consumer group.
func NewConsumer(brokers []string, groupCfg ConsumerGroupConfig) (*ConsumerGroup, error) {
	config := sarama.NewConfig()
	config.Consumer.Group.ID = groupCfg.GroupID
	config.Consumer.Return.Errors = true

	group, err := sarama.NewConsumerGroup(brokers, groupCfg.GroupID, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer group: %w", err)
	}

	return &ConsumerGroup{
		group:  group,
		logger: zap.L(),
	}, nil
}

// DeviceEventHandler handles device lifecycle events from Kafka.
type DeviceEventHandler struct {
	logger *zap.Logger
}

func (h *DeviceEventHandler) Setup(s sarama.Session) error {
	h.logger.Info("device event handler setup")
	return nil
}

func (h *DeviceEventHandler) Cleanup(s sarama.Session) error {
	h.logger.Info("device event handler cleanup")
	return nil
}

func (h *DeviceEventHandler) ConsumeClaim(session sarama.Session, claim sarama.ConsumerGroupClaim) error {
	for message := range claim.Messages() {
		h.logger.Info("received device event",
			zap.String("topic", message.Topic),
			zap.String("key", string(message.Key)),
			zap.Int("payload_size", len(message.Value)),
		)

		// TODO: Process device event (register, update, offline)
		session.MarkMessage(message, "")
	}
	return nil
}

// Start begins consuming from all subscribed topics.
func (c *ConsumerGroup) Start(handler sarama.ConsumerGroupHandler) error {
	ctx := fmt.Sprintf("consumer-group-%s", "iot-platform")
	for {
		if err := c.group.Consume(ctx, []string{"devices.events"}, handler); err != nil {
			c.logger.Error("error from consumer", zap.Error(err))
			return err
		}
	}
}

// Close shuts down the consumer group.
func (c *ConsumerGroup) Close() error {
	return c.group.Close()
}
