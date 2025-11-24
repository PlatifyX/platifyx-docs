package service

import (
	"encoding/json"
	"fmt"

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

func (s *IntegrationService) GetAll(organizationUUID string) ([]domain.Integration, error) {
	s.log.Infow("Fetching all integrations", "organizationUUID", organizationUUID)

	integrations, err := s.repo.GetAll(organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch integrations", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched integrations successfully", "count", len(integrations))
	return integrations, nil
}

func (s *IntegrationService) GetByID(id int, organizationUUID string) (*domain.Integration, error) {
	s.log.Infow("Fetching integration by ID", "id", id, "organizationUUID", organizationUUID)

	integration, err := s.repo.GetByID(id, organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch integration", "error", err, "id", id)
		return nil, err
	}

	return integration, nil
}

func (s *IntegrationService) GetByType(integrationType string, organizationUUID string) (*domain.Integration, error) {
	s.log.Infow("Fetching integration by type", "type", integrationType, "organizationUUID", organizationUUID)

	integration, err := s.repo.GetByType(integrationType, organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch integration", "error", err, "type", integrationType)
		return nil, err
	}

	return integration, nil
}

func (s *IntegrationService) Create(integration *domain.Integration, organizationUUID string) error {
	s.log.Infow("Creating integration", "name", integration.Name, "type", integration.Type, "organizationUUID", organizationUUID)

	var config map[string]interface{}
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal config", "error", err)
		return err
	}

	created, err := s.repo.Create(integration.Name, integration.Type, organizationUUID, integration.Enabled, config)
	if err != nil {
		s.log.Errorw("Failed to create integration", "error", err)
		return err
	}

	// Update the integration with the created values
	integration.ID = created.ID
	integration.OrganizationUUID = created.OrganizationUUID
	integration.CreatedAt = created.CreatedAt
	integration.UpdatedAt = created.UpdatedAt

	s.log.Infow("Integration created successfully", "id", integration.ID)
	return nil
}

func (s *IntegrationService) Update(id int, organizationUUID string, enabled bool, config map[string]interface{}) error {
	s.log.Infow("Updating integration", "id", id, "enabled", enabled, "organizationUUID", organizationUUID)

	err := s.repo.Update(id, organizationUUID, enabled, config)
	if err != nil {
		s.log.Errorw("Failed to update integration", "error", err, "id", id)
		return err
	}

	s.log.Info("Integration updated successfully")
	return nil
}

func (s *IntegrationService) Delete(id int, organizationUUID string) error {
	s.log.Infow("Deleting integration", "id", id, "organizationUUID", organizationUUID)

	err := s.repo.Delete(id, organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to delete integration", "error", err, "id", id)
		return err
	}

	s.log.Info("Integration deleted successfully")
	return nil
}

func (s *IntegrationService) GetAzureDevOpsConfig(organizationUUID string) (*domain.AzureDevOpsConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeAzureDevOps), organizationUUID)
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

func (s *IntegrationService) GetAllAzureDevOpsConfigs(organizationUUID string) (map[string]*domain.AzureDevOpsConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAzureDevOps), organizationUUID)
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

func (s *IntegrationService) GetSonarQubeConfig(organizationUUID string) (*domain.SonarQubeConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeSonarQube), organizationUUID)
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

func (s *IntegrationService) GetAllSonarQubeConfigs(organizationUUID string) (map[string]*domain.SonarQubeConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeSonarQube), organizationUUID)
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
func (s *IntegrationService) GetAllAzureCloudConfigs(organizationUUID string) (map[string]*domain.AzureCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAzureCloud), organizationUUID)
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

func (s *IntegrationService) GetAllGCPConfigs(organizationUUID string) (map[string]*domain.GCPCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGCP), organizationUUID)
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

func (s *IntegrationService) GetAllAWSConfigs(organizationUUID string) (map[string]*domain.AWSCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAWS), organizationUUID)
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

