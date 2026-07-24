package handlers

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"github.com/go-chi/chi/v5"
)

type fakeSessions struct {
	user models.User
	err  error
}

func (f fakeSessions) Create(context.Context, repository.CreateSessionParams) error { return f.err }
func (f fakeSessions) GetUserByTokenHash(context.Context, string, time.Time) (models.User, error) {
	return f.user, f.err
}
func (f fakeSessions) Revoke(context.Context, string, time.Time) (bool, error) {
	return f.err == nil, f.err
}
func (f fakeSessions) DeleteExpired(context.Context, time.Time) (int64, error) { return 0, f.err }

type fakeItems struct {
	page    repository.ItemPage
	item    models.Item
	err     error
	deleted bool
}

func (f fakeItems) Options(context.Context, string) (repository.ItemOptions, error) {
	return repository.ItemOptions{}, f.err
}
func (f fakeItems) List(context.Context, repository.ListItemsParams) (repository.ItemPage, error) {
	return f.page, f.err
}
func (f fakeItems) ListRecent(context.Context, string, int) ([]models.Item, error) {
	return f.page.Items, f.err
}
func (f fakeItems) Create(context.Context, repository.CreateItemParams) (models.Item, error) {
	return f.item, f.err
}
func (f fakeItems) Update(context.Context, repository.UpdateItemParams) (models.Item, error) {
	return f.item, f.err
}
func (f fakeItems) Delete(context.Context, string, string) (bool, error) { return f.deleted, f.err }

type fakeCategories struct{ err error }

func (f fakeCategories) List(context.Context, string) ([]models.CategorySummary, error) {
	return []models.CategorySummary{}, f.err
}
func (f fakeCategories) Create(context.Context, string, string) (models.CategorySummary, error) {
	return models.CategorySummary{}, f.err
}
func (f fakeCategories) CreateMany(context.Context, string, []string) ([]models.CategorySummary, error) {
	return nil, f.err
}
func (f fakeCategories) Delete(context.Context, string, string) (bool, error) { return false, f.err }

type fakeUsers struct{ err error }

func (f fakeUsers) Create(context.Context, repository.CreateUserParams) (models.User, error) {
	return models.User{}, f.err
}
func (f fakeUsers) GetCredentialsByEmail(context.Context, string) (repository.Credentials, error) {
	return repository.Credentials{}, f.err
}
func (f fakeUsers) GetCredentialsByUserID(context.Context, string) (repository.Credentials, error) {
	return repository.Credentials{}, f.err
}
func (f fakeUsers) Delete(context.Context, string) (bool, error) { return false, f.err }

func authenticatedRequest(method, target string, body *bytes.Reader) *http.Request {
	request := httptest.NewRequest(method, target, body)
	request.AddCookie(&http.Cookie{Name: "inventory_session", Value: "token"})
	return request
}

func TestGetItemsSuccess(t *testing.T) {
	h := NewItemHandler(fakeItems{page: repository.ItemPage{Items: []models.Item{{ID: "item-1", Name: "Camera"}}}}, fakeSessions{user: models.User{ID: "user-1"}})
	w := httptest.NewRecorder()
	h.GetItems(w, authenticatedRequest(http.MethodGet, "/api/items", bytes.NewReader(nil)))
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"name":"Camera"`) {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}

func TestGetItemsRepositoryErrors(t *testing.T) {
	tests := []struct {
		name   string
		err    error
		status int
		body   string
	}{{"invalid cursor", repository.ErrInvalidCursor, 400, "Invalid items cursor"}, {"unexpected", errors.New("database unavailable"), 500, "Failed to fetch items"}}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			h := NewItemHandler(fakeItems{err: test.err}, fakeSessions{user: models.User{ID: "user-1"}})
			w := httptest.NewRecorder()
			h.GetItems(w, authenticatedRequest(http.MethodGet, "/api/items?cursor=bad", bytes.NewReader(nil)))
			if w.Code != test.status || !strings.Contains(w.Body.String(), test.body) {
				t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
			}
		})
	}
}

func TestCreateItemInvalidReference(t *testing.T) {
	h := NewItemHandler(fakeItems{err: repository.ErrInvalidReference}, fakeSessions{user: models.User{ID: "user-1"}})
	w := httptest.NewRecorder()
	h.CreateItem(w, authenticatedRequest(http.MethodPost, "/api/items", bytes.NewReader([]byte(`{"name":"Camera","quantity":1}`))))
	if w.Code != 400 || !strings.Contains(w.Body.String(), "categoryId or roomId is invalid") {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}

func TestDeleteItemNotFound(t *testing.T) {
	h := NewItemHandler(fakeItems{}, fakeSessions{user: models.User{ID: "user-1"}})
	request := authenticatedRequest(http.MethodDelete, "/api/items/item-1", bytes.NewReader(nil))
	route := chi.NewRouteContext()
	route.URLParams.Add("itemId", "item-1")
	request = request.WithContext(context.WithValue(request.Context(), chi.RouteCtxKey, route))
	w := httptest.NewRecorder()
	h.DeleteItem(w, request)
	if w.Code != 404 || !strings.Contains(w.Body.String(), "Item not found") {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateCategoryConflict(t *testing.T) {
	h := NewOrganizationHandler(fakeCategories{err: repository.ErrConflict}, nil, fakeSessions{user: models.User{ID: "user-1"}})
	w := httptest.NewRecorder()
	h.CreateCategory(w, authenticatedRequest(http.MethodPost, "/api/categories", bytes.NewReader([]byte(`{"name":"Tools"}`))))
	if w.Code != 409 || !strings.Contains(w.Body.String(), "category already exists") {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}

func TestExpiredSessionIsUnauthorized(t *testing.T) {
	h := NewItemHandler(fakeItems{}, fakeSessions{err: repository.ErrNotFound})
	w := httptest.NewRecorder()
	h.GetItems(w, authenticatedRequest(http.MethodGet, "/api/items", bytes.NewReader(nil)))
	if w.Code != 401 || !strings.Contains(w.Body.String(), "Unauthorized") {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateUserConflict(t *testing.T) {
	h := NewUserHandler(fakeUsers{err: repository.ErrConflict}, fakeSessions{})
	w := httptest.NewRecorder()
	body := bytes.NewReader([]byte(`{"email":"person@example.com","displayName":"Person","password":"Password!"}`))
	h.CreateUser(w, httptest.NewRequest(http.MethodPost, "/api/users", body))
	if w.Code != 409 || !strings.Contains(w.Body.String(), "An account with this email already exists") {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}
