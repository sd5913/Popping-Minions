# The Next Stop — Missed This Stop

**SD5913 Group Project 2026 | Team Popping Minions**

> *Failure is not the end. Sometimes, it leads to another path.*

---

## 🎮 Play the Game — Official Public Demo

### [▶ PLAY MISSED THIS STOP](https://popping-minions.pages.dev/)

**Public Demo:** https://popping-minions.pages.dev/

**Latest Production Build:** https://87ea449c.popping-minions.pages.dev/

The game is publicly accessible through Cloudflare Pages. No installation is required.

The public version supports:

- Real-time AI hand tracking through your webcam.
- Camera-based left and right lane switching.
- Open-palm gesture for jumping.
- Closed-fist gesture for interaction and narrative progression.
- Keyboard and touch/swipe controls.
- A continuous first-person running experience across six narrative sections.

**Camera permission is required for gesture-based gameplay.** Please allow camera access when prompted by your browser.

If camera access is unavailable, keyboard and swipe controls can still be used.

---

## 1. About the Game

**The Next Stop** (playable title: **Missed This Stop**) is a first-person interactive narrative running game about academic pressure, personal expectations, failure, and finding alternative paths in life.

The protagonist rushes towards an important examination, believing that missing it means losing their future.

However, the journey takes them through unexpected environments, obstacles, and encounters. As the road changes, the player gradually discovers that a mistake does not have to end the journey.

There is always another way forward.

**Core Message:**

Missing an opportunity does not mean losing your future. Life is not a single race with only one correct destination.

**Target Audience:**

Young adults and students experiencing academic pressure, uncertainty about their future, and anxiety about falling behind.

---

## 2. Game Structure

The experience consists of six interconnected narrative sections.

| Section | Chapter | Narrative Theme |
|---|---|---|
| 01 | Prologue — Can't Be Late | The pressure of arriving on time |
| 02 | Chapter 1 — Standard Answer Avenue | Social expectations and standard answers |
| 03 | Chapter 2 — Everyone's Own Pace | Comparing personal progress with others |
| 04 | Chapter 3 — After the Mistake | Learning to accept mistakes |
| 05 | Chapter 4 — A River Without a Route | Exploring uncertainty and alternative paths |
| 06 | Epilogue — Missed This Stop | Discovering a new understanding of the journey |

The player moves through different environments while interacting with obstacles, narrative events, and chapter transitions.

---

## 3. Core Gameplay Features

### 3.1 First-Person Running System

- Three-lane movement system.
- Smooth lane transitions.
- Continuous forward movement.
- Jumping mechanics.
- Dynamic obstacle generation.
- Collision detection and recovery.
- Speed and difficulty variation across chapters.

### 3.2 Narrative Interaction

- Chapter-specific environments.
- Character dialogue and narrative events.
- Interactive story progression.
- Gesture-triggered interactions.
- Pause and resume functionality.
- Continuous progression after mistakes.
- Final narrative ending sequence.

### 3.3 AI Hand Tracking

The game integrates **MediaPipe Hand Landmarker** to provide camera-based interaction.

Players can control the game through natural hand movements without a physical controller.

**Supported Hand Interactions:**

| Hand Input | Game Action |
|---|---|
| Move hand left | Switch to left lane |
| Move hand right | Switch to right lane |
| Open palm | Jump |
| Closed fist | Interact / Continue narrative |

**Hand Tracking Features:**

- Real-time webcam input.
- Hand landmark detection.
- Horizontal hand-position tracking.
- Left, neutral, and right control zones.
- Gesture recognition.
- Armed-state detection.
- Action cooldown mechanism.
- Hand detection confidence monitoring.
- FPS and gesture debugging information.

The camera preview provides visual feedback so players can observe their hand movements and tracking status.

### 3.4 Multimodal Interaction Development

The project explores the integration of different human input methods.

| Input Technology | Purpose |
|---|---|
| Keyboard | Basic movement and interaction |
| Touch / Pointer | Swipe-based movement |
| Hand Tracking | Camera-based gesture control |
| Facial Expression Tracking | Future interaction development |
| Full-Body Pose Tracking | Future movement interaction development |

The current playable version focuses on keyboard, pointer, and hand-tracking interaction.

Facial-expression and full-body pose tracking remain future development directions.

---

## 4. Controls

### Keyboard Controls

| Key | Action |
|---|---|
| ← / A | Move left |
| → / D | Move right |
| ↑ / Space | Jump |
| Enter | Interact / Continue |
| Escape | Pause / Resume |

### Camera Controls

1. Open the public demo.
2. Click **ENABLE CAMERA**.
3. Allow browser camera permission.
4. Keep one hand visible in front of the webcam.
5. Move your hand left or right to switch lanes.
6. Show an open palm to jump.
7. Make a closed fist to interact with narrative events and continue chapter transitions.

### Touch / Pointer Controls

| Gesture | Action |
|---|---|
| Swipe left | Move left |
| Swipe right | Move right |
| Swipe up | Jump |

---

## 5. Technical Implementation

### Technology Stack

| Technology | Application |
|---|---|
| HTML5 Canvas 2D | Game rendering |
| JavaScript ES Modules | Game logic and interaction |
| CSS | Interface and visual presentation |
| Vite | Development and production build |
| MediaPipe Tasks Vision | AI hand tracking |
| WebRTC / Browser Media APIs | Webcam access |
| GitHub | Version control and collaboration |
| Cloudflare Pages | Public game deployment |

