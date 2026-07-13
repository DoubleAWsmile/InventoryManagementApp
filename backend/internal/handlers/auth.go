package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func (h *UserHandler) DemoLogin(w http.ResponseWriter, r *http.Request) {
	var req models.DemoLoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User

	err := h.DB.QueryRow(r.Context(), `
		SELECT id, email, display_name, created_at, updated_at
		FROM users
		WHERE email = $1
	`, email).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
