// Chapter 02 data — the answer avenue opens onto an unhurried country road.

export const CHAPTER = {
  id: "chapter-02",
  number: "02",
  title: "The Unhurried Country",
  series: "NEXT STOP: THE OPEN WILD",
  tagline: "No bells. No rankings. The road stops asking where you are going.",
  length: 52.5,
  startZ: 11,
  groundY: 0.06,
  baseSpeed: 2.05,
  merge: { start: 90, end: 97 },
  lanes: [
    { id: "meadow", name: "Meadow Edge", x: -1.85, speed: 0.9, note: "slower · memory" },
    { id: "lane", name: "Standard Lane", x: 0, speed: 1.0, note: "the open line" },
    { id: "orchard", name: "Orchard Side", x: 1.85, speed: 1.1, note: "faster · token" },
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
    { type: "hay", p: 25, lane: 1, width: 1.42, depth: 0.92, jump: 0.42, safe: true },
    { type: "fence", p: 39, lane: 2, width: 1.34, depth: 0.62, jump: 0.58, safe: true },
    { type: "sheep", p: 52, lane: 1, width: 1.16, depth: 0.9, jump: 0.5, safe: false, slide: { amp: 0.92, speed: 1.05 } },
    { type: "mud", p: 61, lane: 0, width: 1.38, depth: 1.1, jump: 0.2, safe: false },
    { type: "cart", p: 76, lane: 0, width: 1.22, depth: 0.96, jump: 0.68, safe: false },
    { type: "apples", p: 86, lane: 2, width: 1.24, depth: 0.9, jump: 0.5, safe: false },
  ],
  gate: { p: 68, lane: 1, width: 6.6, depth: 0.55 },
  pickups: [
    { id: "memory02", kind: "memory", p: 15, lane: 0, title: "Journey Memory 02", name: "A Road Without a Bell", copy: "For the first time, nobody is timing your answer." },
    { id: "token02", kind: "token", p: 46, lane: 2, title: "Protection Token", name: "A fallen apple", copy: "A small kindness from the orchard. It absorbs one stumble." },
    { id: "tape02", kind: "tape", p: 82, lane: 1, title: "Repair Tape", name: "A mended gate", copy: "Repair is not a detour. It is another way forward." },
  ],
};

export const FEEDBACK = {
  hay: { title: "Loose hay everywhere", copy: "The bale rolls apart. Your rhythm scatters with it.", color: "#d6a84e", shake: 0.14 },
  fence: { title: "The fence catches your step", copy: "Weathered wood, a quick stumble, then open sky again.", color: "#a98254", shake: 0.17 },
  sheep: { title: "A sheep crosses your line", copy: "It is in no hurry. For a moment, neither are you.", color: "#eee3ca", shake: 0.08 },
  mud: { title: "Soft earth underfoot", copy: "The lane gives way. Correct early and keep moving.", color: "#657d79", shake: 0.08 },
  cart: { title: "The cart wheel shudders", copy: "A wooden jolt travels through the quiet road.", color: "#b36b43", shake: 0.24 },
  apples: { title: "Apples across the lane", copy: "Red fruit rolls into the grass behind you.", color: "#c95e47", shake: 0.16 },
};

export const NARRATION = [
  { p: 1.5, text: "Beyond the answer gate, the city becomes a country lane." },
  { p: 13, text: "A folded map rests near the meadow edge." },
  { p: 23, text: "A hay bale blocks the middle line." },
  { p: 36, text: "A low fence. Jump when you are ready." },
  { p: 44, text: "The orchard has left something on the right." },
  { p: 50, text: "A sheep wanders across the lane. Give it room." },
  { p: 64, text: "The old farm gate hangs low. Duck beneath it." },
  { p: 69, text: "The road continues under the gate." },
  { p: 79, text: "A small repair kit. Not everything broken needs replacing." },
  { p: 92, text: "There is no finish line here — only a wider horizon." },
];

export const DIALOGUE = [
  { speaker: "Farmer", text: "You came through the paper gate. Did it give you an answer?" },
  { speaker: "You", text: "No. Only another road." },
  { speaker: "Farmer", text: "That sounds like an answer to me." },
  { speaker: "You", text: "I kept running because everyone else did." },
  { speaker: "Farmer", text: "And now?" },
  { speaker: "You", text: "Now I want to see what is beyond the next field." },
  { speaker: "Farmer", text: "Then go because you want to. Not because a bell tells you." },
];

export const COPY = {
  intro: {
    eyebrow: "Chapter 02 · First-person study",
    title: "The Unhurried",
    titleAccent: "Country",
    series: "NEXT STOP: THE OPEN WILD",
    description: "The answer avenue ends at a sunlit farm gate. Beyond it: winding earth, orchard walls and a road with no bell. Keep moving — this time, notice why.",
    facts: ["≈ 30 seconds", "3 rural routes", "A new conversation"],
    start: "Begin Chapter 02",
    loading: "Opening the country lane",
    ready: "The gate is open",
    controls: "A / D or ← / → change lane · Space jump · S duck · Esc pause",
    routesTitle: "Route key",
    routes: [
      { id: "meadow", label: "Meadow · 0.90×", detail: "Journey Memory 02" },
      { id: "lane", label: "Country · 1.00×", detail: "The open line" },
      { id: "orchard", label: "Orchard · 1.10×", detail: "Protection Token" },
    ],
  },
  hud: { chapter: "Chapter 02", title: "The Unhurried Country", collisions: "Stumbles" },
  restart: { line: "Back to the farm gate. The country has not gone anywhere." },
  pause: { eyebrow: "Listen to the fields", title: "Paused by the lane", copy: "No bell is waiting for you here.", resume: "Keep walking", restart: "Restart chapter" },
  recovery: {
    eyebrow: "A moment beside the road",
    title: "Rest a little.",
    copy: "Three stumbles are not an ending. Begin again, or take the quieter grass-lined route.",
    restart: "Restart chapter",
    safe: "Take the meadow route",
    countdown: "Meadow route in {n} s",
    footnote: "The country does not keep score.",
  },
  finish: {
    eyebrow: "Chapter 02 complete",
    title: "The horizon is",
    accent: "yours",
    copy: "The lane opens into uncultivated land. You arrived without a ranking — and with a reason of your own.",
    time: "Time",
    stumbles: "Stumbles",
    memories: "Memories",
    route: "Route",
    again: "Walk the country again",
    noStumble: "Not a single stumble. The lane stayed quiet.",
    stumbles: "You stumbled {n} times and still found the open field.",
    safe: "You took the meadow route and still reached the horizon.",
  },
  lower: "Under the old farm gate",
  gate: { title: "Under the old farm gate", copy: "Weathered timber overhead. Duck beneath it." },
};

export function progressToDistance(p) {
  return (p / 100) * CHAPTER.length;
}
