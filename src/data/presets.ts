// ============================================================================
// ElectroCraft Ready-to-Run Preset Circuits
// ============================================================================

import { CircuitComponent, CircuitWire } from '../types/circuit';

export interface CircuitPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  components: CircuitComponent[];
  wires: CircuitWire[];
}

export const PRESET_CIRCUITS: CircuitPreset[] = [
  {
    id: 'led-dimmer',
    name: 'Potentiometer LED Dimmer',
    category: 'Analog',
    description: 'Smoothly adjust LED brightness in real-time with an analog rotary potentiometer voltage divider.',
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'pot1', type: 'potentiometer', x: -1, y: 0, rotation: 0, properties: { resistance: 10000, sliderValue: 0.65 } },
      { id: 'res1', type: 'resistor', x: 5, y: -2, rotation: 0, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 9, y: 0, rotation: 90, properties: { color: 'amber' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'pot1:a', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'bat1:neg', toPinId: 'pot1:b', color: '#64748b', current: 0 },
      { id: 'w3', fromPinId: 'pot1:w', toPinId: 'res1:p1', color: '#f59e0b', current: 0 },
      { id: 'w4', fromPinId: 'res1:p2', toPinId: 'led1:anode', color: '#f59e0b', current: 0 },
      { id: 'w5', fromPinId: 'led1:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w6', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
  {
    id: 'timer-555-oscillator',
    name: '555 Astable Square Wave Generator',
    category: 'Oscillators',
    description: 'Classic NE555 timer generating continuous periodic pulses to drive an LED and piezo buzzer.',
    components: [
      { id: 'bat1', type: 'battery', x: -10, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'ic1', type: 'timer_555', x: 0, y: 0, rotation: 0, properties: {} },
      { id: 'r1', type: 'resistor', x: 6, y: -4, rotation: 90, properties: { resistance: 4700 } },
      { id: 'r2', type: 'resistor', x: 6, y: 0, rotation: 90, properties: { resistance: 10000 } },
      { id: 'c1', type: 'capacitor', x: 6, y: 4, rotation: 90, properties: { capacitance: 22e-6 } },
      { id: 'r_led', type: 'resistor', x: -6, y: 4, rotation: 0, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: -2, y: 4, rotation: 0, properties: { color: 'green' } },
      { id: 'buzzer1', type: 'buzzer', x: -6, y: -4, rotation: 0, properties: {} },
      { id: 'gnd1', type: 'ground', x: -10, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'ic1:vcc', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'bat1:pos', toPinId: 'ic1:rst', color: '#ef4444', current: 0 },
      { id: 'w3', fromPinId: 'bat1:neg', toPinId: 'ic1:gnd', color: '#64748b', current: 0 },
      { id: 'w4', fromPinId: 'bat1:pos', toPinId: 'r1:p1', color: '#ef4444', current: 0 },
      { id: 'w5', fromPinId: 'r1:p2', toPinId: 'ic1:disch', color: '#38bdf8', current: 0 },
      { id: 'w6', fromPinId: 'ic1:disch', toPinId: 'r2:p1', color: '#38bdf8', current: 0 },
      { id: 'w7', fromPinId: 'r2:p2', toPinId: 'ic1:thres', color: '#38bdf8', current: 0 },
      { id: 'w8', fromPinId: 'ic1:thres', toPinId: 'ic1:trig', color: '#38bdf8', current: 0 },
      { id: 'w9', fromPinId: 'ic1:trig', toPinId: 'c1:pos', color: '#38bdf8', current: 0 },
      { id: 'w10', fromPinId: 'c1:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w11', fromPinId: 'ic1:out', toPinId: 'r_led:p1', color: '#22c55e', current: 0 },
      { id: 'w12', fromPinId: 'r_led:p2', toPinId: 'led1:anode', color: '#22c55e', current: 0 },
      { id: 'w13', fromPinId: 'led1:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w14', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
  {
    id: 'ac-rlc-resonance',
    name: 'AC RLC Resonant Circuit & Filter',
    category: 'AC / RF',
    description: 'AC Signal Generator driving a series Inductor and Capacitor circuit demonstrating resonance and phase shifts.',
    components: [
      { id: 'ac1', type: 'ac_source', x: -8, y: 0, rotation: 90, properties: { voltage: 8.0, frequency: 120, waveType: 'sine' } },
      { id: 'ind1', type: 'inductor', x: -2, y: -4, rotation: 0, properties: { inductance: 0.02 } },
      { id: 'cap1', type: 'capacitor', x: 4, y: -4, rotation: 0, properties: { capacitance: 47e-6 } },
      { id: 'res1', type: 'resistor', x: 8, y: 0, rotation: 90, properties: { resistance: 100 } },
      { id: 'gnd1', type: 'ground', x: -8, y: 4, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'ac1:pos', toPinId: 'ind1:p1', color: '#06b6d4', current: 0 },
      { id: 'w2', fromPinId: 'ind1:p2', toPinId: 'cap1:pos', color: '#06b6d4', current: 0 },
      { id: 'w3', fromPinId: 'cap1:neg', toPinId: 'res1:p1', color: '#06b6d4', current: 0 },
      { id: 'w4', fromPinId: 'res1:p2', toPinId: 'ac1:neg', color: '#64748b', current: 0 },
      { id: 'w5', fromPinId: 'ac1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
  {
    id: 'relay-latching-alarm',
    name: 'Relay Latching Security Alarm',
    category: 'Electromechanical',
    description: 'Press the push-button trigger: the electromechanical SPDT relay energizes and latches itself ON, continuously sounding the alarm!',
    components: [
      { id: 'bat1', type: 'battery', x: -10, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'btn1', type: 'pushbutton', x: -5, y: -4, rotation: 0, properties: { closed: false } },
      { id: 'rly1', type: 'relay', x: 1, y: 0, rotation: 0, properties: {} },
      { id: 'buzzer1', type: 'buzzer', x: 7, y: 2, rotation: 0, properties: {} },
      { id: 'res1', type: 'resistor', x: 7, y: -3, rotation: 0, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 11, y: -3, rotation: 0, properties: { color: 'red' } },
      { id: 'gnd1', type: 'ground', x: -10, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'btn1:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'btn1:p2', toPinId: 'rly1:coil1', color: '#ef4444', current: 0 },
      { id: 'w3', fromPinId: 'rly1:coil2', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w4', fromPinId: 'bat1:pos', toPinId: 'rly1:com', color: '#ef4444', current: 0 },
      { id: 'w5', fromPinId: 'rly1:no', toPinId: 'rly1:coil1', color: '#f59e0b', current: 0 }, // Latching loop!
      { id: 'w6', fromPinId: 'rly1:no', toPinId: 'buzzer1:pos', color: '#f59e0b', current: 0 },
      { id: 'w7', fromPinId: 'buzzer1:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w8', fromPinId: 'rly1:no', toPinId: 'res1:p1', color: '#f59e0b', current: 0 },
      { id: 'w9', fromPinId: 'res1:p2', toPinId: 'led1:anode', color: '#f59e0b', current: 0 },
      { id: 'w10', fromPinId: 'led1:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w11', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
  {
    id: 'logic-exclusive-or',
    name: 'Digital Logic XOR Gate Circuit',
    category: 'Digital',
    description: 'Interactive digital logic circuit demonstrating XOR behavior using two toggle input switches.',
    components: [
      { id: 'bat1', type: 'battery', x: -10, y: 0, rotation: 90, properties: { voltage: 5.0 } },
      { id: 'sw1', type: 'switch', x: -5, y: -3, rotation: 0, properties: { closed: true } },
      { id: 'sw2', type: 'switch', x: -5, y: 3, rotation: 0, properties: { closed: false } },
      { id: 'xor1', type: 'gate_xor', x: 2, y: 0, rotation: 0, properties: {} },
      { id: 'r_out', type: 'resistor', x: 7, y: 0, rotation: 0, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 11, y: 0, rotation: 0, properties: { color: 'blue' } },
      { id: 'gnd1', type: 'ground', x: -10, y: 6, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'sw1:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'bat1:pos', toPinId: 'sw2:p1', color: '#ef4444', current: 0 },
      { id: 'w3', fromPinId: 'sw1:p2', toPinId: 'xor1:in1', color: '#38bdf8', current: 0 },
      { id: 'w4', fromPinId: 'sw2:p2', toPinId: 'xor1:in2', color: '#38bdf8', current: 0 },
      { id: 'w5', fromPinId: 'xor1:out', toPinId: 'r_out:p1', color: '#22c55e', current: 0 },
      { id: 'w6', fromPinId: 'r_out:p2', toPinId: 'led1:anode', color: '#22c55e', current: 0 },
      { id: 'w7', fromPinId: 'led1:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w8', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
  {
    id: 'transistor-dark-detector',
    name: 'Transistor Nightlight Detector',
    category: 'Sensors',
    description: 'Automatic nightlight utilizing an LDR light sensor and an NPN BJT switch.',
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'ldr1', type: 'ldr', x: -2, y: -3, rotation: 0, properties: { sliderValue: 0.15 } },
      { id: 'r_div', type: 'resistor', x: -2, y: 2, rotation: 90, properties: { resistance: 10000 } },
      { id: 'q1', type: 'transistor_npn', x: 2, y: 2, rotation: 0, properties: {} },
      { id: 'r_led', type: 'resistor', x: 2, y: -3, rotation: 90, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 6, y: -1, rotation: 90, properties: { color: 'green' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'ldr1:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'ldr1:p2', toPinId: 'r_div:p1', color: '#38bdf8', current: 0 },
      { id: 'w3', fromPinId: 'r_div:p1', toPinId: 'q1:b', color: '#38bdf8', current: 0 },
      { id: 'w4', fromPinId: 'r_div:p2', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w5', fromPinId: 'bat1:pos', toPinId: 'r_led:p1', color: '#ef4444', current: 0 },
      { id: 'w6', fromPinId: 'r_led:p2', toPinId: 'led1:anode', color: '#22c55e', current: 0 },
      { id: 'w7', fromPinId: 'led1:cathode', toPinId: 'q1:c', color: '#22c55e', current: 0 },
      { id: 'w8', fromPinId: 'q1:e', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w9', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
];
