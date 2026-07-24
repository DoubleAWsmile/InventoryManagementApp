# Database portability

The backend supports two persistence targets:

- `postgres`: hosted, multi-user PostgreSQL.
- `sqlite`: a single-user, fully local desktop database. It does not synchronize with PostgreSQL or any cloud service.

## Configuration

PostgreSQL remains the default. Set `DATABASE_DRIVER=postgres` (or omit it) and provide `DATABASE_URL`.

For a local database, set `DATABASE_DRIVER=sqlite` and optionally `SQLITE_PATH`. The default path is `data/inventory.db`. The application creates the parent directory and database file. SQLite connections enable foreign keys, WAL journal mode, a five-second busy timeout, and one open connection.

## Storage differences

| Concern | PostgreSQL | SQLite |
| --- | --- | --- |
| UUID | Native `UUID` | Canonical UUID in `TEXT` |
| Tags | `TEXT[]` with a GIN index | JSON array text |
| UI preferences | Validated `JSONB` object | JSON object text validated by JSON1 |
| Timestamps | `TIMESTAMPTZ` | UTC RFC3339 text |
| Money-like values | `NUMERIC(10,2)` | `REAL` |
| Updated timestamps | PL/pgSQL trigger | Application writes and SQLite-specific triggers/migrations |
| Query parameters | `$1`, `$2`, ... | `?` |

SQLite cannot exactly reproduce PostgreSQL fixed-decimal numeric enforcement, native time-zone-aware timestamp semantics, GIN array indexing, PostgreSQL query-planner behavior, or concurrent-write behavior. Repository methods normalize API-visible values, and SQLite is intentionally configured for the local single-user use case.

Schema and query implementations remain separate because PostgreSQL features such as `FILTER`, `BOOL_OR`, `date_trunc`, `unnest`, casts, data-modifying CTEs, and SQLSTATE errors do not have direct SQLite equivalents.

## Desktop API

`go run ./cmd/desktop-api` starts the fully local SQLite API. It is separate from the hosted `cmd/api`, which remains PostgreSQL-only.

By default the desktop database is stored at:

- Windows: `%LOCALAPPDATA%\InventoryManagementApp\inventory.db`
- macOS: `~/Library/Application Support/InventoryManagementApp/inventory.db`
- Linux: `$XDG_DATA_HOME/InventoryManagementApp/inventory.db`, or `~/.local/share/InventoryManagementApp/inventory.db`

Use `-database <path>` or `INVENTORY_DESKTOP_DB_PATH` to override it. Use `-port <port>` or `INVENTORY_DESKTOP_PORT` for a development port; otherwise the operating system selects an available port.

The command listens only on `127.0.0.1`. Its first and only standard-output message is a JSON readiness object containing the host, port, database path, and a cryptographically random per-launch bearer token. Diagnostic logs go to standard error. The token is never stored on disk and must be sent on desktop requests as `Authorization: Bearer <token>`. The health endpoint and CORS preflight requests are the only exceptions.

### Local identity

The desktop command creates or reuses one internal user with the reserved email `local@inventory.invalid`. After validating the sidecar launch token, desktop middleware places that user in request context. Shared handlers therefore retain their existing repository contracts and response formats without treating the launch token as a hosted session token. Registration and login routes remain present because the desktop command reuses the shared router, but they are not required to access local inventory.

### Process and shutdown behavior

SQLite uses foreign keys, WAL mode, a five-second busy timeout, and one open database connection. A sibling `inventory.db.lock` file is created exclusively at launch so a second desktop API cannot open the same database. The lock contains the process ID and is removed during normal signal-driven shutdown. If the process is forcibly killed or the machine loses power, the stale lock must be removed before restarting after confirming no desktop API process is using that database.

On interrupt or termination signals, the server stops accepting requests, gives active requests five seconds to finish, closes SQLite, removes the process lock, and exits.
