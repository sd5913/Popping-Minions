/**
 * MISSED THIS STOP
 * HandController.js
 * MediaPipe hand tracking and gesture controls.
 *
 * Controls:
 *   Move hand into left zone  -> LEFT lane
 *   Move hand into right zone -> RIGHT lane
 *   Open_Palm                            -> JUMP
 *   Closed_Fist                          -> INTERACT
 *
 * Important:
 * The camera preview is mirrored for a natural selfie view.
 * Game coordinates are mirrored independently, so visual left
 * always means game LEFT. MediaPipe's raw landmark coordinates
 * are never modified for drawing or gesture classification.
 */

import {
  FilesetResolver,
  GestureRecognizer
} from "@mediapipe/tasks-vision";

export class HandController {
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {});
    this.onStatus = options.onStatus || (() => {});

    this.modelAssetPath =
      options.modelAssetPath ||
      "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

    this.wasmPath =
      options.wasmPath ||
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";

    this.gestureConfidence = options.gestureConfidence ?? 0.60;
    this.stableFramesRequired = options.stableFramesRequired ?? 3;

    // Independent cooldowns: lane movement must not block jump or fist actions.
    this.laneCooldownMs = options.laneCooldownMs ?? 420;
    this.jumpCooldownMs = options.jumpCooldownMs ?? 650;
    this.interactCooldownMs = options.interactCooldownMs ?? 750;

    // Position-zone control is more reliable than a short-window swipe delta.
    this.leftEnterThreshold = options.leftEnterThreshold ?? 0.36;
    this.leftExitThreshold = options.leftExitThreshold ?? 0.45;
    this.rightEnterThreshold = options.rightEnterThreshold ?? 0.64;
    this.rightExitThreshold = options.rightExitThreshold ?? 0.55;
    this.zoneSmoothing = options.zoneSmoothing ?? 0.38;
    this.zoneStableFrames = options.zoneStableFrames ?? 3;

    // Kept for compatibility with existing project configuration.
    this.cooldownMs = options.cooldownMs ?? 500;
    this.swipeThreshold = options.swipeThreshold ?? 0.11;
    this.swipeWindowMs = options.swipeWindowMs ?? 350;
    this.swipeMinSamples = options.swipeMinSamples ?? 3;
    this.mirrorPreview = options.mirrorPreview !== false;
    this.mirrorControls = options.mirrorControls !== false;
    this.manageCameraButton = options.manageCameraButton === true;

    this.stream = null;
    this.video = options.videoElement || null;
    this.ownsVideo = !options.videoElement;
    this.recognizer = null;

    this.cameraButton =
      options.cameraButton ||
      (this.manageCameraButton
        ? document.querySelector("#camera-button")
        : null);

    this.statusElement =
      options.statusElement ||
      document.querySelector("#camera-status");

    this.previewPanel = null;
    this.previewCanvas = null;
    this.previewContext = null;
    this.debugElement = null;
    this.debugStatusElement = null;
    this.styleElement = null;

    this.isRunning = false;
    this.isStarting = false;
    this.destroyed = false;

    this.animationFrame = null;
    this.startToken = 0;
    this.lastVideoTime = -1;
    this.lastActionTime = -Infinity;
    this.lastLaneActionTime = -Infinity;
    this.lastJumpActionTime = -Infinity;
    this.lastInteractActionTime = -Infinity;

    this.handHistory = [];
    this.lastGesture = "None";
    this.candidateGesture = "None";
    this.candidateFrames = 0;

    this.lastDetectedGesture = "No hand";
    this.lastConfidence = 0;
    this.lastHandDetected = false;

    this.rawHandX = 0.5;
    this.controlHandX = 0.5;
    this.smoothedControlX = 0.5;
    this.handY = 0.5;
    this.currentZone = "NEUTRAL";
    this.candidateZone = "NEUTRAL";
    this.candidateZoneFrames = 0;

    // Lane movement is armed only after the hand returns to the centre.
    this.laneArmed = false;
    this.gestureArmed = true;
    this.armed = false; // Backward-compatible debug property.

    this.lastAction = "NONE";
    this.frameCount = 0;
    this.fps = 0;
    this.fpsStart = performance.now();

    this.boundToggle = () => this.toggle();

    if (this.cameraButton) {
      this.cameraButton.addEventListener("click", this.boundToggle);
    }

    this.setStatus("CAMERA OFF", "idle");
    console.log("[HandController] Initialized.");
  }

  get running() {
    return this.isRunning;
  }

  async toggle() {
    if (this.isRunning || this.isStarting) {
      this.stop();
    } else {
      await this.start();
    }
  }

  // =====================================
  // CAMERA START
  // =====================================

  async start() {
    if (this.isRunning || this.isStarting || this.destroyed) return;

    this.isStarting = true;
    const token = ++this.startToken;
    this.setStatus("REQUESTING CAMERA", "loading");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API unavailable. Use HTTPS or localhost.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 }
        }
      });

      if (token !== this.startToken || this.destroyed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      this.stream = stream;
      this.createPreview();

      if (!this.video) {
        throw new Error("Camera preview video element could not be created.");
      }

      this.video.srcObject = stream;
      this.video.muted = true;
      this.video.playsInline = true;
      await this.video.play();

      if (token !== this.startToken || this.destroyed) return;

      await this.waitForVideo(token);
      if (token !== this.startToken || this.destroyed) return;

      this.setStatus("LOADING AI MODEL", "loading");

      const vision = await FilesetResolver.forVisionTasks(this.wasmPath);
      if (token !== this.startToken || this.destroyed) return;

      let recognizer;

      try {
        recognizer = await this.createRecognizer(vision, "GPU");
      } catch (gpuError) {
        console.warn(
          "[HandController] GPU delegate unavailable; falling back to CPU.",
          gpuError
        );
        if (token !== this.startToken || this.destroyed) return;
        recognizer = await this.createRecognizer(vision, "CPU");
      }

      if (token !== this.startToken || this.destroyed) {
        recognizer.close();
        return;
      }

      this.recognizer = recognizer;
      this.resetTracking();

      this.isStarting = false;
      this.isRunning = true;

      this.previewPanel?.classList.add("visible");
      this.updateCameraButton(true);
      this.setStatus("CAMERA ACTIVE", "active");

      this.detectFrame();
      console.log("[HandController] Camera and MediaPipe ready.");
    } catch (error) {
      if (token !== this.startToken || this.destroyed) return;

      console.error("[HandController] Initialization failed:", error);

      this.isRunning = false;
      this.isStarting = false;

      this.closeRecognizer();
      this.releaseCamera();
      this.updateCameraButton(false);
      this.previewPanel?.classList.remove("visible");

      this.setStatus(this.getErrorMessage(error), "error");
    } finally {
      if (token === this.startToken) {
        this.isStarting = false;
      }
    }
  }

  waitForVideo(token) {
    return new Promise((resolve, reject) => {
      if (
        this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        this.video.videoWidth > 0
      ) {
        resolve();
        return;
      }

      let settled = false;

      const cleanup = () => {
        clearTimeout(timeout);
        this.video.removeEventListener("loadeddata", check);
        this.video.removeEventListener("playing", check);
      };

      const finish = (error = null) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve();
      };

      const check = () => {
        if (token !== this.startToken || this.destroyed) {
          finish(new Error("Camera startup was cancelled."));
          return;
        }

        if (
          this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          this.video.videoWidth > 0
        ) {
          finish();
        }
      };

      const timeout = setTimeout(() => {
        finish(new Error("Camera video did not become ready."));
      }, 10000);

      this.video.addEventListener("loadeddata", check);
      this.video.addEventListener("playing", check);
      check();
    });
  }

  async createRecognizer(vision, delegate) {
    return GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: this.modelAssetPath,
        delegate
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      cannedGesturesClassifierOptions: {
        scoreThreshold: this.gestureConfidence
      }
    });
  }

  // =====================================
  // PREVIEW UI
  // =====================================

  createPreview() {
    if (this.previewPanel) {
      this.previewPanel.classList.add("visible");
      return;
    }

    this.injectPreviewStyles();

    const panel = document.createElement("section");
    panel.id = "hand-debug-panel";

    const header = document.createElement("div");
    header.className = "hand-debug-header";

    const title = document.createElement("strong");
    title.textContent = "AI HAND TRACKING";

    this.debugStatusElement = document.createElement("span");
    this.debugStatusElement.id = "hand-debug-status";
    this.debugStatusElement.textContent = "INITIALIZING";

    header.append(title, this.debugStatusElement);

    const videoBox = document.createElement("div");
    videoBox.className = "hand-video-box";

    if (!this.video) {
      this.video = document.createElement("video");
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute("playsinline", "");
      this.video.setAttribute("autoplay", "");
      this.video.setAttribute("muted", "");
    }

    this.video.classList.add("hand-camera-video");
    this.video.style.transform = this.mirrorPreview ? "scaleX(-1)" : "none";

    this.previewCanvas = document.createElement("canvas");
    this.previewCanvas.className = "hand-landmark-canvas";
    this.previewCanvas.style.transform =
      this.mirrorPreview ? "scaleX(-1)" : "none";
    this.previewContext = this.previewCanvas.getContext("2d");

    videoBox.append(this.video, this.previewCanvas);

    this.debugElement = document.createElement("pre");
    this.debugElement.className = "hand-debug-info";
    this.debugElement.textContent = "Waiting for hand...";

    panel.append(header, videoBox, this.debugElement);
    document.body.appendChild(panel);

    this.previewPanel = panel;
    panel.classList.add("visible");
  }

  injectPreviewStyles() {
    if (document.querySelector("#hand-debug-styles")) return;

    const style = document.createElement("style");
    style.id = "hand-debug-styles";
    style.textContent = `
      #hand-debug-panel {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 300px;
        z-index: 99999;
        box-sizing: border-box;
        padding: 12px;
        background: rgba(12, 20, 30, .95);
        border: 1px solid rgba(230, 190, 130, .7);
        border-radius: 10px;
        color: #fff;
        font: 12px/1.55 Arial, sans-serif;
        box-shadow: 0 8px 30px rgba(0,0,0,.35);
        display: none;
      }
      #hand-debug-panel.visible { display: block; }
      .hand-debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #e8c18d;
        font-size: 11px;
        letter-spacing: 1px;
      }
      #hand-debug-status { color: #8de0a0; }
      .hand-video-box {
        position: relative;
        width: 100%;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: #111923;
        border-radius: 5px;
      }
      .hand-camera-video, .hand-landmark-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .hand-landmark-canvas { pointer-events: none; }
      .hand-debug-info {
        margin: 8px 0 0;
        padding: 0;
        color: #d6e0e8;
        white-space: pre-wrap;
        font: 11px/1.7 Arial, sans-serif;
      }
      @media (max-width: 600px) {
        #hand-debug-panel { width: 190px; right: 8px; bottom: 8px; }
      }
    `;
    document.head.appendChild(style);
    this.styleElement = style;
  }

  // =====================================
  // FRAME LOOP
  // =====================================

  detectFrame() {
    if (!this.isRunning || !this.recognizer || this.destroyed) return;

    if (
      this.video &&
      this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      this.video.currentTime !== this.lastVideoTime
    ) {
      try {
        const now = performance.now();
        const result = this.recognizer.recognizeForVideo(this.video, now);
        this.lastVideoTime = this.video.currentTime;
        this.processResult(result, now);
        this.updateFPS(now);
      } catch (error) {
        console.error("[HandController] Recognition error:", error);
      }
    }

    if (this.isRunning && !this.destroyed) {
      this.animationFrame = requestAnimationFrame(() => this.detectFrame());
    }
  }

  updateFPS(now) {
    this.frameCount += 1;
    if (now - this.fpsStart >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsStart = now;
    }
  }

  // =====================================
  // RESULTS / COORDINATE MAPPING
  // =====================================

  processResult(result, now) {
    const landmarks = result.landmarks?.[0];
    const gesture = result.gestures?.[0]?.[0];

    if (!landmarks || landmarks.length < 21) {
      this.lastHandDetected = false;
      this.lastDetectedGesture = "No hand";
      this.lastConfidence = 0;
      this.handHistory = [];
      this.currentZone = "NEUTRAL";
      this.candidateZone = "NEUTRAL";
      this.candidateZoneFrames = 0;
      this.laneArmed = true;
      this.armed = true;
      this.updateStableGesture("None", now);
      this.clearLandmarks();
      this.updateDebugInfo();
      return;
    }

    this.lastHandDetected = true;
    this.lastDetectedGesture = gesture?.categoryName || "Unknown";
    this.lastConfidence = gesture?.score || 0;

    // Landmark 9 is the palm centre and is steadier than the wrist.
    this.rawHandX = landmarks[9].x;
    this.handY = landmarks[9].y;

    // The preview is mirrored with CSS. Mirror only the control coordinate
    // so the player's own left/right matches the mirrored preview.
    this.controlHandX = this.mirrorControls
      ? 1 - this.rawHandX
      : this.rawHandX;

    // Smooth small landmark jitter without making movement feel sluggish.
    this.smoothedControlX +=
      (this.controlHandX - this.smoothedControlX) * this.zoneSmoothing;

    this.drawLandmarks(landmarks);

    // A closed fist is reserved for INTERACT / chapter transitions.
    // Open palm can still move laterally and triggers JUMP only on entry.
    if (this.lastDetectedGesture !== "Closed_Fist") {
      this.detectLaneZone(this.smoothedControlX, now);
    } else {
      this.candidateZone = "NEUTRAL";
      this.candidateZoneFrames = 0;
    }

    if (this.lastConfidence >= this.gestureConfidence) {
      this.updateStableGesture(this.lastDetectedGesture, now);
    } else {
      this.updateStableGesture("None", now);
    }

    this.updateDebugInfo();
  }

  // =====================================
  // LANDMARK DRAWING
  // =====================================

  drawLandmarks(landmarks) {
    if (!this.previewCanvas || !this.previewContext || !this.video) return;

    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (!width || !height) return;

    if (
      this.previewCanvas.width !== width ||
      this.previewCanvas.height !== height
    ) {
      this.previewCanvas.width = width;
      this.previewCanvas.height = height;
    }

    const ctx = this.previewContext;
    ctx.clearRect(0, 0, width, height);

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17]
    ];

    ctx.strokeStyle = "#72f0c0";
    ctx.lineWidth = Math.max(2, width / 320);

    for (const [a, b] of connections) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
      ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
      ctx.stroke();
    }

    landmarks.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(
        point.x * width,
        point.y * height,
        index === 0 ? 5 : 3,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = index === 0 ? "#ffbd69" : "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#183b35";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  clearLandmarks() {
    if (!this.previewContext || !this.previewCanvas) return;
    this.previewContext.clearRect(
      0,
      0,
      this.previewCanvas.width,
      this.previewCanvas.height
    );
  }

  // =====================================
  // LANE ZONE DETECTION
  // =====================================

  detectLaneZone(controlX, now) {
    let zone = "NEUTRAL";

    // Hysteresis prevents the zone flickering at the left/right boundaries.
    if (this.currentZone === "LEFT" && controlX < this.leftExitThreshold) {
      zone = "LEFT";
    } else if (
      this.currentZone === "RIGHT" &&
      controlX > this.rightExitThreshold
    ) {
      zone = "RIGHT";
    } else if (controlX <= this.leftEnterThreshold) {
      zone = "LEFT";
    } else if (controlX >= this.rightEnterThreshold) {
      zone = "RIGHT";
    } else if (controlX >= 0.44 && controlX <= 0.56) {
      zone = "NEUTRAL";
    } else {
      // In the hysteresis gap, retain the previous zone until the hand
      // clearly returns to centre or enters the opposite side.
      zone = this.currentZone;
    }

    if (zone === this.candidateZone) {
      this.candidateZoneFrames += 1;
    } else {
      this.candidateZone = zone;
      this.candidateZoneFrames = 1;
    }

    if (this.candidateZoneFrames < this.zoneStableFrames) return;

    // Returning to the centre re-arms the next lateral movement.
    if (zone === "NEUTRAL") {
      this.currentZone = "NEUTRAL";
      this.laneArmed = true;
      this.armed = true;
      return;
    }

    if (zone === this.currentZone) return;
    this.currentZone = zone;

    if (!this.laneArmed) return;
    if (now - this.lastLaneActionTime < this.laneCooldownMs) return;

    const action = zone === "LEFT" ? "LEFT" : "RIGHT";
    this.lastLaneActionTime = now;
    this.lastActionTime = now;
    this.laneArmed = false;
    this.armed = false;

    this.emitAction(action, {
      source: "hand",
      gesture: zone === "LEFT" ? "MOVE_LEFT_ZONE" : "MOVE_RIGHT_ZONE",
      confidence: this.lastConfidence,
      rawHandX: this.rawHandX,
      controlHandX: this.controlHandX,
      smoothedControlX: this.smoothedControlX,
      zone,
      armed: this.laneArmed
    });
  }

  // =====================================
  // STATIC GESTURES
  // =====================================

  updateStableGesture(gestureName, now) {
    if (gestureName === this.candidateGesture) {
      this.candidateFrames += 1;
    } else {
      this.candidateGesture = gestureName;
      this.candidateFrames = 1;
    }

    if (this.candidateFrames < this.stableFramesRequired) return;
    if (this.lastGesture === gestureName) return;

    const previousGesture = this.lastGesture;
    this.lastGesture = gestureName;

    if (gestureName === "None") {
      this.gestureArmed = true;
      return;
    }

    if (!this.gestureArmed) return;

    // Open palm -> JUMP. Separate cooldown from lane movement.
    if (gestureName === "Open_Palm" && previousGesture !== "Open_Palm") {
      this.gestureArmed = false;
      if (now - this.lastJumpActionTime < this.jumpCooldownMs) return;
      this.lastJumpActionTime = now;
      this.lastActionTime = now;
      this.emitAction("JUMP", {
        source: "hand",
        gesture: "OPEN_PALM",
        confidence: this.lastConfidence
      });
      return;
    }

    // Closed fist -> INTERACT. Preserves dialogue and chapter transitions.
    if (gestureName === "Closed_Fist" && previousGesture !== "Closed_Fist") {
      this.gestureArmed = false;
      if (now - this.lastInteractActionTime < this.interactCooldownMs) return;
      this.lastInteractActionTime = now;
      this.lastActionTime = now;
      this.emitAction("INTERACT", {
        source: "hand",
        gesture: "CLOSED_FIST",
        confidence: this.lastConfidence
      });
    }
  }

  emitAction(action, payload = {}) {
    if (!this.isRunning || this.destroyed) return;

    this.lastAction = action;
    console.log(`[HandController] ACTION: ${action}`, payload);
    this.updateDebugInfo();
    this.onAction(action, payload);
  }

  // =====================================
  // DEBUG / STATUS
  // =====================================

  updateDebugInfo() {
    if (this.debugElement) {
      this.debugElement.textContent =
        `Status: ${this.lastHandDetected ? "HAND DETECTED" : "NO HAND"}\n` +
        `Gesture: ${this.lastDetectedGesture}\n` +
        `Confidence: ${(this.lastConfidence * 100).toFixed(1)}%\n` +
        `Raw X: ${this.rawHandX.toFixed(3)}\n` +
        `Control X: ${this.controlHandX.toFixed(3)}\n` +
        `Current Zone: ${this.currentZone}\n` +
        `Armed: ${this.laneArmed ? "YES" : "NO"}\n` +
        `Gesture Armed: ${this.gestureArmed ? "YES" : "NO"}\n` +
        `FPS: ${this.fps}\n` +
        `Last Action: ${this.lastAction}`;
    }

    if (this.debugStatusElement) {
      this.debugStatusElement.textContent = this.lastHandDetected
        ? "TRACKING"
        : "SEARCHING";
    }
  }

  setStatus(message, state = "idle") {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.classList.remove(
        "camera-active",
        "camera-error",
        "camera-loading"
      );

      if (state === "active") {
        this.statusElement.classList.add("camera-active");
      } else if (state === "error") {
        this.statusElement.classList.add("camera-error");
      } else if (state === "loading") {
        this.statusElement.classList.add("camera-loading");
      }
    }

    this.onStatus(message, state);
  }

  updateCameraButton(enabled) {
    if (!this.cameraButton) return;
    this.cameraButton.textContent = enabled ? "STOP CAMERA" : "ENABLE CAMERA";
    this.cameraButton.classList.toggle("camera-enabled", enabled);
  }

  getErrorMessage(error) {
    const name = error?.name;

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "CAMERA PERMISSION DENIED";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "NO CAMERA FOUND";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return "CAMERA IS IN USE";
    }
    if (name === "OverconstrainedError") {
      return "CAMERA SETTINGS UNSUPPORTED";
    }
    if (error?.message?.includes("Camera API unavailable")) {
      return "USE HTTPS OR LOCALHOST";
    }
    return error?.message || "CAMERA INITIALIZATION FAILED";
  }

  // =====================================
  // RESET / RELEASE / STOP
  // =====================================

  resetTracking() {
    this.lastVideoTime = -1;
    this.lastActionTime = -Infinity;
    this.lastLaneActionTime = -Infinity;
    this.lastJumpActionTime = -Infinity;
    this.lastInteractActionTime = -Infinity;
    this.handHistory = [];

    this.lastGesture = "None";
    this.candidateGesture = "None";
    this.candidateFrames = 0;

    this.lastDetectedGesture = "No hand";
    this.lastConfidence = 0;
    this.lastHandDetected = false;

    this.rawHandX = 0.5;
    this.controlHandX = 0.5;
    this.smoothedControlX = 0.5;
    this.handY = 0.5;
    this.currentZone = "NEUTRAL";
    this.candidateZone = "NEUTRAL";
    this.candidateZoneFrames = 0;
    this.laneArmed = false;
    this.gestureArmed = true;
    this.armed = false;

    this.lastAction = "NONE";
    this.frameCount = 0;
    this.fps = 0;
    this.fpsStart = performance.now();

    this.clearLandmarks();
    this.updateDebugInfo();
  }

  closeRecognizer() {
    if (!this.recognizer) return;
    try {
      this.recognizer.close();
    } catch (error) {
      console.warn("[MediaPipe] Cleanup warning:", error);
    }
    this.recognizer = null;
  }

  releaseCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      try {
        this.video.pause();
        this.video.srcObject = null;
      } catch (error) {
        console.warn("[Camera] Video cleanup warning:", error);
      }
    }
  }

  stop() {
    // Invalidates any pending getUserMedia/model-loading continuation.
    this.startToken += 1;
    this.isRunning = false;
    this.isStarting = false;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.closeRecognizer();
    this.releaseCamera();
    this.resetTracking();

    this.previewPanel?.classList.remove("visible");
    this.updateCameraButton(false);
    this.setStatus("CAMERA OFF", "idle");
    console.log("[HandController] Camera stopped.");
  }

  destroy() {
    if (this.destroyed) return;

    this.stop();
    this.destroyed = true;

    if (this.cameraButton) {
      this.cameraButton.removeEventListener("click", this.boundToggle);
    }

    if (this.previewPanel) {
      this.previewPanel.remove();
      this.previewPanel = null;
    }

    if (this.video && this.ownsVideo) {
      this.video.remove();
    }

    // The injected style is shared by the page; leave it in place.
    this.video = null;
    this.previewCanvas = null;
    this.previewContext = null;
    this.debugElement = null;
    this.debugStatusElement = null;
  }
}
