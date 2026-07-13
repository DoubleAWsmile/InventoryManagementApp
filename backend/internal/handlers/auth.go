package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/auth"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	password := req.Password

	if email == "" || password == "" {
		http.Error(w, "email and password are required", http.StatusBadRequest)
		return
	}

	var user models.User
	var passwordHash string

	err := h.DB.QueryRow(r.Context(), `
		SELECT 
			u.id, 
			u.email, 
			u.display_name, 
			u.created_at, 
			u.updated_at,
			ac.password_hash
		FROM users u
		JOIN auth_credentials ac
			ON ac.user_id = u.id
		WHERE u.email = $1
	`, email).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
		&passwordHash,
	)

	if err != nil {
		http.Error(w, "Invalid email and/or password", http.StatusUnauthorized)
		return
	}

	if !auth.CheckPassword(password, passwordHash) {
		http.Error(w, "Invalid email and/or password", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
