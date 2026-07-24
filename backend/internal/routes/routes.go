package routes

import (
	"net/http"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/handlers"
	"github.com/go-chi/chi/v5"
)

type Handlers struct {
	Auth         *handlers.AuthHandler
	Users        *handlers.UserHandler
	Settings     *handlers.SettingsHandler
	Items        *handlers.ItemHandler
	Organization *handlers.OrganizationHandler
	Wishlist     *handlers.WishlistHandler
	Analytics    *handlers.AnalyticsHandler
}

func Setup(h Handlers) http.Handler {
	r := chi.NewRouter()

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Post("/api/users", h.Users.CreateUser)
	r.Delete("/api/me", h.Users.DeleteMe)
	r.Post("/api/auth/login", h.Auth.Login)
	r.Post("/api/auth/logout", h.Auth.Logout)
	r.Get("/api/me", h.Users.GetMe)
	r.Get("/api/settings", h.Settings.GetSettings)
	r.Put("/api/settings", h.Settings.UpdateSettings)
	r.Delete("/api/settings", h.Settings.ResetSettings)
	r.Get("/api/dashboard", h.Analytics.GetDashboard)
	r.Get("/api/reports", h.Analytics.GetReports)
	r.Get("/api/wishlist", h.Wishlist.GetWishlist)
	r.Post("/api/wishlist", h.Wishlist.CreateWishlistItem)
	r.Put("/api/wishlist/{wishlistId}", h.Wishlist.UpdateWishlistItem)
	r.Delete("/api/wishlist/{wishlistId}", h.Wishlist.DeleteWishlistItem)

	r.Get("/api/items", h.Items.GetItems)
	r.Get("/api/items/recent", h.Items.GetRecentItems)
	r.Get("/api/items/options", h.Items.GetItemOptions)
	r.Post("/api/items", h.Items.CreateItem)
	r.Put("/api/items/{itemId}", h.Items.UpdateItem)
	r.Delete("/api/items/{itemId}", h.Items.DeleteItem)
	r.Get("/api/categories", h.Organization.GetCategories)
	r.Post("/api/categories", h.Organization.CreateCategory)
	r.Post("/api/categories/recommended", h.Organization.CreateRecommendedCategories)
	r.Delete("/api/categories/{categoryId}", h.Organization.DeleteCategory)
	r.Get("/api/rooms", h.Organization.GetRooms)
	r.Post("/api/rooms", h.Organization.CreateRoom)
	r.Delete("/api/rooms/{roomId}", h.Organization.DeleteRoom)

	return r
}
