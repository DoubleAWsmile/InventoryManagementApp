package handlers

import (
	"net/http"
	"time"
)

func (h *AnalyticsHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	summary, err := h.analytics.Dashboard(r.Context(), user.ID, time.Now())
	if err != nil {
		http.Error(w, "failed to fetch dashboard totals", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, summary)
}
