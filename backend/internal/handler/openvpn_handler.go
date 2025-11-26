package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/openvpn"
	"github.com/gin-gonic/gin"
)

type OpenVPNHandler struct {
	integrationService *service.IntegrationService
	log                *logger.Logger
}

func NewOpenVPNHandler(integrationService *service.IntegrationService, log *logger.Logger) *OpenVPNHandler {
	return &OpenVPNHandler{
		integrationService: integrationService,
		log:                log,
	}
}

// ListUsers lists all OpenVPN users
func (h *OpenVPNHandler) ListUsers(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	// Get OpenVPN service from integration
	openVPNService, err := h.integrationService.GetOpenVPNService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get OpenVPN service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "OpenVPN integration not configured",
		})
		return
	}

	users, err := openVPNService.ListUsers()
	if err != nil {
		h.log.Errorw("Failed to list OpenVPN users", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to list OpenVPN users",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

// GetUser gets a specific OpenVPN user
func (h *OpenVPNHandler) GetUser(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username is required",
		})
		return
	}

	// Get OpenVPN service from integration
	openVPNService, err := h.integrationService.GetOpenVPNService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get OpenVPN service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "OpenVPN integration not configured",
		})
		return
	}

	user, err := openVPNService.GetUser(username)
	if err != nil {
		h.log.Errorw("Failed to get OpenVPN user", "error", err, "username", username)
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "User not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser creates a new OpenVPN user
func (h *OpenVPNHandler) CreateUser(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var req domain.CreateOpenVPNUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get OpenVPN service from integration
	openVPNService, err := h.integrationService.GetOpenVPNService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get OpenVPN service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "OpenVPN integration not configured",
		})
		return
	}

	user, err := openVPNService.CreateUser(req)
	if err != nil {
		h.log.Errorw("Failed to create OpenVPN user", "error", err, "username", req.Username)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user":    user,
	})
}

// UpdateUser updates an existing OpenVPN user
func (h *OpenVPNHandler) UpdateUser(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username is required",
		})
		return
	}

	var req domain.UpdateOpenVPNUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get OpenVPN service from integration
	openVPNService, err := h.integrationService.GetOpenVPNService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get OpenVPN service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "OpenVPN integration not configured",
		})
		return
	}

	user, err := openVPNService.UpdateUser(username, req)
	if err != nil {
		h.log.Errorw("Failed to update OpenVPN user", "error", err, "username", username)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    user,
	})
}

// DeleteUser deletes an OpenVPN user
func (h *OpenVPNHandler) DeleteUser(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username is required",
		})
		return
	}

	// Get OpenVPN service from integration
	openVPNService, err := h.integrationService.GetOpenVPNService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get OpenVPN service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "OpenVPN integration not configured",
		})
		return
	}

	err = openVPNService.DeleteUser(username)
	if err != nil {
		h.log.Errorw("Failed to delete OpenVPN user", "error", err, "username", username)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// TestOpenVPN tests the OpenVPN connection
func (h *OpenVPNHandler) TestOpenVPN(c *gin.Context) {
	var input struct {
		URL      string `json:"url" binding:"required"`
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create temporary OpenVPN config
	config := domain.OpenVPNIntegrationConfig{
		URL:      input.URL,
		Username: input.Username,
		Password: input.Password,
	}

	// Test connection
	client := openvpn.NewClient(config)
	err := client.TestConnection()
	if err != nil {
		h.log.Errorw("Failed to test OpenVPN connection", "error", err, "url", input.URL)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Failed to connect to OpenVPN API. Please check your credentials.",
			"details": err.Error(),
			"success": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connection successful",
		"success": true,
	})
}
