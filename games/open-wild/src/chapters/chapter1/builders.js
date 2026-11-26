// Chapter 01 Three.js builders — obstacle meshes, NPC character, gate panel,
// pickup objects, portal glow, and the dream-atmosphere dust points.
// Each builder receives the shared dependencies (scene, CHAPTER, progressToDistance,
// reducedMotion) from the runner; none of these files should import chapter data.
//
// Returns: { obstacles, pickups, gate, stranger, effects, beforeMount }

import * as THREE from "three";

function boxGeo(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

function mesh(geometry, material, options = {}) {
  const item = new THREE.Mesh(geometry, material);
  if (options.position) item.position.fromArray(options.position);
  if (options.rotation) item.rotation.set(...options.rotation);
  if (options.scale) item.scale.set(...options.scale);
  item.castShadow = options.castShadow ?? true;
  item.receiveShadow = options.receiveShadow ?? true;
  return item;
}

function makeRadialTexture(inner, outer) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.55, outer);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildMaterials() {
  return {
    paper: new THREE.MeshStandardMaterial({ color: 0xf7efdd, roughness: 0.88, metalness: 0.02 }),
    paperWarm: new THREE.MeshStandardMaterial({ color: 0xefe0bc, roughness: 0.92 }),
    paperEdge: new THREE.MeshStandardMaterial({ color: 0xd8c3a0, roughness: 0.9 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xd0674b, roughness: 0.62 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a25c, roughness: 0.38, metalness: 0.55 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x36423f, roughness: 0.55 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x2b3f4a, roughness: 0.28, metalness: 0.1 }),
    eraser: new THREE.MeshStandardMaterial({ color: 0xd66b86, roughness: 0.85 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
  };
}

function buildPencilObstacle(MAT) {
  const group = new THREE.Group();
  const barrels = new THREE.MeshStandardMaterial({ color: 0xd9b25f, roughness: 0.55 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xe8cfa0, roughness: 0.9 });
  for (let i = 0; i < 3; i += 1) {
    const y = 0.1 + i * 0.17;
    const z = (i - 1) * 0.17;
    const barrel = mesh(new THREE.CylinderGeometry(0.082, 0.082, 1.24, 10), i === 1 ? MAT.accent : barrels, {
      position: [0, y, z],
      rotation: [0, 0, Math.PI / 2],
    });
    const tip = mesh(new THREE.ConeGeometry(0.082, 0.22, 10), wood, { position: [0.72, y, z], rotation: [0, 0, -Math.PI / 2] });
    const lead = mesh(new THREE.ConeGeometry(0.032, 0.1, 8), MAT.graphite, { position: [0.86, y, z], rotation: [0, 0, -Math.PI / 2] });
    group.add(barrel, tip, lead);
  }
  return group;
}

function buildThresholdObstacle(MAT) {
  const group = new THREE.Group();
  group.add(mesh(boxGeo(1.34, 0.14, 0.62), MAT.brass, { position: [0, 0.07, 0] }));
  group.add(mesh(boxGeo(1.26, 0.06, 0.55), MAT.paper, { position: [0, 0.17, 0] }));
  for (let i = 0; i < 5; i += 1) {
    group.add(mesh(boxGeo(0.016, 0.008, 0.06), MAT.graphite, { position: [-0.5 + i * 0.25, 0.205, 0] }));
  }
  group.add(mesh(boxGeo(0.06, 0.06, 0.5), MAT.accent, { position: [0.56, 0.16, 0] }));
  group.add(mesh(boxGeo(0.06, 0.06, 0.5), MAT.accent, { position: [-0.56, 0.16, 0] }));
  return group;
}

function buildCardObstacle(MAT) {
  const group = new THREE.Group();
  group.add(mesh(boxGeo(1.02, 0.9, 0.055), MAT.paper, { position: [0, 0.55, 0] }));
  group.add(mesh(boxGeo(1.04, 0.05, 0.065), MAT.brass, { position: [0, 0.99, 0] }));
  group.add(mesh(boxGeo(1.04, 0.05, 0.065), MAT.brass, { position: [0, 0.11, 0] }));
  for (let i = 0; i < 6; i += 1) {
    group.add(mesh(boxGeo(0.62 - i * 0.03, 0.016, 0.008), MAT.graphite, { position: [-0.12, 0.84 - i * 0.1, 0.033] }));
  }
  group.add(mesh(new THREE.TorusGeometry(0.085, 0.011, 6, 20), MAT.accent, { position: [0.33, 0.29, 0.035] }));
  group.add(mesh(boxGeo(0.09, 0.12, 0.06), MAT.paperEdge, { position: [-0.42, 0.07, 0] }));
  group.add(mesh(boxGeo(0.09, 0.12, 0.06), MAT.paperEdge, { position: [0.42, 0.07, 0] }));
  return group;
}

function buildInkObstacle(MAT) {
  const group = new THREE.Group();
  const puddleMaterial = new THREE.MeshStandardMaterial({ color: 0x2c4452, roughness: 0.22, metalness: 0.15, transparent: true, opacity: 0.94 });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.58, 28), puddleMaterial);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.012;
  puddle.receiveShadow = true;
  group.add(puddle);
  [[0.62, 0.05, 0.22], [-0.55, 0.02, -0.3], [0.18, 0.01, 0.6]].forEach(([x, y, z]) => {
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), puddleMaterial);
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(x, y + 0.014, z - 0.3);
    group.add(blob);
  });
  return group;
}

