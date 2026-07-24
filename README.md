
# Inventory Management

  This is a code bundle for Home Inventory Dashboard Design. The original project is available at https://www.figma.com/design/oBWxJcbvQDKpogBLI94kEI/Home-Inventory-Dashboard-Design.

## Hosted web development

From `frontend`, install dependencies and run the explicit web target:

```powershell
npm install
npm run dev:web
npm run build:web
```

The hosted build sets `VITE_APP_TARGET=web` through `.env.web`, uses `VITE_API_URL` (default:
`http://localhost:8080`), and remains independent of Tauri. Configure desktop installers in `.env.web`
or the deployment environment:

```env
VITE_DOWNLOAD_WINDOWS_URL=
VITE_DOWNLOAD_MACOS_URL=
VITE_DOWNLOAD_LINUX_URL=
```

Only configured platforms appear on `/download`; with no URLs, the page displays a coming-soon state.

For GitHub Releases, the stable Windows URL format is:

```text
https://github.com/DoubleAWsmile/InventoryManagementApp/releases/latest/download/InventoryManagementApp-Windows-Setup.exe
```

Set that value as `VITE_DOWNLOAD_WINDOWS_URL` in the hosted deployment only after the first stable
release is published and the link has been verified. Leave the macOS and Linux variables empty until
real installers for those platforms exist.

## Desktop development

Install Go and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/), including Rust. Then run these commands from `frontend`:

```powershell
npm run desktop:sidecar  # build only the Go sidecar
npm run dev:desktop      # build the sidecar and run Tauri development mode
npm run build:desktop    # build the sidecar and production desktop bundles
```

Both desktop commands build Vite with `.env.desktop`, which sets `VITE_APP_TARGET=desktop`.

`desktop:sidecar` reads the active Rust host target triple and builds `backend/cmd/desktop-api` as `frontend/src-tauri/binaries/desktop-api-<target-triple>[.exe]`, which is the naming Tauri v2 requires. Set `TAURI_ENV_TARGET_TRIPLE` when building for a different configured target. Cross-platform release builds must run on, or be configured for, each target OS; the script does not install Go/Rust cross-compilers.

The Rust shell owns one sidecar process for the full application lifecycle. It validates the sidecar's first stdout line, keeps its bearer token only in memory, and exposes only `{ baseUrl, token }` through `get_desktop_backend_config`. React reloads only query that state and cannot launch commands. On exit, Rust requests the authenticated desktop-only shutdown endpoint and then retains a force-kill fallback so an orphan cannot remain.

The desktop SQLite database uses the platform data directory selected by the Go command. It persists across app restarts. The database path is never returned to the webview.

## Typography

Both targets self-host Figtree for application UI and Instrument Serif for intentional display
headings through OFL-licensed Fontsource packages. No font CDN is required, so the packaged desktop
app renders these fonts offline. Supported bundled cuts are:

- Figtree 400 normal and italic
- Figtree 500, 600, and 700 normal
- Instrument Serif 400 normal

Tailwind `font-sans`, the document root, and form controls all use `--font-ui`. Tailwind
`font-serif` and the `font-display` utility use `--font-display`. Monospace debug/version text retains
the platform monospace stack.

During development, open Chromium or WebView2 developer tools, inspect a text node, and use the
**Computed → Rendered Fonts** panel to confirm the actual face and source. Check representative normal,
medium, semibold, bold, italic, and `font-display` elements. No production diagnostic panel is added.

## Checks

```powershell
cd backend
go test ./...

cd ../frontend
npm test
npm run build:web
npm run desktop:sidecar
cargo check --manifest-path src-tauri/Cargo.toml
```

## Publishing a Windows desktop release

Desktop releases are built by `.github/workflows/desktop-release.yml` on `windows-latest`. Installers
are currently unsigned and can trigger Windows trust or SmartScreen warnings. The workflow contains no
certificates or signing secrets; code signing can be added later without changing the release naming.

1. Update the same version in:
   - `frontend/package.json` (and its lockfile)
   - `frontend/src-tauri/Cargo.toml`
   - `frontend/src-tauri/tauri.conf.json`
2. Run local validation:

   ```powershell
   cd backend
   go test ./...
   cd ../frontend
   npm test
   npm run build:web
   npm run build:desktop
   cargo check --manifest-path src-tauri/Cargo.toml
   npm run release:validate -- --tag v0.1.0
   ```

3. Commit and push the version changes.
4. Create and push a matching tag:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

5. Confirm the **Desktop release** GitHub Actions workflow succeeds.
6. Verify the release contains the versioned MSI, versioned NSIS installer, and
   `InventoryManagementApp-Windows-Setup.exe`.
7. Test the stable `/releases/latest/download/` Windows URL.
8. Configure the hosted website’s `VITE_DOWNLOAD_WINDOWS_URL` and verify `/download`.

Tags such as `v1.0.0-alpha.1`, `v1.0.0-beta.1`, and `v1.0.0-rc.1` are published as GitHub
prereleases. GitHub’s `releases/latest` URL continues to resolve to the latest stable release.
Manual workflow dispatch builds and validates an existing tag without publishing by default; select
`publish` explicitly to create or update its release. No workflow changes or tags are pushed
automatically.
  
