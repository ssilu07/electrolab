// ============================================================================
// ElectroCraft Circuit & Simulation Types
// ============================================================================

export type ComponentType =
  | 'battery'
  | 'ac_source'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'led'
  | 'diode'
  | 'switch'
  | 'pushbutton'
  | 'relay'
  | 'potentiometer'
  | 'ldr'
  | 'transistor_npn'
  | 'buzzer'
  | 'gate_and'
  | 'gate_or'
  | 'gate_not'
  | 'gate_xor'
  | 'timer_555'
  | 'ground';

export type ComponentCategory =
  | 'sources'
  | 'passives'
  | 'switches'
  | 'sensors'
  | 'outputs'
  | 'semiconductors'
  | 'logic';

export interface PinDefinition {
  id: string; // e.g. "anode", "cathode", "pin1", etc.
  label: string;
  xOffset: number; // Offset from component center in grid units (e.g. -2, 2)
  yOffset: number;
}

export interface CircuitPin {
  id: string; // Unique pin id: `${componentId}:${pinDefId}`
  componentId: string;
  pinDefId: string;
  x: number; // Absolute grid/canvas coordinates
  y: number;
}

export interface CircuitWire {
  id: string;
  fromPinId: string;
  toPinId: string;
  color: string;
  current: number; // Calculated Amperes flowing from pin -> toPin
  isOverheating?: boolean;
}

export interface ComponentProperties {
  resistance?: number; // in Ohms (Resistor, Potentiometer, LDR)
  capacitance?: number; // in Farads (Capacitor)
  inductance?: number; // in Henries (Inductor)
  voltage?: number; // in Volts (Battery, AC generator amplitude)
  frequency?: number; // in Hz (AC generator, e.g. 50Hz, 440Hz, 1000Hz)
  waveType?: 'sine' | 'square' | 'triangle';
  relayEnergized?: boolean; // Relay active state
  color?: string; // LED color: red, green, blue, yellow, amber
  closed?: boolean; // Switch / Pushbutton state
  rotation?: number; // 0, 90, 180, 270 degrees
  sliderValue?: number; // 0..1 for Potentiometer & LDR
  ratedPower?: number; // in Watts (e.g. 0.25W)
  maxCurrent?: number; // in Amperes (e.g. 0.03A for LED)
  label?: string;
  charge?: number; // Capacitor charge / voltage across it
  isBlown?: boolean;
  blownReason?: string;
  internalFrequency?: number; // 555 timer or buzzer
  logicOutputHigh?: boolean; // Logic gate state
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number; // Grid coordinates
  y: number;
  rotation: number; // 0, 90, 180, 270
  properties: ComponentProperties;
}

export interface SimulationResult {
  nodeVoltages: Map<number, number>; // Node ID -> Voltage (V)
  pinToNode: Map<string, number>; // pinId -> Node ID
  pinVoltages: Map<string, number>; // pinId -> Voltage (V)
  branchCurrents: Map<string, number>; // componentId or wireId -> Current (A)
  componentPower: Map<string, number>; // componentId -> Power (W)
  blownComponents: Set<string>; // component IDs that exploded
  oscilloscopeVoltage: number; // Live sample at oscilloscope probe
  buzzerActive: boolean;
  buzzerFreq: number;
  buzzerVolume: number;
  hasShortCircuit: boolean;
  totalCurrent: number; // Sum of all branch currents
  totalPower: number; // Total system dissipation in Watts
  activeNodeCount: number;
  simTime: number; // total simulated seconds
}

export type ViewMode = '3d' | 'workbench' | 'schematic';

export type GlassTheme = 'cyber' | 'midnight' | 'emerald' | 'amber';

export interface MultimeterState {
  enabled: boolean;
  x: number;
  y: number;
  mode: 'voltage_dc' | 'current_ma' | 'resistance' | 'continuity';
  redProbe: { x: number; y: number; attachedPinId: string | null };
  blackProbe: { x: number; y: number; attachedPinId: string | null };
  value: number; // Display reading
  readingText: string;
  unit: string;
  isBeeping: boolean;
}

export interface OscilloscopeState {
  enabled: boolean;
  x: number;
  y: number;
  timeDivMs: number; // e.g. 10ms per div
  voltsDiv: number; // e.g. 1V, 2V, 5V per div
  probe: { x: number; y: number; attachedPinId: string | null };
  groundProbe: { x: number; y: number; attachedPinId: string | null };
  running: boolean;
  samples: number[]; // Rolling waveform buffer
  displayMode: 'waveform' | 'fft';
  fftData: number[]; // Frequency magnitudes
  detectedFreq: number;
}

export interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  timestamp: number;
}

export interface ChallengeLevel {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  initialComponents: CircuitComponent[];
  initialWires: CircuitWire[];
  allowedComponents: ComponentType[];
  targetGoal: string;
  hints: string[];
  maxCost?: number;
  validate: (sim: SimulationResult, components: CircuitComponent[], wires: CircuitWire[]) => {
    completed: boolean;
    stars: number; // 1 to 3
    progressMessage: string;
    details: { text: string; satisfied: boolean }[];
  };
}

export interface Particle {
  id: number;
  type: 'electron' | 'smoke' | 'spark' | 'explosion';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // remaining life 0..1
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  pathWireId?: string;
  pathT?: number; // 0..1 along wire
  speed?: number;
}
