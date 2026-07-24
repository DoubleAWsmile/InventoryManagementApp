package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func writeSettings(w http.ResponseWriter, settings models.UserSettings) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	settings, err := h.settings.Get(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "Failed to load settings", http.StatusInternalServerError)
		return
	}

	writeSettings(w, settings)
}

func (h *SettingsHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var request models.UserSettings
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Invalid settings payload", http.StatusBadRequest)
		return
	}
	if len(request.UIPreferences) == 0 {
		request.UIPreferences = json.RawMessage(`{}`)
	}
	var ui map[string]any
	if err := json.Unmarshal(request.UIPreferences, &ui); err != nil || ui == nil {
		http.Error(w, "uiPreferences must be a JSON object", http.StatusBadRequest)
		return
	}

	settings, err := h.settings.Update(r.Context(), user.ID, request)
	if err != nil {
		http.Error(w, "Failed to save settings", http.StatusBadRequest)
		return
	}

	writeSettings(w, settings)
}

func (h *SettingsHandler) ResetSettings(w http.ResponseWriter, r *http.Request) {
	user, err := getCurrentUserFromRequest(h.sessions, r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	settings, err := h.settings.Reset(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "Failed to reset settings", http.StatusInternalServerError)
		return
	}

	writeSettings(w, settings)
}
