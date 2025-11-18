package handler

import (
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AzureDevOpsHandler struct {
	integrationService *service.IntegrationService
	log                *logger.Logger
}

func NewAzureDevOpsHandler(integrationService *service.IntegrationService, log *logger.Logger) *AzureDevOpsHandler {
	return &AzureDevOpsHandler{
		integrationService: integrationService,
		log:                log,
	}
}

func (h *AzureDevOpsHandler) getService() (*service.AzureDevOpsService, error) {
	config, err := h.integrationService.GetAzureDevOpsConfig()
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}
	return service.NewAzureDevOpsService(*config, h.log), nil
}

func (h *AzureDevOpsHandler) ListPipelines(c *gin.Context) {
	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No Azure DevOps integrations configured",
		})
		return
	}

	var allPipelines []domain.Pipeline
	for integrationName, config := range configs {
		svc := service.NewAzureDevOpsService(*config, h.log)
		pipelines, err := svc.GetPipelines()
		if err != nil {
			h.log.Errorw("Failed to fetch pipelines from integration", "integration", integrationName, "error", err)
			continue
		}

		// Mark each pipeline with the integration name
		for i := range pipelines {
			pipelines[i].Integration = integrationName
		}

		allPipelines = append(allPipelines, pipelines...)
	}

	c.JSON(http.StatusOK, gin.H{
		"pipelines": allPipelines,
		"total":     len(allPipelines),
	})
}

func (h *AzureDevOpsHandler) ListPipelineRuns(c *gin.Context) {
	pipelineIDStr := c.Param("id")
	pipelineID, err := strconv.Atoi(pipelineIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid pipeline ID",
		})
		return
	}

	svc, err := h.getService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configuration",
		})
		return
	}
	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Azure DevOps integration not configured",
		})
		return
	}

	runs, err := svc.GetPipelineRuns(pipelineID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch pipeline runs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pipelineId": pipelineID,
		"runs":       runs,
		"total":      len(runs),
	})
}

func (h *AzureDevOpsHandler) ListBuilds(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No Azure DevOps integrations configured",
		})
		return
	}

	var allBuilds []domain.Build
	for integrationName, config := range configs {
		svc := service.NewAzureDevOpsService(*config, h.log)
		builds, err := svc.GetBuilds(limit)
		if err != nil {
			h.log.Errorw("Failed to fetch builds from integration", "integration", integrationName, "error", err)
			continue
		}

		// Mark each build with the integration name
		for i := range builds {
			builds[i].Integration = integrationName
		}

		allBuilds = append(allBuilds, builds...)
	}

	c.JSON(http.StatusOK, gin.H{
		"builds": allBuilds,
		"total":  len(allBuilds),
	})
}

func (h *AzureDevOpsHandler) GetBuild(c *gin.Context) {
	buildIDStr := c.Param("id")
	buildID, err := strconv.Atoi(buildIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid build ID",
		})
		return
	}

	svc, err := h.getService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configuration",
		})
		return
	}
	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Azure DevOps integration not configured",
		})
		return
	}

	build, err := svc.GetBuildByID(buildID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch build",
		})
		return
	}

	c.JSON(http.StatusOK, build)
}

func (h *AzureDevOpsHandler) GetBuildLogs(c *gin.Context) {
	buildIDStr := c.Param("id")
	buildID, err := strconv.Atoi(buildIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid build ID",
		})
		return
	}

	svc, err := h.getService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configuration",
		})
		return
	}
	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Azure DevOps integration not configured",
		})
		return
	}

	logs, err := svc.GetBuildLogs(buildID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch build logs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
	})
}

func (h *AzureDevOpsHandler) ListReleases(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No Azure DevOps integrations configured",
		})
		return
	}

	var allReleases []domain.Release
	for integrationName, config := range configs {
		svc := service.NewAzureDevOpsService(*config, h.log)
		releases, err := svc.GetReleases(limit)
		if err != nil {
			h.log.Errorw("Failed to fetch releases from integration", "integration", integrationName, "error", err)
			continue
		}

		// Mark each release with the integration name
		for i := range releases {
			releases[i].Integration = integrationName
		}

		allReleases = append(allReleases, releases...)
	}

	c.JSON(http.StatusOK, gin.H{
		"releases": allReleases,
		"total":    len(allReleases),
	})
}

func (h *AzureDevOpsHandler) GetRelease(c *gin.Context) {
	releaseIDStr := c.Param("id")
	releaseID, err := strconv.Atoi(releaseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid release ID",
		})
		return
	}

	svc, err := h.getService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configuration",
		})
		return
	}
	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Azure DevOps integration not configured",
		})
		return
	}

	release, err := svc.GetReleaseByID(releaseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch release",
		})
		return
	}

	c.JSON(http.StatusOK, release)
}

func (h *AzureDevOpsHandler) GetStats(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configuration",
		})
		return
	}
	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Azure DevOps integration not configured",
		})
		return
	}

	stats := svc.GetPipelineStats()
	c.JSON(http.StatusOK, stats)
}
