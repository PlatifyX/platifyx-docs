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

func (r *IntegrationRepository) GetAll(organizationUUID string) ([]domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, organization_uuid, created_at, updated_at
		FROM integrations
		WHERE organization_uuid = $1
		ORDER BY name ASC
	`

	rows, err := r.db.Query(query, organizationUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var integrations []domain.Integration
	for rows.Next() {
		var integration domain.Integration
		var orgUUID sql.NullString
		err := rows.Scan(
			&integration.ID,
			&integration.Name,
			&integration.Type,
			&integration.Enabled,
			&integration.Config,
			&orgUUID,
			&integration.CreatedAt,
			&integration.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if orgUUID.Valid {
			integration.OrganizationUUID = &orgUUID.String
		}
		integrations = append(integrations, integration)
	}

	return integrations, nil
}

func (r *IntegrationRepository) GetByType(integrationType string, organizationUUID string) (*domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, organization_uuid, created_at, updated_at
		FROM integrations
		WHERE type = $1 AND enabled = true AND organization_uuid = $2
		LIMIT 1
	`

	var integration domain.Integration
	var orgUUID sql.NullString
	err := r.db.QueryRow(query, integrationType, organizationUUID).Scan(
		&integration.ID,
		&integration.Name,
		&integration.Type,
		&integration.Enabled,
		&integration.Config,
		&orgUUID,
		&integration.CreatedAt,
		&integration.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if orgUUID.Valid {
		integration.OrganizationUUID = &orgUUID.String
	}

	return &integration, nil
}

func (r *IntegrationRepository) GetAllByType(integrationType string, organizationUUID string) ([]domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, organization_uuid, created_at, updated_at
		FROM integrations
		WHERE type = $1 AND enabled = true AND organization_uuid = $2
		ORDER BY name ASC
	`

	rows, err := r.db.Query(query, integrationType, organizationUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var integrations []domain.Integration
	for rows.Next() {
		var integration domain.Integration
		var orgUUID sql.NullString
		err := rows.Scan(
			&integration.ID,
			&integration.Name,
			&integration.Type,
			&integration.Enabled,
			&integration.Config,
			&orgUUID,
			&integration.CreatedAt,
			&integration.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if orgUUID.Valid {
			integration.OrganizationUUID = &orgUUID.String
		}
		integrations = append(integrations, integration)
	}

	return integrations, nil
}

func (r *IntegrationRepository) GetByID(id int, organizationUUID string) (*domain.Integration, error) {
	query := `
		SELECT id, name, type, enabled, config, organization_uuid, created_at, updated_at
		FROM integrations
		WHERE id = $1 AND organization_uuid = $2
	`

	var integration domain.Integration
	var orgUUID sql.NullString
	err := r.db.QueryRow(query, id, organizationUUID).Scan(
		&integration.ID,
		&integration.Name,
		&integration.Type,
		&integration.Enabled,
		&integration.Config,
		&orgUUID,
		&integration.CreatedAt,
		&integration.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("integration not found")
	}
	if err != nil {
		return nil, err
	}
	if orgUUID.Valid {
		integration.OrganizationUUID = &orgUUID.String
	}

	return &integration, nil
}

func (r *IntegrationRepository) Update(id int, organizationUUID string, enabled bool, config interface{}) error {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return err
	}

	query := `
		UPDATE integrations
		SET enabled = $1, config = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3 AND organization_uuid = $4
	`

	result, err := r.db.Exec(query, enabled, configJSON, id, organizationUUID)
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

func (r *IntegrationRepository) Create(name, integrationType string, organizationUUID string, enabled bool, config interface{}) (*domain.Integration, error) {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO integrations (name, type, enabled, config, organization_uuid)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, type, enabled, config, organization_uuid, created_at, updated_at
	`

	var integration domain.Integration
	var orgUUID sql.NullString
	err = r.db.QueryRow(query, name, integrationType, enabled, configJSON, organizationUUID).Scan(
		&integration.ID,
		&integration.Name,
		&integration.Type,
		&integration.Enabled,
		&integration.Config,
		&orgUUID,
		&integration.CreatedAt,
		&integration.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	if orgUUID.Valid {
		integration.OrganizationUUID = &orgUUID.String
	}

	return &integration, nil
}

func (r *IntegrationRepository) Delete(id int, organizationUUID string) error {
	query := `DELETE FROM integrations WHERE id = $1 AND organization_uuid = $2`

	result, err := r.db.Exec(query, id, organizationUUID)
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
