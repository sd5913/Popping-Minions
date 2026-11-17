
# MISSED THIS STOP

A first-person narrative running game.

## Framework

- Vite
- Vanilla JavaScript
- Canvas 2D
- Modular game architecture

## Game Structure

src/
  core/
    Game.js
    SceneManager.js

  chapters/
    chapters.js

  controls/
    InputManager.js

  systems/
    MovementSystem.js
    CollisionSystem.js

  ui/
    HUD.js

  main.js
  style.css

public/
  assets/
    backgrounds/
    obstacles/
    props/
    ui/
    audio/

## Controls

| Input | Action |
|---|---|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Jump |
| Enter | Interact / Continue |
| Arrow Up / W | Move forward at ending |

## Game Chapters

1. Prologue - Can't Be Late
2. Chapter 1 - Standard Answer Avenue
3. Chapter 2 - Everyone's Own Pace
4. Chapter 3 - After the Mistake
5. Chapter 4 - A River Without a Route
6. Epilogue - Missed This Stop

## Core Design Principles

- First-person perspective
- Three-lane movement
- Mistakes do not reset the journey
- Dialogue slows down gameplay
- One unified movement system
- Gesture controls can be integrated later

## Development

Install dependencies:

npm install

Start development server:

npm run dev

Build production version:

npm run build
