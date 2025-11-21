package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create cria um novo usuário
func (r *UserRepository) Create(user *domain.User) error {
	query := `
		INSERT INTO users (email, name, avatar_url, password_hash, is_active, is_sso, sso_provider, sso_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(
		query,
		user.Email,
		user.Name,
		user.AvatarURL,
		user.PasswordHash,
		user.IsActive,
		user.IsSSO,
		user.SSOProvider,
		user.SSOID,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

// GetByID retorna um usuário por ID
func (r *UserRepository) GetByID(id string) (*domain.User, error) {
	user := &domain.User{}
	query := `
		SELECT id, email, name, avatar_url, password_hash, is_active, is_sso,
		       sso_provider, sso_id, last_login_at, created_at, updated_at
		FROM users WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.PasswordHash,
		&user.IsActive, &user.IsSSO, &user.SSOProvider, &user.SSOID,
		&user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

// GetByEmail retorna um usuário por email
func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	user := &domain.User{}
	query := `
		SELECT id, email, name, avatar_url, password_hash, is_active, is_sso,
		       sso_provider, sso_id, last_login_at, created_at, updated_at
		FROM users WHERE email = $1
	`
	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.PasswordHash,
		&user.IsActive, &user.IsSSO, &user.SSOProvider, &user.SSOID,
		&user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

// GetBySSOID retorna um usuário por SSO provider e ID
func (r *UserRepository) GetBySSOID(provider, ssoID string) (*domain.User, error) {
	user := &domain.User{}
	query := `
		SELECT id, email, name, avatar_url, password_hash, is_active, is_sso,
		       sso_provider, sso_id, last_login_at, created_at, updated_at
		FROM users WHERE sso_provider = $1 AND sso_id = $2
	`
	err := r.db.QueryRow(query, provider, ssoID).Scan(
		&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.PasswordHash,
		&user.IsActive, &user.IsSSO, &user.SSOProvider, &user.SSOID,
		&user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

// List retorna uma lista de usuários com filtros
func (r *UserRepository) List(filter domain.UserFilter) ([]domain.User, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argCount := 1

	if filter.Search != "" {
		where = append(where, fmt.Sprintf("(name ILIKE $%d OR email ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+filter.Search+"%")
		argCount++
	}

	if filter.IsActive != nil {
		where = append(where, fmt.Sprintf("is_active = $%d", argCount))
		args = append(args, *filter.IsActive)
		argCount++
	}

	if filter.IsSSO != nil {
		where = append(where, fmt.Sprintf("is_sso = $%d", argCount))
		args = append(args, *filter.IsSSO)
		argCount++
	}

	if filter.RoleID != "" {
		where = append(where, fmt.Sprintf("id IN (SELECT user_id FROM user_roles WHERE role_id = $%d)", argCount))
		args = append(args, filter.RoleID)
		argCount++
	}

	if filter.TeamID != "" {
		where = append(where, fmt.Sprintf("id IN (SELECT user_id FROM user_teams WHERE team_id = $%d)", argCount))
		args = append(args, filter.TeamID)
		argCount++
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users WHERE %s", whereClause)
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get users
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Size <= 0 {
		filter.Size = 20
	}

	offset := (filter.Page - 1) * filter.Size
	args = append(args, filter.Size, offset)

	query := fmt.Sprintf(`
		SELECT id, email, name, avatar_url, is_active, is_sso,
		       sso_provider, last_login_at, created_at, updated_at
		FROM users
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount, argCount+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	users := []domain.User{}
	for rows.Next() {
		user := domain.User{}
		err := rows.Scan(
			&user.ID, &user.Email, &user.Name, &user.AvatarURL,
			&user.IsActive, &user.IsSSO, &user.SSOProvider,
			&user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	return users, total, nil
}

// Update atualiza um usuário
func (r *UserRepository) Update(user *domain.User) error {
	query := `
		UPDATE users
		SET name = $1, avatar_url = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
		RETURNING updated_at
	`
	return r.db.QueryRow(query, user.Name, user.AvatarURL, user.IsActive, user.ID).Scan(&user.UpdatedAt)
}

// UpdatePassword atualiza a senha de um usuário
func (r *UserRepository) UpdatePassword(userID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.db.Exec(query, passwordHash, userID)
	return err
}

// UpdateLastLogin atualiza o último login do usuário
func (r *UserRepository) UpdateLastLogin(userID string) error {
	query := `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`
	_, err := r.db.Exec(query, userID)
	return err
}

// Delete deleta um usuário
func (r *UserRepository) Delete(id string) error {
	query := `DELETE FROM users WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// AssignRoles associa roles a um usuário
func (r *UserRepository) AssignRoles(userID string, roleIDs []string) error {
	// Remove roles existentes
	_, err := r.db.Exec("DELETE FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// Adiciona novos roles
	if len(roleIDs) == 0 {
		return nil
	}

	query := `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`
	for _, roleID := range roleIDs {
		_, err := r.db.Exec(query, userID, roleID)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetUserRoles retorna os roles de um usuário
func (r *UserRepository) GetUserRoles(userID string) ([]domain.Role, error) {
	query := `
		SELECT r.id, r.name, r.display_name, r.description, r.is_system, r.created_at, r.updated_at
		FROM roles r
		INNER JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
		ORDER BY r.name
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := []domain.Role{}
	for rows.Next() {
		role := domain.Role{}
		err := rows.Scan(
			&role.ID, &role.Name, &role.DisplayName, &role.Description,
			&role.IsSystem, &role.CreatedAt, &role.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}

	return roles, nil
}

// GetUserTeams retorna as equipes de um usuário
func (r *UserRepository) GetUserTeams(userID string) ([]domain.Team, error) {
	query := `
		SELECT t.id, t.name, t.display_name, t.description, t.avatar_url, t.created_at, t.updated_at
		FROM teams t
		INNER JOIN user_teams ut ON ut.team_id = t.id
		WHERE ut.user_id = $1
		ORDER BY t.name
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	teams := []domain.Team{}
	for rows.Next() {
		team := domain.Team{}
		err := rows.Scan(
			&team.ID, &team.Name, &team.DisplayName, &team.Description,
			&team.AvatarURL, &team.CreatedAt, &team.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		teams = append(teams, team)
	}

	return teams, nil
}

// GetUserPermissions retorna todas as permissões de um usuário (através dos roles)
func (r *UserRepository) GetUserPermissions(userID string) (*domain.UserPermissions, error) {
	// Get roles
	roles, err := r.GetUserRoles(userID)
	if err != nil {
		return nil, err
	}

	if len(roles) == 0 {
		return &domain.UserPermissions{
			UserID:        userID,
			Roles:         []domain.Role{},
			Permissions:   []domain.Permission{},
			PermissionMap: make(map[string][]string),
		}, nil
	}

	// Get permissions
	roleIDs := make([]interface{}, len(roles))
	placeholders := make([]string, len(roles))
	for i, role := range roles {
		roleIDs[i] = role.ID
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	query := fmt.Sprintf(`
		SELECT DISTINCT p.id, p.resource, p.action, p.description, p.created_at
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id IN (%s)
		ORDER BY p.resource, p.action
	`, strings.Join(placeholders, ","))

	rows, err := r.db.Query(query, roleIDs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := []domain.Permission{}
	permissionMap := make(map[string][]string)

	for rows.Next() {
		perm := domain.Permission{}
		err := rows.Scan(&perm.ID, &perm.Resource, &perm.Action, &perm.Description, &perm.CreatedAt)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, perm)

		if _, exists := permissionMap[perm.Resource]; !exists {
			permissionMap[perm.Resource] = []string{}
		}
		permissionMap[perm.Resource] = append(permissionMap[perm.Resource], perm.Action)
	}

	return &domain.UserPermissions{
		UserID:        userID,
		Roles:         roles,
		Permissions:   permissions,
		PermissionMap: permissionMap,
	}, nil
}

// AssignTeams associa equipes a um usuário
func (r *UserRepository) AssignTeams(userID string, teamIDs []string) error {
	// Remove equipes existentes
	_, err := r.db.Exec("DELETE FROM user_teams WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// Adiciona novas equipes
	if len(teamIDs) == 0 {
		return nil
	}

	query := `INSERT INTO user_teams (user_id, team_id, role) VALUES ($1, $2, 'member')`
	for _, teamID := range teamIDs {
		_, err := r.db.Exec(query, userID, teamID)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetStats retorna estatísticas de usuários
func (r *UserRepository) GetStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total de usuários
	var total int
	err := r.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&total)
	if err != nil {
		return nil, err
	}
	stats["total"] = total

	// Usuários ativos
	var active int
	err = r.db.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = true").Scan(&active)
	if err != nil {
		return nil, err
	}
	stats["active"] = active

	// Usuários SSO
	var sso int
	err = r.db.QueryRow("SELECT COUNT(*) FROM users WHERE is_sso = true").Scan(&sso)
	if err != nil {
		return nil, err
	}
	stats["sso"] = sso

	// Usuários por role
	rows, err := r.db.Query(`
		SELECT r.name, COUNT(ur.user_id) as count
		FROM roles r
		LEFT JOIN user_roles ur ON ur.role_id = r.id
		GROUP BY r.name
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usersByRole := make(map[string]int)
	for rows.Next() {
		var roleName string
		var count int
		if err := rows.Scan(&roleName, &count); err != nil {
			return nil, err
		}
		usersByRole[roleName] = count
	}
	stats["by_role"] = usersByRole

	return stats, nil
}
