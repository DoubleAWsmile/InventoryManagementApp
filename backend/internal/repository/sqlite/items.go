package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
	"time"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
)

const itemSelect = `SELECT i.id,i.name,COALESCE(i.category_id,''),COALESCE(c.name,''),COALESCE(i.room_id,''),COALESCE(r.name,''),i.quantity,i.estimated_value,i.purchase_date,COALESCE(i.condition,''),COALESCE(i.brand,''),COALESCE(i.model,''),COALESCE(i.serial_number,''),COALESCE(i.description,''),COALESCE(i.notes,''),COALESCE(i.photo_url,''),COALESCE(i.photo_filename,''),COALESCE(i.photo_mime_type,''),i.photo_size_bytes,i.tags,i.created_at,i.updated_at FROM items i LEFT JOIN categories c ON c.id=i.category_id LEFT JOIN rooms r ON r.id=i.room_id`

func scanItem(row interface{ Scan(...any) error }) (models.Item, error) {
	var item models.Item
	var purchase sql.NullString
	var tags, created, updated string
	err := row.Scan(&item.ID, &item.Name, &item.CategoryID, &item.Category, &item.RoomID, &item.RoomLocation, &item.Quantity, &item.EstimatedValue, &purchase, &item.Condition, &item.Brand, &item.Model, &item.SerialNumber, &item.Description, &item.Notes, &item.PhotoURL, &item.PhotoFilename, &item.PhotoMimeType, &item.PhotoSizeBytes, &tags, &created, &updated)
	if err != nil {
		return item, translateError(err)
	}
	if purchase.Valid {
		value, parseErr := time.Parse(time.RFC3339Nano, purchase.String)
		if parseErr != nil {
			value, parseErr = time.Parse("2006-01-02", purchase.String)
		}
		if parseErr != nil {
			return item, parseErr
		}
		item.PurchaseDate = &value
	}
	if err = json.Unmarshal([]byte(tags), &item.Tags); err != nil {
		return item, err
	}
	item.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
	if err == nil {
		item.UpdatedAt, err = time.Parse(time.RFC3339Nano, updated)
	}
	return item, err
}

func (s *Store) ItemOptions(ctx context.Context, userID string) (repository.ItemOptions, error) {
	out := repository.ItemOptions{Categories: []repository.ItemOption{}, Rooms: []repository.ItemOption{}}
	rows, err := s.db.QueryContext(ctx, `SELECT 'category',id,name FROM categories WHERE user_id=? UNION ALL SELECT 'room',id,name FROM rooms WHERE user_id=? ORDER BY 1,3`, userID, userID)
	if err != nil {
		return out, err
	}
	defer rows.Close()
	for rows.Next() {
		var kind string
		var option repository.ItemOption
		if err = rows.Scan(&kind, &option.ID, &option.Name); err != nil {
			return out, err
		}
		if kind == "category" {
			out.Categories = append(out.Categories, option)
		} else {
			out.Rooms = append(out.Rooms, option)
		}
	}
	return out, rows.Err()
}

func (s *Store) Items(ctx context.Context, params repository.ListItemsParams) (repository.ItemPage, error) {
	offset := 0
	if params.Cursor != nil {
		parsed, err := strconv.Atoi(*params.Cursor)
		if err != nil || parsed < 0 {
			return repository.ItemPage{}, repository.ErrInvalidCursor
		}
		offset = parsed
	}
	rows, err := s.db.QueryContext(ctx, itemSelect+` WHERE i.user_id=? ORDER BY i.created_at DESC,i.id DESC LIMIT ? OFFSET ?`, params.UserID, params.Limit, offset)
	if err != nil {
		return repository.ItemPage{}, err
	}
	defer rows.Close()
	items := []models.Item{}
	for rows.Next() {
		item, e := scanItem(rows)
		if e != nil {
			return repository.ItemPage{}, e
		}
		items = append(items, item)
	}
	if err = rows.Err(); err != nil {
		return repository.ItemPage{}, err
	}
	var next *string
	if len(items) == params.Limit {
		v := strconv.Itoa(offset + len(items))
		next = &v
	}
	return repository.ItemPage{Items: items, NextCursor: next}, nil
}

