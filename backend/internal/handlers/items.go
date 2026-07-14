package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ItemHandler struct {
	DB *pgxpool.Pool
}

type itemOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type itemOptionsResponse struct {
	Categories []itemOption `json:"categories"`
	Rooms      []itemOption `json:"rooms"`
}

func NewItemHandler(db *pgxpool.Pool) *ItemHandler {
	return &ItemHandler{DB: db}
}

func (h *ItemHandler) GetItemOptions(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	response := itemOptionsResponse{Categories: []itemOption{}, Rooms: []itemOption{}}
	rows, err := h.DB.Query(r.Context(), `
		SELECT 'category', id, name FROM categories WHERE user_id = $1
		UNION ALL
		SELECT 'room', id, name FROM rooms WHERE user_id = $1
		ORDER BY 1, 3
	`, user.ID)
	if err != nil {
		http.Error(w, "Failed to fetch item options", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var kind string
		var option itemOption
		if err := rows.Scan(&kind, &option.ID, &option.Name); err != nil {
			http.Error(w, "Failed to scan item option", http.StatusInternalServerError)
			return
		}
		if kind == "category" {
			response.Categories = append(response.Categories, option)
		} else {
			response.Rooms = append(response.Rooms, option)
		}
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to fetch item options", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *ItemHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	limit := 24
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		if parsed, parseErr := strconv.Atoi(rawLimit); parseErr == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	offset := 0
	if cursor := r.URL.Query().Get("cursor"); cursor != "" {
		parsed, parseErr := strconv.Atoi(cursor)
		if parseErr != nil || parsed < 0 {
			http.Error(w, "Invalid items cursor", http.StatusBadRequest)
			return
		}
		offset = parsed
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT i.id, i.name, COALESCE(i.category_id::text, ''), COALESCE(c.name, ''),
		       COALESCE(i.room_id::text, ''), COALESCE(r.name, ''), i.quantity,
		       i.estimated_value, i.purchase_date, COALESCE(i.condition, ''),
		       COALESCE(i.brand, ''), COALESCE(i.model, ''),
		       COALESCE(i.serial_number, ''), COALESCE(i.description, ''),
		       COALESCE(i.notes, ''), COALESCE(i.photo_url, ''),
		       COALESCE(i.photo_filename, ''), COALESCE(i.photo_mime_type, ''),
		       i.photo_size_bytes, COALESCE(i.tags, '{}'), i.created_at, i.updated_at
		FROM items i
		LEFT JOIN categories c ON c.id = i.category_id
		LEFT JOIN rooms r ON r.id = i.room_id
		WHERE i.user_id = $1
		ORDER BY i.created_at DESC, i.id DESC
		LIMIT $2 OFFSET $3
	`, user.ID, limit, offset)

	if err != nil {
		http.Error(w, "Failed to fetch items", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Item{}

	for rows.Next() {
		var item models.Item

		err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.CategoryID,
			&item.Category,
			&item.RoomID,
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
			http.Error(w, "Failed to scan item", http.StatusInternalServerError)
			return
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to fetch items", http.StatusInternalServerError)
		return
	}

	var nextCursor *string
	if len(items) == limit {
		next := strconv.Itoa(offset + len(items))
		nextCursor = &next
	}
	writeJSON(w, http.StatusOK, struct {
		Data       []models.Item `json:"data"`
		NextCursor *string       `json:"nextCursor"`
	}{Data: items, NextCursor: nextCursor})
}

func (h *ItemHandler) GetRecentItems(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	limit := 6
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT i.id, i.name, COALESCE(i.category_id::text, ''), COALESCE(c.name, ''),
		       COALESCE(i.room_id::text, ''), COALESCE(r.name, ''), i.quantity,
		       i.estimated_value, i.purchase_date, COALESCE(i.condition, ''),
		       COALESCE(i.brand, ''), COALESCE(i.model, ''),
		       COALESCE(i.serial_number, ''), COALESCE(i.description, ''),
		       COALESCE(i.notes, ''), COALESCE(i.photo_url, ''),
		       COALESCE(i.photo_filename, ''), COALESCE(i.photo_mime_type, ''),
		       i.photo_size_bytes, COALESCE(i.tags, '{}'), i.created_at, i.updated_at
		FROM items i
		LEFT JOIN categories c ON c.id = i.category_id
		LEFT JOIN rooms r ON r.id = i.room_id
		WHERE i.user_id = $1
		ORDER BY i.created_at DESC
		LIMIT $2
	`, user.ID, limit)

	if err != nil {
		http.Error(w, "Failed to fetch recent items", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Item{}

	for rows.Next() {
		var item models.Item

		err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.CategoryID,
			&item.Category,
			&item.RoomID,
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
			http.Error(w, "Failed to scan item", http.StatusInternalServerError)
			return
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to fetch recent items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *ItemHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreateItemRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	if req.Tags == nil {
		req.Tags = []string{}
	}

	var item models.Item

	err = h.DB.QueryRow(r.Context(), `
		WITH inserted AS (
			INSERT INTO items (
			user_id, name, category_id, room_id, quantity,
			estimated_value, purchase_date, condition, brand, model,
			serial_number, description, notes, photo_url, photo_filename,
			photo_mime_type, photo_size_bytes, tags
			)
			SELECT
			$1, $2, c.id, r.id, $5, $6, $7, $8, $9,
			$10, $11, $12, $13, $14, $15, $16, $17, $18
			FROM (SELECT 1) AS input
			LEFT JOIN categories c ON c.id::text = $3 AND c.user_id = $1
			LEFT JOIN rooms r ON r.id::text = $4 AND r.user_id = $1
			WHERE ($3 = '' OR c.id IS NOT NULL)
			  AND ($4 = '' OR r.id IS NOT NULL)
			RETURNING *
		)
		SELECT i.id, i.name, COALESCE(i.category_id::text, ''), COALESCE(c.name, ''),
		       COALESCE(i.room_id::text, ''), COALESCE(r.name, ''), i.quantity,
		       i.estimated_value, i.purchase_date, i.condition, i.brand, i.model,
		       i.serial_number, i.description, i.notes, i.photo_url, i.photo_filename,
		       i.photo_mime_type, i.photo_size_bytes, i.tags, i.created_at, i.updated_at
		FROM inserted i
		LEFT JOIN categories c ON c.id = i.category_id
		LEFT JOIN rooms r ON r.id = i.room_id
	`,
		user.ID,
		req.Name,
		req.CategoryID,
		req.RoomID,
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
		&item.Name,
		&item.CategoryID,
		&item.Category,
		&item.RoomID,
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
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "categoryId or roomId is invalid", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to create item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func (h *ItemHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	itemID := chi.URLParam(r, "itemId")
	if itemID == "" {
		http.Error(w, "itemId is required", http.StatusBadRequest)
		return
	}

	result, err := h.DB.Exec(r.Context(), `
		DELETE FROM items
		WHERE id = $1 AND user_id = $2
	`, itemID, user.ID)
	if err != nil {
		http.Error(w, "Failed to delete item", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
