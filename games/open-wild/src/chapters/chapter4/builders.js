// Chapter 04 builders — a paper boat on an ink-wash river at blue hour.
// Everything is procedural primitives layered over the Blender river corridor.

import * as THREE from "three";

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const WATER_Y = 0.02;

function mesh(geometry, material, options = {}) {
  const item = new THREE.Mesh(geometry, material);
  if (options.position) item.position.fromArray(options.position);
  if (options.rotation) item.rotation.set(...options.rotation);
  if (options.scale) item.scale.fromArray(options.scale);
  item.castShadow = options.castShadow ?? true;
  item.receiveShadow = options.receiveShadow ?? true;
  return item;
}

function radialTexture(inner = "rgba(255,220,170,1)", outer = "rgba(255,150,70,0)") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.38, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowSprite(color = 0xffcf96, size = 2.4, opacity = 0.7) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.scale.set(size, size, 1);
  return sprite;
}

function buildSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#213642");
  sky.addColorStop(0.34, "#354d55");
  sky.addColorStop(0.58, "#596763");
  sky.addColorStop(0.72, "#95806a");
  sky.addColorStop(0.84, "#c08a5f");
  sky.addColorStop(1, "#e3b383");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // A low moon and a thin band of leftover sunset.
  const moon = ctx.createRadialGradient(760, 132, 2, 760, 132, 90);
  moon.addColorStop(0, "rgba(255, 246, 224, 0.95)");
  moon.addColorStop(0.25, "rgba(255, 238, 206, 0.35)");
  moon.addColorStop(1, "rgba(255, 232, 196, 0)");
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(760, 132, 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 248, 230, 0.92)";
  ctx.fill();

  const horizon = ctx.createLinearGradient(0, 330, 0, 430);
  horizon.addColorStop(0, "rgba(255, 196, 132, 0)");
  horizon.addColorStop(0.5, "rgba(255, 186, 120, 0.3)");
  horizon.addColorStop(1, "rgba(255, 198, 142, 0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 330, canvas.width, 100);

  // Ink-wash cloud strokes.
  ctx.strokeStyle = "rgba(26, 43, 49, 0.16)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 12; i += 1) {
    const y = 120 + i * 17;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.bezierCurveTo(240, y - 18 - i * 2, 640, y + 16, 1044, y - 6);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildMaterials() {
  return {
    stone: new THREE.MeshStandardMaterial({ color: 0x5c6259, roughness: 0.94, metalness: 0.02 }),
    stoneLight: new THREE.MeshStandardMaterial({ color: 0x8a8d80, roughness: 0.9, metalness: 0.02 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x24292a, roughness: 0.96 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x4b3a2c, roughness: 0.92 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x7d6144, roughness: 0.9 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe4d6ba, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, emissive: 0x241b10, emissiveIntensity: 0.1 }),
    paperDark: new THREE.MeshStandardMaterial({ color: 0xd9c6a3, roughness: 0.9, side: THREE.DoubleSide }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc59a4d, roughness: 0.32, metalness: 0.72 }),
    brassHot: new THREE.MeshStandardMaterial({ color: 0xf4cf8a, roughness: 0.26, metalness: 0.5, emissive: 0xffa850, emissiveIntensity: 0.7 }),
    reed: new THREE.MeshStandardMaterial({ color: 0x4d5d42, roughness: 0.95, side: THREE.DoubleSide }),
    foam: new THREE.MeshBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    lantern: new THREE.MeshBasicMaterial({ color: 0xffd9a8 }),
  };
}

