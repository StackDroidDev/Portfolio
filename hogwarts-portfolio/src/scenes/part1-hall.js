import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class Part1Hall {
  constructor(scene, camera, lighting) {
    this.scene = scene;
    this.camera = camera;
    this.lighting = lighting;

    this.candles = [];
    this.dustParticles = null;
    this.wandGroup = null;
    this.wandTipLight = null;
    this.cursorLight = null;

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
    // 1. Organic Warm Beeswax with subsurface feel
    const waxMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5dfb3,
      emissive: 0x5a3410,
      emissiveIntensity: 0.35,
      roughness: 0.38,
      metalness: 0.05,
      transmission: 0.25,
      thickness: 0.8
    });

    const dripMat = new THREE.MeshStandardMaterial({
      color: 0xfff0cc,
      roughness: 0.3
    });

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d6
    });

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff9911,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const height = 0.9 + Math.random() * 0.9;
      const radius = 0.09 + Math.random() * 0.035;

      // Candle body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.9, radius, height, 16),
        waxMat
      );
      body.castShadow = true;
      group.add(body);

      // Melted cup rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.82, 0.024, 8, 16),
        waxMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = height / 2;
      group.add(rim);

      // Organic wax drips down the sides
      const dripCount = 2 + Math.floor(Math.random() * 3);
      for (let d = 0; d < dripCount; d++) {
        const dAngle = Math.random() * Math.PI * 2;
        const dLen = 0.2 + Math.random() * 0.45;
        const drip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.004, dLen, 8),
          dripMat
        );
        drip.position.set(
          Math.cos(dAngle) * (radius * 0.92),
          height / 2 - dLen / 2,
          Math.sin(dAngle) * (radius * 0.92)
        );
        group.add(drip);
      }

      // Curved burnt wick
      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.007, 0.09, 6),
        new THREE.MeshBasicMaterial({ color: 0x14100c })
      );
      wick.position.set(0.008, height / 2 + 0.045, 0);
      wick.rotation.z = -0.15;
      group.add(wick);

      // Teardrop Flame Mesh
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.042, 0.18, 10),
        flameMat
      );
      flame.position.y = height / 2 + 0.14;
      group.add(flame);

      // Warm radial flame glow halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12),
        haloMat
      );
      halo.position.y = height / 2 + 0.14;
      group.add(halo);

      // Point Light
      const pLight = new THREE.PointLight(0xffa834, 1.4, 6.0, 1.8);
      pLight.position.y = height / 2 + 0.16;
      group.add(pLight);
      this.lighting.registerCandleLight(pLight, 1.4);

      // Placement in Hall 1
      let x = (Math.random() - 0.5) * 14;
      let y = -0.5 + Math.random() * 3.5;
      let z = -8 + Math.random() * 14;

      if (Math.abs(x) < 3.2 && Math.abs(y) < 1.6 && z > -2) {
        x += x >= 0 ? 3.5 : -3.5;
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

    const wandMat = new THREE.MeshStandardMaterial({
      color: 0x24140b,
      roughness: 0.6,
      metalness: 0.4
    });

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.04, 2.2, 12),
      wandMat
    );
    shaft.rotation.z = Math.PI / 4;
    shaft.rotation.x = -Math.PI / 6;
    this.wandGroup.add(shaft);

    const tipMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tipMesh.position.set(-0.78, 0.78, 0.45);
    this.wandGroup.add(tipMesh);

    this.wandTipLight = new THREE.PointLight(0xffdf78, 0, 4, 2);
    this.wandTipLight.position.copy(tipMesh.position);
    this.wandGroup.add(this.wandTipLight);

    // Initial positioning at the left side of the writing path
    this.wandGroup.position.set(-4.25, 0.1, 0.45);
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

    this.canvasPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), planeMat);
    this.canvasPlane.position.set(0, 0, 0);
    this.scene.add(this.canvasPlane);
  }

  buildSolidTypography() {
    const solidCanvas = document.createElement('canvas');
    solidCanvas.width = 2048;
    solidCanvas.height = 1024;
    const sCtx = solidCanvas.getContext('2d');

    sCtx.clearRect(0, 0, 2048, 1024);
    sCtx.font = "bold 190px 'Cinzel', serif";
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';

    const grad = sCtx.createLinearGradient(0, 350, 0, 650);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#f8d27a');
    grad.addColorStop(0.6, '#b68329');
    grad.addColorStop(1, '#533b0e');

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
      roughness: 0.12,
      metalness: 0.95,
      opacity: 0,
      depthWrite: false,
      emissive: 0x4a2c0a,
      emissiveIntensity: 0.35
    });

    this.solidTextGroup = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), solidMat);
    this.solidTextGroup.position.set(0, 0, 0.05);
    this.scene.add(this.solidTextGroup);
  }

  setupFlashLight() {
    this.flashLight = new THREE.PointLight(0xfff3d1, 0, 15, 1.2);
    this.flashLight.position.set(0, 0, 1);
    this.scene.add(this.flashLight);

    // Lumos Cursor Light with enhanced intensity and reach
    this.cursorLight = new THREE.PointLight(0xfffae0, 8.5, 6.0, 1.2);
    this.cursorLight.position.set(0, 0, 0.55);
    this.scene.add(this.cursorLight);
  }

  startSequence() {
    if (this.timeline) this.timeline.kill();

    const roleEl = document.getElementById('role-subtitle');
    const hintEl = document.getElementById('scroll-hint');
    const hintText = hintEl?.querySelector('.hint-text');

    if (roleEl) roleEl.textContent = content.role;
    if (hintText) hintText.textContent = content.navigationHint;

    if (this.isReducedMotion) {
      this.camera.position.set(0, 0, 7.5);
      this.camera.lookAt(0, 0, 0);
      this.solidTextGroup.material.opacity = 1;
      this.canvasPlane.material.opacity = 0;
      if (roleEl) gsap.to(roleEl, { opacity: 1, y: 0, duration: 0.5 });
      if (hintEl) gsap.to(hintEl, { opacity: 1, y: 0, duration: 0.5, delay: 0.3 });
      return;
    }

    this.drawCtx.clearRect(0, 0, 2048, 1024);
    this.canvasTexture.needsUpdate = true;
    this.canvasPlane.material.opacity = 1;
    this.solidTextGroup.material.opacity = 0;

    const startX = -4.25;
    this.wandGroup.position.set(startX, 0.1, 0.45);
    this.wandGroup.scale.set(0.001, 0.001, 0.001);
    this.wandTipLight.intensity = 0;

    if (roleEl) gsap.set(roleEl, { opacity: 0, y: 14 });
    if (hintEl) gsap.set(hintEl, { opacity: 0, y: 14 });

    this.camera.position.set(0, 0, 9.5);
    this.camera.lookAt(0, 0, 0);

    const tl = gsap.timeline();
    this.timeline = tl;

    // 0-2s: Hall reveals, camera push-in
    tl.to(this.camera.position, {
      z: 7.5,
      duration: 2.0,
      ease: 'power1.out'
    }, 0);

    // 2-3s: Wand appears at left and tip ignites smoothly
    tl.to(this.wandGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.0,
      ease: 'power2.out'
    }, 2.0);

    tl.to(this.wandTipLight, {
      intensity: 2.8,
      duration: 0.8,
      ease: 'power2.out'
    }, 2.2);

    // 3-7s: The wand smoothly writes the name with spaced letters
    const writeProgress = { t: 0 };
    tl.to(writeProgress, {
      t: 1,
      duration: 4.0,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.renderWritingStroke(writeProgress.t);
      }
    }, 3.0);

    // 7-8s: Flash burst & transform into permanent 3D gold letters
    tl.to(this.flashLight, {
      intensity: 7.0,
      duration: 0.15,
      ease: 'power2.in'
    }, 7.0);

    tl.to(this.canvasPlane.material, { opacity: 0, duration: 0.25 }, 7.1);

    tl.to(this.solidTextGroup.material, {
      opacity: 1,
      duration: 0.35,
      ease: 'power1.out',
      onComplete: () => {
        this.solidTextGroup.material.opacity = 1;
        this.solidTextGroup.visible = true;
      }
    }, 7.1);

    tl.to(this.flashLight, {
      intensity: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, 7.15);

    tl.to(this.wandGroup.scale, {
      x: 0, y: 0, z: 0,
      duration: 0.5,
      ease: 'power2.in'
    }, 7.2);

    // 8-9s: Subtitle fades in
    if (roleEl) {
      tl.to(roleEl, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, 8.0);
    }

    // 9-10s: Navigation hint fades in
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

    ctx.font = "italic bold 185px 'Cinzel Decorative', cursive, serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '18px';
    }

    const fullText = content.name;
    const charCount = Math.floor(progress * fullText.length);
    const partialText = fullText.slice(0, charCount).split('').join(' ');

    ctx.shadowColor = '#e8b04a';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeText(partialText, 1024, 512);

    ctx.fillStyle = '#f8d27a';
    ctx.fillText(partialText, 1024, 512);

    this.canvasTexture.needsUpdate = true;

    const textWidth = 8.5;
    const startX = -textWidth / 2;
    const targetX = startX + textWidth * progress;
    const targetY = Math.sin(progress * Math.PI * 6) * 0.22 - 0.1;

    this.wandGroup.position.x += (targetX - this.wandGroup.position.x) * 0.35;
    this.wandGroup.position.y += (targetY - this.wandGroup.position.y) * 0.35;
    this.wandGroup.position.z = 0.45;
  }

  skipToEnd() {
    if (this.timeline) this.timeline.seek(10);
    this.canvasPlane.material.opacity = 0;
    this.solidTextGroup.material.opacity = 1;
    this.solidTextGroup.visible = true;
    this.wandGroup.scale.set(0, 0, 0);
  }

  update(delta, time, mouseParallax) {
    for (let i = 0; i < this.candles.length; i++) {
      const c = this.candles[i];
      c.position.y = c.userData.baseY + Math.sin(time * c.userData.floatSpeed + c.userData.offset) * 0.15;
    }

    if (this.dustParticles) {
      this.dustParticles.rotation.y = time * 0.02;
    }

    if (mouseParallax) {
      if (this.cursorLight) {
        const targetLightX = mouseParallax.x * 5.2;
        const targetLightY = mouseParallax.y * 1.6;

        this.cursorLight.position.x += (targetLightX - this.cursorLight.position.x) * 0.08;
        this.cursorLight.position.y += (targetLightY - this.cursorLight.position.y) * 0.08;
        this.cursorLight.intensity = 8.5 + Math.sin(time * 12.0) * 0.6;
      }

      const targetCamX = mouseParallax.x * 1.5;
      const targetCamY = mouseParallax.y * 1.0;
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }
}