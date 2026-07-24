package sqlite

import (
	"context"
	"encoding/json"
	"time"

	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func monthStart(at time.Time) string {
	value := at.UTC()
	return nowText(time.Date(value.Year(), value.Month(), 1, 0, 0, 0, 0, time.UTC))
}
func (s *Store) Dashboard(ctx context.Context, userID string, at time.Time) (models.DashboardSummary, error) {
	out := models.DashboardSummary{Rooms: []models.DashboardDistribution{}, Categories: []models.DashboardDistribution{}, RecentActivity: []models.DashboardActivity{}}
	start := monthStart(at)
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*),COALESCE(SUM(estimated_value*quantity),0),(SELECT COUNT(*) FROM rooms WHERE user_id=?),COALESCE(SUM(CASE WHEN category_id IS NULL OR room_id IS NULL OR NULLIF(condition,'') IS NULL THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN created_at>=? THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN created_at>=? THEN estimated_value*quantity ELSE 0 END),0) FROM items WHERE user_id=?`, userID, start, start, userID).Scan(&out.TotalItems, &out.EstimatedValue, &out.RoomsTracked, &out.MissingInfo, &out.AddedThisMonth, &out.ValueAddedThisMonth)
	if err != nil {
		return out, err
	}
	rows, err := s.db.QueryContext(ctx, `SELECT 'room',r.id,r.name,COUNT(i.id) FROM rooms r LEFT JOIN items i ON i.room_id=r.id AND i.user_id=r.user_id WHERE r.user_id=? GROUP BY r.id,r.name UNION ALL SELECT 'category',c.id,c.name,COUNT(i.id) FROM categories c LEFT JOIN items i ON i.category_id=c.id AND i.user_id=c.user_id WHERE c.user_id=? GROUP BY c.id,c.name ORDER BY 1,4 DESC,3`, userID, userID)
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
	if err = rows.Err(); err != nil {
		rows.Close()
		return out, err
	}
	rows.Close()
	activity, err := s.db.QueryContext(ctx, `SELECT i.id,i.name,COALESCE(r.name,''),1,i.created_at FROM items i LEFT JOIN rooms r ON r.id=i.room_id WHERE i.user_id=? ORDER BY i.created_at DESC LIMIT 4`, userID)
	if err != nil {
		return out, err
	}
	defer activity.Close()
	for activity.Next() {
		var v models.DashboardActivity
		var created string
		if err = activity.Scan(&v.ItemID, &v.ItemName, &v.RoomName, &v.Type, &created); err != nil {
			return out, err
		}
		v.Created, err = time.Parse(time.RFC3339Nano, created)
		if err != nil {
			return out, err
		}
		out.RecentActivity = append(out.RecentActivity, v)
	}
	return out, activity.Err()
}

func (s *Store) Reports(ctx context.Context, userID string, at time.Time) (models.ReportSummary, error) {
	out := models.ReportSummary{Rooms: []models.ReportBreakdown{}, Categories: []models.ReportBreakdown{}, MissingInfo: []models.MissingInfoItem{}, RecentActivity: []models.ReportActivity{}}
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*),COALESCE(SUM(quantity*estimated_value),0),COALESCE(SUM(CASE WHEN created_at>=? THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN category_id IS NULL OR room_id IS NULL OR estimated_value IS NULL OR purchase_date IS NULL OR NULLIF(condition,'') IS NULL OR NULLIF(serial_number,'') IS NULL THEN 1 ELSE 0 END),0) FROM items WHERE user_id=?`, monthStart(at), userID).Scan(&out.TotalItems, &out.EstimatedValue, &out.AddedThisMonth, &out.MissingInfoTotal)
	if err != nil {
		return out, err
	}
	rows, err := s.db.QueryContext(ctx, `SELECT 'room',r.id,r.name,COUNT(i.id),COALESCE(SUM(i.quantity*i.estimated_value),0) FROM rooms r LEFT JOIN items i ON i.room_id=r.id AND i.user_id=r.user_id WHERE r.user_id=? GROUP BY r.id,r.name UNION ALL SELECT 'category',c.id,c.name,COUNT(i.id),COALESCE(SUM(i.quantity*i.estimated_value),0) FROM categories c LEFT JOIN items i ON i.category_id=c.id AND i.user_id=c.user_id WHERE c.user_id=? GROUP BY c.id,c.name ORDER BY 1,4 DESC,3`, userID, userID)
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
	if err = rows.Err(); err != nil {
		rows.Close()
		return out, err
	}
	rows.Close()
	missing, err := s.db.QueryContext(ctx, `SELECT i.id,i.name,COALESCE(r.name,''),json_array(CASE WHEN i.category_id IS NULL THEN 'category' END,CASE WHEN i.room_id IS NULL THEN 'room' END,CASE WHEN i.estimated_value IS NULL THEN 'estimated value' END,CASE WHEN i.purchase_date IS NULL THEN 'purchase date' END,CASE WHEN NULLIF(i.condition,'') IS NULL THEN 'condition' END,CASE WHEN NULLIF(i.serial_number,'') IS NULL THEN 'serial number' END) FROM items i LEFT JOIN rooms r ON r.id=i.room_id WHERE i.user_id=? AND (i.category_id IS NULL OR i.room_id IS NULL OR i.estimated_value IS NULL OR i.purchase_date IS NULL OR NULLIF(i.condition,'') IS NULL OR NULLIF(i.serial_number,'') IS NULL) ORDER BY i.updated_at DESC LIMIT 25`, userID)
	if err != nil {
		return out, err
	}
	for missing.Next() {
		var v models.MissingInfoItem
		var raw string
		if err = missing.Scan(&v.ID, &v.Name, &v.Room, &raw); err != nil {
			missing.Close()
			return out, err
		}
		var values []*string
		if err = json.Unmarshal([]byte(raw), &values); err != nil {
			missing.Close()
			return out, err
		}
		for _, value := range values {
			if value != nil {
				v.Missing = append(v.Missing, *value)
			}
		}
		out.MissingInfo = append(out.MissingInfo, v)
	}
	if err = missing.Err(); err != nil {
		missing.Close()
		return out, err
	}
	missing.Close()
	activity, err := s.db.QueryContext(ctx, `SELECT i.id,i.name,COALESCE(r.name,''),1,i.created_at FROM items i LEFT JOIN rooms r ON r.id=i.room_id WHERE i.user_id=? ORDER BY i.created_at DESC LIMIT 8`, userID)
	if err != nil {
		return out, err
	}
	defer activity.Close()
	for activity.Next() {
		var v models.ReportActivity
		var created string
		if err = activity.Scan(&v.ItemID, &v.ItemName, &v.RoomName, &v.Type, &created); err != nil {
			return out, err
		}
		v.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
		if err != nil {
			return out, err
		}
		out.RecentActivity = append(out.RecentActivity, v)
	}
	return out, activity.Err()
}
