// Web Audio API ambient sound generator and chime for Zympl-style mindfulness

class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentMode: 'rain' | 'stream' | 'brown' | 'none' = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a quiet Tibetan meditation bell chime upon completing tasks or starting focus
  playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Fundamental tone + gentle overtone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now); // 528Hz Solfeggio / calm frequency
      osc.frequency.exponentialRampToValueAtTime(524, now + 1.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch {
      // Audio may be blocked by autoplay policies
    }
  }

  // Start continuous ambient sound
  startAmbient(type: 'rain' | 'stream' | 'brown', volume = 0.08) {
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stopAmbient();

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') {
          // Brown noise (1/f^2)
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        } else if (type === 'stream') {
          // Pink-ish gentle stream
          const b0 = 0.99886 * (data[i - 1] || 0) + white * 0.0555179;
          data[i] = b0 * 1.2;
        } else {
          // Soft rain
          data[i] = (lastOut + 0.08 * white) / 1.08;
          lastOut = data[i];
          data[i] *= 2.0;
        }
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter for gentle warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'brown' ? 380 : type === 'rain' ? 800 : 650, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.noiseNode = noise;
      this.gainNode = gain;
      this.isPlaying = true;
      this.currentMode = type;
    } catch {
      // Autoplay prevention
    }
  }

  stopAmbient() {
    try {
      if (this.noiseNode) {
        (this.noiseNode as AudioScheduledSourceNode).stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.isPlaying = false;
      this.currentMode = 'none';
    } catch {
      // Ignore
    }
  }

  setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(vol, 0.4)), this.ctx.currentTime);
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentMode() {
    return this.currentMode;
  }
}

export const zenAudio = new ZenAudioEngine();
