package models

import "time"

type WishlistItem struct {
	ID            string    `json:"id"`
	CategoryID    string    `json:"categoryId"`
	Category      string    `json:"category"`
	ItemName      string    `json:"itemName"`
	Brand         string    `json:"brand"`
	Model         string    `json:"model"`
	EstimatedCost *float64  `json:"estimatedCost"`
	ItemURL       string    `json:"itemUrl"`
	Notes         string    `json:"notes"`
	Priority      string    `json:"priority"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type WishlistRequest struct {
	CategoryID    string   `json:"categoryId"`
	ItemName      string   `json:"itemName"`
	Brand         string   `json:"brand"`
	Model         string   `json:"model"`
	EstimatedCost *float64 `json:"estimatedCost"`
	ItemURL       string   `json:"itemUrl"`
	Notes         string   `json:"notes"`
	Priority      string   `json:"priority"`
	Status        string   `json:"status"`
}
