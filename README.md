# NotebookAI v1.1.0

A native macOS research assistant. Organise sources into projects, chat with strict source grounding, sync to iCloud/Dropbox/Google Drive/OneDrive, and run entirely free with local Ollama models.

---

## Quick Start

### Prerequisites
- macOS 12 or later
- Node.js 18+

### Run from source

```bash
cd notebookai-app
npm install
npm start
```

### Build a distributable .app

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build
```

Drag `dist/mac/NotebookAI.app` to `/Applications`.

If macOS says "unidentified developer": right-click → Open → Open anyway.

---

## AI Provider: Free (Ollama) vs Paid (Anthropic)

Open **Settings (⌘,) → AI Provider** to toggle between providers.

### Ollama — completely free, runs locally

1. Install Ollama: https://ollama.com
2. Pull a model:
   ```bash
   ollama pull llama3        # recommended — good quality, ~4GB
   ollama pull mistral       # smaller, faster
   ollama pull llama3:70b    # highest quality, needs 40GB+ RAM
   ```
3. Start Ollama (it may already be running):
   ```bash
   ollama serve
   ```
4. In Settings, select **Ollama**, choose your model, click Save.

The green 🦙 badge in the title bar confirms Ollama is active.

### Anthropic — Claude Sonnet 4, paid per use

Get an API key at https://console.anthropic.com/settings/keys and paste it in Settings.
Typical cost: ~$0.01–$0.05 per research session.

**Note:** URL fetching has two modes:
- **Native (free)** — uses Node.js directly, no API key needed. Works for most articles, blogs, and documentation pages.
- **AI-assisted** — uses the Anthropic web_search tool for better extraction on complex pages. Requires an Anthropic API key.

---

## Updates (Option B — build on device)

### One-time setup

1. Push your source to GitHub (or fork from the original repo)
2. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ~/code/notebookai-app
   ```
3. In Settings, fill in:
   - **GitHub username** — your GitHub handle
   - **Repository name** — the repo name
   - **Local repo path** — e.g. `~/code/notebookai-app`

### Updating

Click **Check for update** in the left rail (or NotebookAI menu → Check for Updates…).

The app will:
1. Check GitHub for a newer version tag
2. Show you what's available
3. On clicking "Install update": `git pull` → `npm install` → `npm run build` → copy to `/Applications`

You'll see a live terminal log of the process. After it finishes, quit and reopen the app.

### Publishing a new version

```bash
# Bump version in package.json, then:
git add . && git commit -m "v1.2.0"
git tag v1.2.0
git push && git push --tags
```

The app checks the latest GitHub release tag against the version in its own `package.json`.

### Switching to Option A (electron-updater) later

When you're ready for fully automatic background updates:
1. `npm install electron-updater`
2. In `src/main.js`, uncomment the Option A block at the bottom
3. Set `useAutoUpdater: true` in settings
4. Build and publish releases to GitHub with `electron-builder` — it generates the required `latest-mac.yml` automatically

---

## Cloud Sync

Open **Settings → Cloud sync** and pick your service:

| Service | Requirement |
|---------|-------------|
| iCloud Drive | iCloud Drive enabled in System Settings |
| Dropbox | Dropbox desktop app installed |
| Google Drive | Google Drive for Desktop installed |
| OneDrive | OneDrive macOS app installed |
| Custom path | Any folder, NAS, or external drive |

With **Auto-sync** on, data is written on every change. The sync dot (●) in the title bar shows status.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New project | ⌘N |
| Add source | ⌘⇧A |
| Sync now | ⌘S |
| Settings | ⌘, |
| Export current chat | ⌘⇧E |
| Toggle dark mode | ⌘⇧D |
| Send message | ↵ |
| New line | ⇧↵ |

---

## Project Structure

```
notebookai-app/
├── package.json      # version, build config
├── src/
│   ├── main.js       # Electron main process (Node.js, file I/O, shell commands)
│   ├── preload.js    # Secure IPC bridge
│   └── index.html    # Full UI
└── assets/           # App icon (add icon.icns for custom icon)
```

---

## Troubleshooting

**Ollama not detected in Settings**
Make sure Ollama is running: `ollama serve`
Check the host field matches — default is `http://localhost:11434`

**"App is damaged" on macOS**
```bash
xattr -cr /Applications/NotebookAI.app
```

**Update fails with "Repo path not found"**
Make sure the path in Settings points to the folder containing `package.json`, not a parent folder.

**git pull fails during update**
You may have uncommitted local changes. In Terminal: `cd ~/code/notebookai-app && git stash && git pull`
