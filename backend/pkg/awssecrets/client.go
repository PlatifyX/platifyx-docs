package awssecrets

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager/types"
)

type Client struct {
	client *secretsmanager.Client
	region string
}

func NewClient(accessKeyID, secretAccessKey, region, sessionToken string) (*Client, error) {
	// Create AWS config with credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKeyID,
			secretAccessKey,
			sessionToken,
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS config: %w", err)
	}

	client := secretsmanager.NewFromConfig(cfg)

	return &Client{
		client: client,
		region: region,
	}, nil
}

// TestConnection verifies the connection to AWS Secrets Manager
func (c *Client) TestConnection(ctx context.Context) error {
	// Try to list secrets with limit 1 to test connection
	input := &secretsmanager.ListSecretsInput{
		MaxResults: aws.Int32(1),
	}

	_, err := c.client.ListSecrets(ctx, input)
	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}

	return nil
}

// ListSecrets lists all secrets
func (c *Client) ListSecrets(ctx context.Context) ([]domain.AWSSecretListEntry, error) {
	var secrets []domain.AWSSecretListEntry
	var nextToken *string

	for {
		input := &secretsmanager.ListSecretsInput{
			MaxResults: aws.Int32(100),
			NextToken:  nextToken,
		}

		result, err := c.client.ListSecrets(ctx, input)
		if err != nil {
			return nil, fmt.Errorf("error listing secrets: %w", err)
		}

		for _, secret := range result.SecretList {
			entry := domain.AWSSecretListEntry{
				ARN:                  aws.ToString(secret.ARN),
				Name:                 aws.ToString(secret.Name),
				Description:          aws.ToString(secret.Description),
				KmsKeyID:             aws.ToString(secret.KmsKeyId),
				RotationEnabled:      aws.ToBool(secret.RotationEnabled),
				RotationLambdaARN:    aws.ToString(secret.RotationLambdaARN),
				LastAccessedDate:     secret.LastAccessedDate,
				LastChangedDate:      secret.LastChangedDate,
				LastRotatedDate:      secret.LastRotatedDate,
				NextRotationDate:     secret.NextRotationDate,
				DeletedDate:          secret.DeletedDate,
				PrimaryRegion:        aws.ToString(secret.PrimaryRegion),
				CreatedDate:          secret.CreatedDate,
			}

			if secret.RotationRules != nil {
				entry.RotationRules = &domain.AWSRotationRules{
					AutomaticallyAfterDays: aws.ToInt64(secret.RotationRules.AutomaticallyAfterDays),
					Duration:               aws.ToString(secret.RotationRules.Duration),
					ScheduleExpression:     aws.ToString(secret.RotationRules.ScheduleExpression),
				}
			}

			if secret.Tags != nil {
				entry.Tags = make(map[string]string)
				for _, tag := range secret.Tags {
					entry.Tags[aws.ToString(tag.Key)] = aws.ToString(tag.Value)
				}
			}

			secrets = append(secrets, entry)
		}

		nextToken = result.NextToken
		if nextToken == nil {
			break
		}
	}

	return secrets, nil
}

// GetSecret retrieves a specific secret
func (c *Client) GetSecret(ctx context.Context, secretName string) (*domain.AWSSecret, error) {
	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(secretName),
	}

	result, err := c.client.GetSecretValue(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("error getting secret: %w", err)
	}

	secret := &domain.AWSSecret{
		ARN:           aws.ToString(result.ARN),
		Name:          aws.ToString(result.Name),
		VersionID:     aws.ToString(result.VersionId),
		SecretString:  aws.ToString(result.SecretString),
		SecretBinary:  result.SecretBinary,
		VersionStages: result.VersionStages,
		CreatedDate:   result.CreatedDate,
	}

	return secret, nil
}

// CreateSecret creates a new secret
func (c *Client) CreateSecret(ctx context.Context, name, description, secretString string, tags map[string]string) error {
	input := &secretsmanager.CreateSecretInput{
		Name:         aws.String(name),
		Description:  aws.String(description),
		SecretString: aws.String(secretString),
	}

	if tags != nil {
		var awsTags []types.Tag
		for k, v := range tags {
			awsTags = append(awsTags, types.Tag{
				Key:   aws.String(k),
				Value: aws.String(v),
			})
		}
		input.Tags = awsTags
	}

	_, err := c.client.CreateSecret(ctx, input)
	if err != nil {
		return fmt.Errorf("error creating secret: %w", err)
	}

	return nil
}

// UpdateSecret updates an existing secret
func (c *Client) UpdateSecret(ctx context.Context, secretName, secretString string) error {
	input := &secretsmanager.PutSecretValueInput{
		SecretId:     aws.String(secretName),
		SecretString: aws.String(secretString),
	}

	_, err := c.client.PutSecretValue(ctx, input)
	if err != nil {
		return fmt.Errorf("error updating secret: %w", err)
	}

	return nil
}

// DeleteSecret deletes a secret
func (c *Client) DeleteSecret(ctx context.Context, secretName string, forceDelete bool) error {
	input := &secretsmanager.DeleteSecretInput{
		SecretId: aws.String(secretName),
	}

	if forceDelete {
		input.ForceDeleteWithoutRecovery = aws.Bool(true)
	} else {
		// Schedule for deletion in 7 days
		input.RecoveryWindowInDays = aws.Int64(7)
	}

	_, err := c.client.DeleteSecret(ctx, input)
	if err != nil {
		return fmt.Errorf("error deleting secret: %w", err)
	}

	return nil
}

// DescribeSecret gets metadata about a secret
func (c *Client) DescribeSecret(ctx context.Context, secretName string) (*domain.AWSSecret, error) {
	input := &secretsmanager.DescribeSecretInput{
		SecretId: aws.String(secretName),
	}

	result, err := c.client.DescribeSecret(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("error describing secret: %w", err)
	}

	secret := &domain.AWSSecret{
		ARN:               aws.ToString(result.ARN),
		Name:              aws.ToString(result.Name),
		Description:       aws.ToString(result.Description),
		KmsKeyID:          aws.ToString(result.KmsKeyId),
		RotationEnabled:   aws.ToBool(result.RotationEnabled),
		RotationLambdaARN: aws.ToString(result.RotationLambdaARN),
		CreatedDate:       result.CreatedDate,
		LastAccessedDate:  result.LastAccessedDate,
		LastChangedDate:   result.LastChangedDate,
		LastRotatedDate:   result.LastRotatedDate,
		NextRotationDate:  result.NextRotationDate,
		DeletedDate:       result.DeletedDate,
	}

	if result.RotationRules != nil {
		secret.RotationRules = &domain.AWSRotationRules{
			AutomaticallyAfterDays: aws.ToInt64(result.RotationRules.AutomaticallyAfterDays),
			Duration:               aws.ToString(result.RotationRules.Duration),
			ScheduleExpression:     aws.ToString(result.RotationRules.ScheduleExpression),
		}
	}

	if result.Tags != nil {
		secret.Tags = make(map[string]string)
		for _, tag := range result.Tags {
			secret.Tags[aws.ToString(tag.Key)] = aws.ToString(tag.Value)
		}
	}

	return secret, nil
}

// GetSecretValue retrieves and parses a secret value as JSON
func (c *Client) GetSecretValue(ctx context.Context, secretName string) (map[string]interface{}, error) {
	secret, err := c.GetSecret(ctx, secretName)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(secret.SecretString), &data); err != nil {
		// If it's not JSON, return it as a single value
		return map[string]interface{}{
			"value": secret.SecretString,
		}, nil
	}

	return data, nil
}
