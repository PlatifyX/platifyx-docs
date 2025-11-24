package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/azuredevops"
	"github.com/PlatifyX/platifyx-core/pkg/claude"
	"github.com/PlatifyX/platifyx-core/pkg/cloud"
	"github.com/PlatifyX/platifyx-core/pkg/gemini"
	"github.com/PlatifyX/platifyx-core/pkg/jira"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/openai"
	"github.com/PlatifyX/platifyx-core/pkg/slack"
	"github.com/PlatifyX/platifyx-core/pkg/sonarqube"
	"github.com/PlatifyX/platifyx-core/pkg/teams"
	"github.com/gin-gonic/gin"
)

type IntegrationHandler struct {
	service *service.IntegrationService
	cache   *service.CacheService
	log     *logger.Logger
}

func NewIntegrationHandler(svc *service.IntegrationService, cache *service.CacheService, log *logger.Logger) *IntegrationHandler {
	return &IntegrationHandler{
		service: svc,
		cache:   cache,
		log:     log,
	}
}

func (h *IntegrationHandler) List(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	cacheKey := service.BuildKey("integrations", "list:"+orgUUID)

	// Try to get from cache if cache is available
	if h.cache != nil {
		var cachedResult struct {
			Integrations []domain.Integration `json:"integrations"`
			Total        int                  `json:"total"`
		}

		err := h.cache.GetJSON(cacheKey, &cachedResult)
		if err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedResult)
			return
		}
		h.log.Debugw("Cache MISS", "key", cacheKey)
	}

	// Cache miss or cache disabled, fetch from database
	integrations, err := h.service.GetAll(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch integrations",
		})
		return
	}

	result := gin.H{
		"integrations": integrations,
		"total":        len(integrations),
	}

	// Store in cache if cache is available
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, result, service.CacheDuration5Minutes); err != nil {
			h.log.Warnw("Failed to cache integrations list", "error", err)
		}
	}

	c.JSON(http.StatusOK, result)
}

func (h *IntegrationHandler) GetByID(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid integration ID",
		})
		return
	}

	integration, err := h.service.GetByID(id, orgUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	c.JSON(http.StatusOK, integration)
}

func (h *IntegrationHandler) Update(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid integration ID",
		})
		return
	}

	var input struct {
		Name    string                 `json:"name"`
		Enabled bool                   `json:"enabled"`
		Config  map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get existing integration
	integration, err := h.service.GetByID(id, orgUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	// Update name if provided
	if input.Name != "" {
		integration.Name = input.Name
	}

	if err := h.service.Update(id, orgUUID, input.Enabled, input.Config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update integration",
		})
		return
	}

	// Invalidate cache
	if h.cache != nil {
		cacheKey := service.BuildKey("integrations", "list:"+orgUUID)
		h.cache.Delete(cacheKey)
		h.log.Debugw("Cache invalidated", "key", cacheKey)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Integration updated successfully",
	})
}

