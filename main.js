// Stor: ekranın üstüne inen bir stor perde. Menü çubuğunda yaşar.
const {
  app, BrowserWindow, Tray, Menu, screen, ipcMain, globalShortcut,
  powerMonitor, systemPreferences, nativeImage,
} = require('electron');
const path = require('path');
const fs = require('fs');

const IS_MAC = process.platform === 'darwin';
const CAS = 14;   // üstteki kaset (px)
const BAR = 16;   // alt çıta (px)
const SHORTCUT = 'Alt+Command+S';

const FABRICS = [
  { id: 'blackout', name: 'Karartma', code: 'BO-210', sheer: false, colors: [['Antrasit yeşil', '#2e3a36'], ['Gece siyahı', '#1d1f24'], ['Kahve', '#6b4a3a'], ['Kırık beyaz', '#e9e4d8'], ['Lacivert', '#3b4e6b']] },
  { id: 'zebra', name: 'Gün-gece (zebra)', code: 'ZB-140', sheer: true, colors: [['Krem', '#f1ede4'], ['Adaçayı', '#9aa59c'], ['Füme', '#3a3f46'], ['Karamel', '#b7865a'], ['Mavi gri', '#5a6f8a']] },
  { id: 'linen', name: 'Keten', code: 'LN-080', sheer: false, colors: [['Ham keten', '#d8cdb8'], ['Taş', '#a7a08f'], ['Zeytin', '#7c8b74'], ['Kum', '#c2a07a'], ['Beyaz keten', '#efe9dd']] },
  { id: 'screen', name: 'Screen (açıklık %3)', code: 'SC-003', sheer: true, colors: [['Grafit', '#4a4d4f'], ['İnci', '#c9c7c0'], ['Kömür', '#2b2d31'], ['Bej', '#8a8378'], ['Yosun', '#6e7a72']] },
  { id: 'voile', name: 'Tül', code: 'TL-020', sheer: true, colors: [['Beyaz', '#ffffff'], ['Fildişi', '#f1e7d6'], ['Buz mavisi', '#dfe7ea'], ['Pudra', '#e9dde3'], ['Nane', '#d8e3d3']] },
  { id: 'bamboo', name: 'Bambu', code: 'BM-300', sheer: false, colors: [['Bal', '#b88a52'], ['Ceviz', '#8f6a3f'], ['Açık meşe', '#d2b07a'], ['Wenge', '#5e4630']] },
  { id: 'iznik', name: 'İznik çini baskı', code: 'IZ-510', sheer: false, colors: [['Kobalt', '#1f4fa3'], ['Turkuaz', '#2a7d78'], ['Mürdüm', '#7a2f6b']] },
  { id: 'stripe', name: 'Şezlong çizgisi', code: 'ST-220', sheer: false, colors: [['Mercan', '#c84b3a'], ['Deniz', '#2f5f8f'], ['Çam', '#3f7a55'], ['Hardal', '#e0a92e']] },
  { id: 'washi', name: 'Washi kâğıdı', code: 'WS-070', sheer: true, colors: [['Pirinç kâğıdı', '#f4efe4'], ['Ham kâğıt', '#efe2cf'], ['Çay', '#e4ece4']] },
  { id: 'velvet', name: 'Kadife', code: 'VL-400', sheer: false, colors: [['Zümrüt', '#2f4a3c'], ['Bordo', '#5a1f2b'], ['Gece mavisi', '#23304f'], ['Hardal', '#7a5a2e']] },
];
const CHARMS = [
  ['wood', 'Ahşap boncuk'], ['brass', 'Pirinç top'], ['tassel', 'Püskül'],
  ['nazar', 'Nazar boncuğu'], ['drop', 'Seramik damla'], ['cube', 'Mermer küp'], ['none', 'Yok'],
];
const GAPS = [['Kapalı', 100], ['Dar', 80], ['Orta', 65], ['Geniş', 50]];
const IDLE = [['Kapalı', 0], ['1 dakika', 1], ['5 dakika', 5], ['10 dakika', 10], ['15 dakika', 15], ['30 dakika', 30]];
const EVENING = [['Kapalı', null], ['17:00', '17:00'], ['18:00', '18:00'], ['19:00', '19:00'], ['20:00', '20:00'], ['21:00', '21:00']];

