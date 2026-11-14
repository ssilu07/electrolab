// ============================================================================
// ElectroLab Real-World Experiments & DIY Electronics Catalog
// High-engagement, real-life projects designed for hands-on STEM education
// Dual Language Support: English (Default) & Hindi
// ============================================================================

import { CircuitComponent, CircuitWire } from '../types/circuit';
import { Language } from '../services/i18nService';

export type RealExperimentCategory = 'all' | 'home' | 'festive' | 'security' | 'gadgets';

export interface RealExperiment {
  id: string;
  name: string;
  nameHi: string;
  category: 'home' | 'festive' | 'security' | 'gadgets';
  badge: string;
  badgeHi: string;
  diyCost: string;
  diyCostHi: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  viralHook: string;
  viralHookHi: string;
  description: string;
  descriptionHi: string;
  howItWorks: string;
  howItWorksHi: string;
  componentsList: string[];
  componentsListHi: string[];
  environmentType?: 'day_night' | 'water_level' | 'laser_beam';
  targetComponentId?: string;
  components: CircuitComponent[];
  wires: CircuitWire[];
}

export function getLocalizedExperiment(exp: RealExperiment, lang: Language) {
  return {
    ...exp,
    title: lang === 'hi' ? exp.nameHi : exp.name,
    badge: lang === 'hi' ? exp.badgeHi : exp.badge,
    cost: lang === 'hi' ? exp.diyCostHi : exp.diyCost,
    hook: lang === 'hi' ? exp.viralHookHi : exp.viralHook,
    desc: lang === 'hi' ? exp.descriptionHi : exp.description,
    how: lang === 'hi' ? exp.howItWorksHi : exp.howItWorks,
    components: lang === 'hi' ? exp.componentsListHi : exp.componentsList,
  };
}

