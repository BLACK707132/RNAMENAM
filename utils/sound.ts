interface MotorAcousticProfile {
  statorType: OscillatorType;
  statorMinHz: number;
  statorMaxHz: number;
  lpMinHz: number;
  lpMaxHz: number;
  whineType: OscillatorType;
  whineMinHz: number;
  whineMaxHz: number;
  statorGain: number;
  whineGain: number;
  chainGain: number;
  chainHz: number;
  stockDual: boolean;
}

const MOTOR_PROFILES: Record<string, MotorAcousticProfile> = {
  // Light Commuter Hub
  c3: {
    statorType: 'triangle',
    statorMinHz: 95,
    statorMaxHz: 310,
    lpMinHz: 260,
    lpMaxHz: 850,
    whineType: 'sine',
    whineMinHz: 290,
    whineMaxHz: 780,
    statorGain: 0.32,
    whineGain: 0.24,
    chainGain: 0.04,
    chainHz: 900,
    stockDual: false,
  },
  m2: {
    statorType: 'triangle',
    statorMinHz: 88,
    statorMaxHz: 295,
    lpMinHz: 240,
    lpMaxHz: 820,
    whineType: 'sine',
    whineMinHz: 260,
    whineMaxHz: 720,
    statorGain: 0.36,
    whineGain: 0.22,
    chainGain: 0.05,
    chainHz: 850,
    stockDual: false,
  },
  g77: {
    statorType: 'triangle',
    statorMinHz: 84,
    statorMaxHz: 280,
    lpMinHz: 250,
    lpMaxHz: 880,
    whineType: 'sine',
    whineMinHz: 250,
    whineMaxHz: 740,
    statorGain: 0.38,
    whineGain: 0.25,
    chainGain: 0.05,
    chainHz: 820,
    stockDual: false,
  },
  // Sport BLDC Hub (Kugoo G-series, Teverun)
  g2: {
    statorType: 'sawtooth',
    statorMinHz: 78,
    statorMaxHz: 340,
    lpMinHz: 280,
    lpMaxHz: 1120,
    whineType: 'triangle',
    whineMinHz: 290,
    whineMaxHz: 960,
    statorGain: 0.34,
    whineGain: 0.28,
    chainGain: 0.06,
    chainHz: 980,
    stockDual: false,
  },
  gm: {
    statorType: 'sawtooth',
    statorMinHz: 82,
    statorMaxHz: 390,
    lpMinHz: 310,
    lpMaxHz: 1280,
    whineType: 'triangle',
    whineMinHz: 320,
    whineMaxHz: 1120,
    statorGain: 0.38,
    whineGain: 0.32,
    chainGain: 0.07,
    chainHz: 1050,
    stockDual: true,
  },
  g2max: {
    statorType: 'sawtooth',
    statorMinHz: 74,
    statorMaxHz: 365,
    lpMinHz: 260,
    lpMaxHz: 1180,
    whineType: 'triangle',
    whineMinHz: 350,
    whineMaxHz: 1180,
    statorGain: 0.36,
    whineGain: 0.31,
    chainGain: 0.06,
    chainHz: 940,
    stockDual: false,
  },
  f3: {
    statorType: 'sawtooth',
    statorMinHz: 84,
    statorMaxHz: 425,
    lpMinHz: 320,
    lpMaxHz: 1420,
    whineType: 'sine',
    whineMinHz: 360,
    whineMaxHz: 1320,
    statorGain: 0.38,
    whineGain: 0.35,
    chainGain: 0.07,
    chainHz: 1100,
    stockDual: true,
  },
  teverun: {
    statorType: 'sawtooth',
    statorMinHz: 82,
    statorMaxHz: 410,
    lpMinHz: 310,
    lpMaxHz: 1380,
    whineType: 'sine',
    whineMinHz: 380,
    whineMaxHz: 1360,
    statorGain: 0.36,
    whineGain: 0.36,
    chainGain: 0.07,
    chainHz: 1150,
    stockDual: true,
  },
  g2ultra: {
    statorType: 'sawtooth',
    statorMinHz: 80,
    statorMaxHz: 405,
    lpMinHz: 300,
    lpMaxHz: 1360,
    whineType: 'triangle',
    whineMinHz: 330,
    whineMaxHz: 1220,
    statorGain: 0.38,
    whineGain: 0.34,
    chainGain: 0.07,
    chainHz: 1080,
    stockDual: true,
  },
  g2pro: {
    statorType: 'sawtooth',
    statorMinHz: 94,
    statorMaxHz: 495,
    lpMinHz: 340,
    lpMaxHz: 1620,
    whineType: 'triangle',
    whineMinHz: 410,
    whineMaxHz: 1480,
    statorGain: 0.4,
    whineGain: 0.36,
    chainGain: 0.08,
    chainHz: 1200,
    stockDual: false,
  },
  // Dual High-Amp Hyper-Scooters
  g4max: {
    statorType: 'sawtooth',
    statorMinHz: 68,
    statorMaxHz: 375,
    lpMinHz: 260,
    lpMaxHz: 1450,
    whineType: 'sine',
    whineMinHz: 420,
    whineMaxHz: 1640,
    statorGain: 0.45,
    whineGain: 0.4,
    chainGain: 0.09,
    chainHz: 1180,
    stockDual: true,
  },
  thunder3: {
    statorType: 'sawtooth',
    statorMinHz: 68,
    statorMaxHz: 465,
    lpMinHz: 320,
    lpMaxHz: 2150,
    whineType: 'sine',
    whineMinHz: 520,
    whineMaxHz: 2320,
    statorGain: 0.48,
    whineGain: 0.48,
    chainGain: 0.13,
    chainHz: 1440,
    stockDual: true,
  },
  // Mid-Drive Belt + Chain Electric Pitbikes
  wish01: {
    statorType: 'sawtooth',
    statorMinHz: 112,
    statorMaxHz: 495,
    lpMinHz: 380,
    lpMaxHz: 1680,
    whineType: 'sine',
    whineMinHz: 420,
    whineMaxHz: 1620,
    statorGain: 0.34,
    whineGain: 0.34,
    chainGain: 0.24,
    chainHz: 1460,
    stockDual: false,
  },
  wish02pro: {
    statorType: 'sawtooth',
    statorMinHz: 122,
    statorMaxHz: 580,
    lpMinHz: 410,
    lpMaxHz: 1920,
    whineType: 'sine',
    whineMinHz: 460,
    whineMaxHz: 1880,
    statorGain: 0.36,
    whineGain: 0.38,
    chainGain: 0.28,
    chainHz: 1620,
    stockDual: false,
  },
  surron: {
    statorType: 'sawtooth',
    statorMinHz: 136,
    statorMaxHz: 660,
    lpMinHz: 460,
    lpMaxHz: 2240,
    whineType: 'sine',
    whineMinHz: 540,
    whineMaxHz: 2280,
    statorGain: 0.36,
    whineGain: 0.42,
    chainGain: 0.32,
    chainHz: 1840,
    stockDual: false,
  },
  // 80 HP Liquid-Cooled PMSM Race Cross
  starkvarg: {
    statorType: 'sawtooth',
    statorMinHz: 74,
    statorMaxHz: 485,
    lpMinHz: 340,
    lpMaxHz: 2180,
    whineType: 'sine',
    whineMinHz: 620,
    whineMaxHz: 2720,
    statorGain: 0.44,
    whineGain: 0.48,
    chainGain: 0.3,
    chainHz: 2040,
    stockDual: false,
  },
};

