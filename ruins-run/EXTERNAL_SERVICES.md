# External services and unavailable items

## Game runtime

The exported game code contains **no backend service, database, external API call, authentication, analytics call, WebSocket, uploaded-file dependency, cloud save, service worker, local storage, session storage, IndexedDB, audio, video, or external font**.

Everything required by the game is included locally:

- HTML structure
- CSS
- JavaScript game logic
- Canvas animation and rendering code
- The background PNG
- All UI and status text

The game uses the operating system's `system-ui` font stack, so exact glyph rendering can vary slightly between Windows, macOS, Linux, Android, and iOS. No downloadable font file existed on the published page.

## Hosting-only behavior not included in the runnable entry

The published HTTP response contained a Cloudflare-injected challenge/telemetry script that dynamically requests `/cdn-cgi/challenge-platform/scripts/jsd/main.js`. That script belongs to the hosting layer, is not part of the game, changes over time, and would fail when run from a normal local server. It was therefore omitted from the runnable `index.html`.

For auditability, the unmodified response—including that injected script—is preserved at `archive/published-response.html`.

The published hostname, TLS certificate, DNS configuration, Cloudflare configuration, and ChatGPT Sites hosting environment are external infrastructure and cannot be packaged as frontend source.

## Favicon

The browser requested `/favicon.ico`, but that URL returned the full HTML page with a `text/html` content type instead of an icon. There was therefore no valid favicon asset available to export, and no replacement was invented.
