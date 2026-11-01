import * as THREE from 'three';
import { content } from '../content.js';

export class GreatHallScene {
  constructor(scene, houseThemeManager) {
    this.scene = scene;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Placed far along Z so it never overlaps previous rooms
    this.group.position.set(0, 0, -115);
    this.scene.add(this.group);

    this.candles = [];
    this.flameHalos = [];
    this.tablePlates = [];
    this.hallLights = [];
    this.themeParticles = null;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildHallArchitecture();
    this.buildPortraitGalleries();
    this.buildHouseTablesWithPlates();
    this.buildHighTableDais();
    this.buildRealisticFloatingCandles(220);
    this.buildAtmosphericParticles();
  }

  buildHallArchitecture() {
    // Lighter, warmer ancient flagstone and warm carved oak
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x3d4358,       // Significantly lifted from near-black
      roughness: 0.75,
      metalness: 0.12,
      emissive: 0x121522,    // Subtle base tone so it never dips into void black
      emissiveIntensity: 0.2
    });

    const woodBeamMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1d,       // Rich visible mahogany
      roughness: 0.65,
      metalness: 0.15,
      emissive: 0x201007,
      emissiveIntensity: 0.25
    });
      
    // 1. Long Flagstone Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 90), stoneMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Side Walls
    const wallGeo = new THREE.PlaneGeometry(90, 20);
    const wallL = new THREE.Mesh(wallGeo, stoneMat);
    wallL.position.set(-13.5, 6.8, 0);
    wallL.rotation.y = Math.PI / 2;
    this.group.add(wallL);

    const wallR = new THREE.Mesh(wallGeo, stoneMat);
    wallR.position.set(13.5, 6.8, 0);
    wallR.rotation.y = -Math.PI / 2;
    this.group.add(wallR);

    // 3. Vaulted Gothic Timber Hammerbeam Ceiling
    const beamGeo = new THREE.BoxGeometry(27, 0.45, 0.6);
    const archGeo = new THREE.TorusGeometry(8.5, 0.35, 10, 24, Math.PI);

    for (let z = -40; z <= 40; z += 10) {
      // Cross Tie-beam
      const beam = new THREE.Mesh(beamGeo, woodBeamMat);
      beam.position.set(0, 11.0, z);
      this.group.add(beam);

      // Gothic Arched Rib
      const arch = new THREE.Mesh(archGeo, woodBeamMat);
      arch.position.set(0, 11.0, z);
      arch.rotation.z = Math.PI;
      this.group.add(arch);

      // Wall Corbel supports
      const corbelL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.5, 0.8), woodBeamMat);
      corbelL.position.set(-13.0, 9.8, z);
      this.group.add(corbelL);

      const corbelR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.5, 0.8), woodBeamMat);
      corbelR.position.set(13.0, 9.8, z);
      this.group.add(corbelR);
    }

    // 4. Ambient Warm Hall Light Nodes
    // 4. Multi-tier Hall Illumination
    // Ambient fill for the entire room
    const ambientHall = new THREE.AmbientLight(0x28324a, 0.9);
    this.group.add(ambientHall);

    // Warm golden chandeliers / candle cluster glow
    const mainWarm = new THREE.PointLight(0xffb356, 7.5, 55, 1.0);
    mainWarm.position.set(0, 6.0, 0);
    this.group.add(mainWarm);
    this.hallLights.push(mainWarm);

    const frontWarm = new THREE.PointLight(0xffc272, 6.5, 50, 1.0);
    frontWarm.position.set(0, 6.0, -25);
    this.group.add(frontWarm);
    this.hallLights.push(frontWarm);

    const backWarm = new THREE.PointLight(0xffa040, 6.5, 50, 1.0);
    backWarm.position.set(0, 6.0, 25);
    this.group.add(backWarm);
    this.hallLights.push(backWarm);

    // Archway uplighting highlighting the ceiling ribs
    const archUplight = new THREE.DirectionalLight(0xd9953b, 1.4);
    archUplight.position.set(0, -2, 0);
    archUplight.target.position.set(0, 12, 0);
    this.group.add(archUplight);
    this.group.add(archUplight.target);
  }

  buildPortraitGalleries() {
    // Ornate gold frame material
// Gilded, reflective portrait frames with warm sheen
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xe6b54a,
      roughness: 0.25,
      metalness: 0.92,
      emissive: 0x3d2806,
      emissiveIntensity: 0.35
    });

    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0x222838,
      roughness: 0.8,
      emissive: 0x0e1320,
      emissiveIntensity: 0.25
    });

    const frameGeo = new THREE.BoxGeometry(0.12, 3.6, 2.4);
    const innerGeo = new THREE.BoxGeometry(0.14, 3.1, 1.9);

    for (let z = -36; z <= 36; z += 6.5) {
      // Left Wall Frames
      const fL = new THREE.Mesh(frameGeo, frameMat);
      fL.position.set(-13.4, 3.5, z);
      const cL = new THREE.Mesh(innerGeo, canvasMat);
      cL.position.copy(fL.position);
      this.group.add(fL, cL);

      // Right Wall Frames
      const fR = new THREE.Mesh(frameGeo, frameMat);
      fR.position.set(13.4, 3.5, z);
      const cR = new THREE.Mesh(innerGeo, canvasMat);
      cR.position.copy(fR.position);
      this.group.add(fR, cR);
    }
  }

  buildHouseTablesWithPlates() {
const tableMat = new THREE.MeshStandardMaterial({
      color: 0x4e2d19,
      roughness: 0.6,
      metalness: 0.15,
      emissive: 0x1c0f08,
      emissiveIntensity: 0.25
    });

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.18,
      metalness: 0.95,
      emissive: 0x6e4a0a,
      emissiveIntensity: 0.55
    });

    // 4 Long House Dining Tables (2 on left, 2 on right)
    const tableX = [-8.0, -3.2, 3.2, 8.0];
    tableX.forEach(x => {
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 68), tableMat);
      top.position.set(x, -2.3, 0);
      top.receiveShadow = true;
      this.group.add(top);

      // Golden Goblets and Plates reflecting candlelight down the length
      const plateGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.03, 16);
      for (let z = -32; z <= 32; z += 3.2) {
        const p1 = new THREE.Mesh(plateGeo, plateMat);
        p1.position.set(x - 0.55, -2.18, z);
        const p2 = new THREE.Mesh(plateGeo, plateMat);
        p2.position.set(x + 0.55, -2.18, z);
        this.group.add(p1, p2);
      }
    });
  }

  buildHighTableDais() {
    // Raised Teachers' Dais at far end
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x24150c,
      roughness: 0.75
    });

    const dais = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 8), woodMat);
    dais.position.set(0, -2.9, -40);
    this.group.add(dais);

    const highTable = new THREE.Mesh(new THREE.BoxGeometry(20, 0.18, 1.8), woodMat);
    highTable.position.set(0, -2.2, -40);
    this.group.add(highTable);

    // Deep Midnight Velvet Backdrop Drapery
    const drapeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      roughness: 0.85,
      metalness: 0.1
    });

    const drape = new THREE.Mesh(new THREE.PlaneGeometry(24, 14), drapeMat);
    drape.position.set(0, 4.0, -43.8);
    this.group.add(drape);
  }

  buildRealisticFloatingCandles(count) {
    const waxMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5dfb3,
      emissive: 0x6a3809,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.05,
      transmission: 0.2,
      thickness: 0.7
    });

    const flameMat = new THREE.MeshBasicMaterial({ color: 0xfff6dc });
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffa41c,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const height = 0.85 + Math.random() * 0.95;
      const radius = 0.08 + Math.random() * 0.03;

      // Candle wax cylinder
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.92, radius, height, 12),
        waxMat
      );
      group.add(body);

      // Melted rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.85, 0.02, 6, 12),
        waxMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = height / 2;
      group.add(rim);

      // Teardrop flame
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.18, 8),
        flameMat
      );
      flame.position.y = height / 2 + 0.13;
      group.add(flame);

      // Golden halo glow
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 10),
        haloMat
      );
      halo.position.y = height / 2 + 0.13;
      group.add(halo);
      this.flameHalos.push(halo);

      // Placement clustered vertically over tables as in the movie
      const x = (Math.random() - 0.5) * 20;
      const y = 1.8 + Math.random() * 7.5;
      const z = -38 + Math.random() * 72;

      group.position.set(x, y, z);
      group.userData = {
        baseX: x,
        baseY: y,
        speed: 0.8 + Math.random() * 1.4,
        offset: Math.random() * Math.PI * 2
      };

      this.group.add(group);
      this.candles.push(group);
    }
  }

  buildAtmosphericParticles() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 24;
      pos[i + 1] = -1.5 + Math.random() * 10;
      pos[i + 2] = -42 + Math.random() * 80;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffc44d,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.themeParticles = new THREE.Points(geo, mat);
    this.group.add(this.themeParticles);
  }

  setupThemeListener() {
    this.houseTheme.onThemeChange((houseId, data) => {
      if (!data) return;
      if (this.themeParticles) {
        this.themeParticles.material.color.setHex(data.particleColor);
      }
      this.hallLights.forEach(light => {
        light.color.set(data.glow);
      });
    });
  }

  initUI() {
    let el = document.getElementById('great-hall-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'great-hall-ui';
      document.body.appendChild(el);
    }
    el.className = 'great-hall-ui hidden';
    el.innerHTML = `
      <div class="great-hall-banner">
        <h2 class="hall-title">${content.greatHall.welcomeTitle}</h2>
        <p class="hall-statement">${content.greatHall.introStatement}</p>
        <span class="hall-subhint">${content.greatHall.scrollContinue}</span>
      </div>
    `;
  }

  onEnterRoom() {
    const ui = document.getElementById('great-hall-ui');
    if (ui) ui.classList.remove('hidden');
  }

  onLeaveRoom() {
    const ui = document.getElementById('great-hall-ui');
    if (ui) ui.classList.add('hidden');
  }

  update(time, mouseParallax) {
    const pX = mouseParallax ? mouseParallax.x * 0.4 : 0;
    const pY = mouseParallax ? mouseParallax.y * 0.25 : 0;

    // Organic candle bobbing and parallax
    for (let i = 0; i < this.candles.length; i++) {
      const c = this.candles[i];
      c.position.y = c.userData.baseY + Math.sin(time * c.userData.speed + c.userData.offset) * 0.14 + pY;
      c.position.x = c.userData.baseX + pX;
    }

    // Gentle shimmer of flame halos
    for (let i = 0; i < this.flameHalos.length; i++) {
      const h = this.flameHalos[i];
      const scale = 1.0 + Math.sin(time * 6.0 + i) * 0.12;
      h.scale.set(scale, scale, scale);
    }

    if (this.themeParticles) {
      this.themeParticles.rotation.y = time * 0.015;
    }
  }
}