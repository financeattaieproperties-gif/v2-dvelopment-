# Rebuild Sales desktop for V2 testing

Target: `https://website.attaieproperties.com`. Version: 2.0.1.

From repository root, install dependencies, then:

```powershell
cd sales-desktop
npm ci
npm run pack:win
```

The prepack script freshly compiles the shared Sales source with preview disabled. It uses the public Firebase web configuration and never loads `.env.local`. Assets only: `npm run build:web`. Installers go to `release/`; distribution signing remains an owner configuration step.

V2 testing settings/cookies are isolated from an existing installation. Requests are never retried against another deployment. Verify Firebase login, session expiry, assigned-lead privacy, calls, uploads, and offline snapshots on the installed app before staff rollout.
