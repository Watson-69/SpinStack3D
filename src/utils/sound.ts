/**
 * Procedural Web Audio synthesizer for HDD acoustics and UI feedback.
 * Encapsulates AudioContext initialization, mute state, and oscillator lifecycle.
 */
class HddSoundSystem {
  private ctx: AudioContext | null = null;
  private spindleGain: GainNode | null = null;
  private spindleOsc1: OscillatorNode | null = null;
  private spindleOsc2: OscillatorNode | null = null;
  private isSpindleRunning = false;
  private isMuted = false;

  public get muted(): boolean {
    return this.isMuted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => { });
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.spindleGain && this.ctx) {
      this.spindleGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.isSpindleRunning = false;
    }
  }

  /** Soft UI click for buttons, tabs, and camera presets. */
  public playUiClick(freq = 880, duration = 0.03): void {
    if (this.isMuted) return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore Web Audio permission/browser blocks
    }
  }

  /** Mechanical actuator voice-coil seek micro-stepping click. */
  public playSeekClick(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 800, now);
      filter.Q.setValueAtTime(4.0, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.015);

      noiseGain.gain.setValueAtTime(0.06, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch {
      // Ignore Web Audio errors
    }
  }

  /** Harmonic fluid-dynamic bearing spindle motor hum. */
  public updateSpindleMotor(isRunning: boolean, rpm: number): void {
    if (this.isMuted || !isRunning || rpm <= 0) {
      if (this.isSpindleRunning && this.spindleGain && this.ctx) {
        this.spindleGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.3);
        this.isSpindleRunning = false;
      }
      return;
    }

    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const baseFreq = (rpm / 60) * 2;
      const now = ctx.currentTime;

      if (!this.spindleGain) {
        this.spindleGain = ctx.createGain();
        this.spindleGain.gain.setValueAtTime(0, now);
        this.spindleGain.connect(ctx.destination);

        this.spindleOsc1 = ctx.createOscillator();
        this.spindleOsc1.type = 'sine';
        this.spindleOsc1.frequency.setValueAtTime(baseFreq, now);

        this.spindleOsc2 = ctx.createOscillator();
        this.spindleOsc2.type = 'triangle';
        this.spindleOsc2.frequency.setValueAtTime(baseFreq * 2, now);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.3, now);

        this.spindleOsc1.connect(this.spindleGain);
        this.spindleOsc2.connect(osc2Gain);
        osc2Gain.connect(this.spindleGain);

        this.spindleOsc1.start();
        this.spindleOsc2.start();
      }

      if (this.spindleOsc1 && this.spindleOsc2) {
        this.spindleOsc1.frequency.setTargetAtTime(baseFreq, now, 0.2);
        this.spindleOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.2);
        this.spindleGain.gain.setTargetAtTime(0.018, now, 0.2);
        this.isSpindleRunning = true;
      }
    } catch {
      // Ignore Web Audio failures
    }
  }

  public dispose(): void {
    try {
      this.spindleOsc1?.stop();
      this.spindleOsc2?.stop();
      this.spindleOsc1?.disconnect();
      this.spindleOsc2?.disconnect();
      this.spindleGain?.disconnect();
      void this.ctx?.close();
    } catch {
      // Ignore cleanup errors
    } finally {
      this.spindleOsc1 = null;
      this.spindleOsc2 = null;
      this.spindleGain = null;
      this.ctx = null;
      this.isSpindleRunning = false;
    }
  }
}

export const sound = new HddSoundSystem();
