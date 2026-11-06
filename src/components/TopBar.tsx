import React, { useState } from 'react';
import { ViewMode, GlassTheme } from '../types/circuit';
import { GLASS_THEMES } from '../theme/glassTheme';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import {
  Play,
  Pause,
  Share2,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Activity,
  Trash2,
  BookOpen,
  Trophy,
  Camera,
  X,
  Rotate3d,
  Palette,
  FolderOpen,
  Settings,
  Zap,
  Crown,
  Star,
  Download,
} from 'lucide-react';

export type MainNavScreen = 'circuit' | 'instruments' | '3d' | 'challenges' | 'presets';

export interface TopBarProps {
  activeScreen: MainNavScreen;
  onSelectScreen: (screen: MainNavScreen) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  glassTheme: GlassTheme;
  onSelectGlassTheme: (theme: GlassTheme) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  gameMode: 'sandbox' | 'challenge';
  onSetGameMode: (mode: 'sandbox' | 'challenge') => void;
  currentLevelIndex: number;
  onSelectLevelIndex: (index: number) => void;
  willItBlow: boolean;
  onToggleWillItBlow: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPresets: () => void;
  onOpenShare: () => void;
  onExportImage: () => void;
  onClearBoard: () => void;
  onOpenPrivacy?: () => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
  onRateApp?: () => void;
  onCheckUpdates?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeScreen,
  onSelectScreen,
  glassTheme,
  onSelectGlassTheme,
  isSimulating,
  onToggleSimulate,
  willItBlow,
  onToggleWillItBlow,
  isMuted,
  onToggleMute,
  onOpenPresets,
  onOpenShare,
  onExportImage,
  onClearBoard,
  onOpenPrivacy,
  isPro = false,
  onOpenProModal,
  onRateApp,
  onCheckUpdates,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSimToggle = () => {
    soundFX.playClick();
    NativeBridge.haptic('light');
    onToggleSimulate();
  };

