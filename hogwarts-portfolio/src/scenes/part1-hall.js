import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class Part1Hall {
  constructor(scene, camera, lighting, audio) {
    this.scene = scene;
    this.camera = camera;
    this.lighting = lighting;
    this.audio = audio;

    this.candles = [];
    this.dustParticles = null;
    this.wandGroup = null;
    this.wandTipLight = null;

    // Drawing Canvas Texture
    this.canvasPlane = null;
    this.drawCanvas = null;
    this.drawCtx = null;
    this.canvasTexture = null;

    // Solid Gold Text Mesh
    this.solidTextGroup = null;
    this.flashLight = null;

    this.timeline = null;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.buildArchitecture();
    this.buildCandles(26);
    this.buildDustMotes();
    this.buildWand();
    this.buildWritingSurface();
    this.buildSolidTypography();
    this.setupFlashLight();
  }

  buildArchitecture() {
    // Gothic Stone Hall Floor & Ceiling
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x141722,
      roughness: 0.85,
      metalness: 0.12
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 40), stoneMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30, 40), stoneMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5.5;
    this.scene.add(ceiling);

    // Stone Pillars with depth
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x181c2a,
      roughness: 0.9,
      metalness: 0.05
    });

    const pillarGeo = new THREE.CylinderGeometry(0.55, 0.65, 9, 16);
    const zOffsets = [-12, -6, 0, 6];

    zOffsets.forEach(z => {
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-5.5, 1, z);
      this.scene.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
      rightPillar.position.set(5.5, 1, z);
      this.scene.add(rightPillar);
    });
  }

  buildCandles(count) {
    const waxMat = new THREE.MeshStandardMaterial({
      color: 0xe3dbbe,
      roughness: 0.45,
      metalness: 0.05
    });

    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffedd0 });

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const height = 0.8 + Math.random() * 0.7;
      const radius = 0.08 + Math.random() * 0.03;

      // Candle wax cylinder
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.95, radius, height, 16),
        waxMat
      );
      group.add(body);

      // Melted rim torus
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.88, 0.02, 8, 16),
        waxMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = height / 2;
      group.add(rim);

      // Wick
      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
      );
      wick.position.y = height / 2 + 0.04;
      group.add(wick);

      // Flame Mesh
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.16, 8),
        flameMat
      );
      flame.position.y = height / 2 + 0.13;
      group.add(flame);

      // Flame Point Light
      const pLight = new THREE.PointLight(0xe8b04a, 0.9, 5, 2);
      pLight.position.y = height / 2 + 0.16;
      group.add(pLight);
      this.lighting.registerCandleLight(pLight, 0.9);

      // Position distributed in depth, avoiding text center
      let x = (Math.random() - 0.5) * 14;
      let y = -0.5 + Math.random() * 3.5;
      let z = -8 + Math.random() * 14;

      if (Math.abs(x) < 2.8 && Math.abs(y) < 1.4 && z > -2) {
        x += x >= 0 ? 3.0 : -3.0;
      }

      group.position.set(x, y, z);
      group.userData = {
        baseY: y,
        floatSpeed: 0.8 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2
      };

      this.scene.add(group);
      this.candles.push(group);
    }
  }

  buildDustMotes() {
    const count = 450;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xe8b04a,
      size: 0.04,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  buildWand() {
    this.wandGroup = new THREE.Group();

    // Wand shaft
    const wandMat = new THREE.MeshStandardMaterial({
      color: 0x24140b,
      roughness: 0.6,
      metalness: 0.1
    });

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.04, 2.2, 12),
      wandMat
    );
    shaft.rotation.z = Math.PI / 4;
    shaft.rotation.x = -Math.PI / 6;
    this.wandGroup.add(shaft);

    // Wand glowing tip
    const tipMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tipMesh.position.set(-0.78, 0.78, 0.45);
    this.wandGroup.add(tipMesh);

    this.wandTipLight = new THREE.PointLight(0xffdf78, 0, 4, 2);
    this.wandTipLight.position.copy(tipMesh.position);
    this.wandGroup.add(this.wandTipLight);

    this.wandGroup.position.set(0, 0, -2);
    this.wandGroup.scale.set(0.001, 0.001, 0.001);
    this.scene.add(this.wandGroup);
  }

  buildWritingSurface() {
    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.width = 2048;
    this.drawCanvas.height = 1024;
    this.drawCtx = this.drawCanvas.getContext('2d');

    this.canvasTexture = new THREE.CanvasTexture(this.drawCanvas);
    this.canvasTexture.minFilter = THREE.LinearFilter;
    this.canvasTexture.magFilter = THREE.LinearFilter;

    const planeMat = new THREE.MeshBasicMaterial({
      map: this.canvasTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.canvasPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), planeMat);
    this.canvasPlane.position.set(0, 0, 0);
    this.scene.add(this.canvasPlane);
  }

  buildSolidTypography() {
    // 3D Canvas-rendered high-clarity sculpted typography
    const solidCanvas = document.createElement('canvas');
    solidCanvas.width = 2048;
    solidCanvas.height = 1024;
    const sCtx = solidCanvas.getContext('2d');

    sCtx.clearRect(0, 0, 2048, 1024);
    sCtx.font = "bold 130px 'Cinzel', serif";
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';

    // Sculpted bevels and gold gradient
    const grad = sCtx.createLinearGradient(0, 380, 0, 620);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#f8d27a');
    grad.addColorStop(0.6, '#b68329');
    grad.addColorStop(1, '#533b0e');

    // Outer warm gold glow
    sCtx.shadowColor = 'rgba(232, 176, 74, 0.8)';
    sCtx.shadowBlur = 35;

    sCtx.fillStyle = grad;
    sCtx.fillText(content.name, 1024, 512);

    sCtx.lineWidth = 4;
    sCtx.strokeStyle = 'rgba(255, 235, 170, 0.8)';
    sCtx.strokeText(content.name, 1024, 512);

    const solidTex = new THREE.CanvasTexture(solidCanvas);
    const solidMat = new THREE.MeshStandardMaterial({
      map: solidTex,
      transparent: true,
      roughness: 0.25,
      metalness: 0.85,
      opacity: 0,
      depthWrite: false
    });

    this.solidTextGroup = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), solidMat);
    this.solidTextGroup.position.set(0, 0, 0.05);
    this.scene.add(this.solidTextGroup);
  }

  setupFlashLight() {
    this.flashLight = new THREE.PointLight(0xfff3d1, 0, 15, 1.2);
    this.flashLight.position.set(0, 0, 1);
    this.scene.add(this.flashLight);
  }

  startSequence() {
    if (this.timeline) this.timeline.kill();

    const roleEl = document.getElementById('role-subtitle');
    const hintEl = document.getElementById('scroll-hint');
    const hintText = hintEl?.querySelector('.hint-text');

    if (roleEl) roleEl.textContent = content.role;
    if (hintText) hintText.textContent = content.navigationHint;

    // Fast-path for users who prefer reduced motion
    if (this.isReducedMotion) {
      this.camera.position.set(0, 0, 7.5);
      this.camera.lookAt(0, 0, 0);
      this.solidTextGroup.material.opacity = 1;
      this.canvasPlane.material.opacity = 0;
      if (roleEl) gsap.to(roleEl, { opacity: 1, y: 0, duration: 0.5 });
      if (hintEl) gsap.to(hintEl, { opacity: 1, y: 0, duration: 0.5, delay: 0.3 });
      return;
    }

    // Reset components
    this.drawCtx.clearRect(0, 0, 2048, 1024);
    this.canvasTexture.needsUpdate = true;
    this.canvasPlane.material.opacity = 1;
    this.solidTextGroup.material.opacity = 0;
    this.wandGroup.scale.set(0.001, 0.001, 0.001);
    this.wandTipLight.intensity = 0;

    if (roleEl) gsap.set(roleEl, { opacity: 0, y: 14 });
    if (hintEl) gsap.set(hintEl, { opacity: 0, y: 14 });

    // Initial camera position (centered, eye-level)
    this.camera.position.set(0, 0, 9.5);
    this.camera.lookAt(0, 0, 0);

    const tl = gsap.timeline();
    this.timeline = tl;

    // 0-2s: Hall reveals, slow camera push-in
    tl.to(this.camera.position, {
      z: 7.5,
      duration: 2.0,
      ease: 'power1.out'
    }, 0);

    // 2-3s: Wand appears & tip ignites
    tl.to(this.wandGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.8,
      ease: 'back.out(1.5)'
    }, 2.0);

    tl.to(this.wandTipLight, {
      intensity: 2.5,
      duration: 0.6
    }, 2.2);

    // 3-7s: The Wand writes "Joel Biju" stroke by stroke
    const writeProgress = { t: 0 };
    tl.to(writeProgress, {
      t: 1,
      duration: 4.0,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.renderWritingStroke(writeProgress.t);
        if (Math.random() > 0.4) this.audio.playSparkle();
      }
    }, 3.0);

    // 7-8s: Flash burst & handwritten-to-solid transformation
    tl.to(this.flashLight, {
      intensity: 8.0,
      duration: 0.15,
      ease: 'power2.in',
      onStart: () => this.audio.playTransformationChime()
    }, 7.0);

    tl.to(this.canvasPlane.material, { opacity: 0, duration: 0.3 }, 7.1);
    tl.to(this.solidTextGroup.material, { opacity: 1, duration: 0.4 }, 7.1);

    tl.to(this.flashLight, {
      intensity: 0,
      duration: 0.7,
      ease: 'power2.out'
    }, 7.15);

    tl.to(this.wandGroup.scale, {
      x: 0, y: 0, z: 0,
      duration: 0.5,
      ease: 'power2.in'
    }, 7.2);

    // 8-9s: Role subtitle fades in
    if (roleEl) {
      tl.to(roleEl, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, 8.0);
    }

    // 9-10s: Hint fades in
    if (hintEl) {
      tl.to(hintEl, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, 9.0);
    }
  }

  renderWritingStroke(progress) {
    const ctx = this.drawCtx;
    ctx.clearRect(0, 0, 2048, 1024);

    // Fluid cursive stroke interpolation
    ctx.font = "italic bold 125px 'Cinzel Decorative', cursive, serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fullText = content.name;
    const charCount = Math.floor(progress * fullText.length);
    const partialText = fullText.slice(0, charCount);

    ctx.shadowColor = '#e8b04a';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeText(partialText, 1024, 512);

    ctx.fillStyle = '#f8d27a';
    ctx.fillText(partialText, 1024, 512);

    this.canvasTexture.needsUpdate = true;

    // Move wand tip along text coordinate path
    const textWidth = 6.0;
    const startX = -textWidth / 2;
    const currentX = startX + textWidth * progress;
    const currentY = Math.sin(progress * Math.PI * 4) * 0.25;

    this.wandGroup.position.set(currentX + 0.6, currentY - 0.4, 0.4);
  }

  skipToEnd() {
    if (this.timeline) this.timeline.seek(10);
  }

  update(delta, time, mouseParallax) {
    // Candle organic hovering
    for (let i = 0; i < this.candles.length; i++) {
      const c = this.candles[i];
      c.position.y = c.userData.baseY + Math.sin(time * c.userData.floatSpeed + c.userData.offset) * 0.15;
    }

    // Slow atmospheric dust drift
    if (this.dustParticles) {
      this.dustParticles.rotation.y = time * 0.02;
    }

    // 3D Parallax Hovering across all directions
    if (mouseParallax) {
      const targetX = mouseParallax.x * 1.5;
      const targetY = mouseParallax.y * 1.0;
      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }
}