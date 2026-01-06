package utils

import (
	"encoding/json"
	"net/http"
)

// Consistent response struct to clients
type ClientResponse struct {
	Data       any    `json:"data"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
}

func ReadBody(w http.ResponseWriter, r *http.Request, data any) error {
	// Make sure payload is not bigger than 1MB
	maxBytes := int64(1048576)
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

	// Decode data sent inside the r.Body to our struct
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(data)
}

func WriteResponse(w http.ResponseWriter, statusCode int, data any, message string) {

	rsp := ClientResponse{
		Data:       data,
		Message:    message,
		StatusCode: statusCode,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(rsp)

}