  const navTabs: { id: MainNavScreen; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'circuit', label: 'Circuit', icon: Zap },
    { id: 'instruments', label: 'Instruments', icon: Activity },
    { id: '3d', label: '3D Lab', icon: Rotate3d },
    { id: 'challenges', label: 'Puzzles', icon: Trophy },
    { id: 'presets', label: 'Examples', icon: BookOpen },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 px-3 md:px-5 flex items-center justify-between font-sans select-none shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        {/* Brand & Subtitle (Screenshot 1 & 2) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-xs sm:text-sm tracking-wider text-white flex items-center gap-1 leading-none">
              Electro<span className="text-cyan-400">Lab</span>
              {isPro ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 font-mono border border-amber-500/40 ml-0.5 flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  <span>PRO</span>
                </span>
              ) : (
                <button
                  onClick={onOpenProModal}
                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 ml-0.5 transition"
                >
                  FREE
                </button>
              )}
            </h1>
            <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 tracking-wider block mt-0.5 uppercase hidden xs:block">
              Circuit Creator & Simulator
            </span>
          </div>
        </div>

        {/* Center Mode Navigation Tabs (Screenshot 1, 2, 4) */}
        <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-2xl border border-white/10 shadow-inner">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.playClick();
                  NativeBridge.haptic('light');
                  if (tab.id === 'presets') {
                    onOpenPresets();
                  } else {
                    onSelectScreen(tab.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Prominent Green SIMULATE / RUN Button (Screenshot 1) */}
          <button
            onClick={handleSimToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition duration-200 active:scale-95 shadow-lg ${
              isSimulating
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 shadow-emerald-500/30 ring-1 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Toggle Live Simulation (Spacebar)"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="tracking-wide">Simulating</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="tracking-wide">Simulate</span>
              </>
            )}
          </button>

          {/* Quick Save / Presets */}
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              onOpenPresets();
            }}
            className="p-2 glass-button rounded-xl text-slate-300 hover:text-white transition"
            title="Load Presets & Examples"
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Quick Share / Export */}
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              onOpenShare();
            }}
            className="p-2 glass-button rounded-xl text-slate-300 hover:text-white transition hidden xs:flex"
            title="Share & Export Circuit"
          >
            <Share2 className="w-4 h-4 text-sky-400" />
          </button>

          {/* Pro Unlock Pill Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              if (onOpenProModal) onOpenProModal();
            }}
            className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
              isPro
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 hover:border-amber-400 active:scale-95 shadow-sm shadow-amber-500/10'
            }`}
            title={isPro ? 'ElectroLab Pro Active' : 'Upgrade to ElectroLab Pro'}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isPro ? 'PRO' : 'GET PRO'}</span>
          </button>

          {/* Settings / 3-dots Menu Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              setSettingsOpen(!settingsOpen);
            }}
            className="p-2 glass-button rounded-xl text-slate-300 hover:text-white transition"
            title="App Settings & Safety Controls"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Dropdown Drawer / Modal */}
      {settingsOpen && (
        <div
          onClick={() => setSettingsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-end p-4 pt-16 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-modal rounded-3xl p-4 shadow-2xl space-y-3 border border-cyan-500/30"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Lab Settings & Options</span>
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pro Status & Upgrade Card */}
            <div className={`p-3 rounded-2xl border transition ${
              isPro
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-gradient-to-r from-amber-950/40 to-yellow-950/30 border-amber-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl ${isPro ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isPro ? 'ElectroLab Lifetime PRO' : 'Upgrade to Pro'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isPro ? 'Verified via Google Play' : '₹600 One-Time • All Puzzles & Tools'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    if (onOpenProModal) onOpenProModal();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                    isPro
                      ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isPro ? 'Details' : 'Upgrade'}
                </button>
              </div>
            </div>

            {/* Will It Blow (Realistic Overload Explosions) */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${willItBlow ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">Overload Physics</span>
                  <span className="text-[10px] text-slate-400">Blow components if voltage/current exceeds limits</span>
                </div>
              </div>
              <button
                onClick={onToggleWillItBlow}
                className={`w-10 h-5 rounded-full p-0.5 transition ${willItBlow ? 'bg-orange-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${willItBlow ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Sound FX Audio Mute */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">Acoustic Audio FX</span>
                  <span className="text-[10px] text-slate-400">Relay clicks, buzzers, and switch sounds</span>
                </div>
              </div>
              <button
                onClick={onToggleMute}
                className={`w-10 h-5 rounded-full p-0.5 transition ${!isMuted ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${!isMuted ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Color Theme Selector */}
            <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visual Theme</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(GLASS_THEMES).map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      onSelectGlassTheme(th.id);
                      NativeBridge.haptic('light');
                    }}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      glassTheme === th.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60'
                        : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    <span>{th.name.split(' ')[0]}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.accentColor }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => {
                  onClearBoard();
                  setSettingsOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 border border-red-500/30 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Board</span>
              </button>

              <button
                onClick={() => {
                  onExportImage();
                  setSettingsOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-500/30 transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snapshot</span>
              </button>
            </div>

            {/* Google Play Store Direct Connect Actions */}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
              {onRateApp && (
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onRateApp();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 transition active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                    <span>Rate on Google Play</span>
                  </div>
                  <span className="text-[10px] text-emerald-300/80 font-mono">5★</span>
                </button>
              )}

              {onCheckUpdates && (
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onCheckUpdates();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 transition active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    <span>Check Play Store Updates</span>
                  </div>
                  <span className="text-[10px] text-cyan-300/80 font-mono">v1.0.2</span>
                </button>
              )}
            </div>

            {/* Privacy Policy Link */}
            {onOpenPrivacy && (
              <button
                onClick={() => {
                  onOpenPrivacy();
                  setSettingsOpen(false);
                }}
                className="w-full text-center text-[11px] font-mono text-slate-400 hover:text-cyan-400 pt-1"
              >
                Privacy Policy & License &bull; com.royals.electolab
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
