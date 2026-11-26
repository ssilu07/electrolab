import React, { useEffect, useState, useRef, memo } from 'react';
import confetti from 'canvas-confetti';
import { CircuitComponent, CircuitWire } from '../types/circuit';
import { getComponentPins } from '../engine/ComponentRegistry';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { useI18n } from '../services/i18nService';
import { Sparkles, Zap, Rotate3d, CheckCircle2, X, Sliders } from 'lucide-react';

export const TUTORIAL_STORAGE_KEY = 'electrolab_tutorial_v1_done';

export type TutorialStep = 'wire_led' | 'tweak_voltage' | 'open_3d' | 'complete';

export const TUTORIAL_CIRCUIT: {
  components: CircuitComponent[];
  wires: CircuitWire[];
} = {
  components: [
    { id: 'tut_bat', type: 'battery', x: -5, y: 0, rotation: 90, properties: { voltage: 9.0 } },
    // 560Ω keeps LED brightly lit and safe across 5V–15V during tutorial exploration
    { id: 'tut_res', type: 'resistor', x: 0, y: -2, rotation: 0, properties: { resistance: 560 } },
    { id: 'tut_led', type: 'led', x: 5, y: 0, rotation: 90, properties: { color: 'amber' } },
    { id: 'tut_gnd', type: 'ground', x: -5, y: 4, rotation: 0, properties: {} },
  ],
  wires: [
    { id: 'tut_w1', fromPinId: 'tut_bat:pos', toPinId: 'tut_res:p1', color: '#ef4444', current: 0 },
    { id: 'tut_w2', fromPinId: 'tut_led:cathode', toPinId: 'tut_bat:neg', color: '#64748b', current: 0 },
    { id: 'tut_w3', fromPinId: 'tut_bat:neg', toPinId: 'tut_gnd:gnd', color: '#64748b', current: 0 },
  ],
};