func (h *IntegrationHandler) Create(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var input struct {
		Name    string                 `json:"name" binding:"required"`
		Type    string                 `json:"type" binding:"required"`
		Enabled bool                   `json:"enabled"`
		Config  map[string]interface{} `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert config map to JSON
	configJSON, err := json.Marshal(input.Config)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid config format",
		})
		return
	}

	integration := &domain.Integration{
		Name:    input.Name,
		Type:    input.Type,
		Enabled: input.Enabled,
		Config:  configJSON,
	}

	if err := h.service.Create(integration, orgUUID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create integration",
		})
		return
	}

	// Invalidate cache
	if h.cache != nil {
		cacheKey := service.BuildKey("integrations", "list:"+orgUUID)
		h.cache.Delete(cacheKey)
		h.log.Debugw("Cache invalidated", "key", cacheKey)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Integration created successfully",
		"integration": integration,
	})
}

func (h *IntegrationHandler) Delete(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid integration ID",
		})
		return
	}

	if err := h.service.Delete(id, orgUUID); err != nil {
		h.log.Errorw("Failed to delete integration", "error", err, "id", id)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete integration",
		})
		return
	}

	// Invalidate cache
	if h.cache != nil {
		cacheKey := service.BuildKey("integrations", "list:"+orgUUID)
		h.cache.Delete(cacheKey)
		h.log.Debugw("Cache invalidated", "key", cacheKey)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Integration deleted successfully",
	})
}

func (h *IntegrationHandler) TestAzureDevOps(c *gin.Context) {
	var input struct {
		Organization string `json:"organization" binding:"required"`
		PAT          string `json:"pat" binding:"required"`
		URL          string `json:"url"` // Optional, defaults to https://dev.azure.com
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Azure DevOps config
	config := domain.AzureDevOpsConfig{
		Organization: input.Organization,
		Project:      "",
		PAT:          input.PAT,
		URL:          input.URL, // Will use default if empty
	}

	// Try to connect and list projects
	client := azuredevops.NewClient(config)

	// Test by making a simple API call to verify credentials and list projects
	projects, err := client.ListProjects()
	if err != nil {
		h.log.Errorw("Failed to test Azure DevOps connection",
			"error", err,
			"organization", input.Organization,
			"url", config.URL,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Azure DevOps. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Connection successful",
		"success":       true,
		"projectCount":  len(projects),
		"projects":      projects,
	})
}

func (h *IntegrationHandler) ListAzureDevOpsProjects(c *gin.Context) {
	org := c.Query("organization")
	pat := c.Query("pat")
	url := c.Query("url")

	if org == "" || pat == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "organization and pat query parameters are required",
		})
		return
	}

	config := domain.AzureDevOpsConfig{
		Organization: org,
		Project:      "",
		PAT:          pat,
		URL:          url,
	}

	client := azuredevops.NewClient(config)
	projects, err := client.ListProjects()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch projects from Azure DevOps",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"count":    len(projects),
	})
}

func (h *IntegrationHandler) TestSonarQube(c *gin.Context) {
	var input struct {
		URL   string `json:"url" binding:"required"`
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary SonarQube config
	config := domain.SonarQubeConfig{
		URL:   input.URL,
		Token: input.Token,
	}

	// Try to connect and list projects
	client := sonarqube.NewClient(config)

	// Test by making a simple API call to verify credentials and list projects
	projects, err := client.GetProjects()
	if err != nil {
		h.log.Errorw("Failed to test SonarQube connection",
			"error", err,
			"url", input.URL,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to SonarQube. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Connection successful",
		"success":      true,
		"projectCount": len(projects),
		"projects":     projects,
	})
}

func (h *IntegrationHandler) TestAzureCloud(c *gin.Context) {
	var input struct {
		SubscriptionID string `json:"subscriptionId" binding:"required"`
		TenantID       string `json:"tenantId" binding:"required"`
		ClientID       string `json:"clientId" binding:"required"`
		ClientSecret   string `json:"clientSecret" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Azure Cloud config
	config := domain.AzureCloudConfig{
		SubscriptionID: input.SubscriptionID,
		TenantID:       input.TenantID,
		ClientID:       input.ClientID,
		ClientSecret:   input.ClientSecret,
	}

	// Test connection
	client := cloud.NewAzureClient(config)
	if err := client.TestConnection(); err != nil {
		h.log.Errorw("Failed to test Azure Cloud connection",
			"error", err,
			"subscriptionId", input.SubscriptionID,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Azure. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}

func (h *IntegrationHandler) TestGCP(c *gin.Context) {
	var input struct {
		ProjectID          string `json:"projectId" binding:"required"`
		ServiceAccountJSON string `json:"serviceAccountJson" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary GCP config
	config := domain.GCPCloudConfig{
		ProjectID:          input.ProjectID,
		ServiceAccountJSON: input.ServiceAccountJSON,
	}

	// Test connection
	client := cloud.NewGCPClient(config)
	if err := client.TestConnection(); err != nil {
		h.log.Errorw("Failed to test GCP connection",
			"error", err,
			"projectId", input.ProjectID,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to GCP. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}

func (h *IntegrationHandler) TestAWS(c *gin.Context) {
	var input struct {
		AccessKeyID     string `json:"accessKeyId" binding:"required"`
		SecretAccessKey string `json:"secretAccessKey" binding:"required"`
		Region          string `json:"region" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary AWS config
	config := domain.AWSCloudConfig{
		AccessKeyID:     input.AccessKeyID,
		SecretAccessKey: input.SecretAccessKey,
		Region:          input.Region,
	}

	// Test connection
	client := cloud.NewAWSClient(config)
	if err := client.TestConnection(); err != nil {
		h.log.Errorw("Failed to test AWS connection",
			"error", err,
			"region", input.Region,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to AWS. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}

func (h *IntegrationHandler) TestKubernetes(c *gin.Context) {
	var input struct {
		KubeConfig string `json:"kubeconfig" binding:"required"`
		Context    string `json:"context"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Kubernetes config
	config := domain.KubernetesConfig{
		KubeConfig: input.KubeConfig,
		Context:    input.Context,
	}

	// Test connection by creating a client and fetching cluster info
	kubeService, err := service.NewKubernetesService(config, h.log)
	if err != nil {
		h.log.Errorw("Failed to create Kubernetes client",
			"error", err,
			"context", input.Context,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Kubernetes cluster. Please check your kubeconfig.",
			"details": err.Error(),
		})
		return
	}

	// Try to get cluster info to verify connection
	cluster, err := kubeService.GetClusterInfo()
	if err != nil {
		h.log.Errorw("Failed to test Kubernetes connection",
			"error", err,
			"context", input.Context,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Kubernetes cluster. Please check your kubeconfig.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"cluster": cluster,
	})
}

func (h *IntegrationHandler) TestGrafana(c *gin.Context) {
	var input struct {
		URL    string `json:"url" binding:"required"`
		APIKey string `json:"apiKey" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Grafana config
	config := domain.GrafanaConfig{
		URL:    input.URL,
		APIKey: input.APIKey,
	}

	// Test connection by creating a client and fetching health
	grafanaService := service.NewGrafanaService(config, h.log)
	health, err := grafanaService.GetHealth()
	if err != nil {
		h.log.Errorw("Failed to test Grafana connection",
			"error", err,
			"url", input.URL,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Grafana. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"health":  health,
	})
}

func (h *IntegrationHandler) TestGitHub(c *gin.Context) {
	var input struct {
		Token        string `json:"token" binding:"required"`
		Organization string `json:"organization"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary GitHub config
	config := domain.GitHubConfig{
		Token:        input.Token,
		Organization: input.Organization,
	}

	// Test connection by creating a client and fetching user info
	githubService := service.NewGitHubService(config, h.log)
	user, err := githubService.GetAuthenticatedUser()
	if err != nil {
		h.log.Errorw("Failed to test GitHub connection",
			"error", err,
			"organization", input.Organization,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to GitHub. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"user":    user,
	})
}

func (h *IntegrationHandler) TestOpenAI(c *gin.Context) {
	var input struct {
		APIKey       string `json:"apiKey" binding:"required"`
		Organization string `json:"organization"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Test connection by creating a client and listing models
	client := openai.NewClient(input.APIKey, input.Organization)
	models, err := client.ListModels()
	if err != nil {
		h.log.Errorw("Failed to test OpenAI connection",
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to OpenAI. Please check your API key.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Connection successful",
		"success":    true,
		"modelCount": len(models.Data),
	})
}

func (h *IntegrationHandler) TestGemini(c *gin.Context) {
	var input struct {
		APIKey string `json:"apiKey" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Test connection by creating a client and listing models
	client := gemini.NewClient(input.APIKey)
	models, err := client.ListModels()
	if err != nil {
		h.log.Errorw("Failed to test Gemini connection",
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Gemini. Please check your API key.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Connection successful",
		"success":    true,
		"modelCount": len(models.Models),
	})
}

func (h *IntegrationHandler) TestClaude(c *gin.Context) {
	var input struct {
		APIKey string `json:"apiKey" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Test connection by creating a client and testing with a simple message
	client := claude.NewClient(input.APIKey)
	if err := client.TestConnection(); err != nil {
		h.log.Errorw("Failed to test Claude connection",
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Claude. Please check your API key.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}

func (h *IntegrationHandler) TestJira(c *gin.Context) {
	var input struct {
		URL      string `json:"url" binding:"required"`
		Email    string `json:"email" binding:"required"`
		APIToken string `json:"apiToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Jira config
	config := domain.JiraConfig{
		URL:      input.URL,
		Email:    input.Email,
		APIToken: input.APIToken,
	}

	// Test connection by creating a client and getting current user
	client := jira.NewClient(config)
	user, err := client.GetCurrentUser()
	if err != nil {
		h.log.Errorw("Failed to test Jira connection",
			"error", err,
			"url", input.URL,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Jira. Please check your credentials.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"user":    user,
	})
}

func (h *IntegrationHandler) TestSlack(c *gin.Context) {
	var input struct {
		WebhookURL string `json:"webhookUrl" binding:"required"`
		BotToken   string `json:"botToken"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Slack config
	config := domain.SlackConfig{
		WebhookURL: input.WebhookURL,
		BotToken:   input.BotToken,
	}

	// Test connection by sending a test message
	client := slack.NewClient(config)
	if err := client.TestConnection(); err != nil {
		h.log.Errorw("Failed to test Slack connection",
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Slack. Please check your webhook URL.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}

func (h *IntegrationHandler) TestTeams(c *gin.Context) {
	var input struct {
		WebhookURL string `json:"webhookUrl" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary Teams config
	config := domain.TeamsConfig{
		WebhookURL: input.WebhookURL,
	}

	// Test connection by sending a test message
	client := teams.NewClient(config)
	if err := client.TestConnection(); err != nil {
		h.log.Errorw("Failed to test Teams connection",
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to Microsoft Teams. Please check your webhook URL.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}

// TestArgoCD tests the ArgoCD connection
func (h *IntegrationHandler) TestArgoCD(c *gin.Context) {
	var req domain.ArgoCDIntegrationConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.ServerURL == "" || req.AuthToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Server URL and Auth Token are required",
		})
		return
	}

	// Create ArgoCD service for testing
	config := domain.ArgoCDConfig{
		ServerURL: req.ServerURL,
		AuthToken: req.AuthToken,
		Insecure:  req.Insecure,
	}

	argoCDService := service.NewArgoCDService(config, h.log)

	// Test connection
	if err := argoCDService.TestConnection(); err != nil {
		h.log.Errorw("ArgoCD connection test failed", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to connect to ArgoCD. Please check your server URL and auth token.",
			"details": err.Error(),
		})
		return
	}

	// Get applications count
	apps, err := argoCDService.GetApplications()
	if err != nil {
		h.log.Warnw("Failed to get applications count", "error", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Connection successful",
		"success":            true,
		"applicationsCount": len(apps),
	})
}

// TestPrometheus tests the Prometheus connection
func (h *IntegrationHandler) TestPrometheus(c *gin.Context) {
	var req domain.PrometheusIntegrationConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "URL is required",
		})
		return
	}

	// Create Prometheus service for testing
	config := domain.PrometheusConfig{
		URL:      req.URL,
		Username: req.Username,
		Password: req.Password,
	}

	prometheusService := service.NewPrometheusService(config, h.log)

	// Test connection
	if err := prometheusService.TestConnection(); err != nil {
		h.log.Errorw("Prometheus connection test failed", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to connect to Prometheus. Please check your URL and credentials.",
			"details": err.Error(),
		})
		return
	}

	// Get build info
	buildInfo, err := prometheusService.GetBuildInfo()
	version := ""
	if err == nil && buildInfo != nil && buildInfo.Data != nil {
		if v, ok := buildInfo.Data["version"]; ok {
			version = v
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"version": version,
	})
}

// TestLoki tests the Loki connection
func (h *IntegrationHandler) TestLoki(c *gin.Context) {
	var req domain.LokiIntegrationConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "URL is required",
		})
		return
	}

	// Create Loki service for testing
	config := domain.LokiConfig{
		URL:      req.URL,
		Username: req.Username,
		Password: req.Password,
	}

	lokiService := service.NewLokiService(config, h.log)

	// Test connection
	if err := lokiService.TestConnection(); err != nil {
		h.log.Errorw("Loki connection test failed", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to connect to Loki. Please check your URL and credentials.",
			"details": err.Error(),
		})
		return
	}

	// Get labels count
	labels, err := lokiService.GetLabels()
	labelsCount := 0
	if err == nil {
		labelsCount = len(labels)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"labels":  labelsCount,
	})
}

// TestVault tests the Vault connection
func (h *IntegrationHandler) TestVault(c *gin.Context) {
	var req domain.VaultIntegrationConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.Address == "" || req.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Address and Token are required",
		})
		return
	}

	// Create Vault service for testing
	config := domain.VaultConfig{
		Address:   req.Address,
		Token:     req.Token,
		Namespace: req.Namespace,
	}

	vaultService := service.NewVaultService(config, h.log)

	// Test connection
	if err := vaultService.TestConnection(); err != nil {
		h.log.Errorw("Vault connection test failed", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to connect to Vault. Please check your address and token.",
			"details": err.Error(),
		})
		return
	}

	// Get health info
	health, err := vaultService.GetHealth()
	if err != nil {
		h.log.Warnw("Failed to get health info", "error", err)
	}

	response := gin.H{
		"message": "Connection successful",
		"success": true,
	}

	if health != nil {
		response["version"] = health.Version
		response["initialized"] = health.Initialized
		response["sealed"] = health.Sealed
	}

	c.JSON(http.StatusOK, response)
}

// TestAWSSecrets tests the AWS Secrets Manager connection
func (h *IntegrationHandler) TestAWSSecrets(c *gin.Context) {
	var req domain.AWSSecretsIntegrationConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.AccessKeyID == "" || req.SecretAccessKey == "" || req.Region == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "AccessKeyID, SecretAccessKey, and Region are required",
		})
		return
	}

	// Create AWS Secrets service for testing
	config := domain.AWSSecretsConfig{
		AccessKeyID:     req.AccessKeyID,
		SecretAccessKey: req.SecretAccessKey,
		Region:          req.Region,
		SessionToken:    req.SessionToken,
	}

	awsSecretsService, err := service.NewAWSSecretsService(config, h.log)
	if err != nil {
		h.log.Errorw("AWS Secrets connection test failed", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to create AWS Secrets Manager client",
			"details": err.Error(),
		})
		return
	}

	// Test connection
	ctx := c.Request.Context()
	if err := awsSecretsService.TestConnection(ctx); err != nil {
		h.log.Errorw("AWS Secrets connection test failed", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to connect to AWS Secrets Manager. Please check your credentials and region.",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
		"region":  req.Region,
	})
}
