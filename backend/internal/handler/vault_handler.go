package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type VaultHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewVaultHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *VaultHandler {
	return &VaultHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: svc,
	}
}

func (h *VaultHandler) GetStats(c *gin.Context) {
	cacheKey := service.BuildKey("vault", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		vaultService, err := h.integrationService.GetVaultService()
		if err != nil {
			return nil, httperr.ServiceUnavailable("Vault integration not configured")
		}

		stats, err := vaultService.GetStats()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get Vault stats", err)
		}

		return stats, nil
	})
}

func (h *VaultHandler) GetHealth(c *gin.Context) {
	vaultService, err := h.integrationService.GetVaultService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Vault integration not configured"))
		return
	}

	health, err := vaultService.GetHealth()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get Vault health", err))
		return
	}

	h.Success(c, health)
}

func (h *VaultHandler) ReadKVSecret(c *gin.Context) {
	vaultService, err := h.integrationService.GetVaultService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Vault integration not configured"))
		return
	}

	mountPath := c.Query("mount")
	secretPath := c.Query("path")

	if mountPath == "" || secretPath == "" {
		h.BadRequest(c, "mount and path query parameters are required")
		return
	}

	secret, err := vaultService.ReadKVSecret(mountPath, secretPath)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to read KV secret", err))
		return
	}

	h.Success(c, secret)
}

func (h *VaultHandler) ListKVSecrets(c *gin.Context) {
	vaultService, err := h.integrationService.GetVaultService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Vault integration not configured"))
		return
	}

	mountPath := c.Query("mount")
	secretPath := c.DefaultQuery("path", "")

	if mountPath == "" {
		h.BadRequest(c, "mount query parameter is required")
		return
	}

	secrets, err := vaultService.ListKVSecrets(mountPath, secretPath)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list KV secrets", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"keys": secrets,
	})
}

func (h *VaultHandler) WriteKVSecret(c *gin.Context) {
	vaultService, err := h.integrationService.GetVaultService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Vault integration not configured"))
		return
	}

	var req struct {
		MountPath  string                 `json:"mountPath"`
		SecretPath string                 `json:"secretPath"`
		Data       map[string]interface{} `json:"data"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if req.MountPath == "" || req.SecretPath == "" || req.Data == nil {
		h.BadRequest(c, "mountPath, secretPath, and data are required")
		return
	}

	if err := vaultService.WriteKVSecret(req.MountPath, req.SecretPath, req.Data); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to write KV secret", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Secret written successfully",
	})
}

func (h *VaultHandler) DeleteKVSecret(c *gin.Context) {
	vaultService, err := h.integrationService.GetVaultService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Vault integration not configured"))
		return
	}

	mountPath := c.Query("mount")
	secretPath := c.Query("path")

	if mountPath == "" || secretPath == "" {
		h.BadRequest(c, "mount and path query parameters are required")
		return
	}

	if err := vaultService.DeleteKVSecret(mountPath, secretPath); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to delete KV secret", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Secret deleted successfully",
	})
}
