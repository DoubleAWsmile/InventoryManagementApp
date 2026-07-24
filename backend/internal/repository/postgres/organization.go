package postgres

import (
	"context"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
)

func (s *Store) Categories(ctx context.Context, id string) ([]models.CategorySummary, error) {
	rows, err := s.pool.Query(ctx, `SELECT c.id,c.name,COUNT(i.id)::int,COALESCE(SUM(i.estimated_value*i.quantity),0)::float8,COALESCE((SELECT r.name FROM items ri JOIN rooms r ON r.id=ri.room_id WHERE ri.user_id=c.user_id AND ri.category_id=c.id GROUP BY r.id,r.name ORDER BY COUNT(*) DESC,r.name LIMIT 1),'') FROM categories c LEFT JOIN items i ON i.category_id=c.id AND i.user_id=c.user_id WHERE c.user_id=$1 GROUP BY c.id,c.name ORDER BY c.name`, id)
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
	_, err = s.pool.Exec(ctx, `INSERT INTO categories(id,user_id,name) VALUES($1,$2,$3)`, id, userID, name)
	return models.CategorySummary{ID: id, Name: name}, translateError(err)
}
func (s *Store) CreateCategories(ctx context.Context, userID string, names []string) ([]models.CategorySummary, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	out := []models.CategorySummary{}
	for _, name := range names {
		id, e := appdb.NewUUID()
		if e != nil {
			return nil, e
		}
		tag, e := tx.Exec(ctx, `INSERT INTO categories(id,user_id,name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, id, userID, name)
		if e != nil {
			return nil, translateError(e)
		}
		if tag.RowsAffected() > 0 {
			out = append(out, models.CategorySummary{ID: id, Name: name})
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}
	return out, nil
}
func (s *Store) DeleteCategory(ctx context.Context, userID, id string) (bool, error) {
	tag, err := s.pool.Exec(ctx, `DELETE FROM categories WHERE id=$1 AND user_id=$2`, id, userID)
	return tag.RowsAffected() > 0, translateError(err)
}
func (s *Store) Rooms(ctx context.Context, id string) ([]models.RoomSummary, error) {
	rows, err := s.pool.Query(ctx, `SELECT r.id,r.name,COALESCE(r.description,''),COUNT(i.id)::int,COALESCE(SUM(i.estimated_value*i.quantity),0)::float8,COALESCE((SELECT ri.name FROM items ri WHERE ri.room_id=r.id AND ri.user_id=r.user_id ORDER BY ri.created_at DESC LIMIT 1),''),COALESCE(BOOL_OR(i.id IS NOT NULL AND(i.category_id IS NULL OR NULLIF(i.condition,'') IS NULL)),false) FROM rooms r LEFT JOIN items i ON i.room_id=r.id AND i.user_id=r.user_id WHERE r.user_id=$1 GROUP BY r.id,r.name,r.description ORDER BY r.name`, id)
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
	_, err = s.pool.Exec(ctx, `INSERT INTO rooms(id,user_id,name,description) VALUES($1,$2,$3,NULLIF($4,''))`, id, userID, name, description)
	return models.RoomSummary{ID: id, Name: name, Description: description}, translateError(err)
}
func (s *Store) DeleteRoom(ctx context.Context, userID, id string) (bool, error) {
	tag, err := s.pool.Exec(ctx, `DELETE FROM rooms WHERE id=$1 AND user_id=$2`, id, userID)
	return tag.RowsAffected() > 0, translateError(err)
}
