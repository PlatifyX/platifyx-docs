package database

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

func GetOrganizationNodeDB(org *domain.Organization) (*sql.DB, error) {
	dbAddress := org.DatabaseAddressWrite
	if dbAddress == "" {
		dbAddress = org.DatabaseAddressRead
	}
	if dbAddress == "" {
		return nil, fmt.Errorf("no database address configured for organization")
	}

	return NewPostgresConnection(dbAddress)
}

func EscapeSchemaName(schemaName string) string {
	return fmt.Sprintf(`"%s"`, strings.ReplaceAll(schemaName, `"`, `""`))
}

func BuildSchemaQuery(query string, schemaName string) string {
	schemaEscaped := EscapeSchemaName(schemaName)
	
	query = strings.ReplaceAll(query, "FROM users", fmt.Sprintf("FROM %s.users", schemaEscaped))
	query = strings.ReplaceAll(query, "FROM \"users\"", fmt.Sprintf("FROM %s.users", schemaEscaped))
	query = strings.ReplaceAll(query, "INTO users", fmt.Sprintf("INTO %s.users", schemaEscaped))
	query = strings.ReplaceAll(query, "UPDATE users", fmt.Sprintf("UPDATE %s.users", schemaEscaped))
	query = strings.ReplaceAll(query, "DELETE FROM users", fmt.Sprintf("DELETE FROM %s.users", schemaEscaped))
	
	query = strings.ReplaceAll(query, "ON users(", fmt.Sprintf("ON %s.users(", schemaEscaped))
	query = strings.ReplaceAll(query, "ON users ", fmt.Sprintf("ON %s.users ", schemaEscaped))
	
	return query
}

func SetSearchPath(db *sql.DB, schemaName string) error {
	schemaEscaped := EscapeSchemaName(schemaName)
	_, err := db.Exec(fmt.Sprintf("SET search_path TO %s, public", schemaEscaped))
	return err
}

