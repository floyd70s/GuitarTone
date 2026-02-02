
import React, { useState, useRef, useEffect } from 'react';
import { Pedal } from '../types';
import KnobComponent from './KnobComponent';
import { PEDAL_WIDTH } from '../constants';

interface PedalProps {
  pedal: Pedal;
  onRemove: (id: string) => void;
  onUpdateKnob: (pedalId: string, knobLabel: string, value: number) => void;
  onToggle: (id: string) => void;
  onDragStart: (id: string, startX: number) => void;
  onDragMove: (deltaX: number, deltaY: number) => void;
  onDragEnd: () => void;
  isDraggingItem?: boolean;
  dragOffset?: { x: number, y: number };
}

const PedalComponent: React.FC<PedalProps> = ({ 
  pedal, 
  onRemove, 
  onUpdateKnob, 
  onToggle,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDraggingItem = false,
  dragOffset = { x: 0, y: 0 }
}) => {
  const isActive = pedal.isActive !== false;
  const textColor = pedal.textColor || '#ffffff';
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.knob-target')) return;
    onDragStart(pedal.id, e.clientX);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      onDragMove(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      onDragEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      onMouseDown={handleMouseDown}
      className={`relative flex flex-col items-center p-4 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all select-none shrink-0 border-t border-white/10 overflow-visible
        ${isDraggingItem ? 'z-50 cursor-grabbing' : 'z-10 cursor-grab hover:brightness-110 active:scale-95'}
      `}
      style={{ 
        width: `${PEDAL_WIDTH + 40}px`,
        height: '420px', 
        backgroundColor: pedal.color,
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.25) 100%)',
        transform: isDraggingItem ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(3deg) scale(1.05)` : 'none',
        filter: isActive ? 'none' : 'brightness(0.5) saturate(0.2) grayscale(0.4)',
        transition: isDraggingItem ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay rounded-2xl overflow-hidden" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstriped-suit.png")` }} />

      <div className="w-full flex justify-center mb-4 z-20">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic text-center" style={{ color: textColor }}>
          {pedal.brand || 'GT NEURAL ANALOG'}
        </div>
      </div>

      <div className="w-full bg-black/40 px-3 py-3 rounded-xl mb-6 shadow-[inset_0_2px_10px_black] text-center border border-white/5 shrink-0">
         <span className="text-[12px] font-black uppercase tracking-[0.15em] block leading-tight drop-shadow-xl" style={{ color: textColor }}>
           {pedal.name}
         </span>
      </div>

      <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-10 items-center justify-center px-1 overflow-visible">
        {pedal.knobs.map((knob) => (
          <div key={knob.label} className="knob-target flex justify-center scale-[0.85] origin-center overflow-visible">
            <KnobComponent 
              label={knob.label} 
              value={knob.value} 
              size="sm"
              style={pedal.knobStyle}
              color={isActive ? textColor : '#666'}
              onChange={(val) => onUpdateKnob(pedal.id, knob.label, val)}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 mb-3 shrink-0">
        <div 
          className="w-4 h-4 rounded-full border-2 border-black/50 shadow-2xl transition-all duration-300"
          style={{ 
            backgroundColor: isActive ? (pedal.glowColor || '#ff0000') : '#111', 
            boxShadow: isActive ? `0 0 15px ${pedal.glowColor || '#ff0000'}, inset 0 2px 4px rgba(255,255,255,0.5)` : 'inset 0 2px 4px rgba(0,0,0,0.8)'
          }} 
        />
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(pedal.id); }}
        className="relative w-18 h-18 rounded-full bg-zinc-400 border-[6px] border-zinc-500 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-2 active:shadow-inner transition-all shrink-0 cursor-pointer outline-none"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-100 via-zinc-400 to-zinc-600 border-2 border-zinc-700" />
      </button>

      {isDraggingItem && dragOffset.y < -100 && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black py-3 px-6 rounded-full shadow-2xl border-2 border-white/20 uppercase tracking-widest animate-bounce z-[100] whitespace-nowrap">
          UP TO DISCARD
        </div>
      )}
    </div>
  );
};

export default PedalComponent;
