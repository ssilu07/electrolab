import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CircuitComponent,
  CircuitWire,
  CircuitPin,
  ComponentType,
  SimulationResult,
  ViewMode,
  GlassTheme,
  MultimeterState,
  OscilloscopeState,
  ToastNotification,
} from './types/circuit';
import { COMPONENT_REGISTRY, getComponentPins } from './engine/ComponentRegistry';
import { MnaCircuitSolver } from './engine/MnaSolver';
import { ParticleSystem } from './engine/Particles';
import { CanvasRenderer } from './rendering/CanvasRenderer';
import { Lab3DView } from './components/3d/Lab3DView';
import { soundFX } from './audio/SoundFX';
import { CHALLENGE_LEVELS } from './data/challenges';
import { PRESET_CIRCUITS } from './data/presets';
import { TopBar, MainNavScreen } from './components/TopBar';
import { ComponentDrawer } from './components/ComponentDrawer';
import { InspectorModal } from './components/InspectorModal';
import { Multimeter } from './components/instruments/Multimeter';
import { Oscilloscope } from './components/instruments/Oscilloscope';
import { InstrumentsDashboard } from './components/instruments/InstrumentsDashboard';
import { ChallengePanel } from './components/ChallengePanel';
import { ShareModal } from './components/ShareModal';
import { PresetsModal } from './components/PresetsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { billingService } from './services/billingService';
import { adService } from './services/adService';
import { playStoreService } from './services/playStoreService';
import { ToastContainer } from './components/Toast';
import { NativeBridge } from './utils/nativeBridge';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Zap,
  RotateCw,
  Copy,
  Trash2,
  Wrench,
  MousePointer,
  GitCommit,
  Crosshair,
  Move,
  Trophy,
  Rotate3d,
  BookOpen,
} from 'lucide-react';

