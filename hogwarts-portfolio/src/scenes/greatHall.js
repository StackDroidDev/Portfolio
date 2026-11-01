import * as THREE from 'three';
import { content } from '../content.js';

export class GreatHallScene {
  constructor(scene, houseThemeManager) {
    this.scene = scene;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, -95); // Waypoint 2
    this.scene.add(this.group);

    this.candlesInstanced = null;
    this.candleCount = 380;
    this.candleData = [];
    this.starSkyMesh = null;
    this.windowLightBeams = [];
    this.themeParticles = null;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildHallArchitecture();
    this.buildInstancedCandles();
    this.buildEnchantedStarCeiling();
    this.buildTrestleTables();
    this.buildWindowLightShafts();
    this.buildHouseThemeParticles();
  }

  buildHallArchitecture() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x121727,
      roughness: 0.88,
      metalness: 0.1
    });

    // Main Great Hall Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 60), wallMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.5;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Arched side stone columns
    const colGeo = new THREE.CylinderGeometry(0.7, 0.85, 14, 16);
    for (let z = -25; z <= 25; z += 10) {
      const colL = new THREE.Mesh(colGeo, wallMat);
      colL.position.set(-9.5, 4.5, z);
      this.group.add(colL);

      const colR = new THREE.Mesh(colGeo, wallMat);
      colR.position.set(9.5, 4.5, z);
      this.group.add(colR);
    }
  }

  buildInstancedCandles() {
    // InstancedMesh for cheap, efficient 400+ floating candles
    const candleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.65, 8);
    const candleMat = new THREE.MeshStandardMaterial({
      color: 0xf5ecd7,
      roughness: 0.4,
      emissive: 0xffd98c,
      emissiveIntensity: 0.5
    });

    this.candlesInstanced = new THREE.InstancedMesh(candleGeo, candleMat, this.candleCount);
    this.candlesInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    this.candleData = [];

    for (let i = 0; i < this.candleCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = 3.2 + Math.random() * 5.5;
      const z = -28 + Math.random() * 52;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      this.candlesInstanced.setMatrixAt(i, dummy.matrix);

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
  }

  buildEnchantedStarCeiling() {
    // Custom star sky shader dome simulating Hogwarts enchanted ceiling
    const skyGeo = new THREE.SphereGeometry(22, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;

        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          // Dark twilight blue gradient
          vec3 skyColor = mix(vec3(0.02, 0.04, 0.1), vec3(0.005, 0.01, 0.03), clamp(dir.y, 0.0, 1.0));

          // Star dots with twinkling
          vec2 grid = floor(vWorldPosition.xz * 4.5);
          float n = rand(grid);
          if (n > 0.94) {
            float twinkle = sin(uTime * 4.0 + n * 20.0) * 0.5 + 0.5;
            skyColor += vec3(0.9, 0.95, 1.0) * twinkle * 1.2;
          }

          gl_FragColor = vec4(skyColor, 1.0);
        }
      `
    });

    this.starSkyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.starSkyMesh.position.set(0, 4.0, 0);
    this.group.add(this.starSkyMesh);
  }

  buildTrestleTables() {
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x22170f,
      roughness: 0.75,
      metalness: 0.15
    });

    const xSlots = [-6.2, -2.1, 2.1, 6.2]; // 4 Long House Tables
    xSlots.forEach(x => {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 48), tableMat);
      top.position.set(x, -1.8, 0);
      top.receiveShadow = true;
      this.group.add(top);

      // Simple benches
      const benchL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 48), tableMat);
      benchL.position.set(x - 1.1, -2.1, 0);
      this.group.add(benchL);

      const benchR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 48), tableMat);
      benchR.position.set(x + 1.1, -2.1, 0);
      this.group.add(benchR);
    });
  }

  buildWindowLightShafts() {
    // Volumetric moon light shafts angling from the high arched windows
    const shaftGeo = new THREE.CylinderGeometry(1.2, 3.5, 18, 16, 1, true);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0x6e9ecf,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    [-15, 0, 15].forEach(z => {
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(-8.8, 5.5, z);
      shaft.rotation.z = -Math.PI / 4.5;
      this.group.add(shaft);
      this.windowLightBeams.push(shaft);
    });
  }

  buildHouseThemeParticles() {
    // Ambient floating magic tailored to active house
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 18;
      pos[i + 1] = -1.5 + Math.random() * 8.0;
      pos[i + 2] = -25 + Math.random() * 50;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xe8b04a,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
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
    });
  }

  initUI() {
    const el = document.createElement('div');
    el.id = 'great-hall-ui';
    el.className = 'great-hall-ui hidden';
    el.innerHTML = `
      <div class="great-hall-banner">
        <h2 class="hall-title">${content.greatHall.welcomeTitle}</h2>
        <p class="hall-statement">${content.greatHall.introStatement}</p>
        <span class="hall-subhint">${content.greatHall.scrollContinue}</span>
      </div>
    `;
    document.body.appendChild(el);
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
    if (this.starSkyMesh) {
      this.starSkyMesh.material.uniforms.uTime.value = time;
    }

    // Instanced candle flicker and parallax floating
    if (this.candlesInstanced) {
      const dummy = new THREE.Object3D();
      const pX = mouseParallax ? mouseParallax.x * 0.4 : 0;
      const pY = mouseParallax ? mouseParallax.y * 0.25 : 0;

      for (let i = 0; i < this.candleCount; i++) {
        const d = this.candleData[i];
        const floatY = d.baseY + Math.sin(time * d.speed + d.phase) * 0.12 + pY;
        const floatX = d.baseX + pX;

        dummy.position.set(floatX, floatY, d.baseZ);
        dummy.updateMatrix();
        this.candlesInstanced.setMatrixAt(i, dummy.matrix);
      }
      this.candlesInstanced.instanceMatrix.needsUpdate = true;
    }

    if (this.themeParticles) {
      this.themeParticles.rotation.y = time * 0.015;
    }
  }
}