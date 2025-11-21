package handler

import (
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type GrafanaHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewGrafanaHandler(
	integrationSvc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *GrafanaHandler {
	return &GrafanaHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: integrationSvc,
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
	return service.NewGrafanaService(*config, h.GetLogger()), nil
}

func (h *GrafanaHandler) GetStats(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	stats := svc.GetStats()
	h.Success(c, stats)
}

func (h *GrafanaHandler) GetHealth(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	health, err := svc.GetHealth()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana health", err))
		return
	}

	h.Success(c, health)
}

func (h *GrafanaHandler) SearchDashboards(c *gin.Context) {
	query := c.Query("query")
	tags := c.QueryArray("tag")

	// Build cache key based on search params
	cacheKey := service.BuildKey("grafana:dashboards", query)

	// Use WithCache helper for consistent caching
	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		svc, err := h.getService()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get Grafana service", err)
		}
		if svc == nil {
			return nil, httperr.ServiceUnavailable("Grafana integration not configured")
		}

		dashboards, err := svc.SearchDashboards(query, tags)
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to search dashboards", err)
		}

		return map[string]interface{}{
			"dashboards": dashboards,
			"total":      len(dashboards),
		}, nil
	})
}

func (h *GrafanaHandler) GetDashboardByUID(c *gin.Context) {
	uid := c.Param("uid")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	dashboard, err := svc.GetDashboardByUID(uid)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get dashboard", err))
		return
	}

	h.Success(c, dashboard)
}

func (h *GrafanaHandler) GetAlerts(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
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
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get alerts", fetchErr))
		return
	}

	h.Success(c, map[string]interface{}{
		"alerts": alerts,
		"total":  len(alerts),
	})
}

func (h *GrafanaHandler) GetDataSources(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	datasources, err := svc.GetDataSources()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get data sources", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"datasources": datasources,
		"total":       len(datasources),
	})
}

func (h *GrafanaHandler) GetDataSourceByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		h.BadRequest(c, "Invalid data source ID")
		return
	}

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	datasource, err := svc.GetDataSourceByID(id)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get data source", err))
		return
	}

	h.Success(c, datasource)
}

func (h *GrafanaHandler) GetOrganizations(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	orgs, err := svc.GetOrganizations()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get organizations", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"organizations": orgs,
		"total":         len(orgs),
	})
}

func (h *GrafanaHandler) GetCurrentOrganization(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	org, err := svc.GetCurrentOrganization()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get current organization", err))
		return
	}

	h.Success(c, org)
}

func (h *GrafanaHandler) GetUsers(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	users, err := svc.GetUsers()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get users", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"users": users,
		"total": len(users),
	})
}

func (h *GrafanaHandler) GetFolders(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	folders, err := svc.GetFolders()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get folders", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"folders": folders,
		"total":   len(folders),
	})
}

func (h *GrafanaHandler) GetFolderByUID(c *gin.Context) {
	uid := c.Param("uid")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	folder, err := svc.GetFolderByUID(uid)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get folder", err))
		return
	}

	h.Success(c, folder)
}

func (h *GrafanaHandler) GetAnnotations(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana service", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	dashboardID, _ := strconv.Atoi(c.Query("dashboardId"))
	from, _ := strconv.ParseInt(c.Query("from"), 10, 64)
	to, _ := strconv.ParseInt(c.Query("to"), 10, 64)
	tags := c.QueryArray("tag")

	annotations, err := svc.GetAnnotations(dashboardID, from, to, tags)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get annotations", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"annotations": annotations,
		"total":       len(annotations),
	})
}

func (h *GrafanaHandler) GetConfig(c *gin.Context) {
	config, err := h.integrationService.GetGrafanaConfig()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Grafana config", err))
		return
	}
	if config == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Grafana integration not configured"))
		return
	}

	// Return only the URL, not the API key for security
	h.Success(c, map[string]string{
		"url": config.URL,
	})
}
