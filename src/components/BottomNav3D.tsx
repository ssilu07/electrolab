import React from 'react';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { useI18n } from '../services/i18nService';
import {
  Zap,
  Activity,
  Rotate3d,
  Trophy,
  Flame,
} from 'lucide-react';

export type MainNavScreen = 'circuit' | 'instruments' | '3d' | 'challenges' | 'real_lab' | 'presets';

export interface BottomNav3DProps {
  activeScreen: MainNavScreen;
  onSelectScreen: (screen: MainNavScreen) => void;
  isRealLabActive?: boolean;
}

interface NavItemConfig {
  id: MainNavScreen;
  label: string;
  icon: React.FC<{ className?: string }>;
  isHot?: boolean;
}

export const BottomNav3D: React.FC<BottomNav3DProps> = ({
  activeScreen,
  onSelectScreen,
  isRealLabActive = false,
}) => {
  const { t } = useI18n();

  const items: NavItemConfig[] = [
    { id: 'circuit', label: t.navCircuit, icon: Zap },
    { id: 'instruments', label: t.navInstruments, icon: Activity },
    { id: '3d', label: t.nav3dLab, icon: Rotate3d },
    { id: 'challenges', label: t.navPuzzles, icon: Trophy },
    { id: 'real_lab', label: t.navRealLab, icon: Flame, isHot: true },
  ];

  const handleTabClick = (id: MainNavScreen) => {
    soundFX.playClick(id === 'real_lab' ? 1.4 : 1.0);
    NativeBridge.haptic('medium');
    onSelectScreen(id);
  };

  return (
    <nav
      style={{ bottom: 'calc(var(--ad-banner-height, 0px) + 10px)' }}
      className="fixed left-1/2 -translate-x-1/2 z-40 max-w-[98vw] pointer-events-auto select-none font-sans transition-[bottom] duration-200"
    >
      {/* 3D Floating Glassmorphic Dock Container */}
      <div className="relative p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0b101d]/98 to-[#04060d]/98 backdrop-blur-2xl border-t border-white/25 border-x border-white/10 border-b border-black/90 shadow-[0_16px_45px_rgba(0,0,0,0.85),0_6px_18px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_-2px_4px_rgba(0,0,0,0.85)] flex items-center justify-center gap-1 sm:gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isItemActive = activeScreen === item.id || (item.id === 'real_lab' && isRealLabActive);
          const isRealLab = item.id === 'real_lab';

          return (
            <button
              key={item.id}
              data-tutorial-target={`${item.id}-tab`}
              onClick={() => handleTabClick(item.id)}
              className={`relative group px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 outline-none active:scale-95 active:translate-y-0.5 ${
                isItemActive
                  ? isRealLab
                    ? 'bg-gradient-to-b from-amber-500/30 via-orange-600/20 to-red-950/40 border-t border-amber-300/80 border-x border-amber-500/35 border-b border-amber-900/80 shadow-[0_4px_20px_rgba(245,158,11,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] text-amber-300 font-extrabold -translate-y-0.5'
                    : 'bg-gradient-to-b from-cyan-500/25 via-sky-600/15 to-blue-900/35 border-t border-cyan-300/70 border-x border-cyan-500/30 border-b border-cyan-900/70 shadow-[0_4px_16px_rgba(6,182,212,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] text-cyan-300 font-extrabold -translate-y-0.5'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05] hover:-translate-y-0.5 border border-transparent'
              }`}
            >
              {/* Hot / Viral Animated Badge for Real Lab */}
              {item.isHot && (
                <span className="absolute -top-2 -right-1 px-1.5 py-0.2 text-[8px] font-black rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/50 animate-pulse tracking-wider leading-tight">
                  {t.hotBadge}
                </span>
              )}

              {/* 3D Icon Container */}
              <div
                className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition duration-200 ${
                  isItemActive
                    ? isRealLab
                      ? 'bg-amber-500/20 text-amber-300 shadow-inner ring-1 ring-amber-400/40'
                      : 'bg-cyan-500/20 text-cyan-300 shadow-inner ring-1 ring-cyan-400/40'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isItemActive
                      ? isRealLab
                        ? 'fill-amber-400/20 stroke-[2.2]'
                        : 'stroke-[2.2]'
                      : 'stroke-[1.8]'
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-xs tracking-wide leading-tight transition duration-200 ${
                  isItemActive
                    ? 'font-bold'
                    : 'font-medium group-hover:font-semibold'
                }`}
              >
                {item.label}
              </span>

              {/* Active 3D Micro-Glow Dot */}
              {isItemActive && (
                <div
                  className={`w-1.5 h-0.5 rounded-full mt-0.5 ${
                    isRealLab
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
