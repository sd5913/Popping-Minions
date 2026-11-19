
import "./style.css";
import { Game } from "./core/Game.js";

// =====================================
// 1. FIND GAME CANVAS
// =====================================

const canvas = document.querySelector("#game-canvas");

if (!canvas) {
  throw new Error("Game canvas was not found.");
}

// =====================================
// 2. INITIALIZE GAME
// =====================================

let game = null;

try {
  game = new Game(canvas);

  game.start();

  // Expose game instance for debugging
  window.missedThisStop = game;

  console.log(
    "Missed This Stop - Framework V1.1 initialized."
  );

} catch (error) {
  console.error("Game initialization failed:", error);
  throw error;
}

// =====================================
// 3. CLEANUP
// =====================================

window.addEventListener(
  "beforeunload",
  () => {
    if (game && typeof game.destroy === "function") {
      game.destroy();
    }

    game = null;
    window.missedThisStop = null;
  },
  { once: true }
);