function buildEraserObstacle(MAT) {
  const group = new THREE.Group();
  group.add(mesh(boxGeo(1.06, 0.46, 0.42), MAT.eraser, { position: [0, 0.23, 0] }));
  group.add(mesh(boxGeo(1.07, 0.16, 0.43), MAT.paper, { position: [0, 0.27, 0] }));
  group.add(mesh(boxGeo(0.7, 0.05, 0.02), MAT.graphite, { position: [0, 0.27, 0.222] }));
  return group;
}

function buildPapersObstacle(MAT) {
  const group = new THREE.Group();
  group.add(mesh(boxGeo(1.16, 0.42, 0.66), MAT.paperWarm, { position: [0, 0.21, 0] }));
  for (let i = 0; i < 4; i += 1) {
    group.add(
      mesh(boxGeo(1.08, 0.018, 0.6), MAT.paper, {
        position: [THREE.MathUtils.randFloatSpread(0.06), 0.44 + i * 0.02, THREE.MathUtils.randFloatSpread(0.05)],
        rotation: [0, THREE.MathUtils.randFloatSpread(0.06), THREE.MathUtils.randFloatSpread(0.03)],
      }),
    );
  }
  group.add(mesh(boxGeo(0.16, 0.05, 0.68), MAT.accent, { position: [0.3, 0.47, 0] }));
  return group;
}

const OBSTACLE_BUILDERS = {
  pencil: buildPencilObstacle,
  threshold: buildThresholdObstacle,
  card: buildCardObstacle,
  ink: buildInkObstacle,
  eraser: buildEraserObstacle,
  papers: buildPapersObstacle,
};

function buildGate(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  const d = progressToDistance(CHAPTER.gate.p);
  group.position.set(0, CHAPTER.groundY, CHAPTER.startZ - d);
  group.add(mesh(boxGeo(6.3, 2.1, 0.07), MAT.paper, { position: [0, 2.36, 0], rotation: [0.035, 0, 0] }));
  group.add(mesh(boxGeo(6.34, 0.09, 0.1), MAT.brass, { position: [0, 3.4, 0.02] }));
  group.add(mesh(boxGeo(6.34, 0.09, 0.1), MAT.brass, { position: [0, 1.32, 0.02] }));
  for (let i = 0; i < 9; i += 1) {
    group.add(
      mesh(boxGeo(4.9 - i * 0.18, 0.028, 0.012), MAT.graphite, {
        position: [-0.35, 3.06 - i * 0.19, 0.045],
        castShadow: false,
      }),
    );
  }
  group.add(mesh(new THREE.TorusGeometry(0.22, 0.028, 8, 26), MAT.accent, { position: [2.15, 2.02, 0.05] }));
  group.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.4, 8), MAT.brass, { position: [-3.12, 1.7, 0] }));
  group.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.4, 8), MAT.brass, { position: [3.12, 1.7, 0] }));
  return group;
}

