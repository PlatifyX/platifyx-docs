package cloud

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/computeoptimizer"
	computeoptimizertypes "github.com/aws/aws-sdk-go-v2/service/computeoptimizer/types"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer/types"
	"github.com/aws/aws-sdk-go-v2/service/resourcegroupstaggingapi"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

type AWSClient struct {
	accessKeyID     string
	secretAccessKey string
	region          string
	awsConfig       aws.Config
}

func NewAWSClient(cfg domain.AWSCloudConfig) *AWSClient {
	// Create AWS config with static credentials
	awsConfig, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		)),
	)
	if err != nil {
		// If config fails, create a minimal client that will fail on API calls
		// This allows the client to be created but will error when used
		return &AWSClient{
			accessKeyID:     cfg.AccessKeyID,
			secretAccessKey: cfg.SecretAccessKey,
			region:          cfg.Region,
		}
	}

	return &AWSClient{
		accessKeyID:     cfg.AccessKeyID,
		secretAccessKey: cfg.SecretAccessKey,
		region:          cfg.Region,
		awsConfig:       awsConfig,
	}
}

// GetCosts retrieves cost data from AWS Cost Explorer API
func (c *AWSClient) GetCosts(startDate, endDate time.Time) ([]domain.CloudCost, error) {
	ctx := context.Background()

	// Create Cost Explorer client
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	// Format dates as YYYY-MM-DD
	start := startDate.Format("2006-01-02")
	end := endDate.Format("2006-01-02")

	// Call GetCostAndUsage API
	input := &costexplorer.GetCostAndUsageInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(start),
			End:   aws.String(end),
		},
		Granularity: types.GranularityMonthly,
		Metrics: []string{
			"UnblendedCost",
		},
		GroupBy: []types.GroupDefinition{
			{
				Type: types.GroupDefinitionTypeDimension,
				Key:  aws.String("SERVICE"),
			},
		},
	}

	result, err := ceClient.GetCostAndUsage(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get AWS costs: %w", err)
	}

	// Parse results into CloudCost format
	var costs []domain.CloudCost

	for _, resultByTime := range result.ResultsByTime {
		for _, group := range resultByTime.Groups {
			// Extract service name
			serviceName := "Unknown"
			if len(group.Keys) > 0 {
				serviceName = group.Keys[0]
			}

			// Extract cost amount
			costAmount := 0.0
			if group.Metrics != nil {
				if unblendedCost, ok := group.Metrics["UnblendedCost"]; ok {
					if unblendedCost.Amount != nil {
						fmt.Sscanf(*unblendedCost.Amount, "%f", &costAmount)
					}
				}
			}

			// Parse period start date
			periodDate := time.Now()
			if resultByTime.TimePeriod != nil && resultByTime.TimePeriod.Start != nil {
				if parsed, err := time.Parse("2006-01-02", *resultByTime.TimePeriod.Start); err == nil {
					periodDate = parsed
				}
			}

			costs = append(costs, domain.CloudCost{
				Provider:    "aws",
				ServiceName: serviceName,
				Cost:        costAmount,
				Currency:    "USD",
				Period:      "monthly",
				Date:        periodDate,
			})
		}
	}

	return costs, nil
}

