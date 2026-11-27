const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  nativeImage,
  shell,
} = require('electron');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const ROLE_SLUG = 'sales';
const APP_TITLE = 'Attaie Sales Agent Workspace';
const DEFAULT_BACKEND_ORIGIN = 'https://website.attaieproperties.com';


// Isolate V2 testing settings and cookies from an existing production installation.
app.setPath('userData', app.getPath('userData') + '-v2-testing');
const userDataDir = app.getPath('userData');
const stateFile = path.join(userDataDir, 'window-state.json');
const configFile = path.join(userDataDir, 'config.json');
const cookiesFile = path.join(userDataDir, 'backend-cookies.json');
const wwwDir = path.join(__dirname, '..', 'www');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let configWindow = null;
let tray = null;
let localServer = null;
let localPort = 0;
let lastLoadError = '';

function normalizeBackendOrigin(input) {
  const raw = String(input || '').trim();
  if (!/^https?:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(raw)) {
    throw new Error('Enter a valid https:// or http:// server URL.');
  }
  const parsed = new URL(raw);
  return parsed.origin;
}

function loadConfig() {
  try {
    if (fs.existsSync(configFile)) {
      const parsed = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      if (parsed && (parsed.backendOrigin || parsed.serverUrl)) {
        const origin = normalizeBackendOrigin(parsed.backendOrigin || parsed.serverUrl);
        return {
          backendOrigin: origin,
          serverUrl: `${origin}/${ROLE_SLUG}/`,
        };
      }
    }
  } catch {
    // fallback to default
  }
  return {
    backendOrigin: DEFAULT_BACKEND_ORIGIN,
    serverUrl: `${DEFAULT_BACKEND_ORIGIN}/${ROLE_SLUG}/`,
  };
}

function saveConfig(cfg) {
  const origin = normalizeBackendOrigin(cfg.backendOrigin || cfg.serverUrl || DEFAULT_BACKEND_ORIGIN);
  const normalized = {
    backendOrigin: origin,
    serverUrl: `${origin}/${ROLE_SLUG}/`,
  };
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.writeFileSync(configFile, JSON.stringify(normalized, null, 2));
  return normalized;
}

