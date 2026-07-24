package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/auth"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/handlers"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	sqliterepository "github.com/DoubleAWsmile/InventoryManagementApp/internal/repository/sqlite"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/routes"
	"github.com/go-chi/cors"
)

const (
	desktopHost         = "127.0.0.1"
	desktopDatabaseEnv  = "INVENTORY_DESKTOP_DB_PATH"
	desktopShutdownPath = "/api/desktop/shutdown"
	localUserEmail      = "local@inventory.invalid"
)

type readinessMessage struct {
	Status       string `json:"status"`
	Host         string `json:"host"`
	Port         int    `json:"port"`
	Token        string `json:"token"`
	DatabasePath string `json:"databasePath"`
}

func resolveDatabasePath(override, goos string, getenv func(string) string, homeDir func() (string, error)) (string, error) {
	path := strings.TrimSpace(override)
	if path == "" {
		path = strings.TrimSpace(getenv(desktopDatabaseEnv))
	}
	if path == "" {
		var base string
		switch goos {
		case "windows":
			base = strings.TrimSpace(getenv("LOCALAPPDATA"))
		case "darwin":
			home, err := homeDir()
			if err != nil {
				return "", fmt.Errorf("resolve home directory: %w", err)
			}
			base = filepath.Join(home, "Library", "Application Support")
		default:
			base = strings.TrimSpace(getenv("XDG_DATA_HOME"))
			if base == "" {
				home, err := homeDir()
				if err != nil {
					return "", fmt.Errorf("resolve home directory: %w", err)
				}
				base = filepath.Join(home, ".local", "share")
			}
		}
		if base == "" {
			return "", errors.New("application data directory is unavailable")
		}
		path = filepath.Join(base, "InventoryManagementApp", "inventory.db")
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("resolve database path: %w", err)
	}
	return absolute, nil
}

func resolvePort(flagPort int, rawEnvironment string) (int, error) {
	port := flagPort
	if port == 0 && strings.TrimSpace(rawEnvironment) != "" {
		parsed, err := strconv.Atoi(rawEnvironment)
		if err != nil {
			return 0, fmt.Errorf("invalid INVENTORY_DESKTOP_PORT: %w", err)
		}
		port = parsed
	}
	if port < 0 || port > 65535 {
		return 0, fmt.Errorf("port must be between 0 and 65535")
	}
	return port, nil
}

func listenLocal(port int) (net.Listener, error) {
	return net.Listen("tcp4", net.JoinHostPort(desktopHost, strconv.Itoa(port)))
}

func serializeReadiness(message readinessMessage) ([]byte, error) { return json.Marshal(message) }
func generateLaunchToken() (string, error)                        { return auth.GenerateSessionToken() }

func acquireProcessLock(databasePath string) (func(), error) {
	if err := os.MkdirAll(filepath.Dir(databasePath), 0o755); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}
	lockPath := databasePath + ".lock"
	file, err := os.OpenFile(lockPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		if errors.Is(err, os.ErrExist) {
			return nil, fmt.Errorf("desktop database is already in use: %s", databasePath)
		}
		return nil, fmt.Errorf("create desktop process lock: %w", err)
	}
	if _, err := fmt.Fprintf(file, "%d\n", os.Getpid()); err != nil {
		file.Close()
		os.Remove(lockPath)
		return nil, err
	}
	return func() { file.Close(); os.Remove(lockPath) }, nil
}

func ensureLocalUser(ctx context.Context, users repository.UserRepository) (models.User, error) {
	credentials, err := users.GetCredentialsByEmail(ctx, localUserEmail)
	if err == nil {
		return credentials.User, nil
	}
	if !errors.Is(err, repository.ErrNotFound) {
		return models.User{}, err
	}
	secret, err := generateLaunchToken()
	if err != nil {
		return models.User{}, err
	}
	passwordHash, err := auth.HashPassword(secret)
	if err != nil {
		return models.User{}, err
	}
	user, err := users.Create(ctx, repository.CreateUserParams{Email: localUserEmail, DisplayName: "Local User", PasswordHash: passwordHash})
	if errors.Is(err, repository.ErrConflict) {
		credentials, err = users.GetCredentialsByEmail(ctx, localUserEmail)
		return credentials.User, err
	}
	return user, err
}

func launchTokenMiddleware(token string, user models.User, next http.Handler, shutdown ...func()) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		const prefix = "Bearer "
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, prefix) || subtle.ConstantTimeCompare([]byte(strings.TrimSpace(strings.TrimPrefix(header, prefix))), []byte(token)) != 1 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if r.URL.Path == desktopShutdownPath && r.Method == http.MethodPost && len(shutdown) > 0 {
			w.WriteHeader(http.StatusNoContent)
			go shutdown[0]()
			return
		}
		next.ServeHTTP(w, r.WithContext(handlers.WithCurrentUser(r.Context(), user)))
	})
}

func buildDesktopHandler(ctx context.Context, databasePath, token string) (http.Handler, *sqliterepository.Store, models.User, error) {
	db, err := database.OpenSQLite(ctx, databasePath)
	if err != nil {
		return nil, nil, models.User{}, err
	}
	store := sqliterepository.New(db)
	repositories := store.Repositories()
	user, err := ensureLocalUser(ctx, repositories.Users)
	if err != nil {
		store.Close()
		return nil, nil, models.User{}, fmt.Errorf("initialize local user: %w", err)
	}
	router := routes.Setup(routes.Handlers{
		Auth: handlers.NewAuthHandler(repositories.Users, repositories.Sessions), Users: handlers.NewUserHandler(repositories.Users, repositories.Sessions),
		Settings: handlers.NewSettingsHandler(repositories.Settings, repositories.Sessions), Items: handlers.NewItemHandler(repositories.Items, repositories.Sessions),
		Organization: handlers.NewOrganizationHandler(repositories.Categories, repositories.Rooms, repositories.Sessions),
		Wishlist:     handlers.NewWishlistHandler(repositories.Wishlist, repositories.Sessions), Analytics: handlers.NewAnalyticsHandler(repositories.Analytics, repositories.Sessions),
	})
	corsHandler := cors.Handler(cors.Options{AllowedOrigins: []string{"tauri://localhost", "https://tauri.localhost", "http://tauri.localhost", "http://localhost:5173", "http://127.0.0.1:5173"}, AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"}, AllowCredentials: true})(router)
	return corsHandler, store, user, nil
}

func defaultDatabasePath(override string) (string, error) {
	return resolveDatabasePath(override, runtime.GOOS, os.Getenv, os.UserHomeDir)
}
