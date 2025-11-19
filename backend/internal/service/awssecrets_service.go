package service

import (
	"context"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/awssecrets"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type AWSSecretsService struct {
	client *awssecrets.Client
	log    *logger.Logger
	region string
}

func NewAWSSecretsService(config domain.AWSSecretsConfig, log *logger.Logger) (*AWSSecretsService, error) {
	client, err := awssecrets.NewClient(
		config.AccessKeyID,
		config.SecretAccessKey,
		config.Region,
		config.SessionToken,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS Secrets Manager client: %w", err)
	}

	return &AWSSecretsService{
		client: client,
		log:    log,
		region: config.Region,
	}, nil
}

// GetStats aggregates statistics from AWS Secrets Manager
func (s *AWSSecretsService) GetStats(ctx context.Context) (*domain.AWSSecretsStats, error) {
	secrets, err := s.client.ListSecrets(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list secrets: %w", err)
	}

	stats := &domain.AWSSecretsStats{
		TotalSecrets:         len(secrets),
		RotationEnabled:      0,
		ScheduledForDeletion: 0,
		Region:               s.region,
	}

	for _, secret := range secrets {
		if secret.RotationEnabled {
			stats.RotationEnabled++
		}
		if secret.DeletedDate != nil {
			stats.ScheduledForDeletion++
		}
	}

	return stats, nil
}

// ListSecrets lists all secrets
func (s *AWSSecretsService) ListSecrets(ctx context.Context) ([]domain.AWSSecretListEntry, error) {
	s.log.Info("Listing AWS secrets")
	return s.client.ListSecrets(ctx)
}

// GetSecret retrieves a specific secret
func (s *AWSSecretsService) GetSecret(ctx context.Context, secretName string) (*domain.AWSSecret, error) {
	s.log.Infow("Getting AWS secret", "name", secretName)
	return s.client.GetSecret(ctx, secretName)
}

// CreateSecret creates a new secret
func (s *AWSSecretsService) CreateSecret(ctx context.Context, name, description, secretString string, tags map[string]string) error {
	s.log.Infow("Creating AWS secret", "name", name)
	return s.client.CreateSecret(ctx, name, description, secretString, tags)
}

// UpdateSecret updates an existing secret
func (s *AWSSecretsService) UpdateSecret(ctx context.Context, secretName, secretString string) error {
	s.log.Infow("Updating AWS secret", "name", secretName)
	return s.client.UpdateSecret(ctx, secretName, secretString)
}

// DeleteSecret deletes a secret
func (s *AWSSecretsService) DeleteSecret(ctx context.Context, secretName string, forceDelete bool) error {
	s.log.Infow("Deleting AWS secret", "name", secretName, "force", forceDelete)
	return s.client.DeleteSecret(ctx, secretName, forceDelete)
}

// DescribeSecret gets metadata about a secret
func (s *AWSSecretsService) DescribeSecret(ctx context.Context, secretName string) (*domain.AWSSecret, error) {
	s.log.Infow("Describing AWS secret", "name", secretName)
	return s.client.DescribeSecret(ctx, secretName)
}

// GetSecretValue retrieves and parses a secret value
func (s *AWSSecretsService) GetSecretValue(ctx context.Context, secretName string) (map[string]interface{}, error) {
	s.log.Infow("Getting AWS secret value", "name", secretName)
	return s.client.GetSecretValue(ctx, secretName)
}

// TestConnection tests the connection to AWS Secrets Manager
func (s *AWSSecretsService) TestConnection(ctx context.Context) error {
	return s.client.TestConnection(ctx)
}
