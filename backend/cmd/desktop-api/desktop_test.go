package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func TestResolveDatabasePath(t *testing.T) {
	home := filepath.Join(t.TempDir(), "home")
	tests := []struct {
		name, goos    string
		environment   map[string]string
		expectedParts []string
	}{
		{name: "windows", goos: "windows", environment: map[string]string{"LOCALAPPDATA": filepath.Join(home, "AppData", "Local")}, expectedParts: []string{"AppData", "Local", "InventoryManagementApp", "inventory.db"}},
		{name: "macOS", goos: "darwin", expectedParts: []string{"Library", "Application Support", "InventoryManagementApp", "inventory.db"}},
		{name: "Linux XDG", goos: "linux", environment: map[string]string{"XDG_DATA_HOME": filepath.Join(home, "xdg")}, expectedParts: []string{"xdg", "InventoryManagementApp", "inventory.db"}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			getenv := func(key string) string { return test.environment[key] }
			path, err := resolveDatabasePath("", test.goos, getenv, func() (string, error) { return home, nil })
			if err != nil {
				t.Fatal(err)
			}
			for _, part := range test.expectedParts {
				if !strings.Contains(path, part) {
					t.Fatalf("path %q does not contain %q", path, part)
				}
			}
		})
	}
}

func TestExplicitDatabasePathOverride(t *testing.T) {
	expected := filepath.Join(t.TempDir(), "custom.db")
	actual, err := resolveDatabasePath(expected, "linux", func(string) string { return "ignored" }, func() (string, error) { return "ignored", nil })
	if err != nil {
		t.Fatal(err)
	}
	absolute, _ := filepath.Abs(expected)
	if actual != absolute {
		t.Fatalf("got %q, want %q", actual, absolute)
	}
}

func TestListenLocalSelectsAutomaticPort(t *testing.T) {
	listener, err := listenLocal(0)
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	address := listener.Addr().String()
	if !strings.HasPrefix(address, desktopHost+":") {
		t.Fatalf("listener escaped localhost: %s", address)
	}
	if strings.HasSuffix(address, ":0") {
		t.Fatalf("automatic port was not selected: %s", address)
	}
}

func TestReadinessSerialization(t *testing.T) {
	raw, err := serializeReadiness(readinessMessage{Status: "ready", Host: desktopHost, Port: 43821, Token: "secret", DatabasePath: "test.db"})
	if err != nil {
		t.Fatal(err)
	}
	var decoded readinessMessage
	if err = json.Unmarshal(raw, &decoded); err != nil {
		t.Fatal(err)
	}
	if decoded.Status != "ready" || decoded.Host != desktopHost || decoded.Port != 43821 || decoded.Token != "secret" {
		t.Fatalf("unexpected message: %+v", decoded)
	}
}

func TestGenerateLaunchToken(t *testing.T) {
	first, err := generateLaunchToken()
	if err != nil {
		t.Fatal(err)
	}
	second, err := generateLaunchToken()
	if err != nil {
		t.Fatal(err)
	}
	if len(first) < 32 || first == second {
		t.Fatalf("tokens are not suitably random: %q %q", first, second)
	}
}

func TestDesktopAuthorizationAndSQLitePersistence(t *testing.T) {
	ctx := context.Background()
	databasePath := filepath.Join(t.TempDir(), "nested", "inventory.db")
	token := "launch-token"
	baseHandler, store, user, err := buildDesktopHandler(ctx, databasePath, token)
	if err != nil {
		t.Fatal(err)
	}
	handler := launchTokenMiddleware(token, user, baseHandler)
	health := httptest.NewRecorder()
	handler.ServeHTTP(health, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if health.Code != 200 {
		t.Fatalf("health status=%d", health.Code)
	}
	missing := httptest.NewRecorder()
	handler.ServeHTTP(missing, httptest.NewRequest(http.MethodGet, "/api/me", nil))
	if missing.Code != 401 {
		t.Fatalf("missing token status=%d", missing.Code)
	}
	invalidRequest := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	invalidRequest.Header.Set("Authorization", "Bearer wrong")
	invalid := httptest.NewRecorder()
	handler.ServeHTTP(invalid, invalidRequest)
	if invalid.Code != 401 {
		t.Fatalf("invalid token status=%d", invalid.Code)
	}
	authorizedRequest := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	authorizedRequest.Header.Set("Authorization", "Bearer "+token)
	authorized := httptest.NewRecorder()
	handler.ServeHTTP(authorized, authorizedRequest)
	if authorized.Code != 200 || !strings.Contains(authorized.Body.String(), localUserEmail) {
		t.Fatalf("authorized status=%d body=%s", authorized.Code, authorized.Body.String())
	}
	createRequest := httptest.NewRequest(http.MethodPost, "/api/categories", bytes.NewBufferString(`{"name":"Persistent"}`))
	createRequest.Header.Set("Authorization", "Bearer "+token)
	createRequest.Header.Set("Content-Type", "application/json")
	created := httptest.NewRecorder()
	handler.ServeHTTP(created, createRequest)
	if created.Code != 201 {
		t.Fatalf("create status=%d body=%s", created.Code, created.Body.String())
	}
	if err = store.Close(); err != nil {
		t.Fatal(err)
	}
	baseHandler, store, user, err = buildDesktopHandler(ctx, databasePath, token)
	if err != nil {
		t.Fatal(err)
	}
	handler = launchTokenMiddleware(token, user, baseHandler)
	defer store.Close()
	listRequest := httptest.NewRequest(http.MethodGet, "/api/categories", nil)
	listRequest.Header.Set("Authorization", "Bearer "+token)
	listed := httptest.NewRecorder()
	handler.ServeHTTP(listed, listRequest)
	if listed.Code != 200 || !strings.Contains(listed.Body.String(), "Persistent") {
		t.Fatalf("persisted list status=%d body=%s", listed.Code, listed.Body.String())
	}
}

func TestDesktopShutdownRequiresAuthorization(t *testing.T) {
	called := make(chan struct{}, 1)
	handler := launchTokenMiddleware("secret", models.User{}, http.NotFoundHandler(), func() { called <- struct{}{} })
	unauthorized := httptest.NewRecorder()
	handler.ServeHTTP(unauthorized, httptest.NewRequest(http.MethodPost, desktopShutdownPath, nil))
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("unauthorized status=%d", unauthorized.Code)
	}
	request := httptest.NewRequest(http.MethodPost, desktopShutdownPath, nil)
	request.Header.Set("Authorization", "Bearer secret")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("authorized status=%d", response.Code)
	}
	select {
	case <-called:
	case <-time.After(time.Second):
		t.Fatal("shutdown callback was not called")
	}
}

func TestProcessLockRejectsSecondInstance(t *testing.T) {
	path := filepath.Join(t.TempDir(), "inventory.db")
	release, err := acquireProcessLock(path)
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	if _, err = acquireProcessLock(path); err == nil {
		t.Fatal("second process lock unexpectedly succeeded")
	}
}
