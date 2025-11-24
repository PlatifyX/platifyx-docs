package handler

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type SonarQubeHandler struct {
	integrationService *service.IntegrationService
	cache              *service.CacheService
	log                *logger.Logger
}

func NewSonarQubeHandler(integrationService *service.IntegrationService, cache *service.CacheService, log *logger.Logger) *SonarQubeHandler {
	return &SonarQubeHandler{
		integrationService: integrationService,
		cache:              cache,
		log:                log,
	}
}

func (h *SonarQubeHandler) getService(organizationUUID string) (*service.SonarQubeService, error) {
	config, err := h.integrationService.GetSonarQubeConfig(organizationUUID)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}
	return service.NewSonarQubeService(*config, h.log), nil
}

func (h *SonarQubeHandler) ListProjects(c *gin.Context) {
	// Get filter parameters
	filterIntegration := c.Query("integration")

	// Build cache key
	cacheKey := service.BuildKey("sonarqube:projects", filterIntegration)

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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	configs, err := h.integrationService.GetAllSonarQubeConfigs(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get SonarQube configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No SonarQube integrations configured",
		})
		return
	}

	h.log.Infow("Fetching projects from all integrations", "integrationCount", len(configs))

	var allProjects []domain.SonarProject
	for integrationName, config := range configs {
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		h.log.Infow("Fetching projects from integration", "integration", integrationName, "url", config.URL)
		svc := service.NewSonarQubeService(*config, h.log)
		projects, err := svc.GetProjects()
		if err != nil {
			h.log.Errorw("Failed to fetch projects from integration", "integration", integrationName, "error", err)
			continue
		}

		h.log.Infow("Fetched projects from integration", "integration", integrationName, "count", len(projects))

		// Mark each project with the integration name
		for i := range projects {
			projects[i].Integration = integrationName
		}

		allProjects = append(allProjects, projects...)
	}

	h.log.Infow("Total projects fetched from all integrations", "total", len(allProjects))

	// Sort projects by name alphabetically
	sort.Slice(allProjects, func(i, j int) bool {
		return allProjects[i].Name < allProjects[j].Name
	})

	result := gin.H{
		"projects": allProjects,
		"total":    len(allProjects),
	}

	// Store in cache (15 minutes TTL)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, result, service.CacheDuration15Minutes); err != nil {
			h.log.Warnw("Failed to cache SonarQube projects", "error", err)
		}
	}

	c.JSON(http.StatusOK, result)
}

func (h *SonarQubeHandler) GetProjectDetails(c *gin.Context) {
	projectKey := c.Param("key")
	integrationName := c.Query("integration")

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	configs, err := h.integrationService.GetAllSonarQubeConfigs(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get SonarQube configurations",
		})
		return
	}

	config, ok := configs[integrationName]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	svc := service.NewSonarQubeService(*config, h.log)
	details, err := svc.GetProjectMeasures(projectKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project details",
		})
		return
	}

	details.Integration = integrationName
	c.JSON(http.StatusOK, details)
}

func (h *SonarQubeHandler) ListIssues(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	}

	// Get filter parameters
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")
	filterSeverity := c.Query("severity")
	filterType := c.Query("type")

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	configs, err := h.integrationService.GetAllSonarQubeConfigs(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get SonarQube configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No SonarQube integrations configured",
		})
		return
	}

	h.log.Infow("Fetching issues from all integrations", "integrationCount", len(configs))

	var severities []string
	if filterSeverity != "" {
		severities = strings.Split(filterSeverity, ",")
	}

	var types []string
	if filterType != "" {
		types = strings.Split(filterType, ",")
	}

	var allIssues []domain.SonarIssue
	for integrationName, config := range configs {
		// Skip if integration filter is set and doesn't match
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		h.log.Infow("Fetching issues from integration", "integration", integrationName)
		svc := service.NewSonarQubeService(*config, h.log)
		issues, err := svc.GetIssues(filterProject, severities, types, limit)
		if err != nil {
			h.log.Errorw("Failed to fetch issues from integration", "integration", integrationName, "error", err)
			continue
		}

		h.log.Infow("Fetched issues from integration", "integration", integrationName, "count", len(issues))

		// Mark each issue with the integration name
		for i := range issues {
			issues[i].Integration = integrationName
		}

		allIssues = append(allIssues, issues...)
	}

	// Sort issues by creation date (most recent first)
	sort.Slice(allIssues, func(i, j int) bool {
		return allIssues[i].CreationDate.After(allIssues[j].CreationDate)
	})

	c.JSON(http.StatusOK, gin.H{
		"issues": allIssues,
		"total":  len(allIssues),
	})
}

