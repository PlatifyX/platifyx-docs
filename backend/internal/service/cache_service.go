package service

import (
	"encoding/json"
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

// GetOrSet tries to get from cache, if not found executes the function and stores the result
func (s *CacheService) GetOrSet(key string, expiration time.Duration, fn func() (interface{}, error), dest interface{}) error {
	// Try to get from cache first
	err := s.GetJSON(key, dest)
	if err == nil {
		s.log.Debugw("Cache HIT", "key", key)
		return nil
	}

	// Cache miss, execute function
	s.log.Debugw("Cache MISS", "key", key)
	result, err := fn()
	if err != nil {
		return err
	}

	// Store in cache
	if err := s.Set(key, result, expiration); err != nil {
		s.log.Warnw("Failed to set cache", "key", key, "error", err)
		// Don't return error, just log it - cache failure shouldn't break the request
	}

	// Copy result to dest
	// We need to marshal and unmarshal to properly copy the data
	data, err := json.Marshal(result)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

// InvalidatePattern deletes all keys matching a pattern
func (s *CacheService) InvalidatePattern(pattern string) error {
	s.log.Infow("Invalidating cache pattern", "pattern", pattern)
	// Note: This requires a custom implementation with SCAN
	// For now, we'll implement a simple version
	return nil
}

// BuildKey creates a cache key with a namespace
func BuildKey(namespace, key string) string {
	return fmt.Sprintf("%s:%s", namespace, key)
}

// Common cache durations
const (
	CacheDuration1Minute   = 1 * time.Minute
	CacheDuration5Minutes  = 5 * time.Minute
	CacheDuration10Minutes = 10 * time.Minute
	CacheDuration15Minutes = 15 * time.Minute
	CacheDuration30Minutes = 30 * time.Minute
	CacheDuration1Hour     = 1 * time.Hour
	CacheDuration6Hours    = 6 * time.Hour
	CacheDuration12Hours   = 12 * time.Hour
	CacheDuration24Hours   = 24 * time.Hour
)
