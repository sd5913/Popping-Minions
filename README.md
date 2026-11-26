# The Next Stop — Team Popping Minions

SD5913 Creative Programming · Group Project 2026

*The Next Stop* is a first-person narrative runner about a student who misses an important exam. Players change lanes, jump over obstacles and discover how a setback can open a different route. It is designed for students and young adults navigating academic pressure and uncertainty.

## Play the game

| Build | Public link | What to try |
| --- | --- | --- |
| **The Open Wild** | **[Play the four-chapter 3D build](https://sd5913.github.io/Popping-Minions/)** | Start from the chapter directory, try the four environments and replay chapters independently. |
| **Missed This Stop** | [Play the Cloudflare hand-tracking build](https://popping-minions.pages.dev/) | Try the 2D narrative runner with keyboard, pointer or optional webcam gestures. |

**Version note:** The GitHub Pages build contains Chapters 01–04 and has no webcam controls. The separate [TRAE preview](https://37lray4smy34bm6szcf.traesite.cn/) also shows a prologue, an epilogue and an **Enable Camera** option in the prologue. Its matching source revision and gameplay have not been verified in this repository. The Cloudflare build is the separate, earlier hand-tracking runner.

**Open Wild controls:** A/D or arrow keys to change lanes, Space to jump, S to duck and Esc to pause. Follow the on-screen prompts for chapter-specific actions.

**Missed This Stop controls:** A/D or arrow keys to change lanes, Space or Up to jump, Enter to interact and Esc to pause. To use gestures, select **Enable camera** and grant browser permission. Hand position changes lanes, an open palm jumps and a closed fist interacts.

The team still needs to confirm which link to list as the final submission build. The course deadline is **6 December 2026, 23:59 Hong Kong time**. Follow the Canvas instructions and submit the team repository URL. [Course brief](https://github.com/sd5913/pfad/blob/2026/assignments/group-project.md).

For deployment evidence and outstanding checks, see the [Week 12 playtest record](docs/PROGRESS.md#26-november-2026--week-12-delivery-candidate).

## Run locally

Install Git and Node.js 22.12 or later in the Node 22 series. Node includes npm.

```bash
git clone https://github.com/sd5913/Popping-Minions.git
cd Popping-Minions/games/open-wild
npm ci
npm run dev
```

Open the localhost URL printed by Vite. For the Cloudflare hand-tracking build, start in `Popping-Minions/missed-this-stop` and run the same npm commands. In either app, use `npm run build` to build into `dist/` and `npm run preview` to serve that build locally. For a GitHub Pages-style Open Wild build, use `npm run build -- --base ./`.

## Repository guide

| Location | Contents |
| --- | --- |
| [Games and prototypes](games/) | [Open Wild](games/open-wild/) includes the Three.js runner, four chapter modules and browser-ready GLBs. See its [architecture notes](games/open-wild/src/ARCHITECTURE.md). The [original HTML prototype](games/prototypes/early-canvas/) is kept here for reference. |
| [Missed This Stop source](missed-this-stop/) | Canvas 2D runner and MediaPipe hand controls. |
| [Art assets](art-assets/) | Editable Blender sources and reference images for Chapters [01](art-assets/chapter-01-standard-answer-avenue/), [02](art-assets/chapter-02-countryside/) and [04](art-assets/chapter-04-ink-landscape/). The large Chapter 04 source downloads from [GitHub Releases](https://github.com/sd5913/Popping-Minions/releases/tag/chapter-04-scene-source). |
| [Design and progress](docs/) | [Game concept](docs/GAME_CONCEPT.md), [level design](docs/LEVEL_DESIGN.md), [development log](docs/PROGRESS.md) and [credits](docs/CREDITS.md). |
| [Scrum records](scrum/) | [Roles and contributions](scrum/roles.md), [Product Backlog](scrum/product-backlog.md), sprint records and weekly sync notes. |
| [Contributing](CONTRIBUTING.md) | Branch, PR and peer review workflow. |
| [Deployment](docs/DEPLOYMENT.md) | CI, preview links, production builds and credential handling. |

## Team and credits

Yichen Huang (Vivien) coordinated the project and contributed programming and visual development. Xie Yilin (Shally) led narrative and level design. Yan Yan (Amy) contributed to visual development, the Vite runner and MediaPipe input. Duan Xiaoying (Ember) contributed visual development and Chapter 01 environment art. See [contributions and Scrum roles](scrum/roles.md) and [full credits](docs/CREDITS.md).

Both apps use JavaScript, CSS and [Vite](https://vite.dev/). Open Wild uses [Three.js](https://threejs.org/) and Draco decoding for 3D assets. Missed This Stop uses Canvas and [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js) with a public model and WASM dependencies. Environment source files use Blender. The project documents ChatGPT/Codex, Jimeng AI and Doubao in its [AI and asset credits](docs/CREDITS.md).

## Known limitations

- Webcam controls are available in the Cloudflare build. They require HTTPS or localhost, browser permission, and access to the MediaPipe model and WASM. The keyboard is available as a fallback.
- Cross-browser camera testing and a complete four-chapter playthrough are still tracked in the [backlog](scrum/product-backlog.md). Face and full-body controls are outside the active game input.
- The Blender handoffs and playable GLB files are tracked separately. Check each scene's notes for texture portability and integration status.
