# RAG Research Workbook v1.2.6

A research assistant for macOS, Windows, and browser. Organize your sources into projects, chat with an AI that answers strictly from your sources, and generate podcasts — all with optional cloud sync.

> **Built with AI** — This application was designed and built in collaboration with [Claude](https://claude.ai) (Anthropic). See [CREDITS.md](CREDITS.md) for details.

---

## Ways to use RAG Research Workbook

| | Desktop app | Browser version | Claude.ai |
|--|------------|----------------|-----------|
| Installation | Download & install | None | None |
| Requires | macOS or Windows | Any modern browser | Claude.ai account |
| AI provider | Anthropic or Ollama | Anthropic API key | Built-in (your subscription) |
| Cloud sync | iCloud, Dropbox, Drive, OneDrive | Google Drive (optional) | localStorage only |
| Works offline | Yes (with Ollama) | No | No |
| Podcast audio export | MP3 / AIFF / WAV | MP3 (ElevenLabs) | Browser playback only |

---

## Installation — Desktop app

### macOS

1. Go to the [Releases page](https://github.com/5Cats-Armageddon/rag-research-workbook/releases) and download the latest **`.dmg`** file
2. Open the `.dmg` file
3. Drag **RAG Research Workbook** into your **Applications** folder
4. Open it from Applications or Launchpad

> **Note:** Starting with v1.2.4, the app is properly signed and notarized by Apple — it should open without any warnings. If you're on an older version and see a warning, right-click the app → **Open** → **Open anyway**.

### Windows

1. Go to the [Releases page](https://github.com/5Cats-Armageddon/rag-research-workbook/releases) and download the latest **`RAG Research Workbook Setup x.x.x.exe`**
2. Run the installer and follow the setup wizard
3. The app will be added to your Start Menu and optionally your Desktop

> **Windows Defender warning?** Click **More info** → **Run anyway**. This appears because the app isn't code-signed. It's safe to proceed.

**Prefer no installation?** Download the portable **`RAG Research Workbook x.x.x.exe`** instead — just run it directly, no installation needed.

---

## Browser version (no installation required)

The full app runs in any modern browser — no download, no installation, no account needed beyond an Anthropic API key or Ollama running locally.

**Open it here:** **https://5cats-armageddon.github.io/rag-research-workbook/**

The browser version includes all projects, sources, chat, and podcast features with localStorage for automatic data persistence, export/import JSON for manual backup, and optional Google Drive sync.

**Limitations vs the desktop app:**
- Requires an Anthropic API key or Ollama (no built-in AI)
- No iCloud, Dropbox, or OneDrive sync (localStorage + Google Drive only)
- PPTX files not supported (all other formats work)
- Podcast audio plays in browser but requires ElevenLabs for MP3 download

---

## Claude.ai version (no installation, no API key)

RAG Research Workbook can run directly inside Claude.ai using your existing subscription — no API key, no download, no setup.

**Three ways to use it — see [CLAUDE_AI.md](CLAUDE_AI.md) for full instructions:**

1. **Shareable prompt** — paste one prompt into any Claude.ai conversation and the app renders as an interactive artifact instantly
2. **Claude.ai Project** — set up a persistent workspace so the app is always ready when you open that Project; share it with others
3. **Published artifact** — share a direct link to the rendered app that anyone can open in their browser, even without a Claude.ai account

---

## Getting started

### 1 — Set up your AI provider

Open **Settings** (⌘, on Mac / Ctrl+, on Windows) and choose how you want to power the AI:

**Ollama — free, runs locally on your computer**
- Install Ollama from https://ollama.com
- Open a Terminal (Mac) or Command Prompt (Windows) and run: `ollama pull llama3`
- In Settings, select **Ollama** and choose your model

**Anthropic — Claude Sonnet 4, paid per use (~$0.01–$0.05 per session)**
- Get an API key at https://console.anthropic.com/settings/keys
- Paste it into Settings under **Anthropic API key**

### 2 — Create a project

Click **New project** in the left rail. Give it a name, pick an icon, and optionally add a description.

### 3 — Add sources

Click **Add source** and choose how to add content:

- **Paste text** — copy and paste any text directly
- **From URL** — enter a web address to fetch the page content
- **Upload file** — drag in a PDF, Word doc, Excel spreadsheet, PowerPoint, HTML, or text file

Toggle sources on and off using the circle next to each one. Only active (toggled on) sources are included in your chat.

### 4 — Start chatting

Type a question in the chat box and press Enter. The AI will answer strictly from your active sources — if something isn't covered by your sources, it will tell you rather than guessing.

Use the quick action buttons for common tasks: Summarize, Key themes, Open questions, Compare.

---

## Podcast

The **Podcast tab** turns your sources into a listenable audio podcast.

1. Switch to the Podcast tab at the top of the main panel
2. Choose a format: **two-host discussion** or **single narrator**
3. Set a target length and tone/style
4. Click **Generate script** — the script is grounded in your sources
5. Review and edit the script if needed
6. Click **Generate audio**

**Audio options:**
- **ElevenLabs** (recommended) — high-quality AI voices, free tier available at https://elevenlabs.io. Add your API key in Settings → Podcast. Outputs MP3.
- **Built-in TTS** — free fallback with no setup required. Uses your system's built-in voice. Outputs AIFF (Mac) or WAV (Windows).

You can export the script as a text file or save the audio as MP3, AIFF, or WAV.

---

## Supported file formats

| Format | Extensions |
|--------|-----------|
| PDF | `.pdf` |
| Word | `.docx`, `.doc` |
| Excel | `.xlsx`, `.xls`, `.csv` |
| PowerPoint | `.pptx`, `.ppt` (desktop app only) |
| HTML | `.html`, `.htm` |
| Plain text | `.txt`, `.md` |
| Web URL | via the From URL tab |

> **Audio and video files are not supported.** To use audio or video content, transcribe it with another tool and paste the transcript as a text source.

---

## Cloud sync

Open **Settings → Cloud sync** to automatically back up your projects and sources to a cloud folder.

| Service | Mac | Windows | Browser |
|---------|:---:|:-------:|:-------:|
| iCloud Drive | ✓ | ✗ | ✗ |
| Dropbox | ✓ | ✓ | ✗ |
| Google Drive | ✓ | ✓ | ✓ |
| OneDrive | ✓ | ✓ | ✗ |
| Custom folder | ✓ | ✓ | ✗ |
| localStorage | — | — | ✓ |

With **Auto-sync** enabled, your data is saved automatically on every change. You can also sync manually using the **Sync now** button in the left rail.

---

## Keyboard shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| New project | ⌘N | Ctrl+N |
| Add source | ⌘⇧A | Ctrl+Shift+A |
| Sync now | ⌘S | Ctrl+S |
| Settings | ⌘, | Ctrl+, |
| Export chat | ⌘⇧E | Ctrl+Shift+E |
| Toggle dark mode | ⌘⇧D | Ctrl+Shift+D |
| Send message | ↵ | Enter |
| New line | ⇧↵ | Shift+Enter |

---

## Updating the app

Click **Check for update** in the left rail to see if a newer version is available. Download the latest installer from the [Releases page](https://github.com/5Cats-Armageddon/rag-research-workbook/releases) and install it over the existing version.

The browser version at https://5cats-armageddon.github.io/rag-research-workbook/ always serves the latest version automatically — no update needed.

---

## Troubleshooting

**The app won't open on macOS ("unidentified developer" or "app is damaged")**
Download v1.2.4 or later — these versions are properly signed and notarized and open without warnings. If you need to run an older version, open Terminal and run:
```
xattr -cr "/Applications/RAG Research Workbook.app"
```

**Windows Defender blocks the installer**
Click More info → Run anyway. The app is safe — this warning appears because it isn't code-signed.

**Ollama isn't being detected in Settings**
Make sure Ollama is running. On Mac open Terminal and run `ollama serve`. On Windows it runs automatically as a background service after installation — try restarting your computer.

**ElevenLabs voices aren't loading**
Check that your API key is correct and has the right permissions: Text to Speech → Access, Voices → Read. Make sure Restrict Key is turned off.

**ElevenLabs stops generating mid-script**
You may have reached the 10,000 character monthly limit on the free tier. Upgrade your plan or use the built-in TTS fallback.

**A PDF shows "no text found"**
The PDF is likely a scanned image rather than a text-based document. Use an OCR tool to extract the text first, then paste it as a text source.

**My data isn't syncing**
Check that your chosen cloud service app is installed and signed in. Click **Sync now** in the left rail to manually trigger a sync and check the status indicator in the title bar.

**The browser version isn't saving my data**
The browser version uses localStorage which is tied to your specific browser on your specific device. Use Export backup to save a JSON file, or connect Google Drive for cross-device sync.

---

## For developers

See [DEVELOPER.md](DEVELOPER.md) for instructions on building from source, contributing, setting up GitHub Actions, and release workflow.
