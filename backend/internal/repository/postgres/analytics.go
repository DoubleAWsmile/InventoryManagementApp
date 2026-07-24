package postgres

import (
	"context"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"time"
)

func (s *Store) Dashboard(ctx context.Context, id string, at time.Time) (models.DashboardSummary, error) {
	out := models.DashboardSummary{Rooms: []models.DashboardDistribution{}, Categories: []models.DashboardDistribution{}, RecentActivity: []models.DashboardActivity{}}
	start := time.Date(at.UTC().Year(), at.UTC().Month(), 1, 0, 0, 0, 0, time.UTC)
	err := s.pool.QueryRow(ctx, `SELECT COUNT(*)::int,COALESCE(SUM(estimated_value*quantity),0)::float8,(SELECT COUNT(*)::int FROM rooms WHERE user_id=$1),COUNT(*) FILTER(WHERE category_id IS NULL OR room_id IS NULL OR NULLIF(condition,'') IS NULL)::int,COUNT(*) FILTER(WHERE created_at>=$2)::int,COALESCE(SUM(estimated_value*quantity) FILTER(WHERE created_at>=$2),0)::float8 FROM items WHERE user_id=$1`, id, start).Scan(&out.TotalItems, &out.EstimatedValue, &out.RoomsTracked, &out.MissingInfo, &out.AddedThisMonth, &out.ValueAddedThisMonth)
	if err != nil {
		return out, err
	}
	rows, err := s.pool.Query(ctx, `SELECT 'room',r.id,r.name,COUNT(i.id)::int FROM rooms r LEFT JOIN items i ON i.room_id=r.id AND i.user_id=r.user_id WHERE r.user_id=$1 GROUP BY r.id,r.name UNION ALL SELECT 'category',c.id,c.name,COUNT(i.id)::int FROM categories c LEFT JOIN items i ON i.category_id=c.id AND i.user_id=c.user_id WHERE c.user_id=$1 GROUP BY c.id,c.name ORDER BY 1,4 DESC,3`, id)
	if err != nil {
		return out, err
	}
	for rows.Next() {
		var kind string
		var v models.DashboardDistribution
		if err = rows.Scan(&kind, &v.ID, &v.Name, &v.Count); err != nil {
			rows.Close()
			return out, err
		}
		if kind == "room" {
			out.Rooms = append(out.Rooms, v)
		} else {
			out.Categories = append(out.Categories, v)
		}
	}
	rows.Close()
	activity, err := s.pool.Query(ctx, `SELECT i.id,i.name,COALESCE(r.name,''),1,i.created_at FROM items i LEFT JOIN rooms r ON r.id=i.room_id WHERE i.user_id=$1 ORDER BY i.created_at DESC LIMIT 4`, id)
	if err != nil {
		return out, err
	}
	defer activity.Close()
	for activity.Next() {
		var v models.DashboardActivity
		if err = activity.Scan(&v.ItemID, &v.ItemName, &v.RoomName, &v.Type, &v.Created); err != nil {
			return out, err
		}
		out.RecentActivity = append(out.RecentActivity, v)
	}
	return out, activity.Err()
}
func (s *Store) Reports(ctx context.Context, id string, at time.Time) (models.ReportSummary, error) {
	out := models.ReportSummary{Rooms: []models.ReportBreakdown{}, Categories: []models.ReportBreakdown{}, MissingInfo: []models.MissingInfoItem{}, RecentActivity: []models.ReportActivity{}}
	start := time.Date(at.UTC().Year(), at.UTC().Month(), 1, 0, 0, 0, 0, time.UTC)
	err := s.pool.QueryRow(ctx, `SELECT COUNT(*)::int,COALESCE(SUM(quantity*estimated_value),0)::float8,COUNT(*) FILTER(WHERE created_at>=$2)::int,COUNT(*) FILTER(WHERE category_id IS NULL OR room_id IS NULL OR estimated_value IS NULL OR purchase_date IS NULL OR NULLIF(condition,'') IS NULL OR NULLIF(serial_number,'') IS NULL)::int FROM items WHERE user_id=$1`, id, start).Scan(&out.TotalItems, &out.EstimatedValue, &out.AddedThisMonth, &out.MissingInfoTotal)
	if err != nil {
		return out, err
	}
	rows, err := s.pool.Query(ctx, `SELECT 'room',r.id,r.name,COUNT(i.id)::int,COALESCE(SUM(i.quantity*i.estimated_value),0)::float8 FROM rooms r LEFT JOIN items i ON i.room_id=r.id AND i.user_id=r.user_id WHERE r.user_id=$1 GROUP BY r.id,r.name UNION ALL SELECT 'category',c.id,c.name,COUNT(i.id)::int,COALESCE(SUM(i.quantity*i.estimated_value),0)::float8 FROM categories c LEFT JOIN items i ON i.category_id=c.id AND i.user_id=c.user_id WHERE c.user_id=$1 GROUP BY c.id,c.name ORDER BY 1,4 DESC,3`, id)
	if err != nil {
		return out, err
	}
	for rows.Next() {
		var kind string
		var v models.ReportBreakdown
		if err = rows.Scan(&kind, &v.ID, &v.Name, &v.Count, &v.Value); err != nil {
			rows.Close()
			return out, err
		}
		if kind == "room" {
			out.Rooms = append(out.Rooms, v)
		} else {
			out.Categories = append(out.Categories, v)
		}
	}
	rows.Close()
	missing, err := s.pool.Query(ctx, `SELECT i.id,i.name,COALESCE(r.name,''),ARRAY_REMOVE(ARRAY[CASE WHEN i.category_id IS NULL THEN 'category' END,CASE WHEN i.room_id IS NULL THEN 'room' END,CASE WHEN i.estimated_value IS NULL THEN 'estimated value' END,CASE WHEN i.purchase_date IS NULL THEN 'purchase date' END,CASE WHEN NULLIF(i.condition,'') IS NULL THEN 'condition' END,CASE WHEN NULLIF(i.serial_number,'') IS NULL THEN 'serial number' END],NULL) FROM items i LEFT JOIN rooms r ON r.id=i.room_id WHERE i.user_id=$1 AND(i.category_id IS NULL OR i.room_id IS NULL OR i.estimated_value IS NULL OR i.purchase_date IS NULL OR NULLIF(i.condition,'') IS NULL OR NULLIF(i.serial_number,'') IS NULL) ORDER BY i.updated_at DESC LIMIT 25`, id)
	if err != nil {
		return out, err
	}
	for missing.Next() {
		var v models.MissingInfoItem
		if err = missing.Scan(&v.ID, &v.Name, &v.Room, &v.Missing); err != nil {
			missing.Close()
			return out, err
		}
		out.MissingInfo = append(out.MissingInfo, v)
	}
	missing.Close()
	activity, err := s.pool.Query(ctx, `SELECT i.id,i.name,COALESCE(r.name,''),1,i.created_at FROM items i LEFT JOIN rooms r ON r.id=i.room_id WHERE i.user_id=$1 ORDER BY i.created_at DESC LIMIT 8`, id)
	if err != nil {
		return out, err
	}
	defer activity.Close()
	for activity.Next() {
		var v models.ReportActivity
		if err = activity.Scan(&v.ItemID, &v.ItemName, &v.RoomName, &v.Type, &v.CreatedAt); err != nil {
			return out, err
		}
		out.RecentActivity = append(out.RecentActivity, v)
	}
	return out, activity.Err()
}
