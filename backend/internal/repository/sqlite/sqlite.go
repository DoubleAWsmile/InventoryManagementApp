package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	appdb "github.com/DoubleAWsmile/InventoryManagementApp/internal/database"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/models"
	"github.com/DoubleAWsmile/InventoryManagementApp/internal/repository"
	modernsqlite "modernc.org/sqlite"
)

type Store struct{ db *sql.DB }

func New(db *sql.DB) *Store   { return &Store{db: db} }
func (s *Store) Close() error { return s.db.Close() }

func nowText(t time.Time) string { return t.UTC().Format(time.RFC3339Nano) }

func translateError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return repository.ErrNotFound
	}
	var sqliteErr *modernsqlite.Error
	if errors.As(err, &sqliteErr) && sqliteErr.Code() == 2067 {
		return repository.ErrConflict
	}
	return err
}

func scanUser(row interface{ Scan(...any) error }) (models.User, error) {
	var user models.User
	var created, updated string
	err := row.Scan(&user.ID, &user.Email, &user.DisplayName, &created, &updated)
	if err != nil {
		return user, translateError(err)
	}
	user.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
	if err != nil {
		return user, fmt.Errorf("parse user created_at: %w", err)
	}
	user.UpdatedAt, err = time.Parse(time.RFC3339Nano, updated)
	return user, err
}

func (s *Store) CreateUser(ctx context.Context, params repository.CreateUserParams) (models.User, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return models.User{}, err
	}
	defer tx.Rollback()
	userID, err := appdb.NewUUID()
	if err != nil {
		return models.User{}, err
	}
	credentialID, err := appdb.NewUUID()
	if err != nil {
		return models.User{}, err
	}
	now := nowText(time.Now())
	if _, err = tx.ExecContext(ctx, `INSERT INTO users(id,email,display_name,created_at,updated_at) VALUES(?,?,?,?,?)`, userID, params.Email, params.DisplayName, now, now); err != nil {
		return models.User{}, translateError(err)
	}
	if _, err = tx.ExecContext(ctx, `INSERT INTO auth_credentials(id,user_id,password_hash,created_at,updated_at) VALUES(?,?,?,?,?)`, credentialID, userID, params.PasswordHash, now, now); err != nil {
		return models.User{}, translateError(err)
	}
	if _, err = tx.ExecContext(ctx, `INSERT INTO user_settings(user_id,created_at,updated_at) VALUES(?,?,?)`, userID, now, now); err != nil {
		return models.User{}, translateError(err)
	}
	if err = tx.Commit(); err != nil {
		return models.User{}, err
	}
	return scanUser(s.db.QueryRowContext(ctx, `SELECT id,email,display_name,created_at,updated_at FROM users WHERE id=?`, userID))
}

func (s *Store) CredentialsByUserID(ctx context.Context, userID string) (repository.Credentials, error) {
	return s.credentials(ctx, `WHERE u.id=?`, userID)
}

func (s *Store) DeleteUser(ctx context.Context, userID string) (bool, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM users WHERE id=?`, userID)
	if err != nil {
		return false, err
	}
	count, err := result.RowsAffected()
	return count > 0, err
}

func (s *Store) CredentialsByEmail(ctx context.Context, email string) (repository.Credentials, error) {
	return s.credentials(ctx, `WHERE u.email=?`, email)
}

func (s *Store) credentials(ctx context.Context, where string, value any) (repository.Credentials, error) {
	var result repository.Credentials
	var created, updated string
	err := s.db.QueryRowContext(ctx, `SELECT u.id,u.email,u.display_name,u.created_at,u.updated_at,a.password_hash FROM users u JOIN auth_credentials a ON a.user_id=u.id `+where, value).
		Scan(&result.User.ID, &result.User.Email, &result.User.DisplayName, &created, &updated, &result.PasswordHash)
	if err != nil {
		return result, translateError(err)
	}
	result.User.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
	if err == nil {
		result.User.UpdatedAt, err = time.Parse(time.RFC3339Nano, updated)
	}
	return result, err
}

func (s *Store) CreateSession(ctx context.Context, params repository.CreateSessionParams) error {
	id, err := appdb.NewUUID()
	if err != nil {
		return err
	}
	now := nowText(time.Now())
	_, err = s.db.ExecContext(ctx, `INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?)`, id, params.UserID, params.TokenHash, nowText(params.ExpiresAt), now, now)
	return translateError(err)
}

func (s *Store) UserBySession(ctx context.Context, tokenHash string, at time.Time) (models.User, error) {
	return scanUser(s.db.QueryRowContext(ctx, `SELECT u.id,u.email,u.display_name,u.created_at,u.updated_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?`, tokenHash, nowText(at)))
}

func (s *Store) RevokeSession(ctx context.Context, tokenHash string, at time.Time) (bool, error) {
	result, err := s.db.ExecContext(ctx, `UPDATE sessions SET revoked_at=?,updated_at=? WHERE token_hash=? AND revoked_at IS NULL`, nowText(at), nowText(at), tokenHash)
	if err != nil {
		return false, err
	}
	count, err := result.RowsAffected()
	return count > 0, err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context, at time.Time) (int64, error) {
	result, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE expires_at<=?`, nowText(at))
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

