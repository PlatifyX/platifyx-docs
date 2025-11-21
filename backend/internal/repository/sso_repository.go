package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type SSORepository struct {
	db *sql.DB
}

func NewSSORepository(db *sql.DB) *SSORepository {
	return &SSORepository{db: db}
}

// Create cria uma nova configuração SSO
func (r *SSORepository) Create(config *domain.SSOConfig) error {
	allowedDomainsJSON, err := json.Marshal(config.AllowedDomains)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO sso_configs (provider, enabled, client_id, client_secret, tenant_id, redirect_uri, allowed_domains, config)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(
		query,
		config.Provider,
		config.Enabled,
		config.ClientID,
		config.ClientSecret,
		config.TenantID,
		config.RedirectURI,
		string(allowedDomainsJSON),
		config.Config,
	).Scan(&config.ID, &config.CreatedAt, &config.UpdatedAt)
}

// GetByProvider retorna uma configuração SSO por provedor
func (r *SSORepository) GetByProvider(provider string) (*domain.SSOConfig, error) {
	config := &domain.SSOConfig{}
	query := `
		SELECT id, provider, enabled, client_id, client_secret, tenant_id, redirect_uri, allowed_domains, config, created_at, updated_at
		FROM sso_configs WHERE provider = $1
	`
	err := r.db.QueryRow(query, provider).Scan(
		&config.ID, &config.Provider, &config.Enabled, &config.ClientID, &config.ClientSecret,
		&config.TenantID, &config.RedirectURI, &config.AllowedDomainsJSON, &config.Config,
		&config.CreatedAt, &config.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("sso config not found")
	}
	if err != nil {
		return nil, err
	}

	// Parse allowed domains
	if config.AllowedDomainsJSON != "" {
		if err := json.Unmarshal([]byte(config.AllowedDomainsJSON), &config.AllowedDomains); err != nil {
			return nil, err
		}
	}

	return config, nil
}

// List retorna todas as configurações SSO
func (r *SSORepository) List() ([]domain.SSOConfig, error) {
	query := `
		SELECT id, provider, enabled, client_id, client_secret, tenant_id, redirect_uri, allowed_domains, config, created_at, updated_at
		FROM sso_configs
		ORDER BY provider
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	configs := []domain.SSOConfig{}
	for rows.Next() {
		config := domain.SSOConfig{}
		err := rows.Scan(
			&config.ID, &config.Provider, &config.Enabled, &config.ClientID, &config.ClientSecret,
			&config.TenantID, &config.RedirectURI, &config.AllowedDomainsJSON, &config.Config,
			&config.CreatedAt, &config.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse allowed domains
		if config.AllowedDomainsJSON != "" {
			if err := json.Unmarshal([]byte(config.AllowedDomainsJSON), &config.AllowedDomains); err != nil {
				return nil, err
			}
		}

		configs = append(configs, config)
	}

	return configs, nil
}

// Update atualiza uma configuração SSO
func (r *SSORepository) Update(config *domain.SSOConfig) error {
	allowedDomainsJSON, err := json.Marshal(config.AllowedDomains)
	if err != nil {
		return err
	}

	query := `
		UPDATE sso_configs
		SET enabled = $1, client_id = $2, client_secret = $3, tenant_id = $4,
		    redirect_uri = $5, allowed_domains = $6, config = $7, updated_at = CURRENT_TIMESTAMP
		WHERE provider = $8
		RETURNING updated_at
	`
	return r.db.QueryRow(
		query,
		config.Enabled,
		config.ClientID,
		config.ClientSecret,
		config.TenantID,
		config.RedirectURI,
		string(allowedDomainsJSON),
		config.Config,
		config.Provider,
	).Scan(&config.UpdatedAt)
}

// Delete deleta uma configuração SSO
func (r *SSORepository) Delete(provider string) error {
	query := `DELETE FROM sso_configs WHERE provider = $1`
	result, err := r.db.Exec(query, provider)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("sso config not found")
	}

	return nil
}

// GetEnabledProviders retorna os provedores SSO habilitados
func (r *SSORepository) GetEnabledProviders() ([]string, error) {
	query := `SELECT provider FROM sso_configs WHERE enabled = true ORDER BY provider`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	providers := []string{}
	for rows.Next() {
		var provider string
		if err := rows.Scan(&provider); err != nil {
			return nil, err
		}
		providers = append(providers, provider)
	}

	return providers, nil
}
