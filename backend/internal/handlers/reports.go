package handlers

import (
	"net/http"
	"time"
)

func (h *AnalyticsHandler) GetReports(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", 401)
		return
	}
	report, err := h.analytics.Reports(r.Context(), user.ID, time.Now())
	if err != nil {
		http.Error(w, "Failed to fetch report totals", 500)
		return
	}
	writeJSON(w, 200, report)
}
