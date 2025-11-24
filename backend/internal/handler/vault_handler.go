package handler

import (
	"fmt"
	"net/http"
	"strconv"

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

func (h *VaultHandler) getIntegrationID(c *gin.Context) (int, error) {
	integrationID := c.Query("integration_id")
	if integrationID == "" {
		return 0, fmt.Errorf("integration_id parameter is required")
	}

	id, err := strconv.Atoi(integrationID)
	if err != nil {
		return 0, fmt.Errorf("invalid integration_id")
	}

	return id, nil
}

func (h *VaultHandler) GetStats(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	vaultService, err := h.service.GetVaultServiceByID(integrationID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	vaultService, err := h.service.GetVaultServiceByID(integrationID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	vaultService, err := h.service.GetVaultServiceByID(integrationID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	vaultService, err := h.service.GetVaultServiceByID(integrationID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	vaultService, err := h.service.GetVaultServiceByID(integrationID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var req struct {
		MountPath  string                 `json:"mountPath"`
		SecretPath string                 `json:"secretPath"`
		Path       string                 `json:"path"`
		Data       map[string]interface{} `json:"data"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	mountPath := req.MountPath
	if mountPath == "" {
		mountPath = "secret"
	}

	secretPath := req.SecretPath
	if secretPath == "" {
		secretPath = req.Path
	}

	if secretPath == "" || req.Data == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "path and data are required",
		})
		return
	}

	if err := vaultService.WriteKVSecret(mountPath, secretPath, req.Data); err != nil {
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	vaultService, err := h.service.GetVaultServiceByID(integrationID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Vault service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	mountPath := c.DefaultQuery("mount", "secret")
	secretPath := c.Query("path")

	if secretPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "path query parameter is required",
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
