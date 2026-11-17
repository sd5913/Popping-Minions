
import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs";

// ==========================================
// Gesture Control V1.1
// Camera calibration, gesture stability,
// and automatic pause on hand loss
// ==========================================

// 1. DOM
const video = document.querySelector("#camera-video");
const status = document.querySelector("#camera-status");
const gestureStatus = document.querySelector("#gesture-status");
const placeholder = document.querySelector("#camera-placeholder");

const startButton = document.querySelector("#camera-start");
const stopButton = document.querySelector("#camera-stop");

const overlay = document.querySelector("#hand-overlay");
const ctx = overlay?.getContext("2d");

// 2. MediaPipe
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// 3. Configuration
const CONFIG = {
  // Calibration
  calibrationDuration: 1200,
  calibrationTolerance: 0.045,
  calibrationCenterTolerance: 0.18,

  // Lane control
  laneThreshold: 0.105,
  laneReleaseThreshold: 0.055,
  laneStableFrames: 4,
  laneCooldown: 450,

  // Jump
  jumpDistance: 0.065,
  jumpWindow: 260,
  jumpCooldown: 850,
  jumpRearmDistance: 0.065,
  jumpStableFrames: 2,

  // Tracking
  smoothing: 0.32,
  handLossTimeout: 1000,
  recoveryStableFrames: 8,

  // Camera
  maxDetectionErrors: 5
};

// 4. Runtime
let cameraStream = null;
let handLandmarker = null;
let animationId = null;

let running = false;
let initializing = false;
let sessionId = 0;

let calibrated = false;
let calibrationStart = null;
let calibrationOrigin = null;

let neutralX = 0.5;
let neutralY = 0.5;

let smoothX = null;
let smoothY = null;

let lastHandSeen = 0;
let handMissing = false;
let recoveryFrames = 0;

let laneCandidate = "center";
let laneCandidateFrames = 0;
let laneArmed = true;
let lastLaneAction = 0;

let jumpArmed = true;
let jumpTriggerY = null;
let lastJumpAction = 0;
let jumpStableFrames = 0;

let wristHistory = [];

let lastVideoTime = -1;
let lastDetectionTimestamp = 0;
let detectionErrors = 0;

let lastMessage = "";

// ==========================================
// 5. Game API
// ==========================================

function getGame() {
  return window.ruinsRunControls || null;
}

function gamePaused() {
  return getGame()?.isPaused?.() ?? false;
}

function gameFinished() {
  return getGame()?.isFinished?.() ?? false;
}

function pauseGameForHandLoss() {
  const game = getGame();

  if (!game || gameFinished()) return;

  game.pauseForHandLoss?.();
}

function canControlGame() {
  return (
    running &&
    calibrated &&
    !handMissing &&
    !gamePaused() &&
    !gameFinished()
  );
}

// ==========================================
// 6. UI Helpers
// ==========================================

function setStatus(text, color = "#aaa") {
  if (!status) return;

  status.textContent = text;
  status.style.color = color;
}

function setGesture(text) {
  if (!gestureStatus) return;

  if (text === lastMessage) return;

  gestureStatus.textContent = text;
  lastMessage = text;
}

function resetMotionState() {
  laneCandidate = "center";
  laneCandidateFrames = 0;
  laneArmed = true;

  jumpArmed = true;
  jumpTriggerY = null;
  jumpStableFrames = 0;

  wristHistory = [];

  lastLaneAction = 0;
  lastJumpAction = 0;
}

function resetCalibration() {
  calibrated = false;

  calibrationStart = null;
  calibrationOrigin = null;

  neutralX = 0.5;
  neutralY = 0.5;

  smoothX = null;
  smoothY = null;

  recoveryFrames = 0;

  resetMotionState();
}

function resetTracking() {
  resetCalibration();

  handMissing = false;
  lastHandSeen = performance.now();

  lastVideoTime = -1;
  lastDetectionTimestamp = 0;
  detectionErrors = 0;
}

// ==========================================
// 7. Initialize MediaPipe
// ==========================================

async function initializeModel() {
  if (handLandmarker) return;

  setStatus("LOADING AI MODEL...", "#e6b65c");

  const vision = await FilesetResolver.forVisionTasks(
    WASM_URL
  );

  handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "CPU"
      },

      runningMode: "VIDEO",
      numHands: 1,

      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6
    }
  );

  console.log("[Gesture V1.1] Model ready");
}

// ==========================================
// 8. Start Camera
// ==========================================

