package httperr

import (
	"errors"
	"fmt"
	"net/http"
)

// HTTPError representa um erro HTTP com código de status
type HTTPError struct {
	StatusCode int
	Code       string
	Message    string
	Details    string
	Err        error
}

// Error implementa a interface error
func (e *HTTPError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

// Unwrap permite unwrapping do erro interno
func (e *HTTPError) Unwrap() error {
	return e.Err
}

// New cria um novo HTTPError
func New(statusCode int, code, message string) *HTTPError {
	return &HTTPError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
	}
}

// Wrap cria um HTTPError wrapeando um erro existente
func Wrap(statusCode int, code, message string, err error) *HTTPError {
	return &HTTPError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Err:        err,
	}
}

// WithDetails adiciona detalhes ao erro
func (e *HTTPError) WithDetails(details string) *HTTPError {
	e.Details = details
	return e
}

// Predefined errors

// BadRequest retorna um erro 400
func BadRequest(message string) *HTTPError {
	return New(http.StatusBadRequest, "BAD_REQUEST", message)
}

// BadRequestWrap retorna um erro 400 wrapeando outro erro
func BadRequestWrap(message string, err error) *HTTPError {
	return Wrap(http.StatusBadRequest, "BAD_REQUEST", message, err)
}

// Unauthorized retorna um erro 401
func Unauthorized(message string) *HTTPError {
	return New(http.StatusUnauthorized, "UNAUTHORIZED", message)
}

// Forbidden retorna um erro 403
func Forbidden(message string) *HTTPError {
	return New(http.StatusForbidden, "FORBIDDEN", message)
}

// NotFound retorna um erro 404
func NotFound(message string) *HTTPError {
	return New(http.StatusNotFound, "NOT_FOUND", message)
}

// NotFoundWrap retorna um erro 404 wrapeando outro erro
func NotFoundWrap(message string, err error) *HTTPError {
	return Wrap(http.StatusNotFound, "NOT_FOUND", message, err)
}

// Conflict retorna um erro 409
func Conflict(message string) *HTTPError {
	return New(http.StatusConflict, "CONFLICT", message)
}

// InternalError retorna um erro 500
func InternalError(message string) *HTTPError {
	return New(http.StatusInternalServerError, "INTERNAL_ERROR", message)
}

// InternalErrorWrap retorna um erro 500 wrapeando outro erro
func InternalErrorWrap(message string, err error) *HTTPError {
	return Wrap(http.StatusInternalServerError, "INTERNAL_ERROR", message, err)
}

// ServiceUnavailable retorna um erro 503
func ServiceUnavailable(message string) *HTTPError {
	return New(http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", message)
}

// ServiceUnavailableWrap retorna um erro 503 wrapeando outro erro
func ServiceUnavailableWrap(message string, err error) *HTTPError {
	return Wrap(http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", message, err)
}

// IsHTTPError verifica se um erro é um HTTPError
func IsHTTPError(err error) bool {
	var httpErr *HTTPError
	return errors.As(err, &httpErr)
}

// AsHTTPError converte um erro para HTTPError se possível
func AsHTTPError(err error) (*HTTPError, bool) {
	var httpErr *HTTPError
	ok := errors.As(err, &httpErr)
	return httpErr, ok
}

// GetStatusCode extrai o código de status de um erro, ou 500 como fallback
func GetStatusCode(err error) int {
	if httpErr, ok := AsHTTPError(err); ok {
		return httpErr.StatusCode
	}
	return http.StatusInternalServerError
}
