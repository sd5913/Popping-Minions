import * as THREE from "three";
import { CHAPTER, FEEDBACK, NARRATION, DIALOGUE, COPY, progressToDistance } from "./data.js";
import builders from "./builders.js";
import { createMechanics } from "./mechanics.js";

const mechanics = createMechanics(CHAPTER, progressToDistance);

export default {
  id: CHAPTER.id,
  number: CHAPTER.number,
  title: CHAPTER.title,
  series: CHAPTER.series,
  data: CHAPTER,
  copy: COPY,
  feedback: FEEDBACK,
  narration: NARRATION,
  dialogue: DIALOGUE,
  progressToDistance,
  scene: {
    model: "/models/chapter4.glb",
    transform: null,
    beforeMount(runner, scene, model) {
      // The source blend keeps its river surface at y ≈ -3.46. Lift the whole
      // diorama so that water lines up with the chapter's ground plane.
      model.position.y += 3.48;
      model.updateMatrixWorld(true);

      scene.background = builders.buildSkyTexture();
      scene.fog.color.set(0x465e66);
      scene.fog.near = 18;
      scene.fog.far = 88;
      scene.environmentIntensity = 0.42;
      runner.renderer.toneMappingExposure = 0.86;
      runner.camera.fov = 64;
      runner.camera.updateProjectionMatrix();
      if (runner.bloom) runner.bloom.strength = runner.reducedMotion ? 0.05 : 0.08;

      const dusk = new THREE.DirectionalLight(0xffb178, 0.9);
      dusk.position.set(-9, 9, 6);
      scene.add(dusk);
      const rim = new THREE.DirectionalLight(0x8fb6c9, 0.4);
      rim.position.set(7, 5, -14);
      scene.add(rim);
      const lowFill = new THREE.HemisphereLight(0x9aacb8, 0x22343a, 0.6);
      scene.add(lowFill);

      const bounds = new THREE.Box3();
      const size = new THREE.Vector3();
      const debris = [];
      const corridorStart = CHAPTER.startZ + 4;
      const corridorEnd = CHAPTER.startZ - CHAPTER.length - 4;
      model.traverse((node) => {
        if (!node.isMesh) return;
        if (node.geometry) {
          bounds.setFromObject(node).getSize(size);
          // Broken pavilion roofs export 130–170 units wide.
          if (Math.max(size.x, size.y, size.z) > 100) {
            debris.push(node);
            return;
          }
          const box = new THREE.Box3().setFromObject(node);
          // The source diorama has rocks, scrolls and mountains standing in
          // the river. Keep the banks, clear the three-lane water corridor.
          const inCorridor = box.max.x > -5.2 && box.min.x < 5.2
            && box.max.z > corridorEnd && box.min.z < corridorStart
            && box.max.y > -2 && box.min.y < 8;
          const tallSliver = size.y > 24 && box.max.x > -9 && box.min.x < 9;
          const overheadSliver = box.min.y > 4 && box.max.z > corridorEnd && box.min.z < corridorStart;
          if (inCorridor || tallSliver || overheadSliver) {
            debris.push(node);
            return;
          }
        }
        node.castShadow = false;
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          if (!material) return;
          // Converted normal maps can produce black patches because their
          // tangent basis was not retained by the exporter.
          if (material.normalMap) {
            material.normalMap = null;
            material.needsUpdate = true;
          }
          material.envMapIntensity = 0.12;
          // The blend uses emission/ramp ink shaders that glTF flattens into
          // metallic black with a white emissive. Keep the matte silhouettes
          // and tint the paper-white emissive into warm rice paper.
          if (material.isMeshStandardMaterial) {
            material.metalness = 0;
            material.roughness = 1;
          }
          if (material.emissive && material.emissive.r + material.emissive.g + material.emissive.b > 0.5) {
            let hash = 0;
            for (const character of material.name || "") hash = (hash * 31 + character.charCodeAt(0)) % 997;
            material.emissive.setHex([0x66726c, 0x6d7063, 0x70756b, 0x5d6b68][hash % 4]);
            material.emissiveIntensity = 0.28;
            material.color.setHex([0xa8aa99, 0x9ca494, 0xb0ad99, 0x96a39b][hash % 4]);
          }
          ["map", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap"].forEach((key) => {
            if (material[key]) material[key].anisotropy = Math.min(8, runner.renderer.capabilities.getMaxAnisotropy());
          });
        });
      });
      debris.forEach((node) => { node.visible = false; });

      const environment = builders.buildEnvironment(scene, runner.MAT || builders.buildMaterials(), CHAPTER, progressToDistance);
      mechanics.attach(runner, environment);
    },
  },
  builders,
  hooks: mechanics,
};
