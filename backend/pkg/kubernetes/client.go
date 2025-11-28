package kubernetes

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type Client struct {
	clientset *kubernetes.Clientset
	config    *rest.Config
	context   string
}

func NewClient(cfg domain.KubernetesConfig) (*Client, error) {
	config, err := clientcmd.RESTConfigFromKubeConfig([]byte(cfg.KubeConfig))
	if err != nil {
		// Try loading from default kubeconfig if direct config fails
		loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
		configOverrides := &clientcmd.ConfigOverrides{}
		if cfg.Context != "" {
			configOverrides.CurrentContext = cfg.Context
		}
		kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)
		config, err = kubeConfig.ClientConfig()
		if err != nil {
			return nil, fmt.Errorf("failed to create kubernetes config: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientset: %w", err)
	}

	return &Client{
		clientset: clientset,
		config:    config,
		context:   cfg.Context,
	}, nil
}

func (c *Client) GetClusterInfo() (*domain.KubernetesCluster, error) {
	ctx := context.Background()

	// Get server version
	version, err := c.clientset.Discovery().ServerVersion()
	if err != nil {
		return nil, fmt.Errorf("failed to get server version: %w", err)
	}

	// Get nodes to count them
	nodes, err := c.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	cluster := &domain.KubernetesCluster{
		Name:      c.context,
		Context:   c.context,
		Server:    c.config.Host,
		Version:   version.GitVersion,
		NodeCount: len(nodes.Items),
		Status:    "healthy",
	}

	return cluster, nil
}

func (c *Client) ListPods(namespace string) ([]domain.KubernetesPod, error) {
	ctx := context.Background()

	if namespace == "" {
		namespace = metav1.NamespaceAll
	}

	podList, err := c.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	pods := make([]domain.KubernetesPod, 0, len(podList.Items))
	for _, pod := range podList.Items {
		// Calculate ready containers
		readyContainers := 0
		totalContainers := len(pod.Status.ContainerStatuses)
		for _, cs := range pod.Status.ContainerStatuses {
			if cs.Ready {
				readyContainers++
			}
		}

		// Calculate restarts
		var restarts int32
		for _, cs := range pod.Status.ContainerStatuses {
			restarts += cs.RestartCount
		}

		// Calculate age
		age := time.Since(pod.CreationTimestamp.Time).Round(time.Second).String()

		// Get node name
		nodeName := pod.Spec.NodeName
		if nodeName == "" {
			nodeName = "pending"
		}

		pods = append(pods, domain.KubernetesPod{
			Name:              pod.Name,
			Namespace:         pod.Namespace,
			Status:            string(pod.Status.Phase),
			Ready:             fmt.Sprintf("%d/%d", readyContainers, totalContainers),
			Restarts:          restarts,
			Age:               age,
			Node:              nodeName,
			IP:                pod.Status.PodIP,
			Labels:            pod.Labels,
			CreationTimestamp: pod.CreationTimestamp.Time,
		})
	}

	return pods, nil
}

func (c *Client) ListDeployments(namespace string) ([]domain.KubernetesDeployment, error) {
	ctx := context.Background()

	if namespace == "" {
		namespace = metav1.NamespaceAll
	}

	deploymentList, err := c.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list deployments: %w", err)
	}

	deployments := make([]domain.KubernetesDeployment, 0, len(deploymentList.Items))
	for _, deploy := range deploymentList.Items {
		replicas := int32(0)
		if deploy.Spec.Replicas != nil {
			replicas = *deploy.Spec.Replicas
		}

		deployments = append(deployments, domain.KubernetesDeployment{
			Name:              deploy.Name,
			Namespace:         deploy.Namespace,
			Replicas:          replicas,
			ReadyReplicas:     deploy.Status.ReadyReplicas,
			AvailableReplicas: deploy.Status.AvailableReplicas,
			UpdatedReplicas:   deploy.Status.UpdatedReplicas,
			Labels:            deploy.Labels,
			CreationTimestamp: deploy.CreationTimestamp.Time,
		})
	}

	return deployments, nil
}

