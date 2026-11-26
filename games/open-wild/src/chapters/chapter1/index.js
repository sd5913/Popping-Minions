// Chapter 01 module — assembled from data and builders.
// Each chapter module must export the interface below so the engine can drive
// it generically. See ../ARCHITECTURE.md for the full spec.

import * as THREE from "three";
import { CHAPTER, FEEDBACK, NARRATION, DIALOGUE, COPY, progressToDistance } from "./data.js";
import builders from "./builders.js";

export default {
  // ---- identity --------------------------------------------------------
  id: CHAPTER.id,
  number: CHAPTER.number,
  title: CHAPTER.title,
  series: CHAPTER.series,

  // ---- data (plain JSON-friendly objects) ------------------------------
  data: CHAPTER,
  copy: COPY,
  feedback: FEEDBACK,
  narration: NARRATION,
  dialogue: DIALOGUE,
  progressToDistance,

  // ---- scene hooks -----------------------------------------------------
  scene: {
    model: `${import.meta.env.BASE_URL}models/chapter1.glb`,
    transform: (x, y, z) => [x, z, -y], // Blender → Three
  },

  // ---- three.js builders (injected with shared deps by the runner) ----
  builders,

  // ---- optional lifecycle hooks ---------------------------------------
  hooks: {},
};
