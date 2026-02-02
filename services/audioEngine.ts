
import { Pedal, Amplifier, Cabinet, GearType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private nodes: Map<string, AudioNode> = new Map();
  private analyser: AnalyserNode | null = null;
  private isMonitoring = false;
  private masterGain: GainNode | null = null;

  async init() {
    if (this.ctx) return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 44100
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false
        } 
      });
      this.input = this.ctx.createMediaStreamSource(stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("Microphone access denied", e);
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  setMonitoring(on: boolean) {
    this.isMonitoring = on;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.02);
    }
    if (on && this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
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

  updateParams(pedals: Pedal[], amp: Amplifier | null) {
    if (!this.ctx) return;
    
    const time = this.ctx.currentTime;

    pedals.forEach(p => {
      const driveVal = p.knobs.find(k => k.label.toLowerCase().includes('drive') || k.label.toLowerCase().includes('gain'))?.value || 5;
      const levelVal = p.knobs.find(k => k.label.toLowerCase().includes('level') || k.label.toLowerCase().includes('output'))?.value || 5;
      const toneVal = p.knobs.find(k => k.label.toLowerCase().includes('tone'))?.value || 5;

      // Handle Bypass (Dry/Wet)
      const dryGain = this.nodes.get(`${p.id}-dry`) as GainNode;
      const wetGain = this.nodes.get(`${p.id}-wet`) as GainNode;
      
      if (dryGain && wetGain) {
        dryGain.gain.setTargetAtTime(p.isActive ? 0 : 1, time, 0.02);
        wetGain.gain.setTargetAtTime(p.isActive ? 1 : 0, time, 0.02);
      }

      // Handle parameters
      const driveNode = this.nodes.get(`${p.id}-drive`) as GainNode;
      if (driveNode) driveNode.gain.setTargetAtTime((driveVal / 10) * 3 + 1, time, 0.02);

      const toneNode = this.nodes.get(`${p.id}-tone-filter`) as BiquadFilterNode;
      if (toneNode) toneNode.frequency.setTargetAtTime(500 + (toneVal * 2000), time, 0.02);

      const outNode = this.nodes.get(`${p.id}-out`) as GainNode;
      if (outNode) outNode.gain.setTargetAtTime(levelVal / 5, time, 0.02);
    });

    if (amp) {
      const gainVal = amp.knobs.find(k => k.label.toLowerCase().includes('gain'))?.value || 5;
      const preampNode = this.nodes.get(`amp-preamp`) as GainNode;
      if (preampNode) preampNode.gain.setTargetAtTime(gainVal * 2, time, 0.02);

      const bassVal = amp.knobs.find(k => k.label === 'Bass')?.value || 5;
      const midVal = amp.knobs.find(k => k.label === 'Middle' || k.label === 'Mid')?.value || 5;
      const trebVal = amp.knobs.find(k => k.label === 'Treble')?.value || 5;

      const bassNode = this.nodes.get(`amp-bass`) as BiquadFilterNode;
      if (bassNode) bassNode.gain.setTargetAtTime(bassVal * 2 - 10, time, 0.02);
      
      const midNode = this.nodes.get(`amp-mid`) as BiquadFilterNode;
      if (midNode) midNode.gain.setTargetAtTime(midVal * 2 - 10, time, 0.02);

      const trebNode = this.nodes.get(`amp-treb`) as BiquadFilterNode;
      if (trebNode) trebNode.gain.setTargetAtTime(trebVal * 2 - 10, time, 0.02);
    }
  }

  rebuildGraph(pedals: Pedal[], amp: Amplifier | null, cab: Cabinet | null) {
    if (!this.ctx || !this.input || !this.analyser || !this.masterGain) return;

    this.nodes.forEach(n => {
      try { n.disconnect(); } catch(e) {}
    });
    this.nodes.clear();

    let lastNode: AudioNode = this.input;

    // Build pedal chain with dry/wet routing for true bypass without rebuilding
    const activeChain = [...pedals].reverse();

    activeChain.forEach(p => {
      const pedalInput = lastNode;
      const pedalOutput = this.ctx!.createGain();
      
      const dryPath = this.ctx!.createGain();
      const wetPath = this.ctx!.createGain();
      
      // Effect nodes (simplified drive model)
      const driveGain = this.ctx!.createGain();
      const shaper = this.ctx!.createWaveShaper();
      const toneFilter = this.ctx!.createBiquadFilter();
      const postGain = this.ctx!.createGain();

      shaper.curve = this.createDistortionCurve(5);
      shaper.oversample = '4x';
      toneFilter.type = 'lowpass';

      // Routing
      pedalInput.connect(dryPath);
      dryPath.connect(pedalOutput);

      pedalInput.connect(driveGain);
      driveGain.connect(shaper);
      shaper.connect(toneFilter);
      toneFilter.connect(postGain);
      postGain.connect(wetPath);
      wetPath.connect(pedalOutput);

      this.nodes.set(`${p.id}-dry`, dryPath);
      this.nodes.set(`${p.id}-wet`, wetPath);
      this.nodes.set(`${p.id}-drive`, driveGain);
      this.nodes.set(`${p.id}-tone-filter`, toneFilter);
      this.nodes.set(`${p.id}-out`, postGain);

      lastNode = pedalOutput;
    });

    if (amp) {
      const preamp = this.ctx.createGain();
      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.createDistortionCurve(2);

      const bass = this.ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 150;

      const mid = this.ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 800;

      const treb = this.ctx.createBiquadFilter();
      treb.type = 'highshelf';
      treb.frequency.value = 3000;

      lastNode.connect(preamp);
      preamp.connect(shaper);
      shaper.connect(bass);
      bass.connect(mid);
      mid.connect(treb);
      
      this.nodes.set(`amp-preamp`, preamp);
      this.nodes.set(`amp-bass`, bass);
      this.nodes.set(`amp-mid`, mid);
      this.nodes.set(`amp-treb`, treb);
      
      lastNode = treb;
    }

    if (cab) {
      const lowCut = this.ctx.createBiquadFilter();
      lowCut.type = 'highpass';
      lowCut.frequency.value = 80;

      const highCut = this.ctx.createBiquadFilter();
      highCut.type = 'lowpass';
      highCut.frequency.value = 5500;

      lastNode.connect(lowCut);
      lowCut.connect(highCut);
      lastNode = highCut;
    }

    lastNode.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    
    // Initial parameter sync
    this.updateParams(pedals, amp);
  }
}

export const audioEngine = new AudioEngine();