async function startCamera() {
  if (running || initializing) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("CAMERA NOT SUPPORTED", "#ef7777");
    setGesture("请使用 HTTPS 或 localhost 打开游戏");
    return;
  }

  const currentSession = ++sessionId;
  initializing = true;

  try {
    if (startButton) startButton.disabled = true;

    setGesture("正在加载手势识别模型...");
    await initializeModel();

    if (currentSession !== sessionId) return;

    setStatus("REQUESTING CAMERA...", "#e6b65c");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 }
      },
      audio: false
    });

    if (currentSession !== sessionId) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    cameraStream = stream;

    video.srcObject = cameraStream;
    video.muted = true;
    video.playsInline = true;

    await video.play();

    if (currentSession !== sessionId) return;

    if (overlay) {
      overlay.width = video.videoWidth || 640;
      overlay.height = video.videoHeight || 480;
      overlay.style.display = "block";
    }

    video.style.display = "block";

    if (placeholder) {
      placeholder.style.display = "none";
    }

    resetTracking();

    running = true;

    if (startButton) startButton.disabled = true;
    if (stopButton) stopButton.disabled = false;

    setStatus("CALIBRATION REQUIRED", "#e6b65c");
    setGesture("请将手掌放在画面中央，保持稳定");

    animationId = requestAnimationFrame(detectHands);

    console.log("[Gesture V1.1] Camera online");

  } catch (error) {
    if (currentSession !== sessionId) return;

    console.error("[Gesture V1.1] Camera error:", error);

    stopCamera();

    if (error.name === "NotAllowedError") {
      setStatus("CAMERA PERMISSION DENIED", "#ef7777");
      setGesture("请允许浏览器访问摄像头");

    } else if (error.name === "NotFoundError") {
      setStatus("NO CAMERA FOUND", "#ef7777");
      setGesture("没有找到摄像头");

    } else if (error.name === "NotReadableError") {
      setStatus("CAMERA BUSY", "#ef7777");
      setGesture("摄像头可能正在被其他应用使用");

    } else {
      setStatus("CAMERA ERROR", "#ef7777");
      setGesture(error.message || "摄像头启动失败");
    }

  } finally {
    if (currentSession === sessionId) {
      initializing = false;
    }
  }
}

// ==========================================
// 9. Palm Position
// ==========================================

function getPalmPosition(hand) {
  // Palm center based on MCP landmarks
  const palmX = (
    hand[5].x +
    hand[9].x +
    hand[13].x +
    hand[17].x
  ) / 4;

  const palmY = (
    hand[5].y +
    hand[9].y +
    hand[13].y +
    hand[17].y
  ) / 4;

  return {
    // Mirror camera horizontally
    x: 1 - palmX,

    // Wrist position for jump detection
    y: hand[0].y,

    centerY: palmY
  };
}

// ==========================================
// 10. Calibration
// ==========================================

function calibrateHand(position, now) {
  const nearCenter =
    Math.abs(position.x - 0.5) <
    CONFIG.calibrationCenterTolerance;

  if (!nearCenter) {
    calibrationStart = null;
    calibrationOrigin = null;

    setGesture("请把手掌移动到画面中央");
    return;
  }

  if (!calibrationOrigin) {
    calibrationOrigin = {
      x: position.x,
      y: position.y
    };

    calibrationStart = now;
  }

  const movementX = Math.abs(
    position.x - calibrationOrigin.x
  );

  const movementY = Math.abs(
    position.y - calibrationOrigin.y
  );

  if (
    movementX > CONFIG.calibrationTolerance ||
    movementY > CONFIG.calibrationTolerance
  ) {
    calibrationOrigin = {
      x: position.x,
      y: position.y
    };

    calibrationStart = now;

    setGesture("请保持手掌稳定");
    return;
  }

  const elapsed = now - calibrationStart;

  if (elapsed < CONFIG.calibrationDuration) {
    const progress = Math.min(
      100,
      Math.round(
        elapsed / CONFIG.calibrationDuration * 100
      )
    );

    setGesture(`校准中 ${progress}% · 请保持稳定`);
    return;
  }

  neutralX = position.x;
  neutralY = position.y;

  smoothX = position.x;
  smoothY = position.y;

  calibrated = true;

  resetMotionState();

  // Do not trigger an immediate jump or lane change.
  lastLaneAction = now;
  lastJumpAction = now;

  setStatus("HAND CALIBRATED", "#67d391");

  if (getGame()?.isPausedByHandLoss?.()) {
    setGesture("校准完成 · 请点击继续或按 P");
  } else {
    setGesture("校准完成 · 可以开始控制游戏");
  }

  console.log("[Gesture V1.1] Calibration complete", {
    neutralX,
    neutralY
  });
}

// ==========================================
// 11. Hand Loss Detection
// ==========================================

function handleMissingHand(now) {
  if (!running) return;

  const missingDuration = now - lastHandSeen;

  if (missingDuration < CONFIG.handLossTimeout) {
    setGesture("正在寻找手掌...");
    return;
  }

  if (!handMissing) {
    handMissing = true;

    resetCalibration();

    pauseGameForHandLoss();

    setStatus("HAND LOST", "#ef7777");
    setGesture("手部丢失 · 游戏已暂停");

    console.warn(
      "[Gesture V1.1] Hand lost, game paused"
    );
  }
}

