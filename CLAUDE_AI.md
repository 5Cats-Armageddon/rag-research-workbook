# Running RAG Research Workbook in Claude.ai

RAG Research Workbook can run directly inside [Claude.ai](https://claude.ai) as an interactive artifact — no download, no installation, no API key required. It uses your existing Claude.ai subscription automatically.

There are three ways to use it.

---

## Option 1 — Shareable prompt (easiest)

Copy the prompt below and paste it into any Claude.ai conversation. Claude will render the full app as an interactive artifact in the chat window.

```
Please render the full RAG Research Workbook application as an interactive HTML artifact. This is a research assistant with the following features:

- A three-panel layout: projects rail (left), sources sidebar (center-left), main chat area (center-right)
- Projects: create, rename, duplicate, delete projects — each with its own sources and chat history
- Sources: add via paste text, URL fetch (using web_search tool), or file upload (PDF, DOCX, XLSX, PPTX, HTML, TXT, MD)
- Chat: strict source grounding — answers only from active sources, cites sources inline, flags out-of-scope questions with NOT_IN_SOURCES
- Podcast tab: generate a two-host or single-narrator podcast script from sources, with browser TTS playback
- Quick actions: Summarize, Key themes, Open questions, Compare arguments
- Export: chat as Markdown, projects as JSON, podcast script as text
- Dark mode toggle
- All data persisted in localStorage

Use the Anthropic API (available via claude.ai's built-in authentication — no API key needed in this environment). Model: claude-sonnet-4-20250514. Apply strict source grounding in the system prompt.

Design: clean, minimal, warm off-white background (#f7f6f3), DM Sans font, accent color #2d5be3. Three-column layout with proper dark mode support.
```

### Tips for best results
- Use **Claude Sonnet** or **Claude Opus** for the most complete rendering
- If the artifact is cut off, ask Claude to "continue the artifact" or "complete the JavaScript"
- Your projects and sources are saved in your browser's localStorage and persist across conversations on the same device

---

## Option 2 — Claude.ai Project (persistent, shareable workspace)

A Claude.ai Project lets you set a persistent system prompt so the app is always available when you open that Project — no need to paste the prompt each time. You can also share the Project with others.

### Setup

1. Go to [claude.ai](https://claude.ai) and click **Projects** in the left sidebar
2. Click **Create project**
3. Name it "RAG Research Workbook"
4. Click **Set project instructions** and paste the prompt from Option 1 above
5. Click **Save**

Now every new conversation you start inside this Project will automatically render the app.

### Sharing with others

1. Open your Project settings
2. Click **Share** and set visibility to **Anyone with the link** (requires Claude.ai Team or higher plan for sharing outside your account)
3. Share the Project link — anyone with a Claude.ai account can open it and use the app

---

## Option 3 — Share a Claude.ai artifact link

After rendering the app using Option 1, you can share the artifact directly:

1. In the Claude.ai chat, click the **Share** icon on the artifact panel (top right of the artifact)
2. Click **Publish artifact**
3. Copy the shareable link — anyone can open it in their browser, even without a Claude.ai account

> **Note:** Published artifacts are static snapshots. They won't receive updates when new versions of RAG Research Workbook are released. Re-publish after major updates to share the latest version.

---

## Comparison of options

| | Option 1 | Option 2 | Option 3 |
|--|---------|---------|---------|
| Requires Claude.ai account | Yes | Yes | No (view only) |
| Persistent across sessions | Via localStorage | Yes | N/A (static) |
| Shareable with others | Paste prompt | Project link | Artifact link |
| Always up to date | Paste new prompt | Update project instructions | Re-publish |
| Best for | Personal use | Teams / recurring use | Wide public sharing |

---

## Limitations compared to the desktop app

| Feature | Claude.ai version | Desktop app |
|---------|------------------|-------------|
| AI provider | Claude only (via claude.ai) | Claude, Ollama, or any |
| Cloud sync | localStorage only | iCloud, Dropbox, Google Drive, OneDrive |
| File parsing | PDF, DOCX, XLSX, HTML, TXT, MD | All of the above + PPTX |
| Audio export | Browser TTS (no download) | ElevenLabs MP3 / macOS AIFF |
| Offline use | No | Yes (with Ollama) |
| In-app updater | Not applicable | Yes |

For the full feature set, download the desktop app from the [Releases page](https://github.com/5Cats-Armageddon/rag-research-workbook/releases).
