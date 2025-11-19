package repository

import (
	"database/sql"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type ServiceRepository struct {
	db *sql.DB
}

func NewServiceRepository(db *sql.DB) *ServiceRepository {
	return &ServiceRepository{db: db}
}

// GetAll returns all services
func (r *ServiceRepository) GetAll() ([]domain.Service, error) {
	query := `
		SELECT id, name, squad, application, language, version, 
		       repository_type, repository_url, sonarqube_project, namespace,
		       microservices, monorepo, test_unit, infra, 
		       has_stage, has_prod, created_at, updated_at
		FROM services
		ORDER BY squad, application
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []domain.Service
	for rows.Next() {
		var service domain.Service
		err := rows.Scan(
			&service.ID, &service.Name, &service.Squad, &service.Application,
			&service.Language, &service.Version, &service.RepositoryType,
			&service.RepositoryURL, &service.SonarQubeProject, &service.Namespace,
			&service.Microservices, &service.Monorepo, &service.TestUnit, &service.Infra,
			&service.HasStage, &service.HasProd, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		services = append(services, service)
	}

	return services, nil
}

// GetByName returns a service by name
func (r *ServiceRepository) GetByName(name string) (*domain.Service, error) {
	query := `
		SELECT id, name, squad, application, language, version, 
		       repository_type, repository_url, sonarqube_project, namespace,
		       microservices, monorepo, test_unit, infra, 
		       has_stage, has_prod, created_at, updated_at
		FROM services
		WHERE name = $1
	`

	var service domain.Service
	err := r.db.QueryRow(query, name).Scan(
		&service.ID, &service.Name, &service.Squad, &service.Application,
		&service.Language, &service.Version, &service.RepositoryType,
		&service.RepositoryURL, &service.SonarQubeProject, &service.Namespace,
		&service.Microservices, &service.Monorepo, &service.TestUnit, &service.Infra,
		&service.HasStage, &service.HasProd, &service.CreatedAt, &service.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &service, nil
}

// Upsert creates or updates a service
func (r *ServiceRepository) Upsert(service *domain.Service) error {
	query := `
		INSERT INTO services (
			name, squad, application, language, version, 
			repository_type, repository_url, sonarqube_project, namespace,
			microservices, monorepo, test_unit, infra, 
			has_stage, has_prod, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		ON CONFLICT (name) DO UPDATE SET
			squad = $2,
			application = $3,
			language = $4,
			version = $5,
			repository_type = $6,
			repository_url = $7,
			sonarqube_project = $8,
			namespace = $9,
			microservices = $10,
			monorepo = $11,
			test_unit = $12,
			infra = $13,
			has_stage = $14,
			has_prod = $15,
			updated_at = $16
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	return r.db.QueryRow(
		query,
		service.Name, service.Squad, service.Application, service.Language, service.Version,
		service.RepositoryType, service.RepositoryURL, service.SonarQubeProject, service.Namespace,
		service.Microservices, service.Monorepo, service.TestUnit, service.Infra,
		service.HasStage, service.HasProd, now,
	).Scan(&service.ID, &service.CreatedAt, &service.UpdatedAt)
}

// Delete removes a service by name
func (r *ServiceRepository) Delete(name string) error {
	query := `DELETE FROM services WHERE name = $1`
	_, err := r.db.Exec(query, name)
	return err
}
