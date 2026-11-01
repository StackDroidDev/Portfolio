import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class AboutScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned directly ahead of Great Hall at Z = -140
    this.group.position.set(0, 0, -140);
    this.scene.add(this.group);

    this.crystalBalls = [];
    this.activeBallIndex = -1;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.init();
    this.initUI();
    this.setupEventListeners();
  }

  init() {
    this.buildDivinationChamber();
    this.buildThreeCrystalBalls();
  }

  buildDivinationChamber() {
    // 1. Rich velvet room tone
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2b1c38,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.BackSide,
      emissive: 0x180b22,
      emissiveIntensity: 0.35
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d1a33,
      roughness: 0.6,
      emissive: 0x1f0b1d,
      emissiveIntensity: 0.25
    });

    // Circular stone room cylinder
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 9, 32, 1, true), wallMat);
    chamber.position.y = 2.0;
    this.group.add(chamber);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(11, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    this.group.add(floor);

    // 2. High-illumination Ambient & Accent Lights
    const ambient = new THREE.AmbientLight(0x754e99, 1.4);
    this.group.add(ambient);

    const centerWarm = new THREE.PointLight(0xffbe54, 5.5, 22, 1.0);
    centerWarm.position.set(0, 4.0, 0);
    this.group.add(centerWarm);

    const purpleUplight = new THREE.PointLight(0xb868f7, 4.5, 18, 1.2);
    purpleUplight.position.set(0, -1.0, 1.0);
    this.group.add(purpleUplight);

    // Warm Lanterns overhead
    [-3.8, 0, 3.8].forEach(x => {
      const lantern = new THREE.PointLight(0xffd175, 2.5, 8, 1.2);
      lantern.position.set(x, 3.2, 0);
      this.group.add(lantern);
    });
  }

  buildThreeCrystalBalls() {
    // 3 Prominent Front Orbs at Eye-Level
    const orbConfigs = [
      { id: 'student', x: -3.4, y: 1.2, z: 0.0, color: 0x9366f0 },
      { id: 'developer', x: 0.0, y: 1.5, z: -0.5, color: 0x3cd070 },
      { id: 'creator', x: 3.4, y: 1.2, z: 0.0, color: 0xe8a038 }
    ];

    const standMat = new THREE.MeshStandardMaterial({
      color: 0xdfab43,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x5a3c08,
      emissiveIntensity: 0.3
    });

    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x422616,
      roughness: 0.6,
      emissive: 0x1d0f08,
      emissiveIntensity: 0.2
    });

    orbConfigs.forEach((cfg, idx) => {
      const orbGroup = new THREE.Group();
      orbGroup.position.set(cfg.x, cfg.y, cfg.z);

      // Pedestal Table
      const table = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 24), tableMat);
      table.position.set(cfg.x, cfg.y - 1.1, cfg.z);
      this.group.add(table);

      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 12), tableMat);
      tableLeg.position.set(cfg.x, cfg.y - 1.9, cfg.z);
      this.group.add(tableLeg);

      // Brass Stand
      const stand = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 12, 24), standMat);
      stand.rotation.x = Math.PI / 2;
      stand.position.y = -0.55;
      orbGroup.add(stand);

      // Glass Orb Mesh
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.3,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending
      });

      const sphereGeo = new THREE.SphereGeometry(0.95, 32, 32);
      const glassMesh = new THREE.Mesh(sphereGeo, glassMat);
      glassMesh.userData = { orbIndex: idx, id: cfg.id };
      orbGroup.add(glassMesh);

      // Internal Swirling Nebula Core
      const fogMat = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uSwirl: { value: 1.2 },
          uColor: { value: new THREE.Color(cfg.color) },
          uRipple: { value: 0.0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vNormal = normal;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uSwirl;
          uniform vec3 uColor;
          uniform float uRipple;
          varying vec3 vNormal;
          varying vec3 vPos;

          void main() {
            float n = sin(vPos.x * 6.0 + uTime * uSwirl) *
                      cos(vPos.y * 6.0 - uTime * uSwirl) *
                      sin(vPos.z * 6.0 + uTime);
            float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
            float alpha = (n * 0.4 + 0.6) * 0.65 + rim * 0.45;
            alpha *= (1.0 - uRipple);
            gl_FragColor = vec4(uColor + vec3(rim * 0.5), alpha);
          }
        `
      });

      const fogMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), fogMat);
      orbGroup.add(fogMesh);

      // Mini-scene inside orb
      const miniScene = this.buildMiniScene(idx);
      orbGroup.add(miniScene);

      // Dedicated Inner Glow Light
      const innerLight = new THREE.PointLight(cfg.color, 3.5, 6.0, 1.2);
      orbGroup.add(innerLight);

      this.group.add(orbGroup);

      this.crystalBalls.push({
        group: orbGroup,
        glass: glassMesh,
        fogMat: fogMat,
        light: innerLight,
        miniScene: miniScene,
        baseY: cfg.y,
        data: content.divination.crystals[idx]
      });
    });
  }

  buildMiniScene(typeIndex) {
    const mini = new THREE.Group();

    if (typeIndex === 0) {
      // The Student: Glowing Floating Book & Gold Stars
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.08, 0.62),
        new THREE.MeshStandardMaterial({ color: 0x9e2432, emissive: 0x3d0b11 })
      );
      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.09, 0.58),
        new THREE.MeshBasicMaterial({ color: 0xfffbe6 })
      );
      mini.add(book, pages);

      for (let s = 0; s < 4; s++) {
        const star = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.06),
          new THREE.MeshBasicMaterial({ color: 0xffea78 })
        );
        const a = (s * Math.PI) / 2;
        star.position.set(Math.cos(a) * 0.45, 0.22, Math.sin(a) * 0.45);
        mini.add(star);
      }
    } else if (typeIndex === 1) {
      // The Developer: Code Matrix Rings & Core
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x58f78f, wireframe: true });
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 6, 16), ringMat);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16), ringMat);
      r2.rotation.x = Math.PI / 2;
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16),
        new THREE.MeshBasicMaterial({ color: 0x9effbf })
      );
      mini.add(r1, r2, core);
    } else {
      // The Creator: Camera & Golden Musical Clef
      const camMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x2471a3, emissive: 0x0a263d });
      const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd152 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.2), camMat);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.z = 0.12;
      mini.add(body, lens);

      const note = new THREE.Mesh(new THREE.SphereGeometry(0.06), goldMat);
      note.position.set(0.24, 0.18, 0);
      mini.add(note);
    }

    return mini;
  }

  initUI() {
    let el = document.getElementById('divination-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'divination-ui';
      document.body.appendChild(el);
    }

    el.className = 'divination-ui hidden';
    el.innerHTML = `
      <div class="divination-header">
        <p class="divination-intro">${content.divination.intro}</p>
        <span class="divination-hint">${content.divination.instructions}</span>
      </div>

      <nav class="divination-tabs" aria-label="Crystal Ball Visions">
        ${content.divination.crystals.map((c, i) => `
          <button class="orb-tab-btn" data-index="${i}" tabindex="0">${c.title}</button>
        `).join('')}
      </nav>

      <div id="crystal-story-modal" class="crystal-story-modal hidden" role="dialog" aria-modal="true">
        <button id="btn-close-crystal" class="ghost-btn close-btn" aria-label="Close vision">✕ Back</button>
        <div class="story-content">
          <span id="story-subtitle" class="story-subtitle"></span>
          <h2 id="story-title" class="story-title"></h2>
          <div id="story-lines" class="story-lines"></div>
        </div>
        <div class="story-carousel-nav">
          <button id="btn-prev-crystal" class="icon-nav-btn" aria-label="Previous Vision">←</button>
          <span id="story-counter" class="story-counter">1 / 3</span>
          <button id="btn-next-crystal" class="icon-nav-btn" aria-label="Next Vision">→</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleHover();
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('#divination-ui button, #divination-ui input')) return;
      this.handleClick();
    });

    document.querySelectorAll('.orb-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.selectBall(idx);
      });
    });

    document.getElementById('btn-close-crystal')?.addEventListener('click', () => this.closeActiveBall());
    document.getElementById('btn-prev-crystal')?.addEventListener('click', () => this.cycleBall(-1));
    document.getElementById('btn-next-crystal')?.addEventListener('click', () => this.cycleBall(1));

    window.addEventListener('keydown', (e) => {
      const ui = document.getElementById('divination-ui');
      if (!ui || ui.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        this.closeActiveBall();
      } else if (e.key === 'ArrowRight' && this.activeBallIndex !== -1) {
        this.cycleBall(1);
      } else if (e.key === 'ArrowLeft' && this.activeBallIndex !== -1) {
        this.cycleBall(-1);
      }
    });
  }

  handleHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.crystalBalls.map(b => b.glass);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      const hoveredIdx = intersects[0].object.userData.orbIndex;
      this.crystalBalls.forEach((b, i) => {
        if (i === hoveredIdx) {
          b.fogMat.uniforms.uSwirl.value = 3.5;
          b.light.intensity = 5.5;
        } else if (i !== this.activeBallIndex) {
          b.fogMat.uniforms.uSwirl.value = 1.2;
          b.light.intensity = 3.5;
        }
      });
    } else {
      document.body.style.cursor = 'default';
      this.crystalBalls.forEach((b, i) => {
        if (i !== this.activeBallIndex) {
          b.fogMat.uniforms.uSwirl.value = 1.2;
          b.light.intensity = 3.5;
        }
      });
    }
  }

  handleClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.crystalBalls.map(b => b.glass);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.orbIndex;
      this.selectBall(idx);
    }
  }

  selectBall(index) {
    this.activeBallIndex = index;
    const target = this.crystalBalls[index];
    const data = target.data;

    gsap.to(target.fogMat.uniforms.uRipple, { value: 0.9, duration: 0.8, ease: 'power2.out' });

    document.querySelectorAll('.orb-tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    const modal = document.getElementById('crystal-story-modal');
    const title = document.getElementById('story-title');
    const subtitle = document.getElementById('story-subtitle');
    const linesBox = document.getElementById('story-lines');
    const counter = document.getElementById('story-counter');

    if (modal && title && linesBox) {
      title.textContent = data.title;
      subtitle.textContent = data.subtitle;
      counter.textContent = `${index + 1} / 3`;
      linesBox.innerHTML = data.lines.map(l => `<p class="story-line">${l}</p>`).join('');
      modal.classList.remove('hidden');
    }
  }

  closeActiveBall() {
    if (this.activeBallIndex === -1) return;
    const prev = this.crystalBalls[this.activeBallIndex];
    if (prev) {
      gsap.to(prev.fogMat.uniforms.uRipple, { value: 0.0, duration: 0.5 });
    }

    this.activeBallIndex = -1;
    document.querySelectorAll('.orb-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('crystal-story-modal')?.classList.add('hidden');
  }

  cycleBall(dir) {
    let next = (this.activeBallIndex + dir) % this.crystalBalls.length;
    if (next < 0) next = this.crystalBalls.length - 1;
    this.selectBall(next);
  }

  onEnterRoom() {
    document.getElementById('divination-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    this.closeActiveBall();
    document.getElementById('divination-ui')?.classList.add('hidden');
  }

  update(time) {
    this.crystalBalls.forEach((b, i) => {
      b.group.position.y = b.baseY + Math.sin(time * 1.5 + i * 1.8) * 0.06;
      b.fogMat.uniforms.uTime.value = time;
      if (b.miniScene) {
        b.miniScene.rotation.y = time * 0.5;
      }
    });
  }
}