func (c *Client) ListServices(namespace string) ([]domain.KubernetesService, error) {
	ctx := context.Background()

	if namespace == "" {
		namespace = metav1.NamespaceAll
	}

	serviceList, err := c.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list services: %w", err)
	}

	services := make([]domain.KubernetesService, 0, len(serviceList.Items))
	for _, svc := range serviceList.Items {
		// Convert ports
		ports := make([]domain.ServicePort, 0, len(svc.Spec.Ports))
		for _, port := range svc.Spec.Ports {
			ports = append(ports, domain.ServicePort{
				Name:       port.Name,
				Protocol:   string(port.Protocol),
				Port:       port.Port,
				TargetPort: port.TargetPort.String(),
				NodePort:   port.NodePort,
			})
		}

		// Get external IPs
		externalIPs := svc.Spec.ExternalIPs
		if len(svc.Status.LoadBalancer.Ingress) > 0 {
			for _, ingress := range svc.Status.LoadBalancer.Ingress {
				if ingress.IP != "" {
					externalIPs = append(externalIPs, ingress.IP)
				}
			}
		}

		services = append(services, domain.KubernetesService{
			Name:              svc.Name,
			Namespace:         svc.Namespace,
			Type:              string(svc.Spec.Type),
			ClusterIP:         svc.Spec.ClusterIP,
			ExternalIP:        externalIPs,
			Ports:             ports,
			Labels:            svc.Labels,
			CreationTimestamp: svc.CreationTimestamp.Time,
		})
	}

	return services, nil
}

func (c *Client) ListNamespaces() ([]domain.KubernetesNamespace, error) {
	ctx := context.Background()

	namespaceList, err := c.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}

	namespaces := make([]domain.KubernetesNamespace, 0, len(namespaceList.Items))
	for _, ns := range namespaceList.Items {
		namespaces = append(namespaces, domain.KubernetesNamespace{
			Name:              ns.Name,
			Status:            string(ns.Status.Phase),
			Labels:            ns.Labels,
			CreationTimestamp: ns.CreationTimestamp.Time,
		})
	}

	return namespaces, nil
}

func (c *Client) ListNodes() ([]domain.KubernetesNode, error) {
	ctx := context.Background()

	nodeList, err := c.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	nodes := make([]domain.KubernetesNode, 0, len(nodeList.Items))
	for _, node := range nodeList.Items {
		// Get node status
		status := "NotReady"
		for _, condition := range node.Status.Conditions {
			if condition.Type == "Ready" {
				if condition.Status == "True" {
					status = "Ready"
				}
				break
			}
		}

		// Get roles
		roles := make([]string, 0)
		for label := range node.Labels {
			if label == "node-role.kubernetes.io/master" || label == "node-role.kubernetes.io/control-plane" {
				roles = append(roles, "master")
			} else if label == "node-role.kubernetes.io/worker" {
				roles = append(roles, "worker")
			}
		}
		if len(roles) == 0 {
			roles = append(roles, "worker")
		}

		// Get IPs
		internalIP := ""
		externalIP := ""
		for _, addr := range node.Status.Addresses {
			if addr.Type == "InternalIP" {
				internalIP = addr.Address
			} else if addr.Type == "ExternalIP" {
				externalIP = addr.Address
			}
		}

		// Calculate age
		age := time.Since(node.CreationTimestamp.Time).Round(time.Second).String()

		nodes = append(nodes, domain.KubernetesNode{
			Name:              node.Name,
			Status:            status,
			Roles:             roles,
			Age:               age,
			Version:           node.Status.NodeInfo.KubeletVersion,
			InternalIP:        internalIP,
			ExternalIP:        externalIP,
			OS:                node.Status.NodeInfo.OperatingSystem,
			KernelVersion:     node.Status.NodeInfo.KernelVersion,
			ContainerRuntime:  node.Status.NodeInfo.ContainerRuntimeVersion,
			Labels:            node.Labels,
			CreationTimestamp: node.CreationTimestamp.Time,
		})
	}

	return nodes, nil
}

// GetClientset returns the Kubernetes clientset
func (c *Client) GetClientset() *kubernetes.Clientset {
	return c.clientset
}

// GetPodLogs retrieves logs from a specific pod
func (c *Client) GetPodLogs(namespace, podName, container, tailLines string) (string, error) {
	ctx := context.Background()

	// Parse tail lines to int64
	var tail int64 = 100
	if tailLines != "" {
		parsed, err := strconv.ParseInt(tailLines, 10, 64)
		if err == nil && parsed > 0 {
			tail = parsed
		}
	}

	podLogOpts := corev1.PodLogOptions{
		TailLines: &tail,
	}

	// Se um container específico foi fornecido, use-o
	if container != "" {
		podLogOpts.Container = container
	}

	req := c.clientset.CoreV1().Pods(namespace).GetLogs(podName, &podLogOpts)
	podLogs, err := req.Stream(ctx)
	if err != nil {
		return "", fmt.Errorf("error opening log stream: %w", err)
	}
	defer podLogs.Close()

	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, podLogs)
	if err != nil {
		return "", fmt.Errorf("error reading log stream: %w", err)
	}

	return buf.String(), nil
}
