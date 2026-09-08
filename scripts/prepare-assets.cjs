const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'web/vendor');
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'node_modules/leaflet/dist'), path.join(out, 'leaflet'), { recursive: true });
for (const part of ['css', 'webfonts']) {
  fs.cpSync(path.join(root, 'node_modules/@fortawesome/fontawesome-free', part), path.join(out, 'fontawesome', part), { recursive: true });
}
fs.copyFileSync(path.join(root, 'node_modules/leaflet/LICENSE'), path.join(out, 'leaflet/LICENSE'));
fs.copyFileSync(path.join(root, 'node_modules/@fortawesome/fontawesome-free/LICENSE.txt'), path.join(out, 'fontawesome/LICENSE.txt'));
console.log('Leaflet 1.9.4 and Font Awesome 6.4.0 bundled locally.');
