// Chapter 03 data — Clock City, adapted from the completed standalone edition.

export const CHAPTER = {
  id: "chapter-03",
  number: "03",
  title: "After the Fall",
  series: "NEXT STOP: THE OPEN WILD",
  tagline: "The road breaks. Another way appears below.",
  length: 93.6,
  startZ: 15.6,
  groundY: 0.06,
  baseSpeed: 4.4,
  merge: { start: 96, end: 99 },
  lanes: [
    { id: "lower", name: "Lower Road", x: -2.25, speed: 0.9, note: "slower · memory" },
    { id: "avenue", name: "Standard Lane", x: 0, speed: 1.0, note: "the broken avenue" },
    { id: "clockwork", name: "Clockwork Edge", x: 2.25, speed: 1.1, note: "faster · token" },
  ],
  cooldowns: { lane: 0.6, jump: 0.85, duck: 0.75 },
  physics: { jumpImpulse: 7.4, gravity: 22, clearance: 0.58 },
  collisions: {
    limit: 3,
    invulnerable: 1.5,
    safeInvulnerable: 2.0,
    stumbleSlow: 0.42,
    stumbleTime: 0.9,
    recoveryTimeout: 6,
    safeSpeed: 0.88,
    safeNodes: [0, 25, 50, 75],
  },
  npc: { start: 70, end: 89, speed: 0.72 },
  obstacles: [
    { type: "rock", p: 25, lane: 1, width: 1.42, depth: 0.92, jump: 0.42, safe: true },
    { type: "slab", p: 39, lane: 2, width: 1.34, depth: 0.82, jump: 0.58, safe: true },
    { type: "falling", p: 52, lane: 1, width: 1.16, depth: 0.9, jump: 0.5, safe: false, slide: { amp: 0.92, speed: 1.05 } },
    { type: "door", p: 61, lane: 0, width: 1.38, depth: 0.72, jump: 2.8, safe: false },
    { type: "beam", p: 76, lane: 0, width: 1.22, depth: 0.96, jump: 0.68, safe: false },
    { type: "gears", p: 86, lane: 2, width: 1.24, depth: 0.9, jump: 0.5, safe: false },
  ],
  gate: { p: 68, lane: 1, width: 6.6, depth: 0.55 },
  pickups: [
    { id: "memory03", kind: "memory", p: 15, lane: 0, title: "Journey Memory 03", name: "The Road Below", copy: "You fell from the road above. The world did not end." },
    { id: "token03", kind: "token", p: 46, lane: 2, title: "Protection Token", name: "A clockwork seal", copy: "A little borrowed time. It absorbs one stumble." },
    { id: "tape03", kind: "tape", p: 82, lane: 1, title: "Repair Tape", name: "For the last span", copy: "Not a way back. A way to mend what is in front of you." },
  ],
  signature: {
    firstGap: { start: 87.5, end: 90 },
    repair: { start: 92, end: 98, hold: 1.25 },
  },
};

export const FEEDBACK = {
  rock: { title: "Loose stone underfoot", copy: "The avenue shifts. You catch yourself and keep moving.", color: "#9b765e", shake: 0.16 },
  slab: { title: "A fallen clock slab", copy: "Old stone, old time. Neither can hold you here.", color: "#c3945e", shake: 0.2 },
  falling: { title: "Clockwork crosses your line", copy: "The loose mechanism rolls away into the avenue.", color: "#d9a45e", shake: 0.18 },
  door: { title: "A door to nowhere", copy: "It opens onto the same road. You stumble through.", color: "#8d5c43", shake: 0.22 },
  beam: { title: "The broken beam shudders", copy: "A wooden jolt, a breath, then your rhythm returns.", color: "#b7794d", shake: 0.24 },
  gears: { title: "Gears across the avenue", copy: "The mechanism spills apart without stopping the world.", color: "#d39a4a", shake: 0.18 },
};

export const NARRATION = [
  { p: 1.5, text: "Beyond the open field, an old clock city rises through the dust." },
  { p: 13, text: "A memory glints beside the lower road." },
  { p: 23, text: "Loose stone blocks the middle line." },
  { p: 36, text: "A fallen slab. Jump when you are ready." },
  { p: 44, text: "A clockwork seal rests on the right." },
  { p: 50, text: "Loose machinery drifts across the lane." },
  { p: 64, text: "The old clock gate hangs low. Duck beneath it." },
  { p: 69, text: "A voice waits beside the broken avenue." },
  { p: 79, text: "Repair tape. Keep it for the last span." },
  { p: 86, text: "The road breaks. Jump — or trust the road below." },
  { p: 91, text: "The final span is broken. Hold E to repair it." },
  { p: 98, text: "The bridge holds. Keep walking into the light." },
];

export const DIALOGUE = [
  { speaker: "You", text: "I fell." },
  { speaker: "Bridge Builder", text: "I saw." },
  { speaker: "You", text: "I can't get back to the road above." },
  { speaker: "Bridge Builder", text: "Maybe you don't need to." },
  { speaker: "You", text: "But the bridge ahead is broken." },
  { speaker: "Bridge Builder", text: "Then help me hold this. Repair tape. For the last span." },
];

export const COPY = {
  intro: {
    eyebrow: "Chapter 03 · After the mistake",
    title: "After",
    titleAccent: "the fall",
    series: "NEXT STOP: THE OPEN WILD",
    description: "The open wild leads to a clock city with a broken avenue. Another road appears below. You do not need to climb back to where you were — repair what is in front of you.",
    facts: ["≈ 30 seconds", "3 clock-city routes", "A bridge to repair"],
    start: "Begin Chapter 03",
    loading: "Rebuilding Clock City",
    ready: "The lower road is open",
    controls: "A / D or ← / → change lane · Space jump · S duck · Hold E repair · Esc pause",
    routesTitle: "Route key",
    routes: [
      { id: "lower", label: "Lower · 0.90×", detail: "Journey Memory 03", color: "#a98570" },
      { id: "avenue", label: "Avenue · 1.00×", detail: "The broken line", color: "#d7b37a" },
      { id: "clockwork", label: "Clockwork · 1.10×", detail: "Protection Token", color: "#d8794f" },
    ],
  },
  hud: { chapter: "Chapter 03", title: "After the Fall", collisions: "Missteps" },
  restart: { line: "Back beneath the clocks. No misstep is permanent." },
  pause: { eyebrow: "The avenue waits", title: "Catch your breath.", copy: "The clocks have stopped. No misstep is permanent.", resume: "Keep moving", restart: "Restart chapter" },
  recovery: {
    eyebrow: "A moment, not an ending",
    title: "The road continues.",
    copy: "Three missteps do not erase the distance. Begin again, or take the quieter lower road.",
    restart: "Restart chapter",
    safe: "Take the lower road",
    countdown: "Lower road in {n} s",
    footnote: "You do not need to go back to move forward.",
  },
  finish: {
    eyebrow: "Chapter 03 complete",
    title: "The bridge",
    accent: "holds.",
    copy: "You did not go back. You repaired what was in front of you, and kept walking into the light.",
    time: "Time",
    stumbles: "Missteps",
    memories: "Memories",
    route: "Route",
    again: "Run the avenue again",
    noStumble: "Not a single misstep. The repaired span carries you forward.",
    stumbles: "You stumbled {n} times. The bridge still holds.",
    safe: "You took the lower road and still found a way across.",
  },
  lower: "Under the clock gate",
  gate: { title: "Under the old clock gate", copy: "Bronze timber and old machinery overhead. Duck beneath it." },
};

export function progressToDistance(p) {
  return (p / 100) * CHAPTER.length;
}
