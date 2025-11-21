package domain

import (
	"encoding/json"
	"time"
)

// AuditLog representa um registro de auditoria
type AuditLog struct {
	ID         string          `json:"id" db:"id"`
	UserID     *string         `json:"user_id,omitempty" db:"user_id"`
	UserEmail  string          `json:"user_email" db:"user_email"`
	Action     string          `json:"action" db:"action"`
	Resource   string          `json:"resource" db:"resource"`
	ResourceID *string         `json:"resource_id,omitempty" db:"resource_id"`
	Details    json.RawMessage `json:"details,omitempty" db:"details"`
	IPAddress  *string         `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent  *string         `json:"user_agent,omitempty" db:"user_agent"`
	Status     string          `json:"status" db:"status"` // 'success', 'failure'
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
}

// CreateAuditLogRequest representa o request para criar um log de auditoria
type CreateAuditLogRequest struct {
	UserID     *string                `json:"user_id,omitempty"`
	UserEmail  string                 `json:"user_email"`
	Action     string                 `json:"action" binding:"required"`
	Resource   string                 `json:"resource" binding:"required"`
	ResourceID *string                `json:"resource_id,omitempty"`
	Details    map[string]interface{} `json:"details,omitempty"`
	IPAddress  *string                `json:"ip_address,omitempty"`
	UserAgent  *string                `json:"user_agent,omitempty"`
	Status     string                 `json:"status"`
}

// AuditLogListResponse representa a resposta de listagem de logs
type AuditLogListResponse struct {
	Logs  []AuditLog `json:"logs"`
	Total int        `json:"total"`
	Page  int        `json:"page"`
	Size  int        `json:"size"`
}

// AuditLogFilter representa os filtros para busca de logs
type AuditLogFilter struct {
	UserID     string    `form:"user_id"`
	UserEmail  string    `form:"user_email"`
	Action     string    `form:"action"`
	Resource   string    `form:"resource"`
	ResourceID string    `form:"resource_id"`
	Status     string    `form:"status"`
	StartDate  time.Time `form:"start_date"`
	EndDate    time.Time `form:"end_date"`
	Page       int       `form:"page"`
	Size       int       `form:"size"`
}

// AuditStats representa estatísticas de auditoria
type AuditStats struct {
	TotalLogs       int                       `json:"total_logs"`
	LogsByAction    map[string]int            `json:"logs_by_action"`
	LogsByResource  map[string]int            `json:"logs_by_resource"`
	LogsByStatus    map[string]int            `json:"logs_by_status"`
	LogsByUser      []UserActivityStats       `json:"logs_by_user"`
	RecentActivity  []AuditLog                `json:"recent_activity"`
}

// UserActivityStats representa estatísticas de atividade por usuário
type UserActivityStats struct {
	UserID    string `json:"user_id"`
	UserEmail string `json:"user_email"`
	Count     int    `json:"count"`
}
