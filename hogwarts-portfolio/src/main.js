import * as THREE from 'three';
import { WandCursor } from './systems/cursor.js';
import { HallLighting } from './systems/lighting.js';
import { createPostProcessing } from './systems/postprocessing.js';
import { Part1Hall } from './scenes/part1-hall.js';
import { HouseThemeManager } from './systems/houseTheme.js';
import { ScrollManager } from './systems/scrollManager.js';
import { SortingHatScene } from './scenes/sortingHat.js';
import { GreatHallScene } from './scenes/greatHall.js';

class App {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.mouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();

    this.initLoader();
    this.initCore();
    this.initSystems();
    this.bindEvents();
    this.animate();
  }

  initCore() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070b1a, 0.035);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      150
    );
    this.camera.position.set(0, 0, 9.5);
    this.camera.lookAt(0, 0, 0);

    const isMobile = window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = !isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initSystems() {
    this.cursor = new WandCursor();
    this.lighting = new HallLighting(this.scene);
    this.post = createPostProcessing(this.renderer, this.scene, this.camera);

    // Part 1
    this.hallScene = new Part1Hall(this.scene, this.camera, this.lighting);

    // Part 2
    this.houseTheme = new HouseThemeManager();
    this.scrollManager = new ScrollManager(this.camera);
    this.sortingHatScene = new SortingHatScene(this.scene, this.houseTheme, this.scrollManager);
    this.greatHallScene = new GreatHallScene(this.scene, this.houseTheme);

    this.scrollManager.onRoomChange((roomIndex) => {
      const p1Role = document.getElementById('role-subtitle');
      const p1Hint = document.getElementById('scroll-hint');

      if (roomIndex === 0) {
        // In Room 1 (Name Reveal)
        if (this.hallScene.solidTextGroup) this.hallScene.solidTextGroup.material.opacity = 1;
        if (p1Role) p1Role.style.display = 'block';
        if (p1Hint) p1Hint.style.display = 'flex';
        document.getElementById('sorting-hat-ui')?.classList.add('hidden');
        this.greatHallScene.onLeaveRoom();
      } else if (roomIndex === 1) {
        // In Room 2 (Sorting Hat)
        if (this.hallScene.solidTextGroup) this.hallScene.solidTextGroup.material.opacity = 0;
        if (p1Role) p1Role.style.display = 'none';
        if (p1Hint) p1Hint.style.display = 'none';
        this.sortingHatScene.onEnterRoom();
        this.greatHallScene.onLeaveRoom();
      } else if (roomIndex === 2) {
        // In Room 3 (Great Hall)
        if (this.hallScene.solidTextGroup) this.hallScene.solidTextGroup.material.opacity = 0;
        document.getElementById('sorting-hat-ui')?.classList.add('hidden');
        this.greatHallScene.onEnterRoom();
      }
    });
  }

  initLoader() {
    let progress = 0;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    const actions = document.getElementById('loader-actions');
    const loader = document.getElementById('loader');

    if (!bar || !text || !loader) return;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        bar.style.width = '100%';
        text.textContent = '100%';
        if (actions) actions.classList.remove('hidden');
      } else {
        bar.style.width = `${progress}%`;
        text.textContent = `${progress}%`;
      }
    }, 35);

    const dismissLoader = () => {
      loader.classList.add('fade-out');
      setTimeout(() => this.hallScene.startSequence(), 300);
    };

    document.getElementById('btn-enter')?.addEventListener('click', dismissLoader);
    document.getElementById('btn-skip-loader')?.addEventListener('click', dismissLoader);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.post.resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    document.getElementById('btn-replay')?.addEventListener('click', () => {
      this.scrollManager.scrollToRoom(0, 1.0);
      this.hallScene.startSequence();
    });

    document.getElementById('btn-skip-intro')?.addEventListener('click', () => {
      this.hallScene.skipToEnd();
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.lighting.update(time);
    this.hallScene.update(delta, time, this.mouse);

    this.scrollManager.update(this.mouse);
    this.sortingHatScene.update(time);
    this.greatHallScene.update(time, this.mouse);

    this.post.composer.render();
  }
}

new App(); 
