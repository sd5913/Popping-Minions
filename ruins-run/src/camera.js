
import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs";

// ==========================================
// 1. DOM Elements
// ==========================================

const video = document.querySelector("#camera-video");
const status = document.querySelector("#camera-status");
const gestureStatus = document.querySelector("#gesture-status");
const placeholder = document.querySelector("#camera-placeholder");

const startButton = document.querySelector("#camera-start");
const stopButton = document.querySelector("#camera-stop");

const overlay = document.querySelector("#hand-overlay");
const ctx = overlay?.getContext("2d");

// ==========================================
// 2. MediaPipe Configuration
// ==========================================

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// ==========================================
// 3. Runtime State
// ==========================================

let cameraStream = null;
let handLandmarker = null;
let animationId = null;

let running = false;
let initializing = false;

let smoothX = null;
let smoothY = null;

let lastLaneAction = 0;
let lastJumpAction = 0;

let lastDirection = "center";

let jumpArmed = true;
let jumpTriggerY = null;

let wristHistory = [];

let lastDetectionTime = 0;

// ==========================================
// 4. Gesture Sensitivity
// ==========================================

// Lane control
const LEFT_THRESHOLD = 0.46;
const RIGHT_THRESHOLD = 0.54;

const LANE_COOLDOWN = 350;

// Jump control
const JUMP_DISTANCE = 0.035;
const JUMP_WINDOW = 260;

const JUMP_COOLDOWN = 650;
const JUMP_REARM_DISTANCE = 0.04;

// Smoothing
const SMOOTHING = 0.42;

// ==========================================
// 5. UI Helpers
// ==========================================

function setStatus(text, color = "#aaa") {
  if (!status) return;

  status.textContent = text;
  status.style.color = color;
}

function setGesture(text) {
  if (!gestureStatus) return;

  gestureStatus.textContent = text;
}

function resetGestureState() {
  smoothX = null;
  smoothY = null;

  lastDirection = "center";

  wristHistory = [];

  jumpArmed = true;
  jumpTriggerY = null;
}

// ==========================================
// 6. Initialize MediaPipe
// ==========================================

async function initializeModel() {
  if (handLandmarker) return;

  setStatus("LOADING AI MODEL...", "#e6b65c");

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "CPU"
      },

      runningMode: "VIDEO",

      numHands: 1,

      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    }
  );

  console.log("MediaPipe HandLandmarker initialized.");
}

// ==========================================
// 7. Start Camera
// ==========================================

async function startCamera() {
  if (running || initializing) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("CAMERA NOT SUPPORTED", "#ef7777");
    setGesture("请使用 localhost 或 HTTPS 访问");
    return;
  }

  initializing = true;

  try {
    startButton.disabled = true;

    setStatus("LOADING AI MODEL...", "#e6b65c");
    setGesture("正在初始化手势识别...");

    await initializeModel();

    setStatus("REQUESTING CAMERA...", "#e6b65c");

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",

        width: {
          ideal: 640
        },

        height: {
          ideal: 480
        },

        frameRate: {
          ideal: 30
        }
      },

      audio: false
    });

    video.srcObject = cameraStream;

    video.muted = true;
    video.playsInline = true;

    await video.play();

    overlay.width = video.videoWidth || 640;
    overlay.height = video.videoHeight || 480;

    resetGestureState();

    running = true;

    if (placeholder) {
      placeholder.style.display = "none";
    }

    video.style.display = "block";
    overlay.style.display = "block";

    startButton.disabled = true;
    stopButton.disabled = false;

    setStatus("CAMERA ONLINE", "#67d391");

    setGesture("请将手掌放入摄像头画面");

    console.log("Camera started successfully.");

    animationId = requestAnimationFrame(detectHands);

  } catch (error) {
    console.error("Camera initialization error:", error);

    stopCamera();

    if (error.name === "NotAllowedError") {
      setStatus("CAMERA PERMISSION DENIED", "#ef7777");
      setGesture("请在浏览器中允许摄像头权限");

    } else if (error.name === "NotFoundError") {
      setStatus("NO CAMERA FOUND", "#ef7777");
      setGesture("没有检测到摄像头设备");

    } else if (error.name === "NotReadableError") {
      setStatus("CAMERA BUSY", "#ef7777");
      setGesture("摄像头可能正在被其他程序使用");

    } else {
      setStatus("CAMERA ERROR", "#ef7777");
      setGesture(error.message || "摄像头启动失败");
    }

  } finally {
    initializing = false;
  }
}

// ==========================================
// 8. Hand Detection Loop
// ==========================================

