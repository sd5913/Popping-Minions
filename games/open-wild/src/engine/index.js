// Universal runner for every "NEXT STOP: THE OPEN WILD" chapter.
// Does NOT import any chapter data — all chapter-specific values are injected
// through the Runner constructor and chapter module hooks.
//
// Responsibilities:
//   * Three.js setup (renderer, scene, camera, lights, PMREM environment)
//   * Post-processing chain (Bloom + DreamGrade + OutputPass)
//   * First-person camera rig (bob / sway / shake / duck / stumble / roll)
//   * Main loop frame() with dt clamp
//   * Input: keyboard (A/D, Space, S, E, Esc, M, Enter) + touch buttons + swipe
//   * HUD refresh, toast, subtitle, dialogue, recovery, finish, pause
//   * Obstacle collision sweep, pickup collection, gate trigger, safe route
//   * GLB loading with DRACO decoder
//   * Persistent state cross-chapter (inventory, collected, seenDialogue, routes)
//   * Debug window.__CHAPTER1__ snapshot for QA

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

import { Soundscape } from "../audio.js";
import "../style.css";

// ---------------------------------------------------------------- helpers

const $ = (id) => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

function laneLabelFromIndex(lanes, index) {
  return lanes[index]?.name ?? "Unknown";
}

let obstacleWarningTexture = null;
function getObstacleWarningTexture() {
  if (obstacleWarningTexture) return obstacleWarningTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  context.beginPath();
  context.moveTo(64, 5);
  context.lineTo(123, 64);
  context.lineTo(64, 123);
  context.lineTo(5, 64);
  context.closePath();
  context.fillStyle = "rgba(255,255,255,0.94)";
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = "white";
  context.stroke();
  context.fillStyle = "black";
  context.font = "bold 76px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("!", 64, 66);
  obstacleWarningTexture = new THREE.CanvasTexture(canvas);
  obstacleWarningTexture.colorSpace = THREE.SRGBColorSpace;
  return obstacleWarningTexture;
}

// ---------------------------------------------------------------- DreamGrade

const DREAM_GRADE_UNIFORMS = {
  tDiffuse: { value: null },
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2() },
  uStumble: { value: 0 },
  uInk: { value: 0 },
  uLower: { value: 0 },
  uDream: { value: 1 },
};

