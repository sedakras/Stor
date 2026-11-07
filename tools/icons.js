// Menü çubuğu ve uygulama ikonlarını Chromium ile çizer, icns dosyasını oluşturur.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const out = p => path.join(__dirname, '..', 'assets', p);
const tray = s => `<html><body style="margin:0;background:transparent"><svg width="${s}" height="${s}" viewBox="0 0 18 18">
  <rect x="2" y="2" width="14" height="3" rx="1" fill="#000"/>
  <rect x="3" y="5" width="12" height="7" fill="#000" fill-opacity=".55"/>
  <rect x="2.5" y="12" width="13" height="2" rx="1" fill="#000"/>
  <rect x="13.2" y="5" width="1" height="6" fill="#000"/><circle cx="13.7" cy="11.6" r="1.1" fill="#000"/>
</svg></body></html>`;
const appIcon = `<html><body style="margin:0;background:transparent">
<div style="position:absolute;left:100px;top:100px;width:824px;height:824px;border-radius:185px;overflow:hidden;
 background:linear-gradient(180deg,#3d7a68,#21493e);box-shadow:inset 0 0 0 2px #0002">
 <div style="position:absolute;left:110px;right:110px;top:120px;height:70px;border-radius:18px;background:linear-gradient(180deg,#fafaf8,#c8cbc9)"></div>
 <div style="position:absolute;left:140px;right:140px;top:190px;height:430px;background:repeating-linear-gradient(180deg,#f1ede4 0 56px,#f1ede488 56px 86px)"></div>
 <div style="position:absolute;left:125px;right:125px;top:610px;height:46px;border-radius:12px;background:linear-gradient(180deg,#f4f5f4,#9ea2a0)"></div>
 <div style="position:absolute;left:452px;top:650px;width:120px;height:34px;border-radius:0 0 20px 20px;background:linear-gradient(180deg,#c6cac8,#8d9290)"></div>
 <div style="position:absolute;right:190px;top:190px;width:12px;height:330px;background:radial-gradient(circle,#ecebe6 0 5px,transparent 5.5px) 0 0/12px 18px repeat-y"></div>
 <div style="position:absolute;right:178px;top:516px;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e6b47e,#8b5a2b)"></div>
</div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const shot = async (html, size, file) => {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(html); await p.screenshot({ path: file, omitBackground: true }); await p.close();
  };
  await shot(tray(18), 18, out('trayTemplate.png'));
  await shot(tray(36).replace('width="36" height="36"', 'width="36" height="36"'), 36, out('trayTemplate@2x.png'));
  const sizes = { ic07: 128, ic08: 256, ic09: 512, ic10: 1024 };
  const chunks = [];
  for (const [type, s] of Object.entries(sizes)) {
    const f = out(`icon-${s}.png`);
    const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: s / 1024 });
    await p.setContent(appIcon); await p.screenshot({ path: f, omitBackground: true }); await p.close();
    const data = fs.readFileSync(f);
    const head = Buffer.alloc(8); head.write(type, 0, 'ascii'); head.writeUInt32BE(data.length + 8, 4);
    chunks.push(head, data);
    if (s !== 1024) fs.unlinkSync(f);
  }
  const body = Buffer.concat(chunks);
  const h = Buffer.alloc(8); h.write('icns', 0, 'ascii'); h.writeUInt32BE(body.length + 8, 4);
  fs.writeFileSync(out('icon.icns'), Buffer.concat([h, body]));
  fs.renameSync(out('icon-1024.png'), out('icon.png'));
  await b.close();
})();
