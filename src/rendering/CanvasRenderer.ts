// ============================================================================
// ElectroCraft High-Performance Canvas 2D Renderer
// Supports Dual Mode: Realistic Workbench & IEEE Schematic / Blueprint
// Includes Draggable Silicone Cables, Probes, Inductors, Relays, & AC Sources
// ============================================================================

import {
  CircuitComponent,
  CircuitWire,
  CircuitPin,
  SimulationResult,
  ViewMode,
  MultimeterState,
  OscilloscopeState,
} from '../types/circuit';
import { getComponentPins } from '../engine/ComponentRegistry';
import { ParticleSystem } from '../engine/Particles';

// IEC 60062 resistor color codes
const RESISTOR_COLORS = [
  '#0f172a', // 0 Black
  '#78350f', // 1 Brown
  '#dc2626', // 2 Red
  '#ea580c', // 3 Orange
  '#eab308', // 4 Yellow
  '#16a34a', // 5 Green
  '#2563eb', // 6 Blue
  '#9333ea', // 7 Violet
  '#64748b', // 8 Gray
  '#f8fafc', // 9 White
];

function getResistorBands(resistance: number): string[] {
  if (resistance <= 0) return ['#0f172a', '#0f172a', '#0f172a', '#d97706'];
  const rStr = Math.round(resistance).toString();
  let d1 = 1;
  let d2 = 0;
  let mult = 0;

  if (rStr.length >= 2) {
    d1 = parseInt(rStr[0], 10);
    d2 = parseInt(rStr[1], 10);
    mult = rStr.length - 2;
  } else {
    d1 = parseInt(rStr[0], 10);
    d2 = 0;
    mult = 0;
  }

  const c1 = RESISTOR_COLORS[Math.min(9, Math.max(0, d1))];
  const c2 = RESISTOR_COLORS[Math.min(9, Math.max(0, d2))];
  const c3 = RESISTOR_COLORS[Math.min(9, Math.max(0, mult))];
  const c4 = '#d97706'; // Gold 5%

  return [c1, c2, c3, c4];
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  components: CircuitComponent[];
  wires: CircuitWire[];
  simulation: SimulationResult;
  viewMode: ViewMode;
  gridSize: number;
  pan: { x: number; y: number };
  zoom: number;
  selectedComponentId: string | null;
  hoveredPinId: string | null;
  wiringFromPinId: string | null;
  mouseWorldPos: { x: number; y: number };
  multimeter: MultimeterState;
  oscilloscope: OscilloscopeState;
  particleSystem: ParticleSystem;
  draggedProbe?: 'red' | 'black' | 'scope_ch1' | null;
}

export class CanvasRenderer {
  public render(rc: RenderContext): void {
    const { ctx, pan, zoom, viewMode, gridSize } = rc;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Screen shake from explosive reactions or short-circuits
    const shake = rc.particleSystem.getScreenShake();

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.translate(pan.x + shake.x, pan.y + shake.y);
    if (shake.angle !== 0) {
      ctx.rotate(shake.angle);
    }
    ctx.scale(zoom, zoom);

    // 1. Draw Grid / Background
    this.drawBackground(ctx, width, height, pan, zoom, gridSize, viewMode);

    // Pin position cache
    const pinMap = new Map<string, CircuitPin>();
    for (const comp of rc.components) {
      const pins = getComponentPins(comp);
      for (const p of pins) {
        pinMap.set(p.id, p);
      }
    }

    // 2. Draw Wires
    this.drawWires(rc, pinMap);

    // 3. Draw In-Progress Wiring Line
    if (rc.wiringFromPinId) {
      this.drawWiringPreview(rc, pinMap);
    }

    // 4. Draw Components
    for (const comp of rc.components) {
      this.drawComponent(rc, comp);
    }

    // 5. Draw Pins & Hover Indicators
    this.drawPins(rc, pinMap);

    // 6. Draw Electron particles & explosions
    rc.particleSystem.render(ctx);

    // 7. Draw Lab Instrument Probes with Silicone Flying Cables
    this.drawInstrumentProbes(rc, pinMap);

    ctx.restore();
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pan: { x: number; y: number },
    zoom: number,
    gridSize: number,
    mode: ViewMode
  ): void {
    const startX = Math.floor((-pan.x / zoom) / gridSize) * gridSize - gridSize * 2;
    const endX = Math.ceil(((width - pan.x) / zoom) / gridSize) * gridSize + gridSize * 2;
    const startY = Math.floor((-pan.y / zoom) / gridSize) * gridSize - gridSize * 2;
    const endY = Math.ceil(((height - pan.y) / zoom) / gridSize) * gridSize + gridSize * 2;

    if (mode === 'schematic') {
      ctx.fillStyle = '#04101d';
      ctx.fillRect(startX, startY, endX - startX, endY - startY);

      ctx.lineWidth = 1 / zoom;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize * 5) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize * 5) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#080d18';
      ctx.fillRect(startX, startY, endX - startX, endY - startY);

