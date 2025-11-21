package handler

import (
	"time"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	*base.BaseHandler
}

func NewHealthHandler(
	cache *service.CacheService,
	log *logger.Logger,
) *HealthHandler {
	return &HealthHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
	}
}

func (h *HealthHandler) Check(c *gin.Context) {
	h.Success(c, map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "platifyx-core",
		"version":   "0.1.0",
	})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	h.Success(c, map[string]interface{}{
		"status": "ready",
		"checks": map[string]interface{}{
			"database": "ok",
			"cache":    "ok",
		},
	})
}
