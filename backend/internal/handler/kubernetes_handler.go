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

func (h *KubernetesHandler) getServiceByIntegration(organizationUUID, integrationName string) (*service.KubernetesService, error) {
	// Se nenhuma integração foi especificada, usa a primeira disponível
	if integrationName == "" {
		return h.getService(organizationUUID)
	}

	// Busca todas as integrações kubernetes
	configs, err := h.integrationService.GetAllKubernetesConfigs(organizationUUID)
	if err != nil {
		return nil, err
	}

	if len(configs) == 0 {
		return nil, nil
	}

	// Busca pela integração específica
	config, exists := configs[integrationName]
	if !exists {
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

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
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

	// Obter pods para calcular métricas de status
	pods, err := kubeService.GetPods("")
	if err != nil {
		h.log.Warnw("Failed to get pods for metrics", "error", err)
		c.JSON(http.StatusOK, cluster)
		return
	}

	// Obter namespaces para contar
	namespaces, err := kubeService.GetNamespaces()
	if err != nil {
		h.log.Warnw("Failed to get namespaces for metrics", "error", err)
	}

	// Calcular métricas de pods por status
	statusCounts := make(map[string]int)
	for _, pod := range pods {
		statusCounts[pod.Status]++
	}

	// Adicionar métricas ao cluster info
	clusterMap := make(map[string]interface{})
	clusterMap["version"] = cluster.Version
	clusterMap["nodes"] = cluster.NodeCount
	clusterMap["namespaces"] = len(namespaces)
	clusterMap["totalPods"] = len(pods)
	clusterMap["podMetrics"] = statusCounts

	c.JSON(http.StatusOK, clusterMap)
}

func (h *KubernetesHandler) ListPods(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
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

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
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

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
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

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
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

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
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

// GetPodLogs retrieves logs for a specific pod
func (h *KubernetesHandler) GetPodLogs(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	integrationName := c.Query("integration")
	kubeService, err := h.getServiceByIntegration(orgUUID, integrationName)
	if err != nil {
		h.log.Errorw("Failed to get Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	if kubeService == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	podName := c.Param("podName")
	namespace := c.Query("namespace")
	if namespace == "" {
		namespace = "default"
	}

	// Parâmetros opcionais para logs
	container := c.Query("container")
	tailLines := c.DefaultQuery("tailLines", "100")

	logs, err := kubeService.GetPodLogs(namespace, podName, container, tailLines)
	if err != nil {
		h.log.Errorw("Failed to get pod logs", "error", err, "pod", podName, "namespace", namespace)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pod":       podName,
		"namespace": namespace,
		"container": container,
		"logs":      logs,
	})
}