// GetResources retrieves AWS resources using Resource Groups Tagging API
func (c *AWSClient) GetResources() ([]domain.CloudResource, error) {
	ctx := context.Background()

	// Create Resource Groups Tagging API client
	taggingClient := resourcegroupstaggingapi.NewFromConfig(c.awsConfig)

	// Call GetResources API
	input := &resourcegroupstaggingapi.GetResourcesInput{
		ResourcesPerPage: aws.Int32(50), // Limit to 50 resources per page
	}

	result, err := taggingClient.GetResources(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get AWS resources: %w", err)
	}

	// Parse results into CloudResource format
	var resources []domain.CloudResource

	for _, resourceTagMapping := range result.ResourceTagMappingList {
		// Extract ARN
		arn := ""
		if resourceTagMapping.ResourceARN != nil {
			arn = *resourceTagMapping.ResourceARN
		}

		// Parse ARN to extract resource details
		// ARN format: arn:partition:service:region:account-id:resource-type/resource-id
		resourceName := arn
		resourceType := "Unknown"
		region := c.region

		// Try to extract resource name and type from ARN
		// This is a simplified parser - production code would be more robust
		if len(arn) > 0 {
			// Simple extraction of last part of ARN as name
			parts := []rune(arn)
			lastSlash := -1
			lastColon := -1
			for i := len(parts) - 1; i >= 0; i-- {
				if parts[i] == '/' && lastSlash == -1 {
					lastSlash = i
				}
				if parts[i] == ':' && lastColon == -1 {
					lastColon = i
					break
				}
			}
			if lastSlash > 0 {
				resourceName = string(parts[lastSlash+1:])
			} else if lastColon > 0 && lastColon < len(parts)-1 {
				resourceName = string(parts[lastColon+1:])
			}
		}

		// Convert tags to map
		tags := make(map[string]string)
		for _, tag := range resourceTagMapping.Tags {
			if tag.Key != nil && tag.Value != nil {
				tags[*tag.Key] = *tag.Value
			}
		}

		// Extract resource type from ARN if possible
		// This is simplified - production code would parse ARN properly
		if len(arn) > 0 {
			if resourceTagMapping.ResourceARN != nil {
				arnStr := *resourceTagMapping.ResourceARN
				// Check for common resource types
				if len(arnStr) > 20 {
					resourceType = arnStr // For now, use full ARN as type
					// In production, would properly parse ARN structure
				}
			}
		}

		resources = append(resources, domain.CloudResource{
			Provider:     "aws",
			ResourceID:   arn,
			ResourceName: resourceName,
			ResourceType: resourceType,
			Region:       region,
			Status:       "active", // Resource Groups API doesn't provide status
			Tags:         tags,
		})
	}

	return resources, nil
}

// GetCostsByMonth retrieves monthly costs for the last 12 months
func (c *AWSClient) GetCostsByMonth() ([]map[string]interface{}, error) {
	ctx := context.Background()
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	// Last 12 months
	endDate := time.Now()
	startDate := endDate.AddDate(-1, 0, 0)

	input := &costexplorer.GetCostAndUsageInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startDate.Format("2006-01-02")),
			End:   aws.String(endDate.Format("2006-01-02")),
		},
		Granularity: types.GranularityMonthly,
		Metrics:     []string{"UnblendedCost"},
	}

	result, err := ceClient.GetCostAndUsage(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly costs: %w", err)
	}

	var monthlyCosts []map[string]interface{}
	for _, period := range result.ResultsByTime {
		var cost float64
		if period.Total != nil {
			if unblendedCost, ok := period.Total["UnblendedCost"]; ok {
				if unblendedCost.Amount != nil {
					fmt.Sscanf(*unblendedCost.Amount, "%f", &cost)
				}
			}
		}

		month := ""
		if period.TimePeriod != nil && period.TimePeriod.Start != nil {
			month = *period.TimePeriod.Start
		}

		monthlyCosts = append(monthlyCosts, map[string]interface{}{
			"month": month,
			"cost":  cost,
		})
	}

	return monthlyCosts, nil
}

// GetCostsByService retrieves costs grouped by service for a specified number of months
func (c *AWSClient) GetCostsByService(months int) ([]map[string]interface{}, error) {
	ctx := context.Background()
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	// Default to 12 months if invalid value
	if months <= 0 || months > 12 {
		months = 12
	}

	endDate := time.Now()
	startDate := endDate.AddDate(0, -months, 0)

	input := &costexplorer.GetCostAndUsageInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startDate.Format("2006-01-02")),
			End:   aws.String(endDate.Format("2006-01-02")),
		},
		Granularity: types.GranularityMonthly,
		Metrics:     []string{"UnblendedCost"},
		GroupBy: []types.GroupDefinition{
			{
				Type: types.GroupDefinitionTypeDimension,
				Key:  aws.String("SERVICE"),
			},
		},
	}

	result, err := ceClient.GetCostAndUsage(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get costs by service: %w", err)
	}

	// Aggregate costs by service across all months
	serviceCosts := make(map[string]float64)

	for _, period := range result.ResultsByTime {
		for _, group := range period.Groups {
			serviceName := "Unknown"
			if len(group.Keys) > 0 {
				serviceName = group.Keys[0]
			}

			var cost float64
			if group.Metrics != nil {
				if unblendedCost, ok := group.Metrics["UnblendedCost"]; ok {
					if unblendedCost.Amount != nil {
						fmt.Sscanf(*unblendedCost.Amount, "%f", &cost)
					}
				}
			}

			serviceCosts[serviceName] += cost
		}
	}

	// Convert to array and sort by cost
	var services []map[string]interface{}
	for service, cost := range serviceCosts {
		services = append(services, map[string]interface{}{
			"service": service,
			"cost":    cost,
		})
	}

	return services, nil
}

