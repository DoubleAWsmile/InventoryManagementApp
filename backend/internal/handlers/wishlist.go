package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"github.com/go-chi/chi/v5"
)

var wishlistPriorities = map[string]bool{"low": true, "medium": true, "high": true}
var wishlistStatuses = map[string]bool{"wanted": true, "considering": true, "purchased": true, "cancelled": true}

func normalizeWishlistRequest(req *models.WishlistRequest) string {
	req.ItemName = strings.TrimSpace(req.ItemName)
	req.CategoryID = strings.TrimSpace(req.CategoryID)
	req.Brand, req.Model, req.Notes = strings.TrimSpace(req.Brand), strings.TrimSpace(req.Model), strings.TrimSpace(req.Notes)
	req.ItemURL = strings.TrimSpace(req.ItemURL)
	req.Priority, req.Status = strings.ToLower(req.Priority), strings.ToLower(req.Status)
	if req.Priority == "" {
		req.Priority = "medium"
	}
	if req.Status == "" {
		req.Status = "wanted"
	}
	if req.ItemName == "" {
		return "itemName is required"
	}
	if req.EstimatedCost != nil && *req.EstimatedCost < 0 {
		return "estimatedCost cannot be negative"
	}
	if req.ItemURL != "" {
		parsed, err := url.ParseRequestURI(req.ItemURL)
		if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
			return "itemUrl must be a valid HTTP or HTTPS URL"
		}
	}
	if !wishlistPriorities[req.Priority] {
		return "priority must be low, medium, or high"
	}
	if !wishlistStatuses[req.Status] {
		return "status must be wanted, considering, purchased, or cancelled"
	}
	return ""
}

func wishlistValues(request models.WishlistRequest) repository.WishlistValues {
	return repository.WishlistValues{CategoryID: request.CategoryID, ItemName: request.ItemName, Brand: request.Brand,
		Model: request.Model, EstimatedCost: request.EstimatedCost, ItemURL: request.ItemURL, Notes: request.Notes,
		Priority: request.Priority, Status: request.Status}
}

func (h *WishlistHandler) GetWishlist(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", 401)
		return
	}
	items, err := h.wishlist.List(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "Failed to fetch wishlist", 500)
		return
	}
	writeJSON(w, 200, items)
}

func (h *WishlistHandler) CreateWishlistItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", 401)
		return
	}
	var request models.WishlistRequest
	if json.NewDecoder(r.Body).Decode(&request) != nil {
		http.Error(w, "Invalid request body", 400)
		return
	}
	if message := normalizeWishlistRequest(&request); message != "" {
		http.Error(w, message, 400)
		return
	}
	item, err := h.wishlist.Create(r.Context(), repository.CreateWishlistItemParams{UserID: user.ID, Item: wishlistValues(request)})
	if errors.Is(err, repository.ErrInvalidReference) {
		http.Error(w, "categoryId is invalid", 400)
		return
	}
	if err != nil {
		http.Error(w, "Failed to create wishlist item", 500)
		return
	}
	writeJSON(w, 201, item)
}

func (h *WishlistHandler) UpdateWishlistItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", 401)
		return
	}
	var request models.WishlistRequest
	if json.NewDecoder(r.Body).Decode(&request) != nil {
		http.Error(w, "Invalid request body", 400)
		return
	}
	if message := normalizeWishlistRequest(&request); message != "" {
		http.Error(w, message, 400)
		return
	}
	item, err := h.wishlist.Update(r.Context(), repository.UpdateWishlistItemParams{UserID: user.ID, WishlistID: chi.URLParam(r, "wishlistId"), Item: wishlistValues(request)})
	if errors.Is(err, repository.ErrNotFound) || errors.Is(err, repository.ErrInvalidReference) {
		http.Error(w, "Wishlist item or category not found", 404)
		return
	}
	if err != nil {
		http.Error(w, "Failed to update wishlist item", 500)
		return
	}
	writeJSON(w, 200, item)
}

func (h *WishlistHandler) DeleteWishlistItem(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", 401)
		return
	}
	deleted, err := h.wishlist.Delete(r.Context(), user.ID, chi.URLParam(r, "wishlistId"))
	if err != nil {
		http.Error(w, "Failed to delete wishlist item", 500)
		return
	}
	if !deleted {
		http.Error(w, "Wishlist item not found", 404)
		return
	}
	w.WriteHeader(204)
}
