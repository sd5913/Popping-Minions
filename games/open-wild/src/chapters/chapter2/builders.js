// Chapter 02 builders — rural obstacles, farm gate, farmer and keepsakes.
import * as THREE from "three";

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function mesh(geometry, material, options = {}) {
  const item = new THREE.Mesh(geometry, material);
  if (options.position) item.position.fromArray(options.position);
  if (options.rotation) item.rotation.set(...options.rotation);
  item.castShadow = options.castShadow ?? true;
  item.receiveShadow = options.receiveShadow ?? true;
  return item;
}

function radialTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,247,205,0.95)");
  gradient.addColorStop(1, "rgba(255,224,145,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildMaterials() {
  return {
    wood: new THREE.MeshStandardMaterial({ color: 0x806044, roughness: 0.94 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0xb49568, roughness: 0.9 }),
    hay: new THREE.MeshStandardMaterial({ color: 0xd3aa51, roughness: 1 }),
    hayLight: new THREE.MeshStandardMaterial({ color: 0xe4c66e, roughness: 1 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x46514c, roughness: 0.55, metalness: 0.45 }),
    wool: new THREE.MeshStandardMaterial({ color: 0xeee5ce, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x3b4038, roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb94d3e, roughness: 0.72 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x647849, roughness: 0.95 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf1e4c3, roughness: 0.9, side: THREE.DoubleSide }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc5a05b, roughness: 0.4, metalness: 0.5 }),
  };
}

function buildHay(MAT) {
  const group = new THREE.Group();
  group.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.12, 14), MAT.hay, { position: [0, 0.46, 0], rotation: [0, 0, Math.PI / 2] }));
  [-0.42, 0.42].forEach((x) => group.add(mesh(new THREE.TorusGeometry(0.465, 0.025, 6, 20), MAT.woodLight, { position: [x, 0.46, 0], rotation: [0, Math.PI / 2, 0] })));
  for (let i = 0; i < 9; i += 1) group.add(mesh(box(0.5, 0.015, 0.015), MAT.hayLight, { position: [(i % 3 - 1) * 0.28, 0.06, (Math.floor(i / 3) - 1) * 0.22], rotation: [0, i * 0.7, 0] }));
  return group;
}

function buildFence(MAT) {
  const group = new THREE.Group();
  [-0.58, 0.58].forEach((x) => group.add(mesh(box(0.12, 0.75, 0.12), MAT.wood, { position: [x, 0.375, 0] })));
  [0.28, 0.58].forEach((y) => group.add(mesh(box(1.34, 0.12, 0.09), MAT.woodLight, { position: [0, y, 0] })));
  return group;
}

function buildSheep(MAT) {
  const group = new THREE.Group();
  group.add(mesh(new THREE.SphereGeometry(0.4, 12, 9), MAT.wool, { position: [0, 0.48, 0] }));
  group.children[0].scale.set(1.35, 0.9, 0.85);
  group.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), MAT.dark, { position: [0.52, 0.49, 0] }));
  [-0.3, 0.28].forEach((x) => [-0.18, 0.18].forEach((z) => group.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.32, 6), MAT.dark, { position: [x, 0.16, z] }))));
  return group;
}

function buildMud() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x53665b, roughness: 0.25, metalness: 0.08 });
  [[0, 0, 0, 0.68], [0.48, 0.012, -0.22, 0.26], [-0.48, 0.014, 0.28, 0.22]].forEach(([x, y, z, r]) => {
    const patch = mesh(new THREE.CircleGeometry(r, 24), material, { position: [x, y, z], castShadow: false });
    patch.rotation.x = -Math.PI / 2;
    group.add(patch);
  });
  return group;
}

function buildCart(MAT) {
  const group = new THREE.Group();
  group.add(mesh(box(1.08, 0.16, 0.72), MAT.woodLight, { position: [0, 0.42, 0] }));
  [-0.48, 0.48].forEach((x) => group.add(mesh(box(0.09, 0.5, 0.72), MAT.wood, { position: [x, 0.65, 0] })));
  [-0.38, 0.38].forEach((z) => group.add(mesh(new THREE.TorusGeometry(0.27, 0.055, 7, 16), MAT.iron, { position: [0.57, 0.28, z], rotation: [0, Math.PI / 2, 0] })));
  group.add(mesh(box(1.1, 0.07, 0.07), MAT.wood, { position: [-0.85, 0.35, 0], rotation: [0, 0, -0.16] }));
  return group;
}