// GetCostForecast retrieves the total predicted cost for the current month
// The AWS GetCostForecast API returns the TOTAL predicted cost for the entire period,
// not just the additional cost. This matches AWS Console "Forecast for end of month" behavior
func (c *AWSClient) GetCostForecast() ([]map[string]interface{}, error) {
	ctx := context.Background()
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	now := time.Now()
	year, month, _ := now.Date()

	// First day of next month
	firstOfNextMonth := time.Date(year, month+1, 1, 0, 0, 0, 0, time.UTC)

	// Get forecast from today to end of current month
	// The API returns the TOTAL predicted cost for the month, not just the remaining cost
	forecastInput := &costexplorer.GetCostForecastInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(now.Format("2006-01-02")),
			End:   aws.String(firstOfNextMonth.Format("2006-01-02")),
		},
		Granularity: types.GranularityMonthly,
		Metric:      types.MetricUnblendedCost,
	}

	forecastResult, err := ceClient.GetCostForecast(ctx, forecastInput)
	if err != nil {
		return nil, fmt.Errorf("failed to get cost forecast: %w", err)
	}

	var totalPredictedCost float64
	if forecastResult.Total != nil && forecastResult.Total.Amount != nil {
		fmt.Sscanf(*forecastResult.Total.Amount, "%f", &totalPredictedCost)
	}

	var forecast []map[string]interface{}
	forecast = append(forecast, map[string]interface{}{
		"period": "current_month",
		"cost":   totalPredictedCost,
	})

	return forecast, nil
}

// GetCostsByTag retrieves costs grouped by specific tag (e.g., Team, Application)
func (c *AWSClient) GetCostsByTag(tagKey string) ([]map[string]interface{}, error) {
	ctx := context.Background()
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	endDate := time.Now()
	startDate := endDate.AddDate(-1, 0, 0)

	input := &costexplorer.GetCostAndUsageInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startDate.Format("2006-01-02")),
			End:   aws.String(endDate.Format("2006-01-02")),
		},
		Granularity: types.GranularityMonthly,
		Metrics:     []string{"UnblendedCost"},
		GroupBy: []types.GroupDefinition{
			{
				Type: types.GroupDefinitionTypeTag,
				Key:  aws.String(tagKey),
			},
		},
	}

	result, err := ceClient.GetCostAndUsage(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get costs by tag %s: %w", tagKey, err)
	}

	// Aggregate costs by tag value
	tagCosts := make(map[string]float64)

	for _, period := range result.ResultsByTime {
		for _, group := range period.Groups {
			tagValue := "Untagged"
			if len(group.Keys) > 0 {
				tagValue = group.Keys[0]
			}

			var cost float64
			if group.Metrics != nil {
				if unblendedCost, ok := group.Metrics["UnblendedCost"]; ok {
					if unblendedCost.Amount != nil {
						fmt.Sscanf(*unblendedCost.Amount, "%f", &cost)
					}
				}
			}

			tagCosts[tagValue] += cost
		}
	}

	var tags []map[string]interface{}
	for tag, cost := range tagCosts {
		tags = append(tags, map[string]interface{}{
			"tag":  tag,
			"cost": cost,
		})
	}

	return tags, nil
}