### Game Architecture

The project uses a modular architecture to separate game logic, input processing, rendering, and gameplay systems.

```text
missed-this-stop/
├── index.html
├── package.json
├── public/
└── src/
    ├── chapters/
    │   └── chapters.js
    ├── controls/
    │   ├── HandController.js
    │   ├── InputManager.js
    │   ├── InputAdapter.js
    │   ├── FaceController.js
    │   └── PoseController.js
    ├── core/
    │   ├── Game.js
    │   └── SceneManager.js
    ├── entities/
    ├── rendering/
    │   └── FirstPersonRenderer.js
    ├── systems/
    │   ├── MovementSystem.js
    │   └── CollisionSystem.js
    ├── ui/
    └── main.js
```

### Main System Responsibilities

- **Game.js:** Main game loop, system initialization, and gameplay coordination.
- **HandController.js:** Webcam initialization, MediaPipe hand detection, gesture recognition, and hand-based actions.
- **InputManager.js:** Keyboard and pointer input management.
- **MovementSystem.js:** Lane movement, jumping, and player movement physics.
- **CollisionSystem.js:** Obstacle detection and mistake handling.
- **SceneManager.js:** Game scenes and chapter transitions.
- **FirstPersonRenderer.js:** First-person environment and road rendering.

---

## 6. Visual Direction

The visual identity is built around a stylized first-person journey.

Three visual elements connect the different chapters:

1. **Orange-red backpack:** A consistent visual identity for the protagonist.
2. **Road extending into the distance:** Represents the continuous journey of life.
3. **Recurring circular imagery:** Clocks, wheels, tunnels, and ripples connect different environments.

The environments evolve throughout the narrative to reflect different psychological states and life experiences.

---

## 7. Run the Game Locally

### Requirements

- Node.js
- npm
- Visual Studio Code
- A modern browser
- Webcam access for hand tracking

### Installation

```bash
cd missed-this-stop
npm install
```

### Start Development Server

```bash
npm run dev
```

Open the local URL provided by Vite, usually:

```text
http://localhost:5173/
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

The production files are generated in:

```text
missed-this-stop/dist/
```

---

## 8. Public Deployment

The official game is hosted on **Cloudflare Pages** and connected to the GitHub repository.

| Configuration | Value |
|---|---|
| Repository | sd5913/Popping-Minions |
| Production Branch | main |
| Hosting | Cloudflare Pages |
| Root Directory | missed-this-stop |
| Build Command | npm run build |
| Output Directory | dist |
| Public Demo | https://popping-minions.pages.dev/ |

### Automatic Deployment

The deployment workflow is:

1. Develop and test the game locally.
2. Commit changes to GitHub.
3. Push or merge updates into `main`.
4. Cloudflare Pages automatically builds the project.
5. The latest successful production version becomes publicly accessible.

The official public URL remains unchanged when new production versions are deployed.

---

## 9. Development Progress

| Date | Milestone |
|---|---|
| 5 Nov 2026 | Initial browser prototype and movement experiments |
| 12 Nov 2026 | Narrative and gameplay integration |
| 17 Nov 2026 | First-person running game integrated into the main branch |
| 18 Nov 2026 | Phase 2 multimodal input and MediaPipe hand tracking integration |
| 19 Nov 2026 | Windows and macOS builds tested; camera and hand-control integration refined |
| 19 Nov 2026 | Production deployment and public demo updated |

### Current Development Priorities

- Improve hand-tracking accuracy and stability.
- Refine left/right lane-switching sensitivity.
- Improve gesture recognition and cooldown behavior.
- Test camera interaction across Windows and macOS.
- Refine chapter transitions and narrative pacing.
- Continue developing facial-expression and full-body motion input.

---

## 10. Team and Contributions

**Team:** Popping Minions

**Course:** SD5913 — Group Project 2026

**Team Lead:** Yichen Huang

**Team Members:**

- Yichen Huang — Project coordination, programming, documentation, and visual development.
- Xie Yiling — Narrative writing and detailed level design.
- Yan Yan — AI-assisted visual concept development.
- Duan Xiaoying — AI-assisted visual concept development.

All team members contributed to the overall game concept, gameplay discussions, and interactive design decisions.

For detailed responsibilities and asset attribution, see [CREDITS.md](docs/CREDITS.md).

---

## 11. Credits and Acknowledgements

This project uses AI-assisted tools for concept exploration, programming assistance, debugging, and visual development.

The team reviews and tests the generated outputs and integrates them into the final interactive experience.

Technologies and resources include:

- MediaPipe Tasks Vision.
- Vite.
- HTML5 Canvas.
- JavaScript.
- GitHub.
- Cloudflare Pages.

See [CREDITS.md](docs/CREDITS.md) for additional information.

---

## 12. Project Links

| Resource | Link |
|---|---|
| GitHub Repository | https://github.com/sd5913/Popping-Minions |
| Official Public Demo | https://popping-minions.pages.dev/ |
| Latest Production Deployment | https://87ea449c.popping-minions.pages.dev/ |
| Game Concept | [docs/GAME_CONCEPT.md](docs/GAME_CONCEPT.md) |
| Development Progress | [docs/PROGRESS.md](docs/PROGRESS.md) |
| Credits | [docs/CREDITS.md](docs/CREDITS.md) |

---

**Final Submission**

SD5913 Group Project 2026

**Team Popping Minions**

*Missing a stop does not mean missing your future.*

**Keep moving forward.**