interface InteractiveTutorialProps {
  active: boolean;
  components: CircuitComponent[];
  wires: CircuitWire[];
  pan: { x: number; y: number };
  zoom: number;
  gridSize: number;
  wiringFromPinId: string | null;
  selectedComponentId: string | null;
  activeScreen: string;
  viewMode: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface ScreenPoint {
  x: number;
  y: number;
}

const TUTORIAL_KEYFRAMES = `
@keyframes tutDashFlow {
  from { stroke-dashoffset: 28; }
  to { stroke-dashoffset: 0; }
}
@keyframes tutPulseRing {
  0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.9; }
  50% { transform: translate(-50%, -50%) scale(1.38); opacity: 0.25; }
}
@keyframes tutTapBounce {
  0%, 100% { transform: translate3d(-50%, 6px, 0) scale(1); }
  50% { transform: translate3d(-50%, -6px, 0) scale(0.94); }
}
`;

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = memo(({
  active,
  components,
  wires,
  pan,
  zoom,
  gridSize,
  wiringFromPinId,
  selectedComponentId,
  activeScreen,
  viewMode,
  onComplete,
  onSkip,
}) => {
  const { lang } = useI18n();
  const [step, setStep] = useState<TutorialStep>('wire_led');
  const [stepBanner, setStepBanner] = useState<string | null>(null);
  const [tab3DRect, setTab3DRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const initialVoltageRef = useRef<number>(9.0);
  const confettiFiredRef = useRef<boolean>(false);
  const glideHandRef = useRef<HTMLDivElement>(null);

  // Reset internal state whenever tutorial becomes active
  useEffect(() => {
    if (active) {
      setStep('wire_led');
      setStepBanner(null);
      initialVoltageRef.current = 9.0;
      confettiFiredRef.current = false;
    }
  }, [active]);

  // Helper: convert world coordinates to viewport pixel coordinates
  const worldToScreen = (wx: number, wy: number): ScreenPoint => ({
    x: wx * zoom + pan.x,
    y: wy * zoom + pan.y,
  });

  const getPinScreenPos = (pinId: string): ScreenPoint | null => {
    const compId = pinId.split(':')[0];
    const comp = components.find((c) => c.id === compId);
    if (!comp) return null;
    const pin = getComponentPins(comp).find((p) => p.id === pinId);
    if (!pin) return null;
    return worldToScreen(pin.x * gridSize, pin.y * gridSize);
  };

  const getCompScreenPos = (compId: string): ScreenPoint | null => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return null;
    return worldToScreen(comp.x * gridSize, comp.y * gridSize);
  };

  const pinStart = active ? getPinScreenPos('tut_res:p2') : null;
  const pinEnd = active ? getPinScreenPos('tut_led:anode') : null;
  const batPos = active ? getCompScreenPos('tut_bat') : null;
  const isWiringFromRes = wiringFromPinId === 'tut_res:p2';
  const isWiringFromLed = wiringFromPinId === 'tut_led:anode';
  const isBatSelected = selectedComponentId === 'tut_bat';

  // Silky 60/120 FPS GPU transform loop for the gliding hand in Step 1 (zero React re-renders!)
  useEffect(() => {
    if (!active || step !== 'wire_led' || !pinStart || !pinEnd) return;
    if (isWiringFromRes || isWiringFromLed) return;

    const sx = pinStart.x;
    const sy = pinStart.y;
    const ex = pinEnd.x;
    const ey = pinEnd.y;
    const cx = (sx + ex) / 2;
    const cy = Math.min(sy, ey) - 44;

    let rafId = 0;
    const durationMs = 1550;
    const startTime = performance.now();

    const tick = (now: number) => {
      const el = glideHandRef.current;
      if (el) {
        const raw = ((now - startTime) % durationMs) / durationMs;
        // Smooth ease-in-out cubic curve with brief pause at endpoints
        const t =
          raw < 0.12
            ? 0
            : raw > 0.88
            ? 1
            : (() => {
                const u = (raw - 0.12) / 0.76;
                return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
              })();

        const inv = 1 - t;
        const x = inv * inv * sx + 2 * inv * t * cx + t * t * ex;
        const y = inv * inv * sy + 2 * inv * t * cy + t * t * ey;
        const scale = raw < 0.12 || raw > 0.88 ? 0.9 : 1.05;

        el.style.transform = `translate3d(${x}px, ${y + 6}px, 0) translate(-35%, 0) scale(${scale})`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    active,
    step,
    isWiringFromRes,
    isWiringFromLed,
    pinStart?.x,
    pinStart?.y,
    pinEnd?.x,
    pinEnd?.y,
  ]);

  // Detect Step 1 completion: wire connected between tut_res:p2 and tut_led:anode
  useEffect(() => {
    if (!active || step !== 'wire_led') return;
    const connected = wires.some(
      (w) =>
        (w.fromPinId === 'tut_res:p2' && w.toPinId === 'tut_led:anode') ||
        (w.fromPinId === 'tut_led:anode' && w.toPinId === 'tut_res:p2')
    );
    if (connected) {
      soundFX.playVictory();
      NativeBridge.haptic('success');
      setStepBanner(lang === 'hi' ? '⚡ बढ़िया! LED जल उठी!' : '⚡ Nice! LED Lit Up!');
      const timer = setTimeout(() => {
        setStepBanner(null);
        setStep('tweak_voltage');
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [active, step, wires, lang]);

  // Detect Step 2 completion: user changed battery voltage
  useEffect(() => {
    if (!active || step !== 'tweak_voltage') return;
    const bat = components.find((c) => c.id === 'tut_bat');
    if (bat && typeof bat.properties.voltage === 'number' && Math.abs(bat.properties.voltage - initialVoltageRef.current) >= 0.4) {
      soundFX.playVictory();
      NativeBridge.haptic('success');
      setStepBanner(lang === 'hi' ? '🔥 वोल्टेज कंट्रोल सीख लिया!' : '🔥 Voltage Control Mastered!');
      const timer = setTimeout(() => {
        setStepBanner(null);
        setStep('open_3d');
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [active, step, components, lang]);

  // Measure 3D Lab tab DOM rect for Step 3 spotlight (no polling interval!)
  useEffect(() => {
    if (!active || step !== 'open_3d') return;
    const updateRect = () => {
      const el = document.querySelector('[data-tutorial-target="3d-tab"]');
      if (el) {
        const r = el.getBoundingClientRect();
        setTab3DRect({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
    };
    const raf = requestAnimationFrame(updateRect);
    window.addEventListener('resize', updateRect);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateRect);
    };
  }, [active, step]);

  // Detect Step 3 completion: user opened 3D Lab
  useEffect(() => {
    if (!active || step !== 'open_3d') return;
    if (activeScreen === '3d' || viewMode === '3d') {
      soundFX.playVictory();
      NativeBridge.haptic('success');
      setStep('complete');
      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        try {
          confetti({
            particleCount: 65,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#22d3ee', '#fbbf24', '#34d399', '#a855f7'],
          });
        } catch {
          // ignore confetti errors
        }
      }
    }
  }, [active, step, activeScreen, viewMode]);

  if (!active) return null;

  // Step 1: GPU-composited wire guide (pure CSS dash + 60fps translate3d hand)
  const renderWireGuide = () => {
    if (step !== 'wire_led' || !pinStart || !pinEnd) return null;
    const midX = (pinStart.x + pinEnd.x) / 2;
    const midY = Math.min(pinStart.y, pinEnd.y) - 44;
    const pathD = `M ${pinStart.x} ${pinStart.y} Q ${midX} ${midY} ${pinEnd.x} ${pinEnd.y}`;
    const targetPin = isWiringFromRes ? pinEnd : isWiringFromLed ? pinStart : null;

    return (
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        <svg className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="tutArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <marker id="tutArrowHead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#fbbf24" />
            </marker>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke="url(#tutArrowGrad)"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
            markerEnd="url(#tutArrowHead)"
            style={{ animation: 'tutDashFlow 0.75s linear infinite' }}
          />
        </svg>

        {/* GPU Pulsing Ring on Resistor Pin */}
        <div
          style={{
            left: `${pinStart.x}px`,
            top: `${pinStart.y}px`,
            animation: !isWiringFromRes ? 'tutPulseRing 1.1s ease-in-out infinite' : undefined,
            transform: isWiringFromRes ? 'translate(-50%, -50%)' : undefined,
          }}
          className="fixed w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/20 will-change-transform"
        />

        {/* GPU Pulsing Ring on LED Pin */}
        <div
          style={{
            left: `${pinEnd.x}px`,
            top: `${pinEnd.y}px`,
            animation: isWiringFromRes ? 'tutPulseRing 0.9s ease-in-out infinite' : undefined,
            transform: !isWiringFromRes ? 'translate(-50%, -50%)' : undefined,
          }}
          className="fixed w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-400/20 will-change-transform"
        />

        {/* GPU 60 FPS Gliding Hand or Bouncing Tap Hand */}
        {!targetPin ? (
          <div
            ref={glideHandRef}
            style={{ left: 0, top: 0, transform: `translate3d(${pinStart.x}px, ${pinStart.y + 6}px, 0) translate(-35%, 0)` }}
            className="fixed text-2xl leading-none select-none will-change-transform"
          >
            👆
          </div>
        ) : (
          <div
            style={{
              left: `${targetPin.x}px`,
              top: `${targetPin.y + 12}px`,
              animation: 'tutTapBounce 0.75s ease-in-out infinite',
            }}
            className="fixed text-2xl leading-none select-none will-change-transform"
          >
            👆
          </div>
        )}
      </div>
    );
  };

  // Step 2: GPU Pointer on Battery
  const renderBatteryGuide = () => {
    if (step !== 'tweak_voltage' || !batPos || isBatSelected) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        <div
          style={{
            left: `${batPos.x}px`,
            top: `${batPos.y}px`,
            animation: 'tutPulseRing 1.15s ease-in-out infinite',
          }}
          className="fixed w-16 h-16 rounded-full border-2 border-dashed border-cyan-400 bg-cyan-400/15 will-change-transform"
        />
        <div
          style={{
            left: `${batPos.x}px`,
            top: `${batPos.y + 28}px`,
            animation: 'tutTapBounce 0.8s ease-in-out infinite',
          }}
          className="fixed text-2xl leading-none select-none will-change-transform"
        >
          👆
        </div>
      </div>
    );
  };

  // Step 3: GPU Pointer directly above the 3D Lab bottom nav button
  const render3DTabGuide = () => {
    if (step !== 'open_3d' || !tab3DRect) return null;
    const cx = tab3DRect.left + tab3DRect.width / 2;
    const cy = tab3DRect.top - 14;
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        <div
          style={{
            left: `${tab3DRect.left - 4}px`,
            top: `${tab3DRect.top - 4}px`,
            width: `${tab3DRect.width + 8}px`,
            height: `${tab3DRect.height + 8}px`,
          }}
          className="fixed rounded-2xl border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.85)] animate-pulse"
        />
        <div
          style={{ left: `${cx}px`, top: `${cy - 34}px` }}
          className="fixed -translate-x-1/2 flex flex-col items-center animate-bounce will-change-transform"
        >
          <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black shadow-lg whitespace-nowrap mb-1">
            {lang === 'hi' ? 'यहाँ टैप करें!' : 'TAP HERE!'}
          </span>
          <span className="text-2xl leading-none">👇</span>
        </div>
      </div>
    );
  };

  const stepNumber = step === 'wire_led' ? 1 : step === 'tweak_voltage' ? 2 : 3;

  const getInstruction = () => {
    if (stepBanner) return stepBanner;
    if (step === 'wire_led') {
      if (isWiringFromRes) {
        return lang === 'hi'
          ? 'अब चमकते हुए LED पिन पर टैप करके तार जोड़ें ⚡'
          : 'Now tap the glowing LED pin to connect the wire ⚡';
      }
      if (isWiringFromLed) {
        return lang === 'hi'
          ? 'अब चमकते हुए Resistor पिन पर टैप करें ⚡'
          : 'Now tap the glowing Resistor pin to connect ⚡';
      }
      return lang === 'hi'
        ? 'Resistor के पिन पर टैप करें, फिर LED के पिन से जोड़ें'
        : 'Tap the glowing Resistor pin, then tap the LED pin to light it up';
    }
    if (step === 'tweak_voltage') {
      if (isBatSelected) {
        return lang === 'hi'
          ? 'अब Voltage स्लाइडर को थोड़ा कम या ज़्यादा करें!'
          : 'Slide the Voltage control to change LED brightness live!';
      }
      return lang === 'hi'
        ? '9V Battery पर टैप करके उसकी पावर बदलें'
        : 'Tap the 9V Battery on the board to adjust voltage';
    }
    if (step === 'open_3d') {
      return lang === 'hi'
        ? 'नीचे 3D Lab पर टैप करें और अपना सर्किट 3D में देखें!'
        : 'Tap 3D Lab below to inspect your live circuit in 3D!';
    }
    return lang === 'hi'
      ? 'बधाई हो! आपने अपना पहला लाइव सर्किट बना लिया!'
      : 'Awesome! You built and inspected your first live circuit!';
  };

  // Dock HUD at bottom above nav during Step 2 when Battery Inspector is open so it never overlaps Inspector
  const dockAtBottom = step === 'tweak_voltage' && isBatSelected;

  return (
    <>
      <style>{TUTORIAL_KEYFRAMES}</style>
      {renderWireGuide()}
      {renderBatteryGuide()}
      {render3DTabGuide()}

      {/* Compact Mission HUD Pill */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-20px)] max-w-md pointer-events-none transition-all duration-200 ${
          dockAtBottom ? 'bottom-[88px]' : 'top-[62px]'
        }`}
      >
        <div className="pointer-events-auto rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-cyan-400/50 shadow-[0_10px_30px_rgba(6,182,212,0.25)] px-3 py-2.5 flex items-center gap-2.5">
          {/* Step Icon */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30">
            {step === 'wire_led' && <Zap className="w-4 h-4 fill-slate-950" />}
            {step === 'tweak_voltage' && <Sliders className="w-4 h-4" />}
            {step === 'open_3d' && <Rotate3d className="w-4 h-4" />}
            {step === 'complete' && <CheckCircle2 className="w-4 h-4" />}
          </div>

          {/* Step Text + Progress Dots */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {step === 'complete'
                  ? lang === 'hi'
                    ? 'ट्यूटोरियल पूरा!'
                    : 'TUTORIAL COMPLETE'
                  : lang === 'hi'
                  ? `स्टेप ${stepNumber}/3`
                  : `STEP ${stepNumber} OF 3`}
              </span>
              <div className="flex items-center gap-1 ml-1">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step === 'complete' || n < stepNumber
                        ? 'w-3 bg-emerald-400'
                        : n === stepNumber
                        ? 'w-4 bg-cyan-400'
                        : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs font-bold text-white leading-snug">{getInstruction()}</p>
          </div>

          {/* Action / Skip */}
          {step === 'complete' ? (
            <button
              onClick={() => {
                soundFX.playClick(1.3);
                NativeBridge.haptic('medium');
                onComplete();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs font-black shrink-0 shadow-md shadow-emerald-500/30 active:scale-95 transition"
            >
              {lang === 'hi' ? 'शुरू करें ⚡' : 'Start ⚡'}
            </button>
          ) : (
            <button
              onClick={() => {
                soundFX.playClick(0.9);
                onSkip();
              }}
              className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-0.5 shrink-0 border border-white/10 transition"
              title="Skip Tutorial"
            >
              <span>{lang === 'hi' ? 'स्किप' : 'Skip'}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );
});
