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

	AzureDevOpsOrganization string
	AzureDevOpsProject      string
	AzureDevOpsPAT          string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Environment:             getEnv("ENVIRONMENT", "development"),
		Port:                    getEnv("PORT", "6000"),
		Version:                 getEnv("VERSION", "0.1.0"),
		DatabaseURL:             getEnv("DATABASE_URL", ""),
		RedisURL:                getEnv("REDIS_URL", ""),
		AzureDevOpsOrganization: getEnv("AZURE_DEVOPS_ORGANIZATION", ""),
		AzureDevOpsProject:      getEnv("AZURE_DEVOPS_PROJECT", ""),
		AzureDevOpsPAT:          getEnv("AZURE_DEVOPS_PAT", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
