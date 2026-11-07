// README görsellerini üretir (docs/). Uygulamanın kendi blind.html çizimini
// örnek bir macOS masaüstünün üstüne koyar. Gerekenler: playwright, ffmpeg.
//   node tools/readme-shots.js
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const W = 1440, H = 900, CAS = 14, BAR = 16;
fs.mkdirSync(DOCS, { recursive: true });

const trayIcon = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'assets', 'trayTemplate@2x.png')).toString('base64');

// Örnek masaüstü: duvar kağıdı, menü çubuğu, iki pencere, Dock.
const desktop = `
<div class="wall"></div>
<div class="mb"><span><b></b><b>Finder</b>Dosya&nbsp;&nbsp;Düzen&nbsp;&nbsp;Görüntü&nbsp;&nbsp;Git&nbsp;&nbsp;Pencere</span>
  <span class="r"><img src="${trayIcon}" class="tray"><span>%100</span><span>Cmt 7 Kas&nbsp;&nbsp;14:32</span></span></div>
<div class="w w1"><div class="tb"><i></i><i></i><i></i><span>Kira sözleşmesi.pages</span></div>
  <div class="doc"><h2>Kira sözleşmesi taslağı</h2>
  <p><b>Madde 4.</b> Kiracı, kira bedelini her ayın beşinci gününe kadar ödemeyi kabul eder. Depozito iki aylık kira tutarındadır ve sözleşme bitiminde iade edilir.</p>
  <p><b>Madde 5.</b> Daireye evcil hayvan kabul edilmesi ev sahibinin yazılı onayına bağlıdır.</p>
  <p><b>Madde 6.</b> Aidat ve ortak gider payları kiracıya aittir. Yıllık artış TÜFE oranındadır.</p></div></div>
<div class="w w2"><div class="tb dark"><i></i><i></i><i></i><span>Terminal</span></div>
  <pre>~/stor $ npm start

&gt; stor@1.0.0 start
&gt; electron .

✓ menü çubuğuna eklendi
✓ 2 ekran bulundu
~/stor $ _</pre></div>
<div class="dock"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;

const css = `
*{box-sizing:border-box}html,body{margin:0;background:transparent;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}
.frame{position:absolute;left:40px;top:30px;width:${W}px;height:${H}px;border-radius:14px;overflow:hidden;box-shadow:0 30px 60px -20px #0007,0 0 0 1px #0003}
.desk{position:absolute;inset:0;overflow:hidden}
.wall{position:absolute;inset:0;background:
  radial-gradient(120% 70% at 78% 105%,#f2b55a 0,#e9864d 22%,transparent 52%),
  radial-gradient(90% 80% at 10% 0%,#5a7fb8 0,transparent 60%),
  linear-gradient(180deg,#2e4f86 0%,#7b6aa6 48%,#e6936a 78%,#f4c27b 100%)}
.wall::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;background:
  radial-gradient(70% 90% at 20% 100%,#20384f 0 55%,transparent 56%),radial-gradient(80% 100% at 75% 100%,#162a3d 0 55%,transparent 56%)}
.mb{position:absolute;inset:0 0 auto;height:26px;display:flex;justify-content:space-between;align-items:center;padding:0 16px;color:#fff;font-size:13.5px;background:#0003;backdrop-filter:blur(10px)}
.mb b{margin-right:18px}.mb .r{display:flex;gap:18px;align-items:center}.tray{width:18px;height:18px;filter:invert(1)}
.w{position:absolute;border-radius:11px;overflow:hidden;box-shadow:0 22px 50px #0006,0 0 0 1px #0002}
.w1{left:110px;top:110px;width:720px;height:540px;background:#fbfbf9}
.w2{left:880px;top:250px;width:470px;height:330px;background:#1e2227}
.tb{height:34px;background:#ecebe8;display:flex;align-items:center;gap:8px;padding-left:14px;font-size:13px;color:#555}
.tb.dark{background:#2a2f35;color:#aaa}.tb i{width:12px;height:12px;border-radius:50%;background:#ff5f57}.tb i+i{background:#febc2e}.tb i+i+i{background:#28c840}
.tb span{margin-left:auto;margin-right:auto;transform:translateX(-30px)}
.doc{padding:34px 54px;color:#222;font-size:17px;line-height:1.6}.doc h2{font-size:30px;margin:0 0 16px}.doc p{margin:0 0 14px}
pre{margin:0;padding:18px 20px;color:#a6dcc4;font:14px/1.6 Menlo,monospace}
.dock{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);display:flex;gap:10px;padding:8px 10px;border-radius:20px;background:#fff3;backdrop-filter:blur(12px)}
.dock i{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#7fd3ff,#2a7de1)}
.dock i:nth-child(2){background:linear-gradient(135deg,#ffe28a,#f59e2c)}.dock i:nth-child(3){background:linear-gradient(135deg,#a6f0b8,#2fa45a)}
.dock i:nth-child(4){background:linear-gradient(135deg,#f3a3c8,#d0477f)}.dock i:nth-child(5){background:linear-gradient(135deg,#d8d8de,#7d7f88)}.dock i:nth-child(6){background:linear-gradient(135deg,#3d7a68,#21493e)}
.blur{position:absolute;left:6px;right:6px;top:${CAS}px;overflow:hidden}
.blur .desk{left:-6px;top:-${CAS}px;width:${W}px;height:${H}px;filter:blur(28px) saturate(1.5)}
.blur::after{content:"";position:absolute;inset:0;background:#f4f4f633}
iframe{position:absolute;left:0;top:0;width:${W}px;border:0;background:transparent}
`;

const page = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<div class="frame"><div class="desk">${desktop}</div><div class="blur" hidden><div class="desk">${desktop}</div></div>
<iframe src="../blind.html" allowtransparency="true"></iframe></div>`;
const pagePath = path.join(__dirname, '.shots.html');
fs.writeFileSync(pagePath, page);

const FAB = {
  blackout: { color: '#2e3a36', sheer: false }, zebra: { color: '#f1ede4', sheer: true },
  linen: { color: '#d8cdb8', sheer: false }, screen: { color: '#4a4d4f', sheer: true },
  voile: { color: '#ffffff', sheer: true }, bamboo: { color: '#b88a52', sheer: false },
  iznik: { color: '#1f4fa3', sheer: false }, stripe: { color: '#c84b3a', sheer: false },
  washi: { color: '#f4efe4', sheer: true }, velvet: { color: '#5a1f2b', sheer: false },
};

const stub = () => {
  window.stor = {
    onState: cb => { window.__state = cb; }, onDrop: cb => { window.__drop = cb; }, onSwing: () => {},
    dragStart: async () => false, drag() {}, dragEnd() {}, chain() {},
  };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W + 80, height: H + 80 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(stub);
  const p = await ctx.newPage();
  await p.goto('file://' + pagePath);
  await p.waitForTimeout(400);
  const frame = p.frames().find(f => f.url().endsWith('blind.html'));

  async function set(fabric, drop, { charm = 'wood', gap = 65 } = {}) {
    const f = FAB[fabric];
    const h = Math.round(CAS + BAR + drop * (H - CAS - BAR));
    await frame.evaluate(s => { window.__state(s); window.__drop(s.drop); },
      { fabric, color: f.color, gap, charm, sheer: f.sheer, drop });
    await p.evaluate(({ h, sheer, drop }) => {
      const ifr = document.querySelector('iframe');
      ifr.style.height = h + 'px'; ifr.hidden = drop <= 0.001;
      const bl = document.querySelector('.blur');
      bl.hidden = !sheer || drop <= 0.001; bl.style.height = Math.max(0, h - 14 - 16) + 'px';
    }, { h, sheer: f.sheer, drop });
    await p.waitForTimeout(60);
  }
  const shot = (file, opts = {}) => p.screenshot({ path: path.join(DOCS, file), omitBackground: true, ...opts });
  const clip = { x: 0, y: 0, width: W + 80, height: H + 80 };

  // 1. Kapak
  await set('linen', 0.32, { charm: 'nazar' });
  await shot('hero.png', { clip });

  // 2. Tek tek kumaşlar (karşılaştırma görseli için)
  const tmp = fs.mkdtempSync('/tmp/stor-shots-');
  for (const id of ['blackout', 'zebra', 'voile']) {
    await set(id, 1, { charm: 'brass' });
    await p.screenshot({ path: path.join(tmp, id + '.png'), clip: { x: 40, y: 30, width: W, height: H } });
  }

  // 3. İnme animasyonu (GIF)
  const fdir = path.join(tmp, 'frames'); fs.mkdirSync(fdir);
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let n = 0;
  const seq = [];
  for (let i = 0; i < 8; i++) seq.push(0);
  for (let i = 0; i <= 26; i++) seq.push(ease(i / 26) * 0.72);
  for (let i = 0; i < 14; i++) seq.push(0.72);
  for (let i = 0; i <= 18; i++) seq.push(0.72 + ease(i / 18) * 0.28);
  for (let i = 0; i < 14; i++) seq.push(1);
  for (let i = 0; i <= 22; i++) seq.push(1 - ease(i / 22));
  for (const d of seq) {
    await set('zebra', d, { charm: 'tassel', gap: 65 });
    await p.screenshot({ path: path.join(fdir, String(n++).padStart(3, '0') + '.png'), clip: { x: 40, y: 30, width: W, height: H } });
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '24', '-i', path.join(fdir, '%03d.png'),
    '-vf', 'scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=sierra2_4a',
    '-loop', '0', path.join(DOCS, 'demo.gif')]);

  // 4. Kumaş kartelası: her kumaştan küçük bir stor
  const names = { blackout: ['Karartma', 'BO-210'], zebra: ['Gün-gece (zebra)', 'ZB-140'], linen: ['Keten', 'LN-080'],
    screen: ['Screen %3', 'SC-003'], voile: ['Tül', 'TL-020'], bamboo: ['Bambu', 'BM-300'], iznik: ['İznik çini baskı', 'IZ-510'],
    stripe: ['Şezlong çizgisi', 'ST-220'], washi: ['Washi kâğıdı', 'WS-070'], velvet: ['Kadife', 'VL-400'] };
  const cards = Object.entries(names).map(([id, [n, c]]) => `<figure><div class="sw"><div class="bl" ${FAB[id].sheer ? '' : 'hidden'}></div>
    <iframe src="../blind.html" data-f="${id}"></iframe></div><figcaption><b>${n}</b><span>${c}</span></figcaption></figure>`).join('');
  await set('blackout', 0);
  await p.screenshot({ path: path.join(DOCS, '.wall.png'), clip: { x: 40 + 420, y: 30 + 140, width: 520, height: 340 } });
  const gridHtml = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:transparent;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}
    .g{display:grid;grid-template-columns:repeat(5,260px);gap:22px;padding:24px}
    figure{margin:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px #0002,0 8px 20px -10px #0004}
    .sw{position:relative;width:260px;height:170px;overflow:hidden;background:linear-gradient(180deg,#2e4f86,#7b6aa6 50%,#e6936a)}
    .sw img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .bl{position:absolute;inset:0;background:linear-gradient(180deg,#5a78ad,#a08bbd 50%,#eeb08a);opacity:.9}
    iframe{position:absolute;inset:0;width:520px;height:340px;border:0;transform:scale(.5);transform-origin:0 0}
    figcaption{display:flex;justify-content:space-between;align-items:baseline;padding:11px 13px;font-size:14px;color:#1c2320}
    figcaption span{font:12px Menlo,monospace;color:#5d6762}</style><div class="g">${cards}</div>`;
  fs.writeFileSync(path.join(__dirname, '.grid.html'), gridHtml);
  const g = await ctx.newPage();
  await g.setViewportSize({ width: 5 * 260 + 4 * 22 + 48, height: 2 * 210 + 22 + 48 });
  await g.goto('file://' + path.join(__dirname, '.grid.html'));
  await g.waitForTimeout(500);
  const ids = Object.keys(names);
  for (const [i, fr] of g.frames().filter(f => f.url().endsWith('blind.html')).entries()) {
    const id = ids[i];
    await fr.evaluate(s => window.__state(s), { fabric: id, color: FAB[id].color, gap: 65, charm: 'none', sheer: FAB[id].sheer });
  }
  await g.waitForTimeout(200);
  await g.screenshot({ path: path.join(DOCS, 'fabrics.png'), omitBackground: true, fullPage: true });

  // 5. Opak / yarı saydam karşılaştırma (yan yana)
  const cmp = await ctx.newPage();
  const img = id => 'data:image/png;base64,' + fs.readFileSync(path.join(tmp, id + '.png')).toString('base64');
  await cmp.setViewportSize({ width: 3 * 460 + 2 * 20 + 48, height: 360 });
  await cmp.setContent(`<style>body{margin:0;background:transparent;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}
    .r{display:flex;gap:20px;padding:24px}figure{margin:0;width:460px}img{width:460px;border-radius:9px;box-shadow:0 0 0 1px #0002,0 10px 24px -12px #0006;display:block}
    figcaption{margin-top:10px;font-size:15px;color:#1c2320;text-align:center}figcaption span{color:#5d6762}</style>
    <div class="r"><figure><img src="${img('blackout')}"><figcaption><b>Karartma</b> <span>· ekran tamamen kapalı</span></figcaption></figure>
    <figure><img src="${img('zebra')}"><figcaption><b>Gün-gece</b> <span>· bantlar arasından bulanık</span></figcaption></figure>
    <figure><img src="${img('voile')}"><figcaption><b>Tül</b> <span>· her şey bulanık</span></figcaption></figure></div>`);
  await cmp.screenshot({ path: path.join(DOCS, 'opacity.png'), omitBackground: true, fullPage: true });

  // 6. Menü çubuğu menüsü (çizim)
  const menu = await ctx.newPage();
  await menu.setViewportSize({ width: 620, height: 520 });
  const it = (l, r = '', cls = '') => `<div class="i ${cls}"><span>${l}</span><span class="k">${r}</span></div>`;
  await menu.setContent(`<style>body{margin:0;background:transparent;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}
    .bar{position:absolute;left:24px;right:24px;top:24px;height:28px;border-radius:10px 10px 0 0;background:linear-gradient(90deg,#3c5b92,#7a6aa6);display:flex;justify-content:flex-end;align-items:center;gap:18px;padding:0 16px;color:#fff;font-size:13.5px}
    .bar img{width:18px;filter:invert(1);padding:3px 5px;border-radius:5px;background:#ffffff40}
    .m{position:absolute;left:250px;top:56px;width:320px;padding:6px;border-radius:11px;background:#ececeef2;box-shadow:0 0 0 1px #0002,0 18px 40px #0004;font-size:13.5px;color:#1d1d1f}
    .i{display:flex;justify-content:space-between;padding:4px 10px;border-radius:6px}.i.h{background:#2f6fe4;color:#fff}.i.h .k{color:#fff}
    .k{color:#8a8a8e}.i.sub .k::after{content:"›";font-size:16px;line-height:1}.s{height:1px;background:#0001;margin:5px 10px}.c span:first-child::before{content:"✓ ";}</style>
    <div class="bar"><img src="${trayIcon}"><span>%100</span><span>Cmt 7 Kas  14:32</span></div>
    <div class="m">${it('Storu indir', '⌥⌘S', 'h')}${it('Yarıya indir')}<div class="s"></div>
    ${it('Kumaş: Gün-gece (zebra)', '', 'sub')}${it('Renk', '', 'sub')}${it('Gün-gece aralığı', '', 'sub')}${it('Kordon ucu', '', 'sub')}<div class="s"></div>
    ${it('Boşta kalınca in', '', 'sub')}${it('Akşam kendiliğinden in', '', 'sub')}${it('Kaldırmak için Touch ID sor', '', 'c')}${it('Oturum açılınca başlat', '', 'c')}<div class="s"></div>
    ${it('Stor’dan çık', '⌘Q')}</div>`);
  const mb = await menu.evaluate(() => { const r = document.querySelector('.m').getBoundingClientRect(); return r.bottom; });
  await menu.screenshot({ path: path.join(DOCS, 'menu.png'), omitBackground: true, clip: { x: 0, y: 0, width: 620, height: Math.ceil(mb) + 30 } });

  await browser.close();
  for (const f of ['.shots.html', '.grid.html']) fs.rmSync(path.join(__dirname, f), { force: true });
  fs.rmSync(path.join(DOCS, '.wall.png'), { force: true });
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const f of fs.readdirSync(DOCS)) console.log(f, (fs.statSync(path.join(DOCS, f)).size / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error(e); process.exit(1); });
