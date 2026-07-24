package config

import (
	"fmt"
	"os"
	"strings"
)

const (
	DriverPostgres = "postgres"
	DriverSQLite   = "sqlite"
)

type Database struct {
	Driver     string
	URL        string
	SQLitePath string
}

func DatabaseFromEnv() (Database, error) {
	driver := strings.ToLower(strings.TrimSpace(os.Getenv("DATABASE_DRIVER")))
	if driver == "" {
		driver = DriverPostgres
	}

	switch driver {
	case DriverPostgres:
		url := strings.TrimSpace(os.Getenv("DATABASE_URL"))
		if url == "" {
			return Database{}, fmt.Errorf("DATABASE_URL is required for postgres")
		}
		return Database{Driver: driver, URL: url}, nil
	case DriverSQLite:
		path := strings.TrimSpace(os.Getenv("SQLITE_PATH"))
		if path == "" {
			path = "data/inventory.db"
		}
		return Database{Driver: driver, SQLitePath: path}, nil
	default:
		return Database{}, fmt.Errorf("unsupported DATABASE_DRIVER %q (use postgres or sqlite)", driver)
	}
}
