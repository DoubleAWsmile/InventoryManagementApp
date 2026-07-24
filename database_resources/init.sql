-- SQL Database Initiation
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- Shared updated_at trigger function
-- =========================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- Users
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- User settings
--
-- Frequently queried and behavior-affecting preferences are
-- first-class columns. Cosmetic/client-only preferences live in
-- ui_preferences so the UI can evolve without frequent migrations.
-- =========================================================

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY
    REFERENCES users(id)
    ON DELETE CASCADE,

  -- Notification preferences are columns so notification jobs can
  -- filter eligible users efficiently without inspecting JSON.
  notify_low_stock BOOLEAN NOT NULL DEFAULT TRUE,
  notify_warranty_expiry BOOLEAN NOT NULL DEFAULT TRUE,
  notify_missing_info BOOLEAN NOT NULL DEFAULT TRUE,
  notify_monthly_summary BOOLEAN NOT NULL DEFAULT TRUE,
  notify_new_features BOOLEAN NOT NULL DEFAULT TRUE,
  notify_security_alerts BOOLEAN NOT NULL DEFAULT TRUE,

  -- Inventory behavior shared consistently across clients.
  default_inventory_view TEXT NOT NULL DEFAULT 'grid'
    CHECK (default_inventory_view IN ('grid', 'list')),
  default_inventory_sort TEXT NOT NULL DEFAULT 'addedDate'
    CHECK (default_inventory_sort IN ('addedDate', 'name', 'category', 'room', 'value', 'qty')),
  currency_code TEXT NOT NULL DEFAULT 'USD'
    CHECK (currency_code IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
  show_inventory_values BOOLEAN NOT NULL DEFAULT TRUE,
  show_low_stock_badges BOOLEAN NOT NULL DEFAULT TRUE,
  show_missing_info_badges BOOLEAN NOT NULL DEFAULT TRUE,

  -- Examples: theme, accent color, font size, density, reduced motion,
  -- sidebar state, and other presentation-only options.
  ui_preferences JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(ui_preferences) = 'object'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_notification_jobs
ON user_settings (notify_low_stock, notify_warranty_expiry, notify_monthly_summary);

DROP TRIGGER IF EXISTS user_settings_set_updated_at
ON user_settings;

CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Ensure both existing and future users always have a settings row.
INSERT INTO user_settings (user_id)
SELECT u.id
FROM users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM user_settings AS existing_settings
  WHERE existing_settings.user_id = u.id
);

CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_create_default_settings
ON users;

CREATE TRIGGER users_create_default_settings
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_settings();


-- =========================================================
-- Password credentials
-- =========================================================

CREATE TABLE IF NOT EXISTS auth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL UNIQUE
    REFERENCES users(id)
    ON DELETE CASCADE,

  password_hash TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS auth_credentials_set_updated_at
ON auth_credentials;

CREATE TRIGGER auth_credentials_set_updated_at
BEFORE UPDATE ON auth_credentials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- Sessions
-- =========================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  token_hash TEXT UNIQUE NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash
ON sessions (token_hash);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions (expires_at);

DROP TRIGGER IF EXISTS sessions_set_updated_at
ON sessions;

CREATE TRIGGER sessions_set_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- Categories
-- =========================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS categories_user_name_unique_ci;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_name_unique;
CREATE UNIQUE INDEX categories_user_name_unique_ci
ON categories (user_id, LOWER(name));

CREATE INDEX IF NOT EXISTS idx_categories_user_id
ON categories (user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_name
ON categories (user_id, name);

DROP TRIGGER IF EXISTS categories_set_updated_at
ON categories;

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- Rooms
-- =========================================================

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS rooms_user_name_unique_ci;
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_user_name_unique;
CREATE UNIQUE INDEX rooms_user_name_unique_ci
ON rooms (user_id, LOWER(name));

CREATE INDEX IF NOT EXISTS idx_rooms_user_id
ON rooms (user_id);

CREATE INDEX IF NOT EXISTS idx_rooms_user_name
ON rooms (user_id, name);

DROP TRIGGER IF EXISTS rooms_set_updated_at
ON rooms;

CREATE TRIGGER rooms_set_updated_at
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- Items
-- =========================================================

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  category_id UUID
    REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  room_id UUID
    REFERENCES rooms(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  quantity INTEGER NOT NULL DEFAULT 1
    CHECK (quantity >= 0),

  estimated_value NUMERIC(10, 2)
    CHECK (estimated_value >= 0),

  purchase_date DATE,

  condition TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,

  description TEXT,
  notes TEXT,

  photo_url TEXT,
  photo_filename TEXT,
  photo_mime_type TEXT,

  photo_size_bytes INTEGER
    CHECK (photo_size_bytes >= 0),

  tags TEXT[] NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_user_id
ON items (user_id);

CREATE INDEX IF NOT EXISTS idx_items_user_created_at
ON items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_items_user_category_id
ON items (user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_items_user_room_id
ON items (user_id, room_id);

CREATE INDEX IF NOT EXISTS idx_items_user_name
ON items (user_id, name);

CREATE INDEX IF NOT EXISTS idx_items_tags
ON items USING GIN (tags);

DROP TRIGGER IF EXISTS items_set_updated_at
ON items;

CREATE TRIGGER items_set_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- Wishlist
-- =========================================================

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  category_id UUID
    REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  item_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  estimated_cost NUMERIC(10, 2)
    CHECK (estimated_cost >= 0),
  item_url TEXT,
  notes TEXT,

  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (
      priority IN (
        'low',
        'medium',
        'high'
      )
    ),

  status TEXT NOT NULL DEFAULT 'wanted'
    CHECK (
      status IN (
        'wanted',
        'considering',
        'purchased',
        'cancelled'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
ON wishlist (user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_category_id
ON wishlist (user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_priority
ON wishlist (user_id, priority);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_status
ON wishlist (user_id, status);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_created_at
ON wishlist (user_id, created_at DESC);

DROP TRIGGER IF EXISTS wishlist_set_updated_at
ON wishlist;

CREATE TRIGGER wishlist_set_updated_at
BEFORE UPDATE ON wishlist
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- Activities
-- =========================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  item_id UUID
    REFERENCES items(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  type SMALLINT NOT NULL
    CHECK (type > 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id
ON activities (user_id);

CREATE INDEX IF NOT EXISTS idx_activities_user_created_at
ON activities (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_item_id
ON activities (item_id);

CREATE INDEX IF NOT EXISTS idx_activities_user_type
ON activities (user_id, type);
