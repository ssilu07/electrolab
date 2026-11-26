import React, { useState } from 'react';
import { CircuitComponent, SimulationResult } from '../types/circuit';
import { COMPONENT_REGISTRY, getComponentPins } from '../engine/ComponentRegistry';
import { ComponentIcon3D } from './icons3d/ComponentIcon3D';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DockedLabHUDProps {
  components: CircuitComponent[];
  selectedComponentId: string | null;
  simulation: SimulationResult;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onSelectComponent: (id: string) => void;
  onUpdateComponent: (id: string, partial: Partial<CircuitComponent['properties']>) => void;
  drawerOpen: boolean;
}

type MeterMode = 'voltage' | 'current' | 'power';

export const DockedLabHUD: React.FC<DockedLabHUDProps> = ({
  components,
  selectedComponentId,
  simulation,
  isSimulating,
  onToggleSimulate,
  onSelectComponent,
  onUpdateComponent,
  drawerOpen,
}) => {
  const [meterMode, setMeterMode] = useState<MeterMode>('voltage');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Auto-pick selected component, or primary LED / output / battery so the card is always informative
  const activeComp =
    components.find((c) => c.id === selectedComponentId) ||
    components.find((c) => c.type === 'led') ||
    components.find((c) => c.type === 'buzzer' || c.type === 'relay') ||
    components.find((c) => c.type === 'battery') ||
    components[0] ||
    null;

  // Compute live supply voltage & active component telemetry
  const primaryBattery = components.find((c) => c.type === 'battery' || c.type === 'ac_source');
  const supplyVoltage = primaryBattery?.properties.voltage ?? 0;

  let compVoltage = 0;
  if (activeComp) {
    const pins = getComponentPins(activeComp);
    if (pins.length >= 2) {
      const v0 = simulation.pinVoltages.get(pins[0].id) ?? 0;
      const v1 = simulation.pinVoltages.get(pins[1].id) ?? 0;
      compVoltage = Math.abs(v0 - v1);
    } else if (activeComp.type === 'battery') {
      compVoltage = activeComp.properties.voltage ?? 9;
    }
  }
  const compCurrent = activeComp ? Math.abs(simulation.branchCurrents.get(activeComp.id) ?? 0) : 0;
  const compPower = activeComp
    ? Math.abs(simulation.componentPower.get(activeComp.id) ?? compVoltage * compCurrent)
    : 0;

  const formatCurrent = (amps: number) =>
    amps >= 1 ? `${amps.toFixed(2)} A` : `${(amps * 1000).toFixed(1)} mA`;

  const formatPower = (watts: number) =>
    watts >= 1 ? `${watts.toFixed(2)} W` : `${(watts * 1000).toFixed(1)} mW`;

  const cycleMeterMode = () => {
    soundFX.playDialTick();
    NativeBridge.haptic('light');
    setMeterMode((prev) => (prev === 'voltage' ? 'current' : prev === 'current' ? 'power' : 'voltage'));
  };

  const dialAngle = meterMode === 'voltage' ? -45 : meterMode === 'current' ? 0 : 45;

  const meterReading =
    meterMode === 'voltage'
      ? `${(isSimulating ? supplyVoltage : 0).toFixed(2)} V`
      : meterMode === 'current'
      ? formatCurrent(isSimulating ? simulation.totalCurrent : 0)
      : formatPower(isSimulating ? simulation.totalPower : 0);

  const meterLabel =
    meterMode === 'voltage' ? 'DC Voltage' : meterMode === 'current' ? 'Total Current' : 'Total Power';

  const meterBadge = meterMode === 'voltage' ? 'V' : meterMode === 'current' ? 'A' : 'W';

  const compMeta = activeComp ? COMPONENT_REGISTRY[activeComp.type] : null;
  const compShortName = compMeta ? compMeta.name.split('(')[0].trim() : 'Circuit';
  const isSwitchLike = activeComp?.type === 'switch' || activeComp?.type === 'pushbutton';
  const toggleOn = isSwitchLike ? Boolean(activeComp?.properties.closed) : isSimulating;

  const handleRightToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick(1.25);
    NativeBridge.haptic('light');
    if (isSwitchLike && activeComp) {
      onUpdateComponent(activeComp.id, { closed: !activeComp.properties.closed });
    } else {
      onToggleSimulate();
    }
  };

  // Position cleanly right above ComponentDrawer (when open) or above the closed "+ Parts & ICs" pill (when drawer closed)
  const bottomExpr = drawerOpen
    ? 'calc(var(--ad-banner-height, 0px) + 256px)'
    : 'calc(var(--ad-banner-height, 0px) + 142px)';

  if (collapsed) {
    return (
      <div
        style={{ bottom: bottomExpr }}
        className="fixed left-3 sm:left-6 z-20 pointer-events-auto select-none transition-[bottom] duration-200"
      >
        <button
          onClick={() => {
            soundFX.playClick();
            setCollapsed(false);
          }}
          className="px-3 py-1.5 rounded-2xl bg-[#0b111e]/95 border border-sky-500/35 text-sky-300 text-xs font-mono font-bold flex items-center gap-2 shadow-xl backdrop-blur-xl active:scale-95 transition"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>{meterReading}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ bottom: bottomExpr }}
      className="fixed left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-xl pointer-events-auto select-none transition-[bottom] duration-200 font-sans"
    >
      <div className="relative grid grid-cols-2 gap-2">
        {/* Collapse Pill */}
        <button
          onClick={() => {
            soundFX.playClick();
            setCollapsed(true);
          }}
          title="Hide Live Meter"
          className="absolute -top-3 right-2 z-10 w-6 h-5 rounded-full bg-[#0d1424] border border-white/15 text-slate-400 hover:text-white flex items-center justify-center shadow-md"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* LEFT CARD: DC Voltage / Live Digital Meter (Image 1 Style) */}
        <div
          onClick={cycleMeterMode}
          title="Tap to cycle Voltage / Current / Power"
          className="rounded-2xl bg-[#0b111e]/92 backdrop-blur-xl border border-white/10 hover:border-sky-400/40 p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.65)] cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-sm shadow-sky-500/40">
              {meterBadge}
            </span>
            <span className="text-[11px] font-bold text-slate-200 truncate">{meterLabel}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Glowing Cyan LCD Screen */}
            <div className="flex-1 rounded-xl bg-[#050912] border border-sky-500/30 px-2 py-1.5 shadow-inner flex items-center justify-center min-w-0">
              <span
                style={{ textShadow: '0 0 12px rgba(56, 189, 248, 0.7)' }}
                className="font-mono font-extrabold text-sm sm:text-base text-sky-300 tracking-tight truncate"
              >
                {meterReading}
              </span>
            </div>

            {/* Tactile Mini Rotary Dial */}
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border border-white/15 shadow-inner flex items-center justify-center shrink-0">
              <div
                style={{ transform: `rotate(${dialAngle}deg)` }}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-start justify-center pt-1 transition-transform duration-200 shadow-md"
              >
                <div className="w-1 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
              </div>
            </div>
          </div>

          {/* Mini Jack Dots */}
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Tap dial: V/A/W</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-500 shadow-inner" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-300 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Live Component Telemetry Card (Image 1 Style) */}
        <div
          onClick={() => {
            if (activeComp) {
              soundFX.playClick();
              onSelectComponent(activeComp.id);
            }
          }}
          title="Tap to inspect component"
          className="rounded-2xl bg-[#0b111e]/92 backdrop-blur-xl border border-white/10 hover:border-emerald-400/40 p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.65)] cursor-pointer transition flex flex-col justify-between"
        >
          {/* Header Row: 3D Icon + Name + Green Toggle */}
          <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 min-w-0">
              {activeComp && (
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <ComponentIcon3D type={activeComp.type} size={24} interactive={false} />
                </div>
              )}
              <span className="text-xs font-extrabold text-white truncate">{compShortName}</span>
            </div>

            {/* Tactile Green Toggle Pill */}
            <button
              onClick={handleRightToggle}
              aria-label="Toggle Power"
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center ${
                toggleOn
                  ? 'bg-emerald-500 justify-end shadow-[0_0_10px_rgba(16,185,129,0.55)]'
                  : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* 3 Clean Telemetry Rows (Voltage / Current / Power) */}
          <div className="space-y-0.5 pt-1 text-[10px] sm:text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Voltage</span>
              <span className="text-slate-100 font-bold">{(isSimulating ? compVoltage : 0).toFixed(2)} V</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current</span>
              <span className="text-sky-300 font-bold">{formatCurrent(isSimulating ? compCurrent : 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Power</span>
              <span className="text-emerald-300 font-bold">{formatPower(isSimulating ? compPower : 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
