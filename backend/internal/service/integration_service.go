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

func (s *IntegrationService) Delete(id int) error {
	s.log.Infow("Deleting integration", "id", id)

	err := s.repo.Delete(id)
	if err != nil {
		s.log.Errorw("Failed to delete integration", "error", err, "id", id)
		return err
	}

	s.log.Info("Integration deleted successfully")
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

func (s *IntegrationService) GetKubernetesConfig() (*domain.KubernetesConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeKubernetes))
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

func (s *IntegrationService) GetAllKubernetesConfigs() (map[string]*domain.KubernetesConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeKubernetes))
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

func (s *IntegrationService) GetGrafanaConfig() (*domain.GrafanaConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeGrafana))
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

func (s *IntegrationService) GetAllGrafanaConfigs() (map[string]*domain.GrafanaConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGrafana))
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

func (s *IntegrationService) GetGitHubConfig() (*domain.GitHubConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeGitHub))
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

func (s *IntegrationService) GetAllGitHubConfigs() (map[string]*domain.GitHubConfig, error) {
	integrations, err := s.repo.GetAllByType(string(domain.IntegrationTypeGitHub))
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

func (s *IntegrationService) GetJiraConfig() (*domain.JiraConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeJira))
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

func (s *IntegrationService) GetJiraService() (*JiraService, error) {
	config, err := s.GetJiraConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Jira integration not configured")
	}

	return NewJiraService(*config, s.log), nil
}

func (s *IntegrationService) GetSlackConfig() (*domain.SlackConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeSlack))
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

func (s *IntegrationService) GetSlackService() (*SlackService, error) {
	config, err := s.GetSlackConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Slack integration not configured")
	}

	return NewSlackService(*config, s.log), nil
}

func (s *IntegrationService) GetTeamsConfig() (*domain.TeamsConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeTeams))
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

func (s *IntegrationService) GetTeamsService() (*TeamsService, error) {
	config, err := s.GetTeamsConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Teams integration not configured")
	}

	return NewTeamsService(*config, s.log), nil
}

// ArgoCD methods
func (s *IntegrationService) GetArgoCDConfig() (*domain.ArgoCDConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeArgoCD))
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

func (s *IntegrationService) GetArgoCDService() (*ArgoCDService, error) {
	config, err := s.GetArgoCDConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("ArgoCD integration not configured")
	}

	return NewArgoCDService(*config, s.log), nil
}

// Prometheus methods
func (s *IntegrationService) GetPrometheusConfig() (*domain.PrometheusConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypePrometheus))
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

func (s *IntegrationService) GetPrometheusService() (*PrometheusService, error) {
	config, err := s.GetPrometheusConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Prometheus integration not configured")
	}

	return NewPrometheusService(*config, s.log), nil
}

// Loki methods
func (s *IntegrationService) GetLokiConfig() (*domain.LokiConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeLoki))
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

func (s *IntegrationService) GetLokiService() (*LokiService, error) {
	config, err := s.GetLokiConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Loki integration not configured")
	}

	return NewLokiService(*config, s.log), nil
}

// Redis methods
func (s *IntegrationService) GetRedisConfig() (*domain.RedisConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeRedis))
	if err != nil {
		return nil, err
	}

	if integration == nil {
		return nil, nil
	}

	var config domain.RedisIntegrationConfig
	if err := json.Unmarshal(integration.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse Redis config: %w", err)
	}

	return &domain.RedisConfig{
		Host:     config.Host,
		Port:     config.Port,
		Password: config.Password,
		DB:       config.DB,
	}, nil
}

func (s *IntegrationService) GetCacheService() (*CacheService, error) {
	config, err := s.GetRedisConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Redis integration not configured")
	}

	return NewCacheService(*config, s.log)
}

// Vault methods
func (s *IntegrationService) GetVaultConfig() (*domain.VaultConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeVault))
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

func (s *IntegrationService) GetVaultService() (*VaultService, error) {
	config, err := s.GetVaultConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("Vault integration not configured")
	}

	return NewVaultService(*config, s.log), nil
}

// AWS Secrets Manager methods
func (s *IntegrationService) GetAWSSecretsConfig() (*domain.AWSSecretsConfig, error) {
	integration, err := s.repo.GetByType(string(domain.IntegrationTypeAWSSecrets))
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

func (s *IntegrationService) GetAWSSecretsService() (*AWSSecretsService, error) {
	config, err := s.GetAWSSecretsConfig()
	if err != nil {
		return nil, err
	}

	if config == nil {
		return nil, fmt.Errorf("AWS Secrets Manager integration not configured")
	}

	return NewAWSSecretsService(*config, s.log)
}
