# RAG Research Workbook v1.2.1

A native macOS and Windows research assistant. Organize sources into projects, chat with strict source grounding, generate podcasts from your sources, and sync to cloud storage. Runs entirely free with local Ollama models.

---

## Quick Start

### Prerequisites
- macOS 12+ or Windows 10/11
- Node.js 18+

### Run from source

```bash
cd rag-research-workbook
npm install
npm start
```

### Build a distributable app

**macOS:**
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build
```

Output: `dist/mac-arm64/` (Apple Silicon) or `dist/mac-x64/` (Intel)
Drag `RAG Research Workbook.app` to `/Applications`.

If macOS says "unidentified developer": right-click → Open → Open anyway.

**Windows:**
```bash
npm run build:win
```
Output: `dist/` — contains an NSIS installer (`.exe` setup wizard) and a portable `.exe`.
Run the installer, or launch the portable version directly.

**Both platforms at once** (must run on the platform you want to build for, or use GitHub Actions — see below):
```bash
npm run build:all
```

---

## Automated builds with GitHub Actions

The included `.github/workflows/build.yml` workflow automatically builds for both Mac and Windows and attaches the binaries to a GitHub Release whenever you push a version tag.

### Setup (one time)

No extra configuration needed — the workflow uses the built-in `GITHUB_TOKEN` secret that GitHub provides automatically.

### How to trigger a release

```bash
# Bump version in package.json, then:
git add .
git commit -m "v1.3.0"
git tag v1.3.0
git push && git push --tags
```

GitHub Actions will:
1. Build the macOS `.dmg` and `.zip` on a macOS runner
2. Build the Windows NSIS installer and portable `.exe` on a Windows runner
3. Create a GitHub Release and attach all four files

This means you never need a Windows machine to produce Windows builds — GitHub handles it.

---

## AI Provider: Free (Ollama) vs Paid (Anthropic)

Open **Settings → AI Provider** to toggle between providers.

### Ollama — completely free, runs locally

1. Install Ollama: https://ollama.com
2. Pull a model:
   ```bash
   ollama pull llama3        # recommended — good quality, ~4GB
   ollama pull mistral       # smaller, faster
   ollama pull llama3:70b    # highest quality, needs 40GB+ RAM
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```
4. In Settings, select **Ollama**, choose your model, click Save.

### Anthropic — Claude Sonnet 4, paid per use

Get an API key at https://console.anthropic.com/settings/keys and paste it in Settings.
Typical cost: ~$0.01–$0.05 per research session.

**URL fetching modes:**
- **Native (free)** — Node.js direct fetch, no API key needed. Works for most articles and docs.
- **AI-assisted** — Anthropic web_search tool for JavaScript-heavy pages. Requires API key.

---

## Podcast


The Podcast tab generates a listenable podcast from your active sources.

### Generating a script

1. Make sure at least one source is active in the sidebar
2. Choose a **format**: two-host discussion/debate or single narrator summary
3. Set a **target length** (2–20 minutes) and **tone/style**
4. Click **Generate script**
5. Review and edit each line before generating audio

### Generating audio

#### ElevenLabs — high-quality AI voices (recommended)

1. Create a free account at https://elevenlabs.io
2. Go to Profile → API Keys → Create API Key
3. Permissions: **Text to Speech → Access**, **Voices → Read**. Leave all others as No Access. Leave Restrict Key off.
4. Paste the key into **Settings → Podcast — ElevenLabs voices**

Free tier: 10,000 characters (~10 minutes of audio) per month.
Output: **MP3**

#### Built-in system TTS — free fallback

No setup required. Uses macOS `say` command on Mac, or PowerShell `SpeechSynthesizer` on Windows.
Output: **AIFF** (Mac) or **WAV** (Windows)

### Exporting

- **Export script** — saves as `.txt` or `.md`
- **Save audio** — saves MP3, AIFF, or WAV

---

## Supported source formats

| Format | Extension(s) | Notes |
|--------|-------------|-------|
| PDF | `.pdf` | Text-based PDFs only. Scanned image PDFs show an error. |
| Word | `.docx`, `.doc` | Full document text extracted |
| Excel | `.xlsx`, `.xls`, `.csv` | All sheets extracted, labeled by sheet name |
| PowerPoint | `.pptx`, `.ppt` | Slide text extracted in order |
| HTML | `.html`, `.htm` | Navigation, scripts, and ads stripped |
| Plain text | `.txt`, `.md` | Loaded as-is |
| Web URL | — | Native (free) or AI-assisted fetch |
| Pasted text | — | Paste directly into the text tab |

**Audio and video files are not supported.** Transcribe them externally and paste the transcript as a text source.

---

## Cloud Sync

Open **Settings → Cloud sync** and pick your service:

| Service | Mac | Windows | Requirement |
|---------|-----|---------|-------------|
| iCloud Drive | ✓ | ✗ | iCloud Drive enabled in System Settings |
| Dropbox | ✓ | ✓ | Dropbox desktop app installed |
| Google Drive | ✓ | ✓ | Google Drive for Desktop installed |
| OneDrive | ✓ | ✓ | OneDrive app installed (built into Windows) |
| Custom path | ✓ | ✓ | Any folder, NAS, or external drive |
| Local only | ✓ | ✓ | No sync, stored in app data folder |

With **Auto-sync** on, data is written on every change.

---

## Updates (Option B — build on device)

### One-time setup

1. Clone the repo locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```
2. In Settings, fill in:
   - **GitHub username**
   - **Repository name**
   - **Local repo path** — the folder containing `package.json`

