package errors

import (
	"fmt"
	"net/http"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AppError represents an application-level error with structured metadata.
type AppError struct {
	Code        string `json:"code"`
	Message     string `json:"message"`
	HTTPStatus  int    `json:"http_status"`
	GRPCCode    codes.Code
	InternalErr error
}

func (e *AppError) Error() string {
	if e.InternalErr != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.InternalErr)
	}
	return e.Message
}

func (e *AppError) GRPCStatus() *status.Status {
	s, _ := status.New(e.GRPCCode, e.Message).WithDetails(e)
	return s
}

// HTTPStatus converts the error to an appropriate HTTP status code.
func (e *AppError) HTTPStatus() int {
	if e.HTTPStatus != 0 {
		return e.HTTPStatus
	}
	return http.StatusInternalServerError
}

// Common errors
var (
	ErrNotFound      = &AppError{Code: "not_found", Message: "Resource not found", HTTPStatus: http.StatusNotFound, GRPCCode: codes.NotFound}
	ErrUnauthorized  = &AppError{Code: "unauthorized", Message: "Authentication required", HTTPStatus: http.StatusUnauthorized, GRPCCode: codes.Unauthenticated}
	ErrForbidden     = &AppError{Code: "forbidden", Message: "Access denied", HTTPStatus: http.StatusForbidden, GRPCCode: codes.PermissionDenied}
	ErrInvalidInput  = &AppError{Code: "invalid_input", Message: "Invalid input provided", HTTPStatus: http.StatusBadRequest, GRPCCode: codes.InvalidArgument}
	ErrInternal      = &AppError{Code: "internal_error", Message: "Internal server error", HTTPStatus: http.StatusInternalServerError, GRPCCode: codes.Internal}
	ErrAlreadyExists = &AppError{Code: "already_exists", Message: "Resource already exists", HTTPStatus: http.StatusConflict, GRPCCode: codes.AlreadyExists}
)

// NewAppError creates a new application error.
func NewAppError(code, message string, grpcCode codes.Code, internal error) *AppError {
	return &AppError{
		Code:        code,
		Message:     message,
		HTTPStatus:  http.StatusInternalServerError,
		GRPCCode:    grpcCode,
		InternalErr: internal,
	}
}
