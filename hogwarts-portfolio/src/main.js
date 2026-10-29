import * as THREE from 'three';
import { ProceduralAudioEngine } from './systems/audio.js';
import { WandCursor } from './systems/cursor.js';
import { HallLighting } from './systems/lighting.js';
import { createPostProcessing } from './systems/postprocessing.js';
import { Part1Hall } from './scenes/part1-hall.js';

class App {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.mouse = { x: 0, y: 0 };
        this.clock = new THREE.Clock();

        this.initCore();
        this.initSystems();
        this.initLoader();
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
            100
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
        this.audio = new ProceduralAudioEngine();
        this.cursor = new WandCursor();
        this.lighting = new HallLighting(this.scene);
        this.post = createPostProcessing(this.renderer, this.scene, this.camera);
        this.hallScene = new Part1Hall(this.scene, this.camera, this.lighting, this.audio);
    }

    initLoader() {
        let progress = 0;
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-text');
        const actions = document.getElementById('loader-actions');
        const loader = document.getElementById('loader');

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                bar.style.width = '100%';
                text.textContent = '100%';
                actions.classList.remove('hidden');
            } else {
                bar.style.width = `${progress}%`;
                text.textContent = `${progress}%`;
            }
        }, 45);

        const dismissLoader = (withSound) => {
            this.audio.init();
            this.audio.setMuted(!withSound);
            loader.classList.add('fade-out');
            setTimeout(() => this.hallScene.startSequence(), 300);
        };

        document.getElementById('btn-enter-sound')?.addEventListener('click', () => dismissLoader(true));
        document.getElementById('btn-enter-silent')?.addEventListener('click', () => dismissLoader(false));
        document.getElementById('btn-skip-loader')?.addEventListener('click', () => dismissLoader(false));
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

        // Audio & Navigation UI
        const audioBtn = document.getElementById('audio-toggle');
        const volumeSlider = document.getElementById('volume-slider');

        audioBtn?.addEventListener('click', () => {
            const nextMuted = !this.audio.isMuted;
            this.audio.setMuted(nextMuted);
            audioBtn.textContent = nextMuted ? '🔇' : '🔊';
        });

        volumeSlider?.addEventListener('input', (e) => {
            this.audio.setVolume(parseFloat(e.target.value));
        });

        document.getElementById('btn-replay')?.addEventListener('click', () => {
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
        this.post.composer.render();
    }
}

new App();