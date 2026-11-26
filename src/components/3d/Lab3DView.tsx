import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CircuitComponent,
  CircuitWire,
  CircuitPin,
  SimulationResult,
  GlassTheme,
  ComponentType,
} from '../../types/circuit';
import { getComponentPins } from '../../engine/ComponentRegistry';
import { buildComponent3D, buildWire3D } from './models3d';
import { GLASS_THEMES } from '../../theme/glassTheme';
import { soundFX } from '../../audio/SoundFX';
import { NativeBridge } from '../../utils/nativeBridge';
import { isLowEndDevice } from '../../utils/devicePerf';

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m && typeof m.dispose === 'function' && m.dispose());
      } else if (typeof mesh.material.dispose === 'function') {
        mesh.material.dispose();
      }
    }
  });
}
import {
  Rotate3d,
  Compass,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Eye,
  Sliders,
  Play,
  RotateCw,
  ChevronDown,
} from 'lucide-react';

interface Lab3DViewProps {
  components: CircuitComponent[];
  wires: CircuitWire[];
  simulation: SimulationResult;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponent: (id: string, partial: Partial<CircuitComponent['properties']>) => void;
  onAddWire: (fromPinId: string, toPinId: string) => void;
  onSpawnComponent: (type: ComponentType, atPos?: { x: number; y: number }) => void;
  glassTheme: GlassTheme;
}

