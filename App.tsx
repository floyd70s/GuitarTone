
import React, { useState, useEffect, useRef } from 'react';
import { GearType, Pedal, Amplifier, Cabinet, SavedSetup } from './types';
import { PEDAL_LIBRARY, AMPLIFIER_LIBRARY, CABINET_LIBRARY } from './constants';
import PedalComponent from './components/PedalComponent';
import AmplifierComponent from './components/AmplifierComponent';
import { getToneAdjustment } from './services/geminiService';
import { audioEngine } from './services/audioEngine';

const STORAGE_KEY = 'GUITAR_TONE_SAVED_RIGS';

interface SongInfo {
  title: string;
  lyricsWithChords: string;
}

const App: React.FC = () => {
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [currentPedals, setCurrentPedals] = useState<Pedal[]>([]);
  const [currentAmp, setCurrentAmp] = useState<Amplifier | null>(null);
  const [currentCab, setCurrentCab] = useState<Cabinet | null>(CABINET_LIBRARY[0]);
  const [savedRigs, setSavedRigs] = useState<SavedSetup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showGearMenu, setShowGearMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeCategory, setActiveCategory] = useState<GearType>(GearType.DRIVE);
  const [rigName, setRigName] = useState('My Custom Rig');
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedRigs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved rigs", e);
      }
    }
  }, []);

  // Structural changes trigger full graph rebuild
  // We only include length and IDs to avoid rebuilding on simple knob/bypass changes
  useEffect(() => {
    audioEngine.rebuildGraph(currentPedals, currentAmp, currentCab);
  }, [
    currentPedals.length, 
    currentAmp?.id, 
    currentCab?.id, 
    currentPedals.map(p => p.id).join('-')
  ]);

  // Pure parameter updates (knob moves OR bypass toggles) handled via setTargetAtTime
  useEffect(() => {
    audioEngine.updateParams(currentPedals, currentAmp);
  }, [currentPedals, currentAmp]);

  useEffect(() => {
    if (!isMonitoring) return;
    let frame: number;
    const dataArray = new Uint8Array(audioEngine.getAnalyser()?.frequencyBinCount || 0);
    const update = () => {
      const analyser = audioEngine.getAnalyser();
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 128);
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [isMonitoring]);

  const toggleMonitoring = async () => {
    if (!isMonitoring) {
      await audioEngine.init();
    }
    const newState = !isMonitoring;
    setIsMonitoring(newState);
    audioEngine.setMonitoring(newState);
  };

  const resetAll = () => {
    if (window.confirm("Return to start and reset entire setup?")) {
      setCurrentPedals([]);
      setCurrentAmp(null);
      setCurrentCab(CABINET_LIBRARY[0]);
      setRigName('My Custom Rig');
      setSongInfo(null);
      setSearchQuery('');
      setIsOnboarding(true);
      audioEngine.rebuildGraph([], null, CABINET_LIBRARY[0]);
    }
  };

  const clearBoard = () => {
    if (window.confirm("Clear all pedals from the board?")) {
      setCurrentPedals([]);
      setSongInfo(null);
      setSearchQuery('');
      audioEngine.rebuildGraph([], currentAmp, currentCab);
    }
  };

  const saveCurrentRig = () => {
    if (!currentAmp) return;
    const name = window.prompt("Name your rig:", rigName);
    if (name === null) return;
    const newRig: SavedSetup = {
      id: Date.now().toString(),
      name: name || `Rig ${savedRigs.length + 1}`,
      pedals: JSON.parse(JSON.stringify(currentPedals)),
      amplifier: JSON.parse(JSON.stringify(currentAmp)),
      cabinet: currentCab ? JSON.parse(JSON.stringify(currentCab)) : undefined,
      timestamp: Date.now()
    };
    const updated = [newRig, ...savedRigs];
    setSavedRigs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadRig = (rig: SavedSetup) => {
    setCurrentAmp(JSON.parse(JSON.stringify(rig.amplifier)));
    setCurrentPedals(JSON.parse(JSON.stringify(rig.pedals)));
    if (rig.cabinet) setCurrentCab(JSON.parse(JSON.stringify(rig.cabinet)));
    setRigName(rig.name);
    setIsOnboarding(false);
  };

  const exportSongAsJson = () => {
    if (!currentAmp) return;
    const songData = {
      songInfo,
      rig: {
        pedals: currentPedals,
        amplifier: currentAmp,
        cabinet: currentCab
      },
      rigName
    };
    const blob = new Blob([JSON.stringify(songData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${songInfo?.title || 'Song_Rig'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSongFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.rig) {
          setCurrentAmp(data.rig.amplifier);
          setCurrentPedals(data.rig.pedals);
          if (data.rig.cabinet) setCurrentCab(data.rig.cabinet);
        }
        if (data.songInfo) setSongInfo(data.songInfo);
        if (data.rigName) setRigName(data.rigName);
        setIsOnboarding(false);
        setShowSummary(true);
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addPedal = (pedalTemplate: Pedal) => {
    if (currentPedals.length >= 6) {
      alert("Maximum of 6 pedals allowed.");
      return;
    }
    const newPedal = {
      ...pedalTemplate,
      id: `${pedalTemplate.templateId}-${Date.now()}`,
      isActive: true,
      knobs: pedalTemplate.knobs.map(k => ({ ...k }))
    };
    setCurrentPedals(prev => [newPedal, ...prev]);
    setShowGearMenu(false);
  };

  const removePedal = (id: string) => {
    setCurrentPedals(prev => prev.filter(p => p.id !== id));
  };

  const togglePedal = (id: string) => {
    setCurrentPedals(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleDragStart = (id: string, clientX: number, clientY: number) => {
    setDraggingId(id);
    dragStartCoords.current = { x: clientX, y: clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!draggingId) return;
    const dx = clientX - dragStartCoords.current.x;
    const dy = clientY - dragStartCoords.current.y;
    setDragOffset({ x: dx, y: dy });

    const threshold = 160; 
    if (Math.abs(dx) > threshold) {
      const idx = currentPedals.findIndex(p => p.id === draggingId);
      if (idx === -1) return;

      const moveDirection = dx > 0 ? -1 : 1;
      const newIdx = idx + moveDirection;

      if (newIdx >= 0 && newIdx < currentPedals.length) {
        const newPedals = [...currentPedals];
        const [moved] = newPedals.splice(idx, 1);
        newPedals.splice(newIdx, 0, moved);
        setCurrentPedals(newPedals);
        dragStartCoords.current.x = clientX;
        setDragOffset(prev => ({ ...prev, x: 0 }));
      }
    }
  };

  const handleDragEnd = () => {
    if (draggingId && dragOffset.y < -150) {
      removePedal(draggingId);
    }
    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const updatePedalKnob = (pedalId: string, knobLabel: string, value: number) => {
    setCurrentPedals(prev => prev.map(p => {
      if (p.id === pedalId) {
        return {
          ...p,
          knobs: p.knobs.map(k => k.label === knobLabel ? { ...k, value } : k)
        };
      }
      return p;
    }));
  };

  const updateAmpKnob = (knobLabel: string, value: number) => {
    if (!currentAmp) return;
    setCurrentAmp(prev => prev ? ({
      ...prev,
      knobs: prev.knobs.map(k => k.label === knobLabel ? { ...k, value } : k)
    }) : null);
  };

  const handleToneMatch = async () => {
    if (!searchQuery || !currentAmp) return;
    setIsSearching(true);
    try {
      const suggestion = await getToneAdjustment(searchQuery, currentPedals, currentAmp);
      if (suggestion.songInfo) setSongInfo(suggestion.songInfo);
      
      if (suggestion.amplifier) {
        setCurrentAmp(prev => prev ? ({
          ...prev,
          knobs: prev.knobs.map(k => {
            const match = suggestion.amplifier.settings.find((s: any) => s.knob.toLowerCase() === k.label.toLowerCase());
            return match ? { ...k, value: match.value } : k;
          })
        }) : null);
      }

      if (Array.isArray(suggestion.pedals)) {
        setCurrentPedals(prev => prev.map(p => {
          const matched = suggestion.pedals.find((s: any) => 
            s.name.toLowerCase().includes(p.name.toLowerCase()) || 
            p.name.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matched) {
            return {
              ...p,
              isActive: matched.isActive,
              knobs: p.knobs.map(k => {
                const match = matched.settings.find((s: any) => s.knob.toLowerCase() === k.label.toLowerCase());
                return match ? { ...k, value: match.value } : k;
              })
            };
          }
          return p;
        }));
      }
      setShowSummary(true);
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  if (isOnboarding) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
          <h1 className="text-5xl font-black text-white italic mb-8 tracking-tighter">SELECT CORE RIG</h1>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-8 pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
            {AMPLIFIER_LIBRARY.map(amp => (
              <div key={amp.id} onClick={() => { setCurrentAmp(amp); setIsOnboarding(false); }} className="cursor-pointer">
                <AmplifierComponent amplifier={amp} onUpdateKnob={() => {}} mini />
              </div>
            ))}
          </div>
          {savedRigs.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/5">
              <h4 className="text-[10px] uppercase font-black text-slate-600 tracking-[0.4em] mb-4">RESTORE PRESET</h4>
              <div className="flex flex-wrap gap-3">
                {savedRigs.map(rig => (
                  <button key={rig.id} onClick={() => loadRig(rig)} className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl text-xs font-black text-white transition-all shadow-xl active:scale-95">
                    {rig.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importSongFromJson} />

      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 z-[100] flex items-center justify-between shrink-0 shadow-2xl">
        <div 
          className="flex items-center gap-4 cursor-pointer group" 
          onClick={resetAll}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">GT</div>
          <h1 className="text-2xl font-black italic tracking-tighter hidden lg:block">GUITAR TONE</h1>
        </div>
        
        <div className="flex-1 max-w-2xl flex gap-3 mx-8">
          <input 
            type="text" 
            placeholder="Artist, song, or tone style..." 
            className="flex-1 bg-slate-800/40 border border-white/10 rounded-2xl px-5 py-2.5 text-sm focus:ring-2 ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 font-bold" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleToneMatch()}
          />
          <button onClick={handleToneMatch} disabled={isSearching} className="bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-2xl text-xs font-black uppercase shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all active:scale-95 disabled:opacity-50">
            {isSearching ? '...' : 'Match'}
          </button>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={toggleMonitoring} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isMonitoring ? 'bg-red-600/20 text-red-400 border-red-500/50' : 'bg-slate-800 text-slate-400 border-white/5'}`}>
             <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-slate-600'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest">{isMonitoring ? 'Live' : 'Connect'}</span>
           </button>

           <button onClick={() => setShowSummary(!showSummary)} title="Tone Report" className={`w-11 h-11 rounded-2xl transition-all active:scale-90 flex items-center justify-center ${showSummary ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
           </button>
           <button onClick={saveCurrentRig} title="Save Setup" className="w-11 h-11 bg-zinc-800 text-white hover:bg-zinc-700 rounded-2xl transition-all active:scale-90 border border-white/5 flex items-center justify-center">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
           </button>
           <div className="w-[1px] h-8 bg-white/5 mx-1" />
           <button onClick={exportSongAsJson} title="Export Song Config" className="w-11 h-11 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 rounded-2xl transition-all active:scale-90 border border-emerald-500/20 flex items-center justify-center">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
           </button>
           <button onClick={() => fileInputRef.current?.click()} title="Import Song Config" className="w-11 h-11 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 rounded-2xl transition-all active:scale-90 border border-amber-500/20 flex items-center justify-center">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4-4v12"/></svg>
           </button>
           <button onClick={clearBoard} title="Clear Board" className="w-11 h-11 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-2xl transition-all active:scale-90 border border-red-500/20 flex items-center justify-center">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
           </button>
           <div className="w-[1px] h-8 bg-white/5 mx-1" />
           <button onClick={() => setShowGearMenu(true)} className="bg-white text-black px-6 py-2.5 rounded-2xl text-xs font-black uppercase shadow-2xl transition-all hover:bg-slate-200 active:scale-95 tracking-widest">+ Gear</button>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-hidden">
        
        <div className="flex-1 flex flex-col items-center justify-center gap-0">
          
          <div className="w-full max-w-[1400px] relative flex flex-col items-center justify-center flex-[1.2] overflow-visible">
            
            {isMonitoring && (
              <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                <div className="w-2 h-48 bg-zinc-900 rounded-full overflow-hidden flex flex-col justify-end">
                  <div className="w-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-75" style={{ height: `${audioLevel * 100}%` }} />
                </div>
                <span className="text-[8px] font-black uppercase text-zinc-600 rotate-90 mt-4">Level</span>
              </div>
            )}

            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[30]">
               <button 
                 onClick={() => setShowGearMenu(true)} 
                 className="bg-white/5 backdrop-blur-md hover:bg-white/10 text-white/20 hover:text-white/60 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.5em] border border-white/5 transition-all active:scale-95 shadow-2xl"
               >
                 + Gear Archive
               </button>
            </div>

            <div className="relative flex flex-row-reverse items-end justify-center w-full px-12 overflow-visible min-h-[440px]">
              <div className="flex flex-col items-center opacity-20 shrink-0 self-end mb-16 mx-10">
                <div className="w-16 h-12 bg-zinc-800 rounded-2xl border-2 border-zinc-700 shadow-2xl" />
                <span className="text-[10px] uppercase font-black mt-4 tracking-[0.3em] italic">Input</span>
              </div>

              {currentPedals.map((pedal) => (
                <div key={pedal.id} className="flex items-center overflow-visible">
                  <PedalComponent 
                    pedal={pedal} 
                    onRemove={removePedal} 
                    onUpdateKnob={updatePedalKnob} 
                    onToggle={togglePedal}
                    onDragStart={(id, x) => handleDragStart(id, x, dragStartCoords.current.y)}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    isDraggingItem={draggingId === pedal.id}
                    dragOffset={draggingId === pedal.id ? dragOffset : { x: 0, y: 0 }}
                  />
                  <div className="w-12 h-3 bg-gradient-to-r from-zinc-800/60 via-zinc-600/40 to-zinc-800/60 rounded-full mx-[-6px] z-0 shadow-inner" />
                </div>
              ))}
              
              {currentPedals.length === 0 && (
                <div 
                  className="flex-1 max-w-3xl flex flex-col items-center justify-center py-28 border-4 border-dashed border-white/[0.03] rounded-[4rem] opacity-20 hover:opacity-40 hover:bg-white/[0.02] transition-all cursor-pointer group" 
                  onClick={() => setShowGearMenu(true)}
                >
                   <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                   </div>
                   <p className="text-lg font-black uppercase tracking-[0.4em] italic text-center">Empty Signal Chain<br/><span className="text-xs tracking-widest mt-2 block opacity-60">ADD UP TO 6 PEDALS</span></p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-6xl flex justify-center py-6 mb-4 shrink-0 overflow-visible gap-8 items-end">
            {currentAmp && (
              <div className="flex-1 group/amp flex flex-col items-center overflow-visible">
                <div className="mb-4 text-center text-zinc-800 font-black uppercase tracking-[1.2em] text-[11px] opacity-30 select-none">
                  Stage Output Amplifier
                </div>
                <div className="w-full transform transition-all duration-700 hover:translate-y-[-5px]">
                  <AmplifierComponent amplifier={currentAmp} onUpdateKnob={updateAmpKnob} onGearClick={() => { setActiveCategory(GearType.AMPLIFIER); setShowGearMenu(true); }} />
                </div>
              </div>
            )}

            {currentCab && (
              <div 
                onClick={() => { setActiveCategory(GearType.CABINET); setShowGearMenu(true); }}
                className="w-64 shrink-0 mb-4 cursor-pointer group/cab"
              >
                <div className="text-[9px] font-black uppercase text-zinc-800 tracking-[0.6em] mb-3 text-center opacity-30">Cabinet Simulation</div>
                <div className="w-full h-48 bg-zinc-900 rounded-xl border-8 border-black shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#222_1px,transparent_0)] bg-[size:4px_4px]" />
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-white/60 font-black italic text-xl uppercase tracking-tighter">{currentCab.brand}</div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">{currentCab.name}</div>
                    <div className="mt-4 flex gap-1">
                      {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center"><div className="w-1 h-1 bg-zinc-700 rounded-full" /></div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showSummary && (
          <div className="absolute top-4 right-4 bottom-4 w-[460px] bg-slate-950/98 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_40px_150px_rgba(0,0,0,1)] z-[150] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex flex-col">
                <h3 className="font-black text-2xl italic tracking-tighter text-white">TONE REPORT</h3>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2">Neural Rig Analysis Core</span>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-thin scrollbar-thumb-zinc-800">
              {songInfo && (
                <div className="bg-blue-600/10 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xl"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
                    <h4 className="text-lg font-black uppercase text-blue-400 italic tracking-tight">{songInfo.title}</h4>
                  </div>
                  <div className="bg-black/50 rounded-2xl p-6 border border-white/5 shadow-inner">
                    <pre className="text-[12px] font-mono whitespace-pre-wrap text-blue-50/90 leading-[1.8] overflow-x-auto tracking-tight font-bold">
                      {songInfo.lyricsWithChords}
                    </pre>
                  </div>
                </div>
              )}
              
              {currentAmp && (
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                     <div className="w-2 h-6 bg-slate-700 rounded-full" />
                     <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em]">CORE SETTINGS: {currentAmp.name}</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                     {currentAmp.knobs.map(k => (
                       <div key={k.label} className="bg-white/[0.02] p-4 rounded-[1.5rem] border border-white/5 flex flex-col gap-3 group/item">
                         <span className="text-[10px] uppercase font-black text-slate-600 tracking-widest group-hover/item:text-blue-400 transition-colors">{k.label}</span>
                         <div className="flex items-center justify-between">
                            <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden mr-4">
                               <div className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" style={{ width: `${k.value * 10}%` }} />
                            </div>
                            <span className="font-mono text-sm font-black text-blue-400">{k.value.toFixed(1)}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-black/98 p-2 text-center text-zinc-900 text-[10px] font-black uppercase tracking-[1.5em] select-none shrink-0 border-t border-white/[0.02]">
        Neural Guitar Rig Core Emulator
      </footer>

      {showGearMenu && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[200] flex items-center justify-center p-8">
          <div className="bg-slate-900 border border-white/10 rounded-[3.5rem] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-[0_50px_200px_rgba(0,0,0,1)]">
             <div className="p-10 border-b border-white/10 flex justify-between items-center bg-slate-950/50">
               <div>
                 <h2 className="text-4xl font-black italic tracking-tighter text-white">GEAR ARCHIVE</h2>
                 <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] mt-3">Neural Analog Hardware Models</p>
               </div>
               <button onClick={() => setShowGearMenu(false)} className="w-14 h-14 rounded-[1.5rem] bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all active:scale-90 shadow-2xl border border-white/5 text-white">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
             </div>
             <div className="flex flex-1 overflow-hidden">
               <div className="w-64 border-r border-white/5 p-8 space-y-4 overflow-y-auto scrollbar-none bg-black/30">
                 {Object.values(GearType).map(cat => (
                   <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)} 
                    className={`w-full text-left px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'text-slate-600 hover:bg-white/5'}`}
                   >
                    {cat}
                   </button>
                 ))}
               </div>
               <div className="flex-1 p-12 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-12 scrollbar-thin scrollbar-thumb-zinc-800">
                 {activeCategory === GearType.AMPLIFIER ? 
                   AMPLIFIER_LIBRARY.map(amp => (
                     <div key={amp.id} onClick={() => { setCurrentAmp(amp); setShowGearMenu(false); }} className="cursor-pointer">
                       <AmplifierComponent amplifier={amp} onUpdateKnob={() => {}} mini />
                     </div>
                   )) :
                   activeCategory === GearType.CABINET ?
                   CABINET_LIBRARY.map(cab => (
                     <div key={cab.id} onClick={() => { setCurrentCab(cab); setShowGearMenu(false); }} className="cursor-pointer group flex flex-col items-center gap-4">
                       <div className="w-48 h-32 bg-zinc-800 rounded-xl border-4 border-black shadow-2xl group-hover:scale-105 transition-transform relative overflow-hidden flex flex-col items-center justify-center">
                          <div className="text-white/40 font-black italic">{cab.brand}</div>
                          <div className="text-[10px] uppercase font-black opacity-20">{cab.name}</div>
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest">{cab.name}</span>
                     </div>
                   )) :
                   PEDAL_LIBRARY.filter(p => p.type === activeCategory).map(pedal => (
                     <div key={pedal.id} onClick={() => addPedal(pedal)} className="cursor-pointer group flex flex-col items-center gap-5">
                        <div className="w-32 h-48 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:translate-y-[-10px] transition-all border-2 border-black/20 relative flex flex-col items-center p-6 overflow-hidden" style={{ backgroundColor: pedal.color }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20" />
                            <div className="w-full h-1/5 bg-black/30 rounded-xl mb-6 z-10" />
                            <div className="grid grid-cols-2 gap-3 mt-auto pb-6 z-10">
                               <div className="w-4 h-4 rounded-full bg-black/40" />
                               <div className="w-4 h-4 rounded-full bg-black/40" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-zinc-400 border-[3px] border-zinc-600 absolute bottom-6 shadow-2xl z-10" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-center group-hover:text-blue-500 transition-colors">{pedal.name}</span>
                     </div>
                   ))
                 }
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
