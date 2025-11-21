package service

import (
	"errors"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	userRepo  *repository.UserRepository
	auditRepo *repository.AuditRepository
}

func NewUserService(userRepo *repository.UserRepository, auditRepo *repository.AuditRepository) *UserService {
	return &UserService{
		userRepo:  userRepo,
		auditRepo: auditRepo,
	}
}

// Create cria um novo usuário
func (s *UserService) Create(req domain.CreateUserRequest, actorID, actorEmail string) (*domain.User, error) {
	// Verificar se o email já existe
	existingUser, _ := s.userRepo.GetByEmail(req.Email)
	if existingUser != nil {
		return nil, errors.New("email already exists")
	}

	user := &domain.User{
		Email:    req.Email,
		Name:     req.Name,
		IsActive: true,
		IsSSO:    req.IsSSO,
	}

	// Hash da senha se fornecida
	if req.Password != nil && *req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		hashStr := string(hash)
		user.PasswordHash = &hashStr
	}

	// Criar usuário
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Associar roles
	if len(req.RoleIDs) > 0 {
		s.userRepo.AssignRoles(user.ID, req.RoleIDs)
	}

	// Associar teams
	if len(req.TeamIDs) > 0 {
		s.userRepo.AssignTeams(user.ID, req.TeamIDs)
	}

	// Log de auditoria
	s.logAudit(&actorID, actorEmail, "user.create", "user", &user.ID, "success")

	// Carregar relacionamentos
	user.Roles, _ = s.userRepo.GetUserRoles(user.ID)
	user.Teams, _ = s.userRepo.GetUserTeams(user.ID)

	return user, nil
}

// GetByID retorna um usuário por ID
func (s *UserService) GetByID(id string) (*domain.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Carregar relacionamentos
	user.Roles, _ = s.userRepo.GetUserRoles(user.ID)
	user.Teams, _ = s.userRepo.GetUserTeams(user.ID)

	return user, nil
}

// List retorna uma lista de usuários
func (s *UserService) List(filter domain.UserFilter) (*domain.UserListResponse, error) {
	users, total, err := s.userRepo.List(filter)
	if err != nil {
		return nil, err
	}

	// Carregar relacionamentos para cada usuário
	for i := range users {
		users[i].Roles, _ = s.userRepo.GetUserRoles(users[i].ID)
		users[i].Teams, _ = s.userRepo.GetUserTeams(users[i].ID)
	}

	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Size <= 0 {
		filter.Size = 20
	}

	return &domain.UserListResponse{
		Users: users,
		Total: total,
		Page:  filter.Page,
		Size:  filter.Size,
	}, nil
}

// Update atualiza um usuário
func (s *UserService) Update(id string, req domain.UpdateUserRequest, actorID, actorEmail string) (*domain.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Atualizar campos
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	// Atualizar no banco
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	// Atualizar roles
	if req.RoleIDs != nil {
		s.userRepo.AssignRoles(user.ID, req.RoleIDs)
	}

	// Atualizar teams
	if req.TeamIDs != nil {
		s.userRepo.AssignTeams(user.ID, req.TeamIDs)
	}

	// Log de auditoria
	s.logAudit(&actorID, actorEmail, "user.update", "user", &user.ID, "success")

	// Carregar relacionamentos
	user.Roles, _ = s.userRepo.GetUserRoles(user.ID)
	user.Teams, _ = s.userRepo.GetUserTeams(user.ID)

	return user, nil
}

// Delete deleta um usuário
func (s *UserService) Delete(id string, actorID, actorEmail string) error {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return err
	}

	if err := s.userRepo.Delete(id); err != nil {
		s.logAudit(&actorID, actorEmail, "user.delete", "user", &id, "failure")
		return err
	}

	s.logAudit(&actorID, actorEmail, "user.delete", "user", &id, "success")
	_ = user // evitar warning
	return nil
}

// GetUserPermissions retorna as permissões de um usuário
func (s *UserService) GetUserPermissions(userID string) (*domain.UserPermissions, error) {
	return s.userRepo.GetUserPermissions(userID)
}

// GetStats retorna estatísticas de usuários
func (s *UserService) GetStats() (map[string]interface{}, error) {
	return s.userRepo.GetStats()
}

// logAudit registra um log de auditoria
func (s *UserService) logAudit(userID *string, userEmail, action, resource string, resourceID *string, status string) {
	log := &domain.AuditLog{
		UserID:     userID,
		UserEmail:  userEmail,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Status:     status,
	}
	s.auditRepo.Create(log)
}
