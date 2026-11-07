// Mac paketlerini üretir: dist/Stor-mac-apple-silicon.zip ve dist/Stor-mac-intel.zip
const { packager } = require('@electron/packager');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ARCHES = { arm64: 'apple-silicon', x64: 'intel' };

(async () => {
  const dist = path.join(__dirname, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  for (const [arch, label] of Object.entries(ARCHES)) {
    const [outDir] = await packager({
      dir: __dirname,
      name: 'Stor',
      executableName: 'Stor',
      platform: 'darwin',
      arch,
      electronVersion: require('electron/package.json').version,
      appBundleId: 'dev.stor.blind',
      appCategoryType: 'public.app-category.utilities',
      appVersion: require('./package.json').version,
      icon: path.join(__dirname, 'assets', 'icon.icns'),
      extendInfo: { LSUIElement: true, NSHumanReadableCopyright: 'Stor' },
      out: path.join(dist, 'build'),
      overwrite: true,
      prune: true,
      ignore: [/^\/dist($|\/)/, /^\/tools($|\/)/, /^\/README\.md$/],
    });
    const zip = path.join(dist, `Stor-mac-${label}.zip`);
    fs.rmSync(zip, { force: true });
    execFileSync('zip', ['-qry', zip, 'Stor.app'], { cwd: outDir });
    console.log('hazır:', zip, (fs.statSync(zip).size / 1e6).toFixed(1) + ' MB');
  }
})().catch(e => { console.error(e); process.exit(1); });
