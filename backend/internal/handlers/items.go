package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ItemHandler struct {
	DB *pgxpool.Pool
}

func NewItemHandler(db *pgxpool.Pool) *ItemHandler {
	return &ItemHandler{DB: db}
}

func (h *ItemHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "userId is required", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT id, user_id, name, category, room_location, quantity,
		       estimated_value, purchase_date, condition, brand, model,
		       serial_number, description, notes, photo_url, photo_filename,
		       photo_mime_type, photo_size_bytes, tags, created_at, updated_at
		FROM items
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		http.Error(w, "failed to fetch items", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Item{}

	for rows.Next() {
		var item models.Item

		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.Name,
			&item.Category,
			&item.RoomLocation,
			&item.Quantity,
			&item.EstimatedValue,
			&item.PurchaseDate,
			&item.Condition,
			&item.Brand,
			&item.Model,
			&item.SerialNumber,
			&item.Description,
			&item.Notes,
			&item.PhotoURL,
			&item.PhotoFilename,
			&item.PhotoMimeType,
			&item.PhotoSizeBytes,
			&item.Tags,
			&item.CreatedAt,
			&item.UpdatedAt,
		)

		if err != nil {
			http.Error(w, "failed to scan item", http.StatusInternalServerError)
			return
		}

		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *ItemHandler) GetRecentItems(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "userId is required", http.StatusBadRequest)
		return
	}

	limit := 5
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT id, user_id, name, category, room_location, quantity,
		       estimated_value, purchase_date, condition, brand, model,
		       serial_number, description, notes, photo_url, photo_filename,
		       photo_mime_type, photo_size_bytes, tags, created_at, updated_at
		FROM items
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, userID, limit)

	if err != nil {
		http.Error(w, "failed to fetch recent items", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Item{}

	for rows.Next() {
		var item models.Item

		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.Name,
			&item.Category,
			&item.RoomLocation,
			&item.Quantity,
			&item.EstimatedValue,
			&item.PurchaseDate,
			&item.Condition,
			&item.Brand,
			&item.Model,
			&item.SerialNumber,
			&item.Description,
			&item.Notes,
			&item.PhotoURL,
			&item.PhotoFilename,
			&item.PhotoMimeType,
			&item.PhotoSizeBytes,
			&item.Tags,
			&item.CreatedAt,
			&item.UpdatedAt,
		)

		if err != nil {
			http.Error(w, "failed to scan item", http.StatusInternalServerError)
			return
		}

		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *ItemHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	var req models.CreateItemRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID == "" || req.Name == "" || req.Category == "" || req.RoomLocation == "" {
		http.Error(w, "userId, name, category, and roomLocation are required", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	if req.Tags == nil {
		req.Tags = []string{}
	}

	var item models.Item

	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO items (
			user_id, name, category, room_location, quantity,
			estimated_value, purchase_date, condition, brand, model,
			serial_number, description, notes, photo_url, photo_filename,
			photo_mime_type, photo_size_bytes, tags
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9,
			$10, $11, $12, $13, $14, $15, $16, $17, $18
		)
		RETURNING id, user_id, name, category, room_location, quantity,
		          estimated_value, purchase_date, condition, brand, model,
		          serial_number, description, notes, photo_url, photo_filename,
		          photo_mime_type, photo_size_bytes, tags, created_at, updated_at
	`,
		req.UserID,
		req.Name,
		req.Category,
		req.RoomLocation,
		req.Quantity,
		req.EstimatedValue,
		req.PurchaseDate,
		req.Condition,
		req.Brand,
		req.Model,
		req.SerialNumber,
		req.Description,
		req.Notes,
		req.PhotoURL,
		req.PhotoFilename,
		req.PhotoMimeType,
		req.PhotoSizeBytes,
		req.Tags,
	).Scan(
		&item.ID,
		&item.UserID,
		&item.Name,
		&item.Category,
		&item.RoomLocation,
		&item.Quantity,
		&item.EstimatedValue,
		&item.PurchaseDate,
		&item.Condition,
		&item.Brand,
		&item.Model,
		&item.SerialNumber,
		&item.Description,
		&item.Notes,
		&item.PhotoURL,
		&item.PhotoFilename,
		&item.PhotoMimeType,
		&item.PhotoSizeBytes,
		&item.Tags,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "failed to create item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}
