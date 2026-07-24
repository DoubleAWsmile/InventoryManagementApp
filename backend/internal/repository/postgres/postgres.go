package postgres

import (
	"context"
	"errors"
	"time"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct{ pool *pgxpool.Pool }

func New(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func translateError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return repository.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code == "23505" {
			return repository.ErrConflict
		}
		if pgErr.Code == "23503" {
			return repository.ErrInvalidReference
		}
	}
	return err
}
func scanUser(row pgx.Row) (models.User, error) {
	var v models.User
	err := row.Scan(&v.ID, &v.Email, &v.DisplayName, &v.CreatedAt, &v.UpdatedAt)
	return v, translateError(err)
}

func (s *Store) CreateUser(ctx context.Context, p repository.CreateUserParams) (models.User, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return models.User{}, err
	}
	defer tx.Rollback(ctx)
	userID, err := appdb.NewUUID()
	if err != nil {
		return models.User{}, err
	}
	credentialID, err := appdb.NewUUID()
	if err != nil {
		return models.User{}, err
	}
	now := time.Now().UTC()
	_, err = tx.Exec(ctx, `INSERT INTO users(id,email,display_name,created_at,updated_at) VALUES($1,$2,$3,$4,$4)`, userID, p.Email, p.DisplayName, now)
	if err != nil {
		return models.User{}, translateError(err)
	}
	_, err = tx.Exec(ctx, `INSERT INTO auth_credentials(id,user_id,password_hash,created_at,updated_at) VALUES($1,$2,$3,$4,$4)`, credentialID, userID, p.PasswordHash, now)
	if err != nil {
		return models.User{}, translateError(err)
	}
	_, err = tx.Exec(ctx, `INSERT INTO user_settings(user_id,created_at,updated_at) VALUES($1,$2,$2) ON CONFLICT(user_id) DO NOTHING`, userID, now)
	if err != nil {
		return models.User{}, translateError(err)
	}
	if err = tx.Commit(ctx); err != nil {
		return models.User{}, err
	}
	return scanUser(s.pool.QueryRow(ctx, `SELECT id,email,display_name,created_at,updated_at FROM users WHERE id=$1`, userID))
}
func (s *Store) credentials(ctx context.Context, where string, value any) (repository.Credentials, error) {
	var v repository.Credentials
	err := s.pool.QueryRow(ctx, `SELECT u.id,u.email,u.display_name,u.created_at,u.updated_at,a.password_hash FROM users u JOIN auth_credentials a ON a.user_id=u.id `+where, value).Scan(&v.User.ID, &v.User.Email, &v.User.DisplayName, &v.User.CreatedAt, &v.User.UpdatedAt, &v.PasswordHash)
	return v, translateError(err)
}
func (s *Store) CredentialsByEmail(ctx context.Context, email string) (repository.Credentials, error) {
	return s.credentials(ctx, `WHERE u.email=$1`, email)
}
func (s *Store) CredentialsByUserID(ctx context.Context, id string) (repository.Credentials, error) {
	return s.credentials(ctx, `WHERE u.id=$1`, id)
}
func (s *Store) DeleteUser(ctx context.Context, id string) (bool, error) {
	result, err := s.pool.Exec(ctx, `DELETE FROM users WHERE id=$1`, id)
	return result.RowsAffected() > 0, translateError(err)
}
func (s *Store) CreateSession(ctx context.Context, p repository.CreateSessionParams) error {
	id, err := appdb.NewUUID()
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,$4)`, id, p.UserID, p.TokenHash, p.ExpiresAt)
	return translateError(err)
}
func (s *Store) UserBySession(ctx context.Context, hash string, at time.Time) (models.User, error) {
	return scanUser(s.pool.QueryRow(ctx, `SELECT u.id,u.email,u.display_name,u.created_at,u.updated_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>$2`, hash, at))
}
func (s *Store) RevokeSession(ctx context.Context, hash string, at time.Time) (bool, error) {
	result, err := s.pool.Exec(ctx, `UPDATE sessions SET revoked_at=$1 WHERE token_hash=$2 AND revoked_at IS NULL`, at, hash)
	return result.RowsAffected() > 0, translateError(err)
}
func (s *Store) DeleteExpiredSessions(ctx context.Context, at time.Time) (int64, error) {
	result, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at<=$1`, at)
	return result.RowsAffected(), translateError(err)
}

