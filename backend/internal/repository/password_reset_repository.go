package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type PasswordResetRepository struct {
	db *sql.DB
}

func NewPasswordResetRepository(db *sql.DB) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

// Create cria um novo token de reset de senha
func (r *PasswordResetRepository) Create(reset *domain.PasswordResetToken) error {
	query := `
		INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	return r.db.QueryRow(
		query,
		reset.UserID,
		reset.Token,
		reset.ExpiresAt,
		reset.IPAddress,
		reset.UserAgent,
	).Scan(&reset.ID, &reset.CreatedAt)
}

// GetByToken retorna um token de reset por token
func (r *PasswordResetRepository) GetByToken(token string) (*domain.PasswordResetToken, error) {
	reset := &domain.PasswordResetToken{}
	query := `
		SELECT id, user_id, token, expires_at, used, created_at, used_at, ip_address, user_agent
		FROM password_reset_tokens WHERE token = $1
	`
	err := r.db.QueryRow(query, token).Scan(
		&reset.ID, &reset.UserID, &reset.Token, &reset.ExpiresAt,
		&reset.Used, &reset.CreatedAt, &reset.UsedAt,
		&reset.IPAddress, &reset.UserAgent,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reset token not found")
	}
	return reset, err
}

// MarkAsUsed marca um token como usado
func (r *PasswordResetRepository) MarkAsUsed(token string) error {
	query := `
		UPDATE password_reset_tokens
		SET used = true, used_at = $1
		WHERE token = $2
	`
	_, err := r.db.Exec(query, time.Now(), token)
	return err
}

// DeleteByUserID deleta todos os tokens de reset de um usuário
func (r *PasswordResetRepository) DeleteByUserID(userID string) error {
	query := `DELETE FROM password_reset_tokens WHERE user_id = $1`
	_, err := r.db.Exec(query, userID)
	return err
}

// DeleteExpiredTokens deleta tokens expirados
func (r *PasswordResetRepository) DeleteExpiredTokens() (int64, error) {
	query := `DELETE FROM password_reset_tokens WHERE expires_at < $1 OR used = true`
	result, err := r.db.Exec(query, time.Now())
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// IsValid verifica se um token é válido (não expirado e não usado)
func (r *PasswordResetRepository) IsValid(token string) (bool, error) {
	reset, err := r.GetByToken(token)
	if err != nil {
		return false, err
	}

	if reset.Used {
		return false, fmt.Errorf("token already used")
	}

	if reset.ExpiresAt.Before(time.Now()) {
		return false, fmt.Errorf("token expired")
	}

	return true, nil
}
