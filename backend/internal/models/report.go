package models

import "time"

type ReportBreakdown struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Count int     `json:"count"`
	Value float64 `json:"value"`
}

type MissingInfoItem struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Room    string   `json:"room"`
	Missing []string `json:"missing"`
}

type ReportActivity struct {
	ItemID    string    `json:"itemId"`
	ItemName  string    `json:"itemName"`
	RoomName  string    `json:"roomName"`
	Type      int       `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
}

type ReportSummary struct {
	TotalItems       int               `json:"totalItems"`
	EstimatedValue   float64           `json:"estimatedValue"`
	AddedThisMonth   int               `json:"addedThisMonth"`
	MissingInfoTotal int               `json:"missingInfoTotal"`
	Rooms            []ReportBreakdown `json:"rooms"`
	Categories       []ReportBreakdown `json:"categories"`
	MissingInfo      []MissingInfoItem `json:"missingInfo"`
	RecentActivity   []ReportActivity  `json:"recentActivity"`
}