function loadCookieJar() {
  try {
    if (fs.existsSync(cookiesFile)) {
      const parsed = JSON.parse(fs.readFileSync(cookiesFile, 'utf8'));
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveCookieJar(jar) {
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(cookiesFile, JSON.stringify(jar, null, 2));
  } catch {
    // ignore
  }
}

function updateCookiesFromResponse(origin, setCookieHeader) {
  if (!setCookieHeader) return;
  const lines = Array.isArray(setCookieHeader) ? setCookieHeader : [String(setCookieHeader)];
  const jar = loadCookieJar();
  const hostJar = jar[origin] && typeof jar[origin] === 'object' ? jar[origin] : {};
  for (const line of lines) {
    const firstPart = String(line || '').split(';')[0].trim();
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx <= 0) continue;
    const name = firstPart.slice(0, eqIdx).trim();
    const value = firstPart.slice(eqIdx + 1).trim();
    if (!value || /max-age=0/i.test(line) || /expires=thu,\s*01[-\s]jan[-\s]1970/i.test(line)) {
      delete hostJar[name];
    } else {
      hostJar[name] = value;
    }
  }
  jar[origin] = hostJar;
  saveCookieJar(jar);
}

function buildCookieHeader(origin, incomingCookie) {
  const jar = loadCookieJar();
  const hostJar = jar[origin] && typeof jar[origin] === 'object' ? jar[origin] : {};
  const merged = {};
  if (incomingCookie) {
    for (const part of String(incomingCookie).split(';')) {
      const trimmed = part.trim();
      const eq = trimmed.indexOf('=');
      if (eq > 0) merged[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  for (const [k, v] of Object.entries(hostJar)) {
    merged[k] = v;
  }
  return Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
    case '.webmanifest':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.ico':
      return 'image/x-icon';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ttf':
      return 'font/ttf';
    default:
      return 'application/octet-stream';
  }
}

function forwardToBackend(origin, req, res, bodyBuffer) {
  return new Promise((resolve) => {
    let targetUrl;
    try {
      targetUrl = new URL(req.url, origin);
    } catch (err) {
      resolve({ ok: false, error: err });
      return;
    }

    const isHttps = targetUrl.protocol === 'https:';
    const transport = isHttps ? https : http;
    const cookieHeader = buildCookieHeader(origin, req.headers['cookie']);

    const outHeaders = {
      Accept: req.headers['accept'] || 'application/json, text/plain, */*',
      'User-Agent': req.headers['user-agent'] || `AttaieDesktop-${ROLE_SLUG}/2.0.0`,
      Origin: origin,
      Referer: `${origin}/${ROLE_SLUG}/`,
    };
    if (req.headers['content-type']) outHeaders['Content-Type'] = req.headers['content-type'];
    if (req.headers['x-csrf-token']) outHeaders['X-CSRF-Token'] = req.headers['x-csrf-token'];
    if (req.headers['idempotency-key']) outHeaders['Idempotency-Key'] = req.headers['idempotency-key'];
    if (cookieHeader) outHeaders['Cookie'] = cookieHeader;
    if (bodyBuffer && bodyBuffer.length > 0) {
      outHeaders['Content-Length'] = Buffer.byteLength(bodyBuffer);
    }

    const upstreamReq = transport.request(
      targetUrl,
      {
        method: req.method || 'GET',
        headers: outHeaders,
        timeout: 15000,
      },
      (upstreamRes) => {
        const chunks = [];
        upstreamRes.on('data', (chunk) => chunks.push(chunk));
        upstreamRes.on('end', () => {
          resolve({
            ok: true,
            statusCode: upstreamRes.statusCode || 200,
            headers: upstreamRes.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error('Backend connection timed out.'));
    });

    upstreamReq.on('error', (err) => {
      resolve({ ok: false, error: err });
    });

    if (bodyBuffer && bodyBuffer.length > 0) {
      upstreamReq.write(bodyBuffer);
    }
    upstreamReq.end();
  });
}

async function handleProxiedRequest(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyBuffer = Buffer.concat(chunks);

  let { backendOrigin } = loadConfig();
  let result = await forwardToBackend(backendOrigin, req, res, bodyBuffer);

  // Never replay credentials or writes against a different deployment.

  if (!result.ok) {
    lastLoadError = `${result.error?.message || 'Unable to reach backend server'} (${backendOrigin})`;
    res.writeHead(503, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(
      JSON.stringify({
        error: {
          message: `Unable to reach backend server (${backendOrigin}). Check your internet connection or click the Server URL button to switch servers.`,
        },
      }),
    );
    return;
  }

  lastLoadError = '';
  updateCookiesFromResponse(backendOrigin, result.headers['set-cookie']);

  const responseHeaders = {
    'Cache-Control': 'no-store',
  };
  if (result.headers['content-type']) {
    responseHeaders['Content-Type'] = result.headers['content-type'];
  }
  if (result.headers['retry-after']) {
    responseHeaders['Retry-After'] = result.headers['retry-after'];
  }
  if (result.headers['set-cookie']) {
    const rawCookies = Array.isArray(result.headers['set-cookie'])
      ? result.headers['set-cookie']
      : [String(result.headers['set-cookie'])];
    responseHeaders['Set-Cookie'] = rawCookies.map((c) =>
      c
        .replace(/;\s*Secure/gi, '')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
        .replace(/;\s*Domain=[^;]+/gi, ''),
    );
  }

  res.writeHead(result.statusCode, responseHeaders);
  res.end(result.body);
}

function serveBundledFile(reqPath, res) {
  let relPath = reqPath;
  if (relPath === '/' || relPath === `/${ROLE_SLUG}` || relPath === `/${ROLE_SLUG}/`) {
    relPath = '/index.html';
  } else if (relPath.startsWith(`/${ROLE_SLUG}/`)) {
    relPath = relPath.slice(`/${ROLE_SLUG}`.length);
  }

  const safeRel = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let candidate = path.join(wwwDir, safeRel);

  if (!fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
    candidate = path.join(wwwDir, 'index.html');
  }

  if (!fs.existsSync(candidate)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bundled workspace asset not found.');
    return;
  }

  const data = fs.readFileSync(candidate);
  res.writeHead(200, {
    'Content-Type': getMimeType(candidate),
    'Cache-Control': candidate.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(data);
}

function startLocalWorkspaceServer() {
  if (localServer && localPort > 0) {
    return Promise.resolve(localPort);
  }
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = parsedUrl.pathname;

      if (
        pathname.startsWith('/staff-api/') ||
        pathname === '/staff-api' ||
        pathname.startsWith('/visual-config/') ||
        pathname.startsWith('/uploads/') ||
        pathname.startsWith('/api/')
      ) {
        void handleProxiedRequest(req, res);
        return;
      }

      serveBundledFile(pathname, res);
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      localServer = server;
      localPort = typeof addr === 'object' && addr ? addr.port : 0;
      resolve(localPort);
    });
  });
}

async function testBackendConnection(rawUrl) {
  const origin = normalizeBackendOrigin(rawUrl || loadConfig().backendOrigin);
  const fakeReq = {
    url: '/staff-api/v1/session',
    method: 'GET',
    headers: { accept: 'application/json' },
  };
  const res = await forwardToBackend(origin, fakeReq, null, null);
  if (!res.ok) {
    return {
      ok: false,
      origin,
      message: res.error?.message || 'Unable to connect to server.',
    };
  }
  let payload = null;
  try {
    payload = JSON.parse(res.body.toString('utf8'));
  } catch {
    payload = null;
  }
  if (res.statusCode === 200 && payload && payload.data && payload.data.csrfToken) {
    return {
      ok: true,
      origin,
      statusCode: res.statusCode,
      serverTime: payload.data.serverTime || '',
      message: `Connected to ${origin} (Staff API v1 ready · ${payload.data.serverTime || 'OK'})`,
    };
  }
  return {
    ok: false,
    origin,
    statusCode: res.statusCode,
    message:
      payload?.error?.message ||
      `Server responded with HTTP ${res.statusCode} at ${origin}/staff-api/v1/session`,
  };
}

function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch {
    // ignore
  }
  return { width: 1320, height: 840, maximized: false };
}

function saveWindowState(win) {
  try {
    const bounds = win.getBounds();
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ ...bounds, maximized: win.isMaximized() }),
    );
  } catch {
    // ignore
  }
}

function isAllowedInAppUrl(targetUrl, configuredUrl) {
  try {
    const u = new URL(targetUrl);
    if (u.protocol === 'file:') return true;
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') return true;
    const cfgHost = new URL(configuredUrl).hostname;
    if (u.hostname === cfgHost) return true;
    if (
      u.hostname.endsWith('.attaieproperties.com') ||
      u.hostname === 'attaieproperties.com' ||
      u.hostname.endsWith('.attaieproperties.af') ||
      u.hostname === 'attaieproperties.af'
    ) {
      return true;
    }
    if (
      u.hostname === 'accounts.google.com' ||
      u.hostname.endsWith('.firebaseapp.com') ||
      u.hostname.endsWith('.googleapis.com')
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function loadWorkspace() {
  if (!mainWindow) return;
  lastLoadError = '';
  const port = await startLocalWorkspaceServer();
  const localUrl = `http://127.0.0.1:${port}/${ROLE_SLUG}/`;
  mainWindow.loadURL(localUrl).catch(() => {
    // Handled by did-fail-load
  });
}

function openServerConfigModal() {
  if (configWindow) {
    configWindow.focus();
    return;
  }
  configWindow = new BrowserWindow({
    width: 500,
    height: 440,
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow || undefined,
    modal: Boolean(mainWindow),
    title: 'Sales Agent Backend Server Settings',
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  configWindow.setMenuBarVisibility(false);
  configWindow.loadFile(path.join(__dirname, 'server-config.html'));
  configWindow.on('closed', () => {
    configWindow = null;
  });
}

function createTray(win) {
  const iconPath = path.join(__dirname, '..', 'resources', 'icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Attaie Sales Agent');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show / Hide',
        click: () => {
          if (win.isVisible()) win.hide();
          else {
            win.show();
            win.focus();
          }
        },
      },
      {
        label: 'Reload Workspace',
        click: () => void loadWorkspace(),
      },
      {
        label: 'Switch Backend Server URL…',
        click: () => openServerConfigModal(),
      },
      { type: 'separator' },
      { label: 'Quit Attaie Sales Agent', click: () => app.quit() },
    ]),
  );
  tray.on('double-click', () => {
    win.show();
    win.focus();
  });
}

function buildAppMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Workspace',
        submenu: [
          {
            label: 'Reload Sales Workspace',
            accelerator: 'CmdOrCtrl+R',
            click: () => void loadWorkspace(),
          },
          {
            label: 'Switch Backend Server URL…',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => openServerConfigModal(),
          },
          { type: 'separator' },
          { role: 'quit', label: 'Exit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'toggleDevTools' },
          { role: 'togglefullscreen' },
        ],
      },
    ]),
  );
}

