package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type VaultHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewVaultHandler(svc *service.IntegrationService, log *logger.Logger) *VaultHandler {
	return &VaultHandler{
		service: svc,
		log:     log,
	}
}

func (h *VaultHandler) GetStats(c *gin.Context) {
	vaultService, err := h.service.GetVaultService()
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Vault integration not configured",
		})
		return
	}

	stats, err := vaultService.GetStats()
	if err != nil {
		h.log.Errorw("Failed to get Vault stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *VaultHandler) GetHealth(c *gin.Context) {
	vaultService, err := h.service.GetVaultService()
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Vault integration not configured",
		})
		return
	}

	health, err := vaultService.GetHealth()
	if err != nil {
		h.log.Errorw("Failed to get Vault health", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, health)
}

func (h *VaultHandler) ReadKVSecret(c *gin.Context) {
	vaultService, err := h.service.GetVaultService()
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Vault integration not configured",
		})
		return
	}

	mountPath := c.Query("mount")
	secretPath := c.Query("path")

	if mountPath == "" || secretPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "mount and path query parameters are required",
		})
		return
	}

	secret, err := vaultService.ReadKVSecret(mountPath, secretPath)
	if err != nil {
		h.log.Errorw("Failed to read KV secret", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, secret)
}

func (h *VaultHandler) ListKVSecrets(c *gin.Context) {
	vaultService, err := h.service.GetVaultService()
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Vault integration not configured",
		})
		return
	}

	mountPath := c.Query("mount")
	secretPath := c.DefaultQuery("path", "")

	if mountPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "mount query parameter is required",
		})
		return
	}

	secrets, err := vaultService.ListKVSecrets(mountPath, secretPath)
	if err != nil {
		h.log.Errorw("Failed to list KV secrets", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"keys": secrets,
	})
}

func (h *VaultHandler) WriteKVSecret(c *gin.Context) {
	vaultService, err := h.service.GetVaultService()
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Vault integration not configured",
		})
		return
	}

	var req struct {
		MountPath  string                 `json:"mountPath"`
		SecretPath string                 `json:"secretPath"`
		Data       map[string]interface{} `json:"data"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.MountPath == "" || req.SecretPath == "" || req.Data == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "mountPath, secretPath, and data are required",
		})
		return
	}

	if err := vaultService.WriteKVSecret(req.MountPath, req.SecretPath, req.Data); err != nil {
		h.log.Errorw("Failed to write KV secret", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Secret written successfully",
	})
}

func (h *VaultHandler) DeleteKVSecret(c *gin.Context) {
	vaultService, err := h.service.GetVaultService()
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Vault integration not configured",
		})
		return
	}

	mountPath := c.Query("mount")
	secretPath := c.Query("path")

	if mountPath == "" || secretPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "mount and path query parameters are required",
		})
		return
	}

	if err := vaultService.DeleteKVSecret(mountPath, secretPath); err != nil {
		h.log.Errorw("Failed to delete KV secret", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Secret deleted successfully",
	})
}
