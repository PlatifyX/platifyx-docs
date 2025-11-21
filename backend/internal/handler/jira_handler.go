package handler

import (
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type JiraHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewJiraHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *JiraHandler {
	return &JiraHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: svc,
	}
}

func (h *JiraHandler) GetStats(c *gin.Context) {
	cacheKey := service.BuildKey("jira", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		jiraService, err := h.integrationService.GetJiraService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Jira integration not configured")
		}

		stats, err := jiraService.GetStats()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get Jira stats", err)
		}

		return stats, nil
	})
}

func (h *JiraHandler) GetProjects(c *gin.Context) {
	cacheKey := service.BuildKey("jira", "projects")

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		jiraService, err := h.integrationService.GetJiraService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Jira integration not configured")
		}

		projects, err := jiraService.GetProjects()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get Jira projects", err)
		}

		return map[string]interface{}{
			"projects": projects,
			"total":    len(projects),
		}, nil
	})
}

func (h *JiraHandler) SearchIssues(c *gin.Context) {
	jiraService, err := h.integrationService.GetJiraService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Jira integration not configured"))
		return
	}

	jql := c.DefaultQuery("jql", "")
	maxResultsStr := c.DefaultQuery("maxResults", "50")
	maxResults, _ := strconv.Atoi(maxResultsStr)

	issues, err := jiraService.SearchIssues(jql, maxResults)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to search Jira issues", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"issues": issues,
		"total":  len(issues),
	})
}

func (h *JiraHandler) GetIssue(c *gin.Context) {
	jiraService, err := h.integrationService.GetJiraService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Jira integration not configured"))
		return
	}

	issueKey := c.Param("key")
	if issueKey == "" {
		h.BadRequest(c, "Issue key is required")
		return
	}

	issue, err := jiraService.GetIssue(issueKey)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Jira issue", err))
		return
	}

	h.Success(c, issue)
}

func (h *JiraHandler) GetBoards(c *gin.Context) {
	cacheKey := service.BuildKey("jira", "boards")

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		jiraService, err := h.integrationService.GetJiraService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Jira integration not configured")
		}

		boards, err := jiraService.GetBoards()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get Jira boards", err)
		}

		return map[string]interface{}{
			"boards": boards,
			"total":  len(boards),
		}, nil
	})
}

func (h *JiraHandler) GetSprints(c *gin.Context) {
	jiraService, err := h.integrationService.GetJiraService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Jira integration not configured"))
		return
	}

	boardIDStr := c.Param("boardId")
	boardID, err := strconv.Atoi(boardIDStr)
	if err != nil {
		h.BadRequest(c, "Invalid board ID")
		return
	}

	sprints, err := jiraService.GetSprints(boardID)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Jira sprints", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"sprints": sprints,
		"total":   len(sprints),
	})
}

func (h *JiraHandler) GetCurrentUser(c *gin.Context) {
	jiraService, err := h.integrationService.GetJiraService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Jira integration not configured"))
		return
	}

	user, err := jiraService.GetCurrentUser()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get current Jira user", err))
		return
	}

	h.Success(c, user)
}
