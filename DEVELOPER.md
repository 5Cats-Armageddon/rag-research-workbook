# Developer Guide — RAG Research Workbook

This document covers building from source, the release workflow, GitHub Actions, and the project structure. For general usage instructions see [README.md](README.md).

---

## Prerequisites

- macOS 12+ or Windows 10/11
- Node.js 18+
- Git

---

## Running from source

```bash
git clone https://github.com/5Cats-Armageddon/rag-research-workbook.git
cd rag-research-workbook
npm install
npm start
```

---

## Building a distributable app

**macOS:**
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build
```
Output: `dist/mac-arm64/` (Apple Silicon) or `dist/mac-x64/` (Intel)
Drag `RAG Research Workbook.app` to `/Applications`.

**Windows:**
```bash
npm run build:win
```
Output: `dist/` — NSIS installer (`.exe`) and portable `.exe` for both x64 and ARM64.

**Both platforms at once:**
```bash
npm run build:all
```
Note: cross-platform builds require either running on each platform separately or using GitHub Actions (see below).

---

## Release workflow

### Bump the version

Update `"version"` in `package.json` to the new version number, e.g. `"1.3.0"`.

### Commit, tag, and push

```bash
git add .
git commit -m "v1.3.0 — description of changes"
git tag v1.3.0
git push origin main && git push --tags
```

Pushing the tag automatically triggers the GitHub Actions build (see below).

### Add release notes

Go to the repository's Releases page on GitHub, find the new release, click **Edit**, and add your release notes.

---

## GitHub Actions

The workflow file at `.github/workflows/build.yml` runs automatically on every `v*` tag push.

**What it does:**
1. Builds the macOS `.dmg` and `.zip` on a macOS runner
2. Builds the Windows NSIS installer and portable `.exe` on a Windows runner (both x64 and ARM64)
3. Creates a GitHub Release and attaches all four files

**No setup required** — the workflow uses the built-in `GITHUB_TOKEN` that GitHub provides automatically. You never need a Windows machine to produce Windows builds.

**Monitoring builds:**
Go to the **Actions** tab on GitHub to watch the build progress. The full build takes approximately 5–10 minutes.

**If a build fails:**
Click into the failed job in the Actions tab to see the full error log. Common issues and fixes are noted below.

---

## In-app updater (Option B)

The app includes a built-in updater that pulls the latest source, builds, and installs automatically.

**One-time setup in app Settings:**
- **GitHub username** — your GitHub handle
- **Repository name** — e.g. `rag-research-workbook`
- **Local repo path** — the folder on your machine containing `package.json`

**How it works when triggered:**
- Mac: `git pull` → `npm install` → `npm run build` → copies `.app` to `/Applications`
- Windows: `git pull` → `npm install` → `npm run build:win` → opens the new NSIS installer

**Switching to Option A (electron-updater):**
For fully automatic background updates without requiring a local source clone:
1. `npm install electron-updater`
2. In `src/main.js`, uncomment the Option A block at the bottom
3. Set `useAutoUpdater: true` in app settings
4. `electron-builder` will generate the required `latest-mac.yml` and `latest.yml` automatically on build

---

## Project structure

```
rag-research-workbook/
├── package.json                    # version, build config, dependencies
├── README.md                       # user-facing documentation
├── DEVELOPER.md                    # this file
├── .github/
│   └── workflows/
│       └── build.yml               # GitHub Actions: auto-build Mac + Windows on tag push
├── src/
│   ├── main.js                     # Electron main process — file I/O, TTS, IPC, menus
│   ├── preload.js                  # Secure contextBridge between main and renderer
│   └── index.html                  # Full UI — chat, podcast, settings, modals
└── assets/
    ├── icon.icns                   # macOS app icon (replace with your own)
    └── icon.ico                    # Windows app icon (replace with your own)
```

---

## Adding a custom app icon

**macOS:** Replace `assets/icon.icns` with your own `.icns` file. You can create one from a PNG using:
```bash
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

**Windows:** Replace `assets/icon.ico` with your own `.ico` file. Tools like https://convertico.com can convert a PNG to `.ico`.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `electron` | App framework |
| `electron-builder` | Packaging and distribution |
| `mammoth` | DOCX/DOC text extraction |
| `officeparser` | PPTX/PPT text extraction |
| `pdf-parse` | PDF text extraction |
| `xlsx` | XLSX/XLS/CSV parsing |

---

## Troubleshooting builds

**"author is missed in the package.json"**
Add `"author": "your-name"` to `package.json`. This is a warning, not an error.

**Windows build fails with 403 on GitHub release creation**
Make sure `"publish": null` is set in the `build` section of `package.json`. The workflow handles release creation — `electron-builder` should not attempt to publish.

**macOS build says "code signing failed"**
Make sure `CSC_IDENTITY_AUTO_DISCOVERY=false` is set when building without a developer certificate. This is already set in the `build` npm script.

**git pull fails during in-app update**
You may have uncommitted local changes. In Terminal:
```bash
cd ~/path/to/rag-research-workbook
git stash
git pull
```
