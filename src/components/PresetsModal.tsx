import React from 'react';
import { PRESET_CIRCUITS, CircuitPreset } from '../data/presets';
import { CircuitComponent, CircuitWire } from '../types/circuit';
import { soundFX } from '../audio/SoundFX';
import { X, BookOpen, ArrowRight, Sparkles, Crown } from 'lucide-react';

interface PresetsModalProps {
  onSelectPreset: (components: CircuitComponent[], wires: CircuitWire[]) => void;
  onClose: () => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  onSelectPreset,
  onClose,
  isPro = false,
  onOpenProModal,
}) => {
  const handleLoad = (preset: CircuitPreset) => {
    if (preset.isPro && !isPro) {
      soundFX.playClick();
      onOpenProModal?.();
      return;
    }
    soundFX.playConnect();
    onSelectPreset(preset.components, preset.wires);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-xl glass-modal rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-white">Circuit Presets & 3D Lab Demos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Explore interactive, pre-wired benchmark circuits demonstrating analog voltage dividers, 555 timer oscillators, and digital logic gates in full 3D!
        </p>

        {/* Preset Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {PRESET_CIRCUITS.map((preset) => {
            const isLocked = preset.isPro && !isPro;
            return (
              <div
                key={preset.id}
                className={`glass-panel rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 group ${
                  isLocked
                    ? 'border-amber-500/30 hover:border-amber-400/70 bg-gradient-to-b from-slate-900/80 to-amber-950/20'
                    : 'hover:glass-panel-glow'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                        {preset.category}
                      </span>
                      {isLocked && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>
                    <Sparkles
                      className={`w-3.5 h-3.5 transition ${
                        isLocked ? 'text-amber-400/80' : 'text-slate-600 group-hover:text-cyan-400'
                      }`}
                    />
                  </div>
                  <h4
                    className={`font-bold text-sm transition ${
                      isLocked ? 'text-amber-200 group-hover:text-amber-300' : 'text-slate-100 group-hover:text-cyan-300'
                    }`}
                  >
                    {preset.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                </div>

                <button
                  onClick={() => handleLoad(preset)}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isLocked
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-md'
                      : 'glass-button group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:font-extrabold text-slate-200'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unlock with Pro</span>
                    </>
                  ) : (
                    <>
                      <span>Load Circuit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
