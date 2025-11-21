package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

// SSOSettingsHandler handles SSO settings HTTP requests
type SSOSettingsHandler struct {
	service *service.SSOSettingsService
	cache   *service.CacheService
	log     *logger.Logger
}

// NewSSOSettingsHandler creates a new SSO settings handler
func NewSSOSettingsHandler(service *service.SSOSettingsService, cache *service.CacheService, log *logger.Logger) *SSOSettingsHandler {
	return &SSOSettingsHandler{
		service: service,
		cache:   cache,
		log:     log,
	}
}

// GetAll returns all SSO settings
func (h *SSOSettingsHandler) GetAll(c *gin.Context) {
	h.log.Info("Fetching all SSO settings", nil)

	// Try cache first
	cacheKey := service.BuildKey("sso", "settings")
	if h.cache != nil {
		var cachedSettings []domain.SSOSettings
		err := h.cache.GetJSON(cacheKey, &cachedSettings)
		if err == nil {
			h.log.Info("Returning SSO settings from cache", nil)
			c.JSON(http.StatusOK, cachedSettings)
			return
		}
	}

	// Fetch from database
	settings, err := h.service.GetAll()
	if err != nil {
		h.log.Error("Failed to fetch SSO settings", err, nil)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch SSO settings",
		})
		return
	}

	// Cache the result
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, settings, service.CacheDuration5Minutes); err != nil {
			h.log.Error("Failed to cache SSO settings", err, nil)
		}
	}

	c.JSON(http.StatusOK, settings)
}

// GetByProvider returns SSO settings for a specific provider
func (h *SSOSettingsHandler) GetByProvider(c *gin.Context) {
	provider := c.Param("provider")

	h.log.Info("Fetching SSO settings", map[string]interface{}{
		"provider": provider,
	})

	settings, err := h.service.GetByProvider(provider)
	if err != nil {
		h.log.Error("Failed to fetch SSO settings", err, map[string]interface{}{
			"provider": provider,
		})
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if settings == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "SSO settings not found for provider",
		})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// CreateOrUpdate creates or updates SSO settings
func (h *SSOSettingsHandler) CreateOrUpdate(c *gin.Context) {
	var req struct {
		Provider string          `json:"provider" binding:"required"`
		Config   json.RawMessage `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Error("Invalid request", err, nil)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	h.log.Info("Creating/updating SSO settings", map[string]interface{}{
		"provider": req.Provider,
	})

	settings, err := h.service.CreateOrUpdate(req.Provider, req.Config)
	if err != nil {
		h.log.Error("Failed to create/update SSO settings", err, map[string]interface{}{
			"provider": req.Provider,
		})
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Invalidate cache
	if h.cache != nil {
		h.cache.Delete(service.BuildKey("sso", "settings"))
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateEnabled toggles the enabled status
func (h *SSOSettingsHandler) UpdateEnabled(c *gin.Context) {
	provider := c.Param("provider")

	var req struct {
		Enabled bool `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Error("Invalid request", err, nil)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	h.log.Info("Updating SSO enabled status", map[string]interface{}{
		"provider": provider,
		"enabled":  req.Enabled,
	})

	err := h.service.UpdateEnabled(provider, req.Enabled)
	if err != nil {
		h.log.Error("Failed to update SSO enabled status", err, map[string]interface{}{
			"provider": provider,
		})
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Invalidate cache
	if h.cache != nil {
		h.cache.Delete(service.BuildKey("sso", "settings"))
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "SSO enabled status updated successfully",
	})
}

// Delete removes SSO settings
func (h *SSOSettingsHandler) Delete(c *gin.Context) {
	provider := c.Param("provider")

	h.log.Info("Deleting SSO settings", map[string]interface{}{
		"provider": provider,
	})

	err := h.service.Delete(provider)
	if err != nil {
		h.log.Error("Failed to delete SSO settings", err, map[string]interface{}{
			"provider": provider,
		})
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Invalidate cache
	if h.cache != nil {
		h.cache.Delete(service.BuildKey("sso", "settings"))
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "SSO settings deleted successfully",
	})
}

// TestGoogle tests Google OAuth 2.0 connection
func (h *SSOSettingsHandler) TestGoogle(c *gin.Context) {
	var req domain.SSOTestRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Error("Invalid request", err, nil)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	h.log.Info("Testing Google OAuth connection", map[string]interface{}{
		"clientId": req.ClientID,
	})

	result := h.service.TestGoogleConnection(req)

	if result.Success {
		c.JSON(http.StatusOK, result)
	} else {
		c.JSON(http.StatusBadRequest, result)
	}
}

// TestMicrosoft tests Microsoft Azure AD connection
func (h *SSOSettingsHandler) TestMicrosoft(c *gin.Context) {
	var req domain.SSOTestRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Error("Invalid request", err, nil)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	h.log.Info("Testing Microsoft Azure AD connection", map[string]interface{}{
		"clientId": req.ClientID,
		"tenantId": req.TenantID,
	})

	result := h.service.TestMicrosoftConnection(req)

	if result.Success {
		c.JSON(http.StatusOK, result)
	} else {
		c.JSON(http.StatusBadRequest, result)
	}
}
