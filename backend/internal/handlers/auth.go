package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/auth"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/constants"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
)

type currentUserContextKey struct{}

// WithCurrentUser supplies an already authenticated user to shared handlers.
// The desktop API uses this after validating its per-launch sidecar token.
// Hosted requests continue through the session repository path below.
func WithCurrentUser(ctx context.Context, user models.User) context.Context {
	return context.WithValue(ctx, currentUserContextKey{}, user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
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

	credentials, err := h.users.GetCredentialsByEmail(r.Context(), email)
	if err != nil {
		http.Error(w, "Invalid email and/or password", http.StatusUnauthorized)
		return
	}

	if !auth.CheckPassword(password, credentials.PasswordHash) {
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

	err = h.sessions.Create(r.Context(), repository.CreateSessionParams{
		UserID: credentials.User.ID, TokenHash: tokenHash, ExpiresAt: expiresAt,
	})
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
		User: credentials.User,
	})
}

func getCurrentUserFromRequest(sessions repository.SessionRepository, r *http.Request) (models.User, error) {
	if user, ok := r.Context().Value(currentUserContextKey{}).(models.User); ok && user.ID != "" {
		return user, nil
	}
	token := auth.GetSessionToken(r)
	if token == "" {
		return models.User{}, errors.New("missing auth token")
	}

	tokenHash := auth.HashSessionToken(token)

	user, err := sessions.GetUserByTokenHash(r.Context(), tokenHash, time.Now())
	if err != nil {
		return models.User{}, errors.New("invalid or expired session")
	}

	return user, nil
}