func (s *Store) RecentItems(ctx context.Context, userID string, limit int) ([]models.Item, error) {
	rows, err := s.db.QueryContext(ctx, itemSelect+` WHERE i.user_id=? ORDER BY i.created_at DESC LIMIT ?`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []models.Item{}
	for rows.Next() {
		item, e := scanItem(rows)
		if e != nil {
			return nil, e
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) validRefs(ctx context.Context, q interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}, userID, categoryID, roomID string) error {
	var categories, rooms int
	err := q.QueryRowContext(ctx, `SELECT (SELECT COUNT(*) FROM categories WHERE id=? AND user_id=?),(SELECT COUNT(*) FROM rooms WHERE id=? AND user_id=?)`, categoryID, userID, roomID, userID).Scan(&categories, &rooms)
	if err != nil {
		return err
	}
	if (categoryID != "" && categories == 0) || (roomID != "" && rooms == 0) {
		return repository.ErrInvalidReference
	}
	return nil
}

func itemArgs(id, userID string, item repository.ItemValues, now string) []any {
	tags, _ := json.Marshal(item.Tags)
	var purchase any
	if item.PurchaseDate != nil {
		purchase = nowText(*item.PurchaseDate)
	}
	return []any{id, userID, item.Name, nullable(item.CategoryID), nullable(item.RoomID), item.Quantity, item.EstimatedValue, purchase, nullable(item.Condition), nullable(item.Brand), nullable(item.Model), nullable(item.SerialNumber), nullable(item.Description), nullable(item.Notes), nullable(item.PhotoURL), nullable(item.PhotoFilename), nullable(item.PhotoMimeType), item.PhotoSizeBytes, string(tags), now, now}
}

func (s *Store) CreateItem(ctx context.Context, params repository.CreateItemParams) (models.Item, error) {
	if err := s.validRefs(ctx, s.db, params.UserID, params.Item.CategoryID, params.Item.RoomID); err != nil {
		return models.Item{}, err
	}
	id, err := appdb.NewUUID()
	if err != nil {
		return models.Item{}, err
	}
	now := nowText(time.Now())
	_, err = s.db.ExecContext(ctx, `INSERT INTO items(id,user_id,name,category_id,room_id,quantity,estimated_value,purchase_date,condition,brand,model,serial_number,description,notes,photo_url,photo_filename,photo_mime_type,photo_size_bytes,tags,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, itemArgs(id, params.UserID, params.Item, now)...)
	if err != nil {
		return models.Item{}, translateError(err)
	}
	return scanItem(s.db.QueryRowContext(ctx, itemSelect+` WHERE i.id=? AND i.user_id=?`, id, params.UserID))
}

func (s *Store) UpdateItem(ctx context.Context, params repository.UpdateItemParams) (models.Item, error) {
	item := params.Item
	if err := s.validRefs(ctx, s.db, params.UserID, item.CategoryID, item.RoomID); err != nil {
		return models.Item{}, err
	}
	tags, _ := json.Marshal(item.Tags)
	var purchase any
	if item.PurchaseDate != nil {
		purchase = nowText(*item.PurchaseDate)
	}
	now := nowText(time.Now())
	result, err := s.db.ExecContext(ctx, `UPDATE items SET name=?,category_id=?,room_id=?,quantity=?,estimated_value=?,purchase_date=?,condition=?,brand=?,model=?,serial_number=?,description=?,notes=?,photo_url=?,photo_filename=?,photo_mime_type=?,photo_size_bytes=?,tags=?,updated_at=? WHERE id=? AND user_id=?`, item.Name, nullable(item.CategoryID), nullable(item.RoomID), item.Quantity, item.EstimatedValue, purchase, nullable(item.Condition), nullable(item.Brand), nullable(item.Model), nullable(item.SerialNumber), nullable(item.Description), nullable(item.Notes), nullable(item.PhotoURL), nullable(item.PhotoFilename), nullable(item.PhotoMimeType), item.PhotoSizeBytes, string(tags), now, params.ItemID, params.UserID)
	if err != nil {
		return models.Item{}, translateError(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return models.Item{}, repository.ErrNotFound
	}
	return scanItem(s.db.QueryRowContext(ctx, itemSelect+` WHERE i.id=? AND i.user_id=?`, params.ItemID, params.UserID))
}

func (s *Store) DeleteItem(ctx context.Context, userID, itemID string) (bool, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM items WHERE id=? AND user_id=?`, itemID, userID)
	if err != nil {
		return false, err
	}
	count, err := result.RowsAffected()
	return count > 0, err
}
