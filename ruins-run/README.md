# Ruins Run Portal — portable source export

This folder is a local, portable export of the published **Ruins Run Portal** game captured on 2026-11-15 (Asia/Shanghai) from:

`https://ruins-run-portal.yxie7972.chatgpt.site/?utm_source=chatgpt.com`

The local runtime keeps the original visuals, mechanics, scene, text, controls, collision behavior, pause/restart flow, touch gestures, and finish state. The published page was a single HTML document with inline CSS, inline JavaScript, and one embedded PNG background. Those parts have been separated into normal source files to make continued development in Visual Studio Code practical.

## Windows setup

1. Install [Node.js LTS](https://nodejs.org/) (Node 20 or newer is recommended).
2. Install [Visual Studio Code](https://code.visualstudio.com/).
3. Extract the ZIP, then open the `Ruins-Run-Portal` folder in Visual Studio Code.
4. Open **Terminal → New Terminal**.
5. Install dependencies:

   ```powershell
   npm install
   ```

6. Start the local development server:

   ```powershell
   npm run dev
   ```

7. Open the local address printed by Vite (normally `http://localhost:5173/`).

Stop the server with `Ctrl+C`.

## Production build

```powershell
npm run build
```

The static client build is written to `dist/client/`. To preview that build locally:

```powershell
npm run preview
```

No publish or deployment step is included or performed.

## Controls

- `←` / `→`: change lane
- `Space` or `↑`: jump
- `P` or the on-screen button: pause/resume
- **重开**: restart
- Touch: swipe left/right to change lane; swipe upward to jump

## Project layout

- `index.html` — runnable page shell
- `src/styles.css` — original page styling
- `src/game.js` — original canvas game logic
- `assets/backdrop.png` — PNG extracted losslessly from the published data URI
- `archive/published-response.html` — byte-for-byte HTTP response captured from the published URL, including the host-injected Cloudflare script
- `EXTERNAL_SERVICES.md` — portability and external-dependency audit
- `SOURCE_MANIFEST.md` — source provenance and checksums
- `scripts/dev-server.mjs`, `scripts/build.mjs`, `package.json`, `package-lock.json` — dependency-free local development/build setup

## Adding to Popping-Minions

Copy this folder into the `Popping-Minions` repository, or copy its contents into the desired game subfolder. Commit the source files and `package-lock.json`; normally leave `node_modules/` and `dist/` uncommitted.

The game source has no framework or third-party package dependency. The included development server and build script use only Node.js built-in modules.
