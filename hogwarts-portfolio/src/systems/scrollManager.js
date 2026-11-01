import * as THREE from 'three';
import gsap from 'gsap';

export class ScrollManager {
  constructor(camera) {
    this.camera = camera;
    this.scrollProgress = 0; // 0: Name, 1: Sorting Hat, 2: Great Hall, 3: Divination, 4: Grand Staircase
    this.targetScroll = 0;
    this.maxScroll = 4.0;

    this.isLocked = false;
    this.touchStartY = 0;

    // Room Camera Waypoints
this.waypoints = [
      // Room 0: Name Hall
      { cam: new THREE.Vector3(0, 0, 7.5), look: new THREE.Vector3(0, 0, 0) },
      // Room 1: Sorting Hat Room
      { cam: new THREE.Vector3(0, 0.35, -28.0), look: new THREE.Vector3(0, 0.45, -32.0) },
      // Room 2: The Great Hall (center aisle)
      { cam: new THREE.Vector3(0, 2.4, -85.0), look: new THREE.Vector3(0, 3.0, -115.0) },
      // Room 3: Divination Tower (Camera sits eye-level right in front of the 3 crystal orbs)
      { cam: new THREE.Vector3(0, 1.8, -135.0), look: new THREE.Vector3(0, 1.6, -140.0) },
      // Room 4: Grand Staircase Timeline (Centered directly facing the milestone landings)
      { cam: new THREE.Vector3(0, 4.0, -172.0), look: new THREE.Vector3(0, 5.0, -188.0) }
    ];

    this.onRoomChangeCallbacks = [];
    this.currentRoomIndex = 0;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('wheel', (e) => {
      if (this.isLocked) return;
      const delta = e.deltaY * 0.001;
      this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + delta, 0, this.maxScroll);
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (this.isLocked) return;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isLocked) return;
      const touchY = e.touches[0].clientY;
      const delta = (this.touchStartY - touchY) * 0.0028;
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
    this.scrollProgress += (this.targetScroll - this.scrollProgress) * 0.06;

    const p = this.scrollProgress;
    const baseCamPos = new THREE.Vector3();
    const baseLookPos = new THREE.Vector3();

    const segIndex = Math.min(Math.floor(p), this.waypoints.length - 2);
    const segT = p - segIndex;

    const wpA = this.waypoints[segIndex];
    const wpB = this.waypoints[segIndex + 1];

    if (segIndex === 2) {
      // Transition 2 -> 3: Spiral Stair Flight up through smoke
      const spiralAngle = segT * Math.PI * 3.5;
      const radius = 3.2 * (1.0 - segT * 0.4);
      baseCamPos.lerpVectors(wpA.cam, wpB.cam, segT);
      baseCamPos.x += Math.cos(spiralAngle) * radius;
      baseCamPos.y += Math.sin(segT * Math.PI) * 1.5;

      baseLookPos.lerpVectors(wpA.look, wpB.look, segT);
    } else if (segIndex === 3) {
      // Transition 3 -> 4: Float down through floor hole into Stair Hall
      baseCamPos.lerpVectors(wpA.cam, wpB.cam, segT);
      baseCamPos.y -= Math.sin(segT * Math.PI) * 2.8;
      baseLookPos.lerpVectors(wpA.look, wpB.look, segT);
    } else {
      // Standard room flights
      baseCamPos.lerpVectors(wpA.cam, wpB.cam, segT);
      baseLookPos.lerpVectors(wpA.look, wpB.look, segT);
    }

    if (mouseParallax) {
      this.camera.position.x = baseCamPos.x + mouseParallax.x * 1.2;
      this.camera.position.y = baseCamPos.y + mouseParallax.y * 0.8;
      this.camera.position.z = baseCamPos.z;
    } else {
      this.camera.position.copy(baseCamPos);
    }

    this.camera.lookAt(baseLookPos);

    const activeIndex = Math.round(this.scrollProgress);
    if (activeIndex !== this.currentRoomIndex) {
      this.currentRoomIndex = activeIndex;
      this.onRoomChangeCallbacks.forEach(cb => cb(activeIndex, this.scrollProgress));
    }
  }
}