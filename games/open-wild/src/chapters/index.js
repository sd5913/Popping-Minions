// Chapter registry — each entry must export the interface in ARCHITECTURE.md.
// Order by `number` as a numeric string so Chapter 10 never sorts before Chapter 2.

import prologue from "./prologue/index.js";
import chapter1 from "./chapter1/index.js";
import chapter2 from "./chapter2/index.js";
import chapter3 from "./chapter3/index.js";
import chapter4 from "./chapter4/index.js";

const all = [prologue, chapter1, chapter2, chapter3, chapter4];

export const chapters = all.sort((a, b) => Number(a.number) - Number(b.number));

export const chapterById = (id) => all.find((c) => c.id === id);
export const chapterByNumber = (number) => all.find((c) => c.number === number);

// The game currently boots directly into the first parkour chapter.
// Change this to prologue to enable the cinematic opening.
export const bootChapterId = "chapter-01";
