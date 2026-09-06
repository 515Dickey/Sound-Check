const { app, BrowserWindow, ipcMain, session, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;

// The app used to be called "Voice Meter". Keep Sean's thresholds and history by
// moving the old profile folder to the new name the first time this version runs.
(function migrateUserData() {
  try {
    const appData = app.getPath('appData');
    const oldDir = path.join(appData, 'Voice Meter');
    const newDir = path.join(appData, 'Sound Check');
    if (fs.existsSync(oldDir) && !fs.existsSync(newDir)) fs.cpSync(oldDir, newDir, { recursive: true });
  } catch { /* fall through: start with fresh settings rather than fail to launch */ }
})();

const statePath = () => path.join(app.getPath('userData'), 'window-state.json');

function loadState() {
  try { return JSON.parse(fs.readFileSync(statePath(), 'utf8')); } catch { return {}; }
}

function saveState() {
  if (!win) return;
  try {
    const b = win.getBounds();
    const state = { ...b, alwaysOnTop: win.isAlwaysOnTop() };
    fs.writeFileSync(statePath(), JSON.stringify(state));
  } catch { /* ignore */ }
}

// Only reuse a saved position if it still lands on a connected monitor
// (e.g. the second monitor was unplugged since last run).
function onScreen(x, y, w, h) {
  if (x == null || y == null) return false;
  return screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return x + w > a.x + 40 && x < a.x + a.width - 40 && y >= a.y - 10 && y < a.y + a.height - 40;
  });
}

function createWindow() {
  const s = loadState();
  const width = s.width || 340;
  const height = s.height || 460;
  const opts = {
    width, height,
    minWidth: 200, minHeight: 240,
    frame: false,
    backgroundColor: '#0f1115',
    alwaysOnTop: s.alwaysOnTop !== false,
    title: 'Sound Check',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  };
  if (onScreen(s.x, s.y, width, height)) { opts.x = s.x; opts.y = s.y; }

  win = new BrowserWindow(opts);
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');

  let saveTimer = null;
  const scheduleSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 400); };
  win.on('move', scheduleSave);
  win.on('resize', scheduleSave);
  win.on('close', saveState);
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  // Let the page use the microphone without a prompt.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'media'));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media');

  ipcMain.on('win:close', () => win && win.close());
  ipcMain.on('win:minimize', () => win && win.minimize());
  ipcMain.handle('win:toggleTop', () => {
    if (!win) return false;
    win.setAlwaysOnTop(!win.isAlwaysOnTop(), 'screen-saver');
    saveState();
    return win.isAlwaysOnTop();
  });
  ipcMain.handle('win:isTop', () => (win ? win.isAlwaysOnTop() : false));

  createWindow();
});

app.on('window-all-closed', () => app.quit());
