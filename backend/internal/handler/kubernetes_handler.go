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

func (h *KubernetesHandler) GetClusterInfo(c *gin.Context) {
	if h.service == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured",
		})
		return
	}

	cluster, err := h.service.GetClusterInfo()
	if err != nil {
		h.log.Errorw("Failed to get cluster info", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, cluster)
}

func (h *KubernetesHandler) ListPods(c *gin.Context) {
	if h.service == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured",
		})
		return
	}

	namespace := c.Query("namespace")
	// If namespace is empty, it will list pods from all namespaces

	pods, err := h.service.GetPods(namespace)
	if err != nil {
		h.log.Errorw("Failed to list pods", "error", err, "namespace", namespace)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"namespace": namespace,
		"pods":      pods,
		"total":     len(pods),
	})
}

func (h *KubernetesHandler) ListDeployments(c *gin.Context) {
	if h.service == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured",
		})
		return
	}

	namespace := c.Query("namespace")
	// If namespace is empty, it will list deployments from all namespaces

	deployments, err := h.service.GetDeployments(namespace)
	if err != nil {
		h.log.Errorw("Failed to list deployments", "error", err, "namespace", namespace)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"namespace":   namespace,
		"deployments": deployments,
		"total":       len(deployments),
	})
}

func (h *KubernetesHandler) ListServices(c *gin.Context) {
	if h.service == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured",
		})
		return
	}

	namespace := c.Query("namespace")
	// If namespace is empty, it will list services from all namespaces

	services, err := h.service.GetServices(namespace)
	if err != nil {
		h.log.Errorw("Failed to list services", "error", err, "namespace", namespace)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"namespace": namespace,
		"services":  services,
		"total":     len(services),
	})
}

func (h *KubernetesHandler) ListNamespaces(c *gin.Context) {
	if h.service == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured",
		})
		return
	}

	namespaces, err := h.service.GetNamespaces()
	if err != nil {
		h.log.Errorw("Failed to list namespaces", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"namespaces": namespaces,
		"total":      len(namespaces),
	})
}

func (h *KubernetesHandler) ListNodes(c *gin.Context) {
	if h.service == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured",
		})
		return
	}

	nodes, err := h.service.GetNodes()
	if err != nil {
		h.log.Errorw("Failed to list nodes", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"nodes": nodes,
		"total": len(nodes),
	})
}
