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
    model: "/models/chapter3.glb",
    transform: null,
    beforeMount(runner, scene, model) {
      scene.background = new THREE.Color(0x8e3f2c);
      scene.fog.color.set(0xbf6a47);
      scene.fog.near = 42;
      scene.fog.far = 150;
      scene.environmentIntensity = 0.35;
      runner.renderer.toneMappingExposure = 0.95;
      runner.camera.fov = 62;
      runner.camera.updateProjectionMatrix();
      if (runner.bloom) runner.bloom.strength = runner.reducedMotion ? 0.1 : 0.18;

      new THREE.TextureLoader().load("/images/chapter3-sky.jpg", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      });

      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          if (!material) return;
          // Match the stable standalone edition: converted normal maps can
          // produce black patches because their tangent basis was not retained.
          if (material.normalMap) {
            material.normalMap = null;
            material.needsUpdate = true;
          }
          material.envMapIntensity = 0.4;
          ["map", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap"].forEach((key) => {
            if (material[key]) material[key].anisotropy = Math.min(8, runner.renderer.capabilities.getMaxAnisotropy());
          });
        });
      });

      const environment = builders.buildEnvironment(scene, runner.MAT || builders.buildMaterials(), CHAPTER, progressToDistance);
      mechanics.attach(runner, environment);
    },
  },
  builders,
  hooks: mechanics,
};
