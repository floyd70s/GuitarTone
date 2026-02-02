
export enum GearType {
  COMPRESSOR = 'Compressor',
  DRIVE = 'Drive/Distortion',
  MODULATION = 'Modulation',
  DELAY = 'Delay',
  REVERB = 'Reverb',
  AMPLIFIER = 'Amplifier',
  CABINET = 'Cabinet'
}

export interface Knob {
  label: string;
  value: number; // 0 to 10
}

export interface Pedal {
  id: string;
  templateId: string;
  name: string;
  type: GearType;
  color: string;
  textColor?: string;
  knobColor?: string;
  knobStyle?: 'boss' | 'mxr' | 'boutique' | 'vintage' | 'aluminum' | 'chicken-head' | 'marshall' | 'fender' | 'orange' | 'silver-reflector' | 'vintage-black';
  knobs: Knob[];
  brand?: string;
  glowColor?: string;
  isActive?: boolean;
}

export interface Cabinet {
  id: string;
  templateId: string;
  name: string;
  brand: string;
  speakerType: string;
  image?: string;
  color: string;
}

export interface Amplifier {
  id: string;
  name: string;
  brand: 'Marshall' | 'Fender' | 'Vox' | 'Orange' | 'Mesa' | 'Laney' | 'Generic';
  color: string;
  texture: string;
  panelColor: string;
  panelMaterial: 'brushed-gold' | 'chrome' | 'black-steel' | 'white-enamel' | 'vintage-cloth' | 'vox-blue' | 'laney-silver';
  knobStyle: 'marshall' | 'fender' | 'orange' | 'chicken-head' | 'silver-reflector' | 'vintage-black';
  grillStyle: 'marshall-black' | 'fender-silver' | 'vox-diamond' | 'orange-weave' | 'mesa-plate' | 'laney-black';
  knobs: Knob[];
  logoStyle?: string;
}

export interface SavedSetup {
  id: string;
  name: string;
  pedals: Pedal[];
  amplifier: Amplifier;
  cabinet?: Cabinet;
  timestamp: number;
}
