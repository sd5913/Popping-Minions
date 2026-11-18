import { SceneManager } from "./SceneManager.js";
import { InputManager } from "../controls/InputManager.js";
import { HandController } from "../controls/HandController.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { CollisionSystem } from "../systems/CollisionSystem.js";
import { FirstPersonRenderer } from "../rendering/FirstPersonRenderer.js";
import { HUD } from "../ui/HUD.js";

export class Game {
  constructor(canvas) {
    if (!canvas) throw new Error("Game canvas was not found.");

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas 2D context unavailable.");

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
    this.destroyed = false;

    this.lastInputAction = "NONE";
    this.lastInputSource = "NONE";
    this.lastInputTime = 0;
    this.lastHandAction = "NONE";
    this.lastHandPayload = null;

    this.cameraStatus = "OFFLINE";
    this.cameraError = null;
    this.cameraStartPromise = null;
    this.cameraStopPromise = null;

    this.cameraStartButton = null;
    this.cameraStopButton = null;
    this.cameraStatusElement = null;
    this.cameraButtonListeners = [];

    // HandController owns recognition. Game owns the camera buttons.
    // This avoids registering two click handlers on the same button.
    this.handController = new HandController({
      manageCameraButton: false,
      mirrorPreview: true,
      mirrorControls: true,
      onAction: (action, payload = {}) => {
        if (this.destroyed) return;
        const normalizedAction = String(action || "").trim().toUpperCase();
        this.lastHandAction = normalizedAction || "NONE";
        this.lastHandPayload = payload;
        console.log("[Game] HandController -> Game:", normalizedAction, payload);
        this.handleAction(normalizedAction, "hand", payload);
      },
      onStatus: (message, state) => {
        this.handleCameraStatus(message, state);
      }
    });

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.keyboardHandler = this.handleKeyboard.bind(this);

    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.keyboardHandler);

