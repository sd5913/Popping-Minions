
import "./style.css";
import { Game } from "./core/Game.js";

const canvas = document.querySelector("#game-canvas");

if (!canvas) {
  throw new Error("Game canvas was not found.");
}

const game = new Game(canvas);

game.start();

window.missedThisStop = game;

console.log("Missed This Stop - Framework V1.0 initialized.");