function registerIpc() {
  ipcMain.handle('cc:get-status', () => {
    const cfg = loadConfig();
    return {
      role: ROLE_SLUG,
      backendOrigin: cfg.backendOrigin,
      serverUrl: cfg.serverUrl,
      lastError: lastLoadError,
      version: app.getVersion(),
    };
  });

  ipcMain.handle('cc:set-server-url', (_event, url) => {
    const saved = saveConfig({ serverUrl: url });
    if (configWindow) configWindow.close();
    void loadWorkspace();
    return saved.serverUrl;
  });

  ipcMain.handle('cc:test-connection', (_event, url) => {
    return testBackendConnection(url);
  });

  ipcMain.handle('cc:retry', () => {
    void loadWorkspace();
  });

  ipcMain.handle('cc:open-server-config', () => {
    openServerConfigModal();
  });

  ipcMain.handle('cc:close-config', () => {
    if (configWindow) configWindow.close();
  });
}

function createWindow() {
  const state = loadWindowState();
  const iconPath = path.join(__dirname, '..', 'resources', 'icon.png');

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: APP_TITLE,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (state.maximized) mainWindow.maximize();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      lastLoadError = `${errorDescription || 'Connection failed'} (${errorCode}) · ${validatedURL}`;
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    },
  );

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('whatsapp:') ||
      url.includes('wa.me/')
    ) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    const { serverUrl } = loadConfig();
    if (
      url.startsWith('https://accounts.google.com') ||
      url.includes('.firebaseapp.com')
    ) {
      return { action: 'allow' };
    }
    if (isAllowedInAppUrl(url, serverUrl)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('whatsapp:') ||
      url.includes('wa.me/')
    ) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }
    const { serverUrl } = loadConfig();
    if (!isAllowedInAppUrl(url, serverUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('close', () => saveWindowState(mainWindow));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createTray(mainWindow);
  buildAppMenu();
  void loadWorkspace();
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (localServer) {
    try {
      localServer.close();
    } catch {
      // ignore
    }
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
