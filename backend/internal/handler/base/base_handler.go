package base

import (
	"time"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/response"
	"github.com/gin-gonic/gin"
)

// BaseHandler fornece funcionalidades comuns para todos os handlers
type BaseHandler struct {
	cache *service.CacheService
	log   *logger.Logger
}

// NewBaseHandler cria uma nova instância de BaseHandler
func NewBaseHandler(cache *service.CacheService, log *logger.Logger) *BaseHandler {
	return &BaseHandler{
		cache: cache,
		log:   log,
	}
}

// GetCache retorna o serviço de cache
func (h *BaseHandler) GetCache() *service.CacheService {
	return h.cache
}

// GetLogger retorna o logger
func (h *BaseHandler) GetLogger() *logger.Logger {
	return h.log
}

// WithCache executa uma função com suporte a cache
// Se o cache estiver disponível e tiver um valor, retorna do cache
// Caso contrário, executa a função fn e armazena o resultado no cache
func (h *BaseHandler) WithCache(c *gin.Context, cacheKey string, ttl time.Duration, fn func() (interface{}, error)) {
	// Try cache first
	if h.cache != nil {
		var cachedData interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedData); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			response.Success(c, cachedData)
			return
		}
		h.log.Debugw("Cache MISS", "key", cacheKey)
	}

	// Cache MISS or not available - execute function
	data, err := fn()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	// Store in cache
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, data, ttl); err != nil {
			h.log.Warnw("Failed to cache data", "key", cacheKey, "error", err)
		}
	}

	response.Success(c, data)
}

// HandleError trata um erro e retorna a resposta HTTP apropriada
func (h *BaseHandler) HandleError(c *gin.Context, err error) {
	if httpErr, ok := httperr.AsHTTPError(err); ok {
		// É um HTTPError - usar informações estruturadas
		h.log.Errorw("HTTP error",
			"code", httpErr.Code,
			"message", httpErr.Message,
			"status", httpErr.StatusCode,
			"error", httpErr.Err,
		)

		if httpErr.Details != "" {
			response.ErrorWithDetails(c, httpErr.StatusCode, httpErr.Code, httpErr.Message, httpErr.Details)
		} else {
			response.Error(c, httpErr.StatusCode, httpErr.Code, httpErr.Message)
		}
		return
	}

	// Erro genérico - tratar como internal error
	h.log.Errorw("Internal error", "error", err)
	response.InternalError(c, err.Error())
}

// Success é um helper para respostas de sucesso
func (h *BaseHandler) Success(c *gin.Context, data interface{}) {
	response.Success(c, data)
}

// SuccessWithMeta é um helper para respostas de sucesso com metadados
func (h *BaseHandler) SuccessWithMeta(c *gin.Context, data interface{}, meta *response.Meta) {
	response.SuccessWithMeta(c, data, meta)
}

// Created é um helper para respostas 201
func (h *BaseHandler) Created(c *gin.Context, data interface{}) {
	response.Created(c, data)
}

// NoContent é um helper para respostas 204
func (h *BaseHandler) NoContent(c *gin.Context) {
	response.NoContent(c)
}

// BadRequest é um helper para erros 400
func (h *BaseHandler) BadRequest(c *gin.Context, message string) {
	h.log.Warnw("Bad request", "message", message)
	response.BadRequest(c, message)
}

// NotFound é um helper para erros 404
func (h *BaseHandler) NotFound(c *gin.Context, message string) {
	h.log.Warnw("Not found", "message", message)
	response.NotFound(c, message)
}

// InternalError é um helper para erros 500
func (h *BaseHandler) InternalError(c *gin.Context, message string) {
	h.log.Errorw("Internal error", "message", message)
	response.InternalError(c, message)
}

// ServiceUnavailable é um helper para erros 503
func (h *BaseHandler) ServiceUnavailable(c *gin.Context, message string) {
	h.log.Warnw("Service unavailable", "message", message)
	response.ServiceUnavailable(c, message)
}
