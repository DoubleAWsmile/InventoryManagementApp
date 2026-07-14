package routes

import (
	"net/http"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/handlers"
	"github.com/go-chi/chi/v5"
)

func Setup(userHandler *handlers.UserHandler, itemHandler *handlers.ItemHandler) http.Handler {
	r := chi.NewRouter()

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Post("/api/users", userHandler.CreateUser)
	r.Delete("/api/me", userHandler.DeleteMe)
	r.Post("/api/auth/login", userHandler.Login)
	r.Post("/api/auth/logout", userHandler.Logout)
	r.Get("/api/me", userHandler.GetMe)
	r.Get("/api/dashboard", itemHandler.GetDashboard)

	r.Get("/api/items", itemHandler.GetItems)
	r.Get("/api/items/recent", itemHandler.GetRecentItems)
	r.Get("/api/items/options", itemHandler.GetItemOptions)
	r.Post("/api/items", itemHandler.CreateItem)
	r.Delete("/api/items/{itemId}", itemHandler.DeleteItem)
	r.Get("/api/categories", itemHandler.GetCategories)
	r.Post("/api/categories", itemHandler.CreateCategory)
	r.Post("/api/categories/recommended", itemHandler.CreateRecommendedCategories)
	r.Get("/api/rooms", itemHandler.GetRooms)
	r.Post("/api/rooms", itemHandler.CreateRoom)

	return r
}
