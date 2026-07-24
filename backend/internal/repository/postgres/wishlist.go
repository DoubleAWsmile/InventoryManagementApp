package postgres

import (
	"context"
	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
)

const wishlistSelect = `SELECT w.id,COALESCE(w.category_id::text,''),COALESCE(c.name,''),w.item_name,COALESCE(w.brand,''),COALESCE(w.model,''),w.estimated_cost,COALESCE(w.item_url,''),COALESCE(w.notes,''),w.priority,w.status,w.created_at,w.updated_at FROM wishlist w LEFT JOIN categories c ON c.id=w.category_id`

func scanWishlist(row interface{ Scan(...any) error }) (models.WishlistItem, error) {
	var v models.WishlistItem
	err := row.Scan(&v.ID, &v.CategoryID, &v.Category, &v.ItemName, &v.Brand, &v.Model, &v.EstimatedCost, &v.ItemURL, &v.Notes, &v.Priority, &v.Status, &v.CreatedAt, &v.UpdatedAt)
	return v, translateError(err)
}
func (s *Store) Wishlist(ctx context.Context, id string) ([]models.WishlistItem, error) {
	rows, err := s.pool.Query(ctx, wishlistSelect+` WHERE w.user_id=$1 ORDER BY CASE w.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,w.created_at DESC`, id)
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
func (s *Store) CreateWishlistItem(ctx context.Context, p repository.CreateWishlistItemParams) (models.WishlistItem, error) {
	id, err := appdb.NewUUID()
	if err != nil {
		return models.WishlistItem{}, err
	}
	v := p.Item
	tag, err := s.pool.Exec(ctx, `INSERT INTO wishlist(id,user_id,category_id,item_name,brand,model,estimated_cost,item_url,notes,priority,status) SELECT $1,$2,c.id,$4,NULLIF($5,''),NULLIF($6,''),$7,NULLIF($8,''),NULLIF($9,''),$10,$11 FROM(SELECT 1)x LEFT JOIN categories c ON c.id::text=$3 AND c.user_id=$2 WHERE $3='' OR c.id IS NOT NULL`, id, p.UserID, v.CategoryID, v.ItemName, v.Brand, v.Model, v.EstimatedCost, v.ItemURL, v.Notes, v.Priority, v.Status)
	if err != nil {
		return models.WishlistItem{}, translateError(err)
	}
	if tag.RowsAffected() == 0 {
		return models.WishlistItem{}, repository.ErrInvalidReference
	}
	return scanWishlist(s.pool.QueryRow(ctx, wishlistSelect+` WHERE w.id=$1 AND w.user_id=$2`, id, p.UserID))
}
func (s *Store) UpdateWishlistItem(ctx context.Context, p repository.UpdateWishlistItemParams) (models.WishlistItem, error) {
	v := p.Item
	tag, err := s.pool.Exec(ctx, `UPDATE wishlist w SET category_id=c.id,item_name=$4,brand=NULLIF($5,''),model=NULLIF($6,''),estimated_cost=$7,item_url=NULLIF($8,''),notes=NULLIF($9,''),priority=$10,status=$11 FROM(SELECT 1)x LEFT JOIN categories c ON c.id::text=$3 AND c.user_id=$1 WHERE w.id::text=$2 AND w.user_id=$1 AND($3='' OR c.id IS NOT NULL)`, p.UserID, p.WishlistID, v.CategoryID, v.ItemName, v.Brand, v.Model, v.EstimatedCost, v.ItemURL, v.Notes, v.Priority, v.Status)
	if err != nil {
		return models.WishlistItem{}, translateError(err)
	}
	if tag.RowsAffected() == 0 {
		return models.WishlistItem{}, repository.ErrNotFound
	}
	return scanWishlist(s.pool.QueryRow(ctx, wishlistSelect+` WHERE w.id=$1 AND w.user_id=$2`, p.WishlistID, p.UserID))
}
func (s *Store) DeleteWishlistItem(ctx context.Context, userID, id string) (bool, error) {
	tag, err := s.pool.Exec(ctx, `DELETE FROM wishlist WHERE id=$1 AND user_id=$2`, id, userID)
	return tag.RowsAffected() > 0, translateError(err)
}
