
import { SceneManager } from "./SceneManager.js";
import { InputManager } from "../controls/InputManager.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { HUD } from "../ui/HUD.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.sceneManager = new SceneManager();
    this.input = new InputManager();
    this.movement = new MovementSystem();
    this.collision = new CollisionSystem();
    this.hud = new HUD();

    this.state = "title";

    // Dynamic obstacles
    this.obstacles = [];
    this.spawnTimer = 0;
    this.obstacleId = 0;

    // Dialogue
    this.dialogueIndex = 0;
    this.dialogueTimer = 0;
    this.dialogueDelay = 5;

    // Game timing
    this.totalTime = 0;
    this.lastFrame = 0;
    this.animationId = null;

    // Keyboard / input deduplication
    this.lastAction = "";
    this.lastActionTime = 0;

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

  // ----------------------------------------
  // INPUT
  // ----------------------------------------

  bindEvents() {
    // Camera and gesture input
    this.input.onAction((action) => {
      this.handleAction(action, "input");
    });

    this.hud.onStart(() => this.startGame());

    this.hud.onPause(() => {
      if (this.state === "running") {
        this.state = "paused";
        this.hud.showMessage("GAME PAUSED");
        this.hud.setPauseLabel("RESUME");
      } else if (this.state === "paused") {
        this.state = "running";
        this.hud.showMessage("");
        this.hud.setPauseLabel("PAUSE");
      }
    });

    this.hud.onDialogueNext(() => this.advanceDialogue());

    this.hud.onTransitionNext(() => this.nextChapter());

    this.hud.onEnding(() => {
      this.state = "finished";
      this.hud.showMessage("YOUR JOURNEY CONTINUES.");
    });
  }

  handleKeyboard(event) {
    // Do not intercept text inputs
    const target = event.target;

    if (
      target &&
      (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
    ) {
      return;
    }

    if (event.repeat) return;

    let action = null;

    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        action = "LEFT";
        break;

      case "ArrowRight":
      case "KeyD":
        action = "RIGHT";
        break;

      case "Space":
      case "ArrowUp":
      case "KeyW":
        action = "JUMP";
        break;

      case "Enter":
        action = "INTERACT";
        break;

      case "Escape":
        if (this.state === "running") {
          this.state = "paused";
          this.hud.showMessage("GAME PAUSED");
          this.hud.setPauseLabel("RESUME");
        } else if (this.state === "paused") {
          this.state = "running";
          this.hud.showMessage("");
          this.hud.setPauseLabel("PAUSE");
        }
        event.preventDefault();
        return;

      default:
        return;
    }

    event.preventDefault();

    this.handleAction(action, "keyboard");
  }

  handleAction(action, source = "input") {
    const now = performance.now();

    // Avoid processing the same physical key twice
    // when both InputManager and Game receive it.
    if (
      action === this.lastAction &&
      now - this.lastActionTime < 70
    ) {
      return;
    }

    this.lastAction = action;
    this.lastActionTime = now;

    if (this.state === "title") {
      if (action === "INTERACT") {
        this.startGame();
      }
      return;
    }

    if (this.state === "paused") {
      if (action === "INTERACT") {
        this.state = "running";
        this.hud.showMessage("");
        this.hud.setPauseLabel("PAUSE");
      }
      return;
    }

    if (this.state === "dialogue") {
      if (
        ["INTERACT", "FORWARD", "LEFT", "RIGHT", "JUMP"].includes(action)
      ) {
        this.advanceDialogue();
      }
      return;
    }

    if (this.state === "transition") {
      if (["INTERACT", "FORWARD"].includes(action)) {
        this.nextChapter();
      }
      return;
    }

    if (this.state === "ending") {
      if (action === "FORWARD" || action === "INTERACT") {
        this.state = "finished";
        this.hud.showMessage("YOUR JOURNEY CONTINUES.");
      }
      return;
    }

    if (this.state !== "running") return;

    switch (action) {
      case "LEFT":
        this.movement.moveLeft();
        break;

      case "RIGHT":
        this.movement.moveRight();
        break;

      case "JUMP":
        this.movement.jump();
        break;

      case "FORWARD":
        // Normal running is automatic.
        break;

      case "INTERACT":
        // Reserved for story interactions.
        break;
    }
  }

  // ----------------------------------------
  // GAME START
  // ----------------------------------------

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
    this.dialogueIndex = 0;
    this.dialogueTimer = 0;
    this.totalTime = 0;

    this.state = "running";

    this.hud.hideAll();
    this.hud.setPauseLabel("PAUSE");

    this.hud.updateChapter(this.chapter);
    this.hud.showMessage("THE JOURNEY BEGINS");
  }

  // ----------------------------------------
  // DIALOGUE
  // ----------------------------------------

  advanceDialogue() {
    if (this.state !== "dialogue") return;

    this.dialogueIndex++;

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
    const lines = this.chapter.dialogue || [];
    const line = lines[this.dialogueIndex];

    if (!line) return;

    this.hud.showDialogue(line.speaker, line.text);

    this.dialogueTimer = 0;
  }

  triggerDialogue() {
    if (
      !this.chapter.dialogue ||
      this.sceneManager.hasPlayedDialogue()
    ) {
      return;
    }

    this.state = "dialogue";
    this.dialogueIndex = 0;

    this.showCurrentDialogue();
  }

  // ----------------------------------------
  // CHAPTERS
  // ----------------------------------------

  nextChapter() {
    const moved = this.sceneManager.next();

    if (!moved) {
      this.state = "ending";
      this.hud.showEnding();
      return;
    }

    this.obstacles = [];
    this.spawnTimer = 0;

    this.state = "running";

    this.hud.hideTransition();
    this.hud.updateChapter(this.chapter);

    this.hud.showMessage(this.chapter.name.toUpperCase());
  }

  // ----------------------------------------
  // UPDATE
  // ----------------------------------------

  update(deltaTime) {
    if (
      this.state !== "running" &&
      this.state !== "dialogue"
    ) {
      return;
    }

    this.totalTime += deltaTime;

    const isDialogue = this.state === "dialogue";

    // Slow down the world during dialogue
    let speedMultiplier = isDialogue ? 0.25 : 1;

    if (this.movement.isStumbling) {
      speedMultiplier *= 0.45;
    }

    const chapterSpeed = Number(this.chapter.speed) || 1;

    const effectiveSpeed = chapterSpeed * speedMultiplier;

    this.movement.update(
      deltaTime,
      effectiveSpeed
    );

    this.collision.update(deltaTime);

    // Progress through the current chapter
    const chapterFinished = this.sceneManager.update(
      deltaTime * speedMultiplier
    );

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

    // Trigger NPC dialogue
    if (
      !isDialogue &&
      this.sceneManager.progress >= 0.48 &&
      this.chapter.dialogue &&
      !this.sceneManager.hasPlayedDialogue()
    ) {
      this.triggerDialogue();
      return;
    }

    // ------------------------------------
    // Dynamic obstacle generation
    // ------------------------------------

    if (!isDialogue) {
      this.spawnTimer += deltaTime;

      const spawnInterval =
        Number(this.chapter.spawnInterval) || 2.2;

      if (
        this.spawnTimer >= spawnInterval
      ) {
        this.spawnObstacle();

        this.spawnTimer -= spawnInterval;
      }
    }

    // Move obstacles toward the player
    for (const obstacle of this.obstacles) {
      if (obstacle.hit) continue;

      obstacle.z -=
        deltaTime * effectiveSpeed * 0.65;
    }

    // ------------------------------------
    // Collision detection
    // ------------------------------------

    const hit = this.collision.check(
      this.movement,
      this.obstacles,
      this.totalTime
    );

    if (hit) {
      this.movement.stumble();

      // Mark the closest obstacle to avoid
      // repeated collision with the same object.
      let nearest = null;
      let nearestDistance = Infinity;

      for (const obstacle of this.obstacles) {
        if (obstacle.hit) continue;

        const distance = Math.abs(obstacle.z);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = obstacle;
        }
      }

      if (nearest) {
        nearest.hit = true;
      }

      this.hud.showMessage(
        "YOU STUMBLED. THE ROAD CONTINUES."
      );
    }

    // Remove obstacles that have passed the player
    this.obstacles = this.obstacles.filter(
      (obstacle) =>
        obstacle.z > 0 &&
        !obstacle.hit
    );

    // Update HUD
    this.hud.updateStatus({
      distance: this.movement.distance,
      mistakes: this.collision.totalMistakes,
      state: this.state
    });

    // Dialogue auto progression
    if (
      isDialogue &&
      this.state === "dialogue"
    ) {
      this.dialogueTimer += deltaTime;

      if (this.dialogueTimer >= this.dialogueDelay) {
        this.advanceDialogue();
      }
    }
  }

  // ----------------------------------------
  // OBSTACLE SPAWNING
  // ----------------------------------------

  spawnObstacle() {
    const defaultTypes = [
      "luggage",
      "pencil",
      "gate"
    ];

    const types =
      this.chapter.obstacleTypes?.length
        ? this.chapter.obstacleTypes
        : defaultTypes;

    const type = types[
      Math.floor(Math.random() * types.length)
    ];

    // Three lanes: left, center, right
    const lane = Math.floor(Math.random() * 3);

    this.obstacles.push({
      id: ++this.obstacleId,
      type,
      lane,
      z: 1,
      hit: false,

      jumpable: ![
        "broken-road",
        "island"
      ].includes(type)
    });
  }

  // ----------------------------------------
  // RESIZE
  // ----------------------------------------

  resize() {
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }

  // ----------------------------------------
  // BACKGROUND
  // ----------------------------------------

  drawBackground(ctx, width, height) {
    const colors = this.chapter.colors;

    const horizon = height * 0.42;

    const gradient = ctx.createLinearGradient(
      0,
      0,
      0,
      height
    );

    gradient.addColorStop(
      0,
      colors.skyTop
    );

    gradient.addColorStop(
      1,
      colors.skyBottom
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Background architecture
    ctx.fillStyle = colors.building;
    ctx.globalAlpha = 0.45;

    for (let i = 0; i < 12; i++) {
      const x = (i / 11) * width;

      const buildingHeight =
        height * (0.08 + ((i * 17) % 13) / 100);

      ctx.fillRect(
        x,
        horizon - buildingHeight,
        width / 14,
        buildingHeight
      );
    }

    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = colors.road;

    ctx.fillRect(
      0,
      horizon,
      width,
      height - horizon
    );

    return horizon;
  }

  // ----------------------------------------
  // ROAD
  // ----------------------------------------

  drawRoad(ctx, width, height, horizon) {
    const center = width / 2;

    const topWidth = width * 0.10;
    const bottomWidth = width * 0.49;

    ctx.fillStyle = this.chapter.colors.road;

    ctx.beginPath();

    ctx.moveTo(center - topWidth, horizon);
    ctx.lineTo(center + topWidth, horizon);
    ctx.lineTo(center + bottomWidth, height);
    ctx.lineTo(center - bottomWidth, height);

    ctx.closePath();
    ctx.fill();

    // Road edges
    ctx.strokeStyle = this.chapter.colors.roadLine;
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(center - topWidth, horizon);
    ctx.lineTo(center - bottomWidth, height);

    ctx.moveTo(center + topWidth, horizon);
    ctx.lineTo(center + bottomWidth, height);

    ctx.stroke();

    // Three-lane separators
    for (let lane = 1; lane <= 2; lane++) {
      const t = lane / 3;

      ctx.strokeStyle = this.chapter.colors.roadLine;
      ctx.lineWidth = 2;

      ctx.setLineDash([14, 15]);

      ctx.beginPath();

      ctx.moveTo(
        center - topWidth + topWidth * 2 * t,
        horizon
      );

      ctx.lineTo(
        center - bottomWidth + bottomWidth * 2 * t,
        height
      );

      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // ----------------------------------------
  // OBSTACLE RENDERING
  // ----------------------------------------

  drawObstacles(ctx, width, height, horizon) {
    const center = width / 2;

    const sorted = [...this.obstacles].sort(
      (a, b) => b.z - a.z
    );

    for (const obstacle of sorted) {
      const depth = 1 - obstacle.z;

      const perspective = depth * depth;

      const y = horizon + perspective * height * 0.82;

      const roadHalf = width * (
        0.10 + depth * 0.39
      );

      const laneWidth = roadHalf * 2 / 3;

      const x =
        center +
        (obstacle.lane - 1) * laneWidth;

      const size = 10 + perspective * 95;

      ctx.save();

      ctx.translate(x, y);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.24)";

      ctx.beginPath();

      ctx.ellipse(
        0,
        4,
        size * 0.65,
        size * 0.18,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = this.chapter.colors.accent;
      ctx.strokeStyle = "#382b27";
      ctx.lineWidth = Math.max(1, size * 0.035);

      if (obstacle.type === "pencil") {
        ctx.fillRect(
          -size * 0.12,
          -size,
          size * 0.24,
          size
        );

      } else if (obstacle.type === "gate") {
        ctx.fillRect(
          -size * 0.5,
          -size,
          size,
          size * 0.2
        );

      } else if (obstacle.type === "broken-road") {
        ctx.fillStyle = "#17141a";

        ctx.beginPath();

        ctx.moveTo(-size, 0);
        ctx.lineTo(-size * 0.6, -size);
        ctx.lineTo(size * 0.6, -size);
        ctx.lineTo(size, 0);

        ctx.closePath();
        ctx.fill();

      } else if (obstacle.type === "island") {
        ctx.fillStyle = "#8f9c91";

        ctx.beginPath();

        ctx.ellipse(
          0,
          -size * 0.2,
          size * 0.75,
          size * 0.3,
          0,
          0,
          Math.PI * 2
        );

        ctx.fill();

      } else {
        // Generic obstacle / luggage
        ctx.beginPath();

        ctx.roundRect(
          -size * 0.45,
          -size * 0.8,
          size * 0.9,
          size * 0.8,
          size * 0.08
        );

        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  render() {
    const ctx = this.ctx;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    // Save canvas state to prevent cumulative shaking
    ctx.save();

    if (this.movement.isStumbling) {
      const shake = Math.sin(
        this.totalTime * 45
      ) * 5;

      ctx.translate(shake, 0);
    }

    const horizon = this.drawBackground(
      ctx,
      width,
      height
    );

    this.drawRoad(
      ctx,
      width,
      height,
      horizon
    );

    this.drawObstacles(
      ctx,
      width,
      height,
      horizon
    );

    // First-person jump feedback
    if (this.movement.jumpHeight > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, 0, width, height);
    }

    if (
      this.state === "ending" ||
      this.state === "finished"
    ) {
      ctx.fillStyle = "rgba(12,20,29,0.28)";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  // ----------------------------------------
  // MAIN LOOP
  // ----------------------------------------

  loop(timestamp) {
    const deltaTime = Math.min(
      (timestamp - this.lastFrame) / 1000,
      0.05
    );

    this.lastFrame = timestamp;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(
      this.loop
    );
  }

  // ----------------------------------------
  // DESTROY
  // ----------------------------------------

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.input.destroy();

    window.removeEventListener(
      "resize",
      this.resize
    );

    window.removeEventListener(
      "keydown",
      this.keyboardHandler
    );
  }
}
