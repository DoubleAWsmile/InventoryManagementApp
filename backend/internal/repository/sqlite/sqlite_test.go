package sqlite_test

import (
	"context"
	"encoding/json"
	"errors"
	"path/filepath"
	"testing"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository/sqlite"
)

func newStore(t *testing.T) *sqlite.Store {
	t.Helper()
	db, err := database.OpenSQLite(context.Background(), filepath.Join(t.TempDir(), "nested", "inventory.db"))
	if err != nil {
		t.Fatal(err)
	}
	store := sqlite.New(db)
	t.Cleanup(func() { store.Close() })
	return store
}

func TestUserSessionAndSettings(t *testing.T) {
	ctx := context.Background()
	store := newStore(t)
	repositories := store.Repositories()
	user, err := repositories.Users.Create(ctx, repository.CreateUserParams{Email: "person@example.com", DisplayName: "Person", PasswordHash: "password-hash"})
	if err != nil {
		t.Fatal(err)
	}
	if user.ID == "" || user.Email != "person@example.com" {
		t.Fatalf("unexpected user: %+v", user)
	}
	if err := repositories.Sessions.Create(ctx, repository.CreateSessionParams{UserID: user.ID, TokenHash: "token-hash", ExpiresAt: time.Now().Add(time.Hour)}); err != nil {
		t.Fatal(err)
	}
	resolved, err := repositories.Sessions.GetUserByTokenHash(ctx, "token-hash", time.Now())
	if err != nil || resolved.ID != user.ID {
		t.Fatalf("resolve session: user=%+v err=%v", resolved, err)
	}
	settings, err := repositories.Settings.Get(ctx, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if settings.CurrencyCode != "USD" || !settings.NotifyLowStock {
		t.Fatalf("unexpected defaults: %+v", settings)
	}
	settings.CurrencyCode = "EUR"
	settings.UIPreferences = json.RawMessage(`{"theme":"dark"}`)
	settings, err = repositories.Settings.Update(ctx, user.ID, settings)
	if err != nil || settings.CurrencyCode != "EUR" {
		t.Fatalf("update settings: settings=%+v err=%v", settings, err)
	}
}

func TestItemTagsRoundTrip(t *testing.T) {
	ctx := context.Background()
	store := newStore(t)
	repositories := store.Repositories()
	user, err := repositories.Users.Create(ctx, repository.CreateUserParams{Email: "items@example.com", DisplayName: "Items", PasswordHash: "hash"})
	if err != nil {
		t.Fatal(err)
	}
	item, err := repositories.Items.Create(ctx, repository.CreateItemParams{UserID: user.ID, Item: repository.ItemValues{Name: "Camera", Quantity: 1, Tags: []string{"photo", "travel"}}})
	if err != nil {
		t.Fatal(err)
	}
	if len(item.Tags) != 2 || item.Tags[0] != "photo" || item.Tags[1] != "travel" {
		t.Fatalf("unexpected tags: %#v", item.Tags)
	}
	page, err := repositories.Items.List(ctx, repository.ListItemsParams{UserID: user.ID, Limit: 24})
	if err != nil || len(page.Items) != 1 {
		t.Fatalf("list items: page=%+v err=%v", page, err)
	}
}

func TestListItemsRejectsInvalidCursor(t *testing.T) {
	repositories := newStore(t).Repositories()
	cursor := "not-a-number"
	_, err := repositories.Items.List(context.Background(), repository.ListItemsParams{
		UserID: "user-id",
		Limit:  24,
		Cursor: &cursor,
	})
	if !errors.Is(err, repository.ErrInvalidCursor) {
		t.Fatalf("expected ErrInvalidCursor, got %v", err)
	}
}
