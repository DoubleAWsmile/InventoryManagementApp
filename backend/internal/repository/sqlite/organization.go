package sqlite

import (
	"context"
	"time"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func (s *Store) Categories(ctx context.Context, userID string) ([]models.CategorySummary, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT c.id,c.name,COUNT(i.id),COALESCE(SUM(i.estimated_value*i.quantity),0),COALESCE((SELECT r.name FROM items ri JOIN rooms r ON r.id=ri.room_id WHERE ri.user_id=c.user_id AND ri.category_id=c.id GROUP BY r.id,r.name ORDER BY COUNT(*) DESC,r.name LIMIT 1),'') FROM categories c LEFT JOIN items i ON i.category_id=c.id AND i.user_id=c.user_id WHERE c.user_id=? GROUP BY c.id,c.name ORDER BY c.name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.CategorySummary{}
	for rows.Next() {
		var v models.CategorySummary
		if err = rows.Scan(&v.ID, &v.Name, &v.ItemCount, &v.EstimatedValue, &v.TopRoom); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
func (s *Store) CreateCategory(ctx context.Context, userID, name string) (models.CategorySummary, error) {
	id, err := appdb.NewUUID()
	if err != nil {
		return models.CategorySummary{}, err
	}
	now := nowText(time.Now())
	_, err = s.db.ExecContext(ctx, `INSERT INTO categories(id,user_id,name,created_at,updated_at) VALUES(?,?,?,?,?)`, id, userID, name, now, now)
	return models.CategorySummary{ID: id, Name: name}, translateError(err)
}
func (s *Store) CreateCategories(ctx context.Context, userID string, names []string) ([]models.CategorySummary, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	out := []models.CategorySummary{}
	now := nowText(time.Now())
	for _, name := range names {
		id, e := appdb.NewUUID()
		if e != nil {
			return nil, e
		}
		result, e := tx.ExecContext(ctx, `INSERT OR IGNORE INTO categories(id,user_id,name,created_at,updated_at) VALUES(?,?,?,?,?)`, id, userID, name, now, now)
		if e != nil {
			return nil, e
		}
		count, _ := result.RowsAffected()
		if count > 0 {
			out = append(out, models.CategorySummary{ID: id, Name: name})
		}
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return out, nil
}
func (s *Store) DeleteCategory(ctx context.Context, userID, id string) (bool, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM categories WHERE id=? AND user_id=?`, id, userID)
	if err != nil {
		return false, err
	}
	count, err := result.RowsAffected()
	return count > 0, err
}
func (s *Store) Rooms(ctx context.Context, userID string) ([]models.RoomSummary, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT r.id,r.name,COALESCE(r.description,''),COUNT(i.id),COALESCE(SUM(i.estimated_value*i.quantity),0),COALESCE((SELECT ri.name FROM items ri WHERE ri.room_id=r.id AND ri.user_id=r.user_id ORDER BY ri.created_at DESC LIMIT 1),''),COALESCE(MAX(CASE WHEN i.id IS NOT NULL AND (i.category_id IS NULL OR NULLIF(i.condition,'') IS NULL) THEN 1 ELSE 0 END),0) FROM rooms r LEFT JOIN items i ON i.room_id=r.id AND i.user_id=r.user_id WHERE r.user_id=? GROUP BY r.id,r.name,r.description ORDER BY r.name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.RoomSummary{}
	for rows.Next() {
		var v models.RoomSummary
		if err = rows.Scan(&v.ID, &v.Name, &v.Description, &v.ItemCount, &v.EstimatedValue, &v.RecentItem, &v.MissingInfo); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
func (s *Store) CreateRoom(ctx context.Context, userID, name, description string) (models.RoomSummary, error) {
	id, err := appdb.NewUUID()
	if err != nil {
		return models.RoomSummary{}, err
	}
	now := nowText(time.Now())
	_, err = s.db.ExecContext(ctx, `INSERT INTO rooms(id,user_id,name,description,created_at,updated_at) VALUES(?,?,?,?,?,?)`, id, userID, name, nullable(description), now, now)
	return models.RoomSummary{ID: id, Name: name, Description: description}, translateError(err)
}
func (s *Store) DeleteRoom(ctx context.Context, userID, id string) (bool, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM rooms WHERE id=? AND user_id=?`, id, userID)
	if err != nil {
		return false, err
	}
	count, err := result.RowsAffected()
	return count > 0, err
}
