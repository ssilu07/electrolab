import React, { useState } from 'react';
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
  ShieldCheck,
  Crown,
} from 'lucide-react';

interface ComponentDrawerProps {
  onSpawnComponent: (type: ComponentType) => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | ComponentCategory>('all');

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

  return (
    <div className="fixed bottom-14 md:bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl transition-all duration-300">
      <div className="bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] space-y-2">
        {/* Header: Category Tabs + Expand/Collapse Sheet Button */}
        <div className="flex items-center justify-between gap-2">
          {/* Category Chips (Screenshot 1 & 2) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
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
                  className={`px-3 py-1 rounded-full text-xs font-bold transition duration-200 shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 ring-1 ring-cyan-300'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Toggle Expand / Grid Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white transition shrink-0"
            title={isExpanded ? 'Collapse Drawer' : 'Expand All Components'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Component Grid (Scrollable or Expanded View) */}
        <div
          className={`${
            isExpanded
              ? 'max-h-64 sm:max-h-80 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 pt-1'
              : 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1'
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
                className={`group relative shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border shadow-lg cursor-grab active:cursor-grabbing select-none transition-all duration-200 active:scale-95 ${
                  isLocked
                    ? 'border-amber-500/30 hover:border-amber-400 bg-gradient-to-b from-slate-900/80 to-amber-950/20'
                    : 'border-white/10 hover:border-cyan-400/80'
                } ${isExpanded ? 'w-full aspect-square' : 'w-20 h-24'}`}
                title={
                  isLocked
                    ? `${comp.name} — ElectroLab PRO Component (Tap to Unlock or earn Free 10m Pass)`
                    : `${comp.name} — Tap to Add or Drag onto Board`
                }
              >
                {/* Pro Crown Badge */}
                {isLocked && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500/25 border border-amber-500/50 text-amber-400 shadow-md flex items-center justify-center pointer-events-none z-10 animate-pulse">
                    <Crown className="w-2.5 h-2.5" />
                  </div>
                )}

                {/* 3D Component Icon */}
                <div
                  className={`shrink-0 p-1 rounded-xl bg-black/50 border transition shadow-inner ${
                    isLocked
                      ? 'border-amber-500/20 group-hover:border-amber-400/50 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'border-white/5 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  <ComponentIcon3D type={comp.type} size={40} interactive={true} />
                </div>

                {/* Component Label */}
                <span
                  className={`text-[10px] font-bold transition-colors text-center line-clamp-1 mt-1 ${
                    isLocked ? 'text-amber-200/90 group-hover:text-amber-300' : 'text-slate-200 group-hover:text-cyan-300'
                  }`}
                >
                  {shortName}
                </span>

                {/* Subtitle / Spec indicator in expanded mode */}
                {isExpanded && (
                  <span
                    className={`text-[8px] font-mono -mt-0.5 line-clamp-1 ${
                      isLocked ? 'text-amber-400/80' : 'text-cyan-400/80'
                    }`}
                  >
                    {isLocked ? 'PRO' : comp.category}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 100% Offline & Zero Ads Glowing Badge (Screenshot 1) */}
        <div className="pt-1 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-[10px] font-bold text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>100% Offline &bull; Zero Ads</span>
          </div>
        </div>
      </div>
    </div>
  );
};
