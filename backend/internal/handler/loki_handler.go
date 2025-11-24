package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type LokiHandler struct {
	integrationService *service.IntegrationService
	log                *logger.Logger
}

func NewLokiHandler(integrationSvc *service.IntegrationService, log *logger.Logger) *LokiHandler {
	return &LokiHandler{
		integrationService: integrationSvc,
		log:                log,
	}
}

// GetLabels returns all label names from Loki
func (h *LokiHandler) GetLabels(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	lokiService, err := h.integrationService.GetLokiService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Loki service", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Loki integration not configured",
		})
		return
	}

	labels, err := lokiService.GetLabels()
	if err != nil {
		h.log.Errorw("Failed to fetch labels", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch labels from Loki",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"labels": labels,
		"total":  len(labels),
	})
}

// GetLabelValues returns all values for a specific label
func (h *LokiHandler) GetLabelValues(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	label := c.Param("label")

	lokiService, err := h.integrationService.GetLokiService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Loki service", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Loki integration not configured",
		})
		return
	}

	values, err := lokiService.GetLabelValues(label)
	if err != nil {
		h.log.Errorw("Failed to fetch label values", "error", err, "label", label)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch label values from Loki",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"label":  label,
		"values": values,
		"total":  len(values),
	})
}

// GetAppLabels returns all values for the 'app' label
func (h *LokiHandler) GetAppLabels(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	lokiService, err := h.integrationService.GetLokiService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Loki service", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Loki integration not configured",
		})
		return
	}

	apps, err := lokiService.GetAppLabels()
	if err != nil {
		h.log.Errorw("Failed to fetch app labels", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch app labels from Loki",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"apps":  apps,
		"total": len(apps),
	})
}

// QueryLogs queries Loki for logs
func (h *LokiHandler) QueryLogs(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "query parameter is required",
		})
		return
	}

	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	}

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	lokiService, err := h.integrationService.GetLokiService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Loki service", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Loki integration not configured",
		})
		return
	}

	// Check if we have start/end for range query
	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr != "" && endStr != "" {
		// Parse timestamps
		start, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid start timestamp format (use RFC3339)",
			})
			return
		}

		end, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid end timestamp format (use RFC3339)",
			})
			return
		}

		result, err := lokiService.QueryRange(query, start, end, limit)
		if err != nil {
			h.log.Errorw("Failed to query Loki", "error", err, "query", query)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to query Loki",
			})
			return
		}

		c.JSON(http.StatusOK, result)
	} else {
		// Instant query
		result, err := lokiService.Query(query, limit)
		if err != nil {
			h.log.Errorw("Failed to query Loki", "error", err, "query", query)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to query Loki",
			})
			return
		}

		c.JSON(http.StatusOK, result)
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

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	lokiService, err := h.integrationService.GetLokiService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Loki service", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Loki integration not configured",
		})
		return
	}

	result, err := lokiService.GetLogsForApp(app, limit, duration)
	if err != nil {
		h.log.Errorw("Failed to fetch logs for app", "error", err, "app", app)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch logs for app",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