function buildPaperBoat(color, scale = 1.6) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    side: THREE.DoubleSide,
    emissive: 0x2a1f12,
    emissiveIntensity: 0.24,
  });
  const hull = mesh(new THREE.CylinderGeometry(0.62, 0.4, 0.24, 4, 1, true), material, { position: [0, 0.06, 0] });
  hull.rotation.y = Math.PI / 4;
  hull.scale.z = 1.7;
  const floor = mesh(new THREE.CircleGeometry(0.5, 4), material, { position: [0, 0.06, 0], castShadow: false });
  floor.rotation.x = -Math.PI / 2;
  floor.rotation.z = Math.PI / 4;
  floor.scale.y = 1.7;
  const sail = mesh(new THREE.ConeGeometry(0.26, 0.62, 4), material, { position: [0, 0.34, -0.1] });
  sail.rotation.y = Math.PI / 4;
  const sail2 = sail.clone();
  sail2.position.z = 0.18;
  sail2.scale.setScalar(0.72);
  group.add(hull, floor, sail, sail2);
  group.scale.setScalar(scale);
  return group;
}

function buildRock(MAT) {
  const group = new THREE.Group();
  const geometry = new THREE.DodecahedronGeometry(0.62, 0);
  [[-0.32, 0.18, 0.1, 0.92], [0.28, 0.24, -0.16, 1.06], [0.02, 0.08, 0.36, 0.66]].forEach(([x, y, z, scale], i) => {
    group.add(mesh(geometry, i === 1 ? MAT.stoneLight : MAT.stone, {
      position: [x, y, z], rotation: [i * 0.8, i * 1.3, i * 0.4], scale: [scale, scale * 0.72, scale],
    }));
  });
  group.add(mesh(new THREE.RingGeometry(0.55, 0.78, 24), MAT.foam, { position: [0, 0.03, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false }));
  return group;
}

function buildLog(MAT) {
  const group = new THREE.Group();
  const log = mesh(new THREE.CylinderGeometry(0.26, 0.3, 2.2, 10), MAT.wood, { position: [0, 0.24, 0] });
  log.rotation.z = Math.PI / 2;
  group.add(log);
  [-0.7, 0.55].forEach((x, i) => group.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.7, 6), MAT.woodLight, {
    position: [x, 0.4, 0.1 - i * 0.2], rotation: [0.7, 0, 0.5 - i],
  })));
  group.add(mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 18), MAT.paperDark, { position: [0.8, 0.24, 0], rotation: [0, Math.PI / 2, 0] }));
  return group;
}

function buildDrift(MAT) {
  const group = new THREE.Group();
  group.add(mesh(box(0.86, 0.62, 0.72), MAT.wood, { position: [0, 0.3, 0], rotation: [0.05, 0.3, 0.08] }));
  [[-0.3, 0.5], [0.3, 0.5], [-0.3, 0.1], [0.3, 0.1]].forEach(([x, y]) => group.add(mesh(box(0.08, 0.08, 0.78), MAT.woodLight, { position: [x, y, 0], rotation: [0.05, 0.3, 0.08] })));
  group.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 12), MAT.stoneDark, { position: [0.5, 0.24, 0.3], rotation: [0, 0, Math.PI / 2] }));
  group.add(mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 20), MAT.paperDark, { position: [0, 0.06, 0], rotation: [-Math.PI / 2, 0, 0] }));
  group.add(mesh(new THREE.RingGeometry(0.7, 1.1, 24), MAT.foam, { position: [0, 0.02, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false }));
  return group;
}

function buildReeds(MAT) {
  const group = new THREE.Group();
  for (let i = 0; i < 13; i += 1) {
    const angle = (i / 13) * Math.PI * 2;
    const radius = 0.24 + (i % 4) * 0.15;
    const height = 1.7 + (i % 5) * 0.16;
    const stalk = mesh(new THREE.CylinderGeometry(0.018, 0.035, height, 5), MAT.reed, {
      position: [Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius * 0.7],
      rotation: [Math.cos(angle) * 0.16, 0, Math.sin(angle) * 0.16],
    });
    group.add(stalk);
    if (i % 2 === 0) {
      group.add(mesh(new THREE.ConeGeometry(0.07, 0.3, 6), MAT.woodLight, {
        position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius * 0.7], rotation: [0.3, 0, 0.2],
      }));
    }
  }
  group.add(mesh(new THREE.CircleGeometry(0.85, 16), MAT.stoneDark, { position: [0, 0.03, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false }));
  return group;
}

