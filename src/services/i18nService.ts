import { useState, useEffect } from 'react';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';

export type Language = 'en' | 'hi';

export interface Translations {
  // Navigation Bar
  navCircuit: string;
  navInstruments: string;
  nav3dLab: string;
  navPuzzles: string;
  navRealLab: string;
  hotBadge: string;

  // Header & Settings
  labSettings: string;
  appLanguage: string;
  langEnglish: string;
  langHindi: string;
  overloadPhysics: string;
  overloadDesc: string;
  audioFx: string;
  audioFxDesc: string;
  dailyReminders: string;
  dailyRemindersDesc: string;
  testNotif: string;
  testNotifSending: string;
  visualTheme: string;
  clearBoard: string;
  snapshot: string;
  ratePlay: string;
  privacyPolicy: string;
  simulate: string;
  simulating: string;
  proPass: string;
  getPro: string;
  proDetails: string;
  freeTier: string;
  circuitLoaded: string;
  boardCleared: string;
  snapshotSaved: string;

  // Real Lab Modal
  realLabTitle: string;
  realLabSubtitle: string;
  realLabBadge: string;
  catAll: string;
  catHome: string;
  catFestive: string;
  catSecurity: string;
  catGadgets: string;
  searchPlaceholder: string;
  noExperimentsFound: string;
  runSimulation: string;
  viewIn3D: string;
  diyCost: string;
  viralTagline: string;
  experimentsReady: string;

  // Real Environment Widget
  envTestTitle: string;
  dayNightSliderDesc: string;
  nightStatus: string;
  dayStatus: string;
  twilightStatus: string;
  nightLabel: string;
  dayLabel: string;
  waterEmpty: string;
  waterOverflow: string;
  waterLevel: string;
  waterDesc: string;
  laserTripwireDesc: string;
  cutLaserBtn: string;
  laserLatchedNote: string;
  touchSensorDesc: string;
  touchHolding: string;
  touchPrompt: string;
  liveAudioSync: string;

  // Story Mode & Real-World Cutaway
  storyFlowBtn: string;
  realCutawayBtn: string;
  waterTankCutaway: string;
  diyChallengeBtn: string;
  storyModeTitle: string;
  storyModeSubtitle: string;
  stepWord: string;
  analogyTitle: string;
  scienceTitle: string;
  iUnderstoodBtn: string;
  nextStepBtn: string;
  prevStepBtn: string;
  quickFillBtn: string;
  drainTankBtn: string;
  startMotor: string;
  stopMotor: string;
  motorRunning: string;
  motorOff: string;
  overflowAlertUrgent: string;
  tankTelemetryTitle: string;
  probeConduction: string;
  transistorState: string;
  buzzerTelemetry: string;
  activeStatus: string;
  idleStatus: string;
  openCircuit: string;
  conductive: string;

  // Real-life cutaways for all 9 experiments
  staircaseTitle: string;
  groundFloorSwitch: string;
  firstFloorSwitch: string;
  flipDownstairs: string;
  flipUpstairs: string;
  staircaseLampGlow: string;
  policeLightbar: string;
  policeRedStrobe: string;
  policeBlueStrobe: string;
  policeDualSiren: string;
  togglePoliceSiren: string;
  laserCorridorTitle: string;
  laserEmitter: string;
  laserDetector: string;
  walkIntruder: string;
  resetRelay: string;
  relayLatched: string;
  relayArmed: string;
  diwaliChaserTitle: string;
  diwaliSpeed: string;
  diwaliSparkle: string;
  fireflyJarTitle: string;
  capacitorChargeLevel: string;
  chargeCapacitor: string;
  dischargeFade: string;
  carChargerTitle: string;
  carBattery12V: string;
  usbOutput5V: string;
  phoneChargingFast: string;
  touchSwitchTitle: string;
  touchGoldPins: string;
  ambientHaloLamp: string;
}

