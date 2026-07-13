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
	r.Post("/api/auth/demo-login", userHandler.DemoLogin)

	r.Get("/api/items", itemHandler.GetItems)
	r.Get("/api/items/recent", itemHandler.GetRecentItems)
	r.Post("/api/items", itemHandler.CreateItem)
	r.Delete("/api/items/{itemId}", itemHandler.DeleteItem)

	return r
}
