const { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const IS_MAC = process.platform === 'darwin';
const IS_WIN = process.platform === 'win32';

// ── Settings store ─────────────────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const defaultDataPath = path.join(userDataPath, 'rag_research_workbook_data.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {}
  return {
    elevenlabsKey: '',
    apiKey: '',
    aiProvider: 'anthropic',
    ollamaModel: 'llama3',
    ollamaHost: 'http://localhost:11434',
    cloudService: 'local',
    syncPath: defaultDataPath,
    darkMode: 'system',
    autoSync: true,
    repoPath: '',
    githubOwner: '',
    githubRepo: '',
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

  if (IS_WIN) {
    // Windows paths
    const user = process.env.USERNAME || process.env.USERPROFILE?.split(path.sep).pop() || 'User';
    const oneDriveEnv = process.env.OneDrive || process.env.OneDriveConsumer;

    // Dropbox: read info.json
    const dbInfoWin = path.join(home, 'AppData', 'Roaming', 'Dropbox', 'info.json');
    let dropboxPath = path.join(home, 'Dropbox', 'RAG Research Workbook');
    try {
      if (fs.existsSync(dbInfoWin)) {
        const info = JSON.parse(fs.readFileSync(dbInfoWin, 'utf8'));
        const p = (info.personal || info.business || {}).path;
        if (p) dropboxPath = path.join(p, 'RAG Research Workbook');
      }
    } catch(e) {}

    // Google Drive: common Windows mount points
    const gdCandidates = [
      path.join(home, 'Google Drive', 'My Drive', 'RAG Research Workbook'),
      path.join('G:', 'My Drive', 'RAG Research Workbook'),
      path.join('H:', 'My Drive', 'RAG Research Workbook')
    ];
    let googleDrivePath = gdCandidates[0];
    for (const c of gdCandidates) {
      try { if (fs.existsSync(path.dirname(path.dirname(c)))) { googleDrivePath = c; break; } } catch(e) {}
    }

    return {
      icloud: null, // iCloud Drive is not available on Windows
      dropbox: dropboxPath,
      googledrive: googleDrivePath,
      onedrive: oneDriveEnv
        ? path.join(oneDriveEnv, 'RAG Research Workbook')
        : path.join(home, 'OneDrive', 'RAG Research Workbook'),
      local: defaultDataPath
    };
  }

  // macOS paths
  return {
    icloud: path.join(home, 'Library', 'Mobile Documents', 'com~apple~CloudDocs', 'RAG Research Workbook'),
    dropbox: (() => {
      const dbInfo = path.join(home, '.dropbox', 'info.json');
      try {
        if (fs.existsSync(dbInfo)) {
          const info = JSON.parse(fs.readFileSync(dbInfo, 'utf8'));
          const p = (info.personal || info.business || {}).path;
          if (p) return path.join(p, 'RAG Research Workbook');
        }
      } catch(e) {}
      return path.join(home, 'Dropbox', 'RAG Research Workbook');
    })(),
    googledrive: (() => {
      const candidates = [
        path.join(home, 'Google Drive', 'My Drive', 'RAG Research Workbook'),
        path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-' + (process.env.USER || '') + '@gmail.com', 'My Drive', 'RAG Research Workbook'),
        '/Volumes/GoogleDrive/My Drive/RAG Research Workbook'
      ];
      for (const c of candidates) {
        try { if (fs.existsSync(path.dirname(path.dirname(c)))) return c; } catch(e) {}
      }
      return candidates[0];
    })(),
    onedrive: (() => {
      const candidates = [
        path.join(home, 'OneDrive', 'RAG Research Workbook'),
        path.join(home, 'Library', 'CloudStorage', 'OneDrive-Personal', 'RAG Research Workbook')
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

// ── Shell helper ───────────────────────────────────────────────────────────
function runCommand(cmd, cwd, onData) {
  return new Promise((resolve, reject) => {
    const extraPaths = IS_WIN
      ? [] // Windows uses PATH as-is; npm/git are typically on PATH after install
      : ['/usr/local/bin', '/opt/homebrew/bin', '/opt/homebrew/sbin', `${os.homedir()}/.nvm/versions/node/current/bin`];

    const env = {
      ...process.env,
      PATH: IS_WIN
        ? process.env.PATH
        : [process.env.PATH, ...extraPaths].join(':')
    };

    const child = exec(cmd, { cwd, env });
    child.stdout.on('data', d => onData(d.toString()));
    child.stderr.on('data', d => onData(d.toString()));
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Exited with code ${code}`)));
    child.on('error', reject);
  });
}

// ── GitHub release check ───────────────────────────────────────────────────
function fetchLatestRelease(owner, repo) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(
      { hostname: 'api.github.com', path: `/repos/${owner}/${repo}/releases/latest`, headers: { 'User-Agent': 'RAG-Research-Workbook' } },
      res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
      }
    ).on('error', reject);
  });
}

// ── Native URL fetcher ─────────────────────────────────────────────────────
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      };
      const req = mod.get(options, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
          res.resume();
          return follow(next, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timed out')); });
    };
    follow(targetUrl);
  });
}

function htmlToText(html, url) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : new URL(url).hostname;
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?(p|div|section|article|h[1-6]|li|br|tr|blockquote)[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol|table)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&[a-z]+;/gi, ' ');
  text = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 0).join('\n');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return { title, content: text };
}

// ── Window ─────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  const settings = loadSettings();

  const winOptions = {
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#f7f6f3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  };

  // macOS: hidden inset title bar with vibrancy
  if (IS_MAC) {
    winOptions.titleBarStyle = 'hiddenInset';
    winOptions.vibrancy = 'sidebar';
  }

  // Windows: standard title bar, custom icon
  if (IS_WIN) {
    winOptions.frame = true;
    winOptions.autoHideMenuBar = false;
    if (fs.existsSync(path.join(__dirname, '..', 'assets', 'icon.ico'))) {
      winOptions.icon = path.join(__dirname, '..', 'assets', 'icon.ico');
    }
  }

  mainWindow = new BrowserWindow(winOptions);

  if (settings.darkMode === 'dark') nativeTheme.themeSource = 'dark';
  else if (settings.darkMode === 'light') nativeTheme.themeSource = 'light';
  else nativeTheme.themeSource = 'system';

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  buildMenu();
}

app.whenReady().then(() => {
  createWindow();

  // Custom About panel
  if (IS_MAC) {
    app.setAboutPanelOptions({
      applicationName: 'RAG Research Workbook',
      applicationVersion: app.getVersion(),
      version: '',
      copyright: '© 2025 — AI-powered research assistant'
    });
  }
});
app.on('window-all-closed', () => { if (!IS_MAC) app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── Menu ───────────────────────────────────────────────────────────────────
function buildMenu() {
  const appMenuLabel = IS_MAC ? 'RAG Research Workbook' : 'File';

  const template = [
    ...(IS_MAC ? [{
      label: 'RAG Research Workbook',
      submenu: [
        { label: 'About RAG Research Workbook', role: 'about' },
        { type: 'separator' },
        { label: 'Check for Updates…', click: () => mainWindow.webContents.send('open-updater') },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'Cmd+,', click: () => mainWindow.webContents.send('open-settings') },
        { type: 'separator' },
        { label: 'Hide RAG Research Workbook', role: 'hide' },
        { label: 'Hide Others', role: 'hideOthers' },
        { type: 'separator' },
        { label: 'Quit RAG Research Workbook', role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: IS_MAC ? 'Cmd+N' : 'Ctrl+N', click: () => mainWindow.webContents.send('new-project') },
        { type: 'separator' },
        { label: 'Add Source…', accelerator: IS_MAC ? 'Cmd+Shift+A' : 'Ctrl+Shift+A', click: () => mainWindow.webContents.send('add-source') },
        { type: 'separator' },
        { label: 'Export Current Chat as Markdown', accelerator: IS_MAC ? 'Cmd+Shift+E' : 'Ctrl+Shift+E', click: () => mainWindow.webContents.send('export-chat-md') },
        { label: 'Export All Projects as JSON', click: () => mainWindow.webContents.send('export-json') },
        { label: 'Import Projects from JSON…', click: () => mainWindow.webContents.send('import-json') },
        { type: 'separator' },
        { label: 'Sync Now', accelerator: IS_MAC ? 'Cmd+S' : 'Ctrl+S', click: () => mainWindow.webContents.send('sync-now') },
        ...(!IS_MAC ? [
          { type: 'separator' },
          { label: 'Check for Updates…', click: () => mainWindow.webContents.send('open-updater') },
          { label: 'Settings…', accelerator: 'Ctrl+,', click: () => mainWindow.webContents.send('open-settings') },
          { type: 'separator' },
          { label: 'Exit', role: 'quit' }
        ] : [])
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
        { label: 'Toggle Dark Mode', accelerator: IS_MAC ? 'Cmd+Shift+D' : 'Ctrl+Shift+D', click: () => mainWindow.webContents.send('toggle-dark-mode') },
        { type: 'separator' },
        { label: 'Actual Size', role: 'resetZoom' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { label: 'Toggle DevTools', accelerator: IS_MAC ? 'Cmd+Alt+I' : 'Ctrl+Shift+I', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, ...(IS_MAC ? [{ role: 'close' }] : [])]
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
ipcMain.handle('get-platform', () => process.platform);
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
ipcMain.handle('write-file-base64', (e, fp, b64) => {
  try { ensureDir(fp); fs.writeFileSync(fp, Buffer.from(b64, 'base64')); return { ok: true }; }
  catch(err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('copy-tts-file', (e, src, dest) => {
  try { fs.copyFileSync(src, dest); return { ok: true }; }
  catch(err) { return { ok: false, error: err.message }; }
});

// ── TTS ────────────────────────────────────────────────────────────────────
ipcMain.handle('tts', async (e, text) => {
  const tmpFile = path.join(os.tmpdir(), `rrw_tts_${Date.now()}.${IS_MAC ? 'aiff' : 'wav'}`);

  if (IS_MAC) {
    // macOS: use `say` command
    const escaped = text.replace(/'/g, "'\\''");
    return new Promise(resolve => {
      exec(`say -o '${tmpFile}' '${escaped}'`, err => {
        if (err) { resolve({ ok: false, error: err.message }); return; }
        resolve({ ok: true, filePath: tmpFile, fileUrl: `file://${tmpFile}`, format: 'aiff' });
      });
    });
  }

  if (IS_WIN) {
    // Windows: use PowerShell SpeechSynthesizer
    const escaped = text.replace(/"/g, '`"').replace(/'/g, "''");
    const ps = `
Add-Type -AssemblyName System.Speech;
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$s.SetOutputToWaveFile('${tmpFile.replace(/\\/g, '\\\\')}');
$s.Speak('${escaped}');
$s.Dispose();
`.trim();
    const psCmd = `powershell -NoProfile -Command "${ps.replace(/\n/g, ' ')}"`;
    return new Promise(resolve => {
      exec(psCmd, err => {
        if (err) { resolve({ ok: false, error: err.message }); return; }
        resolve({ ok: true, filePath: tmpFile, fileUrl: `file://${tmpFile.replace(/\\/g, '/')}`, format: 'wav' });
      });
    });
  }

  return { ok: false, error: 'TTS not supported on this platform.' };
});

// ── Native URL fetch ───────────────────────────────────────────────────────
ipcMain.handle('fetch-url-native', async (e, url) => {
  try {
    const html = await fetchUrlNative(url);
    const { title, content } = htmlToText(html, url);
    if (!content || content.length < 100) {
      return { ok: false, error: 'Page content too short or empty. This page may require JavaScript to render — try the AI-assisted method instead.' };
    }
    return { ok: true, title, content };
  } catch(err) {
    return { ok: false, error: err.message };
  }
});

// ── File parser ────────────────────────────────────────────────────────────
ipcMain.handle('parse-file-from-buffer', async (e, fileName, base64) => {
  const ext = path.extname(fileName).toLowerCase();
  const buffer = Buffer.from(base64, 'base64');
  try {
    if (ext === '.txt' || ext === '.md') {
      return { ok: true, content: buffer.toString('utf8'), type: ext.slice(1) };
    }
    if (ext === '.html' || ext === '.htm') {
      const { content } = htmlToText(buffer.toString('utf8'), fileName);
      return { ok: true, content, type: 'html' };
    }
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      const content = data.text.replace(/[ \t]{3,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (!content || content.length < 20) return { ok: false, error: 'No text found in this PDF. It may be a scanned image — paste the text manually instead.' };
      return { ok: true, content, type: 'pdf', pages: data.numpages };
    }
    if (ext === '.docx' || ext === '.doc') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const content = result.value.trim();
      if (!content) return { ok: false, error: 'No text found in this Word document.' };
      return { ok: true, content, type: 'docx' };
    }
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const lines = [];
      workbook.SheetNames.forEach(sheetName => {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { blankrows: false });
        if (csv.trim()) { lines.push(`--- Sheet: ${sheetName} ---`); lines.push(csv.trim()); }
      });
      const content = lines.join('\n\n');
      if (!content) return { ok: false, error: 'No data found in this spreadsheet.' };
      return { ok: true, content, type: ext.slice(1) };
    }
    if (ext === '.pptx' || ext === '.ppt') {
      const tmpFile = path.join(os.tmpdir(), `rrw_${Date.now()}${ext}`);
      fs.writeFileSync(tmpFile, buffer);
      try {
        const officeparser = require('officeparser');
        const content = await new Promise((resolve, reject) => {
          officeparser.parseOffice(tmpFile, (data, err) => {
            if (err) reject(new Error(err)); else resolve(data);
          });
        });
        fs.unlinkSync(tmpFile);
        if (!content || !content.trim()) return { ok: false, error: 'No text found in this PowerPoint file.' };
        return { ok: true, content: content.trim(), type: 'pptx' };
      } catch(err) {
        try { fs.unlinkSync(tmpFile); } catch(e) {}
        throw err;
      }
    }
    return { ok: false, error: `Unsupported file type: ${ext}\n\nSupported: PDF, DOCX, XLSX, XLS, CSV, PPTX, HTML, TXT, MD.\n\nAudio and video files are not supported — transcribe them externally and paste the transcript as a text source.` };
  } catch(err) {
    return { ok: false, error: `Failed to parse ${fileName}: ${err.message}` };
  }
});

