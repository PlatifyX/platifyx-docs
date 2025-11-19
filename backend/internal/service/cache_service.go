package service

import (
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type CacheService struct {
	redis *cache.RedisClient
	log   *logger.Logger
}

func NewCacheService(config domain.RedisConfig, log *logger.Logger) (*CacheService, error) {
	redisClient, err := cache.NewRedisClient(config)
	if err != nil {
		return nil, err
	}

	return &CacheService{
		redis: redisClient,
		log:   log,
	}, nil
}

// Get retrieves a value from cache
func (s *CacheService) Get(key string) (string, error) {
	s.log.Debugw("Cache GET", "key", key)
	return s.redis.Get(key)
}

// Set stores a value in cache with expiration
func (s *CacheService) Set(key string, value interface{}, expiration time.Duration) error {
	s.log.Debugw("Cache SET", "key", key, "expiration", expiration)
	return s.redis.Set(key, value, expiration)
}

// GetJSON retrieves and unmarshals JSON data from cache
func (s *CacheService) GetJSON(key string, dest interface{}) error {
	s.log.Debugw("Cache GET JSON", "key", key)
	return s.redis.GetJSON(key, dest)
}

// Delete removes a key from cache
func (s *CacheService) Delete(key string) error {
	s.log.Debugw("Cache DELETE", "key", key)
	return s.redis.Delete(key)
}

// Exists checks if a key exists
func (s *CacheService) Exists(key string) (bool, error) {
	return s.redis.Exists(key)
}

// FlushAll clears all keys from cache
func (s *CacheService) FlushAll() error {
	s.log.Warn("Flushing all cache keys")
	return s.redis.FlushAll()
}

// TestConnection tests if Redis is reachable
func (s *CacheService) TestConnection() error {
	s.log.Info("Testing Redis connection")
	err := s.redis.TestConnection()
	if err != nil {
		s.log.Errorw("Redis connection test failed", "error", err)
		return err
	}
	s.log.Info("Redis connection test successful")
	return nil
}

// Close closes the Redis connection
func (s *CacheService) Close() error {
	return s.redis.Close()
}

// BuildKey creates a cache key with a namespace
func BuildKey(namespace, key string) string {
	return fmt.Sprintf("%s:%s", namespace, key)
}

// Common cache durations
const (
	CacheDuration1Minute  = 1 * time.Minute
	CacheDuration5Minutes = 5 * time.Minute
	CacheDuration15Minutes = 15 * time.Minute
	CacheDuration30Minutes = 30 * time.Minute
	CacheDuration1Hour    = 1 * time.Hour
	CacheDuration24Hours  = 24 * time.Hour
)
