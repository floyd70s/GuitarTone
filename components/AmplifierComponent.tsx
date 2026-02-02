
import React from 'react';
import { Amplifier } from '../types';
import KnobComponent from './KnobComponent';

interface AmplifierProps {
  amplifier: Amplifier;
  onUpdateKnob: (knobLabel: string, value: number) => void;
  onGearClick?: () => void;
  mini?: boolean;
}

const GrillPattern: React.FC<{ style: string }> = ({ style }) => {
  switch (style) {
    case 'vox-diamond':
      return <div className="absolute inset-0 bg-[#2d1b1b] opacity-90 bg-[repeating-linear-gradient(45deg,#4d3333,#4d3333_8px,#331a1a_8px,#331a1a_16px)]" />;
    case 'marshall-black': return <div className="absolute inset-0 bg-zinc-900 opacity-90 bg-[radial-gradient(circle_at_1px_1px,_#111_1.5px,_transparent_0)] bg-[size:6px_6px]" />;
    case 'fender-silver': return <div className="absolute inset-0 bg-zinc-400 opacity-40 bg-[radial-gradient(circle_at_1px_1px,_#fff_1.5px,_transparent_0)] bg-[size:4px_4px]" />;
    case 'orange-weave': return <div className="absolute inset-0 bg-[#d97706] opacity-40 bg-[repeating-linear-gradient(45deg,#000,#000_1px,transparent_1px,transparent_6px)]" />;
    case 'mesa-plate': return <div className="absolute inset-0 bg-zinc-800 bg-[linear-gradient(45deg,#222_25%,transparent_25%,transparent_50%,#222_50%,#222_75%,transparent_75%,transparent)] bg-[size:30px_30px]" />;
    case 'laney-black': return <div className="absolute inset-0 bg-zinc-950 opacity-90 bg-[radial-gradient(circle_at_1px_1px,#111_1.5px,transparent_0)] bg-[size:8px_8px]" />;
    default: return <div className="absolute inset-0 bg-zinc-900" />;
  }
};

const AmplifierComponent: React.FC<AmplifierProps> = ({ amplifier, onUpdateKnob, onGearClick, mini }) => {
  const panelClass = () => {
    switch (amplifier.panelMaterial) {
      case 'vox-blue': return 'bg-gradient-to-b from-blue-900 via-blue-950 to-black border-y-2 border-white/20';
      case 'brushed-gold': return 'bg-gradient-to-b from-[#f2d07e] via-[#d4af37] to-[#8c6d1a] border-y-2 border-black/50';
      case 'chrome': return 'bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 border-y-2 border-zinc-600 shadow-inner';
      case 'black-steel': return 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-y-2 border-white/10';
      case 'white-enamel': return 'bg-zinc-100 border-y-2 border-zinc-300';
      case 'laney-silver': return 'bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 border-y-2 border-zinc-600';
      default: return 'bg-zinc-900';
    }
  };

  if (mini) {
    return (
      <div className="w-full aspect-video relative group transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-white/5">
          <div className="h-2/3 w-full relative"><GrillPattern style={amplifier.grillStyle} /></div>
          <div className={`h-1/3 w-full ${panelClass()} flex items-center justify-center`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{amplifier.brand}</span>
            <span className="text-sm font-black text-white italic drop-shadow-2xl leading-none">{amplifier.name}</span>
          </div>
        </div>
      </div>
    );
  }

  const useTwoRows = amplifier.knobs.length > 7;

  return (
    <div className="w-full mx-auto relative h-full flex flex-col justify-center overflow-visible">
      {/* Top Handle visual */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-40 h-8 bg-black border-x-4 border-t-4 border-zinc-900 rounded-t-xl z-30 shadow-2xl pointer-events-none" />
      
      <div className="w-full p-2 bg-zinc-950 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] border-[10px] border-black overflow-visible relative flex flex-col">
        {/* Grill Area */}
        <div onClick={() => onGearClick?.()} className="relative h-20 bg-zinc-950 flex items-center justify-center overflow-hidden border-b-[8px] border-black shrink-0 cursor-pointer group/grill">
          <GrillPattern style={amplifier.grillStyle} />
          <div className="relative z-10 flex items-center gap-4 transition-transform group-hover/grill:scale-105 duration-500">
            <span className="text-white/80 font-black italic text-4xl tracking-tighter uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 0px #000' }}>
              {amplifier.brand}
            </span>
            <span className="bg-black/40 px-4 py-1.5 rounded-lg border border-white/10 text-white/30 font-black italic text-base shadow-xl">
              {amplifier.name}
            </span>
          </div>
          <div className="absolute top-0 left-0 w-12 h-12 bg-black rounded-br-[3rem] border-r border-b border-zinc-800" />
          <div className="absolute top-0 right-0 w-12 h-12 bg-black rounded-bl-[3rem] border-l border-b border-zinc-800" />
        </div>

        {/* Control Panel area - INCREASED SIZE */}
        <div className={`relative ${useTwoRows ? 'h-[340px]' : 'h-[200px]'} px-10 pt-10 pb-6 flex items-center justify-between shadow-2xl ${panelClass()} shrink-0 overflow-visible transition-all duration-500`}>
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

          {/* Left Switches */}
          <div className="relative z-10 flex flex-col justify-between h-full w-[140px] shrink-0 py-2">
             <div className="text-white/40 font-black italic text-lg leading-tight uppercase tracking-tight">{amplifier.brand}</div>
             <div className="flex gap-3">
                <div className="w-10 h-14 bg-red-600 rounded-xl shadow-xl border-2 border-red-800 flex items-center justify-center transform active:scale-95 transition-all">
                  <div className="w-2 h-9 bg-white/40 rounded-full" />
                </div>
                <div className="w-10 h-14 bg-zinc-950 rounded-xl shadow-xl border-2 border-black flex items-center justify-center transform active:scale-95 transition-all">
                  <div className="w-2 h-9 bg-white/40 rounded-full" />
                </div>
             </div>
          </div>

          {/* Knobs Area - INCREASED SCALING */}
          <div className="flex-1 flex flex-wrap justify-center items-center gap-x-10 gap-y-16 px-4 h-full overflow-visible relative z-20">
            {amplifier.knobs.map((knob) => (
              <div key={knob.label} className="shrink-0 flex items-center justify-center w-[80px] h-[80px] overflow-visible scale-[0.85] transform transition-transform hover:scale-100">
                <KnobComponent 
                  label={knob.label} 
                  value={knob.value} 
                  size="md" 
                  style={amplifier.knobStyle} 
                  color="rgba(255,255,255,0.8)" 
                  onChange={(val) => onUpdateKnob(knob.label, val)} 
                />
              </div>
            ))}
          </div>

          {/* Right Inputs Area */}
          <div className="relative z-10 flex flex-col items-end justify-center gap-6 text-white/30 w-[100px] shrink-0 h-full">
             <div className="flex flex-col gap-6">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border-[6px] border-zinc-600 shadow-[inset_0_4px_10px_black] flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-black/80" />
                </div>
                <div className="w-12 h-12 rounded-full bg-zinc-800 border-[6px] border-zinc-600 shadow-[inset_0_4px_10px_black] flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-black/80" />
                </div>
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-center w-full block">Input</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmplifierComponent;
