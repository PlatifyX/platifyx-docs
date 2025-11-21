package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

// SSOSettingsRepository handles database operations for SSO settings
type SSOSettingsRepository struct {
	db *sql.DB
}

// NewSSOSettingsRepository creates a new SSO settings repository
func NewSSOSettingsRepository(db *sql.DB) *SSOSettingsRepository {
	return &SSOSettingsRepository{db: db}
}

// GetAll retrieves all SSO settings
func (r *SSOSettingsRepository) GetAll() ([]domain.SSOSettings, error) {
	query := `
		SELECT id, provider, enabled, config, created_at, updated_at
		FROM sso_settings
		ORDER BY provider
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query sso settings: %w", err)
	}
	defer rows.Close()

	var settings []domain.SSOSettings
	for rows.Next() {
		var s domain.SSOSettings
		err := rows.Scan(&s.ID, &s.Provider, &s.Enabled, &s.Config, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sso settings: %w", err)
		}
		settings = append(settings, s)
	}

	return settings, nil
}

// GetByProvider retrieves SSO settings for a specific provider
func (r *SSOSettingsRepository) GetByProvider(provider string) (*domain.SSOSettings, error) {
	query := `
		SELECT id, provider, enabled, config, created_at, updated_at
		FROM sso_settings
		WHERE provider = $1
	`

	var s domain.SSOSettings
	err := r.db.QueryRow(query, provider).Scan(
		&s.ID, &s.Provider, &s.Enabled, &s.Config, &s.CreatedAt, &s.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query sso settings: %w", err)
	}

	return &s, nil
}

// Create creates new SSO settings
func (r *SSOSettingsRepository) Create(provider string, config json.RawMessage) (*domain.SSOSettings, error) {
	query := `
		INSERT INTO sso_settings (provider, enabled, config)
		VALUES ($1, $2, $3)
		RETURNING id, provider, enabled, config, created_at, updated_at
	`

	var s domain.SSOSettings
	err := r.db.QueryRow(query, provider, false, config).Scan(
		&s.ID, &s.Provider, &s.Enabled, &s.Config, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create sso settings: %w", err)
	}

	return &s, nil
}

// Update updates existing SSO settings
func (r *SSOSettingsRepository) Update(provider string, enabled bool, config json.RawMessage) (*domain.SSOSettings, error) {
	query := `
		UPDATE sso_settings
		SET enabled = $2, config = $3, updated_at = CURRENT_TIMESTAMP
		WHERE provider = $1
		RETURNING id, provider, enabled, config, created_at, updated_at
	`

	var s domain.SSOSettings
	err := r.db.QueryRow(query, provider, enabled, config).Scan(
		&s.ID, &s.Provider, &s.Enabled, &s.Config, &s.CreatedAt, &s.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("sso settings not found for provider: %s", provider)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update sso settings: %w", err)
	}

	return &s, nil
}

// UpdateEnabled updates only the enabled status
func (r *SSOSettingsRepository) UpdateEnabled(provider string, enabled bool) error {
	query := `
		UPDATE sso_settings
		SET enabled = $2, updated_at = CURRENT_TIMESTAMP
		WHERE provider = $1
	`

	result, err := r.db.Exec(query, provider, enabled)
	if err != nil {
		return fmt.Errorf("failed to update enabled status: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("sso settings not found for provider: %s", provider)
	}

	return nil
}

// Delete removes SSO settings for a provider
func (r *SSOSettingsRepository) Delete(provider string) error {
	query := `DELETE FROM sso_settings WHERE provider = $1`

	result, err := r.db.Exec(query, provider)
	if err != nil {
		return fmt.Errorf("failed to delete sso settings: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("sso settings not found for provider: %s", provider)
	}

	return nil
}

// Upsert creates or updates SSO settings
func (r *SSOSettingsRepository) Upsert(provider string, enabled bool, config json.RawMessage) (*domain.SSOSettings, error) {
	query := `
		INSERT INTO sso_settings (provider, enabled, config)
		VALUES ($1, $2, $3)
		ON CONFLICT (provider)
		DO UPDATE SET
			enabled = EXCLUDED.enabled,
			config = EXCLUDED.config,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, provider, enabled, config, created_at, updated_at
	`

	var s domain.SSOSettings
	err := r.db.QueryRow(query, provider, enabled, config).Scan(
		&s.ID, &s.Provider, &s.Enabled, &s.Config, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert sso settings: %w", err)
	}

	return &s, nil
}
