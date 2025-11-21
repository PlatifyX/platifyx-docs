package domain

import "time"

// Team representa uma equipe no sistema
type Team struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	DisplayName string    `json:"display_name" db:"display_name"`
	Description *string   `json:"description,omitempty" db:"description"`
	AvatarURL   *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Relacionamentos
	Members []TeamMember `json:"members,omitempty" db:"-"`
}

// TeamMember representa um membro de uma equipe
type TeamMember struct {
	UserID    string    `json:"user_id" db:"user_id"`
	TeamID    string    `json:"team_id" db:"team_id"`
	Role      string    `json:"role" db:"role"` // 'owner', 'admin', 'member'
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// Dados do usuário (carregados via join)
	User *User `json:"user,omitempty" db:"-"`
}

// CreateTeamRequest representa o request para criar uma equipe
type CreateTeamRequest struct {
	Name        string   `json:"name" binding:"required"`
	DisplayName string   `json:"display_name" binding:"required"`
	Description *string  `json:"description,omitempty"`
	AvatarURL   *string  `json:"avatar_url,omitempty"`
	MemberIDs   []string `json:"member_ids,omitempty"`
}

// UpdateTeamRequest representa o request para atualizar uma equipe
type UpdateTeamRequest struct {
	DisplayName *string `json:"display_name,omitempty"`
	Description *string `json:"description,omitempty"`
	AvatarURL   *string `json:"avatar_url,omitempty"`
}

// AddTeamMemberRequest representa o request para adicionar membros
type AddTeamMemberRequest struct {
	UserIDs []string `json:"user_ids" binding:"required"`
	Role    string   `json:"role"` // Default: 'member'
}

// UpdateTeamMemberRequest representa o request para atualizar um membro
type UpdateTeamMemberRequest struct {
	Role string `json:"role" binding:"required"`
}

// TeamListResponse representa a resposta de listagem de equipes
type TeamListResponse struct {
	Teams []Team `json:"teams"`
	Total int    `json:"total"`
}

// TeamFilter representa os filtros para busca de equipes
type TeamFilter struct {
	Search string `form:"search"`
	Page   int    `form:"page"`
	Size   int    `form:"size"`
}
