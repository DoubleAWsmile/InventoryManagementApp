package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/auth"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserHandler struct {
	DB *pgxpool.Pool
}

func NewUserHandler(db *pgxpool.Pool) *UserHandler {
	return &UserHandler{DB: db}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {

	var req models.CreateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.DisplayName = strings.TrimSpace(req.DisplayName)

	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	if req.DisplayName == "" {
		http.Error(w, "Display name is required", http.StatusBadRequest)
		return
	}

	if len(req.DisplayName) > 50 {
		http.Error(w, "Display name must be 50 characters or fewer", http.StatusBadRequest)
		return
	}

	if !auth.IsStrongEnough(req.Password) {
		const message = "Password must be at least 8 characters, have at least 1 capital letter, and have 1 non-alphanumeric character"
		http.Error(w, message, http.StatusBadRequest)
		return
	}

	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	defer tx.Rollback(r.Context())

	var user models.User

	err = tx.QueryRow(r.Context(), `
		INSERT INTO users (email, display_name)
		VALUES ($1, $2)
		RETURNING id, email, display_name, created_at, updated_at
	`, req.Email, req.DisplayName).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			http.Error(w, "An account with this email already exists", http.StatusConflict)
			return
		}

		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(r.Context(), `
		INSERT INTO auth_credentials (user_id, password_hash)
		VALUES ($1, $2)
	`, user.ID, passwordHash)

	if err != nil {
		http.Error(w, "Failed to create credentials", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		http.Error(w, "Failed to finish account creation", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}
