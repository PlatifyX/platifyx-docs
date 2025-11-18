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

func (s *IntegrationService) Create(integration *domain.Integration) error {
	s.log.Infow("Creating integration", "name", integration.Name, "type", integration.Type)

	var config map[string]interface{}
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal config", "error", err)
		return err
	}

	created, err := s.repo.Create(integration.Name, integration.Type, integration.Enabled, config)
	if err != nil {
		s.log.Errorw("Failed to create integration", "error", err)
		return err
	}

	// Update the integration with the created values
	integration.ID = created.ID
	integration.CreatedAt = created.CreatedAt
	integration.UpdatedAt = created.UpdatedAt

	s.log.Infow("Integration created successfully", "id", integration.ID)
	return nil
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

func (s *IntegrationService) GetAllAzureDevOpsConfigs() (map[string]*domain.AzureDevOpsConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAzureDevOps))
	if err != nil {
		s.log.Errorw("Failed to fetch Azure DevOps integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.AzureDevOpsConfig)
	for _, integration := range integrations {
		var config domain.AzureDevOpsIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal Azure DevOps config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.AzureDevOpsConfig{
			Organization: config.Organization,
			Project:      config.Project,
			PAT:          config.PAT,
		}
	}

	return configs, nil
}

func (s *IntegrationService) GetSonarQubeConfig() (*domain.SonarQubeConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeSonarQube))
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.SonarQubeIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal SonarQube config", "error", err)
		return nil, err
	}

	return &domain.SonarQubeConfig{
		URL:   config.URL,
		Token: config.Token,
	}, nil
}

func (s *IntegrationService) GetAllSonarQubeConfigs() (map[string]*domain.SonarQubeConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeSonarQube))
	if err != nil {
		s.log.Errorw("Failed to fetch SonarQube integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.SonarQubeConfig)
	for _, integration := range integrations {
		var config domain.SonarQubeIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal SonarQube config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.SonarQubeConfig{
			URL:   config.URL,
			Token: config.Token,
		}
	}

	return configs, nil
}

// Cloud provider config methods
func (s *IntegrationService) GetAllAzureCloudConfigs() (map[string]*domain.AzureCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAzureCloud))
	if err != nil {
		s.log.Errorw("Failed to fetch Azure Cloud integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.AzureCloudConfig)
	for _, integration := range integrations {
		if !integration.Enabled {
			continue
		}

		var config domain.AzureCloudIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal Azure Cloud config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.AzureCloudConfig{
			SubscriptionID: config.SubscriptionID,
			TenantID:       config.TenantID,
			ClientID:       config.ClientID,
			ClientSecret:   config.ClientSecret,
		}
	}

	return configs, nil
}

func (s *IntegrationService) GetAllGCPConfigs() (map[string]*domain.GCPCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGCP))
	if err != nil {
		s.log.Errorw("Failed to fetch GCP integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.GCPCloudConfig)
	for _, integration := range integrations {
		if !integration.Enabled {
			continue
		}

		var config domain.GCPCloudIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal GCP config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.GCPCloudConfig{
			ProjectID:          config.ProjectID,
			ServiceAccountJSON: config.ServiceAccountJSON,
		}
	}

	return configs, nil
}

func (s *IntegrationService) GetAllAWSConfigs() (map[string]*domain.AWSCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAWS))
	if err != nil {
		s.log.Errorw("Failed to fetch AWS integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.AWSCloudConfig)
	for _, integration := range integrations {
		if !integration.Enabled {
			continue
		}

		var config domain.AWSCloudIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal AWS config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.AWSCloudConfig{
			AccessKeyID:     config.AccessKeyID,
			SecretAccessKey: config.SecretAccessKey,
			Region:          config.Region,
		}
	}

	return configs, nil
}
