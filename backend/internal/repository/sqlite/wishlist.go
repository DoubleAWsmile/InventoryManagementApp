package sqlite

import (
	"context"
	"time"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
)

const wishlistSelect = `SELECT w.id,COALESCE(w.category_id,''),COALESCE(c.name,''),w.item_name,COALESCE(w.brand,''),COALESCE(w.model,''),w.estimated_cost,COALESCE(w.item_url,''),COALESCE(w.notes,''),w.priority,w.status,w.created_at,w.updated_at FROM wishlist w LEFT JOIN categories c ON c.id=w.category_id`

func scanWishlist(row interface{ Scan(...any) error }) (models.WishlistItem, error) {
	var v models.WishlistItem
	var created, updated string
	err := row.Scan(&v.ID, &v.CategoryID, &v.Category, &v.ItemName, &v.Brand, &v.Model, &v.EstimatedCost, &v.ItemURL, &v.Notes, &v.Priority, &v.Status, &created, &updated)
	if err != nil {
		return v, translateError(err)
	}
	v.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
	if err == nil {
		v.UpdatedAt, err = time.Parse(time.RFC3339Nano, updated)
	}
	return v, err
}
func (s *Store) validCategory(ctx context.Context, userID, id string) error {
	if id == "" {
		return nil
	}
	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM categories WHERE id=? AND user_id=?`, id, userID).Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		return repository.ErrInvalidReference
	}
	return nil
}
func (s *Store) Wishlist(ctx context.Context, userID string) ([]models.WishlistItem, error) {
	rows, err := s.db.QueryContext(ctx, wishlistSelect+` WHERE w.user_id=? ORDER BY CASE w.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,w.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.WishlistItem{}
	for rows.Next() {
		v, e := scanWishlist(rows)
		if e != nil {
			return nil, e
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
func (s *Store) CreateWishlistItem(ctx context.Context, params repository.CreateWishlistItemParams) (models.WishlistItem, error) {
	item := params.Item
	if err := s.validCategory(ctx, params.UserID, item.CategoryID); err != nil {
		return models.WishlistItem{}, err
	}
	id, err := appdb.NewUUID()
	if err != nil {
		return models.WishlistItem{}, err
	}
	now := nowText(time.Now())
	_, err = s.db.ExecContext(ctx, `INSERT INTO wishlist(id,user_id,category_id,item_name,brand,model,estimated_cost,item_url,notes,priority,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, params.UserID, nullable(item.CategoryID), item.ItemName, nullable(item.Brand), nullable(item.Model), item.EstimatedCost, nullable(item.ItemURL), nullable(item.Notes), item.Priority, item.Status, now, now)
	if err != nil {
		return models.WishlistItem{}, translateError(err)
	}
	return scanWishlist(s.db.QueryRowContext(ctx, wishlistSelect+` WHERE w.id=? AND w.user_id=?`, id, params.UserID))
}
func (s *Store) UpdateWishlistItem(ctx context.Context, params repository.UpdateWishlistItemParams) (models.WishlistItem, error) {
	item := params.Item
	if err := s.validCategory(ctx, params.UserID, item.CategoryID); err != nil {
		return models.WishlistItem{}, err
	}
	result, err := s.db.ExecContext(ctx, `UPDATE wishlist SET category_id=?,item_name=?,brand=?,model=?,estimated_cost=?,item_url=?,notes=?,priority=?,status=?,updated_at=? WHERE id=? AND user_id=?`, nullable(item.CategoryID), item.ItemName, nullable(item.Brand), nullable(item.Model), item.EstimatedCost, nullable(item.ItemURL), nullable(item.Notes), item.Priority, item.Status, nowText(time.Now()), params.WishlistID, params.UserID)
	if err != nil {
		return models.WishlistItem{}, translateError(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return models.WishlistItem{}, repository.ErrNotFound
	}
	return scanWishlist(s.db.QueryRowContext(ctx, wishlistSelect+` WHERE w.id=? AND w.user_id=?`, params.WishlistID, params.UserID))
}
func (s *Store) DeleteWishlistItem(ctx context.Context, userID, id string) (bool, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM wishlist WHERE id=? AND user_id=?`, id, userID)
	if err != nil {
		return false, err
	}
	count, err := result.RowsAffected()
	return count > 0, err
}
