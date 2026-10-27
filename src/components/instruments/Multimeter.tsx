import React, { useState, useRef, useEffect } from 'react';
import { MultimeterState, SimulationResult } from '../../types/circuit';
import { soundFX } from '../../audio/SoundFX';
import { X, Volume2, Move, Pin } from 'lucide-react';

interface MultimeterProps {
  state: MultimeterState;
  simulation: SimulationResult;
  onUpdateState: (partial: Partial<MultimeterState>) => void;
  onClose: () => void;
}

export const Multimeter: React.FC<MultimeterProps> = ({
  state,
  simulation,
  onUpdateState,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHold, setIsHold] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute measurement based on probes
  const redPin = state.redProbe.attachedPinId;
  const blackPin = state.blackProbe.attachedPinId;

  let displayReading = '0.000';
  let unit = 'V';
  let isContinuityBeeping = false;

  if (redPin && blackPin) {
    const vRed = simulation.pinVoltages.get(redPin) ?? 0;
    const vBlack = simulation.pinVoltages.get(blackPin) ?? 0;
    const vDiff = vRed - vBlack;

    switch (state.mode) {
      case 'voltage_dc': {
        unit = 'V';
        displayReading = vDiff.toFixed(3);
        break;
      }
      case 'current_ma': {
        unit = 'mA';
        // Estimate branch current at probe pin
        const compId = redPin.split(':')[0];
        const currentA = simulation.branchCurrents.get(compId) ?? 0;
        displayReading = (currentA * 1000).toFixed(2);
        break;
      }
      case 'resistance': {
        unit = 'Ω';
        const nodeRed = simulation.pinToNode.get(redPin);
        const nodeBlack = simulation.pinToNode.get(blackPin);
        if (nodeRed === nodeBlack) {
          displayReading = '0.0';
        } else {
          // Resistance estimation
          const compId = redPin.split(':')[0];
          displayReading = '10.0k';
        }
        break;
      }
      case 'continuity': {
        unit = 'Ω';
        const nodeRed = simulation.pinToNode.get(redPin);
        const nodeBlack = simulation.pinToNode.get(blackPin);
        const isShort = nodeRed === nodeBlack;
        displayReading = isShort ? '0.0' : 'O.L';
        if (isShort) {
          isContinuityBeeping = true;
        }
        break;
      }
    }
  } else {
    displayReading = state.mode === 'continuity' ? 'O.L' : '0.000';
  }

  // Handle continuity buzzer
  useEffect(() => {
    soundFX.updateContinuity(isContinuityBeeping);
    return () => {
      soundFX.stopContinuity();
    };
  }, [isContinuityBeeping]);

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
          x: Math.max(8, Math.min(window.innerWidth - 260, e.clientX - dragOffset.x)),
          y: Math.max(50, Math.min(window.innerHeight - 380, e.clientY - dragOffset.y)),
        });
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        onUpdateState({
          x: Math.max(8, Math.min(window.innerWidth - 260, e.touches[0].clientX - dragOffset.x)),
          y: Math.max(50, Math.min(window.innerHeight - 380, e.touches[0].clientY - dragOffset.y)),
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

  const selectMode = (mode: MultimeterState['mode']) => {
    soundFX.playDialTick();
    onUpdateState({ mode });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ left: `${Math.min(state.x, Math.max(10, window.innerWidth - 270))}px`, top: `${Math.min(state.y, Math.max(60, window.innerHeight - 380))}px` }}
      className="fixed z-40 w-64 max-w-[calc(100vw-20px)] bg-gradient-to-b from-amber-500 to-amber-700 p-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 select-none cursor-grab active:cursor-grabbing font-sans touch-none"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-amber-600/40 text-amber-950 font-bold text-xs tracking-wider">
        <div className="flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5" />
          <span>TRUE RMS DMM-99</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-amber-600/40 rounded text-amber-950 hover:text-black transition"
          title="Close DMM"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* LCD Screen */}
      <div className="mt-2 bg-[#8da576] border-4 border-slate-900 rounded-lg p-2.5 shadow-inner">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-800 font-semibold mb-0.5">
          <span className="uppercase">{state.mode.replace('_', ' ')}</span>
          <div className="flex items-center gap-1">
            {isHold && <span className="bg-slate-800 text-[#8da576] px-1 rounded text-[9px]">HOLD</span>}
            {state.mode === 'continuity' && <Volume2 className="w-3 h-3 text-slate-800" />}
          </div>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-3xl font-bold tracking-widest text-slate-950 drop-shadow-sm">
            {displayReading}
          </span>
          <span className="font-mono text-lg font-bold text-slate-900">{unit}</span>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-700 mt-1">
          <span>AUTO RANGE</span>
          <span>600V CAT III</span>
        </div>
      </div>

      {/* Rotary Selector Dial Buttons */}
      <div className="mt-3 bg-slate-900/90 rounded-xl p-2 border border-slate-800">
        <div className="text-[10px] text-slate-400 text-center font-mono uppercase mb-1.5 font-semibold">
          Function Mode
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => selectMode('voltage_dc')}
            className={`py-1.5 px-2 rounded font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
              state.mode === 'voltage_dc'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            V (DC)
          </button>
          <button
            onClick={() => selectMode('current_ma')}
            className={`py-1.5 px-2 rounded font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
              state.mode === 'current_ma'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            mA (Current)
          </button>
          <button
            onClick={() => selectMode('resistance')}
            className={`py-1.5 px-2 rounded font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
              state.mode === 'resistance'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Ω (Ohms)
          </button>
          <button
            onClick={() => selectMode('continuity')}
            className={`py-1.5 px-2 rounded font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
              state.mode === 'continuity'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Continuity ·)))
          </button>
        </div>
      </div>

      {/* Probe Connection status */}
      <div className="mt-2.5 flex items-center justify-between bg-slate-900/60 rounded-lg p-1.5 px-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
          <span className="text-slate-200">Red:</span>
          <span className="text-red-300 font-bold truncate max-w-[55px]">
            {state.redProbe.attachedPinId ? state.redProbe.attachedPinId.split(':')[1] : 'Unpinned'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-slate-200">Black:</span>
          <span className="text-slate-300 font-bold truncate max-w-[55px]">
            {state.blackProbe.attachedPinId ? state.blackProbe.attachedPinId.split(':')[1] : 'Unpinned'}
          </span>
        </div>
      </div>

      <div className="mt-2 text-center text-[10px] text-amber-950 font-semibold flex items-center justify-center gap-1">
        <Pin className="w-3 h-3" />
        <span>Click pins on board to attach probes</span>
      </div>
    </div>
  );
};
