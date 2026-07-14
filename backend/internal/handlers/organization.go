package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var recommendedCategoryNames = map[string]struct{}{
	"Electronics": {}, "Tools": {}, "Clothing": {}, "Documents": {},
	"Cables": {}, "Safety": {}, "Household Supplies": {}, "Furniture": {},
}

func (h *ItemHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT c.id, c.name, COUNT(i.id)::int,
		       COALESCE(SUM(i.estimated_value * i.quantity), 0)::float8,
		       COALESCE((
		         SELECT r.name
		         FROM items ri JOIN rooms r ON r.id = ri.room_id
		         WHERE ri.user_id = c.user_id AND ri.category_id = c.id
		         GROUP BY r.id, r.name
		         ORDER BY COUNT(*) DESC, r.name
		         LIMIT 1
		       ), '')
		FROM categories c
		LEFT JOIN items i ON i.category_id = c.id AND i.user_id = c.user_id
		WHERE c.user_id = $1
		GROUP BY c.id, c.name
		ORDER BY c.name
	`, user.ID)
	if err != nil {
		http.Error(w, "failed to fetch categories", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	categories := []models.CategorySummary{}
	for rows.Next() {
		var category models.CategorySummary
		if err := rows.Scan(&category.ID, &category.Name, &category.ItemCount, &category.EstimatedValue, &category.TopRoom); err != nil {
			http.Error(w, "failed to scan category", http.StatusInternalServerError)
			return
		}
		categories = append(categories, category)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to fetch categories", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, categories)
}

func (h *ItemHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
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

	category := models.CategorySummary{Name: request.Name}
	err = h.DB.QueryRow(r.Context(), `INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id`, user.ID, request.Name).Scan(&category.ID)
	if handleOrganizationWriteError(w, err, "category") {
		return
	}
	writeJSON(w, http.StatusCreated, category)
}

func (h *ItemHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	result, err := h.DB.Exec(r.Context(), `DELETE FROM categories WHERE id = $1 AND user_id = $2`, chi.URLParam(r, "categoryId"), user.ID)
	if err != nil {
		http.Error(w, "Failed to delete category", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected() == 0 {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ItemHandler) CreateRecommendedCategories(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
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
		if _, recommended := recommendedCategoryNames[name]; !recommended {
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

	rows, err := h.DB.Query(r.Context(), `
		INSERT INTO categories (user_id, name)
		SELECT $1, name FROM unnest($2::text[]) AS name
		ON CONFLICT DO NOTHING
		RETURNING id, name
	`, user.ID, names)
	if err != nil {
		http.Error(w, "failed to create recommended categories", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	created := []models.CategorySummary{}
	for rows.Next() {
		var category models.CategorySummary
		if err := rows.Scan(&category.ID, &category.Name); err != nil {
			http.Error(w, "failed to scan created category", http.StatusInternalServerError)
			return
		}
		created = append(created, category)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to create recommended categories", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h *ItemHandler) GetRooms(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	rows, err := h.DB.Query(r.Context(), `
		SELECT r.id, r.name, COALESCE(r.description, ''), COUNT(i.id)::int,
		       COALESCE(SUM(i.estimated_value * i.quantity), 0)::float8,
		       COALESCE((SELECT ri.name FROM items ri WHERE ri.room_id = r.id AND ri.user_id = r.user_id ORDER BY ri.created_at DESC LIMIT 1), ''),
		       COALESCE(BOOL_OR(i.id IS NOT NULL AND (i.category_id IS NULL OR NULLIF(i.condition, '') IS NULL)), false)
		FROM rooms r
		LEFT JOIN items i ON i.room_id = r.id AND i.user_id = r.user_id
		WHERE r.user_id = $1
		GROUP BY r.id, r.name, r.description
		ORDER BY r.name
	`, user.ID)
	if err != nil {
		http.Error(w, "failed to fetch rooms", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	rooms := []models.RoomSummary{}
	for rows.Next() {
		var room models.RoomSummary
		if err := rows.Scan(&room.ID, &room.Name, &room.Description, &room.ItemCount, &room.EstimatedValue, &room.RecentItem, &room.MissingInfo); err != nil {
			http.Error(w, "failed to scan room", http.StatusInternalServerError)
			return
		}
		rooms = append(rooms, room)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to fetch rooms", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, rooms)
}

func (h *ItemHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
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
	room := models.RoomSummary{Name: request.Name, Description: request.Description}
	err = h.DB.QueryRow(r.Context(), `INSERT INTO rooms (user_id, name, description) VALUES ($1, $2, NULLIF($3, '')) RETURNING id`, user.ID, request.Name, request.Description).Scan(&room.ID)
	if handleOrganizationWriteError(w, err, "room") {
		return
	}
	writeJSON(w, http.StatusCreated, room)
}

func (h *ItemHandler) DeleteRoom(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	result, err := h.DB.Exec(r.Context(), `DELETE FROM rooms WHERE id = $1 AND user_id = $2`, chi.URLParam(r, "roomId"), user.ID)
	if err != nil {
		http.Error(w, "Failed to delete room", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected() == 0 {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func handleOrganizationWriteError(w http.ResponseWriter, err error, resource string) bool {
	if err == nil {
		return false
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
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
