# Phase 1 — Manual Playtest Checklist

**Build:** `phase1/index.html` on branch `feat/chapter1-hand-gesture-mvp`  
**Goal:** Verify that a player can complete Chapter 1 using hand gestures, without needing a keyboard after calibration.

## Set up

1. From the repository root run `python3 -m http.server 8000`.
2. Open `http://localhost:8000/phase1/` in Chrome.
3. Click **Enable webcam**, allow access, hold one open hand in view, and click **Center hand**.
4. Click **Start running** or **Resume**.

## Acceptance checks

| # | Test | Expected result | Result |
|---|---|---|---|
| 1 | Move one open hand to the left, center and right | Character changes between the three lanes, without rapid flickering | ☐ |
| 2 | Raise the hand quickly before a pencil obstacle | Character jumps; a correctly timed jump avoids collision | ☐ |
| 3 | Let the character hit an obstacle | Character falls onto an alternative lower road; the game continues | ☐ |
| 4 | Reach traveller in right lane and pinch | Running stops and dialogue opens | ☐ |
| 5 | Move hand left/right during final dialogue choice, then pinch | Selected answer receives a distinct NPC reply | ☐ |
| 6 | Confirm the reply and collect the folded paper | Dialogue closes; inventory shows **FOLDED PAPER** | ☐ |
| 7 | Reach blocked road, move to center lane, pinch | Paper bridge unfolds; forward motion resumes | ☐ |
| 8 | Continue beyond bridge | Chapter-complete panel appears, with replay option | ☐ |
| 9 | Press P / Pause and resume | Progress freezes when paused and resumes correctly | ☐ |
| 10 | Remove hand from camera view while running | After a short delay, game waits for hand; no uncontrolled forward movement | ☐ |
| 11 | Click Disable webcam, then test arrows / Space / E | Camera releases and keyboard mode is usable | ☐ |
| 12 | Refresh or close tab while using camera | Browser camera indicator turns off | ☐ |

## Feedback notes

- Browser / device:
- How many attempts until completing Chapter 1:
- Unreliable gesture(s):
- Most confusing step:
- Collision fairness:
- NPC text readability:
- Suggestions:

## Known limitations

- MediaPipe must download the hand model and WASM files from online hosts; offline webcam mode is not supported.
- Camera tracking has not yet been validated on all desktop and mobile browsers.
- The NPC and paper bridge are a first-pass prototype, not final visual assets.
- The main project root page remains unchanged; this playtest is limited to `phase1/`.

## Done criteria

Phase 1 is ready for team review when the full sequence works with **hand controls** in at least one actual desktop-browser playtest, and the 12 checks above have been evaluated. Automated CI passing alone is insufficient.
