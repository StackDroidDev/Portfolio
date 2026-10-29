export class ProceduralAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.padGain = null;
    this.crackleGain = null;
    this.isMuted = true;
    this.volume = 0.7;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startAmbientPad();
    this.startCandleCrackle();
    this.initialized = true;
  }

  setMuted(mute) {
    this.isMuted = mute;
    if (!this.ctx) return;
    const target = this.isMuted ? 0 : this.volume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  setVolume(vol) {
    this.volume = vol;
    if (!this.isMuted && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  startAmbientPad() {
    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.padGain.connect(this.masterGain);

    // Warm mystical drone chord: D minor9 (D2, A2, F3, E4)
    const freqs = [73.42, 110.0, 174.61, 329.63];
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, this.ctx.currentTime);

      // Gentle LFO for shimmer
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12 + Math.random() * 0.1, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
      lfo.connect(filter.frequency);
      lfo.start();

      osc.connect(filter);
      filter.connect(this.padGain);
      osc.start();
    });
  }

  startCandleCrackle() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Soft pink noise
      const white = Math.random() * 2 - 1;
      data[i] = (Math.random() > 0.998) ? (Math.random() * 0.8) : (white * 0.02);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.crackleGain = this.ctx.createGain();
    this.crackleGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.crackleGain);
    this.crackleGain.connect(this.masterGain);
    noise.start();
  }

  playSparkle() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 1600 + Math.random() * 1200;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playTransformationChime() {
    if (this.isMuted || !this.ctx) return;
    // Layered bell harmonics
    const tones = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    tones.forEach((tone, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.1 / (idx + 1), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + 2.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);
    });
  }
}