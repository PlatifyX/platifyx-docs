package handler

import (
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AzureDevOpsHandler struct {
	service *service.AzureDevOpsService
	log     *logger.Logger
}

func NewAzureDevOpsHandler(svc *service.AzureDevOpsService, log *logger.Logger) *AzureDevOpsHandler {
	return &AzureDevOpsHandler{
		service: svc,
		log:     log,
	}
}

func (h *AzureDevOpsHandler) ListPipelines(c *gin.Context) {
	pipelines, err := h.service.GetPipelines()
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

	runs, err := h.service.GetPipelineRuns(pipelineID)
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

	builds, err := h.service.GetBuilds(limit)
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

	build, err := h.service.GetBuildByID(buildID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch build",
		})
		return
	}

	c.JSON(http.StatusOK, build)
}

func (h *AzureDevOpsHandler) ListReleases(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	releases, err := h.service.GetReleases(limit)
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

	release, err := h.service.GetReleaseByID(releaseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch release",
		})
		return
	}

	c.JSON(http.StatusOK, release)
}

func (h *AzureDevOpsHandler) GetStats(c *gin.Context) {
	stats := h.service.GetPipelineStats()
	c.JSON(http.StatusOK, stats)
}
