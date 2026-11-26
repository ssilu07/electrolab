import React, { useState, useEffect } from 'react';
import { ChallengeLevel, CircuitComponent, CircuitWire, SimulationResult } from '../types/circuit';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { adService } from '../services/adService';
import { ratingService } from '../services/ratingService';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  Circle,
  Lightbulb,
  RotateCcw,
  Star,
  Sparkles,
  Check,
  Crown,
  Film,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
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
  onPromptRating?: () => void;
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
  onPromptRating,
}) => {
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<Set<string>>(() => new Set());
  const [isUnlockingHint, setIsUnlockingHint] = useState(false);
  const [hasTriggeredVictory, setHasTriggeredVictory] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [hintAdMessage, setHintAdMessage] = useState<string | null>(null);
  const [objectivesOpen, setObjectivesOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Pause banner whenever a challenge modal is open to prevent accidental clicks
  useEffect(() => {
    const isModalOpen = showHints || showVictoryModal;
    adService.setOverlayOpen('challenge_modal', isModalOpen).catch(() => {});
    return () => {
      adService.setOverlayOpen('challenge_modal', false).catch(() => {});
    };
  }, [showHints, showVictoryModal]);

  // Handle Watch Ad to Unlock Clue (strictly on-demand — no wasted speculative preloads)
  const handleWatchAdForHint = async (idx: number) => {
    soundFX.playClick();
    NativeBridge.haptic('medium');
    setIsUnlockingHint(true);
    setHintAdMessage(null);

    try {
      const earned = await adService.showRewardVideo();
      if (earned) {
        soundFX.playVictory();
        NativeBridge.haptic('success');
        setUnlockedHints((prev) => new Set(prev).add(`${level.id}_${idx}`));
        setHintAdMessage(null);
      } else {
        const reason = adService.getLastRewardFailureReason();
        if (reason === 'dismissed') {
          setHintAdMessage('Watch the full video to unlock this clue.');
        } else if (reason === 'offline') {
          setHintAdMessage('Connect to the internet to load the sponsor video.');
        } else {
          setHintAdMessage('Sponsor video is temporarily unavailable. Please try again in a moment.');
        }
      }
    } catch (e) {
      console.warn('Ad error:', e);
      setHintAdMessage('Sponsor video could not be loaded right now.');
    } finally {
      setIsUnlockingHint(false);
    }
  };

  // Evaluate validation criteria live
  const validation = level.validate(simulation, components, wires);

  // Handle Level Victory trigger
  useEffect(() => {
    if (validation.completed && !hasTriggeredVictory) {
      setHasTriggeredVictory(true);
      setShowVictoryModal(true);
      soundFX.playVictory();
      NativeBridge.haptic('heavy');

      // Warm interstitial just-in-time for Level 1 -> Level 2 transition
      if (currentLevelIndex === 0 && !isPro && hasNextLevel) {
        adService.warmInterstitial('challenge_victory').catch(() => {});
      }

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
  }, [validation.completed, hasTriggeredVictory, currentLevelIndex, isPro, hasNextLevel]);

  // Reset victory flag when level changes
  useEffect(() => {
    setHasTriggeredVictory(false);
    setShowVictoryModal(false);
    setShowHints(false);
    setHintIndex(0);
  }, [level.id]);

  const satisfiedCount = validation.details.filter((d) => d.satisfied).length;
  const totalCount = Math.max(1, validation.details.length);
  const progressPct = validation.completed ? 100 : Math.round((satisfiedCount / totalCount) * 100);
  const earnedStars = validation.completed ? 3 : satisfiedCount >= totalCount - 1 && satisfiedCount > 0 ? 2 : satisfiedCount > 0 ? 1 : 0;

  return (
    <>
      {/* Top Gamified Level Header + 3-Star Progress Bar (Image 3 Style) */}
      <div className="fixed top-14 left-0 right-0 z-20 px-3 py-2 bg-[#0b111e]/94 backdrop-blur-xl border-b border-white/10 font-sans space-y-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.55)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Level Title & Mission */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/35 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-white text-xs sm:text-sm leading-tight truncate">
                  Level {currentLevelIndex + 1} · {level.title}
                </h2>
                <span className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {level.difficulty}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">{level.targetGoal}</p>
            </div>
          </div>

          {/* Energy Pill + Objectives Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                soundFX.playClick();
                setObjectivesOpen((o) => !o);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#131c31] border border-white/10 hover:border-sky-400/50 text-sky-300 font-mono font-bold text-[10px] transition active:scale-95"
              title="Toggle Level Objectives"
            >
              <span>{satisfiedCount}/{totalCount}</span>
              {objectivesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono font-black text-[11px]">
              <span>⚡ {120 + currentLevelIndex * 50}</span>
            </div>
          </div>
        </div>

        {/* Glowing Emerald 3-Star Progress Bar (Image 3 Signature) */}
        <div className="max-w-2xl mx-auto relative flex items-center h-4">
          <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden shadow-inner">
            <div
              style={{ width: `${Math.max(8, progressPct)}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-300 shadow-[0_0_12px_rgba(34,197,94,0.8)] transition-all duration-300"
            />
          </div>
          {/* 3 Golden Stars centered over bar */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 pointer-events-none">
            {[1, 2, 3].map((starIdx) => {
              const lit = earnedStars >= starIdx;
              return (
                <Star
                  key={starIdx}
                  className={`w-4 h-4 transition-all duration-300 ${
                    lit
                      ? 'text-amber-300 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)]'
                      : 'text-slate-600 fill-slate-900'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapsible Compact Objectives Card (Never overlaps right-side tool rail on 390px!) */}
      {objectivesOpen && (
        <div className="fixed top-[128px] left-3 z-20 w-[250px] sm:w-[272px] bg-[#0b111e]/92 backdrop-blur-xl border border-white/12 rounded-2xl p-2.5 shadow-2xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-1">
            <span className="font-extrabold text-white text-[10px] uppercase tracking-wider">Objectives</span>
            <button
              onClick={() => setObjectivesOpen(false)}
              className="text-[10px] font-mono text-sky-400 hover:text-white"
            >
              Hide
            </button>
          </div>

          <div className="space-y-1">
            {validation.details.map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                {item.satisfied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <span className={item.satisfied ? 'text-emerald-300 line-through' : 'text-slate-200'}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`p-1.5 rounded-xl text-[10px] font-mono leading-tight border ${
              validation.completed
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-[#060a14] border-white/5 text-slate-400'
            }`}
          >
            {validation.progressMessage}
          </div>
        </div>
      )}

      {/* Bottom Level Controls Bar — Image 3 Style (Reset | Hint [3] | Next Level >) */}
      <div
        style={{ bottom: 'calc(var(--ad-banner-height, 0px) + 94px)' }}
        className="fixed left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-md flex items-center gap-2 bg-[#0b111e]/94 backdrop-blur-2xl border border-white/12 p-2 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.8)] transition-[bottom] duration-200"
      >
        <button
          onClick={() => {
            soundFX.playClick();
            NativeBridge.haptic('light');
            onResetLevel();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#131c31] border border-white/10 hover:border-white/25 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            NativeBridge.haptic('light');
            setHintAdMessage(null);
            setShowHints((prev) => !prev);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#131c31] border border-amber-400/35 hover:bg-amber-500/15 text-amber-200 text-xs font-bold transition active:scale-95 whitespace-nowrap"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Hint</span>
          <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] flex items-center justify-center font-black shrink-0">
            {level.hints.length}
          </span>
        </button>

        {hasNextLevel && (
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('medium');
              if (currentLevelIndex >= 1 && !isPro) {
                if (onOpenProModal) {
                  onOpenProModal();
                }
              } else {
                if (currentLevelIndex === 0 && !isPro) {
                  adService.triggerNaturalBreakInterstitial('challenge_level_0_bottom_bar').catch(() => {});
                }
                onNextLevel();
              }
            }}
            className={`flex-[1.35] flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-black transition active:scale-95 shadow-lg whitespace-nowrap ${
              currentLevelIndex >= 1 && !isPro
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 text-slate-950 shadow-amber-500/30'
                : validation.completed
                ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.55)] ring-2 ring-emerald-300'
                : 'bg-gradient-to-r from-emerald-600/80 to-green-600/80 hover:from-emerald-500 hover:to-green-500 text-white border border-emerald-400/40'
            }`}
          >
            {currentLevelIndex >= 1 && !isPro ? (
              <>
                <Crown className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                <span>Next (PRO)</span>
              </>
            ) : (
              <>
                <span>Next Level</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
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
                {hintIndex === 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Free
                  </span>
                )}
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {hintIndex + 1} / {level.hints.length}
              </span>
            </div>

            {hintIndex === 0 || isPro || unlockedHints.has(`${level.id}_${hintIndex}`) ? (
              <p className="text-xs text-slate-200 leading-relaxed bg-amber-950/30 p-3 rounded-2xl border border-amber-500/20">
                {level.hints[hintIndex]}
              </p>
            ) : (
              <div className="bg-amber-950/40 p-3.5 rounded-2xl border border-amber-500/30 text-center space-y-2.5">
                <div className="w-8 h-8 mx-auto rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Advanced Clue #{hintIndex + 1} Locked</div>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Watch a short sponsor video to reveal this circuit clue.
                  </p>
                </div>
                <button
                  onClick={() => handleWatchAdForHint(hintIndex)}
                  disabled={isUnlockingHint}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUnlockingHint ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading Sponsor Video...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Watch Video to Unlock Clue</span>
                    </>
                  )}
                </button>
                {hintAdMessage && (
                  <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-2.5 py-1.5">
                    {hintAdMessage}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={hintIndex === 0}
                onClick={() => {
                  setHintAdMessage(null);
                  setHintIndex((prev) => Math.max(0, prev - 1));
                }}
                className="px-3 py-1 rounded-xl bg-slate-900 text-xs font-bold text-slate-300 disabled:opacity-30"
              >
                Previous
              </button>

              <button
                onClick={() => {
                  setHintAdMessage(null);
                  setShowHints(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Got It
              </button>

              <button
                disabled={hintIndex === level.hints.length - 1}
                onClick={() => {
                  setHintAdMessage(null);
                  setHintIndex((prev) => Math.min(level.hints.length - 1, prev + 1));
                }}
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

            {/* 1-Click Rate on Google Play ribbon if not rated yet */}
            {onPromptRating && !ratingService.hasCompletedRating() && (
              <button
                onClick={() => {
                  soundFX.playClick();
                  NativeBridge.haptic('light');
                  setShowVictoryModal(false);
                  onPromptRating();
                }}
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition mx-auto hover:scale-105 active:scale-95"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Enjoying ElectroLab? Rate us ⭐</span>
              </button>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {hasNextLevel ? (
                currentLevelIndex >= 1 && !isPro ? (
                  <button
                    onClick={() => {
                      setShowVictoryModal(false);
                      if (onOpenProModal) onOpenProModal();
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 fill-slate-950" />
                    <span>Unlock Level 3 & All Advanced ICs (PRO)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowVictoryModal(false);
                      if (!isPro) {
                        adService.triggerNaturalBreakInterstitial('challenge_level_0_victory').catch(() => {});
                      }
                      if (onPromptRating && ratingService.shouldPrompt('challenge_win')) {
                        setTimeout(() => onPromptRating(), 500);
                      }
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