    this.resize();
    this.bindEvents();
    this.bindCameraControls();
  }

  get chapter() {
    return this.sceneManager.current;
  }

  // =====================================
  // EVENT CONNECTIONS
  // =====================================

  bindEvents() {
    this.input.onAction((action, payload = {}) => {
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

  // =====================================
  // CAMERA BUTTONS
  // =====================================

  bindCameraControls() {
    const buttons = Array.from(document.querySelectorAll("button"));
    const normalize = (value) =>
      String(value || "").trim().toUpperCase().replace(/\s+/g, " ");

    this.cameraStartButton =
      document.querySelector(
        "#camera-button, #enable-camera, #start-camera, [data-camera-start]"
      ) ||
      buttons.find((button) => {
        const label = normalize(button.textContent);
        return (
          label.includes("ENABLE CAMERA") ||
          label.includes("START CAMERA") ||
          label.includes("CAMERA ACTIVE") ||
          label.includes("RETRY CAMERA")
        );
      }) ||
      null;

    this.cameraStopButton =
      document.querySelector("#stop-camera, [data-camera-stop]") ||
      buttons.find((button) =>
        normalize(button.textContent).includes("STOP CAMERA")
      ) ||
      null;

    // If the page has only one camera button, make it a start/stop toggle.
    if (this.cameraStartButton && !this.cameraStopButton) {
      this.cameraStopButton = this.cameraStartButton;
    }

    this.cameraStatusElement = document.querySelector(
      "#camera-status, .camera-status, [data-camera-status]"
    );

    // A single button toggles start/stop. Separate buttons remain supported.
    if (
      this.cameraStartButton &&
      this.cameraStartButton === this.cameraStopButton
    ) {
      const handler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.handController?.isRunning) {
          this.stopCamera();
        } else {
          this.startCamera();
        }
      };
      this.cameraStartButton.addEventListener("click", handler);
      this.cameraButtonListeners.push({
        element: this.cameraStartButton,
        handler
      });
    } else {
      if (this.cameraStartButton) {
        const handler = (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.startCamera();
        };
        this.cameraStartButton.addEventListener("click", handler);
        this.cameraButtonListeners.push({
          element: this.cameraStartButton,
          handler
        });
      }

      if (this.cameraStopButton) {
        const handler = (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.stopCamera();
        };
        this.cameraStopButton.addEventListener("click", handler);
        this.cameraButtonListeners.push({
          element: this.cameraStopButton,
          handler
        });
      }
    }

    this.updateCameraUI();
  }

  async startCamera() {
    if (this.destroyed || !this.handController) return false;

    if (this.handController.isRunning) {
      this.setCameraStatus("ACTIVE");
      return true;
    }

    if (this.cameraStartPromise) return this.cameraStartPromise;

    this.cameraError = null;
    this.setCameraStatus("STARTING");

    this.cameraStartPromise = (async () => {
      try {
        await this.handController.start();

        if (this.destroyed) return false;

        if (!this.handController.isRunning) {
          throw new Error("Hand tracking did not enter the running state.");
        }

        this.cameraError = null;
        this.setCameraStatus("ACTIVE");
        return true;
      } catch (error) {
        if (!this.destroyed) {
          this.cameraError = error?.message || String(error);
          this.setCameraStatus("ERROR");
        }
        console.error("[Camera] Start failed:", error);
        return false;
      } finally {
        this.cameraStartPromise = null;
      }
    })();

    return this.cameraStartPromise;
  }

  async stopCamera() {
    if (!this.handController) return false;
    if (this.cameraStopPromise) return this.cameraStopPromise;

    this.setCameraStatus("STOPPING");

    this.cameraStopPromise = (async () => {
      try {
        // If startup is still pending, stop() invalidates its token and
        // releases any stream that arrives later.
        this.handController.stop();
        this.cameraError = null;
        this.setCameraStatus("OFFLINE");
        return true;
      } catch (error) {
        this.cameraError = error?.message || String(error);
        this.setCameraStatus("ERROR");
        console.error("[Camera] Stop failed:", error);
        return false;
      } finally {
        this.cameraStopPromise = null;
      }
    })();

    return this.cameraStopPromise;
  }

  handleCameraStatus(message, state) {
    const value = `${message || ""} ${state || ""}`.toLowerCase();

    if (
      value.includes("active") ||
      value.includes("running") ||
      value.includes("ready")
    ) {
      this.setCameraStatus("ACTIVE");
    } else if (value.includes("error") || value.includes("failed")) {
      this.cameraError = String(message || "Camera error");
      this.setCameraStatus("ERROR");
    } else if (value.includes("requesting") || value.includes("loading")) {
      this.setCameraStatus("STARTING");
    } else if (
      value.includes("camera off") ||
      value.includes("stopped") ||
      value.includes("idle")
    ) {
      this.setCameraStatus("OFFLINE");
    }
  }

  setCameraStatus(status) {
    this.cameraStatus = status;
    this.updateCameraUI();
  }

  updateCameraUI() {
    const active = this.cameraStatus === "ACTIVE";
    const busy =
      this.cameraStatus === "STARTING" ||
      this.cameraStatus === "STOPPING";

    if (this.cameraStartButton) {
      const isSingleToggle =
        this.cameraStartButton === this.cameraStopButton;

      this.cameraStartButton.disabled = busy;
      if (isSingleToggle) {
        this.cameraStartButton.textContent = active
          ? "STOP CAMERA"
          : this.cameraStatus === "STARTING"
            ? "LOADING CAMERA..."
            : this.cameraStatus === "ERROR"
              ? "RETRY CAMERA"
              : "ENABLE CAMERA";
      } else {
        this.cameraStartButton.disabled = active || busy;
        this.cameraStartButton.textContent = active
          ? "CAMERA ACTIVE"
          : this.cameraStatus === "STARTING"
            ? "LOADING CAMERA..."
            : this.cameraStatus === "ERROR"
              ? "RETRY CAMERA"
              : "ENABLE CAMERA";
      }
    }

    if (
      this.cameraStopButton &&
      this.cameraStopButton !== this.cameraStartButton
    ) {
      this.cameraStopButton.disabled = !active || busy;
      this.cameraStopButton.textContent =
        this.cameraStatus === "STOPPING" ? "STOPPING..." : "STOP CAMERA";
    }

    if (this.cameraStatusElement) {
      this.cameraStatusElement.textContent = this.cameraError
        ? `${this.cameraStatus}: ${this.cameraError}`
        : this.cameraStatus;
    }
  }

  // =====================================
  // KEYBOARD / PAUSE
  // =====================================

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

  // =====================================
  // UNIFIED INPUT
  // =====================================

  handleAction(action, source = "input", payload = {}) {
    if (this.destroyed) return;

    action = String(action || "").trim().toUpperCase();
    if (!action) return;

    this.lastInputAction = action;
    this.lastInputSource = source;
    this.lastInputTime = performance.now();

    console.log(`[Game Input] ${source}: ${action}`, payload);

    if (this.state === "title") {
      if (action === "INTERACT") this.startGame();
      return;
    }

    if (this.state === "paused") {
      if (action === "INTERACT") this.togglePause();
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

    // Keep closed-fist INTERACT: it advances the chapter transition.
    if (this.state === "transition") {
      if (action === "INTERACT" || action === "FORWARD") {
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
      case "LEFT": {
        const previousLane = this.movement.lane;
        this.movement.moveLeft();
        console.log(
          `[Game] LEFT from ${source}: lane ${previousLane} -> ${this.movement.lane}`
        );
        break;
      }
      case "RIGHT": {
        const previousLane = this.movement.lane;
        this.movement.moveRight();
        console.log(
          `[Game] RIGHT from ${source}: lane ${previousLane} -> ${this.movement.lane}`
        );
        break;
      }
      case "JUMP":
        this.movement.jump();
        break;
      case "INTERACT":
        if (
          this.chapter?.dialogue &&
          !this.sceneManager.hasPlayedDialogue()
        ) {
          this.triggerDialogue();
        }
        break;
      case "FORWARD":
      default:
        break;
    }
  }

  // =====================================
  // GAME START / RESET
  // =====================================

  start() {
    if (this.animationId !== null || this.destroyed) return;
    this.hud.showTitle();
    this.lastFrame = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  startGame() {
    if (this.destroyed) return;

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

  // =====================================
  // DIALOGUE
  // =====================================

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
    if (!this.chapter.dialogue) return;
    if (this.sceneManager.hasPlayedDialogue()) return;

    this.state = "dialogue";
    this.dialogueIndex = 0;
    this.showCurrentDialogue();
  }

  // =====================================
  // CHAPTER TRANSITION
  // =====================================

  nextChapter() {
    if (this.state !== "transition") return;

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

  // =====================================
  // WORLD SPEED / UPDATE
  // =====================================

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

    const hit = this.collision.check(
      this.movement,
      this.obstacles,
      this.totalTime
    );

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
      if (this.dialogueTimer >= this.dialogueDelay) {
        this.advanceDialogue();
      }
    }
  }

  // =====================================
  // OBSTACLES
  // =====================================

  seedObstacles() {
    if (!this.chapter.obstacleTypes?.length) return;
    [30, 52, 75, 98].forEach((distance) => {
      this.spawnObstacle(distance);
    });
  }

  spawnObstacle(distance = 94) {
    const types = this.chapter.obstacleTypes;
    if (!types?.length) return;

    const type = types[Math.floor(Math.random() * types.length)];
    let lane = Math.floor(Math.random() * 3);

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

  // =====================================
  // RENDER
  // =====================================

  resize() {
    if (!this.canvas || !this.ctx) return;

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
    if (!this.ctx) return;

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
    if (this.destroyed) return;

    const deltaTime = Math.min((timestamp - this.lastFrame) / 1000, 0.05);
    this.lastFrame = timestamp;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  }

  // =====================================
  // DEBUG
  // =====================================

  getDebugState() {
    const hand = this.handController;

    return {
      state: this.state,
      chapter: this.chapter?.id || null,
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
      mistakes: this.collision.totalMistakes,

      cameraStatus: this.cameraStatus,
      cameraRunning: Boolean(hand?.isRunning),
      cameraStarting: Boolean(hand?.isStarting),
      cameraError: this.cameraError,

      handDetected: Boolean(hand?.lastHandDetected),
      currentGesture: hand?.lastDetectedGesture || "None",
      gestureConfidence: hand?.lastConfidence || 0,
      handRawX: hand?.rawHandX ?? null,
      handControlX: hand?.controlHandX ?? null,
      handSmoothedX: hand?.smoothedControlX ?? null,
      handZone: hand?.currentZone || "NEUTRAL",
      handArmed: Boolean(hand?.laneArmed),
      gestureArmed: Boolean(hand?.gestureArmed),
      lastHandAction: this.lastHandAction,
      lastHandPayload: this.lastHandPayload,

      lastInputAction: this.lastInputAction,
      lastInputSource: this.lastInputSource,
      lastInputTime: this.lastInputTime
    };
  }

  // =====================================
  // CLEANUP
  // =====================================

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    for (const { element, handler } of this.cameraButtonListeners) {
      element.removeEventListener("click", handler);
    }
    this.cameraButtonListeners = [];

    if (this.handController) {
      this.handController.destroy();
      this.handController = null;
    }

    if (this.input && typeof this.input.destroy === "function") {
      this.input.destroy();
    }

    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.keyboardHandler);
  }
}
