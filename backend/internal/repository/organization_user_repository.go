package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/database"
)

type OrganizationUserRepository struct {
	coreDB *sql.DB
}

func NewOrganizationUserRepository(coreDB *sql.DB) *OrganizationUserRepository {
	return &OrganizationUserRepository{coreDB: coreDB}
}

func (r *OrganizationUserRepository) GetNodeDB(org *domain.Organization) (*sql.DB, error) {
	return database.GetOrganizationNodeDB(org)
}

func (r *OrganizationUserRepository) GetAllUsers(org *domain.Organization) ([]domain.OrganizationUser, error) {
	nodeDB, err := r.GetNodeDB(org)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to node database: %w", err)
	}
	defer nodeDB.Close()

	schemaEscaped := database.EscapeSchemaName(org.UUID)
	query := fmt.Sprintf(`
		SELECT id, email, name, avatar_url, password_hash, is_active, is_sso, sso_provider, sso_id, last_login_at, created_at, updated_at
		FROM %s.users
		ORDER BY created_at DESC
	`, schemaEscaped)

	rows, err := nodeDB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []domain.OrganizationUser
	for rows.Next() {
		var user domain.OrganizationUser
		var passwordHash sql.NullString
		var avatarURL sql.NullString
		var ssoProvider sql.NullString
		var ssoID sql.NullString
		var lastLoginAt sql.NullTime

		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&avatarURL,
			&passwordHash,
			&user.IsActive,
			&user.IsSSO,
			&ssoProvider,
			&ssoID,
			&lastLoginAt,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if avatarURL.Valid {
			user.AvatarURL = &avatarURL.String
		}
		if passwordHash.Valid {
			user.PasswordHash = &passwordHash.String
		}
		if ssoProvider.Valid {
			user.SSOProvider = &ssoProvider.String
		}
		if ssoID.Valid {
			user.SSOID = &ssoID.String
		}
		if lastLoginAt.Valid {
			user.LastLoginAt = &lastLoginAt.Time
		}

		users = append(users, user)
	}

	return users, nil
}

func (r *OrganizationUserRepository) GetUserByID(org *domain.Organization, userID string) (*domain.OrganizationUser, error) {
	nodeDB, err := r.GetNodeDB(org)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to node database: %w", err)
	}
	defer nodeDB.Close()

	schemaEscaped := database.EscapeSchemaName(org.UUID)
	query := fmt.Sprintf(`
		SELECT id, email, name, avatar_url, password_hash, is_active, is_sso, sso_provider, sso_id, last_login_at, created_at, updated_at
		FROM %s.users
		WHERE id = $1
	`, schemaEscaped)

	var user domain.OrganizationUser
	var passwordHash sql.NullString
	var avatarURL sql.NullString
	var ssoProvider sql.NullString
	var ssoID sql.NullString
	var lastLoginAt sql.NullTime

	err = nodeDB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&avatarURL,
		&passwordHash,
		&user.IsActive,
		&user.IsSSO,
		&ssoProvider,
		&ssoID,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, err
	}

	if avatarURL.Valid {
		user.AvatarURL = &avatarURL.String
	}
	if passwordHash.Valid {
		user.PasswordHash = &passwordHash.String
	}
	if ssoProvider.Valid {
		user.SSOProvider = &ssoProvider.String
	}
	if ssoID.Valid {
		user.SSOID = &ssoID.String
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return &user, nil
}

func (r *OrganizationUserRepository) CreateUser(org *domain.Organization, user *domain.OrganizationUser) error {
	nodeDB, err := r.GetNodeDB(org)
	if err != nil {
		return fmt.Errorf("failed to connect to node database: %w", err)
	}
	defer nodeDB.Close()

	schemaEscaped := database.EscapeSchemaName(org.UUID)
	query := fmt.Sprintf(`
		INSERT INTO %s.users (id, email, name, avatar_url, password_hash, is_active, is_sso, sso_provider, sso_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at
	`, schemaEscaped)

	var passwordHash sql.NullString
	var avatarURL sql.NullString
	var ssoProvider sql.NullString
	var ssoID sql.NullString

	if user.PasswordHash != nil {
		passwordHash.String = *user.PasswordHash
		passwordHash.Valid = true
	}
	if user.AvatarURL != nil {
		avatarURL.String = *user.AvatarURL
		avatarURL.Valid = true
	}
	if user.SSOProvider != nil {
		ssoProvider.String = *user.SSOProvider
		ssoProvider.Valid = true
	}
	if user.SSOID != nil {
		ssoID.String = *user.SSOID
		ssoID.Valid = true
	}

	err = nodeDB.QueryRow(
		query,
		user.ID,
		user.Email,
		user.Name,
		avatarURL,
		passwordHash,
		user.IsActive,
		user.IsSSO,
		ssoProvider,
		ssoID,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	return err
}

func (r *OrganizationUserRepository) UpdateUser(org *domain.Organization, user *domain.OrganizationUser) error {
	nodeDB, err := r.GetNodeDB(org)
	if err != nil {
		return fmt.Errorf("failed to connect to node database: %w", err)
	}
	defer nodeDB.Close()

	schemaEscaped := database.EscapeSchemaName(org.UUID)
	
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if user.Name != "" {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, user.Name)
		argIndex++
	}

	if user.AvatarURL != nil {
		setParts = append(setParts, fmt.Sprintf("avatar_url = $%d", argIndex))
		args = append(args, *user.AvatarURL)
		argIndex++
	}

	if user.PasswordHash != nil {
		setParts = append(setParts, fmt.Sprintf("password_hash = $%d", argIndex))
		args = append(args, *user.PasswordHash)
		argIndex++
	}

	setParts = append(setParts, fmt.Sprintf("is_active = $%d", argIndex))
	args = append(args, user.IsActive)
	argIndex++

	setParts = append(setParts, "updated_at = CURRENT_TIMESTAMP")
	args = append(args, user.ID)

	query := fmt.Sprintf(`
		UPDATE %s.users
		SET %s
		WHERE id = $%d
	`, schemaEscaped, strings.Join(setParts, ", "), argIndex)

	_, err = nodeDB.Exec(query, args...)
	return err
}

func (r *OrganizationUserRepository) DeleteUser(org *domain.Organization, userID string) error {
	nodeDB, err := r.GetNodeDB(org)
	if err != nil {
		return fmt.Errorf("failed to connect to node database: %w", err)
	}
	defer nodeDB.Close()

	schemaEscaped := database.EscapeSchemaName(org.UUID)
	query := fmt.Sprintf(`DELETE FROM %s.users WHERE id = $1`, schemaEscaped)

	_, err = nodeDB.Exec(query, userID)
	return err
}

