import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class SortingHatScene {
  constructor(scene, houseThemeManager, scrollManager) {
    this.scene = scene;
    this.houseTheme = houseThemeManager;
    this.scrollManager = scrollManager;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, -34.5); // Placed at waypoint 1
    this.scene.add(this.group);

    // 3D Objects
    this.hatMesh = null;
    this.mouthCrease = null;
    this.spotlight = null;
    this.stool = null;
    this.vortexParticles = null;
    this.shockwaveMesh = null;

    // State
    this.isActive = false;
    this.ceremonyDone = false;
    this.currentQuestionIdx = 0;
    this.scores = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    this.mouthTimeline = null;

    this.init();
    this.buildVortexTransition();
    this.initUI();
  }

  init() {
    this.buildStool();
    this.buildRealisticHat();
    this.buildSpotlight();
    this.buildShockwave();
  }

  buildStool() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x2e1a0e,
      roughness: 0.8,
      metalness: 0.1
    });

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 18), woodMat);
    seat.position.y = -0.55;
    seat.receiveShadow = true;
    seat.castShadow = true;
    this.group.add(seat);

    // 3 Splayed Stool Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.6, 12);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(Math.cos(angle) * 0.55, -1.35, Math.sin(angle) * 0.55);
      leg.rotation.z = Math.sin(angle) * 0.18;
      leg.rotation.x = Math.cos(angle) * 0.18;
      leg.castShadow = true;
      this.group.add(leg);
    }
  }

  buildRealisticHat() {
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, -0.45, 0);

    // Worn ancient brown leather material
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3b2416,
      roughness: 0.88,
      metalness: 0.08,
      bumpScale: 0.06
    });

    // 1. Hat Brim with realistic uneven folds
    const brimGeo = new THREE.TorusGeometry(0.95, 0.22, 16, 32);
    const pos = brimGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      pos.setY(i, y + Math.sin(x * 4.0) * 0.07 + Math.cos(z * 3.0) * 0.05);
    }
    brimGeo.computeVertexNormals();

    const brim = new THREE.Mesh(brimGeo, leatherMat);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1.15, 1.0, 0.35);
    hatGroup.add(brim);

    // 2. Conical Body with natural wrinkles and peak bend
    const coneGeo = new THREE.ConeGeometry(0.72, 1.85, 24, 24);
    const cPos = coneGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const y = cPos.getY(i);
      const x = cPos.getX(i);
      const z = cPos.getZ(i);
      // Bend hat tip backward and to the side
      if (y > 0) {
        cPos.setZ(i, z - Math.pow(y + 0.9, 1.8) * 0.16);
        cPos.setX(i, x + Math.pow(y + 0.9, 1.6) * 0.08);
      }
      // Fold wrinkles
      const wrinkle = Math.sin(y * 12.0) * 0.04;
      cPos.setX(i, cPos.getX(i) + wrinkle);
    }
    coneGeo.computeVertexNormals();

    this.hatMesh = new THREE.Mesh(coneGeo, leatherMat);
    this.hatMesh.position.y = 0.88;
    this.hatMesh.castShadow = true;
    hatGroup.add(this.hatMesh);

    // 3. Eyebrow crease / folds
    const browGeo = new THREE.TorusGeometry(0.32, 0.045, 8, 16, Math.PI);
    const brow = new THREE.Mesh(browGeo, leatherMat);
    brow.position.set(0, 0.72, 0.44);
    brow.rotation.x = -0.3;
    hatGroup.add(brow);

    // 4. Animated Mouth Crease
    const mouthGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0x1a0f09,
      roughness: 0.95
    });
    this.mouthCrease = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthCrease.rotation.z = Math.PI / 2;
    this.mouthCrease.position.set(0, 0.45, 0.52);
    hatGroup.add(this.mouthCrease);

    // 5. Patches on the hat
    const patchGeo = new THREE.PlaneGeometry(0.18, 0.18);
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x4d321d,
      roughness: 0.92
    });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(-0.25, 0.95, 0.35);
    patch.rotation.y = -0.4;
    patch.rotation.x = 0.1;
    hatGroup.add(patch);

    this.group.add(hatGroup);
  }

  buildSpotlight() {
    this.spotlight = new THREE.SpotLight(0xfff1cf, 4.5);
    this.spotlight.position.set(0, 5.0, 1.5);
    this.spotlight.target = this.hatMesh;
    this.spotlight.angle = 0.38;
    this.spotlight.penumbra = 0.6;
    this.spotlight.decay = 1.4;
    this.spotlight.distance = 12;
    this.spotlight.castShadow = true;
    this.spotlight.shadow.bias = -0.001;
    this.group.add(this.spotlight);

    // Back rim light to outline hat silhouette
    const rimLight = new THREE.PointLight(0x7fa2d6, 1.6, 6);
    rimLight.position.set(0, 1.5, -2.5);
    this.group.add(rimLight);
  }

  buildVortexTransition() {
    // Magic smoke & floating candle vortex bridging Room 1 -> Room 2 (-5 to -26 Z)
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = i * 0.28;
      const radius = 2.0 + Math.random() * 3.5;
      const z = -6 - (i / count) * 22; // spanning between the rooms

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = z;

      scales[i] = Math.random() * 0.18 + 0.05;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xdfb46c,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.vortexParticles = new THREE.Points(geo, mat);
    this.scene.add(this.vortexParticles);
  }

  buildShockwave() {
    const geo = new THREE.RingGeometry(0.2, 0.45, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe89e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.shockwaveMesh = new THREE.Mesh(geo, mat);
    this.shockwaveMesh.position.set(0, 0.45, 0.8);
    this.group.add(this.shockwaveMesh);
  }

  initUI() {
    // Mount Sorting Hat Container inside body
    const el = document.createElement('div');
    el.id = 'sorting-hat-ui';
    el.className = 'sorting-ui-container hidden';

    el.innerHTML = `
      <div id="hat-speech-bubble" class="hat-speech-bubble">
        <p id="hat-typed-text" class="speech-text"></p>
      </div>

      <div id="sorting-start-actions" class="sorting-actions-row">
        <button id="btn-hat-decide" class="hogwarts-btn primary">${content.sortingHat.btnDecide}</button>
        <button id="btn-hat-choose" class="hogwarts-btn">${content.sortingHat.btnChoose}</button>
      </div>

      <div id="sorting-quiz-card" class="sorting-quiz-card hidden">
        <div id="quiz-question" class="quiz-question"></div>
        <div id="quiz-options" class="quiz-options"></div>
      </div>

      <div id="sorting-crests-grid" class="crests-grid hidden">
        ${content.sortingHat.crests.map(c => `
          <div class="crest-card" data-house="${c.id}" style="--crest-accent: ${c.accent}">
            <div class="crest-icon-box">
              <span class="crest-symbol">${c.symbol}</span>
            </div>
            <h3 class="crest-name">${c.name}</h3>
            <p class="crest-sub">${c.subtitle}</p>
          </div>
        `).join('')}
      </div>

      <div id="sorting-result-banner" class="sorting-result-banner hidden">
        <div class="result-badge">Sorted Into</div>
        <h1 id="result-house-title" class="result-house-title">Gryffindor</h1>
        <button id="btn-continue-hall" class="hogwarts-btn primary">Proceed to Great Hall</button>
      </div>

      <button id="btn-skip-sorting" class="skip-link sorting-skip">${content.sortingHat.btnSkip}</button>

      <div id="change-house-widget" class="change-house-widget hidden">
        <span id="current-house-tag" class="house-tag"></span>
        <button id="btn-change-house" class="ghost-btn">${content.sortingHat.btnChangeHouse}</button>
      </div>
    `;

    document.body.appendChild(el);
    this.bindUIEvents();
  }

  bindUIEvents() {
    const btnDecide = document.getElementById('btn-hat-decide');
    const btnChoose = document.getElementById('btn-hat-choose');
    const btnSkip = document.getElementById('btn-skip-sorting');
    const btnChange = document.getElementById('btn-change-house');
    const btnProceed = document.getElementById('btn-continue-hall');

    btnDecide?.addEventListener('click', () => this.startQuiz());
    btnChoose?.addEventListener('click', () => this.showCrests());
    btnSkip?.addEventListener('click', () => this.pickRandomHouse());
    btnChange?.addEventListener('click', () => this.reopenCeremony());
    btnProceed?.addEventListener('click', () => this.scrollManager.scrollToRoom(2));

    // Crest card clicks
    document.querySelectorAll('.crest-card').forEach(card => {
      card.addEventListener('click', () => {
        const house = card.getAttribute('data-house');
        this.concludeSorting(house);
      });
    });
  }

  onEnterRoom() {
    const saved = this.houseTheme.loadSavedHouse();
    const ui = document.getElementById('sorting-hat-ui');
    if (ui) ui.classList.remove('hidden');

    if (saved && !this.ceremonyDone) {
      // Returning visitor flow: show current house tag and change button
      this.showReturningVisitorState(saved);
    } else if (!this.ceremonyDone) {
      this.wakeUpHat();
    }
  }

  wakeUpHat() {
    this.animateMouth(3.5);
    this.typeSpeech(content.sortingHat.initialSpeech, () => {
      document.getElementById('sorting-start-actions')?.classList.remove('hidden');
    });
  }

  showReturningVisitorState(houseId) {
    const widget = document.getElementById('change-house-widget');
    const tag = document.getElementById('current-house-tag');
    const bubble = document.getElementById('hat-speech-bubble');
    const textEl = document.getElementById('hat-typed-text');
    const actions = document.getElementById('sorting-start-actions');

    if (actions) actions.classList.add('hidden');
    if (widget) widget.classList.remove('hidden');
    if (tag) tag.textContent = `House: ${houseId.toUpperCase()}`;

    this.typeSpeech(content.sortingHat.subsequentSpeech);
    this.animateMouth(2.0);
  }

  reopenCeremony() {
    document.getElementById('change-house-widget')?.classList.add('hidden');
    document.getElementById('sorting-result-banner')?.classList.add('hidden');
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');
    document.getElementById('sorting-start-actions')?.classList.remove('hidden');

    this.scores = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    this.currentQuestionIdx = 0;
    this.wakeUpHat();
  }

  startQuiz() {
    document.getElementById('sorting-start-actions')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');
    const quizCard = document.getElementById('sorting-quiz-card');
    quizCard?.classList.remove('hidden');

    this.currentQuestionIdx = 0;
    this.renderQuestion();
  }

  renderQuestion() {
    const qData = content.sortingHat.quiz[this.currentQuestionIdx];
    const qText = document.getElementById('quiz-question');
    const optsContainer = document.getElementById('quiz-options');

    if (!qData || !qText || !optsContainer) return;

    qText.textContent = `Q${this.currentQuestionIdx + 1}. ${qData.question}`;
    optsContainer.innerHTML = '';

    qData.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'hogwarts-btn quiz-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        // Apply scoring table
        Object.entries(opt.houses).forEach(([house, pts]) => {
          this.scores[house] = (this.scores[house] || 0) + pts;
        });

        this.currentQuestionIdx++;
        if (this.currentQuestionIdx < content.sortingHat.quiz.length) {
          this.renderQuestion();
        } else {
          this.resolveQuizResults();
        }
      });
      optsContainer.appendChild(btn);
    });
  }

  resolveQuizResults() {
    let max = -1;
    let winners = [];
    Object.entries(this.scores).forEach(([house, val]) => {
      if (val > max) {
        max = val;
        winners = [house];
      } else if (val === max) {
        winners.push(house);
      }
    });

    // Break ties randomly
    const finalHouse = winners[Math.floor(Math.random() * winners.length)];
    this.concludeSorting(finalHouse);
  }

  showCrests() {
    document.getElementById('sorting-start-actions')?.classList.add('hidden');
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.remove('hidden');
    this.typeSpeech("Choose the banner of your soul...");
  }

  pickRandomHouse() {
    const list = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    this.concludeSorting(chosen);
  }

  concludeSorting(houseId) {
    this.ceremonyDone = true;
    this.houseTheme.saveHouse(houseId);

    // Hide selection UI
    document.getElementById('sorting-start-actions')?.classList.add('hidden');
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');

    // Trigger mouth animation shouts
    this.animateMouth(3.0);
    this.typeSpeech(`"${houseId.toUpperCase()}!"`);

    // Big visual celebration: Hat jump, spotlight flash, shockwave
    this.triggerCelebrationEffect(houseId);

    // Show result card
    setTimeout(() => {
      const banner = document.getElementById('sorting-result-banner');
      const title = document.getElementById('result-house-title');
      const data = this.houseTheme.getThemeData(houseId);

      if (banner && title && data) {
        title.textContent = data.name.toUpperCase();
        title.style.color = data.glow;
        banner.classList.remove('hidden');
      }
    }, 1200);
  }

  triggerCelebrationEffect(houseId) {
    const data = this.houseTheme.getThemeData(houseId);
    const color = data ? new THREE.Color(data.particleColor) : new THREE.Color(0xffe89e);

    // 1. Hat Jump & wiggle
    gsap.timeline()
      .to(this.hatMesh.position, { y: 1.15, duration: 0.25, ease: 'power2.out' })
      .to(this.hatMesh.rotation, { z: 0.15, duration: 0.15, yoyo: true, repeat: 3 })
      .to(this.hatMesh.position, { y: 0.88, duration: 0.4, ease: 'bounce.out' });

    // 2. Spotlight Flash (short, soft, never loops)
    gsap.timeline()
      .to(this.spotlight, { intensity: 10.0, duration: 0.15 })
      .to(this.spotlight, { intensity: 4.5, duration: 0.8, ease: 'power1.out' });

    // 3. Colored expanding shockwave
    if (this.shockwaveMesh) {
      this.shockwaveMesh.material.color.copy(color);
      this.shockwaveMesh.scale.set(1, 1, 1);
      this.shockwaveMesh.material.opacity = 0.9;

      gsap.to(this.shockwaveMesh.scale, {
        x: 18,
        y: 18,
        duration: 1.2,
        ease: 'power2.out'
      });

      gsap.to(this.shockwaveMesh.material, {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out'
      });
    }

    // 4. Screen DOM flash & shockwave ring
    const flashEl = document.createElement('div');
    flashEl.className = 'sorting-screen-flash';
    flashEl.style.backgroundColor = data ? data.glow : '#ffffff';
    document.body.appendChild(flashEl);
    setTimeout(() => flashEl.remove(), 700);
  }

  animateMouth(duration = 2.0) {
    if (this.mouthTimeline) this.mouthTimeline.kill();
    this.mouthTimeline = gsap.timeline({ repeat: Math.floor(duration * 3.5), yoyo: true });
    this.mouthTimeline
      .to(this.mouthCrease.scale, { y: 2.8, z: 1.4, duration: 0.14, ease: 'power1.inOut' })
      .to(this.mouthCrease.rotation, { x: 0.2, duration: 0.14, ease: 'power1.inOut' });

    setTimeout(() => {
      if (this.mouthTimeline) this.mouthTimeline.kill();
      gsap.to(this.mouthCrease.scale, { y: 1, z: 1, duration: 0.2 });
      gsap.to(this.mouthCrease.rotation, { x: 0, duration: 0.2 });
    }, duration * 1000);
  }

  typeSpeech(text, onComplete) {
    const el = document.getElementById('hat-typed-text');
    if (!el) return;
    el.textContent = '';
    let idx = 0;
    const timer = setInterval(() => {
      el.textContent += text[idx];
      idx++;
      if (idx >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 32);
  }

  update(time) {
    // Hat breathing idle motion
    if (this.hatMesh) {
      this.hatMesh.rotation.y = Math.sin(time * 0.8) * 0.05;
    }

    // Spin vortex particles in transition hallway
    if (this.vortexParticles) {
      this.vortexParticles.rotation.z = time * 0.15;
    }
  }
}