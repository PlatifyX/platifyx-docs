package service

type KubernetesService struct{}

func NewKubernetesService() *KubernetesService {
	return &KubernetesService{}
}

func (k *KubernetesService) GetClusters() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":     "production-us-east",
			"provider": "GKE",
			"region":   "us-east1",
			"nodes":    12,
			"status":   "healthy",
			"version":  "1.28.3",
		},
		{
			"name":     "production-eu-west",
			"provider": "AKS",
			"region":   "eu-west1",
			"nodes":    8,
			"status":   "healthy",
			"version":  "1.28.2",
		},
		{
			"name":     "staging",
			"provider": "EKS",
			"region":   "us-west-2",
			"nodes":    4,
			"status":   "healthy",
			"version":  "1.28.1",
		},
	}
}

func (k *KubernetesService) GetPods(namespace string) []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":      "api-gateway-7d5c8f9b4-x8k2m",
			"namespace": namespace,
			"status":    "Running",
			"ready":     "2/2",
			"restarts":  0,
			"age":       "2h",
			"node":      "node-1",
		},
		{
			"name":      "auth-service-5f6d7c8a9-p4r2t",
			"namespace": namespace,
			"status":    "Running",
			"ready":     "1/1",
			"restarts":  0,
			"age":       "5h",
			"node":      "node-2",
		},
		{
			"name":      "payment-service-9a8b7c6d5-m9n3k",
			"namespace": namespace,
			"status":    "Running",
			"ready":     "2/2",
			"restarts":  1,
			"age":       "1d",
			"node":      "node-3",
		},
	}
}
