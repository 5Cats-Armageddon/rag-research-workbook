const { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// ── Settings store ─────────────────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const defaultDataPath = path.join(userDataPath, 'notebookai_data.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {}
  return {
    apiKey: '',
    aiProvider: 'anthropic',        // 'anthropic' | 'ollama'
    ollamaModel: 'llama3',
    ollamaHost: 'http://localhost:11434',
    cloudService: 'local',
    syncPath: defaultDataPath,
    darkMode: 'system',
    autoSync: true,
    // Option B update fields
    repoPath: '',                    // e.g. ~/code/notebookai-app
    githubOwner: '',                 // your GitHub username
    githubRepo: '',                  // repo name, e.g. notebookai
    // Option A fields (inactive — flip useAutoUpdater: true to activate)
    useAutoUpdater: false
  };
}

function saveSettings(s) {
  try { fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2), 'utf8'); return true; }
  catch (e) { return false; }
}

// ── Cloud folder detection ─────────────────────────────────────────────────
function detectCloudPaths() {
  const home = os.homedir();
  return {
    icloud: path.join(home, 'Library', 'Mobile Documents', 'com~apple~CloudDocs', 'NotebookAI'),
    dropbox: (() => {
      const dbInfo = path.join(home, '.dropbox', 'info.json');
      try {
        if (fs.existsSync(dbInfo)) {
          const info = JSON.parse(fs.readFileSync(dbInfo, 'utf8'));
          const p = (info.personal || info.business || {}).path;
          if (p) return path.join(p, 'NotebookAI');
        }
      } catch(e) {}
      return path.join(home, 'Dropbox', 'NotebookAI');
    })(),
    googledrive: (() => {
      const candidates = [
        path.join(home, 'Google Drive', 'My Drive', 'NotebookAI'),
        path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-' + (process.env.USER || '') + '@gmail.com', 'My Drive', 'NotebookAI'),
        '/Volumes/GoogleDrive/My Drive/NotebookAI'
      ];
      for (const c of candidates) {
        try { if (fs.existsSync(path.dirname(path.dirname(c)))) return c; } catch(e) {}
      }
      return candidates[0];
    })(),
    onedrive: (() => {
      const candidates = [
        path.join(home, 'OneDrive', 'NotebookAI'),
        path.join(home, 'Library', 'CloudStorage', 'OneDrive-Personal', 'NotebookAI')
      ];
      for (const c of candidates) {
        try { if (fs.existsSync(path.dirname(c))) return c; } catch(e) {}
      }
      return candidates[0];
    })(),
    local: defaultDataPath
  };
}

