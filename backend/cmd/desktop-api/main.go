package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		log.New(os.Stderr, "desktop-api: ", log.LstdFlags).Print(err)
		os.Exit(1)
	}
}

func run() error {
	databaseOverride := flag.String("database", "", "SQLite database path (overrides INVENTORY_DESKTOP_DB_PATH)")
	portFlag := flag.Int("port", 0, "localhost port; 0 selects an available port")
	flag.Parse()
	databasePath, err := defaultDatabasePath(*databaseOverride)
	if err != nil {
		return err
	}
	port, err := resolvePort(*portFlag, os.Getenv("INVENTORY_DESKTOP_PORT"))
	if err != nil {
		return err
	}
	releaseLock, err := acquireProcessLock(databasePath)
	if err != nil {
		return err
	}
	defer releaseLock()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	token, err := generateLaunchToken()
	if err != nil {
		return fmt.Errorf("generate launch token: %w", err)
	}
	handler, store, user, err := buildDesktopHandler(ctx, databasePath, token)
	if err != nil {
		return err
	}
	defer store.Close()
	handler = launchTokenMiddleware(token, user, handler, stop)
	listener, err := listenLocal(port)
	if err != nil {
		return fmt.Errorf("listen on localhost: %w", err)
	}
	selectedPort := listener.Addr().(*net.TCPAddr).Port
	server := &http.Server{Handler: handler, ReadHeaderTimeout: 5 * time.Second}
	serveErrors := make(chan error, 1)
	go func() { serveErrors <- server.Serve(listener) }()
	if err := json.NewEncoder(os.Stdout).Encode(readinessMessage{Status: "ready", Host: desktopHost, Port: selectedPort, Token: token, DatabasePath: databasePath}); err != nil {
		server.Close()
		return fmt.Errorf("write readiness message: %w", err)
	}
	select {
	case <-ctx.Done():
	case err = <-serveErrors:
		if err != nil && err != http.ErrServerClosed {
			return fmt.Errorf("serve desktop API: %w", err)
		}
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shut down desktop API: %w", err)
	}
	return nil
}