export const REAL_EXPERIMENTS: RealExperiment[] = [
  // --------------------------------------------------------------------------
  // 1. Automatic Street Light / Night Lamp (LDR + Transistor)
  // --------------------------------------------------------------------------
  {
    id: 'auto-street-light',
    name: 'Automatic Street Light & Night Lamp',
    nameHi: 'अंधेरा होते ही लाइट अपने आप ऑन',
    category: 'home',
    badge: 'POPULAR #1',
    badgeHi: 'लोकप्रिय #1',
    diyCost: '$0.30',
    diyCostHi: '₹25',
    difficulty: 'Beginner',
    viralHook: 'How does a street light turn on automatically? Learn in 1 minute!',
    viralHookHi: 'स्ट्रीट लाइट अपने आप कैसे चालू हो जाती है? जानिए 1 मिनट में!',
    description:
      'Dark-activated automatic street light circuit using an LDR light sensor and an NPN transistor switch. When daylight fades, the light automatically turns ON!',
    descriptionHi:
      'LDR लाइट सेंसर और NPN ट्रांजिस्टर स्विच से बना ऑटोमैटिक स्ट्रीट लाइट सर्किट। जैसे ही अंधेरा होता है, लाइट अपने आप जल उठती है!',
    howItWorks:
      'In daylight, the LDR has very low resistance (100Ω), keeping base voltage below 0.7V so the transistor stays OFF. When darkness falls, LDR resistance surges to 100kΩ, raising base voltage and saturating the transistor to switch ON the lamp!',
    howItWorksHi:
      'दिन की रोशनी में LDR का रेजिस्टेंस कम (100Ω) रहता है, जिससे बेस वोल्टेज 0.7V से नीचे रहता है और ट्रांजिस्टर OFF रहता है। जैसे ही अंधेरा होता है, LDR का रेजिस्टेंस बढ़कर 100kΩ हो जाता है, बेस वोल्टेज बढ़ता है और ट्रांजिस्टर ON होकर बल्ब जला देता है।',
    componentsList: ['1x 9V Battery', '1x LDR (Photoresistor)', '1x 2N2222 NPN Transistor', '1x 10kΩ Resistor', '1x 330Ω Resistor', '1x Amber LED Lamp'],
    componentsListHi: ['1x 9V बैटरी', '1x LDR लाइट सेंसर', '1x 2N2222 NPN ट्रांजिस्टर', '1x 10kΩ रेसिस्टर', '1x 330Ω रेसिस्टर', '1x एम्बर LED लैंप'],
    environmentType: 'day_night',
    targetComponentId: 'ldr1',
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'ldr1', type: 'ldr', x: -2, y: -3, rotation: 0, properties: { sliderValue: 0.1, label: 'LDR Light Sensor' } },
      { id: 'r_div', type: 'resistor', x: -2, y: 2, rotation: 90, properties: { resistance: 10000, label: '10kΩ Divider' } },
      { id: 'q1', type: 'transistor_npn', x: 3, y: 2, rotation: 0, properties: { label: '2N2222 Switch' } },
      { id: 'r_led', type: 'resistor', x: 3, y: -3, rotation: 90, properties: { resistance: 330, label: '330Ω Limiter' } },
      { id: 'led1', type: 'led', x: 7, y: -1, rotation: 90, properties: { color: 'amber', label: 'Street Lamp' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'ldr1:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'ldr1:p2', toPinId: 'r_div:p1', color: '#38bdf8', current: 0 },
      { id: 'w3', fromPinId: 'r_div:p1', toPinId: 'q1:b', color: '#38bdf8', current: 0 },
      { id: 'w4', fromPinId: 'r_div:p2', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w5', fromPinId: 'bat1:pos', toPinId: 'r_led:p1', color: '#ef4444', current: 0 },
      { id: 'w6', fromPinId: 'r_led:p2', toPinId: 'led1:anode', color: '#f59e0b', current: 0 },
      { id: 'w7', fromPinId: 'led1:cathode', toPinId: 'q1:c', color: '#f59e0b', current: 0 },
      { id: 'w8', fromPinId: 'q1:e', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w9', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 2. Water Tank Overflow Alarm (पानी की टंकी अलार्म)
  // --------------------------------------------------------------------------
  {
    id: 'water-tank-alarm',
    name: 'Water Tank Overflow Alarm & Buzzer',
    nameHi: 'पानी की टंकी भरते ही बजने वाला अलार्म',
    category: 'home',
    badge: 'MOST USEFUL',
    badgeHi: 'सबसे उपयोगी',
    diyCost: '$0.35',
    diyCostHi: '₹30',
    difficulty: 'Beginner',
    viralHook: 'Stop water overflow! Build this smart tank alarm circuit under $1.',
    viralHookHi: 'घर की टंकी का पानी बहना बंद करो! ₹30 में वाटर अलार्म सर्किट।',
    description:
      'Stops clean water wastage! When the water level reaches the top probe, the conductive water closes the circuit, triggering an NPN transistor to sound a loud acoustic buzzer.',
    descriptionHi:
      'पानी की बर्बादी रोकें! जैसे ही पानी ऊपर तक भरता है, इलेक्ट्रोड टच होकर NPN ट्रांजिस्टर को ट्रिगर करते हैं और लाउड बजर बजने लगता है।',
    howItWorks:
      'Two probe wires hang inside the water tank. When the water level rises to touch both probes, conductive water delivers base current to the NPN transistor, driving the loud buzzer and flashing the alert LED.',
    howItWorksHi:
      'टंकी के अंदर 2 तार (इलेक्ट्रोड) लगे होते हैं। जब पानी ऊपर तक भरता है, तो पानी से करंट पास होकर बेस तक पहुँचता है। NPN ट्रांजिस्टर स्विच ऑन हो जाता है और लाउड बजर + रेड अलर्ट LED चालू हो जाती है।',
    componentsList: ['1x 9V Battery', '1x Pushbutton (Water Probe)', '1x 2N2222 Transistor', '1x 1kΩ Resistor', '1x Piezo Buzzer', '1x Red LED', '1x 330Ω Resistor'],
    componentsListHi: ['1x 9V बैटरी', '1x वाटर प्रोब सेंसर', '1x 2N2222 ट्रांजिस्टर', '1x 1kΩ रेसिस्टर', '1x पीज़ो बजर', '1x रेड LED', '1x 330Ω रेसिस्टर'],
    environmentType: 'water_level',
    targetComponentId: 'probe_btn',
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'probe_btn', type: 'pushbutton', x: -2, y: -4, rotation: 0, properties: { closed: false, label: 'Water Probe Sensor' } },
      { id: 'r_base', type: 'resistor', x: 2, y: -4, rotation: 0, properties: { resistance: 1000, label: '1kΩ Base' } },
      { id: 'r_pull', type: 'resistor', x: 2, y: 0, rotation: 90, properties: { resistance: 10000, label: '10kΩ Pull-down' } },
      { id: 'q1', type: 'transistor_npn', x: 4, y: 0, rotation: 0, properties: { label: 'Buzzer Driver' } },
      { id: 'buzzer1', type: 'buzzer', x: -2, y: 2, rotation: 0, properties: { label: 'Overflow Siren' } },
      { id: 'r_led', type: 'resistor', x: 8, y: -2, rotation: 90, properties: { resistance: 330 } },
      { id: 'led_alert', type: 'led', x: 8, y: 2, rotation: 90, properties: { color: 'red', label: 'Tank Full LED' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'probe_btn:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'probe_btn:p2', toPinId: 'r_base:p1', color: '#38bdf8', current: 0 },
      { id: 'w3', fromPinId: 'r_base:p2', toPinId: 'q1:b', color: '#38bdf8', current: 0 },
      { id: 'w4', fromPinId: 'bat1:pos', toPinId: 'buzzer1:pos', color: '#ef4444', current: 0 },
      { id: 'w5', fromPinId: 'buzzer1:neg', toPinId: 'q1:c', color: '#f59e0b', current: 0 },
      { id: 'w6', fromPinId: 'bat1:pos', toPinId: 'r_led:p1', color: '#ef4444', current: 0 },
      { id: 'w7', fromPinId: 'r_led:p2', toPinId: 'led_alert:anode', color: '#ef4444', current: 0 },
      { id: 'w8', fromPinId: 'led_alert:cathode', toPinId: 'q1:c', color: '#f59e0b', current: 0 },
      { id: 'w9', fromPinId: 'q1:e', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w10', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
      { id: 'w11', fromPinId: 'r_pull:p1', toPinId: 'q1:b', color: '#38bdf8', current: 0 },
      { id: 'w12', fromPinId: 'r_pull:p2', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. Staircase 2-Way Light Wiring (सीढ़ियों की 2-वे वायरिंग)
  // --------------------------------------------------------------------------
  {
    id: 'staircase-switch',
    name: 'Staircase 2-Way Switch Wiring',
    nameHi: 'सीढ़ियों की 2-वे स्विच वायरिंग',
    category: 'home',
    badge: 'ELECTRICIAN SECRET',
    badgeHi: 'इलेक्ट्रीशियन सीक्रेट',
    diyCost: '$0.50',
    diyCostHi: '₹40',
    difficulty: 'Beginner',
    viralHook: 'Electricians charge $50 for this — learn 2-way wiring in 30 seconds!',
    viralHookHi: 'इलेक्ट्रीशियन इस वायरिंग का ₹500 लेते हैं — खुद सीखो 30 सेकंड में!',
    description:
      'Classic 2-Way staircase light circuit. Turn the light ON from downstairs, walk up the stairs, and turn it OFF from upstairs using dual SPDT switches.',
    descriptionHi:
      'सीढ़ियों की क्लासिक 2-वे वायरिंग। नीचे से स्विच ऑन करो तो लाइट ऑन, ऊपर जाके दूसरे स्विच से ऑफ!',
    howItWorks:
      'Two traveler wires connect between the two switches. When both switches connect to the same traveler line, current flows to illuminate the lamp. Flipping either switch breaks or restores the path from either floor.',
    howItWorksHi:
      'दो SPDT स्विचों के बीच 2 ट्रैवलर तार जुड़े होते हैं। जब दोनों स्विच एक ही लाइन पर कनेक्ट होते हैं, सर्किट पूरा हो जाता है और लाइट जल उठती है। किसी भी एक स्विच को फ्लिप करने पर पाथ टूट जाता है।',
    componentsList: ['1x 9V DC Power Supply', '2x Toggle Switches (SPST/SPDT Pair)', '1x 330Ω Resistor', '1x Bright Amber Lamp', '1x Ground'],
    componentsListHi: ['1x 9V DC सप्लाई', '2x टॉगल स्विच (2-वे पेयर)', '1x 330Ω रेसिस्टर', '1x एम्बर लैंप', '1x ग्राउंड'],
    components: [
      { id: 'bat1', type: 'battery', x: -9, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'sw_downstairs', type: 'switch', x: -4, y: -2, rotation: 0, properties: { closed: true, label: 'Downstairs Switch' } },
      { id: 'sw_upstairs', type: 'switch', x: 2, y: -2, rotation: 0, properties: { closed: true, label: 'Upstairs Switch' } },
      { id: 'r_lamp', type: 'resistor', x: 6, y: 0, rotation: 0, properties: { resistance: 330, label: 'Current Limiter' } },
      { id: 'lamp', type: 'led', x: 10, y: 0, rotation: 90, properties: { color: 'amber', label: 'Staircase Lamp' } },
      { id: 'gnd1', type: 'ground', x: -9, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'sw_downstairs:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'sw_downstairs:p2', toPinId: 'sw_upstairs:p1', color: '#f59e0b', current: 0 },
      { id: 'w3', fromPinId: 'sw_upstairs:p2', toPinId: 'r_lamp:p1', color: '#22c55e', current: 0 },
      { id: 'w4', fromPinId: 'r_lamp:p2', toPinId: 'lamp:anode', color: '#22c55e', current: 0 },
      { id: 'w5', fromPinId: 'lamp:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w6', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 4. Festive Running Chaser Lights (दिवाली की भागने वाली झालर)
  // --------------------------------------------------------------------------
  {
    id: 'diwali-chaser',
    name: 'Festive Running LED Chaser Light',
    nameHi: 'दिवाली की भागने वाली रनिंग LED झालर',
    category: 'festive',
    badge: 'FESTIVE SPECIAL',
    badgeHi: 'दिवाली स्पेशल',
    diyCost: '$0.40',
    diyCostHi: '₹35',
    difficulty: 'Intermediate',
    viralHook: 'Broken string lights? Build your own running LED chaser for festivals!',
    viralHookHi: 'दिवाली की झालर खराब हो गई? ऐसे बनती है असली रनिंग LED!',
    description:
      'Multi-color decorative festive light generator! Uses an NE555 timer generating rapid pulses to oscillate and illuminate LEDs in a dynamic visual sequence.',
    descriptionHi:
      'मल्टी-कलर सजावटी रनिंग लाइट जनरेटर! NE555 टाइमर की रैपिड पल्स से LEDs बारी-बारी से जलती हैं।',
    howItWorks:
      'The NE555 operates in astable multivibrator mode. The periodic charging and discharging of the timing capacitor produces continuous 0V-to-9V clock pulses that alternate between LED stages.',
    howItWorksHi:
      'NE555 टाइमर Astable मोड में ऑसिलेट करता है। कैपेसिटर की चार्जिंग-डिस्चार्जिंग साइकिल से आउटपुट पिन 3 पर निरंतर पल्स बनती है जिससे LEDs मिलकर शानदार रनिंग लाइट इफ़ेक्ट बनाते हैं।',
    componentsList: ['1x 9V Battery', '1x NE555 Timer IC', '1x 4.7kΩ Resistor', '1x 10kΩ Resistor', '1x 22µF Capacitor', '3x Color LEDs (Red, Amber, Green)'],
    componentsListHi: ['1x 9V बैटरी', '1x NE555 टाइमर IC', '1x 4.7kΩ रेसिस्टर', '1x 10kΩ रेसिस्टर', '1x 22µF कैपेसिटर', '3x कलर LEDs'],
    components: [
      { id: 'bat1', type: 'battery', x: -10, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'ic1', type: 'timer_555', x: 0, y: 0, rotation: 0, properties: { label: 'NE555 Pulse Generator' } },
      { id: 'r1', type: 'resistor', x: 6, y: -4, rotation: 90, properties: { resistance: 4700 } },
      { id: 'r2', type: 'resistor', x: 6, y: 0, rotation: 90, properties: { resistance: 10000 } },
      { id: 'c1', type: 'capacitor', x: 6, y: 4, rotation: 90, properties: { capacitance: 22e-6 } },
      { id: 'r_led1', type: 'resistor', x: -6, y: -3, rotation: 0, properties: { resistance: 330 } },
      { id: 'led_red', type: 'led', x: -2, y: -3, rotation: 0, properties: { color: 'red', label: 'Chaser Red' } },
      { id: 'r_led2', type: 'resistor', x: -6, y: 3, rotation: 0, properties: { resistance: 330 } },
      { id: 'led_green', type: 'led', x: -2, y: 3, rotation: 0, properties: { color: 'green', label: 'Chaser Green' } },
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
      { id: 'w11', fromPinId: 'ic1:out', toPinId: 'r_led1:p1', color: '#22c55e', current: 0 },
      { id: 'w12', fromPinId: 'r_led1:p2', toPinId: 'led_red:anode', color: '#22c55e', current: 0 },
      { id: 'w13', fromPinId: 'led_red:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w14', fromPinId: 'bat1:pos', toPinId: 'led_green:anode', color: '#ef4444', current: 0 },
      { id: 'w15', fromPinId: 'led_green:cathode', toPinId: 'r_led2:p1', color: '#f59e0b', current: 0 },
      { id: 'w16', fromPinId: 'r_led2:p2', toPinId: 'ic1:out', color: '#f59e0b', current: 0 },
      { id: 'w17', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 5. Police Siren & Dual Strobe Beacon (पुलिस सायरन और फ्लैशर)
  // --------------------------------------------------------------------------
  {
    id: 'police-siren',
    name: 'Police Siren & Dual Strobe Flasher',
    nameHi: 'असली पुलिस सायरन और रेड-ब्लू फ्लैशर',
    category: 'festive',
    badge: 'EMERGENCY TECH',
    badgeHi: 'इमरजेंसी टेक',
    diyCost: '$0.35',
    diyCostHi: '₹30',
    difficulty: 'Intermediate',
    viralHook: 'DIY emergency police car strobe lights & acoustic siren!',
    viralHookHi: 'घर पर बनाएं असली पुलिस सायरन और फ्लैशर लाइट!',
    description:
      'Creates emergency vehicle red-blue alternating strobes with a simultaneous acoustic piezo siren pulse generator.',
    descriptionHi:
      'रेड-ब्लू बारी-बारी से बहुत तेज़ फ्लैश करने वाली LED स्ट्रोब और साथ में लाउड पुलिस सायरन जनरेटर!',
    howItWorks:
      'When the 555 output transitions HIGH, the red LED and buzzer pulse ON. When it transitions LOW, the blue LED sinks current and turns ON, generating an authentic patrol car effect.',
    howItWorksHi:
      'Astable 555 टाइमर जब हाई होता है, रेड LED और सायरन चालू होता है; जब लो होता है, ब्लू LED चालू होती है। यह तेज फ्लिक दोनों रंगों में असली पुलिस पेट्रोल कार जैसी लुक देता है।',
    componentsList: ['1x 9V Battery', '1x NE555 Timer IC', '1x Piezo Buzzer Siren', '1x Red LED', '1x Blue LED', '2x 330Ω Resistors', '1x 10µF Capacitor'],
    componentsListHi: ['1x 9V बैटरी', '1x NE555 टाइमर IC', '1x पीज़ो सायरन', '1x रेड LED', '1x ब्लू LED', '2x 330Ω रेसिस्टर', '1x 10µF कैपेसिटर'],
    components: [
      { id: 'bat1', type: 'battery', x: -10, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'ic1', type: 'timer_555', x: -1, y: 0, rotation: 0, properties: { label: 'Siren Strobe IC' } },
      { id: 'r1', type: 'resistor', x: 5, y: -4, rotation: 90, properties: { resistance: 3300 } },
      { id: 'r2', type: 'resistor', x: 5, y: 0, rotation: 90, properties: { resistance: 8200 } },
      { id: 'c1', type: 'capacitor', x: 5, y: 4, rotation: 90, properties: { capacitance: 10e-6 } },
      { id: 'r_red', type: 'resistor', x: -6, y: -4, rotation: 0, properties: { resistance: 330 } },
      { id: 'led_red', type: 'led', x: -2, y: -4, rotation: 0, properties: { color: 'red', label: 'Police RED' } },
      { id: 'r_blue', type: 'resistor', x: -6, y: 4, rotation: 0, properties: { resistance: 330 } },
      { id: 'led_blue', type: 'led', x: -2, y: 4, rotation: 0, properties: { color: 'blue', label: 'Police BLUE' } },
      { id: 'buzzer1', type: 'buzzer', x: 8, y: -2, rotation: 0, properties: { label: 'High Pitch Siren' } },
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
      { id: 'w11', fromPinId: 'ic1:out', toPinId: 'r_red:p1', color: '#ef4444', current: 0 },
      { id: 'w12', fromPinId: 'r_red:p2', toPinId: 'led_red:anode', color: '#ef4444', current: 0 },
      { id: 'w13', fromPinId: 'led_red:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w14', fromPinId: 'bat1:pos', toPinId: 'led_blue:anode', color: '#3b82f6', current: 0 },
      { id: 'w15', fromPinId: 'led_blue:cathode', toPinId: 'r_blue:p1', color: '#3b82f6', current: 0 },
      { id: 'w16', fromPinId: 'r_blue:p2', toPinId: 'ic1:out', color: '#3b82f6', current: 0 },
      { id: 'w17', fromPinId: 'ic1:out', toPinId: 'buzzer1:pos', color: '#f59e0b', current: 0 },
      { id: 'w18', fromPinId: 'buzzer1:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w19', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 6. Laser Tripwire Burglar Alarm (चोर पकड़ने वाला लेज़र अलार्म)
  // --------------------------------------------------------------------------
  {
    id: 'laser-burglar-alarm',
    name: 'Laser Tripwire Burglar Alarm (Self-Latching)',
    nameHi: 'चोर पकड़ने वाला लेज़र अलार्म (लैचिंग रिले)',
    category: 'security',
    badge: 'SPY GADGET',
    badgeHi: 'जासूस गैजेट',
    diyCost: '$0.60',
    diyCostHi: '₹50',
    difficulty: 'Advanced',
    viralHook: 'Build a laser tripwire alarm for your room that never shuts off!',
    viralHookHi: 'अपने कमरे में लगाओ चोर पकड़ने वाला सीक्रेट अलार्म!',
    description:
      'High-security perimeter defense. As soon as an intruder walks through and cuts the invisible laser beam, the electromechanical relay locks ON and screams continuously!',
    descriptionHi:
      'जैसे ही चोर लेज़र बीम को काटता है, रिले तुरंत ऑन होकर लॉक हो जाता है और लाउड अलार्म बजता रहता है!',
    howItWorks:
      'A laser shines onto the LDR. The moment an intruder interrupts the beam, the brief darkness triggers the relay coil. The relay Normally-Open (NO) contacts close, feeding power back into the coil in a self-latching feedback loop!',
    howItWorksHi:
      'लेज़र बीम LDR पर गिर रही होती है। जैसे ही चोर बीच में पैर रखता है, LDR पर छाया पड़ती है और रिले ट्रिगर होता है। रिले का नॉर्मली-ओपन कॉन्टैक्ट खुद की कॉइल को पॉवर देकर सर्किट को लॉक (Latch) कर देता है।',
    componentsList: ['1x 9V Battery', '1x Tactile Push Button (Disarm / Reset)', '1x SPDT 5V Relay', '1x LDR Sensor', '1x Piezo Buzzer', '1x Red Alarm LED'],
    componentsListHi: ['1x 9V बैटरी', '1x रीसेट बटन', '1x SPDT 5V रिले', '1x LDR सेंसर', '1x पीज़ो बजर', '1x रेड अलार्म LED'],
    environmentType: 'laser_beam',
    targetComponentId: 'btn1',
    components: [
      { id: 'bat1', type: 'battery', x: -10, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'btn1', type: 'pushbutton', x: -5, y: -4, rotation: 0, properties: { closed: false, label: 'Tripwire Trigger' } },
      { id: 'rly1', type: 'relay', x: 1, y: 0, rotation: 0, properties: { label: 'Latching SPDT Relay' } },
      { id: 'buzzer1', type: 'buzzer', x: 7, y: 2, rotation: 0, properties: { label: 'Intruder Alarm' } },
      { id: 'res1', type: 'resistor', x: 7, y: -3, rotation: 0, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 11, y: -3, rotation: 0, properties: { color: 'red', label: 'Breach Detected' } },
      { id: 'gnd1', type: 'ground', x: -10, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'btn1:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'btn1:p2', toPinId: 'rly1:coil1', color: '#ef4444', current: 0 },
      { id: 'w3', fromPinId: 'rly1:coil2', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w4', fromPinId: 'bat1:pos', toPinId: 'rly1:com', color: '#ef4444', current: 0 },
      { id: 'w5', fromPinId: 'rly1:no', toPinId: 'rly1:coil1', color: '#f59e0b', current: 0 },
      { id: 'w6', fromPinId: 'rly1:no', toPinId: 'buzzer1:pos', color: '#f59e0b', current: 0 },
      { id: 'w7', fromPinId: 'buzzer1:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w8', fromPinId: 'rly1:no', toPinId: 'res1:p1', color: '#f59e0b', current: 0 },
      { id: 'w9', fromPinId: 'res1:p2', toPinId: 'led1:anode', color: '#f59e0b', current: 0 },
      { id: 'w10', fromPinId: 'led1:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w11', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 7. Firefly / Mood Breathing LED (रिलैक्सिंग ब्रीदिंग लाइट)
  // --------------------------------------------------------------------------
  {
    id: 'firefly-breathing-led',
    name: 'Firefly & Breathing Mood LED',
    nameHi: 'जुगनू जैसी रिलैक्सिंग ब्रीदिंग लाइट',
    category: 'festive',
    badge: 'AESTHETIC',
    badgeHi: 'एस्थेटिक',
    diyCost: '$0.20',
    diyCostHi: '₹15',
    difficulty: 'Beginner',
    viralHook: 'Analog capacitor magic: make an LED breathe like a living firefly!',
    viralHookHi: 'कैपेसिटर का असली जादू देखो: जुगनू जैसी ब्रीदिंग लाइट!',
    description:
      'Relaxing analog aesthetic circuit! Uses capacitor charge-storage (RC time constant) to gently fade an LED in and out like a real living firefly.',
    descriptionHi:
      'कैपेसिटर चार्ज-स्टोरेज से LED को धीरे-धीरे जलने और स्मूथली फेड होकर बुझने वाली जुगनू लाइट!',
    howItWorks:
      'Closing the switch rapidly charges the 100µF capacitor to 9V. When the switch opens, the capacitor discharges gradually through the LED and current-limiting resistor, resulting in a mesmerizing organic decay curve.',
    howItWorksHi:
      'स्विच ऑन होने पर 100µF कैपेसिटर बिजली स्टोर करता है। स्विच ऑफ करने पर कैपेसिटर स्टोर्ड चार्ज को धीरे-धीरे छोड़ता है जिससे LED तुरंत नहीं बुझती बल्कि बहुत स्मूथली फेड होती है।',
    componentsList: ['1x 9V Battery', '1x Toggle Switch', '1x 100µF Capacitor', '1x 1kΩ Resistor', '1x 330Ω Resistor', '1x Amber LED'],
    componentsListHi: ['1x 9V बैटरी', '1x टॉगल स्विच', '1x 100µF कैपेसिटर', '1x 1kΩ रेसिस्टर', '1x 330Ω रेसिस्टर', '1x एम्बर LED'],
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'sw1', type: 'switch', x: -3, y: -3, rotation: 0, properties: { closed: true, label: 'Charge Switch' } },
      { id: 'r_charge', type: 'resistor', x: 2, y: -3, rotation: 0, properties: { resistance: 1000 } },
      { id: 'c1', type: 'capacitor', x: 2, y: 2, rotation: 90, properties: { capacitance: 0.0001, label: '100µF Energy Store' } },
      { id: 'r_led', type: 'resistor', x: 6, y: -1, rotation: 90, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 6, y: 3, rotation: 90, properties: { color: 'amber', label: 'Firefly Glow' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'sw1:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'sw1:p2', toPinId: 'r_charge:p1', color: '#ef4444', current: 0 },
      { id: 'w3', fromPinId: 'r_charge:p2', toPinId: 'c1:pos', color: '#38bdf8', current: 0 },
      { id: 'w4', fromPinId: 'c1:pos', toPinId: 'r_led:p1', color: '#38bdf8', current: 0 },
      { id: 'w5', fromPinId: 'r_led:p2', toPinId: 'led1:anode', color: '#f59e0b', current: 0 },
      { id: 'w6', fromPinId: 'led1:cathode', toPinId: 'c1:neg', color: '#64748b', current: 0 },
      { id: 'w7', fromPinId: 'c1:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w8', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 8. 12V Car to 5V USB Phone Charger (कार मोबाइल चार्जर)
  // --------------------------------------------------------------------------
  {
    id: 'car-mobile-charger',
    name: '12V Car Battery to 5V USB Fast Charger',
    nameHi: 'गाड़ी की 12V बैटरी से फोन चार्ज करने वाला 5V सर्किट',
    category: 'gadgets',
    badge: 'LIFE HACK',
    badgeHi: 'लाइफ हैक',
    diyCost: '$0.25',
    diyCostHi: '₹20',
    difficulty: 'Intermediate',
    viralHook: 'Emergency phone charging from a 12V motorcycle or car battery!',
    viralHookHi: 'इमरजेंसी में बाइक या कार की 12V बैटरी से फोन चार्ज कैसे करें?',
    description:
      'Step-down voltage regulation demonstrating how high voltage car lead-acid batteries are safely stepped down to 5.0V USB standard for mobile devices.',
    descriptionHi:
      'गाड़ी की 12V बैटरी से सुरक्षित 5.0V USB आउटपुट बनाकर स्मार्टफोन चार्ज करने वाला सर्किट!',
    howItWorks:
      'Car batteries supply 12V to 14.4V which would fry a phone. An input decoupling capacitor and voltage regulator stage stabilize the output to exactly 5.0V with clean ripple filtering.',
    howItWorksHi:
      'कार की बैटरी 12V से 14V तक देती है, जिससे फोन ब्लास्ट हो सकता है। कैपेसिटर फिल्टर और रेगुलेटर स्टेज से यह वोल्टेज ठीक 5.0V पर लॉक हो जाता है।',
    componentsList: ['1x 12V DC Battery', '1x 100µF Filter Capacitor', '1x 10kΩ Potentiometer (Calibrated Divider)', '1x 10µF Smoothing Capacitor', '1x 5V Green LED', '1x 330Ω Resistor'],
    componentsListHi: ['1x 12V बैटरी', '1x 100µF फिल्टर कैपेसिटर', '1x 10kΩ वोल्टेज रेगुलेटर', '1x 10µF स्मूथिंग कैपेसिटर', '1x 5V ग्रीन LED', '1x 330Ω रेसिस्टर'],
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 12.0, label: '12V Car Battery' } },
      { id: 'c_in', type: 'capacitor', x: -3, y: 2, rotation: 90, properties: { capacitance: 0.0001, label: 'Input Filter' } },
      { id: 'pot1', type: 'potentiometer', x: 1, y: -2, rotation: 0, properties: { resistance: 10000, sliderValue: 0.42, label: '5.0V Voltage Regulator' } },
      { id: 'c_out', type: 'capacitor', x: 5, y: 2, rotation: 90, properties: { capacitance: 10e-6, label: 'Ripple Filter' } },
      { id: 'r_usb', type: 'resistor', x: 9, y: -1, rotation: 90, properties: { resistance: 330 } },
      { id: 'led_usb', type: 'led', x: 9, y: 3, rotation: 90, properties: { color: 'green', label: '5V Phone Charging LED' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'pot1:a', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'bat1:pos', toPinId: 'c_in:pos', color: '#ef4444', current: 0 },
      { id: 'w3', fromPinId: 'c_in:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w4', fromPinId: 'pot1:b', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w5', fromPinId: 'pot1:w', toPinId: 'c_out:pos', color: '#22c55e', current: 0 },
      { id: 'w6', fromPinId: 'c_out:neg', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w7', fromPinId: 'pot1:w', toPinId: 'r_usb:p1', color: '#22c55e', current: 0 },
      { id: 'w8', fromPinId: 'r_usb:p2', toPinId: 'led_usb:anode', color: '#22c55e', current: 0 },
      { id: 'w9', fromPinId: 'led_usb:cathode', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w10', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },

  // --------------------------------------------------------------------------
  // 9. Touch-Sensitive Magic Switch (उंगली छूते ही लाइट ऑन)
  // --------------------------------------------------------------------------
  {
    id: 'touch-switch',
    name: 'Touch-Sensitive Magic Light Switch',
    nameHi: 'उंगली छूते ही जलने वाला मैजिक स्विच',
    category: 'gadgets',
    badge: 'MAGIC TRICK',
    badgeHi: 'मैजिक ट्रिक',
    diyCost: '$0.25',
    diyCostHi: '₹20',
    difficulty: 'Beginner',
    viralHook: 'Light up an LED with zero buttons — just the touch of your finger!',
    viralHookHi: 'बिना बटन दबाए केवल उंगली छूने से लाइट चालू!',
    description:
      'Ultra-sensitive biometric touch circuit! Uses an NPN transistor amplifier to detect the nano-ampere electrostatic current flowing through your finger.',
    descriptionHi:
      'अल्ट्रा-सेंसिटिव टच सर्किट! NPN ट्रांजिस्टर एम्पलीफायर से उंगली के मामूली नैनो-एम्पियर करंट को पकड़कर लाइट ऑन करता है।',
    howItWorks:
      'When your skin bridges the two touch terminals, your body resistance (~50kΩ-100kΩ) injects a few micro-amperes into the base. The high-gain transistor amplifies this current by 200x to light the high-intensity LED!',
    howItWorksHi:
      'जब आप उंगली से दो तारों को छूते हैं, आपके शरीर का मामूली रेजिस्टेंस बैटरी से बेस में थोड़ा करंट भेजता है। ट्रांजिस्टर इस करंट को 200 गुना एम्पलीफाई करके तुरंत LED जला देता है!',
    componentsList: ['1x 9V Battery', '1x Pushbutton (Touch Terminals)', '1x 2N2222 High Gain Transistor', '1x 330Ω Resistor', '1x Bright Blue LED'],
    componentsListHi: ['1x 9V बैटरी', '1x टच टर्मिनल्स', '1x 2N2222 हाई-गेन ट्रांजिस्टर', '1x 330Ω रेसिस्टर', '1x ब्राइट ब्लू LED'],
    components: [
      { id: 'bat1', type: 'battery', x: -8, y: 0, rotation: 90, properties: { voltage: 9.0 } },
      { id: 'touch_probe', type: 'pushbutton', x: -2, y: -3, rotation: 0, properties: { closed: false, label: 'Touch Finger Here' } },
      { id: 'q1', type: 'transistor_npn', x: 2, y: 1, rotation: 0, properties: { label: 'Nano-Amp Amplifier' } },
      { id: 'r_led', type: 'resistor', x: 6, y: -2, rotation: 90, properties: { resistance: 330 } },
      { id: 'led1', type: 'led', x: 6, y: 2, rotation: 90, properties: { color: 'blue', label: 'Magic Touch Glow' } },
      { id: 'gnd1', type: 'ground', x: -8, y: 5, rotation: 0, properties: {} },
    ],
    wires: [
      { id: 'w1', fromPinId: 'bat1:pos', toPinId: 'touch_probe:p1', color: '#ef4444', current: 0 },
      { id: 'w2', fromPinId: 'touch_probe:p2', toPinId: 'q1:b', color: '#38bdf8', current: 0 },
      { id: 'w3', fromPinId: 'bat1:pos', toPinId: 'r_led:p1', color: '#ef4444', current: 0 },
      { id: 'w4', fromPinId: 'r_led:p2', toPinId: 'led1:anode', color: '#3b82f6', current: 0 },
      { id: 'w5', fromPinId: 'led1:cathode', toPinId: 'q1:c', color: '#3b82f6', current: 0 },
      { id: 'w6', fromPinId: 'q1:e', toPinId: 'bat1:neg', color: '#64748b', current: 0 },
      { id: 'w7', fromPinId: 'bat1:neg', toPinId: 'gnd1:gnd', color: '#64748b', current: 0 },
    ],
  },
];
