import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Subtle bloom glow for wand spark trail and candle flames
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.65, // strength
    0.45, // radius
    0.72  // threshold
  );
  composer.addPass(bloomPass);

  return {
    composer,
    bloomPass,
    resize: (w, h) => {
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    }
  };
}