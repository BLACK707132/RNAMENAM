class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private muted = false;

  public setMuted(m: boolean) {
    this.muted = m;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Call on first user touch/click to reliably unlock iOS Safari / mobile WebAudio */
  public unlock() {
    this.ensureCtx();
  }

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Reusable 1-second white noise buffer (zero per-frame allocations during burnout/scrapes) */
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    try {
      if (this.noiseBuf && this.noiseBuf.sampleRate === ctx.sampleRate) {
        return this.noiseBuf;
      }
      const len = Math.max(1024, Math.floor(ctx.sampleRate * 1.0));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuf = buf;
      return buf;
    } catch {
      return null;
    }
  }

  public playCoinBank(amount: number) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = amount >= 250 ? [587.33, 880, 1174.66] : [587.33, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.065 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.24);
      });
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  public playBuy() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        gain.gain.setValueAtTime(0.001, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.055 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.22);
      });
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  private lastImpactTime = 0;

  public playCrash() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.28);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  public playImpact(intensity = 0.6, metallic = false) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (now - this.lastImpactTime < 0.085) return;
      this.lastImpactTime = now;
      const vol = Math.max(0.03, Math.min(0.16, intensity * 0.14));

      // Muffled asphalt impact thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = metallic ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(metallic ? 240 + Math.random() * 90 : 105, now);
      osc.frequency.exponentialRampToValueAtTime(metallic ? 68 : 34, now + 0.13);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

      // Brief gritty asphalt scrape burst using reusable noise buffer
      const buf = this.getNoiseBuffer(ctx);
      if (buf) {
        const dur = 0.09;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(metallic ? 1850 : 620, now);
        filter.Q.setValueAtTime(1.1, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(vol * 0.7, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now, Math.random() * 0.7, dur);
      }
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  private lastScrapeTime = 0;

  /** Metallic stunt-bugel scrape (чирк) against asphalt */
  public playScrape(intensity = 0.8) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (now - this.lastScrapeTime < 0.068) return;
      this.lastScrapeTime = now;

      const vol = Math.max(0.035, Math.min(0.14, intensity * 0.11));
      const dur = 0.085;
      const buf = this.getNoiseBuffer(ctx);
      if (buf) {
        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2400 + Math.random() * 900, now);
        bp.Q.setValueAtTime(3.2, now);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(vol, now + 0.014);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(bp);
        bp.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now, Math.random() * 0.75, dur);
      }

      // Subtle high metallic ring overtone
      const ring = ctx.createOscillator();
      const rGain = ctx.createGain();
      ring.type = 'sawtooth';
      ring.frequency.setValueAtTime(1680 + Math.random() * 480, now);
      rGain.gain.setValueAtTime(vol * 0.18, now);
      rGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
      ring.connect(rGain);
      rGain.connect(ctx.destination);
      ring.start(now);
      ring.stop(now + dur);
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  private lastBurnoutTime = 0;

  /** Hot rubber tire screech & high-RPM electric motor whine during stationary burnout */
  public playBurnout(intensity = 0.85) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (now - this.lastBurnoutTime < 0.075) return;
      this.lastBurnoutTime = now;

      const vol = Math.max(0.03, Math.min(0.11, intensity * 0.095));
      const dur = 0.095;
      const buf = this.getNoiseBuffer(ctx);

      if (buf) {
        // Filtered tire-rubber screech
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1180 + Math.random() * 260, now);
        bp.Q.setValueAtTime(4.8, now);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(vol, now + 0.016);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(bp);
        bp.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now, Math.random() * 0.75, dur);
      }

      // Subtle high-RPM hub/chain drive whine
      const whine = ctx.createOscillator();
      const wGain = ctx.createGain();
      whine.type = 'triangle';
      whine.frequency.setValueAtTime(420 + Math.random() * 45, now);
      wGain.gain.setValueAtTime(vol * 0.24, now);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.92);
      whine.connect(wGain);
      wGain.connect(ctx.destination);
      whine.start(now);
      whine.stop(now + dur);
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  public playTick() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.028);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  public playWin(legendary = false) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = legendary
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
        : [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.07 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  public playFever() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Hype rising synth fanfare when entering FIRE x2 Fever Mode
      [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now + idx * 0.045);
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        gain.gain.setValueAtTime(0.001, now + idx * 0.045);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.045 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.28);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.3);
      });
    } catch {
      // Ignore mobile WebAudio errors
    }
  }

  public playPromo() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Golden jackpot chime for promo activation
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        gain.gain.setValueAtTime(0.001, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.055 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.38);
      });
    } catch {
      // Ignore mobile WebAudio errors
    }
  }
}

export const sound = new SoundEngine();