func (s *IntegrationService) GetAWSConfigByName(name string, organizationUUID string) (*domain.AWSCloudConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeAWS), organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch AWS integrations", "error", err)
		return nil, err
	}

	for _, integration := range integrations {
		if integration.Name == name && integration.Enabled {
			var config domain.AWSCloudIntegrationConfig
			if err := json.Unmarshal(integration.Config, &config); err != nil {
				s.log.Errorw("Failed to unmarshal AWS config", "error", err, "integration", integration.Name)
				return nil, err
			}

			return &domain.AWSCloudConfig{
				AccessKeyID:     config.AccessKeyID,
				SecretAccessKey: config.SecretAccessKey,
				Region:          config.Region,
			}, nil
		}
	}

	return nil, fmt.Errorf("AWS integration '%s' not found or disabled", name)
}

func (s *IntegrationService) GetKubernetesConfig(organizationUUID string) (*domain.KubernetesConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeKubernetes), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.KubernetesIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Kubernetes config", "error", err)
		return nil, err
	}

	return &domain.KubernetesConfig{
		KubeConfig: config.KubeConfig,
		Context:    config.Context,
	}, nil
}

func (s *IntegrationService) GetAllKubernetesConfigs(organizationUUID string) (map[string]*domain.KubernetesConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeKubernetes), organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch Kubernetes integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.KubernetesConfig)
	for _, integration := range integrations {
		if !integration.Enabled {
			continue
		}

		var config domain.KubernetesIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal Kubernetes config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.KubernetesConfig{
			KubeConfig: config.KubeConfig,
			Context:    config.Context,
		}
	}

	return configs, nil
}

func (s *IntegrationService) GetGrafanaConfig(organizationUUID string) (*domain.GrafanaConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeGrafana), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.GrafanaIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Grafana config", "error", err)
		return nil, err
	}

	return &domain.GrafanaConfig{
		URL:    config.URL,
		APIKey: config.APIKey,
	}, nil
}

func (s *IntegrationService) GetAllGrafanaConfigs(organizationUUID string) (map[string]*domain.GrafanaConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGrafana), organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch Grafana integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.GrafanaConfig)
	for _, integration := range integrations {
		if !integration.Enabled {
			continue
		}

		var config domain.GrafanaIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal Grafana config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.GrafanaConfig{
			URL:    config.URL,
			APIKey: config.APIKey,
		}
	}

	return configs, nil
}

func (s *IntegrationService) GetGitHubConfig(organizationUUID string) (*domain.GitHubConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeGitHub), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.GitHubIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal GitHub config", "error", err)
		return nil, err
	}

	return &domain.GitHubConfig{
		Token:        config.Token,
		Organization: config.Organization,
	}, nil
}

func (s *IntegrationService) GetAllGitHubConfigs(organizationUUID string) (map[string]*domain.GitHubConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGitHub), organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch GitHub integrations", "error", err)
		return nil, err
	}

	configs := make(map[string]*domain.GitHubConfig)
	for _, integration := range integrations {
		if !integration.Enabled {
			continue
		}

		var config domain.GitHubIntegrationConfig
		if err := json.Unmarshal(integration.Config, &config); err != nil {
			s.log.Errorw("Failed to unmarshal GitHub config", "error", err, "integration", integration.Name)
			continue
		}

		configs[integration.Name] = &domain.GitHubConfig{
			Token:        config.Token,
			Organization: config.Organization,
		}
	}

	return configs, nil
}

func (s *IntegrationService) GetGitHubConfigByName(name string, organizationUUID string) (*domain.GitHubConfig, error) {
	if name == "" {
		// If no name provided, return the first one (backward compatibility)
		return s.GetGitHubConfig(organizationUUID)
	}

	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGitHub), organizationUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch GitHub integrations", "error", err)
		return nil, err
	}

	s.log.Infow("Searching for GitHub integration", "requested_name", name, "total_integrations", len(integrations))

	for _, integration := range integrations {
		s.log.Debugw("Checking integration", "name", integration.Name, "enabled", integration.Enabled, "matches", integration.Name == name)
		if integration.Name == name && integration.Enabled {
			var config domain.GitHubIntegrationConfig
			if err := json.Unmarshal(integration.Config, &config); err != nil {
				s.log.Errorw("Failed to unmarshal GitHub config", "error", err, "integration", integration.Name)
				return nil, err
			}

			s.log.Infow("Found matching GitHub integration", "name", name)
			return &domain.GitHubConfig{
				Token:        config.Token,
				Organization: config.Organization,
			}, nil
		}
	}

	// Integration with this name not found
	s.log.Warnw("GitHub integration not found", "requested_name", name, "available_count", len(integrations))
	return nil, nil
}