function handleRecoveredHand(position, now) {
  if (handMissing) {
    recoveryFrames++;

    if (
      recoveryFrames < CONFIG.recoveryStableFrames
    ) {
      setGesture("重新识别手掌中...");
      return;
    }

    handMissing = false;
    recoveryFrames = 0;

    resetCalibration();

    setStatus("RECALIBRATION", "#e6b65c");
    setGesture("手掌已恢复 · 请重新校准");
  }

  if (!calibrated) {
    calibrateHand(position, now);
  }
}

// ==========================================
// 12. Lane Gesture
// ==========================================

function detectLaneGesture(now) {
  const relativeX = smoothX - neutralX;

  let direction = "center";

  if (relativeX < -CONFIG.laneThreshold) {
    direction = "left";

  } else if (
    relativeX > CONFIG.laneThreshold
  ) {
    direction = "right";
  }

  // Re-arm only after returning near center.
  if (
    Math.abs(relativeX) <
    CONFIG.laneReleaseThreshold
  ) {
    laneArmed = true;
    laneCandidate = "center";
    laneCandidateFrames = 0;
    return;
  }

  if (!laneArmed) return;

  if (direction === "center") {
    laneCandidate = "center";
    laneCandidateFrames = 0;
    return;
  }

  if (direction !== laneCandidate) {
    laneCandidate = direction;
    laneCandidateFrames = 1;
    return;
  }

  laneCandidateFrames++;

  if (
    laneCandidateFrames <
    CONFIG.laneStableFrames
  ) {
    return;
  }

  if (
    now - lastLaneAction <
    CONFIG.laneCooldown
  ) {
    return;
  }

  if (!canControlGame()) return;

  if (direction === "left") {
    getGame()?.move?.(-1);
    setGesture("← LEFT · CHANGE LANE");

  } else {
    getGame()?.move?.(1);
    setGesture("RIGHT → CHANGE LANE");
  }

  lastLaneAction = now;

  // Must return to center before next lane action.
  laneArmed = false;
  laneCandidateFrames = 0;
}

// ==========================================
// 13. Jump Gesture
// ==========================================

function detectJumpGesture(now) {
  const relativeY = smoothY - neutralY;

  wristHistory.push({
    y: smoothY,
    time: now
  });

  wristHistory = wristHistory.filter(
    item => now - item.time <= CONFIG.jumpWindow
  );

  if (!jumpArmed) {
    if (
      jumpTriggerY !== null &&
      smoothY >
      jumpTriggerY + CONFIG.jumpRearmDistance
    ) {
      jumpArmed = true;
      jumpTriggerY = null;
      jumpStableFrames = 0;
      wristHistory = [];

      setGesture("HAND TRACKING · READY");
    }

    return;
  }

  if (wristHistory.length < 2) return;

  const oldest = wristHistory[0];

  // Screen Y decreases when the hand moves up.
  const upwardDistance = oldest.y - smoothY;

  // Prevent tiny movements near calibration point.
  const movedAboveNeutral =
    relativeY < -CONFIG.jumpDistance * 0.5;

  if (
    upwardDistance > CONFIG.jumpDistance &&
    movedAboveNeutral
  ) {
    jumpStableFrames++;
  } else {
    jumpStableFrames = 0;
  }

  if (
    jumpStableFrames <
    CONFIG.jumpStableFrames
  ) {
    return;
  }

  if (
    now - lastJumpAction <
    CONFIG.jumpCooldown
  ) {
    return;
  }

  if (!canControlGame()) return;

  getGame()?.leap?.();

  setGesture("↑ JUMP!");

  lastJumpAction = now;
  jumpArmed = false;
  jumpTriggerY = smoothY;

  jumpStableFrames = 0;
  wristHistory = [];
}

// ==========================================
// 14. Control Game
// ==========================================

function controlGame(position, now) {
  if (!calibrated || handMissing) return;

  if (smoothX === null) {
    smoothX = position.x;
    smoothY = position.y;

  } else {
    smoothX += (
      position.x - smoothX
    ) * CONFIG.smoothing;

    smoothY += (
      position.y - smoothY
    ) * CONFIG.smoothing;
  }

  // Never buffer gestures during a pause.
  if (!canControlGame()) {
    resetMotionState();

    // Prevent instant actions on resume.
    lastLaneAction = now;
    lastJumpAction = now;

    return;
  }

  detectLaneGesture(now);
  detectJumpGesture(now);
}

// ==========================================
// 15. Draw Hand Landmarks
// ==========================================

