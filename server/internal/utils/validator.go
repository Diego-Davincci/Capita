package utils

import (
	"mime/multipart"
	"path/filepath"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// Initialize validator and register custom validation functions
func init() {
	validate.RegisterValidation("imagefile", validateImageFileType)
}

type CustomValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// Fn for custom message when validating data
func msgForTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "Este campo es obligatorio"
	case "min":
		return "El número o cantidad de caracteres minimo(s) permitido(s) se ha sobrepasado"
	case "max":
		return "El número o cantidad de caracteres máximo(s) permitido(s) se ha sobrepasado"
	case "oneof":
		return "El valor del campo no existe dentro de las opciones"
	case "gt":
		return "El valor del campo debe ser más grande"
	case "imagefile":
		return "El archivo debe ser una imagen (JPG, JPEG, PNG)"
	case "url":
		return "El enlace no es una URL válida"
	}
	return fe.Error() // default error
}

// ValidateData validates user payload and make sure it follows all the requirements
func ValidateData(reqPayload interface{}) []CustomValidationError {
	err := validate.Struct(reqPayload)
	if err != nil {
		var customErrors []CustomValidationError
		for _, err := range err.(validator.ValidationErrors) {
			customErr := CustomValidationError{
				Field:   err.Field(),
				Message: msgForTag(err),
			}
			customErrors = append(customErrors, customErr)
		}
		return customErrors
	}
	return nil
}

// validateImageFileType validates that the uploaded file is an image (JPG, JPEG, PNG)
func validateImageFileType(fl validator.FieldLevel) bool {
	// Handle pointer to multipart.FileHeader
	field := fl.Field()
	if field.Kind() == reflect.Ptr {
		if field.IsNil() {
			return false
		}
		field = field.Elem()
	}

	// Convert to multipart.FileHeader
	fileHeader, ok := field.Interface().(multipart.FileHeader)
	if !ok {
		return false
	}

	// Extract file extension from filename
	filename := fileHeader.Filename
	if filename == "" {
		return false
	}

	// Convert to lowercase for case-insensitive comparison
	ext := strings.ToLower(filepath.Ext(filename))

	// Allowed image extensions
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
	}

	return allowedExts[ext]
}