      // Breadboard snap points with 3D recessed socket holes
      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          // Socket cavity
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Internal phosphor-bronze contact leaf
          ctx.fillStyle = '#475569';
          ctx.fillRect(x - 0.7, y - 1.2, 1.4, 2.4);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x - 0.35, y - 0.8, 0.7, 1.6);
        }
      }

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(endX, 0);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.beginPath();
      ctx.moveTo(startX, gridSize * 20);
      ctx.lineTo(endX, gridSize * 20);
      ctx.stroke();
    }
  }

  private drawWires(rc: RenderContext, pinMap: Map<string, CircuitPin>): void {
    const { ctx, wires, gridSize, viewMode, simulation } = rc;

    for (const wire of wires) {
      const fromPin = pinMap.get(wire.fromPinId);
      const toPin = pinMap.get(wire.toPinId);
      if (!fromPin || !toPin) continue;

      const p1x = fromPin.x * gridSize;
      const p1y = fromPin.y * gridSize;
      const p2x = toPin.x * gridSize;
      const p2y = toPin.y * gridSize;

      const isHot = wire.isOverheating || simulation.hasShortCircuit;
      const absCurrent = Math.abs(wire.current);

      ctx.save();

      if (viewMode === 'schematic') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isHot ? '#ef4444' : '#06b6d4';
        if (isHot) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(p1x, p1y, 3, 0, Math.PI * 2);
        ctx.arc(p2x, p2y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (absCurrent > 0.001) {
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2 - 8;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          const iText = absCurrent >= 1 ? `${absCurrent.toFixed(2)}A` : `${(absCurrent * 1000).toFixed(1)}mA`;
          ctx.fillText(iText, mx, my);
        }
      } else {
        const dist = Math.hypot(p2x - p1x, p2y - p1y);
        const droop = Math.min(35, dist * 0.18);
        const midX = (p1x + p2x) / 2;
        const midY = (p1y + p2y) / 2 + droop;

        // 1. Soft 3D drop shadow on breadboard
        ctx.beginPath();
        ctx.moveTo(p1x, p1y + 6);
        ctx.quadraticCurveTo(midX, midY + 9, p2x, p2y + 6);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 6.0;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 2. High current thermal incandescence / normal silicone wire jacket
        let wireStrokeColor = wire.color || '#3b82f6';
        if (isHot) {
          wireStrokeColor = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 18;
        } else if (absCurrent > 0.8) {
          ctx.shadowColor = wireStrokeColor;
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.quadraticCurveTo(midX, midY, p2x, p2y);
        ctx.strokeStyle = wireStrokeColor;
        ctx.lineWidth = 4.8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 3. Longitudinal 3D Specular Highlight Stripe along wire spine
        ctx.beginPath();
        ctx.moveTo(p1x, p1y - 0.8);
        ctx.quadraticCurveTo(midX, midY - 1.2, p2x, p2y - 0.8);
        ctx.strokeStyle = isHot ? 'rgba(254, 240, 138, 0.7)' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // 4. DuPont Jumper Connector Boots at Pin Terminals
        const drawDupontBoot = (x: number, y: number) => {
          // Terminal base shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.arc(x, y + 2, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Molded plastic strain-relief collar
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(x - 3.5, y - 5, 7, 7, 2);
          ctx.fill();
          ctx.stroke();

          // Chrome / Nickel crimp sleeve
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x - 2.5, y - 1, 5, 2);

          // Center phosphor bronze pin contact
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        };

        drawDupontBoot(p1x, p1y);
        drawDupontBoot(p2x, p2y);
      }

      ctx.restore();
    }
  }

  private drawWiringPreview(rc: RenderContext, pinMap: Map<string, CircuitPin>): void {
    const { ctx, wiringFromPinId, mouseWorldPos, gridSize } = rc;
    if (!wiringFromPinId) return;

    const fromPin = pinMap.get(wiringFromPinId);
    if (!fromPin) return;

    const p1x = fromPin.x * gridSize;
    const p1y = fromPin.y * gridSize;
    const p2x = mouseWorldPos.x;
    const p2y = mouseWorldPos.y;

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(p2x, p2y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawComponent(rc: RenderContext, comp: CircuitComponent): void {
    const { ctx, gridSize, viewMode, selectedComponentId, simulation } = rc;
    const cx = comp.x * gridSize;
    const cy = comp.y * gridSize;
    const isSelected = comp.id === selectedComponentId;
    const isBlown = comp.properties.isBlown || simulation.blownComponents.has(comp.id);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((comp.rotation * Math.PI) / 180);

    if (isSelected) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.strokeRect(-gridSize * 2.2, -gridSize * 1.5, gridSize * 4.4, gridSize * 3.0);
    }

    // 3D Ambient Occlusion Shadow in Workbench mode
    if (viewMode === 'workbench') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-gridSize * 1.5, -gridSize * 0.8 + 4, gridSize * 3.0, gridSize * 1.6, 6);
      ctx.fill();
      ctx.restore();
    }

    if (viewMode === 'schematic') {
      this.drawSchematicSymbol(ctx, comp, gridSize, isBlown, simulation);
    } else {
      this.drawWorkbenchBody(ctx, comp, gridSize, isBlown, simulation);
    }

    if (isBlown) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.arc(0, -gridSize * 1.3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, -gridSize * 1.3);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawWorkbenchBody(
    ctx: CanvasRenderingContext2D,
    comp: CircuitComponent,
    gridSize: number,
    isBlown: boolean,
    sim: SimulationResult
  ): void {
    const g = gridSize;

    switch (comp.type) {
      // ----------------------------------------------------------------------
      // 1. 3D 9V HEAVY DUTY DC BATTERY
      // ----------------------------------------------------------------------
      case 'battery': {
        const v = comp.properties.voltage ?? 9;

        // Terminal lead straps extending to breadboard snap pins (-2, 0) and (+2, 0)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 1.6, 0);
        ctx.moveTo(g * 1.6, 0);
        ctx.lineTo(g * 2, 0);
        ctx.stroke();

        // Lead specular line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-g * 2, -0.6);
        ctx.lineTo(-g * 1.6, -0.6);
        ctx.moveTo(g * 1.6, -0.6);
        ctx.lineTo(g * 2, -0.6);
        ctx.stroke();

        // 3D Charcoal casing with beveled corners
        const bodyGrad = ctx.createLinearGradient(0, -g * 1.25, 0, g * 1.25);
        bodyGrad.addColorStop(0, '#334155');
        bodyGrad.addColorStop(0.2, '#1e293b');
        bodyGrad.addColorStop(0.8, '#0f172a');
        bodyGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-g * 1.8, -g * 1.25, g * 3.6, g * 2.5, 6);
        ctx.fill();
        ctx.stroke();

        // Top chamfer specular reflection
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-g * 1.6, -g * 1.15);
        ctx.lineTo(g * 1.6, -g * 1.15);
        ctx.stroke();

        // Embossed Metallic Gold Foil Label
        const goldGrad = ctx.createLinearGradient(0, -g * 0.45, 0, g * 0.45);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.25, '#f59e0b');
        goldGrad.addColorStop(0.7, '#ca8a04');
        goldGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = goldGrad;
        ctx.fillRect(-g * 1.8, -g * 0.45, g * 3.6, g * 0.9);

        // Gold foil highlight streak
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(-g * 1.8, -g * 0.4, g * 3.6, 1.5);

        // Crisp Label Typography
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${v}V DC HEAVY DUTY`, 0, 0);

        // 3D Hexagonal Negative (-) Snap Terminal on Left
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(-g * 1.1, -g * 0.7, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(-g * 1.1, -g * 0.7, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-g * 1.1, -g * 0.7, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('-', -g * 1.1, g * 0.85);

        // 3D Circular Crown Positive (+) Snap Terminal on Right
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(g * 1.1, -g * 0.7, 6.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(g * 1.1, -g * 0.7, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(g * 1.1, -g * 0.7, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('+', g * 1.1, g * 0.85);
        break;
      }

      // ----------------------------------------------------------------------
      // 2. 3D BENCHTOP AC SIGNAL GENERATOR
      // ----------------------------------------------------------------------
      case 'ac_source': {
        // Leads
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 1.9, 0);
        ctx.moveTo(g * 1.9, 0);
        ctx.lineTo(g * 2, 0);
        ctx.stroke();

        // Industrial bench chassis with brushed dark slate/cyan texture
        const acGrad = ctx.createLinearGradient(0, -g * 1.4, 0, g * 1.4);
        acGrad.addColorStop(0, '#1e293b');
        acGrad.addColorStop(0.5, '#0f172a');
        acGrad.addColorStop(1, '#020617');
        ctx.fillStyle = acGrad;
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-g * 2.1, -g * 1.4, g * 4.2, g * 2.8, 6);
        ctx.fill();
        ctx.stroke();

        // Cooling vents on top
        ctx.fillStyle = '#020617';
        for (let i = -3; i <= 3; i++) {
          ctx.fillRect(i * 8 - 2, -g * 1.3, 4, 2);
        }

        // Phosphor LCD Matrix Screen
        ctx.fillStyle = '#022c22';
        ctx.fillRect(-g * 1.8, -g * 1.1, g * 3.6, g * 1.3);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1;
        ctx.strokeRect(-g * 1.8, -g * 1.1, g * 3.6, g * 1.3);

        // Animated Oscillating Phosphor Waveform
        const wave = comp.properties.waveType || 'sine';
        const freq = comp.properties.frequency ?? 60;
        const vpp = comp.properties.voltage ?? 5;
        const timePhase = sim.simTime * 6;

        ctx.save();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const startWaveX = -g * 1.6;
        const waveWidth = g * 3.2;
        const waveMidY = -g * 0.55;

        for (let x = 0; x <= waveWidth; x += 2) {
          const t = (x / waveWidth) * Math.PI * 4 + timePhase;
          let wy = 0;
          if (wave === 'square') {
            wy = Math.sin(t) >= 0 ? -g * 0.35 : g * 0.35;
          } else if (wave === 'triangle') {
            wy = (Math.asin(Math.sin(t)) / (Math.PI / 2)) * g * 0.35;
          } else {
            wy = Math.sin(t) * g * 0.35;
          }
          if (x === 0) ctx.moveTo(startWaveX + x, waveMidY + wy);
          else ctx.lineTo(startWaveX + x, waveMidY + wy);
        }
        ctx.stroke();
        ctx.restore();

        // Screen readout
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${freq}Hz  ${vpp}Vpp`, 0, -g * 0.15);

        // BNC Terminals and Knurled Knobs on Bottom Face
        // Left GND BNC Terminal
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(-g * 1.2, g * 0.65, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-g * 1.2, g * 0.65, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Right RF Out BNC Terminal
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(g * 1.2, g * 0.65, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(g * 1.2, g * 0.65, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Center Rotary Knob
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, g * 0.65, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(0, g * 0.65, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // ----------------------------------------------------------------------
      // 3. 3D CERAMIC DUMBBELL RESISTOR
      // ----------------------------------------------------------------------
      case 'resistor': {
        const rVal = comp.properties.resistance ?? 330;
        const power = sim.componentPower.get(comp.id) ?? 0;
        const isHot = power > 0.25;

        // Axial tinned leads
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 1.15, 0);
        ctx.moveTo(g * 1.15, 0);
        ctx.lineTo(g * 2, 0);
        ctx.stroke();

        // Lead specular line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-g * 2, -0.6);
        ctx.lineTo(-g * 1.15, -0.6);
        ctx.moveTo(g * 1.15, -0.6);
        ctx.lineTo(g * 2, -0.6);
        ctx.stroke();

        // Dumbbell Ceramic Body
        if (isBlown) {
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#44403c';
        } else if (isHot) {
          ctx.fillStyle = '#ea580c';
          ctx.strokeStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
        } else {
          const resGrad = ctx.createLinearGradient(0, -g * 0.45, 0, g * 0.45);
          resGrad.addColorStop(0, '#fef08a');
          resGrad.addColorStop(0.3, '#fde047');
          resGrad.addColorStop(0.7, '#eab308');
          resGrad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = resGrad;
          ctx.strokeStyle = '#b45309';
        }

        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-g * 1.15, -g * 0.45, g * 2.3, g * 0.9, 5);
        ctx.fill();
        ctx.stroke();

        if (!isBlown) {
          // Specular reflection line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-g * 0.95, -g * 0.25);
          ctx.lineTo(g * 0.95, -g * 0.25);
          ctx.stroke();

          // 3D Toroidal Color Code Bands
          const bands = getResistorBands(rVal);
          const bandOffsets = [-g * 0.75, -g * 0.35, g * 0.05, g * 0.55];
          bands.forEach((color, i) => {
            // Band shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(bandOffsets[i] - 1, -g * 0.45, 1, g * 0.9);

            // Band body
            ctx.fillStyle = color;
            ctx.fillRect(bandOffsets[i], -g * 0.45, g * 0.2, g * 0.9);

            // Specular sheen on band
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(bandOffsets[i], -g * 0.28, g * 0.2, 1.4);
          });
        } else {
          // Burnt scorch core
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(0, 0, g * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 4. 3D 5mm DIFFUSED / WATER-CLEAR LED
      // ----------------------------------------------------------------------
      case 'led': {
        const current = sim.branchCurrents.get(comp.id) ?? 0;
        const isEmitting = current > 0.001 && !isBlown;
        const colorName = comp.properties.color || 'red';

        const colorMap: Record<string, { fill: string; glow: string; core: string }> = {
          red: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.85)', core: '#fca5a5' },
          green: { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.85)', core: '#86efac' },
          blue: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.85)', core: '#93c5fd' },
          yellow: { fill: '#eab308', glow: 'rgba(234, 179, 8, 0.85)', core: '#fef08a' },
        };
        const active = colorMap[colorName] || colorMap.red;

        // Silver Leads
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.45, 0);
        ctx.moveTo(g * 0.45, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // 1. Breadboard Surface Light Spill Corona when Emitting
        if (isEmitting) {
          const intensity = Math.max(0.1, Math.min(1.0, Math.abs(current) / 0.02));
          const outerR = Math.max(10, g * 2.8 * intensity);
          const innerR = Math.max(2, g * 0.3);
          const glowGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
          glowGrad.addColorStop(0, active.glow);
          glowGrad.addColorStop(0.4, active.glow.replace('0.85', '0.4'));
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, outerR, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Flanged Epoxy Dome Base
        ctx.fillStyle = isBlown ? '#1c1917' : '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Flat cathode notch rim on right
        ctx.fillStyle = isBlown ? '#0a0a0a' : '#334155';
        ctx.fillRect(g * 0.52, -g * 0.5, 3, g * 1.0);

        // 3. Convex Epoxy Dome with Internal Scattering
        if (isBlown) {
          ctx.fillStyle = '#292524';
          ctx.strokeStyle = '#44403c';
        } else if (isEmitting) {
          const domeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, g * 0.65);
          domeGrad.addColorStop(0, '#ffffff');
          domeGrad.addColorStop(0.35, active.core);
          domeGrad.addColorStop(0.85, active.fill);
          domeGrad.addColorStop(1, active.fill);
          ctx.fillStyle = domeGrad;
          ctx.strokeStyle = active.fill;
        } else {
          const offGrad = ctx.createRadialGradient(-g * 0.2, -g * 0.2, 0, 0, 0, g * 0.65);
          offGrad.addColorStop(0, active.core);
          offGrad.addColorStop(0.6, active.fill);
          offGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = offGrad;
          ctx.strokeStyle = '#991b1b';
        }

        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 4. Visible Internal Leadframe (Reflector Anvil & Bond Wire)
        if (!isBlown && !isEmitting) {
          ctx.fillStyle = '#cbd5e1';
          // Anvil cup (cathode side)
          ctx.beginPath();
          ctx.moveTo(g * 0.1, -g * 0.2);
          ctx.lineTo(g * 0.25, -g * 0.2);
          ctx.lineTo(g * 0.3, g * 0.2);
          ctx.lineTo(g * 0.1, g * 0.2);
          ctx.fill();

          // Post (anode side)
          ctx.fillRect(-g * 0.25, -g * 0.1, g * 0.15, g * 0.3);

          // Micro bond wire
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-g * 0.1, -g * 0.05);
          ctx.lineTo(g * 0.15, -g * 0.05);
          ctx.stroke();
        }

        // 5. Dual Curved Glass Specular Highlight
        if (!isBlown) {
          // Broad primary gloss arc
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, g * 0.44, -Math.PI * 0.8, -Math.PI * 0.25);
          ctx.stroke();

          // Sharp micro point highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-g * 0.25, -g * 0.25, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 5. 3D RECTIFIER DIODE (DO-41)
      // ----------------------------------------------------------------------
      case 'diode': {
        // Silver axial leads
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.55, 0);
        ctx.moveTo(g * 0.55, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // DO-41 Black Glass/Epoxy Cylinder
        const dGrad = ctx.createLinearGradient(0, -g * 0.38, 0, g * 0.38);
        dGrad.addColorStop(0, '#334155');
        dGrad.addColorStop(0.3, '#1e293b');
        dGrad.addColorStop(0.8, '#0f172a');
        dGrad.addColorStop(1, '#020617');
        ctx.fillStyle = dGrad;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-g * 0.6, -g * 0.38, g * 1.2, g * 0.76, 3);
        ctx.fill();
        ctx.stroke();

        // Silver Cathode Band on Right
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(g * 0.2, -g * 0.38, g * 0.22, g * 0.76);

        // Specular line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-g * 0.5, -g * 0.2);
        ctx.lineTo(g * 0.5, -g * 0.2);
        ctx.stroke();
        break;
      }

      // ----------------------------------------------------------------------
      // 6. 3D ALUMINUM ELECTROLYTIC CAN CAPACITOR
      // ----------------------------------------------------------------------
      case 'capacitor': {
        // Silver leads
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.45, 0);
        ctx.moveTo(g * 0.45, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // Cylindrical aluminum sleeve (deep navy blue)
        const capGrad = ctx.createLinearGradient(0, -g * 0.65, 0, g * 0.65);
        capGrad.addColorStop(0, '#1e3a8a');
        capGrad.addColorStop(0.3, '#1e40af');
        capGrad.addColorStop(0.7, '#172554');
        capGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = isBlown ? '#1c1917' : capGrad;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-g * 0.65, -g * 0.6, g * 1.3, g * 1.2, 4);
        ctx.fill();
        ctx.stroke();

        // Aluminum stamped safety top disc
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(0, -g * 0.6, g * 0.6, g * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Stamped Pressure Relief Vent "K" cross score
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-g * 0.25, -g * 0.6);
        ctx.lineTo(g * 0.25, -g * 0.6);
        ctx.moveTo(0, -g * 0.72);
        ctx.lineTo(0, -g * 0.48);
        ctx.stroke();

        // Polarized Negative White Stripe on Right
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(g * 0.25, -g * 0.6, g * 0.25, g * 1.2);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', g * 0.37, 0);
        break;
      }

      // ----------------------------------------------------------------------
      // 7. 3D POWER INDUCTOR (FERRITE CORE & COPPER COIL)
      // ----------------------------------------------------------------------
      case 'inductor': {
        const iInd = Math.abs(sim.branchCurrents.get(comp.id) ?? 0);

        // Leads
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 1.25, 0);
        ctx.moveTo(g * 1.25, 0);
        ctx.lineTo(g * 2, 0);
        ctx.stroke();

        // Ferrite Spool Core
        const coreGrad = ctx.createLinearGradient(0, -g * 0.35, 0, g * 0.35);
        coreGrad.addColorStop(0, '#475569');
        coreGrad.addColorStop(0.5, '#1e293b');
        coreGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.roundRect(-g * 1.25, -g * 0.35, g * 2.5, g * 0.7, 3);
        ctx.fill();

        // Overlapping 3D Copper Wire Windings
        for (let i = -3; i <= 3; i++) {
          const cx = i * (g * 0.35);
          // Copper wire coil shadow
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, 0, g * 0.52, Math.PI, 0);
          ctx.stroke();

          // Metallic copper body
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3.2;
          ctx.stroke();

          // Specular copper reflection
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, 0, g * 0.52, Math.PI * 0.7, Math.PI * 0.3, true);
          ctx.stroke();
        }

        // Dynamic Electromagnetic Flux Field (Cyan/Violet Aurora)
        if (iInd > 0.005) {
          const fluxOpacity = Math.min(0.8, Math.max(0.2, iInd * 1.5));
          ctx.save();
          ctx.strokeStyle = `rgba(6, 182, 212, ${fluxOpacity})`;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.ellipse(0, 0, g * 1.5, g * 0.85, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, 0, g * 1.8, g * 1.1, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 8. 3D SUB-MINIATURE TOGGLE SWITCH
      // ----------------------------------------------------------------------
      case 'switch': {
        const isClosed = comp.properties.closed ?? false;

        // Terminal leads to (-1, 0) and (+1, 0)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.6, 0);
        ctx.moveTo(g * 0.6, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // Switch base body
        const swGrad = ctx.createLinearGradient(0, -g * 0.6, 0, g * 0.6);
        swGrad.addColorStop(0, '#334155');
        swGrad.addColorStop(0.5, '#1e293b');
        swGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = swGrad;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-g * 0.9, -g * 0.6, g * 1.8, g * 1.2, 4);
        ctx.fill();
        ctx.stroke();

        // Center threaded chrome bushing
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // 3D Chrome Bat Toggle Lever
        const leverX = isClosed ? g * 0.5 : -g * 0.5;
        const leverY = isClosed ? -g * 0.4 : g * 0.4;

        // Lever shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(leverX, leverY + 4);
        ctx.stroke();

        // Chrome lever shaft
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(leverX, leverY);
        ctx.stroke();

        // Chrome bat ball tip
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(leverX, leverY, 4, 0, Math.PI * 2);
        ctx.fill();

        // State indicator LED dot
        ctx.fillStyle = isClosed ? '#22c55e' : '#ef4444';
        ctx.shadowColor = isClosed ? '#22c55e' : '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, -g * 0.42, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // ----------------------------------------------------------------------
      // 9. 3D TACTILE PUSHBUTTON SWITCH
      // ----------------------------------------------------------------------
      case 'pushbutton': {
        const isPressed = comp.properties.closed ?? false;

        // Silver corner leads to pins
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.65, 0);
        ctx.moveTo(g * 0.65, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // Thermoplastic base
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-g * 0.85, -g * 0.85, g * 1.7, g * 1.7, 4);
        ctx.fill();
        ctx.stroke();

        // Stainless steel retaining top plate with corner rivets
        ctx.fillStyle = '#475569';
        ctx.fillRect(-g * 0.7, -g * 0.7, g * 1.4, g * 1.4);
        ctx.fillStyle = '#94a3b8';
        // 4 corner rivet dimples
        ctx.fillRect(-g * 0.65, -g * 0.65, 2, 2);
        ctx.fillRect(g * 0.65 - 2, -g * 0.65, 2, 2);
        ctx.fillRect(-g * 0.65, g * 0.65 - 2, 2, 2);
        ctx.fillRect(g * 0.65 - 2, g * 0.65 - 2, 2, 2);

        // Center circular actuator plunger
        const btnRadius = isPressed ? g * 0.42 : g * 0.52;
        const btnGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, btnRadius);
        btnGrad.addColorStop(0, '#fca5a5');
        btnGrad.addColorStop(0.3, '#ef4444');
        btnGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = isPressed ? '#991b1b' : btnGrad;
        ctx.beginPath();
        ctx.arc(0, 0, btnRadius, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight on button
        if (!isPressed) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(-btnRadius * 0.35, -btnRadius * 0.35, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 10. 3D ROTARY POTENTIOMETER / TRIMPOT
      // ----------------------------------------------------------------------
      case 'potentiometer': {
        const val = comp.properties.sliderValue ?? 0.5;

        // Terminal leads to pins: A(-2, -1), W(0, 1), B(2, -1)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g * 2, -g);
        ctx.lineTo(-g * 1.2, -g * 0.6);
        ctx.moveTo(g * 2, -g);
        ctx.lineTo(g * 1.2, -g * 0.6);
        ctx.moveTo(0, g);
        ctx.lineTo(0, g * 0.8);
        ctx.stroke();

        // Blue square trimpot housing
        const potGrad = ctx.createLinearGradient(0, -g * 1.2, 0, g * 1.2);
        potGrad.addColorStop(0, '#0284c7');
        potGrad.addColorStop(0.6, '#0369a1');
        potGrad.addColorStop(1, '#075985');
        ctx.fillStyle = potGrad;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-g * 1.4, -g * 1.1, g * 2.8, g * 2.2, 5);
        ctx.fill();
        ctx.stroke();

        // 3D Knurled Rotary Dial Knob
        // Outer knurling ring
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, -g * 0.1, g * 0.82, 0, Math.PI * 2);
        ctx.fill();

        // Knurling ridges
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * g * 0.68, -g * 0.1 + Math.sin(a) * g * 0.68);
          ctx.lineTo(Math.cos(a) * g * 0.82, -g * 0.1 + Math.sin(a) * g * 0.82);
          ctx.stroke();
        }

        // Brushed metallic center top disc
        const knobCenterGrad = ctx.createRadialGradient(0, -g * 0.1, 0, 0, -g * 0.1, g * 0.65);
        knobCenterGrad.addColorStop(0, '#f8fafc');
        knobCenterGrad.addColorStop(0.5, '#cbd5e1');
        knobCenterGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = knobCenterGrad;
        ctx.beginPath();
        ctx.arc(0, -g * 0.1, g * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Indicator Arrow Pointer Notch
        const angle = -Math.PI * 0.75 + val * Math.PI * 1.5;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -g * 0.1);
        ctx.lineTo(Math.cos(angle) * g * 0.58, -g * 0.1 + Math.sin(angle) * g * 0.58);
        ctx.stroke();

        // Value text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(val * 100)}%`, 0, g * 0.85);
        break;
      }

      // ----------------------------------------------------------------------
      // 11. 3D PHOTORESISTOR (LDR)
      // ----------------------------------------------------------------------
      case 'ldr': {
        const lux = comp.properties.sliderValue ?? 0.5;

        // Leads to (-1, 0) and (+1, 0)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.55, 0);
        ctx.moveTo(g * 0.55, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // Ambient Light Aura (Sun Glow)
        const glowR = g * (0.8 + lux * 0.6);
        const ldrGlow = ctx.createRadialGradient(0, 0, g * 0.5, 0, 0, glowR);
        ldrGlow.addColorStop(0, `rgba(245, 158, 11, ${lux * 0.6})`);
        ldrGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = ldrGlow;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fill();

        // White Ceramic Disc Substrate
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Serpentine Cadmium Sulfide (CdS) Zigzag Track
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-g * 0.45, -g * 0.35);
        ctx.lineTo(g * 0.45, -g * 0.35);
        ctx.lineTo(g * 0.45, -g * 0.15);
        ctx.lineTo(-g * 0.45, -g * 0.15);
        ctx.lineTo(-g * 0.45, g * 0.05);
        ctx.lineTo(g * 0.45, g * 0.05);
        ctx.lineTo(g * 0.45, g * 0.25);
        ctx.lineTo(-g * 0.45, g * 0.25);
        ctx.stroke();

        // Protective clear epoxy gloss highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.5, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.stroke();
        break;
      }

      // ----------------------------------------------------------------------
      // 12. 3D PIEZOELECTRIC BUZZER
      // ----------------------------------------------------------------------
      case 'buzzer': {
        const isActive = sim.buzzerActive;

        // Silver leads to (-1, 0) and (+1, 0)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.75, 0);
        ctx.moveTo(g * 0.75, 0);
        ctx.lineTo(g, 0);
        ctx.stroke();

        // Cylindrical PBT Cavity
        const bzGrad = ctx.createRadialGradient(-g * 0.2, -g * 0.2, 0, 0, 0, g * 0.95);
        bzGrad.addColorStop(0, '#334155');
        bzGrad.addColorStop(0.6, '#0f172a');
        bzGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bzGrad;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Acoustic sound emission aperture
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Internal silver piezo diaphragm disc
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Polarity markers
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', -g * 0.65, 0);

        // Animated Acoustic Sound Waves pulsing outward
        if (isActive) {
          const tPulse = (sim.simTime * 8) % 1;
          ctx.save();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 8;
          for (let w = 1; w <= 3; w++) {
            const wr = g * 0.95 + ((tPulse + w * 0.33) % 1) * g * 1.4;
            const wAlpha = 1 - ((tPulse + w * 0.33) % 1);
            ctx.globalAlpha = Math.max(0, wAlpha * 0.8);
            ctx.beginPath();
            ctx.arc(0, 0, wr, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 13. 3D TRANSPARENT MINIATURE RELAY
      // ----------------------------------------------------------------------
      case 'relay': {
        const isEng = comp.properties.relayEnergized ?? false;

        // Terminal pins: coil1(-2,-1), coil2(-2,1), com(0,0), nc(2,-1), no(2,1)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-g * 2, -g);
        ctx.lineTo(-g * 1.5, -g * 0.6);
        ctx.moveTo(-g * 2, g);
        ctx.lineTo(-g * 1.5, g * 0.6);
        ctx.moveTo(g * 2, -g);
        ctx.lineTo(g * 1.5, -g * 0.6);
        ctx.moveTo(g * 2, g);
        ctx.lineTo(g * 1.5, g * 0.6);
        ctx.stroke();

        // Clear Polycarbonate Cube Enclosure with Refraction
        ctx.fillStyle = isEng ? 'rgba(6, 78, 59, 0.85)' : 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = isEng ? '#22c55e' : '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-g * 1.8, -g * 1.4, g * 3.6, g * 2.8, 5);
        ctx.fill();
        ctx.stroke();

        // Visible internal copper wire coil bobbin
        const coilGrad = ctx.createLinearGradient(-g * 1.4, 0, -g * 0.4, 0);
        coilGrad.addColorStop(0, '#b45309');
        coilGrad.addColorStop(0.5, '#f59e0b');
        coilGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = coilGrad;
        ctx.beginPath();
        ctx.roundRect(-g * 1.5, -g * 0.9, g * 0.9, g * 1.8, 3);
        ctx.fill();

        // Movable silver alloy contact armature
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0); // COM
        ctx.lineTo(g * 1.2, isEng ? g * 0.75 : -g * 0.75); // NO or NC
        ctx.stroke();

        // Fixed contact contacts
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(g * 1.1, -g * 0.9, 4, 4); // NC
        ctx.fillRect(g * 1.1, g * 0.7, 4, 4); // NO

        // Status LED indicator
        ctx.fillStyle = isEng ? '#22c55e' : '#64748b';
        ctx.shadowColor = isEng ? '#22c55e' : 'transparent';
        ctx.shadowBlur = isEng ? 8 : 0;
        ctx.beginPath();
        ctx.arc(0, -g * 1.0, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // ----------------------------------------------------------------------
      // 14. 3D TO-92 NPN TRANSISTOR
      // ----------------------------------------------------------------------
      case 'transistor_npn': {
        // Silver leads to B(-1, 0), C(1, -1), E(1, 1)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-g, 0);
        ctx.lineTo(-g * 0.5, 0);
        ctx.moveTo(g, -g);
        ctx.lineTo(g * 0.5, -g * 0.3);
        ctx.moveTo(g, g);
        ctx.lineTo(g * 0.5, g * 0.3);
        ctx.stroke();

        // TO-92 D-profile black epoxy package
        const toGrad = ctx.createLinearGradient(-g * 0.6, 0, g * 0.6, 0);
        toGrad.addColorStop(0, '#334155');
        toGrad.addColorStop(0.5, '#1e293b');
        toGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = toGrad;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.7, Math.PI * 0.25, Math.PI * 1.75);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Flat face beveled highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(g * 0.48, -g * 0.45);
        ctx.lineTo(g * 0.48, g * 0.45);
        ctx.stroke();

        // Laser-etched text
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2N3904', 0, 0);
        break;
      }

      // ----------------------------------------------------------------------
      // 15. 3D DUAL IN-LINE (DIP) IC CHIPS (NE555 & 74xx LOGIC GATES)
      // ----------------------------------------------------------------------
      case 'timer_555':
      case 'gate_and':
      case 'gate_or':
      case 'gate_not':
      case 'gate_xor': {
        const isTimer = comp.type === 'timer_555';
        const h = isTimer ? g * 3.4 : g * 2.2;
        const w = g * 2.2;

        // Silver stamped gull-wing lead legs extending to breadboard holes
        ctx.fillStyle = '#cbd5e1';
        const pinRows = isTimer ? 4 : 3;
        for (let row = 0; row < pinRows; row++) {
          const py = -h / 2 + (row + 0.5) * (h / pinRows);
          // Left pin
          ctx.fillRect(-w / 2 - 5, py - 1.5, 6, 3);
          // Right pin
          ctx.fillRect(w / 2 - 1, py - 1.5, 6, 3);
        }

        // Molded matte-black epoxy body with beveled top chamfer
        const icGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        icGrad.addColorStop(0, '#1e293b');
        icGrad.addColorStop(0.3, '#0f172a');
        icGrad.addColorStop(0.7, '#0f172a');
        icGrad.addColorStop(1, '#020617');
        ctx.fillStyle = icGrad;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 3);
        ctx.fill();
        ctx.stroke();

        // Pin 1 Index Semicircular Notch on Top Edge
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(0, -h / 2, 5, 0, Math.PI);
        ctx.fill();

        // Pin 1 Index Dot Indentation
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(-w / 2 + 5, -h / 2 + 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Laser-etched Part Number Imprint
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = isTimer
          ? 'NE555P'
          : comp.type === 'gate_and'
          ? 'SN74HC08'
          : comp.type === 'gate_or'
          ? 'SN74HC32'
          : comp.type === 'gate_not'
          ? 'SN74HC04'
          : 'SN74HC86';
        ctx.fillText(label, 0, -2);

        // Tech specs sub-text
        ctx.fillStyle = '#64748b';
        ctx.font = '6px monospace';
        ctx.fillText('TI CMOS', 0, 8);
        break;
      }

      // ----------------------------------------------------------------------
      // 16. 3D CHASSIS GROUND (0V EARTH)
      // ----------------------------------------------------------------------
      case 'ground': {
        // Brass grounding post
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, -g * 0.2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Stepped Earth Grounding Fork
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -g * 0.4);
        ctx.lineTo(0, 0);
        ctx.moveTo(-g * 0.55, 0);
        ctx.lineTo(g * 0.55, 0);
        ctx.moveTo(-g * 0.35, g * 0.22);
        ctx.lineTo(g * 0.35, g * 0.22);
        ctx.moveTo(-g * 0.18, g * 0.44);
        ctx.lineTo(g * 0.18, g * 0.44);
        ctx.stroke();
        break;
      }

      default:
        break;
    }
  }

  private drawSchematicSymbol(
    ctx: CanvasRenderingContext2D,
    comp: CircuitComponent,
    gridSize: number,
    isBlown: boolean,
    sim: SimulationResult
  ): void {
    const g = gridSize;
    ctx.strokeStyle = isBlown ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#38bdf8';

    switch (comp.type) {
      case 'resistor': {
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 1, 0);
        ctx.lineTo(-g * 0.7, -g * 0.4);
        ctx.lineTo(-g * 0.3, g * 0.4);
        ctx.lineTo(g * 0.1, -g * 0.4);
        ctx.lineTo(g * 0.5, g * 0.4);
        ctx.lineTo(g * 0.8, -g * 0.4);
        ctx.lineTo(g * 1, 0);
        ctx.lineTo(g * 2, 0);
        ctx.stroke();

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${comp.properties.resistance ?? 330}Ω`, -g * 0.8, -g * 0.7);
        break;
      }

      case 'ac_source': {
        ctx.beginPath();
        ctx.arc(0, 0, g * 0.8, 0, Math.PI * 2);
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 0.8, 0);
        ctx.moveTo(g * 0.8, 0);
        ctx.lineTo(g * 2, 0);
        // Sine symbol inside
        ctx.moveTo(-g * 0.4, 0);
        ctx.quadraticCurveTo(-g * 0.2, -g * 0.5, 0, 0);
        ctx.quadraticCurveTo(g * 0.2, g * 0.5, g * 0.4, 0);
        ctx.stroke();
        break;
      }

      case 'inductor': {
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 1.2, 0);
        ctx.moveTo(g * 1.2, 0);
        ctx.lineTo(g * 2, 0);
        for (let i = -2; i <= 1; i++) {
          ctx.arc(i * (g * 0.6) + g * 0.3, 0, g * 0.3, Math.PI, 0);
        }
        ctx.stroke();
        break;
      }

      case 'battery': {
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0);
        ctx.lineTo(-g * 0.4, 0);
        ctx.moveTo(g * 0.4, 0);
        ctx.lineTo(g * 2, 0);
        ctx.moveTo(-g * 0.4, -g * 0.3);
        ctx.lineTo(-g * 0.4, g * 0.3);
        ctx.moveTo(g * 0.4, -g * 0.7);
        ctx.lineTo(g * 0.4, g * 0.7);
        ctx.stroke();

        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText('+', g * 0.6, -g * 0.5);
        ctx.fillText(`${comp.properties.voltage ?? 9}V`, -g * 0.6, -g * 0.9);
        break;
      }

      case 'led':
      case 'diode': {
        ctx.beginPath();
        ctx.moveTo(-g * 1, 0);
        ctx.lineTo(-g * 0.4, 0);
        ctx.moveTo(g * 0.4, 0);
        ctx.lineTo(g * 1, 0);
        ctx.moveTo(-g * 0.4, -g * 0.5);
        ctx.lineTo(g * 0.4, 0);
        ctx.lineTo(-g * 0.4, g * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.moveTo(g * 0.4, -g * 0.5);
        ctx.lineTo(g * 0.4, g * 0.5);
        ctx.stroke();

        if (comp.type === 'led') {
          ctx.beginPath();
          ctx.moveTo(0, -g * 0.5);
          ctx.lineTo(g * 0.3, -g * 0.9);
          ctx.moveTo(g * 0.3, -g * 0.4);
          ctx.lineTo(g * 0.6, -g * 0.8);
          ctx.stroke();
        }
        break;
      }

      case 'capacitor': {
        ctx.beginPath();
        ctx.moveTo(-g * 1, 0);
        ctx.lineTo(-g * 0.2, 0);
        ctx.moveTo(g * 0.2, 0);
        ctx.lineTo(g * 1, 0);
        ctx.moveTo(-g * 0.2, -g * 0.6);
        ctx.lineTo(-g * 0.2, g * 0.6);
        ctx.moveTo(g * 0.2, -g * 0.6);
        ctx.lineTo(g * 0.2, g * 0.6);
        ctx.stroke();
        break;
      }

      case 'switch': {
        const isClosed = comp.properties.closed ?? false;
        ctx.beginPath();
        ctx.moveTo(-g * 1, 0);
        ctx.lineTo(-g * 0.4, 0);
        ctx.moveTo(g * 0.4, 0);
        ctx.lineTo(g * 1, 0);
        ctx.moveTo(-g * 0.4, 0);
        ctx.lineTo(g * 0.4, isClosed ? 0 : -g * 0.45);
        ctx.stroke();
        break;
      }

      case 'ground': {
        ctx.beginPath();
        ctx.moveTo(0, -g * 0.4);
        ctx.lineTo(0, 0);
        ctx.moveTo(-g * 0.5, 0);
        ctx.lineTo(g * 0.5, 0);
        ctx.moveTo(-g * 0.3, g * 0.2);
        ctx.lineTo(g * 0.3, g * 0.2);
        ctx.moveTo(-g * 0.1, g * 0.4);
        ctx.lineTo(g * 0.1, g * 0.4);
        ctx.stroke();
        break;
      }

      default:
        this.drawWorkbenchBody(ctx, comp, gridSize, isBlown, sim);
        break;
    }
  }

  private drawPins(rc: RenderContext, pinMap: Map<string, CircuitPin>): void {
    const { ctx, gridSize, hoveredPinId, wiringFromPinId } = rc;

    for (const [, pin] of pinMap) {
      const px = pin.x * gridSize;
      const py = pin.y * gridSize;
      const isHovered = pin.id === hoveredPinId;
      const isWiringSource = pin.id === wiringFromPinId;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, isHovered || isWiringSource ? 5.5 : 3.0, 0, Math.PI * 2);

      if (isWiringSource) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      } else if (isHovered) {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      }

      ctx.fill();
      ctx.restore();
    }
  }

  private drawInstrumentProbes(rc: RenderContext, pinMap: Map<string, CircuitPin>): void {
    const { ctx, multimeter, oscilloscope, gridSize, pan, zoom } = rc;

    // Helper: convert screen coordinate to world coordinate
    const toWorld = (sx: number, sy: number) => ({
      x: (sx - pan.x) / zoom,
      y: (sy - pan.y) / zoom,
    });

    // 1. Digital Multimeter Probes & Flexible Silicone Cables
    if (multimeter.enabled) {
      let redX = multimeter.redProbe.x;
      let redY = multimeter.redProbe.y;
      if (multimeter.redProbe.attachedPinId && pinMap.has(multimeter.redProbe.attachedPinId)) {
        const pin = pinMap.get(multimeter.redProbe.attachedPinId)!;
        redX = pin.x * gridSize;
        redY = pin.y * gridSize;
      }

      let blackX = multimeter.blackProbe.x;
      let blackY = multimeter.blackProbe.y;
      if (multimeter.blackProbe.attachedPinId && pinMap.has(multimeter.blackProbe.attachedPinId)) {
        const pin = pinMap.get(multimeter.blackProbe.attachedPinId)!;
        blackX = pin.x * gridSize;
        blackY = pin.y * gridSize;
      }

      // Origin points on DMM terminal sockets
      const dmmRedOrigin = toWorld(multimeter.x + 70, multimeter.y + 320);
      const dmmBlackOrigin = toWorld(multimeter.x + 180, multimeter.y + 320);

      // Draw Red Curly Cable
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dmmRedOrigin.x, dmmRedOrigin.y);
      const rDist = Math.hypot(redX - dmmRedOrigin.x, redY - dmmRedOrigin.y);
      const rMidX = (dmmRedOrigin.x + redX) / 2;
      const rMidY = (dmmRedOrigin.y + redY) / 2 + Math.min(80, rDist * 0.35);
      ctx.quadraticCurveTo(rMidX, rMidY, redX, redY);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Draw Black Curly Cable
      ctx.beginPath();
      ctx.moveTo(dmmBlackOrigin.x, dmmBlackOrigin.y);
      const bDist = Math.hypot(blackX - dmmBlackOrigin.x, blackY - dmmBlackOrigin.y);
      const bMidX = (dmmBlackOrigin.x + blackX) / 2;
      const bMidY = (dmmBlackOrigin.y + blackY) / 2 + Math.min(80, bDist * 0.35);
      ctx.quadraticCurveTo(bMidX, bMidY, blackX, blackY);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      // Red Probe Handle & Needle Tip
      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(redX, redY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V+', redX, redY);

      // Black Probe Handle & Needle Tip
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#94a3b8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(blackX, blackY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('COM', blackX, blackY);
      ctx.restore();
    }

    // 2. Oscilloscope Probe & Flexible Cable
    if (oscilloscope.enabled) {
      let probeX = oscilloscope.probe.x;
      let probeY = oscilloscope.probe.y;
      if (oscilloscope.probe.attachedPinId && pinMap.has(oscilloscope.probe.attachedPinId)) {
        const pin = pinMap.get(oscilloscope.probe.attachedPinId)!;
        probeX = pin.x * gridSize;
        probeY = pin.y * gridSize;
      }

      const scopeOrigin = toWorld(oscilloscope.x + 80, oscilloscope.y + 260);

      // Yellow BNC Silicone Cable
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scopeOrigin.x, scopeOrigin.y);
      const sDist = Math.hypot(probeX - scopeOrigin.x, probeY - scopeOrigin.y);
      const sMidX = (scopeOrigin.x + probeX) / 2;
      const sMidY = (scopeOrigin.y + probeY) / 2 + Math.min(90, sDist * 0.35);
      ctx.quadraticCurveTo(sMidX, sMidY, probeX, probeY);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Probe Clip Head
      ctx.fillStyle = '#ca8a04';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(probeX, probeY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CH1', probeX, probeY);
      ctx.restore();
    }
  }
}
