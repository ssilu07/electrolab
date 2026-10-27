import React from 'react';
import { CircuitComponent, SimulationResult } from '../types/circuit';
import { COMPONENT_REGISTRY } from '../engine/ComponentRegistry';
import { soundFX } from '../audio/SoundFX';
import {
  RotateCw,
  Trash2,
  Copy,
  Wrench,
  X,
  Zap,
  Sliders,
} from 'lucide-react';

interface InspectorModalProps {
  component: CircuitComponent | null;
  simulation: SimulationResult;
  onUpdateComponent: (id: string, partial: Partial<CircuitComponent['properties']>) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (comp: CircuitComponent) => void;
  onRepairComponent: (id: string) => void;
  onClose: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  component,
  simulation,
  onUpdateComponent,
  onRotateComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onRepairComponent,
  onClose,
}) => {
  if (!component) return null;

  const meta = COMPONENT_REGISTRY[component.type];
  const isBlown = component.properties.isBlown || simulation.blownComponents.has(component.id);
  const current = simulation.branchCurrents.get(component.id) ?? 0;
  const power = simulation.componentPower.get(component.id) ?? 0;

  return (
    <div className="fixed top-20 right-4 z-40 w-72 glass-modal rounded-3xl shadow-2xl p-4 flex flex-col gap-3 font-sans text-slate-200 animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-white line-clamp-1">{meta?.name || component.type}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Blown Alert */}
      {isBlown && (
        <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
            <Zap className="w-4 h-4" />
            <span>CATASTROPHIC FAILURE!</span>
          </div>
          <p className="text-[11px] text-red-200">
            {component.properties.blownReason || 'Component destroyed by electrical overload.'}
          </p>
          <button
            onClick={() => onRepairComponent(component.id)}
            className="mt-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2.5 rounded-lg text-xs transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Replace / Repair Component</span>
          </button>
        </div>
      )}

      {/* Live Telemetry Card */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-slate-500 text-[10px] block">CURRENT:</span>
          <span className="text-cyan-400 font-bold">
            {Math.abs(current) >= 1
              ? `${Math.abs(current).toFixed(2)} A`
              : `${(Math.abs(current) * 1000).toFixed(1)} mA`}
          </span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block">POWER:</span>
          <span className="text-amber-400 font-bold">
            {power >= 1 ? `${power.toFixed(2)} W` : `${(power * 1000).toFixed(1)} mW`}
          </span>
        </div>
      </div>

      {/* Dynamic Property Editors */}
      <div className="flex flex-col gap-2.5 text-xs">
        {/* Resistor Editor */}
        {component.type === 'resistor' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Resistance:</span>
              <span className="text-cyan-400 font-bold">{component.properties.resistance ?? 330} Ω</span>
            </div>
            <input
              type="range"
              min="10"
              max="10000"
              step="10"
              value={component.properties.resistance ?? 330}
              onChange={(e) => onUpdateComponent(component.id, { resistance: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex gap-1 justify-between mt-0.5">
              {[100, 220, 330, 1000, 10000].map((r) => (
                <button
                  key={r}
                  onClick={() => onUpdateComponent(component.id, { resistance: r })}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono rounded text-slate-300"
                >
                  {r >= 1000 ? `${r / 1000}k` : `${r}Ω`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Battery Voltage Editor */}
        {component.type === 'battery' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Nominal Voltage:</span>
              <span className="text-cyan-400 font-bold">{component.properties.voltage ?? 9} V</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="24"
              step="0.5"
              value={component.properties.voltage ?? 9}
              onChange={(e) => onUpdateComponent(component.id, { voltage: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex gap-1 justify-between mt-0.5">
              {[1.5, 3.3, 5, 9, 12].map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdateComponent(component.id, { voltage: v })}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono rounded text-slate-300"
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AC Signal Generator Editor */}
        {component.type === 'ac_source' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Frequency:</span>
              <span className="text-cyan-400 font-bold">{component.properties.frequency ?? 60} Hz</span>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              step="5"
              value={component.properties.frequency ?? 60}
              onChange={(e) => onUpdateComponent(component.id, { frequency: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Amplitude (Peak):</span>
              <span className="text-cyan-400 font-bold">{component.properties.voltage ?? 5} V</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={component.properties.voltage ?? 5}
              onChange={(e) => onUpdateComponent(component.id, { voltage: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex gap-1.5">
              {(['sine', 'square', 'triangle'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateComponent(component.id, { waveType: w })}
                  className={`flex-1 py-1 rounded text-[10px] font-mono uppercase font-bold transition ${
                    (component.properties.waveType || 'sine') === w
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inductor Editor */}
        {component.type === 'inductor' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Inductance:</span>
              <span className="text-amber-400 font-bold">
                {Math.round((component.properties.inductance ?? 0.01) * 1000)} mH
              </span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={component.properties.inductance ?? 0.01}
              onChange={(e) => onUpdateComponent(component.id, { inductance: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        )}

        {/* Potentiometer Rotary Slider */}
        {component.type === 'potentiometer' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Wiper Position:</span>
              <span className="text-cyan-400 font-bold">
                {Math.round((component.properties.sliderValue ?? 0.5) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={component.properties.sliderValue ?? 0.5}
              onChange={(e) => onUpdateComponent(component.id, { sliderValue: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        )}

        {/* LDR Ambient Light Slider */}
        {component.type === 'ldr' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
              <span>Ambient Light:</span>
              <span className="text-amber-400 font-bold">
                {Math.round((component.properties.sliderValue ?? 0.5) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={component.properties.sliderValue ?? 0.5}
              onChange={(e) => onUpdateComponent(component.id, { sliderValue: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Dark (1MΩ)</span>
              <span>Bright (100Ω)</span>
            </div>
          </div>
        )}

        {/* LED Color Picker */}
        {component.type === 'led' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">LED Color:</span>
            <div className="flex gap-2">
              {['red', 'green', 'blue', 'yellow'].map((col) => (
                <button
                  key={col}
                  onClick={() => onUpdateComponent(component.id, { color: col })}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    (component.properties.color || 'red') === col
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col === 'red' ? '#ef4444' : col === 'green' ? '#22c55e' : col === 'blue' ? '#3b82f6' : '#eab308' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Switch / Pushbutton Toggle */}
        {(component.type === 'switch' || component.type === 'pushbutton') && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400 font-mono text-[11px]">State:</span>
            <button
              onClick={() => {
                soundFX.playClick();
                onUpdateComponent(component.id, { closed: !component.properties.closed });
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                component.properties.closed
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {component.properties.closed ? 'CLOSED (Conducting)' : 'OPEN (Disconnected)'}
            </button>
          </div>
        )}

        {/* Relay Indicator */}
        {component.type === 'relay' && (
          <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">Relay State:</span>
            <span
              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                component.properties.relayEnergized
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {component.properties.relayEnergized ? 'ENERGIZED (COM -> NO)' : 'IDLE (COM -> NC)'}
            </span>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">
        <button
          onClick={() => {
            soundFX.playClick(1.1);
            onRotateComponent(component.id);
          }}
          className="flex flex-col items-center gap-1 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 transition text-[11px]"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
          <span>Rotate</span>
        </button>

        <button
          onClick={() => {
            soundFX.playConnect();
            onDuplicateComponent(component);
          }}
          className="flex flex-col items-center gap-1 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 transition text-[11px]"
          title="Duplicate Component"
        >
          <Copy className="w-4 h-4 text-emerald-400" />
          <span>Clone</span>
        </button>

        <button
          onClick={() => {
            soundFX.playDisconnect();
            onDeleteComponent(component.id);
          }}
          className="flex flex-col items-center gap-1 p-2 bg-slate-800/80 hover:bg-red-950/50 hover:text-red-300 rounded-xl text-slate-300 transition text-[11px]"
          title="Delete Component"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
