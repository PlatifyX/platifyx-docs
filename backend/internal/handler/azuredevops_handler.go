package handler

import (
	"net/http"
	"sort"
	"strconv"
	"time"

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
	// Get filter parameters
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")

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
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

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

	// Apply additional filters
	filteredPipelines := make([]domain.Pipeline, 0)
	for _, pipeline := range allPipelines {
		// Filter by project
		if filterProject != "" && pipeline.Project != filterProject {
			continue
		}

		filteredPipelines = append(filteredPipelines, pipeline)
	}

	h.log.Infow("Total pipelines after filtering", "total", len(filteredPipelines))

	// Sort pipelines by name alphabetically
	sort.Slice(filteredPipelines, func(i, j int) bool {
		return filteredPipelines[i].Name < filteredPipelines[j].Name
	})

	c.JSON(http.StatusOK, gin.H{
		"pipelines": filteredPipelines,
		"total":     len(filteredPipelines),
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

	// Get filter parameters
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")
	filterStartDate := c.Query("startDate")
	filterEndDate := c.Query("endDate")

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
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

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

	// Apply additional filters
	filteredBuilds := make([]domain.Build, 0)
	for _, build := range allBuilds {
		// Exclude cancelled builds
		if build.Result == "canceled" || build.Result == "cancelled" {
			continue
		}

		// Filter by project
		if filterProject != "" && build.Project != filterProject {
			continue
		}

		// Filter by date range
		if filterStartDate != "" {
			startDate, err := time.Parse("2006-01-02", filterStartDate)
			if err == nil && build.FinishTime.Before(startDate) {
				continue
			}
		}
		if filterEndDate != "" {
			endDate, err := time.Parse("2006-01-02", filterEndDate)
			if err == nil {
				// Add one day to endDate to include the entire day
				endDate = endDate.Add(24 * time.Hour)
				if build.FinishTime.After(endDate) {
					continue
				}
			}
		}

		filteredBuilds = append(filteredBuilds, build)
	}

	h.log.Infow("Total builds after filtering", "total", len(filteredBuilds))

	// Sort builds by finish time (most recent first)
	sort.Slice(filteredBuilds, func(i, j int) bool {
		return filteredBuilds[i].FinishTime.After(filteredBuilds[j].FinishTime)
	})

	c.JSON(http.StatusOK, gin.H{
		"builds": filteredBuilds,
		"total":  len(filteredBuilds),
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

	// Get filter parameters
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")
	filterStartDate := c.Query("startDate")
	filterEndDate := c.Query("endDate")

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
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

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

	// Apply additional filters
	filteredReleases := make([]domain.Release, 0)
	for _, release := range allReleases {
		// Exclude abandoned (cancelled) releases
		if release.Status == "abandoned" {
			continue
		}

		// Filter by project
		if filterProject != "" && release.Project != filterProject {
			continue
		}

		// Filter by date range
		if filterStartDate != "" {
			startDate, err := time.Parse("2006-01-02", filterStartDate)
			if err == nil && release.CreatedOn.Before(startDate) {
				continue
			}
		}
		if filterEndDate != "" {
			endDate, err := time.Parse("2006-01-02", filterEndDate)
			if err == nil {
				// Add one day to endDate to include the entire day
				endDate = endDate.Add(24 * time.Hour)
				if release.CreatedOn.After(endDate) {
					continue
				}
			}
		}

		filteredReleases = append(filteredReleases, release)
	}

	h.log.Infow("Total releases after filtering", "total", len(filteredReleases))

	// Sort releases by created date (most recent first)
	sort.Slice(filteredReleases, func(i, j int) bool {
		return filteredReleases[i].CreatedOn.After(filteredReleases[j].CreatedOn)
	})

	c.JSON(http.StatusOK, gin.H{
		"releases": filteredReleases,
		"total":    len(filteredReleases),
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
	// Get filter parameters (same as ListBuilds)
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")
	filterStartDate := c.Query("startDate")
	filterEndDate := c.Query("endDate")

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

	// Fetch pipelines with filters
	var allPipelines []domain.Pipeline
	for integrationName, config := range configs {
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewAzureDevOpsService(*config, h.log)
		pipelines, err := svc.GetPipelines()
		if err != nil {
			continue
		}

		for i := range pipelines {
			pipelines[i].Integration = integrationName
		}

		allPipelines = append(allPipelines, pipelines...)
	}

	// Filter pipelines by project
	filteredPipelines := make([]domain.Pipeline, 0)
	for _, pipeline := range allPipelines {
		if filterProject != "" && pipeline.Project != filterProject {
			continue
		}
		filteredPipelines = append(filteredPipelines, pipeline)
	}

	// Fetch builds with filters
	var allBuilds []domain.Build
	for integrationName, config := range configs {
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewAzureDevOpsService(*config, h.log)
		builds, err := svc.GetBuilds(200)
		if err != nil {
			continue
		}

		for i := range builds {
			builds[i].Integration = integrationName
		}

		allBuilds = append(allBuilds, builds...)
	}

	// Fetch releases with filters
	var allReleases []domain.Release
	for integrationName, config := range configs {
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewAzureDevOpsService(*config, h.log)
		releases, err := svc.GetReleases(100)
		if err != nil {
			continue
		}

		for i := range releases {
			releases[i].Integration = integrationName
		}

		allReleases = append(allReleases, releases...)
	}

	// Filter builds (exclude cancelled)
	filteredBuilds := make([]domain.Build, 0)
	for _, build := range allBuilds {
		// IMPORTANT: Exclude cancelled builds
		if build.Result == "canceled" || build.Result == "cancelled" {
			continue
		}

		if filterProject != "" && build.Project != filterProject {
			continue
		}

		if filterStartDate != "" {
			startDate, err := time.Parse("2006-01-02", filterStartDate)
			if err == nil && build.FinishTime.Before(startDate) {
				continue
			}
		}
		if filterEndDate != "" {
			endDate, err := time.Parse("2006-01-02", filterEndDate)
			if err == nil {
				endDate = endDate.Add(24 * time.Hour)
				if build.FinishTime.After(endDate) {
					continue
				}
			}
		}

		filteredBuilds = append(filteredBuilds, build)
	}

	// Filter releases (exclude cancelled)
	filteredReleases := make([]domain.Release, 0)
	for _, release := range allReleases {
		// Exclude cancelled releases
		if release.Status == "abandoned" {
			continue
		}

		if filterProject != "" && release.Project != filterProject {
			continue
		}

		if filterStartDate != "" {
			startDate, err := time.Parse("2006-01-02", filterStartDate)
			if err == nil && release.CreatedOn.Before(startDate) {
				continue
			}
		}
		if filterEndDate != "" {
			endDate, err := time.Parse("2006-01-02", filterEndDate)
			if err == nil {
				endDate = endDate.Add(24 * time.Hour)
				if release.CreatedOn.After(endDate) {
					continue
				}
			}
		}

		filteredReleases = append(filteredReleases, release)
	}

	// Calculate build stats
	successCount := 0
	failedCount := 0
	runningCount := 0
	totalDuration := 0.0
	validDurationCount := 0

	for _, build := range filteredBuilds {
		switch build.Result {
		case "succeeded":
			successCount++
		case "failed":
			failedCount++
		case "":
			if build.Status == "inProgress" {
				runningCount++
			}
		}

		// Calculate duration in seconds
		if !build.StartTime.IsZero() && !build.FinishTime.IsZero() {
			duration := build.FinishTime.Sub(build.StartTime).Seconds()
			if duration > 0 {
				totalDuration += duration
				validDurationCount++
			}
		}
	}

	successRate := 0.0
	if len(filteredBuilds) > 0 {
		successRate = float64(successCount) / float64(len(filteredBuilds)) * 100
	}

	avgPipelineTime := 0.0
	if validDurationCount > 0 {
		avgPipelineTime = totalDuration / float64(validDurationCount)
	}

	// Calculate deploy frequency (deploys per month)
	deployFrequency := 0.0
	if len(filteredReleases) > 0 {
		var minDate, maxDate time.Time
		for i, release := range filteredReleases {
			if i == 0 || release.CreatedOn.Before(minDate) {
				minDate = release.CreatedOn
			}
			if i == 0 || release.CreatedOn.After(maxDate) {
				maxDate = release.CreatedOn
			}
		}
		// Calculate months difference
		monthsDiff := maxDate.Sub(minDate).Hours() / 24 / 30.0
		if monthsDiff >= 1.0 {
			deployFrequency = float64(len(filteredReleases)) / monthsDiff
		} else if len(filteredReleases) > 0 {
			// If less than a month, show total releases as monthly projection
			deployFrequency = float64(len(filteredReleases))
		}
	}

	// Calculate deploy failure rate (based on failed builds)
	deployFailureRate := 0.0
	if len(filteredBuilds) > 0 {
		deployFailureRate = float64(failedCount) / float64(len(filteredBuilds)) * 100
	}

	stats := map[string]interface{}{
		"totalPipelines":     len(filteredPipelines),
		"totalBuilds":        len(filteredBuilds),
		"successCount":       successCount,
		"failedCount":        failedCount,
		"runningCount":       runningCount,
		"successRate":        successRate,
		"avgPipelineTime":    avgPipelineTime,
		"deployFrequency":    deployFrequency,
		"deployFailureRate":  deployFailureRate,
	}

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

// ListRepositories lists all repositories from Azure DevOps
func (h *AzureDevOpsHandler) ListRepositories(c *gin.Context) {
	filterIntegration := c.Query("integration")

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No Azure DevOps integrations configured",
		})
		return
	}

	h.log.Infow("Fetching repositories from all integrations", "integrationCount", len(configs), "filter", filterIntegration)

	var allRepositories []map[string]interface{}
	for integrationName, config := range configs {
		h.log.Infow("Processing integration", "integration", integrationName, "filter", filterIntegration, "willSkip", filterIntegration != "" && integrationName != filterIntegration)

		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			h.log.Infow("Skipping integration (filter mismatch)", "integration", integrationName, "filter", filterIntegration)
			continue
		}

		h.log.Infow("Fetching repositories from integration", "integration", integrationName, "organization", config.Organization, "project", config.Project)
		svc := service.NewAzureDevOpsServiceWithCache(*config, h.integrationService.GetCacheService().GetRedisClient(), h.log)
		repos, err := svc.GetRepositories()
		if err != nil {
			h.log.Errorw("Failed to fetch repositories from integration", "integration", integrationName, "error", err)
			continue
		}

		h.log.Infow("Fetched repositories from integration", "integration", integrationName, "count", len(repos))

		// Convert to a format compatible with frontend
		for _, repo := range repos {
			allRepositories = append(allRepositories, map[string]interface{}{
				"id":          repo.ID,
				"name":        repo.Name,
				"full_name":   repo.Project.Name + "/" + repo.Name,
				"description": "",
				"html_url":    repo.WebURL,
				"private":     false, // Azure DevOps repos visibility would need additional API call
				"fork":        false,
				"created_at":  "",
				"updated_at":  "",
				"pushed_at":   "",
				"size":        repo.Size,
				"stargazers_count": 0,
				"watchers_count":   0,
				"language":         "",
				"forks_count":      0,
				"open_issues_count": 0,
				"default_branch":    repo.DefaultBranch,
				"owner": map[string]interface{}{
					"login":      repo.Project.Name,
					"avatar_url": "",
				},
				"integration": integrationName,
			})
		}
	}

	h.log.Infow("Total repositories", "total", len(allRepositories))

	c.JSON(http.StatusOK, gin.H{
		"repositories": allRepositories,
		"total":        len(allRepositories),
	})
}

// GetRepositoriesStats returns statistics about repositories
func (h *AzureDevOpsHandler) GetRepositoriesStats(c *gin.Context) {
	filterIntegration := c.Query("integration")

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get Azure DevOps configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No Azure DevOps integrations configured",
		})
		return
	}

	totalRepos := 0
	totalSize := 0

	for integrationName, config := range configs {
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewAzureDevOpsService(*config, h.log)
		stats, err := svc.GetRepositoriesStats()
		if err != nil {
			h.log.Errorw("Failed to fetch repository stats from integration", "integration", integrationName, "error", err)
			continue
		}

		if count, ok := stats["totalRepositories"].(int); ok {
			totalRepos += count
		}
		if size, ok := stats["totalSize"].(int); ok {
			totalSize += size
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"totalRepositories": totalRepos,
		"totalSize":         totalSize,
		"totalStars":        0,
		"totalForks":        0,
		"totalOpenIssues":   0,
		"publicRepos":       0,
		"privateRepos":      0,
	})
}
