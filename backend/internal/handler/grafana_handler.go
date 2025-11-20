package handler

import (
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type GrafanaHandler struct {
	integrationService *service.IntegrationService
	cache              *service.CacheService
	log                *logger.Logger
}

func NewGrafanaHandler(integrationSvc *service.IntegrationService, cache *service.CacheService, log *logger.Logger) *GrafanaHandler {
	return &GrafanaHandler{
		integrationService: integrationSvc,
		cache:              cache,
		log:                log,
	}
}

func (h *GrafanaHandler) getService() (*service.GrafanaService, error) {
	config, err := h.integrationService.GetGrafanaConfig()
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}
	return service.NewGrafanaService(*config, h.log), nil
}

func (h *GrafanaHandler) GetStats(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	stats := svc.GetStats()
	c.JSON(http.StatusOK, stats)
}

func (h *GrafanaHandler) GetHealth(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	health, err := svc.GetHealth()
	if err != nil {
		h.log.Errorw("Failed to get Grafana health", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, health)
}

func (h *GrafanaHandler) SearchDashboards(c *gin.Context) {
	query := c.Query("query")
	tags := c.QueryArray("tag")

	// Build cache key based on search params
	cacheKey := service.BuildKey("grafana:dashboards", query)

	// Try cache first
	if h.cache != nil {
		var cachedData map[string]interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedData); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedData)
			return
		}
	}

	// Cache MISS
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	dashboards, err := svc.SearchDashboards(query, tags)
	if err != nil {
		h.log.Errorw("Failed to search dashboards", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	result := gin.H{
		"dashboards": dashboards,
		"total":      len(dashboards),
	}

	// Store in cache (5 minutes TTL)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, result, service.CacheDuration5Minutes); err != nil {
			h.log.Warnw("Failed to cache Grafana dashboards", "error", err)
		}
	}

	c.JSON(http.StatusOK, result)
}

func (h *GrafanaHandler) GetDashboardByUID(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	uid := c.Param("uid")

	dashboard, err := svc.GetDashboardByUID(uid)
	if err != nil {
		h.log.Errorw("Failed to get dashboard", "error", err, "uid", uid)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dashboard)
}

func (h *GrafanaHandler) GetAlerts(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	state := c.Query("state")

	var alerts []interface{}
	var fetchErr error

	if state != "" {
		result, err := svc.GetAlertsByState(state)
		fetchErr = err
		for _, alert := range result {
			alerts = append(alerts, alert)
		}
	} else {
		result, err := svc.GetAlerts()
		fetchErr = err
		for _, alert := range result {
			alerts = append(alerts, alert)
		}
	}

	if fetchErr != nil {
		h.log.Errorw("Failed to get alerts", "error", fetchErr)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fetchErr.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"total":  len(alerts),
	})
}

func (h *GrafanaHandler) GetDataSources(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	datasources, err := svc.GetDataSources()
	if err != nil {
		h.log.Errorw("Failed to get data sources", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"datasources": datasources,
		"total":       len(datasources),
	})
}

func (h *GrafanaHandler) GetDataSourceByID(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid data source ID",
		})
		return
	}

	datasource, err := svc.GetDataSourceByID(id)
	if err != nil {
		h.log.Errorw("Failed to get data source", "error", err, "id", id)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, datasource)
}

func (h *GrafanaHandler) GetOrganizations(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	orgs, err := svc.GetOrganizations()
	if err != nil {
		h.log.Errorw("Failed to get organizations", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"organizations": orgs,
		"total":         len(orgs),
	})
}

func (h *GrafanaHandler) GetCurrentOrganization(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	org, err := svc.GetCurrentOrganization()
	if err != nil {
		h.log.Errorw("Failed to get current organization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, org)
}

func (h *GrafanaHandler) GetUsers(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	users, err := svc.GetUsers()
	if err != nil {
		h.log.Errorw("Failed to get users", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

func (h *GrafanaHandler) GetFolders(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	folders, err := svc.GetFolders()
	if err != nil {
		h.log.Errorw("Failed to get folders", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"folders": folders,
		"total":   len(folders),
	})
}

func (h *GrafanaHandler) GetFolderByUID(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	uid := c.Param("uid")

	folder, err := svc.GetFolderByUID(uid)
	if err != nil {
		h.log.Errorw("Failed to get folder", "error", err, "uid", uid)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, folder)
}

func (h *GrafanaHandler) GetAnnotations(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get Grafana service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Grafana service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	dashboardID, _ := strconv.Atoi(c.Query("dashboardId"))
	from, _ := strconv.ParseInt(c.Query("from"), 10, 64)
	to, _ := strconv.ParseInt(c.Query("to"), 10, 64)
	tags := c.QueryArray("tag")

	annotations, err := svc.GetAnnotations(dashboardID, from, to, tags)
	if err != nil {
		h.log.Errorw("Failed to get annotations", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"annotations": annotations,
		"total":       len(annotations),
	})
}

func (h *GrafanaHandler) GetConfig(c *gin.Context) {
	config, err := h.integrationService.GetGrafanaConfig()
	if err != nil {
		h.log.Errorw("Failed to get Grafana config", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Grafana configuration",
		})
		return
	}

	if config == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Grafana integration not configured",
		})
		return
	}

	// Return only the URL, not the API key for security
	c.JSON(http.StatusOK, gin.H{
		"url": config.URL,
	})
}
