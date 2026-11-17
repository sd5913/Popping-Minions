
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const status = document.querySelector('output');
const pause = document.querySelector('#pause');
const backdrop = new Image();

const lanes = [-3, 0, 3];
const roadWidth = 11;
const segmentLength = 5;
const finish = 148;

const landmarks = Array.from({ length: 18 }, (_, i) => ({
  kind: 'scenery',
  x: (i % 2 ? -1 : 1) * (6.2 + (i % 3) * 0.75),
  z: 9 + i * 7.5,
  w: 1.1 + (i % 3) * 0.6,
  h: 2.2 + (i % 5) * 0.67,
  d: 1.6
}));

const course = [
  ['wall', 0],
  ['rubble', -3],
  ['gate', 3],
  ['wall', -3],
  ['rubble', 0],
  ['gate', -3],
  ['wall', 3],
  ['rubble', 3],
  ['wall', 0],
  ['gate', 0]
];

let objects = [];
let travel = 0;
let lane = 1;
let x = 0;
let jump = 0;
let vy = 0;
let stun = 0;
let flash = 0;
let previous = 0;

let paused = false;
let finished = false;

// Gesture Control V1.1
let pausedByHandLoss = false;

let width;
let height;
let focal;
let horizon;
let next = 0;

// ==========================================
// 1. Resize
// ==========================================

function resize() {
  const scale = Math.min(devicePixelRatio || 1, 2);

  width = canvas.clientWidth;
  height = canvas.clientHeight;

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  focal = Math.min(width * 0.83, height * 1.07);
  horizon = height * 0.48;
}

// ==========================================
// 2. Spawn Obstacles
// ==========================================

function spawn(index) {
  const [kind, center] = course[index % course.length];
  const z = 18 + index * 13;

  if (kind === 'gate') {
    return [-1, 1].map(side => ({
      kind,
      x: center + side * 1.27,
      z,
      w: 0.55,
      h: 3.9,
      d: 1.05,
      hit: false
    }));
  }

  if (kind === 'wall') {
    return [{
      kind,
      x: center,
      z,
      w: 2.2,
      h: 3.35,
      d: 2.25,
      hit: false
    }];
  }

  return [{
    kind,
    x: center,
    z,
    w: 1.9,
    h: 0.65,
    d: 1.2,
    hit: false
  }];
}

// ==========================================
// 3. Reset Game
// ==========================================

function reset() {
  objects = [];
  next = 0;

  travel = 0;
  lane = 1;
  x = 0;

  jump = 0;
  vy = 0;

  stun = 0;
  flash = 0;

  paused = false;
  finished = false;

  // V1.1: Clear hand-loss pause
  pausedByHandLoss = false;

  previous = performance.now();

  pause.disabled = false;
  pause.textContent = '暂停';

  status.value = '游戏已重置';
}

// ==========================================
// 4. Update Game
// ==========================================

function update(dt) {
  if (paused || finished) return;

  x += (lanes[lane] - x) * Math.min(1, dt * 11);

  if (jump > 0 || vy > 0) {
    jump = Math.max(0, jump + vy * dt);
    vy -= 17 * dt;

    if (jump === 0) {
      vy = 0;
    }
  }

  const before = travel;

  travel = Math.min(
    finish,
    travel + dt * (stun > 0 ? 3.1 : 9)
  );

  stun = Math.max(0, stun - dt);
  flash = Math.max(0, flash - dt);

  while (
    next < course.length &&
    18 + next * 13 < travel + 105
  ) {
    objects.push(...spawn(next++));
  }

  for (const o of objects) {
    const near = o.z - o.d / 2;
    const far = o.z + o.d / 2;

    if (
      !o.hit &&
      before < far &&
      travel + 0.38 >= near &&
      Math.abs(x - o.x) < o.w / 2 + 0.29 &&
      jump < o.h - 0.12
    ) {
      o.hit = true;
      stun = 0.65;
      flash = 0.28;
    }
  }

  objects = objects.filter(o => o.z > travel - 4);

  if (travel >= finish) {
    finished = true;
    pausedByHandLoss = false;

    pause.disabled = true;
    status.value = '已抵达光门';
  } else {
    status.value =
      stun > 0
        ? '撞到了 · 继续前进'
        : '距光门 ' + Math.ceil(finish - travel) + ' m';
  }
}

