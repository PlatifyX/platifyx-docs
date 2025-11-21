package handler

import (
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type RBACHandler struct {
	*base.BaseHandler
	rbacService *service.RBACService
}

func NewRBACHandler(
	service *service.RBACService,
	cache *service.CacheService,
	log *logger.Logger,
) *RBACHandler {
	return &RBACHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		rbacService: service,
	}
}

// User handlers
func (h *RBACHandler) GetAllUsers(c *gin.Context) {
	users, err := h.rbacService.GetAllUsers()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to retrieve users", err))
		return
	}
	h.Success(c, users)
}

func (h *RBACHandler) GetUserByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	user, err := h.rbacService.GetUserByID(id)
	if err != nil {
		h.HandleError(c, httperr.NotFoundWrap("User not found", err))
		return
	}
	h.Success(c, user)
}

func (h *RBACHandler) CreateUser(c *gin.Context) {
	var req domain.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	user, err := h.rbacService.CreateUser(req)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to create user", err))
		return
	}

	h.Created(c, user)
}

func (h *RBACHandler) UpdateUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req domain.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	user, err := h.rbacService.UpdateUser(id, req)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to update user", err))
		return
	}

	h.Success(c, user)
}

func (h *RBACHandler) DeleteUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.rbacService.DeleteUser(id); err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to delete user", err))
		return
	}
	h.Success(c, map[string]interface{}{"message": "User deleted"})
}

func (h *RBACHandler) GetUserStats(c *gin.Context) {
	cacheKey := service.BuildKey("rbac", "user", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		return h.rbacService.GetUserStats()
	})
}

// Role handlers
func (h *RBACHandler) GetAllRoles(c *gin.Context) {
	cacheKey := service.BuildKey("rbac", "roles")

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		return h.rbacService.GetAllRoles()
	})
}

func (h *RBACHandler) GetRoleByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	role, err := h.rbacService.GetRoleByID(id)
	if err != nil {
		h.HandleError(c, httperr.NotFoundWrap("Role not found", err))
		return
	}
	h.Success(c, role)
}

func (h *RBACHandler) CreateRole(c *gin.Context) {
	var req domain.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	role, err := h.rbacService.CreateRole(req)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to create role", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("rbac", "roles"))
	}

	h.Created(c, role)
}

func (h *RBACHandler) UpdateRole(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req domain.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	role, err := h.rbacService.UpdateRole(id, req)
	if err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to update role", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("rbac", "roles"))
	}

	h.Success(c, role)
}

func (h *RBACHandler) DeleteRole(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.rbacService.DeleteRole(id); err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to delete role", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("rbac", "roles"))
	}

	h.Success(c, map[string]interface{}{"message": "Role deleted"})
}

func (h *RBACHandler) AssignRolePermissions(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req domain.AssignPermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if err := h.rbacService.AssignRolePermissions(id, req.PermissionIDs); err != nil {
		h.HandleError(c, httperr.BadRequestWrap("Failed to assign permissions", err))
		return
	}

	// Invalidate cache
	if h.GetCache() != nil {
		h.GetCache().Delete(service.BuildKey("rbac", "roles"))
	}

	h.Success(c, map[string]interface{}{"message": "Permissions assigned"})
}

// Permission handlers
func (h *RBACHandler) GetAllPermissions(c *gin.Context) {
	cacheKey := service.BuildKey("rbac", "permissions")

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		return h.rbacService.GetAllPermissions()
	})
}