function drawHand(hand) {
  if (!ctx || !overlay) return;

  ctx.fillStyle = "#53e6b0";
  ctx.strokeStyle = "#53e6b0";
  ctx.lineWidth = 3;

  for (const connection of HandLandmarker.HAND_CONNECTIONS) {
    const a = hand[connection.start];
    const b = hand[connection.end];

    if (!a || !b) continue;

    ctx.beginPath();

    ctx.moveTo(
      a.x * overlay.width,
      a.y * overlay.height
    );

    ctx.lineTo(
      b.x * overlay.width,
      b.y * overlay.height
    );

    ctx.stroke();
  }

  for (const point of hand) {
    ctx.beginPath();

    ctx.arc(
      point.x * overlay.width,
      point.y * overlay.height,
      4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}

// ==========================================
// 16. Detection Loop
// ==========================================

function detectHands(now) {
  if (!running) return;

  try {
    if (
      video.readyState >= 2 &&
      handLandmarker &&
      video.videoWidth > 0
    ) {
      // Process each video frame only once.
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        const timestamp = Math.max(
          now,
          lastDetectionTimestamp + 0.001
        );

        lastDetectionTimestamp = timestamp;

        const result = handLandmarker.detectForVideo(
          video,
          timestamp
        );

        detectionErrors = 0;

        if (ctx && overlay) {
          ctx.clearRect(
            0,
            0,
            overlay.width,
            overlay.height
          );
        }

        const hand = result.landmarks?.[0];

        if (hand) {
          lastHandSeen = now;

          drawHand(hand);

          const position = getPalmPosition(hand);

          handleRecoveredHand(position, now);

          if (!handMissing && calibrated) {
            controlGame(position, now);
          }

        } else {
          // Do not reset on a single missed frame.
          handleMissingHand(now);
        }
      }
    }

    // Also handle a stalled camera feed.
    if (
      running &&
      now - lastHandSeen >
      CONFIG.handLossTimeout
    ) {
      handleMissingHand(now);
    }

  } catch (error) {
    detectionErrors++;

    console.error(
      "[Gesture V1.1] Detection error:",
      error
    );

    if (
      detectionErrors >=
      CONFIG.maxDetectionErrors
    ) {
      pauseGameForHandLoss();
      stopCamera();

      setStatus("TRACKING ERROR", "#ef7777");
      setGesture("识别异常 · 请重新启动摄像头");
      return;
    }
  }

  if (running) {
    animationId = requestAnimationFrame(detectHands);
  }
}

// ==========================================
// 17. Stop Camera
// ==========================================

function stopCamera() {
  const wasRunning = running;

  sessionId++;
  running = false;
  initializing = false;

  // If stopping an active calibrated camera,
  // pause gameplay before removing controls.
  if (wasRunning && calibrated) {
    pauseGameForHandLoss();
  }

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => {
      track.stop();
    });

    cameraStream = null;
  }

  if (video) {
    video.pause();
    video.srcObject = null;
    video.style.display = "none";
  }

  if (ctx && overlay) {
    ctx.clearRect(
      0,
      0,
      overlay.width,
      overlay.height
    );

    overlay.style.display = "none";
  }

  if (placeholder) {
    placeholder.style.display = "flex";
  }

  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;

  resetTracking();

  setStatus("OFFLINE");
  setGesture("摄像头已关闭");

  console.log("[Gesture V1.1] Camera stopped");
}

// ==========================================
// 18. Manual Recalibration
// ==========================================

function recalibrate() {
  if (!running) {
    setGesture("请先启动摄像头");
    return;
  }

  resetCalibration();

  setStatus("RECALIBRATION", "#e6b65c");
  setGesture("请将手掌放在画面中央重新校准");
}

// Optional button if present in HTML.
const recalibrateButton = document.querySelector(
  "#camera-recalibrate"
);

recalibrateButton?.addEventListener(
  "click",
  recalibrate
);

// ==========================================
// 19. Events
// ==========================================

startButton?.addEventListener(
  "click",
  startCamera
);

stopButton?.addEventListener(
  "click",
  stopCamera
);

window.addEventListener(
  "beforeunload",
  stopCamera
);

// Pause when browser tab becomes hidden.
document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden && running) {
      pauseGameForHandLoss();
      resetCalibration();

      setStatus("TRACKING PAUSED", "#e6b65c");
      setGesture("页面已切换 · 返回后重新校准");
    }
  }
);

// Public camera API
window.ruinsRunCamera = {
  start: startCamera,
  stop: stopCamera,
  recalibrate,

  isRunning: () => running,
  isCalibrated: () => calibrated,
  isHandMissing: () => handMissing
};

// ==========================================
// 20. Initial State
// ==========================================

if (startButton) {
  startButton.disabled = false;
}

if (stopButton) {
  stopButton.disabled = true;
}

setStatus("OFFLINE");
setGesture("等待手势识别");

console.log(
  "[Ruins Run] Gesture Control V1.1 ready"
);
