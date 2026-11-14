import React, { useState, useEffect, useRef } from 'react';
import { RealExperiment, getLocalizedExperiment } from '../data/realExperiments';
import { CircuitComponent } from '../types/circuit';
import { useI18n } from '../services/i18nService';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import confetti from 'canvas-confetti';
import {
  Droplets,
  Volume2,
  Sparkles,
  Zap,
  Activity,
  Sun,
  Moon,
  AlertTriangle,
  RotateCw,
  Power,
  Waves,
  Siren,
  ShieldAlert,
  Footprints,
  Lock,
  Unlock,
  Smartphone,
  BatteryCharging,
  Flame,
  Fingerprint,
  Lightbulb,
} from 'lucide-react';

interface RealWorldCutawayViewProps {
  experiment: RealExperiment;
  sliderValue: number;
  onSliderChange: (val: number) => void;
  compact?: boolean;
  components?: CircuitComponent[];
  onUpdateComponentProperty?: (compId: string, updates: Partial<CircuitComponent['properties']>) => void;
}

export const RealWorldCutawayView: React.FC<RealWorldCutawayViewProps> = ({
  experiment,
  sliderValue,
  onSliderChange,
  compact = false,
  components = [],
  onUpdateComponentProperty,
}) => {
  const { lang, t } = useI18n();
  const loc = getLocalizedExperiment(experiment, lang);

  // --------------------------------------------------------------------------
  // 1. Water Tank States
  // --------------------------------------------------------------------------
  const [isMotorRunning, setIsMotorRunning] = useState(false);
  const [bubbleOffset, setBubbleOffset] = useState(0);
  const motorIntervalRef = useRef<number | null>(null);
  const sliderValueRef = useRef(sliderValue);
  sliderValueRef.current = sliderValue;

  const isWaterTank = experiment.id === 'water-tank-alarm' || experiment.environmentType === 'water_level';
  const isStreetLight = experiment.id === 'auto-street-light' || experiment.environmentType === 'day_night';
  const isStaircase = experiment.id === 'staircase-switch';
  const isDiwali = experiment.id === 'diwali-chaser';
  const isPolice = experiment.id === 'police-siren';
  const isLaser = experiment.id === 'laser-burglar-alarm' || experiment.environmentType === 'laser_beam';
  const isFirefly = experiment.id === 'firefly-breathing-led';
  const isCarCharger = experiment.id === 'car-mobile-charger';
  const isTouchSwitch = experiment.id === 'touch-switch';

  // EXACT Thresholds
  const isOverflow = isWaterTank && sliderValue >= 0.75;
  const isNight = isStreetLight && sliderValue <= 0.35;

  // Handle Water Tank Motor Loop
  useEffect(() => {
    if (isMotorRunning && isWaterTank) {
      motorIntervalRef.current = window.setInterval(() => {
        const current = sliderValueRef.current;
        if (current >= 1.0) {
          return;
        }
        const nextVal = Math.min(1.0, current + 0.015);
        onSliderChange(parseFloat(nextVal.toFixed(3)));
        soundFX.playDialTick();
      }, 120);
    } else {
      if (motorIntervalRef.current) {
        clearInterval(motorIntervalRef.current);
        motorIntervalRef.current = null;
      }
    }

    return () => {
      if (motorIntervalRef.current) {
        clearInterval(motorIntervalRef.current);
        motorIntervalRef.current = null;
      }
    };
  }, [isMotorRunning, isWaterTank, onSliderChange]);

  // Micro animation loop for water ripples
  useEffect(() => {
    const timer = setInterval(() => {
      setBubbleOffset((prev) => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const toggleMotor = () => {
    if (!isMotorRunning) {
      soundFX.playClick(1.2);
      NativeBridge.haptic('medium');
      setIsMotorRunning(true);
    } else {
      soundFX.playClick(0.8);
      NativeBridge.haptic('light');
      setIsMotorRunning(false);
    }
  };

  const handleDrain = () => {
    soundFX.playClick(0.9);
    NativeBridge.haptic('light');
    setIsMotorRunning(false);
    onSliderChange(0.1);
  };

  // --------------------------------------------------------------------------
  // 2. Staircase 2-Way Wiring States
  // --------------------------------------------------------------------------
  const [swDownState, setSwDownState] = useState(true);
  const [swUpState, setSwUpState] = useState(true);
  const [walkerStep, setWalkerStep] = useState<number>(1); // 0: ground, 1: middle, 2: top

  // In 2-way wiring, light is ON when both switches connect to same traveler wire
  const isStaircaseLit = swDownState === swUpState;

  const toggleDownstairs = () => {
    soundFX.playClick(1.1);
    NativeBridge.haptic('medium');
    const next = !swDownState;
    setSwDownState(next);
    setWalkerStep((prev) => (prev === 0 ? 1 : 0));
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('sw_downstairs', { closed: next });
    }
  };

  const toggleUpstairs = () => {
    soundFX.playClick(1.3);
    NativeBridge.haptic('medium');
    const next = !swUpState;
    setSwUpState(next);
    setWalkerStep((prev) => (prev === 2 ? 1 : 2));
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('sw_upstairs', { closed: next });
    }
  };

  // --------------------------------------------------------------------------
  // 3. Diwali Running LED Chaser States
  // --------------------------------------------------------------------------
  const [chaserIndex, setChaserIndex] = useState(0);
  const [chaserSpeedMs, setChaserSpeedMs] = useState(140);
  const chaserBulbs = [
    { color: '#ef4444', label: 'Crimson' },
    { color: '#f59e0b', label: 'Gold' },
    { color: '#10b981', label: 'Emerald' },
    { color: '#3b82f6', label: 'Cobalt' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#8b5cf6', label: 'Purple' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#fbbf24', label: 'Amber' },
  ];

  useEffect(() => {
    if (!isDiwali) return;
    const interval = setInterval(() => {
      setChaserIndex((prev) => (prev + 1) % chaserBulbs.length);
    }, chaserSpeedMs);
    return () => clearInterval(interval);
  }, [isDiwali, chaserSpeedMs, chaserBulbs.length]);

  const handleBurstSparkles = () => {
    soundFX.playVictory();
    NativeBridge.haptic('heavy');
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#ef4444', '#10b981', '#38bdf8', '#fbbf24'],
    });
  };

  // --------------------------------------------------------------------------
  // 4. Police Siren & Strobe States
  // --------------------------------------------------------------------------
  const [isPoliceActive, setIsPoliceActive] = useState(true);
  const [policeStrobePhase, setPoliceStrobePhase] = useState<'red' | 'blue'>('red');

  useEffect(() => {
    if (!isPolice || !isPoliceActive) return;
    const interval = setInterval(() => {
      setPoliceStrobePhase((prev) => (prev === 'red' ? 'blue' : 'red'));
    }, 120);
    return () => clearInterval(interval);
  }, [isPolice, isPoliceActive]);

  const togglePolice = () => {
    soundFX.playClick(1.4);
    NativeBridge.haptic('warning');
    setIsPoliceActive((prev) => !prev);
  };

  // --------------------------------------------------------------------------
  // 5. Laser Tripwire Burglar Alarm States
  // --------------------------------------------------------------------------
  const [isLaserLatched, setIsLaserLatched] = useState(false);
  const [isIntruderWalking, setIsIntruderWalking] = useState(false);

  const handleCutLaser = () => {
    soundFX.playClick(1.8);
    soundFX.playExplosion();
    NativeBridge.haptic('heavy');
    setIsIntruderWalking(true);
    setIsLaserLatched(true);
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('btn1', { closed: true });
      setTimeout(() => {
        onUpdateComponentProperty('btn1', { closed: false });
      }, 400);
    }
    setTimeout(() => {
      setIsIntruderWalking(false);
    }, 1200);
  };

  const handleResetLaser = () => {
    soundFX.playClick(0.9);
    NativeBridge.haptic('light');
    setIsLaserLatched(false);
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('btn1', { closed: false });
    }
  };

  // --------------------------------------------------------------------------
  // 6. Firefly Breathing LED States
  // --------------------------------------------------------------------------
  const [fireflyCharge, setFireflyCharge] = useState(0.85); // 0.0 to 1.0
  const [isFireflyCharging, setIsFireflyCharging] = useState(true);

  useEffect(() => {
    if (!isFirefly) return;
    const interval = setInterval(() => {
      if (isFireflyCharging) {
        // Fast recharge to 1.0
        setFireflyCharge((prev) => Math.min(1.0, prev + 0.08));
      } else {
        // RC exponential decay
        setFireflyCharge((prev) => Math.max(0.04, prev * 0.96));
      }
    }, 80);
    return () => clearInterval(interval);
  }, [isFirefly, isFireflyCharging]);

  const toggleFireflyCharge = () => {
    soundFX.playClick(isFireflyCharging ? 0.8 : 1.2);
    NativeBridge.haptic('light');
    const next = !isFireflyCharging;
    setIsFireflyCharging(next);
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('sw1', { closed: next });
    }
  };

  // --------------------------------------------------------------------------
  // 7. Car 12V to 5V USB Charger States
  // --------------------------------------------------------------------------
  const [chargerVolts, setChargerVolts] = useState(5.0);
  const [phoneBatteryPct, setPhoneBatteryPct] = useState(74);

  useEffect(() => {
    if (!isCarCharger) return;
    const interval = setInterval(() => {
      if (Math.abs(chargerVolts - 5.0) < 0.4) {
        setPhoneBatteryPct((prev) => (prev >= 100 ? 60 : prev + 1));
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [isCarCharger, chargerVolts]);

  const isChargerSafe = chargerVolts >= 4.75 && chargerVolts <= 5.25;

  // --------------------------------------------------------------------------
  // 8. Touch Sensitive Magic Switch States
  // --------------------------------------------------------------------------
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [isTouchLatched, setIsTouchLatched] = useState(false);

  const isTouchGlowing = isTouchActive || isTouchLatched;

  const handleTouchPressStart = () => {
    soundFX.playClick(1.9);
    NativeBridge.haptic('medium');
    setIsTouchActive(true);
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('touch_probe', { closed: true });
    }
  };

  const handleTouchPressEnd = () => {
    NativeBridge.haptic('light');
    setIsTouchActive(false);
    if (!isTouchLatched && onUpdateComponentProperty) {
      onUpdateComponentProperty('touch_probe', { closed: false });
    }
  };

  const toggleTouchLatch = () => {
    soundFX.playClick(1.5);
    NativeBridge.haptic('heavy');
    const next = !isTouchLatched;
    setIsTouchLatched(next);
    if (onUpdateComponentProperty) {
      onUpdateComponentProperty('touch_probe', { closed: next });
    }
  };

  return (
    <div className="space-y-3 font-sans select-none">
      {/* ==================================================================== */}
      {/* 1. WATER TANK ALARM CUTAWAY VIEW                                     */}
      {/* ==================================================================== */}
      {isWaterTank && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Droplets className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>{t.waterTankCutaway}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOverflow
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              Water: {Math.round(sliderValue * 100)}%
            </span>
          </div>

          <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30 p-3 overflow-hidden shadow-2xl">
            {/* 3rd Floor (Terrace) */}
            <div className="bg-slate-900/90 border border-white/10 rounded-xl p-2.5 mb-2 relative">
              <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                <span className="font-bold text-amber-300">
                  {lang === 'hi' ? 'तीसरी मंजिल छत · 12m' : '3rd Floor Terrace · 12m'}
                </span>
                <span className="text-slate-400">
                  {lang === 'hi' ? 'SINTEX · 1000L' : 'ROOF TANK · 1000L'}
                </span>
              </div>

              {/* Cylindrical Roof Tank */}
              <div className="relative w-full h-32 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-700 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
                {/* Yellow Lid */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-3.5 bg-amber-400 rounded-b-md border-b-2 border-amber-600 shadow flex items-center justify-center">
                  <span className="text-[8px] font-black text-slate-950 uppercase tracking-widest">
                    {lang === 'hi' ? 'SINTEX LID' : 'TANK LID'}
                  </span>
                </div>

                {/* Copper Probes */}
                <div className="absolute top-3 left-8 flex gap-4 z-20">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-16 bg-gradient-to-b from-amber-600 via-amber-400 to-amber-200 rounded-b shadow" />
                    <span className="text-[7px] font-mono font-bold text-amber-400 bg-black/60 px-1 rounded mt-0.5">+9V</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-16 bg-gradient-to-b from-amber-600 via-amber-400 to-amber-200 rounded-b shadow" />
                    <span className="text-[7px] font-mono font-bold text-cyan-400 bg-black/60 px-1 rounded mt-0.5">BASE</span>
                  </div>
                </div>

                {/* 75% Probe Line */}
                <div className="absolute bottom-[75%] left-0 right-0 border-b border-dashed border-rose-500/70 z-10 flex items-center justify-end pr-2">
                  <span className="text-[8px] font-mono font-bold text-rose-400 bg-slate-950/80 px-1 rounded">75% PROBE</span>
                </div>

                {/* Water Liquid Body */}
                <div
                  className="w-full bg-gradient-to-t from-cyan-600/90 via-sky-500/80 to-cyan-400/90 rounded-b-lg transition-all duration-300 relative overflow-hidden"
                  style={{ height: `${Math.round(sliderValue * 100)}%` }}
                >
                  <div
                    className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:10px_10px]"
                    style={{ backgroundPositionY: `${bubbleOffset}px` }}
                  />
                  {isOverflow && (
                    <div className="absolute top-0 inset-x-0 h-2 bg-white/70 animate-ping" />
                  )}
                </div>
              </div>
            </div>

            {/* 2nd Floor (Kitchen Buzzer) */}
            <div className={`border rounded-xl p-2 mb-2 transition-colors duration-300 ${
              isOverflow ? 'bg-rose-950/80 border-rose-500' : 'bg-slate-900/60 border-white/10'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Volume2 className={`w-3.5 h-3.5 ${isOverflow ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
                  <span>Kitchen Piezo Siren</span>
                </span>
                <span className={`font-bold ${isOverflow ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                  {isOverflow ? '🚨 108 dB LOUD ALARM!' : 'QUIET (SILENT)'}
                </span>
              </div>
            </div>

            {/* Ground Floor (0.5 HP Water Pump) */}
            <div className="bg-slate-900/90 border border-white/10 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isMotorRunning ? 'animate-spin' : ''}`} />
                  <span>{lang === 'hi' ? '0.5 HP पानी की मोटर' : '0.5 HP Water Pump'}</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  isMotorRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isMotorRunning ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleMotor}
                  className={`py-2 px-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition active:scale-95 shadow ${
                    isMotorRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isMotorRunning ? t.stopMotor : t.startMotor}</span>
                </button>
                <button
                  onClick={handleDrain}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1 transition active:scale-95 border border-white/10"
                >
                  <span>{t.drainTankBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. AUTOMATIC STREET LIGHT CUTAWAY VIEW                               */}
      {/* ==================================================================== */}
      {isStreetLight && (
        <div className="space-y-3">
          <div
            className="relative w-full h-56 rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between p-4 transition-colors duration-700 shadow-xl"
            style={{
              background: `linear-gradient(to bottom, ${
                isNight ? '#030712' : sliderValue < 0.65 ? '#1e293b' : '#38bdf8'
              }, ${isNight ? '#0b0f19' : '#0284c7'})`,
            }}
          >
            {/* Sky */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {isNight ? (
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.7)] text-slate-900">
                    <Moon className="w-5 h-5 fill-slate-900" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.9)] text-slate-950 animate-spin" style={{ animationDuration: '20s' }}>
                    <Sun className="w-5 h-5 fill-amber-500" />
                  </div>
                )}
                <div>
                  <h5 className="text-xs font-bold font-mono text-white">
                    {isNight
                      ? lang === 'hi'
                        ? 'आधी रात (अंधेरा)'
                        : 'Midnight Stars'
                      : lang === 'hi'
                      ? 'तेज़ धूप (दिन)'
                      : 'Full Daylight'}
                  </h5>
                  <p className="text-[10px] text-white/70 font-mono">
                    Lux: {Math.round(sliderValue * 1000)} lm/m²
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-xl p-2 text-[9px] font-mono space-y-1">
                <div className="text-amber-400 font-bold">LDR RESISTANCE</div>
                <div className="text-white">
                  {Math.round(100 + (1 - sliderValue) * 99900).toLocaleString()} Ω
                </div>
              </div>
            </div>

            {/* Lamp Pole */}
            <div className="relative flex items-end justify-center h-32">
              {isNight && (
                <div className="absolute bottom-2 w-48 h-28 bg-gradient-to-b from-amber-300/40 to-transparent blur-[2px] rounded-b-full pointer-events-none animate-pulse" />
              )}
              <div className="relative flex flex-col items-center">
                <div className="w-14 h-4 bg-slate-800 rounded-t-full border-t border-slate-600 relative flex justify-center">
                  <div className="w-2.5 h-1.5 bg-rose-500 rounded-t-full -top-1.5 absolute shadow-sm" title="LDR Sensor" />
                </div>
                <div className={`w-8 h-5 rounded-b-full transition-all duration-300 flex items-center justify-center ${
                  isNight
                    ? 'bg-amber-300 shadow-[0_0_35px_rgba(251,191,36,1)] scale-110'
                    : 'bg-slate-700/80'
                }`}>
                  <span className="text-[7px] font-bold text-slate-950">{isNight ? 'ON' : 'OFF'}</span>
                </div>
                <div className="w-2 h-20 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-700" />
                <div className="w-40 h-2 bg-slate-700 rounded-full border-t border-slate-500" />
              </div>
            </div>
          </div>

          {/* Slider */}
          <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Sun className="w-4 h-4" />
                <span>{t.dayNightSliderDesc}</span>
              </span>
              <span className="font-mono font-bold text-sm text-amber-300">
                {Math.round(sliderValue * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={sliderValue}
              onChange={(e) => {
                NativeBridge.haptic('light');
                onSliderChange(parseFloat(e.target.value));
              }}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 shadow-inner"
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. STAIRCASE 2-WAY SWITCH CUTAWAY VIEW                               */}
      {/* ==================================================================== */}
      {isStaircase && (
        <div className="space-y-3">
          <div className="relative w-full h-64 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 p-3 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Ceiling Pendant Lamp */}
            <div className="relative flex flex-col items-center z-20">
              <div className="w-0.5 h-6 bg-slate-500" />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isStaircaseLit
                  ? 'bg-amber-300 shadow-[0_0_40px_rgba(251,191,36,1)] scale-110'
                  : 'bg-slate-800 border border-slate-600'
              }`}>
                <Lightbulb className={`w-6 h-6 ${isStaircaseLit ? 'text-slate-950 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
              </div>
              {/* Volumetric Lamp Cone */}
              {isStaircaseLit && (
                <div className="absolute top-12 w-64 h-48 bg-gradient-to-b from-amber-300/35 via-amber-400/15 to-transparent blur-sm rounded-b-full pointer-events-none" />
              )}
            </div>

            {/* Multi-Floor Staircase Structure */}
            <div className="relative flex justify-between items-end h-36 px-2 z-10">
              {/* Ground Floor Landing & Switch */}
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleDownstairs}
                  className={`w-12 h-16 rounded-xl border-2 flex flex-col items-center justify-between p-1.5 transition active:scale-95 shadow-lg ${
                    swDownState ? 'bg-emerald-950/80 border-emerald-400' : 'bg-slate-900 border-slate-700'
                  }`}
                  title="Downstairs Switch"
                >
                  <span className="text-[7px] font-mono font-bold text-slate-300">DOWN</span>
                  <div className={`w-4 h-6 rounded bg-slate-200 flex items-center justify-center transition-transform ${
                    swDownState ? 'translate-y-1 bg-emerald-400' : '-translate-y-1'
                  }`}>
                    <Power className="w-3 h-3 text-slate-950" />
                  </div>
                  <span className="text-[7px] font-mono font-bold text-emerald-400">{swDownState ? 'POS A' : 'POS B'}</span>
                </button>
                <div className="w-16 h-3 bg-slate-700 rounded-t mt-1" />
                <span className="text-[8px] font-mono text-slate-400 mt-0.5">Ground Floor</span>
              </div>

              {/* Stepped Stairs in Center */}
              <div className="flex flex-col items-center justify-end h-28 space-y-1">
                {/* Walker figure */}
                <div
                  className="transition-all duration-500 text-cyan-400 flex flex-col items-center"
                  style={{ transform: `translateY(${walkerStep === 0 ? '16px' : walkerStep === 1 ? '0px' : '-16px'})` }}
                >
                  <Footprints className="w-5 h-5 text-cyan-300 animate-bounce" />
                  <span className="text-[7px] font-mono font-bold bg-slate-950/80 px-1 rounded text-cyan-300">WALKER</span>
                </div>
                {/* 4 Stair Steps */}
                <div className="w-24 flex flex-col items-end">
                  <div className="w-20 h-2.5 bg-gradient-to-r from-amber-700 to-amber-900 rounded-sm border-t border-amber-600 shadow" />
                  <div className="w-16 h-2.5 bg-gradient-to-r from-amber-700 to-amber-900 rounded-sm border-t border-amber-600 shadow" />
                  <div className="w-12 h-2.5 bg-gradient-to-r from-amber-700 to-amber-900 rounded-sm border-t border-amber-600 shadow" />
                  <div className="w-8 h-2.5 bg-gradient-to-r from-amber-700 to-amber-900 rounded-sm border-t border-amber-600 shadow" />
                </div>
              </div>

              {/* 1st Floor Landing & Switch */}
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleUpstairs}
                  className={`w-12 h-16 rounded-xl border-2 flex flex-col items-center justify-between p-1.5 transition active:scale-95 shadow-lg ${
                    swUpState ? 'bg-emerald-950/80 border-emerald-400' : 'bg-slate-900 border-slate-700'
                  }`}
                  title="Upstairs Switch"
                >
                  <span className="text-[7px] font-mono font-bold text-slate-300">UP</span>
                  <div className={`w-4 h-6 rounded bg-slate-200 flex items-center justify-center transition-transform ${
                    swUpState ? 'translate-y-1 bg-emerald-400' : '-translate-y-1'
                  }`}>
                    <Power className="w-3 h-3 text-slate-950" />
                  </div>
                  <span className="text-[7px] font-mono font-bold text-emerald-400">{swUpState ? 'POS A' : 'POS B'}</span>
                </button>
                <div className="w-16 h-3 bg-slate-700 rounded-t mt-1" />
                <span className="text-[8px] font-mono text-slate-400 mt-0.5">1st Floor</span>
              </div>
            </div>
          </div>

          {/* Interactive Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleDownstairs}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>⬇️ {t.flipDownstairs}</span>
            </button>
            <button
              onClick={toggleUpstairs}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>⬆️ {t.flipUpstairs}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. DIWALI RUNNING LED CHASER CUTAWAY VIEW                            */}
      {/* ==================================================================== */}
      {isDiwali && (
        <div className="space-y-3">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-indigo-950 via-slate-950 to-black border border-amber-500/30 p-3 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Festive Night Sky */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>{t.diwaliChaserTitle}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                NE555: {(1000 / chaserSpeedMs).toFixed(1)} Hz
              </span>
            </div>

            {/* Hanging Garland String of 8 Bulbs */}
            <div className="relative flex justify-center items-center py-4">
              <div className="absolute inset-x-2 top-1/2 h-1 border-b-2 border-dashed border-slate-600 rounded-full" />
              <div className="flex items-center justify-between w-full px-2 z-10">
                {chaserBulbs.map((bulb, idx) => {
                  const isActive = idx === chaserIndex;
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-1 h-3 bg-slate-600" />
                      <div
                        className={`w-6 h-8 rounded-full border transition-all duration-150 flex items-center justify-center ${
                          isActive
                            ? 'scale-125 shadow-[0_0_25px_currentColor]'
                            : 'opacity-35 scale-90 bg-slate-800 border-slate-700'
                        }`}
                        style={{
                          backgroundColor: isActive ? bulb.color : undefined,
                          borderColor: bulb.color,
                          color: bulb.color,
                        }}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-white animate-spin' : 'text-slate-500'}`} />
                      </div>
                      <span className="text-[7px] font-mono text-slate-400 mt-1">{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decorative Diyas along bottom ledge */}
            <div className="flex justify-around items-end pt-2 border-t border-amber-500/20">
              {[1, 2, 3, 4].map((d) => (
                <div key={d} className="flex flex-col items-center">
                  <div className="w-2 h-3 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
                  <div className="w-6 h-2 bg-amber-800 rounded-b-full border-t border-amber-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Speed & Sparkle Controls */}
          <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">{t.diwaliSpeed}:</span>
              <span className="text-white font-bold">{chaserSpeedMs} ms</span>
            </div>
            <input
              type="range"
              min="50"
              max="350"
              step="10"
              value={chaserSpeedMs}
              onChange={(e) => setChaserSpeedMs(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <button
              onClick={handleBurstSparkles}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-500/30"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{t.diwaliSparkle}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. POLICE SIREN & STROBE CUTAWAY VIEW                                */}
      {/* ==================================================================== */}
      {isPolice && (
        <div className="space-y-3">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-rose-500/30 p-4 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Siren className="w-4 h-4 animate-bounce" />
                <span>{t.policeLightbar}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isPoliceActive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-slate-800 text-slate-500'
              }`}>
                {isPoliceActive ? 'CODE 3 PURSUIT' : 'STANDBY'}
              </span>
            </div>

            {/* Cruiser Rooftop Lightbar */}
            <div className="relative flex items-center justify-between bg-slate-950 border-2 border-slate-700 rounded-2xl p-3 shadow-inner">
              {/* Left: Red Strobes */}
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => {
                  const isFlash = isPoliceActive && policeStrobePhase === 'red';
                  return (
                    <div
                      key={i}
                      className={`w-7 h-14 rounded-lg transition-all duration-75 flex items-center justify-center border ${
                        isFlash
                          ? 'bg-red-500 shadow-[0_0_35px_rgba(239,68,68,1)] border-red-300 scale-105'
                          : 'bg-red-950/40 border-red-900/50 opacity-40'
                      }`}
                    >
                      <span className="text-[7px] font-black text-white">RED</span>
                    </div>
                  );
                })}
              </div>

              {/* Center: Acoustic Dual Horn Speaker */}
              <div className="flex flex-col items-center px-2">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition ${
                  isPoliceActive ? 'border-amber-400 bg-amber-950/40 animate-pulse' : 'border-slate-700 bg-slate-900'
                }`}>
                  <Volume2 className={`w-6 h-6 ${isPoliceActive ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
                </div>
                <span className="text-[7px] font-mono font-bold text-slate-400 mt-1">115 dB HORN</span>
              </div>

              {/* Right: Blue Strobes */}
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => {
                  const isFlash = isPoliceActive && policeStrobePhase === 'blue';
                  return (
                    <div
                      key={i}
                      className={`w-7 h-14 rounded-lg transition-all duration-75 flex items-center justify-center border ${
                        isFlash
                          ? 'bg-blue-500 shadow-[0_0_35px_rgba(59,130,246,1)] border-blue-300 scale-105'
                          : 'bg-blue-950/40 border-blue-900/50 opacity-40'
                      }`}
                    >
                      <span className="text-[7px] font-black text-white">BLUE</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Road Beam Reflection */}
            <div className="h-4 rounded-full bg-gradient-to-r from-red-600/40 via-amber-500/20 to-blue-600/40 blur-sm" />
          </div>

          {/* Toggle Button */}
          <button
            onClick={togglePolice}
            className={`w-full py-2.5 px-3 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg ${
              isPoliceActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Siren className="w-4 h-4" />
            <span>{t.togglePoliceSiren}</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. LASER TRIPWIRE BURGLAR ALARM CUTAWAY VIEW                         */}
      {/* ==================================================================== */}
      {isLaser && (
        <div className="space-y-3">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-rose-500/30 p-3 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Corridor Header */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{t.laserCorridorTitle}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isLaserLatched ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isLaserLatched ? t.relayLatched : t.relayArmed}
              </span>
            </div>

            {/* Laser Corridor Scene */}
            <div className="relative flex items-center justify-between h-28 px-3 bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
              {/* Left: Laser Diode Emitter */}
              <div className="flex flex-col items-center z-20">
                <div className="w-6 h-10 bg-slate-800 rounded-l border border-slate-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping" />
                </div>
                <span className="text-[7px] font-mono text-slate-400 mt-1">LASER</span>
              </div>

              {/* Glowing Red Laser Beam spanning the corridor */}
              <div className="absolute inset-x-10 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] z-10 flex items-center justify-center">
                {isIntruderWalking && (
                  <div className="w-12 h-20 bg-slate-900/90 border-2 border-rose-500 rounded-lg flex flex-col items-center justify-center shadow-2xl animate-pulse">
                    <Footprints className="w-6 h-6 text-rose-400" />
                    <span className="text-[7px] font-black text-rose-300">BREACH</span>
                  </div>
                )}
              </div>

              {/* Right: LDR Photo-Sensor Receiver */}
              <div className="flex flex-col items-center z-20">
                <div className={`w-6 h-10 rounded-r border flex items-center justify-center ${
                  isLaserLatched ? 'bg-rose-950 border-rose-500' : 'bg-emerald-950 border-emerald-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isLaserLatched ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                </div>
                <span className="text-[7px] font-mono text-slate-400 mt-1">LDR SENSOR</span>
              </div>
            </div>

            {/* Latched Relay Status */}
            <div className="flex items-center justify-between text-[9px] font-mono bg-slate-900/80 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400">ELECTROMECHANICAL RELAY:</span>
              <span className={`font-bold ${isLaserLatched ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isLaserLatched ? 'LOCKED ON (SELF-LATCHING)' : 'NORMAL (CONTACT OPEN)'}
              </span>
            </div>
          </div>

          {/* Controls: Cut Beam & Reset Relay */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCutLaser}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-rose-600/30"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>{t.walkIntruder}</span>
            </button>
            <button
              onClick={handleResetLaser}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Unlock className="w-4 h-4 text-cyan-400" />
              <span>{t.resetRelay}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. FIREFLY & BREATHING MOOD LED CUTAWAY VIEW                         */}
      {/* ==================================================================== */}
      {isFirefly && (
        <div className="space-y-3">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950 border border-emerald-500/30 p-3 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{t.fireflyJarTitle}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Capacitor: {Math.round(fireflyCharge * 100)}%
              </span>
            </div>

            {/* Mason Jar with Bioluminescent Firefly */}
            <div className="relative flex items-center justify-center h-32">
              {/* Glass Jar Outline */}
              <div className="w-28 h-32 rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-sm relative flex flex-col items-center justify-center shadow-inner">
                {/* Jar Lid */}
                <div className="absolute top-0 w-20 h-3 bg-amber-700 rounded-b border-b border-amber-500" />

                {/* Firefly Body & Breathing Halo */}
                <div
                  className="w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center relative"
                  style={{
                    backgroundColor: `rgba(251, 191, 36, ${fireflyCharge})`,
                    boxShadow: `0 0 ${Math.round(fireflyCharge * 45)}px rgba(251, 191, 36, ${fireflyCharge})`,
                    transform: `scale(${0.8 + fireflyCharge * 0.3})`,
                  }}
                >
                  <Sparkles className="w-6 h-6 text-slate-950" />
                </div>
                <span className="text-[7px] font-mono font-bold text-amber-300 mt-2">RC DECAY</span>
              </div>
            </div>

            {/* Charge Meter */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-150"
                style={{ width: `${Math.round(fireflyCharge * 100)}%` }}
              />
            </div>
          </div>

          {/* Toggle Switch Button */}
          <button
            onClick={toggleFireflyCharge}
            className={`w-full py-2.5 px-3 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg ${
              isFireflyCharging
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isFireflyCharging ? t.dischargeFade : t.chargeCapacitor}</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. CAR 12V TO 5V USB CHARGER CUTAWAY VIEW                            */}
      {/* ==================================================================== */}
      {isCarCharger && (
        <div className="space-y-3">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-cyan-500/30 p-3 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <BatteryCharging className="w-4 h-4 text-cyan-400" />
                <span>{t.carChargerTitle}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isChargerSafe ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {chargerVolts.toFixed(1)}V DC Output
              </span>
            </div>

            {/* Dashboard & Connected Phone */}
            <div className="relative flex items-center justify-between px-3 h-28 bg-slate-950/80 border border-slate-800 rounded-xl">
              {/* 12V Car Battery */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border-2 border-slate-600 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-black text-amber-400">12V</span>
                  <span className="text-[6px] font-mono text-slate-400">LEAD-ACID</span>
                </div>
                <span className="text-[7px] font-mono text-slate-400 mt-1">CAR BATTERY</span>
              </div>

              {/* USB Fast-Charge Cable */}
              <div className="flex-1 flex items-center justify-center px-2">
                <div className="w-full h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 rounded-full animate-pulse" />
              </div>

              {/* Smartphone */}
              <div className="flex flex-col items-center">
                <div className={`w-14 h-20 rounded-xl border-2 p-1.5 flex flex-col items-center justify-between transition-all ${
                  isChargerSafe ? 'border-emerald-400 bg-slate-900' : 'border-rose-500 bg-rose-950/60 animate-pulse'
                }`}>
                  <span className="text-[7px] font-mono text-slate-400">PHONE</span>
                  <div className="flex flex-col items-center">
                    <BatteryCharging className={`w-5 h-5 ${isChargerSafe ? 'text-emerald-400 animate-bounce' : 'text-rose-400'}`} />
                    <span className="text-[9px] font-bold text-white mt-0.5">{phoneBatteryPct}%</span>
                  </div>
                  <span className={`text-[6px] font-mono font-bold ${isChargerSafe ? 'text-emerald-300' : 'text-rose-400'}`}>
                    {isChargerSafe ? 'FAST CHARGING' : 'DANGER!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning / Telemetry */}
            <div className="text-[9px] font-mono text-center text-slate-400">
              {isChargerSafe ? '✅ Safe 5.0V USB standard reached' : '⚠️ Must regulate to 5.0V (Potentiometer)'}
            </div>
          </div>

          {/* Potentiometer Voltage Slider */}
          <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">Regulated Voltage:</span>
              <span className="font-bold text-white">{chargerVolts.toFixed(1)} V</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="12.0"
              step="0.1"
              value={chargerVolts}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setChargerVolts(val);
                if (onUpdateComponentProperty) {
                  onUpdateComponentProperty('pot1', { sliderValue: val / 12.0 });
                }
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <button
              onClick={() => {
                soundFX.playClick(1.2);
                setChargerVolts(5.0);
                if (onUpdateComponentProperty) {
                  onUpdateComponentProperty('pot1', { sliderValue: 0.42 });
                }
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30 transition active:scale-95"
            >
              <span>⚡ Reset to Exact 5.0V Fast Charge</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. TOUCH SENSITIVE MAGIC SWITCH CUTAWAY VIEW                         */}
      {/* ==================================================================== */}
      {isTouchSwitch && (
        <div className="space-y-3">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-cyan-500/30 p-3 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>{t.touchSwitchTitle}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isTouchGlowing ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse' : 'bg-slate-800 text-slate-500'
              }`}>
                {isTouchGlowing ? 'TOUCH DETECTED' : 'STANDBY'}
              </span>
            </div>

            {/* Smart Glass Plate & Halo Ring Lamp */}
            <div className="relative flex items-center justify-between px-4 h-32 bg-slate-950/70 border border-slate-800 rounded-xl">
              {/* Dual Gold Pins Pad */}
              <div className="flex flex-col items-center">
                <div
                  onMouseDown={handleTouchPressStart}
                  onMouseUp={handleTouchPressEnd}
                  onTouchStart={handleTouchPressStart}
                  onTouchEnd={handleTouchPressEnd}
                  className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 ${
                    isTouchGlowing
                      ? 'bg-gradient-to-br from-cyan-950 to-blue-950 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] scale-98'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex gap-2 mb-1">
                    <div className="w-2.5 h-6 rounded bg-amber-400 shadow" title="Gold Pin 1" />
                    <div className="w-2.5 h-6 rounded bg-amber-400 shadow" title="Gold Pin 2" />
                  </div>
                  <Fingerprint className={`w-5 h-5 ${isTouchGlowing ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
                </div>
                <span className="text-[7px] font-mono text-slate-400 mt-1">TOUCH PINS</span>
              </div>

              {/* Amplification Gauge */}
              <div className="flex flex-col items-center text-[8px] font-mono space-y-1">
                <span className="text-slate-400">NANO-AMP GAIN</span>
                <span className={`font-bold ${isTouchGlowing ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {isTouchGlowing ? 'Ib: 15µA ➔ Ic: 30mA (200x)' : 'Ib: 0.0 µA'}
                </span>
              </div>

              {/* Ambient Halo Lamp */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isTouchGlowing
                      ? 'border-cyan-300 bg-cyan-400/20 shadow-[0_0_40px_rgba(6,182,212,1)] scale-110'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <Sparkles className={`w-6 h-6 ${isTouchGlowing ? 'text-cyan-300 animate-spin' : 'text-slate-700'}`} />
                </div>
                <span className="text-[7px] font-mono text-slate-400 mt-1">HALO LAMP</span>
              </div>
            </div>

            {/* Hint */}
            <div className="text-[9px] font-mono text-center text-slate-400">
              {isTouchGlowing ? '✨ Electrostatic skin bridge active!' : 'Touch gold pins or latch below'}
            </div>
          </div>

          {/* Controls: Touch Button & Latch Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onMouseDown={handleTouchPressStart}
              onMouseUp={handleTouchPressEnd}
              onTouchStart={handleTouchPressStart}
              onTouchEnd={handleTouchPressEnd}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-cyan-600/30"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{t.touchPrompt}</span>
            </button>
            <button
              onClick={toggleTouchLatch}
              className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border ${
                isTouchLatched
                  ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {isTouchLatched
                  ? lang === 'hi'
                    ? 'लैच हटाएं'
                    : 'Release Latch'
                  : lang === 'hi'
                  ? 'लैच ऑन (निरंतर)'
                  : 'Latch ON (Hold)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
