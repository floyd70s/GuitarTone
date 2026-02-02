
import { GearType, Pedal, Amplifier, Cabinet } from './types';

export const PEDAL_WIDTH = 150;

const createKnobs = (labels: string[]) => labels.map(label => ({ label, value: 5 }));

export const PEDAL_LIBRARY: Pedal[] = [
  // --- OVERDRIVE ---
  { id: 'ts808', templateId: 'ts808', name: 'TS808 Tube Screamer', type: GearType.DRIVE, color: '#2d863e', textColor: '#ffffff', knobStyle: 'boutique', knobs: createKnobs(['Overdrive', 'Tone', 'Level']), glowColor: '#00ff00' },
  { id: 'klon', templateId: 'klon', name: 'Klon Centaur', type: GearType.DRIVE, color: '#d4af37', textColor: '#4b3621', knobStyle: 'boutique', knobs: createKnobs(['Gain', 'Treble', 'Output']), glowColor: '#ffff00' },
  { id: 'sd1', templateId: 'sd1', name: 'Boss SD-1 Super OD', type: GearType.DRIVE, color: '#f3e120', textColor: '#000000', knobStyle: 'boss', knobs: createKnobs(['Drive', 'Tone', 'Level']), glowColor: '#ffaa00' },
  { id: 'ocd', templateId: 'ocd', name: 'Fulltone OCD', type: GearType.DRIVE, color: '#ffffff', textColor: '#000000', knobStyle: 'boutique', knobs: createKnobs(['Volume', 'Drive', 'Tone']), glowColor: '#00ffff' },
  // --- MODULATION ---
  { id: 'ce2', templateId: 'ce2', name: 'Boss CE-2 Chorus', type: GearType.MODULATION, color: '#7ec8e3', textColor: '#000000', knobStyle: 'boss', knobs: createKnobs(['Rate', 'Depth']), glowColor: '#00ccff' },
  { id: 'phase90', templateId: 'phase90', name: 'MXR Phase 90', type: GearType.MODULATION, color: '#ff8c00', textColor: '#000000', knobStyle: 'mxr', knobs: createKnobs(['Speed']), glowColor: '#ffaa00' },
  // --- DELAY ---
  { id: 'carboncopy', templateId: 'carboncopy', name: 'MXR Carbon Copy', type: GearType.DELAY, color: '#004d00', textColor: '#ffffff', knobStyle: 'mxr', knobs: createKnobs(['Regen', 'Mix', 'Delay']), glowColor: '#00ff44' },
  // --- REVERB ---
  { id: 'hof2', templateId: 'hof2', name: 'TC Hall of Fame 2', type: GearType.REVERB, color: '#ff4500', textColor: '#ffffff', knobStyle: 'boutique', knobs: createKnobs(['Decay', 'Tone', 'FX Level']), glowColor: '#ffaa00' },
];

export const CABINET_LIBRARY: Cabinet[] = [
  { id: 'cab_marshall_412', templateId: 'cab_marshall_412', name: '1960A 4x12', brand: 'Marshall', speakerType: 'Celestion V30', color: '#111' },
  { id: 'cab_fender_112', templateId: 'cab_fender_112', name: 'Deluxe 1x12', brand: 'Fender', speakerType: 'Jensen C12K', color: '#222' },
  { id: 'cab_vox_212', templateId: 'cab_vox_212', name: 'AC30 2x12', brand: 'Vox', speakerType: 'Celestion Blue', color: '#333' },
  { id: 'cab_mesa_412', templateId: 'cab_mesa_412', name: 'Recto 4x12', brand: 'Mesa', speakerType: 'Celestion V30', color: '#1a1a1a' },
];

export const AMPLIFIER_LIBRARY: Amplifier[] = [
  { 
    id: 'ac30vr', 
    name: 'Vox AC30 VR', 
    brand: 'Vox',
    color: '#1a1a1a', 
    texture: 'leather-black', 
    panelColor: '#1e3a8a', 
    panelMaterial: 'vox-blue',
    grillStyle: 'vox-diamond',
    knobStyle: 'chicken-head', 
    knobs: createKnobs(['Master', 'Reverb', 'Bass', 'Treble', 'Gain', 'Volume']) 
  },
  { 
    id: 'plexi_1959', 
    name: 'Marshall Plexi 1959', 
    brand: 'Marshall',
    color: '#111111', 
    texture: 'leather-black', 
    panelColor: '#d4af37', 
    panelMaterial: 'brushed-gold',
    grillStyle: 'marshall-black',
    knobStyle: 'marshall', 
    knobs: createKnobs(['Presence', 'Bass', 'Middle', 'Treble', 'Vol 1', 'Vol 2']) 
  },
  { 
    id: 'deluxe_reverb', 
    name: 'Fender Deluxe Reverb', 
    brand: 'Fender',
    color: '#1a1a1a', 
    texture: 'tolex-black', 
    panelColor: '#e5e7eb', 
    panelMaterial: 'chrome',
    grillStyle: 'fender-silver',
    knobStyle: 'fender', 
    knobs: createKnobs(['Volume', 'Treble', 'Bass', 'Reverb', 'Speed', 'Intensity']) 
  }
];