const DREAM_GRADE_SHADER = {
  uniforms: DREAM_GRADE_UNIFORMS,
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uStumble;
    uniform float uInk;
    uniform float uLower;
    uniform float uDream;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // breathing lens distortion
      float breath = sin(uTime * 0.45) * 0.0012 * uDream;
      float stumbleDistort = uStumble * 0.04;
      vec2 offset = center * (breath + stumbleDistort);
      uv -= offset;

      vec3 col = texture2D(tDiffuse, uv).rgb;
      float lightness = dot(col, vec3(0.2126, 0.7152, 0.0722));

      vec3 warm = vec3(1.045, 1.002, 0.945);
      vec3 cool = vec3(0.962, 0.99, 1.032);
      col *= mix(cool, warm, smoothstep(0.08, 0.92, lightness));
      col += vec3(0.022, 0.017, 0.009) * smoothstep(0.55, 1.0, lightness) * uDream;

      col = (col - 0.5) * (1.0 + 0.03 * uDream) + 0.5;
      col = max(col, vec3(0.0));

      // vignette
      float vignette = smoothstep(1.28, 0.32, dist * (1.0 + uLower * 0.22));
      col *= mix(0.78, 1.0, vignette);

      // lower-passage blue tint
      col = mix(col, col * vec3(0.82, 0.86, 1.12), uLower);

      // ink spread
      col = mix(col, col + vec3(0.0, 0.0, 0.04), uInk);

      // film grain
      float grain = hash(uv * uResolution + uTime * 120.0);
      col += (grain - 0.5) * 0.012 * uDream;

      // stumble jitter
      float jitter = uStumble * (hash(vec2(uTime * 8.0, 1.0)) - 0.5);
      col += jitter * 0.025 * vec3(1.0, 0.9, 0.8);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// ---------------------------------------------------------------- Runner

export class Runner {
  constructor({ chapter, container }) {
    this.chapter = chapter;
    this.container = container; // optional mount for a dedicated root
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.sound = new Soundscape();

    this.CHAPTER = chapter.data;
    this.COPY = chapter.copy;
    this.FEEDBACK = chapter.feedback;
    this.NARRATION = chapter.narration;
    this.DIALOGUE = chapter.dialogue;
    this.progressToDistance = chapter.progressToDistance;

    this.ui = this._collectUI();

    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.composer = null;
    this.dreamPass = null;
    this.bloom = null;

    this.game = this._initState();
    this._hydrateHudCopy();
    this.obstacles = [];
    this.pickups = [];
    this.gateGroup = null;
    this.stranger = null;
    this.effects = [];
    this.dustPoints = null;
    this.portalGlow = null;
    this.MAT = null;

    this.toastHideAt = 0;
    this.subtitleHideAt = 0;
    this.lastFrame = 0;
    this.hudCache = Object.create(null);
  }

  // ---------- public API -----------------------------------------------

  async init() {
    this._setupRenderer();
    this._setupScene();
    this._setupCamera();
    this._setupPost();
    this._bindUI();
    this._setupInput();
    await this._loadModel();
    this._buildSceneObjects();
    this._setReady();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  start() {
    if (!this.game.loaded) return;
    this.sound.start();
    this.sound.resume();
    this.game.distance = 0;
    this.game.prevDistance = 0;
    this.game.elapsed = 0;
    this.game.collisions = 0;
    this.game.safeRoute = false;
    this.game.finished = false;
    this.game.lane = 1;
    this.game.playerX = 0;
    this.game.motionLabel = null;
    this.game.cameraOffsetY = 0;
    this.game.jumpY = 0;
    this.game.jumpV = 0;
    this.game.merge = 0;
    this.game.narrationDone.clear();
    this.game.dialogueActive = false;
    this.game.dialogueDone = false;
    this.game.dialogueIndex = 0;
    this.game.dialogueTimer = 0;
    // chapter-local persistent — cleared on restart so every run is fresh
    this.game.inventory = { memory: 0, token: 0, tape: 0 };
    this.game.collected.clear();
    this.game.routes.clear();
    this.obstacles.forEach((o) => this._resetObstacle(o));
    this._resetGate();
    this.pickups.forEach((p) => {
      p.taken = false;
      p.group.visible = true;
    });
    this._setState("running");
    this._refreshHud();
    this.chapter.hooks?.onStart?.(this);
  }

  restart() {
    this.start();
  }

  setLane(index) {
    this.game.lane = clamp(Math.round(index), 0, this.CHAPTER.lanes.length - 1);
    this.game.laneCooldown = 0;
    this.game.playerX = this._laneSpec().x;
  }

  teleportProgress(value) {
    const previous = this.game.distance;
    this.game.distance = clamp((value / 100) * this.CHAPTER.length, 0, this.CHAPTER.length);
    this.game.prevDistance = this.game.distance;
    // Mark obstacles/pickups that the jump overshoots as "passed/collected"
    // so teleport never retroactively triggers collisions with left-behind content.
    // IMPORTANT: lane check required — only mark things the player could actually reach.
    if (this.game.distance > previous) {
      this.obstacles.forEach((o) => {
        if (!o.hit && !o.disabled && (this.game.distance - (o.spec.depth + 0.5) / 2) >= o.d) {
          const halfWidth = (o.spec.width + 0.42) / 2;
          const laneX = o.group.position.x;
          if (Math.abs(this.game.playerX - laneX) <= halfWidth) {
            o.passed = true;
          }
        }
      });
      this.pickups.forEach((p) => {
        if (!p.taken && (this.game.distance - 0.35) >= p.d) {
          if (Math.abs(this.game.playerX - p.laneX) <= 0.92) {
            p.taken = true;
            p.group.visible = false;
            this.game.collected.add(p.spec.id);
            if (p.spec.kind === "memory") this.game.inventory.memory += 1;
            else if (p.spec.kind === "token") this.game.inventory.token += 1;
            else if (p.spec.kind === "tape") this.game.inventory.tape += 1;
          }
        }
      });
    }
    this.chapter.hooks?.onTeleport?.(this, value, previous);
    this._refreshHud();
  }

  snapshot() {
    const camera = this.camera;
    const laneSpec = this._laneSpec();
    return {
      state: this.game.state,
      loaded: this.game.loaded,
      distance: Number(this.game.distance.toFixed(2)),
      progress: Number(this._progress().toFixed(2)),
      lane: this.game.lane,
      laneName: laneSpec.name,
      laneCooldown: Number(this.game.laneCooldown.toFixed(2)),
      playerX: Number(this.game.playerX.toFixed(2)),
      jumpHeight: Number(this.game.jumpY.toFixed(2)),
      duckAmount: Number(this.game.duckAmount.toFixed(2)),
      speed: Number((this.game.lastSpeed ?? this.CHAPTER.baseSpeed).toFixed(2)),
      invulnerable: Number(this.game.invulnerable.toFixed(2)),
      collisions: this.game.collisions,
      safeRoute: this.game.safeRoute,
      lower: this.game.lower,
      gateTriggered: this.game.gateTriggered,
      dialogueActive: this.game.dialogueActive,
      dialogueIndex: this.game.dialogueIndex,
      elapsed: Number(this.game.elapsed.toFixed(2)),
      inventory: { ...this.game.inventory },
      routes: [...this.game.routes],
      camera: camera ? [Number(camera.position.x.toFixed(3)), Number(camera.position.y.toFixed(3)), Number(camera.position.z.toFixed(3))] : [0, 0, 0],
      obstacles: this.obstacles.map((o) => ({ type: o.spec.type, p: o.spec.p, lane: o.spec.lane, disabled: o.disabled, hit: o.hit, passed: o.passed })),
      pickups: this.pickups.map((p) => ({ id: p.spec.id, kind: p.spec.kind, taken: p.taken })),
      chapterState: this.chapter.hooks?.snapshot?.(this) ?? null,
    };
  }

  // ---------- private: UI collection -----------------------------------

  _collectUI() {
    return {
      canvas: $("game-canvas"),
      hud: $("hud"),
      progressLabel: $("progress-label"),
      timeLabel: $("time-label"),
      progressFill: $("progress-fill"),
      laneLabel: $("lane-label"),
      motionLabel: $("motion-label"),
      hitLabel: $("hit-label"),
      routeLabel: $("route-label"),
      flash: $("collision-flash"),
      subtitle: $("subtitle"),
      subtitleText: $("subtitle-text"),
      dialogue: $("dialogue"),
      dialogueSpeaker: $("dialogue-speaker"),
      dialogueText: $("dialogue-text"),
      toast: $("toast"),
      toastDot: $("toast-dot"),
      toastTitle: $("toast-title"),
      toastCopy: $("toast-copy"),
      intro: $("intro-screen"),
      loadingLabel: $("loading-label"),
      loadingPercent: $("loading-percent"),
      loadingFill: $("loading-fill"),
      start: $("start-button"),
      pause: $("pause-screen"),
      resume: $("resume-button"),
      restartFromPause: $("restart-from-pause"),
      recovery: $("recovery-screen"),
      restartChapter: $("restart-chapter-button"),
      safeRoute: $("safe-route-button"),
      recoveryBar: $("recovery-bar"),
      recoveryCountdown: $("recovery-countdown"),
      finish: $("finish-screen"),
      resultTime: $("result-time"),
      resultStumbles: $("result-stumbles"),
      resultMemories: $("result-memories"),
      resultRoute: $("result-route"),
      resultNote: $("result-note"),
      restart: $("restart-button"),
      mute: $("mute-button"),
      pauseButton: $("pause-button"),
      touch: $("touch-controls"),
      left: $("left-button"),
      right: $("right-button"),
      jump: $("jump-button"),
      duck: $("duck-button"),
      invMemory: $("inv-memory"),
      invToken: $("inv-token"),
      invTape: $("inv-tape"),
      memCount: $("mem-count"),
      tokenCount: $("token-count"),
      tapeCount: $("tape-count"),
    };
  }

  // ---------- private: state -------------------------------------------

  _hydrateHudCopy() {
    const copy = this.COPY.hud ?? {};
    const mark = document.querySelector(".chapter-mark");
    if (!mark) return;
    const eyebrow = mark.querySelector(".eyebrow");
    const title = mark.querySelector("strong");
    if (eyebrow) eyebrow.textContent = copy.chapter ?? `Chapter ${this.CHAPTER.number}`;
    if (title) title.textContent = copy.title ?? this.CHAPTER.title;

    const finish = this.COPY.finish ?? {};
    const stumbleLabel = this.COPY.hud?.collisions ?? "Stumbles";
    const resultLabels = document.querySelectorAll(".result-grid div > span");
    if (resultLabels[1]) resultLabels[1].textContent = stumbleLabel;
    const again = document.querySelector("#restart-button span");
    if (again && finish.again) again.textContent = finish.again;
  }

  _initState() {
    return {
      state: "intro",
      loaded: false,
      distance: 0,
      prevDistance: 0,
      lane: 1,
      playerX: 0,
      jumpY: 0,
      jumpV: 0,
      elapsed: 0,
      collisions: 0,
      safeRoute: false,
      merge: 0,
      runPhase: 0,
      lastSpeed: 0,
      invulnerable: 0,
      stumble: 0,
      laneCooldown: 0,
      jumpCooldown: 0,
      duckCooldown: 0,
      duckTimer: 0,
      duckAmount: 0,
      shake: 0,
      ink: 0,
      knock: 0,
      recoveryTimer: 0,
      narrationDone: new Set(),
      dialogueActive: false,
      dialogueIndex: 0,
      dialogueDone: false,
      dialogueTimer: 0,
      gateTriggered: false,
      lower: false,
      finished: false,
      motionLabel: null,
      cameraOffsetY: 0,

      // persistent across restart / future chapters
      inventory: { memory: 0, token: 0, tape: 0 },
      collected: new Set(),
      seenDialogue: new Set(),
      routes: new Set(),
    };
  }

  _progress() {
    return (this.game.distance / this.CHAPTER.length) * 100;
  }

  _laneSpec() {
    return this.CHAPTER.lanes[this.game.lane];
  }

  // ---------- private: Three setup --------------------------------------

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.ui.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    const pixelRatioCap = window.innerWidth < 700 ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xece4d0);
    this.scene.fog = new THREE.Fog(0xece4d0, 30, 90);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;

    const hemi = new THREE.HemisphereLight(0xfff1d0, 0xc8bda1, 0.55);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe3b3, 0.9);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.bias = -0.0006;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0xc8d8e8, 0.25);
    fill.position.set(-6, 8, -4);
    this.scene.add(fill);
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, 200);
    this.camera.position.set(0, 1.62, this.CHAPTER.startZ + 1.8);
    this.camera.lookAt(0, 1.62, this.CHAPTER.startZ - 1);
  }

  _setupPost() {
    // Use 8-bit composer targets: UnrealBloomPass blends additively into the
    // read buffer, and additive blending into half-float targets is not
    // supported on every GPU/driver combination — it intermittently produces
    // fully black frames while the scene keeps running at 60 fps.
    const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.composer = new EffectComposer(this.renderer, target);
    // A supplied target starts at CSS size; synchronize once so Retina screens
    // render the scene at the same physical resolution as the output canvas.
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.reducedMotion ? 0.12 : 0.22,
      0.5,
      0.86,
    );
    this.composer.addPass(this.bloom);
    // Bloom does not need full-resolution mip chains. Half-resolution bloom is
    // visually smoother and avoids several costly full-screen passes.
    const resizeBloom = this.bloom.setSize.bind(this.bloom);
    this.bloom.setSize = (width, height) => resizeBloom(Math.max(1, Math.round(width * 0.5)), Math.max(1, Math.round(height * 0.5)));
    this.bloom.setSize(window.innerWidth, window.innerHeight);
    this.bloom.enabled = !this.reducedMotion;
    this.dreamPass = new ShaderPass(DREAM_GRADE_SHADER);
    this.dreamPass.uniforms.uResolution.value.set(window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio());
    this.composer.addPass(this.dreamPass);
    this.composer.addPass(new OutputPass());
  }

  // ---------- private: model loading ------------------------------------

  async _loadModel() {
    const modelPath = this.chapter.scene?.model;
    if (!modelPath) return; // prologue / no-model chapter

    const draco = new DRACOLoader();
    draco.setDecoderPath("./draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    return new Promise((resolve) => {
      loader.load(
        modelPath,
        (gltf) => {
          const transform = this.chapter.scene?.transform;
          const obj = gltf.scene;
          obj.name = "chapter-model";
          if (transform) {
            obj.position.set(...transform(obj.position.x, obj.position.y, obj.position.z));
            obj.rotation.set(0, obj.rotation.y, 0);
          }

          obj.traverse((node) => {
            if (!node.isMesh) return;
            node.castShadow = true;
            node.receiveShadow = true;
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => {
              if (!material) return;
              ["map", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap"].forEach((key) => {
                if (material[key]) material[key].anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
              });
            });
          });
          this.scene.add(obj);

          // Fire scene hook if present
          if (typeof this.chapter.scene?.beforeMount === "function") {
            this.chapter.scene.beforeMount(this, this.scene, obj);
          }
          draco.dispose();
          resolve();
        },
        (ev) => {
          if (ev.total > 0) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            if (this.ui.loadingPercent) this.ui.loadingPercent.textContent = `${pct}%`;
            if (this.ui.loadingFill) this.ui.loadingFill.style.width = `${pct}%`;
          }
        },
        (error) => {
          console.error("GLB load failed", error);
          resolve(); // don't block startup
        },
      );
    });
  }

  _buildSceneObjects() {
    const b = this.chapter.builders;
    if (!b) return;

    this.MAT = b.buildMaterials();
    this.dustPoints = b.buildDustPoints(this.reducedMotion);
    const dustGroup = new THREE.Group();
    dustGroup.add(this.dustPoints);
    this.scene.add(dustGroup);

    this.portalGlow = b.buildPortalGlow(this.CHAPTER);
    this.scene.add(this.portalGlow);

    // obstacles
    const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const makeMesh = (geometry, material, options = {}) => {
      const item = new THREE.Mesh(geometry, material);
      if (options.position) item.position.fromArray(options.position);
      if (options.rotation) item.rotation.set(...options.rotation);
      item.castShadow = options.castShadow ?? true;
      item.receiveShadow = options.receiveShadow ?? true;
      return item;
    };

    this.CHAPTER.obstacles.forEach((spec) => {
      const group = b.buildObstacle(spec.type, this.MAT);
      const lane = this.CHAPTER.lanes[spec.lane];
      const d = this.progressToDistance(spec.p);
      group.position.set(lane.x, this.CHAPTER.groundY, this.CHAPTER.startZ - d);
      group.updateMatrixWorld(true);

      const warningColor = spec.safe ? 0xf4c76b : 0xff7357;
      const warningRing = new THREE.Mesh(
        new THREE.RingGeometry(0.52, 0.76, 32),
        new THREE.MeshBasicMaterial({ color: warningColor, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
      );
      warningRing.rotation.x = -Math.PI / 2;
      warningRing.position.y = 0.065;
      warningRing.renderOrder = 2;
      const warningScale = Math.max(0.95, spec.width * 0.9);
      warningRing.scale.set(warningScale, 1, 1);
      const warningMarker = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getObstacleWarningTexture(),
        color: warningColor,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        toneMapped: false,
      }));
      warningMarker.scale.set(0.5, 0.5, 1);
      const bounds = new THREE.Box3().setFromObject(group);
      const markerBaseY = clamp(bounds.max.y - group.position.y + 0.32, 1.05, 2.5);
      warningMarker.position.y = markerBaseY;
      warningMarker.renderOrder = 3;
      group.add(warningRing, warningMarker);
      this.scene.add(group);
      this.obstacles.push({
        spec,
        group,
        d,
        home: { position: group.position.clone(), rotation: group.rotation.clone() },
        hit: false,
        passed: false,
        disabled: false,
        warningRing,
        warningMarker,
        warningScale,
        markerBaseY,
        react: 0,
        reactDir: Math.random() > 0.5 ? 1 : -1,
      });
    });

    // gate
    this.gateGroup = b.buildGate(this.MAT, this.CHAPTER, this.progressToDistance);
    this.scene.add(this.gateGroup);

    // NPC stranger
    this.stranger = b.buildStranger(this.MAT, this.CHAPTER, this.progressToDistance);
    this.scene.add(this.stranger);

    // pickups
    this.CHAPTER.pickups.forEach((spec) => {
      const { group } = b.buildPickup(spec, this.MAT, this.CHAPTER, this.progressToDistance);
      const lane = this.CHAPTER.lanes[spec.lane];
      const d = this.progressToDistance(spec.p);
      group.position.set(lane.x, this.CHAPTER.groundY, this.CHAPTER.startZ - d);
      this.scene.add(group);
      const pickup = { spec, group, d, laneX: lane.x, taken: this.game.collected.has(spec.id), phase: Math.random() * Math.PI * 2 };
      group.visible = !pickup.taken;
      this.pickups.push(pickup);
    });
  }

  // ---------- private: UI binding --------------------------------------

  _bindUI() {
    if (this.ui.start) this.ui.start.addEventListener("click", () => this.start());
    if (this.ui.resume) this.ui.resume.addEventListener("click", () => this._togglePause());
    if (this.ui.restartFromPause) this.ui.restartFromPause.addEventListener("click", () => this.start());
    if (this.ui.restartChapter) this.ui.restartChapter.addEventListener("click", () => this.start());
    if (this.ui.safeRoute) this.ui.safeRoute.addEventListener("click", () => this._takeSafeRoute());
    if (this.ui.restart) this.ui.restart.addEventListener("click", () => this.start());
    if (this.ui.mute) this.ui.mute.addEventListener("click", () => this._toggleMute());
    if (this.ui.pauseButton) this.ui.pauseButton.addEventListener("click", () => this._togglePause());
    if (this.ui.dialogue) this.ui.dialogue.addEventListener("click", () => this._advanceDialogue());

    window.addEventListener("resize", () => this._onResize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.game.state === "running") this._setState("paused");
    });
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio, w < 700 ? 1.5 : 2);
    if (this.renderer.getPixelRatio() !== ratio) {
      this.renderer.setPixelRatio(ratio);
      this.composer.setPixelRatio(ratio);
    }
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dreamPass.uniforms.uResolution.value.set(w * ratio, h * ratio);
  }

  _setReady() {
    this.game.loaded = true;
    this._refreshHud();
    if (this.ui.loadingLabel) this.ui.loadingLabel.textContent = this.COPY.intro?.ready ?? "Ready";
    if (this.ui.loadingPercent) this.ui.loadingPercent.textContent = "100%";
    if (this.ui.loadingFill) this.ui.loadingFill.style.width = "100%";
    if (this.ui.start) {
      this.ui.start.disabled = false;
      this.ui.start.classList.add("is-ready");
    }
    window.__CHAPTER1_READY__ = true;
  }

  _setState(next) {
    this.game.state = next;
    document.body.dataset.state = next;
    const screens = ["intro", "pause", "recovery", "finish"].map((n) => document.getElementById(`${n}-screen`)).filter(Boolean);
    screens.forEach((el) => (el.hidden = true));
    if (next === "intro" && this.ui.intro) this.ui.intro.hidden = false;
    if (next === "paused" && this.ui.pause) this.ui.pause.hidden = false;
    if (next === "recovery" && this.ui.recovery) this.ui.recovery.hidden = false;
    if (next === "complete" && this.ui.finish) this.ui.finish.hidden = false;

    // The HUD and control footer only belong to live play.
    const inPlay = next === "running";
    if (this.ui.hud) this.ui.hud.hidden = !inPlay;
    const footer = document.getElementById("play-footer");
    if (footer) footer.hidden = !inPlay;

    // subtitle / dialogue toggles
    if (next === "recovery" || next === "complete" || next === "paused") {
      this._hideSubtitle();
      if (this.ui.dialogue) this.ui.dialogue.hidden = true;
    }
  }

  _refreshHud() {
    const spec = this._laneSpec();
    const progress = this._progress();
    const cache = this.hudCache;
    const text = (key, element, value) => {
      if (!element || cache[key] === value) return;
      cache[key] = value;
      element.textContent = value;
    };
    const toggle = (key, element, className, value) => {
      if (!element || cache[key] === value) return;
      cache[key] = value;
      element.classList.toggle(className, value);
    };

    text("progress", this.ui.progressLabel, `${Math.round(progress)}%`);
    text("time", this.ui.timeLabel, this._formatTime(this.game.elapsed));
    const progressWidth = `${progress.toFixed(1)}%`;
    if (this.ui.progressFill && cache.progressWidth !== progressWidth) {
      cache.progressWidth = progressWidth;
      this.ui.progressFill.style.width = progressWidth;
    }
    text("lane", this.ui.laneLabel, spec.name);
    const route = [...this.game.routes].map((id) => this.CHAPTER.lanes.find((lane) => lane.id === id)?.name).filter(Boolean).join(" → ") || spec.name;
    text("route", this.ui.routeLabel, route);
    const label = this.COPY.hud?.collisions ?? "Stumbles";
    text("hits", this.ui.hitLabel, label ? `${label} ${this.game.collisions} / ${this.CHAPTER.collisions.limit}` : "");

    const parts = [];
    if (this.game.jumpY > 0.05) parts.push("Jump");
    if (this.game.duckAmount > 0.05) parts.push("Duck");
    if (this.game.lower) parts.push(this.COPY.lower ?? "Lower passage");
    if (this.game.dialogueActive) parts.push("Conversation · run paused");
    text("motion", this.ui.motionLabel, this.game.dialogueActive ? "Conversation · run paused" : this.game.motionLabel || parts.join(" · ") || "Running");

    const inv = this.game.inventory;
    text("memory", this.ui.memCount, String(inv.memory));
    text("token", this.ui.tokenCount, String(inv.token));
    text("tape", this.ui.tapeCount, String(inv.tape));
    toggle("memoryFilled", this.ui.invMemory, "is-filled", inv.memory > 0);
    toggle("tokenFilled", this.ui.invToken, "is-filled", inv.token > 0);
    toggle("tapeFilled", this.ui.invTape, "is-filled", inv.tape > 0);
  }

  _formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const mins = String(Math.floor(total / 60)).padStart(1, "0");
    const secs = String(total % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  _showToast(title, copy, color = "#d0674b") {
    if (!this.ui.toast) return;
    this.ui.toastTitle.textContent = title;
    this.ui.toastCopy.textContent = copy;
    this.ui.toastDot.style.background = color;
    this.ui.toast.classList.add("is-visible");
    this.toastHideAt = performance.now() + 3400;
  }

  _showSubtitle(text, duration = 2800) {
    if (!this.ui.subtitle) return;
    // Dialogue owns the lower third while it is on screen.
    if (this.game.dialogueActive || (this.ui.dialogue && !this.ui.dialogue.hidden)) return;
    this.ui.subtitleText.textContent = text;
    this.ui.subtitle.hidden = false;
    requestAnimationFrame(() => this.ui.subtitle.classList.add("is-visible"));
    this.subtitleHideAt = performance.now() + duration;
  }

  _hideSubtitle() {
    if (!this.ui.subtitle) return;
    this.ui.subtitle.classList.remove("is-visible");
    this.subtitleHideAt = 0;
    window.setTimeout(() => {
      if (!this.ui.subtitle.classList.contains("is-visible")) this.ui.subtitle.hidden = true;
    }, 420);
  }

  _flash() {
    if (!this.ui.flash) return;
    this.ui.flash.classList.add("is-active");
    window.setTimeout(() => this.ui.flash.classList.remove("is-active"), 90);
  }

  // ---------- private: input -------------------------------------------

  _setupInput() {
    document.addEventListener("keydown", (event) => this._onKeyDown(event));
    document.addEventListener("keyup", (event) => this._onKeyUp(event));

    // touch
    const tap = (selector, fn) => {
      const el = document.querySelector(selector);
      if (!el) return;
      let pressed = false;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pressed = true;
        fn();
      });
      el.addEventListener("pointerup", () => { pressed = false; });
      el.addEventListener("pointerleave", () => { pressed = false; });
      el.addEventListener("pointercancel", () => { pressed = false; });
      // hold repeat
      const tick = setInterval(() => { if (pressed) fn(); }, 140);
      window.addEventListener("beforeunload", () => clearInterval(tick));
    };

    tap("#left-button", () => this._moveLane(-1));
    tap("#right-button", () => this._moveLane(1));
    tap("#jump-button", () => this._jump());
    tap("#duck-button", () => this._duck(true));
    document.querySelector("#duck-button")?.addEventListener("pointerup", () => this._duck(false));

    // swipe
    let sx = 0, sy = 0, st = 0;
    const c = this.ui.canvas;
    if (c) {
      c.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; st = performance.now(); });
      c.addEventListener("pointerup", (e) => {
        const dx = e.clientX - sx, dy = e.clientY - sy, dt = performance.now() - st;
        const absX = Math.abs(dx), absY = Math.abs(dy);
        if (absX < 20 && absY < 20 && dt < 250) {
          this._jump();
          return;
        }
        if (dt < 450) {
          if (absX > absY && absX > 30) {
            this._moveLane(dx > 0 ? 1 : -1);
          } else if (absY > absX && absY > 30) {
            if (dy < 0) this._jump();
            else this._duck(true);
          }
        }
      });
    }
  }

  _onKeyDown(event) {
    if (event.repeat) return;
    const key = event.code;
    const inRecoveryOrPause = this.game.state === "recovery" || this.game.state === "paused";
    if (key === "KeyM") { this._toggleMute(); return; }
    if (key === "Escape") { this._togglePause(); return; }
    if (this.game.state === "running" && this.game.dialogueActive) {
      if (key === "KeyE" || key === "Enter" || key === "Space") {
        this._advanceDialogue();
        event.preventDefault();
      }
      return;
    }
    if (this.chapter.hooks?.onKeyDown?.(this, event)) return;

    if (this.game.state === "intro") {
      if (key === "Enter") { this.start(); event.preventDefault(); }
      return;
    }
    if (this.game.state === "complete") {
      if (key === "KeyR") { this.start(); event.preventDefault(); }
      if (key === "Enter") { document.getElementById("next-chapter-button")?.click(); event.preventDefault(); }
      return;
    }
    if (this.game.state === "recovery") {
      if (key === "Enter") { this.start(); event.preventDefault(); }
      return;
    }
    if (inRecoveryOrPause) return;

    if (key === "KeyA" || key === "ArrowLeft") { this._moveLane(-1); event.preventDefault(); }
    else if (key === "KeyD" || key === "ArrowRight") { this._moveLane(1); event.preventDefault(); }
    else if (key === "Space" || key === "KeyW" || key === "ArrowUp") { this._jump(); event.preventDefault(); }
    else if (key === "KeyS" || key === "ArrowDown") { this._duck(true); event.preventDefault(); }
    else if (key === "KeyE") { /* reserved */ }
    else if (key === "KeyR") { this.start(); event.preventDefault(); }
  }

  _onKeyUp(event) {
    if (this.chapter.hooks?.onKeyUp?.(this, event)) return;
    if (event.code === "KeyS" || event.code === "ArrowDown") this._duck(false);
  }

  _togglePause() {
    if (this.game.state === "running") {
      this._setState("paused");
    } else if (this.game.state === "paused") {
      this._setState("running");
      this.sound.resume();
    }
  }

  _toggleMute() {
    this.sound.setMuted(!this.sound.muted);
    document.body.classList.toggle("is-muted", this.sound.muted);
    if (!this.sound.muted) { this.sound.start(); this.sound.resume(); }
  }

  _moveLane(direction) {
    if (this.game.state !== "running" || this.game.dialogueActive) return;
    if (this.game.laneCooldown > 0) return;
    const next = clamp(this.game.lane + direction, 0, this.CHAPTER.lanes.length - 1);
    if (next === this.game.lane) return;
    this.game.lane = next;
    this.game.laneCooldown = this.CHAPTER.cooldowns.lane;
    this.game.routes.add(this._laneSpec().id);
    this.sound.lane();
    this._refreshHud();
  }

  _jump() {
    if (this.game.state !== "running" || this.game.dialogueActive) return;
    if (this.game.jumpCooldown > 0) return;
    if (this.game.jumpY > 0.01) return;
    this.game.jumpV = this.CHAPTER.physics.jumpImpulse;
    this.game.jumpCooldown = this.CHAPTER.cooldowns.jump;
    this.sound.jump();
  }

  _duck(pressed) {
    if (this.game.state !== "running" || (pressed && this.game.dialogueActive)) return;
    if (pressed) {
      if (this.game.duckCooldown > 0 && this.game.duckTimer <= 0) return;
      this.game.duckTimer = Math.max(this.game.duckTimer, 0.55);
      if (this.game.duckCooldown <= 0) {
        this.game.duckCooldown = this.CHAPTER.cooldowns.duck;
        this.sound.duck();
      }
    } else {
      // release: ease out over 0.15s instead of snapping so press-down still reads
      // as a duck in automated tests and quick taps still feel tactile.
      this.game.duckTimer = Math.min(this.game.duckTimer, 0.15);
    }
  }

  // ---------- private: simulation --------------------------------------

  _updateSpeed(dt) {
    const p = this._progress();
    const mergeStart = this.CHAPTER.merge.start;
    const mergeEnd = this.CHAPTER.merge.end;
    this.game.merge = clamp((p - mergeStart) / (mergeEnd - mergeStart), 0, 1);
    const eased = this.game.merge * this.game.merge * (3 - 2 * this.game.merge);

    const targetX = this._laneSpec().x * (1 - eased);
    this.game.playerX = damp(this.game.playerX, targetX + this.game.knock, 11, dt);
    this.game.knock = damp(this.game.knock, 0, 5, dt);

    let speed = this.CHAPTER.baseSpeed * this._laneSpec().speed;
    if (this.game.safeRoute) speed *= this.CHAPTER.collisions.safeSpeed;
    if (this.CHAPTER.npc && p >= this.CHAPTER.npc.start && p <= this.CHAPTER.npc.end) speed *= this.CHAPTER.npc.speed;
    if (this.game.stumble > 0) {
      const weight = this.game.stumble / this.CHAPTER.collisions.stumbleTime;
      speed *= THREE.MathUtils.lerp(1, this.CHAPTER.collisions.stumbleSlow, weight);
    }
    this.game.lastSpeed = speed;

    this.game.prevDistance = this.game.distance;
    this.game.distance = Math.min(this.CHAPTER.length, this.game.distance + speed * dt);
    this.game.elapsed += dt;
    this.game.runPhase += dt * (5.2 + speed * 1.5);
  }

  _updateTimers(dt) {
    const g = this.game;
    g.laneCooldown = Math.max(0, g.laneCooldown - dt);
    // Snap the final few milliseconds to zero. Snapshot rounding and a keypress
    // arriving between frames must not silently discard a lane change.
    if (g.laneCooldown < 0.006) g.laneCooldown = 0;
    g.jumpCooldown = Math.max(0, g.jumpCooldown - dt);
    g.duckCooldown = Math.max(0, g.duckCooldown - dt);
    g.duckTimer = Math.max(0, g.duckTimer - dt);
    g.invulnerable = Math.max(0, g.invulnerable - dt);
    g.stumble = Math.max(0, g.stumble - dt);
    g.shake = Math.max(0, g.shake - dt);
    g.ink = Math.max(0, g.ink - dt);
    g.recoveryTimer = Math.max(0, g.recoveryTimer - dt);

    // jump physics
    if (g.jumpY > 0 || g.jumpV > 0) {
      g.jumpV -= this.CHAPTER.physics.gravity * dt;
      g.jumpY += g.jumpV * dt;
      if (g.jumpY <= 0) { g.jumpY = 0; g.jumpV = 0; }
    }

    // duck easing
    const target = g.duckTimer > 0 ? 1 : 0;
    g.duckAmount = damp(g.duckAmount, target, 10, dt);

    // safe route auto-select
    if (g.state === "recovery" && g.recoveryTimer <= 0) this._takeSafeRoute();
    // finish
    if (g.state === "running" && g.distance >= this.CHAPTER.length - 0.01) this._completeRun();
  }

  _updateStory(dt) {
    const p = this._progress();
    this._checkNarration();

    // Dialogue triggering
    if (!this.game.dialogueActive && !this.game.dialogueDone && this.CHAPTER.npc && p >= this.CHAPTER.npc.start && p <= this.CHAPTER.npc.end) {
      this._startDialogue();
    }
    if (this.game.dialogueActive) this._updateDialogue(dt);
  }

  _checkNarration() {
    if (!this.NARRATION) return;
    const p = this._progress();
    this.NARRATION.forEach((line) => {
      if (p >= line.p && !this.game.narrationDone.has(line.p)) {
        this.game.narrationDone.add(line.p);
        if (!this.game.dialogueActive) this._showSubtitle(line.text, 3000);
      }
    });
  }

  // ---------- private: obstacles / gate / pickups -----------------------

  _checkObstacles() {
    if (this.game.invulnerable > 0) return;
    const p = this._progress();
    const d = this.progressToDistance(p);

    for (const obstacle of this.obstacles) {
      if (obstacle.hit || obstacle.passed || obstacle.disabled) continue;
      const contact = d - (obstacle.spec.depth + 0.5) / 2;
      if (contact < obstacle.d) continue;

      const halfWidth = (obstacle.spec.width + 0.42) / 2;
      // Moving obstacles must collide where they are rendered, not at their
      // original lane centre; otherwise players see ghost hits or clipping.
      const obstacleX = obstacle.group.position.x;
      if (Math.abs(this.game.playerX - obstacleX) > halfWidth) { obstacle.passed = true; continue; }

      if (this.game.jumpY >= obstacle.spec.jump) { obstacle.passed = true; continue; }

      this._resolveObstacle(obstacle);
    }
  }

  _resolveObstacle(obstacle) {
    obstacle.hit = true;
    obstacle.passed = true;

    // Token absorbs
    if (this.game.inventory.token > 0) {
      this.game.inventory.token -= 1;
      obstacle.react = 1;
      this._showToast("Token absorbed", "Protection Token took the hit for you.", "#c7a05c");
      this._refreshHud();
      this.sound.token();
      return;
    }

    this.game.collisions += 1;
    this.game.invulnerable = this.CHAPTER.collisions.invulnerable;
    this.game.stumble = this.CHAPTER.collisions.stumbleTime;
    this.game.knock = obstacle.spec.type === "card" ? 0.6 : obstacle.spec.type === "ink" ? -0.6 : 0.3;

    const fb = this.FEEDBACK[obstacle.spec.type] ?? this.FEEDBACK.pencil;
    obstacle.react = 1;
    obstacle.reactDir = Math.random() > 0.5 ? 1 : -1;
    this.game.shake = fb.shake ?? 0.15;

    if (obstacle.spec.type === "ink") this.game.ink = 0.9;

    this._showToast(fb.title, fb.copy, fb.color);
    this._flash();
    this.sound.stumble(obstacle.spec.type);
    this._knockCamera(fb.shake ?? 0.15);
    this._refreshHud();

    // burst
    this._burst(obstacle.group.position, obstacle.spec.type);

    if (this.game.collisions >= this.CHAPTER.collisions.limit) {
      this._openRecovery();
    }
  }

  _checkPickups() {
    const p = this._progress();
    const d = this.progressToDistance(p);
    for (const pickup of this.pickups) {
      if (pickup.taken) continue;
      if (d - 0.35 < pickup.d) continue;
      if (Math.abs(this.game.playerX - pickup.laneX) > 0.92) continue;
      this._collectPickup(pickup);
    }
  }

  _collectPickup(pickup) {
    pickup.taken = true;
    pickup.group.visible = false;
    this.game.collected.add(pickup.spec.id);
    if (pickup.spec.kind === "memory") this.game.inventory.memory += 1;
    else if (pickup.spec.kind === "token") this.game.inventory.token += 1;
    else if (pickup.spec.kind === "tape") this.game.inventory.tape += 1;

    this._showToast(pickup.spec.title, pickup.spec.copy, "#f0c378");
    this._showSubtitle(`+ ${pickup.spec.title}`, 1400);
    this.sound.pickup();
    this._refreshHud();
  }

  _triggerGate() {
    if (this.game.gateTriggered) return;
    this.game.gateTriggered = true;
    this.game.lower = true;
    this.sound.gate();
    this._showToast(this.COPY.gate?.title ?? "Lower service passage", this.COPY.gate?.copy ?? "Duck under.", "#6f9488");
    this._burst(this.gateGroup.position, "gate");
  }

  _resetObstacle(obstacle) {
    obstacle.hit = false;
    obstacle.passed = false;
    obstacle.react = 0;
    obstacle.disabled = false;
    obstacle.group.visible = true;
    obstacle.group.position.copy(obstacle.home.position);
    obstacle.group.rotation.copy(obstacle.home.rotation);
    obstacle.group.scale.set(1, 1, 1);
  }

  _resetGate() {
    if (this.gateGroup) this.gateGroup.visible = true;
    this.game.gateTriggered = false;
    this.game.lower = false;
  }

  _openRecovery() {
    this.game.recoveryTimer = this.CHAPTER.collisions.recoveryTimeout;
    this.game.duckTimer = 0;
    this.game.jumpY = 0;
    this.game.jumpV = 0;
    this.sound.recovery();
    this._setState("recovery");
  }

  _takeSafeRoute() {
    const nodes = this.CHAPTER.collisions.safeNodes || [0];
    let node = 0;
    this.obstacles.forEach((o) => { if (o.spec.p <= this._progress()) node = o.spec.p; });
    // Pick nearest safe node <= current progress
    nodes.forEach((value) => { if (value <= this._progress()) node = value; });

    this.game.recoveryTimer = 0;
    this.game.distance = this.progressToDistance(node);
    this.game.prevDistance = this.game.distance;
    this.game.safeRoute = true;
    this.game.invulnerable = this.CHAPTER.collisions.safeInvulnerable;
    this.game.stumble = 0;
    this.game.duckTimer = 0;
    this.game.ink = 0;
    this.game.jumpY = 0;
    this.game.jumpV = 0;
    this.game.collisions = this.CHAPTER.collisions.limit;
    this.obstacles.forEach((obstacle) => {
      this._resetObstacle(obstacle);
      if (!obstacle.spec.safe) {
        obstacle.disabled = true;
        obstacle.group.visible = false;
      }
    });
    if (node < this.CHAPTER.gate.p) this._resetGate();
    this._hideSubtitle();
    this._setState("running");
    this._refreshHud();
    this._showToast("Safe route", "0.88× speed, wider spacing, fewer obstacles.", "#6f9488");
    this._showSubtitle("The avenue opens a quieter line.", 2400);
  }

  _completeRun() {
    if (this.game.finished) return;
    this.game.finished = true;
    this._setState("complete");
    this.sound.complete();
    this.ui.resultTime.textContent = this._formatTime(this.game.elapsed);
    this.ui.resultStumbles.textContent = String(this.game.collisions);
    this.ui.resultMemories.textContent = `${this.game.inventory.memory} / 1`;
    const routeNames = [...this.game.routes].map((id) => this.CHAPTER.lanes.find((lane) => lane.id === id)?.name || id);
    const fallbackLane = this.CHAPTER.lanes[this.game.lane]?.name || "";
    this.ui.resultRoute.textContent = `Route: ${routeNames.join(" → ") || fallbackLane}`;
    const finishCopy = this.COPY.finish;
    if (this.game.safeRoute) this.ui.resultNote.textContent = finishCopy.safe;
    else if (this.game.collisions === 0) this.ui.resultNote.textContent = finishCopy.noStumble;
    else this.ui.resultNote.textContent = finishCopy.stumbles.replace("{n}", String(this.game.collisions));
    this.chapter.hooks?.onComplete?.(this);
    window.dispatchEvent(new CustomEvent("openwild:chaptercomplete", {
      detail: { chapterId: this.chapter.id, elapsed: this.game.elapsed, collisions: this.game.collisions },
    }));
  }

  // ---------- private: dialogue ----------------------------------------

  _startDialogue() {
    this.game.dialogueActive = true;
    this.game.dialogueIndex = 0;
    this._hideSubtitle();
    this._showDialogueLine();
  }

  _showDialogueLine() {
    if (!this.DIALOGUE || this.game.dialogueIndex >= this.DIALOGUE.length) {
      this.game.dialogueActive = false;
      if (this.ui.dialogue) this.ui.dialogue.hidden = true;
      return;
    }
    const line = this.DIALOGUE[this.game.dialogueIndex];
    this._hideSubtitle();
    if (this.ui.subtitle) {
      this.ui.subtitle.classList.remove("is-visible");
      this.ui.subtitle.hidden = true;
      this.subtitleHideAt = 0;
    }
    this.ui.dialogueSpeaker.textContent = line.speaker;
    this.ui.dialogueText.textContent = line.text;
    this.ui.dialogue.hidden = false;
    this.game.dialogueTimer = 0;
    // trigger feedback on last line
    if (this.game.dialogueIndex === this.DIALOGUE.length - 1) this.game.dialogueDone = true;
  }

  _advanceDialogue() {
    if (!this.game.dialogueActive) return;
    this.game.seenDialogue.add(`${this.chapter.id}:${this.game.dialogueIndex}`);
    this.game.dialogueIndex += 1;
    if (this.game.dialogueIndex >= this.DIALOGUE.length) {
      this.game.dialogueActive = false;
      this.ui.dialogue.hidden = true;
      this._showSubtitle("You keep running. The stranger is gone.", 2400);
    } else {
      this._showDialogueLine();
    }
  }

  _updateDialogue(dt) {
    this.game.dialogueTimer += dt;
    if (this.game.dialogueTimer > 4.5 && this.game.dialogueIndex < this.DIALOGUE.length - 1) {
      this._advanceDialogue();
    }
  }

  // ---------- private: particles / effects ------------------------------

  _burst(position, type) {
    if (!this.MAT) return;
    const fragMaterials = {
      paper: new THREE.MeshStandardMaterial({ color: 0xf8f0df, roughness: 0.9, side: THREE.DoubleSide }),
      warm: new THREE.MeshStandardMaterial({ color: 0xefd9a8, roughness: 0.9, side: THREE.DoubleSide }),
      pink: new THREE.MeshStandardMaterial({ color: 0xd66b86, roughness: 0.85 }),
      graphite: new THREE.MeshStandardMaterial({ color: 0x39443f, roughness: 0.6 }),
      ink: new THREE.MeshStandardMaterial({ color: 0x2b3f4a, roughness: 0.3 }),
    };
    const mat = type === "ink" ? fragMaterials.ink : type === "eraser" ? fragMaterials.pink : type === "pencil" ? fragMaterials.graphite : fragMaterials.paper;
    const count = 18;
    const pieces = [];
    for (let i = 0; i < count; i += 1) {
      const piece = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), mat);
      piece.position.copy(position);
      const speed = 1.2 + Math.random() * 2.2;
      const dir = new THREE.Vector3(Math.random() - 0.5, 0.3 + Math.random() * 1.5, Math.random() - 0.5).normalize().multiplyScalar(speed);
      piece.userData = { vel: dir, rot: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), age: 0, life: 0.8 + Math.random() * 0.6 };
      this.scene.add(piece);
      pieces.push(piece);
    }
    this.effects.push({ type: "burst", pieces });
  }

  _knockCamera(strength = 0.15) {
    this.game.shake = Math.max(this.game.shake, strength);
  }

  _updateEffects(dt) {
    // bursts
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const fx = this.effects[i];
      if (fx.type !== "burst") continue;
      fx.pieces.forEach((p) => {
        p.userData.age += dt;
        if (p.userData.age >= p.userData.life) { p.visible = false; return; }
        p.userData.vel.y -= 4.5 * dt;
        p.position.addScaledVector(p.userData.vel, dt);
        p.rotation.x += p.userData.rot.x * dt;
        p.rotation.y += p.userData.rot.y * dt;
        p.rotation.z += p.userData.rot.z * dt;
      });
      if (fx.pieces.every((p) => !p.visible || p.userData.age >= p.userData.life)) {
        fx.pieces.forEach((p) => this.scene.remove(p));
        this.effects.splice(i, 1);
      }
    }

    // pickups floating
    this.pickups.forEach((p) => {
      if (p.taken || !p.group) return;
      p.phase += dt * 2;
      p.group.rotation.y = Math.sin(p.phase) * 0.2;
      p.group.position.y = Math.sin(p.phase * 0.8) * 0.06;
    });

    // stranger idle
    if (this.stranger && this.stranger.visible) {
      this.stranger.rotation.y = this._progress() > this.CHAPTER.npc.start ? Math.PI / 1.75 + Math.sin(this.game.elapsed * 0.7) * 0.05 : this.stranger.rotation.y;
    }

    // dust
    if (this.dustPoints) {
      const pos = this.dustPoints.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        let y = pos.getY(i) + dt * 0.15;
        if (y > 6.5) y = 0.25;
        pos.setY(i, y);
        let z = pos.getZ(i) - dt * 0.2;
        if (z < -34) z = 5;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }

    // portal glow near end
    if (this.portalGlow) {
      const p = this._progress();
      const glow = clamp(p / 100, 0, 1);
      this.portalGlow.material.opacity = 0.32 + glow * 0.42 + Math.sin(this.game.elapsed * 1.5) * 0.06;
    }

    // Obstacle warnings are world-space, high-contrast and visible in every
    // chapter palette. They appear only within the useful reaction distance.
    this.obstacles.forEach((o) => {
      if (o.warningRing && o.warningMarker) {
        const ahead = o.d - this.game.distance;
        const visible = !o.hit && !o.passed && !o.disabled && ahead > -0.5 && ahead < 24;
        o.warningRing.visible = visible;
        o.warningMarker.visible = visible;
        if (visible) {
          const proximity = clamp(1 - ahead / 24, 0, 1);
          const pulse = 1 + Math.sin(this.game.elapsed * 5 + o.d) * 0.06 * proximity;
          o.warningRing.scale.set(o.warningScale * pulse, pulse, 1);
          o.warningRing.material.opacity = 0.38 + proximity * 0.5;
          o.warningMarker.position.y = o.markerBaseY + Math.sin(this.game.elapsed * 3 + o.d) * 0.08;
          const iconSize = 0.46 + Math.sin(this.game.elapsed * 4 + o.d) * 0.035;
          o.warningMarker.scale.set(iconSize, iconSize, 1);
        }
      }
      if (o.react > 0) {
        o.react = Math.max(0, o.react - dt * 3);
        const fb = this.FEEDBACK[o.spec.type];
        const shake = (fb?.shake ?? 0.15) * o.react;
        const speed = fb?.slow ? 1 + fb.slow : 1.3;
        o.group.rotation.z = Math.sin(o.react * 10 + this.game.elapsed * speed) * shake * o.reactDir;
        o.group.rotation.x = Math.cos(o.react * 12 + this.game.elapsed * speed) * shake * 0.5;
      }
      // chapter-defined moving obstacles
      if (o.spec.slide && !o.hit && !o.disabled) {
        const slide = o.spec.slide ?? { amp: 0.92, speed: 1.15 };
        o.group.position.x = o.home.position.x + Math.sin(this.game.runPhase * slide.speed + o.home.position.z) * slide.amp;
      }
      // flip and rise on hit
      if (o.hit && o.react < 0.02 && !o.flipped) {
        o.flipped = true;
        const ease = 1;
        o.group.position.y = this.CHAPTER.groundY + ease * 2.2;
        o.group.position.x += o.reactDir * 0.6;
        o.group.rotation.x = Math.PI * 1.4;
        o.group.rotation.z += o.reactDir * 0.7;
      }
    });

    // gate
    if (this.gateGroup) {
      if (this.game.gateTriggered && this.game.lower) {
        const p = this._progress();
        if (p < this.CHAPTER.gate.p + 2) {
          this.gateGroup.position.y += dt * 4.0;
          if (this.gateGroup.position.y > 3.2) this.gateGroup.visible = false;
        }
      }
    }
  }

  // ---------- private: camera -------------------------------------------

  _updateCamera(dt) {
    const baseY = 1.62 - this.game.cameraOffsetY;
    const lowerY = 1.34 - this.game.cameraOffsetY;
    const targetY = baseY - this.game.lower * (baseY - lowerY) - this.game.duckAmount * 0.44;
    const bob = this.game.state === "running" ? Math.sin(this.game.runPhase) * 0.035 * (1 - this.game.lower * 0.7) : 0;
    const sway = this.game.state === "running" ? Math.sin(this.game.runPhase * 0.5 + 1.3) * 0.018 * (1 - this.game.lower * 0.7) : 0;
    const jumpLift = this.game.jumpY * 0.92;

    let shakeX = 0, shakeY = 0, shakeRoll = 0;
    if (this.game.shake > 0) {
      shakeX = (Math.random() - 0.5) * this.game.shake * 0.35;
      shakeY = (Math.random() - 0.5) * this.game.shake * 0.35;
      shakeRoll = (Math.random() - 0.5) * this.game.shake * 0.6;
    }

    const z = this.CHAPTER.startZ - this.game.distance + 1.8;
    const dampY = damp(this.camera.position.y, targetY + bob + jumpLift, 6, dt);
    const dampX = damp(this.camera.position.x, this.game.playerX + sway + shakeX, 10, dt);

    this.camera.position.x = dampX;
    this.camera.position.y = dampY + shakeY;
    this.camera.position.z = z;

    const rollTarget = shakeRoll + (this.game.lower ? -0.04 : 0);
    this.camera.rotation.z = damp(this.camera.rotation.z, rollTarget, 4, dt);

    const lookX = this.game.playerX * 0.42;
    const lookY = targetY + jumpLift * 0.6;
    const lookZ = z - 12;
    this.camera.lookAt(lookX, lookY, lookZ);

    // Stranger show/hide
    if (this.stranger) {
      const p = this._progress();
      const npc = this.CHAPTER.npc;
      if (npc) {
        this.stranger.visible = p >= npc.start - 2 && p <= npc.end + 2 && p < 98;
      }
    }
  }

  // ---------- private: main loop ---------------------------------------

  _loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    const u = this.dreamPass?.uniforms;
    if (u) {
      u.uTime.value = now / 1000;
      u.uStumble.value = this.game.stumble > 0 ? clamp(this.game.stumble / this.CHAPTER.collisions.stumbleTime, 0, 1) : 0;
      u.uInk.value = this.game.ink > 0 ? clamp(this.game.ink, 0, 1) : 0;
      u.uLower.value = this.game.lower ? 1 : 0;
    }

    if (this.game.state === "running") {
      if (this.game.dialogueActive) {
        // Conversation is a gameplay pause, not only a visual overlay. Keep the
        // renderer and dialogue alive while simulation and input stay frozen.
        this.game.lastSpeed = 0;
        this.game.prevDistance = this.game.distance;
        this._updateDialogue(dt);
        this._updateEffects(dt);
        this._updateCamera(0);
      } else {
        this._updateSpeed(dt);
        this._updateTimers(dt);
        this._checkObstacles();
        this._checkPickups();
        if (this.CHAPTER.gate && this._progress() >= this.CHAPTER.gate.p - 0.5 && !this.game.gateTriggered) this._triggerGate();
        this._updateStory(dt);
        this._updateEffects(dt);
        this._updateCamera(dt);
      }
      this._refreshHud();

      if (this.toastHideAt && performance.now() > this.toastHideAt) {
        this.ui.toast?.classList.remove("is-visible");
        this.toastHideAt = 0;
      }
      if (this.subtitleHideAt && performance.now() > this.subtitleHideAt) {
        this._hideSubtitle();
      }

      // recovery countdown
      if (this.game.state === "recovery") {
        const n = Math.ceil(this.game.recoveryTimer);
        if (this.ui.recoveryCountdown && n > 0) {
          this.ui.recoveryCountdown.textContent = this.COPY.recovery.countdown.replace("{n}", String(n));
        }
      }
    } else {
      this._updateEffects(dt);
    }

    this.chapter.hooks?.onUpdate?.(this, dt);
    this.composer?.render();
    window.requestAnimationFrame(this._loop);
  }
}

// Convenience factory — most projects only need one chapter at a time.
export async function createRunner({ chapter }) {
  const runner = new Runner({ chapter });
  await runner.init();
  // Expose debug API on window so the QA harness can drive it.
  window.__CHAPTER1__ = {
    snapshot: () => runner.snapshot(),
    teleportProgress: (v) => runner.teleportProgress(v),
    setLane: (v) => runner.setLane(v),
    moveLane: (dir) => runner._moveLane(dir),
    jump: () => runner._jump(),
    duck: (on) => runner._duck(on),
    start: () => runner.start(),
    restart: () => runner.restart(),
    state: () => runner.game.state,
    scene: () => runner.scene,
    camera: () => runner.camera,
    chapter: () => runner,
  };
  return runner;
}
