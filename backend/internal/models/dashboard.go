package models

import "time"

type DashboardDistribution struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type DashboardActivity struct {
	ItemID   string    `json:"itemId"`
	ItemName string    `json:"itemName"`
	RoomName string    `json:"roomName"`
	Type     int       `json:"type"`
	Created  time.Time `json:"createdAt"`
}

type DashboardSummary struct {
	TotalItems          int                     `json:"totalItems"`
	EstimatedValue      float64                 `json:"estimatedValue"`
	RoomsTracked        int                     `json:"roomsTracked"`
	MissingInfo         int                     `json:"missingInfo"`
	AddedThisMonth      int                     `json:"addedThisMonth"`
	ValueAddedThisMonth float64                 `json:"valueAddedThisMonth"`
	Rooms               []DashboardDistribution `json:"rooms"`
	Categories          []DashboardDistribution `json:"categories"`
	RecentActivity      []DashboardActivity     `json:"recentActivity"`
}