const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    // Navigation Bar
    navCircuit: 'Circuit',
    navInstruments: 'Instruments',
    nav3dLab: '3D Lab',
    navPuzzles: 'Puzzles',
    navRealLab: 'Real Lab',
    hotBadge: 'HOT',

    // Header & Settings
    labSettings: 'Lab Settings & Options',
    appLanguage: 'App Language',
    langEnglish: 'English (Default)',
    langHindi: 'हिन्दी (Hindi)',
    overloadPhysics: 'Overload Physics',
    overloadDesc: 'Blow components if voltage/current exceeds limits',
    audioFx: 'Acoustic Audio FX',
    audioFxDesc: 'Relay clicks, buzzers, and switch sounds',
    dailyReminders: 'Daily Lab Reminders & Tips',
    dailyRemindersDesc: '1 smart challenge daily at 7:30 PM',
    testNotif: 'Test Notification (Send Now)',
    testNotifSending: 'Test Scheduled (in 4s)...',
    visualTheme: 'Visual Theme',
    clearBoard: 'Clear Board',
    snapshot: 'Snapshot',
    ratePlay: 'Rate on Google Play',
    privacyPolicy: 'Privacy Policy',
    simulate: 'Simulate',
    simulating: 'Simulating',
    proPass: 'PRO PASS',
    getPro: 'GET PRO',
    proDetails: 'Details',
    freeTier: 'FREE',
    circuitLoaded: 'Circuit Loaded',
    boardCleared: 'Board Cleared',
    snapshotSaved: 'Snapshot Captured',

    // Real Lab Modal
    realLabTitle: 'Real Lab',
    realLabSubtitle: 'Real-world electronics — smart home automation, festive lights & safety alarms!',
    realLabBadge: 'REAL-WORLD PROJECTS',
    catAll: 'All Projects',
    catHome: 'Home Automation',
    catFestive: 'Festive & Lights',
    catSecurity: 'Security Alarms',
    catGadgets: 'DIY Gadgets',
    searchPlaceholder: 'Search experiments, e.g. Street Light, Chaser, Alarm...',
    noExperimentsFound: 'No experiments found. Try a different search.',
    runSimulation: 'Run Simulation',
    viewIn3D: '3D Lab',
    diyCost: 'Est. Cost',
    viralTagline: '⚡ Interactive Real-World Physics & Circuit Simulations',
    experimentsReady: 'Real-World DIY Experiments Ready',

    // Real Environment Widget
    envTestTitle: 'Real Environment Test',
    dayNightSliderDesc: 'Drag slider left towards Night to watch the street lamp illuminate!',
    nightStatus: '🌙 Dark Night (Lamp ON)',
    dayStatus: '☀️ Bright Sun (Lamp OFF)',
    twilightStatus: '🌆 Twilight',
    nightLabel: 'Night (0%)',
    dayLabel: 'Day (100%)',
    waterEmpty: 'Empty (0%)',
    waterOverflow: '⚠️ OVERFLOWING (ALARM!)',
    waterLevel: 'Water',
    waterDesc: 'Fill tank above 80% — the moment water touches the probes, alarm sounds!',
    laserTripwireDesc: 'Security laser beam active. Click below to simulate an intruder cutting the beam:',
    cutLaserBtn: 'Cut Laser Beam (Intruder Step!)',
    laserLatchedNote: '⚡ Relay self-latches to sound continuous siren!',
    touchSensorDesc: 'Hold your finger on the touch pad to conduct micro-current and light the lamp:',
    touchHolding: '✨ FINGER DETECTED (CIRCUIT ON!)',
    touchPrompt: 'HOLD FINGER ON TOUCH PAD',
    liveAudioSync: 'Live Audio Sync',

    // Story Mode & Real-World Cutaway
    storyFlowBtn: '⚡ How It Works (3-Step Story)',
    realCutawayBtn: '🔬 Real-Life Cutaway',
    waterTankCutaway: 'Rooftop Water Tank Cutaway',
    diyChallengeBtn: '🧩 DIY Build Challenge',
    storyModeTitle: 'How This Circuit Works in Real Life',
    storyModeSubtitle: 'Interactive 3-Step Walkthrough for Beginners',
    stepWord: 'Step',
    analogyTitle: '💡 Real-Life Analogy',
    scienceTitle: '🔬 The Physics & Electronics',
    iUnderstoodBtn: '🎉 I Understood! (Mastered)',
    nextStepBtn: 'Next Step ➔',
    prevStepBtn: 'Back',
    quickFillBtn: '💧 Quick Fill (95%)',
    drainTankBtn: '🧹 Drain Tank (10%)',
    startMotor: '⚡ Start Water Motor',
    stopMotor: '🛑 Stop Motor',
    motorRunning: 'PUMP ACTIVE: Pumping water to roof...',
    motorOff: 'Motor Idle (Standby)',
    overflowAlertUrgent: '🚨 TANK FULL! TURN OFF MOTOR NOW!',
    tankTelemetryTitle: 'Real-Time Electronics Telemetry',
    probeConduction: 'Water Conduction',
    transistorState: 'Transistor Switch',
    buzzerTelemetry: 'Piezo Siren Audio',
    activeStatus: 'ACTIVE / ON',
    idleStatus: 'IDLE / OFF',
    openCircuit: 'OPEN CIRCUIT (No Current)',
    conductive: 'CONDUCTIVE (Current Flowing!)',

    // Real-life cutaways for all 9 experiments
    staircaseTitle: 'Staircase 2-Way Wiring Cutaway',
    groundFloorSwitch: 'Ground Floor Switch (Downstairs)',
    firstFloorSwitch: '1st Floor Switch (Upstairs)',
    flipDownstairs: 'Flip Downstairs',
    flipUpstairs: 'Flip Upstairs',
    staircaseLampGlow: 'Staircase Pendant Lamp',
    policeLightbar: 'Police Cruiser Strobe & Siren',
    policeRedStrobe: 'RED STROBE',
    policeBlueStrobe: 'BLUE STROBE',
    policeDualSiren: '115 dB Dual Acoustic Horn',
    togglePoliceSiren: 'Toggle Police Siren',
    laserCorridorTitle: 'Laser Security Perimeter Grid',
    laserEmitter: 'Laser Diode Emitter',
    laserDetector: 'LDR Optical Sensor',
    walkIntruder: 'Walk Intruder / Break Beam',
    resetRelay: 'Reset & Disarm Alarm',
    relayLatched: '🚨 LATCHED (BREACH DETECTED)',
    relayArmed: 'ARMED (SECURE)',
    diwaliChaserTitle: 'Festive Running String Lights',
    diwaliSpeed: 'Chaser Speed',
    diwaliSparkle: 'Burst Sparklers ✨',
    fireflyJarTitle: 'Firefly in Glass Mason Jar',
    capacitorChargeLevel: '100µF Capacitor Stored Energy',
    chargeCapacitor: '⚡ Charge Capacitor',
    dischargeFade: '🍃 Let Glow Fade',
    carChargerTitle: '12V Car to 5V USB Phone Charger',
    carBattery12V: '12V Lead-Acid Car Battery',
    usbOutput5V: '5.0V USB Output Port',
    phoneChargingFast: '⚡ Smartphone Fast Charging',
    touchSwitchTitle: 'Capacitive Smart Touch Glass Plate',
    touchGoldPins: 'Touch Dual Gold Terminals',
    ambientHaloLamp: 'Ambient Halo Ring Lamp',
  },

  hi: {
    // Navigation Bar
    navCircuit: 'सर्किट',
    navInstruments: 'मीटर्स',
    nav3dLab: '3D लैब',
    navPuzzles: 'पहेलियाँ',
    navRealLab: 'रियल लैब',
    hotBadge: 'हॉट',

    // Header & Settings
    labSettings: 'लैब सेटिंग्स और ऑप्शन्स',
    appLanguage: 'ऐप की भाषा (Language)',
    langEnglish: 'English',
    langHindi: 'हिन्दी (Hindi)',
    overloadPhysics: 'ओवरलोड फिजिक्स',
    overloadDesc: 'सीमा से अधिक करंट/वोल्टेज पर कॉम्पोनेंट का ब्लास्ट होना',
    audioFx: 'साउंड इफेक्ट्स',
    audioFxDesc: 'रिले की टिक-टिक, बजर और स्विच की आवाजें',
    dailyReminders: 'डेली रिमाइंडर और टिप्स',
    dailyRemindersDesc: 'रोजाना शाम 7:30 बजे नया चैलेंज',
    testNotif: 'टेस्ट नोटिफिकेशन (अभी भेजें)',
    testNotifSending: 'टेस्ट शेड्यूल हुआ (4s में)...',
    visualTheme: 'विजुअल थीम',
    clearBoard: 'बोर्ड साफ करें',
    snapshot: 'स्क्रीनशॉट',
    ratePlay: 'Google Play पर रेट करें',
    privacyPolicy: 'प्राइवेसी पॉलिसी',
    simulate: 'चलाएं',
    simulating: 'चल रहा है',
    proPass: 'प्रो पास',
    getPro: 'प्रो लें',
    proDetails: 'विवरण',
    freeTier: 'फ्री',
    circuitLoaded: 'सर्किट लोड हो गया',
    boardCleared: 'बोर्ड साफ हो गया',
    snapshotSaved: 'स्क्रीनशॉट लिया गया',

    // Real Lab Modal
    realLabTitle: 'रियल लैब',
    realLabSubtitle: 'असली दुनिया के प्रोजेक्ट्स — घर का ऑटोमेशन, दिवाली लाइट्स और सिक्योरिटी अलार्म!',
    realLabBadge: 'रियल-वर्ल्ड प्रोजेक्ट्स',
    catAll: 'सारे प्रोजेक्ट्स',
    catHome: 'होम ऑटोमेशन',
    catFestive: 'दिवाली और लाइट्स',
    catSecurity: 'सिक्योरिटी अलार्म',
    catGadgets: 'उपयोगी गैजेट्स',
    searchPlaceholder: 'प्रोजेक्ट्स खोजें, जैसे दिवाली, स्ट्रीट लाइट, अलार्म...',
    noExperimentsFound: 'कोई प्रोजेक्ट नहीं मिला। सर्च क्वेरी बदलें।',
    runSimulation: 'चला कर देखें',
    viewIn3D: '3D लैब',
    diyCost: 'लागत',
    viralTagline: '⚡ इंटरैक्टिव रियल-वर्ल्ड फिजिक्स और इलेक्ट्रॉनिक्स लैब',
    experimentsReady: 'असली दुनिया के DIY प्रोजेक्ट्स तैयार',

    // Real Environment Widget
    envTestTitle: 'असली माहौल टेस्ट',
    dayNightSliderDesc: 'स्लाइडर को बाईं तरफ (Night) ले जाकर देखें — बल्ब तुरंत ग्लो करेगा!',
    nightStatus: '🌙 अंधेरी रात (बल्ब ON)',
    dayStatus: '☀️ तेज धूप (बल्ब OFF)',
    twilightStatus: '🌆 गोधूलि (शाम)',
    nightLabel: 'रात (0%)',
    dayLabel: 'दिन (100%)',
    waterEmpty: 'खाली (0%)',
    waterOverflow: '⚠️ टंकी भर गई (अलार्म चालू!)',
    waterLevel: 'पानी',
    waterDesc: 'टंकी को 80% से ऊपर भरें — इलेक्ट्रोड टच होते ही अलार्म बज उठेगा!',
    laserTripwireDesc: 'सिक्योरिटी लेज़र बीम चालू है। नीचे दिए बटन को दबाकर चोर की तरह बीम को काटें:',
    cutLaserBtn: 'लेज़र बीम काटें (चोर का पैर!)',
    laserLatchedNote: '⚡ रिले लैच होकर सायरन को लगातार बजाता रहेगा!',
    touchSensorDesc: 'नीचे दिए पैड पर उंगली रखें (Hold) — आपके शरीर के करंट से लाइट ऑन होगी:',
    touchHolding: '✨ उंगली डिटेक्ट हुई (सर्किट ON!)',
    touchPrompt: 'टच पैड पर उंगली दबाए रखें',
    liveAudioSync: 'लाइव ऑडियो सिंक',

    // Story Mode & Real-World Cutaway
    storyFlowBtn: '⚡ 3-स्टेप में समझें (स्टोरी मोड)',
    realCutawayBtn: '🔬 असली दुनिया का कटआउट',
    waterTankCutaway: 'छत की पानी की टंकी (कटआउट)',
    diyChallengeBtn: '🧩 खुद जोड़कर सीखो',
    storyModeTitle: 'यह सर्किट असली दुनिया में कैसे काम करता है?',
    storyModeSubtitle: 'शुरुआती लोगों के लिए 3-स्टेप विज़ुअल गाइड',
    stepWord: 'स्टेप',
    analogyTitle: '💡 घरेलू उपमा (आसान भाषा में)',
    scienceTitle: '🔬 इलेक्ट्रॉनिक्स और फिजिक्स',
    iUnderstoodBtn: '🎉 पूरा समझ आ गया!',
    nextStepBtn: 'अगला स्टेप ➔',
    prevStepBtn: 'पीछे',
    quickFillBtn: '💧 टंकी भरें (95%)',
    drainTankBtn: '🧹 टंकी खाली करें (10%)',
    startMotor: '⚡ पानी की मोटर चालू करें',
    stopMotor: '🛑 मोटर बंद करें',
    motorRunning: 'मोटर चालू है: छत पर पानी चढ़ रहा है...',
    motorOff: 'मोटर बंद है (Standby)',
    overflowAlertUrgent: '🚨 टंकी भर गई! मोटर तुरंत बंद करें!',
    tankTelemetryTitle: 'लाइव इलेक्ट्रॉनिक्स टेलीमेट्री',
    probeConduction: 'पानी का सुचालक होना',
    transistorState: 'ट्रांजिस्टर स्विच',
    buzzerTelemetry: 'पीज़ो सायरन आवाज़',
    activeStatus: 'सक्रिय / चालू',
    idleStatus: 'शांत / बंद',
    openCircuit: 'ओपन सर्किट (करंट बंद)',
    conductive: 'सुचालक (करंट दौड़ रहा है!)',

    // Real-life cutaways for all 9 experiments
    staircaseTitle: 'सीढ़ियों की 2-वे स्विच कट-अवे',
    groundFloorSwitch: 'निचली मंजिल का स्विच',
    firstFloorSwitch: 'ऊपरी मंजिल का स्विच',
    flipDownstairs: 'निचला स्विच दबाएं',
    flipUpstairs: 'ऊपरी स्विच दबाएं',
    staircaseLampGlow: 'सीढ़ियों का झूमर बल्ब',
    policeLightbar: 'पुलिस पेट्रोल लाइटबार व सायरन',
    policeRedStrobe: 'लाल स्ट्रोब (RED)',
    policeBlueStrobe: 'नीला स्ट्रोब (BLUE)',
    policeDualSiren: '115 dB डुअल पुलिस हॉर्न',
    togglePoliceSiren: 'पुलिस सायरन चालू/बंद',
    laserCorridorTitle: 'लेज़र सुरक्षा घेरा (डोरवे)',
    laserEmitter: 'लेज़र डायोड बीम',
    laserDetector: 'LDR ऑप्टिकल सेंसर',
    walkIntruder: 'चोर का प्रवेश / बीम काटो',
    resetRelay: 'रिले रीसेट व अलार्म बंद करें',
    relayLatched: '🚨 लैच लॉक (चोर पकड़ा गया!)',
    relayArmed: 'सुरक्षित (ARMED)',
    diwaliChaserTitle: 'दिवाली की रनिंग LED झालर',
    diwaliSpeed: 'झालर की स्पीड',
    diwaliSparkle: 'फुलझड़ी जलाएं ✨',
    fireflyJarTitle: 'कांच के जार में जुगनू',
    capacitorChargeLevel: '100µF कैपेसिटर संचित ऊर्जा',
    chargeCapacitor: '⚡ कैपेसिटर चार्ज करें',
    dischargeFade: '🍃 धीरे-धीरे बुझने दें',
    carChargerTitle: '12V कार बैटरी से 5V फोन चार्जर',
    carBattery12V: '12V कार बैटरी',
    usbOutput5V: '5.0V USB चार्जिंग पोर्ट',
    phoneChargingFast: '⚡ स्मार्टफोन फ़ास्ट चार्जिंग',
    touchSwitchTitle: 'स्मार्ट ग्लास टच स्विच प्लेट',
    touchGoldPins: 'सोने की पिनों पर उंगली रखें',
    ambientHaloLamp: 'एम्बिएंट हेलो रिंग लाइट',
  },
};

const STORAGE_KEY = 'electrolab_language';

class I18nManager {
  private currentLang: Language = 'en';
  private listeners: Set<(lang: Language) => void> = new Set();

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'hi') {
        this.currentLang = saved;
      } else {
        // Default is English for Tier 1 international audiences
        this.currentLang = 'en';
      }
    } catch {
      this.currentLang = 'en';
    }
  }

  get language(): Language {
    return this.currentLang;
  }

  get translations(): Translations {
    return TRANSLATIONS[this.currentLang];
  }

  setLanguage(lang: Language): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    soundFX.playClick();
    NativeBridge.haptic('medium');
    this.listeners.forEach((listener) => listener(lang));
  }

  subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nManager();

/**
 * React hook for language state and reactive re-renders
 */
export function useI18n(): {
  lang: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
} {
  const [lang, setLangState] = useState<Language>(() => i18n.language);

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLang) => {
      setLangState(newLang);
    });
    return unsubscribe;
  }, []);

  return {
    lang,
    t: TRANSLATIONS[lang],
    setLanguage: (newLang) => i18n.setLanguage(newLang),
  };
}
