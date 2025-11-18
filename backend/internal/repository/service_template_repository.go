package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type ServiceTemplateRepository struct {
	db *sql.DB
}

func NewServiceTemplateRepository(db *sql.DB) *ServiceTemplateRepository {
	return &ServiceTemplateRepository{db: db}
}

func (r *ServiceTemplateRepository) GetAll() ([]domain.ServiceTemplate, error) {
	query := `SELECT id, name, description, category, language, framework, icon, tags, parameters, files, created_at, updated_at FROM service_templates ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []domain.ServiceTemplate
	for rows.Next() {
		var t domain.ServiceTemplate
		var tagsJSON, paramsJSON, filesJSON []byte

		err := rows.Scan(
			&t.ID, &t.Name, &t.Description, &t.Category, &t.Language,
			&t.Framework, &t.Icon, &tagsJSON, &paramsJSON, &filesJSON,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		json.Unmarshal(tagsJSON, &t.Tags)
		json.Unmarshal(paramsJSON, &t.Parameters)
		json.Unmarshal(filesJSON, &t.Files)

		templates = append(templates, t)
	}

	return templates, nil
}

func (r *ServiceTemplateRepository) GetByID(id string) (*domain.ServiceTemplate, error) {
	query := `SELECT id, name, description, category, language, framework, icon, tags, parameters, files, created_at, updated_at FROM service_templates WHERE id = ?`

	var t domain.ServiceTemplate
	var tagsJSON, paramsJSON, filesJSON []byte

	err := r.db.QueryRow(query, id).Scan(
		&t.ID, &t.Name, &t.Description, &t.Category, &t.Language,
		&t.Framework, &t.Icon, &tagsJSON, &paramsJSON, &filesJSON,
		&t.CreatedAt, &t.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	json.Unmarshal(tagsJSON, &t.Tags)
	json.Unmarshal(paramsJSON, &t.Parameters)
	json.Unmarshal(filesJSON, &t.Files)

	return &t, nil
}

func (r *ServiceTemplateRepository) Create(template *domain.ServiceTemplate) error {
	tagsJSON, _ := json.Marshal(template.Tags)
	paramsJSON, _ := json.Marshal(template.Parameters)
	filesJSON, _ := json.Marshal(template.Files)

	query := `INSERT INTO service_templates (id, name, description, category, language, framework, icon, tags, parameters, files, created_at, updated_at)
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query,
		template.ID, template.Name, template.Description, template.Category,
		template.Language, template.Framework, template.Icon,
		tagsJSON, paramsJSON, filesJSON,
		template.CreatedAt, template.UpdatedAt,
	)

	return err
}

// Created Services Repository
func (r *ServiceTemplateRepository) GetAllServices() ([]domain.CreatedService, error) {
	query := `SELECT id, name, description, template, repository_url, local_path, parameters, status, created_at, created_by FROM created_services ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []domain.CreatedService
	for rows.Next() {
		var s domain.CreatedService
		var paramsJSON []byte
		var repoURL, localPath, createdBy sql.NullString

		err := rows.Scan(
			&s.ID, &s.Name, &s.Description, &s.Template,
			&repoURL, &localPath, &paramsJSON, &s.Status,
			&s.CreatedAt, &createdBy,
		)
		if err != nil {
			return nil, err
		}

		if repoURL.Valid {
			s.RepositoryURL = repoURL.String
		}
		if localPath.Valid {
			s.LocalPath = localPath.String
		}
		if createdBy.Valid {
			s.CreatedBy = createdBy.String
		}

		json.Unmarshal(paramsJSON, &s.Parameters)
		services = append(services, s)
	}

	return services, nil
}

func (r *ServiceTemplateRepository) CreateService(service *domain.CreatedService) error {
	paramsJSON, _ := json.Marshal(service.Parameters)

	query := `INSERT INTO created_services (id, name, description, template, repository_url, local_path, parameters, status, created_at, created_by)
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query,
		service.ID, service.Name, service.Description, service.Template,
		toNullString(service.RepositoryURL), toNullString(service.LocalPath),
		paramsJSON, service.Status, service.CreatedAt, toNullString(service.CreatedBy),
	)

	return err
}

func (r *ServiceTemplateRepository) GetServiceByID(id string) (*domain.CreatedService, error) {
	query := `SELECT id, name, description, template, repository_url, local_path, parameters, status, created_at, created_by FROM created_services WHERE id = ?`

	var s domain.CreatedService
	var paramsJSON []byte
	var repoURL, localPath, createdBy sql.NullString

	err := r.db.QueryRow(query, id).Scan(
		&s.ID, &s.Name, &s.Description, &s.Template,
		&repoURL, &localPath, &paramsJSON, &s.Status,
		&s.CreatedAt, &createdBy,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if repoURL.Valid {
		s.RepositoryURL = repoURL.String
	}
	if localPath.Valid {
		s.LocalPath = localPath.String
	}
	if createdBy.Valid {
		s.CreatedBy = createdBy.String
	}

	json.Unmarshal(paramsJSON, &s.Parameters)
	return &s, nil
}

func toNullString(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}