function buildWreck(MAT) {
  const group = new THREE.Group();
  const hull = mesh(box(1.3, 0.34, 0.7), MAT.wood, { position: [0, 0.16, 0], rotation: [0.06, 0.18, 0.12] });
  group.add(hull);
  [-0.5, -0.2, 0.2, 0.5].forEach((x, i) => group.add(mesh(box(0.07, 0.5, 0.62), MAT.woodLight, {
    position: [x, 0.45, 0], rotation: [0.1, 0.18, 0.24 + i * 0.03],
  })));
  group.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.5, 6), MAT.woodLight, { position: [0.15, 0.75, -0.1], rotation: [0.2, 0, -0.18] }));
  group.add(mesh(new THREE.RingGeometry(0.7, 0.95, 22), MAT.foam, { position: [0, 0.02, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false }));
  return group;
}

function buildShallows(MAT) {
  const group = new THREE.Group();
  const geometry = new THREE.DodecahedronGeometry(0.5, 0);
  [[-0.35, 0.04, 0.2, 1.5], [0.3, 0.02, -0.15, 1.2], [0.05, 0.01, 0.4, 0.9]].forEach(([x, y, z, scale], i) => {
    group.add(mesh(geometry, i === 1 ? MAT.stoneLight : MAT.stone, {
      position: [x, y, z], rotation: [0.2 * i, 0.9 * i, 0.1], scale: [scale, 0.16, scale * 0.8],
    }));
  });
  group.add(mesh(new THREE.RingGeometry(0.65, 1.15, 26), MAT.foam, { position: [0, 0.03, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false }));
  return group;
}

const OBSTACLES = { rock: buildRock, log: buildLog, drift: buildDrift, reeds: buildReeds, wreck: buildWreck, shallows: buildShallows };

function buildGate(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  group.position.set(0, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(CHAPTER.gate.p));
  [-3.2, 3.2].forEach((x) => {
    group.add(mesh(box(0.7, 2.4, 0.9), MAT.stone, { position: [x, 1.2, 0] }));
    group.add(mesh(box(0.82, 0.18, 1.0), MAT.stoneLight, { position: [x, 2.42, 0] }));
  });
  group.add(mesh(box(7.2, 0.34, 1.1), MAT.stone, { position: [0, 2.6, 0] }));
  group.add(mesh(box(7.3, 0.08, 1.16), MAT.stoneLight, { position: [0, 2.42, 0] }));
  group.add(mesh(box(1.2, 0.5, 0.16), MAT.wood, { position: [0, 2.28, 0.2] }));
  [-1.9, 1.9].forEach((x) => {
    group.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4), MAT.stoneDark, { position: [x, 2.12, 0.1] }));
    const lamp = glowSprite(0xffc47a, 0.5, 0.18);
    lamp.position.set(x, 1.86, 0.1);
    group.add(lamp);
    group.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), MAT.lantern, { position: [x, 1.86, 0.1], castShadow: false }));
  });
  return group;
}

function buildStranger(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  const boat = buildPaperBoat(0xe7d9bd, 1.9);
  group.add(boat);

  const robe = new THREE.MeshStandardMaterial({ color: 0x1d2b2f, roughness: 0.94 });
  const figure = new THREE.Group();
  figure.add(mesh(new THREE.ConeGeometry(0.34, 1.4, 9), robe, { position: [0, 0.72, 0] }));
  figure.add(mesh(new THREE.ConeGeometry(0.2, 0.4, 9), MAT.stoneDark, { position: [0, 1.52, 0] }));
  figure.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), MAT.stoneDark, { position: [0, 1.36, 0.04] }));
  figure.add(mesh(box(0.8, 0.05, 0.05), MAT.woodLight, { position: [0, 0.62, 0.1], rotation: [0, 0, 0.12] }));
  group.add(figure);

  const lantern = glowSprite(0xffc98f, 0.4, 0.24);
  lantern.position.set(0, 0.55, -0.55);
  group.add(lantern);

  const light = new THREE.PointLight(0xffb066, 1.2, 5, 2);
  light.position.copy(lantern.position);
  group.add(light);

  group.position.set(-3.9, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(76));
  group.rotation.y = Math.PI / 2.4;
  group.visible = false;
  return group;
}

