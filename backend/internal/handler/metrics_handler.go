package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type MetricsHandler struct {
	service *service.MetricsService
	log     *logger.Logger
}

func NewMetricsHandler(svc *service.MetricsService, log *logger.Logger) *MetricsHandler {
	return &MetricsHandler{
		service: svc,
		log:     log,
	}
}

func (h *MetricsHandler) GetDashboard(c *gin.Context) {
	metrics := h.service.GetDashboardMetrics()

	c.JSON(http.StatusOK, metrics)
}

func (h *MetricsHandler) GetDORA(c *gin.Context) {
	dora := h.service.GetDORAMetrics()

	c.JSON(http.StatusOK, dora)
}
