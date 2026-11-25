import React, { useState } from 'react';
import { PRESET_CIRCUITS, CircuitPreset } from '../data/presets';
import { CircuitComponent, CircuitWire } from '../types/circuit';
import { soundFX } from '../audio/SoundFX';
import { adService } from '../services/adService';
import { X, BookOpen, ArrowRight, Sparkles, Crown, Film, Loader2 } from 'lucide-react';

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
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const handleLoad = (preset: CircuitPreset) => {
    if (preset.isPro && !isPro) {
      soundFX.playClick();
      onOpenProModal?.();
      return;
    }
    soundFX.playConnect();
    onSelectPreset(preset.components, preset.wires);
    // Safe natural break interstitial ad trigger
    adService.triggerNaturalBreakInterstitial('load_preset').catch(() => {});
    onClose();
  };

  const handleWatchAdUnlock = async (preset: CircuitPreset) => {
    if (unlockingId) return;
    soundFX.playClick();
    setRewardError(null);
    setUnlockingId(preset.id);
    try {
      const earned = await adService.showRewardVideo();
      if (earned) {
        soundFX.playConnect();
        onSelectPreset(preset.components, preset.wires);
        onClose();
      } else {
        const reason = adService.getLastRewardFailureReason();
        if (reason === 'offline') {
          setRewardError('Connect to the internet to watch a short video.');
        } else if (reason === 'dismissed') {
          setRewardError('Watch the full video to unlock this preset.');
        } else {
          setRewardError('No video ad ready right now. Try again in a moment.');
        }
      }
    } finally {
      setUnlockingId(null);
    }
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

                {isLocked ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleWatchAdUnlock(preset)}
                      disabled={unlockingId !== null}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                    >
                      {unlockingId === preset.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Film className="w-3.5 h-3.5" />
                      )}
                      <span>{unlockingId === preset.id ? 'Loading...' : 'Watch Ad'}</span>
                    </button>
                    <button
                      onClick={() => handleLoad(preset)}
                      className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-black text-xs flex items-center justify-center gap-1 active:scale-95 transition"
                      title="Unlock all presets permanently with Pro"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>PRO</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleLoad(preset)}
                    className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition glass-button group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:font-extrabold text-slate-200"
                  >
                    <span>Load Circuit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {rewardError && (
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium text-center">
            {rewardError}
          </div>
        )}
      </div>
    </div>
  );
};
