package service

import (
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/cloud"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type FinOpsService struct {
	integrationService *IntegrationService
	log                *logger.Logger
}

func NewFinOpsService(integrationService *IntegrationService, log *logger.Logger) *FinOpsService {
	return &FinOpsService{
		integrationService: integrationService,
		log:                log,
	}
}

// GetStats aggregates cost statistics from all cloud providers
func (s *FinOpsService) GetStats(provider, integration string) (*domain.FinOpsStats, error) {
	s.log.Info("Calculating FinOps statistics")

	allCosts, err := s.GetAllCosts(provider, integration)
	if err != nil {
		return nil, err
	}

	allResources, err := s.GetAllResources(provider, integration)
	if err != nil {
		return nil, err
	}

	// Calculate aggregated statistics
	stats := &domain.FinOpsStats{
		Currency:         "USD",
		CostByProvider:   make(map[string]float64),
		CostByService:    make(map[string]float64),
		TopCostResources: make([]domain.CloudResource, 0),
	}

	// Aggregate costs
	for _, cost := range allCosts {
		stats.TotalCost += cost.Cost
		if cost.Period == "monthly" {
			stats.MonthlyCost += cost.Cost
		}
		stats.CostByProvider[cost.Provider] += cost.Cost
		stats.CostByService[cost.ServiceName] += cost.Cost
	}

	// Daily cost estimation (monthly / 30)
	if stats.MonthlyCost > 0 {
		stats.DailyCost = stats.MonthlyCost / 30.0
	}

	// Cost trend (simulated - in production would compare with previous period)
	stats.CostTrend = 5.2 // 5.2% increase

	// Resource counts
	stats.TotalResources = len(allResources)
	for _, resource := range allResources {
		if resource.Status == "running" || resource.Status == "Running" ||
		   resource.Status == "RUNNING" || resource.Status == "Available" ||
		   resource.Status == "available" || resource.Status == "ACTIVE" {
			stats.ActiveResources++
		} else {
			stats.InactiveResources++
		}
	}

	// Top cost resources (top 5)
	topResources := make([]domain.CloudResource, 0)
	for _, resource := range allResources {
		if resource.Cost > 0 {
			topResources = append(topResources, resource)
		}
	}
	// Sort by cost (simple bubble sort for top 5)
	for i := 0; i < len(topResources) && i < 5; i++ {
		for j := i + 1; j < len(topResources); j++ {
			if topResources[j].Cost > topResources[i].Cost {
				topResources[i], topResources[j] = topResources[j], topResources[i]
			}
		}
	}
	if len(topResources) > 5 {
		stats.TopCostResources = topResources[:5]
	} else {
		stats.TopCostResources = topResources
	}

	return stats, nil
}

// GetAllCosts retrieves costs from all enabled cloud providers
func (s *FinOpsService) GetAllCosts(provider, integration string) ([]domain.CloudCost, error) {
	allCosts := make([]domain.CloudCost, 0)
	now := time.Now()
	startDate := now.AddDate(0, -1, 0) // Last month

	// Azure costs
	if provider == "" || provider == "azure" {
		azureConfigs, err := s.integrationService.GetAllAzureCloudConfigs()
		if err != nil {
			s.log.Errorw("Failed to get Azure configs", "error", err)
		} else {
			for name, config := range azureConfigs {
				if integration != "" && name != integration {
					continue
				}
				client := cloud.NewAzureClient(*config)
				costs, err := client.GetCosts(startDate, now)
				if err != nil {
					s.log.Errorw("Failed to get Azure costs", "error", err, "integration", name)
					continue
				}
				for i := range costs {
					costs[i].Integration = name
				}
				allCosts = append(allCosts, costs...)
			}
		}
	}

	// GCP costs
	if provider == "" || provider == "gcp" {
		gcpConfigs, err := s.integrationService.GetAllGCPConfigs()
		if err != nil {
			s.log.Errorw("Failed to get GCP configs", "error", err)
		} else {
			for name, config := range gcpConfigs {
				if integration != "" && name != integration {
					continue
				}
				client := cloud.NewGCPClient(*config)
				costs, err := client.GetCosts(startDate, now)
				if err != nil {
					s.log.Errorw("Failed to get GCP costs", "error", err, "integration", name)
					continue
				}
				for i := range costs {
					costs[i].Integration = name
				}
				allCosts = append(allCosts, costs...)
			}
		}
	}

	// AWS costs
	if provider == "" || provider == "aws" {
		awsConfigs, err := s.integrationService.GetAllAWSConfigs()
		if err != nil {
			s.log.Errorw("Failed to get AWS configs", "error", err)
		} else {
			for name, config := range awsConfigs {
				if integration != "" && name != integration {
					continue
				}
				client := cloud.NewAWSClient(*config)
				costs, err := client.GetCosts(startDate, now)
				if err != nil {
					s.log.Errorw("Failed to get AWS costs", "error", err, "integration", name)
					continue
				}
				for i := range costs {
					costs[i].Integration = name
				}
				allCosts = append(allCosts, costs...)
			}
		}
	}

	return allCosts, nil
}