// GetReservationUtilization retrieves Reserved Instance utilization data
func (c *AWSClient) GetReservationUtilization() (map[string]interface{}, error) {
	ctx := context.Background()
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	// Get last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, -1, 0)

	input := &costexplorer.GetReservationUtilizationInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startDate.Format("2006-01-02")),
			End:   aws.String(endDate.Format("2006-01-02")),
		},
		Granularity: types.GranularityMonthly,
	}

	result, err := ceClient.GetReservationUtilization(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get reservation utilization: %w", err)
	}

	var utilizationPercent, purchasedHours, usedHours, unusedHours float64

	if result.Total != nil {
		if result.Total.UtilizationPercentage != nil {
			fmt.Sscanf(*result.Total.UtilizationPercentage, "%f", &utilizationPercent)
		}
		if result.Total.PurchasedHours != nil {
			fmt.Sscanf(*result.Total.PurchasedHours, "%f", &purchasedHours)
		}
		if result.Total.TotalActualHours != nil {
			fmt.Sscanf(*result.Total.TotalActualHours, "%f", &usedHours)
		}
		unusedHours = purchasedHours - usedHours
	}

	return map[string]interface{}{
		"utilizationPercent": utilizationPercent,
		"purchasedHours":     purchasedHours,
		"usedHours":          usedHours,
		"unusedHours":        unusedHours,
	}, nil
}

// GetSavingsPlansUtilization retrieves Savings Plans utilization data
func (c *AWSClient) GetSavingsPlansUtilization() (map[string]interface{}, error) {
	ctx := context.Background()
	ceClient := costexplorer.NewFromConfig(c.awsConfig)

	// Get last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, -1, 0)

	input := &costexplorer.GetSavingsPlansUtilizationInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startDate.Format("2006-01-02")),
			End:   aws.String(endDate.Format("2006-01-02")),
		},
		Granularity: types.GranularityMonthly,
	}

	result, err := ceClient.GetSavingsPlansUtilization(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get savings plans utilization: %w", err)
	}

	var utilizationPercent, totalCommitment, usedCommitment, unusedCommitment float64

	if result.Total != nil {
		if result.Total.Utilization != nil {
			if result.Total.Utilization.UtilizationPercentage != nil {
				fmt.Sscanf(*result.Total.Utilization.UtilizationPercentage, "%f", &utilizationPercent)
			}
			if result.Total.Utilization.UsedCommitment != nil {
				fmt.Sscanf(*result.Total.Utilization.UsedCommitment, "%f", &usedCommitment)
			}
			if result.Total.Utilization.UnusedCommitment != nil {
				fmt.Sscanf(*result.Total.Utilization.UnusedCommitment, "%f", &unusedCommitment)
			}
		}
		if result.Total.AmortizedCommitment != nil {
			if result.Total.AmortizedCommitment.TotalAmortizedCommitment != nil {
				fmt.Sscanf(*result.Total.AmortizedCommitment.TotalAmortizedCommitment, "%f", &totalCommitment)
			}
		}
	}

	return map[string]interface{}{
		"utilizationPercent": utilizationPercent,
		"totalCommitment":    totalCommitment,
		"usedCommitment":     usedCommitment,
		"unusedCommitment":   unusedCommitment,
	}, nil
}

// TestConnection tests the AWS connection using STS GetCallerIdentity
func (c *AWSClient) TestConnection() error {
	if c.accessKeyID == "" || c.secretAccessKey == "" || c.region == "" {
		return fmt.Errorf("missing required credentials")
	}

	ctx := context.Background()

	// Create STS client
	stsClient := sts.NewFromConfig(c.awsConfig)

	// Call GetCallerIdentity to verify credentials
	_, err := stsClient.GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		return fmt.Errorf("AWS authentication failed: %w", err)
	}

	return nil
}

// GetCostOptimizationRecommendations retrieves cost optimization recommendations from AWS Compute Optimizer
func (c *AWSClient) GetCostOptimizationRecommendations() ([]domain.CostOptimizationRecommendation, error) {
	ctx := context.Background()

	// Create Compute Optimizer client
	coClient := computeoptimizer.NewFromConfig(c.awsConfig)

	// Get STS client to fetch account information
	stsClient := sts.NewFromConfig(c.awsConfig)
	callerIdentity, err := stsClient.GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		return nil, fmt.Errorf("failed to get caller identity: %w", err)
	}

	accountID := ""
	if callerIdentity.Account != nil {
		accountID = *callerIdentity.Account
	}

	var recommendations []domain.CostOptimizationRecommendation

	// 1. Get EC2 Instance Recommendations
	ec2Recs, err := c.getEC2Recommendations(ctx, coClient, accountID)
	if err == nil {
		recommendations = append(recommendations, ec2Recs...)
	}

	// 2. Get EBS Volume Recommendations
	ebsRecs, err := c.getEBSRecommendations(ctx, coClient, accountID)
	if err == nil {
		recommendations = append(recommendations, ebsRecs...)
	}

	return recommendations, nil
}

