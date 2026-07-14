package handlers

import (
	"net/http"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func (h *ItemHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.DB, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	summary := models.DashboardSummary{
		Rooms: []models.DashboardDistribution{}, Categories: []models.DashboardDistribution{},
		RecentActivity: []models.DashboardActivity{},
	}
	err = h.DB.QueryRow(r.Context(), `
		SELECT COUNT(*)::int,
		       COALESCE(SUM(estimated_value * quantity), 0)::float8,
		       (SELECT COUNT(*)::int FROM rooms WHERE user_id = $1),
		       COUNT(*) FILTER (WHERE category_id IS NULL OR room_id IS NULL OR NULLIF(condition, '') IS NULL)::int,
		       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP))::int,
		       COALESCE(SUM(estimated_value * quantity) FILTER (WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)), 0)::float8
		FROM items WHERE user_id = $1
	`, user.ID).Scan(&summary.TotalItems, &summary.EstimatedValue, &summary.RoomsTracked,
		&summary.MissingInfo, &summary.AddedThisMonth, &summary.ValueAddedThisMonth)
	if err != nil {
		http.Error(w, "failed to fetch dashboard totals", http.StatusInternalServerError)
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT 'room', r.id, r.name, COUNT(i.id)::int
		FROM rooms r LEFT JOIN items i ON i.room_id = r.id AND i.user_id = r.user_id
		WHERE r.user_id = $1 GROUP BY r.id, r.name
		UNION ALL
		SELECT 'category', c.id, c.name, COUNT(i.id)::int
		FROM categories c LEFT JOIN items i ON i.category_id = c.id AND i.user_id = c.user_id
		WHERE c.user_id = $1 GROUP BY c.id, c.name
		ORDER BY 1, 4 DESC, 3
	`, user.ID)
	if err != nil {
		http.Error(w, "failed to fetch dashboard breakdown", http.StatusInternalServerError)
		return
	}
	for rows.Next() {
		var kind string
		var entry models.DashboardDistribution
		if err := rows.Scan(&kind, &entry.ID, &entry.Name, &entry.Count); err != nil {
			rows.Close()
			http.Error(w, "failed to scan dashboard breakdown", http.StatusInternalServerError)
			return
		}
		if kind == "room" {
			summary.Rooms = append(summary.Rooms, entry)
		} else {
			summary.Categories = append(summary.Categories, entry)
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, "failed to fetch dashboard breakdown", http.StatusInternalServerError)
		return
	}
	rows.Close()

	activityRows, err := h.DB.Query(r.Context(), `
		SELECT i.id, i.name, COALESCE(r.name, ''), 1, i.created_at
		FROM items i LEFT JOIN rooms r ON r.id = i.room_id
		WHERE i.user_id = $1
		ORDER BY i.created_at DESC LIMIT 4
	`, user.ID)
	if err != nil {
		http.Error(w, "failed to fetch recent activity", http.StatusInternalServerError)
		return
	}
	defer activityRows.Close()
	for activityRows.Next() {
		var activity models.DashboardActivity
		if err := activityRows.Scan(&activity.ItemID, &activity.ItemName, &activity.RoomName, &activity.Type, &activity.Created); err != nil {
			http.Error(w, "failed to scan recent activity", http.StatusInternalServerError)
			return
		}
		summary.RecentActivity = append(summary.RecentActivity, activity)
	}
	if err := activityRows.Err(); err != nil {
		http.Error(w, "failed to fetch recent activity", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, summary)
}
