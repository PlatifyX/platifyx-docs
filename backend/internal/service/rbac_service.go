package service

import (
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"golang.org/x/crypto/bcrypt"
)

type RBACService struct {
	userRepo *repository.UserRepository
	roleRepo *repository.RoleRepository
	permRepo *repository.PermissionRepository
	log      *logger.Logger
}

func NewRBACService(userRepo *repository.UserRepository, roleRepo *repository.RoleRepository, permRepo *repository.PermissionRepository, log *logger.Logger) *RBACService {
	return &RBACService{
		userRepo: userRepo,
		roleRepo: roleRepo,
		permRepo: permRepo,
		log:      log,
	}
}

// User operations
func (s *RBACService) GetAllUsers() ([]domain.User, error) {
	users, err := s.userRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Load roles for each user
	for i := range users {
		roles, err := s.userRepo.GetUserRoles(users[i].ID)
		if err != nil {
			s.log.Error("Failed to load user roles", err, map[string]interface{}{"userId": users[i].ID})
			continue
		}
		users[i].Roles = roles
	}

	return users, nil
}

func (s *RBACService) GetUserByID(id int) (*domain.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	// Load user roles
	roles, err := s.userRepo.GetUserRoles(user.ID)
	if err != nil {
		return nil, err
	}
	user.Roles = roles

	// Load permissions for each role
	for i := range user.Roles {
		perms, err := s.roleRepo.GetRolePermissions(user.Roles[i].ID)
		if err != nil {
			continue
		}
		user.Roles[i].Permissions = perms
	}

	return user, nil
}

func (s *RBACService) CreateUser(req domain.CreateUserRequest) (*domain.User, error) {
	// Check if email already exists
	existing, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("email already in use")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user, err := s.userRepo.Create(req.Email, req.Name, string(hash))
	if err != nil {
		return nil, err
	}

	// Assign roles if provided
	if len(req.RoleIDs) > 0 {
		err = s.userRepo.AssignRoles(user.ID, req.RoleIDs, 0) // 0 = system
		if err != nil {
			return nil, err
		}

		// Reload user with roles
		return s.GetUserByID(user.ID)
	}

	return user, nil
}

func (s *RBACService) UpdateUser(id int, req domain.UpdateUserRequest) (*domain.User, error) {
	_, err := s.userRepo.Update(id, req)
	if err != nil {
		return nil, err
	}

	// Update roles if provided
	if len(req.RoleIDs) > 0 {
		err = s.userRepo.AssignRoles(id, req.RoleIDs, 0)
		if err != nil {
			return nil, err
		}
	}

	return s.GetUserByID(id)
}

func (s *RBACService) DeleteUser(id int) error {
	return s.userRepo.Delete(id)
}

func (s *RBACService) GetUserStats() (*domain.UserStats, error) {
	return s.userRepo.GetStats()
}

// Role operations
func (s *RBACService) GetAllRoles() ([]domain.Role, error) {
	roles, err := s.roleRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Load permissions for each role
	for i := range roles {
		perms, err := s.roleRepo.GetRolePermissions(roles[i].ID)
		if err != nil {
			s.log.Error("Failed to load role permissions", err, map[string]interface{}{"roleId": roles[i].ID})
			continue
		}
		roles[i].Permissions = perms
	}

	return roles, nil
}

func (s *RBACService) GetRoleByID(id int) (*domain.Role, error) {
	role, err := s.roleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if role == nil {
		return nil, fmt.Errorf("role not found")
	}

	// Load permissions
	perms, err := s.roleRepo.GetRolePermissions(role.ID)
	if err != nil {
		return nil, err
	}
	role.Permissions = perms

	return role, nil
}

func (s *RBACService) CreateRole(req domain.CreateRoleRequest) (*domain.Role, error) {
	role, err := s.roleRepo.Create(req)
	if err != nil {
		return nil, err
	}

	// Assign permissions if provided
	if len(req.PermissionIDs) > 0 {
		err = s.roleRepo.AssignPermissions(role.ID, req.PermissionIDs)
		if err != nil {
			return nil, err
		}
		return s.GetRoleByID(role.ID)
	}

	return role, nil
}

func (s *RBACService) UpdateRole(id int, req domain.UpdateRoleRequest) (*domain.Role, error) {
	_, err := s.roleRepo.Update(id, req)
	if err != nil {
		return nil, err
	}

	// Update permissions if provided
	if len(req.PermissionIDs) > 0 {
		err = s.roleRepo.AssignPermissions(id, req.PermissionIDs)
		if err != nil {
			return nil, err
		}
	}

	return s.GetRoleByID(id)
}

func (s *RBACService) DeleteRole(id int) error {
	return s.roleRepo.Delete(id)
}

func (s *RBACService) AssignRolePermissions(roleID int, permissionIDs []int) error {
	return s.roleRepo.AssignPermissions(roleID, permissionIDs)
}

// Permission operations
func (s *RBACService) GetAllPermissions() ([]domain.Permission, error) {
	return s.permRepo.GetAll()
}

func (s *RBACService) GetUserPermissions(userID int) ([]domain.Permission, error) {
	return s.permRepo.GetUserPermissions(userID)
}