// ==========================================
// 5. Perspective Projection
// ==========================================

function point(px, py, z) {
  const scale = focal / Math.max(z, 0.24);
  const bob = Math.sin(travel * 2) * 0.028;

  return [
    width / 2 + (px - x) * scale,
    horizon + (1.63 + jump + bob - py) * scale
  ];
}

function polygon(points, fill, stroke) {
  ctx.beginPath();

  points.forEach(([px, py], i) => {
    if (i) {
      ctx.lineTo(px, py);
    } else {
      ctx.moveTo(px, py);
    }
  });

  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ==========================================
// 6. Road
// ==========================================

function road(near, far, i) {
  const half = roadWidth / 2;

  polygon([
    point(-half, 0, near),
    point(half, 0, near),
    point(half, 0, far),
    point(-half, 0, far)
  ], i % 2 ? '#986644' : '#a8754e', '#523827');

  for (let j = -2; j <= 2; j++) {
    const cut = j * 2.1 + (i % 2) * 0.44;

    polygon([
      point(cut, 0, near),
      point(cut + 0.025, 0, near),
      point(cut + 0.025, 0, far),
      point(cut, 0, far)
    ], '#65422f');
  }

  for (const side of [-1, 1]) {
    const a = side * half;
    const b = side * (half + 0.24);

    polygon([
      point(a, 0, near),
      point(b, 0, near),
      point(b, 0, far),
      point(a, 0, far)
    ], '#e4ac74');
  }
}

// ==========================================
// 7. Draw Obstacles
// ==========================================

function block(o) {
  const near = Math.max(
    0.24,
    o.z - o.d / 2 - travel
  );

  const far = o.z + o.d / 2 - travel;

  if (far <= 0.24) return;

  const l = o.x - o.w / 2;
  const r = o.x + o.w / 2;
  const h = o.h;

  const a = point(l, 0, near);
  const b = point(r, 0, near);
  const c = point(r, h, near);
  const d = point(l, h, near);

  const e = point(l, h, far);
  const f = point(r, h, far);

  polygon([
    point(l - 0.3, 0, near),
    point(r + 0.65, 0, near),
    point(r + 0.85, 0, far),
    point(l, 0, far)
  ], '#463020');

  polygon([d, c, f, e], '#e6af74', '#613d26');

  if (x < o.x) {
    polygon([
      a,
      d,
      e,
      point(l, 0, far)
    ], '#865032', '#5d3a26');
  } else {
    polygon([
      b,
      c,
      f,
      point(r, 0, far)
    ], '#75472e', '#5d3a26');
  }

  polygon(
    [a, b, c, d],
    o.kind === 'rubble' ? '#c38355' : '#ad7148',
    '#513223'
  );

  const rows = o.kind === 'rubble' ? 2 : 6;

  for (let i = 1; i < rows; i++) {
    const y = h * i / rows;

    const [ax, ay] = point(l, y, near);
    const [bx, by] = point(r, y, near);

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);

    ctx.strokeStyle = '#71472f';
    ctx.stroke();
  }
}

// ==========================================
// 8. Background Scenery
// ==========================================

