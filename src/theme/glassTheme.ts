import { GlassTheme } from '../types/circuit';

export interface ThemeConfig {
  id: GlassTheme;
  name: string;
  badge: string;
  accentColor: string; // hex
  accentGlow: string; // rgba
  bgTint: string;
  borderColor: string;
  borderHover: string;
  textColor: string;
  gradientText: string;
  cardBg: string;
  modalBg: string;
  tableGlassColor: number; // Three.js hex
  gridGlowColor: number; // Three.js hex
  ambientColor: number;
}

export const GLASS_THEMES: Record<GlassTheme, ThemeConfig> = {
  cyber: {
    id: 'cyber',
    name: 'Liquid Cyber Glass',
    badge: '💎 Cyber',
    accentColor: '#06b6d4',
    accentGlow: 'rgba(6, 182, 212, 0.4)',
    bgTint: 'rgba(8, 14, 28, 0.72)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderHover: 'rgba(6, 182, 212, 0.6)',
    textColor: 'text-cyan-400',
    gradientText: 'from-cyan-400 via-sky-300 to-blue-500',
    cardBg: 'bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
    modalBg: 'bg-slate-950/75 backdrop-blur-3xl border border-cyan-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)]',
    tableGlassColor: 0x0a1424,
    gridGlowColor: 0x06b6d4,
    ambientColor: 0x1e293b,
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Obsidian',
    badge: '🌌 Midnight',
    accentColor: '#c084fc',
    accentGlow: 'rgba(192, 132, 252, 0.4)',
    bgTint: 'rgba(18, 10, 32, 0.72)',
    borderColor: 'rgba(192, 132, 252, 0.25)',
    borderHover: 'rgba(192, 132, 252, 0.6)',
    textColor: 'text-purple-400',
    gradientText: 'from-purple-400 via-fuchsia-300 to-pink-500',
    cardBg: 'bg-purple-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
    modalBg: 'bg-purple-950/75 backdrop-blur-3xl border border-purple-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.15)]',
    tableGlassColor: 0x140a24,
    gridGlowColor: 0xa855f7,
    ambientColor: 0x2e1065,
  },
  emerald: {
    id: 'emerald',
    name: 'Matrix Emerald Glass',
    badge: '⚡ Matrix',
    accentColor: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    bgTint: 'rgba(6, 24, 18, 0.72)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderHover: 'rgba(16, 185, 129, 0.6)',
    textColor: 'text-emerald-400',
    gradientText: 'from-emerald-400 via-teal-300 to-cyan-500',
    cardBg: 'bg-emerald-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
    modalBg: 'bg-emerald-950/75 backdrop-blur-3xl border border-emerald-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)]',
    tableGlassColor: 0x061e16,
    gridGlowColor: 0x10b981,
    ambientColor: 0x064e3b,
  },
  amber: {
    id: 'amber',
    name: 'Solar Quartz Glass',
    badge: '🔥 Solar',
    accentColor: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    bgTint: 'rgba(28, 18, 8, 0.72)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderHover: 'rgba(245, 158, 11, 0.6)',
    textColor: 'text-amber-400',
    gradientText: 'from-amber-400 via-yellow-300 to-orange-500',
    cardBg: 'bg-amber-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
    modalBg: 'bg-amber-950/75 backdrop-blur-3xl border border-amber-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)]',
    tableGlassColor: 0x221508,
    gridGlowColor: 0xf59e0b,
    ambientColor: 0x451a03,
  },
};