func (s *IntegrationService) GetJiraConfig(organizationUUID string) (*domain.JiraConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeJira), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.JiraIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Jira config", "error", err)
		return nil, err
	}

	return &domain.JiraConfig{
		URL:      config.URL,
		Email:    config.Email,
		APIToken: config.APIToken,
	}, nil
}

func (s *IntegrationService) GetJiraService(organizationUUID string) (*JiraService, error) {
	config, err := s.GetJiraConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Jira integration not configured")
	}

	return NewJiraService(*config, s.log), nil
}

func (s *IntegrationService) GetSlackConfig(organizationUUID string) (*domain.SlackConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeSlack), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.SlackIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Slack config", "error", err)
		return nil, err
	}

	return &domain.SlackConfig{
		WebhookURL: config.WebhookURL,
		BotToken:   config.BotToken,
	}, nil
}

func (s *IntegrationService) GetSlackService(organizationUUID string) (*SlackService, error) {
	config, err := s.GetSlackConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Slack integration not configured")
	}

	return NewSlackService(*config, s.log), nil
}

func (s *IntegrationService) GetTeamsConfig(organizationUUID string) (*domain.TeamsConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeTeams), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.TeamsIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Teams config", "error", err)
		return nil, err
	}

	return &domain.TeamsConfig{
		WebhookURL: config.WebhookURL,
	}, nil
}

func (s *IntegrationService) GetTeamsService(organizationUUID string) (*TeamsService, error) {
	config, err := s.GetTeamsConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Teams integration not configured")
	}

	return NewTeamsService(*config, s.log), nil
}

// ArgoCD methods
func (s *IntegrationService) GetArgoCDConfig(organizationUUID string) (*domain.ArgoCDConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeArgoCD), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, nil
	}

	var config domain.ArgoCDIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse ArgoCD config: %w", err)
	}

	return &domain.ArgoCDConfig{
		ServerURL: config.ServerURL,
		AuthToken: config.AuthToken,
		Insecure:  config.Insecure,
	}, nil
}

func (s *IntegrationService) GetArgoCDService(organizationUUID string) (*ArgoCDService, error) {
	config, err := s.GetArgoCDConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("ArgoCD integration not configured")
	}

	return NewArgoCDService(*config, s.log), nil
}

// Prometheus methods
func (s *IntegrationService) GetPrometheusConfig(organizationUUID string) (*domain.PrometheusConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypePrometheus), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, nil
	}

	var config domain.PrometheusIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse Prometheus config: %w", err)
	}

	return &domain.PrometheusConfig{
		URL:      config.URL,
		Username: config.Username,
		Password: config.Password,
	}, nil
}

func (s *IntegrationService) GetPrometheusService(organizationUUID string) (*PrometheusService, error) {
	config, err := s.GetPrometheusConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Prometheus integration not configured")
	}

	return NewPrometheusService(*config, s.log), nil
}

// Loki methods
func (s *IntegrationService) GetLokiConfig(organizationUUID string) (*domain.LokiConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeLoki), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, nil
	}

	var config domain.LokiIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse Loki config: %w", err)
	}

	return &domain.LokiConfig{
		URL:      config.URL,
		Username: config.Username,
		Password: config.Password,
	}, nil
}

func (s *IntegrationService) GetLokiService(organizationUUID string) (*LokiService, error) {
	config, err := s.GetLokiConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Loki integration not configured")
	}

	return NewLokiService(*config, s.log), nil
}

// Vault methods
func (s *IntegrationService) GetVaultConfig(organizationUUID string) (*domain.VaultConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeVault), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, nil
	}

	var config domain.VaultIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse Vault config: %w", err)
	}

	return &domain.VaultConfig{
		Address:   config.Address,
		Token:     config.Token,
		Namespace: config.Namespace,
	}, nil
}

func (s *IntegrationService) GetVaultService(organizationUUID string) (*VaultService, error) {
	config, err := s.GetVaultConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Vault integration not configured")
	}

	return NewVaultService(*config, s.log), nil
}

