// Small WebAudio kit: a soft paper-room ambience plus one voice per event.
// No assets, no external requests.

const AMBIENCE_LEVEL = 0.055;

export class Soundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambience = null;
    this.muted = false;
  }

  get ready() {
    return Boolean(this.ctx);
  }

  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(this.ctx.destination);
    this.#startAmbience();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime + 0.18);
  }

  #startAmbience() {
    const ctx = this.ctx;
    const length = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < length; i += 1) {
      smooth = smooth * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[i] = smooth;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 680;
    filter.Q.value = 0.35;
    const gain = ctx.createGain();
    gain.gain.value = AMBIENCE_LEVEL;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 74;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.018;
    drone.connect(droneGain).connect(this.master);
    drone.start();

    this.ambience = { source, gain };
  }

  #env(node, peak, attack, decay) {
    const now = this.ctx.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(0.0001, now);
    node.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + attack);
    node.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  }

  #tone({ freq = 440, type = "sine", peak = 0.08, attack = 0.01, decay = 0.28, slide = 0, detune = 0 }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + attack + decay);
    osc.detune.value = detune;
    this.#env(gain, peak, attack, decay);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + attack + decay + 0.05);
  }

  #noise({ duration = 0.2, peak = 0.05, freq = 1200, q = 0.8, type = "bandpass" }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    this.#env(gain, peak, 0.008, duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  lane() {
    this.#tone({ freq: 320, type: "sine", peak: 0.03, attack: 0.006, decay: 0.12, slide: 90 });
    this.#noise({ duration: 0.09, peak: 0.016, freq: 2600 });
  }

  jump() {
    this.#tone({ freq: 220, type: "triangle", peak: 0.045, attack: 0.01, decay: 0.16, slide: 180 });
  }

  duck() {
    this.#tone({ freq: 190, type: "sine", peak: 0.04, attack: 0.01, decay: 0.2, slide: -70 });
  }

  pickup() {
    [523.25, 659.25, 783.99].forEach((freq, index) => {
      window.setTimeout(() => this.#tone({ freq, type: "sine", peak: 0.055, attack: 0.01, decay: 0.5 }), index * 70);
    });
  }

  token() {
    this.#tone({ freq: 880, type: "triangle", peak: 0.05, attack: 0.008, decay: 0.35 });
    window.setTimeout(() => this.#tone({ freq: 1174.66, type: "sine", peak: 0.04, attack: 0.008, decay: 0.45 }), 90);
  }

  stumble(type) {
    const voices = {
      pencil: { freq: 180, noise: 2400, peak: 0.07 },
      threshold: { freq: 120, noise: 900, peak: 0.09 },
      card: { freq: 300, noise: 3200, peak: 0.04 },
      ink: { freq: 150, noise: 500, peak: 0.06 },
      eraser: { freq: 90, noise: 380, peak: 0.1 },
      papers: { freq: 210, noise: 2800, peak: 0.06 },
    };
    const voice = voices[type] || voices.card;
    this.#tone({ freq: voice.freq, type: "sawtooth", peak: voice.peak, attack: 0.006, decay: 0.26, slide: -40 });
    this.#noise({ duration: 0.22, peak: voice.peak * 0.7, freq: voice.noise, q: 0.6 });
  }

  gate() {
    this.#noise({ duration: 0.5, peak: 0.06, freq: 900, q: 0.4, type: "lowpass" });
    this.#tone({ freq: 110, type: "sine", peak: 0.07, attack: 0.02, decay: 0.6, slide: -30 });
  }

  recovery() {
    [392, 329.63, 261.63].forEach((freq, index) => {
      window.setTimeout(() => this.#tone({ freq, type: "sine", peak: 0.05, attack: 0.02, decay: 0.7 }), index * 120);
    });
  }

  complete() {
    [392, 523.25, 659.25, 783.99].forEach((freq, index) => {
      window.setTimeout(() => this.#tone({ freq, type: "sine", peak: 0.06, attack: 0.02, decay: 1.1 }), index * 150);
    });
  }

  blip() {
    this.#tone({ freq: 660, type: "sine", peak: 0.018, attack: 0.004, decay: 0.06 });
  }
}
