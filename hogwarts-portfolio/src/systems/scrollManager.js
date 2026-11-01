import * as THREE from 'three';
import gsap from 'gsap';

export class ScrollManager {
  constructor(camera) {
    this.camera = camera;
    this.scrollProgress = 0; // 0 = Room 1 (Hall), 1 = Transition/Hat, 2 = Great Hall
    this.targetScroll = 0;
    this.maxScroll = 2.0;

    this.isLocked = false;
    this.touchStartY = 0;

    // Room Camera Waypoints
    // Room 0: Name Hall (0, 0, 7.5) -> (0, 0, 0)
    // Room 1: Sorting Hat Room (0, 0, -28) -> (0, 0.4, -35)
    // Room 2: The Great Hall (0, 2.8, -75) -> (0, 2.5, -95)
    this.waypoints = [
      { cam: new THREE.Vector3(0, 0, 7.5), look: new THREE.Vector3(0, 0, 0) },
      { cam: new THREE.Vector3(0, 0.35, -28.5), look: new THREE.Vector3(0, 0.35, -34.5) },
      { cam: new THREE.Vector3(0, 2.8, -75.0), look: new THREE.Vector3(0, 2.4, -100.0) }
    ];

    this.onRoomChangeCallbacks = [];
    this.currentRoomIndex = 0;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('wheel', (e) => {
      if (this.isLocked) return;
      const delta = e.deltaY * 0.0012;
      this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + delta, 0, this.maxScroll);
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (this.isLocked) return;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isLocked) return;
      const touchY = e.touches[0].clientY;
      const delta = (this.touchStartY - touchY) * 0.003;
      this.touchStartY = touchY;
      this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + delta, 0, this.maxScroll);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (this.isLocked) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + 0.5, 0, this.maxScroll);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        this.targetScroll = THREE.MathUtils.clamp(this.targetScroll - 0.5, 0, this.maxScroll);
      }
    });
  }

  setLock(locked) {
    this.isLocked = locked;
  }

  scrollToRoom(index, duration = 1.8) {
    this.targetScroll = THREE.MathUtils.clamp(index, 0, this.maxScroll);
    gsap.to(this, {
      scrollProgress: this.targetScroll,
      duration,
      ease: 'power2.inOut'
    });
  }

  onRoomChange(cb) {
    this.onRoomChangeCallbacks.push(cb);
  }

  update(mouseParallax) {
    // Smooth scroll dampening
    this.scrollProgress += (this.targetScroll - this.scrollProgress) * 0.06;

    const p = this.scrollProgress;
    let baseCamPos = new THREE.Vector3();
    let baseLookPos = new THREE.Vector3();

    if (p <= 1.0) {
      // Lerp between Room 1 and Room 2
      const t = p;
      // Slight swirl wave flight curve during flight
      const swirlX = Math.sin(t * Math.PI) * 2.2;
      const swirlY = Math.cos(t * Math.PI) * 1.1;

      baseCamPos.lerpVectors(this.waypoints[0].cam, this.waypoints[1].cam, t);
      baseCamPos.x += swirlX;
      baseCamPos.y += swirlY;

      baseLookPos.lerpVectors(this.waypoints[0].look, this.waypoints[1].look, t);
    } else {
      // Lerp between Room 2 and Room 3
      const t = p - 1.0;
      baseCamPos.lerpVectors(this.waypoints[1].cam, this.waypoints[2].cam, t);
      baseLookPos.lerpVectors(this.waypoints[1].look, this.waypoints[2].look, t);
    }

    // Apply Parallax and update camera
    if (mouseParallax) {
      this.camera.position.x = baseCamPos.x + mouseParallax.x * 1.2;
      this.camera.position.y = baseCamPos.y + mouseParallax.y * 0.8;
      this.camera.position.z = baseCamPos.z;
    } else {
      this.camera.position.copy(baseCamPos);
    }

    this.camera.lookAt(baseLookPos);

    // Track room transitions for UI triggers
    const activeIndex = Math.round(this.scrollProgress);
    if (activeIndex !== this.currentRoomIndex) {
      this.currentRoomIndex = activeIndex;
      this.onRoomChangeCallbacks.forEach(cb => cb(activeIndex, this.scrollProgress));
    }
  }
}