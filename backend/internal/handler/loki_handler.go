package handler

import (
	"strconv"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type LokiHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewLokiHandler(
	integrationSvc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *LokiHandler {
	return &LokiHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: integrationSvc,
	}
}

// GetLabels returns all label names from Loki
func (h *LokiHandler) GetLabels(c *gin.Context) {
	cacheKey := service.BuildKey("loki", "labels")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		lokiService, err := h.integrationService.GetLokiService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Loki integration not configured")
		}

		labels, err := lokiService.GetLabels()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to fetch labels from Loki", err)
		}

		return map[string]interface{}{
			"labels": labels,
			"total":  len(labels),
		}, nil
	})
}

// GetLabelValues returns all values for a specific label
func (h *LokiHandler) GetLabelValues(c *gin.Context) {
	label := c.Param("label")

	cacheKey := service.BuildKey("loki", "label:"+label)

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		lokiService, err := h.integrationService.GetLokiService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Loki integration not configured")
		}

		values, err := lokiService.GetLabelValues(label)
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to fetch label values from Loki", err)
		}

		return map[string]interface{}{
			"label":  label,
			"values": values,
			"total":  len(values),
		}, nil
	})
}

// GetAppLabels returns all values for the 'app' label
func (h *LokiHandler) GetAppLabels(c *gin.Context) {
	cacheKey := service.BuildKey("loki", "app:labels")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		lokiService, err := h.integrationService.GetLokiService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Loki integration not configured")
		}

		apps, err := lokiService.GetAppLabels()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to fetch app labels from Loki", err)
		}

		return map[string]interface{}{
			"apps":  apps,
			"total": len(apps),
		}, nil
	})
}

// QueryLogs queries Loki for logs
func (h *LokiHandler) QueryLogs(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		h.BadRequest(c, "query parameter is required")
		return
	}

	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	}

	lokiService, err := h.integrationService.GetLokiService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Loki integration not configured"))
		return
	}

	// Check if we have start/end for range query
	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr != "" && endStr != "" {
		// Parse timestamps
		start, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			h.BadRequest(c, "invalid start timestamp format (use RFC3339)")
			return
		}

		end, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			h.BadRequest(c, "invalid end timestamp format (use RFC3339)")
			return
		}

		result, err := lokiService.QueryRange(query, start, end, limit)
		if err != nil {
			h.HandleError(c, httperr.InternalErrorWrap("Failed to query Loki", err))
			return
		}

		h.Success(c, result)
	} else {
		// Instant query
		result, err := lokiService.Query(query, limit)
		if err != nil {
			h.HandleError(c, httperr.InternalErrorWrap("Failed to query Loki", err))
			return
		}

		h.Success(c, result)
	}
}

// GetLogsForApp retrieves recent logs for a specific app
func (h *LokiHandler) GetLogsForApp(c *gin.Context) {
	app := c.Param("app")

	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	}

	durationStr := c.DefaultQuery("duration", "1h")
	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		duration = 1 * time.Hour
	}

	lokiService, err := h.integrationService.GetLokiService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Loki integration not configured"))
		return
	}

	result, err := lokiService.GetLogsForApp(app, limit, duration)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to fetch logs for app", err))
		return
	}

	h.Success(c, result)
}
