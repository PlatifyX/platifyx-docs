package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type IntegrationRepository struct {
	db *sql.DB
}

func NewIntegrationRepository(db *sql.DB) *IntegrationRepository {
	return &IntegrationRepository{db: db}
}

func (r *IntegrationRepository) GetAll() ([]domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, created_at, updated_at
		FROM integrations
		ORDER BY name ASC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var integrations []domain.Integration
	for rows.Next() {
		var integration domain.Integration
		err := rows.Scan(
			&integration.ID,
			&integration.Name,
			&integration.Type,
			&integration.Enabled,
			&integration.Config,
			&integration.CreatedAt,
			&integration.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		integrations = append(integrations, integration)
	}

	return integrations, nil
}

func (r *IntegrationRepository) GetByType(integrationType string) (*domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, created_at, updated_at
		FROM integrations
		WHERE type = $1 AND enabled = true
		LIMIT 1
	`

	var integration domain.Integration
	err := r.db.QueryRow(query, integrationType).Scan(
		&integration.ID,
		&integration.Name,
		&integration.Type,
		&integration.Enabled,
		&integration.Config,
		&integration.CreatedAt,
		&integration.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &integration, nil
}

func (r *IntegrationRepository) GetByID(id int) (*domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, created_at, updated_at
		FROM integrations
		WHERE id = $1
	`

	var integration domain.Integration
	err := r.db.QueryRow(query, id).Scan(
		&integration.ID,
		&integration.Name,
		&integration.Type,
		&integration.Enabled,
		&integration.Config,
		&integration.CreatedAt,
		&integration.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("integration not found")
	}
	if err != nil {
		return nil, err
	}

	return &integration, nil
}

func (r *IntegrationRepository) Update(id int, enabled bool, config interface{}) error {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return err
	}

	query := `
		UPDATE integrations
		SET enabled = $1, config = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`

	result, err := r.db.Exec(query, enabled, configJSON, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("integration not found")
	}

	return nil
}

func (r *IntegrationRepository) Create(name, integrationType string, enabled bool, config interface{}) (*domain.Integration, error) {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO integrations (name, type, enabled, config)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, type, enabled, config, created_at, updated_at
	`

	var integration domain.Integration
	err = r.db.QueryRow(query, name, integrationType, enabled, configJSON).Scan(
		&integration.ID,
		&integration.Name,
		&integration.Type,
		&integration.Enabled,
		&integration.Config,
		&integration.CreatedAt,
		&integration.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &integration, nil
}

func (r *IntegrationRepository) Delete(id int) error {
	query := `DELETE FROM integrations WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("integration not found")
	}

	return nil
}
