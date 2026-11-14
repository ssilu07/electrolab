import React, { useState } from 'react';
import { REAL_EXPERIMENTS, RealExperiment, RealExperimentCategory, getLocalizedExperiment } from '../data/realExperiments';
import { soundFX } from '../audio/SoundFX';
import { adService } from '../services/adService';
import { NativeBridge } from '../utils/nativeBridge';
import { useI18n } from '../services/i18nService';
import {
  Flame,
  Home,
  Sparkles,
  ShieldAlert,
  Smartphone,
  Layers,
  X,
  Play,
  Rotate3d,
  Search,
  Tag,
} from 'lucide-react';

interface RealLabModalProps {
  onSelectExperiment: (experiment: RealExperiment, mode?: 'workbench' | '3d') => void;
  onClose: () => void;
  isPro?: boolean;
}

export const RealLabModal: React.FC<RealLabModalProps> = ({
  onSelectExperiment,
  onClose,
  isPro: _isPro,
}) => {
  const { lang, t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<RealExperimentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryTabs: { id: RealExperimentCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: t.catAll, icon: Layers },
    { id: 'home', label: t.catHome, icon: Home },
    { id: 'festive', label: t.catFestive, icon: Sparkles },
    { id: 'security', label: t.catSecurity, icon: ShieldAlert },
    { id: 'gadgets', label: t.catGadgets, icon: Smartphone },
  ];

  const filteredExperiments = REAL_EXPERIMENTS.filter((exp) => {
    const matchesCategory = activeCategory === 'all' || exp.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.nameHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.viralHook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.componentsList.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.componentsListHi.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleLaunch = (exp: RealExperiment, mode: 'workbench' | '3d' = 'workbench') => {
    soundFX.playConnect();
    NativeBridge.haptic('medium');
    onSelectExperiment(exp, mode);
    adService.triggerNaturalBreakInterstitial('load_real_experiment').catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2.5 sm:p-5 animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden glass-modal rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] border-t border-amber-400/40 border-x border-amber-500/20 border-b border-black/90 flex flex-col gap-3 sm:gap-4 font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/10 shrink-0 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-xl text-white tracking-wide flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="truncate">{t.realLabTitle}</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black tracking-wider uppercase shrink-0">
                    {t.realLabBadge}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                {t.realLabSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5 shrink-0 min-w-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none min-w-0 w-full sm:w-auto">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFX.playClick(1.2);
                    NativeBridge.haptic('light');
                    setActiveCategory(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition duration-200 shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 focus:border-amber-400/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        {/* Experiments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto pr-1 flex-1 max-h-[60vh] scrollbar-thin scrollbar-thumb-amber-500/30">
          {filteredExperiments.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              {t.noExperimentsFound}
            </div>
          ) : (
            filteredExperiments.map((exp) => {
              const loc = getLocalizedExperiment(exp, lang);

              return (
                <div
                  key={exp.id}
                  className="bg-slate-900/70 hover:bg-slate-900/90 border border-white/10 hover:border-amber-400/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 shadow-lg hover:shadow-amber-500/10 group"
                >
                  <div className="space-y-2">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{loc.badge}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        {t.diyCost}: {loc.cost}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition leading-snug">
                        {loc.title}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {lang === 'hi' ? exp.name : `${exp.difficulty} Level • ${exp.componentsList.length} Parts`}
                      </span>
                    </div>

                    {/* Key Highlight Quote Box */}
                    <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200 italic flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>&ldquo;{loc.hook}&rdquo;</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {loc.desc}
                    </p>

                    {/* Components Required */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {loc.components.slice(0, 4).map((comp, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5"
                        >
                          {comp}
                        </span>
                      ))}
                      {loc.components.length > 4 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                          +{loc.components.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleLaunch(exp, 'workbench')}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t.runSimulation}</span>
                    </button>

                    <button
                      onClick={() => handleLaunch(exp, '3d')}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 border border-cyan-500/30 hover:border-cyan-400 transition"
                      title="Open in Interactive 3D Lab Workbench"
                    >
                      <Rotate3d className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">{t.viewIn3D}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
          <span>{filteredExperiments.length} {t.experimentsReady}</span>
          <span className="text-amber-400">{t.viralTagline}</span>
        </div>
      </div>
    </div>
  );
};
