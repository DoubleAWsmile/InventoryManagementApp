package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/auth"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/constants"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
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

	token, err := auth.GenerateSessionToken()
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	tokenHash := auth.HashSessionToken(token)
	expiresAt := time.Now().Add(constants.SessionTimeLimit * time.Hour)

	_, err = h.DB.Exec(r.Context(), `
		INSERT INTO sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, user.ID, tokenHash, expiresAt)

	if err != nil {
		http.Error(w, "Failed to save session", http.StatusInternalServerError)
		return
	}

	secure, sameSite := auth.CookieSecurity(r)
	http.SetCookie(w, &http.Cookie{
		Name: auth.SessionCookieName, Value: token, Path: "/", HttpOnly: true,
		Secure: secure, SameSite: sameSite, Expires: expiresAt,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		User: user,
	})
}

func (h *UserHandler) GetCurrentUserFromRequest(r *http.Request) (models.User, error) {
	return getCurrentUserFromRequest(h.DB, r)
}

func getCurrentUserFromRequest(db *pgxpool.Pool, r *http.Request) (models.User, error) {
	token := auth.GetSessionToken(r)
	if token == "" {
		return models.User{}, errors.New("missing auth token")
	}

	tokenHash := auth.HashSessionToken(token)

	var user models.User

	err := db.QueryRow(r.Context(), `
		SELECT 
			u.id,
			u.email,
			u.display_name,
			u.created_at,
			u.updated_at
		FROM sessions s
		JOIN users u
			ON u.id = s.user_id
		WHERE s.token_hash = $1
			AND s.revoked_at IS NULL
			AND s.expires_at > NOW()
	`, tokenHash).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return models.User{}, errors.New("invalid or expired session")
	}

	return user, nil
}
