# Chapter 1 Playable MVP — The Standard Answer Avenue

This is a **standalone playable development prototype**, not a replacement for the existing root `index.html`.

## Run locally

For **keyboard-only testing**, open `phase1/index.html` in a desktop browser.

For **camera hand tracking**, use HTTPS or a local HTTP server:

```bash
cd Popping-Minions
python3 -m http.server 8000
```

Then visit **http://localhost:8000/phase1/**, choose **Enable webcam**, allow camera access, show one hand, and press **Center hand** to calibrate the neutral position. The hand-tracking library, WASM runtime, and hand model are loaded on demand from external CDNs; an internet connection is required the first time.

If the camera or model cannot load, keyboard and on-screen controls remain usable. You can click **Disable webcam** to return to keyboard-only input. Camera activation pauses an active run so you can calibrate safely; press **Resume** after calibration.

## Controls

| Input | Action |
| --- | --- |
| Move one hand left/right | Choose left/center/right lane |
| Raise hand quickly | Jump |
| Pinch thumb + index finger | Talk, confirm, use paper |
| Left/Right arrow or A/D | Change lane / dialogue selection |
| Space, Up arrow, W | Jump |
| E or Enter | Interact / advance dialogue |\n| P | Pause / resume |
| On-screen buttons | Touch/mouse fallback |

## Finish the chapter

1. Start and avoid pencils, crates, and gaps. Collisions lead to a lower path instead of Game Over.
2. At the traveller, move to the **right lane**, then pinch or press **E**.
3. Advance the dialogue; choose an answer and collect the **Folded Examination Paper**.
4. Keep running. At the broken road, move to the **center lane** and pinch / press **E**.
5. Watch the paper unfold into a bridge and continue to the chapter-complete screen.

## Scope

Implemented in this prototype:
- Three-lane perspective runner and jump-based collision avoidance.
- Fail-forward lower-route recovery.
- NPC stop, dialogue selection, and collection.
- Persistent in-chapter inventory and item-use gate.
- Visible bridge-building animation and chapter finish.
- Optional camera input via MediaPipe Hand Landmarker, including input throttling, recalibration and camera shutdown.\n- Pause/resume control and different NPC responses to dialogue choices.
- Keyboard and on-screen fallback controls.

Not yet part of this MVP:
- Chapters 2–4, multiple endings, sound design, production art.
- Persistent save across sessions.
- Fully verified multi-device camera performance.

**Testing:** Run `node --check phase1/game.js` and `node phase1/test-mvp.cjs` (Node.js 18+). An automated workflow also checks both.

**Privacy:** This prototype processes webcam frames locally in the browser. It does not contain an upload path for camera video. MediaPipe JavaScript/WASM and the hand model are fetched from third-party CDNs when webcam mode is enabled.