const WIRE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#e2e8f0'];

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Simulation & Rendering instances
  const solverRef = useRef<MnaCircuitSolver>(new MnaCircuitSolver());
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer());
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());

  // Application State
  const [activeScreen, setActiveScreen] = useState<MainNavScreen>('circuit');
  const [activeCanvasTool, setActiveCanvasTool] = useState<'select' | 'wire' | 'probe' | 'pan'>('select');
  const [viewMode, setViewMode] = useState<ViewMode>('workbench');
  const [glassTheme, setGlassTheme] = useState<GlassTheme>(() => {
    return (localStorage.getItem('electrolab_glass_theme') as GlassTheme) || 'cyber';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-glass-theme', glassTheme);
    localStorage.setItem('electrolab_glass_theme', glassTheme);
  }, [glassTheme]);

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [willItBlow, setWillItBlow] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'sandbox' | 'challenge'>('sandbox');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);

  // Circuit components & wires
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<CircuitWire[]>([]);

  // Selection & Wiring Interaction
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [wiringFromPinId, setWiringFromPinId] = useState<string | null>(null);

  // Modals & Toasts
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(billingService.isPro);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Camera Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 300, y: 260 });
  const [zoom, setZoom] = useState<number>(1.15);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging State: Component, Board Pan, or Lab Probes
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingCompIdRef = useRef<string | null>(null);
  const dragCompOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingProbeRef = useRef<'red' | 'black' | 'scope_ch1' | null>(null);
  const screenSwitchCountRef = useRef<number>(0);

  // Instruments State
  const [multimeter, setMultimeter] = useState<MultimeterState>({
    enabled: false,
    x: 60,
    y: 90,
    mode: 'voltage_dc',
    redProbe: { x: 100, y: 300, attachedPinId: null },
    blackProbe: { x: 150, y: 300, attachedPinId: null },
    value: 0,
    readingText: '0.000',
    unit: 'V',
    isBeeping: false,
  });

  const [oscilloscope, setOscilloscope] = useState<OscilloscopeState>({
    enabled: false,
    x: window.innerWidth - 420,
    y: 80,
    timeDivMs: 10,
    voltsDiv: 2.0,
    probe: { x: window.innerWidth - 280, y: 280, attachedPinId: null },
    groundProbe: { x: window.innerWidth - 240, y: 280, attachedPinId: null },
    running: true,
    samples: [],
    displayMode: 'waveform',
    fftData: [],
    detectedFreq: 0,
  });

  // Live simulation results
  const [simResult, setSimResult] = useState<SimulationResult>({
    nodeVoltages: new Map(),
    pinToNode: new Map(),
    pinVoltages: new Map(),
    branchCurrents: new Map(),
    componentPower: new Map(),
    blownComponents: new Set(),
    oscilloscopeVoltage: 0,
    buzzerActive: false,
    buzzerFreq: 0,
    buzzerVolume: 0,
    hasShortCircuit: false,
    totalCurrent: 0,
    totalPower: 0,
    activeNodeCount: 0,
    simTime: 0,
  });

  const gridSize = 24;
  const prevBlownRef = useRef<Set<string>>(new Set());
  const prevShortCircuitRef = useRef<boolean>(false);

  // Toast dispatch helper
  const addToast = useCallback(
    (
      type: ToastNotification['type'],
      title: string,
      message: string,
      action?: { label: string; onClick: () => void }
    ) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message, timestamp: Date.now(), action }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, action ? 9000 : 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Native Android initialization & Back Button handling
  const lastBackPressRef = useRef<number>(0);
  useEffect(() => {
    NativeBridge.init();

    const unregisterBack = NativeBridge.registerBackButton(() => {
      if (showShareModal) {
        setShowShareModal(false);
        return true;
      }
      if (showPresetsModal) {
        setShowPresetsModal(false);
        return true;
      }
      if (showPrivacyModal) {
        setShowPrivacyModal(false);
        return true;
      }
      if (showProModal) {
        setShowProModal(false);
        return true;
      }
      if (selectedComponentId) {
        setSelectedComponentId(null);
        return true;
      }
      if (wiringFromPinId) {
        setWiringFromPinId(null);
        return true;
      }
      const now = Date.now();
      if (lastBackPressRef.current && now - lastBackPressRef.current < 2000) {
        return false; // allow exit
      }
      lastBackPressRef.current = now;
      addToast('info', 'Press Back Again', 'Tap back once more to exit.');
      NativeBridge.haptic('light');
      return true;
    });

    return () => {
      unregisterBack();
    };
  }, [showShareModal, showPresetsModal, showPrivacyModal, showProModal, selectedComponentId, wiringFromPinId, addToast]);

  // 1. Google Play Billing check & Auto-revocation on Refund + AdMob Init
  useEffect(() => {
    billingService.init().then((proActive) => {
      setIsPro(proActive);
      if (proActive) {
        addToast('info', 'ElectroLab Pro Active', 'Verified via Google Play. All features unlocked.');
        adService.removeBanner().catch(() => {});
      } else {
        adService.init().then(() => {
          adService.showBanner().catch(() => {});
        });
      }
    });

    const unsub = billingService.onProStatusChange((proActive) => {
      setIsPro(proActive);
      if (proActive) {
        adService.removeBanner().catch(() => {});
      } else {
        adService.showBanner().catch(() => {});
      }
    });
    return unsub;
  }, [addToast]);

  // 1b. Google Play Store In-App Updates & Live Direct Connection
  useEffect(() => {
    playStoreService.checkForUpdate().then((updateInfo) => {
      if (updateInfo.updateAvailable) {
        addToast(
          'info',
          'Play Store Update Available',
          `A new version of ElectroLab (v${updateInfo.availableVersionCode}) is ready on Google Play.`,
          {
            label: 'Update Now',
            onClick: () => {
              if (updateInfo.immediateUpdateAllowed) {
                playStoreService.startImmediateUpdate();
              } else {
                playStoreService.startFlexibleUpdate();
              }
            },
          }
        );
      }
    });

    const unsubDownload = playStoreService.onDownloadComplete(() => {
      addToast(
        'success',
        'Update Ready to Install',
        'Update downloaded in background. Restart to apply new features.',
        {
          label: 'Restart Now',
          onClick: () => playStoreService.completeFlexibleUpdate(),
        }
      );
    });

    return () => {
      unsubDownload();
    };
  }, [addToast]);

  // 2. Initial Load: Check Base64 URL parameter or load default demo circuit
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('#circuit=')) {
        const b64 = hash.replace('#circuit=', '');
        const jsonStr = decodeURIComponent(atob(b64));
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed.components) && Array.isArray(parsed.wires)) {
          setComponents(parsed.components);
          setWires(parsed.wires);
          addToast('success', 'Shared Circuit Loaded', `Imported ${parsed.components.length} components.`);
          return;
        }
      }
    } catch {}

    const defaultPreset = PRESET_CIRCUITS[0];
    setComponents(defaultPreset.components);
    setWires(defaultPreset.wires);
  }, [addToast]);

  // Update Game Mode Level
  useEffect(() => {
    if (gameMode === 'challenge') {
      const lvl = CHALLENGE_LEVELS[currentLevelIndex];
      if (lvl) {
        setComponents(lvl.initialComponents);
        setWires(lvl.initialWires);
        setSelectedComponentId(null);
        setWiringFromPinId(null);
        solverRef.current.reset();
        particleSystemRef.current.clear();
        addToast('info', lvl.title, lvl.targetGoal);
      }
    }
  }, [gameMode, currentLevelIndex, addToast]);

  const handleSelectScreen = useCallback((screen: MainNavScreen) => {
    setActiveScreen(screen);

    // Preload rewarded video when moving toward challenges
    if (screen === 'challenges') {
      adService.prepareRewarded().catch(() => {});
    }

    // High show rate optimization: Trigger interstitial only after meaningful exploration (>= 3 screen switches)
    screenSwitchCountRef.current += 1;
    if (screenSwitchCountRef.current >= 3) {
      adService.showInterstitial().then((shown) => {
        if (shown) {
          screenSwitchCountRef.current = 0;
        }
      }).catch(() => {});
    }

    if (screen === 'circuit') {
      setViewMode('workbench');
      setGameMode('sandbox');
    } else if (screen === '3d') {
      setViewMode('3d');
      setGameMode('sandbox');
    } else if (screen === 'challenges') {
      setGameMode('challenge');
      setViewMode('workbench');
    } else if (screen === 'presets') {
      setShowPresetsModal(true);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundFX.setMuted(next);
      addToast('info', next ? 'Audio Muted' : 'Audio Active', next ? 'Procedural synth silenced.' : 'Web Audio synthesized effects enabled.');
      return next;
    });
  }, [addToast]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const findPinAt = useCallback(
    (worldX: number, worldY: number, maxDist: number = 18): CircuitPin | null => {
      for (const comp of components) {
        const pins = getComponentPins(comp);
        for (const p of pins) {
          const px = p.x * gridSize;
          const py = p.y * gridSize;
          const dist = Math.hypot(px - worldX, py - worldY);
          if (dist <= maxDist) {
            return p;
          }
        }
      }
      return null;
    },
    [components, gridSize]
  );

  const findComponentAt = useCallback(
    (worldX: number, worldY: number): CircuitComponent | null => {
      const gx = worldX / gridSize;
      const gy = worldY / gridSize;
      for (let i = components.length - 1; i >= 0; i--) {
        const c = components[i];
        const dist = Math.hypot(c.x - gx, c.y - gy);
        if (dist <= 2.2) {
          return c;
        }
      }
      return null;
    },
    [components, gridSize]
  );

  // --------------------------------------------------------------------------
  // MAIN ANIMATION & SIMULATION LOOP (60 FPS)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      let sim = simResult;
      if (isSimulating) {
        sim = solverRef.current.step(components, wires, {
          dt: 0.001,
          subSteps: 10,
          willItBlow,
          oscilloscopeProbePinId: oscilloscope.enabled ? oscilloscope.probe.attachedPinId : null,
          oscilloscopeGroundPinId: oscilloscope.enabled ? oscilloscope.groundProbe.attachedPinId : null,
        });
        setSimResult(sim);

        // Check newly exploded components
        const newlyBlown: string[] = [];
        for (const blownId of sim.blownComponents) {
          if (!prevBlownRef.current.has(blownId)) {
            newlyBlown.push(blownId);
            prevBlownRef.current.add(blownId);
          }
        }

        if (newlyBlown.length > 0) {
          soundFX.playExplosion();
          NativeBridge.haptic('explode');
          for (const blownId of newlyBlown) {
            const comp = components.find((c) => c.id === blownId);
            if (comp) {
              particleSystemRef.current.triggerExplosion(comp.x * gridSize, comp.y * gridSize);
              const reason = solverRef.current.getBlownReason(blownId) || 'Overcurrent explosion';
              addToast('danger', '💥 Catastrophic Explosion!', `${comp.type.toUpperCase()}: ${reason}`);
            }
          }
        }

        // Short circuit alert
        if (sim.hasShortCircuit && !prevShortCircuitRef.current) {
          prevShortCircuitRef.current = true;
          soundFX.startBurn();
          NativeBridge.haptic('warning');
          addToast('warning', '⚠️ Short-Circuit Alert', 'Excessive branch current detected! Wires overheating.');
        } else if (!sim.hasShortCircuit && prevShortCircuitRef.current) {
          prevShortCircuitRef.current = false;
        }

        if (sim.hasShortCircuit) {
          soundFX.startBurn();
          const hotWire = wires.find((w) => w.isOverheating);
          if (hotWire) {
            const fromComp = components.find((c) => c.id === hotWire.fromPinId.split(':')[0]);
            if (fromComp) {
              particleSystemRef.current.triggerSmoke(fromComp.x * gridSize, fromComp.y * gridSize);
            }
          }
        } else {
          soundFX.stopBurn();
        }

        soundFX.updateCircuitBuzzer(sim.buzzerActive, sim.buzzerFreq, sim.buzzerVolume);
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const pinMap = new Map<string, CircuitPin>();
      for (const comp of components) {
        for (const p of getComponentPins(comp)) {
          pinMap.set(p.id, p);
        }
      }
      particleSystemRef.current.update(dt, wires, pinMap, gridSize);

      rendererRef.current.render({
        ctx,
        components,
        wires,
        simulation: sim,
        viewMode,
        gridSize,
        pan,
        zoom,
        selectedComponentId,
        hoveredPinId,
        wiringFromPinId,
        mouseWorldPos,
        multimeter,
        oscilloscope,
        particleSystem: particleSystemRef.current,
        draggedProbe: draggingProbeRef.current,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      soundFX.stopCircuitBuzzer();
      soundFX.stopBurn();
      soundFX.stopContinuity();
    };
  }, [
    isSimulating,
    components,
    wires,
    willItBlow,
    viewMode,
    pan,
    zoom,
    selectedComponentId,
    hoveredPinId,
    wiringFromPinId,
    mouseWorldPos,
    multimeter,
    oscilloscope,
    gridSize,
    simResult,
    addToast,
  ]);

  // --------------------------------------------------------------------------
  // USER CANVAS INTERACTIONS (Pan, Zoom, Wiring, Probe Dragging)
  // --------------------------------------------------------------------------

  // Multi-touch tracking refs for Android gesture pinch-to-zoom & two-finger pan
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.15);
  const touchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartMidpointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const pointerDownCore = (
    clientX: number,
    clientY: number,
    isRightClick = false,
    modifiers: { shiftKey?: boolean; altKey?: boolean; ctrlKey?: boolean } = {}
  ) => {
    const world = screenToWorld(clientX, clientY);

    if (isRightClick) {
      const clickedComp = findComponentAt(world.x, world.y);
      if (clickedComp) {
        handleDeleteComponent(clickedComp.id);
        return;
      }
      return;
    }

    // 1. Check if clicking multimeter probes directly on canvas
    if (multimeter.enabled) {
      const dRed = Math.hypot(world.x - multimeter.redProbe.x, world.y - multimeter.redProbe.y);
      if (dRed <= 26) {
        draggingProbeRef.current = 'red';
        soundFX.playClick(1.6);
        NativeBridge.haptic('light');
        return;
      }
      const dBlack = Math.hypot(world.x - multimeter.blackProbe.x, world.y - multimeter.blackProbe.y);
      if (dBlack <= 26) {
        draggingProbeRef.current = 'black';
        soundFX.playClick(1.6);
        NativeBridge.haptic('light');
        return;
      }
    }

    // 2. Check if clicking oscilloscope probe directly on canvas
    if (oscilloscope.enabled) {
      const dScope = Math.hypot(world.x - oscilloscope.probe.x, world.y - oscilloscope.probe.y);
      if (dScope <= 26) {
        draggingProbeRef.current = 'scope_ch1';
        soundFX.playClick(1.6);
        NativeBridge.haptic('light');
        return;
      }
    }

    // 3. Check if clicking a pin for wiring or probe attachment
    const pin = findPinAt(world.x, world.y);

    if (pin) {
      soundFX.playClick(1.5);
      NativeBridge.haptic('light');

      if (multimeter.enabled && modifiers.shiftKey) {
        setMultimeter((prev) => ({
          ...prev,
          redProbe: { ...prev.redProbe, attachedPinId: pin.id },
        }));
        addToast('info', 'DMM Red Probe Attached', `Connected to ${pin.id}`);
        return;
      }
      if (multimeter.enabled && modifiers.altKey) {
        setMultimeter((prev) => ({
          ...prev,
          blackProbe: { ...prev.blackProbe, attachedPinId: pin.id },
        }));
        addToast('info', 'DMM Black (COM) Attached', `Connected to ${pin.id}`);
        return;
      }

      if (oscilloscope.enabled && modifiers.ctrlKey) {
        setOscilloscope((prev) => ({
          ...prev,
          probe: { ...prev.probe, attachedPinId: pin.id },
        }));
        addToast('info', 'Oscilloscope CH1 Attached', `Connected to ${pin.id}`);
        return;
      }

      if (!wiringFromPinId) {
        setWiringFromPinId(pin.id);
        soundFX.playConnect();
        NativeBridge.haptic('light');
      } else {
        if (wiringFromPinId !== pin.id) {
          const wireExists = wires.some(
            (w) =>
              (w.fromPinId === wiringFromPinId && w.toPinId === pin.id) ||
              (w.fromPinId === pin.id && w.toPinId === wiringFromPinId)
          );

          if (!wireExists) {
            const newWireColor = WIRE_COLORS[wires.length % WIRE_COLORS.length];
            const newWire: CircuitWire = {
              id: `w_${Date.now()}`,
              fromPinId: wiringFromPinId,
              toPinId: pin.id,
              color: newWireColor,
              current: 0,
            };
            setWires((prev) => [...prev, newWire]);
            soundFX.playConnect();
            NativeBridge.haptic('success');
          }
        }
        setWiringFromPinId(null);
      }
      return;
    }

    // 4. Check if clicking a component
    const comp = findComponentAt(world.x, world.y);
    if (comp) {
      soundFX.playClick(1.1);
      NativeBridge.haptic('light');
      setSelectedComponentId(comp.id);
      draggingCompIdRef.current = comp.id;
      dragCompOffsetRef.current = {
        x: comp.x - Math.round(world.x / gridSize),
        y: comp.y - Math.round(world.y / gridSize),
      };

      if (comp.type === 'switch') {
        soundFX.playClick(1.4);
        NativeBridge.haptic('light');
        handleUpdateComponent(comp.id, { closed: !comp.properties.closed });
      } else if (comp.type === 'pushbutton') {
        soundFX.playClick(1.6);
        NativeBridge.haptic('light');
        handleUpdateComponent(comp.id, { closed: true });
      }
      return;
    }

    // 5. Empty space: start canvas panning
    setSelectedComponentId(null);
    setWiringFromPinId(null);
    isPanningRef.current = true;
    panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const pointerMoveCore = (clientX: number, clientY: number) => {
    const world = screenToWorld(clientX, clientY);
    setMouseWorldPos(world);

    const pin = findPinAt(world.x, world.y);
    setHoveredPinId(pin ? pin.id : null);

    // Dragging DMM / DSO Probes directly
    if (draggingProbeRef.current === 'red') {
      setMultimeter((prev) => ({
        ...prev,
        redProbe: { x: world.x, y: world.y, attachedPinId: pin ? pin.id : null },
      }));
      return;
    }
    if (draggingProbeRef.current === 'black') {
      setMultimeter((prev) => ({
        ...prev,
        blackProbe: { x: world.x, y: world.y, attachedPinId: pin ? pin.id : null },
      }));
      return;
    }
    if (draggingProbeRef.current === 'scope_ch1') {
      setOscilloscope((prev) => ({
        ...prev,
        probe: { x: world.x, y: world.y, attachedPinId: pin ? pin.id : null },
      }));
      return;
    }

    if (isPanningRef.current) {
      setPan({
        x: clientX - panStartRef.current.x,
        y: clientY - panStartRef.current.y,
      });
      return;
    }

    if (draggingCompIdRef.current) {
      const gx = Math.round(world.x / gridSize) + dragCompOffsetRef.current.x;
      const gy = Math.round(world.y / gridSize) + dragCompOffsetRef.current.y;

      setComponents((prev) =>
        prev.map((c) => (c.id === draggingCompIdRef.current ? { ...c, x: gx, y: gy } : c))
      );
    }
  };

  const pointerUpCore = () => {
    if (draggingProbeRef.current) {
      soundFX.playConnect();
      NativeBridge.haptic('light');
      draggingProbeRef.current = null;
    }
    // Release momentary pushbutton switches when released
    setComponents((prev) =>
      prev.map((c) =>
        c.type === 'pushbutton' && c.properties.closed
          ? { ...c, properties: { ...c.properties, closed: false } }
          : c
      )
    );
    isPanningRef.current = false;
    draggingCompIdRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerDownCore(
      e.clientX - rect.left,
      e.clientY - rect.top,
      e.button === 2,
      { shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey }
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerMoveCore(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseUp = () => {
    pointerUpCore();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 1) {
      touchStartDistRef.current = null;
      const t = e.touches[0];
      pointerDownCore(t.clientX - rect.left, t.clientY - rect.top, false, {});
    } else if (e.touches.length === 2) {
      // Begin 2-finger pinch & pan
      isPanningRef.current = false;
      draggingCompIdRef.current = null;
      draggingProbeRef.current = null;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
      touchStartPanRef.current = { ...pan };
      touchStartMidpointRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 1 && touchStartDistRef.current === null) {
      const t = e.touches[0];
      pointerMoveCore(t.clientX - rect.left, t.clientY - rect.top);
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = newDist / touchStartDistRef.current;
      const newZoom = Math.min(2.5, Math.max(0.4, touchStartZoomRef.current * scale));

      const newMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const newMidY = (t1.clientY + t2.clientY) / 2 - rect.top;
      const deltaX = newMidX - touchStartMidpointRef.current.x;
      const deltaY = newMidY - touchStartMidpointRef.current.y;

      setZoom(newZoom);
      setPan({
        x: touchStartPanRef.current.x + deltaX,
        y: touchStartPanRef.current.y + deltaY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) {
      touchStartDistRef.current = null;
      pointerUpCore();
    } else if (e.touches.length === 1) {
      touchStartDistRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const world = screenToWorld(clientX, clientY);

    // Micro-interaction: if hovering directly over a potentiometer or LDR, scroll wheel adjusts value!
    const hoveredComp = findComponentAt(world.x, world.y);
    if (hoveredComp && (hoveredComp.type === 'potentiometer' || hoveredComp.type === 'ldr')) {
      const step = e.deltaY < 0 ? 0.05 : -0.05;
      const currentVal = hoveredComp.properties.sliderValue ?? 0.5;
      const newVal = Math.max(0, Math.min(1, Math.round((currentVal + step) * 100) / 100));
      handleUpdateComponent(hoveredComp.id, { sliderValue: newVal });
      soundFX.playClick(1.8);
      return;
    }

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.4, Math.min(2.5, zoom * zoomFactor));

    setPan({
      x: clientX - (clientX - pan.x) * (newZoom / zoom),
      y: clientY - (clientY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Drag-and-drop from 3D Drawer onto breadboard canvas
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/electrolab-component') as ComponentType;
    if (!type || !COMPONENT_REGISTRY[type]) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const world = screenToWorld(clientX, clientY);
    const gx = Math.round(world.x / gridSize);
    const gy = Math.round(world.y / gridSize);

    const meta = COMPONENT_REGISTRY[type];
    const newComp: CircuitComponent = {
      id: `${type}_${Date.now()}`,
      type,
      x: gx,
      y: gy,
      rotation: 0,
      properties: { ...meta.defaultProps },
    };

    setComponents((prev) => [...prev, newComp]);
    setSelectedComponentId(newComp.id);
    soundFX.playConnect();
    particleSystemRef.current.triggerSmoke(gx * gridSize, gy * gridSize);
    addToast('success', `${meta.name} Placed`, `Dropped onto breadboard at (${gx}, ${gy}).`);
  };

  // --------------------------------------------------------------------------
  // COMPONENT ACTIONS & EXPORT
  // --------------------------------------------------------------------------

  const handleSpawnComponent = (type: ComponentType, atPos?: { x: number; y: number }) => {
    const meta = COMPONENT_REGISTRY[type];
    if (!meta) return;

    let gx = atPos ? atPos.x : 0;
    let gy = atPos ? atPos.y : 0;

    if (!atPos) {
      if (viewMode === '3d') {
        if (components.length > 0) {
          gx = Math.round(components.reduce((acc, c) => acc + c.x, 0) / components.length) + 4;
          gy = Math.round(components.reduce((acc, c) => acc + c.y, 0) / components.length);
        } else {
          gx = 16;
          gy = 14;
        }
      } else {
        const centerWorld = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
        gx = Math.round(centerWorld.x / gridSize);
        gy = Math.round(centerWorld.y / gridSize);
      }
    }

    const newComp: CircuitComponent = {
      id: `${type}_${Date.now()}`,
      type,
      x: gx,
      y: gy,
      rotation: 0,
      properties: { ...meta.defaultProps },
    };

    setComponents((prev) => [...prev, newComp]);
    setSelectedComponentId(newComp.id);
    NativeBridge.haptic('medium');
    addToast('info', 'Component Added', `Placed ${meta.name} at (${gx}, ${gy}).`);
  };

  const handleAddWire = useCallback((fromPinId: string, toPinId: string) => {
    if (fromPinId === toPinId) return;
    const wireExists = wires.some(
      (w) =>
        (w.fromPinId === fromPinId && w.toPinId === toPinId) ||
        (w.fromPinId === toPinId && w.toPinId === fromPinId)
    );
    if (!wireExists) {
      const newWireColor = WIRE_COLORS[wires.length % WIRE_COLORS.length];
      const newWire: CircuitWire = {
        id: `w_${Date.now()}`,
        fromPinId,
        toPinId,
        color: newWireColor,
        current: 0,
      };
      setWires((prev) => [...prev, newWire]);
      soundFX.playConnect();
      NativeBridge.haptic('success');
      addToast('success', 'Wire Connected', `Linked ${fromPinId.split(':')[1]} ➔ ${toPinId.split(':')[1]}`);
    } else {
      addToast('info', 'Already Connected', 'Wire already exists between these pins.');
    }
  }, [wires, addToast]);

  const handleRotateComponent = (id: string) => {
    NativeBridge.haptic('light');
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newRot = ((c.rotation + 90) % 360);
        return { ...c, rotation: newRot };
      })
    );
  };

  const handleDeleteComponent = (id: string) => {
    NativeBridge.haptic('medium');
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) => prev.filter((w) => !w.fromPinId.startsWith(`${id}:`) && !w.toPinId.startsWith(`${id}:`)));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const handleDuplicateComponent = (comp: CircuitComponent) => {
    NativeBridge.haptic('light');
    const newComp: CircuitComponent = {
      ...comp,
      id: `${comp.type}_${Date.now()}`,
      x: comp.x + 3,
      y: comp.y + 3,
      properties: { ...comp.properties, isBlown: false },
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedComponentId(newComp.id);
  };

  const handleRepairComponent = (id: string) => {
    NativeBridge.haptic('medium');
    solverRef.current.repairComponent(id);
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              properties: {
                ...c.properties,
                isBlown: false,
                blownReason: undefined,
              },
            }
          : c
      )
    );
    prevBlownRef.current.delete(id);
    soundFX.playConnect();
    addToast('success', 'Component Repaired', 'Component restored to working condition.');
  };

  const handleUpdateComponent = (id: string, partial: Partial<CircuitComponent['properties']>) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              properties: {
                ...c.properties,
                ...partial,
              },
            }
          : c
      )
    );
  };

  const handleClearBoard = () => {
    setComponents([]);
    setWires([]);
    setSelectedComponentId(null);
    setWiringFromPinId(null);
    solverRef.current.reset();
    particleSystemRef.current.clear();
    prevBlownRef.current.clear();
    addToast('info', 'Breadboard Cleared', 'All components and wires removed.');
  };

  // 1-Click High-Res PNG Circuit Blueprint Export
  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create watermark download
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const expCtx = exportCanvas.getContext('2d');
      if (!expCtx) return;

      // Copy rendered board
      expCtx.drawImage(canvas, 0, 0);

      // Render sleek blueprint footer banner
      expCtx.fillStyle = 'rgba(5, 8, 17, 0.85)';
      expCtx.fillRect(0, exportCanvas.height - 40, exportCanvas.width, 40);
      expCtx.strokeStyle = '#06b6d4';
      expCtx.lineWidth = 1.5;
      expCtx.beginPath();
      expCtx.moveTo(0, exportCanvas.height - 40);
      expCtx.lineTo(exportCanvas.width, exportCanvas.height - 40);
      expCtx.stroke();

      expCtx.fillStyle = '#ffffff';
      expCtx.font = 'bold 12px "JetBrains Mono", monospace';
      expCtx.fillText('ELECTROCRAFT v1.0 — CIRCUIT BLUEPRINT', 20, exportCanvas.height - 15);

      expCtx.fillStyle = '#38bdf8';
      expCtx.font = '10px "JetBrains Mono", monospace';
      expCtx.textAlign = 'right';
      expCtx.fillText(
        `COMPONENTS: ${components.length} | WIRES: ${wires.length} | ${new Date().toLocaleDateString()}`,
        exportCanvas.width - 20,
        exportCanvas.height - 15
      );

      const url = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `electrocraft-blueprint-${Date.now()}.png`;
      a.click();
      soundFX.playVictory();
      addToast('success', 'Blueprint Exported', 'PNG card downloaded to your device.');
    } catch {}
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsSimulating((prev) => !prev);
        soundFX.playClick();
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentId) {
          handleRotateComponent(selectedComponentId);
          soundFX.playClick(1.2);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          handleDeleteComponent(selectedComponentId);
          soundFX.playDisconnect();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setMultimeter((prev) => ({ ...prev, enabled: !prev.enabled }));
        soundFX.playClick();
      } else if (e.key === 'o' || e.key === 'O') {
        setOscilloscope((prev) => ({ ...prev, enabled: !prev.enabled }));
        soundFX.playClick();
      } else if (e.key === 's' || e.key === 'S') {
        setViewMode((prev) => (prev === 'workbench' ? 'schematic' : 'workbench'));
        soundFX.playClick();
      } else if (e.key === 'Escape') {
        setSelectedComponentId(null);
        setWiringFromPinId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId]);

  const selectedComponent = components.find((c) => c.id === selectedComponentId) || null;
  const currentChallenge = CHALLENGE_LEVELS[currentLevelIndex];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050811] text-slate-100 font-sans select-none">
      {/* Top Cyber Command Bar */}
      <TopBar
        activeScreen={activeScreen}
        onSelectScreen={handleSelectScreen}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        glassTheme={glassTheme}
        onSelectGlassTheme={setGlassTheme}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating((prev) => !prev)}
        gameMode={gameMode}
        onSetGameMode={setGameMode}
        currentLevelIndex={currentLevelIndex}
        onSelectLevelIndex={setCurrentLevelIndex}
        willItBlow={willItBlow}
        onToggleWillItBlow={() => setWillItBlow((prev) => !prev)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenPresets={() => setShowPresetsModal(true)}
        onOpenShare={() => setShowShareModal(true)}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        onExportImage={handleExportImage}
        onClearBoard={handleClearBoard}
        isPro={isPro}
        onOpenProModal={() => setShowProModal(true)}
        onRateApp={() => {
          playStoreService.requestReview();
        }}
        onCheckUpdates={() => {
          addToast('info', 'Connecting to Play Store...', 'Checking for the latest updates.');
          playStoreService.checkForUpdate().then((info) => {
            if (info.updateAvailable) {
              addToast(
                'success',
                'Update Found!',
                `Version ${info.availableVersionCode} is available on Google Play.`,
                {
                  label: 'Update Now',
                  onClick: () => {
                    if (info.immediateUpdateAllowed) {
                      playStoreService.startImmediateUpdate();
                    } else {
                      playStoreService.startFlexibleUpdate();
                    }
                  },
                }
              );
            } else {
              addToast('success', 'ElectroLab Up to Date', 'You are running the latest version from Play Store.');
            }
          });
        }}
      />

      {/* Main Viewport: Instruments Studio vs 3D WebGL Lab vs 2D Workbench Canvas */}
      {activeScreen === 'instruments' ? (
        <div className="w-full h-full pt-16 pb-16 overflow-y-auto">
          <InstrumentsDashboard
            simulation={simResult}
            isSimulating={isSimulating}
            onToggleSimulate={() => setIsSimulating((prev) => !prev)}
          />
        </div>
      ) : activeScreen === '3d' || (activeScreen === 'circuit' && viewMode === '3d') ? (
        <Lab3DView
          components={components}
          wires={wires}
          simulation={simResult}
          selectedComponentId={selectedComponentId}
          onSelectComponent={(id) => setSelectedComponentId(id)}
          onUpdateComponent={handleUpdateComponent}
          onAddWire={handleAddWire}
          onSpawnComponent={handleSpawnComponent}
          glassTheme={glassTheme}
        />
      ) : (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onContextMenu={(e) => e.preventDefault()}
          className="block w-full h-full cursor-crosshair touch-none select-none"
        />
      )}

      {/* Right-Side Vertical Quick Toolbar (Screenshot 1) */}
      {(activeScreen === 'circuit' || activeScreen === 'challenges') && viewMode !== '3d' && (
        <div className="fixed top-20 right-3 sm:right-4 z-20 flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 p-1.5 rounded-2xl shadow-2xl">
          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              setActiveCanvasTool('select');
            }}
            className={`p-2 rounded-xl transition ${
              activeCanvasTool === 'select'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Select & Move Tool"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              setActiveCanvasTool('wire');
              addToast('info', 'Wiring Mode', 'Click any component terminal pin to draw wires.');
            }}
            className={`p-2 rounded-xl transition ${
              activeCanvasTool === 'wire'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Wire Connector Tool"
          >
            <GitCommit className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              setMultimeter((prev) => ({ ...prev, enabled: !prev.enabled }));
            }}
            className={`p-2 rounded-xl transition ${
              multimeter.enabled
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Multimeter Probes on Board"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              setPan({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 80 });
              setZoom(1.15);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition"
            title="Reset Camera & Center Board"
          >
            <Move className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (selectedComponentId) {
                handleDeleteComponent(selectedComponentId);
                soundFX.playDisconnect();
              } else {
                addToast('info', 'Select to Delete', 'Click a component or wire to delete it.');
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 transition"
            title="Delete Selected Component (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Quick-Action HUD on Selected Component (in 2D mode) */}
      {viewMode !== '3d' && selectedComponent && (
        (() => {
          const compScreenX = selectedComponent.x * gridSize * zoom + pan.x;
          const compScreenY = selectedComponent.y * gridSize * zoom + pan.y - 48;
          const isBlown = selectedComponent.properties.isBlown || simResult.blownComponents.has(selectedComponent.id);

          return (
            <div
              style={{
                left: `${compScreenX}px`,
                top: `${compScreenY}px`,
                transform: 'translate(-50%, -100%)',
              }}
              className="absolute z-25 flex items-center gap-1.5 glass-panel-glow border-cyan-400/50 rounded-2xl p-1.5 shadow-2xl select-none pointer-events-auto"
            >
              {/* Rotate */}
              <button
                onClick={() => {
                  soundFX.playClick(1.3);
                  handleRotateComponent(selectedComponent.id);
                }}
                className="p-1.5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-xl transition"
                title="Rotate 90° (R)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Duplicate */}
              <button
                onClick={() => {
                  soundFX.playConnect();
                  handleDuplicateComponent(selectedComponent);
                }}
                className="p-1.5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-xl transition"
                title="Duplicate"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Quick toggle if switch */}
              {selectedComponent.type === 'switch' && (
                <button
                  onClick={() => {
                    soundFX.playClick(1.4);
                    handleUpdateComponent(selectedComponent.id, {
                      closed: !selectedComponent.properties.closed,
                    });
                  }}
                  className={`px-2 py-1 rounded-xl text-[10px] font-bold transition ${
                    selectedComponent.properties.closed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title="Toggle Switch"
                >
                  {selectedComponent.properties.closed ? 'ON' : 'OFF'}
                </button>
              )}

              {/* Quick pulse if pushbutton */}
              {selectedComponent.type === 'pushbutton' && (
                <button
                  onMouseDown={() => {
                    soundFX.playClick(1.6);
                    handleUpdateComponent(selectedComponent.id, { closed: true });
                  }}
                  onMouseUp={() => {
                    handleUpdateComponent(selectedComponent.id, { closed: false });
                  }}
                  className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 rounded-xl text-[10px] font-bold transition active:scale-95"
                  title="Click & Hold to Press"
                >
                  PUSH
                </button>
              )}

              {/* Quick Potentiometer / LDR Value Slider */}
              {(selectedComponent.type === 'potentiometer' || selectedComponent.type === 'ldr') && (
                <div className="flex items-center gap-1.5 px-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    {Math.round((selectedComponent.properties.sliderValue ?? 0.5) * 100)}%
                  </span>
                  <input
                    id="quick-slider-input"
                    name="quickSlider"
                    aria-label="Component Value Slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={selectedComponent.properties.sliderValue ?? 0.5}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComponent.id, {
                        sliderValue: parseFloat(e.target.value),
                      })
                    }
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}

              {/* Repair Button if Blown */}
              {isBlown && (
                <button
                  onClick={() => handleRepairComponent(selectedComponent.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded-xl text-[10px] font-bold transition animate-pulse"
                  title="Repair Blown Part"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Repair</span>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => {
                  soundFX.playClick(0.9);
                  handleDeleteComponent(selectedComponent.id);
                }}
                className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition"
                title="Delete Part (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()
      )}

      {/* Floating HUD: Live Circuit Telemetry (Bottom Left) */}
      <div className="fixed bottom-20 left-4 z-20 hidden lg:flex items-center gap-4 glass-panel rounded-2xl px-3.5 py-2 text-xs font-mono shadow-2xl">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Nodes:</span>
          <span className="text-white font-bold">{simResult.activeNodeCount}</span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Total I:</span>
          <span className="text-cyan-300 font-bold">
            {simResult.totalCurrent >= 1
              ? `${simResult.totalCurrent.toFixed(2)} A`
              : `${(simResult.totalCurrent * 1000).toFixed(1)} mA`}
          </span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Total P:</span>
          <span className="text-amber-300 font-bold">
            {simResult.totalPower >= 1
              ? `${simResult.totalPower.toFixed(2)} W`
              : `${(simResult.totalPower * 1000).toFixed(1)} mW`}
          </span>
        </div>
      </div>

      {/* Floating Zoom & Pan Controls (Bottom Right - only in 2D mode) */}
      {viewMode !== '3d' && (
        <div className="fixed bottom-12 right-4 z-20 flex items-center gap-1.5 glass-panel p-1 rounded-2xl shadow-xl">
          <button
            onClick={() => setZoom((prev) => Math.min(2.5, prev * 1.15))}
            className="p-1.5 glass-button rounded-xl text-slate-300 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((prev) => Math.max(0.4, prev * 0.85))}
            className="p-1.5 glass-button rounded-xl text-slate-300 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1.15);
              setPan({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 80 });
            }}
            className="p-1.5 glass-button rounded-xl text-slate-300 transition"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive Bottom Component Drawer (Screenshot 1 & 2) */}
      {(activeScreen === 'circuit' || (activeScreen === '3d' && gameMode === 'sandbox')) && (
        <ComponentDrawer onSpawnComponent={handleSpawnComponent} />
      )}

      {/* Real-time Component Property Inspector */}
      {selectedComponent && (
        <InspectorModal
          component={selectedComponent}
          simulation={simResult}
          onUpdateComponent={handleUpdateComponent}
          onRotateComponent={handleRotateComponent}
          onDeleteComponent={handleDeleteComponent}
          onDuplicateComponent={handleDuplicateComponent}
          onRepairComponent={handleRepairComponent}
          onClose={() => setSelectedComponentId(null)}
        />
      )}

      {/* Digital Multimeter (DMM) floating widget on canvas */}
      {multimeter.enabled && activeScreen === 'circuit' && (
        <Multimeter
          state={multimeter}
          simulation={simResult}
          onUpdateState={(partial) => setMultimeter((prev) => ({ ...prev, ...partial }))}
          onClose={() => setMultimeter((prev) => ({ ...prev, enabled: false }))}
        />
      )}

      {/* Real-Time Digital Oscilloscope (DSO) floating widget on canvas */}
      {oscilloscope.enabled && activeScreen === 'circuit' && (
        <Oscilloscope
          state={oscilloscope}
          simulation={simResult}
          onUpdateState={(partial) => setOscilloscope((prev) => ({ ...prev, ...partial }))}
          onClose={() => setOscilloscope((prev) => ({ ...prev, enabled: false }))}
        />
      )}

      {/* Challenge / Guided Puzzle HUD Panel (Screenshot 3) */}
      {(activeScreen === 'challenges' || gameMode === 'challenge') && currentChallenge && (
        <ChallengePanel
          level={currentChallenge}
          simulation={simResult}
          components={components}
          wires={wires}
          onResetLevel={() => {
            setComponents(currentChallenge.initialComponents);
            setWires(currentChallenge.initialWires);
            solverRef.current.reset();
            particleSystemRef.current.clear();
          }}
          onNextLevel={() => {
            adService.showInterstitial().catch(() => {});
            // Request Google Play In-App Review after successfully beating level 2
            if (currentLevelIndex === 1) {
              playStoreService.requestReview().catch(() => {});
            }
            if (currentLevelIndex < CHALLENGE_LEVELS.length - 1) {
              setCurrentLevelIndex((prev) => prev + 1);
            }
          }}
          hasNextLevel={currentLevelIndex < CHALLENGE_LEVELS.length - 1}
          isPro={isPro}
          onOpenProModal={() => setShowProModal(true)}
          currentLevelIndex={currentLevelIndex}
        />
      )}

      {/* Presets Modal */}
      {showPresetsModal && (
        <PresetsModal
          onSelectPreset={(comps, wrs) => {
            adService.showInterstitial().catch(() => {});
            setComponents(comps);
            setWires(wrs);
            setSelectedComponentId(null);
            setWiringFromPinId(null);
            solverRef.current.reset();
            particleSystemRef.current.clear();
            addToast('success', 'Preset Loaded', `Loaded circuit with ${comps.length} components.`);
          }}
          onClose={() => setShowPresetsModal(false)}
        />
      )}

      {/* Share / Export Modal */}
      {showShareModal && (
        <ShareModal
          components={components}
          wires={wires}
          onLoadCircuit={(comps, wrs) => {
            setComponents(comps);
            setWires(wrs);
            setSelectedComponentId(null);
            setWiringFromPinId(null);
            solverRef.current.reset();
            particleSystemRef.current.clear();
            addToast('success', 'Circuit Imported', 'Loaded custom circuit.');
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Privacy Policy & Google Sites Slide Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Google Play Billing Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onSuccess={() => {
          setIsPro(true);
          addToast('success', 'Welcome to Pro!', 'All laboratory instruments & levels are unlocked.');
        }}
      />

      {/* Cyber Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Mobile / Tablet Bottom Navigation Bar (Screenshot 4) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 h-14 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-2 flex items-center justify-around md:hidden shadow-[0_-4px_30px_rgba(0,0,0,0.8)]">
        {[
          { id: 'circuit', label: 'Circuit', icon: Zap },
          { id: 'instruments', label: 'Instruments', icon: Activity },
          { id: '3d', label: '3D Lab', icon: Rotate3d },
          { id: 'challenges', label: 'Puzzles', icon: Trophy },
          { id: 'presets', label: 'Examples', icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundFX.playClick();
                NativeBridge.haptic('light');
                handleSelectScreen(item.id as MainNavScreen);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-tight font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Status / Hints overlay at bottom right */}
      <div className="fixed bottom-3 right-4 z-20 pointer-events-none hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-300 glass-pill px-3.5 py-1.5 rounded-full shadow-lg">
        {viewMode === '3d' ? (
          <>
            <span className="text-cyan-400 font-semibold">Left-drag: Orbit</span>
            <span className="text-white/20">•</span>
            <span className="text-purple-300">Right-drag: Pan</span>
            <span className="text-white/20">•</span>
            <span className="text-emerald-300">Scroll: Zoom</span>
            <span className="text-white/20">•</span>
            <span>Click switch to flip</span>
            <span className="text-white/20">•</span>
            <span>Click pins to wire</span>
          </>
        ) : (
          <>
            <span>Click pin to wire</span>
            <span className="text-white/20">•</span>
            <span>Drag probes on board</span>
            <span className="text-white/20">•</span>
            <span>Space: Pause/Run</span>
            <span className="text-white/20">•</span>
            <span>R: Rotate</span>
            <span className="text-white/20">•</span>
            <span>Del: Remove</span>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