// AWS Secrets Manager methods
func (s *IntegrationService) GetAWSSecretsConfig(organizationUUID string) (*domain.AWSSecretsConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeAWSSecrets), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, nil
	}

	var config domain.AWSSecretsIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse AWS Secrets config: %w", err)
	}

	return &domain.AWSSecretsConfig{
		AccessKeyID:     config.AccessKeyID,
		SecretAccessKey: config.SecretAccessKey,
		Region:          config.Region,
		SessionToken:    config.SessionToken,
	}, nil
}

func (s *IntegrationService) GetAWSSecretsService(organizationUUID string) (*AWSSecretsService, error) {
	config, err := s.GetAWSSecretsConfig(organizationUUID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("AWS Secrets Manager integration not configured")
	}

	return NewAWSSecretsService(*config, s.log)
}

// GetAWSConfigByID retorna a configuração AWS de uma integração específica por ID
func (s *IntegrationService) GetAWSConfigByID(integrationID int, organizationUUID string) (*domain.AWSSecretsConfig, error) {
	integration, err := s.repo.GetByID(integrationID, organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, fmt.Errorf("integration not found")
	}

	if integration.Type != string(domain.IntegrationTypeAWS) && integration.Type != string(domain.IntegrationTypeAWSSecrets) {
		return nil, fmt.Errorf("integration is not an AWS integration")
	}

	if !integration.Enabled {
		return nil, fmt.Errorf("integration is disabled")
	}

	var config domain.AWSCloudIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse AWS config: %w", err)
	}

	return &domain.AWSSecretsConfig{
		AccessKeyID:     config.AccessKeyID,
		SecretAccessKey: config.SecretAccessKey,
		Region:          config.Region,
	}, nil
}

// GetAWSSecretsServiceByID cria um serviço AWS Secrets a partir de uma integração específica
func (s *IntegrationService) GetAWSSecretsServiceByID(integrationID int, organizationUUID string) (*AWSSecretsService, error) {
	config, err := s.GetAWSConfigByID(integrationID, organizationUUID)
	if err != nil {
		return nil, err
	}

	return NewAWSSecretsService(*config, s.log)
}

// GetVaultConfigByID retorna a configuração Vault de uma integração específica por ID
func (s *IntegrationService) GetVaultConfigByID(integrationID int, organizationUUID string) (*domain.VaultConfig, error) {
	integration, err := s.repo.GetByID(integrationID, organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, fmt.Errorf("integration not found")
	}

	if integration.Type != string(domain.IntegrationTypeVault) {
		return nil, fmt.Errorf("integration is not a Vault integration")
	}

	if !integration.Enabled {
		return nil, fmt.Errorf("integration is disabled")
	}

	var config domain.VaultIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse Vault config: %w", err)
	}

	return &domain.VaultConfig{
		Address:   config.Address,
		Token:     config.Token,
		Namespace: config.Namespace,
	}, nil
}

// GetVaultServiceByID cria um serviço Vault a partir de uma integração específica
func (s *IntegrationService) GetVaultServiceByID(integrationID int, organizationUUID string) (*VaultService, error) {
	config, err := s.GetVaultConfigByID(integrationID, organizationUUID)
	if err != nil {
		return nil, err
	}

	return NewVaultService(*config, s.log), nil
}

// AI Provider methods
func (s *IntegrationService) GetOpenAIConfig(organizationUUID string) (*domain.OpenAIIntegrationConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeOpenAI), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.OpenAIIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal OpenAI config", "error", err)
		return nil, err
	}

	return &config, nil
}

func (s *IntegrationService) GetClaudeConfig(organizationUUID string) (*domain.ClaudeIntegrationConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeClaude), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.ClaudeIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Claude config", "error", err)
		return nil, err
	}

	return &config, nil
}

func (s *IntegrationService) GetGeminiConfig(organizationUUID string) (*domain.GeminiIntegrationConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeGemini), organizationUUID)
	if err != nil {
		return nil, err
	}

	if integration == nil || !integration.Enabled {
		return nil, nil
	}

	var config domain.GeminiIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		s.log.Errorw("Failed to unmarshal Gemini config", "error", err)
		return nil, err
	}

	return &config, nil
}
