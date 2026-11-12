"use strict";

/* The Next Stop · Phase 1. Standalone chapter with keyboard/touch fallback.
   Camera data is processed in the browser; no video frames are uploaded here. */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const $ = (id) => document.getElementById(id);
const ui = {
  overlay: $("overlay"), kicker: $("dialogKicker"), title: $("dialogTitle"),
  text: $("dialogText"), hint: $("dialogHint"), primary: $("primaryBtn"),
  choices: $("choices"), mission: $("mission"), progress: $("progressLabel"),
  inventory: $("inventoryLabel"), route: $("routeLabel"),
  actionHint: $("actionHint"), camStatus: $("cameraStatus"),
  cameraBtn: $("cameraBtn"), calibrateBtn: $("calibrateBtn"), pauseBtn: $("pauseBtn"),
  camView: $("cameraView"), video: $("webcam")
};
const SPEED = 5.1;
const FINISH = 232;
const NPC_AT = 104;
const BRIDGE_AT = 175;
const OBSTACLES = [
  {at:17, lane:1, type:"pencil"},
  {at:32, lane:0, type:"block"},
  {at:48, lane:2, type:"pencil"},
  {at:64, lane:1, type:"gap"},
  {at:85, lane:0, type:"block"},
  {at:124, lane:2, type:"pencil"},
  {at:143, lane:1, type:"block"},
  {at:160, lane:0, type:"gap"},
  {at:195, lane:2, type:"block"},
  {at:216, lane:1, type:"pencil"}
];
const SCRIPT = [
  ["Traveller", "Are you in a hurry too?"],
  ["Student", "Yes. I might miss an important exam."],
  ["Traveller", "The main road is blocked. I found this folded examination paper."],
  ["Traveller", "Would you like to try another way?"]
];
const OPTIONS = ["I'll give it a try.", "Can I see another option?"];
let s;
let lastFrame = 0;
let detector = null;
let mediaStream = null;
let cameraEnabled = false;
let lastVideoTime = -1;
let lastDetectAt = 0;
let lastInferenceAt = 0;
let hand = null;
let neutralX = .5;
let lastPinched = false;
let pinchArmed = false;
let lastHandY = null;
let lastHandTime = 0;
let lastJumpAt = 0;
let lastActionAt = 0;
let lastLaneAt = 0;
let manualUntil = 0;
let pausedFrom = null;

