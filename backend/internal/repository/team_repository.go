package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type TeamRepository struct {
	db *sql.DB
}

func NewTeamRepository(db *sql.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

// Create cria uma nova equipe
func (r *TeamRepository) Create(team *domain.Team) error {
	query := `
		INSERT INTO teams (name, display_name, description, avatar_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(
		query,
		team.Name,
		team.DisplayName,
		team.Description,
		team.AvatarURL,
	).Scan(&team.ID, &team.CreatedAt, &team.UpdatedAt)
}

// GetByID retorna uma equipe por ID
func (r *TeamRepository) GetByID(id string) (*domain.Team, error) {
	team := &domain.Team{}
	query := `
		SELECT id, name, display_name, description, avatar_url, created_at, updated_at
		FROM teams WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&team.ID, &team.Name, &team.DisplayName, &team.Description,
		&team.AvatarURL, &team.CreatedAt, &team.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("team not found")
	}
	return team, err
}

// GetByName retorna uma equipe por nome
func (r *TeamRepository) GetByName(name string) (*domain.Team, error) {
	team := &domain.Team{}
	query := `
		SELECT id, name, display_name, description, avatar_url, created_at, updated_at
		FROM teams WHERE name = $1
	`
	err := r.db.QueryRow(query, name).Scan(
		&team.ID, &team.Name, &team.DisplayName, &team.Description,
		&team.AvatarURL, &team.CreatedAt, &team.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("team not found")
	}
	return team, err
}

// List retorna todas as equipes com filtros
func (r *TeamRepository) List(filter domain.TeamFilter) ([]domain.Team, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argCount := 1

	if filter.Search != "" {
		where = append(where, fmt.Sprintf("(name ILIKE $%d OR display_name ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+filter.Search+"%")
		argCount++
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM teams WHERE %s", whereClause)
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get teams
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Size <= 0 {
		filter.Size = 20
	}

	offset := (filter.Page - 1) * filter.Size
	args = append(args, filter.Size, offset)

	query := fmt.Sprintf(`
		SELECT id, name, display_name, description, avatar_url, created_at, updated_at
		FROM teams
		WHERE %s
		ORDER BY name
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount, argCount+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
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
			return nil, 0, err
		}
		teams = append(teams, team)
	}

	return teams, total, nil
}

// Update atualiza uma equipe
func (r *TeamRepository) Update(team *domain.Team) error {
	query := `
		UPDATE teams
		SET display_name = $1, description = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
		RETURNING updated_at
	`
	return r.db.QueryRow(
		query,
		team.DisplayName,
		team.Description,
		team.AvatarURL,
		team.ID,
	).Scan(&team.UpdatedAt)
}

// Delete deleta uma equipe
func (r *TeamRepository) Delete(id string) error {
	query := `DELETE FROM teams WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("team not found")
	}

	return nil
}

// AddMember adiciona um membro à equipe
func (r *TeamRepository) AddMember(teamID, userID, role string) error {
	query := `INSERT INTO user_teams (user_id, team_id, role) VALUES ($1, $2, $3)`
	_, err := r.db.Exec(query, userID, teamID, role)
	return err
}

// RemoveMember remove um membro da equipe
func (r *TeamRepository) RemoveMember(teamID, userID string) error {
	query := `DELETE FROM user_teams WHERE team_id = $1 AND user_id = $2`
	result, err := r.db.Exec(query, teamID, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("member not found in team")
	}

	return nil
}

// UpdateMemberRole atualiza o role de um membro na equipe
func (r *TeamRepository) UpdateMemberRole(teamID, userID, role string) error {
	query := `UPDATE user_teams SET role = $1 WHERE team_id = $2 AND user_id = $3`
	result, err := r.db.Exec(query, role, teamID, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("member not found in team")
	}

	return nil
}

// GetMembers retorna os membros de uma equipe
func (r *TeamRepository) GetMembers(teamID string) ([]domain.TeamMember, error) {
	query := `
		SELECT ut.user_id, ut.team_id, ut.role, ut.created_at,
		       u.email, u.name, u.avatar_url, u.is_active
		FROM user_teams ut
		INNER JOIN users u ON u.id = ut.user_id
		WHERE ut.team_id = $1
		ORDER BY u.name
	`

	rows, err := r.db.Query(query, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := []domain.TeamMember{}
	for rows.Next() {
		member := domain.TeamMember{
			User: &domain.User{},
		}
		err := rows.Scan(
			&member.UserID, &member.TeamID, &member.Role, &member.CreatedAt,
			&member.User.Email, &member.User.Name, &member.User.AvatarURL, &member.User.IsActive,
		)
		if err != nil {
			return nil, err
		}
		member.User.ID = member.UserID
		members = append(members, member)
	}

	return members, nil
}

// IsMember verifica se um usuário é membro de uma equipe
func (r *TeamRepository) IsMember(teamID, userID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_teams WHERE team_id = $1 AND user_id = $2`
	err := r.db.QueryRow(query, teamID, userID).Scan(&count)
	return count > 0, err
}

// GetMemberRole retorna o role de um membro na equipe
func (r *TeamRepository) GetMemberRole(teamID, userID string) (string, error) {
	var role string
	query := `SELECT role FROM user_teams WHERE team_id = $1 AND user_id = $2`
	err := r.db.QueryRow(query, teamID, userID).Scan(&role)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("member not found in team")
	}
	return role, err
}

// GetStats retorna estatísticas de equipes
func (r *TeamRepository) GetStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total de equipes
	var total int
	err := r.db.QueryRow("SELECT COUNT(*) FROM teams").Scan(&total)
	if err != nil {
		return nil, err
	}
	stats["total"] = total

	// Média de membros por equipe
	var avgMembers float64
	err = r.db.QueryRow(`
		SELECT COALESCE(AVG(member_count), 0)
		FROM (
			SELECT COUNT(user_id) as member_count
			FROM user_teams
			GROUP BY team_id
		) as team_members
	`).Scan(&avgMembers)
	if err != nil {
		return nil, err
	}
	stats["avg_members"] = avgMembers

	// Equipe com mais membros
	var maxTeamName string
	var maxMembers int
	err = r.db.QueryRow(`
		SELECT t.name, COUNT(ut.user_id) as member_count
		FROM teams t
		LEFT JOIN user_teams ut ON ut.team_id = t.id
		GROUP BY t.id, t.name
		ORDER BY member_count DESC
		LIMIT 1
	`).Scan(&maxTeamName, &maxMembers)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	stats["largest_team"] = map[string]interface{}{
		"name":    maxTeamName,
		"members": maxMembers,
	}

	return stats, nil
}
