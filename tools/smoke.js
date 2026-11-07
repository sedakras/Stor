// Linux'ta sanal ekranda hızlı deneme: uygulamayı açar, storu indirir, görüntüsünü kaydeder.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs'), path = require('path');
app.setPath('userData', fs.mkdtempSync('/tmp/stor-smoke-'));
process.on('uncaughtException', e => { console.error('UNCAUGHT', e); process.exit(1); });
require('../main.js');
app.whenReady().then(() => {
  setTimeout(async () => {
    const wins = BrowserWindow.getAllWindows();
    console.log('windows', wins.length, wins.map(w => [w.isVisible(), JSON.stringify(w.getBounds())]));
    for (const id of ['blackout','zebra','iznik']) {
      wins[0].webContents.send('state', { fabric: id, color: id==='zebra' ? '#f1ede4' : (id==='iznik' ? '#1f4fa3' : '#2e3a36'), gap: 65, charm: 'nazar', sheer: false });
      await new Promise(r => setTimeout(r, 300));
      const img = await wins[0].webContents.capturePage();
      fs.writeFileSync(path.join(process.env.OUT, `smoke-${id}.png`), img.toPNG());
    }
    app.exit(0);
  }, 3500);
});
