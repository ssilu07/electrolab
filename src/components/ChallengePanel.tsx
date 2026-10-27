import React, { useState, useEffect } from 'react';
import { ChallengeLevel, CircuitComponent, CircuitWire, SimulationResult } from '../types/circuit';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  Circle,
  Lightbulb,
  RotateCcw,
  Star,
  Sparkles,
  ArrowRight,
  Check,
  Lock,
  Crown,
} from 'lucide-react';

interface ChallengePanelProps {
  level: ChallengeLevel;
  simulation: SimulationResult;
  components: CircuitComponent[];
  wires: CircuitWire[];
  onResetLevel: () => void;
  onNextLevel: () => void;
  hasNextLevel: boolean;
  isPro?: boolean;
  onOpenProModal?: () => void;
  currentLevelIndex?: number;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({
  level,
  simulation,
  components,
  wires,
  onResetLevel,
  onNextLevel,
  hasNextLevel,
  isPro = false,
  onOpenProModal,
  currentLevelIndex = 0,
}) => {
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hasTriggeredVictory, setHasTriggeredVictory] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Evaluate validation criteria live
  const validation = level.validate(simulation, components, wires);

  // Handle Level Victory trigger
  useEffect(() => {
    if (validation.completed && !hasTriggeredVictory) {
      setHasTriggeredVictory(true);
      setShowVictoryModal(true);
      soundFX.playVictory();
      NativeBridge.haptic('heavy');

      // Trigger multi-stage celebratory confetti
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.5 },
          colors: ['#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#a855f7'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
            colors: ['#38bdf8', '#fbbf24', '#34d399'],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
            colors: ['#38bdf8', '#fbbf24', '#34d399'],
          });
        }, 250);
      } catch {}
    } else if (!validation.completed && hasTriggeredVictory) {
      setHasTriggeredVictory(false);
    }
  }, [validation.completed, hasTriggeredVictory]);

  // Reset victory flag when level changes
  useEffect(() => {
    setHasTriggeredVictory(false);
    setShowVictoryModal(false);
    setShowHints(false);
    setHintIndex(0);
  }, [level.id]);

  return (
    <>
      {/* Top Level Status Bar (Screenshot 3) */}
      <div className="fixed top-14 left-0 right-0 z-20 px-3 py-2 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
              <span>{level.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {level.difficulty}
              </span>
            </h2>
            <p className="text-[11px] text-slate-300 line-clamp-1">{level.targetGoal}</p>
          </div>
        </div>

        {/* 3 Golden Stars Bar & Energy Coins (Screenshot 3) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10">
            <Star className={`w-3.5 h-3.5 ${validation.completed ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-600'}`} />
            <Star className={`w-3.5 h-3.5 ${validation.completed ? 'text-amber-400 fill-amber-400 animate-bounce delay-100' : 'text-slate-600'}`} />
            <Star className={`w-3.5 h-3.5 ${validation.completed ? 'text-amber-400 fill-amber-400 animate-bounce delay-200' : 'text-slate-600'}`} />
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
            <span>⚡ 120</span>
          </div>
        </div>
      </div>

      {/* Floating Objective Checklist card */}
      <div className="fixed top-28 left-3 sm:left-4 z-20 max-w-xs glass-modal rounded-2xl p-3 shadow-xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-1">
          <span className="font-bold text-white text-[11px] uppercase tracking-wider">Objectives</span>
          <span className="text-[10px] font-mono text-cyan-400">
            {validation.details.filter((d) => d.satisfied).length}/{validation.details.length}
          </span>
        </div>

        <div className="space-y-1">
          {validation.details.map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
              {item.satisfied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <span className={item.satisfied ? 'text-emerald-300 line-through' : 'text-slate-300'}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <div
          className={`p-1.5 rounded-xl text-[10px] font-mono leading-tight border ${
            validation.completed
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          {validation.progressMessage}
        </div>
      </div>

      {/* Bottom Level Controls Bar (Screenshot 3) */}
      <div className="fixed bottom-14 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-950/90 backdrop-blur-2xl border border-white/15 px-3 py-2 rounded-2xl shadow-2xl">
        <button
          onClick={() => {
            soundFX.playClick();
            NativeBridge.haptic('light');
            onResetLevel();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            NativeBridge.haptic('light');
            setShowHints(!showHints);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition active:scale-95"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Hint</span>
          <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">
            {level.hints.length}
          </span>
        </button>

        {hasNextLevel && (
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('medium');
              if (currentLevelIndex >= 1 && !isPro && onOpenProModal) {
                onOpenProModal();
              } else {
                onNextLevel();
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-lg ${
              currentLevelIndex >= 1 && !isPro
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : validation.completed
                ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-500/30 ring-2 ring-emerald-300 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {currentLevelIndex >= 1 && !isPro ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Next (PRO)</span>
              </>
            ) : (
              <>
                <span>Next Level</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Hints Popover Modal */}
      {showHints && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-modal rounded-3xl p-5 border border-amber-500/40 shadow-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Level Clue #{hintIndex + 1}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {hintIndex + 1} / {level.hints.length}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-amber-950/30 p-3 rounded-2xl border border-amber-500/20">
              {level.hints[hintIndex]}
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={hintIndex === 0}
                onClick={() => setHintIndex((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1 rounded-xl bg-slate-900 text-xs font-bold text-slate-300 disabled:opacity-30"
              >
                Previous
              </button>

              <button
                onClick={() => setShowHints(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Got It
              </button>

              <button
                disabled={hintIndex === level.hints.length - 1}
                onClick={() => setHintIndex((prev) => Math.min(level.hints.length - 1, prev + 1))}
                className="px-3 py-1 rounded-xl bg-slate-900 text-xs font-bold text-slate-300 disabled:opacity-30"
              >
                Next Clue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL COMPLETE CELEBRATION MODAL (Screenshot 3) */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm glass-modal rounded-3xl p-6 border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center space-y-4">
            {/* Glowing Victory Check Badge */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/40 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Challenge Solved!
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Level Complete!</h2>
            </div>

            {/* 3 Golden Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
              <Star className="w-10 h-10 text-amber-400 fill-amber-400 -mt-2 drop-shadow-[0_0_15px_rgba(251,191,36,1)]" />
              <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            </div>

            {/* Reward coins */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+50 Energy Coins Earned</span>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {hasNextLevel ? (
                currentLevelIndex >= 1 && !isPro ? (
                  <button
                    onClick={() => {
                      setShowVictoryModal(false);
                      if (onOpenProModal) onOpenProModal();
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 fill-slate-950" />
                    <span>Unlock Pro for Remaining Levels</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowVictoryModal(false);
                      onNextLevel();
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition"
                  >
                    Next Level &rarr;
                  </button>
                )
              ) : (
                <button
                  onClick={() => setShowVictoryModal(false)}
                  className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 hover:scale-[1.02] active:scale-95 transition"
                >
                  All Challenges Completed!
                </button>
              )}

              <button
                onClick={() => setShowVictoryModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Review Circuit Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
