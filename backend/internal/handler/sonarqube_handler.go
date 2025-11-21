package handler

import (
	"sort"
	"strconv"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type SonarQubeHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewSonarQubeHandler(
	integrationService *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *SonarQubeHandler {
	return &SonarQubeHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: integrationService,
	}
}

func (h *SonarQubeHandler) ListProjects(c *gin.Context) {
	filterIntegration := c.Query("integration")
	cacheKey := service.BuildKey("sonarqube:projects", filterIntegration)

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		configs, err := h.integrationService.GetAllSonarQubeConfigs()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get SonarQube configurations", err)
		}
		if len(configs) == 0 {
			return nil, httperr.ServiceUnavailable("No SonarQube integrations configured")
		}

		h.GetLogger().Infow("Fetching projects from all integrations", "integrationCount", len(configs))

		var allProjects []domain.SonarProject
		for integrationName, config := range configs {
			if filterIntegration != "" && integrationName != filterIntegration {
				continue
			}

			h.GetLogger().Infow("Fetching projects from integration", "integration", integrationName, "url", config.URL)
			svc := service.NewSonarQubeService(*config, h.GetLogger())
			projects, err := svc.GetProjects()
			if err != nil {
				h.GetLogger().Errorw("Failed to fetch projects from integration", "integration", integrationName, "error", err)
				continue
			}

			h.GetLogger().Infow("Fetched projects from integration", "integration", integrationName, "count", len(projects))

			for i := range projects {
				projects[i].Integration = integrationName
			}

			allProjects = append(allProjects, projects...)
		}

		h.GetLogger().Infow("Total projects fetched from all integrations", "total", len(allProjects))

		sort.Slice(allProjects, func(i, j int) bool {
			return allProjects[i].Name < allProjects[j].Name
		})

		return map[string]interface{}{
			"projects": allProjects,
			"total":    len(allProjects),
		}, nil
	})
}

func (h *SonarQubeHandler) GetProjectDetails(c *gin.Context) {
	projectKey := c.Param("key")
	integrationName := c.Query("integration")

	configs, err := h.integrationService.GetAllSonarQubeConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get SonarQube configurations", err))
		return
	}

	config, ok := configs[integrationName]
	if !ok {
		h.NotFound(c, "Integration not found")
		return
	}

	svc := service.NewSonarQubeService(*config, h.GetLogger())
	details, err := svc.GetProjectMeasures(projectKey)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to fetch project details", err))
		return
	}

	details.Integration = integrationName
	h.Success(c, details)
}

func (h *SonarQubeHandler) ListIssues(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	}

	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")
	filterSeverity := c.Query("severity")
	filterType := c.Query("type")

	configs, err := h.integrationService.GetAllSonarQubeConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get SonarQube configurations", err))
		return
	}
	if len(configs) == 0 {
		h.HandleError(c, httperr.ServiceUnavailable("No SonarQube integrations configured"))
		return
	}

	h.GetLogger().Infow("Fetching issues from all integrations", "integrationCount", len(configs))

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
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		h.GetLogger().Infow("Fetching issues from integration", "integration", integrationName)
		svc := service.NewSonarQubeService(*config, h.GetLogger())
		issues, err := svc.GetIssues(filterProject, severities, types, limit)
		if err != nil {
			h.GetLogger().Errorw("Failed to fetch issues from integration", "integration", integrationName, "error", err)
			continue
		}

		h.GetLogger().Infow("Fetched issues from integration", "integration", integrationName, "count", len(issues))

		for i := range issues {
			issues[i].Integration = integrationName
		}

		allIssues = append(allIssues, issues...)
	}

	sort.Slice(allIssues, func(i, j int) bool {
		return allIssues[i].CreationDate.After(allIssues[j].CreationDate)
	})

	h.Success(c, map[string]interface{}{
		"issues": allIssues,
		"total":  len(allIssues),
	})
}

func (h *SonarQubeHandler) GetStats(c *gin.Context) {
	filterIntegration := c.Query("integration")
	filterProject := c.Query("project")

	configs, err := h.integrationService.GetAllSonarQubeConfigs()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get SonarQube configurations", err))
		return
	}
	if len(configs) == 0 {
		h.HandleError(c, httperr.ServiceUnavailable("No SonarQube integrations configured"))
		return
	}

	var allProjects []domain.SonarProject
	var allDetails []*domain.SonarProjectDetails

	for integrationName, config := range configs {
		if filterIntegration != "" && integrationName != filterIntegration {
			continue
		}

		svc := service.NewSonarQubeService(*config, h.GetLogger())
		projects, err := svc.GetProjects()
		if err != nil {
			continue
		}

		for i := range projects {
			projects[i].Integration = integrationName

			if filterProject != "" && projects[i].Key != filterProject {
				continue
			}

			allProjects = append(allProjects, projects[i])

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

	h.Success(c, stats)
}