// GetAllResources retrieves resources from all enabled cloud providers
func (s *FinOpsService) GetAllResources(provider, integration string) ([]domain.CloudResource, error) {
	allResources := make([]domain.CloudResource, 0)

	// Azure resources
	if provider == "" || provider == "azure" {
		azureConfigs, err := s.integrationService.GetAllAzureCloudConfigs()
		if err != nil {
			s.log.Errorw("Failed to get Azure configs", "error", err)
		} else {
			for name, config := range azureConfigs {
				if integration != "" && name != integration {
					continue
				}
				client := cloud.NewAzureClient(*config)
				resources, err := client.GetResources()
				if err != nil {
					s.log.Errorw("Failed to get Azure resources", "error", err, "integration", name)
					continue
				}
				for i := range resources {
					resources[i].Integration = name
				}
				allResources = append(allResources, resources...)
			}
		}
	}

	// GCP resources
	if provider == "" || provider == "gcp" {
		gcpConfigs, err := s.integrationService.GetAllGCPConfigs()
		if err != nil {
			s.log.Errorw("Failed to get GCP configs", "error", err)
		} else {
			for name, config := range gcpConfigs {
				if integration != "" && name != integration {
					continue
				}
				client := cloud.NewGCPClient(*config)
				resources, err := client.GetResources()
				if err != nil {
					s.log.Errorw("Failed to get GCP resources", "error", err, "integration", name)
					continue
				}
				for i := range resources {
					resources[i].Integration = name
				}
				allResources = append(allResources, resources...)
			}
		}
	}

	// AWS resources
	if provider == "" || provider == "aws" {
		awsConfigs, err := s.integrationService.GetAllAWSConfigs()
		if err != nil {
			s.log.Errorw("Failed to get AWS configs", "error", err)
		} else {
			for name, config := range awsConfigs {
				if integration != "" && name != integration {
					continue
				}
				client := cloud.NewAWSClient(*config)
				resources, err := client.GetResources()
				if err != nil {
					s.log.Errorw("Failed to get AWS resources", "error", err, "integration", name)
					continue
				}
				for i := range resources {
					resources[i].Integration = name
				}
				allResources = append(allResources, resources...)
			}
		}
	}

	return allResources, nil
}

// GetAWSCostsByMonth retrieves monthly cost data from AWS for the last year
func (s *FinOpsService) GetAWSCostsByMonth() ([]map[string]interface{}, error) {
	awsConfigs, err := s.integrationService.GetAllAWSConfigs()
	if err != nil {
		return nil, err
	}

	allMonthlyData := make([]map[string]interface{}, 0)

	for name, config := range awsConfigs {
		client := cloud.NewAWSClient(*config)
		monthlyData, err := client.GetCostsByMonth()
		if err != nil {
			s.log.Errorw("Failed to get AWS monthly costs", "error", err, "integration", name)
			continue
		}
		allMonthlyData = append(allMonthlyData, monthlyData...)
	}

	return allMonthlyData, nil
}

// GetAWSCostsByService retrieves cost data grouped by service from AWS
func (s *FinOpsService) GetAWSCostsByService() ([]map[string]interface{}, error) {
	awsConfigs, err := s.integrationService.GetAllAWSConfigs()
	if err != nil {
		return nil, err
	}

	allServiceData := make([]map[string]interface{}, 0)

	for name, config := range awsConfigs {
		client := cloud.NewAWSClient(*config)
		serviceData, err := client.GetCostsByService()
		if err != nil {
			s.log.Errorw("Failed to get AWS costs by service", "error", err, "integration", name)
			continue
		}
		allServiceData = append(allServiceData, serviceData...)
	}

	return allServiceData, nil
}

// GetAWSCostForecast retrieves cost forecast from AWS
func (s *FinOpsService) GetAWSCostForecast() ([]map[string]interface{}, error) {
	awsConfigs, err := s.integrationService.GetAllAWSConfigs()
	if err != nil {
		return nil, err
	}

	allForecastData := make([]map[string]interface{}, 0)

	for name, config := range awsConfigs {
		client := cloud.NewAWSClient(*config)
		forecastData, err := client.GetCostForecast()
		if err != nil {
			s.log.Errorw("Failed to get AWS cost forecast", "error", err, "integration", name)
			continue
		}
		allForecastData = append(allForecastData, forecastData...)
	}

	return allForecastData, nil
}

// GetAWSCostsByTag retrieves cost data grouped by tag from AWS
func (s *FinOpsService) GetAWSCostsByTag(tagKey string) ([]map[string]interface{}, error) {
	awsConfigs, err := s.integrationService.GetAllAWSConfigs()
	if err != nil {
		return nil, err
	}

	allTagData := make([]map[string]interface{}, 0)

	for name, config := range awsConfigs {
		client := cloud.NewAWSClient(*config)
		tagData, err := client.GetCostsByTag(tagKey)
		if err != nil {
			s.log.Errorw("Failed to get AWS costs by tag", "error", err, "integration", name, "tag", tagKey)
			continue
		}
		allTagData = append(allTagData, tagData...)
	}

	return allTagData, nil
}