function makeSoftDriveCurve(amount = 2.4): Float32Array<ArrayBuffer> {
  const samples = 256;
  const buf = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buf);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private driveCurve: Float32Array<ArrayBuffer> | null = null;
  private muted = false;

  // Persistent continuous motor synthesizer nodes (zero per-frame allocations)
  private motorMaster: GainNode | null = null;
  private motorDrive: WaveShaperNode | null = null;
  private statorOsc: OscillatorNode | null = null;
  private statorLp: BiquadFilterNode | null = null;
  private statorGainNode: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGainNode: GainNode | null = null;
  private whineOsc: OscillatorNode | null = null;
  private whineGainNode: GainNode | null = null;
  private focOsc: OscillatorNode | null = null;
  private focGainNode: GainNode | null = null;
  private dualOsc: OscillatorNode | null = null;
  private dualLp: BiquadFilterNode | null = null;
  private dualGainNode: GainNode | null = null;
  private chainNoise: AudioBufferSourceNode | null = null;
  private chainBp: BiquadFilterNode | null = null;
  private chainGainNode: GainNode | null = null;
  private motorProfileId = '';

  // Holdable scooter / moto dual-tone horn nodes
  private hornActive = false;
  private hornGain: GainNode | null = null;
  private hornOscA: OscillatorNode | null = null;
  private hornOscB: OscillatorNode | null = null;

  public setMuted(m: boolean) {
    this.muted = m;
    if (m) {
      this.stopMotor();
      this.stopHorn();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Call on first user touch/click to reliably unlock iOS Safari / mobile WebAudio */
  public unlock() {
    if (this.muted) return;
    if (this.ctx && this.ctx.state === 'running') return;
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

  private ensureMotorNodes(ctx: AudioContext, scooterId: string): boolean {
    const profile = MOTOR_PROFILES[scooterId] ?? MOTOR_PROFILES.g2;
    if (
      this.motorMaster &&
      this.statorOsc &&
      this.subOsc &&
      this.whineOsc &&
      this.focOsc &&
      this.dualOsc
    ) {
      if (this.motorProfileId !== scooterId) {
        this.motorProfileId = scooterId;
        try {
          this.statorOsc.type = profile.statorType;
          this.whineOsc.type = profile.whineType;
        } catch {
          // Ignore oscillator type errors
        }
      }
      return true;
    }

    try {
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.connect(ctx.destination);

      const drive = ctx.createWaveShaper();
      if (!this.driveCurve) {
        this.driveCurve = makeSoftDriveCurve(2.2);
      }
      drive.curve = this.driveCurve;
      drive.oversample = 'none';
      drive.connect(master);

      const statorOsc = ctx.createOscillator();
      statorOsc.type = profile.statorType;
      const statorLp = ctx.createBiquadFilter();
      statorLp.type = 'lowpass';
      statorLp.Q.setValueAtTime(1.85, ctx.currentTime);
      const statorGainNode = ctx.createGain();
      statorOsc.connect(statorLp);
      statorLp.connect(statorGainNode);
      statorGainNode.connect(drive);
      statorOsc.start();

      // Low-end stator torque body (0.5x fundamental)
      const subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      const subGainNode = ctx.createGain();
      subOsc.connect(subGainNode);
      subGainNode.connect(drive);
      subOsc.start();

      // Primary BLDC controller whine
      const whineOsc = ctx.createOscillator();
      whineOsc.type = profile.whineType;
      const whineGainNode = ctx.createGain();
      whineOsc.connect(whineGainNode);
      whineGainNode.connect(master);
      whineOsc.start();

      // High-amp FOC / Dualtron inverter harmonic sweep (scales steeply with RPM)
      const focOsc = ctx.createOscillator();
      focOsc.type = 'sine';
      const focGainNode = ctx.createGain();
      focOsc.connect(focGainNode);
      focGainNode.connect(master);
      focOsc.start();

      // Secondary hub motor oscillator (detuned twin-stator growl & beat pulse)
      const dualOsc = ctx.createOscillator();
      dualOsc.type = 'sawtooth';
      const dualLp = ctx.createBiquadFilter();
      dualLp.type = 'lowpass';
      dualLp.Q.setValueAtTime(1.7, ctx.currentTime);
      const dualGainNode = ctx.createGain();
      dualOsc.connect(dualLp);
      dualLp.connect(dualGainNode);
      dualGainNode.connect(drive);
      dualOsc.start();

      const noiseBuf = this.getNoiseBuffer(ctx);
      let chainNoise: AudioBufferSourceNode | null = null;
      let chainBp: BiquadFilterNode | null = null;
      let chainGainNode: GainNode | null = null;
      if (noiseBuf) {
        chainNoise = ctx.createBufferSource();
        chainNoise.buffer = noiseBuf;
        chainNoise.loop = true;
        chainBp = ctx.createBiquadFilter();
        chainBp.type = 'bandpass';
        chainBp.Q.setValueAtTime(2.2, ctx.currentTime);
        chainGainNode = ctx.createGain();
        chainNoise.connect(chainBp);
        chainBp.connect(chainGainNode);
        chainGainNode.connect(master);
        chainNoise.start();
      }

      this.motorMaster = master;
      this.motorDrive = drive;
      this.statorOsc = statorOsc;
      this.statorLp = statorLp;
      this.statorGainNode = statorGainNode;
      this.subOsc = subOsc;
      this.subGainNode = subGainNode;
      this.whineOsc = whineOsc;
      this.whineGainNode = whineGainNode;
      this.focOsc = focOsc;
      this.focGainNode = focGainNode;
      this.dualOsc = dualOsc;
      this.dualLp = dualLp;
      this.dualGainNode = dualGainNode;
      this.chainNoise = chainNoise;
      this.chainBp = chainBp;
      this.chainGainNode = chainGainNode;
      this.motorProfileId = scooterId;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Smoothly drives continuous BLDC / PMSM / belt-chain motor audio for the current frame.
   * When 2nd motor is equipped, activates the Dualtron Thunder 3 dual-hub acoustic layer.
   * Safe to call every rAF frame (zero node allocations).
   */
  public updateMotor(params: {
    active: boolean;
    scooterId: string;
    kmh: number;
    maxKmh: number;
    throttleOn: boolean;
    brakeOn: boolean;
    burnout: number;
    hasVesc: boolean;
    hasSecondMotor: boolean;
    launchSurge?: number;
  }) {
    if (this.muted || !params.active) {
      this.stopMotor();
      return;
    }
    let ctx = this.ctx;
    if (!ctx && params.throttleOn) {
      ctx = this.ensureCtx();
    }
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      if (params.throttleOn) {
        ctx.resume().catch(() => {});
      }
      return;
    }
    if (ctx.state !== 'running') {
      return;
    }
    if (!this.ensureMotorNodes(ctx, params.scooterId)) return;

    try {
      const now = ctx.currentTime;
      const baseP = MOTOR_PROFILES[params.scooterId] ?? MOTOR_PROFILES.g2;
      const t3 = MOTOR_PROFILES.thunder3;
      const dualMod = params.hasSecondMotor;
      const isThunder = params.scooterId === 'thunder3' || dualMod;

      const speedNorm = Math.max(
        0,
        Math.min(1.3, params.kmh / Math.max(25, params.maxKmh))
      );
      const burnoutRev = Math.min(1, Math.max(0, params.burnout));
      const surge = Math.max(0, Math.min(1.5, params.launchSurge ?? 0));
      // Extra wheel-spin / RPM wind-up when throttle is held so the motor noticeably spins harder
      const throttleSlipSpin = params.throttleOn ? 0.14 + 0.16 * speedNorm + surge * 0.22 : 0;
      const rawRpm = Math.max(speedNorm + throttleSlipSpin * 0.45, burnoutRev * 0.96, surge * 0.48);
      const rpmNorm = Math.min(1.42, Math.pow(Math.max(0.001, rawRpm), 0.84));

      const loadBoost = params.throttleOn
        ? 1.05 + surge * 0.3 + speedNorm * 0.12
        : params.brakeOn
          ? 0.44
          : 0.24;
      const vescPitch = params.hasVesc ? 1.16 : 1.0;

      // Blend base scooter tone with signature Dualtron Thunder 3 dual-hub pitch & punch when 2nd motor is equipped
      const statorMin = dualMod ? baseP.statorMinHz * 0.55 + t3.statorMinHz * 0.45 : baseP.statorMinHz;
      const statorMax = dualMod
        ? Math.max(baseP.statorMaxHz, t3.statorMaxHz) * 1.14
        : baseP.statorMaxHz * 1.08;
      const lpMin = dualMod ? t3.lpMinHz : baseP.lpMinHz;
      const lpMax = dualMod ? Math.max(baseP.lpMaxHz, t3.lpMaxHz) * 1.15 : baseP.lpMaxHz * 1.12;
      const whineMin = dualMod ? t3.whineMinHz : baseP.whineMinHz;
      const whineMax = dualMod ? Math.max(baseP.whineMaxHz, t3.whineMaxHz) * 1.16 : baseP.whineMaxHz * 1.12;

      const statorHz =
        (statorMin + (statorMax - statorMin) * rpmNorm) *
        (params.throttleOn ? 1.06 + surge * 0.12 : 0.96);
      const lpHz = lpMin + (lpMax - lpMin) * Math.min(1.3, rpmNorm * 1.08 + surge * 0.18);
      const whineHz =
        (whineMin + (whineMax - whineMin) * rpmNorm) *
        vescPitch *
        (1 + surge * 0.08);

      // Dualtron Thunder 3 dual-hub beat frequency (~1.019x offset stator) + high-amp FOC carrier sweep
      const dualFreq = isThunder
        ? statorHz * 1.019 + 4.5 + (params.hasVesc ? 16 * rpmNorm : 0)
        : params.hasVesc
          ? statorHz * 1.5
          : statorHz * 1.015;
      const focFreq = isThunder
        ? whineHz * 1.498 + 80 * rpmNorm
        : whineHz * 1.42;

      this.statorOsc!.frequency.setTargetAtTime(Math.max(40, statorHz), now, 0.022);
      this.statorLp!.frequency.setTargetAtTime(Math.max(140, lpHz), now, 0.028);
      this.subOsc!.frequency.setTargetAtTime(Math.max(32, statorHz * 0.5), now, 0.025);
      this.whineOsc!.frequency.setTargetAtTime(Math.max(90, whineHz), now, 0.022);
      this.focOsc!.frequency.setTargetAtTime(Math.max(140, focFreq), now, 0.025);
      this.dualOsc!.frequency.setTargetAtTime(Math.max(45, dualFreq), now, 0.022);
      if (this.dualLp) {
        this.dualLp.frequency.setTargetAtTime(Math.max(180, lpHz * 1.18), now, 0.028);
      }

      const throttlePresence = params.throttleOn
        ? 0.66 + 0.42 * Math.min(1.2, rpmNorm) + surge * 0.24
        : params.brakeOn
          ? 0.28 + 0.26 * speedNorm
          : 0.16 + 0.22 * speedNorm;
      const masterLevel = Math.min(0.135, (isThunder ? 0.086 : 0.076) * throttlePresence);

      const statorGain = (dualMod ? Math.max(baseP.statorGain, t3.statorGain) : baseP.statorGain) * loadBoost;
      this.statorGainNode!.gain.setTargetAtTime(statorGain, now, 0.028);
      this.subGainNode!.gain.setTargetAtTime(
        (isThunder ? 0.24 : 0.15) * (params.throttleOn ? 1.05 + surge * 0.22 : 0.35),
        now,
        0.028
      );

      const baseWhineGain = dualMod ? Math.max(baseP.whineGain, t3.whineGain) : baseP.whineGain;
      this.whineGainNode!.gain.setTargetAtTime(
        baseWhineGain *
          (params.throttleOn ? 0.85 + 0.45 * Math.min(1.2, rpmNorm) + surge * 0.18 : params.brakeOn ? 0.65 : 0.35) *
          (params.hasVesc ? 1.18 : 1.0),
        now,
        0.028
      );

      // Crisp FOC / Dualtron Thunder 3 high-RPM inverter sing
      this.focGainNode!.gain.setTargetAtTime(
        (isThunder ? 0.18 : params.hasVesc ? 0.11 : 0.05) *
          (0.25 + 0.85 * Math.min(1.2, rpmNorm)) *
          (params.throttleOn ? 1.05 + surge * 0.2 : 0.3),
        now,
        0.028
      );

      const dualActive = baseP.stockDual || params.hasSecondMotor || params.hasVesc;
      const dualAmt = dualActive
        ? (isThunder ? 0.42 : params.hasVesc ? 0.2 : 0.24) *
          (params.throttleOn ? 1.02 + surge * 0.22 : 0.36)
        : 0;
      this.dualGainNode!.gain.setTargetAtTime(dualAmt, now, 0.028);

      if (this.chainBp && this.chainGainNode) {
        const chainFreqBase = dualMod ? Math.max(baseP.chainHz, t3.chainHz) : baseP.chainHz;
        const chainGainBase = dualMod ? Math.max(baseP.chainGain, t3.chainGain * 1.15) : baseP.chainGain;
        this.chainBp.frequency.setTargetAtTime(
          chainFreqBase * (0.62 + 0.72 * rpmNorm),
          now,
          0.03
        );
        this.chainGainNode.gain.setTargetAtTime(
          chainGainBase * (0.22 + 0.88 * Math.min(1.25, rpmNorm)) * (params.throttleOn ? 1.05 + surge * 0.25 : 0.42),
          now,
          0.03
        );
      }

      this.motorMaster!.gain.setTargetAtTime(masterLevel, now, 0.028);
    } catch {
      // Ignore WebAudio transient errors
    }
  }

  public stopMotor() {
    if (!this.ctx || !this.motorMaster) return;
    try {
      this.motorMaster.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    } catch {
      // Ignore WebAudio errors
    }
  }

  public startHorn() {
    if (this.muted || this.hornActive) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.115, now + 0.014);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1450, now);
      filter.Q.setValueAtTime(1.15, now);

      const oscA = ctx.createOscillator();
      oscA.type = 'sawtooth';
      oscA.frequency.setValueAtTime(418, now);

      const oscB = ctx.createOscillator();
      oscB.type = 'square';
      oscB.frequency.setValueAtTime(524, now);

      const bMix = ctx.createGain();
      bMix.gain.setValueAtTime(0.45, now);

      oscA.connect(filter);
      oscB.connect(bMix);
      bMix.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscA.start(now);
      oscB.start(now);

      this.hornGain = gain;
      this.hornOscA = oscA;
      this.hornOscB = oscB;
      this.hornActive = true;
    } catch {
      this.hornActive = false;
    }
  }

  public stopHorn() {
    if (!this.hornActive && !this.hornGain) return;
    this.hornActive = false;
    const ctx = this.ctx;
    const gain = this.hornGain;
    const oscA = this.hornOscA;
    const oscB = this.hornOscB;
    this.hornGain = null;
    this.hornOscA = null;
    this.hornOscB = null;
    try {
      if (ctx && gain) {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.032);
      }
      const stopAt = ctx ? ctx.currentTime + 0.04 : undefined;
      window.setTimeout(() => {
        try {
          oscA?.stop(stopAt);
          oscB?.stop(stopAt);
          oscA?.disconnect();
          oscB?.disconnect();
          gain?.disconnect();
        } catch {
          // Ignore already stopped oscillators
        }
      }, 55);
    } catch {
      // Ignore WebAudio errors
    }
  }
}

export const sound = new SoundEngine();