### How it works

Click **Check for update** in the left rail.

- **Mac:** `git pull` → `npm install` → `npm run build` → copies `.app` to `/Applications`
- **Windows:** `git pull` → `npm install` → `npm run build:win` → opens the new installer automatically

### Using GitHub Actions instead (recommended for Windows users)

If you don't want to build locally, push a new tag to GitHub and the Actions workflow builds both platforms automatically. Download the installer from the GitHub Releases page.

---

## Keyboard Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| New project | ⌘N | Ctrl+N |
| Add source | ⌘⇧A | Ctrl+Shift+A |
| Sync now | ⌘S | Ctrl+S |
| Settings | ⌘, | Ctrl+, |
| Export current chat | ⌘⇧E | Ctrl+Shift+E |
| Toggle dark mode | ⌘⇧D | Ctrl+Shift+D |
| Send message | ↵ | Enter |
| New line in message | ⇧↵ | Shift+Enter |

---

## Project Structure

```
rag-research-workbook/
├── package.json                    # version, build config, dependencies
├── .github/
│   └── workflows/
│       └── build.yml               # GitHub Actions: auto-build Mac + Windows on tag
├── src/
│   ├── main.js                     # Electron main process (cross-platform)
│   ├── preload.js                  # Secure IPC bridge
│   └── index.html                  # Full UI
└── assets/
    ├── icon.icns                   # macOS app icon (add your own)
    └── icon.ico                    # Windows app icon (add your own)
```

---

## Troubleshooting

**Ollama not detected in Settings**
Make sure Ollama is running: `ollama serve`
Default host: `http://localhost:11434`

**ElevenLabs voices not loading**
Check your API key. Permissions needed: Text to Speech → Access, Voices → Read. Restrict Key should be off.

**ElevenLabs generation stops mid-script**
You may have hit the 10,000 character monthly limit on the free tier.

**Built-in TTS produces no audio (Mac)**
Run `say "hello"` in Terminal to confirm TTS is working.

**Built-in TTS produces no audio (Windows)**
Run in PowerShell: `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('hello')`

**PDF shows "no text found"**
The PDF is a scanned image. Use an OCR tool first, or copy and paste the text manually.

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

**Windows Defender blocks the installer**
Click "More info" → "Run anyway". This happens because the app isn't code-signed. It's safe to proceed.

**Update fails with "Repo path not found"**
The path in Settings must point to the folder containing `package.json`.

**git pull fails during update**

```bash
cd ~/path/to/rag-research-workbook
git stash
git pull
```