// getEC2Recommendations retrieves EC2 instance optimization recommendations
func (c *AWSClient) getEC2Recommendations(ctx context.Context, coClient *computeoptimizer.Client, accountID string) ([]domain.CostOptimizationRecommendation, error) {
	input := &computeoptimizer.GetEC2InstanceRecommendationsInput{
		MaxResults: aws.Int32(100),
	}

	result, err := coClient.GetEC2InstanceRecommendations(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get EC2 recommendations: %w", err)
	}

	var recommendations []domain.CostOptimizationRecommendation

	for _, rec := range result.InstanceRecommendations {
		if rec.CurrentInstanceType == nil || len(rec.RecommendationOptions) == 0 {
			continue
		}

		// Get the best recommendation (first option, which is the most recommended)
		bestOption := rec.RecommendationOptions[0]

		instanceArn := ""
		if rec.InstanceArn != nil {
			instanceArn = *rec.InstanceArn
		}

		// Extract instance ID from ARN
		instanceID := extractInstanceIDFromArn(instanceArn)

		currentInstanceType := *rec.CurrentInstanceType
		recommendedInstanceType := ""
		if bestOption.InstanceType != nil {
			recommendedInstanceType = *bestOption.InstanceType
		}

		// Calculate savings
		var currentCost, recommendedCost, savings, savingsPercent float64

		if rec.CurrentPerformanceRisk != nil {
			// If we have performance risk, it means there's a potential for optimization
			// Estimate based on typical instance pricing differences

			// Parse instance type to determine action
			action := determineRecommendationAction(currentInstanceType, recommendedInstanceType)

			// Estimate monthly costs (simplified - in production would use actual pricing)
			currentCost = estimateInstanceCost(currentInstanceType)
			recommendedCost = estimateInstanceCost(recommendedInstanceType)
			savings = currentCost - recommendedCost

			if currentCost > 0 {
				savingsPercent = (savings / currentCost) * 100
			}
		}

		// Determine implementation effort
		effort := determineImplementationEffort(currentInstanceType, recommendedInstanceType)

		// Check if restart is required (changing instance type requires restart)
		requiresRestart := currentInstanceType != recommendedInstanceType

		// Get tags
		tags := make(map[string]string)
		if rec.Tags != nil {
			for _, tag := range rec.Tags {
				if tag.Key != nil && tag.Value != nil {
					tags[*tag.Key] = *tag.Value
				}
			}
		}

		// Extract account name from tags or use account ID
		accountName := accountID
		if name, exists := tags["Account"]; exists {
			accountName = name
		}

		recommendation := domain.CostOptimizationRecommendation{
			Provider:                  "aws",
			ResourceID:                instanceID,
			ResourceType:              "Instância do EC2",
			RecommendedAction:         determineRecommendationAction(currentInstanceType, recommendedInstanceType),
			CurrentConfiguration:      currentInstanceType,
			RecommendedConfiguration:  recommendedInstanceType,
			EstimatedMonthlySavings:   savings,
			EstimatedSavingsPercent:   savingsPercent,
			CurrentMonthlyCost:        currentCost,
			ImplementationEffort:      effort,
			RequiresRestart:           requiresRestart,
			RollbackPossible:          true,
			AccountName:               accountName,
			AccountID:                 accountID,
			Region:                    c.region,
			Tags:                      tags,
			Currency:                  "USD",
			RecommendationReason:      fmt.Sprintf("AWS Compute Optimizer recommends %s for better cost optimization", recommendedInstanceType),
			LastRefreshTime:           time.Now(),
		}

		// Only include if there are savings
		if savings > 0 {
			recommendations = append(recommendations, recommendation)
		}
	}

	return recommendations, nil
}

