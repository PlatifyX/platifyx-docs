package handler

import (
	"net/http"
	"sort"
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

	h.log.Infow("Fetching pipelines from all integrations", "integrationCount", len(configs))

	var allPipelines []domain.Pipeline
	for integrationName, config := range configs {
		h.log.Infow("Fetching pipelines from integration", "integration", integrationName, "organization", config.Organization)
		svc := service.NewAzureDevOpsService(*config, h.log)
		pipelines, err := svc.GetPipelines()
		if err != nil {
			h.log.Errorw("Failed to fetch pipelines from integration", "integration", integrationName, "error", err)
			continue
		}

		h.log.Infow("Fetched pipelines from integration", "integration", integrationName, "count", len(pipelines))

		// Mark each pipeline with the integration name
		for i := range pipelines {
			pipelines[i].Integration = integrationName
		}

		allPipelines = append(allPipelines, pipelines...)
	}

	h.log.Infow("Total pipelines fetched from all integrations", "total", len(allPipelines))

	// Sort pipelines by name alphabetically
	sort.Slice(allPipelines, func(i, j int) bool {
		return allPipelines[i].Name < allPipelines[j].Name
	})

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

	h.log.Infow("Fetching builds from all integrations", "integrationCount", len(configs))

	var allBuilds []domain.Build
	for integrationName, config := range configs {
		h.log.Infow("Fetching builds from integration", "integration", integrationName, "organization", config.Organization)
		svc := service.NewAzureDevOpsService(*config, h.log)
		builds, err := svc.GetBuilds(limit)
		if err != nil {
			h.log.Errorw("Failed to fetch builds from integration", "integration", integrationName, "error", err)
			continue
		}

		h.log.Infow("Fetched builds from integration", "integration", integrationName, "count", len(builds))

		// Mark each build with the integration name
		for i := range builds {
			builds[i].Integration = integrationName
		}

		allBuilds = append(allBuilds, builds...)
	}

	h.log.Infow("Total builds fetched from all integrations", "total", len(allBuilds))

	// Sort builds by finish time (most recent first)
	sort.Slice(allBuilds, func(i, j int) bool {
		return allBuilds[i].FinishTime.After(allBuilds[j].FinishTime)
	})

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

	h.log.Infow("Fetching releases from all integrations", "integrationCount", len(configs))

	var allReleases []domain.Release
	for integrationName, config := range configs {
		h.log.Infow("Fetching releases from integration", "integration", integrationName, "organization", config.Organization)
		svc := service.NewAzureDevOpsService(*config, h.log)
		releases, err := svc.GetReleases(limit)
		if err != nil {
			h.log.Errorw("Failed to fetch releases from integration", "integration", integrationName, "error", err)
			continue
		}

		h.log.Infow("Fetched releases from integration", "integration", integrationName, "count", len(releases))

		// Mark each release with the integration name
		for i := range releases {
			releases[i].Integration = integrationName
		}

		allReleases = append(allReleases, releases...)
	}

	h.log.Infow("Total releases fetched from all integrations", "total", len(allReleases))

	// Sort releases by created date (most recent first)
	sort.Slice(allReleases, func(i, j int) bool {
		return allReleases[i].CreatedOn.After(allReleases[j].CreatedOn)
	})

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

func (h *AzureDevOpsHandler) QueueBuild(c *gin.Context) {
	var req struct {
		IntegrationName string `json:"integrationName" binding:"required"`
		Project         string `json:"project" binding:"required"`
		DefinitionID    int    `json:"definitionId" binding:"required"`
		SourceBranch    string `json:"sourceBranch" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}

	config, ok := configs[req.IntegrationName]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	svc := service.NewAzureDevOpsService(*config, h.log)
	build, err := svc.QueueBuild(req.Project, req.DefinitionID, req.SourceBranch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to queue build",
		})
		return
	}

	c.JSON(http.StatusCreated, build)
}

func (h *AzureDevOpsHandler) ApproveRelease(c *gin.Context) {
	var req struct {
		IntegrationName string `json:"integrationName" binding:"required"`
		Project         string `json:"project" binding:"required"`
		ApprovalID      int    `json:"approvalId" binding:"required"`
		Comments        string `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}

	config, ok := configs[req.IntegrationName]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	svc := service.NewAzureDevOpsService(*config, h.log)
	err = svc.ApproveRelease(req.Project, req.ApprovalID, req.Comments)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to approve release",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Release approved successfully",
	})
}

func (h *AzureDevOpsHandler) RejectRelease(c *gin.Context) {
	var req struct {
		IntegrationName string `json:"integrationName" binding:"required"`
		Project         string `json:"project" binding:"required"`
		ApprovalID      int    `json:"approvalId" binding:"required"`
		Comments        string `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}

	config, ok := configs[req.IntegrationName]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	svc := service.NewAzureDevOpsService(*config, h.log)
	err = svc.RejectRelease(req.Project, req.ApprovalID, req.Comments)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to reject release",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Release rejected successfully",
	})
}
