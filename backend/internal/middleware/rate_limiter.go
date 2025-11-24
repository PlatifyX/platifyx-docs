package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/gin-gonic/gin"
)

// RateLimiterConfig define a configuração do rate limiter
type RateLimiterConfig struct {
	RequestsPerWindow int           // Número de requisições permitidas
	WindowDuration    time.Duration // Duração da janela de tempo
	Message           string        // Mensagem personalizada ao bloquear
}

// DefaultLoginRateLimiter retorna configuração padrão para endpoints de login
func DefaultLoginRateLimiter() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerWindow: 5,              // 5 tentativas
		WindowDuration:    1 * time.Minute, // por minuto
		Message:           "Too many login attempts. Please try again later.",
	}
}

// DevelopmentLoginRateLimiter retorna configuração mais permissiva para desenvolvimento
func DevelopmentLoginRateLimiter() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerWindow: 50,              // 50 tentativas
		WindowDuration:    1 * time.Minute, // por minuto
		Message:           "Too many login attempts. Please try again later.",
	}
}

// DefaultPasswordResetRateLimiter retorna configuração para reset de senha
func DefaultPasswordResetRateLimiter() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerWindow: 3,               // 3 tentativas
		WindowDuration:    5 * time.Minute, // a cada 5 minutos
		Message:           "Too many password reset requests. Please try again later.",
	}
}

// RateLimiter cria um middleware de rate limiting baseado em IP
func RateLimiter(cache *service.CacheService, config RateLimiterConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Se cache não estiver disponível, permite a requisição
		if cache == nil {
			c.Next()
			return
		}

		// Obter IP do cliente
		clientIP := c.ClientIP()

		// Criar chave única para o IP e endpoint
		key := fmt.Sprintf("ratelimit:%s:%s", c.FullPath(), clientIP)

		// Tentar obter contador atual do cache
		countStr, err := cache.Get(key)
		var count int
		if err != nil {
			// Primeira requisição nesta janela de tempo
			count = 0
		} else {
			count, _ = strconv.Atoi(countStr)
		}

		// Verificar se excedeu o limite
		if count >= config.RequestsPerWindow {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       config.Message,
				"retry_after": int(config.WindowDuration.Seconds()),
			})
			c.Abort()
			return
		}

		// Incrementar contador
		count++
		cache.Set(key, count, config.WindowDuration)

		// Adicionar headers informativos
		c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerWindow))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(config.RequestsPerWindow-count))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(config.WindowDuration).Unix(), 10))

		c.Next()
	}
}

// IPBasedRateLimiter cria um rate limiter simples baseado apenas em IP
// Útil para endpoints menos críticos
func IPBasedRateLimiter(cache *service.CacheService, requestsPerMinute int) gin.HandlerFunc {
	return RateLimiter(cache, RateLimiterConfig{
		RequestsPerWindow: requestsPerMinute,
		WindowDuration:    1 * time.Minute,
		Message:           "Too many requests. Please slow down.",
	})
}
