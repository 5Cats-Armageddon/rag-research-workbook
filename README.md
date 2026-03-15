# RAG Research Workbook v1.2.4

A research assistant for macOS and Windows. Organize your sources into projects, chat with an AI that answers strictly from your sources, and generate podcasts — all with optional cloud sync.

> **Built with AI** — This application was designed and built in collaboration with [Claude](https://claude.ai) (Anthropic). See [CREDITS.md](CREDITS.md) for details.

---

## Installation

### macOS

1. Go to the [Releases page](https://github.com/5Cats-Armageddon/rag-research-workbook/releases) and download the latest **`.dmg`** file
2. Open the `.dmg` file
3. Drag **RAG Research Workbook** into your **Applications** folder
4. Open it from Applications or Launchpad

> **"Unidentified developer" warning?** Right-click the app → **Open** → **Open anyway**. This only appears once. It happens because the app isn't code-signed with an Apple developer certificate.

### Windows

1. Go to the [Releases page](https://github.com/5Cats-Armageddon/rag-research-workbook/releases) and download the latest **`RAG Research Workbook Setup x.x.x.exe`**
2. Run the installer and follow the setup wizard
3. The app will be added to your Start Menu and optionally your Desktop

> **Windows Defender warning?** Click **More info** → **Run anyway**. This appears because the app isn't code-signed. It's safe to proceed.

**Prefer no installation?** Download the portable **`RAG Research Workbook x.x.x.exe`** instead — just run it directly, no installation needed.

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
| PowerPoint | `.pptx`, `.ppt` |
| HTML | `.html`, `.htm` |
| Plain text | `.txt`, `.md` |
| Web URL | via the From URL tab |

> **Audio and video files are not supported.** To use audio or video content, transcribe it with another tool and paste the transcript as a text source.

---

## Cloud sync

Open **Settings → Cloud sync** to automatically back up your projects and sources to a cloud folder.

| Service | Mac | Windows |
|---------|:---:|:-------:|
| iCloud Drive | ✓ | ✗ |
| Dropbox | ✓ | ✓ |
| Google Drive | ✓ | ✓ |
| OneDrive | ✓ | ✓ |
| Custom folder | ✓ | ✓ |

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

---

## Troubleshooting

**The app won't open on macOS ("unidentified developer")**
Right-click the app → Open → Open anyway. You only need to do this once.

**The app won't open on macOS ("app is damaged")**
Open Terminal and run:
```
xattr -cr "/Applications/RAG Research Workbook.app"
```
Then try opening again.

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

---

## Run in Claude.ai (no installation required)

RAG Research Workbook can also run directly inside Claude.ai — no download, no install, no API key. It uses your existing Claude.ai subscription automatically.

See [CLAUDE_AI.md](CLAUDE_AI.md) for three ways to use it:
- **Shareable prompt** — paste one prompt into any Claude.ai conversation
- **Claude.ai Project** — set up a persistent workspace shared with others
- **Artifact sharing** — share a direct link to the rendered app

---

## For developers

See [DEVELOPER.md](DEVELOPER.md) for instructions on building from source, contributing, setting up GitHub Actions, and release workflow.
