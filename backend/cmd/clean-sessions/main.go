package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/db"
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

	result, err := pool.Exec(ctx, `
		DELETE FROM sessions
		WHERE expires_at <= NOW()
	`)
	if err != nil {
		log.Fatal("failed to delete expired sessions:", err)
	}

	log.Println("deleted expired sessions:", result.RowsAffected())
}
