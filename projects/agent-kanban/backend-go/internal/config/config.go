package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration.
type Config struct {
	Port          string
	DBPath        string
	GitHubToken   string
	WebhookSecret string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Port:          envOrDefault("PORT", "8080"),
		DBPath:        envOrDefault("DB_PATH", "dev.db"),
		GitHubToken:   os.Getenv("GITHUB_TOKEN"),
		WebhookSecret: os.Getenv("WEBHOOK_SECRET"),
	}
}

func envOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func envIntOrDefault(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultVal
}

func (c *Config) String() string {
	return fmt.Sprintf("Config{Port:%s, DB:%s}", c.Port, c.DBPath)
}
