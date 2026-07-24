package postgres

import (
	"context"
	"strconv"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
)

const itemSelect = `SELECT i.id,i.name,COALESCE(i.category_id::text,''),COALESCE(c.name,''),COALESCE(i.room_id::text,''),COALESCE(r.name,''),i.quantity,i.estimated_value,i.purchase_date,COALESCE(i.condition,''),COALESCE(i.brand,''),COALESCE(i.model,''),COALESCE(i.serial_number,''),COALESCE(i.description,''),COALESCE(i.notes,''),COALESCE(i.photo_url,''),COALESCE(i.photo_filename,''),COALESCE(i.photo_mime_type,''),i.photo_size_bytes,COALESCE(i.tags,'{}'),i.created_at,i.updated_at FROM items i LEFT JOIN categories c ON c.id=i.category_id LEFT JOIN rooms r ON r.id=i.room_id`

func scanItem(row interface{ Scan(...any) error }) (models.Item, error) {
	var v models.Item
	err := row.Scan(&v.ID, &v.Name, &v.CategoryID, &v.Category, &v.RoomID, &v.RoomLocation, &v.Quantity, &v.EstimatedValue, &v.PurchaseDate, &v.Condition, &v.Brand, &v.Model, &v.SerialNumber, &v.Description, &v.Notes, &v.PhotoURL, &v.PhotoFilename, &v.PhotoMimeType, &v.PhotoSizeBytes, &v.Tags, &v.CreatedAt, &v.UpdatedAt)
	return v, translateError(err)
}
func (s *Store) ItemOptions(ctx context.Context, id string) (repository.ItemOptions, error) {
	out := repository.ItemOptions{Categories: []repository.ItemOption{}, Rooms: []repository.ItemOption{}}
	rows, err := s.pool.Query(ctx, `SELECT 'category',id,name FROM categories WHERE user_id=$1 UNION ALL SELECT 'room',id,name FROM rooms WHERE user_id=$1 ORDER BY 1,3`, id)
	if err != nil {
		return out, err
	}
	defer rows.Close()
	for rows.Next() {
		var kind string
		var v repository.ItemOption
		if err = rows.Scan(&kind, &v.ID, &v.Name); err != nil {
			return out, err
		}
		if kind == "category" {
			out.Categories = append(out.Categories, v)
		} else {
			out.Rooms = append(out.Rooms, v)
		}
	}
	return out, rows.Err()
}
func (s *Store) Items(ctx context.Context, p repository.ListItemsParams) (repository.ItemPage, error) {
	offset := 0
	if p.Cursor != nil {
		parsed, err := strconv.Atoi(*p.Cursor)
		if err != nil || parsed < 0 {
			return repository.ItemPage{}, repository.ErrInvalidCursor
		}
		offset = parsed
	}
	rows, err := s.pool.Query(ctx, itemSelect+` WHERE i.user_id=$1 ORDER BY i.created_at DESC,i.id DESC LIMIT $2 OFFSET $3`, p.UserID, p.Limit, offset)
	if err != nil {
		return repository.ItemPage{}, err
	}
	defer rows.Close()
	items := []models.Item{}
	for rows.Next() {
		v, e := scanItem(rows)
		if e != nil {
			return repository.ItemPage{}, e
		}
		items = append(items, v)
	}
	if err = rows.Err(); err != nil {
		return repository.ItemPage{}, err
	}
	var next *string
	if len(items) == p.Limit {
		v := strconv.Itoa(offset + len(items))
		next = &v
	}
	return repository.ItemPage{Items: items, NextCursor: next}, nil
}
func (s *Store) RecentItems(ctx context.Context, id string, limit int) ([]models.Item, error) {
	rows, err := s.pool.Query(ctx, itemSelect+` WHERE i.user_id=$1 ORDER BY i.created_at DESC LIMIT $2`, id, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Item{}
	for rows.Next() {
		v, e := scanItem(rows)
		if e != nil {
			return nil, e
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
func (s *Store) CreateItem(ctx context.Context, p repository.CreateItemParams) (models.Item, error) {
	id, err := appdb.NewUUID()
	if err != nil {
		return models.Item{}, err
	}
	v := p.Item
	tag, err := s.pool.Exec(ctx, `INSERT INTO items(id,user_id,name,category_id,room_id,quantity,estimated_value,purchase_date,condition,brand,model,serial_number,description,notes,photo_url,photo_filename,photo_mime_type,photo_size_bytes,tags) SELECT $1,$2,$3,c.id,r.id,$6,$7,$8,NULLIF($9,''),NULLIF($10,''),NULLIF($11,''),NULLIF($12,''),NULLIF($13,''),NULLIF($14,''),NULLIF($15,''),NULLIF($16,''),NULLIF($17,''),$18,$19 FROM (SELECT 1)x LEFT JOIN categories c ON c.id::text=$4 AND c.user_id=$2 LEFT JOIN rooms r ON r.id::text=$5 AND r.user_id=$2 WHERE ($4='' OR c.id IS NOT NULL) AND ($5='' OR r.id IS NOT NULL)`, id, p.UserID, v.Name, v.CategoryID, v.RoomID, v.Quantity, v.EstimatedValue, v.PurchaseDate, v.Condition, v.Brand, v.Model, v.SerialNumber, v.Description, v.Notes, v.PhotoURL, v.PhotoFilename, v.PhotoMimeType, v.PhotoSizeBytes, v.Tags)
	if err != nil {
		return models.Item{}, translateError(err)
	}
	if tag.RowsAffected() == 0 {
		return models.Item{}, repository.ErrInvalidReference
	}
	return scanItem(s.pool.QueryRow(ctx, itemSelect+` WHERE i.id=$1 AND i.user_id=$2`, id, p.UserID))
}
func (s *Store) UpdateItem(ctx context.Context, p repository.UpdateItemParams) (models.Item, error) {
	v := p.Item
	tag, err := s.pool.Exec(ctx, `UPDATE items i SET name=$3,category_id=c.id,room_id=r.id,quantity=$6,estimated_value=$7,purchase_date=$8,condition=NULLIF($9,''),brand=NULLIF($10,''),model=NULLIF($11,''),serial_number=NULLIF($12,''),description=NULLIF($13,''),notes=NULLIF($14,''),photo_url=NULLIF($15,''),photo_filename=NULLIF($16,''),photo_mime_type=NULLIF($17,''),photo_size_bytes=$18,tags=$19 FROM (SELECT 1)x LEFT JOIN categories c ON c.id::text=$4 AND c.user_id=$1 LEFT JOIN rooms r ON r.id::text=$5 AND r.user_id=$1 WHERE i.id::text=$2 AND i.user_id=$1 AND ($4='' OR c.id IS NOT NULL) AND ($5='' OR r.id IS NOT NULL)`, p.UserID, p.ItemID, v.Name, v.CategoryID, v.RoomID, v.Quantity, v.EstimatedValue, v.PurchaseDate, v.Condition, v.Brand, v.Model, v.SerialNumber, v.Description, v.Notes, v.PhotoURL, v.PhotoFilename, v.PhotoMimeType, v.PhotoSizeBytes, v.Tags)
	if err != nil {
		return models.Item{}, translateError(err)
	}
	if tag.RowsAffected() == 0 {
		return models.Item{}, repository.ErrNotFound
	}
	return scanItem(s.pool.QueryRow(ctx, itemSelect+` WHERE i.id=$1 AND i.user_id=$2`, p.ItemID, p.UserID))
}
func (s *Store) DeleteItem(ctx context.Context, userID, id string) (bool, error) {
	result, err := s.pool.Exec(ctx, `DELETE FROM items WHERE id=$1 AND user_id=$2`, id, userID)
	return result.RowsAffected() > 0, translateError(err)
}
