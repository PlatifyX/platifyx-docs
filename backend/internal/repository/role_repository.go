package repository

import (
	"database/sql"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type RoleRepository struct {
	db *sql.DB
}

func NewRoleRepository(db *sql.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) GetAll() ([]domain.Role, error) {
	query := `SELECT id, name, display_name, description, is_system, created_at, updated_at FROM roles ORDER BY name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query roles: %w", err)
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		var role domain.Role
		if err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *RoleRepository) GetByID(id int) (*domain.Role, error) {
	query := `SELECT id, name, display_name, description, is_system, created_at, updated_at FROM roles WHERE id = $1`
	var role domain.Role
	err := r.db.QueryRow(query, id).Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &role, err
}

func (r *RoleRepository) Create(req domain.CreateRoleRequest) (*domain.Role, error) {
	query := `INSERT INTO roles (name, display_name, description) VALUES ($1, $2, $3) RETURNING id, name, display_name, description, is_system, created_at, updated_at`
	var role domain.Role
	err := r.db.QueryRow(query, req.Name, req.DisplayName, req.Description).Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt)
	return &role, err
}

func (r *RoleRepository) Update(id int, req domain.UpdateRoleRequest) (*domain.Role, error) {
	query := `UPDATE roles SET display_name = COALESCE($2, display_name), description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, display_name, description, is_system, created_at, updated_at`
	var role domain.Role
	err := r.db.QueryRow(query, id, req.DisplayName, req.Description).Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt)
	return &role, err
}

func (r *RoleRepository) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM roles WHERE id = $1 AND is_system = false`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("role not found or is a system role")
	}
	return nil
}

func (r *RoleRepository) GetRolePermissions(roleID int) ([]domain.Permission, error) {
	query := `SELECT p.id, p.resource, p.action, p.description, p.created_at FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1 ORDER BY p.resource, p.action`
	rows, err := r.db.Query(query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var perms []domain.Permission
	for rows.Next() {
		var p domain.Permission
		if err := rows.Scan(&p.ID, &p.Resource, &p.Action, &p.Description, &p.CreatedAt); err != nil {
			return nil, err
		}
		perms = append(perms, p)
	}
	return perms, nil
}

func (r *RoleRepository) AssignPermissions(roleID int, permissionIDs []int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM role_permissions WHERE role_id = $1`, roleID)
	if err != nil {
		return err
	}

	for _, permID := range permissionIDs {
		_, err = tx.Exec(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, roleID, permID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