const settingsColumns = `notify_low_stock,notify_warranty_expiry,notify_missing_info,notify_monthly_summary,notify_new_features,notify_security_alerts,default_inventory_view,default_inventory_sort,currency_code,show_inventory_values,show_low_stock_badges,show_missing_info_badges,ui_preferences`

func scanSettings(row pgx.Row) (models.UserSettings, error) {
	var v models.UserSettings
	err := row.Scan(&v.NotifyLowStock, &v.NotifyWarrantyExpiry, &v.NotifyMissingInfo, &v.NotifyMonthlySummary, &v.NotifyNewFeatures, &v.NotifySecurityAlerts, &v.DefaultInventoryView, &v.DefaultInventorySort, &v.CurrencyCode, &v.ShowInventoryValues, &v.ShowLowStockBadges, &v.ShowMissingInfoBadges, &v.UIPreferences)
	return v, translateError(err)
}
func (s *Store) GetSettings(ctx context.Context, id string) (models.UserSettings, error) {
	_, err := s.pool.Exec(ctx, `INSERT INTO user_settings(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING`, id)
	if err != nil {
		return models.UserSettings{}, translateError(err)
	}
	return scanSettings(s.pool.QueryRow(ctx, `SELECT `+settingsColumns+` FROM user_settings WHERE user_id=$1`, id))
}
func (s *Store) UpdateSettings(ctx context.Context, id string, v models.UserSettings) (models.UserSettings, error) {
	_, err := s.pool.Exec(ctx, `INSERT INTO user_settings(user_id,notify_low_stock,notify_warranty_expiry,notify_missing_info,notify_monthly_summary,notify_new_features,notify_security_alerts,default_inventory_view,default_inventory_sort,currency_code,show_inventory_values,show_low_stock_badges,show_missing_info_badges,ui_preferences) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT(user_id) DO UPDATE SET notify_low_stock=EXCLUDED.notify_low_stock,notify_warranty_expiry=EXCLUDED.notify_warranty_expiry,notify_missing_info=EXCLUDED.notify_missing_info,notify_monthly_summary=EXCLUDED.notify_monthly_summary,notify_new_features=EXCLUDED.notify_new_features,notify_security_alerts=EXCLUDED.notify_security_alerts,default_inventory_view=EXCLUDED.default_inventory_view,default_inventory_sort=EXCLUDED.default_inventory_sort,currency_code=EXCLUDED.currency_code,show_inventory_values=EXCLUDED.show_inventory_values,show_low_stock_badges=EXCLUDED.show_low_stock_badges,show_missing_info_badges=EXCLUDED.show_missing_info_badges,ui_preferences=EXCLUDED.ui_preferences`, id, v.NotifyLowStock, v.NotifyWarrantyExpiry, v.NotifyMissingInfo, v.NotifyMonthlySummary, v.NotifyNewFeatures, v.NotifySecurityAlerts, v.DefaultInventoryView, v.DefaultInventorySort, v.CurrencyCode, v.ShowInventoryValues, v.ShowLowStockBadges, v.ShowMissingInfoBadges, v.UIPreferences)
	if err != nil {
		return models.UserSettings{}, translateError(err)
	}
	return s.GetSettings(ctx, id)
}
func (s *Store) ResetSettings(ctx context.Context, id string) (models.UserSettings, error) {
	_, err := s.pool.Exec(ctx, `INSERT INTO user_settings(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET notify_low_stock=TRUE,notify_warranty_expiry=TRUE,notify_missing_info=TRUE,notify_monthly_summary=TRUE,notify_new_features=TRUE,notify_security_alerts=TRUE,default_inventory_view='grid',default_inventory_sort='addedDate',currency_code='USD',show_inventory_values=TRUE,show_low_stock_badges=TRUE,show_missing_info_badges=TRUE,ui_preferences='{}'::jsonb`, id)
	if err != nil {
		return models.UserSettings{}, translateError(err)
	}
	return s.GetSettings(ctx, id)
}
