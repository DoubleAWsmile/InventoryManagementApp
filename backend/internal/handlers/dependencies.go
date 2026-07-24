package handlers

import "github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"

type AuthHandler struct {
	users    repository.UserRepository
	sessions repository.SessionRepository
}

type UserHandler struct {
	users    repository.UserRepository
	sessions repository.SessionRepository
}

type SettingsHandler struct {
	settings repository.SettingsRepository
	sessions repository.SessionRepository
}

type ItemHandler struct {
	items    repository.ItemRepository
	sessions repository.SessionRepository
}

type OrganizationHandler struct {
	categories repository.CategoryRepository
	rooms      repository.RoomRepository
	sessions   repository.SessionRepository
}

type WishlistHandler struct {
	wishlist repository.WishlistRepository
	sessions repository.SessionRepository
}

type AnalyticsHandler struct {
	analytics repository.AnalyticsRepository
	sessions  repository.SessionRepository
}

func NewAuthHandler(users repository.UserRepository, sessions repository.SessionRepository) *AuthHandler {
	return &AuthHandler{users: users, sessions: sessions}
}

func NewUserHandler(users repository.UserRepository, sessions repository.SessionRepository) *UserHandler {
	return &UserHandler{users: users, sessions: sessions}
}

func NewSettingsHandler(settings repository.SettingsRepository, sessions repository.SessionRepository) *SettingsHandler {
	return &SettingsHandler{settings: settings, sessions: sessions}
}

func NewItemHandler(items repository.ItemRepository, sessions repository.SessionRepository) *ItemHandler {
	return &ItemHandler{items: items, sessions: sessions}
}

func NewOrganizationHandler(categories repository.CategoryRepository, rooms repository.RoomRepository, sessions repository.SessionRepository) *OrganizationHandler {
	return &OrganizationHandler{categories: categories, rooms: rooms, sessions: sessions}
}

func NewWishlistHandler(wishlist repository.WishlistRepository, sessions repository.SessionRepository) *WishlistHandler {
	return &WishlistHandler{wishlist: wishlist, sessions: sessions}
}

func NewAnalyticsHandler(analytics repository.AnalyticsRepository, sessions repository.SessionRepository) *AnalyticsHandler {
	return &AnalyticsHandler{analytics: analytics, sessions: sessions}
}
