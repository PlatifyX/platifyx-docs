package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

// GitHubHandler gerencia endpoints do GitHub
type GitHubHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

// NewGitHubHandler cria uma nova instância
func NewGitHubHandler(
	integrationSvc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *GitHubHandler {
	return &GitHubHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: integrationSvc,
	}
}

// getService helper para obter o GitHubService configurado
func (h *GitHubHandler) getService() (*service.GitHubService, error) {
	config, err := h.integrationService.GetGitHubConfig()
	if err != nil {
		return nil, httperr.InternalErrorWrap("Failed to get GitHub config", err)
	}
	if config == nil {
		return nil, httperr.ServiceUnavailable("GitHub integration not configured")
	}
	return service.NewGitHubService(*config, h.GetLogger()), nil
}

// GetStats returns GitHub statistics
func (h *GitHubHandler) GetStats(c *gin.Context) {
	cacheKey := service.BuildKey("github", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		svc, err := h.getService()
		if err != nil {
			return nil, err
		}
		return svc.GetStats(), nil
	})
}

// GetAuthenticatedUser returns the authenticated GitHub user
func (h *GitHubHandler) GetAuthenticatedUser(c *gin.Context) {
	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	user, err := svc.GetAuthenticatedUser()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get authenticated user", err))
		return
	}

	h.Success(c, user)
}

// ListRepositories returns all repositories
func (h *GitHubHandler) ListRepositories(c *gin.Context) {
	cacheKey := service.BuildKey("github", "repositories")

	h.WithCache(c, cacheKey, service.CacheDuration10Minutes, func() (interface{}, error) {
		svc, err := h.getService()
		if err != nil {
			return nil, err
		}

		repos, err := svc.ListRepositories()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to list repositories", err)
		}

		return map[string]interface{}{
			"repositories": repos,
			"total":        len(repos),
		}, nil
	})
}

// GetRepository returns a specific repository
func (h *GitHubHandler) GetRepository(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	repository, err := svc.GetRepository(owner, repo)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get repository", err))
		return
	}

	h.Success(c, repository)
}

// ListCommits returns commits for a repository
func (h *GitHubHandler) ListCommits(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	branch := c.Query("branch")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	commits, err := svc.ListCommits(owner, repo, branch)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list commits", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"commits": commits,
		"total":   len(commits),
	})
}

// ListPullRequests returns pull requests for a repository
func (h *GitHubHandler) ListPullRequests(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	state := c.DefaultQuery("state", "open")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	prs, err := svc.ListPullRequests(owner, repo, state)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list pull requests", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"pullRequests": prs,
		"total":        len(prs),
	})
}

// ListIssues returns issues for a repository
func (h *GitHubHandler) ListIssues(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	state := c.DefaultQuery("state", "open")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	issues, err := svc.ListIssues(owner, repo, state)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list issues", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"issues": issues,
		"total":  len(issues),
	})
}

// ListBranches returns branches for a repository
func (h *GitHubHandler) ListBranches(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	branches, err := svc.ListBranches(owner, repo)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list branches", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"branches": branches,
		"total":    len(branches),
	})
}

// ListWorkflowRuns returns GitHub Actions workflow runs
func (h *GitHubHandler) ListWorkflowRuns(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	runs, err := svc.ListWorkflowRuns(owner, repo)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list workflow runs", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"workflowRuns": runs,
		"total":        len(runs),
	})
}

// GetOrganization returns organization information
func (h *GitHubHandler) GetOrganization(c *gin.Context) {
	org := c.Param("org")

	svc, err := h.getService()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	organization, err := svc.GetOrganization(org)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get organization", err))
		return
	}

	h.Success(c, organization)
}
