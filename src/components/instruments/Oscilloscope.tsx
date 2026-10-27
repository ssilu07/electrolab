import React, { useState, useRef, useEffect } from 'react';
import { OscilloscopeState, SimulationResult } from '../../types/circuit';
import { soundFX } from '../../audio/SoundFX';
import { X, Play, Pause, Activity, Zap, BarChart2 } from 'lucide-react';

interface OscilloscopeProps {
  state: OscilloscopeState;
  simulation: SimulationResult;
  onUpdateState: (partial: Partial<OscilloscopeState>) => void;
  onClose: () => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  state,
  simulation,
  onUpdateState,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>(new Array(160).fill(0));

  // Push live sample to rolling buffer
  useEffect(() => {
    if (!state.running) return;
    const v = simulation.oscilloscopeVoltage;
    const buf = bufferRef.current;
    buf.shift();
    buf.push(v);
  }, [simulation.oscilloscopeVoltage, state.running]);

  // Compute live frequency and FFT bars
  const buf = bufferRef.current;
  let zeroCrossings = 0;
  const mean = buf.reduce((a, b) => a + b, 0) / buf.length;
  for (let i = 1; i < buf.length; i++) {
    if ((buf[i - 1] - mean) * (buf[i] - mean) < 0) {
      zeroCrossings++;
    }
  }
  // 160 samples at 60Hz sample rate = ~2.66s buffer
  const estimatedFreq = Math.round((zeroCrossings / 2) / (160 / 60));

  // Render phosphor waveform or FFT spectrum
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark phosphor CRT background
    ctx.fillStyle = '#03140c';
    ctx.fillRect(0, 0, w, h);

    if (state.displayMode === 'fft') {
      // Frequency Spectrum Bar Mode (FFT)
      const numBars = 32;
      const barWidth = (w - 20) / numBars;

      // Draw horizontal dB grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let y = 20; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
      }

      // Discrete spectrum approximation from buffer
      for (let b = 0; b < numBars; b++) {
        const k = b + 1;
        let real = 0;
        let imag = 0;
        for (let n = 0; n < buf.length; n++) {
          const angle = (2 * Math.PI * k * n) / buf.length;
          real += buf[n] * Math.cos(angle);
          imag -= buf[n] * Math.sin(angle);
        }
        const mag = Math.sqrt(real * real + imag * imag) / buf.length;
        const barH = Math.min(h - 30, mag * 25 * (state.voltsDiv || 2.0));

        const bx = 10 + b * barWidth;
        const by = h - 15 - barH;

        const grad = ctx.createLinearGradient(0, by, 0, h - 15);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#0284c7');

        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, barWidth - 2, barH);

