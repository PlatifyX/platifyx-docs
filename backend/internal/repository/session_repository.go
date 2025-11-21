package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type SessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

// Create cria uma nova sessão
func (r *SessionRepository) Create(session *domain.Session) error {
	query := `
		INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return r.db.QueryRow(
		query,
		session.UserID,
		session.Token,
		session.RefreshToken,
		session.IPAddress,
		session.UserAgent,
		session.ExpiresAt,
	).Scan(&session.ID, &session.CreatedAt)
}

// GetByToken retorna uma sessão por token
func (r *SessionRepository) GetByToken(token string) (*domain.Session, error) {
	session := &domain.Session{}
	query := `
		SELECT id, user_id, token, refresh_token, ip_address, user_agent, expires_at, created_at
		FROM sessions WHERE token = $1
	`
	err := r.db.QueryRow(query, token).Scan(
		&session.ID, &session.UserID, &session.Token, &session.RefreshToken,
		&session.IPAddress, &session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("session not found")
	}
	return session, err
}

// GetByRefreshToken retorna uma sessão por refresh token
func (r *SessionRepository) GetByRefreshToken(refreshToken string) (*domain.Session, error) {
	session := &domain.Session{}
	query := `
		SELECT id, user_id, token, refresh_token, ip_address, user_agent, expires_at, created_at
		FROM sessions WHERE refresh_token = $1
	`
	err := r.db.QueryRow(query, refreshToken).Scan(
		&session.ID, &session.UserID, &session.Token, &session.RefreshToken,
		&session.IPAddress, &session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("session not found")
	}
	return session, err
}

// GetUserSessions retorna todas as sessões de um usuário
func (r *SessionRepository) GetUserSessions(userID string) ([]domain.Session, error) {
	query := `
		SELECT id, user_id, token, refresh_token, ip_address, user_agent, expires_at, created_at
		FROM sessions
		WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessions := []domain.Session{}
	for rows.Next() {
		session := domain.Session{}
		err := rows.Scan(
			&session.ID, &session.UserID, &session.Token, &session.RefreshToken,
			&session.IPAddress, &session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

// Update atualiza uma sessão (geralmente para refresh)
func (r *SessionRepository) Update(session *domain.Session) error {
	query := `
		UPDATE sessions
		SET token = $1, refresh_token = $2, expires_at = $3
		WHERE id = $4
	`
	result, err := r.db.Exec(query, session.Token, session.RefreshToken, session.ExpiresAt, session.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}

// Delete deleta uma sessão (logout)
func (r *SessionRepository) Delete(token string) error {
	query := `DELETE FROM sessions WHERE token = $1`
	result, err := r.db.Exec(query, token)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}

// DeleteUserSessions deleta todas as sessões de um usuário
func (r *SessionRepository) DeleteUserSessions(userID string) error {
	query := `DELETE FROM sessions WHERE user_id = $1`
	_, err := r.db.Exec(query, userID)
	return err
}

// DeleteExpiredSessions deleta todas as sessões expiradas
func (r *SessionRepository) DeleteExpiredSessions() (int64, error) {
	query := `DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP`
	result, err := r.db.Exec(query)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// IsValid verifica se uma sessão é válida
func (r *SessionRepository) IsValid(token string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`
	err := r.db.QueryRow(query, token).Scan(&count)
	return count > 0, err
}

// ExtendExpiration estende a expiração de uma sessão
func (r *SessionRepository) ExtendExpiration(token string, duration time.Duration) error {
	query := `UPDATE sessions SET expires_at = CURRENT_TIMESTAMP + $1 WHERE token = $2`
	result, err := r.db.Exec(query, duration, token)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}
