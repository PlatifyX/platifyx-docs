package service

import "github.com/PlatifyX/platifyx-core/pkg/logger"

type ServiceManager struct {
	ServiceService    *ServiceService
	MetricsService    *MetricsService
	KubernetesService *KubernetesService
}

func NewServiceManager(log *logger.Logger) *ServiceManager {
	return &ServiceManager{
		ServiceService:    NewServiceService(),
		MetricsService:    NewMetricsService(),
		KubernetesService: NewKubernetesService(),
	}
}
