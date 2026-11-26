// Chapter 04 data — dusk gives way to blue hour on a river with no fixed channel.

export const CHAPTER = {
  id: "chapter-04",
  number: "04",
  title: "The River Without a Channel",
  series: "NEXT STOP: THE OPEN WILD",
  tagline: "The current already knows a way you cannot see.",
  length: 96,
  startZ: 6,
  groundY: 0.02,
  baseSpeed: 3.8,
  merge: { start: 96, end: 99 },
  lanes: [
    { id: "still", name: "Still Channel", x: -2.4, speed: 0.92, note: "slower · memory" },
    { id: "current", name: "Standard Lane", x: 0, speed: 1.0, note: "the open current" },
    { id: "rapids", name: "Quick Water", x: 2.4, speed: 1.08, note: "faster · token" },
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
  npc: { start: 70, end: 89, speed: 0.8 },
  obstacles: [
    { type: "rock", p: 25, lane: 1, width: 1.42, depth: 0.92, jump: 0.42, safe: true },
    { type: "log", p: 39, lane: 2, width: 1.34, depth: 0.82, jump: 0.58, safe: true },
    { type: "drift", p: 52, lane: 1, width: 1.16, depth: 0.9, jump: 0.5, safe: false, slide: { amp: 0.92, speed: 1.05 } },
    { type: "reeds", p: 61, lane: 0, width: 1.38, depth: 0.72, jump: 2.8, safe: false },
    { type: "wreck", p: 76, lane: 0, width: 1.22, depth: 0.96, jump: 0.68, safe: false },
    { type: "shallows", p: 86, lane: 2, width: 1.24, depth: 0.9, jump: 0.5, safe: false },
  ],
  gate: { p: 68, lane: 1, width: 6.6, depth: 0.55 },
  pickups: [
    { id: "memory04", kind: "memory", p: 15, lane: 0, title: "Journey Memory 04", name: "The Water Keeps Its Own Time", copy: "You stopped rowing for a moment. The river kept going anyway." },
    { id: "token04", kind: "token", p: 46, lane: 2, title: "Protection Token", name: "A brass river charm", copy: "Someone tied this to a bridge once. It absorbs one stumble." },
    { id: "tape04", kind: "tape", p: 82, lane: 1, title: "Repair Tape", name: "Wrapped against the damp", copy: "A paper boat is only paper until someone mends it." },
  ],
  signature: {
    boarding: { start: 10, hold: 1.1 },
    drift: { idle: 1.5 },
    fork: { p: 85 },
  },
};

export const FEEDBACK = {
  rock: { title: "Stone under the current", copy: "The hull scrapes. The river pushes you back into line.", color: "#7f8c83", shake: 0.16 },
  log: { title: "A floating log", copy: "Bark turns over in the wake. You slip past the worst of it.", color: "#8a6c4c", shake: 0.14 },
  drift: { title: "Debris crosses the channel", copy: "A crate spins away downstream. One stroke brings you back.", color: "#b79b70", shake: 0.18 },
  reeds: { title: "Reeds close the channel", copy: "The stalks bend but do not break. You lose a breath and keep going.", color: "#6f8a6b", shake: 0.2 },
  wreck: { title: "A wreck beneath the surface", copy: "Old ribs of a boat knock the hull. The water moves on.", color: "#6d5a49", shake: 0.24 },
  shallows: { title: "The water turns shallow", copy: "Paper drags on stone. You rock free and keep going.", color: "#9aa7a1", shake: 0.18 },
};

export const NARRATION = [
  { p: 1.5, text: "The pavement ends at a river that never had a channel." },
  { p: 8, text: "A paper boat waits at the bank, lantern already lit." },
  { p: 13, text: "A memory drifts near the still water." },
  { p: 23, text: "Stone breaks the middle current." },
  { p: 36, text: "A log turns slowly on the quick water." },
  { p: 44, text: "Something brass glints in the channel." },
  { p: 50, text: "Debris crosses the open current." },
  { p: 64, text: "A low bridge closes over the river. Duck beneath it." },
  { p: 69, text: "Another boat is waiting in the reeds." },
  { p: 79, text: "A roll of repair tape, wrapped against the damp." },
  { p: 84, text: "The river splits around an old stone pier." },
  { p: 90, text: "The far bank is close. The current was never against you." },
];

export const DIALOGUE = [
  { speaker: "You", text: "I don't know where this river goes." },
  { speaker: "River Traveller", text: "Neither does the river." },
  { speaker: "You", text: "Then how do you choose a way?" },
  { speaker: "River Traveller", text: "I stop paddling. Then I see where it takes me." },
  { speaker: "You", text: "And if it takes me somewhere I didn't plan?" },
  { speaker: "River Traveller", text: "Then it is a place you did not have to find alone." },
];

export const COPY = {
  intro: {
    eyebrow: "Chapter 04 · Dusk to blue hour",
    title: "The river",
    titleAccent: "without a channel",
    series: "NEXT STOP: THE OPEN WILD",
    description: "A paper boat waits where the road gives up. Three channels, one current, and a river that keeps moving whether or not you choose. Step in, take a stroke — or stop, and let the water decide.",
    facts: ["≈ 30 seconds", "3 water channels", "A current that carries you"],
    start: "Begin Chapter 04",
    loading: "Lowering the paper boat",
    ready: "The river is open",
    controls: "A / D or ← / → steer · Space ride the swell · S crouch · Hold E board the boat · Esc pause",
    routesTitle: "Route key",
    routes: [
      { id: "still", label: "Still · 0.92×", detail: "Journey Memory 04", color: "#8fa39c" },
      { id: "current", label: "Current · 1.00×", detail: "The open water", color: "#d3b279" },
      { id: "rapids", label: "Quick · 1.08×", detail: "Protection Token", color: "#d78a63" },
    ],
  },
  hud: { chapter: "Chapter 04", title: "The River Without a Channel", collisions: "Missteps" },
  restart: { line: "Back to the bank. The river has not gone anywhere." },
  pause: { eyebrow: "The river keeps moving", title: "Let the oars rest.", copy: "The current waits. No stroke is wasted.", resume: "Keep rowing", restart: "Restart chapter" },
  recovery: {
    eyebrow: "A wide river, no ending",
    title: "The water opens.",
    copy: "Three missteps do not close the river. Begin again, or let the still channel carry you.",
    restart: "Restart chapter",
    safe: "Take the still channel",
    countdown: "Still water in {n} s",
    footnote: "You do not need to paddle every stroke.",
  },
  finish: {
    eyebrow: "Chapter 04 complete",
    title: "The river",
    accent: "keeps going.",
    copy: "You reached the far bank without forcing every turn. The current was never against you.",
    time: "Time",
    stumbles: "Missteps",
    memories: "Memories",
    route: "Route",
    again: "Row the river again",
    noStumble: "Not a single misstep. The river barely noticed you.",
    stumbles: "You stumbled {n} times. The water kept its course.",
    safe: "You took the still channel and still reached the bank.",
  },
  lower: "Under the low bridge",
  gate: { title: "Under the low bridge", copy: "Stone close overhead. Duck and let the current do the rest." },
};

export function progressToDistance(p) {
  return (p / 100) * CHAPTER.length;
}
