import React, { useState, useEffect } from 'react';
import { ComponentType, ComponentCategory } from '../types/circuit';
import { COMPONENT_REGISTRY, ComponentMeta } from '../engine/ComponentRegistry';
import { ComponentIcon3D } from './icons3d/ComponentIcon3D';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import {
  Battery,
  Sliders,
  ToggleLeft,
  Sun,
  Volume2,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  Plus,
} from 'lucide-react';

interface ComponentDrawerProps {
  onSpawnComponent: (type: ComponentType) => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
  activeScreen?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

const CATEGORY_TABS: { id: 'all' | ComponentCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'sources', label: 'Power', icon: Battery },
  { id: 'semiconductors', label: 'ICs', icon: Cpu },
  { id: 'passives', label: 'Passive', icon: Sliders },
  { id: 'switches', label: 'Switches', icon: ToggleLeft },
  { id: 'sensors', label: 'Sensors', icon: Sun },
  { id: 'outputs', label: 'Outputs', icon: Volume2 },
  { id: 'logic', label: 'Logic', icon: Zap },
];

export const ComponentDrawer: React.FC<ComponentDrawerProps> = ({
  onSpawnComponent,
  isPro = false,
  onOpenProModal,
  activeScreen = 'circuit',
  onOpenChange,
}) => {
  // In 3D Lab, default to closed so the 3D scene is clean and visible; in 2D mode, start open
  const [isOpen, setIsOpen] = useState<boolean>(() => activeScreen !== '3d');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | ComponentCategory>('all');

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Automatically minimize drawer when entering 3D Lab
  useEffect(() => {
    if (activeScreen === '3d') {
      setIsOpen(false);
    }
  }, [activeScreen]);

  const metaList = Object.values(COMPONENT_REGISTRY) as ComponentMeta[];

  const filteredComponents = metaList.filter((comp) => {
    return activeCategory === 'all' || comp.category === activeCategory;
  });

  const handleSpawn = (comp: ComponentMeta) => {
    if (comp.isPro && !isPro) {
      soundFX.playClick();
      NativeBridge.haptic('warning');
      onOpenProModal?.();
      return;
    }
    soundFX.playConnect();
    NativeBridge.haptic('medium');
    onSpawnComponent(comp.type);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, comp: ComponentMeta) => {
    if (comp.isPro && !isPro) {
      e.preventDefault();
      soundFX.playClick();
      NativeBridge.haptic('warning');
      onOpenProModal?.();
      return;
    }
    e.dataTransfer.setData('application/electrolab-component', comp.type);
    e.dataTransfer.effectAllowed = 'copy';
    soundFX.playClick(1.4);
    NativeBridge.haptic('light');
  };

  // If collapsed/closed, show compact floating side launcher pill so screen is unobstructed
  if (!isOpen) {
    return (
      <div
        style={{ bottom: 'calc(var(--ad-banner-height, 0px) + 96px)' }}
        className="fixed right-3 sm:right-6 z-20 pointer-events-auto select-none font-sans transition-[bottom] duration-200"
      >
        <button
          onClick={() => {
            soundFX.playClick();
            NativeBridge.haptic('light');
            setIsOpen(true);
          }}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-200 active:scale-95 group"
          title="Open Component Palette"
        >
          <div className="w-5 h-5 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">Parts & ICs</span>
          <ChevronUp className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // Expanded Drawer View (Image 1 & 4 Clean Matte-Dark 3D Tile Palette)
  return (
    <div
      style={{ bottom: 'calc(var(--ad-banner-height, 0px) + 92px)' }}
      className="fixed left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl transition-all duration-300 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="bg-[#0b111e]/94 backdrop-blur-2xl border border-white/12 rounded-3xl p-2.5 sm:p-3 shadow-[0_14px_45px_rgba(0,0,0,0.85)] space-y-2">
        {/* Header: Category Tabs + Expand/Collapse + Close Buttons */}
        <div className="flex items-center justify-between gap-2">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFX.playClick(1.2);
                    NativeBridge.haptic('light');
                    setActiveCategory(tab.id);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition duration-200 shrink-0 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/35 ring-1 ring-sky-300/60'
                      : 'bg-[#11192b] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle Expand / Grid Button */}
            <button
              onClick={() => {
                soundFX.playClick();
                NativeBridge.haptic('light');
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 rounded-xl bg-[#11192b] border border-white/10 hover:border-sky-400 text-slate-300 hover:text-white transition shrink-0"
              title={isExpanded ? 'Collapse to Row' : 'Expand All Components'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Close / Slide Down Drawer Button */}
            <button
              onClick={() => {
                soundFX.playClick();
                NativeBridge.haptic('light');
                setIsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-[#11192b] hover:bg-slate-800 border border-white/10 hover:border-rose-400/50 text-slate-300 hover:text-white transition shrink-0 flex items-center gap-1 text-xs font-semibold"
              title="Close / Hide Drawer"
            >
              <ChevronDown className="w-4 h-4 text-sky-400" />
              <span className="text-[11px] hidden sm:inline">Hide</span>
            </button>
          </div>
        </div>

        {/* Component Grid (Scrollable or Expanded 5-Column View — Image 4 Style) */}
        <div
          className={`${
            isExpanded
              ? 'max-h-64 sm:max-h-80 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 pt-1'
              : 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5'
          }`}
        >
          {filteredComponents.map((comp) => {
            const shortName = comp.name.split('(')[0].trim();
            const isLocked = comp.isPro && !isPro;
            return (
              <div
                key={comp.type}
                draggable={!isLocked}
                onDragStart={(e) => handleDragStart(e, comp)}
                onClick={() => handleSpawn(comp)}
                className={`group relative shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-[#131c31] to-[#0c1220] hover:from-[#18243e] hover:to-[#0f172a] border shadow-lg cursor-grab active:cursor-grabbing select-none transition-all duration-200 active:scale-95 ${
                  isLocked
                    ? 'border-amber-500/30 hover:border-amber-400/60'
                    : 'border-white/10 hover:border-sky-400/70 hover:shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                } ${isExpanded ? 'w-full h-[84px]' : 'w-[76px] h-[80px]'}`}
                title={comp.description}
              >
                {/* Subtle radial studio spotlight behind 3D icon */}
                <div className="pointer-events-none absolute inset-x-2 top-2 h-10 rounded-full bg-sky-400/0 group-hover:bg-sky-400/12 blur-md transition-colors" />

                {/* Pro Lock Badge */}
                {isLocked && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[8px] font-mono text-amber-300 font-bold">
                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                    <span>PRO</span>
                  </div>
                )}

                {/* Vivid 3D Isometric Preview Icon */}
                <div className="w-11 h-11 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <ComponentIcon3D type={comp.type} size={42} />
                </div>

                {/* Component Name */}
                <span className="text-[10px] font-semibold text-slate-300 group-hover:text-white truncate max-w-full text-center mt-0.5 leading-tight">
                  {shortName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
