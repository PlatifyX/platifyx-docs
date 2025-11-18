package handler

import (
	"net/http"
	"strconv"

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

	pipelines, err := svc.GetPipelines()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch pipelines",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pipelines": pipelines,
		"total":     len(pipelines),
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

	builds, err := svc.GetBuilds(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch builds",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"builds": builds,
		"total":  len(builds),
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

	releases, err := svc.GetReleases(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch releases",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"releases": releases,
		"total":    len(releases),
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
