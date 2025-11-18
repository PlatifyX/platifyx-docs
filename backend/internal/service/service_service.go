package service

import (
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type ServiceService struct {
	services []domain.Service
}

func NewServiceService() *ServiceService {
	return &ServiceService{
		services: getMockServices(),
	}
}

func (s *ServiceService) GetAll() []domain.Service {
	return s.services
}

func (s *ServiceService) GetByID(id string) (*domain.Service, error) {
	for _, svc := range s.services {
		if svc.ID == id {
			return &svc, nil
		}
	}
	return nil, fmt.Errorf("service not found")
}

func (s *ServiceService) Create(name, description, svcType string) domain.Service {
	newService := domain.Service{
		ID:          fmt.Sprintf("svc-%d", time.Now().Unix()),
		Name:        name,
		Description: description,
		Type:        svcType,
		Status:      "healthy",
		Version:     "v1.0.0",
		DeployedAt:  time.Now(),
		Owner:       "platform-team",
		Health: domain.Health{
			Status:       "healthy",
			Uptime:       99.9,
			SuccessRate:  99.5,
			ResponseTime: 120.0,
		},
	}

	s.services = append(s.services, newService)
	return newService
}

func getMockServices() []domain.Service {
	now := time.Now()

	return []domain.Service{
		{
			ID:          "svc-1",
			Name:        "api-gateway",
			Description: "Main API Gateway",
			Type:        "gateway",
			Status:      "healthy",
			Version:     "v2.4.1",
			DeployedAt:  now.Add(-2 * time.Hour),
			Owner:       "platform-team",
			Repository:  "github.com/platifyx/api-gateway",
			Health: domain.Health{
				Status:       "healthy",
				Uptime:       99.9,
				SuccessRate:  99.8,
				ResponseTime: 45.2,
			},
		},
		{
			ID:          "svc-2",
			Name:        "auth-service",
			Description: "Authentication and Authorization Service",
			Type:        "microservice",
			Status:      "healthy",
			Version:     "v1.8.0",
			DeployedAt:  now.Add(-5 * time.Hour),
			Owner:       "security-team",
			Repository:  "github.com/platifyx/auth-service",
			Health: domain.Health{
				Status:       "healthy",
				Uptime:       99.95,
				SuccessRate:  99.9,
				ResponseTime: 32.5,
			},
		},
		{
			ID:          "svc-3",
			Name:        "payment-service",
			Description: "Payment Processing Service",
			Type:        "microservice",
			Status:      "warning",
			Version:     "v3.2.1",
			DeployedAt:  now.Add(-24 * time.Hour),
			Owner:       "payments-team",
			Repository:  "github.com/platifyx/payment-service",
			Health: domain.Health{
				Status:       "warning",
				Uptime:       98.5,
				SuccessRate:  97.8,
				ResponseTime: 250.0,
			},
		},
		{
			ID:          "svc-4",
			Name:        "notification-service",
			Description: "Notification and Messaging Service",
			Type:        "microservice",
			Status:      "healthy",
			Version:     "v1.5.2",
			DeployedAt:  now.Add(-3 * time.Hour),
			Owner:       "platform-team",
			Repository:  "github.com/platifyx/notification-service",
			Health: domain.Health{
				Status:       "healthy",
				Uptime:       99.7,
				SuccessRate:  99.2,
				ResponseTime: 78.3,
			},
		},
	}
}
