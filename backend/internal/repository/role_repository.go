package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type RoleRepository struct {
	db *sql.DB
}

func NewRoleRepository(db *sql.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

// Create cria um novo role
func (r *RoleRepository) Create(role *domain.Role) error {
	query := `
		INSERT INTO roles (name, display_name, description, is_system)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(
		query,
		role.Name,
		role.DisplayName,
		role.Description,
		role.IsSystem,
	).Scan(&role.ID, &role.CreatedAt, &role.UpdatedAt)
}

// GetByID retorna um role por ID
func (r *RoleRepository) GetByID(id string) (*domain.Role, error) {
	role := &domain.Role{}
	query := `
		SELECT id, name, display_name, description, is_system, created_at, updated_at
		FROM roles WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&role.ID, &role.Name, &role.DisplayName, &role.Description,
		&role.IsSystem, &role.CreatedAt, &role.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}
	return role, err
}

// GetByName retorna um role por nome
func (r *RoleRepository) GetByName(name string) (*domain.Role, error) {
	role := &domain.Role{}
	query := `
		SELECT id, name, display_name, description, is_system, created_at, updated_at
		FROM roles WHERE name = $1
	`
	err := r.db.QueryRow(query, name).Scan(
		&role.ID, &role.Name, &role.DisplayName, &role.Description,
		&role.IsSystem, &role.CreatedAt, &role.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}
	return role, err
}

// List retorna todos os roles
func (r *RoleRepository) List() ([]domain.Role, error) {
	query := `
		SELECT id, name, display_name, description, is_system, created_at, updated_at
		FROM roles
		ORDER BY name
	`

	rows, err := r.db.Query(query)
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

// Update atualiza um role
func (r *RoleRepository) Update(role *domain.Role) error {
	query := `
		UPDATE roles
		SET display_name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3 AND is_system = false
		RETURNING updated_at
	`
	err := r.db.QueryRow(query, role.DisplayName, role.Description, role.ID).Scan(&role.UpdatedAt)
	if err == sql.ErrNoRows {
		return fmt.Errorf("role not found or is a system role")
	}
	return err
}

// Delete deleta um role
func (r *RoleRepository) Delete(id string) error {
	query := `DELETE FROM roles WHERE id = $1 AND is_system = false`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("role not found or is a system role")
	}

	return nil
}

// AssignPermissions associa permissões a um role
func (r *RoleRepository) AssignPermissions(roleID string, permissionIDs []string) error {
	// Remove permissões existentes
	_, err := r.db.Exec("DELETE FROM role_permissions WHERE role_id = $1", roleID)
	if err != nil {
		return err
	}

	// Adiciona novas permissões
	if len(permissionIDs) == 0 {
		return nil
	}

	query := `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`
	for _, permissionID := range permissionIDs {
		_, err := r.db.Exec(query, roleID, permissionID)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetRolePermissions retorna as permissões de um role
func (r *RoleRepository) GetRolePermissions(roleID string) ([]domain.Permission, error) {
	query := `
		SELECT p.id, p.resource, p.action, p.description, p.created_at
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = $1
		ORDER BY p.resource, p.action
	`

	rows, err := r.db.Query(query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := []domain.Permission{}
	for rows.Next() {
		perm := domain.Permission{}
		err := rows.Scan(&perm.ID, &perm.Resource, &perm.Action, &perm.Description, &perm.CreatedAt)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// ListPermissions retorna todas as permissões
func (r *RoleRepository) ListPermissions() ([]domain.Permission, error) {
	query := `
		SELECT id, resource, action, description, created_at
		FROM permissions
		ORDER BY resource, action
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := []domain.Permission{}
	for rows.Next() {
		perm := domain.Permission{}
		err := rows.Scan(&perm.ID, &perm.Resource, &perm.Action, &perm.Description, &perm.CreatedAt)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// GetPermissionByID retorna uma permissão por ID
func (r *RoleRepository) GetPermissionByID(id string) (*domain.Permission, error) {
	perm := &domain.Permission{}
	query := `
		SELECT id, resource, action, description, created_at
		FROM permissions WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&perm.ID, &perm.Resource, &perm.Action, &perm.Description, &perm.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}
	return perm, err
}

// GetPermissionsByIDs retorna múltiplas permissões por IDs
func (r *RoleRepository) GetPermissionsByIDs(ids []string) ([]domain.Permission, error) {
	if len(ids) == 0 {
		return []domain.Permission{}, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT id, resource, action, description, created_at
		FROM permissions
		WHERE id IN (%s)
		ORDER BY resource, action
	`, strings.Join(placeholders, ","))

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := []domain.Permission{}
	for rows.Next() {
		perm := domain.Permission{}
		err := rows.Scan(&perm.ID, &perm.Resource, &perm.Action, &perm.Description, &perm.CreatedAt)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, perm)
	}

	return permissions, nil
}
