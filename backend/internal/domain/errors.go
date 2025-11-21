package domain

import "fmt"

// ValidationError representa um erro de validação de campo
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NotFoundError representa um recurso não encontrado
type NotFoundError struct {
	Resource string
	ID       string
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// ConflictError representa um conflito de dados (ex: email duplicado)
type ConflictError struct {
	Resource string
	Field    string
	Value    string
}

func (e *ConflictError) Error() string {
	return fmt.Sprintf("%s already exists with %s: %s", e.Resource, e.Field, e.Value)
}

// UnauthorizedError representa uma tentativa de acesso não autorizado
type UnauthorizedError struct {
	Message string
}

func (e *UnauthorizedError) Error() string {
	return e.Message
}

// ForbiddenError representa uma ação que o usuário não tem permissão para realizar
type ForbiddenError struct {
	Action   string
	Resource string
}

func (e *ForbiddenError) Error() string {
	return fmt.Sprintf("forbidden: cannot %s %s", e.Action, e.Resource)
}