        // Peak cap
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx, by - 2, barWidth - 2, 2);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('0Hz', 10, h - 4);
      ctx.fillText('500Hz', w / 2 - 15, h - 4);
      ctx.fillText('1kHz', w - 35, h - 4);
    } else {
      // Time Domain Waveform Mode
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.lineWidth = 1;
      const numDivsX = 8;
      const numDivsY = 6;

      for (let i = 0; i <= numDivsX; i++) {
        const x = (i * w) / numDivsX;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let j = 0; j <= numDivsY; j++) {
        const y = (j * h) / numDivsY;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center crosshair
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      // Plot waveform
      const centerY = h / 2;
      const voltsPerDiv = state.voltsDiv || 2.0;
      const pixelsPerVolt = (h / numDivsY) / voltsPerDiv;

      ctx.save();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let i = 0; i < buf.length; i++) {
        const x = (i / (buf.length - 1)) * w;
        const y = centerY - buf[i] * pixelsPerVolt;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [simulation.oscilloscopeVoltage, state.voltsDiv, state.running, state.displayMode]);

  // Window drag
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragOffset({
      x: clientX - state.x,
      y: clientY - state.y,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdateState({
          x: Math.max(8, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x)),
          y: Math.max(50, Math.min(window.innerHeight - 340, e.clientY - dragOffset.y)),
        });
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        onUpdateState({
          x: Math.max(8, Math.min(window.innerWidth - 320, e.touches[0].clientX - dragOffset.x)),
          y: Math.max(50, Math.min(window.innerHeight - 340, e.touches[0].clientY - dragOffset.y)),
        });
      }
    };
    const handleEnd = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, dragOffset, onUpdateState, state.x, state.y]);

  const vMax = Math.max(...buf);
  const vMin = Math.min(...buf);
  const vpp = Math.max(0, vMax - vMin);
  const vRms = Math.sqrt(buf.reduce((acc, v) => acc + v * v, 0) / buf.length);

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ left: `${Math.min(state.x, Math.max(10, window.innerWidth - 380))}px`, top: `${Math.min(state.y, Math.max(60, window.innerHeight - 340))}px` }}
      className="fixed z-40 w-96 max-w-[calc(100vw-20px)] bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-cyan-500/30 select-none cursor-grab active:cursor-grabbing font-mono touch-none"
    >
      {/* Scope Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-cyan-400 text-xs font-bold tracking-wider">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>DSO-2000 PHOSPHOR SCOPE</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Waveform / FFT Toggle */}
          <button
            onClick={() => {
              soundFX.playClick();
              onUpdateState({ displayMode: state.displayMode === 'fft' ? 'waveform' : 'fft' });
            }}
            className={`p-1 px-2 rounded text-[10px] font-bold transition flex items-center gap-1 ${
              state.displayMode === 'fft' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-300'
            }`}
            title="Toggle FFT Frequency Spectrum Mode"
          >
            <BarChart2 className="w-3 h-3" />
            <span>{state.displayMode === 'fft' ? 'FFT' : 'WAVE'}</span>
          </button>

          <button
            onClick={() => onUpdateState({ running: !state.running })}
            className={`p-1 px-2 rounded text-[10px] font-bold transition flex items-center gap-1 ${
              state.running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {state.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{state.running ? 'RUN' : 'HOLD'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Container */}
      <div className="mt-2.5 relative border-2 border-slate-800 rounded-lg overflow-hidden bg-black shadow-inner">
        <canvas ref={canvasRef} width={360} height={160} className="w-full h-40 block" />

        <div className="absolute top-1.5 left-2 flex gap-3 text-[10px] text-emerald-400/90 font-mono font-bold bg-black/60 px-2 py-0.5 rounded">
          <span>Vpp: {vpp.toFixed(2)}V</span>
          <span>Vrms: {vRms.toFixed(2)}V</span>
          <span>Freq: {estimatedFreq > 0 ? `${estimatedFreq}Hz` : '--'}</span>
        </div>

        <div className="absolute bottom-1.5 right-2 text-[10px] text-cyan-400/80 bg-black/60 px-2 py-0.5 rounded">
          {state.displayMode === 'fft' ? 'FFT SPECTRUM' : `CH1: ${state.voltsDiv}V/DIV | ${state.timeDivMs}ms/DIV`}
        </div>
      </div>

      {/* Scope Controls */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Volts / Div:</span>
          <div className="flex gap-1">
            {[0.5, 1.0, 2.0, 5.0].map((v) => (
              <button
                key={v}
                onClick={() => {
                  soundFX.playDialTick();
                  onUpdateState({ voltsDiv: v });
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  state.voltsDiv === v
                    ? 'bg-cyan-500 text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {v}V
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Time / Div:</span>
          <div className="flex gap-1">
            {[1, 5, 10, 50].map((t) => (
              <button
                key={t}
                onClick={() => {
                  soundFX.playDialTick();
                  onUpdateState({ timeDivMs: t });
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  state.timeDivMs === t
                    ? 'bg-cyan-500 text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t}ms
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] bg-slate-950/50 p-1.5 rounded px-2 text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400" />
          <span>Probe CH1:</span>
          <span className="text-yellow-300 font-bold truncate max-w-[100px]">
            {state.probe.attachedPinId || 'Touch any pin'}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Auto-trigger 60Hz</span>
        </div>
      </div>
    </div>
  );
};
