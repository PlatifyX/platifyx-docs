package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/kubernetes"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type KubernetesService struct {
	client *kubernetes.Client
	log    *logger.Logger
}

func NewKubernetesService(config domain.KubernetesConfig, log *logger.Logger) (*KubernetesService, error) {
	client, err := kubernetes.NewClient(config)
	if err != nil {
		return nil, err
	}

	return &KubernetesService{
		client: client,
		log:    log,
	}, nil
}

func (k *KubernetesService) GetClusterInfo() (*domain.KubernetesCluster, error) {
	k.log.Info("Fetching Kubernetes cluster information")

	cluster, err := k.client.GetClusterInfo()
	if err != nil {
		k.log.Errorw("Failed to fetch cluster info", "error", err)
		return nil, err
	}

	k.log.Infow("Fetched cluster info successfully", "cluster", cluster.Name)
	return cluster, nil
}

func (k *KubernetesService) GetPods(namespace string) ([]domain.KubernetesPod, error) {
	k.log.Infow("Fetching Kubernetes pods", "namespace", namespace)

	pods, err := k.client.ListPods(namespace)
	if err != nil {
		k.log.Errorw("Failed to fetch pods", "error", err, "namespace", namespace)
		return nil, err
	}

	k.log.Infow("Fetched pods successfully", "count", len(pods), "namespace", namespace)
	return pods, nil
}

func (k *KubernetesService) GetDeployments(namespace string) ([]domain.KubernetesDeployment, error) {
	k.log.Infow("Fetching Kubernetes deployments", "namespace", namespace)

	deployments, err := k.client.ListDeployments(namespace)
	if err != nil {
		k.log.Errorw("Failed to fetch deployments", "error", err, "namespace", namespace)
		return nil, err
	}

	k.log.Infow("Fetched deployments successfully", "count", len(deployments), "namespace", namespace)
	return deployments, nil
}

func (k *KubernetesService) GetServices(namespace string) ([]domain.KubernetesService, error) {
	k.log.Infow("Fetching Kubernetes services", "namespace", namespace)

	services, err := k.client.ListServices(namespace)
	if err != nil {
		k.log.Errorw("Failed to fetch services", "error", err, "namespace", namespace)
		return nil, err
	}

	k.log.Infow("Fetched services successfully", "count", len(services), "namespace", namespace)
	return services, nil
}

func (k *KubernetesService) GetNamespaces() ([]domain.KubernetesNamespace, error) {
	k.log.Info("Fetching Kubernetes namespaces")

	namespaces, err := k.client.ListNamespaces()
	if err != nil {
		k.log.Errorw("Failed to fetch namespaces", "error", err)
		return nil, err
	}

	k.log.Infow("Fetched namespaces successfully", "count", len(namespaces))
	return namespaces, nil
}

func (k *KubernetesService) GetNodes() ([]domain.KubernetesNode, error) {
	k.log.Info("Fetching Kubernetes nodes")

	nodes, err := k.client.ListNodes()
	if err != nil {
		k.log.Errorw("Failed to fetch nodes", "error", err)
		return nil, err
	}

	k.log.Infow("Fetched nodes successfully", "count", len(nodes))
	return nodes, nil
}
