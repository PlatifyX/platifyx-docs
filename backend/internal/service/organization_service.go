package service

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/database"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/google/uuid"
)

type OrganizationService struct {
	repo     *repository.OrganizationRepository
	coreDB   *sql.DB
	log      *logger.Logger
}

func NewOrganizationService(repo *repository.OrganizationRepository, coreDB *sql.DB, log *logger.Logger) *OrganizationService {
	return &OrganizationService{
		repo:   repo,
		coreDB: coreDB,
		log:    log,
	}
}

func (s *OrganizationService) GetAll() ([]domain.Organization, error) {
	s.log.Info("Fetching all organizations")

	organizations, err := s.repo.GetAll()
	if err != nil {
		s.log.Errorw("Failed to fetch organizations", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched organizations successfully", "count", len(organizations))
	return organizations, nil
}

func (s *OrganizationService) GetByUUID(uuid string) (*domain.Organization, error) {
	s.log.Infow("Fetching organization by UUID", "uuid", uuid)

	org, err := s.repo.GetByUUID(uuid)
	if err != nil {
		s.log.Errorw("Failed to fetch organization", "error", err, "uuid", uuid)
		return nil, err
	}

	return org, nil
}

func (s *OrganizationService) Create(req domain.CreateOrganizationRequest) (*domain.Organization, error) {
	s.log.Infow("Creating organization", "name", req.Name)

	orgUUID := uuid.New().String()

	defaultDBAddress := "postgres://platifyx:platifyx123@localhost:5432/platifyx?sslmode=disable"
	
	databaseAddressWrite := req.DatabaseAddressWrite
	if databaseAddressWrite == "" {
		databaseAddressWrite = defaultDBAddress
	}

	databaseAddressRead := req.DatabaseAddressRead
	if databaseAddressRead == "" {
		databaseAddressRead = databaseAddressWrite
	}

	org := &domain.Organization{
		UUID:                orgUUID,
		Name:                req.Name,
		SSOActive:           req.SSOActive,
		DatabaseAddressWrite: databaseAddressWrite,
		DatabaseAddressRead:  databaseAddressRead,
	}

	err := s.repo.Create(org)
	if err != nil {
		s.log.Errorw("Failed to create organization", "error", err)
		return nil, fmt.Errorf("failed to create organization: %w", err)
	}

	nodeDB, err := database.NewPostgresConnection(org.DatabaseAddressWrite)
	if err != nil {
		s.log.Errorw("Failed to connect to node database", "error", err, "address", org.DatabaseAddressWrite)
		return nil, fmt.Errorf("failed to connect to node database: %w", err)
	}
	defer nodeDB.Close()

	err = s.CreateSchemaInNodeDB(nodeDB, orgUUID)
	if err != nil {
		s.log.Errorw("Failed to create schema in node database", "error", err, "uuid", orgUUID)
		if deleteErr := s.repo.Delete(orgUUID); deleteErr != nil {
			s.log.Errorw("Failed to rollback organization creation", "error", deleteErr)
		}
		return nil, fmt.Errorf("failed to create schema in node database: %w", err)
	}

	s.log.Infow("Organization created successfully", "uuid", orgUUID, "name", org.Name)
	return org, nil
}

func (s *OrganizationService) Update(uuid string, req domain.UpdateOrganizationRequest) (*domain.Organization, error) {
	s.log.Infow("Updating organization", "uuid", uuid)

	existingOrg, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		existingOrg.Name = req.Name
	}
	if req.SSOActive != nil {
		existingOrg.SSOActive = *req.SSOActive
	}
	if req.DatabaseAddressWrite != "" {
		existingOrg.DatabaseAddressWrite = req.DatabaseAddressWrite
	}
	if req.DatabaseAddressRead != "" {
		existingOrg.DatabaseAddressRead = req.DatabaseAddressRead
	} else if req.DatabaseAddressWrite != "" {
		existingOrg.DatabaseAddressRead = existingOrg.DatabaseAddressWrite
	}

	err = s.repo.Update(uuid, existingOrg)
	if err != nil {
		s.log.Errorw("Failed to update organization", "error", err, "uuid", uuid)
		return nil, err
	}

	updatedOrg, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return nil, err
	}

	s.log.Infow("Organization updated successfully", "uuid", uuid)
	return updatedOrg, nil
}

func (s *OrganizationService) Delete(uuid string) error {
	s.log.Infow("Deleting organization", "uuid", uuid)

	org, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return err
	}

	nodeDB, err := database.NewPostgresConnection(org.DatabaseAddressWrite)
	if err != nil {
		s.log.Errorw("Failed to connect to node database for deletion", "error", err)
	} else {
		defer nodeDB.Close()
		err = s.DropSchemaInNodeDB(nodeDB, uuid)
		if err != nil {
			s.log.Errorw("Failed to drop schema in node database", "error", err, "uuid", uuid)
		}
	}

	err = s.repo.Delete(uuid)
	if err != nil {
		s.log.Errorw("Failed to delete organization", "error", err, "uuid", uuid)
		return err
	}

	s.log.Infow("Organization deleted successfully", "uuid", uuid)
	return nil
}

func (s *OrganizationService) CreateSchemaInNodeDB(nodeDB *sql.DB, schemaUUID string) error {
	schemaName := strings.ReplaceAll(schemaUUID, "-", "_")
	schemaNameEscaped := fmt.Sprintf(`"%s"`, strings.ReplaceAll(schemaName, `"`, `""`))

	_, err := nodeDB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaNameEscaped))
	if err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}

	migrationPath := filepath.Join("migrations", "013_create_node_default_schema.sql")
	content, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read schema template: %w", err)
	}

	schemaSQL := string(content)
	
	lines := strings.Split(schemaSQL, "\n")
	var processedSQL strings.Builder
	
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}
		
		if strings.Contains(trimmed, "CREATE TABLE IF NOT EXISTS") {
			line = strings.ReplaceAll(line, "CREATE TABLE IF NOT EXISTS", fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s.", schemaNameEscaped))
		} else if strings.Contains(trimmed, "CREATE INDEX IF NOT EXISTS") {
			line = strings.ReplaceAll(line, "ON users(", fmt.Sprintf("ON %s.users(", schemaNameEscaped))
			line = strings.ReplaceAll(line, "ON users ", fmt.Sprintf("ON %s.users ", schemaNameEscaped))
		}
		
		processedSQL.WriteString(line)
		processedSQL.WriteString("\n")
	}

	fullSQL := processedSQL.String()
	
	statements := strings.Split(fullSQL, ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		_, err := nodeDB.Exec(stmt)
		if err != nil {
			s.log.Warnw("Failed to execute schema statement", "error", err, "statement", stmt[:min(100, len(stmt))])
		}
	}

	return nil
}

func (s *OrganizationService) DropSchemaInNodeDB(nodeDB *sql.DB, schemaName string) error {
	schemaNameEscaped := fmt.Sprintf(`"%s"`, strings.ReplaceAll(schemaName, `"`, `""`))
	_, err := nodeDB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schemaNameEscaped))
	return err
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