function buildPickup(spec, MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  group.position.set(CHAPTER.lanes[spec.lane].x, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(spec.p));
  const halo = mesh(new THREE.RingGeometry(0.34, 0.46, 28), MAT.foam, { position: [0, 0.02, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false });
  group.add(halo);
  const core = new THREE.Group();
  core.position.y = 0.78;
  if (spec.kind === "memory") {
    core.add(mesh(new THREE.PlaneGeometry(0.42, 0.3), MAT.paper, { rotation: [0.18, 0.5, -0.06], castShadow: false }));
    for (let i = 0; i < 3; i += 1) core.add(mesh(box(0.3, 0.008, 0.006), MAT.stoneDark, { position: [0, 0.06 - i * 0.06, 0.01], rotation: [0.18, 0.5, -0.06], castShadow: false }));
    core.add(mesh(new THREE.ConeGeometry(0.09, 0.16, 3), MAT.paperDark, { position: [0, -0.16, 0] }));
  } else if (spec.kind === "token") {
    core.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.045, 22), MAT.brass, { rotation: [Math.PI / 2, 0, 0] }));
    core.add(mesh(new THREE.TorusGeometry(0.13, 0.02, 7, 22), MAT.brassHot, { position: [0, 0, 0.035] }));
    core.add(mesh(box(0.02, 0.12, 0.02), MAT.stoneDark, { position: [0, 0.02, 0.06], rotation: [0, 0, -0.5] }));
  } else {
    core.add(mesh(new THREE.TorusGeometry(0.22, 0.085, 12, 24), MAT.paperDark, { rotation: [Math.PI / 2, 0, 0] }));
    core.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 18), MAT.paper, { rotation: [0, 0, Math.PI / 2] }));
    const glow = glowSprite(0xffcf96, 1.5, 0.5);
    core.add(glow);
  }
  group.add(core);
  return { group, halo };
}

