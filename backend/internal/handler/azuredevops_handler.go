package handler

import (
	"sort"
	"strconv"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AzureDevOpsHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewAzureDevOpsHandler(
	integrationService *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *AzureDevOpsHandler {
	return &AzureDevOpsHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: integrationService,
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
	return service.NewAzureDevOpsService(*config, h.GetLogger()), nil
}

func (h *AzureDevOpsHandler) ListPipelines(c *gin.Context) {
	// Get filter parameters
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}
	if len(configs) == 0 {
		h.HandleError(c, httperr.ServiceUnavailable("No Azure DevOps integrations configured"))
		return
	}

	h.GetLogger().Infow("Fetching pipelines from all integrations", "integrationCount", len(configs))

	var allPipelines []domain.Pipeline
	for integrationName, config := range configs {
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		h.GetLogger().Infow("Fetching pipelines from integration", "integration", integrationName, "organization", config.Organization)
		svc := service.NewAzureDevOpsService(*config, h.GetLogger())
		pipelines, err := svc.GetPipelines()
		if err != nil {
			h.GetLogger().Errorw("Failed to fetch pipelines from integration", "integration", integrationName, "error", err)
			continue
		}

		h.GetLogger().Infow("Fetched pipelines from integration", "integration", integrationName, "count", len(pipelines))

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

	h.GetLogger().Infow("Total pipelines after filtering", "total", len(filteredPipelines))

	// Sort pipelines by name alphabetically
	sort.Slice(filteredPipelines, func(i, j int) bool {
		return filteredPipelines[i].Name < filteredPipelines[j].Name
	})

	h.Success(c, map[string]interface{}{
		"pipelines": filteredPipelines,
		"total":     len(filteredPipelines),
	})
}

func (h *AzureDevOpsHandler) ListPipelineRuns(c *gin.Context) {
	pipelineIDStr := c.Param("id")
	pipelineID, err := strconv.Atoi(pipelineIDStr)
	if err != nil {
		h.BadRequest(c, "Invalid pipeline ID")
		return
	}

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configuration", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Azure DevOps integration not configured"))
		return
	}

	runs, err := svc.GetPipelineRuns(pipelineID)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to fetch pipeline runs", err))
		return
	}

	h.Success(c, map[string]interface{}{
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
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}
	if len(configs) == 0 {
		h.HandleError(c, httperr.ServiceUnavailable("No Azure DevOps integrations configured"))
		return
	}

	h.GetLogger().Infow("Fetching builds from all integrations", "integrationCount", len(configs))

	var allBuilds []domain.Build
	for integrationName, config := range configs {
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		h.GetLogger().Infow("Fetching builds from integration", "integration", integrationName, "organization", config.Organization)
		svc := service.NewAzureDevOpsService(*config, h.GetLogger())
		builds, err := svc.GetBuilds(limit)
		if err != nil {
			h.GetLogger().Errorw("Failed to fetch builds from integration", "integration", integrationName, "error", err)
			continue
		}

		h.GetLogger().Infow("Fetched builds from integration", "integration", integrationName, "count", len(builds))

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

	h.GetLogger().Infow("Total builds after filtering", "total", len(filteredBuilds))

	// Sort builds by finish time (most recent first)
	sort.Slice(filteredBuilds, func(i, j int) bool {
		return filteredBuilds[i].FinishTime.After(filteredBuilds[j].FinishTime)
	})

	h.Success(c, map[string]interface{}{
		"builds": filteredBuilds,
		"total":  len(filteredBuilds),
	})
}

func (h *AzureDevOpsHandler) GetBuild(c *gin.Context) {
	buildIDStr := c.Param("id")
	buildID, err := strconv.Atoi(buildIDStr)
	if err != nil {
		h.BadRequest(c, "Invalid build ID")
		return
	}

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configuration", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Azure DevOps integration not configured"))
		return
	}

	build, err := svc.GetBuildByID(buildID)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to fetch build", err))
		return
	}

	h.Success(c, build)
}

