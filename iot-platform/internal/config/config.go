package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
type Config struct {
	Server   ServerConfig
	Kafka    KafkaConfig
	HBase    HBaseConfig
	Redis    RedisConfig
	Database DatabaseConfig
}

type ServerConfig struct {
	Port int
	Host string
}

type KafkaConfig struct {
	Brokers     []string
	Consumers   ConsumerGroupConfig
	Topics      TopicConfig
}

type ConsumerGroupConfig struct {
	GroupID string
	Devices string
}

type TopicConfig struct {
	Telemetry  string
	Devices    string
	Commands   string
}

type HBaseConfig struct {
	Host        string
	TablePrefix string
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

type DatabaseConfig struct {
	DSN string
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	_ = godotenv.Load()

	return &Config{
		Server: ServerConfig{
			Port: envInt("SERVER_PORT", 8080),
			Host: envString("SERVER_HOST", "0.0.0.0"),
		},
		Kafka: KafkaConfig{
			Brokers: envStringSlice("KAFKA_BROKERS", []string{"localhost:9092"}),
			Consumers: ConsumerGroupConfig{
				GroupID: envString("KAFKA_CONSUMER_GROUP", "iot-platform"),
				Devices: envString("KAFKA_TOPIC_DEVICES", "devices.events"),
			},
			Topics: TopicConfig{
				Telemetry: envString("KAFKA_TOPIC_TELEMETRY", "telemetry.raw"),
				Devices:   envString("KAFKA_TOPIC_DEVICES", "devices.events"),
				Commands:  envString("KAFKA_TOPIC_COMMANDS", "commands.uplink"),
			},
		},
		HBase: HBaseConfig{
			Host:        envString("HBASE_HOST", "localhost:2181"),
			TablePrefix: envString("HBASE_TABLE_PREFIX", "iot"),
		},
		Redis: RedisConfig{
			Addr: envString("REDIS_ADDR", "localhost:6379"),
		},
	}, nil
}

func envString(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func envStringSlice(key string, fallback []string) []string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return []string{v}
}