// ---------- ayarlar ----------
const DEFAULTS = { fabric: 'blackout', colors: {}, gap: 65, charm: 'wood', idle: 0, evening: null, touchId: false, firstRun: true };
let settings = { ...DEFAULTS };
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch (_) { /* ilk açılış */ }
  if (!FABRICS.some(f => f.id === settings.fabric)) settings.fabric = DEFAULTS.fabric;
}
function saveSettings() {
  try { fs.mkdirSync(path.dirname(settingsFile()), { recursive: true }); fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch (_) {}
}
const fabric = () => FABRICS.find(f => f.id === settings.fabric);
const colorOf = f => settings.colors[f.id] || f.colors[0][1];

// ---------- storlar (her ekrana bir tane) ----------
const blinds = new Map(); // display.id -> { display, win, drop, timer, ready }
let locked = false;       // Touch ID açıkken stor tamamen inince kilitlenir
let unlocking = null;
let lastDown = false;

const clamp = v => Math.min(1, Math.max(0, v));
const heightFor = (b, drop) => Math.round(CAS + BAR + drop * (b.display.bounds.height - CAS - BAR));

function statePayload() {
  const f = fabric();
  return { fabric: f.id, color: colorOf(f), gap: settings.gap, charm: settings.charm, sheer: f.sheer };
}

function createBlind(display) {
  const { x, y, width } = display.bounds;
  const win = new BrowserWindow({
    x, y, width, height: CAS + BAR,
    show: false, frame: false, transparent: true, hasShadow: false,
    resizable: false, movable: false, minimizable: false, maximizable: false,
    fullscreenable: false, skipTaskbar: true, focusable: false, acceptFirstMouse: true,
    enableLargerThanScreen: true, roundedCorners: false, visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false, sandbox: true },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  if (IS_MAC) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'blind.html'));
  const b = { display, win, drop: 0, timer: null, ready: false };
  win.webContents.on('did-finish-load', () => { b.ready = true; pushState(b); });
  blinds.set(display.id, b);
  return b;
}

function pushState(b) {
  if (!b.ready || b.win.isDestroyed()) return;
  const s = statePayload();
  if (IS_MAC) {
    try { b.win.setVibrancy(s.sheer ? 'fullscreen-ui' : null); } catch (_) {}
  }
  b.win.webContents.send('state', s);
}
const pushStateAll = () => blinds.forEach(pushState);

function applyDrop(b, drop) {
  b.drop = clamp(drop);
  if (b.win.isDestroyed()) return;
  if (b.drop <= 0.001) {
    b.drop = 0;
    if (b.win.isVisible()) b.win.hide();
  } else {
    const { x, y, width } = b.display.bounds;
    b.win.setBounds({ x, y, width, height: heightFor(b, b.drop) }, false);
    if (!b.win.isVisible()) b.win.showInactive();
    if (b.ready) b.win.webContents.send('drop', b.drop);
  }
  if (b.drop >= 0.98 && settings.touchId) locked = true;
  if ([...blinds.values()].every(x => x.drop === 0)) locked = false;
  const down = anyDown();
  if (down !== lastDown) { lastDown = down; scheduleMenu(); }
}

function animate(b, target, ms = 900) {
  clearInterval(b.timer);
  const from = b.drop, t0 = Date.now();
  const ease = p => 1 - Math.pow(1 - p, 4);
  if (b.ready) b.win.webContents.send('swing');
  b.timer = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / ms);
    applyDrop(b, from + (target - from) * ease(p));
    if (p >= 1) clearInterval(b.timer);
  }, 16);
}

async function requireUnlock() {
  if (!locked) return true;
  if (!settings.touchId || !IS_MAC || !systemPreferences.canPromptTouchID()) { locked = false; return true; }
  if (!unlocking) {
    unlocking = systemPreferences.promptTouchID('storu kaldırmak')
      .then(() => { locked = false; return true; })
      .catch(() => false)
      .finally(() => { unlocking = null; });
  }
  return unlocking;
}

const anyDown = () => [...blinds.values()].some(b => b.drop > 0.02);
async function raiseAll() { if (await requireUnlock()) blinds.forEach(b => animate(b, 0, 1000)); }
function lowerAll(target = 1) { blinds.forEach(b => animate(b, target, 1300)); }
function toggleAll() { anyDown() ? raiseAll() : lowerAll(1); }

function syncDisplays() {
  const displays = screen.getAllDisplays();
  const ids = new Set(displays.map(d => d.id));
  for (const [id, b] of blinds) {
    if (!ids.has(id)) { clearInterval(b.timer); if (!b.win.isDestroyed()) b.win.destroy(); blinds.delete(id); }
  }
  for (const d of displays) {
    const b = blinds.get(d.id);
    if (!b) createBlind(d);
    else { b.display = d; applyDrop(b, b.drop); }
  }
}

// ---------- sürükleme (alt çıta) ----------
const blindOf = sender => [...blinds.values()].find(b => !b.win.isDestroyed() && b.win.webContents === sender);
let drag = null; // { b, offset }