function reset() {
  pausedFrom = null;
  ui.pauseBtn.textContent = "Pause";
  s = {
    mode:"intro", lane:1, progress:0, sceneTime:0,
    route:"main", lowerUntil:0, invulnerableUntil:0,
    jumpAt:-10000, recoveringFor:0, message:"Find another way forward.",
    messageFor:0, npcDone:false, dialogueIndex:0, choice:0,
    hasPaper:false, bridgeBuilt:false, buildFor:0,
    collisions:0, finished:false
  };
  showCard("CHAPTER 01 · THE STANDARD ANSWER AVENUE",
    "There is more than one correct path.",
    "Run through an exam-paper city. Avoid pencil obstacles, meet a traveller, collect a folded paper and turn it into a bridge.",
    "Start running", "← → change lanes · Space jump · E interact. Or enable the webcam.");
  updateHud();
}
function showCard(kicker, title, text, label, hint) {
  ui.kicker.textContent = kicker;
  ui.title.textContent = title;
  ui.text.textContent = text;
  ui.primary.textContent = label;
  ui.hint.textContent = hint || "";
  ui.choices.hidden = true;
  ui.choices.replaceChildren();
  ui.overlay.hidden = false;
}
function hideCard() { ui.overlay.hidden = true; }
function message(text, duration=2.4) {
  s.message = text;
  s.messageFor = duration;
}
function start() {
  if (s.mode !== "intro") return;
  s.mode = "running";
  hideCard();
  message("Dodge the pencils. Find the traveller.", 4);
}
function choose(index) {
  s.choice = index;
  if (s.mode === "dialogue") renderDialogue();
}
function renderDialogue() {
  const [speaker, line] = s.dialogueIndex === SCRIPT.length
    ? ["Traveller", s.choice === 0
      ? "Then try this. It may become something useful."
      : "Of course. Even if this road fails, you can try another."]
    : SCRIPT[s.dialogueIndex];
  showCard("NPC · THE HURRIED TRAVELLER", speaker, line,
    s.dialogueIndex === SCRIPT.length ? "Take the paper" : "Continue",
    "Move left / right to choose · Pinch or press E to confirm.");
  if (s.dialogueIndex === SCRIPT.length - 1) {
    ui.choices.hidden = false;
    OPTIONS.forEach((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice" + (s.choice === index ? " selected" : "");
      button.textContent = (index === s.choice ? "● " : "○ ") + label;
      button.setAttribute("aria-pressed", String(index === s.choice));
      button.addEventListener("click", () => choose(index));
      ui.choices.appendChild(button);
    });
  }
}
function advanceDialogue() {
  if (s.dialogueIndex < SCRIPT.length) {
    s.dialogueIndex++;
    renderDialogue();
    return;
  }
  s.npcDone = true;
  s.hasPaper = true;
  s.mode = "running";
  hideCard();
  message("Collected: Folded Examination Paper", 4);
}
function interact() {
  const now = performance.now();
  if (now - lastActionAt < 260) return;
  lastActionAt = now;
  if (s.mode === "intro") { start(); return; }
  if (s.mode === "paused") { togglePause(); return; }
  if (s.mode === "dialogue") { advanceDialogue(); return; }
  if (s.mode === "npc_wait") {
    if (s.lane !== 2) {
      message("Move to the RIGHT lane, then pinch / press E.", 2);
      return;
    }
    s.mode = "dialogue";
    s.dialogueIndex = 0;
    s.choice = 0;
    renderDialogue();
    return;
  }
  if (s.mode === "bridge_wait") {
    if (s.lane !== 1) {
      message("Move to the CENTER lane to unfold the paper.", 2);
      return;
    }
    if (!s.hasPaper) {
      message("Talk to the traveller to collect the paper.", 2);
      return;
    }
    s.mode = "building";
    s.buildFor = 1.6;
    s.hasPaper = false;
    hideCard();
    message("The folded paper becomes a bridge!", 3);
    return;
  }
  if (s.mode === "complete") reset();
}
function move(direction) {
  if (s.mode === "dialogue") {
    s.choice = Math.max(0, Math.min(OPTIONS.length - 1, s.choice + direction));
    renderDialogue();
  } else if (["running","npc_wait","bridge_wait"].includes(s.mode)) {
    s.lane = Math.max(0, Math.min(2, s.lane + direction));
  }
}
function jump() {
  const now = performance.now();
  if (s.mode !== "running" || now - s.jumpAt < 800) return;
  s.jumpAt = now;
  lastJumpAt = now;
}
function togglePause() {
  if (s.mode === "paused") {
    s.mode = pausedFrom || "running";
    pausedFrom = null;
    ui.pauseBtn.textContent = "Pause";
    hideCard();
    message("Continue your journey.", 1.5);
  } else if (["running", "recovering", "npc_wait", "bridge_wait", "building"].includes(s.mode)) {
    pausedFrom = s.mode;
    s.mode = "paused";
    ui.pauseBtn.textContent = "Resume";
    showCard("GAME PAUSED", "Take your time.",
      "Resume when you are ready to continue. If your webcam is unavailable, disable it and use the keyboard.",
      "Resume", "Press P or E, or click Resume.");
  }
}
function manual() { manualUntil = performance.now() + 900; }
function keyInput(event) {
  const k = event.key.toLowerCase();
  if (["arrowleft","arrowright"," ","arrowup","enter","e","p"].includes(k)) event.preventDefault();
  if (event.repeat) return;
  if (k === "p") { manual(); togglePause(); return; }
  if (k === "arrowleft" || k === "a") { manual(); move(-1); }
  if (k === "arrowright" || k === "d") { manual(); move(1); }
  if (k === " " || k === "arrowup" || k === "w") { manual(); jump(); }
  if (k === "e" || k === "enter") { manual(); interact(); }
}
document.addEventListener("keydown", keyInput);
$("leftBtn").addEventListener("click", () => { manual(); move(-1); });
$("rightBtn").addEventListener("click", () => { manual(); move(1); });
$("jumpBtn").addEventListener("click", () => { manual(); jump(); });
$("actionBtn").addEventListener("click", () => { manual(); interact(); });
ui.primary.addEventListener("click", () => { interact(); });
ui.pauseBtn.addEventListener("click", () => { togglePause(); });

