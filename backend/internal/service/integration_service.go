package service

import (
	"encoding/json"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type IntegrationService struct {
	repo *repository.IntegrationRepository
	log  *logger.Logger
}

func NewIntegrationService(repo *repository.IntegrationRepository, log *logger.Logger) *IntegrationService {
	return &IntegrationService{
		repo: repo,
		log:  log,
	}
}

func (s *IntegrationService) GetAll() ([]domain.Integration, error) {
	s.log.Info("Fetching all integrations")

	integrations, err := s.repo.GetAll()
	if err != nil {
		s.log.Errorw("Failed to fetch integrations", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched integrations successfully", "count", len(integrations))
	return integrations, nil
}

func (s *IntegrationService) GetByID(id int) (*domain.Integration, error) {
	s.log.Infow("Fetching integration by ID", "id", id)

	integration, err := s.repo.GetByID(id)
	if err != nil {
		s.log.Errorw("Failed to fetch integration", "error", err, "id", id)
		return nil, err
	}

	return integration, nil
}

func (s *IntegrationService) GetByType(integrationType string) (*domain.Integration, error) {
	s.log.Infow("Fetching integration by type", "type", integrationType)

	integration, err := s.repo.GetByType(integrationType)
	if err != nil {
		s.log.Errorw("Failed to fetch integration", "error", err, "type", integrationType)
		return nil, err
	}

	return integration, nil
}

func (s *IntegrationService) Update(id int, enabled bool, config map[string]interface{}) error {
	s.log.Infow("Updating integration", "id", id, "enabled", enabled)

	err := s.repo.Update(id, enabled, config)
	if err != nil {
		s.log.Errorw("Failed to update integration", "error", err, "id", id)
		return err
	}

	s.log.Info("Integration updated successfully")
	return nil
}

func (s *IntegrationService) GetAzureDevOpsConfig() (*domain.AzureDevOpsConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeAzureDevOps))
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.AzureDevOpsIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Azure DevOps config", "error", err)
		return nil, err
	}

	return &domain.AzureDevOpsConfig{
		Organization: config.Organization,
		Project:      config.Project,
		PAT:          config.PAT,
	}, nil
}