const settingsColumns = `notify_low_stock,notify_warranty_expiry,notify_missing_info,notify_monthly_summary,notify_new_features,notify_security_alerts,default_inventory_view,default_inventory_sort,currency_code,show_inventory_values,show_low_stock_badges,show_missing_info_badges,ui_preferences`

func scanSettings(row interface{ Scan(...any) error }) (models.UserSettings, error) {
	var v models.UserSettings
	var ui string
	err := row.Scan(&v.NotifyLowStock, &v.NotifyWarrantyExpiry, &v.NotifyMissingInfo, &v.NotifyMonthlySummary, &v.NotifyNewFeatures, &v.NotifySecurityAlerts, &v.DefaultInventoryView, &v.DefaultInventorySort, &v.CurrencyCode, &v.ShowInventoryValues, &v.ShowLowStockBadges, &v.ShowMissingInfoBadges, &ui)
	v.UIPreferences = json.RawMessage(ui)
	return v, translateError(err)
}

func (s *Store) GetSettings(ctx context.Context, userID string) (models.UserSettings, error) {
	now := nowText(time.Now())
	_, err := s.db.ExecContext(ctx, `INSERT OR IGNORE INTO user_settings(user_id,created_at,updated_at) VALUES(?,?,?)`, userID, now, now)
	if err != nil {
		return models.UserSettings{}, err
	}
	return scanSettings(s.db.QueryRowContext(ctx, `SELECT `+settingsColumns+` FROM user_settings WHERE user_id=?`, userID))
}

func (s *Store) UpdateSettings(ctx context.Context, userID string, v models.UserSettings) (models.UserSettings, error) {
	now := nowText(time.Now())
	_, err := s.db.ExecContext(ctx, `INSERT INTO user_settings(user_id,notify_low_stock,notify_warranty_expiry,notify_missing_info,notify_monthly_summary,notify_new_features,notify_security_alerts,default_inventory_view,default_inventory_sort,currency_code,show_inventory_values,show_low_stock_badges,show_missing_info_badges,ui_preferences,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET notify_low_stock=excluded.notify_low_stock,notify_warranty_expiry=excluded.notify_warranty_expiry,notify_missing_info=excluded.notify_missing_info,notify_monthly_summary=excluded.notify_monthly_summary,notify_new_features=excluded.notify_new_features,notify_security_alerts=excluded.notify_security_alerts,default_inventory_view=excluded.default_inventory_view,default_inventory_sort=excluded.default_inventory_sort,currency_code=excluded.currency_code,show_inventory_values=excluded.show_inventory_values,show_low_stock_badges=excluded.show_low_stock_badges,show_missing_info_badges=excluded.show_missing_info_badges,ui_preferences=excluded.ui_preferences,updated_at=excluded.updated_at`, userID, v.NotifyLowStock, v.NotifyWarrantyExpiry, v.NotifyMissingInfo, v.NotifyMonthlySummary, v.NotifyNewFeatures, v.NotifySecurityAlerts, v.DefaultInventoryView, v.DefaultInventorySort, v.CurrencyCode, v.ShowInventoryValues, v.ShowLowStockBadges, v.ShowMissingInfoBadges, string(v.UIPreferences), now, now)
	if err != nil {
		return models.UserSettings{}, translateError(err)
	}
	return s.GetSettings(ctx, userID)
}

func (s *Store) ResetSettings(ctx context.Context, userID string) (models.UserSettings, error) {
	defaults := models.UserSettings{NotifyLowStock: true, NotifyWarrantyExpiry: true, NotifyMissingInfo: true, NotifyMonthlySummary: true, NotifyNewFeatures: true, NotifySecurityAlerts: true, DefaultInventoryView: "grid", DefaultInventorySort: "addedDate", CurrencyCode: "USD", ShowInventoryValues: true, ShowLowStockBadges: true, ShowMissingInfoBadges: true, UIPreferences: json.RawMessage(`{}`)}
	return s.UpdateSettings(ctx, userID, defaults)
}

func nullable(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