func (h *SonarQubeHandler) GetStats(c *gin.Context) {
	// Get filter parameters
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	configs, err := h.integrationService.GetAllSonarQubeConfigs(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get SonarQube configurations",
		})
		return
	}
	if len(configs) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No SonarQube integrations configured",
		})
		return
	}

	// Fetch projects and their measures
	var allProjects []domain.SonarProject
	var allDetails []*domain.SonarProjectDetails

	for integrationName, config := range configs {
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewSonarQubeService(*config, h.log)
		projects, err := svc.GetProjects()
		if err != nil {
			continue
		}

		for i := range projects {
			projects[i].Integration = integrationName

			// Filter by project if specified
			if filterProject != "" && projects[i].Key != filterProject {
				continue
			}

			allProjects = append(allProjects, projects[i])

			// Get detailed measures for each project
			details, err := svc.GetProjectMeasures(projects[i].Key)
			if err == nil {
				details.Integration = integrationName
				allDetails = append(allDetails, details)
			}
		}
	}

	// Calculate aggregated metrics
	totalBugs := 0
	totalVulnerabilities := 0
	totalCodeSmells := 0
	totalSecurityHotspots := 0
	totalLines := 0
	var totalCoverage float64
	var totalDuplications float64
	passedQualityGates := 0
	failedQualityGates := 0
	coverageProjectCount := 0
	duplicationsProjectCount := 0

	for _, details := range allDetails {
		totalBugs += details.Bugs
		totalVulnerabilities += details.Vulnerabilities
		totalCodeSmells += details.CodeSmells
		totalSecurityHotspots += details.SecurityHotspots
		totalLines += details.Lines

		if details.Coverage > 0 {
			totalCoverage += details.Coverage
			coverageProjectCount++
		}
		if details.Duplications >= 0 {
			totalDuplications += details.Duplications
			duplicationsProjectCount++
		}

		if details.QualityGateStatus == "OK" {
			passedQualityGates++
		} else if details.QualityGateStatus == "ERROR" {
			failedQualityGates++
		}
	}

	avgCoverage := 0.0
	if coverageProjectCount > 0 {
		avgCoverage = totalCoverage / float64(coverageProjectCount)
	}

	avgDuplications := 0.0
	if duplicationsProjectCount > 0 {
		avgDuplications = totalDuplications / float64(duplicationsProjectCount)
	}

	qualityGatePassRate := 0.0
	totalQualityGates := passedQualityGates + failedQualityGates
	if totalQualityGates > 0 {
		qualityGatePassRate = float64(passedQualityGates) / float64(totalQualityGates) * 100
	}

	stats := map[string]interface{}{
		"totalProjects":         len(allProjects),
		"totalBugs":             totalBugs,
		"totalVulnerabilities":  totalVulnerabilities,
		"totalCodeSmells":       totalCodeSmells,
		"totalSecurityHotspots": totalSecurityHotspots,
		"totalLines":            totalLines,
		"avgCoverage":           avgCoverage,
		"avgDuplications":       avgDuplications,
		"passedQualityGates":    passedQualityGates,
		"failedQualityGates":    failedQualityGates,
		"qualityGatePassRate":   qualityGatePassRate,
	}

	c.JSON(http.StatusOK, stats)
}