function detectHands() {
  if (!running) return;

  try {
    if (
      video.readyState >= 2 &&
      handLandmarker &&
      video.videoWidth > 0
    ) {
      const now = performance.now();

      // Avoid processing duplicate frames
      if (now !== lastDetectionTime) {
        lastDetectionTime = now;

        const result = handLandmarker.detectForVideo(
          video,
          now
        );

        ctx.clearRect(
          0,
          0,
          overlay.width,
          overlay.height
        );

        if (
          result.landmarks &&
          result.landmarks.length > 0
        ) {
          const hand = result.landmarks[0];

          drawHand(hand);

          controlGame(hand);

        } else {
          // Hand temporarily lost
          resetGestureState();

          setGesture("未检测到手部 · 请重新展示手掌");
        }
      }
    }

  } catch (error) {
    console.error("Hand detection error:", error);

    setGesture("识别异常 · 请重新启动摄像头");
  }

  if (running) {
    animationId = requestAnimationFrame(detectHands);
  }
}

// ==========================================
// 9. Draw Hand Landmarks
// ==========================================

function drawHand(hand) {
  if (!ctx) return;

  ctx.fillStyle = "#53e6b0";

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

  const connections = HandLandmarker.HAND_CONNECTIONS;

  ctx.strokeStyle = "#53e6b0";
  ctx.lineWidth = 3;

  for (const connection of connections) {
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
}

// ==========================================
// 10. Hand Position
// ==========================================

function controlGame(hand) {
  const now = performance.now();

  // Palm center: landmarks 5, 9, 13, 17
  const palmX = (
    hand[5].x +
    hand[9].x +
    hand[13].x +
    hand[17].x
  ) / 4;

  // Mirror horizontal movement
  const rawX = 1 - palmX;

  // Wrist Y position
  const rawY = hand[0].y;

  // ----------------------------------------
  // Smooth movement
  // ----------------------------------------

  if (smoothX === null) {
    smoothX = rawX;
    smoothY = rawY;

  } else {
    smoothX += (rawX - smoothX) * SMOOTHING;

    smoothY += (rawY - smoothY) * SMOOTHING;
  }

  // ----------------------------------------
  // LEFT / RIGHT LANE CONTROL
  // ----------------------------------------

  let direction = "center";

  if (smoothX < LEFT_THRESHOLD) {
    direction = "left";

  } else if (smoothX > RIGHT_THRESHOLD) {
    direction = "right";
  }

  // Trigger only when entering a new direction.
  // Return to center to re-arm the next movement.

  if (direction === "center") {
    lastDirection = "center";

  } else if (
    direction !== lastDirection &&
    now - lastLaneAction >= LANE_COOLDOWN
  ) {
    if (direction === "left") {
      window.ruinsRunControls?.move(-1);

      setGesture("← LEFT · CHANGE LANE");

    } else if (direction === "right") {
      window.ruinsRunControls?.move(1);

      setGesture("RIGHT → CHANGE LANE");
    }

    lastLaneAction = now;
    lastDirection = direction;
  }

  // ----------------------------------------
  // RECORD WRIST MOVEMENT
  // ----------------------------------------

  wristHistory.push({
    y: smoothY,
    time: now
  });

  wristHistory = wristHistory.filter(
    item => now - item.time <= JUMP_WINDOW
  );

  // ----------------------------------------
  // UPWARD HAND SWIPE = JUMP
  // ----------------------------------------

  if (wristHistory.length >= 2 && jumpArmed) {
    const oldest = wristHistory[0];

    // Screen Y decreases when hand moves upward
    const upwardDistance = oldest.y - smoothY;

    if (
      upwardDistance > JUMP_DISTANCE &&
      now - lastJumpAction >= JUMP_COOLDOWN
    ) {
      window.ruinsRunControls?.leap();

      setGesture("↑ JUMP!");

      lastJumpAction = now;

      jumpArmed = false;

      jumpTriggerY = smoothY;

      wristHistory = [];
    }
  }

  // ----------------------------------------
  // REARM JUMP
  // ----------------------------------------

  if (
    !jumpArmed &&
    jumpTriggerY !== null &&
    smoothY > jumpTriggerY + JUMP_REARM_DISTANCE
  ) {
    jumpArmed = true;

    jumpTriggerY = null;

    wristHistory = [];

    setGesture("HAND TRACKING · READY");
  }
}

// ==========================================
// 11. Stop Camera
// ==========================================

function stopCamera() {
  running = false;

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

  if (startButton) {
    startButton.disabled = false;
  }

  if (stopButton) {
    stopButton.disabled = true;
  }

  resetGestureState();

  lastLaneAction = 0;
  lastJumpAction = 0;
  lastDetectionTime = 0;

  setStatus("OFFLINE");
  setGesture("等待手势识别");

  console.log("Camera stopped.");
}

// ==========================================
// 12. Event Listeners
// ==========================================

startButton.addEventListener("click", startCamera);

stopButton.addEventListener("click", stopCamera);

window.addEventListener("beforeunload", stopCamera);

// ==========================================
// 13. Initial State
// ==========================================

if (startButton) {
  startButton.disabled = false;
}

if (stopButton) {
  stopButton.disabled = true;
}

setStatus("OFFLINE");
setGesture("等待手势识别");

console.log("Ruins Run Camera Controller Ready.");
