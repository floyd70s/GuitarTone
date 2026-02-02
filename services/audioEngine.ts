
import { Pedal, Amplifier, Cabinet, GearType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private nodes: AudioNode[] = [];
  private analyser: AnalyserNode | null = null;
  private isMonitoring = false;

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.input = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
  }

  getAnalyser() {
    return this.analyser;
  }

  setMonitoring(on: boolean) {
    this.isMonitoring = on;
    this.rebuildGraph([], null, null);
  }

  private createDistortionCurve(amount: number) {
    const k = amount * 10;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0 ; i < n_samples; ++i ) {
      const x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  }

  rebuildGraph(pedals: Pedal[], amp: Amplifier | null, cab: Cabinet | null) {
    if (!this.ctx || !this.input || !this.analyser) return;

    this.nodes.forEach(n => {
      try { n.disconnect(); } catch(e) {}
    });
    this.nodes = [];

    let lastNode: AudioNode = this.input;

    // Pedals chain (reverse order from flex-row-reverse in UI)
    const activeChain = [...pedals].reverse();

    activeChain.forEach(p => {
      if (p.isActive === false) return;

      if (p.type === GearType.DRIVE) {
        const gain = this.ctx!.createGain();
        const driveVal = p.knobs.find(k => k.label.toLowerCase().includes('drive') || k.label.toLowerCase().includes('gain'))?.value || 5;
        gain.gain.value = driveVal * 2;
        
        const shaper = this.ctx!.createWaveShaper();
        shaper.curve = this.createDistortionCurve(driveVal);
        shaper.oversample = '4x';

        const filter = this.ctx!.createBiquadFilter();
        const toneVal = p.knobs.find(k => k.label.toLowerCase().includes('tone'))?.value || 5;
        filter.type = 'lowpass';
        filter.frequency.value = 500 + (toneVal * 1000);

        lastNode.connect(gain);
        gain.connect(shaper);
        shaper.connect(filter);
        lastNode = filter;
        this.nodes.push(gain, shaper, filter);
      }

      if (p.type === GearType.DELAY) {
        const delay = this.ctx!.createDelay(5.0);
        const time = p.knobs.find(k => k.label.toLowerCase().includes('time') || k.label.toLowerCase().includes('delay'))?.value || 5;
        delay.delayTime.value = (time / 10) * 0.8;

        const feedback = this.ctx!.createGain();
        const fbVal = p.knobs.find(k => k.label.toLowerCase().includes('back') || k.label.toLowerCase().includes('regen'))?.value || 5;
        feedback.gain.value = (fbVal / 10) * 0.6;

        const mix = this.ctx!.createGain();
        const mixVal = p.knobs.find(k => k.label.toLowerCase().includes('mix') || k.label.toLowerCase().includes('level'))?.value || 5;
        mix.gain.value = (mixVal / 10);

        lastNode.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(mix);
        
        const merger = this.ctx!.createGain();
        lastNode.connect(merger);
        mix.connect(merger);
        lastNode = merger;
        this.nodes.push(delay, feedback, mix, merger);
      }
    });

    // Amplifier
    if (amp) {
      const preampGain = this.ctx.createGain();
      const gainVal = amp.knobs.find(k => k.label.toLowerCase().includes('gain') || k.label.toLowerCase().includes('vol'))?.value || 5;
      preampGain.gain.value = gainVal * 3;

      const toneStackBass = this.ctx.createBiquadFilter();
      toneStackBass.type = 'lowshelf';
      toneStackBass.frequency.value = 150;
      toneStackBass.gain.value = (amp.knobs.find(k => k.label === 'Bass')?.value || 5) * 2 - 10;

      const toneStackMid = this.ctx.createBiquadFilter();
      toneStackMid.type = 'peaking';
      toneStackMid.frequency.value = 800;
      toneStackMid.gain.value = (amp.knobs.find(k => k.label === 'Middle' || k.label === 'Mid')?.value || 5) * 2 - 10;

      const toneStackTreble = this.ctx.createBiquadFilter();
      toneStackTreble.type = 'highshelf';
      toneStackTreble.frequency.value = 3000;
      toneStackTreble.gain.value = (amp.knobs.find(k => k.label === 'Treble')?.value || 5) * 2 - 10;

      const ampSim = this.ctx.createWaveShaper();
      ampSim.curve = this.createDistortionCurve(gainVal * 0.5);

      lastNode.connect(preampGain);
      preampGain.connect(ampSim);
      ampSim.connect(toneStackBass);
      toneStackBass.connect(toneStackMid);
      toneStackMid.connect(toneStackTreble);
      lastNode = toneStackTreble;
      this.nodes.push(preampGain, ampSim, toneStackBass, toneStackMid, toneStackTreble);
    }

    // Cabinet
    if (cab) {
      const cabFilter = this.ctx.createBiquadFilter();
      cabFilter.type = 'lowpass';
      // Most guitar speakers roll off sharply after 5-6kHz
      cabFilter.frequency.value = 5500;
      
      const cabHump = this.ctx.createBiquadFilter();
      cabHump.type = 'peaking';
      cabHump.frequency.value = 100;
      cabHump.gain.value = 6;

      lastNode.connect(cabHump);
      cabHump.connect(cabFilter);
      lastNode = cabFilter;
      this.nodes.push(cabHump, cabFilter);
    }

    lastNode.connect(this.analyser);
    
    if (this.isMonitoring) {
      this.analyser.connect(this.ctx.destination);
    }
  }
}

export const audioEngine = new AudioEngine();
