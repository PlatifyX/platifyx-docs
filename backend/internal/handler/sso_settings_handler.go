package handler

import (
	"encoding/json"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

// SSOSettingsHandler handles SSO settings HTTP requests
type SSOSettingsHandler struct {
	*base.BaseHandler
	ssoService *service.SSOSettingsService
}

// NewSSOSettingsHandler creates a new SSO settings handler
func NewSSOSettingsHandler(
	service *service.SSOSettingsService,
	cache *service.CacheService,
	log *logger.Logger,
) *SSOSettingsHandler {
	return &SSOSettingsHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		ssoService:  service,
	}
}

// GetAll returns all SSO settings
func (h *SSOSettingsHandler) GetAll(c *gin.Context) {
	cacheKey := service.BuildKey("sso", "settings")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		settings, err := h.ssoService.GetAll()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to fetch SSO settings", err)
		}
		return settings, nil
	})
}

// GetByProvider returns SSO settings for a specific provider
func (h *SSOSettingsHandler) GetByProvider(c *gin.Context) {
	provider := c.Param("provider")

	settings, err := h.ssoService.GetByProvider(provider)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to fetch SSO settings", err))
		return
	}

	if settings == nil {
		h.NotFound(c, "SSO settings not found for provider")
		return
	}

	h.Success(c, settings)
}

// CreateOrUpdate creates or updates SSO settings
func (h *SSOSettingsHandler) CreateOrUpdate(c *gin.Context) {
	var req struct {
		Provider string          `json:"provider" binding:"required"`
		Config   json.RawMessage `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	settings, err := h.ssoService.CreateOrUpdate(req.Provider, req.Config)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to create/update SSO settings", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("sso", "settings"))
	}

	h.Success(c, settings)
}

// UpdateEnabled toggles the enabled status
func (h *SSOSettingsHandler) UpdateEnabled(c *gin.Context) {
	provider := c.Param("provider")

	var req struct {
		Enabled bool `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	err := h.ssoService.UpdateEnabled(provider, req.Enabled)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to update SSO enabled status", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("sso", "settings"))
	}

	h.Success(c, map[string]interface{}{
		"message": "SSO enabled status updated successfully",
	})
}

// Delete removes SSO settings
func (h *SSOSettingsHandler) Delete(c *gin.Context) {
	provider := c.Param("provider")

	err := h.ssoService.Delete(provider)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to delete SSO settings", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("sso", "settings"))
	}

	h.Success(c, map[string]interface{}{
		"message": "SSO settings deleted successfully",
	})
}

// TestGoogle tests Google OAuth 2.0 connection
func (h *SSOSettingsHandler) TestGoogle(c *gin.Context) {
	var req domain.SSOTestRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	result := h.ssoService.TestGoogleConnection(req)

	if result.Success {
		h.Success(c, result)
	} else {
		h.HandleError(c, httperr.BadRequest(result.Message))
	}
}

// TestMicrosoft tests Microsoft Azure AD connection
func (h *SSOSettingsHandler) TestMicrosoft(c *gin.Context) {
	var req domain.SSOTestRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	result := h.ssoService.TestMicrosoftConnection(req)

	if result.Success {
		h.Success(c, result)
	} else {
		h.HandleError(c, httperr.BadRequest(result.Message))
	}
}