function buildEnvironment(scene, MAT, CHAPTER, progressToDistance) {
  const zAt = (p) => CHAPTER.startZ - progressToDistance(p);
  const group = new THREE.Group();
  scene.add(group);

  // Water sits just below the model's own river surface.
  const water = mesh(
    new THREE.PlaneGeometry(34, CHAPTER.length + 80),
    new THREE.MeshStandardMaterial({ color: 0x29444b, roughness: 0.82, metalness: 0, transparent: false, envMapIntensity: 0.12 }),
    { position: [0, WATER_Y + 0.008, CHAPTER.startZ - CHAPTER.length / 2], rotation: [-Math.PI / 2, 0, 0], castShadow: false, receiveShadow: false },
  );
  group.add(water);

  // Thin current streaks that slide toward the camera.
  const streaks = [];
  const streakMaterial = new THREE.MeshBasicMaterial({ color: 0xcfd9cf, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const streakGeometry = new THREE.PlaneGeometry(0.06, 2.4);
  for (let i = 0; i < 46; i += 1) {
    const streak = new THREE.Mesh(streakGeometry, streakMaterial);
    streak.rotation.x = -Math.PI / 2;
    streak.rotation.z = THREE.MathUtils.randFloatSpread(0.12);
    streak.position.set(THREE.MathUtils.randFloatSpread(11), WATER_Y + 0.012, CHAPTER.startZ - Math.random() * CHAPTER.length);
    streak.userData.speed = THREE.MathUtils.randFloat(1.6, 3.4);
    group.add(streak);
    streaks.push(streak);
  }

  // Lantern posts along both banks give the channel a readable edge.
  const postMaterial = MAT.wood;
  const bankLights = [];
  for (let i = 0; i < 9; i += 1) {
    const p = 6 + i * 10.5;
    const z = zAt(p);
    [-6.9, 6.9].forEach((x) => {
      const post = new THREE.Group();
      post.add(mesh(new THREE.CylinderGeometry(0.09, 0.13, 2.5, 7), postMaterial, { position: [0, 1.25, 0] }));
      post.add(mesh(box(0.04, 0.04, 0.6), postMaterial, { position: [0, 2.3, 0.26] }));
      const lamp = glowSprite(0xffc47a, 0.55, 0.18);
      lamp.position.set(0, 2.1, 0.5);
      post.add(lamp);
      post.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), MAT.lantern, { position: [0, 2.1, 0.5], castShadow: false }));
      post.position.set(x, WATER_Y - 0.1, z);
      group.add(post);
      bankLights.push(lamp);
    });
  }

  // A warm watch light and a cool fill on the water.
  const watchLight = new THREE.PointLight(0xffb066, 3, 22, 2);
  watchLight.position.set(-6, 4.2, zAt(34));
  group.add(watchLight);
  const coolLight = new THREE.PointLight(0x9fc4d6, 4, 26, 2);
  coolLight.position.set(5, 3.6, zAt(72));
  group.add(coolLight);

  // The stone pier where the river splits, just off the main channel.
  const pier = new THREE.Group();
  pier.add(mesh(box(1.5, 2.2, 3.2), MAT.stoneDark, { position: [0, 1.1, 0] }));
  pier.add(mesh(box(1.7, 0.2, 3.4), MAT.stone, { position: [0, 2.2, 0] }));
  pier.add(mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 20), MAT.brass, { position: [0, 2.5, 0], rotation: [-Math.PI / 2, 0, 0] }));
  pier.position.set(-5.2, WATER_Y, zAt(CHAPTER.signature.fork.p));
  group.add(pier);

  // The player's boat — parked at the bank until boarding.
  const boat = buildPaperBoat(0xe6d8bd, 1.2);
  const boatLantern = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), MAT.lantern);
  boatLantern.position.set(0, 0.62, -0.72);
  boat.add(boatLantern);

  const wake = new THREE.Group();
  [-1, 1].forEach((side) => {
    const ribbon = mesh(new THREE.PlaneGeometry(0.3, 4.2), MAT.foam, { position: [side * 0.55, 0.015, 2.3], rotation: [-Math.PI / 2, 0, side * 0.1], castShadow: false });
    ribbon.material = MAT.foam.clone();
    ribbon.material.opacity = 0.18;
    wake.add(ribbon);
  });
  wake.visible = false;
  boat.add(wake);

  boat.position.set(0, WATER_Y, zAt(CHAPTER.signature.boarding.start));
  boat.rotation.y = Math.PI;
  group.add(boat);

  return {
    group,
    water,
    streaks,
    boat,
    wake,
    bankLights,
    boarded: false,
  };
}

function buildDustPoints() {
  // The river keeps its own fireflies in buildEnvironment, so the shared dust
  // system stays empty instead of recycling chapter-01 coordinates.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0 }));
}

function buildPortalGlow(CHAPTER) {
  const sprite = glowSprite(0xffc98f, 3.2, 0.32);
  sprite.position.set(0, 1.8, CHAPTER.startZ - CHAPTER.length + 0.5);
  return sprite;
}

export default {
  buildMaterials,
  buildObstacle(type, MAT) { return (OBSTACLES[type] || (() => new THREE.Group()))(MAT); },
  buildGate,
  buildStranger,
  buildPickup,
  buildEnvironment,
  buildDustPoints,
  buildPortalGlow,
  buildSkyTexture,
};
