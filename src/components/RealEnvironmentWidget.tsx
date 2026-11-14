import React, { useState } from 'react';
import { RealExperiment, getLocalizedExperiment } from '../data/realExperiments';
import { CircuitComponent } from '../types/circuit';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { useI18n } from '../services/i18nService';
import { RealWorldCutawayView } from './RealWorldCutawayView';
import { RealWorldStoryModal } from './RealWorldStoryModal';
import {
  Sun,
  Moon,
  Droplets,
  AlertTriangle,
  Fingerprint,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Volume2,
  Zap,
  Layers,
  Maximize2,
} from 'lucide-react';

interface RealEnvironmentWidgetProps {
  experiment: RealExperiment;
  components: CircuitComponent[];
  onUpdateComponentProperty: (compId: string, updates: Partial<CircuitComponent['properties']>) => void;
  onClose: () => void;
}

export const RealEnvironmentWidget: React.FC<RealEnvironmentWidgetProps> = ({
  experiment,
  components: _components,
  onUpdateComponentProperty,
  onClose,
}) => {
  const { lang, t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(() => {
    if (experiment.id === 'auto-street-light') return 0.15; // Night by default
    if (experiment.id === 'water-tank-alarm') return 0.1; // 10% water by default
    return 0.5;
  });
  const [touchActive, setTouchActive] = useState(false);

  const loc = getLocalizedExperiment(experiment, lang);

  const isWaterTank = experiment.id === 'water-tank-alarm' || experiment.environmentType === 'water_level';
  const isStreetLight = experiment.id === 'auto-street-light' || experiment.environmentType === 'day_night';

  // Handle Day / Night LDR Slider
  const handleDayNightChange = (val: number) => {
    setSliderValue(val);
    NativeBridge.haptic('light');
    if (experiment.targetComponentId) {
      onUpdateComponentProperty(experiment.targetComponentId, {
        sliderValue: val,
        resistance: Math.round(100 + (1 - val) * 99900), // 100Ω in full sun, 100kΩ in full darkness
      });
    }
  };

  // Handle Water Level Slider
  const handleWaterLevelChange = (val: number) => {
    setSliderValue(val);
    NativeBridge.haptic('light');
    const isFull = val >= 0.75;
    if (experiment.targetComponentId) {
      onUpdateComponentProperty(experiment.targetComponentId, {
        closed: isFull,
      });
    }
  };

  // Handle Laser Tripwire Toggle / Trigger
  const handleTriggerTripwire = () => {
    soundFX.playClick(1.5);
    NativeBridge.haptic('warning');
    if (experiment.targetComponentId) {
      // Momentarily press trigger button to trip latching relay
      onUpdateComponentProperty(experiment.targetComponentId, { closed: true });
      setTimeout(() => {
        onUpdateComponentProperty(experiment.targetComponentId!, { closed: false });
      }, 350);
    }
  };

  // Handle Touch Sensor Pad
  const handleTouchStart = () => {
    setTouchActive(true);
    soundFX.playClick(2.0);
    NativeBridge.haptic('medium');
    if (experiment.targetComponentId) {
      onUpdateComponentProperty(experiment.targetComponentId, { closed: true });
    }
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
    NativeBridge.haptic('light');
    if (experiment.targetComponentId) {
      onUpdateComponentProperty(experiment.targetComponentId, { closed: false });
    }
  };

  return (
    <>
      <div className="fixed top-16 left-2.5 right-14 sm:right-auto sm:left-6 z-30 sm:w-88 md:w-96 max-h-[72vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar font-sans transition-all duration-300 pointer-events-auto">
        <div className="bg-slate-950/95 backdrop-blur-2xl border-t border-cyan-400/40 border-x border-cyan-500/25 border-b border-black/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(0,229,255,0.18)] space-y-2.5 sm:space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/30">
                <Sparkles className="w-4 h-4 fill-slate-950" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold block leading-none">
                  {t.envTestTitle}
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight mt-0.5 truncate max-w-[155px] sm:max-w-[210px]">
                  {loc.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowStoryModal(true)}
                className="p-1 text-cyan-400 hover:text-cyan-200 rounded-lg transition"
                title="Open 3-Step Visual Story & Cutaway"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title={isCollapsed ? 'Expand Widget' : 'Collapse Widget'}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition"
                title="Close Environment Control"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Pill Buttons (Story Flow + Cutaway) */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => {
                soundFX.playClick(1.2);
                setShowStoryModal(true);
              }}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-cyan-500/15 hover:from-cyan-500/35 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-cyan-500/15"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{t.storyFlowBtn}</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick(1.2);
                setShowStoryModal(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Full 3D Cutaway"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>3D</span>
            </button>
          </div>

          {!isCollapsed && (
            <div className="pt-1 border-t border-white/10 space-y-2.5">
              {/* Embedded Live Visual Cutaway for ALL 9 EXPERIMENTS */}
              <RealWorldCutawayView
                experiment={experiment}
                sliderValue={sliderValue}
                onSliderChange={(val) => {
                  setSliderValue(val);
                  if (isWaterTank) handleWaterLevelChange(val);
                  else if (isStreetLight) handleDayNightChange(val);
                }}
                compact={true}
                components={_components}
                onUpdateComponentProperty={onUpdateComponentProperty}
              />

              {/* General Info / Real-Life Cost Badge */}
              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 border-t border-white/5">
                <span className="text-amber-400/80">{t.diyCost}: {loc.cost}</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>{t.liveAudioSync}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Real-World Story & Cutaway Modal */}
      {showStoryModal && (
        <RealWorldStoryModal
          experiment={experiment}
          sliderValue={sliderValue}
          onSliderChange={
            isWaterTank ? handleWaterLevelChange : handleDayNightChange
          }
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </>
  );
};
