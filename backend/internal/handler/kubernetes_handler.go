package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type KubernetesHandler struct {
	integrationService *service.IntegrationService
	log                *logger.Logger
}

func NewKubernetesHandler(integrationService *service.IntegrationService, log *logger.Logger) *KubernetesHandler {
	return &KubernetesHandler{
		integrationService: integrationService,
		log:                log,
	}
}

func (h *KubernetesHandler) getService(organizationUUID string) (*service.KubernetesService, error) {
	config, err := h.integrationService.GetKubernetesConfig(organizationUUID)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}
	return service.NewKubernetesService(*config, h.log)
}

func (h *KubernetesHandler) GetClusterInfo(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeService, err := h.getService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	cluster, err := kubeService.GetClusterInfo()
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeService, err := h.getService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	namespace := c.Query("namespace")
	// If namespace is empty, it will list pods from all namespaces

	pods, err := kubeService.GetPods(namespace)
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeService, err := h.getService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	namespace := c.Query("namespace")
	// If namespace is empty, it will list deployments from all namespaces

	deployments, err := kubeService.GetDeployments(namespace)
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeService, err := h.getService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	namespace := c.Query("namespace")
	// If namespace is empty, it will list services from all namespaces

	services, err := kubeService.GetServices(namespace)
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeService, err := h.getService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	namespaces, err := kubeService.GetNamespaces()
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeService, err := h.getService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	nodes, err := kubeService.GetNodes()
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
