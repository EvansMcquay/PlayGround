export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.crowdGain = null;
    this.muted = false;
    this.masterVolume = 0.7;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.8;
    this.crowdVolume = 0.5;
    
    this.buffers = new Map();
    this.sources = [];
    this.beatInterval = null;
    this.legendMusicSource = null;
    this.legendMusicGain = null;
    this.crowdSource = null;
  }

  async init() {
    if (this.ctx) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
      
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.value = this.crowdVolume;
      this.crowdGain.connect(this.masterGain);
      
      await this.generateBuffers();
      this.startCrowdAmbience();
      this.startBeat();
      
      return true;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
      return false;
    }
  }

  async generateBuffers() {
    this.buffers.set('bounce', this.createBounceSound());
    this.buffers.set('swish', this.createSwishSound());
    this.buffers.set('rim', this.createRimSound());
    this.buffers.set('whistle', this.createWhistleSound());
    this.buffers.set('airhorn', this.createAirhornSound());
    this.buffers.set('break', this.createAnkleBreakSound());
    this.buffers.set('dunk_slam', this.createDunkSlamSound());
    this.buffers.set('crowd_cheer', this.createCrowdCheer());
    this.buffers.set('crowd_oooh', this.createCrowdOooh());
    this.buffers.set('milestone_confidence', this.createMilestoneSound('confidence'));
    this.buffers.set('milestone_momentum', this.createMilestoneSound('momentum'));
    this.buffers.set('milestone_dominance', this.createMilestoneSound('dominance'));
    this.buffers.set('milestone_legend', this.createMilestoneSound('legend'));
  }

  createOscillator(type, freq, duration, gain = 0.3, slide = 0) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + duration);
    
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    o.connect(g);
    return { oscillator: o, gain: g };
  }

  createBounceSound() {
    const ctx = this.ctx;
    const duration = 0.15;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 120 * Math.exp(-t * 15);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 20) * 0.5;
    }
    return buffer;
  }

  createSwishSound() {
    const ctx = this.ctx;
    const duration = 0.4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 8);
      const tone = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 6) * 0.3;
      data[i] = (noise * 0.7 + tone) * Math.exp(-t * 4);
    }
    return buffer;
  }

  createRimSound() {
    const ctx = this.ctx;
    const duration = 0.3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 350 * Math.exp(-t * 10);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 15) * 0.4;
    }
    return buffer;
  }

  createWhistleSound() {
    const ctx = this.ctx;
    const duration = 0.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 2000 + 500 * Math.sin(t * 20);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) * 0.3;
    }
    return buffer;
  }

  createAirhornSound() {
    const ctx = this.ctx;
    const duration = 1.2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const f1 = 230 + 40 * Math.sin(t * 5);
      const f2 = 290 + 50 * Math.sin(t * 7);
      data[i] = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)) * 0.3 * Math.exp(-t * 0.8);
    }
    return buffer;
  }

  createAnkleBreakSound() {
    const ctx = this.ctx;
    const duration = 0.35;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
      const crack = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 20) * 0.5;
      data[i] = noise * 0.6 + crack;
    }
    return buffer;
  }

  createDunkSlamSound() {
    const ctx = this.ctx;
    const duration = 0.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const boom = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 10) * 0.8;
      const ring = Math.sin(2 * Math.PI * 280 * t) * Math.exp(-t * 5) * 0.4;
      const impact = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.6;
      data[i] = boom + ring + impact;
    }
    return buffer;
  }

  createCrowdCheer() {
    const ctx = this.ctx;
    const duration = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const cheer = Math.sin(2 * Math.PI * 300 * t) * 0.1;
      data[i] = (noise + cheer) * Math.exp(-t * 0.5);
    }
    return buffer;
  }

  createCrowdOooh() {
    const ctx = this.ctx;
    const duration = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 400 - 100 * t;
      const ooh = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 1.5) * 0.4;
      const noise = (Math.random() * 2 - 1) * 0.15;
      data[i] = ooh + noise;
    }
    return buffer;
  }

  createMilestoneSound(type) {
    const ctx = this.ctx;
    const duration = 0.8;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    const freqs = {
      confidence: [523, 659, 784],
      momentum: [440, 554, 659, 880],
      dominance: [392, 494, 587, 784, 988],
      legend: [262, 330, 392, 523, 659, 784, 1047],
    };
    
    const notes = freqs[type] || freqs.confidence;
    
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      let sum = 0;
      notes.forEach((f, idx) => {
        sum += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2) * (0.2 / (idx + 1));
      });
      data[i] = sum;
    }
    return buffer;
  }

  startCrowdAmbience() {
    if (this.crowdSource) this.crowdSource.stop();
    
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.015 * w) / 1.015;
      data[i] = last * 0.5;
    }
    
    this.crowdSource = this.ctx.createBufferSource();
    this.crowdSource.buffer = buffer;
    this.crowdSource.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.6;
    
    this.crowdSource.connect(filter).connect(this.crowdGain);
    this.crowdSource.start();
  }

  startBeat() {
    if (this.beatInterval) clearInterval(this.beatInterval);
    
    const bpm = 94;
    const stepDuration = 60 / bpm / 2;
    
    this.beatInterval = setInterval(() => {
      if (this.muted || this.engine?.matchManager?.phase !== 'play') return;
      
      const step = this.beatStep % 16;
      const t = this.ctx.currentTime;
      
      if (step % 2 === 0) {
        this.playBufferAtTime('bounce', t, { gain: 0.4, rate: 0.8 });
      }
      
      if (step % 4 === 1) {
        const hf = this.ctx.createBufferSource();
        hf.buffer = this.createHiHatBuffer();
        const hfg = this.ctx.createGain();
        hfg.gain.value = 0.08;
        hf.connect(hfg).connect(this.musicGain);
        hf.start(t);
      }
      
      const bassNotes = [55, 0, 55, 61.7, 0, 55, 49, 58.3, 55, 0, 55, 61.7, 0, 55, 46.3, 55];
      if (bassNotes[step]) {
        this.playBassNote(bassNotes[step], t);
      }
      
      this.beatStep++;
    }, stepDuration * 1000);
  }

  createHiHatBuffer() {
    const ctx = this.ctx;
    const dur = 0.05;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 10);
    }
    return buf;
  }

  playBassNote(freq, time) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    
    o.type = 'triangle';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = 200;
    
    g.gain.setValueAtTime(0.2, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    
    o.connect(f).connect(g).connect(this.musicGain);
    o.start(time);
    o.stop(time + 0.5);
  }

  playBuffer(name, options = {}) {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.ctx) return;
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.value = options.gain || 1;
    
    if (options.rate) source.playbackRate.value = options.rate;
    
    const output = options.output || this.sfxGain;
    source.connect(gain).connect(output);
    source.start(this.ctx.currentTime + (options.delay || 0));
    
    this.sources.push(source);
    source.onended = () => {
      const idx = this.sources.indexOf(source);
      if (idx >= 0) this.sources.splice(idx, 1);
    };
    
    return source;
  }

  playBufferAtTime(name, time, options = {}) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.value = options.gain || 1;
    
    if (options.rate) source.playbackRate.value = options.rate;
    
    source.connect(gain).connect(this.sfxGain);
    source.start(time);
  }

  playBounce(position) {
    this.playBuffer('bounce', { gain: 0.4, rate: 0.8 + Math.random() * 0.4 });
  }

  playSwish() {
    this.playBuffer('swish', { gain: 0.6 });
    this.playBuffer('bounce', { gain: 0.2, rate: 2, delay: 0.05 });
  }

  playRimHit() {
    this.playBuffer('rim', { gain: 0.5, rate: 0.9 + Math.random() * 0.2 });
  }

  playWhistle() {
    this.playBuffer('whistle', { gain: 0.6 });
  }

  playAirhorn() {
    this.playBuffer('airhorn', { gain: 0.8 });
  }

  playAnkleBreak() {
    this.playBuffer('break', { gain: 0.7 });
  }

  playDunkSlam(type = 'normal') {
    const gains = { normal: 0.8, poster: 1.0, alley_oop: 0.9, legend: 1.0 };
    this.playBuffer('dunk_slam', { gain: gains[type] || 0.8 });
    this.playBuffer('crowd_cheer', { gain: 0.6, output: this.crowdGain, delay: 0.1 });
  }

  playCrowdReaction(intensity) {
    if (intensity > 80) {
      this.playBuffer('crowd_cheer', { gain: 0.8, output: this.crowdGain });
    } else if (intensity > 50) {
      this.playBuffer('crowd_oooh', { gain: 0.5, output: this.crowdGain });
    } else {
      this.playBuffer('crowd_cheer', { gain: 0.3, output: this.crowdGain });
    }
  }

  playMilestone(type) {
    this.playBuffer(`milestone_${type}`, { gain: 0.7 });
    if (type === 'legend') this.playAirhorn();
  }

  playLegendMusic() {
    if (this.legendMusicSource) return;
    
    const ctx = this.ctx;
    this.legendMusicGain = ctx.createGain();
    this.legendMusicGain.gain.value = 0;
    this.legendMusicGain.connect(this.musicGain);
    
    const buffer = this.createLegendMusicBuffer();
    this.legendMusicSource = ctx.createBufferSource();
    this.legendMusicSource.buffer = buffer;
    this.legendMusicSource.loop = true;
    this.legendMusicSource.connect(this.legendMusicGain);
    this.legendMusicSource.start();
    
    this.legendMusicGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1);
  }

  createLegendMusicBuffer() {
    const ctx = this.ctx;
    const dur = 8;
    const buf = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
    
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const t = i / ctx.sampleRate;
        const kick = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-(t % 0.5) * 20) * 0.3;
        const bass = Math.sin(2 * Math.PI * 55 * t) * 0.15;
        const synth = Math.sin(2 * Math.PI * 220 * t) * 0.08;
        d[i] = kick + bass + synth;
      }
    }
    return buf;
  }

  stopLegendMusic() {
    if (this.legendMusicSource) {
      this.legendMusicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => {
        this.legendMusicSource.stop();
        this.legendMusicSource = null;
      }, 1500);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    return this.muted;
  }

  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (!this.muted) this.masterGain.gain.value = this.masterVolume;
  }

  dispose() {
    if (this.beatInterval) clearInterval(this.beatInterval);
    this.sources.forEach(s => { try { s.stop(); } catch {} });
    this.crowdSource?.stop();
    this.legendMusicSource?.stop();
    this.ctx?.close();
  }
}