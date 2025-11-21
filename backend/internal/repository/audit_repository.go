package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type AuditRepository struct {
	db *sql.DB
}

func NewAuditRepository(db *sql.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

// Create cria um novo log de auditoria
func (r *AuditRepository) Create(log *domain.AuditLog) error {
	query := `
		INSERT INTO audit_logs (user_id, user_email, action, resource, resource_id, details, ip_address, user_agent, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`

	var detailsJSON []byte
	var err error
	if log.Details != nil {
		detailsJSON, err = json.Marshal(log.Details)
		if err != nil {
			return err
		}
	}

	return r.db.QueryRow(
		query,
		log.UserID,
		log.UserEmail,
		log.Action,
		log.Resource,
		log.ResourceID,
		detailsJSON,
		log.IPAddress,
		log.UserAgent,
		log.Status,
	).Scan(&log.ID, &log.CreatedAt)
}

// GetByID retorna um log por ID
func (r *AuditRepository) GetByID(id string) (*domain.AuditLog, error) {
	log := &domain.AuditLog{}
	query := `
		SELECT id, user_id, user_email, action, resource, resource_id, details,
		       ip_address, user_agent, status, created_at
		FROM audit_logs WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&log.ID, &log.UserID, &log.UserEmail, &log.Action, &log.Resource,
		&log.ResourceID, &log.Details, &log.IPAddress, &log.UserAgent,
		&log.Status, &log.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("audit log not found")
	}
	return log, err
}

// List retorna uma lista de logs com filtros
func (r *AuditRepository) List(filter domain.AuditLogFilter) ([]domain.AuditLog, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argCount := 1

	if filter.UserID != "" {
		where = append(where, fmt.Sprintf("user_id = $%d", argCount))
		args = append(args, filter.UserID)
		argCount++
	}

	if filter.UserEmail != "" {
		where = append(where, fmt.Sprintf("user_email ILIKE $%d", argCount))
		args = append(args, "%"+filter.UserEmail+"%")
		argCount++
	}

	if filter.Action != "" {
		where = append(where, fmt.Sprintf("action = $%d", argCount))
		args = append(args, filter.Action)
		argCount++
	}

	if filter.Resource != "" {
		where = append(where, fmt.Sprintf("resource = $%d", argCount))
		args = append(args, filter.Resource)
		argCount++
	}

	if filter.ResourceID != "" {
		where = append(where, fmt.Sprintf("resource_id = $%d", argCount))
		args = append(args, filter.ResourceID)
		argCount++
	}

	if filter.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argCount))
		args = append(args, filter.Status)
		argCount++
	}

	if !filter.StartDate.IsZero() {
		where = append(where, fmt.Sprintf("created_at >= $%d", argCount))
		args = append(args, filter.StartDate)
		argCount++
	}

	if !filter.EndDate.IsZero() {
		where = append(where, fmt.Sprintf("created_at <= $%d", argCount))
		args = append(args, filter.EndDate)
		argCount++
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_logs WHERE %s", whereClause)
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get logs
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Size <= 0 {
		filter.Size = 50
	}

	offset := (filter.Page - 1) * filter.Size
	args = append(args, filter.Size, offset)

	query := fmt.Sprintf(`
		SELECT id, user_id, user_email, action, resource, resource_id, details,
		       ip_address, user_agent, status, created_at
		FROM audit_logs
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount, argCount+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	logs := []domain.AuditLog{}
	for rows.Next() {
		log := domain.AuditLog{}
		err := rows.Scan(
			&log.ID, &log.UserID, &log.UserEmail, &log.Action, &log.Resource,
			&log.ResourceID, &log.Details, &log.IPAddress, &log.UserAgent,
			&log.Status, &log.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}

// GetStats retorna estatísticas de auditoria
func (r *AuditRepository) GetStats(startDate, endDate time.Time) (*domain.AuditStats, error) {
	stats := &domain.AuditStats{
		LogsByAction:   make(map[string]int),
		LogsByResource: make(map[string]int),
		LogsByStatus:   make(map[string]int),
	}

	where := "1=1"
	args := []interface{}{}
	argCount := 1

	if !startDate.IsZero() {
		where += fmt.Sprintf(" AND created_at >= $%d", argCount)
		args = append(args, startDate)
		argCount++
	}

	if !endDate.IsZero() {
		where += fmt.Sprintf(" AND created_at <= $%d", argCount)
		args = append(args, endDate)
		argCount++
	}

	// Total de logs
	err := r.db.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM audit_logs WHERE %s", where), args...).Scan(&stats.TotalLogs)
	if err != nil {
		return nil, err
	}

	// Logs por ação
	rows, err := r.db.Query(fmt.Sprintf(`
		SELECT action, COUNT(*) as count
		FROM audit_logs
		WHERE %s
		GROUP BY action
		ORDER BY count DESC
	`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var action string
		var count int
		if err := rows.Scan(&action, &count); err != nil {
			return nil, err
		}
		stats.LogsByAction[action] = count
	}

	// Logs por recurso
	rows, err = r.db.Query(fmt.Sprintf(`
		SELECT resource, COUNT(*) as count
		FROM audit_logs
		WHERE %s
		GROUP BY resource
		ORDER BY count DESC
	`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var resource string
		var count int
		if err := rows.Scan(&resource, &count); err != nil {
			return nil, err
		}
		stats.LogsByResource[resource] = count
	}

	// Logs por status
	rows, err = r.db.Query(fmt.Sprintf(`
		SELECT status, COUNT(*) as count
		FROM audit_logs
		WHERE %s
		GROUP BY status
	`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		stats.LogsByStatus[status] = count
	}

	// Logs por usuário (top 10)
	rows, err = r.db.Query(fmt.Sprintf(`
		SELECT user_id, user_email, COUNT(*) as count
		FROM audit_logs
		WHERE %s AND user_id IS NOT NULL
		GROUP BY user_id, user_email
		ORDER BY count DESC
		LIMIT 10
	`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats.LogsByUser = []domain.UserActivityStats{}
	for rows.Next() {
		var userActivity domain.UserActivityStats
		if err := rows.Scan(&userActivity.UserID, &userActivity.UserEmail, &userActivity.Count); err != nil {
			return nil, err
		}
		stats.LogsByUser = append(stats.LogsByUser, userActivity)
	}

	// Atividade recente (últimos 20)
	query := fmt.Sprintf(`
		SELECT id, user_id, user_email, action, resource, resource_id, details,
		       ip_address, user_agent, status, created_at
		FROM audit_logs
		WHERE %s
		ORDER BY created_at DESC
		LIMIT 20
	`, where)

	rows, err = r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats.RecentActivity = []domain.AuditLog{}
	for rows.Next() {
		log := domain.AuditLog{}
		err := rows.Scan(
			&log.ID, &log.UserID, &log.UserEmail, &log.Action, &log.Resource,
			&log.ResourceID, &log.Details, &log.IPAddress, &log.UserAgent,
			&log.Status, &log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		stats.RecentActivity = append(stats.RecentActivity, log)
	}

	return stats, nil
}

// DeleteOldLogs deleta logs mais antigos que a data especificada
func (r *AuditRepository) DeleteOldLogs(olderThan time.Time) (int64, error) {
	query := `DELETE FROM audit_logs WHERE created_at < $1`
	result, err := r.db.Exec(query, olderThan)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
