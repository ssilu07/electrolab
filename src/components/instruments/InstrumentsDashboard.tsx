import React, { useState, useEffect, useRef } from 'react';
import { SimulationResult } from '../../types/circuit';
import { soundFX } from '../../audio/SoundFX';
import { NativeBridge } from '../../utils/nativeBridge';
import {
  Activity,
  Gauge,
  Waves,
  BatteryCharging,
  Play,
  Pause,
  Power,
  Download,
  Check,
  Crown,
  ChevronDown,
} from 'lucide-react';

interface InstrumentsDashboardProps {
  simulation: SimulationResult;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
}

type InstrumentFilter = 'all' | 'oscilloscope' | 'multimeter' | 'function_gen' | 'power_supply';
type WaveType = 'sine' | 'square' | 'triangle' | 'pwm';
type DmmMode = 'voltage_dc' | 'voltage_ac' | 'resistance' | 'current_ma' | 'continuity' | 'off';

const VOLTS_DIV_STEPS = [0.5, 1.0, 2.0, 5.0];
const TIME_DIV_STEPS = [100, 250, 500, 1000];
const TRIGGER_MODES: ('Auto' | 'Rise' | 'Fall')[] = ['Auto', 'Rise', 'Fall'];

const DMM_MODES: { id: DmmMode; label: string; unit: string; badge: string; angle: number }[] = [
  { id: 'off', label: 'OFF', unit: '', badge: 'OFF', angle: -125 },
  { id: 'voltage_ac', label: 'V~', unit: 'V', badge: 'AC', angle: -75 },
  { id: 'voltage_dc', label: 'V⎓', unit: 'V', badge: 'DC', angle: -25 },
  { id: 'resistance', label: 'Ω', unit: 'Ω', badge: 'RES', angle: 25 },
  { id: 'current_ma', label: 'mA', unit: 'mA', badge: 'DC', angle: 75 },
  { id: 'continuity', label: '•)))', unit: 'Ω', badge: 'CONT', angle: 125 },
];

