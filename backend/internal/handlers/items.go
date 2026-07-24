package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"github.com/go-chi/chi/v5"
)

func (h *ItemHandler) GetItemOptions(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	options, err := h.items.Options(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "Failed to fetch item options", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, options)
}

func (h *ItemHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	limit := 24
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, parseErr := strconv.Atoi(raw); parseErr == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	var cursor *string
	if raw := r.URL.Query().Get("cursor"); raw != "" {
		cursor = &raw
	}
	page, err := h.items.List(r.Context(), repository.ListItemsParams{UserID: user.ID, Limit: limit, Cursor: cursor})
	if errors.Is(err, repository.ErrInvalidCursor) {
		http.Error(w, "Invalid items cursor", http.StatusBadRequest)
		return
	}
	if err != nil {
		http.Error(w, "Failed to fetch items", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, struct {
		Data       []models.Item `json:"data"`
		NextCursor *string       `json:"nextCursor"`
	}{page.Items, page.NextCursor})
}

func (h *ItemHandler) GetRecentItems(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	limit := 6
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, e := strconv.Atoi(raw); e == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}
	items, err := h.items.ListRecent(r.Context(), user.ID, limit)
	if err != nil {
		http.Error(w, "Failed to fetch recent items", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func itemValues(request models.CreateItemRequest) repository.ItemValues {
	return repository.ItemValues{Name: request.Name, CategoryID: request.CategoryID, RoomID: request.RoomID,
		Quantity: request.Quantity, EstimatedValue: request.EstimatedValue, PurchaseDate: request.PurchaseDate,
		Condition: request.Condition, Brand: request.Brand, Model: request.Model, SerialNumber: request.SerialNumber,
		Description: request.Description, Notes: request.Notes, PhotoURL: request.PhotoURL,
		PhotoFilename: request.PhotoFilename, PhotoMimeType: request.PhotoMimeType,
		PhotoSizeBytes: request.PhotoSizeBytes, Tags: request.Tags}
}

func decodeItemRequest(w http.ResponseWriter, r *http.Request) (models.CreateItemRequest, bool) {
	var request models.CreateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return request, false
	}
	request.Name = strings.TrimSpace(request.Name)
	if request.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return request, false
	}
	if request.Quantity <= 0 {
		request.Quantity = 1
	}
	if request.Tags == nil {
		request.Tags = []string{}
	}
	return request, true
}

func (h *ItemHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	request, ok := decodeItemRequest(w, r)
	if !ok {
		return
	}
	item, err := h.items.Create(r.Context(), repository.CreateItemParams{UserID: user.ID, Item: itemValues(request)})
	if errors.Is(err, repository.ErrInvalidReference) {
		http.Error(w, "categoryId or roomId is invalid", http.StatusBadRequest)
		return
	}
	if err != nil {
		http.Error(w, "Failed to create item", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *ItemHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	request, ok := decodeItemRequest(w, r)
	if !ok {
		return
	}
	item, err := h.items.Update(r.Context(), repository.UpdateItemParams{UserID: user.ID, ItemID: chi.URLParam(r, "itemId"), Item: itemValues(request)})
	if errors.Is(err, repository.ErrNotFound) || errors.Is(err, repository.ErrInvalidReference) {
		http.Error(w, "Item not found or categoryId/roomId is invalid", http.StatusBadRequest)
		return
	}
	if err != nil {
		http.Error(w, "Failed to update item", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	itemID := chi.URLParam(r, "itemId")
	if itemID == "" {
		http.Error(w, "itemId is required", http.StatusBadRequest)
		return
	}
	deleted, err := h.items.Delete(r.Context(), user.ID, itemID)
	if err != nil {
		http.Error(w, "Failed to delete item", http.StatusInternalServerError)
		return
	}
	if !deleted {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
