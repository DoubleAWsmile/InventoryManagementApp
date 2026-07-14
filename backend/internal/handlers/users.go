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

func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, err := h.GetCurrentUserFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) DeleteMe(w http.ResponseWriter, r *http.Request) {
	user, err := h.GetCurrentUserFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.DeleteMeRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	password := req.Password

	if email == "" || password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	if email != strings.ToLower(user.Email) {
		http.Error(w, "Email does not match current account", http.StatusBadRequest)
		return
	}

	var passwordHash string

	err = h.DB.QueryRow(r.Context(), `
		SELECT password_hash
		FROM auth_credentials
		WHERE user_id = $1
	`, user.ID).Scan(&passwordHash)

	if err != nil {
		http.Error(w, "Failed to verify account", http.StatusInternalServerError)
		return
	}

	if !auth.CheckPassword(password, passwordHash) {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	result, err := h.DB.Exec(r.Context(), `
		DELETE FROM users
		WHERE id = $1
	`, user.ID)

	if err != nil {
		http.Error(w, "Failed to delete account", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := auth.GetSessionToken(r)
	if token == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenHash := auth.HashSessionToken(token)

	result, err := h.DB.Exec(r.Context(), `
		UPDATE sessions
		SET revoked_at = NOW()
		WHERE token_hash = $1
			AND revoked_at IS NULL
	`, tokenHash)

	if err != nil {
		http.Error(w, "Failed to logout", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	secure, sameSite := auth.CookieSecurity(r)
	http.SetCookie(w, &http.Cookie{
		Name: auth.SessionCookieName, Value: "", Path: "/", HttpOnly: true,
		Secure: secure, SameSite: sameSite, MaxAge: -1,
	})

	w.WriteHeader(http.StatusNoContent)
}