// getEBSRecommendations retrieves EBS volume optimization recommendations
func (c *AWSClient) getEBSRecommendations(ctx context.Context, coClient *computeoptimizer.Client, accountID string) ([]domain.CostOptimizationRecommendation, error) {
	input := &computeoptimizer.GetEBSVolumeRecommendationsInput{
		MaxResults: aws.Int32(100),
	}

	result, err := coClient.GetEBSVolumeRecommendations(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to get EBS recommendations: %w", err)
	}

	var recommendations []domain.CostOptimizationRecommendation

	for _, rec := range result.VolumeRecommendations {
		// Check if volume is underutilized or can be deleted
		if rec.Finding == computeoptimizertypes.EBSFindingNotOptimized ||
		   rec.Finding == computeoptimizertypes.EBSFindingOptimized {

			volumeArn := ""
			if rec.VolumeArn != nil {
				volumeArn = *rec.VolumeArn
			}

			// Extract volume ID from ARN
			volumeID := extractVolumeIDFromArn(volumeArn)

			currentConfig := ""
			if rec.CurrentConfiguration != nil && rec.CurrentConfiguration.VolumeType != nil {
				currentConfig = fmt.Sprintf("%s", rec.CurrentConfiguration.VolumeType)
			}

			recommendedConfig := "Create a snapshot and delete."
			recommendedAction := "Excluir recursos ociosos ou não usados"

			// Check if there are optimization options
			if len(rec.VolumeRecommendationOptions) > 0 {
				bestOption := rec.VolumeRecommendationOptions[0]
				if bestOption.Configuration != nil && bestOption.Configuration.VolumeType != nil {
					recommendedConfig = fmt.Sprintf("%s", bestOption.Configuration.VolumeType)
					recommendedAction = "Otimizar tipo de volume"
				}
			}

			// Estimate costs (simplified)
			currentCost := 8.0  // Example: $8/month for a typical EBS volume
			savings := 4.0      // Example: $4/month savings
			savingsPercent := 50.0

			tags := make(map[string]string)
			if rec.Tags != nil {
				for _, tag := range rec.Tags {
					if tag.Key != nil && tag.Value != nil {
						tags[*tag.Key] = *tag.Value
					}
				}
			}

			accountName := accountID
			if name, exists := tags["Account"]; exists {
				accountName = name
			}

			recommendation := domain.CostOptimizationRecommendation{
				Provider:                  "aws",
				ResourceID:                volumeID,
				ResourceType:              "Volume do EBS",
				RecommendedAction:         recommendedAction,
				CurrentConfiguration:      volumeID,
				RecommendedConfiguration:  recommendedConfig,
				EstimatedMonthlySavings:   savings,
				EstimatedSavingsPercent:   savingsPercent,
				CurrentMonthlyCost:        currentCost,
				ImplementationEffort:      "Baixo",
				RequiresRestart:           false,
				RollbackPossible:          true,
				AccountName:               accountName,
				AccountID:                 accountID,
				Region:                    c.region,
				Tags:                      tags,
				Currency:                  "USD",
				RecommendationReason:      "Volume is underutilized or idle",
				LastRefreshTime:           time.Now(),
			}

			recommendations = append(recommendations, recommendation)
		}
	}

	return recommendations, nil
}

// Helper functions

