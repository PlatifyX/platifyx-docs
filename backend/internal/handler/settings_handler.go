package handler

import (
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/gin-gonic/gin"
)

// SettingsHandler agrupa todos os handlers de configurações (users, roles, teams, audit, sso)
type SettingsHandler struct {
	userService *service.UserService
	userRepo    *repository.UserRepository
	roleRepo    *repository.RoleRepository
	teamRepo    *repository.TeamRepository
	auditRepo   *repository.AuditRepository
	ssoRepo     *repository.SSORepository
}

func NewSettingsHandler(
	userService *service.UserService,
	userRepo *repository.UserRepository,
	roleRepo *repository.RoleRepository,
	teamRepo *repository.TeamRepository,
	auditRepo *repository.AuditRepository,
	ssoRepo *repository.SSORepository,
) *SettingsHandler {
	return &SettingsHandler{
		userService: userService,
		userRepo:    userRepo,
		roleRepo:    roleRepo,
		teamRepo:    teamRepo,
		auditRepo:   auditRepo,
		ssoRepo:     ssoRepo,
	}
}

func (h *SettingsHandler) getActor(c *gin.Context) (string, string) {
	userID, _ := c.Get("user_id")
	user, _ := c.Get("user")

	actorID := ""
	actorEmail := "system"

	if userID != nil {
		actorID = userID.(string)
	}
	if user != nil {
		if u, ok := user.(*domain.User); ok {
			actorEmail = u.Email
		}
	}

	return actorID, actorEmail
}

// validateEmail valida se o email está em formato válido
func (h *SettingsHandler) validateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// validatePassword valida se a senha atende aos requisitos mínimos
func (h *SettingsHandler) validatePassword(password string) error {
	if len(password) < 8 {
		return &domain.ValidationError{Field: "password", Message: "Senha deve ter no mínimo 8 caracteres"}
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)

	if !hasUpper {
		return &domain.ValidationError{Field: "password", Message: "Senha deve conter pelo menos uma letra maiúscula"}
	}
	if !hasLower {
		return &domain.ValidationError{Field: "password", Message: "Senha deve conter pelo menos uma letra minúscula"}
	}
	if !hasNumber {
		return &domain.ValidationError{Field: "password", Message: "Senha deve conter pelo menos um número"}
	}

	return nil
}

// sanitizeString remove espaços extras e valida string
func (h *SettingsHandler) sanitizeString(s string) string {
	return strings.TrimSpace(s)
}

// ============= USERS =============

