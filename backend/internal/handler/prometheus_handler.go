package handler

import (
	"time"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type PrometheusHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewPrometheusHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *PrometheusHandler {
	return &PrometheusHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: svc,
	}
}

func (h *PrometheusHandler) GetStats(c *gin.Context) {
	cacheKey := service.BuildKey("prometheus", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		prometheusService, err := h.integrationService.GetPrometheusService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Prometheus integration not configured")
		}

		stats, err := prometheusService.GetStats()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get Prometheus stats", err)
		}

		return stats, nil
	})
}

func (h *PrometheusHandler) Query(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	query := c.Query("query")
	if query == "" {
		h.BadRequest(c, "Query parameter is required")
		return
	}

	var timestamp *time.Time
	timeStr := c.Query("time")
	if timeStr != "" {
		t, err := time.Parse(time.RFC3339, timeStr)
		if err != nil {
			h.BadRequest(c, "Invalid time format, use RFC3339")
			return
		}
		timestamp = &t
	}

	result, err := prometheusService.Query(query, timestamp)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to execute Prometheus query", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) QueryRange(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	query := c.Query("query")
	if query == "" {
		h.BadRequest(c, "Query parameter is required")
		return
	}

	startStr := c.Query("start")
	endStr := c.Query("end")
	step := c.Query("step")

	if startStr == "" || endStr == "" || step == "" {
		h.BadRequest(c, "start, end, and step parameters are required")
		return
	}

	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		h.BadRequest(c, "Invalid start time format, use RFC3339")
		return
	}

	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		h.BadRequest(c, "Invalid end time format, use RFC3339")
		return
	}

	result, err := prometheusService.QueryRange(query, start, end, step)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to execute Prometheus range query", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetTargets(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	result, err := prometheusService.GetTargets()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus targets", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetAlerts(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	result, err := prometheusService.GetAlerts()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus alerts", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetRules(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	result, err := prometheusService.GetRules()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus rules", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetLabelValues(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	labelName := c.Param("label")
	if labelName == "" {
		h.BadRequest(c, "Label name is required")
		return
	}

	result, err := prometheusService.GetLabelValues(labelName)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus label values", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetSeries(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	matches := c.QueryArray("match[]")
	if len(matches) == 0 {
		h.BadRequest(c, "At least one match[] parameter is required")
		return
	}

	var start, end *time.Time
	startStr := c.Query("start")
	if startStr != "" {
		t, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			h.BadRequest(c, "Invalid start time format, use RFC3339")
			return
		}
		start = &t
	}

	endStr := c.Query("end")
	if endStr != "" {
		t, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			h.BadRequest(c, "Invalid end time format, use RFC3339")
			return
		}
		end = &t
	}

	result, err := prometheusService.GetSeries(matches, start, end)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus series", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetMetadata(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	metric := c.Query("metric")

	result, err := prometheusService.GetMetadata(metric)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus metadata", err))
		return
	}

	h.Success(c, result)
}

func (h *PrometheusHandler) GetBuildInfo(c *gin.Context) {
	prometheusService, err := h.integrationService.GetPrometheusService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Prometheus integration not configured"))
		return
	}

	result, err := prometheusService.GetBuildInfo()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Prometheus build info", err))
		return
	}

	h.Success(c, result)
}
