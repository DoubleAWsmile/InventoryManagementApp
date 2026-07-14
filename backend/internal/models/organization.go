package models

type CategorySummary struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	ItemCount      int     `json:"itemCount"`
	EstimatedValue float64 `json:"estimatedValue"`
	TopRoom        string  `json:"topRoom"`
}

type RoomSummary struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	ItemCount      int     `json:"itemCount"`
	EstimatedValue float64 `json:"estimatedValue"`
	RecentItem     string  `json:"recentItem"`
	MissingInfo    bool    `json:"missingInfo"`
}
