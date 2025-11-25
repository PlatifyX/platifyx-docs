package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Environment string
	Port        string
	Version     string

	// Database
	DatabaseURL string

	// Redis
	RedisEnabled bool
	RedisHost    string
	RedisPort    int
	RedisPass    string
	RedisDB      int

	// Cache
	CacheEnabled bool
	CacheTTL     int // seconds

	// CORS
	AllowedOrigins []string

	// Frontend
	FrontendURL string

	// External URLs (for documentation/reference)
	DocsBaseURL string

	// Authentication
	JWTSecret      string
	SessionTimeout int // seconds
}

func Load() *Config {
	godotenv.Load()

	// Parse CORS allowed origins
	allowedOrigins := getEnv("ALLOWED_ORIGINS", "https://app.platifyx.com,http://localhost:5173")
	origins := strings.Split(allowedOrigins, ",")

	return &Config{
		// Server
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8060"),
		Version:     getEnv("VERSION", "0.1.0"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", ""),

		// Redis
		RedisEnabled: getEnvBool("REDIS_ENABLED", true),
		RedisHost:    getEnv("REDIS_HOST", "localhost"),
		RedisPort:    getEnvInt("REDIS_PORT", 6379),
		RedisPass:    getEnv("REDIS_PASSWORD", ""),
		RedisDB:      getEnvInt("REDIS_DB", 0),

		// Cache
		CacheEnabled: getEnvBool("CACHE_ENABLED", true),
		CacheTTL:     getEnvInt("CACHE_TTL", 300), // 5 minutes default

		// CORS
		AllowedOrigins: origins,

		// Frontend
		FrontendURL: getEnv("FRONTEND_URL", "https://app.platifyx.com"),

		// External URLs
		DocsBaseURL: getEnv("DOCS_BASE_URL", ""),

		// Authentication
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		SessionTimeout: getEnvInt("SESSION_TIMEOUT", 86400), // 24 hours default
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
