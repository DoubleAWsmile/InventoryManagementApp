package models

import "time"

type Item struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	Category       string     `json:"category"`
	RoomLocation   string     `json:"roomLocation"`
	Quantity       int        `json:"quantity"`
	EstimatedValue *float64   `json:"estimatedValue,omitempty"`
	PurchaseDate   *time.Time `json:"purchaseDate,omitempty"`
	Condition      string     `json:"condition,omitempty"`
	Brand          string     `json:"brand,omitempty"`
	Model          string     `json:"model,omitempty"`
	SerialNumber   string     `json:"serialNumber,omitempty"`
	Description    string     `json:"description,omitempty"`
	Notes          string     `json:"notes,omitempty"`
	PhotoURL       string     `json:"photoUrl,omitempty"`
	PhotoFilename  string     `json:"photoFilename,omitempty"`
	PhotoMimeType  string     `json:"photoMimeType,omitempty"`
	PhotoSizeBytes *int       `json:"photoSizeBytes,omitempty"`
	Tags           []string   `json:"tags"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type CreateItemRequest struct {
	Name           string     `json:"name"`
	Category       string     `json:"category"`
	RoomLocation   string     `json:"roomLocation"`
	Quantity       int        `json:"quantity"`
	EstimatedValue *float64   `json:"estimatedValue"`
	PurchaseDate   *time.Time `json:"purchaseDate"`
	Condition      string     `json:"condition"`
	Brand          string     `json:"brand"`
	Model          string     `json:"model"`
	SerialNumber   string     `json:"serialNumber"`
	Description    string     `json:"description"`
	Notes          string     `json:"notes"`
	PhotoURL       string     `json:"photoUrl"`
	PhotoFilename  string     `json:"photoFilename"`
	PhotoMimeType  string     `json:"photoMimeType"`
	PhotoSizeBytes *int       `json:"photoSizeBytes"`
	Tags           []string   `json:"tags"`
}
