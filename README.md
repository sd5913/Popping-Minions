# The Next Stop — Missed This Stop

**SD5913 Group Project 2026 | Team Popping Minions**

> *Failure is not the end. Sometimes, it leads to another path.*

## Play the Game

### Official Public Demo

**[Play Missed This Stop](https://popping-minions.pages.dev/)**

The official public build is hosted on **Cloudflare Pages**. Open the link above in a modern browser to play. The game is served over HTTPS, so camera permission can be requested by the browser.

If you do not want to use a camera, keyboard and pointer/swipe controls remain available.

## About the Game

**The Next Stop** (playable title: **Missed This Stop**) is a first-person narrative running game about a young person who believes that missing an important examination means losing their future.

The protagonist rushes towards an exam, but the journey takes them through a series of unexpected environments and encounters. As the road changes, the player discovers that a mistake does not have to end the journey—and that there may be more than one way forward.

**Core message:** Important opportunities deserve our effort, but they do not define our entire lives.

**Target audience:** Young adults and students experiencing academic pressure, uncertainty about the future, or anxiety about falling behind.

## Current Game Experience

The game is organized as a continuous journey across six narrative sections:

1. **Prologue — Can't Be Late**
2. **Chapter 1 — Standard Answer Avenue**
3. **Chapter 2 — Everyone's Own Pace**
4. **Chapter 3 — After the Mistake**
5. **Chapter 4 — A River Without a Route**
6. **Epilogue — Missed This Stop**

The current codebase includes:

- First-person Canvas 2D game rendering.
- Three-lane movement and animated lane transitions.
- Jumping, obstacle collision detection, and recovery that allow the run to continue.
- Chapter-specific environments, movement speeds, and obstacle types.
- Character dialogue, chapter transitions, pause/resume, and an ending sequence.
- Keyboard and pointer/swipe input.
- **MediaPipe hand tracking:** camera preview, hand-position zones for left/right lane movement, and gesture-triggered actions.
- A debug panel showing hand detection, gesture confidence, hand position, current zone, armed state, FPS, last action, and cooldown information.

Camera-based hand input is implemented in the current prototype. Facial-expression and full-body pose tracking are not yet part of the active gameplay controls.

## Controls

### Keyboard

| Input | Action |
|---|---|
| Left Arrow / A | Move left |
| Right Arrow / D | Move right |
| Space / Up Arrow | Jump |
| Enter | Interact / continue dialogue or chapter |
| Escape | Pause / resume |

### Camera and Hand Gestures

1. Click **ENABLE CAMERA** in the game interface.
2. Allow camera access when the browser asks for permission.
3. Keep one hand visible in front of the camera.
4. Move your hand into the left or right control zone to change lanes.
5. Show an **open palm** to jump.
6. Make a **closed fist** to interact, advance dialogue, or continue a chapter transition.

The camera preview uses a mirrored selfie view. Hand-control coordinates are handled separately so the player's visual left and right correspond to the intended game directions.

Hand tracking requires a browser with camera support and access to the MediaPipe model/WASM assets. Use the public HTTPS demo or a local `localhost` development server. If camera access is unavailable or denied, use keyboard or pointer controls.

### Pointer / Touch

| Input | Action |
|---|---|
| Swipe left / right on the game canvas | Change lane |
| Swipe up on the game canvas | Jump |

During dialogue and chapter transition screens, use **Enter**, a closed-fist interaction, or the on-screen button to continue.

## Run Locally

The main Vite application is in the `missed-this-stop/` directory.

### Requirements

- Node.js and npm
- A modern browser
- Camera permission for hand-tracking tests

### Start the development server

```bash
cd missed-this-stop
npm install
npm run dev
```

Open the local URL printed by Vite. Camera access is supported on `localhost`.

### Create and preview a production build

```bash
cd missed-this-stop
npm install
npm run build
npm run preview
```

Vite outputs production files to `missed-this-stop/dist/`.

## Public Deployment

The official public demo is deployed with **Cloudflare Pages**.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `missed-this-stop` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Public URL | [https://popping-minions.pages.dev/](https://popping-minions.pages.dev/) |

When changes are merged into `main`, Cloudflare Pages should build and publish the updated application automatically. Check the Cloudflare Pages deployment status if the public page has not updated yet.

## Repository Structure

```text
Popping-Minions/
├── .github/                 # GitHub workflows
├── docs/
│   ├── GAME_CONCEPT.md      # Narrative and game concept
│   ├── PROGRESS.md          # Development log and testing notes
│   └── CREDITS.md           # Team contributions and AI/asset credits
├── missed-this-stop/        # Main Vite game application
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── chapters/        # Chapter data and dialogue
│       ├── controls/
│       │   ├── HandController.js
│       │   ├── InputManager.js
│       │   ├── InputAdapter.js
│       │   ├── FaceController.js
│       │   └── PoseController.js
│       ├── core/            # Game loop and scene management
│       ├── rendering/       # First-person Canvas renderer
│       ├── systems/         # Movement and collision systems
│       ├── ui/              # HUD and game screens
│       └── main.js
├── index.html               # Earlier standalone Canvas prototype
└── README.md
```

The root-level `index.html` is an earlier standalone prototype. The current modular Vite application is maintained in `missed-this-stop/`.

## Narrative and Visual Direction

The six sections explore progress, expectations, mistakes, different life rhythms, uncertainty, and personal choice.

Three visual elements connect the journey:

1. The protagonist's orange-red backpack.
2. A road or pathway extending towards the distance.
3. Recurring circular imagery, such as clocks, wheels, tunnels, and ripples.

For the fuller narrative and design rationale, see [Game Concept](docs/GAME_CONCEPT.md).

## Team and Contributions

**Team Lead:** Yichen Huang

**Team Members:**
- Yichen Huang — Project coordination, programming, documentation, and visual development
- Xie Yiling — Narrative writing and detailed level design
- Yan Yan — AI-assisted visual concept development
- Duan Xiaoying — AI-assisted visual concept development

All team members contributed to the overall game concept, gameplay discussion, and interactive design decisions.

See [Team Contributions and AI Credits](docs/CREDITS.md) for detailed responsibilities, tools, and asset attribution.

## Development Progress

This project follows an iterative development process with weekly tutor reviews.

| Date | Milestone |
|---|---|
| 5 Nov 2026 | Initial browser prototype and core movement experiments |
| 12 Nov 2026 | Narrative and gameplay integration work |
| 17 Nov 2026 | First-person runner prototype merged into `main`; Cloudflare production deployment triggered |
| 18 Nov 2026 | Phase 2 hand-tracking controls, camera interface, and MediaPipe integration added to the multimodal feature branch |
| 19 Nov 2026 | Windows production build completed successfully; camera and hand-control integration continues to be tested |

See the [Development Progress Log](docs/PROGRESS.md) for implementation notes, testing evidence, challenges, and next steps.

## Technologies

- HTML5 Canvas 2D
- JavaScript (ES modules)
- CSS
- Vite
- MediaPipe Tasks Vision
- Browser camera APIs
- GitHub and GitHub Actions
- Cloudflare Pages

AI tools have supported concept exploration, programming assistance, debugging, and documentation. The team reviews and tests project outputs. See [CREDITS.md](docs/CREDITS.md) for the current credits record.

## Current Development Priorities

- Continue playtesting the complete chapter flow.
- Refine hand-tracking stability, lane movement thresholds, and gesture cooldowns.
- Test camera behavior across Windows and macOS browsers.
- Improve narrative pacing, obstacle timing, collision feedback, and dialogue presentation.
- Develop facial-expression and full-body motion capture as future input capabilities.

## Submission

**Course:** SD5913 — Group Project 2026  
**Repository:** <https://github.com/sd5913/Popping-Minions>  
**Official game:** <https://popping-minions.pages.dev/>  
**Final deadline:** 6 December 2026, 23:59 Hong Kong Time.

## Chapter 02 countryside scene assets

The countryside environment has been modeled in Blender through a Codex-to-Blender workflow and UV textured. The editable scene, texture package, rendered previews, and integration notes are available in [Chapter 02 countryside assets](art-assets/chapter-02-countryside/README.md).