function scenery() {
  if (!backdrop.complete || !backdrop.naturalWidth) {
    return;
  }

  const progress = travel / finish;

  const cover = Math.max(
    width / backdrop.width,
    height / backdrop.height
  );

  const portalY = 0.54;
  const count = 56;

  for (let i = 0; i < count; i++) {
    const left = i * width / count;
    const right = (i + 1) * width / count;

    const edge = Math.abs(
      (left + right) / width - 1
    );

    const zoom = cover * (
      1.12 +
      progress * (0.27 + edge * 0.52) +
      progress ** 5 * 0.26
    );

    const w = backdrop.width * zoom;
    const h = backdrop.height * zoom;

    ctx.save();

    ctx.beginPath();
    ctx.rect(left - 0.5, 0, right - left + 1, height);
    ctx.clip();

    ctx.drawImage(
      backdrop,
      (width - w) / 2 - x * (2 + edge * 8),
      horizon - h * portalY +
        Math.sin(travel * 2) * height * 0.002,
      w,
      h
    );

    ctx.restore();
  }
}

// ==========================================
// 9. Finish Portal
// ==========================================

function portal() {
  const z = Math.max(
    0.6,
    finish - travel + 0.6
  );

  const topLeft = point(-4.4, 5, z);
  const bottomRight = point(4.4, 0, z);

  const [left, top] = topLeft;
  const [right, bottom] = bottomRight;

  const glow = ctx.createLinearGradient(
    0, top, 0, bottom
  );

  glow.addColorStop(0, '#ffbe72aa');
  glow.addColorStop(1, '#fff0ba');

  ctx.save();

  ctx.shadowColor = '#ffad5e';
  ctx.shadowBlur = Math.min(36, 8 + 180 / z);

  ctx.fillStyle = glow;
  ctx.fillRect(
    left,
    top,
    right - left,
    bottom - top
  );

  ctx.strokeStyle = '#fff2c8';
  ctx.lineWidth = Math.min(9, 1 + 22 / z);

  ctx.strokeRect(
    left,
    top,
    right - left,
    bottom - top
  );

  ctx.restore();
}

// ==========================================
// 10. Draw Game
// ==========================================

function draw() {
  ctx.fillStyle = '#4f3020';
  ctx.fillRect(0, 0, width, height);

  scenery();

  const end = Math.ceil(
    (travel + 110) / segmentLength
  );

  const start = Math.floor(
    travel / segmentLength
  );

  for (let i = end; i >= start; i--) {
    const near = Math.max(
      0.24,
      i * segmentLength - travel
    );

    const far =
      (i + 1) * segmentLength - travel;

    if (far > 0.24) {
      road(near, far, i);
    }
  }

  if (finish - travel < 55) {
    portal();
  }

  const visibleObjects = [
    ...landmarks,
    ...objects
  ]
    .filter(o =>
      o.z > travel + 0.25 &&
      o.z < travel + 85
    )
    .sort((a, b) => b.z - a.z);

  for (const o of visibleObjects) {
    block(o);
  }

  if (finished) {
    ctx.fillStyle = '#28190fbc';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff2d5';

    ctx.font =
      'bold ' +
      Math.min(54, width * 0.11) +
      'px system-ui';

    ctx.fillText(
      '抵达光门',
      width / 2,
      height * 0.48
    );

    ctx.font = '18px system-ui';

    ctx.fillText(
      '点击「重开」再跑一次',
      width / 2,
      height * 0.56
    );
  }

  if (flash > 0) {
    ctx.fillStyle =
      'rgba(172,62,23,' + (flash * 0.8) + ')';

    ctx.fillRect(0, 0, width, height);
  }

  // V1.1: Hand-loss pause overlay
  if (paused && pausedByHandLoss && !finished) {
    ctx.fillStyle = 'rgba(18, 22, 30, 0.72)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    ctx.font =
      'bold ' +
      Math.min(32, width * 0.07) +
      'px system-ui';

    ctx.fillText(
      '手部丢失 · 游戏已暂停',
      width / 2,
      height * 0.46
    );

    ctx.font = '16px system-ui';

    ctx.fillText(
      '重新展示手掌并完成校准',
      width / 2,
      height * 0.53
    );

    ctx.fillText(
      '然后按 P 或点击继续',
      width / 2,
      height * 0.59
    );
  }
}

// ==========================================
// 11. Animation Loop
// ==========================================

