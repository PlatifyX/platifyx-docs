package repository

import (
	"database/sql"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type UserOrganizationRepository struct {
	db *sql.DB
}

func NewUserOrganizationRepository(db *sql.DB) *UserOrganizationRepository {
	return &UserOrganizationRepository{db: db}
}

func (r *UserOrganizationRepository) GetByUserID(userID string) ([]domain.UserOrganization, error) {
	query := `
		SELECT id, user_id, organization_uuid, role, created_at, updated_at
		FROM user_organizations
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userOrgs []domain.UserOrganization
	for rows.Next() {
		var uo domain.UserOrganization
		err := rows.Scan(
			&uo.ID,
			&uo.UserID,
			&uo.OrganizationUUID,
			&uo.Role,
			&uo.CreatedAt,
			&uo.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		userOrgs = append(userOrgs, uo)
	}

	return userOrgs, nil
}

func (r *UserOrganizationRepository) GetByOrganizationUUID(orgUUID string) ([]domain.UserOrganization, error) {
	query := `
		SELECT id, user_id, organization_uuid, role, created_at, updated_at
		FROM user_organizations
		WHERE organization_uuid = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, orgUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userOrgs []domain.UserOrganization
	for rows.Next() {
		var uo domain.UserOrganization
		err := rows.Scan(
			&uo.ID,
			&uo.UserID,
			&uo.OrganizationUUID,
			&uo.Role,
			&uo.CreatedAt,
			&uo.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		userOrgs = append(userOrgs, uo)
	}

	return userOrgs, nil
}

func (r *UserOrganizationRepository) GetByUserAndOrganization(userID, orgUUID string) (*domain.UserOrganization, error) {
	query := `
		SELECT id, user_id, organization_uuid, role, created_at, updated_at
		FROM user_organizations
		WHERE user_id = $1 AND organization_uuid = $2
	`

	var uo domain.UserOrganization
	err := r.db.QueryRow(query, userID, orgUUID).Scan(
		&uo.ID,
		&uo.UserID,
		&uo.OrganizationUUID,
		&uo.Role,
		&uo.CreatedAt,
		&uo.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &uo, nil
}

func (r *UserOrganizationRepository) Create(uo *domain.UserOrganization) error {
	if uo.Role == "" {
		uo.Role = "member"
	}

	query := `
		INSERT INTO user_organizations (user_id, organization_uuid, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(query, uo.UserID, uo.OrganizationUUID, uo.Role).Scan(
		&uo.ID,
		&uo.CreatedAt,
		&uo.UpdatedAt,
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *UserOrganizationRepository) UpdateRole(id, role string) error {
	query := `
		UPDATE user_organizations
		SET role = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	result, err := r.db.Exec(query, role, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user organization not found")
	}

	return nil
}

func (r *UserOrganizationRepository) Delete(id string) error {
	query := `DELETE FROM user_organizations WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user organization not found")
	}

	return nil
}

func (r *UserOrganizationRepository) DeleteByUserAndOrganization(userID, orgUUID string) error {
	query := `DELETE FROM user_organizations WHERE user_id = $1 AND organization_uuid = $2`

	result, err := r.db.Exec(query, userID, orgUUID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user organization not found")
	}

	return nil
}


