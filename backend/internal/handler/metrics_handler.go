package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type MetricsHandler struct {
	*base.BaseHandler
	metricsService *service.MetricsService
}

func NewMetricsHandler(
	svc *service.MetricsService,
	cache *service.CacheService,
	log *logger.Logger,
) *MetricsHandler {
	return &MetricsHandler{
		BaseHandler:    base.NewBaseHandler(cache, log),
		metricsService: svc,
	}
}

func (h *MetricsHandler) GetDashboard(c *gin.Context) {
	cacheKey := service.BuildKey("metrics", "dashboard")

	h.WithCache(c, cacheKey, service.CacheDuration1Minute, func() (interface{}, error) {
		return h.metricsService.GetDashboardMetrics(), nil
	})
}

func (h *MetricsHandler) GetDORA(c *gin.Context) {
	cacheKey := service.BuildKey("metrics", "dora")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		return h.metricsService.GetDORAMetrics(), nil
	})
}
