package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceHandler struct {
	service *service.ServiceService
	log     *logger.Logger
}

func NewServiceHandler(svc *service.ServiceService, log *logger.Logger) *ServiceHandler {
	return &ServiceHandler{
		service: svc,
		log:     log,
	}
}

func (h *ServiceHandler) List(c *gin.Context) {
	services := h.service.GetAll()

	c.JSON(http.StatusOK, gin.H{
		"services": services,
		"total":    len(services),
	})
}

func (h *ServiceHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	svc, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Service not found",
		})
		return
	}

	c.JSON(http.StatusOK, svc)
}

func (h *ServiceHandler) Create(c *gin.Context) {
	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Type        string `json:"type"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	svc := h.service.Create(input.Name, input.Description, input.Type)

	c.JSON(http.StatusCreated, svc)
}
