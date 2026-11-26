// Chapter 03 builders — Clock City ruins, broken spans and bridge builder.
import * as THREE from "three";

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const clamp = THREE.MathUtils.clamp;

function mesh(geometry, material, options = {}) {
  const item = new THREE.Mesh(geometry, material);
  if (options.position) item.position.fromArray(options.position);
  if (options.rotation) item.rotation.set(...options.rotation);
  if (options.scale) item.scale.fromArray(options.scale);
  item.castShadow = options.castShadow ?? true;
  item.receiveShadow = options.receiveShadow ?? true;
  return item;
}

function radialTexture(inner = "rgba(255,220,160,1)", outer = "rgba(255,150,60,0)") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildMaterials() {
  return {
    stone: new THREE.MeshStandardMaterial({ color: 0x665044, roughness: 0.92, metalness: 0.04 }),
    stoneLight: new THREE.MeshStandardMaterial({ color: 0x8a7160, roughness: 0.9, metalness: 0.03 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x2d2220, roughness: 0.96, metalness: 0.02 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc89443, roughness: 0.3, metalness: 0.78 }),
    goldHot: new THREE.MeshStandardMaterial({ color: 0xf0c579, roughness: 0.24, metalness: 0.55, emissive: 0xff9c3f, emissiveIntensity: 0.75 }),
    darkDoor: new THREE.MeshStandardMaterial({ color: 0x33211a, roughness: 0.84, metalness: 0.16 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x563b2d, roughness: 0.94 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.92, side: THREE.DoubleSide }),
    ink: new THREE.MeshStandardMaterial({ color: 0x49352d, roughness: 0.8 }),
    ember: new THREE.MeshBasicMaterial({ color: 0xffb35f, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }),
  };
}

function buildRock(MAT) {
  const group = new THREE.Group();
  const geometry = new THREE.DodecahedronGeometry(0.62, 0);
  [[-0.35, 0.4, 0.1, 0.9], [0.3, 0.47, -0.18, 1.05], [0.02, 0.26, 0.38, 0.62]].forEach(([x, y, z, scale], i) => {
    group.add(mesh(geometry, i === 1 ? MAT.stoneLight : MAT.stone, {
      position: [x, y, z], rotation: [i * 0.8, i * 1.3, i * 0.4], scale: [scale, scale * 0.75, scale],
    }));
  });
  return group;
}

function buildSlab(MAT) {
  const group = new THREE.Group();
  group.add(mesh(box(1.62, 0.48, 0.86), MAT.stone, { position: [0, 0.25, 0], rotation: [0.03, -0.08, 0.08] }));
  group.add(mesh(box(1.48, 0.06, 0.08), MAT.gold, { position: [0, 0.51, 0.34], rotation: [0, -0.08, 0.08] }));
  group.add(mesh(new THREE.TorusGeometry(0.18, 0.035, 7, 20), MAT.goldHot, { position: [0.36, 0.53, -0.08], rotation: [-Math.PI / 2, 0, 0] }));
  return group;
}

function buildFalling(MAT) {
  const group = new THREE.Group();
  const core = mesh(box(0.94, 0.94, 0.7), MAT.stoneDark, { position: [0, 0.51, 0], rotation: [0.08, 0.12, 0.08] });
  group.add(core);
  group.add(mesh(new THREE.TorusGeometry(0.58, 0.075, 8, 24), MAT.gold, { position: [0, 0.62, 0.39] }));
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    group.add(mesh(box(0.16, 0.14, 0.12), MAT.goldHot, {
      position: [Math.cos(angle) * 0.62, 0.62 + Math.sin(angle) * 0.62, 0.39], rotation: [0, 0, angle],
    }));
  }
  group.add(mesh(new THREE.RingGeometry(0.75, 0.8, 32), MAT.ember, { position: [0, 0.025, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false }));
  return group;
}

function buildDoor(MAT) {
  const group = new THREE.Group();
  [-0.7, 0.7].forEach((x) => group.add(mesh(box(0.14, 2.5, 0.28), MAT.gold, { position: [x, 1.25, 0] })));
  group.add(mesh(box(1.54, 0.16, 0.28), MAT.gold, { position: [0, 2.48, 0] }));
  group.add(mesh(box(1.24, 2.28, 0.12), MAT.darkDoor, { position: [0, 1.25, 0] }));
  group.add(mesh(box(0.025, 2.1, 0.15), MAT.goldHot, { position: [0, 1.25, 0.04] }));
  [0.65, 1.25, 1.85].forEach((y) => group.add(mesh(box(1.14, 0.055, 0.16), MAT.gold, { position: [0, y, 0.04] })));
  group.add(mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 22), MAT.goldHot, { position: [0, 1.25, 0.13] }));
  group.rotation.z = 0.045;
  return group;
}