func (h *SettingsHandler) ListUsers(c *gin.Context) {
	var filter domain.UserFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.userService.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SettingsHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *SettingsHandler) CreateUser(c *gin.Context) {
	var req domain.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[ERROR] CreateUser: Invalid JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Validações
	req.Email = h.sanitizeString(req.Email)
	req.Name = h.sanitizeString(req.Name)

	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email é obrigatório"})
		return
	}

	if !h.validateEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email inválido"})
		return
	}

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nome é obrigatório"})
		return
	}

	if req.Password != nil && *req.Password != "" {
		if err := h.validatePassword(*req.Password); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	actorID, actorEmail := h.getActor(c)
	log.Printf("[INFO] CreateUser: Actor=%s creating user=%s", actorEmail, req.Email)

	user, err := h.userService.Create(req, actorID, actorEmail)
	if err != nil {
		log.Printf("[ERROR] CreateUser: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[INFO] CreateUser: Successfully created user=%s (id=%s)", user.Email, user.ID)
	c.JSON(http.StatusCreated, user)
}

func (h *SettingsHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário é obrigatório"})
		return
	}

	var req domain.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[ERROR] UpdateUser: Invalid JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Validações
	if req.Name != nil {
		*req.Name = h.sanitizeString(*req.Name)
		if *req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nome não pode ser vazio"})
			return
		}
	}

	if req.Password != nil && *req.Password != "" {
		if err := h.validatePassword(*req.Password); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	actorID, actorEmail := h.getActor(c)
	log.Printf("[INFO] UpdateUser: Actor=%s updating user=%s", actorEmail, id)

	user, err := h.userService.Update(id, req, actorID, actorEmail)
	if err != nil {
		log.Printf("[ERROR] UpdateUser: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[INFO] UpdateUser: Successfully updated user=%s", id)
	c.JSON(http.StatusOK, user)
}

func (h *SettingsHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	actorID, actorEmail := h.getActor(c)
	if err := h.userService.Delete(id, actorID, actorEmail); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func (h *SettingsHandler) GetUserStats(c *gin.Context) {
	stats, err := h.userService.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// ============= ROLES =============

func (h *SettingsHandler) ListRoles(c *gin.Context) {
	roles, err := h.roleRepo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Carregar permissões para cada role
	for i := range roles {
		roles[i].Permissions, _ = h.roleRepo.GetRolePermissions(roles[i].ID)
	}

	c.JSON(http.StatusOK, domain.RoleListResponse{Roles: roles, Total: len(roles)})
}

func (h *SettingsHandler) GetRole(c *gin.Context) {
	id := c.Param("id")
	role, err := h.roleRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	role.Permissions, _ = h.roleRepo.GetRolePermissions(role.ID)
	c.JSON(http.StatusOK, role)
}

func (h *SettingsHandler) CreateRole(c *gin.Context) {
	var req domain.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[ERROR] CreateRole: Invalid JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Validações
	req.Name = h.sanitizeString(req.Name)
	req.DisplayName = h.sanitizeString(req.DisplayName)

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nome interno é obrigatório"})
		return
	}

	if req.DisplayName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nome de exibição é obrigatório"})
		return
	}

	// Normalizar nome interno (snake_case)
	req.Name = strings.ToLower(strings.ReplaceAll(req.Name, " ", "_"))

	actorID, actorEmail := h.getActor(c)
	log.Printf("[INFO] CreateRole: Actor=%s creating role=%s", actorEmail, req.Name)

	role := &domain.Role{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		IsSystem:    false,
	}

	if err := h.roleRepo.Create(role); err != nil {
		log.Printf("[ERROR] CreateRole: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.PermissionIDs) > 0 {
		if err := h.roleRepo.AssignPermissions(role.ID, req.PermissionIDs); err != nil {
			log.Printf("[ERROR] CreateRole: Failed to assign permissions: %v", err)
		}
	}

	role.Permissions, _ = h.roleRepo.GetRolePermissions(role.ID)
	log.Printf("[INFO] CreateRole: Successfully created role=%s (id=%s)", role.Name, role.ID)
	c.JSON(http.StatusCreated, role)
}

func (h *SettingsHandler) UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var req domain.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role, err := h.roleRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	if req.DisplayName != nil {
		role.DisplayName = *req.DisplayName
	}
	if req.Description != nil {
		role.Description = req.Description
	}

	if err := h.roleRepo.Update(role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.PermissionIDs != nil {
		h.roleRepo.AssignPermissions(role.ID, req.PermissionIDs)
	}

	role.Permissions, _ = h.roleRepo.GetRolePermissions(role.ID)
	c.JSON(http.StatusOK, role)
}

func (h *SettingsHandler) DeleteRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do role é obrigatório"})
		return
	}

	// Verificar se é role de sistema
	role, err := h.roleRepo.GetByID(id)
	if err != nil {
		log.Printf("[ERROR] DeleteRole: Role not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Role não encontrado"})
		return
	}

	if role.IsSystem {
		c.JSON(http.StatusForbidden, gin.H{"error": "Roles de sistema não podem ser deletados"})
		return
	}

	actorID, actorEmail := h.getActor(c)
	log.Printf("[INFO] DeleteRole: Actor=%s deleting role=%s (id=%s)", actorEmail, role.Name, id)

	if err := h.roleRepo.Delete(id); err != nil {
		log.Printf("[ERROR] DeleteRole: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[INFO] DeleteRole: Successfully deleted role=%s", id)
	c.JSON(http.StatusOK, gin.H{"message": "Role deletado com sucesso"})
}

func (h *SettingsHandler) ListPermissions(c *gin.Context) {
	permissions, err := h.roleRepo.ListPermissions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, domain.PermissionListResponse{Permissions: permissions, Total: len(permissions)})
}

// ============= TEAMS =============

func (h *SettingsHandler) ListTeams(c *gin.Context) {
	var filter domain.TeamFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teams, total, err := h.teamRepo.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Carregar membros para cada team
	for i := range teams {
		teams[i].Members, _ = h.teamRepo.GetMembers(teams[i].ID)
	}

	c.JSON(http.StatusOK, domain.TeamListResponse{Teams: teams, Total: total})
}

func (h *SettingsHandler) GetTeam(c *gin.Context) {
	id := c.Param("id")
	team, err := h.teamRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	team.Members, _ = h.teamRepo.GetMembers(team.ID)
	c.JSON(http.StatusOK, team)
}

