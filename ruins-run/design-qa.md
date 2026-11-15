# Design QA

**Source visual truth**

- Published URL: `https://ruins-run-portal.yxie7972.chatgpt.site/?utm_source=chatgpt.com`
- Archived source: `archive/published-response.html`
- Source browser capture: in-app browser tab 1, captured inline during this export

**Implementation evidence**

- Local URL: `http://localhost:4173/`
- Browser-rendered implementation capture: in-app browser tab 2, captured inline during this export
- Viewport: 390 × 844 CSS px
- Source screenshot pixels: 390 × 844
- Implementation screenshot pixels: 390 × 844
- Device scale factor: 1
- Density normalization: none required
- State: initial run, paused immediately after load; the published capture displayed 146 m remaining and the local capture displayed 148 m because the source advanced slightly before pause

**Full-view comparison evidence**

The source and local captures were emitted together in one comparison input at the same 390 × 844 viewport. The cave opening, city backdrop, glowing portal, three-lane road, obstacle geometry, header badges, footer instruction label, and pause/restart controls matched. Small obstacle-position differences were consistent with the two-meter dynamic timing difference and were not design drift.

The background asset is byte-identical to the published data URI after decoding (SHA-256 `52930427C71B97D87C3AFF7957DAC90BC344E8B2E9AE0D9F7D5D531AF51E0CD2`). The CSS is text-identical to the published inline CSS. The game JavaScript is text-identical apart from replacing the embedded PNG data URI with `assets/backdrop.png`.

**Focused region comparison evidence**

- Header: title badge and live distance/status badge matched in family, weight, size, padding, radius, border, color, and placement.
- Footer: instruction text and pause/restart controls matched in spacing, typography, surface treatment, and mobile positioning.
- Game canvas: backdrop crop, portal glow, road perspective, obstacle faces, outlines, shadows, and motion states matched because the rendering logic and raster asset are preserved.

**Required fidelity surfaces**

- Fonts and typography: passed. Both builds use the same `system-ui` stack, sizes, weights, line heights, and original Chinese copy.
- Spacing and layout rhythm: passed. The fixed header/footer offsets, control gaps, canvas sizing, mobile media query, and full-viewport layout match.
- Colors and visual tokens: passed. The original CSS colors and canvas rendering colors/gradients are unchanged.
- Image quality and asset fidelity: passed. The source PNG was losslessly extracted and verified by hash; there are no substituted or generated visuals.
- Copy and content: passed. Title, controls, distance, collision, pause/resume, and completion text match the published source.
- Icons: passed. The game uses only the original text arrow glyphs and no external icon set.
- Responsiveness: passed at the published narrow layout and 390 × 844 mobile viewport.
- Accessibility: the original canvas label, live status output, semantic buttons, keyboard controls, and touch controls are preserved. No new accessibility behavior was introduced.

**Interactions tested**

- Automatic forward movement
- Left/right keyboard lane changes
- Space-bar jump
- Pause and resume button
- Restart button
- Touch swipe left/right
- Touch swipe upward to jump
- Collision and recovery status
- Completion overlay and disabled pause button
- Desktop/narrow and 390 × 844 mobile rendering

Browser console errors/warnings checked on the local build: none.

**Findings**

- No actionable P0, P1, or P2 differences.

**Open Questions**

- None.

**Implementation Checklist**

- [x] Preserve the published HTML structure and copy.
- [x] Preserve CSS exactly.
- [x] Preserve game logic exactly apart from the local asset path.
- [x] Extract and verify the embedded PNG.
- [x] Verify keyboard, touch, collision, pause/restart, and finish behavior.
- [x] Check local browser console output.
- [x] Build and test the static package.

**Comparison history**

1. The first desktop comparison was discarded because the source and implementation captures were not normalized to the same viewport.
2. Both pages were reloaded and captured together at 390 × 844. No actionable P0/P1/P2 mismatch was found, so no visual fixes were required.

**Follow-up Polish**

- None. Polish changes would alter the published design and are outside this export.

final result: passed