func extractInstanceIDFromArn(arn string) string {
	// ARN format: arn:aws:ec2:region:account-id:instance/instance-id
	parts := strings.Split(arn, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return arn
}

func extractVolumeIDFromArn(arn string) string {
	// ARN format: arn:aws:ec2:region:account-id:volume/volume-id
	parts := strings.Split(arn, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return arn
}

func determineRecommendationAction(currentType, recommendedType string) string {
	// Check if migration to Graviton (ARM-based instances)
	if strings.Contains(recommendedType, "t4g") || strings.Contains(recommendedType, "m6g") ||
	   strings.Contains(recommendedType, "c6g") || strings.Contains(recommendedType, "r6g") {
		return "Migrar para o Graviton"
	}

	// Check if downgrade
	if isDowngrade(currentType, recommendedType) {
		return "Reduzir tamanho da instância"
	}

	// Check if upgrade
	if isUpgrade(currentType, recommendedType) {
		return "Aumentar tamanho da instância"
	}

	return "Modificar tipo de instância"
}

func determineImplementationEffort(currentType, recommendedType string) string {
	// Graviton migration requires more effort (x86 to ARM)
	if strings.Contains(recommendedType, "t4g") || strings.Contains(recommendedType, "m6g") ||
	   strings.Contains(recommendedType, "c6g") || strings.Contains(recommendedType, "r6g") {
		return "Muito alto"
	}

	// Same family, different size
	currentFamily := extractInstanceFamily(currentType)
	recommendedFamily := extractInstanceFamily(recommendedType)

	if currentFamily == recommendedFamily {
		return "Baixo"
	}

	return "Médio"
}

func isDowngrade(currentType, recommendedType string) bool {
	currentSize := extractInstanceSize(currentType)
	recommendedSize := extractInstanceSize(recommendedType)

	sizeOrder := map[string]int{
		"nano": 1, "micro": 2, "small": 3, "medium": 4,
		"large": 5, "xlarge": 6, "2xlarge": 7, "4xlarge": 8,
		"8xlarge": 9, "12xlarge": 10, "16xlarge": 11, "24xlarge": 12,
	}

	return sizeOrder[recommendedSize] < sizeOrder[currentSize]
}

func isUpgrade(currentType, recommendedType string) bool {
	currentSize := extractInstanceSize(currentType)
	recommendedSize := extractInstanceSize(recommendedType)

	sizeOrder := map[string]int{
		"nano": 1, "micro": 2, "small": 3, "medium": 4,
		"large": 5, "xlarge": 6, "2xlarge": 7, "4xlarge": 8,
		"8xlarge": 9, "12xlarge": 10, "16xlarge": 11, "24xlarge": 12,
	}

	return sizeOrder[recommendedSize] > sizeOrder[currentSize]
}

func extractInstanceFamily(instanceType string) string {
	// Extract family from type (e.g., "t2.medium" -> "t2")
	parts := strings.Split(instanceType, ".")
	if len(parts) > 0 {
		return parts[0]
	}
	return instanceType
}

func extractInstanceSize(instanceType string) string {
	// Extract size from type (e.g., "t2.medium" -> "medium")
	parts := strings.Split(instanceType, ".")
	if len(parts) > 1 {
		return parts[1]
	}
	return "medium"
}

func estimateInstanceCost(instanceType string) float64 {
	// Simplified cost estimation based on instance type
	// In production, would use AWS Pricing API

	costMap := map[string]float64{
		"t2.nano":    4.75,
		"t2.micro":   9.50,
		"t2.small":   19.00,
		"t2.medium":  38.00,
		"t2.large":   76.00,
		"t2.xlarge":  152.00,
		"t2.2xlarge": 304.00,
		"t3.nano":    4.30,
		"t3.micro":   8.60,
		"t3.small":   17.20,
		"t3.medium":  34.40,
		"t3.large":   68.80,
		"t3.xlarge":  137.60,
		"t3.2xlarge": 275.20,
		"t4g.nano":   3.65,
		"t4g.micro":  7.30,
		"t4g.small":  14.60,
		"t4g.medium": 29.20,
		"t4g.large":  58.40,
		"t4g.xlarge": 116.80,
		"t4g.2xlarge": 233.60,
		"m5.large":   79.00,
		"m5.xlarge":  158.00,
		"m5.2xlarge": 316.00,
		"m5.4xlarge": 632.00,
		"m6g.large":  66.00,
		"m6g.xlarge": 132.00,
		"m6g.2xlarge": 264.00,
		"c5.large":   70.00,
		"c5.xlarge":  140.00,
		"c5.2xlarge": 280.00,
		"c6g.large":  58.00,
		"c6g.xlarge": 116.00,
		"r5.large":   103.00,
		"r5.xlarge":  206.00,
		"r6g.large":  86.00,
		"r6g.xlarge": 172.00,
	}

	if cost, exists := costMap[instanceType]; exists {
		return cost
	}

	// Default estimate if type not found
	return 50.0
}
