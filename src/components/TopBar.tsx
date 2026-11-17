import React, { useState } from 'react';
import { ViewMode, GlassTheme } from '../types/circuit';
import { GLASS_THEMES } from '../theme/glassTheme';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { billingService } from '../services/billingService';
import { notificationService } from '../services/notificationService';
import { useI18n } from '../services/i18nService';
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
  Camera,
  X,
  Palette,
  FolderOpen,
  Settings,
  Crown,
  Star,
  Download,
  Bell,
  BellRing,
  Globe,
} from 'lucide-react';

export type MainNavScreen = 'circuit' | 'instruments' | '3d' | 'challenges' | 'real_lab' | 'presets';

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
  oscilloscopeOpen?: boolean;
  onToggleOscilloscope?: () => void;
  multimeterOpen?: boolean;
  onToggleMultimeter?: () => void;
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
  oscilloscopeOpen = false,
  onToggleOscilloscope,
  multimeterOpen: _multimeterOpen = false,
  onToggleMultimeter: _onToggleMultimeter,
  isPro = false,
  onOpenProModal,
  onRateApp,
  onCheckUpdates,
}) => {
  const { lang, setLanguage, t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => notificationService.isEnabled());
  const [testNotifSending, setTestNotifSending] = useState(false);

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    NativeBridge.haptic('light');
    await notificationService.setEnabled(next);
  };

  const handleTestNotification = async () => {
    setTestNotifSending(true);
    NativeBridge.haptic('medium');
    await notificationService.triggerTestNotification();
    setTimeout(() => setTestNotifSending(false), 3000);
  };

  const handleSimToggle = () => {
    soundFX.playClick();
    NativeBridge.haptic('light');
    onToggleSimulate();
  };

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
                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black font-mono ml-0.5 transition shadow-sm shadow-amber-500/30 flex items-center gap-0.5 animate-pulse"
                >
                  <Crown className="w-2.5 h-2.5 fill-slate-950" />
                  <span>PRO OFFER</span>
                </button>
              )}
            </h1>
            <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 tracking-wider block mt-0.5 uppercase hidden xs:block">
              Circuit Creator & Simulator
            </span>
          </div>
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
                <span className="tracking-wide">{t.simulating}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="tracking-wide">{t.simulate}</span>
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

          {/* Real-time Oscilloscope (DSO) Quick Toggle (Screenshot 2 / Visual Juice) */}
          {onToggleOscilloscope && activeScreen === 'circuit' && (
            <button
              onClick={() => {
                soundFX.playClick();
                NativeBridge.haptic('light');
                onToggleOscilloscope();
              }}
              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                oscilloscopeOpen
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/70 shadow-amber-500/20'
                  : 'glass-button text-slate-300 hover:text-white'
              }`}
              title="Toggle Live Oscilloscope (Key: O)"
            >
              <Activity className={`w-3.5 h-3.5 ${oscilloscopeOpen ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px] font-mono">DSO</span>
            </button>
          )}

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
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/30 border border-yellow-200 active:scale-95 animate-pulse'
            }`}
            title={isPro ? 'ElectroLab Pro Active' : billingService.isIndia ? 'Upgrade to ElectroLab Pro (70% OFF)' : 'Upgrade to ElectroLab Pro'}
          >
            <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-amber-400' : 'fill-slate-950 text-slate-950'}`} />
            <span>{isPro ? 'PRO' : billingService.isIndia ? 'PRO (₹99)' : 'PRO ($9.99)'}</span>
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
                <span>{t.labSettings}</span>
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App Language Selector (English Default / Hindi) */}
            <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.appLanguage}</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  {lang === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setLanguage('en');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    lang === 'en'
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  <span>🇬🇧 English</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('hi');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    lang === 'hi'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  <span>🇮🇳 हिन्दी</span>
                </button>
              </div>
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
                      {isPro ? 'ElectroLab PRO Active' : 'Upgrade to Pro'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isPro ? 'Zero Ads • All Features Unlocked' : 'Zero Ads • All Puzzles & Pro Tools'}
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
                  {isPro ? t.proDetails : t.getPro}
                </button>
              </div>
            </div>

            {/* Will It Blow (Realistic Overload Explosions) */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${willItBlow ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">{t.overloadPhysics}</span>
                  <span className="text-[10px] text-slate-400">{t.overloadDesc}</span>
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
                  <span className="text-xs font-bold text-white block">{t.audioFx}</span>
                  <span className="text-[10px] text-slate-400">{t.audioFxDesc}</span>
                </div>
              </div>
              <button
                onClick={onToggleMute}
                className={`w-10 h-5 rounded-full p-0.5 transition ${!isMuted ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${!isMuted ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Daily Smart Reminders (7:30 PM local device time) */}
            <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${notificationsEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">{t.dailyReminders}</span>
                    <span className="text-[10px] text-slate-400">{t.dailyRemindersDesc}</span>
                  </div>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  className={`w-10 h-5 rounded-full p-0.5 transition ${notificationsEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  title="Toggle Daily Reminders"
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {notificationsEnabled && (
                <button
                  onClick={handleTestNotification}
                  disabled={testNotifSending}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 border border-cyan-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  <BellRing className="w-3 h-3 text-cyan-400" />
                  <span>{testNotifSending ? t.testNotifSending : t.testNotif}</span>
                </button>
              )}
            </div>

            {/* Color Theme Selector */}
            <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.visualTheme}</span>
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
                <span>{t.clearBoard}</span>
              </button>

              <button
                onClick={() => {
                  onExportImage();
                  setSettingsOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-500/30 transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t.snapshot}</span>
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
                    <span>{t.ratePlay}</span>
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
                  <span className="text-[10px] text-cyan-300/80 font-mono">v1.0.7</span>
                </button>
              )}

              {/* Privacy Policy */}
              {onOpenPrivacy && (
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenPrivacy();
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  <span>{t.privacyPolicy}</span>
                  <span className="text-[9px] font-mono text-cyan-400">v1.0.7</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