function buildStranger(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: 0x5c6d66, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe6c6a4, roughness: 0.85 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x3c4642, roughness: 0.9 });
  group.add(
    mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.78, 8), trousers, { position: [0, 0.39, 0] }),
    mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.82, 10), jacket, { position: [0, 1.16, 0] }),
    mesh(new THREE.SphereGeometry(0.15, 16, 12), skin, { position: [0, 1.74, 0] }),
    mesh(new THREE.CapsuleGeometry(0.045, 0.48, 4, 8), jacket, { position: [-0.24, 1.14, 0.02], rotation: [0, 0, 0.16] }),
    mesh(new THREE.CapsuleGeometry(0.045, 0.48, 4, 8), jacket, { position: [0.24, 1.14, -0.02], rotation: [0, 0, -0.16] }),
    mesh(new THREE.TorusGeometry(0.155, 0.045, 6, 16), new THREE.MeshStandardMaterial({ color: 0xd0674b, roughness: 0.85 }), { position: [0, 1.55, 0], rotation: [Math.PI / 2, 0, 0] }),
  );
  group.position.set(2.5, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(76));
  group.rotation.y = Math.PI / 1.75;
  group.visible = false;
  return group;
}

function buildPickupCore(spec, MAT) {
  const core = new THREE.Group();
  core.position.y = 0.92;
  if (spec.kind === "memory") {
    const sheet = mesh(new THREE.PlaneGeometry(0.34, 0.42), MAT.paper, { castShadow: false });
    sheet.rotation.set(0.22, 0.5, -0.1);
    core.add(sheet);
    for (let i = 0; i < 4; i += 1) {
      core.add(mesh(boxGeo(0.2, 0.008, 0.004), MAT.graphite, { position: [0, 0.1 - i * 0.07, 0.005], rotation: [0.22, 0.5, -0.1], castShadow: false }));
    }
  } else if (spec.kind === "token") {
    const disc = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.022, 22), MAT.brass, { rotation: [Math.PI / 2, 0, 0] });
    core.add(disc);
    const ring = mesh(new THREE.TorusGeometry(0.13, 0.014, 6, 22), MAT.accent, { castShadow: false });
    ring.position.z = 0.02;
    core.add(ring);
  } else {
    core.add(mesh(boxGeo(0.42, 0.26, 0.3), MAT.paperWarm, { position: [0.05, -0.02, 0] }));
    core.add(mesh(boxGeo(0.14, 0.27, 0.31), MAT.accent, { position: [-0.13, -0.02, 0] }));
    const roll = mesh(new THREE.TorusGeometry(0.09, 0.045, 8, 18), MAT.paper, { position: [0.16, 0.16, 0], rotation: [Math.PI / 2, 0, 0] });
    core.add(roll);
  }
  return core;
}

function buildPickup(spec, MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  const lane = CHAPTER.lanes[spec.lane];
  const d = progressToDistance(spec.p);
  group.position.set(lane.x, CHAPTER.groundY, CHAPTER.startZ - d);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.44, 28),
    new THREE.MeshBasicMaterial({ color: 0xffdca0, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  group.add(halo);
  group.add(buildPickupCore(spec, MAT));
  return { group, halo };
}

function buildDustPoints(reducedMotion) {
  const count = reducedMotion ? 90 : 220;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(17);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(0.25, 6.4);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(-34, 5);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.07,
    map: makeRadialTexture("rgba(255,246,222,0.95)", "rgba(255,226,170,0.3)"),
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function buildPortalGlow(CHAPTER) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeRadialTexture("rgba(255,238,198,0.95)", "rgba(255,198,120,0.35)"),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sprite.scale.set(7.5, 7.5, 1);
  sprite.position.set(0, 2.4, CHAPTER.startZ - CHAPTER.length + 0.4);
  return sprite;
}

export default {
  buildMaterials,
  buildObstacle(type, MAT) {
    const fn = OBSTACLE_BUILDERS[type];
    if (!fn) return new THREE.Group();
    return fn(MAT);
  },
  buildGate,
  buildStranger,
  buildPickup,
  buildDustPoints,
  buildPortalGlow,
};