function buildBeam(MAT) {
  const group = new THREE.Group();
  group.add(mesh(box(1.5, 0.28, 0.4), MAT.wood, { position: [0, 0.38, 0], rotation: [0.08, 0.2, -0.18] }));
  group.add(mesh(box(0.16, 0.7, 0.18), MAT.stone, { position: [-0.48, 0.35, 0.12], rotation: [0.15, 0, 0.2] }));
  [-0.45, 0.45].forEach((x) => group.add(mesh(new THREE.TorusGeometry(0.18, 0.028, 6, 16), MAT.gold, { position: [x, 0.39, 0], rotation: [0, Math.PI / 2, 0] })));
  return group;
}

function buildGears(MAT) {
  const group = new THREE.Group();
  [[-0.35, 0.33, 0.05, 0.4], [0.28, 0.25, 0.15, 0.3], [0.18, 0.52, -0.2, 0.25]].forEach(([x, y, z, radius], index) => {
    const gear = new THREE.Group();
    gear.add(mesh(new THREE.TorusGeometry(radius, 0.065, 7, 20), index === 1 ? MAT.goldHot : MAT.gold));
    gear.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10), MAT.stoneDark, { rotation: [Math.PI / 2, 0, 0] }));
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      gear.add(mesh(box(0.1, 0.12, 0.1), MAT.gold, { position: [Math.cos(angle) * (radius + 0.055), Math.sin(angle) * (radius + 0.055), 0], rotation: [0, 0, angle] }));
    }
    gear.position.set(x, y, z);
    gear.rotation.set(index * 0.35, index * 0.2, index * 0.6);
    group.add(gear);
  });
  return group;
}

const OBSTACLES = { rock: buildRock, slab: buildSlab, falling: buildFalling, door: buildDoor, beam: buildBeam, gears: buildGears };

function buildGate(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  group.position.set(0, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(CHAPTER.gate.p));
  [-3.15, 3.15].forEach((x) => {
    group.add(mesh(box(0.24, 3.4, 0.3), MAT.stoneDark, { position: [x, 1.7, 0] }));
    group.add(mesh(box(0.32, 0.12, 0.38), MAT.gold, { position: [x, 1.42, 0] }));
  });
  group.add(mesh(box(6.5, 0.3, 0.42), MAT.stoneDark, { position: [0, 1.52, 0] }));
  group.add(mesh(box(6.45, 0.06, 0.46), MAT.goldHot, { position: [0, 1.35, 0] }));
  group.add(mesh(new THREE.TorusGeometry(0.5, 0.055, 8, 28), MAT.gold, { position: [0, 2.32, 0.04] }));
  group.add(mesh(box(0.035, 0.38, 0.04), MAT.goldHot, { position: [0, 2.45, 0.1], rotation: [0, 0, -0.45] }));
  group.add(mesh(box(0.03, 0.28, 0.04), MAT.goldHot, { position: [0.08, 2.24, 0.1], rotation: [0, 0, 1.0] }));
  return group;
}

function buildStranger(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  const robe = new THREE.MeshStandardMaterial({ color: 0x1c1314, roughness: 0.94 });
  group.add(mesh(new THREE.ConeGeometry(0.62, 2.1, 9), robe, { position: [0, 1.05, 0] }));
  group.add(mesh(new THREE.ConeGeometry(0.34, 0.6, 9), MAT.stoneDark, { position: [0, 2.2, 0] }));
  group.add(mesh(new THREE.SphereGeometry(0.18, 12, 10), MAT.darkDoor, { position: [0, 2.02, 0] }));
  group.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), robe, { position: [-0.36, 1.75, 0.05], rotation: [0, 0, 0.7] }));
  group.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), MAT.goldHot, { position: [-0.48, 1.45, 0.1] }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(), color: 0xffb35f, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(-0.48, 1.45, 0.1);
  glow.scale.set(1.5, 1.5, 1);
  group.add(glow);
  const light = new THREE.PointLight(0xffa95c, 7, 7, 2);
  light.position.copy(glow.position);
  group.add(light);
  group.position.set(-3.5, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(76));
  group.rotation.y = Math.PI / 1.75;
  group.visible = false;
  return group;
}

function buildPickup(spec, MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  group.position.set(CHAPTER.lanes[spec.lane].x, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(spec.p));
  const halo = mesh(new THREE.RingGeometry(0.34, 0.44, 28), new THREE.MeshBasicMaterial({ color: 0xffc77c, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), { position: [0, 0.02, 0], rotation: [-Math.PI / 2, 0, 0], castShadow: false });
  group.add(halo);
  const core = new THREE.Group();
  core.position.y = 0.92;
  if (spec.kind === "memory") {
    core.add(mesh(new THREE.PlaneGeometry(0.4, 0.48), MAT.paper, { rotation: [0.2, 0.4, -0.08], castShadow: false }));
    for (let i = 0; i < 4; i += 1) core.add(mesh(box(0.24, 0.009, 0.006), MAT.ink, { position: [0, 0.12 - i * 0.075, 0.012], rotation: [0.2, 0.4, -0.08], castShadow: false }));
  } else if (spec.kind === "token") {
    core.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 24), MAT.gold, { rotation: [Math.PI / 2, 0, 0] }));
    core.add(mesh(new THREE.TorusGeometry(0.14, 0.022, 7, 24), MAT.goldHot, { position: [0, 0, 0.035] }));
    core.add(mesh(box(0.025, 0.13, 0.02), MAT.stoneDark, { position: [0, 0.035, 0.06], rotation: [0, 0, -0.4] }));
  } else {
    core.add(mesh(new THREE.TorusGeometry(0.27, 0.09, 12, 26), MAT.goldHot, { rotation: [Math.PI / 2, 0, 0] }));
    core.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 20), MAT.paper, { rotation: [0, 0, Math.PI / 2] }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(), color: 0xffc77c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(1.7, 1.7, 1);
    core.add(glow);
  }
  group.add(core);
  return { group, halo };
}

