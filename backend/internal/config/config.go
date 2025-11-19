package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment string
	Port        string
	Version     string

	DatabaseURL string
	RedisURL    string
	RedisHost   string
	RedisPort   string
	RedisPass   string
	RedisDB     string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8060"),
		Version:     getEnv("VERSION", "0.1.0"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", ""),
		RedisHost:   getEnv("REDIS_HOST", ""),
		RedisPort:   getEnv("REDIS_PORT", ""),
		RedisPass:   getEnv("REDIS_PASSWORD", ""),
		RedisDB:     getEnv("REDIS_DB", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
