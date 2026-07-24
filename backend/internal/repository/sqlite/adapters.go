package sqlite

import (
	"context"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
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
	return repository.Repositories{
		Users: userRepository{s}, Sessions: sessionRepository{s}, Settings: settingsRepository{s},
		Items: itemRepository{s}, Categories: categoryRepository{s}, Rooms: roomRepository{s},
		Wishlist: wishlistRepository{s}, Analytics: analyticsRepository{s},
	}
}

func (r userRepository) Create(ctx context.Context, p repository.CreateUserParams) (models.User, error) {
	return r.store.CreateUser(ctx, p)
}
func (r userRepository) GetCredentialsByEmail(ctx context.Context, email string) (repository.Credentials, error) {
	return r.store.CredentialsByEmail(ctx, email)
}
func (r userRepository) GetCredentialsByUserID(ctx context.Context, id string) (repository.Credentials, error) {
	return r.store.CredentialsByUserID(ctx, id)
}
func (r userRepository) Delete(ctx context.Context, id string) (bool, error) {
	return r.store.DeleteUser(ctx, id)
}
func (r sessionRepository) Create(ctx context.Context, p repository.CreateSessionParams) error {
	return r.store.CreateSession(ctx, p)
}
func (r sessionRepository) GetUserByTokenHash(ctx context.Context, hash string, at time.Time) (models.User, error) {
	return r.store.UserBySession(ctx, hash, at)
}
func (r sessionRepository) Revoke(ctx context.Context, hash string, at time.Time) (bool, error) {
	return r.store.RevokeSession(ctx, hash, at)
}
func (r sessionRepository) DeleteExpired(ctx context.Context, at time.Time) (int64, error) {
	return r.store.DeleteExpiredSessions(ctx, at)
}
func (r settingsRepository) Get(ctx context.Context, id string) (models.UserSettings, error) {
	return r.store.GetSettings(ctx, id)
}
func (r settingsRepository) Update(ctx context.Context, id string, v models.UserSettings) (models.UserSettings, error) {
	return r.store.UpdateSettings(ctx, id, v)
}
func (r settingsRepository) Reset(ctx context.Context, id string) (models.UserSettings, error) {
	return r.store.ResetSettings(ctx, id)
}
func (r itemRepository) Options(ctx context.Context, id string) (repository.ItemOptions, error) {
	return r.store.ItemOptions(ctx, id)
}
func (r itemRepository) List(ctx context.Context, p repository.ListItemsParams) (repository.ItemPage, error) {
	return r.store.Items(ctx, p)
}
func (r itemRepository) ListRecent(ctx context.Context, id string, limit int) ([]models.Item, error) {
	return r.store.RecentItems(ctx, id, limit)
}
func (r itemRepository) Create(ctx context.Context, p repository.CreateItemParams) (models.Item, error) {
	return r.store.CreateItem(ctx, p)
}
func (r itemRepository) Update(ctx context.Context, p repository.UpdateItemParams) (models.Item, error) {
	return r.store.UpdateItem(ctx, p)
}
func (r itemRepository) Delete(ctx context.Context, userID, itemID string) (bool, error) {
	return r.store.DeleteItem(ctx, userID, itemID)
}
func (r categoryRepository) List(ctx context.Context, id string) ([]models.CategorySummary, error) {
	return r.store.Categories(ctx, id)
}
func (r categoryRepository) Create(ctx context.Context, id, name string) (models.CategorySummary, error) {
	return r.store.CreateCategory(ctx, id, name)
}
func (r categoryRepository) CreateMany(ctx context.Context, id string, names []string) ([]models.CategorySummary, error) {
	return r.store.CreateCategories(ctx, id, names)
}
func (r categoryRepository) Delete(ctx context.Context, userID, id string) (bool, error) {
	return r.store.DeleteCategory(ctx, userID, id)
}
func (r roomRepository) List(ctx context.Context, id string) ([]models.RoomSummary, error) {
	return r.store.Rooms(ctx, id)
}
func (r roomRepository) Create(ctx context.Context, id, name, description string) (models.RoomSummary, error) {
	return r.store.CreateRoom(ctx, id, name, description)
}
func (r roomRepository) Delete(ctx context.Context, userID, id string) (bool, error) {
	return r.store.DeleteRoom(ctx, userID, id)
}
func (r wishlistRepository) List(ctx context.Context, id string) ([]models.WishlistItem, error) {
	return r.store.Wishlist(ctx, id)
}
func (r wishlistRepository) Create(ctx context.Context, p repository.CreateWishlistItemParams) (models.WishlistItem, error) {
	return r.store.CreateWishlistItem(ctx, p)
}
func (r wishlistRepository) Update(ctx context.Context, p repository.UpdateWishlistItemParams) (models.WishlistItem, error) {
	return r.store.UpdateWishlistItem(ctx, p)
}
func (r wishlistRepository) Delete(ctx context.Context, userID, id string) (bool, error) {
	return r.store.DeleteWishlistItem(ctx, userID, id)
}
func (r analyticsRepository) Dashboard(ctx context.Context, id string, at time.Time) (models.DashboardSummary, error) {
	return r.store.Dashboard(ctx, id, at)
}
func (r analyticsRepository) Reports(ctx context.Context, id string, at time.Time) (models.ReportSummary, error) {
	return r.store.Reports(ctx, id, at)
}

var _ repository.UserRepository = userRepository{}
var _ repository.SessionRepository = sessionRepository{}
var _ repository.SettingsRepository = settingsRepository{}
var _ repository.ItemRepository = itemRepository{}
var _ repository.CategoryRepository = categoryRepository{}
var _ repository.RoomRepository = roomRepository{}
var _ repository.WishlistRepository = wishlistRepository{}
var _ repository.AnalyticsRepository = analyticsRepository{}