// ── Data I/O ───────────────────────────────────────────────────────────────
function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData(syncPath) {
  try {
    const p = syncPath || defaultDataPath;
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch(e) {}
  return { projects: [], activeId: null };
}

function saveData(data, syncPath) {
  try {
    const p = syncPath || defaultDataPath;
    ensureDir(p);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    return { ok: true, path: p };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ── Shell helper — runs a command and streams output to renderer ───────────
function runCommand(cmd, cwd, onData) {
  return new Promise((resolve, reject) => {
    // Extend PATH so npm, git, and node are found regardless of how the app was launched
    const env = {
      ...process.env,
      PATH: [
        process.env.PATH,
        '/usr/local/bin',
        '/opt/homebrew/bin',
        '/opt/homebrew/sbin',
        `${os.homedir()}/.nvm/versions/node/current/bin`
      ].join(':')
    };
    const child = exec(cmd, { cwd, env });
    child.stdout.on('data', d => onData(d.toString()));
    child.stderr.on('data', d => onData(d.toString()));
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Exited with code ${code}`)));
    child.on('error', reject);
  });
}

// ── Native URL fetcher (no API key required) ───────────────────────────────
function fetchUrlNative(targetUrl) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? require('https') : require('http');
      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      };
      const req = mod.get(options, res => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
          res.resume();
          return follow(next, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
          const html = Buffer.concat(chunks).toString('utf8');
          resolve(html);
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timed out')); });
    };
    follow(targetUrl);
  });
}

// Strip HTML to clean readable text
function htmlToText(html, url) {
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : new URL(url).hostname;

  // Remove entire blocks we never want
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Turn block elements into newlines
  text = text
    .replace(/<\/?(p|div|section|article|h[1-6]|li|br|tr|blockquote)[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol|table)[^>]*>/gi, '\n');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&[a-z]+;/gi, ' ');

  // Collapse whitespace — preserve paragraph breaks
  text = text
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0)
    .join('\n');

  // Collapse 3+ consecutive blank-ish lines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return { title, content: text };
}

// ── GitHub release check ───────────────────────────────────────────────────
function fetchLatestRelease(owner, repo) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(
      { hostname: 'api.github.com', path: `/repos/${owner}/${repo}/releases/latest`, headers: { 'User-Agent': 'NotebookAI' } },
      res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
      }
    ).on('error', reject);
  });
}

// ── Window ─────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  const settings = loadSettings();
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 960, minHeight: 640,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    backgroundColor: '#f7f6f3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (settings.darkMode === 'dark') nativeTheme.themeSource = 'dark';
  else if (settings.darkMode === 'light') nativeTheme.themeSource = 'light';
  else nativeTheme.themeSource = 'system';
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  buildMenu();
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── Menu ───────────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'NotebookAI',
      submenu: [
        { label: 'About NotebookAI', role: 'about' },
        { type: 'separator' },
        { label: 'Check for Updates…', click: () => mainWindow.webContents.send('open-updater') },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'Cmd+,', click: () => mainWindow.webContents.send('open-settings') },
        { type: 'separator' },
        { label: 'Hide NotebookAI', role: 'hide' },
        { label: 'Hide Others', role: 'hideOthers' },
        { type: 'separator' },
        { label: 'Quit NotebookAI', role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'Cmd+N', click: () => mainWindow.webContents.send('new-project') },
        { type: 'separator' },
        { label: 'Add Source…', accelerator: 'Cmd+Shift+A', click: () => mainWindow.webContents.send('add-source') },
        { type: 'separator' },
        { label: 'Export Current Chat as Markdown', accelerator: 'Cmd+Shift+E', click: () => mainWindow.webContents.send('export-chat-md') },
        { label: 'Export All Projects as JSON', click: () => mainWindow.webContents.send('export-json') },
        { label: 'Import Projects from JSON…', click: () => mainWindow.webContents.send('import-json') },
        { type: 'separator' },
        { label: 'Sync Now', accelerator: 'Cmd+S', click: () => mainWindow.webContents.send('sync-now') }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Dark Mode', accelerator: 'Cmd+Shift+D', click: () => mainWindow.webContents.send('toggle-dark-mode') },
        { type: 'separator' },
        { label: 'Actual Size', role: 'resetZoom' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { label: 'Toggle DevTools', accelerator: 'Cmd+Alt+I', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'close' }]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC ────────────────────────────────────────────────────────────────────
ipcMain.handle('load-settings', () => loadSettings());
ipcMain.handle('save-settings', (e, s) => {
  const ok = saveSettings(s);
  if (s.darkMode === 'dark') nativeTheme.themeSource = 'dark';
  else if (s.darkMode === 'light') nativeTheme.themeSource = 'light';
  else nativeTheme.themeSource = 'system';
  return ok;
});
ipcMain.handle('detect-cloud-paths', () => detectCloudPaths());
ipcMain.handle('load-data', (e, syncPath) => loadData(syncPath));
ipcMain.handle('save-data', (e, data, syncPath) => saveData(data, syncPath));
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-default-data-path', () => defaultDataPath);
ipcMain.handle('get-dark-mode', () => nativeTheme.shouldUseDarkColors);
ipcMain.handle('path-exists', (e, p) => { try { return fs.existsSync(p); } catch(e) { return false; } });
ipcMain.handle('open-external', (e, url) => shell.openExternal(url));
ipcMain.handle('show-open-dialog', async (e, opts) => dialog.showOpenDialog(mainWindow, opts));
ipcMain.handle('show-save-dialog', async (e, opts) => dialog.showSaveDialog(mainWindow, opts));
ipcMain.handle('write-file', (e, fp, content) => {
  try { ensureDir(fp); fs.writeFileSync(fp, content, 'utf8'); return { ok: true }; }
  catch(err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('read-file', (e, fp) => {
  try { return { ok: true, content: fs.readFileSync(fp, 'utf8') }; }
  catch(err) { return { ok: false, error: err.message }; }
});

// Native URL fetch (no API key)
ipcMain.handle('fetch-url-native', async (e, url) => {
  try {
    const html = await fetchUrlNative(url);
    const { title, content } = htmlToText(html, url);
    if (!content || content.length < 100) {
      return { ok: false, error: 'Page content too short or empty. This page may require JavaScript to render — try the Anthropic method instead.' };
    }
    return { ok: true, title, content };
  } catch(err) {
    return { ok: false, error: err.message };
  }
});

// Check GitHub for latest version
ipcMain.handle('check-for-update', async (e, { owner, repo }) => {
  try {
    const release = await fetchLatestRelease(owner, repo);
    const latest = (release.tag_name || '').replace(/^v/, '');
    const current = app.getVersion();
    return { ok: true, current, latest, hasUpdate: !!latest && latest !== current, release };
  } catch(err) {
    return { ok: false, error: err.message };
  }
});

// Option B: git pull + npm install + npm run build + copy .app
ipcMain.handle('run-update-b', async (e, { repoPath }) => {
  const expanded = repoPath.replace(/^~/, os.homedir());
  if (!fs.existsSync(expanded)) {
    return { ok: false, error: `Repo path not found: ${expanded}\nMake sure you set the correct path in Settings → Updates.` };
  }
  const send = msg => { if (mainWindow) mainWindow.webContents.send('update-log', msg); };
  try {
    send('► git pull\n');
    await runCommand('git pull', expanded, send);
    send('\n► npm install\n');
    await runCommand('npm install', expanded, send);
    send('\n► npm run build\n');
    await runCommand('CSC_IDENTITY_AUTO_DISCOVERY=false npm run build', expanded, send);
    send('\n► Copying NotebookAI.app to /Applications…\n');
    await runCommand('cp -r dist/mac/NotebookAI.app /Applications/NotebookAI.app', expanded, send);
    send('\n✅ Update complete! Quit and reopen the app from /Applications to use the new version.\n');
    return { ok: true };
  } catch(err) {
    send(`\n❌ Error: ${err.message}\n`);
    return { ok: false, error: err.message };
  }
});

// Option A scaffold — uncomment + add electron-updater to deps to activate
// const { autoUpdater } = require('electron-updater');
// app.whenReady().then(() => {
//   const s = loadSettings();
//   if (s.useAutoUpdater && s.githubOwner && s.githubRepo) {
//     autoUpdater.setFeedURL({ provider: 'github', owner: s.githubOwner, repo: s.githubRepo });
//     autoUpdater.checkForUpdatesAndNotify();
//     autoUpdater.on('update-downloaded', () => mainWindow.webContents.send('update-downloaded'));
//   }
// });
// ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());

// Ollama model list helper
ipcMain.handle('list-ollama-models', async (e, host) => {
  const http = require('http');
  const url = new URL('/api/tags', host || 'http://localhost:11434');
  return new Promise(resolve => {
    http.get({ hostname: url.hostname, port: url.port || 11434, path: url.pathname }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ ok: true, models: (data.models || []).map(m => m.name) });
        } catch(e) { resolve({ ok: false, models: [] }); }
      });
    }).on('error', () => resolve({ ok: false, models: [] }));
  });
});

nativeTheme.on('updated', () => {
  if (mainWindow) mainWindow.webContents.send('dark-mode-changed', nativeTheme.shouldUseDarkColors);
});
