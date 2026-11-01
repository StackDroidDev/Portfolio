import * as THREE from 'three';
import { content } from '../content.js';

export class TimelineScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned below Divination Chamber through the floor hole at Z = -245
    this.group.position.set(0, -6.0, -245);
    this.scene.add(this.group);

    this.movingStairs = [];
    this.portraits = [];
    this.milestoneCards3D = [];
    this.towerHeight = 48;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildGrandStairHall();
    this.buildMagicalMovingStaircases();
    this.buildWatchingPortraits();
    this.buildMilestoneLandings();
  }

  buildGrandStairHall() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1b2030,
      roughness: 0.85,
      metalness: 0.12
    });

    // Massive square medieval stairwell shaft (24 x 24 x 50)
    const shaftGeo = new THREE.BoxGeometry(24, this.towerHeight, 24);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x151928,
      roughness: 0.9,
      side: THREE.BackSide
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = this.towerHeight / 2 - 10;
    this.group.add(shaft);

    // Warm ambient and architectural shaft lighting
    const amb = new THREE.AmbientLight(0x192138, 0.85);
    this.group.add(amb);

    for (let y = 0; y <= this.towerHeight; y += 14) {
      const pLight = new THREE.PointLight(0xe8b04a, 2.2, 18, 1.4);
      pLight.position.set(0, y - 8, 0);
      this.group.add(pLight);
    }
  }

  buildMagicalMovingStaircases() {
    const stairWoodMat = new THREE.MeshStandardMaterial({
      color: 0x2e1d13,
      roughness: 0.75,
      metalness: 0.1
    });

    const banisterMat = new THREE.MeshStandardMaterial({
      color: 0xab7d2d,
      roughness: 0.35,
      metalness: 0.85
    });

    // 4 Independent Moving Flight Sections across elevations
    const stairConfigs = [
      { y: -2, length: 10, pivotX: -3.5, pivotZ: -3.5, rotSpeed: 0.25 },
      { y: 6, length: 11, pivotX: 3.5, pivotZ: -2.0, rotSpeed: -0.2 },
      { y: 15, length: 12, pivotX: -2.0, pivotZ: 3.5, rotSpeed: 0.18 },
      { y: 24, length: 10, pivotX: 2.5, pivotZ: 3.0, rotSpeed: -0.22 }
    ];

    stairConfigs.forEach((cfg) => {
      const flightGroup = new THREE.Group();
      flightGroup.position.set(cfg.pivotX, cfg.y, cfg.pivotZ);

      const stepCount = 12;
      for (let s = 0; s < stepCount; s++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.22, 0.65),
          stairWoodMat
        );
        step.position.set(0, s * 0.32, s * 0.55);
        flightGroup.add(step);

        // Banister Rail Post
        if (s % 3 === 0) {
          const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.75),
            banisterMat
          );
          post.position.set(-1.0, s * 0.32 + 0.45, s * 0.55);
          flightGroup.add(post);
        }
      }

      this.group.add(flightGroup);
      this.movingStairs.push({
        group: flightGroup,
        speed: cfg.rotSpeed,
        baseRotY: 0
      });
    });
  }

  buildWatchingPortraits() {
    // Portraits hanging on walls with pupils tracking the viewer
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xba8c38,
      roughness: 0.3,
      metalness: 0.88
    });

    const portraitLocations = [
      { pos: [-11.8, 4, -4], rotY: Math.PI / 2 },
      { pos: [-11.8, 14, 4], rotY: Math.PI / 2 },
      { pos: [11.8, 8, -6], rotY: -Math.PI / 2 },
      { pos: [11.8, 18, 2], rotY: -Math.PI / 2 },
      { pos: [-4, 10, -11.8], rotY: 0 },
      { pos: [4, 20, -11.8], rotY: 0 }
    ];

    portraitLocations.forEach((loc) => {
      const g = new THREE.Group();
      g.position.set(...loc.pos);
      g.rotation.y = loc.rotY;

      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 0.15), frameMat);
      g.add(frame);

      // Face canvas
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 3.0),
        new THREE.MeshStandardMaterial({ color: 0x242e3b, roughness: 0.8 })
      );
      face.position.z = 0.09;
      g.add(face);

      // Two Eyeballs
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x070b1a });

      const eyeL = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), eyeMat);
      eyeL.position.set(-0.25, 0.45, 0.1);
      const pupilL = new THREE.Mesh(new THREE.CircleGeometry(0.038, 12), pupilMat);
      pupilL.position.set(0, 0, 0.01);
      eyeL.add(pupilL);

      const eyeR = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), eyeMat);
      eyeR.position.set(0.25, 0.45, 0.1);
      const pupilR = new THREE.Mesh(new THREE.CircleGeometry(0.038, 12), pupilMat);
      pupilR.position.set(0, 0, 0.01);
      eyeR.add(pupilR);

      g.add(eyeL, eyeR);
      this.group.add(g);

      this.portraits.push({
        group: g,
        pupilL,
        pupilR
      });
    });
  }

  buildMilestoneLandings() {
    // 5 Stair Landing Milestone Cards along the vertical ascent
    const milestones = content.timeline.milestones;
    const ySteps = [-1.5, 6.5, 14.5, 22.5, 30.5];

    milestones.forEach((item, idx) => {
      const y = ySteps[idx];
      const side = idx % 2 === 0 ? -1 : 1;
      const x = side * 6.5;
      const z = -2 + (idx % 3) * 3;

      // Stone Landing Pad
      const landing = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.4, 0.25, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a3045, roughness: 0.8 })
      );
      landing.position.set(x, y - 0.4, z);
      this.group.add(landing);

      // Glowing 3D Milestone Canvas Card
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Parchment background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = '#e8b04a';
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, 992, 480);

      // Year
      ctx.font = "bold 90px 'Cinzel', serif";
      ctx.fillStyle = '#f8d27a';
      ctx.textAlign = 'center';
      ctx.fillText(item.year, 512, 130);

      // Title
      ctx.font = "bold 48px 'Cinzel', serif";
      ctx.fillStyle = '#f3e9d2';
      ctx.fillText(item.title, 512, 230);

      // Short Desc
      ctx.font = "italic 34px 'Lora', serif";
      ctx.fillStyle = '#d5cbb3';
      this.wrapCanvasText(ctx, item.desc, 512, 320, 840, 48);

      const tex = new THREE.CanvasTexture(canvas);
      const cardMat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        roughness: 0.3,
        metalness: 0.4,
        emissive: 0x3d2708,
        emissiveIntensity: 0.25
      });

      const card = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), cardMat);
      card.position.set(x, y + 1.2, z);
      card.rotation.y = side > 0 ? -0.4 : 0.4;
      this.group.add(card);

      // Landing Beacon Point Light
      const beacon = new THREE.PointLight(0xe8b04a, 1.4, 6.0, 1.5);
      beacon.position.set(x, y + 1.2, z + 0.5);
      this.group.add(beacon);

      this.milestoneCards3D.push({
        card,
        beacon,
        mat: cardMat,
        yTarget: y
      });
    });
  }

  wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  setupThemeListener() {
    this.houseTheme.onThemeChange((houseId, data) => {
      if (!data) return;
      this.milestoneCards3D.forEach((m) => {
        m.beacon.color.set(data.glow);
      });
    });
  }

  initUI() {
    let el = document.getElementById('timeline-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'timeline-ui';
      document.body.appendChild(el);
    }
    el.className = 'timeline-ui hidden';
    el.innerHTML = `
      <div class="timeline-title-card">
        <h2 class="timeline-heading">${content.timeline.title}</h2>
        <p class="timeline-subheading">${content.timeline.subtitle}</p>
      </div>

      <!-- Real Selectable HTML Milestone Timeline for Accessibility & SEO -->
      <ol class="timeline-screen-reader-list">
        ${content.timeline.milestones.map(m => `
          <li class="timeline-sr-item">
            <span class="sr-year">${m.year}</span>
            <strong class="sr-title">${m.title}</strong>
            <p class="sr-desc">${m.desc}</p>
          </li>
        `).join('')}
      </ol>
    `;
  }

  onEnterRoom() {
    document.getElementById('timeline-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    document.getElementById('timeline-ui')?.classList.add('hidden');
  }

  update(time, mouseParallax) {
    // 1. Moving Staircases slowly shift and swing mechanically
    this.movingStairs.forEach((s, idx) => {
      // Swing between angles smoothly
      const angle = Math.sin(time * s.speed + idx * 1.5) * 0.45;
      s.group.rotation.y = angle;
    });

    // 2. Portrait eyes follow the cursor
    if (mouseParallax) {
      const pX = THREE.MathUtils.clamp(mouseParallax.x * 0.035, -0.035, 0.035);
      const pY = THREE.MathUtils.clamp(mouseParallax.y * 0.035, -0.035, 0.035);

      this.portraits.forEach(p => {
        p.pupilL.position.x = pX;
        p.pupilL.position.y = pY;
        p.pupilR.position.x = pX;
        p.pupilR.position.y = pY;
      });
    }

    // 3. Highlight milestone card closest to current camera height
    const camY = this.camera.position.y;
    this.milestoneCards3D.forEach(m => {
      const dist = Math.abs(camY - (this.group.position.y + m.yTarget));
      if (dist < 4.0) {
        m.mat.emissiveIntensity = 0.6;
        m.beacon.intensity = 3.2;
      } else {
        m.mat.emissiveIntensity = 0.2;
        m.beacon.intensity = 1.2;
      }
    });
  }
}