function buildApples(MAT) {
  const group = new THREE.Group();
  group.add(mesh(box(0.92, 0.42, 0.66), MAT.woodLight, { position: [0, 0.21, 0] }));
  for (let i = 0; i < 8; i += 1) {
    const apple = mesh(new THREE.SphereGeometry(0.12, 10, 8), MAT.red, { position: [(i % 3 - 1) * 0.27, 0.43 + Math.floor(i / 6) * 0.13, (Math.floor(i / 3) % 2 - 0.5) * 0.3] });
    group.add(apple);
  }
  group.add(mesh(box(0.04, 0.13, 0.04), MAT.leaf, { position: [0, 0.63, 0], rotation: [0, 0, 0.35] }));
  return group;
}

const OBSTACLES = { hay: buildHay, fence: buildFence, sheep: buildSheep, mud: buildMud, cart: buildCart, apples: buildApples };

function buildGate(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  group.position.set(0, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(CHAPTER.gate.p));
  [-3.1, 3.1].forEach((x) => group.add(mesh(box(0.2, 3.25, 0.2), MAT.wood, { position: [x, 1.62, 0] })));
  [1.35, 2.05, 2.75].forEach((y) => group.add(mesh(box(6.25, 0.14, 0.13), MAT.woodLight, { position: [0, y, 0] })));
  group.add(mesh(box(6.1, 0.12, 0.1), MAT.wood, { position: [0, 2.05, 0.02], rotation: [0, 0, 0.22] }));
  const sign = mesh(box(1.5, 0.54, 0.08), MAT.paper, { position: [0, 2.7, 0.1] });
  group.add(sign);
  return group;
}

function buildStranger(MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0x718064, roughness: 0.95 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd5b18b, roughness: 0.9 });
  group.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.75, 8), MAT.dark, { position: [0, 0.38, 0] }));
  group.add(mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.8, 10), shirt, { position: [0, 1.13, 0] }));
  group.add(mesh(new THREE.SphereGeometry(0.15, 14, 10), skin, { position: [0, 1.69, 0] }));
  group.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16), MAT.hay, { position: [0, 1.82, 0] }));
  group.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 12), MAT.hay, { position: [0, 1.9, 0] }));
  [-0.24, 0.24].forEach((x) => group.add(mesh(new THREE.CapsuleGeometry(0.045, 0.45, 4, 8), shirt, { position: [x, 1.12, 0], rotation: [0, 0, x > 0 ? -0.15 : 0.15] })));
  group.position.set(2.55, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(76));
  group.rotation.y = Math.PI / 1.75;
  group.visible = false;
  return group;
}

function buildPickup(spec, MAT, CHAPTER, progressToDistance) {
  const group = new THREE.Group();
  group.position.set(CHAPTER.lanes[spec.lane].x, CHAPTER.groundY, CHAPTER.startZ - progressToDistance(spec.p));
  const halo = mesh(new THREE.RingGeometry(0.34, 0.44, 28), new THREE.MeshBasicMaterial({ color: 0xffd68a, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }), { position: [0, 0.02, 0], castShadow: false });
  halo.rotation.x = -Math.PI / 2;
  group.add(halo);
  const core = new THREE.Group();
  core.position.y = 0.92;
  if (spec.kind === "memory") {
    core.add(mesh(new THREE.PlaneGeometry(0.42, 0.34), MAT.paper, { rotation: [0.2, 0.45, -0.08], castShadow: false }));
    core.add(mesh(box(0.32, 0.012, 0.008), MAT.leaf, { position: [0, 0, 0.015], rotation: [0.2, 0.45, -0.08], castShadow: false }));
  } else if (spec.kind === "token") {
    core.add(mesh(new THREE.SphereGeometry(0.19, 14, 10), MAT.red));
    core.add(mesh(box(0.025, 0.12, 0.025), MAT.leaf, { position: [0.03, 0.18, 0], rotation: [0, 0, 0.3] }));
  } else {
    core.add(mesh(box(0.42, 0.26, 0.3), MAT.woodLight));
    core.add(mesh(new THREE.TorusGeometry(0.09, 0.04, 8, 18), MAT.paper, { position: [0.14, 0.16, 0], rotation: [Math.PI / 2, 0, 0] }));
  }
  group.add(core);
  return { group, halo };
}

function buildDustPoints(reducedMotion) {
  const count = reducedMotion ? 70 : 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(20);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(0.3, 5.8);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(-48, 12);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.065, map: radialTexture(), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
}

function buildPortalGlow(CHAPTER) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(), color: 0xffe5a8, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  sprite.scale.set(9, 9, 1);
  sprite.position.set(0, 2.6, CHAPTER.startZ - CHAPTER.length + 0.5);
  return sprite;
}

export default {
  buildMaterials,
  buildObstacle(type, MAT) { return (OBSTACLES[type] || (() => new THREE.Group()))(MAT); },
  buildGate,
  buildStranger,
  buildPickup,
  buildDustPoints,
  buildPortalGlow,
};
