# Rebuild Call Center desktop for V2 testing

Target: `https://website.attaieproperties.com`. Version: 2.0.1.

From repository root, install dependencies once. Then:

```powershell
cd callcenter-desktop
npm ci
npm run pack:win
```

`prepack:win` compiles the current Call Center and Sales staff source with preview disabled. It never copies `public/callcenter/` or other stale website builds. The public Firebase web identifier comes from the checked-in public configuration or `VITE_STAFF_FIREBASE_API_KEY`. `.env.local` is never loaded.

Installers are written to `release/`. For assets only, run `npm run build:web`. Use `pack:mac` on a Mac for macOS builds and `pack:linux` on Linux for Linux builds. Signing/notarization needs the owner's platform credentials; an unsigned Windows installer may show a publisher warning.

The wrapper proxies through its loopback HTTP server while the remote connection uses the selected backend. A 404 never replays the request against another deployment. V2 testing uses a separate settings/cookie directory, preserving an older installation's data. The default backend is the testing subdomain. Change the server URL only as part of an authorized environment change.

Verify the installed app's Firebase login, PHP session expiry, call logging, follow-ups, uploads, offline behavior, and server-error handling against the configured testing environment before staff rollout.
