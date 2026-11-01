import * as THREE from 'three';
import { content } from '../content.js';

export class GreatHallScene {
  constructor(scene, houseThemeManager) {
    this.scene = scene;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Placed at -115 so it never overlaps or leaks into Room 2
    this.group.position.set(0, 0, -115);
    this.scene.add(this.group);

    this.candleCount = 180;
    this.candlesInstanced = null;
    this.candleData = [];
    this.flamePoints = null;
    this.starSkyMesh = null;
    this.themeParticles = null;
    this.hallLight = null;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildHallArchitecture();
    this.buildRealisticEnchantedCeiling();
    this.buildCandlesWithFlames();
    this.buildTrestleTables();
    this.buildHouseThemeParticles();
  }

  buildHallArchitecture() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.88,
      metalness: 0.1
    });

    // Main Great Hall Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 80), stoneMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Stone Pillars & High Arched Ribs
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x1c2133,
      roughness: 0.82,
      metalness: 0.12
    });

    const colGeo = new THREE.CylinderGeometry(0.55, 0.75, 16, 16);
    const archGeo = new THREE.TorusGeometry(8.5, 0.35, 12, 24, Math.PI);

    for (let z = -32; z <= 32; z += 16) {
      const colL = new THREE.Mesh(colGeo, stoneMat);
      colL.position.set(-9.2, 4.8, z);
      this.group.add(colL);

      const colR = new THREE.Mesh(colGeo, stoneMat);
      colR.position.set(9.2, 4.8, z);
      this.group.add(colR);

      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(0, 8.8, z);
      arch.rotation.z = Math.PI;
      this.group.add(arch);
    }

    // Warm Hall Center Light
    this.hallLight = new THREE.PointLight(0xe8b04a, 2.5, 30, 1.2);
    this.hallLight.position.set(0, 4.5, 0);
    this.group.add(this.hallLight);
  }

  buildRealisticEnchantedCeiling() {
    // High cosmic dome with smooth stars
    const starCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const opacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = 10.5 + Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 75;
      opacities[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.starSkyMesh = new THREE.Points(geo, starMat);
    this.group.add(this.starSkyMesh);
  }

  buildCandlesWithFlames() {
    // 1. Taper Candle Wax Body
    const candleGeo = new THREE.CylinderGeometry(0.04, 0.048, 0.75, 10);
    const candleMat = new THREE.MeshStandardMaterial({
      color: 0xf3e9d2,
      roughness: 0.45,
      metalness: 0.05
    });

    this.candlesInstanced = new THREE.InstancedMesh(candleGeo, candleMat, this.candleCount);
    this.candlesInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // 2. Candle Flame Tips
    const flameGeo = new THREE.BufferGeometry();
    const flamePos = new Float32Array(this.candleCount * 3);

    const dummy = new THREE.Object3D();
    this.candleData = [];

    for (let i = 0; i < this.candleCount; i++) {
      const x = (Math.random() - 0.5) * 15;
      const y = 3.2 + Math.random() * 4.2;
      const z = -32 + Math.random() * 64;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      this.candlesInstanced.setMatrixAt(i, dummy.matrix);

      flamePos[i * 3] = x;
      flamePos[i * 3 + 1] = y + 0.42;
      flamePos[i * 3 + 2] = z;

      this.candleData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speed: 1.0 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.candlesInstanced.instanceMatrix.needsUpdate = true;
    this.group.add(this.candlesInstanced);

    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    const flameMat = new THREE.PointsMaterial({
      color: 0xffdf78,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.flamePoints = new THREE.Points(flameGeo, flameMat);
    this.group.add(this.flamePoints);
  }

  buildTrestleTables() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x24180f,
      roughness: 0.8,
      metalness: 0.1
    });

    const xSlots = [-5.8, -1.9, 1.9, 5.8];
    xSlots.forEach(x => {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 56), woodMat);
      top.position.set(x, -2.4, 0);
      top.receiveShadow = true;
      this.group.add(top);
    });
  }

  buildHouseThemeParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 16;
      pos[i + 1] = -1.0 + Math.random() * 8.0;
      pos[i + 2] = -30 + Math.random() * 60;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe8b04a,
      size: 0.07,
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
      if (this.hallLight) {
        this.hallLight.color.set(data.glow);
      }
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
    if (this.candlesInstanced && this.flamePoints) {
      const dummy = new THREE.Object3D();
      const pX = mouseParallax ? mouseParallax.x * 0.4 : 0;
      const pY = mouseParallax ? mouseParallax.y * 0.25 : 0;
      const fPos = this.flamePoints.geometry.attributes.position.array;

      for (let i = 0; i < this.candleCount; i++) {
        const d = this.candleData[i];
        const floatY = d.baseY + Math.sin(time * d.speed + d.phase) * 0.14 + pY;
        const posX = d.baseX + pX;

        dummy.position.set(posX, floatY, d.baseZ);
        dummy.updateMatrix();
        this.candlesInstanced.setMatrixAt(i, dummy.matrix);

        fPos[i * 3] = posX;
        fPos[i * 3 + 1] = floatY + 0.42;
        fPos[i * 3 + 2] = d.baseZ;
      }
      this.candlesInstanced.instanceMatrix.needsUpdate = true;
      this.flamePoints.geometry.attributes.position.needsUpdate = true;
    }

    if (this.themeParticles) {
      this.themeParticles.rotation.y = time * 0.015;
    }
  }
}