function hitObstacle(o, now) {
  if (now < s.invulnerableUntil || s.route === "lower") return;
  const inJump = now - s.jumpAt > 100 && now - s.jumpAt < 700;
  if (o.lane !== s.lane || inJump) return;
  s.collisions++;
  s.route = "lower";
  s.lowerUntil = s.progress + 13;
  s.invulnerableUntil = now + 2800;
  s.mode = "recovering";
  s.recoveringFor = .7;
  message("You fell, but found another road below.", 3.8);
}
function advance(dt, now) {
  if (s.mode === "paused") return;
  s.sceneTime += dt;
  if (s.messageFor > 0) s.messageFor -= dt;
  if (s.mode === "recovering") {
    s.recoveringFor -= dt;
    if (s.recoveringFor <= 0) s.mode = "running";
    return;
  }
  if (s.mode === "building") {
    s.buildFor -= dt;
    if (s.buildFor <= 0) {
      s.bridgeBuilt = true;
      s.mode = "running";
      message("A new path is open. Keep going!", 4);
    }
    return;
  }
  if (s.mode !== "running") return;
  if (cameraEnabled && now - lastDetectAt > 1700 && now > manualUntil) return;
  const previous = s.progress;
  s.progress = Math.min(FINISH, s.progress + SPEED * dt);
  if (s.route === "lower" && s.progress >= s.lowerUntil) s.route = "main";
  for (const o of OBSTACLES) {
    if (previous < o.at && s.progress >= o.at) {
      hitObstacle(o, now);
      if (s.mode === "recovering") break;
    }
  }
  if (!s.npcDone && s.progress >= NPC_AT) {
    s.progress = NPC_AT;
    s.mode = "npc_wait";
    message("Traveller ahead: move RIGHT and pinch / press E.", 999);
  } else if (!s.bridgeBuilt && s.progress >= BRIDGE_AT && s.npcDone) {
    s.progress = BRIDGE_AT;
    s.mode = "bridge_wait";
    message("Broken road: move CENTER and use the folded paper.", 999);
  } else if (s.progress >= FINISH) {
    s.progress = FINISH;
    s.mode = "complete";
    showCard("CHAPTER 01 · COMPLETE", "A new path begins.",
      "You avoided obstacles, talked to a traveller, collected a folded paper and created your own bridge. Failure did not end the journey.",
      "Play again", "Next chapter: Everyone's Own Pace · coming in Phase 2.");
  }
}
function updateHud() {
  ui.progress.textContent = Math.round((s.progress / FINISH)*100) + "%";
  ui.inventory.textContent = s.hasPaper ? "ITEM: FOLDED PAPER" : "ITEM: NONE";
  ui.route.textContent = s.route === "lower" ? "ALTERNATIVE ROAD" : "MAIN ROAD";
  let text = s.messageFor > 0 ? s.message : "Keep moving.";
  if (s.mode === "npc_wait") text = "Move RIGHT · Pinch / E to talk";
  if (s.mode === "bridge_wait") text = "Move CENTER · Pinch / E to use paper";
  if (s.mode === "building") text = "Paper bridge unfolding...";
  if (s.mode === "paused") text = "Paused · press P or Resume";
  if (s.mode === "running" && cameraEnabled && performance.now() - lastDetectAt > 1700 && performance.now() > manualUntil) text = "Hand lost — show your hand or use keyboard";
  ui.mission.textContent = text;
  ui.actionHint.textContent = (s.mode === "dialogue") ? "Select a response · pinch / E to confirm" :
    (s.mode === "npc_wait") ? "Approach the traveller in the right lane" :
    (s.mode === "bridge_wait") ? "Unfold the paper in the center lane" :
    (s.mode === "complete") ? "Chapter complete!" : "Left / right to change lanes · raise hand to jump";
}