ipcMain.handle('drag-start', async (e) => {
  const b = blindOf(e.sender);
  if (!b) return false;
  if (!(await requireUnlock())) return false;
  clearInterval(b.timer);
  const cursorY = screen.getCursorScreenPoint().y;
  const barTop = b.display.bounds.y + heightFor(b, b.drop) - BAR;
  drag = { b, offset: cursorY - barTop };
  return true;
});
ipcMain.on('drag', (e) => {
  if (!drag || blindOf(e.sender) !== drag.b) return;
  const { b, offset } = drag;
  const barTop = screen.getCursorScreenPoint().y - offset;
  const h = barTop - b.display.bounds.y + BAR;
  applyDrop(b, (h - CAS - BAR) / (b.display.bounds.height - CAS - BAR));
});
ipcMain.on('drag-end', () => {
  if (!drag) return;
  const { b } = drag; drag = null;
  if (b.drop < 0.04) animate(b, 0, 300);
  else if (b.drop > 0.97) animate(b, 1, 300);
});
ipcMain.on('chain', async (e) => {
  const b = blindOf(e.sender);
  if (!b) return;
  if (b.drop > 0.5) { if (await requireUnlock()) animate(b, 0, 1100); }
  else animate(b, 1, 1300);
});

// ---------- menü çubuğu ----------
let tray = null;
let menuQueued = false;
function scheduleMenu() {
  if (menuQueued) return;
  menuQueued = true;
  setTimeout(() => { menuQueued = false; buildMenu(); }, 120);
}
function setAndSave(patch) { Object.assign(settings, patch); saveSettings(); pushStateAll(); buildMenu(); }

function buildMenu() {
  if (!tray) return;
  const f = fabric();
  const down = anyDown();
  const canTouch = IS_MAC && systemPreferences.canPromptTouchID();
  const template = [
    { label: down ? 'Storu kaldır' : 'Storu indir', accelerator: SHORTCUT, click: toggleAll },
    { label: 'Yarıya indir', click: () => lowerAll(0.5) },
    { type: 'separator' },
    { label: `Kumaş: ${f.name}`, submenu: FABRICS.map(x => ({
      label: `${x.name}   ${x.code}`, type: 'radio', checked: x.id === f.id,
      click: () => setAndSave({ fabric: x.id }),
    })) },
    { label: 'Renk', submenu: f.colors.map(([name, hex]) => ({
      label: name, type: 'radio', checked: colorOf(f) === hex,
      click: () => setAndSave({ colors: { ...settings.colors, [f.id]: hex } }),
    })) },
    { label: 'Gün-gece aralığı', enabled: f.id === 'zebra', submenu: GAPS.map(([name, v]) => ({
      label: name, type: 'radio', checked: settings.gap === v, click: () => setAndSave({ gap: v }),
    })) },
    { label: 'Kordon ucu', submenu: CHARMS.map(([id, name]) => ({
      label: name, type: 'radio', checked: settings.charm === id, click: () => setAndSave({ charm: id }),
    })) },
    { type: 'separator' },
    { label: 'Boşta kalınca in', submenu: IDLE.map(([name, v]) => ({
      label: name, type: 'radio', checked: settings.idle === v, click: () => setAndSave({ idle: v }),
    })) },
    { label: 'Akşam kendiliğinden in', submenu: EVENING.map(([name, v]) => ({
      label: name, type: 'radio', checked: settings.evening === v, click: () => setAndSave({ evening: v }),
    })) },
    { label: canTouch ? 'Kaldırmak için Touch ID sor' : 'Kaldırmak için Touch ID sor (bu Mac’te yok)',
      type: 'checkbox', enabled: canTouch, checked: settings.touchId && canTouch,
      click: (item) => setAndSave({ touchId: item.checked }) },
    { label: 'Oturum açılınca başlat', type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => { app.setLoginItemSettings({ openAtLogin: item.checked }); buildMenu(); } },
    { type: 'separator' },
    { label: 'Stor’dan çık', accelerator: 'Command+Q', click: () => app.quit() },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

// ---------- zamanlayıcılar ----------
let idleFired = false;
let lastEvening = '';
function startTimers() {
  setInterval(() => {
    if (!settings.idle) return;
    const idleSec = powerMonitor.getSystemIdleTime();
    if (idleSec < 5) { idleFired = false; return; }
    if (!idleFired && idleSec >= settings.idle * 60 && !anyDown()) { idleFired = true; lowerAll(1); }
  }, 5000);
  setInterval(() => {
    if (!settings.evening) return;
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const day = now.toDateString();
    if (hm === settings.evening && lastEvening !== day) { lastEvening = day; lowerAll(1); }
  }, 20000);
}

// ---------- başlangıç ----------
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => toggleAll());
  app.whenReady().then(() => {
    if (IS_MAC && app.dock) app.dock.hide();
    loadSettings();

    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
    if (IS_MAC) icon.setTemplateImage(true);
    tray = new Tray(icon);
    tray.setToolTip('Stor');
    buildMenu();

    syncDisplays();
    screen.on('display-added', syncDisplays);
    screen.on('display-removed', syncDisplays);
    screen.on('display-metrics-changed', syncDisplays);

    globalShortcut.register(SHORTCUT, toggleAll);
    startTimers();

    if (settings.firstRun) {
      settings.firstRun = false; saveSettings();
      setTimeout(() => lowerAll(0.45), 900);
    }
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', (e) => e.preventDefault && e.preventDefault());
}
