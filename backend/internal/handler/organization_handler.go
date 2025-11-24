package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type OrganizationHandler struct {
	service *service.OrganizationService
	log     *logger.Logger
}

func NewOrganizationHandler(svc *service.OrganizationService, log *logger.Logger) *OrganizationHandler {
	return &OrganizationHandler{
		service: svc,
		log:     log,
	}
}

func (h *OrganizationHandler) List(c *gin.Context) {
	organizations, err := h.service.GetAll()
	if err != nil {
		h.log.Errorw("Failed to list organizations", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch organizations",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"organizations": organizations,
		"total":        len(organizations),
	})
}

func (h *OrganizationHandler) GetByUUID(c *gin.Context) {
	uuid := c.Param("uuid")

	org, err := h.service.GetByUUID(uuid)
	if err != nil {
		h.log.Errorw("Failed to get organization", "error", err, "uuid", uuid)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Organization not found",
		})
		return
	}

	c.JSON(http.StatusOK, org)
}

func (h *OrganizationHandler) Create(c *gin.Context) {
	var req domain.CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	org, err := h.service.Create(req)
	if err != nil {
		h.log.Errorw("Failed to create organization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create organization",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, org)
}

func (h *OrganizationHandler) Update(c *gin.Context) {
	uuid := c.Param("uuid")

	var req domain.UpdateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	org, err := h.service.Update(uuid, req)
	if err != nil {
		h.log.Errorw("Failed to update organization", "error", err, "uuid", uuid)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update organization",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, org)
}

func (h *OrganizationHandler) Delete(c *gin.Context) {
	uuid := c.Param("uuid")

	err := h.service.Delete(uuid)
	if err != nil {
		h.log.Errorw("Failed to delete organization", "error", err, "uuid", uuid)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete organization",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Organization deleted successfully",
	})
}


