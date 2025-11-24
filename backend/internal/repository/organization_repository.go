package repository

import (
	"database/sql"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type OrganizationRepository struct {
	db *sql.DB
}

func NewOrganizationRepository(db *sql.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

func (r *OrganizationRepository) GetAll() ([]domain.Organization, error) {
	query := `
		SELECT uuid, name, sso_active, database_address_write, database_address_read, created_at, updated_at
		FROM organizations
		ORDER BY name ASC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var organizations []domain.Organization
	for rows.Next() {
		var org domain.Organization
		var databaseAddressRead sql.NullString
		err := rows.Scan(
			&org.UUID,
			&org.Name,
			&org.SSOActive,
			&org.DatabaseAddressWrite,
			&databaseAddressRead,
			&org.CreatedAt,
			&org.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if databaseAddressRead.Valid {
			org.DatabaseAddressRead = databaseAddressRead.String
		}
		organizations = append(organizations, org)
	}

	return organizations, nil
}

func (r *OrganizationRepository) GetByUUID(uuid string) (*domain.Organization, error) {
	query := `
		SELECT uuid, name, sso_active, database_address_write, database_address_read, created_at, updated_at
		FROM organizations
		WHERE uuid = $1
	`

	var org domain.Organization
	var databaseAddressRead sql.NullString
	err := r.db.QueryRow(query, uuid).Scan(
		&org.UUID,
		&org.Name,
		&org.SSOActive,
		&org.DatabaseAddressWrite,
		&databaseAddressRead,
		&org.CreatedAt,
		&org.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("organization not found")
	}
	if err != nil {
		return nil, err
	}

	if databaseAddressRead.Valid {
		org.DatabaseAddressRead = databaseAddressRead.String
	}

	return &org, nil
}

func (r *OrganizationRepository) Create(org *domain.Organization) error {
	query := `
		INSERT INTO organizations (uuid, name, sso_active, database_address_write, database_address_read)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at, updated_at
	`

	var databaseAddressRead sql.NullString
	if org.DatabaseAddressRead != "" {
		databaseAddressRead.String = org.DatabaseAddressRead
		databaseAddressRead.Valid = true
	}

	err := r.db.QueryRow(
		query,
		org.UUID,
		org.Name,
		org.SSOActive,
		org.DatabaseAddressWrite,
		databaseAddressRead,
	).Scan(&org.CreatedAt, &org.UpdatedAt)

	if err != nil {
		return err
	}

	return nil
}

func (r *OrganizationRepository) Update(uuid string, org *domain.Organization) error {
	query := `
		UPDATE organizations
		SET name = $1, sso_active = $2, database_address_write = $3, database_address_read = $4, updated_at = CURRENT_TIMESTAMP
		WHERE uuid = $5
		RETURNING updated_at
	`

	var databaseAddressRead sql.NullString
	if org.DatabaseAddressRead != "" {
		databaseAddressRead.String = org.DatabaseAddressRead
		databaseAddressRead.Valid = true
	}

	result, err := r.db.Exec(
		query,
		org.Name,
		org.SSOActive,
		org.DatabaseAddressWrite,
		databaseAddressRead,
		uuid,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("organization not found")
	}

	return nil
}

func (r *OrganizationRepository) Delete(uuid string) error {
	query := `DELETE FROM organizations WHERE uuid = $1`

	result, err := r.db.Exec(query, uuid)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("organization not found")
	}

	return nil
}