export const InstrumentsDashboard: React.FC<InstrumentsDashboardProps> = ({
  simulation,
  isSimulating,
  onToggleSimulate,
  isPro = false,
  onOpenProModal,
}) => {
  const [activeTab, setActiveTab] = useState<InstrumentFilter>('all');
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Oscilloscope State
  const [scopeRunning, setScopeRunning] = useState(true);
  const [ch1VoltsDiv, setCh1VoltsDiv] = useState(2.0);
  const [ch2VoltsDiv, setCh2VoltsDiv] = useState(2.0);
  const [timeDivUs, setTimeDivUs] = useState(500);
  const [triggerMode, setTriggerMode] = useState<'Auto' | 'Rise' | 'Fall'>('Auto');
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  // Function Generator State
  const [fgEnabled, setFgEnabled] = useState(true);
  const [fgWaveType, setFgWaveType] = useState<WaveType>('sine');
  const [fgFrequency, setFgFrequency] = useState(1000); // Hz
  const [fgAmplitude, setFgAmplitude] = useState(5.0); // Vpp
  const [fgOffset, setFgOffset] = useState(0.0); // V

  // Digital Multimeter State
  const [dmmMode, setDmmMode] = useState<DmmMode>('voltage_dc');

  // Dual Power Supply State
  const [psCh1Enabled, setPsCh1Enabled] = useState(true);
  const [psCh1Voltage, setPsCh1Voltage] = useState(5.0);
  const [psCh2Enabled, setPsCh2Enabled] = useState(true);
  const [psCh2Voltage, setPsCh2Voltage] = useState(3.3);

  // Keep live simulation values accessible inside RAF without restarting loop
  const simRef = useRef(simulation);
  simRef.current = simulation;

  // 60 FPS Dual-Channel Phosphor Oscilloscope Renderer (Image 2 style)
  useEffect(() => {
    let animId = 0;
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Deep dark phosphor CRT background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#040914');
      bg.addColorStop(1, '#071120');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle cyan-slate graticule grid
      const xDivs = 8;
      const yDivs = 6;
      const cellW = w / xDivs;
      const cellH = h / yDivs;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.11)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < xDivs; i++) {
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, h);
      }
      for (let j = 1; j < yDivs; j++) {
        ctx.moveTo(0, j * cellH);
        ctx.lineTo(w, j * cellH);
      }
      ctx.stroke();

      // Center axes crosshair
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      if (scopeRunning && isSimulating) {
        phaseRef.current += (fgFrequency / 1000) * 0.065;
      }
      const phase = phaseRef.current;
      const cyclesAcrossScreen = Math.max(1.5, Math.min(8, (fgFrequency / 1000) * (timeDivUs / 500) * 3.0));
      const ch1BaseY = h * 0.28;
      const ch2BaseY = h * 0.72;
      const ch1Scale = (cellH / ch1VoltsDiv) * 0.42;
      const ch2Scale = (cellH / ch2VoltsDiv) * 0.42;

      const evalWave = (t: number, type: WaveType): number => {
        const mod = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (type === 'square') return mod < Math.PI ? 1 : -1;
        if (type === 'pwm') return mod < Math.PI * 0.65 ? 1 : -1;
        if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(t));
        return Math.sin(t);
      };

      const amp1 = fgEnabled ? fgAmplitude : 0;
      const liveBias = simRef.current.oscilloscopeVoltage * 0.15;

      // CH1 — Golden Yellow Glowing Trace
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const t = (x / w) * Math.PI * 2 * cyclesAcrossScreen + phase;
        const val = evalWave(t, fgWaveType) * (amp1 * 0.5) + fgOffset + liveBias;
        const y = Math.max(6, Math.min(h - 6, ch1BaseY - val * ch1Scale));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // CH2 — Neon Emerald Square/PWM Trace
      const amp2 = fgEnabled ? Math.max(2.0, psCh1Enabled ? psCh1Voltage : fgAmplitude) : 0;
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const t = (x / w) * Math.PI * 2 * cyclesAcrossScreen + phase;
        const val = evalWave(t, 'square') * (amp2 * 0.45);
        const y = Math.max(6, Math.min(h - 6, ch2BaseY - val * ch2Scale));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    scopeRunning,
    isSimulating,
    fgEnabled,
    fgWaveType,
    fgFrequency,
    fgAmplitude,
    fgOffset,
    ch1VoltsDiv,
    ch2VoltsDiv,
    timeDivUs,
    psCh1Enabled,
    psCh1Voltage,
  ]);

  const cycleVoltsDiv = (channel: 1 | 2) => {
    soundFX.playDialTick();
    NativeBridge.haptic('light');
    if (channel === 1) {
      setCh1VoltsDiv((prev) => VOLTS_DIV_STEPS[(VOLTS_DIV_STEPS.indexOf(prev) + 1) % VOLTS_DIV_STEPS.length]);
    } else {
      setCh2VoltsDiv((prev) => VOLTS_DIV_STEPS[(VOLTS_DIV_STEPS.indexOf(prev) + 1) % VOLTS_DIV_STEPS.length]);
    }
  };

  const cycleTimeDiv = () => {
    soundFX.playDialTick();
    NativeBridge.haptic('light');
    setTimeDivUs((prev) => TIME_DIV_STEPS[(TIME_DIV_STEPS.indexOf(prev) + 1) % TIME_DIV_STEPS.length]);
  };

  const cycleTrigger = () => {
    soundFX.playDialTick();
    NativeBridge.haptic('light');
    setTriggerMode((prev) => TRIGGER_MODES[(TRIGGER_MODES.indexOf(prev) + 1) % TRIGGER_MODES.length]);
  };

  const handleExportCsv = () => {
    if (!isPro) {
      soundFX.playClick();
      onOpenProModal?.();
      return;
    }
    const rows = ['Time_us,CH1_V,CH2_V'];
    for (let i = 0; i < 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      const v1 = (Math.sin(t) * fgAmplitude * 0.5 + fgOffset).toFixed(3);
      const v2 = (Math.sin(t) >= 0 ? psCh1Voltage * 0.5 : -psCh1Voltage * 0.5).toFixed(3);
      rows.push(`${i * 15},${v1},${v2}`);
    }
    navigator.clipboard?.writeText(rows.join('\n')).catch(() => {});
    soundFX.playVictory();
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // Compute live DMM readout
  const currentDmmConfig = DMM_MODES.find((m) => m.id === dmmMode) || DMM_MODES[2];
  const getDmmDisplay = (): { value: string; unit: string; barPct: number } => {
    if (dmmMode === 'off') return { value: '----', unit: '', barPct: 0 };
    if (dmmMode === 'voltage_dc') {
      const v = psCh1Enabled ? psCh1Voltage : Math.abs(simulation.oscilloscopeVoltage) || 5.0;
      return { value: v.toFixed(2), unit: 'V', barPct: Math.min(100, (v / 15) * 100) };
    }
    if (dmmMode === 'voltage_ac') {
      const vrms = fgEnabled ? fgAmplitude / (2 * Math.SQRT2) : 0;
      return { value: vrms.toFixed(2), unit: 'V', barPct: Math.min(100, (vrms / 10) * 100) };
    }
    if (dmmMode === 'current_ma') {
      const ma = simulation.totalCurrent * 1000;
      return { value: ma.toFixed(1), unit: 'mA', barPct: Math.min(100, (ma / 100) * 100) };
    }
    if (dmmMode === 'resistance') {
      return { value: '560', unit: 'Ω', barPct: 45 };
    }
    return { value: '0.4', unit: 'Ω', barPct: 92 };
  };
  const dmmDisplay = getDmmDisplay();

  const cycleDmmMode = () => {
    soundFX.playDialTick();
    NativeBridge.haptic('light');
    const idx = DMM_MODES.findIndex((m) => m.id === dmmMode);
    setDmmMode(DMM_MODES[(idx + 1) % DMM_MODES.length].id);
  };

  const ch1Vrms = fgEnabled ? (fgAmplitude / (2 * Math.SQRT2)).toFixed(2) : '0.00';
  const freqDisplay = fgFrequency >= 1000 ? `${(fgFrequency / 1000).toFixed(2)} kHz` : `${fgFrequency} Hz`;

  // Knob rotation angles
  const freqAngle = -120 + (Math.min(5000, fgFrequency) / 5000) * 240;
  const ampAngle = -120 + (fgAmplitude / 12) * 240;
  const offAngle = (fgOffset / 5) * 120;
  const ps1Angle = -120 + (psCh1Voltage / 15) * 240;
  const ps2Angle = -120 + (psCh2Voltage / 15) * 240;

  const ch1CurrentA = psCh1Enabled ? Math.max(0, simulation.totalCurrent) : 0;
  const ch2CurrentA = psCh2Enabled ? Math.max(0, simulation.totalCurrent * 0.4) : 0;

  const showOscilloscope = activeTab === 'all' || activeTab === 'oscilloscope';
  const showFuncGen = activeTab === 'all' || activeTab === 'function_gen';
  const showMultimeter = activeTab === 'all' || activeTab === 'multimeter';
  const showPowerSupply = activeTab === 'all' || activeTab === 'power_supply';

  const topTabs: { id: InstrumentFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'oscilloscope', label: 'Oscilloscope', icon: Activity },
    { id: 'multimeter', label: 'Multimeter', icon: Gauge },
    { id: 'function_gen', label: 'Function Gen', icon: Waves },
    { id: 'power_supply', label: 'Power Supply', icon: BatteryCharging },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-2.5 sm:px-4 pt-1 pb-28 space-y-3 font-sans text-slate-100 overflow-x-hidden">
      {/* Top 4 Instrument Selector Pills (Image 2 Style) */}
      <div className="grid grid-cols-4 gap-1.5">
        {topTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id || (activeTab === 'all' && tab.id === 'oscilloscope');
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.playClick(1.15);
                NativeBridge.haptic('light');
                setActiveTab((prev) => (prev === tab.id ? 'all' : tab.id));
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl border transition-all duration-200 active:scale-95 min-w-0 ${
                isSelected
                  ? 'bg-gradient-to-b from-sky-500 to-blue-600 border-sky-300/60 text-white shadow-[0_6px_20px_rgba(14,165,233,0.4)]'
                  : 'bg-[#0d1424] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. DUAL-CHANNEL OSCILLOSCOPE CARD */}
      {showOscilloscope && (
        <section className="rounded-3xl bg-[#0b111e] border border-white/10 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.65)] space-y-2.5 overflow-hidden">
          {/* Scope Header — Zero Overflow on 390px */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Activity className="w-4 h-4 text-sky-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-100 truncate">
                OSCILLOSCOPE
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-[10px] sm:text-xs font-mono font-bold">
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                CH1
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e]" />
                CH2
              </span>
              <button
                onClick={() => {
                  soundFX.playClick();
                  NativeBridge.haptic('light');
                  setScopeRunning((r) => !r);
                  if (!isSimulating) onToggleSimulate();
                }}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] sm:text-[11px] font-black transition active:scale-95 ${
                  scopeRunning && isSimulating
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                }`}
              >
                <span>{scopeRunning && isSimulating ? 'RUN' : 'HOLD'}</span>
                {scopeRunning && isSimulating ? (
                  <Play className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Pause className="w-2.5 h-2.5 fill-current" />
                )}
              </button>
              <button
                onClick={handleExportCsv}
                title={isPro ? 'Copy Waveform CSV' : 'CSV Export (PRO)'}
                className="p-1 rounded-lg bg-[#131c31] border border-white/10 text-slate-300 hover:text-white transition"
              >
                {copiedCsv ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : isPro ? (
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </div>
          </div>

          {/* Scope CRT + Right Control Column */}
          <div className="grid grid-cols-[1fr_92px] sm:grid-cols-[1fr_118px] gap-2 items-stretch">
            <div className="relative rounded-2xl overflow-hidden border border-sky-500/25 bg-[#040914] shadow-inner min-w-0">
              <canvas
                ref={scopeCanvasRef}
                width={380}
                height={180}
                className="w-full h-[156px] sm:h-[180px] block"
              />
            </div>

            {/* Right Controls Stack */}
            <div className="flex flex-col justify-between gap-1.5 text-[10px] font-mono">
              <button
                onClick={() => cycleVoltsDiv(1)}
                className="rounded-xl bg-[#0f172a] hover:bg-[#16223a] border border-amber-400/35 px-2 py-1.5 text-left transition active:scale-95"
              >
                <div className="flex items-center justify-between text-amber-300 font-bold text-[9px]">
                  <span>CH1</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </div>
                <div className="text-white font-bold text-[10px] sm:text-[11px] mt-0.5">
                  {ch1VoltsDiv.toFixed(2)} V/div
                </div>
              </button>

              <button
                onClick={() => cycleVoltsDiv(2)}
                className="rounded-xl bg-[#0f172a] hover:bg-[#16223a] border border-emerald-400/35 px-2 py-1.5 text-left transition active:scale-95"
              >
                <div className="flex items-center justify-between text-emerald-300 font-bold text-[9px]">
                  <span>CH2</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </div>
                <div className="text-white font-bold text-[10px] sm:text-[11px] mt-0.5">
                  {ch2VoltsDiv.toFixed(2)} V/div
                </div>
              </button>

              <button
                onClick={cycleTimeDiv}
                className="rounded-xl bg-[#0f172a] hover:bg-[#16223a] border border-sky-400/35 px-2 py-1.5 text-left transition active:scale-95"
              >
                <div className="flex items-center justify-between text-sky-300 font-bold text-[9px]">
                  <span>Time/Div</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </div>
                <div className="text-white font-bold text-[10px] sm:text-[11px] mt-0.5">
                  {timeDivUs} µs
                </div>
              </button>

              <button
                onClick={cycleTrigger}
                className="rounded-xl bg-[#0f172a] hover:bg-[#16223a] border border-white/10 px-2 py-1.5 text-left transition active:scale-95"
              >
                <div className="flex items-center justify-between text-slate-400 font-bold text-[9px]">
                  <span>Trigger</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </div>
                <div className="text-slate-100 font-bold text-[10px] sm:text-[11px] mt-0.5">
                  {triggerMode}
                </div>
              </button>
            </div>
          </div>

          {/* CH1 & CH2 Live Telemetry Boxes */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] sm:text-[11px]">
            <div className="rounded-2xl bg-[#070c17] border border-white/10 p-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-black">CH1 <span className="text-slate-500 font-normal">Freq</span></span>
                <span className="text-amber-300 font-bold">{fgEnabled ? freqDisplay : '0 Hz'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 pl-7">Vpp</span>
                <span className="text-white font-bold">{(fgEnabled ? fgAmplitude : 0).toFixed(2)} V</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 pl-7">Vrms</span>
                <span className="text-slate-200 font-bold">{ch1Vrms} V</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#070c17] border border-white/10 p-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-black">CH2 <span className="text-slate-500 font-normal">Freq</span></span>
                <span className="text-emerald-300 font-bold">{fgEnabled ? freqDisplay : '0 Hz'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 pl-7">Vpp</span>
                <span className="text-white font-bold">{(fgEnabled && psCh1Enabled ? psCh1Voltage : 0).toFixed(2)} V</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 pl-7">Duty</span>
                <span className="text-slate-200 font-bold">{fgWaveType === 'pwm' ? '65.0%' : '50.0%'}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. FUNCTION GENERATOR CARD */}
      {showFuncGen && (
        <section className="rounded-3xl bg-[#0b111e] border border-white/10 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.65)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-100">
                FUNCTION GENERATOR
              </h2>
            </div>

            <button
              onClick={() => {
                soundFX.playClick(1.2);
                NativeBridge.haptic('light');
                setFgEnabled((v) => !v);
              }}
              className="flex items-center gap-2"
            >
              <span className={`text-[11px] font-mono font-black ${fgEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {fgEnabled ? 'ON' : 'OFF'}
              </span>
              <span
                className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                  fgEnabled
                    ? 'bg-emerald-500 justify-end shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow block" />
              </span>
            </button>
          </div>

          {/* 4-Column Waveform Selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'sine', label: 'Sine', sym: '∿' },
                { id: 'square', label: 'Square', sym: '⊓' },
                { id: 'triangle', label: 'Triangle', sym: '△' },
                { id: 'pwm', label: 'PWM', sym: '⎍' },
              ] as { id: WaveType; label: string; sym: string }[]
            ).map((w) => {
              const active = fgWaveType === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    soundFX.playDialTick();
                    NativeBridge.haptic('light');
                    setFgWaveType(w.id);
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition active:scale-95 ${
                    active
                      ? 'bg-sky-500 text-white border-sky-300/60 shadow-md shadow-sky-500/35'
                      : 'bg-[#11192b] text-slate-300 border-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs leading-none">{w.sym}</span>
                  <span className="truncate">{w.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3 Interactive Rotary Knobs: Frequency, Amplitude, Offset */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {/* Frequency Knob */}
            <div className="rounded-2xl bg-[#070c17] border border-white/10 p-2 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400">Frequency</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundFX.playDialTick();
                    setFgFrequency((f) => Math.max(100, f - 250));
                  }}
                  className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  −
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-700 to-slate-950 border border-sky-400/40 shadow-inner flex items-center justify-center">
                  <div
                    style={{ transform: `rotate(${freqAngle}deg)` }}
                    className="w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-start justify-center pt-0.5 transition-transform duration-150"
                  >
                    <span className="w-1 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFX.playDialTick();
                    setFgFrequency((f) => Math.min(5000, f + 250));
                  }}
                  className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-300 bg-[#0d1526] px-2 py-0.5 rounded-md border border-white/5">
                {freqDisplay}
              </span>
            </div>

            {/* Amplitude Knob */}
            <div className="rounded-2xl bg-[#070c17] border border-white/10 p-2 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400">Amplitude</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundFX.playDialTick();
                    setFgAmplitude((a) => Math.max(0.5, Number((a - 0.5).toFixed(1))));
                  }}
                  className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  −
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-700 to-slate-950 border border-sky-400/40 shadow-inner flex items-center justify-center">
                  <div
                    style={{ transform: `rotate(${ampAngle}deg)` }}
                    className="w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-start justify-center pt-0.5 transition-transform duration-150"
                  >
                    <span className="w-1 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFX.playDialTick();
                    setFgAmplitude((a) => Math.min(12, Number((a + 0.5).toFixed(1))));
                  }}
                  className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-300 bg-[#0d1526] px-2 py-0.5 rounded-md border border-white/5">
                {fgAmplitude.toFixed(2)} V
              </span>
            </div>

            {/* Offset Knob */}
            <div className="rounded-2xl bg-[#070c17] border border-white/10 p-2 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400">Offset</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundFX.playDialTick();
                    setFgOffset((o) => Math.max(-5, Number((o - 0.5).toFixed(1))));
                  }}
                  className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  −
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-700 to-slate-950 border border-sky-400/40 shadow-inner flex items-center justify-center">
                  <div
                    style={{ transform: `rotate(${offAngle}deg)` }}
                    className="w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-start justify-center pt-0.5 transition-transform duration-150"
                  >
                    <span className="w-1 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFX.playDialTick();
                    setFgOffset((o) => Math.min(5, Number((o + 0.5).toFixed(1))));
                  }}
                  className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-300 bg-[#0d1526] px-2 py-0.5 rounded-md border border-white/5">
                {fgOffset.toFixed(2)} V
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 3. BOTTOM SPLIT: DIGITAL MULTIMETER + DUAL POWER SUPPLY (Image 2 Style) */}
      {(showMultimeter || showPowerSupply) && (
        <div
          className={`grid gap-2.5 ${
            showMultimeter && showPowerSupply ? 'grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'
          }`}
        >
          {/* LEFT: DIGITAL MULTIMETER */}
          {showMultimeter && (
            <section className="rounded-3xl bg-[#0b111e] border border-white/10 p-2.5 sm:p-3 shadow-[0_12px_35px_rgba(0,0,0,0.65)] flex flex-col justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <h3 className="text-[10px] sm:text-xs font-extrabold tracking-wider text-slate-200 truncate">
                  DIGITAL MULTIMETER
                </h3>
              </div>

              {/* Glowing Green/Cyan LCD Screen */}
              <div className="rounded-2xl bg-[#040d0a] border border-emerald-500/35 px-2.5 py-2 shadow-inner">
                <div className="flex items-baseline justify-between gap-1">
                  <span
                    style={{ textShadow: '0 0 12px rgba(52, 211, 153, 0.7)' }}
                    className="font-mono font-black text-lg sm:text-2xl text-emerald-300 tracking-tight truncate"
                  >
                    {dmmDisplay.value} <span className="text-xs sm:text-sm">{dmmDisplay.unit}</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 shrink-0">
                    {currentDmmConfig.badge}
                  </span>
                </div>
                {/* Mini analog bar graph */}
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    style={{ width: `${dmmDisplay.barPct}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-300 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Interactive Rotary Range Dial */}
              <div className="flex flex-col items-center gap-1.5 py-0.5">
                <button
                  onClick={cycleDmmMode}
                  title="Tap dial to change measurement mode"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-slate-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] flex items-center justify-center active:scale-95 transition"
                >
                  <div
                    style={{ transform: `rotate(${currentDmmConfig.angle}deg)` }}
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/15 flex items-start justify-center pt-1.5 transition-transform duration-200 shadow-lg"
                  >
                    <span className="w-1.5 h-4 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                  </div>
                </button>
                <span className="text-[9px] sm:text-[10px] font-mono text-sky-300 font-bold">
                  Mode: {currentDmmConfig.label} (Tap)
                </span>
              </div>

              {/* COM & VΩmA Terminals */}
              <div className="flex items-center justify-around pt-1 border-t border-white/10 text-[9px] font-mono text-slate-400">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-500 shadow-inner" />
                  <span>COM</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="w-4 h-4 rounded-full bg-red-600 border-2 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.65)]" />
                  <span>VΩmA</span>
                </div>
              </div>
            </section>
          )}

          {/* RIGHT: DUAL-CHANNEL POWER SUPPLY */}
          {showPowerSupply && (
            <section className="rounded-3xl bg-[#0b111e] border border-white/10 p-2.5 sm:p-3 shadow-[0_12px_35px_rgba(0,0,0,0.65)] flex flex-col justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <h3 className="text-[10px] sm:text-xs font-extrabold tracking-wider text-slate-200 truncate">
                  POWER SUPPLY
                </h3>
              </div>

              {/* Dual Channel Digital Readout Boxes */}
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {/* CH1 Red */}
                <div className="rounded-xl overflow-hidden border border-rose-500/35 bg-[#060a14]">
                  <div className="bg-rose-600/85 text-white text-[9px] font-black text-center py-0.5">
                    CH1
                  </div>
                  <div className="p-1.5 text-center space-y-0.5">
                    <div className={`text-xs sm:text-sm font-black ${psCh1Enabled ? 'text-rose-400' : 'text-slate-600'}`}>
                      {(psCh1Enabled ? psCh1Voltage : 0).toFixed(2)} V
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400">
                      {ch1CurrentA.toFixed(2)} A
                    </div>
                  </div>
                </div>

                {/* CH2 Blue */}
                <div className="rounded-xl overflow-hidden border border-sky-500/35 bg-[#060a14]">
                  <div className="bg-sky-600/85 text-white text-[9px] font-black text-center py-0.5">
                    CH2
                  </div>
                  <div className="p-1.5 text-center space-y-0.5">
                    <div className={`text-xs sm:text-sm font-black ${psCh2Enabled ? 'text-sky-400' : 'text-slate-600'}`}>
                      {(psCh2Enabled ? psCh2Voltage : 0).toFixed(2)} V
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400">
                      {ch2CurrentA.toFixed(2)} A
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Rotary Voltage Knobs + Step Controls */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* CH1 Knob */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border border-rose-500/50 flex items-center justify-center shadow-inner">
                    <div
                      style={{ transform: `rotate(${ps1Angle}deg)` }}
                      className="w-7 h-7 rounded-full bg-slate-900 border border-white/10 flex items-start justify-center pt-1 transition-transform duration-150"
                    >
                      <span className="w-1 h-2 rounded-full bg-rose-400 shadow-[0_0_5px_#fb7185]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundFX.playDialTick();
                        setPsCh1Voltage((v) => Math.max(0.5, Number((v - 0.5).toFixed(1))));
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <button
                      onClick={() => {
                        soundFX.playDialTick();
                        setPsCh1Voltage((v) => Math.min(15, Number((v + 0.5).toFixed(1))));
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* CH2 Knob */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border border-sky-500/50 flex items-center justify-center shadow-inner">
                    <div
                      style={{ transform: `rotate(${ps2Angle}deg)` }}
                      className="w-7 h-7 rounded-full bg-slate-900 border border-white/10 flex items-start justify-center pt-1 transition-transform duration-150"
                    >
                      <span className="w-1 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundFX.playDialTick();
                        setPsCh2Voltage((v) => Math.max(0.5, Number((v - 0.5).toFixed(1))));
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <button
                      onClick={() => {
                        soundFX.playDialTick();
                        setPsCh2Voltage((v) => Math.min(15, Number((v + 0.5).toFixed(1))));
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dual Glowing ON/OFF Power Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    soundFX.playClick(1.2);
                    NativeBridge.haptic('medium');
                    setPsCh1Enabled((v) => !v);
                  }}
                  className={`py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 border transition active:scale-95 ${
                    psCh1Enabled
                      ? 'bg-rose-500/20 border-rose-400/70 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                      : 'bg-slate-900 border-white/10 text-slate-500'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{psCh1Enabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.playClick(1.2);
                    NativeBridge.haptic('medium');
                    setPsCh2Enabled((v) => !v);
                  }}
                  className={`py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 border transition active:scale-95 ${
                    psCh2Enabled
                      ? 'bg-sky-500/20 border-sky-400/70 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                      : 'bg-slate-900 border-white/10 text-slate-500'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{psCh2Enabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