function buildEnvironment(scene, MAT, CHAPTER, progressToDistance) {
  const zAt = (p) => CHAPTER.startZ - progressToDistance(p);
  const { firstGap, repair } = CHAPTER.signature;

  const addGap = (start, end) => {
    const near = zAt(start);
    const far = zAt(end);
    const length = Math.abs(far - near);
    const center = (near + far) / 2;
    const voidMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0706, side: THREE.DoubleSide, fog: false });
    group.add(mesh(new THREE.PlaneGeometry(9.6, length + 0.25), voidMaterial, { position: [0, CHAPTER.groundY + 0.015, center], rotation: [-Math.PI / 2, 0, 0], castShadow: false, receiveShadow: false }));
    const rockGeometry = new THREE.DodecahedronGeometry(0.48, 0);
    [-4.4, -3.3, -2.2, 2.2, 3.3, 4.4].forEach((x, i) => {
      [near, far].forEach((z, side) => group.add(mesh(rockGeometry, (i + side) % 2 ? MAT.stone : MAT.stoneDark, {
        position: [x, 0.2, z + (side ? -0.12 : 0.12)], rotation: [i * 0.7, i * 1.1, side * 0.4], scale: [1, 0.7, 1],
      })));
    });
    const light = new THREE.PointLight(0xff8a45, 4, 9, 2);
    light.position.set(0, 0.8, center);
    group.add(light);
    return { near, far, length, center };
  };

  const group = new THREE.Group();
  scene.add(group);
  addGap(firstGap.start, firstGap.end);
  const finalGap = addGap(repair.start + 1, repair.end);

  const firstNear = zAt(firstGap.start);
  const lowerLength = firstNear - finalGap.near + 5;
  const lower = mesh(box(12.5, 0.45, Math.max(8, lowerLength)), MAT.stoneDark, { position: [0, -3.8, firstNear - lowerLength / 2], castShadow: false });
  group.add(lower);

  const bridge = new THREE.Group();
  bridge.position.z = finalGap.center;
  const planks = [];
  const count = 9;
  const step = (finalGap.length - 0.3) / count;
  for (let i = 0; i < count; i += 1) {
    const plank = new THREE.Group();
    plank.add(mesh(box(6.4, 0.14, step * 0.86), MAT.stone));
    plank.add(mesh(box(6.5, 0.045, step * 0.09), MAT.goldHot, { position: [0, 0.09, step * 0.45] }));
    const targetZ = finalGap.near - 0.25 - i * step - finalGap.center;
    plank.position.set(0, -4.5, targetZ);
    plank.visible = false;
    plank.userData = { targetY: CHAPTER.groundY + 0.08, targetZ, delay: i * 0.065, progress: 0 };
    bridge.add(plank);
    planks.push(plank);
  }
  const bridgeLight = new THREE.PointLight(0xffb45c, 0, 24, 2);
  bridgeLight.position.set(0, 2.2, 0);
  bridge.add(bridgeLight);
  group.add(bridge);

  const watchLight = new THREE.PointLight(0xff9d55, 22, 28, 2);
  watchLight.position.set(7, 7.9, 1);
  group.add(watchLight);

  return { group, bridge: { group: bridge, planks, light: bridgeLight, active: false, progress: 0 } };
}

function buildDustPoints(reducedMotion) {
  const count = reducedMotion ? 80 : 240;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(24);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(0.2, 8.5);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(-82, 16);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffcf96, size: 0.075, map: radialTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
}

function buildPortalGlow(CHAPTER) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(), color: 0xffb35f, transparent: true, opacity: 0.62, depthWrite: false, blending: THREE.AdditiveBlending }));
  sprite.scale.set(10, 10, 1);
  sprite.position.set(0, 2.6, CHAPTER.startZ - CHAPTER.length + 0.5);
  return sprite;
}

function updateBridge(bridge, dt) {
  if (!bridge?.active || bridge.progress >= 1) return;
  bridge.progress = clamp(bridge.progress + dt / 1.5, 0, 1);
  bridge.planks.forEach((plank) => {
    const t = clamp((bridge.progress - plank.userData.delay) / 0.55, 0, 1);
    if (t <= 0) return;
    const eased = 1 - Math.pow(1 - t, 3);
    plank.visible = true;
    plank.position.y = -4.5 + (plank.userData.targetY + 4.5) * eased;
    plank.position.z = plank.userData.targetZ;
    plank.rotation.z = (1 - eased) * 0.35;
  });
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
  updateBridge,
};