// ── Update: check ──────────────────────────────────────────────────────────
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

// ── Update: Option B ───────────────────────────────────────────────────────
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
    const buildCmd = IS_MAC ? 'CSC_IDENTITY_AUTO_DISCOVERY=false npm run build' : 'npm run build:win';
    await runCommand(buildCmd, expanded, send);

    send('\n► Detecting build output…\n');
    const arch = os.arch();
    let appSrc = null;

    if (IS_MAC) {
      const macFolders = [`dist/mac-${arch}`, 'dist/mac', 'dist/mac-universal'];
      for (const folder of macFolders) {
        const candidate = path.join(expanded, folder, 'RAG Research Workbook.app');
        if (fs.existsSync(candidate)) { appSrc = candidate; break; }
      }
      if (!appSrc) {
        const distDir = path.join(expanded, 'dist');
        for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            const candidate = path.join(distDir, entry.name, 'RAG Research Workbook.app');
            if (fs.existsSync(candidate)) { appSrc = candidate; break; }
          }
        }
      }
      if (!appSrc) throw new Error('Could not find RAG Research Workbook.app in dist/');
      send(`► Found: ${appSrc}\n`);
      send('\n► Copying to /Applications…\n');
      await runCommand(`cp -r "${appSrc}" "/Applications/RAG Research Workbook.app"`, expanded, send);
    }

    if (IS_WIN) {
      // On Windows, point the user to the installer rather than auto-copying
      const winFolders = [`dist/win-unpacked`, `dist/win-${arch}-unpacked`];
      let exePath = null;
      for (const folder of winFolders) {
        const candidate = path.join(expanded, folder, 'RAG Research Workbook.exe');
        if (fs.existsSync(candidate)) { exePath = candidate; break; }
      }
      // Look for NSIS installer
      const distDir = path.join(expanded, 'dist');
      const installers = fs.readdirSync(distDir).filter(f => f.endsWith('.exe') && f.includes('Setup'));
      if (installers.length) {
        const installerPath = path.join(distDir, installers[0]);
        send(`\n► Installer built: ${installerPath}\n`);
        send('► Opening installer…\n');
        shell.openPath(installerPath);
      } else if (exePath) {
        send(`\n► Portable build found: ${exePath}\n`);
        send('► You can run the new version directly from the dist folder.\n');
      }
    }

    send('\n✅ Update complete!\n');
    if (IS_MAC) send('Quit and reopen RAG Research Workbook from /Applications.\n');
    if (IS_WIN) send('Run the installer that just opened to complete the update.\n');
    return { ok: true };
  } catch(err) {
    send(`\n❌ Error: ${err.message}\n`);
    return { ok: false, error: err.message };
  }
});

// ── Ollama model list ──────────────────────────────────────────────────────
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

// ── Dark mode ──────────────────────────────────────────────────────────────
nativeTheme.on('updated', () => {
  if (mainWindow) mainWindow.webContents.send('dark-mode-changed', nativeTheme.shouldUseDarkColors);
});

// ── Option A scaffold (inactive) ──────────────────────────────────────────
// Uncomment + add electron-updater to deps to activate auto-updates:
//
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
