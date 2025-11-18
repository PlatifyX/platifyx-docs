package service

import (
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/vault"
)

type VaultService struct {
	client *vault.Client
	log    *logger.Logger
}

func NewVaultService(config domain.VaultConfig, log *logger.Logger) *VaultService {
	client := vault.NewClient(config.Address, config.Token, config.Namespace)
	return &VaultService{
		client: client,
		log:    log,
	}
}

// GetStats aggregates statistics from Vault
func (s *VaultService) GetStats() (*domain.VaultStats, error) {
	health, err := s.client.GetHealth()
	if err != nil {
		return nil, fmt.Errorf("failed to get health: %w", err)
	}

	stats := &domain.VaultStats{
		Initialized: health.Initialized,
		Sealed:      health.Sealed,
		Version:     health.Version,
		ClusterName: health.ClusterName,
		TotalSecrets: 0, // Would need to traverse KV mounts to count
	}

	return stats, nil
}

// GetHealth returns Vault health information
func (s *VaultService) GetHealth() (*domain.VaultHealth, error) {
	return s.client.GetHealth()
}

// ReadSecret reads a secret from KV v1
func (s *VaultService) ReadSecret(path string) (*domain.VaultSecret, error) {
	s.log.Infow("Reading secret", "path", path)
	return s.client.ReadSecret(path)
}

// ReadKVSecret reads a secret from KV v2
func (s *VaultService) ReadKVSecret(mountPath, secretPath string) (*domain.VaultKVSecret, error) {
	s.log.Infow("Reading KV secret", "mount", mountPath, "path", secretPath)
	return s.client.ReadKVSecret(mountPath, secretPath)
}

// WriteKVSecret writes a secret to KV v2
func (s *VaultService) WriteKVSecret(mountPath, secretPath string, data map[string]interface{}) error {
	s.log.Infow("Writing KV secret", "mount", mountPath, "path", secretPath)
	return s.client.WriteKVSecret(mountPath, secretPath, data)
}

// DeleteKVSecret deletes a secret from KV v2
func (s *VaultService) DeleteKVSecret(mountPath, secretPath string) error {
	s.log.Infow("Deleting KV secret", "mount", mountPath, "path", secretPath)
	return s.client.DeleteKVSecret(mountPath, secretPath)
}

// ListSecrets lists secrets in a path
func (s *VaultService) ListSecrets(path string) ([]string, error) {
	return s.client.ListSecrets(path)
}

// ListKVSecrets lists secrets in a KV v2 mount
func (s *VaultService) ListKVSecrets(mountPath, secretPath string) ([]string, error) {
	return s.client.ListKVSecrets(mountPath, secretPath)
}

// TestConnection tests the connection to Vault
func (s *VaultService) TestConnection() error {
	return s.client.TestConnection()
}
