import { ComponentType, ComponentCategory, PinDefinition, CircuitComponent, CircuitPin } from '../types/circuit';

export interface ComponentMeta {
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  description: string;
  defaultProps: {
    resistance?: number;
    capacitance?: number;
    inductance?: number;
    voltage?: number;
    frequency?: number;
    waveType?: 'sine' | 'square' | 'triangle';
    relayEnergized?: boolean;
    color?: string;
    closed?: boolean;
    sliderValue?: number;
    ratedPower?: number;
    maxCurrent?: number;
    charge?: number;
  };
  pins: PinDefinition[];
}

export const COMPONENT_REGISTRY: Record<ComponentType, ComponentMeta> = {
  battery: {
    type: 'battery',
    name: 'DC Battery (9V)',
    category: 'sources',
    description: 'Constant DC voltage supply. Anode (+) and Cathode (-).',
    defaultProps: {
      voltage: 9.0,
    },
    pins: [
      { id: 'pos', label: '+', xOffset: 2, yOffset: 0 },
      { id: 'neg', label: '-', xOffset: -2, yOffset: 0 },
    ],
  },
  ac_source: {
    type: 'ac_source',
    name: 'AC Signal Generator',
    category: 'sources',
    description: 'Precision AC waveform generator (Sine, Square, Triangle) with adjustable frequency and amplitude.',
    defaultProps: {
      voltage: 5.0, // 5V peak
      frequency: 60.0, // 60Hz default
      waveType: 'sine',
    },
    pins: [
      { id: 'pos', label: '~', xOffset: 2, yOffset: 0 },
      { id: 'neg', label: '-', xOffset: -2, yOffset: 0 },
    ],
  },
  ground: {
    type: 'ground',
    name: 'Ground (0V)',
    category: 'sources',
    description: 'Reference 0V potential ground plane.',
    defaultProps: {
      voltage: 0,
    },
    pins: [
      { id: 'gnd', label: 'GND', xOffset: 0, yOffset: 0 },
    ],
  },
  resistor: {
    type: 'resistor',
    name: 'Resistor (330Ω)',
    category: 'passives',
    description: 'Limits current flow according to Ohm\'s Law V = I * R.',
    defaultProps: {
      resistance: 330,
      ratedPower: 0.25, // 0.25W 1/4W resistor
    },
    pins: [
      { id: 'p1', label: '1', xOffset: -2, yOffset: 0 },
      { id: 'p2', label: '2', xOffset: 2, yOffset: 0 },
    ],
  },
  potentiometer: {
    type: 'potentiometer',
    name: 'Potentiometer (10kΩ)',
    category: 'passives',
    description: '3-terminal variable resistor / voltage divider with adjustable wiper.',
    defaultProps: {
      resistance: 10000,
      sliderValue: 0.5,
    },
    pins: [
      { id: 'a', label: 'A', xOffset: -2, yOffset: -1 },
      { id: 'w', label: 'W', xOffset: 0, yOffset: 1 },
      { id: 'b', label: 'B', xOffset: 2, yOffset: -1 },
    ],
  },
  capacitor: {
    type: 'capacitor',
    name: 'Capacitor (100μF)',
    category: 'passives',
    description: 'Stores electrical energy in an electrostatic field. Polarized electrolytic.',
    defaultProps: {
      capacitance: 0.0001, // 100uF
      charge: 0,
    },
    pins: [
      { id: 'pos', label: '+', xOffset: -1, yOffset: 0 },
      { id: 'neg', label: '-', xOffset: 1, yOffset: 0 },
    ],
  },
  inductor: {
    type: 'inductor',
    name: 'Inductor Coil (10mH)',
    category: 'passives',
    description: 'Stores energy in a magnetic field. Resists sudden changes in current (V = L * di/dt).',
    defaultProps: {
      inductance: 0.01, // 10mH
    },
    pins: [
      { id: 'p1', label: '1', xOffset: -2, yOffset: 0 },
      { id: 'p2', label: '2', xOffset: 2, yOffset: 0 },
    ],
  },
  led: {
    type: 'led',
    name: 'Red LED',
    category: 'outputs',
    description: 'Light Emitting Diode. Emits photons when forward biased (>2.0V). Max 30mA!',
    defaultProps: {
      color: 'red',
      maxCurrent: 0.030, // 30mA max before popping
    },
    pins: [
      { id: 'anode', label: 'A(+)', xOffset: -1, yOffset: 0 },
      { id: 'cathode', label: 'K(-)', xOffset: 1, yOffset: 0 },
    ],
  },
  diode: {
    type: 'diode',
    name: 'Rectifier Diode',
    category: 'semiconductors',
    description: 'Allows current to flow predominantly in one direction (Anode -> Cathode).',
    defaultProps: {
      maxCurrent: 1.0,
    },
    pins: [
      { id: 'anode', label: 'A', xOffset: -1, yOffset: 0 },
      { id: 'cathode', label: 'K', xOffset: 1, yOffset: 0 },
    ],
  },
  switch: {
    type: 'switch',
    name: 'Toggle Switch (SPST)',
    category: 'switches',
    description: 'Single-pole single-throw toggle switch. Low-resistance when closed.',
    defaultProps: {
      closed: false,
    },
    pins: [
      { id: 'p1', label: '1', xOffset: -1, yOffset: 0 },
      { id: 'p2', label: '2', xOffset: 1, yOffset: 0 },
    ],
  },
  pushbutton: {
    type: 'pushbutton',
    name: 'Push Button (Tactile)',
    category: 'switches',
    description: 'Normally-open momentary push button. Connects when held down.',
    defaultProps: {
      closed: false,
    },
    pins: [
      { id: 'p1', label: '1', xOffset: -1, yOffset: 0 },
      { id: 'p2', label: '2', xOffset: 1, yOffset: 0 },
    ],
  },
  relay: {
    type: 'relay',
    name: 'SPDT Relay (5V Coil)',
    category: 'switches',
    description: 'Electro-mechanical relay switch. Energizing coil snaps Common contact from NC to NO.',
    defaultProps: {
      voltage: 5.0,
      relayEnergized: false,
    },
    pins: [
      { id: 'coil1', label: 'C1', xOffset: -2, yOffset: -1 },
      { id: 'coil2', label: 'C2', xOffset: -2, yOffset: 1 },
      { id: 'com', label: 'COM', xOffset: 0, yOffset: 0 },
      { id: 'nc', label: 'NC', xOffset: 2, yOffset: -1 },
      { id: 'no', label: 'NO', xOffset: 2, yOffset: 1 },
    ],
  },
  ldr: {
    type: 'ldr',
    name: 'Photoresistor (LDR)',
    category: 'sensors',
    description: 'Light Dependent Resistor. Resistance drops with ambient light.',
    defaultProps: {
      sliderValue: 0.5, // 50% ambient light
      resistance: 10000,
    },
    pins: [
      { id: 'p1', label: '1', xOffset: -1, yOffset: 0 },
      { id: 'p2', label: '2', xOffset: 1, yOffset: 0 },
    ],
  },
  transistor_npn: {
    type: 'transistor_npn',
    name: 'NPN Transistor (2N2222)',
    category: 'semiconductors',
    description: 'Bipolar junction transistor. Base current controls Collector-Emitter current.',
    defaultProps: {},
    pins: [
      { id: 'b', label: 'B', xOffset: -1, yOffset: 0 },
      { id: 'c', label: 'C', xOffset: 1, yOffset: -1 },
      { id: 'e', label: 'E', xOffset: 1, yOffset: 1 },
    ],
  },
  buzzer: {
    type: 'buzzer',
    name: 'Piezo Buzzer',
    category: 'outputs',
    description: 'Acoustic sound transducer. Converts voltage into audible tone.',
    defaultProps: {
      voltage: 5,
    },
    pins: [
      { id: 'pos', label: '+', xOffset: -1, yOffset: 0 },
      { id: 'neg', label: '-', xOffset: 1, yOffset: 0 },
    ],
  },
  gate_and: {
    type: 'gate_and',
    name: 'AND Gate (74HC08)',
    category: 'logic',
    description: 'Logic gate: Output = HIGH (5V) only if both Input A and Input B are HIGH.',
    defaultProps: {},
    pins: [
      { id: 'in1', label: 'A', xOffset: -2, yOffset: -1 },
      { id: 'in2', label: 'B', xOffset: -2, yOffset: 1 },
      { id: 'out', label: 'Y', xOffset: 2, yOffset: 0 },
    ],
  },
  gate_or: {
    type: 'gate_or',
    name: 'OR Gate (74HC32)',
    category: 'logic',
    description: 'Logic gate: Output = HIGH (5V) if either Input A or Input B is HIGH.',
    defaultProps: {},
    pins: [
      { id: 'in1', label: 'A', xOffset: -2, yOffset: -1 },
      { id: 'in2', label: 'B', xOffset: -2, yOffset: 1 },
      { id: 'out', label: 'Y', xOffset: 2, yOffset: 0 },
    ],
  },
  gate_not: {
    type: 'gate_not',
    name: 'NOT Inverter (74HC04)',
    category: 'logic',
    description: 'Logic inverter: Output = HIGH when Input is LOW, and vice versa.',
    defaultProps: {},
    pins: [
      { id: 'in', label: 'A', xOffset: -2, yOffset: 0 },
      { id: 'out', label: 'Y', xOffset: 2, yOffset: 0 },
    ],
  },
  gate_xor: {
    type: 'gate_xor',
    name: 'XOR Gate (74HC86)',
    category: 'logic',
    description: 'Exclusive-OR gate: Output = HIGH when exactly one input is HIGH.',
    defaultProps: {},
    pins: [
      { id: 'in1', label: 'A', xOffset: -2, yOffset: -1 },
      { id: 'in2', label: 'B', xOffset: -2, yOffset: 1 },
      { id: 'out', label: 'Y', xOffset: 2, yOffset: 0 },
    ],
  },
  timer_555: {
    type: 'timer_555',
    name: 'NE555 Precision Timer',
    category: 'semiconductors',
    description: 'Classic 8-pin timer IC for pulse generation, oscillators, and clocks.',
    defaultProps: {
      charge: 0,
    },
    pins: [
      { id: 'gnd', label: 'GND', xOffset: -2, yOffset: -3 },
      { id: 'trig', label: 'TRIG', xOffset: -2, yOffset: -1 },
      { id: 'out', label: 'OUT', xOffset: -2, yOffset: 1 },
      { id: 'rst', label: 'RST', xOffset: -2, yOffset: 3 },
      { id: 'vcc', label: 'VCC', xOffset: 2, yOffset: -3 },
      { id: 'disch', label: 'DIS', xOffset: 2, yOffset: -1 },
      { id: 'thres', label: 'THR', xOffset: 2, yOffset: 1 },
      { id: 'ctrl', label: 'CV', xOffset: 2, yOffset: 3 },
    ],
  },
};

/**
 * Computes pin positions rotated and translated to canvas grid units
 */
export function getComponentPins(comp: CircuitComponent): CircuitPin[] {
  const meta = COMPONENT_REGISTRY[comp.type];
  if (!meta) return [];

  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));

  return meta.pins.map((p) => {
    const rx = p.xOffset * cos - p.yOffset * sin;
    const ry = p.xOffset * sin + p.yOffset * cos;

    return {
      id: `${comp.id}:${p.id}`,
      componentId: comp.id,
      pinDefId: p.id,
      x: comp.x + rx,
      y: comp.y + ry,
    };
  });
}
