import { ElementType, ResourceKind } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.55;

  public configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainMultiplier = 0.22,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqEnd), now + duration);
    }

    const peak = Math.max(0.001, this.volume * gainMultiplier);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.tone(420, 320, 0.06, 'triangle', 0.16);
  }

  public playStep() {
    this.tone(110, 72, 0.045, 'sine', 0.08);
  }

  public playGather(kind: ResourceKind | 'WOOD' | 'STONE' | 'BERRY') {
    if (kind === 'TREE' || kind === 'WOOD') {
      this.tone(180, 95, 0.09, 'square', 0.14);
      this.tone(240, 120, 0.07, 'triangle', 0.12, 0.05);
    } else if (kind === 'MINERAL' || kind === 'STONE') {
      this.tone(680, 360, 0.08, 'square', 0.14);
      this.tone(820, 440, 0.07, 'triangle', 0.1, 0.04);
    } else if (kind === 'WATER') {
      this.tone(440, 620, 0.1, 'sine', 0.15);
      this.tone(580, 760, 0.08, 'sine', 0.1, 0.05);
    } else {
      this.tone(520, 740, 0.08, 'sine', 0.16);
    }
  }

  public playAttack() {
    this.tone(320, 110, 0.12, 'sawtooth', 0.18);
    this.tone(180, 70, 0.1, 'triangle', 0.15, 0.03);
  }

  public playHeavyAttack() {
    this.tone(220, 58, 0.2, 'sawtooth', 0.24);
    this.tone(140, 44, 0.22, 'square', 0.16, 0.04);
  }

  public playDodge() {
    this.tone(380, 620, 0.11, 'sine', 0.14);
  }

  public playSkill(element: ElementType) {
    if (element === 'FIRE') {
      this.tone(260, 95, 0.22, 'sawtooth', 0.2);
      this.tone(520, 220, 0.14, 'triangle', 0.14, 0.04);
    } else if (element === 'ICE') {
      this.tone(780, 1080, 0.12, 'sine', 0.15);
      this.tone(920, 480, 0.14, 'triangle', 0.14, 0.06);
    } else if (element === 'HOLY') {
      this.tone(523, 784, 0.16, 'triangle', 0.18);
      this.tone(659, 987, 0.18, 'sine', 0.14, 0.06);
    } else if (element === 'DARK') {
      this.tone(180, 82, 0.24, 'sawtooth', 0.19);
      this.tone(290, 120, 0.18, 'sine', 0.14, 0.05);
    } else if (element === 'NATURE') {
      this.tone(392, 587, 0.16, 'sine', 0.16);
      this.tone(494, 659, 0.14, 'triangle', 0.12, 0.05);
    } else {
      this.playHeavyAttack();
    }
  }

  public playDefend() {
    this.tone(260, 390, 0.14, 'triangle', 0.18);
    this.tone(520, 520, 0.12, 'sine', 0.1, 0.04);
  }

  public playEnemyHit() {
    this.tone(160, 62, 0.16, 'sawtooth', 0.22);
  }

  public playEncounter() {
    this.tone(190, 140, 0.14, 'sawtooth', 0.18);
    this.tone(140, 95, 0.22, 'sawtooth', 0.2, 0.12);
  }

  public playHeal() {
    this.tone(392, 523, 0.12, 'sine', 0.16);
    this.tone(523, 659, 0.16, 'sine', 0.15, 0.09);
  }

  public playVictory() {
    this.tone(330, 330, 0.1, 'triangle', 0.18);
    this.tone(440, 440, 0.1, 'triangle', 0.18, 0.1);
    this.tone(554, 659, 0.22, 'triangle', 0.2, 0.2);
  }

  public playDefeat() {
    this.tone(240, 180, 0.2, 'sawtooth', 0.2);
    this.tone(180, 110, 0.3, 'sawtooth', 0.2, 0.18);
  }
}

export const soundEngine = new SoundEngine();
