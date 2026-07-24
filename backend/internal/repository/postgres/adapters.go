package postgres

import (
	"context"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"time"
)

type userRepository struct{ store *Store }
type sessionRepository struct{ store *Store }
type settingsRepository struct{ store *Store }
type itemRepository struct{ store *Store }
type categoryRepository struct{ store *Store }
type roomRepository struct{ store *Store }
type wishlistRepository struct{ store *Store }
type analyticsRepository struct{ store *Store }

func (s *Store) Repositories() repository.Repositories {
	return repository.Repositories{Users: userRepository{s}, Sessions: sessionRepository{s}, Settings: settingsRepository{s}, Items: itemRepository{s}, Categories: categoryRepository{s}, Rooms: roomRepository{s}, Wishlist: wishlistRepository{s}, Analytics: analyticsRepository{s}}
}
func (r userRepository) Create(c context.Context, p repository.CreateUserParams) (models.User, error) {
	return r.store.CreateUser(c, p)
}
func (r userRepository) GetCredentialsByEmail(c context.Context, v string) (repository.Credentials, error) {
	return r.store.CredentialsByEmail(c, v)
}
func (r userRepository) GetCredentialsByUserID(c context.Context, v string) (repository.Credentials, error) {
	return r.store.CredentialsByUserID(c, v)
}
func (r userRepository) Delete(c context.Context, v string) (bool, error) {
	return r.store.DeleteUser(c, v)
}
func (r sessionRepository) Create(c context.Context, p repository.CreateSessionParams) error {
	return r.store.CreateSession(c, p)
}
func (r sessionRepository) GetUserByTokenHash(c context.Context, v string, t time.Time) (models.User, error) {
	return r.store.UserBySession(c, v, t)
}
func (r sessionRepository) Revoke(c context.Context, v string, t time.Time) (bool, error) {
	return r.store.RevokeSession(c, v, t)
}
func (r sessionRepository) DeleteExpired(c context.Context, t time.Time) (int64, error) {
	return r.store.DeleteExpiredSessions(c, t)
}
func (r settingsRepository) Get(c context.Context, v string) (models.UserSettings, error) {
	return r.store.GetSettings(c, v)
}
func (r settingsRepository) Update(c context.Context, id string, v models.UserSettings) (models.UserSettings, error) {
	return r.store.UpdateSettings(c, id, v)
}
func (r settingsRepository) Reset(c context.Context, v string) (models.UserSettings, error) {
	return r.store.ResetSettings(c, v)
}
func (r itemRepository) Options(c context.Context, v string) (repository.ItemOptions, error) {
	return r.store.ItemOptions(c, v)
}
func (r itemRepository) List(c context.Context, p repository.ListItemsParams) (repository.ItemPage, error) {
	return r.store.Items(c, p)
}
func (r itemRepository) ListRecent(c context.Context, v string, n int) ([]models.Item, error) {
	return r.store.RecentItems(c, v, n)
}
func (r itemRepository) Create(c context.Context, p repository.CreateItemParams) (models.Item, error) {
	return r.store.CreateItem(c, p)
}
func (r itemRepository) Update(c context.Context, p repository.UpdateItemParams) (models.Item, error) {
	return r.store.UpdateItem(c, p)
}
func (r itemRepository) Delete(c context.Context, u, i string) (bool, error) {
	return r.store.DeleteItem(c, u, i)
}
func (r categoryRepository) List(c context.Context, v string) ([]models.CategorySummary, error) {
	return r.store.Categories(c, v)
}
func (r categoryRepository) Create(c context.Context, u, n string) (models.CategorySummary, error) {
	return r.store.CreateCategory(c, u, n)
}
func (r categoryRepository) CreateMany(c context.Context, u string, n []string) ([]models.CategorySummary, error) {
	return r.store.CreateCategories(c, u, n)
}
func (r categoryRepository) Delete(c context.Context, u, i string) (bool, error) {
	return r.store.DeleteCategory(c, u, i)
}
func (r roomRepository) List(c context.Context, v string) ([]models.RoomSummary, error) {
	return r.store.Rooms(c, v)
}
func (r roomRepository) Create(c context.Context, u, n, d string) (models.RoomSummary, error) {
	return r.store.CreateRoom(c, u, n, d)
}
func (r roomRepository) Delete(c context.Context, u, i string) (bool, error) {
	return r.store.DeleteRoom(c, u, i)
}
func (r wishlistRepository) List(c context.Context, v string) ([]models.WishlistItem, error) {
	return r.store.Wishlist(c, v)
}
func (r wishlistRepository) Create(c context.Context, p repository.CreateWishlistItemParams) (models.WishlistItem, error) {
	return r.store.CreateWishlistItem(c, p)
}
func (r wishlistRepository) Update(c context.Context, p repository.UpdateWishlistItemParams) (models.WishlistItem, error) {
	return r.store.UpdateWishlistItem(c, p)
}
func (r wishlistRepository) Delete(c context.Context, u, i string) (bool, error) {
	return r.store.DeleteWishlistItem(c, u, i)
}
func (r analyticsRepository) Dashboard(c context.Context, v string, t time.Time) (models.DashboardSummary, error) {
	return r.store.Dashboard(c, v, t)
}
func (r analyticsRepository) Reports(c context.Context, v string, t time.Time) (models.ReportSummary, error) {
	return r.store.Reports(c, v, t)
}

var _ repository.UserRepository = userRepository{}
var _ repository.SessionRepository = sessionRepository{}
var _ repository.SettingsRepository = settingsRepository{}
var _ repository.ItemRepository = itemRepository{}
var _ repository.CategoryRepository = categoryRepository{}
var _ repository.RoomRepository = roomRepository{}
var _ repository.WishlistRepository = wishlistRepository{}
var _ repository.AnalyticsRepository = analyticsRepository{}
