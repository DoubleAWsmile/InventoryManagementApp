package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/db"
	postgresrepository "github.com/DoubleAWsmile/InventoryManagementApp/internal/repository/postgres"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	pool, err := db.Connect(databaseURL)
	if err != nil {
		log.Fatal("failed to connect to database:", err)
	}
	defer pool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	deleted, err := postgresrepository.New(pool).Repositories().Sessions.DeleteExpired(ctx, time.Now())
	if err != nil {
		log.Fatal("failed to delete expired sessions:", err)
	}

	log.Println("deleted expired sessions:", deleted)
}
