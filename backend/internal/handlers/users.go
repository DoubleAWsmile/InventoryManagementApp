package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/auth"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
)

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

	user, err := h.users.Create(r.Context(), repository.CreateUserParams{
		Email: req.Email, DisplayName: req.DisplayName, PasswordHash: passwordHash,
	})
	if err != nil {
		if errors.Is(err, repository.ErrConflict) {
			http.Error(w, "An account with this email already exists", http.StatusConflict)
			return
		}

		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) DeleteMe(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
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

	credentials, err := h.users.GetCredentialsByUserID(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "Failed to verify account", http.StatusInternalServerError)
		return
	}

	if !auth.CheckPassword(password, credentials.PasswordHash) {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	deleted, err := h.users.Delete(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "Failed to delete account", http.StatusInternalServerError)
		return
	}

	if !deleted {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := auth.GetSessionToken(r)
	if token == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenHash := auth.HashSessionToken(token)

	revoked, err := h.sessions.Revoke(r.Context(), tokenHash, time.Now())
	if err != nil {
		http.Error(w, "Failed to logout", http.StatusInternalServerError)
		return
	}

	if !revoked {
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
