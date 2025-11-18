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
