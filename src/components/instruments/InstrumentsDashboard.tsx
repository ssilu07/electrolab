import React, { useState, useEffect, useRef } from 'react';
import { SimulationResult } from '../../types/circuit';
import { soundFX } from '../../audio/SoundFX';
import { NativeBridge } from '../../utils/nativeBridge';
import {
  Activity,
  Zap,
  Radio,
  Sliders,
  Play,
  Pause,
  Power,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface InstrumentsDashboardProps {
  simulation: SimulationResult;
  isSimulating: boolean;
  onToggleSimulate: () => void;
}

export const InstrumentsDashboard: React.FC<InstrumentsDashboardProps> = ({
  simulation,
  isSimulating,
  onToggleSimulate,
}) => {
  // Instrument Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'oscilloscope' | 'multimeter' | 'function_gen' | 'power_supply'>('all');

  // Oscilloscope settings
  const [scopeRunning, setScopeRunning] = useState(true);
  const [timeDiv, setTimeDiv] = useState(500); // in microseconds
  const [ch1VoltsDiv, setCh1VoltsDiv] = useState(2.0);
  const [ch2VoltsDiv, setCh2VoltsDiv] = useState(2.0);
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  // Function Generator settings
  const [fgEnabled, setFgEnabled] = useState(true);
  const [fgWaveType, setFgWaveType] = useState<'sine' | 'square' | 'triangle' | 'pwm'>('sine');
  const [fgFrequency, setFgFrequency] = useState(1000); // 1 kHz
  const [fgAmplitude, setFgAmplitude] = useState(5.0); // 5V
  const [fgOffset, setFgOffset] = useState(0.0);

  // Multimeter settings
  const [dmmMode, setDmmMode] = useState<'voltage_dc' | 'voltage_ac' | 'resistance' | 'current_ma' | 'continuity'>('voltage_dc');
  const [dmmRange, setDmmRange] = useState<'auto' | '20v' | '200v'>('auto');

  // Power Supply settings
  const [psCh1Enabled, setPsCh1Enabled] = useState(true);
  const [psCh1Voltage, setPsCh1Voltage] = useState(5.0);
  const [psCh2Enabled, setPsCh2Enabled] = useState(true);
  const [psCh2Voltage, setPsCh2Voltage] = useState(3.3);

  // Animate oscilloscope canvas
  useEffect(() => {
    let animId: number;
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark CRT phosphor background with gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#020b14');
      bgGrad.addColorStop(1, '#031422');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      const xDivs = 10;
      const yDivs = 8;
      const cellW = w / xDivs;
      const cellH = h / yDivs;

      ctx.beginPath();
      for (let i = 0; i <= xDivs; i++) {
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, h);
      }
      for (let j = 0; j <= yDivs; j++) {
        ctx.moveTo(0, j * cellH);
        ctx.lineTo(w, j * cellH);
      }
      ctx.stroke();

      // Center crosshairs with tick marks
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      if (scopeRunning && isSimulating) {
        phaseRef.current += (fgFrequency / 1000) * 0.08;
      }
      const phase = phaseRef.current;

      const midY = h / 2;

      // Channel 1: Golden Yellow Sine/Simulated waveform
      ctx.beginPath();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
      ctx.shadowBlur = 8;

      const simV = simulation.oscilloscopeVoltage;
      const ch1Amp = (fgAmplitude / ch1VoltsDiv) * (cellH / 2);

      for (let x = 0; x < w; x++) {
        const t = (x / w) * (xDivs * (timeDiv / 1000));
        let yVal = 0;

        if (fgWaveType === 'sine') {
          yVal = Math.sin(t * (fgFrequency / 100) * Math.PI * 2 + phase);
        } else if (fgWaveType === 'square') {
          yVal = Math.sin(t * (fgFrequency / 100) * Math.PI * 2 + phase) >= 0 ? 1 : -1;
        } else if (fgWaveType === 'triangle') {
          const normT = (t * (fgFrequency / 100) + phase / (Math.PI * 2)) % 1;
          yVal = normT < 0.5 ? 4 * normT - 1 : 3 - 4 * normT;
        } else {
          // PWM
          const normT = (t * (fgFrequency / 100) + phase / (Math.PI * 2)) % 1;
          yVal = normT < 0.65 ? 1 : -1;
        }

        // Add subtle simulation ripple if circuit is active
        const ripple = simV !== 0 ? Math.sin(x * 0.1) * 2 : 0;
        const py = midY - yVal * ch1Amp + ripple;

        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Channel 2: Neon Green Square/Clock pulse
      ctx.beginPath();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
      ctx.shadowBlur = 6;

      const ch2Amp = (3.3 / ch2VoltsDiv) * (cellH / 2);
      for (let x = 0; x < w; x++) {
        const t = (x / w) * (xDivs * (timeDiv / 1000));
        const val = Math.sin(t * (fgFrequency / 100) * Math.PI * 2 + phase + Math.PI / 2) >= 0 ? 1 : -1;
        const py = midY + cellH - val * ch2Amp * 0.7;

        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Reset shadows
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [scopeRunning, isSimulating, timeDiv, ch1VoltsDiv, ch2VoltsDiv, fgWaveType, fgFrequency, fgAmplitude, simulation.oscilloscopeVoltage]);

  // Measured DMM display values
  const totalVolts = simulation.hasShortCircuit ? 0.0 : psCh1Enabled ? psCh1Voltage : 0.0;
  const totalCurrentMa = (simulation.totalCurrent * 1000).toFixed(1);
  const totalPowerMw = (simulation.totalPower * 1000).toFixed(1);

  return (
    <div className="w-full h-full overflow-y-auto px-3 sm:px-4 py-4 pb-28 max-w-5xl mx-auto space-y-4">
      {/* Top Instrument Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Instruments', icon: Sparkles },
          { id: 'oscilloscope', label: 'Oscilloscope', icon: Activity },
          { id: 'multimeter', label: 'Multimeter', icon: Zap },
          { id: 'function_gen', label: 'Function Gen', icon: Radio },
          { id: 'power_supply', label: 'Power Supply', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.playClick();
                NativeBridge.haptic('light');
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. DUAL-CHANNEL OSCILLOSCOPE (Screenshot 4) */}
      {(activeTab === 'all' || activeTab === 'oscilloscope') && (
        <div className="bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-3.5 sm:p-4 shadow-2xl relative overflow-hidden">
          {/* CRT Scope Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span>OSCILLOSCOPE</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono font-normal">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-yellow-400">CH1</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                    <span className="text-emerald-400">CH2</span>
                  </span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Dual-Trace Digital Storage Oscilloscope</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFX.playClick();
                  NativeBridge.haptic('light');
                  setScopeRunning(!scopeRunning);
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition ${
                  scopeRunning
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {scopeRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{scopeRunning ? 'RUN' : 'STOP'}</span>
              </button>
            </div>
          </div>

          {/* Scope Canvas */}
          <div className="relative mt-3 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-inner bg-slate-950">
            <canvas
              ref={scopeCanvasRef}
              width={640}
              height={220}
              className="w-full h-48 sm:h-56 block object-cover"
            />

            {/* Live Readout Overlay */}
            <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none text-[11px] font-mono">
              <div className="bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-yellow-500/40 text-yellow-300">
                CH1: {fgFrequency >= 1000 ? `${(fgFrequency / 1000).toFixed(3)} kHz` : `${fgFrequency} Hz`} &bull; Vpp: {fgAmplitude.toFixed(2)}V
              </div>
              <div className="bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/40 text-emerald-300">
                CH2: 3.30V &bull; 50% Duty
              </div>
            </div>
          </div>

          {/* Scope Channel Knobs / Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
            <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono text-yellow-400 block font-bold">CH1 VOLTS/DIV</span>
              <select
                value={ch1VoltsDiv}
                onChange={(e) => setCh1VoltsDiv(parseFloat(e.target.value))}
                className="w-full mt-1 bg-slate-950 border border-yellow-500/30 rounded-lg px-2 py-1 text-xs text-yellow-300 focus:outline-none"
              >
                <option value={0.5}>0.50 V/div</option>
                <option value={1.0}>1.00 V/div</option>
                <option value={2.0}>2.00 V/div</option>
                <option value={5.0}>5.00 V/div</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono text-emerald-400 block font-bold">CH2 VOLTS/DIV</span>
              <select
                value={ch2VoltsDiv}
                onChange={(e) => setCh2VoltsDiv(parseFloat(e.target.value))}
                className="w-full mt-1 bg-slate-950 border border-emerald-500/30 rounded-lg px-2 py-1 text-xs text-emerald-300 focus:outline-none"
              >
                <option value={0.5}>0.50 V/div</option>
                <option value={1.0}>1.00 V/div</option>
                <option value={2.0}>2.00 V/div</option>
                <option value={5.0}>5.00 V/div</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono text-cyan-400 block font-bold">TIME/DIV</span>
              <select
                value={timeDiv}
                onChange={(e) => setTimeDiv(parseInt(e.target.value))}
                className="w-full mt-1 bg-slate-950 border border-cyan-500/30 rounded-lg px-2 py-1 text-xs text-cyan-300 focus:outline-none"
              >
                <option value={100}>100 µs</option>
                <option value={200}>200 µs</option>
                <option value={500}>500 µs</option>
                <option value={1000}>1 ms</option>
                <option value={5000}>5 ms</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">TRIGGER</span>
              <div className="mt-1 flex items-center justify-between px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs font-mono text-slate-300">
                <span>Auto (Edge)</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FUNCTION GENERATOR (Screenshot 4) */}
      {(activeTab === 'all' || activeTab === 'function_gen') && (
        <div className="bg-slate-950/80 backdrop-blur-2xl border border-sky-500/30 rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">FUNCTION GENERATOR</h3>
                <span className="text-[10px] font-mono text-slate-400">DDS Precision Waveform Synthesizer</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.playClick();
                NativeBridge.haptic('light');
                setFgEnabled(!fgEnabled);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                fgEnabled
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{fgEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Wave Type Selector Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'sine', label: 'Sine ∿' },
              { type: 'square', label: 'Square ⊓' },
              { type: 'triangle', label: 'Triangle ∧' },
              { type: 'pwm', label: 'PWM ⎍' },
            ].map((w) => {
              const isSelected = fgWaveType === w.type;
              return (
                <button
                  key={w.type}
                  onClick={() => {
                    soundFX.playClick();
                    NativeBridge.haptic('light');
                    setFgWaveType(w.type as typeof fgWaveType);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30 border border-sky-300'
                      : 'bg-slate-900/70 text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-mono text-sm leading-none">{w.label.split(' ')[1]}</span>
                  <span className="text-[10px]">{w.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Frequency & Amplitude Knobs / Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Frequency</span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {fgFrequency >= 1000 ? `${(fgFrequency / 1000).toFixed(2)} kHz` : `${fgFrequency} Hz`}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={fgFrequency}
                onChange={(e) => setFgFrequency(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Amplitude (Vpp)</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{fgAmplitude.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12.0"
                step="0.5"
                value={fgAmplitude}
                onChange={(e) => setFgAmplitude(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>DC Offset</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{fgOffset.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.2"
                value={fgOffset}
                onChange={(e) => setFgOffset(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTIMETER & DUAL POWER SUPPLY (Split View matching Screenshot 2 & 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Digital Multimeter Console */}
        {(activeTab === 'all' || activeTab === 'multimeter') && (
          <div className="bg-slate-950/80 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">DIGITAL MULTIMETER</h3>
                  <span className="text-[10px] font-mono text-slate-400">High-Precision Bench DMM</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                TRUE RMS
              </span>
            </div>

            {/* Glowing 7-segment / Digital Display */}
            <div className="bg-black/80 rounded-2xl p-3 border border-emerald-500/40 shadow-inner flex flex-col justify-between h-24">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-500/70">
                <span>{dmmMode === 'voltage_dc' ? 'DC Voltage' : dmmMode === 'voltage_ac' ? 'AC Voltage' : 'Resistance'}</span>
                <span>AUTO-RANGE</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-extrabold text-3xl sm:text-4xl text-emerald-400 tracking-wider shadow-sm drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]">
                  {totalVolts.toFixed(2)}
                </span>
                <span className="font-mono text-xl font-bold text-emerald-300">V</span>
              </div>
              {/* Dynamic Bargraph Indicator */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalVolts / 12) * 100)}%` }}
                />
              </div>
            </div>

            {/* DMM Mode Selector Buttons */}
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[
                { id: 'voltage_dc', label: 'V⎓ DC' },
                { id: 'voltage_ac', label: 'V~ AC' },
                { id: 'resistance', label: 'Ω Ohms' },
                { id: 'current_ma', label: 'mA Cur' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundFX.playClick();
                    NativeBridge.haptic('light');
                    setDmmMode(m.id as typeof dmmMode);
                  }}
                  className={`py-1.5 rounded-xl text-center font-bold text-[11px] transition ${
                    dmmMode === m.id
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Measurement Telemetry readout (Screenshot 2) */}
            <div className="bg-slate-900/60 rounded-2xl p-2.5 border border-white/5 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Voltage</span>
                <span className="text-white font-bold">{totalVolts.toFixed(1)} V</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Current</span>
                <span className="text-cyan-400 font-bold">{totalCurrentMa} mA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Power</span>
                <span className="text-amber-400 font-bold">{totalPowerMw} mW</span>
              </div>
            </div>
          </div>
        )}

        {/* Dual Regulated DC Power Supply */}
        {(activeTab === 'all' || activeTab === 'power_supply') && (
          <div className="bg-slate-950/80 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">POWER SUPPLY</h3>
                  <span className="text-[10px] font-mono text-slate-400">Dual-Rail Isolated DC Source</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                OVERLOAD PROT
              </span>
            </div>

            {/* Channel 1 (5V default) & Channel 2 (3.3V default) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* CH1 */}
              <div className="bg-black/60 rounded-2xl p-2.5 border border-red-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-400">CH 1 (5V Rail)</span>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      NativeBridge.haptic('light');
                      setPsCh1Enabled(!psCh1Enabled);
                    }}
                    className={`w-6 h-3.5 rounded-full p-0.5 transition ${psCh1Enabled ? 'bg-red-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${psCh1Enabled ? 'translate-x-2.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="my-2 text-center">
                  <span className="font-mono text-2xl font-black text-red-400 block">
                    {psCh1Enabled ? psCh1Voltage.toFixed(2) : '0.00'} V
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">0.00 A</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.1"
                  value={psCh1Voltage}
                  onChange={(e) => setPsCh1Voltage(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
                />
              </div>

              {/* CH2 */}
              <div className="bg-black/60 rounded-2xl p-2.5 border border-blue-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400">CH 2 (3.3V Rail)</span>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      NativeBridge.haptic('light');
                      setPsCh2Enabled(!psCh2Enabled);
                    }}
                    className={`w-6 h-3.5 rounded-full p-0.5 transition ${psCh2Enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${psCh2Enabled ? 'translate-x-2.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="my-2 text-center">
                  <span className="font-mono text-2xl font-black text-blue-400 block">
                    {psCh2Enabled ? psCh2Voltage.toFixed(2) : '0.00'} V
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">0.00 A</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.05"
                  value={psCh2Voltage}
                  onChange={(e) => setPsCh2Voltage(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-slate-400">Quick Set:</span>
              <button
                onClick={() => { setPsCh1Voltage(5.0); setPsCh2Voltage(3.3); }}
                className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300"
              >
                Arduino (5V / 3.3V)
              </button>
              <button
                onClick={() => { setPsCh1Voltage(9.0); setPsCh2Voltage(5.0); }}
                className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300"
              >
                9V Battery
              </button>
              <button
                onClick={() => { setPsCh1Voltage(12.0); setPsCh2Voltage(5.0); }}
                className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300"
              >
                12V Car/Motor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
