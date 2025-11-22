package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type GitHubHandler struct {
	integrationService *service.IntegrationService
	cache              *service.CacheService
	log                *logger.Logger
}

func NewGitHubHandler(integrationSvc *service.IntegrationService, cache *service.CacheService, log *logger.Logger) *GitHubHandler {
	return &GitHubHandler{
		integrationService: integrationSvc,
		cache:              cache,
		log:                log,
	}
}

func (h *GitHubHandler) getService(integrationName string) (*service.GitHubService, error) {
	config, err := h.integrationService.GetGitHubConfigByName(integrationName)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}
	return service.NewGitHubService(*config, h.log), nil
}

func (h *GitHubHandler) GetStats(c *gin.Context) {
	integrationName := c.Query("integration")
	cacheKey := service.BuildKey("github", "stats")
	if integrationName != "" {
		cacheKey = service.BuildKey("github", "stats:"+integrationName)
	}

	// Try cache first
	if h.cache != nil {
		var cachedStats interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedStats); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedStats)
			return
		}
	}

	// Cache MISS
	svc, err := h.getService(integrationName)
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	stats := svc.GetStats()

	// Store in cache (5 minutes TTL)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, stats, service.CacheDuration5Minutes); err != nil {
			h.log.Warnw("Failed to cache GitHub stats", "error", err)
		}
	}

	c.JSON(http.StatusOK, stats)
}

func (h *GitHubHandler) GetAuthenticatedUser(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	user, err := svc.GetAuthenticatedUser()
	if err != nil {
		h.log.Errorw("Failed to get authenticated user", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *GitHubHandler) ListRepositories(c *gin.Context) {
	integrationName := c.Query("integration")
	cacheKey := service.BuildKey("github", "repositories")
	if integrationName != "" {
		cacheKey = service.BuildKey("github", "repositories:"+integrationName)
	}

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
	svc, err := h.getService(integrationName)
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	repos, err := svc.ListRepositories()
	if err != nil {
		h.log.Errorw("Failed to list repositories", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	result := gin.H{
		"repositories": repos,
		"total":        len(repos),
	}

	// Store in cache (10 minutes TTL)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, result, service.CacheDuration10Minutes); err != nil {
			h.log.Warnw("Failed to cache GitHub repositories", "error", err)
		}
	}

	c.JSON(http.StatusOK, result)
}

func (h *GitHubHandler) GetRepository(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")

	repository, err := svc.GetRepository(owner, repo)
	if err != nil {
		h.log.Errorw("Failed to get repository", "error", err, "owner", owner, "repo", repo)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, repository)
}

func (h *GitHubHandler) ListCommits(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	branch := c.Query("branch")

	commits, err := svc.ListCommits(owner, repo, branch)
	if err != nil {
		h.log.Errorw("Failed to list commits", "error", err, "owner", owner, "repo", repo)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"commits": commits,
		"total":   len(commits),
	})
}

func (h *GitHubHandler) ListPullRequests(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	state := c.DefaultQuery("state", "open")

	prs, err := svc.ListPullRequests(owner, repo, state)
	if err != nil {
		h.log.Errorw("Failed to list pull requests", "error", err, "owner", owner, "repo", repo)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pullRequests": prs,
		"total":        len(prs),
	})
}

func (h *GitHubHandler) ListIssues(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	state := c.DefaultQuery("state", "open")

	issues, err := svc.ListIssues(owner, repo, state)
	if err != nil {
		h.log.Errorw("Failed to list issues", "error", err, "owner", owner, "repo", repo)
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

func (h *GitHubHandler) ListBranches(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")

	branches, err := svc.ListBranches(owner, repo)
	if err != nil {
		h.log.Errorw("Failed to list branches", "error", err, "owner", owner, "repo", repo)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"branches": branches,
		"total":    len(branches),
	})
}

func (h *GitHubHandler) ListWorkflowRuns(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")

	runs, err := svc.ListWorkflowRuns(owner, repo)
	if err != nil {
		h.log.Errorw("Failed to list workflow runs", "error", err, "owner", owner, "repo", repo)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"workflowRuns": runs,
		"total":        len(runs),
	})
}

func (h *GitHubHandler) GetOrganization(c *gin.Context) {
	svc, err := h.getService("")
	if err != nil {
		h.log.Errorw("Failed to get GitHub service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize GitHub service",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub integration not configured",
		})
		return
	}

	org := c.Param("org")

	organization, err := svc.GetOrganization(org)
	if err != nil {
		h.log.Errorw("Failed to get organization", "error", err, "org", org)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, organization)
}
