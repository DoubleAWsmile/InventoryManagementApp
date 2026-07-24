PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notify_low_stock INTEGER NOT NULL DEFAULT 1,
  notify_warranty_expiry INTEGER NOT NULL DEFAULT 1,
  notify_missing_info INTEGER NOT NULL DEFAULT 1,
  notify_monthly_summary INTEGER NOT NULL DEFAULT 1,
  notify_new_features INTEGER NOT NULL DEFAULT 1,
  notify_security_alerts INTEGER NOT NULL DEFAULT 1,
  default_inventory_view TEXT NOT NULL DEFAULT 'grid' CHECK (default_inventory_view IN ('grid','list')),
  default_inventory_sort TEXT NOT NULL DEFAULT 'addedDate' CHECK (default_inventory_sort IN ('addedDate','name','category','room','value','qty')),
  currency_code TEXT NOT NULL DEFAULT 'USD' CHECK (currency_code IN ('USD','EUR','GBP','CAD','AUD')),
  show_inventory_values INTEGER NOT NULL DEFAULT 1,
  show_low_stock_badges INTEGER NOT NULL DEFAULT 1,
  show_missing_info_badges INTEGER NOT NULL DEFAULT 1,
  ui_preferences TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(ui_preferences) AND json_type(ui_preferences) = 'object'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_unique_ci ON categories(user_id, lower(name));
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS rooms_user_name_unique_ci ON rooms(user_id, lower(name));
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL ON UPDATE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  estimated_value REAL CHECK (estimated_value >= 0),
  purchase_date TEXT,
  condition TEXT, brand TEXT, model TEXT, serial_number TEXT,
  description TEXT, notes TEXT, photo_url TEXT, photo_filename TEXT, photo_mime_type TEXT,
  photo_size_bytes INTEGER CHECK (photo_size_bytes >= 0),
  tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags) AND json_type(tags) = 'array'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  item_name TEXT NOT NULL, brand TEXT, model TEXT,
  estimated_cost REAL CHECK (estimated_cost >= 0),
  item_url TEXT, notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'wanted' CHECK (status IN ('wanted','considering','purchased','cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES items(id) ON DELETE SET NULL ON UPDATE CASCADE,
  type INTEGER NOT NULL CHECK (type > 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_items_user_created_at ON items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_user_category_id ON items(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_items_user_room_id ON items(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_created_at ON wishlist(user_id, created_at DESC);

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
