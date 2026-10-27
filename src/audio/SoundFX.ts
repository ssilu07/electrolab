// ============================================================================
// Procedural Web Audio Synthesizer Engine
// Real-time procedural audio generation for clicks, pops, buzzers, and sparks
// ============================================================================

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private continuityOsc: OscillatorNode | null = null;
  private continuityGain: GainNode | null = null;
  private circuitBuzzerOsc: OscillatorNode | null = null;
  private circuitBuzzerGain: GainNode | null = null;
  private burnNoiseNode: AudioBufferSourceNode | null = null;
  private burnGain: GainNode | null = null;

  constructor() {
    // Lazy initialization on first user interaction
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopContinuity();
      this.stopCircuitBuzzer();
      this.stopBurn();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Tactile mechanical switch / push-button click
   */
  public playClick(pitchMultiplier: number = 1.0): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * Dial rotation tick
   */
  public playDialTick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.015);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.02);
  }

  /**
   * Wire snap / breadboard insertion chirp
   */
  public playConnect(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Wire removal
   */
  public playDisconnect(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Catastrophic explosion / POP sound
   * Uses white noise burst with filter sweep and low-frequency transient
   */
  public playExplosion(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.35;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Deep sub bass thump
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.25);

    subGain.gain.setValueAtTime(0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.35);
    subOsc.start(t);
    subOsc.stop(t + 0.25);
  }

  /**
   * Sizzle / frying sound for short-circuit wire / burnt resistor
   */
  public startBurn(): void {
    if (this.isMuted || this.burnNoiseNode) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    this.burnNoiseNode = ctx.createBufferSource();
    this.burnNoiseNode.buffer = buffer;
    this.burnNoiseNode.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500, t);
    filter.Q.setValueAtTime(3.0, t);

    this.burnGain = ctx.createGain();
    this.burnGain.gain.setValueAtTime(0.05, t);

    this.burnNoiseNode.connect(filter);
    filter.connect(this.burnGain);
    this.burnGain.connect(ctx.destination);

    this.burnNoiseNode.start(t);
  }

  public stopBurn(): void {
    if (this.burnNoiseNode) {
      try {
        this.burnNoiseNode.stop();
        this.burnNoiseNode.disconnect();
      } catch {}
      this.burnNoiseNode = null;
      this.burnGain = null;
    }
  }

  /**
   * Multimeter Continuity 2kHz Beeper
   */
  public updateContinuity(active: boolean): void {
    if (this.isMuted || !active) {
      this.stopContinuity();
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    if (!this.continuityOsc) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2048, ctx.currentTime); // Standard DMM 2048Hz beep
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.continuityOsc = osc;
      this.continuityGain = gain;
    }
  }

  public stopContinuity(): void {
    if (this.continuityOsc) {
      try {
        this.continuityOsc.stop();
        this.continuityOsc.disconnect();
      } catch {}
      this.continuityOsc = null;
      this.continuityGain = null;
    }
  }

  /**
   * Circuit Piezo Buzzer tone
   */
  public updateCircuitBuzzer(active: boolean, freq: number = 1800, volume: number = 0.2): void {
    if (this.isMuted || !active) {
      this.stopCircuitBuzzer();
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    if (!this.circuitBuzzerOsc) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(Math.max(50, Math.min(8000, freq)), ctx.currentTime);
      gain.gain.setValueAtTime(Math.min(0.25, volume * 0.2), ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.circuitBuzzerOsc = osc;
      this.circuitBuzzerGain = gain;
    } else {
      const t = ctx.currentTime;
      this.circuitBuzzerOsc.frequency.setTargetAtTime(Math.max(50, Math.min(8000, freq)), t, 0.03);
      if (this.circuitBuzzerGain) {
        this.circuitBuzzerGain.gain.setTargetAtTime(Math.min(0.25, volume * 0.2), t, 0.03);
      }
    }
  }

  public stopCircuitBuzzer(): void {
    if (this.circuitBuzzerOsc) {
      try {
        this.circuitBuzzerOsc.stop();
        this.circuitBuzzerOsc.disconnect();
      } catch {}
      this.circuitBuzzerOsc = null;
      this.circuitBuzzerGain = null;
    }
  }

  /**
   * Celebratory Victory Fanfare (4-note arpeggio chord)
   */
  public playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, index) => {
      const noteTime = t + index * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.46);
    });
  }
}

export const soundFX = new SoundFXEngine();
