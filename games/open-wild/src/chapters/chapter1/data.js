// Chapter 01 data, adapted from the "Next Stop: The Open Wild" design baseline.
// Only Chapter 01 is configured here so later chapters can be appended without
// touching the runner systems.

export const CHAPTER = {
  id: "chapter-01",
  number: "01",
  title: "Standard Answer Avenue",
  series: "NEXT STOP: THE OPEN WILD",
  tagline: "Everyone seems to know where they're going.",
  length: 64.5, // metres of road that actually exist in the Blender scene
  startZ: 3.5,
  groundY: 0.065,
  baseSpeed: 2.0, // m/s on the standard lane
  merge: { start: 90, end: 97 }, // progress %, ease back to the portal centre
  lanes: [
    { id: "scenic", name: "Scenic Lane", x: -1.85, speed: 0.9, note: "slower · memory" },
    { id: "standard", name: "Standard Lane", x: 0, speed: 1.0, note: "the direct line" },
    { id: "shortcut", name: "Shortcut Lane", x: 1.85, speed: 1.1, note: "faster · token" },
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
    { type: "pencil", p: 26, lane: 1, width: 1.42, depth: 0.92, jump: 0.34, safe: true },
    { type: "threshold", p: 39, lane: 2, width: 1.3, depth: 0.7, jump: 0.58, safe: true },
    { type: "card", p: 53, lane: 1, width: 1.12, depth: 0.86, jump: 0.46, safe: false, slide: { amp: 0.92, speed: 1.15 } },
    { type: "ink", p: 62, lane: 0, width: 1.34, depth: 1.1, jump: 0.2, safe: false },
    { type: "eraser", p: 76, lane: 0, width: 1.16, depth: 0.9, jump: 0.68, safe: false },
    { type: "papers", p: 86, lane: 2, width: 1.24, depth: 0.9, jump: 0.5, safe: false },
  ],
  // Story gate: the answer sheet leans across the avenue. Duck under it, or
  // stumble into the lower service passage. Either way the mainline continues.
  gate: { p: 68, lane: 1, width: 6.6, depth: 0.55 },
  pickups: [
    { id: "memory01", kind: "memory", p: 16, lane: 0, title: "Journey Memory 01", name: "An Unfinished Answer", copy: "The question is still open. The road is not." },
    { id: "token", kind: "token", p: 47, lane: 2, title: "Protection Token", name: "One stumble, forgiven", copy: "It absorbs the next ordinary collision." },
    { id: "tape", kind: "tape", p: 82, lane: 1, title: "Repair Tape", name: "Someone may need this", copy: "Keep it. A broken bridge comes later." },
  ],
};

export const FEEDBACK = {
  pencil: { title: "The pencil rolls", copy: "It spins off the line. Your stride breaks for a moment.", color: "#d97843", slow: 0.7, duration: 0.65, shake: 0.12 },
  threshold: { title: "The ruler clips your step", copy: "You catch the edge, stumble, and keep going.", color: "#c9a15a", slow: 0.58, duration: 0.75, shake: 0.16 },
  card: { title: "The card flutters past", copy: "Loose paper crosses your view. Hold your line.", color: "#f0e6cc", slow: 0.84, duration: 0.45, shake: 0.08 },
  ink: { title: "Ink underfoot", copy: "The line slips sideways. Correct early.", color: "#7a9ab4", slow: 0.74, duration: 0.8, shake: 0.08 },
  eraser: { title: "The eraser gives way", copy: "A heavy bounce runs through the road.", color: "#d76581", slow: 0.5, duration: 1.0, shake: 0.26 },
  papers: { title: "A stack of exams scatters", copy: "Pages burst into the air behind you.", color: "#e6b45b", slow: 0.56, duration: 0.9, shake: 0.18 },
};

export const NARRATION = [
  { p: 1.5, text: "Everyone seems to know where they're going." },
  { p: 13, text: "A scrap of paper drifts down on the left." },
  { p: 24, text: "The middle line is blocked. Pick a side." },
  { p: 37, text: "A raised ruler. Jump." },
  { p: 44, text: "A protection token waits on the shortcut lane." },
  { p: 51, text: "The card is moving. Choose your line." },
  { p: 64, text: "The answer sheet leans across the avenue. Duck under it." },
  { p: 69, text: "Lower service passage. The mainline continues." },
  { p: 79, text: "A repair box. Someone further along may need it." },
  { p: 92, text: "The roads merge." },
];

export const DIALOGUE = [
  { speaker: "Stranger", text: "Hey — why are you running like you're out of time?" },
  { speaker: "You", text: "I have an important exam. I can't be late." },
  { speaker: "Stranger", text: "Where are you going?" },
  { speaker: "You", text: "I don't really know. Everyone is running this way." },
  { speaker: "Stranger", text: "Do you know where this road leads?" },
  { speaker: "You", text: "No." },
  { speaker: "Stranger", text: "Then perhaps you should look around." },
];

export const COPY = {
  intro: {
    eyebrow: "Chapter 01 · First-person study",
    title: "Standard Answer",
    titleAccent: "Avenue",
    series: "NEXT STOP: THE OPEN WILD",
    description:
      "A giant answer sheet runs through a city of rulers and pencil towers. Everyone is heading for the middle. Run the grid — or find out where it actually leads.",
    facts: ["≈ 35 seconds", "3 lanes · 3 speeds", "3 stumbles → a quieter road"],
    start: "Begin Chapter 01",
    loading: "Unfolding the avenue",
    ready: "Scene ready",
    controls: "A / D or ← / → change lane · Space jump · S duck · Esc pause",
    routesTitle: "Route key",
    routes: [
      { id: "scenic", label: "Scenic · 0.90×", detail: "Journey Memory" },
      { id: "standard", label: "Standard · 1.00×", detail: "Direct line" },
      { id: "shortcut", label: "Shortcut · 1.10×", detail: "Protection Token" },
    ],
  },
  hud: { chapter: "Chapter 01", title: "Standard Answer Avenue", collisions: "Stumbles" },
  restart: { line: "Back to the first line. Same avenue, new attention." },
  pause: { eyebrow: "Take a breath", title: "Paused on this page", copy: "The clock and the avenue are both stopped.", resume: "Keep running", restart: "Restart chapter" },
  recovery: {
    eyebrow: "A moment, not an ending",
    title: "Take a moment.",
    copy: "You have stumbled three times. Try this chapter again, or take a quieter route.",
    restart: "Restart chapter",
    safe: "Take the safe route",
    countdown: "Safe route in {n} s",
    footnote: "No failure. The avenue keeps going.",
  },
  finish: {
    eyebrow: "Chapter 01 complete",
    title: "The road keeps",
    accent: "going",
    copy: "The avenue ends at the sunlit gate. No score, no ranking — only what you noticed on the way.",
    time: "Time",
    stumbles: "Stumbles",
    memories: "Memories",
    route: "Route",
    again: "Run the avenue again",
    noStumble: "Not a single stumble. The paper stayed flat.",
    stumbles: "You stumbled {n} times and still reached the gate.",
    safe: "You took the quiet route and still reached the gate.",
  },
  lower: "Lower service passage",
  gate: { title: "Lower service passage", copy: "The answer sheet leans across. Duck under." },
};

export function progressToDistance(p) {
  return (p / 100) * CHAPTER.length;
}
