
import React, { useRef, useEffect, useState } from 'react';

interface KnobProps {
  label: string;
  value: number;
  onChange?: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
  style?: 'boss' | 'mxr' | 'boutique' | 'marshall' | 'fender' | 'orange' | 'chicken-head' | 'silver-reflector' | 'vintage' | 'aluminum' | 'vintage-black';
  color?: string;
}

const KnobComponent: React.FC<KnobProps> = ({ label, value, onChange, size = 'md', style = 'boutique', color }) => {
  const rotation = (value / 10) * 270 - 135;
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sizeMap = {
    sm: 'w-16 h-16', 
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'  
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!knobRef.current || !onChange) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      let normalizedAngle = (angle + 135 + 360) % 360;
      if (normalizedAngle > 315) normalizedAngle = 0;
      if (normalizedAngle > 270) normalizedAngle = 270;
      
      const newValue = Math.min(10, Math.max(0, (normalizedAngle / 270) * 10));
      onChange(Math.round(newValue * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange]);

  const renderKnob = () => {
    const Pointer = ({ height = "40%", width = "3px", color = "white", offset = "0", zIndex = "20" }) => (
      <div 
        className="absolute left-1/2 bottom-1/2 origin-bottom pointer-events-none"
        style={{ 
          transform: `translateX(-50%) rotate(${rotation}deg)`, 
          height, 
          width, 
          backgroundColor: color,
          marginBottom: offset,
          zIndex
        }}
      />
    );

    switch (style) {
      case 'marshall':
        return (
          <div className="relative w-full h-full rounded-full bg-black border-2 border-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent pointer-events-none" />
            <div className="absolute inset-[15%] rounded-full bg-[#d4af37] border-2 border-black/40 shadow-inner" />
            <Pointer height="35%" width="4px" color="black" offset="5%" />
          </div>
        );
      case 'fender':
        return (
          <div className="relative w-full h-full rounded-full bg-black border-2 border-zinc-700 shadow-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-700/20 to-transparent rounded-full" />
            <Pointer height="45%" width="2px" color="white" />
          </div>
        );
      case 'boss':
        return (
          <div className="relative w-full h-full rounded-full bg-zinc-900 border-4 border-zinc-700 shadow-xl flex items-center justify-center overflow-hidden">
            <Pointer height="45%" width="4px" color="#e5e7eb" />
            <div className="w-[70%] h-[70%] rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-inner" />
          </div>
        );
      case 'chicken-head':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            <div 
              className="absolute w-6 h-[100%] bg-zinc-900 origin-center shadow-xl flex flex-col items-center rounded-sm"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                clipPath: 'polygon(0% 100%, 100% 100%, 50% 0%)'
              }}
            >
              <div className="w-1.5 h-[35%] bg-white/40 mt-1 rounded-full" />
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 z-10" />
          </div>
        );
      case 'orange':
        return (
          <div className="relative w-full h-full rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden">
             <Pointer height="42%" width="6px" color="#fff" />
          </div>
        );
      case 'silver-reflector':
        return (
          <div className="relative w-full h-full rounded-full bg-zinc-800 border-2 border-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-2 rounded-full bg-zinc-400 border-2 border-black/20 shadow-inner" />
            <Pointer height="40%" width="4px" color="black" />
          </div>
        );
      case 'vintage-black':
        return (
          <div className="relative w-full h-full rounded-full bg-zinc-950 border-4 border-zinc-800 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(0,0,0,0.4)_100%)] rounded-full" />
            <Pointer height="40%" width="4px" color="#fef08a" />
          </div>
        );
      case 'aluminum':
        return (
          <div className="relative w-full h-full rounded-full bg-zinc-400 border-2 border-zinc-500 shadow-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-2 rounded-full bg-zinc-300 shadow-inner" />
            <Pointer height="35%" width="3px" color="#374151" offset="10%" />
          </div>
        );
      default:
        return (
          <div className="relative w-full h-full rounded-full bg-zinc-900 border-4 border-zinc-700 shadow-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40 rounded-full" />
            <Pointer height="40%" width="3px" color="white" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 group relative overflow-visible" onClick={(e) => e.stopPropagation()}>
      {/* Floating Numeric Value */}
      <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-transform duration-200 group-hover:scale-110">
        <div className="bg-zinc-950/90 border border-emerald-500/50 rounded-lg px-2 py-0.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center min-w-[3.2rem]">
          <span className="text-[13px] font-mono font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
            {value.toFixed(1)}
          </span>
        </div>
      </div>

      <div 
        ref={knobRef}
        className={`relative ${sizeMap[size]} cursor-pointer select-none overflow-visible`}
        onMouseDown={handleMouseDown}
      >
        {renderKnob()}
      </div>
      
      <span className="text-[11px] font-black uppercase tracking-[0.1em] select-none drop-shadow-md whitespace-nowrap mt-1 text-center max-w-[120px] overflow-hidden text-ellipsis" style={{ color: color }}>
        {label}
      </span>
    </div>
  );
};

export default KnobComponent;
