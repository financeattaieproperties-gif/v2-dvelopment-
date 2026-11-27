import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetOrigin = 'https://website.attaieproperties.com';
const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase-applet-config.json'), 'utf8'));
const firebaseApiKey = process.env.VITE_STAFF_FIREBASE_API_KEY || firebase.apiKey;
if (!firebaseApiKey) throw new Error('Set VITE_STAFF_FIREBASE_API_KEY before building.');

for (const [role, app] of [['callcenter', 'callcenter-desktop'], ['sales', 'sales-desktop']]) {
  const outDir = path.join(root, app, 'www');
  // Each fixed output stays inside its wrapper; never reuse public preview bundles.
  if (!outDir.startsWith(root + path.sep)) throw new Error('Invalid native output path.');
  await build({
    configFile: false,
    envDir: false,
    publicDir: role === 'sales' ? path.join(root, 'apps/staff/pwa-assets') : false,
    root: path.join(root, 'apps/staff'),
    plugins: [react(), ...(role === 'sales' ? [VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: { name: 'Attaie Sales CRM', short_name: 'Attaie Sales', start_url: '/sales/', scope: '/sales/', display: 'standalone', icons: [{src:'pwa-192x192.png',sizes:'192x192',type:'image/png'},{src:'pwa-512x512.png',sizes:'512x512',type:'image/png'}] },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ttf,woff,woff2,webmanifest}'],
        navigateFallback: '/sales/index.html',
        navigateFallbackDenylist: [/^\/staff-api\//, /^\/api\//],
        cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true,
        importScripts: ['sw-notifications.js'],
        // Cache app files only. Authenticated CRM responses stay in per-user snapshot storage.
        runtimeCaching: [],
        manifestTransforms: [async entries => ({manifest: entries.map(entry => ({...entry,url:entry.url.replace(/(?:^|\/)sales\/index\.html$/, 'index.html')}))})],
      },
    })] : [])],
    base: `/${role}/`,
    define: {
      __STAFF_ROLE__: JSON.stringify(role),
      __STAFF_PREVIEW_ALLOWED__: 'false',
      'import.meta.env.VITE_STAFF_FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
      // Desktop's loopback proxy keeps sessions and CSRF on one local origin.
      'import.meta.env.VITE_STAFF_API_BASE_URL': JSON.stringify(''),
    },
    logLevel: 'warn',
    build: { outDir, emptyOutDir: true, rollupOptions: { input: path.join(root, 'apps/staff', role, 'index.html') } },
  });
  fs.renameSync(path.join(outDir, role, 'index.html'), path.join(outDir, 'index.html'));
  fs.rmdirSync(path.join(outDir, role));
  for (const name of ['logo.png', 'login-logo.png']) fs.copyFileSync(path.join(root, 'public', name), path.join(outDir, name));
  fs.writeFileSync(path.join(outDir, 'BUILD-STATUS.json'), JSON.stringify({ builtAt: new Date().toISOString(), targetOrigin, previewAllowed: false, role }, null, 2));
  console.log(`[build-desktop-apps] Fresh ${app} assets; backend ${targetOrigin}; preview disabled.`);
}
