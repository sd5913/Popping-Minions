import { SceneManager } from "./SceneManager.js";
import { InputManager } from "../controls/InputManager.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { FirstPersonRenderer } from "../rendering/FirstPersonRenderer.js";
import { HUD } from "../ui/HUD.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sceneManager = new SceneManager();
    this.input = new InputManager();
    this.input.bindSurface(canvas);
    this.movement = new MovementSystem();
    this.collision = new CollisionSystem();
    this.renderer = new FirstPersonRenderer();
    this.hud = new HUD();

    this.state = "title";
    this.obstacles = [];
    this.spawnTimer = 0;
    this.obstacleId = 0;
    this.lastSpawnLane = 1;

    this.dialogueIndex = 0;
    this.dialogueTimer = 0;
    this.dialogueDelay = 5;

    this.totalTime = 0;
    this.lastFrame = 0;
    this.animationId = null;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.keyboardHandler = this.handleKeyboard.bind(this);

    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.keyboardHandler);

    this.resize();
    this.bindEvents();
  }

  get chapter() {
    return this.sceneManager.current;
  }

  bindEvents() {
    // Keyboard, touch, camera and future gesture adapters all converge here.
    this.input.onAction((action, payload) => {
      this.handleAction(action, "input", payload);
    });

    this.hud.onStart(() => this.startGame());
    this.hud.onPause(() => this.togglePause());
    this.hud.onDialogueNext(() => this.advanceDialogue());
    this.hud.onTransitionNext(() => this.nextChapter());
    this.hud.onEnding(() => {
      this.state = "finished";
      this.hud.showMessage("YOUR JOURNEY CONTINUES.");
    });
  }

  handleKeyboard(event) {
    if (event.code !== "Escape") return;
    event.preventDefault();
    this.togglePause();
  }

  togglePause() {
    if (this.state === "running") {
      this.state = "paused";
      this.hud.showMessage("GAME PAUSED");
      this.hud.setPauseLabel("RESUME");
    } else if (this.state === "paused") {
      this.state = "running";
      this.hud.showMessage("");
      this.hud.setPauseLabel("PAUSE");
    }
  }

  handleAction(action, source = "input", payload = {}) {
    void source;
    void payload;

    if (this.state === "title") {
      if (action === "INTERACT") this.startGame();
      return;
    }

    if (this.state === "paused") {
      if (action === "INTERACT") this.togglePause();
      return;
    }

    if (this.state === "dialogue") {
      if (["INTERACT", "FORWARD", "LEFT", "RIGHT", "JUMP"].includes(action)) {
        this.advanceDialogue();
      }
      return;
    }

    if (this.state === "transition") {
      if (["INTERACT", "FORWARD"].includes(action)) this.nextChapter();
      return;
    }

    if (this.state === "ending") {
      if (["FORWARD", "INTERACT"].includes(action)) {
        this.state = "finished";
        this.hud.showMessage("YOUR JOURNEY CONTINUES.");
      }
      return;
    }

    if (this.state !== "running") return;

    if (action === "LEFT") this.movement.moveLeft();
    if (action === "RIGHT") this.movement.moveRight();
    if (action === "JUMP") this.movement.jump();
    // FORWARD and INTERACT remain available for future story/gesture actions.
  }

  start() {
    if (this.animationId) return;
    this.hud.showTitle();
    this.lastFrame = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  startGame() {
    this.sceneManager.reset();
    this.movement = new MovementSystem();
    this.collision.reset();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.obstacleId = 0;
    this.lastSpawnLane = 1;
    this.dialogueIndex = 0;
    this.dialogueTimer = 0;
    this.totalTime = 0;
    this.state = "running";

    this.seedObstacles();
    this.hud.hideAll();
    this.hud.setPauseLabel("PAUSE");
    this.hud.updateChapter(this.chapter);
    this.hud.showMessage("THE JOURNEY BEGINS");
  }

  advanceDialogue() {
    if (this.state !== "dialogue") return;
    this.dialogueIndex += 1;

    const lines = this.chapter.dialogue || [];
    if (this.dialogueIndex >= lines.length) {
      this.state = "running";
      this.sceneManager.markDialoguePlayed();
      this.hud.hideDialogue();
      this.hud.showMessage("KEEP MOVING");
      return;
    }

    this.showCurrentDialogue();
  }

  showCurrentDialogue() {
    const line = (this.chapter.dialogue || [])[this.dialogueIndex];
    if (!line) return;
    this.hud.showDialogue(line.speaker, line.text);
    this.dialogueTimer = 0;
  }

  triggerDialogue() {
    if (!this.chapter.dialogue || this.sceneManager.hasPlayedDialogue()) return;
    this.state = "dialogue";
    this.dialogueIndex = 0;
    this.showCurrentDialogue();
  }

  nextChapter() {
    const moved = this.sceneManager.next();
    if (!moved) {
      this.state = "ending";
      this.hud.showEnding();
      return;
    }

    this.obstacles = [];
    this.spawnTimer = 0;
    this.lastSpawnLane = 1;
    this.state = "running";
    this.seedObstacles();
    this.hud.hideTransition();
    this.hud.updateChapter(this.chapter);
    this.hud.showMessage(this.chapter.name.toUpperCase());
  }

  getWorldSpeed(speedMultiplier) {
    const chapterSpeed = Number(this.chapter.speed) || 0.5;
    return (8.2 + chapterSpeed * 10.5) * speedMultiplier;
  }

  update(deltaTime) {
    if (this.state !== "running" && this.state !== "dialogue") return;

    this.totalTime += deltaTime;
    const isDialogue = this.state === "dialogue";
    let speedMultiplier = isDialogue ? 0.28 : 1;
    if (this.movement.isStumbling) speedMultiplier *= 0.42;

    const worldSpeed = this.getWorldSpeed(speedMultiplier);
    this.movement.update(deltaTime, worldSpeed);
    this.collision.update(deltaTime);

    const chapterFinished = this.sceneManager.update(deltaTime * speedMultiplier);
    if (chapterFinished) {
      if (this.sceneManager.isLastChapter) {
        this.state = "ending";
        this.hud.showEnding();
      } else {
        this.state = "transition";
        this.hud.showTransition(this.chapter);
      }
      return;
    }

    if (
      !isDialogue &&
      this.sceneManager.progress >= 0.48 &&
      this.chapter.dialogue &&
      !this.sceneManager.hasPlayedDialogue()
    ) {
      this.triggerDialogue();
      return;
    }

    if (!isDialogue && this.chapter.obstacleTypes?.length) {
      this.spawnTimer += deltaTime;
      const spawnInterval = Number(this.chapter.spawnInterval) || 2.2;
      if (this.spawnTimer >= spawnInterval) {
        this.spawnObstacle();
        this.spawnTimer -= spawnInterval;
      }
    }

    for (const obstacle of this.obstacles) {
      obstacle.z -= worldSpeed * deltaTime;
    }

    const hit = this.collision.check(this.movement, this.obstacles, this.totalTime);
    if (hit) {
      this.movement.stumble();
      this.hud.showMessage("YOU STUMBLED. THE ROAD CONTINUES.");
    }

    this.obstacles = this.obstacles.filter(
      (obstacle) => !obstacle.hit && obstacle.z > -5
    );

    this.hud.updateStatus({
      distance: this.movement.distance,
      mistakes: this.collision.totalMistakes,
      state: this.state,
      speed: worldSpeed,
      lane: this.movement.lane,
      jumping: this.movement.isJumping
    });

    if (isDialogue && this.state === "dialogue") {
      this.dialogueTimer += deltaTime;
      if (this.dialogueTimer >= this.dialogueDelay) this.advanceDialogue();
    }
  }

  seedObstacles() {
    if (!this.chapter.obstacleTypes?.length) return;
    [30, 52, 75, 98].forEach((distance) => this.spawnObstacle(distance));
  }

  spawnObstacle(distance = 94) {
    const types = this.chapter.obstacleTypes;
    if (!types?.length) return;

    const type = types[Math.floor(Math.random() * types.length)];
    let lane = Math.floor(Math.random() * 3);

    // Avoid long same-lane chains while preserving unpredictability.
    if (lane === this.lastSpawnLane && Math.random() > 0.42) {
      lane = (lane + (Math.random() > 0.5 ? 1 : 2)) % 3;
    }
    this.lastSpawnLane = lane;

    this.obstacles.push({
      id: ++this.obstacleId,
      type,
      lane,
      z: distance,
      hit: false,
      jumpable: !["broken-road", "island"].includes(type)
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.ctx.clearRect(0, 0, width, height);
    this.renderer.render(this.ctx, width, height, {
      chapter: this.chapter,
      movement: this.movement,
      obstacles: this.obstacles,
      time: this.totalTime,
      state: this.state
    });
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrame) / 1000, 0.05);
    this.lastFrame = timestamp;
    this.update(deltaTime);
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  }

  getDebugState() {
    return {
      state: this.state,
      chapter: this.chapter.id,
      lane: this.movement.lane,
      visualLane: this.movement.visualLane,
      jumpHeight: this.movement.jumpHeight,
      landingImpact: this.movement.landingImpact,
      distance: this.movement.distance,
      obstacleCount: this.obstacles.length,
      nearestObstacle: this.obstacles.reduce(
        (nearest, obstacle) => Math.min(nearest, obstacle.z),
        Infinity
      ),
      mistakes: this.collision.totalMistakes
    };
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.input.destroy();
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.keyboardHandler);
  }
}
