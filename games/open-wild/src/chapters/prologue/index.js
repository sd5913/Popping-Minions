// Prologue — optional opening transition before Chapter 01.
// Does not use the parkour mechanic; shows the player waking up near the
// examination avenue, sets the tone, then calls engine.beginNextChapter().
//
// Leave scene.model empty to fall back to a pure-CSS / procedural sky setup.

export default {
  id: "prologue",
  number: "00",
  title: "Prologue",
  series: "NEXT STOP: THE OPEN WILD",

  data: null,          // no lanes / no obstacles / no pickups — cinematic only
  copy: {
    intro: {
      eyebrow: "Prologue · Dawn",
      title: "The bell is",
      titleAccent: "still ringing",
      series: "NEXT STOP: THE OPEN WILD",
      description: "You wake up on the steps of a school you don't remember enrolling in. The avenue beyond the gate is full of people running.",
      facts: ["No mechanics", "Opening voiceover", "Enter the avenue"],
      start: "Enter the avenue",
      loading: "Prologue",
      ready: "",
    },
    hud: { chapter: "Prologue", title: "", collisions: "" },
    pause: null,
    recovery: null,
    finish: null,
  },
  feedback: {},
  narration: [
    { p: 5, text: "The bell is still ringing." },
    { p: 60, text: "Someone is calling your name. You can't place their face." },
    { p: 95, text: "The avenue beyond the gate is full of people running." },
  ],
  dialogue: [],
  progressToDistance: () => 0,

  scene: {
    model: null,
    transform: null,
  },

  builders: null,

  hooks: {
    onComplete(runner) {
      runner.beginNextChapter();
    },
  },
};