func (h *SettingsHandler) CreateTeam(c *gin.Context) {
	var req domain.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team := &domain.Team{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		AvatarURL:   req.AvatarURL,
	}

	if err := h.teamRepo.Create(team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.MemberIDs) > 0 {
		for _, memberID := range req.MemberIDs {
			h.teamRepo.AddMember(team.ID, memberID, "member")
		}
	}

	team.Members, _ = h.teamRepo.GetMembers(team.ID)
	c.JSON(http.StatusCreated, team)
}

func (h *SettingsHandler) UpdateTeam(c *gin.Context) {
	id := c.Param("id")
	var req domain.UpdateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team, err := h.teamRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	if req.DisplayName != nil {
		team.DisplayName = *req.DisplayName
	}
	if req.Description != nil {
		team.Description = req.Description
	}
	if req.AvatarURL != nil {
		team.AvatarURL = req.AvatarURL
	}

	if err := h.teamRepo.Update(team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team.Members, _ = h.teamRepo.GetMembers(team.ID)
	c.JSON(http.StatusOK, team)
}

func (h *SettingsHandler) DeleteTeam(c *gin.Context) {
	id := c.Param("id")
	if err := h.teamRepo.Delete(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Team deleted successfully"})
}

func (h *SettingsHandler) AddTeamMember(c *gin.Context) {
	teamID := c.Param("id")
	var req domain.AddTeamMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := req.Role
	if role == "" {
		role = "member"
	}

	for _, userID := range req.UserIDs {
		if err := h.teamRepo.AddMember(teamID, userID, role); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Members added successfully"})
}

func (h *SettingsHandler) RemoveTeamMember(c *gin.Context) {
	teamID := c.Param("id")
	userID := c.Param("userId")

	if err := h.teamRepo.RemoveMember(teamID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}

// ============= AUDIT =============

func (h *SettingsHandler) ListAuditLogs(c *gin.Context) {
	var filter domain.AuditLogFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logs, total, err := h.auditRepo.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Size <= 0 {
		filter.Size = 50
	}

	c.JSON(http.StatusOK, domain.AuditLogListResponse{
		Logs:  logs,
		Total: total,
		Page:  filter.Page,
		Size:  filter.Size,
	})
}

func (h *SettingsHandler) GetAuditStats(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	var startDate, endDate time.Time
	var err error

	if startDateStr != "" {
		startDate, err = time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format"})
			return
		}
	}

	if endDateStr != "" {
		endDate, err = time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format"})
			return
		}
	}

	stats, err := h.auditRepo.GetStats(startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ============= SSO =============

func (h *SettingsHandler) ListSSOConfigs(c *gin.Context) {
	configs, err := h.ssoRepo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Remover client_secret da resposta
	for i := range configs {
		configs[i].ClientSecret = "***"
	}

	c.JSON(http.StatusOK, domain.SSOListResponse{Configs: configs, Total: len(configs)})
}

func (h *SettingsHandler) GetSSOConfig(c *gin.Context) {
	provider := c.Param("provider")
	config, err := h.ssoRepo.GetByProvider(provider)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SSO config not found"})
		return
	}

	config.ClientSecret = "***"
	c.JSON(http.StatusOK, config)
}

func (h *SettingsHandler) CreateOrUpdateSSOConfig(c *gin.Context) {
	var req domain.CreateSSOConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Tentar buscar config existente
	existing, _ := h.ssoRepo.GetByProvider(req.Provider)

	if existing != nil {
		// Atualizar
		existing.Enabled = req.Enabled
		existing.ClientID = req.ClientID
		if req.ClientSecret != "" {
			existing.ClientSecret = req.ClientSecret
		}
		existing.TenantID = req.TenantID
		existing.RedirectURI = req.RedirectURI
		existing.AllowedDomains = req.AllowedDomains

		if err := h.ssoRepo.Update(existing); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		existing.ClientSecret = "***"
		c.JSON(http.StatusOK, existing)
	} else {
		// Criar
		config := &domain.SSOConfig{
			Provider:       req.Provider,
			Enabled:        req.Enabled,
			ClientID:       req.ClientID,
			ClientSecret:   req.ClientSecret,
			TenantID:       req.TenantID,
			RedirectURI:    req.RedirectURI,
			AllowedDomains: req.AllowedDomains,
		}

		if err := h.ssoRepo.Create(config); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		config.ClientSecret = "***"
		c.JSON(http.StatusCreated, config)
	}
}

func (h *SettingsHandler) DeleteSSOConfig(c *gin.Context) {
	provider := c.Param("provider")
	if err := h.ssoRepo.Delete(provider); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "SSO config deleted successfully"})
}
