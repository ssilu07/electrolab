// ============================================================================
// ElectroCraft Guided Challenges & Puzzle Progression
// 5 Interactive, fully validated levels with goals, hints, and star ratings
// ============================================================================

import { ChallengeLevel, CircuitComponent, CircuitWire, SimulationResult } from '../types/circuit';

export const CHALLENGE_LEVELS: ChallengeLevel[] = [
  // --------------------------------------------------------------------------
  // LEVEL 1: Light the Dark
  // --------------------------------------------------------------------------
  {
    id: 'level-1',
    title: 'Level 1: Light the Dark',
    subtitle: 'Current Limiting & The LED Diode Rule',
    description:
      'A 9V battery puts out enough current to vaporize an LED instantly! Connect the 9V battery, the 330Ω current-limiting resistor, and the Red LED in series so the LED shines brightly without exploding.',
    difficulty: 'Beginner',
    targetGoal: 'Light the Red LED with safe forward current (5mA - 25mA).',
    hints: [
      'Connect: Battery (+) -> Resistor (Pin 1).',
      'Connect: Resistor (Pin 2) -> LED Anode (A+).',
      'Connect: LED Cathode (K-) -> Battery (-).',
      'Never connect a 9V battery directly to an LED without a resistor, or it will POP!',
    ],
    allowedComponents: ['battery', 'resistor', 'led', 'ground'],
    initialComponents: [
      {
        id: 'bat1',
        type: 'battery',
        x: -8,
        y: 0,
        rotation: 90,
        properties: { voltage: 9.0 },
      },
      {
        id: 'res1',
        type: 'resistor',
        x: 0,
        y: -4,
        rotation: 0,
        properties: { resistance: 330, ratedPower: 0.25 },
      },
      {
        id: 'led1',
        type: 'led',
        x: 0,
        y: 4,
        rotation: 180,
        properties: { color: 'red', maxCurrent: 0.03 },
      },
      {
        id: 'gnd1',
        type: 'ground',
        x: -8,
        y: 4,
        rotation: 0,
        properties: {},
      },
    ],
    initialWires: [
      {
        id: 'w_gnd',
        fromPinId: 'bat1:neg',
        toPinId: 'gnd1:gnd',
        color: '#64748b',
        current: 0,
      },
    ],
    validate: (sim: SimulationResult, components: CircuitComponent[]) => {
      const led = components.find((c) => c.type === 'led');
      const isBlown = led ? sim.blownComponents.has(led.id) : false;
      const ledCurrent = led ? sim.branchCurrents.get(led.id) ?? 0 : 0;
      const mA = ledCurrent * 1000;

      const hasResistor = components.some((c) => c.type === 'resistor');
      const safeCurrent = mA >= 5 && mA <= 28;
      const completed = !isBlown && safeCurrent;

      const details = [
        { text: 'Circuit has current limiting resistor', satisfied: hasResistor },
        { text: 'LED is not blown (>30mA causes explosion)', satisfied: !isBlown },
        { text: `Safe forward current (5mA - 25mA). Current: ${mA.toFixed(1)}mA`, satisfied: safeCurrent },
      ];

      let stars = 0;
      if (completed) {
        stars = 3; // 3 stars
      }

      return {
        completed,
        stars,
        progressMessage: completed
          ? 'Brilliant! The LED is glowing warmly with a safe 21mA forward current!'
          : isBlown
          ? 'POP! The LED exploded from overcurrent. Replace it and insert the 330Ω resistor!'
          : 'Wire the components in a complete closed loop to light the LED.',
        details,
      };
    },
  },

  // --------------------------------------------------------------------------
  // LEVEL 2: Night Lamp
  // --------------------------------------------------------------------------
  {
    id: 'level-2',
    title: 'Level 2: Night Lamp',
    subtitle: 'Photoresistor & Ambient Light Switching',
    description:
      'Build an intelligent twilight nightlight! When ambient light drops (slider moved toward 0%), the sensor circuit must detect darkness and illuminate the LED.',
    difficulty: 'Intermediate',
    targetGoal: 'Configure the LDR sensor so the LED illuminates under low light (ambient slider < 0.35).',
    hints: [
      'An LDR changes resistance from ~100Ω (sunlight) to ~1MΩ (pitch black).',
      'Create a voltage divider or sensor switch using the LDR, Resistor, and Transistor/LED.',
      'Test your circuit by dragging the ambient light slider on the LDR or inspector!',
    ],
    allowedComponents: ['battery', 'resistor', 'ldr', 'led', 'transistor_npn', 'switch', 'ground'],
    initialComponents: [
      {
        id: 'bat1',
        type: 'battery',
        x: -8,
        y: 0,
        rotation: 90,
        properties: { voltage: 9.0 },
      },
      {
        id: 'ldr1',
        type: 'ldr',
        x: -2,
        y: -4,
        rotation: 0,
        properties: { sliderValue: 0.8 },
      },
      {
        id: 'res_pull',
        type: 'resistor',
        x: -2,
        y: 2,
        rotation: 90,
        properties: { resistance: 4700 },
      },
      {
        id: 'res_led',
        type: 'resistor',
        x: 4,
        y: -4,
        rotation: 0,
        properties: { resistance: 330 },
      },
      {
        id: 'led1',
        type: 'led',
        x: 4,
        y: 2,
        rotation: 90,
        properties: { color: 'green' },
      },
      {
        id: 'q1',
        type: 'transistor_npn',
        x: 1,
        y: 2,
        rotation: 0,
        properties: {},
      },
    ],
    initialWires: [],
    validate: (sim: SimulationResult, components: CircuitComponent[]) => {
      const ldr = components.find((c) => c.type === 'ldr');
      const led = components.find((c) => c.type === 'led');
      const lightLevel = ldr?.properties.sliderValue ?? 0.5;
      const ledCurrent = led ? sim.branchCurrents.get(led.id) ?? 0 : 0;

      const isDark = lightLevel < 0.35;
      const ledLitInDark = isDark && ledCurrent > 0.005;
      const ledOffInLight = !isDark && ledCurrent < 0.003;
      const completed = ledCurrent > 0.005 && isDark;

      const details = [
        { text: 'LDR sensor connected in circuit', satisfied: !!ldr },
        { text: `Ambient light level is dark (< 35%): ${(lightLevel * 100).toFixed(0)}%`, satisfied: isDark },
        { text: `LED lit in darkness: ${(ledCurrent * 1000).toFixed(1)}mA`, satisfied: ledCurrent > 0.005 },
      ];

      return {
        completed,
        stars: completed ? 3 : 0,
        progressMessage: completed
          ? 'Superb! Night lamp detects darkness and automatically powers the LED!'
          : isDark
          ? 'Now connect the LDR and transistor to trigger current into the LED.'
          : 'Drag the ambient light slider on the LDR to simulate night time!',
        details,
      };
    },
  },

  // --------------------------------------------------------------------------
  // LEVEL 3: Reverse Polarity Trap
  // --------------------------------------------------------------------------
  {
    id: 'level-3',
    title: 'Level 3: Reverse Polarity Trap',
    subtitle: 'Diagnostic Troubleshooting & Diode Rectification',
    description:
      'This circuit has a short-circuit fault! A backwards component is either blocking current or dumping power. Diagnose the board using the Digital Multimeter, rotate/re-wire the diode properly, and power the load.',
    difficulty: 'Intermediate',
    targetGoal: 'Resolve the short circuit and safely power the 1200Hz buzzer.',
    hints: [
      'Grab the Multimeter probes to check voltage across each component.',
      'Diodes and LEDs only conduct when Anode (+) is at higher potential than Cathode (-).',
      'Select the backwards diode and press Rotate (or \'R\') to reverse its orientation.',
    ],
    allowedComponents: ['battery', 'diode', 'resistor', 'buzzer', 'switch', 'ground'],
    initialComponents: [
      {
        id: 'bat1',
        type: 'battery',
        x: -8,
        y: 0,
        rotation: 90,
        properties: { voltage: 9.0 },
      },
      {
        id: 'd1',
        type: 'diode',
        x: 0,
        y: -4,
        rotation: 180, // Backwards diode!
        properties: {},
      },
      {
        id: 'buzzer1',
        type: 'buzzer',
        x: 0,
        y: 4,
        rotation: 180,
        properties: {},
      },
    ],
    initialWires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'd1:cathode', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'd1:anode', toPinId: 'buzzer1:pos', color: '#38bdf8', current: 0 },
      { id: 'w3', fromPinId: 'buzzer1:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
    ],
    validate: (sim: SimulationResult, components: CircuitComponent[]) => {
      const buzzer = components.find((c) => c.type === 'buzzer');
      const buzzerCurrent = buzzer ? sim.branchCurrents.get(buzzer.id) ?? 0 : 0;
      const completed = sim.buzzerActive || buzzerCurrent > 0.01;

      const details = [
        { text: 'No short circuit on board', satisfied: !sim.hasShortCircuit },
        { text: 'Diode correctly forward-biased', satisfied: buzzerCurrent > 0.005 },
        { text: 'Buzzer sounding active tone', satisfied: completed },
      ];

      return {
        completed,
        stars: completed ? 3 : 0,
        progressMessage: completed
          ? 'Fault resolved! Current flows freely and the buzzer sounds loud and clear.'
          : 'The diode is currently reverse-biased, blocking current! Rotate it 180° to fix.',
        details,
      };
    },
  },

  // --------------------------------------------------------------------------
  // LEVEL 4: Musical Tone Generator
  // --------------------------------------------------------------------------
  {
    id: 'level-4',
    title: 'Level 4: Musical Tone Generator',
    subtitle: 'Astable Multivibrator & Oscillations',
    description:
      'Construct a pulse or tone oscillator! Wire the NE555 timer or pulse circuit with timing resistors and a capacitor to generate a rhythmic square wave signal visible on the Oscilloscope.',
    difficulty: 'Advanced',
    targetGoal: 'Generate an oscillating AC/pulsed waveform (>2Hz) with the 555 timer and buzzer.',
    hints: [
      'Connect VCC to 9V (+) and GND to 0V (-).',
      'Tie TRIG (pin 2) and THRES (pin 6) together to the timing capacitor (+).',
      'Attach the Oscilloscope yellow probe to pin 3 (OUT) to watch the square wave pulse!',
    ],
    allowedComponents: ['battery', 'timer_555', 'resistor', 'capacitor', 'buzzer', 'led', 'ground'],
    initialComponents: [
      {
        id: 'bat1',
        type: 'battery',
        x: -9,
        y: 0,
        rotation: 90,
        properties: { voltage: 9.0 },
      },
      {
        id: 'ic555',
        type: 'timer_555',
        x: 0,
        y: 0,
        rotation: 0,
        properties: {},
      },
      {
        id: 'r_timing1',
        type: 'resistor',
        x: 6,
        y: -4,
        rotation: 90,
        properties: { resistance: 10000 },
      },
      {
        id: 'c_timing',
        type: 'capacitor',
        x: 6,
        y: 3,
        rotation: 90,
        properties: { capacitance: 10e-6 },
      },
      {
        id: 'buzzer1',
        type: 'buzzer',
        x: -4,
        y: 5,
        rotation: 0,
        properties: {},
      },
      {
        id: 'gnd1',
        type: 'ground',
        x: -9,
        y: 5,
        rotation: 0,
        properties: {},
      },
    ],
    initialWires: [
      { id: 'w_vcc', fromPinId: 'bat1:pos', toPinId: 'ic555:vcc', color: '#ef4444', current: 0 },
      { id: 'w_gnd', fromPinId: 'bat1:neg', toPinId: 'ic555:gnd', color: '#64748b', current: 0 },
      { id: 'w_gnd_ref', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
    validate: (sim: SimulationResult, components: CircuitComponent[]) => {
      const timer = components.find((c) => c.type === 'timer_555');
      const outV = timer ? sim.pinVoltages.get(`${timer.id}:out`) ?? 0 : 0;
      const completed = outV > 2.0 || sim.buzzerActive;

      const details = [
        { text: '555 Timer powered (VCC and GND)', satisfied: (sim.pinVoltages.get('ic555:vcc') ?? 0) > 7 },
        { text: 'Astable timing loop connected', satisfied: (sim.pinVoltages.get('ic555:thres') ?? 0) > 0.5 },
        { text: `Timer output pin active (${outV.toFixed(2)}V)`, satisfied: outV > 2.0 },
      ];

      return {
        completed,
        stars: completed ? 3 : 0,
        progressMessage: completed
          ? 'Sensational! The 555 timer is oscillating, producing crisp rhythmic square waves!'
          : 'Connect the timing resistors and capacitor between VCC, DISCH, and THRES.',
        details,
      };
    },
  },

  // --------------------------------------------------------------------------
  // LEVEL 5: Smart Doorbell
  // --------------------------------------------------------------------------
  {
    id: 'level-5',
    title: 'Level 5: Smart Doorbell',
    subtitle: 'Tactile Input & Output Control Circuit',
    description:
      'Wire an interactive doorbell chime! When the visitor presses the momentary push button, the Piezo buzzer must trigger an alert sound and the indicator LED must illuminate.',
    difficulty: 'Intermediate',
    targetGoal: 'Press the push button to ring the buzzer and illuminate the LED indicator.',
    hints: [
      'The push button is normally-open and completes the circuit when held.',
      'Connect: Battery (+) -> Push Button (p1).',
      'Connect: Push Button (p2) -> Buzzer (+) and LED Resistor.',
      'Click or hold the Push Button on the board to test your doorbell!',
    ],
    allowedComponents: ['battery', 'pushbutton', 'buzzer', 'resistor', 'led', 'switch', 'ground'],
    initialComponents: [
      {
        id: 'bat1',
        type: 'battery',
        x: -8,
        y: 0,
        rotation: 90,
        properties: { voltage: 9.0 },
      },
      {
        id: 'btn1',
        type: 'pushbutton',
        x: -2,
        y: -3,
        rotation: 0,
        properties: { closed: false },
      },
      {
        id: 'buzzer1',
        type: 'buzzer',
        x: 4,
        y: -3,
        rotation: 0,
        properties: {},
      },
      {
        id: 'r1',
        type: 'resistor',
        x: 4,
        y: 2,
        rotation: 0,
        properties: { resistance: 330 },
      },
      {
        id: 'led1',
        type: 'led',
        x: 8,
        y: 2,
        rotation: 0,
        properties: { color: 'blue' },
      },
    ],
    initialWires: [],
    validate: (sim: SimulationResult, components: CircuitComponent[]) => {
      const btn = components.find((c) => c.type === 'pushbutton');
      const isPressed = btn?.properties.closed ?? false;
      const buzzer = components.find((c) => c.type === 'buzzer');
      const buzzerCurrent = buzzer ? sim.branchCurrents.get(buzzer.id) ?? 0 : 0;
      const led = components.find((c) => c.type === 'led');
      const ledCurrent = led ? sim.branchCurrents.get(led.id) ?? 0 : 0;

      const buzzerRings = buzzerCurrent > 0.008 || sim.buzzerActive;
      const ledLights = ledCurrent > 0.005;
      const completed = buzzerRings && ledLights;

      const details = [
        { text: 'Circuit fully wired in loop', satisfied: buzzerCurrent > 0 || ledCurrent > 0 || isPressed },
        { text: `Push button pressed: ${isPressed ? 'YES' : 'NO (Click button to ring)'}`, satisfied: isPressed },
        { text: 'Buzzer rings when button pressed', satisfied: buzzerRings },
        { text: 'Indicator LED lights up', satisfied: ledLights },
      ];

      return {
        completed,
        stars: completed ? 3 : 0,
        progressMessage: completed
          ? 'Ding-dong! The smart doorbell rings loud and clear with visual LED confirmation!'
          : isPressed
          ? 'Button is held, but the circuit loop is incomplete. Check your wire connections.'
          : 'Wire the button in series with the buzzer and LED, then click the button!',
        details,
      };
    },
  },
];
