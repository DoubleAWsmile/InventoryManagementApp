package main

import (
	"log"
	"net/http"
	"os"

	"github.com/DoubleAWsmile/inventorymanagementapp/backend/internal/db"
	"github.com/DoubleAWsmile/inventorymanagementapp/backend/internal/handlers"
	"github.com/DoubleAWsmile/inventorymanagementapp/backend/internal/routes"
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

	userHandler := handlers.NewUserHandler(pool)
	itemHandler := handlers.NewItemHandler(pool)

	router := routes.Setup(userHandler, itemHandler)

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
