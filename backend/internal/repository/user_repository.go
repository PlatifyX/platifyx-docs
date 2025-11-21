package repository

import (
	"database/sql"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetAll retrieves all users
func (r *UserRepository) GetAll() ([]domain.User, error) {
	query := `
		SELECT id, email, name, avatar_url, provider, provider_id, is_active, last_login_at, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var u domain.User
		err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.Provider, &u.ProviderID, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, u)
	}

	return users, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id int) (*domain.User, error) {
	query := `
		SELECT id, email, name, avatar_url, provider, provider_id, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var u domain.User
	err := r.db.QueryRow(query, id).Scan(
		&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.Provider, &u.ProviderID, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	return &u, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	query := `
		SELECT id, email, name, password_hash, avatar_url, provider, provider_id, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var u domain.User
	err := r.db.QueryRow(query, email).Scan(
		&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.AvatarURL, &u.Provider, &u.ProviderID, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	return &u, nil
}

// Create creates a new user
func (r *UserRepository) Create(email, name, passwordHash string) (*domain.User, error) {
	query := `
		INSERT INTO users (email, name, password_hash, provider)
		VALUES ($1, $2, $3, 'local')
		RETURNING id, email, name, avatar_url, provider, provider_id, is_active, last_login_at, created_at, updated_at
	`

	var u domain.User
	err := r.db.QueryRow(query, email, name, passwordHash).Scan(
		&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.Provider, &u.ProviderID, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &u, nil
}

// Update updates a user
func (r *UserRepository) Update(id int, req domain.UpdateUserRequest) (*domain.User, error) {
	query := `
		UPDATE users
		SET name = COALESCE($2, name),
		    email = COALESCE($3, email),
		    is_active = COALESCE($4, is_active),
		    avatar_url = COALESCE($5, avatar_url),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, email, name, avatar_url, provider, provider_id, is_active, last_login_at, created_at, updated_at
	`

	var u domain.User
	err := r.db.QueryRow(query, id, req.Name, req.Email, req.IsActive, req.AvatarURL).Scan(
		&u.ID, &u.Email, &u.Name, &u.AvatarURL, &u.Provider, &u.ProviderID, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &u, nil
}

// Delete deletes a user
func (r *UserRepository) Delete(id int) error {
	query := `DELETE FROM users WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UpdateLastLogin updates the last login timestamp
func (r *UserRepository) UpdateLastLogin(id int) error {
	query := `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// GetUserRoles retrieves all roles for a user
func (r *UserRepository) GetUserRoles(userID int) ([]domain.Role, error) {
	query := `
		SELECT r.id, r.name, r.display_name, r.description, r.is_system, r.created_at, r.updated_at
		FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1
		ORDER BY r.name
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user roles: %w", err)
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		var role domain.Role
		err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	return roles, nil
}

// AssignRoles assigns roles to a user
func (r *UserRepository) AssignRoles(userID int, roleIDs []int, assignedBy int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete existing roles
	_, err = tx.Exec(`DELETE FROM user_roles WHERE user_id = $1`, userID)
	if err != nil {
		return fmt.Errorf("failed to delete existing roles: %w", err)
	}

	// Insert new roles
	for _, roleID := range roleIDs {
		var assignedByVal interface{}
		if assignedBy == 0 {
			assignedByVal = nil
		} else {
			assignedByVal = assignedBy
		}

		_, err = tx.Exec(`
			INSERT INTO user_roles (user_id, role_id, assigned_by)
			VALUES ($1, $2, $3)
		`, userID, roleID, assignedByVal)
		if err != nil {
			return fmt.Errorf("failed to assign role: %w", err)
		}
	}

	return tx.Commit()
}

// GetStats returns user statistics
func (r *UserRepository) GetStats() (*domain.UserStats, error) {
	var stats domain.UserStats

	// Total users
	err := r.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&stats.TotalUsers)
	if err != nil {
		return nil, err
	}

	// Active users
	err = r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE is_active = true`).Scan(&stats.ActiveUsers)
	if err != nil {
		return nil, err
	}

	// Total roles
	err = r.db.QueryRow(`SELECT COUNT(*) FROM roles`).Scan(&stats.TotalRoles)
	if err != nil {
		return nil, err
	}

	// Total audit actions (last 30 days)
	err = r.db.QueryRow(`
		SELECT COUNT(*) FROM audit_logs
		WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
	`).Scan(&stats.TotalActions)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
