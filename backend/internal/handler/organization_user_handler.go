package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type OrganizationUserHandler struct {
	service *service.OrganizationUserService
	log     *logger.Logger
}

func NewOrganizationUserHandler(svc *service.OrganizationUserService, log *logger.Logger) *OrganizationUserHandler {
	return &OrganizationUserHandler{
		service: svc,
		log:     log,
	}
}

func (h *OrganizationUserHandler) ListUsers(c *gin.Context) {
	org, exists := c.Get("organization")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization context not found",
		})
		return
	}

	organization := org.(*domain.Organization)

	users, err := h.service.GetAllUsers(organization)
	if err != nil {
		h.log.Errorw("Failed to list organization users", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

func (h *OrganizationUserHandler) GetUser(c *gin.Context) {
	org, exists := c.Get("organization")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization context not found",
		})
		return
	}

	organization := org.(*domain.Organization)
	userID := c.Param("userId")

	user, err := h.service.GetUserByID(organization, userID)
	if err != nil {
		h.log.Errorw("Failed to get organization user", "error", err, "userID", userID)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *OrganizationUserHandler) CreateUser(c *gin.Context) {
	org, exists := c.Get("organization")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization context not found",
		})
		return
	}

	organization := org.(*domain.Organization)

	var req domain.CreateOrganizationUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	userID := uuid.New().String()
	user := &domain.OrganizationUser{
		ID:        userID,
		Email:     req.Email,
		Name:      req.Name,
		AvatarURL: req.AvatarURL,
		IsActive:  true,
		IsSSO:     req.IsSSO,
		SSOProvider: req.SSOProvider,
		SSOID:     req.SSOID,
	}

	if req.Password != nil && *req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to hash password",
			})
			return
		}
		hashedStr := string(hashedPassword)
		user.PasswordHash = &hashedStr
	}

	err := h.service.CreateUser(organization, user)
	if err != nil {
		h.log.Errorw("Failed to create organization user", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *OrganizationUserHandler) UpdateUser(c *gin.Context) {
	org, exists := c.Get("organization")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization context not found",
		})
		return
	}

	organization := org.(*domain.Organization)
	userID := c.Param("userId")

	var req domain.UpdateOrganizationUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	existingUser, err := h.service.GetUserByID(organization, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	if req.Name != nil {
		existingUser.Name = *req.Name
	}
	if req.AvatarURL != nil {
		existingUser.AvatarURL = req.AvatarURL
	}
	if req.IsActive != nil {
		existingUser.IsActive = *req.IsActive
	}
	if req.Password != nil && *req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to hash password",
			})
			return
		}
		hashedStr := string(hashedPassword)
		existingUser.PasswordHash = &hashedStr
	}

	err = h.service.UpdateUser(organization, existingUser)
	if err != nil {
		h.log.Errorw("Failed to update organization user", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
			"details": err.Error(),
		})
		return
	}

	updatedUser, err := h.service.GetUserByID(organization, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch updated user",
		})
		return
	}

	c.JSON(http.StatusOK, updatedUser)
}

func (h *OrganizationUserHandler) DeleteUser(c *gin.Context) {
	org, exists := c.Get("organization")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization context not found",
		})
		return
	}

	organization := org.(*domain.Organization)
	userID := c.Param("userId")

	err := h.service.DeleteUser(organization, userID)
	if err != nil {
		h.log.Errorw("Failed to delete organization user", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

