package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type KubernetesHandler struct {
	service *service.KubernetesService
	log     *logger.Logger
}

func NewKubernetesHandler(svc *service.KubernetesService, log *logger.Logger) *KubernetesHandler {
	return &KubernetesHandler{
		service: svc,
		log:     log,
	}
}

func (h *KubernetesHandler) ListClusters(c *gin.Context) {
	clusters := h.service.GetClusters()

	c.JSON(http.StatusOK, gin.H{
		"clusters": clusters,
		"total":    len(clusters),
	})
}

func (h *KubernetesHandler) ListPods(c *gin.Context) {
	namespace := c.Query("namespace")
	if namespace == "" {
		namespace = "default"
	}

	pods := h.service.GetPods(namespace)

	c.JSON(http.StatusOK, gin.H{
		"namespace": namespace,
		"pods":      pods,
		"total":     len(pods),
	})
}