export const Lab3DView: React.FC<Lab3DViewProps> = ({
  components,
  wires,
  simulation,
  selectedComponentId,
  onSelectComponent,
  onUpdateComponent,
  onAddWire,
  onSpawnComponent,
  glassTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const componentsGroupRef = useRef<THREE.Group | null>(null);
  const wiresGroupRef = useRef<THREE.Group | null>(null);
  const pulsesGroupRef = useRef<THREE.Group | null>(null);
  const pinMarkersGroupRef = useRef<THREE.Group | null>(null);

  // Interaction State
  const [wiringFromPin, setWiringFromPin] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [isCinematicSpin, setIsCinematicSpin] = useState<boolean>(false);
  const isCinematicSpinRef = useRef<boolean>(false);
  isCinematicSpinRef.current = isCinematicSpin;
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'isometric' | 'top'>('perspective');
  const [cameraMenuOpen, setCameraMenuOpen] = useState<boolean>(false);

  const themeConfig = GLASS_THEMES[glassTheme] || GLASS_THEMES.cyber;

  // --------------------------------------------------------------------------
  // INITIALIZE THREE.JS SCENE
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(0, 15, 18);
    cameraRef.current = camera;

    // Renderer (adapt quality on budget Android GPUs to prevent Unresponsive GPU ANRs)
    const lowEnd = isLowEndDevice();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowEnd,
      powerPreference: lowEnd ? 'low-power' : 'default',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : 1.5));
    renderer.shadowMap.enabled = !lowEnd;
    if (!lowEnd) {
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't flip below table
    controls.minDistance = 4;
    controls.maxDistance = 120;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // ------------------------------------------------------------------------
    // LIGHTING SETUP
    // ------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(themeConfig.ambientColor, 1.4);
    ambientLight.name = 'ambient_light';
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 45, 120, Math.PI / 3, 0.4, 1.2);
    mainSpot.position.set(6, 30, 12);
    mainSpot.castShadow = !lowEnd;
    if (!lowEnd) {
      mainSpot.shadow.mapSize.width = 1024;
      mainSpot.shadow.mapSize.height = 1024;
      mainSpot.shadow.camera.near = 10;
      mainSpot.shadow.camera.far = 80;
      mainSpot.shadow.bias = -0.001;
    }
    scene.add(mainSpot);

    // Rim lighting (cyber specular sheen)
    const cyanRim = new THREE.PointLight(themeConfig.gridGlowColor, 18, 60);
    cyanRim.position.set(-20, 15, -20);
    scene.add(cyanRim);

    const violetRim = new THREE.PointLight(0xa855f7, 12, 60);
    violetRim.position.set(25, 12, 25);
    scene.add(violetRim);

    // ------------------------------------------------------------------------
    // GLASS LAB WORKBENCH & CIRCUIT BOARD TABLE
    // ------------------------------------------------------------------------
    const tableGroup = new THREE.Group();
    tableGroup.name = 'workbench_table';

    // 1. Tempered Frosted Dark Glass Surface (single-pass material: avoids double-render transmission FBO stall)
    const glassGeo = new THREE.BoxGeometry(60, 0.4, 48);
    const glassMat = new THREE.MeshStandardMaterial({
      color: themeConfig.tableGlassColor,
      metalness: 0.25,
      roughness: 0.14,
      transparent: true,
      opacity: 0.84,
    });
    const glassTable = new THREE.Mesh(glassGeo, glassMat);
    glassTable.position.set(0, -0.2, 0);
    glassTable.receiveShadow = !lowEnd;
    tableGroup.add(glassTable);

    // 2. Beveled Metallic Outer Frame
    const frameGeo = new THREE.BoxGeometry(61.5, 0.6, 49.5);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, -0.4, 0);
    tableGroup.add(frame);

    // 3. Standoff Cylinders at 4 Corners
    const standoffGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 24);
    const standoffMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.2,
    });
    const corners = [
      [-28, -1.6, -22],
      [28, -1.6, -22],
      [-28, -1.6, 22],
      [28, -1.6, 22],
    ];
    corners.forEach(([cx, cy, cz]) => {
      const leg = new THREE.Mesh(standoffGeo, standoffMat);
      leg.position.set(cx, cy, cz);
      tableGroup.add(leg);
    });

    // 4. Glowing Sci-Fi Matrix Grid underneath the Glass
    const gridHelper = new THREE.GridHelper(56, 56, themeConfig.gridGlowColor, 0x1e293b);
    gridHelper.position.set(0, 0.01, 0);
    gridHelper.name = 'sci_fi_grid';
    tableGroup.add(gridHelper);

    // 5. Breadboard hole dots
    const dotsGeo = new THREE.BufferGeometry();
    const dotCoords: number[] = [];
    for (let gx = -26; gx <= 26; gx += 1) {
      for (let gz = -20; gz <= 20; gz += 1) {
        dotCoords.push(gx, 0.02, gz);
      }
    }
    dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotCoords, 3));
    const dotsMat = new THREE.PointsMaterial({
      color: themeConfig.gridGlowColor,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
    });
    const dotsMesh = new THREE.Points(dotsGeo, dotsMat);
    tableGroup.add(dotsMesh);

    scene.add(tableGroup);

    // ------------------------------------------------------------------------
    // COMPONENT & WIRE CONTAINERS
    // ------------------------------------------------------------------------
    const compsGroup = new THREE.Group();
    compsGroup.name = 'components_group';
    scene.add(compsGroup);
    componentsGroupRef.current = compsGroup;

    const wiresGroup = new THREE.Group();
    wiresGroup.name = 'wires_group';
    scene.add(wiresGroup);
    wiresGroupRef.current = wiresGroup;

    const pulsesGroup = new THREE.Group();
    pulsesGroup.name = 'pulses_group';
    scene.add(pulsesGroup);
    pulsesGroupRef.current = pulsesGroup;

    const pinMarkersGroup = new THREE.Group();
    pinMarkersGroup.name = 'pin_markers_group';
    scene.add(pinMarkersGroup);
    pinMarkersGroupRef.current = pinMarkersGroup;

    // ------------------------------------------------------------------------
    // RESIZE OBSERVER
    // ------------------------------------------------------------------------
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // ------------------------------------------------------------------------
    // ANIMATION RENDER LOOP (pauses cleanly when app is hidden / ad is shown)
    // ------------------------------------------------------------------------
    let reqId = 0;
    let isDisposed = false;
    let lastAnimTime = performance.now();
    const minFrameIntervalMs = lowEnd ? 33 : 0; // ~30 FPS cap on budget GPUs

    const animate = () => {
      if (isDisposed || document.hidden) {
        reqId = 0;
        return;
      }
      reqId = requestAnimationFrame(animate);
      const now = performance.now();
      if (minFrameIntervalMs > 0 && now - lastAnimTime < minFrameIntervalMs) {
        return;
      }
      const delta = Math.min(0.05, (now - lastAnimTime) / 1000);
      lastAnimTime = now;

      // Cinematic turntable spin
      if (isCinematicSpinRef.current && controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
      } else if (controls) {
        controls.autoRotate = false;
      }

      controls.update();

      // Flowing electron charge pulses along 3D wires
      if (pulsesGroupRef.current) {
        pulsesGroupRef.current.children.forEach((pulseGroup) => {
          pulseGroup.children.forEach((pMesh: any) => {
            if (pMesh.userData && pMesh.userData.curve) {
              const speed = pMesh.userData.speed || 0.8;
              let prog = pMesh.userData.progress + speed * delta * 0.4;
              if (prog > 1) prog -= 1;
              if (prog < 0) prog += 1;
              pMesh.userData.progress = prog;

              const pt = pMesh.userData.curve.getPoint(prog);
              pMesh.position.copy(pt);
            }
          });
        });
      }

      renderer.render(scene, camera);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (reqId) {
          cancelAnimationFrame(reqId);
          reqId = 0;
        }
      } else if (!isDisposed && !reqId) {
        lastAnimTime = performance.now();
        reqId = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!document.hidden) {
      animate();
    }

    return () => {
      isDisposed = true;
      if (reqId) cancelAnimationFrame(reqId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
    };
  }, [glassTheme]);

  // --------------------------------------------------------------------------
  // REBUILD 3D COMPONENTS & WIRES WHEN CIRCUIT CHANGES
  // --------------------------------------------------------------------------
  useEffect(() => {
    const compsGroup = componentsGroupRef.current;
    const wiresGroup = wiresGroupRef.current;
    const pulsesGroup = pulsesGroupRef.current;
    const pinMarkersGroup = pinMarkersGroupRef.current;

    if (!compsGroup || !wiresGroup || !pulsesGroup || !pinMarkersGroup) return;

    // 1. Clear and dispose existing meshes to prevent GPU VRAM leaks
    while (compsGroup.children.length > 0) {
      const child = compsGroup.children[0];
      compsGroup.remove(child);
      disposeObject3D(child);
    }
    while (wiresGroup.children.length > 0) {
      const child = wiresGroup.children[0];
      wiresGroup.remove(child);
      disposeObject3D(child);
    }
    while (pulsesGroup.children.length > 0) {
      const child = pulsesGroup.children[0];
      pulsesGroup.remove(child);
      disposeObject3D(child);
    }
    while (pinMarkersGroup.children.length > 0) {
      const child = pinMarkersGroup.children[0];
      pinMarkersGroup.remove(child);
      disposeObject3D(child);
    }

    // 2. Build 3D Components
    for (const comp of components) {
      const isSelected = comp.id === selectedComponentId;
      const mesh3D = buildComponent3D(comp, simulation, isSelected);
      mesh3D.userData = { componentId: comp.id, type: comp.type };
      compsGroup.add(mesh3D);
    }

    // 3. Build Pin Positions Map
    const pinMap = new Map<string, CircuitPin>();
    for (const comp of components) {
      for (const p of getComponentPins(comp)) {
        pinMap.set(p.id, p);

        // Interactive 3D Pin Target Disc
        const pinMarkerGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16);
        const isWiringSource = wiringFromPin === p.id;
        const pinMarkerMat = new THREE.MeshBasicMaterial({
          color: isWiringSource ? 0xef4444 : 0x06b6d4,
          transparent: true,
          opacity: isWiringSource ? 0.9 : 0.45,
        });
        const marker = new THREE.Mesh(pinMarkerGeo, pinMarkerMat);
        marker.position.set(p.x, 0.08, p.y);
        marker.userData = { pinId: p.id, isPin: true };
        pinMarkersGroup.add(marker);
      }
    }

    // 4. Build 3D Wires & Flowing Pulses
    for (const wire of wires) {
      const fromPin = pinMap.get(wire.fromPinId);
      const toPin = pinMap.get(wire.toPinId);
      if (fromPin && toPin) {
        const { tube, pulseGroup } = buildWire3D(wire, fromPin, toPin, simulation);
        tube.userData = { wireId: wire.id };
        wiresGroup.add(tube);
        pulsesGroup.add(pulseGroup);
      }
    }
  }, [components, wires, simulation, selectedComponentId, wiringFromPin]);

  // --------------------------------------------------------------------------
  // CAMERA PRESETS (Perspective, Isometric, Top-Down)
  // --------------------------------------------------------------------------
  const setCameraView = useCallback((preset: 'perspective' | 'isometric' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setCameraPreset(preset);
    soundFX.playClick(1.2);
    NativeBridge.haptic('light');

    // Calculate center of components
    let cx = 0;
    let cz = 0;
    if (components.length > 0) {
      cx = components.reduce((acc, c) => acc + c.x, 0) / components.length;
      cz = components.reduce((acc, c) => acc + c.y, 0) / components.length;
    }
    controls.target.set(cx, 0, cz);

    if (preset === 'perspective') {
      camera.position.set(cx, 14, cz + 16);
    } else if (preset === 'isometric') {
      camera.position.set(cx + 15, 18, cz + 15);
    } else if (preset === 'top') {
      camera.position.set(cx, 24, cz + 0.1);
    }
    controls.update();
  }, [components]);

  // --------------------------------------------------------------------------
  // RAYCASTING & 3D INTERACTION
  // --------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // 1. Check Pin clicks for 3D Wiring!
    if (pinMarkersGroupRef.current) {
      const pinHits = raycaster.intersectObjects(pinMarkersGroupRef.current.children, false);
      if (pinHits.length > 0) {
        const hitPin = pinHits[0].object;
        const pinId = hitPin.userData.pinId;
        if (pinId) {
          if (!wiringFromPin) {
            setWiringFromPin(pinId);
            soundFX.playClick(1.5);
            NativeBridge.haptic('light');
          } else if (wiringFromPin !== pinId) {
            onAddWire(wiringFromPin, pinId);
            setWiringFromPin(null);
            soundFX.playConnect();
            NativeBridge.haptic('heavy');
          } else {
            setWiringFromPin(null);
          }
          return;
        }
      }
    }

    // 2. Check Component Clicks (Toggle switches, select parts)
    if (componentsGroupRef.current) {
      const compHits = raycaster.intersectObjects(componentsGroupRef.current.children, true);
      if (compHits.length > 0) {
        let obj: THREE.Object3D | null = compHits[0].object;
        let compId: string | null = null;
        while (obj && obj !== componentsGroupRef.current) {
          if (obj.userData?.componentId) {
            compId = obj.userData.componentId;
            break;
          }
          obj = obj.parent;
        }

        if (compId) {
          const comp = components.find((c) => c.id === compId);
          if (comp) {
            // If it's a switch, toggle it instantly in 3D!
            if (comp.type === 'switch') {
              soundFX.playClick(comp.properties.closed ? 1.0 : 1.6);
              NativeBridge.haptic('medium');
              onUpdateComponent(comp.id, { closed: !comp.properties.closed });
              return;
            }
            // If pushbutton, pulse it
            if (comp.type === 'pushbutton') {
              soundFX.playClick(1.8);
              NativeBridge.haptic('medium');
              onUpdateComponent(comp.id, { closed: true });
              setTimeout(() => {
                onUpdateComponent(comp.id, { closed: false });
              }, 200);
              return;
            }

            // Otherwise, select the component
            soundFX.playClick(1.2);
            NativeBridge.haptic('light');
            onSelectComponent(comp.id);
            return;
          }
        }
      } else {
        // Clicked empty table
        onSelectComponent(null);
        setWiringFromPin(null);
      }
    }
  };

  // Drag and drop from drawer into 3D world
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/electrolab-component') as ComponentType;
    if (!type) return;

    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // Intersect horizontal ground plane Y = 0
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    const gx = Math.round(target.x);
    const gy = Math.round(target.z);

    soundFX.playConnect();
    NativeBridge.haptic('medium');
    onSpawnComponent(type, { x: gx, y: gy });
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-hidden select-none bg-slate-950"
    >
      {/* Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Sleek Floating 3D Camera Controls (Top Right - never collides with experiment widget) */}
      <div className="absolute top-16 right-4 sm:right-6 z-20 flex flex-col items-end font-sans">
        <button
          onClick={() => {
            soundFX.playClick();
            NativeBridge.haptic('light');
            setCameraMenuOpen(!cameraMenuOpen);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-white shadow-xl transition active:scale-95"
          title="3D Camera View Angles"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="capitalize">{cameraPreset === 'perspective' ? '3D View' : cameraPreset}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-200 ${cameraMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {cameraMenuOpen && (
          <div className="mt-1.5 p-1.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl flex flex-col gap-1 w-44 animate-in fade-in">
            <button
              onClick={() => {
                setCameraView('perspective');
                setCameraMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                cameraPreset === 'perspective' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Perspective</span>
            </button>

            <button
              onClick={() => {
                setCameraView('isometric');
                setCameraMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                cameraPreset === 'isometric' ? 'bg-purple-500/25 text-purple-300 border border-purple-400/50' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Isometric</span>
            </button>

            <button
              onClick={() => {
                setCameraView('top');
                setCameraMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                cameraPreset === 'top' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Down (PCB)</span>
            </button>

            <div className="h-px bg-white/10 my-0.5" />

            <button
              onClick={() => {
                setIsCinematicSpin((prev) => !prev);
                soundFX.playClick();
                NativeBridge.haptic('light');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isCinematicSpin ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>360° Cinematic Orbit</span>
            </button>
          </div>
        )}
      </div>

      {/* Wiring In-Progress 3D Notification Pill */}
      {wiringFromPin && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full glass-panel-glow border-cyan-400 text-xs text-white font-mono shadow-2xl animate-pulse">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Click target 3D pin to finish connection</span>
          <button
            onClick={() => setWiringFromPin(null)}
            className="ml-2 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-full text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3D Glass Badge Indicator (Bottom Left) */}
      <div
        style={{ bottom: 'calc(var(--ad-banner-height, 0px) + 84px)' }}
        className="absolute left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-panel text-[11px] font-mono text-slate-300 transition-[bottom] duration-200"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>3D WebGL Engine</span>
        <span className="text-white/30">•</span>
        <span className="text-cyan-400">PBR Materials & Lights</span>
      </div>
    </div>
  );
};
