package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"github.com/go-chi/chi/v5"
)

var recommendedCategoryNames = map[string]struct{}{
	"Electronics": {}, "Tools": {}, "Clothing": {}, "Documents": {},
	"Cables": {}, "Safety": {}, "Household Supplies": {}, "Furniture": {},
}

func (h *OrganizationHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	categories, err := h.categories.List(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "failed to fetch categories", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, categories)
}

func (h *OrganizationHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var request struct {
		Name string `json:"name"`
	}
	if json.NewDecoder(r.Body).Decode(&request) != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	request.Name = strings.TrimSpace(request.Name)
	if request.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	category, err := h.categories.Create(r.Context(), user.ID, request.Name)
	if handleOrganizationWriteError(w, err, "category") {
		return
	}
	writeJSON(w, http.StatusCreated, category)
}

func (h *OrganizationHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	deleted, err := h.categories.Delete(r.Context(), user.ID, chi.URLParam(r, "categoryId"))
	if err != nil {
		http.Error(w, "Failed to delete category", http.StatusInternalServerError)
		return
	}
	if !deleted {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *OrganizationHandler) CreateRecommendedCategories(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var request struct {
		Names []string `json:"names"`
	}
	if json.NewDecoder(r.Body).Decode(&request) != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	names := make([]string, 0, len(request.Names))
	seen := make(map[string]struct{}, len(request.Names))
	for _, name := range request.Names {
		name = strings.TrimSpace(name)
		if _, supported := recommendedCategoryNames[name]; !supported {
			http.Error(w, "request contains an unsupported recommended category", http.StatusBadRequest)
			return
		}
		if _, duplicate := seen[name]; !duplicate {
			seen[name] = struct{}{}
			names = append(names, name)
		}
	}
	if len(names) == 0 {
		http.Error(w, "at least one recommended category is required", http.StatusBadRequest)
		return
	}
	created, err := h.categories.CreateMany(r.Context(), user.ID, names)
	if err != nil {
		http.Error(w, "failed to create recommended categories", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h *OrganizationHandler) GetRooms(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	rooms, err := h.rooms.List(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "failed to fetch rooms", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, rooms)
}

func (h *OrganizationHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var request struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if json.NewDecoder(r.Body).Decode(&request) != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	request.Name, request.Description = strings.TrimSpace(request.Name), strings.TrimSpace(request.Description)
	if request.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	room, err := h.rooms.Create(r.Context(), user.ID, request.Name, request.Description)
	if handleOrganizationWriteError(w, err, "room") {
		return
	}
	writeJSON(w, http.StatusCreated, room)
}

func (h *OrganizationHandler) DeleteRoom(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	deleted, err := h.rooms.Delete(r.Context(), user.ID, chi.URLParam(r, "roomId"))
	if err != nil {
		http.Error(w, "Failed to delete room", http.StatusInternalServerError)
		return
	}
	if !deleted {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func handleOrganizationWriteError(w http.ResponseWriter, err error, resource string) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, repository.ErrConflict) {
		http.Error(w, resource+" already exists", http.StatusConflict)
		return true
	}
	http.Error(w, "failed to create "+resource, http.StatusInternalServerError)
	return true
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(value)
}