/* Lightweight 2.5D Canvas illustration: all geometry is drawn, with no asset downloads. */
function rect(x,y,w,h,color) { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); }
function polygon(points,color) {
  ctx.beginPath(); ctx.moveTo(points[0][0],points[0][1]);
  points.slice(1).forEach(p => ctx.lineTo(p[0],p[1]));
  ctx.closePath(); ctx.fillStyle=color; ctx.fill();
}
function label(text,x,y,size=18,color="#fff",align="center") {
  ctx.font = "bold " + size + "px Arial,sans-serif";
  ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text,x,y);
}
function sceneBackground() {
  const sky=ctx.createLinearGradient(0,0,0,540);
  sky.addColorStop(0,"#7c99a6");
  sky.addColorStop(.65,"#d9d5bd");
  sky.addColorStop(1,"#e5cf9e");
  ctx.fillStyle=sky; ctx.fillRect(0,0,960,540);
  rect(0,215,960,325,"#c0a986");
  for (let i=0;i<7;i++) {
    const depth = i/6;
    const tall = 100 + 70*((i+2)%3);
    const xLeft = 14+i*57;
    const xRight = 960-(i*57+52);
    rect(xLeft,215-tall,44,tall+40,i%2?"#5f7077":"#7c8385");
    rect(xRight,215-tall,44,tall+40,i%2?"#5f7077":"#7c8385");
    for(let j=1;j<8;j++) {
      rect(xLeft+7,215-tall+j*17,30,2,"#d8b98d");
      rect(xRight+7,215-tall+j*17,30,2,"#d8b98d");
    }
  }
  // Big exam clock, recurring circular motif
  ctx.fillStyle="#f4e8c4"; ctx.beginPath(); ctx.arc(480,118,61,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#485969"; ctx.lineWidth=9; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(480,118); ctx.lineTo(480,82); ctx.moveTo(480,118); ctx.lineTo(512,130); ctx.strokeStyle="#b35f4e"; ctx.lineWidth=7; ctx.stroke();
  label("EXAM AVENUE",480,204,13,"#455663");
}
function road() {
  const lower=s.route==="lower";
  polygon([[419,226],[541,226],[910,540],[50,540]],lower?"#839da1":"#d0cbc1");
  polygon([[459,226],[501,226],[582,540],[378,540]],lower?"#82979e":"#c6c4be");
  ctx.strokeStyle=lower?"#e6e1ca":"#f2eedc";
  ctx.lineWidth=4; ctx.setLineDash([15,19]);
  ctx.lineDashOffset=-s.sceneTime*75;
  [-1,1].forEach(side=>{
    ctx.beginPath();ctx.moveTo(480+side*20,227);ctx.lineTo(480+side*110,540);ctx.stroke();
  });
  ctx.setLineDash([]);
  // Examination-style printed stripes
  const offset=(s.progress*13)%54;
  for(let i=0;i<7;i++) {
    const y=244+i*50+offset;
    if(y>545) continue;
    const width=(y-220)*.85;
    rect(480-width/2,y,width,2,lower?"#a6bab9":"#aeb4b2");
  }
}
function laneX(lane, t=1) { return 480+(lane-1)*181*t; }
function drawPencil(x,y,scale) {
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  rect(-14,-66,28,62,"#e9c961");
  polygon([[-14,-66],[0,-88],[14,-66]],"#deab87");
  polygon([[-5,-78],[0,-88],[5,-78]],"#323c4d");
  rect(-14,-28,28,6,"#364558");
  rect(-14,-15,28,6,"#364558");
  ctx.restore();
}
function drawBlock(x,y,scale) {
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  polygon([[-33,-52],[22,-52],[38,-65],[-17,-65]],"#b78a70");
  rect(-33,-52,55,52,"#b56955");
  polygon([[22,-52],[38,-65],[38,-13],[22,0]],"#8c514a");
  label("!",-5,-14,31,"#fff1c9");
  ctx.restore();
}
function drawGap(x,y,scale) {
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  rect(-37,-16,74,35,"#263545");
  ctx.strokeStyle="#e3ac63";ctx.lineWidth=5;ctx.strokeRect(-37,-16,74,35);
  label("!",0,10,23,"#f1e4c0");
  ctx.restore();
}
function drawObstacles() {
  for(const o of OBSTACLES) {
    const distance=o.at-s.progress;
    if(distance<-3||distance>25) continue;
    const t=Math.max(.12,Math.min(1.15,1-distance/25));
    const x=laneX(o.lane,t);
    const y=226+Math.pow(t,1.5)*295;
    const scale=.2+t*.97;
    if(o.type==="pencil")drawPencil(x,y,scale);
    else if(o.type==="block")drawBlock(x,y,scale);
    else drawGap(x,y,scale);
  }
}
function drawTraveller() {
  if(s.progress<78||s.npcDone) return;
  const x=742,y=435;
  ctx.save();
  ctx.fillStyle="#745f86";ctx.fillRect(x-24,y-15,48,68);
  ctx.fillStyle="#e6b399";ctx.beginPath();ctx.arc(x,y-34,21,0,Math.PI*2);ctx.fill();
  rect(x-23,y-58,46,12,"#3e4150");
  rect(x+24,y-7,29,37,"#eee4bf");
  label("TRAVELLER",x,y-80,16,"#fff2c9");
  if(s.mode==="npc_wait") label("PINCH / E",x,y+92,17,"#fff3ba");
  ctx.restore();
}
function drawBridge() {
  if(s.progress<140) return;
  const dist=BRIDGE_AT-s.progress;
  const t=Math.max(.14,Math.min(1.0,1-dist/30));
  const cy=230+t*t*278;
  const w=55+t*245;
  const completed=s.bridgeBuilt?1:(s.mode==="building"?1-s.buildFor/1.6:0);
  if(s.progress<=BRIDGE_AT+24) {
    polygon([[480-w/2,cy-18],[480+w/2,cy-18],[480+w/2,cy+24],[480-w/2,cy+24]],"#293846");
    if(completed>0) {
      rect(480-w/2,cy-18,w*completed,42,"#eee5c5");
      for(let i=0;i<Math.ceil(completed*7);i++) {
        const sx=480-w/2+i*w/7;
        rect(sx,cy-15,2,35,"#9da3a1");
      }
    }
    if(!s.bridgeBuilt && s.mode!=="building") label("BROKEN ROAD",480,cy-33,18,"#fce6b3");
  }
}
function drawPlayer(now) {
  const x=laneX(s.lane), y=412;
  const jumpAge=now-s.jumpAt;
  const jumpHeight=jumpAge>0&&jumpAge<800 ? Math.sin(Math.PI*jumpAge/800)*106 : 0;
  const fallOffset = s.mode==="recovering"?35:0;
  ctx.save();ctx.translate(x,y-jumpHeight+fallOffset);
  ctx.fillStyle="#121c2450";ctx.beginPath();ctx.ellipse(0,99-jumpHeight*.2,38,11,0,0,Math.PI*2);ctx.fill();
  const step=s.mode==="running"?Math.sin(s.sceneTime*12)*8:0;
  rect(-18,40,14,50+step,"#2d3643");
  rect(5,40,14,50-step,"#2d3643");
  rect(-27,-8,54,59,"#ede1cf");
  rect(-23,1,46,46,"#d66242");
  rect(-23,20,46,4,"#b64d39");
  rect(-30,3,10,38,"#ede1cf");rect(20,3,10,38,"#ede1cf");
  ctx.fillStyle="#e4b69a";ctx.beginPath();ctx.arc(0,-25,20,0,Math.PI*2);ctx.fill();
  rect(-20,-46,40,14,"#242f3d");
  if(s.mode==="recovering")label("!",0,-66,26,"#ffeea9");
  ctx.restore();
}
function drawScene(now) {
  sceneBackground();
  road();
  drawObstacles();
  drawBridge();
  drawTraveller();
  drawPlayer(now);
  if(s.mode==="building") {
    rect(330,400,300,20,"#34485d");
    rect(333,403,294*(1-s.buildFor/1.6),14,"#e8bb67");
    label("UNFOLDING PAPER BRIDGE",480,390,17,"#fff4d7");
  }
  if(s.mode==="recovering")label("A MISTAKE REVEALS ANOTHER PATH",480,308,22,"#fff4cb");
}

/* Optional hand-tracking input: MediaPipe Tasks Vision (CDN, loaded only when requested).
   Mirrored X matches the player's movement in their mirrored video preview. */
function calibrate() {
  if (!hand) {
    ui.camStatus.textContent = "Show one open hand to the camera first.";
    return;
  }
  neutralX = hand.x;
  ui.camStatus.textContent = "Calibrated · move hand left/right";
}
ui.calibrateBtn.addEventListener("click", calibrate);
async function enableCamera() {
  if (cameraEnabled) return;
  if (s.mode === "running") togglePause();
  ui.cameraBtn.disabled = true;
  ui.camStatus.textContent = "Requesting permission / loading hand model...";
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
      throw new Error("Camera requires HTTPS or localhost.");
    mediaStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:640,height:480},audio:false});
    ui.video.srcObject = mediaStream;
    await ui.video.play();
    const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
    const fileset = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm");
    detector = await vision.HandLandmarker.createFromOptions(fileset,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",delegate:"CPU"},
      runningMode:"VIDEO",numHands:1,
      minHandDetectionConfidence:.5,minTrackingConfidence:.5
    });
    cameraEnabled=true;
    lastDetectAt=performance.now();
    lastInferenceAt=0;
    lastVideoTime=-1;
    lastHandY=null;
    pinchArmed=false;
    ui.camView.hidden=false;
    ui.cameraBtn.textContent="Disable webcam";
    ui.cameraBtn.disabled=false;
    ui.camStatus.textContent="Show one hand · use Center hand to calibrate";
    ui.calibrateBtn.disabled=false;
  } catch(err) {
    if(mediaStream) mediaStream.getTracks().forEach(track=>track.stop());
    mediaStream=null;
    ui.video.srcObject=null;
    ui.camStatus.textContent="Camera unavailable: "+(err.message||"unknown error")+". Keyboard works.";
    ui.cameraBtn.disabled=false;
    ui.cameraBtn.textContent="Retry webcam";
    detector=null;cameraEnabled=false;
  }
}
function disableCamera() {
  cameraEnabled=false;
  if (mediaStream) mediaStream.getTracks().forEach(track=>track.stop());
  mediaStream=null;
  ui.video.srcObject=null;
  if (detector && typeof detector.close === "function") detector.close();
  detector=null;
  hand=null;lastPinched=false;pinchArmed=false;lastHandY=null;
  ui.camView.hidden=true;
  ui.cameraBtn.textContent="Enable webcam";
  ui.cameraBtn.disabled=false;
  ui.calibrateBtn.disabled=true;
  ui.camStatus.textContent="Keyboard / touch mode · webcam off";
}
ui.cameraBtn.addEventListener("click",()=>cameraEnabled?disableCamera():enableCamera());
window.addEventListener("pagehide",disableCamera);
function cameraLane(x, now) {
  if(now - lastLaneAt < 290) return;
  if(s.mode==="dialogue" && s.dialogueIndex===SCRIPT.length-1) {
    const selected=x < neutralX-.12 ? 0 : x > neutralX+.12 ? 1 : s.choice;
    if(selected!==s.choice) {s.choice=selected;renderDialogue();lastLaneAt=now;}
  } else if(["running","npc_wait","bridge_wait"].includes(s.mode)) {
    const target=x<neutralX-.13?0:x>neutralX+.13?2:1;
    if(target!==s.lane) {s.lane=target;lastLaneAt=now;}
  }
}
function trackHand(now) {
  if(!cameraEnabled || !detector || now-lastInferenceAt<80) return;
  if(ui.video.readyState<2 || ui.video.currentTime===lastVideoTime)return;
  lastInferenceAt=now;
  lastVideoTime=ui.video.currentTime;
  try {
    const out=detector.detectForVideo(ui.video,now);
    const lm=out.landmarks && out.landmarks[0];
    if(!lm) {hand=null;lastPinched=false;pinchArmed=false;lastHandY=null;return;}
    const palm={x:1-(lm[0].x+lm[5].x+lm[17].x)/3,
      y:(lm[0].y+lm[5].y+lm[17].y)/3};
    hand=palm;
    lastDetectAt=now;
    if(now>manualUntil) cameraLane(palm.x,now);
    const span=Math.hypot(lm[5].x-lm[17].x,lm[5].y-lm[17].y);
    const pinch=Math.hypot(lm[4].x-lm[8].x,lm[4].y-lm[8].y)/Math.max(.04,span);
    // A new pinch only counts after the hand has first been observed open.
    if(pinch>.62) {lastPinched=false;pinchArmed=true;}
    if(pinch<.42 && pinchArmed && !lastPinched && now>manualUntil) {
      pinchArmed=false;
      interact();
    }
    if(pinch<.42)lastPinched=true;
    if(lastHandY!==null && now-lastHandTime<250 &&
      lastHandY-palm.y>.085 && now-lastJumpAt>900 && !lastPinched && now>manualUntil) {
      jump();
    }
    if(lastHandTime===0 || now-lastHandTime>150 || palm.y>lastHandY+.025) {
      lastHandY=palm.y;lastHandTime=now;
    }
    ui.camStatus.textContent="Hand detected · tracking locally";
  } catch(err) {
    ui.camStatus.textContent="Tracking error: "+(err.message||"retry")+". Use keyboard.";
  }
}
function frame(now) {
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):0;
  lastFrame=now;
  trackHand(now);
  advance(dt,now);
  drawScene(now);
  updateHud();
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
