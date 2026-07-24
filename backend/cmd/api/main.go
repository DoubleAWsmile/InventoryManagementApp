package main

import (
	"log"
	"net/http"
	"os"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/db"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/handlers"
	postgresrepository "github.com/DoubleAWsmile/InventoryManagementApp/internal/repository/postgres"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/routes"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	pool, err := db.Connect(databaseURL)
	if err != nil {
		log.Fatal("failed to connect to database:", err)
	}
	defer pool.Close()

	store := postgresrepository.New(pool)
	repositories := store.Repositories()
	router := routes.Setup(routes.Handlers{
		Auth:         handlers.NewAuthHandler(repositories.Users, repositories.Sessions),
		Users:        handlers.NewUserHandler(repositories.Users, repositories.Sessions),
		Settings:     handlers.NewSettingsHandler(repositories.Settings, repositories.Sessions),
		Items:        handlers.NewItemHandler(repositories.Items, repositories.Sessions),
		Organization: handlers.NewOrganizationHandler(repositories.Categories, repositories.Rooms, repositories.Sessions),
		Wishlist:     handlers.NewWishlistHandler(repositories.Wishlist, repositories.Sessions),
		Analytics:    handlers.NewAnalyticsHandler(repositories.Analytics, repositories.Sessions),
	})

	corsHandler := cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	})(router)

	addr := "0.0.0.0:" + port

	log.Println("server running on", addr)

	if err := http.ListenAndServe(addr, corsHandler); err != nil {
		log.Fatal(err)
	}
}