func (h *AzureDevOpsHandler) GetBuildLogs(c *gin.Context) {
	buildIDStr := c.Param("id")
	buildID, err := strconv.Atoi(buildIDStr)
	if err != nil {
		h.BadRequest(c, "Invalid build ID")
		return
	}

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configuration", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Azure DevOps integration not configured"))
		return
	}

	logs, err := svc.GetBuildLogs(buildID)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to fetch build logs", err))
		return
	}

	h.Success(c, map[string]interface{}{
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
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}
	if len(configs) == 0 {
		h.HandleError(c, httperr.ServiceUnavailable("No Azure DevOps integrations configured"))
		return
	}

	h.GetLogger().Infow("Fetching releases from all integrations", "integrationCount", len(configs))

	var allReleases []domain.Release
	for integrationName, config := range configs {
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		h.GetLogger().Infow("Fetching releases from integration", "integration", integrationName, "organization", config.Organization)
		svc := service.NewAzureDevOpsService(*config, h.GetLogger())
		releases, err := svc.GetReleases(limit)
		if err != nil {
			h.GetLogger().Errorw("Failed to fetch releases from integration", "integration", integrationName, "error", err)
			continue
		}

		h.GetLogger().Infow("Fetched releases from integration", "integration", integrationName, "count", len(releases))

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

	h.GetLogger().Infow("Total releases after filtering", "total", len(filteredReleases))

	// Sort releases by created date (most recent first)
	sort.Slice(filteredReleases, func(i, j int) bool {
		return filteredReleases[i].CreatedOn.After(filteredReleases[j].CreatedOn)
	})

	h.Success(c, map[string]interface{}{
		"releases": filteredReleases,
		"total":    len(filteredReleases),
	})
}

func (h *AzureDevOpsHandler) GetRelease(c *gin.Context) {
	releaseIDStr := c.Param("id")
	releaseID, err := strconv.Atoi(releaseIDStr)
	if err != nil {
		h.BadRequest(c, "Invalid release ID")
		return
	}

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configuration", err))
		return
	}
	if svc == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Azure DevOps integration not configured"))
		return
	}

	release, err := svc.GetReleaseByID(releaseID)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to fetch release", err))
		return
	}

	h.Success(c, release)
}

func (h *AzureDevOpsHandler) GetStats(c *gin.Context) {
	// Get filter parameters (same as ListBuilds)
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")
	filterStartDate := c.Query("startDate")
	filterEndDate := c.Query("endDate")

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}
	if len(configs) == 0 {
		h.HandleError(c, httperr.ServiceUnavailable("No Azure DevOps integrations configured"))
		return
	}

	// Fetch pipelines with filters
	var allPipelines []domain.Pipeline
	for integrationName, config := range configs {
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewAzureDevOpsService(*config, h.GetLogger())
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

		svc := service.NewAzureDevOpsService(*config, h.GetLogger())
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

		svc := service.NewAzureDevOpsService(*config, h.GetLogger())
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

	h.Success(c, map[string]interface{}{
		"totalPipelines":     len(filteredPipelines),
		"totalBuilds":        len(filteredBuilds),
		"successCount":       successCount,
		"failedCount":        failedCount,
		"runningCount":       runningCount,
		"successRate":        successRate,
		"avgPipelineTime":    avgPipelineTime,
		"deployFrequency":    deployFrequency,
		"deployFailureRate":  deployFailureRate,
	})
}

func (h *AzureDevOpsHandler) QueueBuild(c *gin.Context) {
	var req struct {
		IntegrationName string `json:"integrationName" binding:"required"`
		Project         string `json:"project" binding:"required"`
		DefinitionID    int    `json:"definitionId" binding:"required"`
		SourceBranch    string `json:"sourceBranch" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}

	config, ok := configs[req.IntegrationName]
	if !ok {
		h.NotFound(c, "Integration not found")
		return
	}

	svc := service.NewAzureDevOpsService(*config, h.GetLogger())
	build, err := svc.QueueBuild(req.Project, req.DefinitionID, req.SourceBranch)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to queue build", err))
		return
	}

	h.Created(c, build)
}

func (h *AzureDevOpsHandler) ApproveRelease(c *gin.Context) {
	var req struct {
		IntegrationName string `json:"integrationName" binding:"required"`
		Project         string `json:"project" binding:"required"`
		ApprovalID      int    `json:"approvalId" binding:"required"`
		Comments        string `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}

	config, ok := configs[req.IntegrationName]
	if !ok {
		h.NotFound(c, "Integration not found")
		return
	}

	svc := service.NewAzureDevOpsService(*config, h.GetLogger())
	err = svc.ApproveRelease(req.Project, req.ApprovalID, req.Comments)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to approve release", err))
		return
	}

	h.Success(c, map[string]string{
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
		h.BadRequest(c, "Invalid request body")
		return
	}

	configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Azure DevOps configurations", err))
		return
	}

	config, ok := configs[req.IntegrationName]
	if !ok {
		h.NotFound(c, "Integration not found")
		return
	}

	svc := service.NewAzureDevOpsService(*config, h.GetLogger())
	err = svc.RejectRelease(req.Project, req.ApprovalID, req.Comments)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to reject release", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Release rejected successfully",
	})
}
