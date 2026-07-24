package models

import "encoding/json"

type UserSettings struct {
	NotifyLowStock        bool            `json:"notifyLowStock"`
	NotifyWarrantyExpiry  bool            `json:"notifyWarrantyExpiry"`
	NotifyMissingInfo     bool            `json:"notifyMissingInfo"`
	NotifyMonthlySummary  bool            `json:"notifyMonthlySummary"`
	NotifyNewFeatures     bool            `json:"notifyNewFeatures"`
	NotifySecurityAlerts  bool            `json:"notifySecurityAlerts"`
	DefaultInventoryView  string          `json:"defaultInventoryView"`
	DefaultInventorySort  string          `json:"defaultInventorySort"`
	CurrencyCode          string          `json:"currencyCode"`
	ShowInventoryValues   bool            `json:"showInventoryValues"`
	ShowLowStockBadges    bool            `json:"showLowStockBadges"`
	ShowMissingInfoBadges bool            `json:"showMissingInfoBadges"`
	UIPreferences         json.RawMessage `json:"uiPreferences"`
}
