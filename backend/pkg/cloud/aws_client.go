package cloud

import (
	"context"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
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

	if len(result.Total) > 0 {
		total := result.Total[0]
		if total.Utilization != nil {
			if total.Utilization.UtilizationPercentage != nil {
				fmt.Sscanf(*total.Utilization.UtilizationPercentage, "%f", &utilizationPercent)
			}
		}
		if total.AmortizedCommitment != nil {
			if total.AmortizedCommitment.TotalAmortizedCommitment != nil {
				fmt.Sscanf(*total.AmortizedCommitment.TotalAmortizedCommitment, "%f", &totalCommitment)
			}
		}
		if total.Utilization != nil {
			if total.Utilization.UsedCommitment != nil {
				fmt.Sscanf(*total.Utilization.UsedCommitment, "%f", &usedCommitment)
			}
			if total.Utilization.UnusedCommitment != nil {
				fmt.Sscanf(*total.Utilization.UnusedCommitment, "%f", &unusedCommitment)
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
