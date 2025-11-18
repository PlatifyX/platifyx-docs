package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/azuredevops"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type IntegrationHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewIntegrationHandler(svc *service.IntegrationService, log *logger.Logger) *IntegrationHandler {
	return &IntegrationHandler{
		service: svc,
		log:     log,
	}
}

func (h *IntegrationHandler) List(c *gin.Context) {
	integrations, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch integrations",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"integrations": integrations,
		"total":        len(integrations),
	})
}

func (h *IntegrationHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid integration ID",
		})
		return
	}

	integration, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	c.JSON(http.StatusOK, integration)
}

func (h *IntegrationHandler) Update(c *gin.Context) {
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
	integration, err := h.service.GetByID(id)
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

	if err := h.service.Update(id, input.Enabled, input.Config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update integration",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Integration updated successfully",
	})
}

func (h *IntegrationHandler) Create(c *gin.Context) {
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

	if err := h.service.Create(integration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create integration",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Integration created successfully",
		"integration": integration,
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
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Failed to connect to Azure DevOps. Please check your credentials.",
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
