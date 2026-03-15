# RAG Research Workbook v1.2.0

A native macOS research assistant. Organize sources into projects, chat with strict source grounding, generate podcasts from your sources, and sync to iCloud/Dropbox/Google Drive/OneDrive. Runs entirely free with local Ollama models.

---

## Quick Start

### Prerequisites
- macOS 12 or later
- Node.js 18+

### Run from source

```bash
cd rag-research-workbook
npm install
npm start
```

### Build a distributable .app

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build
```

The app is built to `dist/mac-arm64/` (Apple Silicon) or `dist/mac-x64/` (Intel). Drag `RAG Research Workbook.app` to `/Applications`.

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

## Podcast

The Podcast tab generates a listenable podcast from your active sources. Click the **Podcast** tab at the top of the main panel, or use the 🎙️ quick action button in Chat.

### Generating a script

1. Make sure at least one source is active (toggled on) in the sidebar
2. Choose a **format**: two-host discussion/debate, or single narrator summary
3. Set a **target length** (2–20 minutes) and **tone/style**
4. Click **Generate script** — the script is grounded strictly in your sources
5. Review and edit each line directly in the panel before generating audio

### Generating audio

Click **Generate audio** after the script is ready. The app uses one of two methods depending on your settings:

#### ElevenLabs — high-quality AI voices (recommended)

ElevenLabs produces natural-sounding AI voices with distinct voices for each host.

**Setup:**
1. Create a free account at https://elevenlabs.io
2. Go to your profile → API Keys → Create API Key
3. Set permissions: **Text to Speech → Access**, **Voices → Read**. Leave Sound Effects and Audio Isolation as No Access. Leave the Restrict Key toggle off.
4. Copy the key and paste it into **Settings (⌘,) → Podcast — ElevenLabs voices**

**Free tier:** 10,000 characters (~10 minutes of audio) per month. Sufficient for regular use.

Output format: **MP3** (exportable via the Save audio button)

#### macOS built-in TTS — free fallback

If no ElevenLabs key is set, the app uses macOS's built-in `say` command. Single voice only, lower quality, but completely free with no setup.

Output format: **AIFF** (exportable via the Save audio button)

### Exporting

- **Export script** — saves the script as `.txt` or `.md` for use in Descript, Podcastle, or any other tool
- **Save audio** — saves the generated audio as MP3 (ElevenLabs) or AIFF (macOS TTS)

---

## Supported source formats

| Format | Extension(s) | Notes |
|--------|-------------|-------|
| PDF | `.pdf` | Text-based PDFs only. Scanned image PDFs will show an error — paste the text manually instead. |
| Word | `.docx`, `.doc` | Full document text extracted |
| Excel | `.xlsx`, `.xls`, `.csv` | All sheets extracted, labelled by sheet name |
| PowerPoint | `.pptx`, `.ppt` | Slide text extracted in order |
| HTML | `.html`, `.htm` | Navigation, scripts, and ads stripped |
| Plain text | `.txt`, `.md` | Loaded as-is |
| Web URL | — | Native (free) or AI-assisted fetch |
| Pasted text | — | Paste directly into the text tab |

**Audio and video files are not supported.** To use audio/video content, transcribe it externally and paste the transcript as a text source.

---

## Updates (Option B — build on device)

### One-time setup

1. Push your source to GitHub (or fork from the original repo)
2. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ~/code/rag-research-workbook
   ```
3. In Settings, fill in:
   - **GitHub username** — your GitHub handle
   - **Repository name** — the repo name
   - **Local repo path** — e.g. `~/code/rag-research-workbook`

### Updating

Click **Check for update** in the left rail (or RAG Research Workbook menu → Check for Updates…).

The app will:
1. Check GitHub for a newer version tag
2. Show you what's available
3. On clicking "Install update": `git pull` → `npm install` → `npm run build` → copy to `/Applications`

You'll see a live terminal log of the process. After it finishes, quit and reopen the app.

### Publishing a new version

```bash
# Bump version in package.json, then:
git add . && git commit -m "v1.3.0"
git tag v1.3.0
git push && git push --tags
```

Then create a release on GitHub for that tag. The app checks the latest GitHub release tag against its own `package.json` version.

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
| New line in message | ⇧↵ |

---

## Project Structure

```
rag-research-workbook/
├── package.json      # version, build config, dependencies
├── src/
│   ├── main.js       # Electron main process (Node.js, file I/O, TTS, shell commands)
│   ├── preload.js    # Secure IPC bridge between main and renderer
│   └── index.html    # Full UI (chat, podcast, settings, modals)
└── assets/           # App icon (add icon.icns for a custom icon)
```

---

## Troubleshooting

**Ollama not detected in Settings**
Make sure Ollama is running: `ollama serve`
Check the host field matches — default is `http://localhost:11434`

**ElevenLabs voices not loading**
Check your API key in Settings. Make sure the key has Text to Speech → Access and Voices → Read permissions. The Restrict Key toggle should be off.

**ElevenLabs audio generation stops mid-script**
You may have hit your monthly character limit (10,000 on the free tier). Lines generated before the limit was hit are still valid.

**macOS TTS produces no audio**
Try running `say "hello"` in Terminal to confirm TTS is working on your system.

**PDF shows "no text found"**
The PDF is likely a scanned image rather than a text-based PDF. Copy and paste the text manually, or use an OCR tool first.

**"App is damaged" on macOS**
```bash
xattr -cr "/Applications/RAG Research Workbook.app"
```

**Update fails with "Repo path not found"**
Make sure the path in Settings points to the folder containing `package.json`, not a parent folder.

**git pull fails during update**
You may have uncommitted local changes. In Terminal:
```bash
cd ~/code/rag-research-workbook && git stash && git pull
```

