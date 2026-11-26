import { CHAPTER, FEEDBACK, NARRATION, DIALOGUE, COPY, progressToDistance } from "./data.js";
import builders from "./builders.js";

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
    model: "/models/chapter2.glb",
    // Blender's glTF exporter already converts Z-up to Three.js Y-up.
    transform: null,
    beforeMount(runner, scene, model) {
      scene.background.set(0xc9d8c2);
      scene.fog.color.set(0xc9d8c2);
      scene.fog.near = 34;
      scene.fog.far = 105;
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false; // merged environment: keep the shadow budget for gameplay
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => { if (material) material.envMapIntensity = 0.45; });
      });
    },
  },
  builders,
  hooks: {},
};
