package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type KubernetesHandler struct {
	*base.BaseHandler
	kubernetesService *service.KubernetesService
}

func NewKubernetesHandler(
	svc *service.KubernetesService,
	cache *service.CacheService,
	log *logger.Logger,
) *KubernetesHandler {
	return &KubernetesHandler{
		BaseHandler:       base.NewBaseHandler(cache, log),
		kubernetesService: svc,
	}
}

func (h *KubernetesHandler) GetClusterInfo(c *gin.Context) {
	if h.kubernetesService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Kubernetes integration not configured"))
		return
	}

	cluster, err := h.kubernetesService.GetClusterInfo()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get cluster info", err))
		return
	}

	h.Success(c, cluster)
}

func (h *KubernetesHandler) ListPods(c *gin.Context) {
	if h.kubernetesService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Kubernetes integration not configured"))
		return
	}

	namespace := c.Query("namespace")

	pods, err := h.kubernetesService.GetPods(namespace)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list pods", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"namespace": namespace,
		"pods":      pods,
		"total":     len(pods),
	})
}

func (h *KubernetesHandler) ListDeployments(c *gin.Context) {
	if h.kubernetesService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Kubernetes integration not configured"))
		return
	}

	namespace := c.Query("namespace")

	deployments, err := h.kubernetesService.GetDeployments(namespace)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list deployments", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"namespace":   namespace,
		"deployments": deployments,
		"total":       len(deployments),
	})
}

func (h *KubernetesHandler) ListServices(c *gin.Context) {
	if h.kubernetesService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Kubernetes integration not configured"))
		return
	}

	namespace := c.Query("namespace")

	services, err := h.kubernetesService.GetServices(namespace)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list services", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"namespace": namespace,
		"services":  services,
		"total":     len(services),
	})
}

func (h *KubernetesHandler) ListNamespaces(c *gin.Context) {
	if h.kubernetesService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Kubernetes integration not configured"))
		return
	}

	namespaces, err := h.kubernetesService.GetNamespaces()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list namespaces", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"namespaces": namespaces,
		"total":      len(namespaces),
	})
}

func (h *KubernetesHandler) ListNodes(c *gin.Context) {
	if h.kubernetesService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Kubernetes integration not configured"))
		return
	}

	nodes, err := h.kubernetesService.GetNodes()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list nodes", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"nodes": nodes,
		"total": len(nodes),
	})
}