function frame(now) {
  const dt = previous
    ? Math.min(0.04, (now - previous) / 1000)
    : 0;

  previous = now;

  update(dt);
  draw();

  requestAnimationFrame(frame);
}

// ==========================================
// 12. Player Movement
// ==========================================

function move(direction) {
  if (paused || finished) return;

  lane = Math.max(
    0,
    Math.min(2, lane + direction)
  );
}

function leap() {
  if (paused || finished) return;

  if (jump === 0 && vy === 0) {
    vy = 6.3;
  }
}

// ==========================================
// 13. Gesture Control V1.1
// ==========================================

// Automatically pause when the hand is lost.
function pauseForHandLoss() {
  if (paused || finished) {
    return false;
  }

  paused = true;
  pausedByHandLoss = true;

  previous = performance.now();

  pause.textContent = '继续';
  status.value = '手部丢失 · 游戏已暂停';

  console.log(
    '[Gesture V1.1] Paused because hand was lost.'
  );

  return true;
}

// Resume only when paused due to hand loss.
function resumeAfterHandLoss() {
  if (!pausedByHandLoss || finished) {
    return false;
  }

  paused = false;
  pausedByHandLoss = false;

  previous = performance.now();

  pause.textContent = '暂停';
  status.value = '手势控制已恢复';

  console.log(
    '[Gesture V1.1] Game resumed.'
  );

  return true;
}

function isPaused() {
  return paused;
}

function isFinished() {
  return finished;
}

function isPausedByHandLoss() {
  return pausedByHandLoss;
}

// Public interface for camera.js
window.ruinsRunControls = {
  move,
  leap,
  pauseForHandLoss,
  resumeAfterHandLoss,
  isPaused,
  isFinished,
  isPausedByHandLoss
};

// ==========================================
// 14. Manual Pause / Resume
// ==========================================

function toggle() {
  if (finished) return;

  paused = !paused;

  // Manual resume clears the hand-loss pause.
  pausedByHandLoss = false;

  previous = performance.now();

  pause.textContent = paused ? '继续' : '暂停';

  status.value = paused
    ? '游戏已暂停'
    : '游戏继续';

  console.log(
    '[Game] ' + (paused ? 'Paused' : 'Resumed')
  );
}

pause.onclick = toggle;

// ==========================================
// 15. Restart
// ==========================================

document.querySelector('#restart').onclick = reset;

// ==========================================
// 16. Keyboard Controls
// ==========================================

addEventListener('keydown', e => {
  if (
    e.target instanceof HTMLButtonElement &&
    e.code === 'Space'
  ) {
    return;
  }

  const allowedKeys = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'Space',
    'KeyP'
  ];

  if (!allowedKeys.includes(e.code)) return;

  e.preventDefault();

  if (e.repeat) return;

  if (e.code === 'ArrowLeft') {
    move(-1);
  }

  if (e.code === 'ArrowRight') {
    move(1);
  }

  if (
    e.code === 'ArrowUp' ||
    e.code === 'Space'
  ) {
    leap();
  }

  if (e.code === 'KeyP') {
    toggle();
  }
});

// ==========================================
// 17. Touch Controls
// ==========================================

let startTouch;

canvas.addEventListener('pointerdown', e => {
  startTouch = [
    e.clientX,
    e.clientY
  ];

  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', e => {
  if (!startTouch) return;

  const dx = e.clientX - startTouch[0];
  const dy = e.clientY - startTouch[1];

  startTouch = null;

  if (
    Math.abs(dx) > 25 &&
    Math.abs(dx) > Math.abs(dy)
  ) {
    move(Math.sign(dx));

  } else if (dy < -22) {
    leap();
  }
});

canvas.addEventListener('pointercancel', () => {
  startTouch = null;
});

// ==========================================
// 18. Initialize Game
// ==========================================

addEventListener('resize', resize);

backdrop.src = 'assets/backdrop.png';

resize();
reset();

requestAnimationFrame(frame);

console.log(
  '[Ruins Run] Gesture Control V1.1 game ready.'
);
