import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidRoot = path.join(root, 'sales-android');
const wwwDir = path.join(androidRoot, 'www');
const androidAssetsWwwDir = path.join(androidRoot, 'app/src/main/assets/www');
const backendBaseUrl = 'https://website.attaieproperties.com/staff-api/v1';
const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase-applet-config.json'), 'utf8'));
const firebaseApiKey = process.env.VITE_STAFF_FIREBASE_API_KEY || firebase.apiKey;
if (!firebaseApiKey) throw new Error('Set VITE_STAFF_FIREBASE_API_KEY before building.');

await build({
  configFile: false,
  envDir: false,
  publicDir: false,
  root: path.join(root, 'apps/staff'),
  plugins: [react()],
  base: './',
  define: {
    __STAFF_ROLE__: JSON.stringify('sales'),
    __STAFF_PREVIEW_ALLOWED__: 'false',
    'import.meta.env.VITE_STAFF_FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
    'import.meta.env.VITE_STAFF_API_BASE_URL': JSON.stringify(backendBaseUrl),
  },
  logLevel: 'warn',
  build: { outDir: wwwDir, emptyOutDir: true, rollupOptions: { input: path.join(root, 'apps/staff/sales/index.html') } },
});
const nestedHtml = path.join(wwwDir, 'sales/index.html');
const rootHtml = path.join(wwwDir, 'index.html');
let html = fs.readFileSync(nestedHtml, 'utf8').replaceAll('../assets/', './assets/').replaceAll('crossorigin', '');
html = html.replace('<head>', `<head>\n<script>window.__ATTAIE_STAFF_API_BASE_URL__ = ${JSON.stringify(backendBaseUrl)};</script>`);
fs.writeFileSync(rootHtml, html);
fs.unlinkSync(nestedHtml);
fs.rmdirSync(path.dirname(nestedHtml));
// Copy self-hosted logos so offline/bundled WebView assets resolve cleanly.
for (const name of ['logo.png', 'login-logo.png']) fs.copyFileSync(path.join(root, 'public', name), path.join(wwwDir, name));
for (const name of ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png']) fs.copyFileSync(path.join(root, 'apps/staff/pwa-assets', name), path.join(wwwDir, name));
fs.writeFileSync(path.join(wwwDir, 'BUILD-STATUS.json'), JSON.stringify({ builtAt: new Date().toISOString(), backendBaseUrl, previewAllowed: false, role: 'sales' }, null, 2));
// Mirror www/ into app/src/main/assets/www/ for direct Android Studio Gradle builds.
if (!androidAssetsWwwDir.startsWith(androidRoot + path.sep)) throw new Error('Invalid Android assets path.');
fs.rmSync(androidAssetsWwwDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(androidAssetsWwwDir), { recursive: true });
fs.cpSync(wwwDir, androidAssetsWwwDir, { recursive: true });
console.log(`[build-sales-android] Fresh Android/iOS Sales assets; backend ${backendBaseUrl}; preview disabled.`);
