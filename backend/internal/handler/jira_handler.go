package handler

import (
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type JiraHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewJiraHandler(svc *service.IntegrationService, log *logger.Logger) *JiraHandler {
	return &JiraHandler{
		service: svc,
		log:     log,
	}
}

func (h *JiraHandler) GetStats(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	stats, err := jiraService.GetStats()
	if err != nil {
		h.log.Errorw("Failed to get Jira stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *JiraHandler) GetProjects(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	projects, err := jiraService.GetProjects()
	if err != nil {
		h.log.Errorw("Failed to get Jira projects", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"total":    len(projects),
	})
}

func (h *JiraHandler) SearchIssues(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	jql := c.DefaultQuery("jql", "")
	maxResultsStr := c.DefaultQuery("maxResults", "50")
	maxResults, _ := strconv.Atoi(maxResultsStr)

	issues, err := jiraService.SearchIssues(jql, maxResults)
	if err != nil {
		h.log.Errorw("Failed to search Jira issues", "error", err, "jql", jql)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"issues": issues,
		"total":  len(issues),
	})
}

func (h *JiraHandler) GetIssue(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	issueKey := c.Param("key")
	if issueKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Issue key is required",
		})
		return
	}

	issue, err := jiraService.GetIssue(issueKey)
	if err != nil {
		h.log.Errorw("Failed to get Jira issue", "error", err, "key", issueKey)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, issue)
}

func (h *JiraHandler) GetBoards(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	boards, err := jiraService.GetBoards()
	if err != nil {
		h.log.Errorw("Failed to get Jira boards", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"boards": boards,
		"total":  len(boards),
	})
}

func (h *JiraHandler) GetSprints(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	boardIDStr := c.Param("boardId")
	boardID, err := strconv.Atoi(boardIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid board ID",
		})
		return
	}

	sprints, err := jiraService.GetSprints(boardID)
	if err != nil {
		h.log.Errorw("Failed to get Jira sprints", "error", err, "boardId", boardID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sprints": sprints,
		"total":   len(sprints),
	})
}

func (h *JiraHandler) GetCurrentUser(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	jiraService, err := h.service.GetJiraService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Jira service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jira integration not configured",
		})
		return
	}

	user, err := jiraService.GetCurrentUser()
	if err != nil {
		h.log.Errorw("Failed to get current Jira user", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}
