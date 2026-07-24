package repository

import (
	"context"
	"errors"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

var (
	ErrNotFound         = errors.New("repository: not found")
	ErrConflict         = errors.New("repository: conflict")
	ErrInvalidReference = errors.New("repository: invalid reference")
	ErrInvalidCursor    = errors.New("repository: invalid cursor")
)

type CreateUserParams struct {
	Email        string
	DisplayName  string
	PasswordHash string
}

type Credentials struct {
	User         models.User
	PasswordHash string
}

type UserRepository interface {
	Create(context.Context, CreateUserParams) (models.User, error)
	GetCredentialsByEmail(context.Context, string) (Credentials, error)
	GetCredentialsByUserID(context.Context, string) (Credentials, error)
	Delete(context.Context, string) (bool, error)
}

type CreateSessionParams struct {
	UserID    string
	TokenHash string
	ExpiresAt time.Time
}

type SessionRepository interface {
	Create(context.Context, CreateSessionParams) error
	GetUserByTokenHash(context.Context, string, time.Time) (models.User, error)
	Revoke(context.Context, string, time.Time) (bool, error)
	DeleteExpired(context.Context, time.Time) (int64, error)
}

type SettingsRepository interface {
	Get(context.Context, string) (models.UserSettings, error)
	Update(context.Context, string, models.UserSettings) (models.UserSettings, error)
	Reset(context.Context, string) (models.UserSettings, error)
}

type ItemOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ItemOptions struct {
	Categories []ItemOption `json:"categories"`
	Rooms      []ItemOption `json:"rooms"`
}

type ListItemsParams struct {
	UserID string
	Limit  int
	Cursor *string
}

type ItemPage struct {
	Items      []models.Item
	NextCursor *string
}

type ItemValues struct {
	Name           string
	CategoryID     string
	RoomID         string
	Quantity       int
	EstimatedValue *float64
	PurchaseDate   *time.Time
	Condition      string
	Brand          string
	Model          string
	SerialNumber   string
	Description    string
	Notes          string
	PhotoURL       string
	PhotoFilename  string
	PhotoMimeType  string
	PhotoSizeBytes *int
	Tags           []string
}

type CreateItemParams struct {
	UserID string
	Item   ItemValues
}

type UpdateItemParams struct {
	UserID string
	ItemID string
	Item   ItemValues
}

type ItemRepository interface {
	Options(context.Context, string) (ItemOptions, error)
	List(context.Context, ListItemsParams) (ItemPage, error)
	ListRecent(context.Context, string, int) ([]models.Item, error)
	Create(context.Context, CreateItemParams) (models.Item, error)
	Update(context.Context, UpdateItemParams) (models.Item, error)
	Delete(context.Context, string, string) (bool, error)
}

type CategoryRepository interface {
	List(context.Context, string) ([]models.CategorySummary, error)
	Create(context.Context, string, string) (models.CategorySummary, error)
	CreateMany(context.Context, string, []string) ([]models.CategorySummary, error)
	Delete(context.Context, string, string) (bool, error)
}

type RoomRepository interface {
	List(context.Context, string) ([]models.RoomSummary, error)
	Create(context.Context, string, string, string) (models.RoomSummary, error)
	Delete(context.Context, string, string) (bool, error)
}

type WishlistValues struct {
	CategoryID    string
	ItemName      string
	Brand         string
	Model         string
	EstimatedCost *float64
	ItemURL       string
	Notes         string
	Priority      string
	Status        string
}

type CreateWishlistItemParams struct {
	UserID string
	Item   WishlistValues
}

type UpdateWishlistItemParams struct {
	UserID     string
	WishlistID string
	Item       WishlistValues
}

type WishlistRepository interface {
	List(context.Context, string) ([]models.WishlistItem, error)
	Create(context.Context, CreateWishlistItemParams) (models.WishlistItem, error)
	Update(context.Context, UpdateWishlistItemParams) (models.WishlistItem, error)
	Delete(context.Context, string, string) (bool, error)
}

type AnalyticsRepository interface {
	Dashboard(context.Context, string, time.Time) (models.DashboardSummary, error)
	Reports(context.Context, string, time.Time) (models.ReportSummary, error)
}

// Repositories is an application construction convenience. Handlers should
// receive only the individual interfaces they use.
type Repositories struct {
	Users      UserRepository
	Sessions   SessionRepository
	Settings   SettingsRepository
	Items      ItemRepository
	Categories CategoryRepository
	Rooms      RoomRepository
	Wishlist   WishlistRepository
	Analytics  AnalyticsRepository
}
