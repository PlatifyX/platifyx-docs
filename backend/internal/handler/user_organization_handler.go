package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type UserOrganizationHandler struct {
	service *service.UserOrganizationService
	log     *logger.Logger
}

func NewUserOrganizationHandler(svc *service.UserOrganizationService, log *logger.Logger) *UserOrganizationHandler {
	return &UserOrganizationHandler{
		service: svc,
		log:     log,
	}
}

func (h *UserOrganizationHandler) GetUserOrganizations(c *gin.Context) {
	userID := c.Param("userId")

	userOrgs, err := h.service.GetUserOrganizations(userID)
	if err != nil {
		h.log.Errorw("Failed to get user organizations", "error", err, "userID", userID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user organizations",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"organizations": userOrgs,
		"total":        len(userOrgs),
	})
}

func (h *UserOrganizationHandler) GetMyOrganizations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	userOrgs, err := h.service.GetUserOrganizations(userID.(string))
	if err != nil {
		h.log.Errorw("Failed to get user organizations", "error", err, "userID", userID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user organizations",
		})
		return
	}

	organizations := make([]interface{}, 0, len(userOrgs))
	for _, uo := range userOrgs {
		if uo.Organization != nil {
			organizations = append(organizations, uo.Organization)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"organizations": organizations,
		"total":        len(organizations),
	})
}

func (h *UserOrganizationHandler) GetOrganizationUsers(c *gin.Context) {
	orgUUID := c.Param("uuid")

	users, err := h.service.GetOrganizationUsers(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get organization users", "error", err, "orgUUID", orgUUID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch organization users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

func (h *UserOrganizationHandler) AddUserToOrganization(c *gin.Context) {
	orgUUID := c.Param("uuid")

	var req domain.AddUserToOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	uo, err := h.service.AddUserToOrganization(orgUUID, req)
	if err != nil {
		h.log.Errorw("Failed to add user to organization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to add user to organization",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, uo)
}

func (h *UserOrganizationHandler) UpdateUserRole(c *gin.Context) {
	orgUUID := c.Param("uuid")
	userID := c.Param("userId")

	var req domain.UpdateUserOrganizationRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userOrg, err := h.service.GetUserOrganizations(userID)
	if err != nil {
		h.log.Errorw("Failed to get user organization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find user organization",
		})
		return
	}

	var foundID string
	for _, uo := range userOrg {
		if uo.OrganizationUUID == orgUUID {
			foundID = uo.ID
			break
		}
	}

	if foundID == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User is not associated with this organization",
		})
		return
	}

	err = h.service.UpdateUserRole(foundID, req.Role)
	if err != nil {
		h.log.Errorw("Failed to update user role", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user role",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User role updated successfully",
	})
}

func (h *UserOrganizationHandler) RemoveUserFromOrganization(c *gin.Context) {
	orgUUID := c.Param("uuid")
	userID := c.Param("userId")

	err := h.service.RemoveUserFromOrganization(userID, orgUUID)
	if err != nil {
		h.log.Errorw("Failed to remove user from organization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove user from organization",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User removed from organization successfully",
	})
}

