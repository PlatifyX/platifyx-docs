package handler

import (
	"net/http"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type PrometheusHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewPrometheusHandler(svc *service.IntegrationService, log *logger.Logger) *PrometheusHandler {
	return &PrometheusHandler{
		service: svc,
		log:     log,
	}
}

func (h *PrometheusHandler) GetStats(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	stats, err := prometheusService.GetStats()
	if err != nil {
		h.log.Errorw("Failed to get Prometheus stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *PrometheusHandler) Query(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Query parameter is required",
		})
		return
	}

	var timestamp *time.Time
	timeStr := c.Query("time")
	if timeStr != "" {
		t, err := time.Parse(time.RFC3339, timeStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid time format, use RFC3339",
			})
			return
		}
		timestamp = &t
	}

	result, err := prometheusService.Query(query, timestamp)
	if err != nil {
		h.log.Errorw("Failed to execute Prometheus query", "error", err, "query", query)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) QueryRange(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Query parameter is required",
		})
		return
	}

	startStr := c.Query("start")
	endStr := c.Query("end")
	step := c.Query("step")

	if startStr == "" || endStr == "" || step == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "start, end, and step parameters are required",
		})
		return
	}

	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid start time format, use RFC3339",
		})
		return
	}

	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid end time format, use RFC3339",
		})
		return
	}

	result, err := prometheusService.QueryRange(query, start, end, step)
	if err != nil {
		h.log.Errorw("Failed to execute Prometheus range query", "error", err, "query", query)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetTargets(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	result, err := prometheusService.GetTargets()
	if err != nil {
		h.log.Errorw("Failed to get Prometheus targets", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetAlerts(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	result, err := prometheusService.GetAlerts()
	if err != nil {
		h.log.Errorw("Failed to get Prometheus alerts", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetRules(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	result, err := prometheusService.GetRules()
	if err != nil {
		h.log.Errorw("Failed to get Prometheus rules", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetLabelValues(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	labelName := c.Param("label")
	if labelName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Label name is required",
		})
		return
	}

	result, err := prometheusService.GetLabelValues(labelName)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus label values", "error", err, "label", labelName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetSeries(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	matches := c.QueryArray("match[]")
	if len(matches) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "At least one match[] parameter is required",
		})
		return
	}

	var start, end *time.Time
	startStr := c.Query("start")
	if startStr != "" {
		t, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid start time format, use RFC3339",
			})
			return
		}
		start = &t
	}

	endStr := c.Query("end")
	if endStr != "" {
		t, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid end time format, use RFC3339",
			})
			return
		}
		end = &t
	}

	result, err := prometheusService.GetSeries(matches, start, end)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus series", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetMetadata(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	metric := c.Query("metric")

	result, err := prometheusService.GetMetadata(metric)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus metadata", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PrometheusHandler) GetBuildInfo(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	prometheusService, err := h.service.GetPrometheusService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Prometheus service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Prometheus integration not configured",
		})
		return
	}

	result, err := prometheusService.GetBuildInfo()
	if err != nil {
		h.log.Errorw("Failed to get Prometheus build info", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
