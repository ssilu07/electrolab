import React, { useState, useEffect } from 'react';
import { RealExperiment, getLocalizedExperiment } from '../data/realExperiments';
import { useI18n } from '../services/i18nService';
import { adService } from '../services/adService';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import confetti from 'canvas-confetti';
import { RealWorldCutawayView } from './RealWorldCutawayView';
import {
  X,
  Zap,
  Sparkles,
  Volume2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Award,
  Layers,
  Activity,
  ArrowRight,
  Play,
} from 'lucide-react';

interface RealWorldStoryModalProps {
  experiment: RealExperiment;
  sliderValue: number;
  onSliderChange: (val: number) => void;
  onClose: () => void;
}

export const RealWorldStoryModal: React.FC<RealWorldStoryModalProps> = ({
  experiment,
  sliderValue,
  onSliderChange,
  onClose,
}) => {
  const { lang, t } = useI18n();
  const loc = getLocalizedExperiment(experiment, lang);

  const [activeTab, setActiveTab] = useState<'story' | 'cutaway' | 'challenge'>('story');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedChallengeSteps, setCompletedChallengeSteps] = useState<number[]>([]);

  useEffect(() => {
    adService.setOverlayOpen('real_world_story_modal', true).catch(() => {});
    return () => {
      adService.setOverlayOpen('real_world_story_modal', false).catch(() => {});
    };
  }, []);

  // Detailed bilingual story steps for all 9 experiments
  const getStorySteps = () => {
    switch (experiment.id) {
      case 'water-tank-alarm':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. पानी का स्पर्श (सेंसर प्रोब)' : '1. The Water Sensor (Conductive Probes)',
            subtitle: lang === 'hi' ? 'पानी एक अदृश्य स्विच की तरह दोनों तारों को जोड़ देता है' : 'Water acts as an invisible electric bridge',
            analogy: lang === 'hi'
              ? 'टंकी के ढक्कन से 2 तांबे के तार लटके होते हैं। साधारण नल के पानी में मिनरल्स होते हैं जो बिजली को एक तार से दूसरे तार तक ले जाने में मदद करते हैं!'
              : 'Two copper wires hang at the rim of the tank. Pure water is an insulator, but everyday tap water contains dissolved mineral ions that carry electrical current like tiny invisible boats!',
            science: lang === 'hi'
              ? 'जैसे ही पानी 75% लेवल पर दोनों तारों को छूता है, पानी का रेजिस्टेंस इनफिनिटी से घटकर ~1.8 kΩ रह जाता है। 9V बैटरी से 4.2 mA का माइक्रो-करंट बेस की तरफ दौड़ता है।'
              : 'When fluid touches both probes, liquid impedance drops from infinity (∞) to ~1.8 kΩ. A micro-current flows from +9V through the water into the base resistor.',
            badge: lang === 'hi' ? 'फिजिकल सेंसर' : 'PHYSICAL SENSOR',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. जादुई नल (2N2222 ट्रांजिस्टर)' : '2. The Electronic Tap (Transistor Switch)',
            subtitle: lang === 'hi' ? 'पानी के छोटे से करंट को महसूस करके बड़ा गेट खोल देता है' : 'Small trickle at the Base unlatches the battery floodgate',
            analogy: lang === 'hi'
              ? 'ट्रांजिस्टर एक पानी के नल (Tap) जैसा है। आपकी उंगली से हल्के हैंडल को घुमाना बेस करंट है, और नल से पानी की तेज धार निकलना कलेक्टर करंट है!'
              : 'Think of the Transistor as an electronic water valve. Turning the small valve handle with your fingertips takes almost zero effort (Base current), but it unleashes a huge flood of water through the main pipe (Collector-Emitter current)!',
            science: lang === 'hi'
              ? 'बेस-एमिटर वोल्टेज 0.7V से ऊपर जाते ही (V_be >= 0.7V), NPN ट्रांजिस्टर सैचुरेशन में आ जाता है और कलेक्टर से एमिटर का रास्ता पूरी तरह खुल जाता है।'
              : 'As base-emitter voltage crosses the 0.7V threshold (Vbe >= 0.7V), the NPN transistor is driven into deep saturation, creating a near-zero resistance path from Collector to Ground.',
            badge: lang === 'hi' ? 'इलेक्ट्रॉनिक स्विच' : 'AMPLIFIER SWITCH',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. खतरे का सायरन (लाउड अलार्म)' : '3. Loud Siren Alerts the Household',
            subtitle: lang === 'hi' ? 'टंकी छलकने से पहले पूरे घर को जगा देता है' : 'Piercing acoustic alert before a single drop overflows',
            analogy: lang === 'hi'
              ? 'ट्रांजिस्टर का गेट खुलते ही 9V बैटरी से पूरी ताकत बज़र और रेड LED में पहुंचती है। किचन में लगा बज़र 108 dB की तीखी आवाज़ करता है और पानी की बर्बादी रुक जाती है!'
              : 'With the transistor switch closed, the 9V battery surges into the kitchen piezo buzzer and red LED. At 108 dB, the household is alerted in seconds to turn off the pump!',
            science: lang === 'hi'
              ? 'पीज़ोइलेक्ट्रिक क्रिस्टल 3.8 kHz की नेचुरल फ्रीक्वेंसी पर कांपने लगता है। रेड LED 20 mA करंट लेकर चमकती है, जिससे साउंड + लाइट दोनों से अलर्ट मिलता है।'
              : 'The piezoelectric diaphragm vibrates at its 3.8 kHz resonance frequency, emitting high-decibel acoustic waves while the alert LED flashes.',
            badge: lang === 'hi' ? 'आउटपुट अलर्ट' : 'OUTPUT ALERT',
            icon: Volume2,
          },
        ];

      case 'staircase-switch':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. दोहरी वायरिंग (ट्रैवलर तार)' : '1. Dual Traveler Wires',
            subtitle: lang === 'hi' ? 'निचली और ऊपरी मंजिल के बीच 2 समानांतर लाइनें' : 'Two parallel traveler lines link the two floors',
            analogy: lang === 'hi'
              ? 'सोचिए सीढ़ियों के बीच दो रेल की पटरियां (Line 1 और Line 2) बिछी हैं। दोनों तरफ का स्विच तय करता है कि ट्रेन किस पटरी से होकर बल्ब तक पहुंचेगी।'
              : 'Imagine two parallel railway tracks linking the top and bottom of the staircase. Each switch acts as a track switcher directing electricity along Line 1 or Line 2.',
            science: lang === 'hi'
              ? 'दो SPDT (Single Pole Double Throw) स्विचों के कॉमन टर्मिनलों के बीच 2 ट्रैवलर तार जुड़े होते हैं।'
              : 'Two SPDT switches connect through dual traveler lines. Flipping either switch toggles between traveler wire A and wire B.',
            badge: lang === 'hi' ? 'वायरिंग लॉजिक' : 'TRAVELER BUS',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. 2-वे स्विच का बुलियन गणित' : '2. XNOR Boolean Logic',
            subtitle: lang === 'hi' ? 'जब दोनों स्विच एक ही पटरी चुनते हैं, सर्किट पूरा!' : 'Circuit completes whenever both switches align',
            analogy: lang === 'hi'
              ? 'अगर नीचे वाला स्विच भी Line 1 पर है और ऊपर वाला भी Line 1 पर है, तो बिजली आराम से बल्ब तक पहुंच जाती है।'
              : 'If both switches point to the same traveler wire, electricity has a continuous unbroken bridge to the hanging lamp!',
            science: lang === 'hi'
              ? 'बुलियन समीकरण: Light = (SW1 == SW2)। किसी भी एक स्विच को फ्लिप करने से यह समानता टूटती या बहाल होती है।'
              : 'Boolean equation: Output = (SW1 XNOR SW2). Flipping either switch inverts the circuit state from either floor.',
            badge: lang === 'hi' ? 'लॉजिक गेट' : 'XNOR LOGIC',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. किसी भी मंजिल से रोशनी कंट्रोल' : '3. Freedom of Multi-Floor Control',
            subtitle: lang === 'hi' ? 'नीचे से ऑन करके ऊपर जाकर ऑफ करो!' : 'Turn ON downstairs, walk up and turn OFF upstairs!',
            analogy: lang === 'hi'
              ? 'रात में अंधेरी सीढ़ियों पर चढ़ने से पहले नीचे का स्विच दबाएं, ऊपर पहुंचकर बिना नीचे आए ऊपर से ही लाइट बुझा दें।'
              : 'Never walk in the dark! Turn on light before taking a single step, walk up safely, and switch it off upstairs without ever walking back down.',
            science: lang === 'hi'
              ? '330Ω रेसिस्टर से होकर 9V सप्लाई सीढ़ियों के लैंप को 25 mA करंट देती है, जिससे सीढ़ियों पर भरपूर रोशनी फैलती है।'
              : '9V DC power safely delivers 25 mA through current-limiting resistor to cast warm ambient light across the stair treads.',
            badge: lang === 'hi' ? 'होम ऑटोमेशन' : 'HOUSEHOLD STANDARD',
            icon: Volume2,
          },
        ];

      case 'diwali-chaser':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. NE555 टाइमर की दिल की धड़कन' : '1. The 555 Heartbeat Clock',
            subtitle: lang === 'hi' ? 'हर सेकंड में कई बार बिजली की पल्स पैदा करता है' : 'Generates periodic square-wave clock pulses',
            analogy: lang === 'hi'
              ? 'NE555 एक बहुत तेज ड्रमर की तरह है जो एक निश्चित लय पर ड्रम बजाता है और हर थाप पर बिजली की पल्स छोड़ता है।'
              : 'The NE555 timer acts like a master drummer keeping time at an exact tempo, sending out electric pulses on pin 3 with every beat.',
            science: lang === 'hi'
              ? 'Astable Multivibrator मोड में टाइमर बिना किसी बाहरी ट्रिगर के लगातार 0V और 9V के बीच ऑसिलेट करता है।'
              : 'In astable multivibrator mode, resistors R1, R2, and capacitor C1 determine the oscillation frequency: f = 1.44 / ((R1 + 2*R2) * C1).',
            badge: lang === 'hi' ? 'क्लॉक ऑसिलेटर' : 'CLOCK PULSE',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. कैपेसिटर की चार्जिंग और डिस्चार्जिंग' : '2. Capacitor Charge & Discharge Cycle',
            subtitle: lang === 'hi' ? '1/3 Vcc और 2/3 Vcc के बीच लगातार साइकिल' : 'Oscillates between 1/3 and 2/3 supply voltage',
            analogy: lang === 'hi'
              ? 'जैसे एक बाल्टी नल से भरती है और फिर तेजी से खाली होती है, वैसे ही कैपेसिटर 6V तक भरता है और फिर 3V तक खाली होता है।'
              : 'Like a bucket constantly filling with water and tripping a lever to drain, the timing capacitor charges to 2/3 Vcc and discharges to 1/3 Vcc.',
            science: lang === 'hi'
              ? 'पिन 2 (Trigger) और पिन 6 (Threshold) कैपेसिटर के वोल्टेज को मापते हैं और आउटपुट को फ्लिप करते रहते हैं।'
              : 'Pins 2 & 6 monitor capacitor charge, flipping output HIGH during charging and LOW through Pin 7 during discharge.',
            badge: lang === 'hi' ? 'एनालॉग टाइमिंग' : 'RC TIME CONSTANT',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. भागने वाली रंग-बिरंगी झालर!' : '3. Cascading Rainbow Festive Chaser',
            subtitle: lang === 'hi' ? 'बारी-बारी से जलकर भागती हुई लाइट का भ्रम पैदा करती है' : 'Illuminates LEDs in sequence creating a dynamic chase wave',
            analogy: lang === 'hi'
              ? 'दिवाली पर बालकनी में सजी झालर में जब एक के बाद एक LED जलती है, तो ऐसा लगता है जैसे रोशनी दौड़ रही हो!'
              : 'As each colored LED fires in timed sequence, our eyes perceive a fluid running wave of festive light dancing across the balcony!',
            science: lang === 'hi'
              ? 'पल्स बदलने पर करंट का रास्ता बदलता है और फॉरवर्ड बायस्ड LEDs क्रमिक रूप से जलकर शानदार रनिंग पैटर्न बनाती हैं।'
              : 'Clock transitions switch current paths across LED stages, producing authentic decorative running chaser patterns.',
            badge: lang === 'hi' ? 'दिवाली स्पेशल' : 'FESTIVE CHASER',
            icon: Volume2,
          },
        ];

      case 'police-siren':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. रेड और ब्लू का बारी-बारी फ्लिप' : '1. Red-Blue Alternating Flip-Flop',
            subtitle: lang === 'hi' ? 'एक पल लाल जलता है, अगले पल नीला' : 'Rapid transition between emergency vehicle colors',
            analogy: lang === 'hi'
              ? 'सोचिए दो खिलाड़ी सी-सॉ पर बैठे हैं — जब लाल ऊपर जाता है तो नीला नीचे, और जब नीला ऊपर तो लाल नीचे!'
              : 'Like two dancers taking turns on a stage, when the Red LED strobe fires, the Blue sinks current, and vice versa!',
            science: lang === 'hi'
              ? '555 आउटपुट जब HIGH होता है तो रेड LED सोर्स करंट लेती है; जब LOW होता है तो ब्लू LED सिंक करंट लेती है।'
              : 'When 555 output transitions HIGH (+9V), Red LED is forward biased. When LOW (0V), Blue LED draws sink current from +9V rail.',
            badge: lang === 'hi' ? 'फ्लैशर लॉजिक' : 'STROBE OSCILLATOR',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. 115 dB लाउड पुलिस सायरन' : '2. 115 dB High-Pitch Acoustic Siren',
            subtitle: lang === 'hi' ? 'तेज़ फ्रीक्वेंसी से सायरन की आवाज़' : 'Dual-tone frequency modulation alerts traffic',
            analogy: lang === 'hi'
              ? 'आसपास की गाड़ियों को तुरंत रास्ता देने के लिए यह तीखी और गूंजने वाली पुलिस सायरन टोन पैदा करता है।'
              : 'Cutting through city traffic noise, the acoustic piezo speaker pulses at 1.8 kHz to command immediate attention!',
            science: lang === 'hi'
              ? 'सायरन आउटपुट पिन से जुड़ा पीज़ो क्रिस्टल हाई-स्पीड ऑसिलेशन पर कांपता है और तीव्र ध्वनि तरंगें फेंकता है।'
              : 'Piezoelectric diaphragm is driven directly by square wave pulses, emitting loud directional sirens.',
            badge: lang === 'hi' ? 'सायरन हॉर्न' : 'ACOUSTIC SIREN',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. असली पुलिस पेट्रोल कार लुक' : '3. Authentic Code-3 Pursuit Strobe',
            subtitle: lang === 'hi' ? 'रात में दूर से ही चमकने वाला हाई-इंटेंसिटी लाइटबार' : 'Volumetric emergency beam visible from miles away',
            analogy: lang === 'hi'
              ? 'हाईवे पर पेट्रोलिंग कर रही पुलिस कार की छत पर लगा लाइटबार दूर से ही सुरक्षित रास्ता साफ करा देता है।'
              : 'The high-intensity red and blue strobe modules cast sweeping dual-color emergency rays across the road.',
            science: lang === 'hi'
              ? 'हाई-ल्यूमेंस LEDs और कैपेसिटिव पल्सिंग से मिनिमम बैटरी खर्च में मैक्सिमम विजिबिलिटी हासिल होती है।'
              : 'Pulsed duty-cycle operation delivers peak luminous flux without thermal degradation, maximizing battery efficiency.',
            badge: lang === 'hi' ? 'इमरजेंसी व्हीकल' : 'EMERGENCY GRADE',
            icon: Volume2,
          },
        ];

      case 'laser-burglar-alarm':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. अदृश्य लेज़र सुरक्षा बीम' : '1. Invisible Laser Perimeter Grid',
            subtitle: lang === 'hi' ? 'दरवाजे के आर-पार तनी हुई लेज़र रेखा' : 'Focused laser beam spans the room entrance',
            analogy: lang === 'hi'
              ? 'एक दीवार से लेज़र की पतली सुई जैसी लाल किरण निकलती है और सामने वाली दीवार पर लगे LDR सेंसर की आँख में गिरती है।'
              : 'A razor-sharp laser beam shoots across the room entrance, focused directly onto the optical eye of the LDR sensor.',
            science: lang === 'hi'
              ? 'लेज़र की रोशनी LDR पर गिरने से उसका रेजिस्टेंस बहुत कम (100Ω) रहता है, जिससे सर्किट शांत रहता है।'
              : 'Direct laser illumination keeps LDR resistance low (100Ω), keeping the relay driver in an unarmed, low-voltage state.',
            badge: lang === 'hi' ? 'ऑप्टिकल बीम' : 'LASER EMITTER',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. चोर का साया और बीम का कटना' : '2. Intruder Cuts the Beam',
            subtitle: lang === 'hi' ? 'एक पल के लिए भी बीम कटी तो अलार्म ट्रिगर!' : 'Even a fraction-of-a-second shadow trips the trigger',
            analogy: lang === 'hi'
              ? 'जैसे ही चोर का पैर या शरीर बीच में आता है, लेज़र की रोशनी एक पल के लिए रुक जाती है और LDR पर अंधेरा छा जाता है।'
              : 'The moment an intruder walks through, their silhouette cuts the beam. The instant darkness surges LDR resistance past 100kΩ!',
            science: lang === 'hi'
              ? 'LDR पर अंधेरा होते ही बेस वोल्टेज 0.7V पार करता है और रिले की कॉइल में 9V का करंट दौड़ जाता है।'
              : 'Beam interruption spikes base voltage, energizing the 5V electromechanical relay coil in under 5 milliseconds.',
            badge: lang === 'hi' ? 'इंट्रूडर डिटेक्शन' : 'BREACH DETECTED',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. सेल्फ-लैचिंग रिले का परमानेंट लॉक' : '3. Self-Latching Permanent Alarm Lock',
            subtitle: lang === 'hi' ? 'चोर भाग भी जाए तब भी अलार्म बजता रहेगा!' : 'Alarm never stops even if the intruder runs away!',
            analogy: lang === 'hi'
              ? 'यह आम अलार्म नहीं है! रिले अपने खुद के स्विच से खुद को बिजली देने लगता है और तब तक बजता रहता है जब तक आप चाबी से बंद न करें।'
              : 'A standard alarm shuts off when the intruder steps out, but this self-latching relay feeds power back into its own coil, locking the siren ON forever!',
            science: lang === 'hi'
              ? 'Normally-Open (NO) कॉन्टैक्ट बंद होकर कॉइल को परमानेंट सप्लाई से जोड़ देता है। केवल रीसेट बटन दबाने पर ही लैच टूटता है।'
              : 'The relay NO contact closes in parallel with the trigger, maintaining coil holding current until the normally-closed reset button is pressed.',
            badge: lang === 'hi' ? 'लैचिंग रिले' : 'LATCHED SECURITY',
            icon: Volume2,
          },
        ];

      case 'firefly-breathing-led':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. कैपेसिटर में बिजली का संचय' : '1. Capacitor Electrostatic Storage',
            subtitle: lang === 'hi' ? 'बैटरी से 100µF कैपेसिटर में चार्ज भरना' : 'Storing energy like a tiny rechargeable battery',
            analogy: lang === 'hi'
              ? 'कैपेसिटर एक छोटे डैम (तालाब) की तरह है। स्विच ऑन करते ही डैम लबालब 9V की बिजली से भर जाता है।'
              : 'The 100µF electrolytic capacitor acts like a miniature reservoir, filling with electrical charge the moment the switch closes.',
            science: lang === 'hi'
              ? 'Q = C * V। 100µF कैपेसिटर 9V पर 0.9 मिलीकूलम्ब चार्ज और 4.05 मिलीजूल ऊर्जा स्टोर कर लेता है।'
              : 'Capacitor charges rapidly via Q = C * V, accumulating 4.05 millijoules of electrostatic potential energy across its plates.',
            badge: lang === 'hi' ? 'एनर्जी स्टोर' : 'ENERGY STORAGE',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. RC टाइम कॉन्स्टेंट और स्मूथ डिस्चार्ज' : '2. Smooth RC Exponential Decay',
            subtitle: lang === 'hi' ? 'स्विच ऑफ करने पर भी लाइट तुरंत नहीं बुझती' : 'Gradual voltage decay through resistance',
            analogy: lang === 'hi'
              ? 'जैसे गर्म चाय का कप धीरे-धीरे ठंडा होता है, वैसे ही कैपेसिटर स्टोर्ड चार्ज को बूंद-बूंद करके LED में छोड़ता है।'
              : 'When switch opens, the capacitor discharges gradually through the LED and 330Ω resistor with a natural mathematical decay curve.',
            science: lang === 'hi'
              ? 'V(t) = V0 * e^(-t / RC)। यह एक्सपोनेंशियल डीके कर्व इंसान की आंखों को बेहद सुकून देने वाली स्मूथ ब्रीदिंग लाइट देता है।'
              : 'The voltage decays exponentially via V(t) = V0 * e^(-t / RC), producing smooth organic luminance reduction without microcontrollers.',
            badge: lang === 'hi' ? 'एनालॉग डीके' : 'RC TIMING',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. जीवित जुगनू जैसी ब्रीदिंग लाइट' : '3. Living Firefly Bioluminescent Pulse',
            subtitle: lang === 'hi' ? 'बिना किसी कोडिंग के शुद्ध एनालॉग जादू!' : 'Pure relaxing analog aesthetic magic',
            analogy: lang === 'hi'
              ? 'जार के अंदर बैठा जुगनू जैसे सांस लेता है और धीरे-धीरे चमकता-बुझता है, यह सर्किट ठीक वैसा ही अहसास कराता है।'
              : 'The warm amber LED mimics the biological glow of a living firefly in a summer night jar, fading out organically over seconds.',
            science: lang === 'hi'
              ? 'LED का फॉरवर्ड वोल्टेज थ्रेशोल्ड (2.1V) तक पहुंचते ही करंट धीरे-धीरे शून्य होकर लाइट को पूरी तरह बुझा देता है।'
              : 'As capacitor voltage approaches LED forward threshold (Vf ≈ 2.1V), diode current asymptotically approaches zero.',
            badge: lang === 'hi' ? 'एस्थेटिक गैजेट' : 'ANALOG AESTHETIC',
            icon: Volume2,
          },
        ];

      case 'car-mobile-charger':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. कार की 12V बैटरी का खतरा' : '1. High-Voltage Car Battery Hazard',
            subtitle: lang === 'hi' ? '12V से 14.4V वोल्टेज फोन को जला सकता है' : '12V-14V raw battery voltage would destroy a phone',
            analogy: lang === 'hi'
              ? 'कार की भारी बैटरी 12 वोल्ट देती है, जबकि आपका स्मार्टफोन सिर्फ 5 वोल्ट झेल सकता है। बिना रेगुलेटर जोड़े फोन ब्लास्ट हो जाएगा!'
              : 'Car lead-acid batteries deliver 12V to 14.4V. Connecting that directly to a 5V smartphone would instantly destroy its charging IC!',
            science: lang === 'hi'
              ? 'स्मार्टफोन की USB चिप केवल 5.0V ± 0.25V ही स्वीकार करती है। हाई वोल्टेज से सुरक्षा अनिवार्य है।'
              : 'USB standard requires strict 5.0V ± 0.25V. High-voltage transients and alternator ripple must be stepped down and filtered.',
            badge: lang === 'hi' ? '12V इनपुट' : 'RAW 12V INPUT',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. वोल्टेज रेगुलेटर और फिल्टरिंग' : '2. Voltage Regulation & Ripple Filtering',
            subtitle: lang === 'hi' ? '12V को स्थिर 5.0V पर लॉक करना' : 'Stepping down to a pristine 5.0V standard',
            analogy: lang === 'hi'
              ? 'वोल्टेज रेगुलेटर एक सुरक्षा वाल्व की तरह है जो 12V के दबाव को कम करके ठीक 5.0V का सुरक्षित प्रवाह बाहर निकालता है।'
              : 'The voltage regulator stage sheds excess voltage, clamping the output to exactly 5.0V while capacitors smooth out engine electrical noise.',
            science: lang === 'hi'
              ? 'इनपुट कैपेसिटर 100µF और आउटपुट कैपेसिटर 10µF मिलकर एसी रिपल और वोल्टेज स्पाइक्स को सोख लेते हैं।'
              : 'Input and output filter capacitors decouple supply noise, maintaining low output impedance under sudden phone load current steps.',
            badge: lang === 'hi' ? '5V रेगुलेटर' : '5.0V REGULATION',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. सुरक्षित स्मार्टफोन फ़ास्ट चार्जिंग!' : '3. Safe Smartphone Fast Charging',
            subtitle: lang === 'hi' ? 'इमरजेंसी में गाड़ी से फोन चार्ज करें' : 'Reliable mobile device power on the road',
            analogy: lang === 'hi'
              ? 'गाड़ी के सिगरेट लाइटर सॉकेट में चार्जर लगाकर आप कहीं भी सफर में अपना फोन सुरक्षित और तेजी से चार्ज कर सकते हैं!'
              : 'Plugged into the 12V dash socket, clean 5V USB power fuels your smartphone safely on long road trips.',
            science: lang === 'hi'
              ? 'आउटपुट 5V पर ग्रीन इंडिकेटर जलता है और फोन को लगातार 2.4A तक का सुरक्षित करंट मिलता है।'
              : 'Regulated 5.0V rail powers the green charge indicator LED and delivers stable current up to phone power management limits.',
            badge: lang === 'hi' ? 'लाइफ हैक' : 'USB FAST CHARGE',
            icon: Volume2,
          },
        ];

      case 'touch-switch':
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. उंगली का नैनो-एम्पियर करंट' : '1. Human Finger Nano-Amp Bridge',
            subtitle: lang === 'hi' ? 'इंसानी त्वचा बिजली की सुचालक है' : 'Skin dielectric carries micro-amperes of current',
            analogy: lang === 'hi'
              ? 'जब आप सोने की दो पिनों पर उंगली रखते हैं, तो आपकी त्वचा का हल्का रेजिस्टेंस दोनों तारों के बीच एक सूक्ष्म पुल बना देता है।'
              : 'When your finger bridges the two gold terminals, your skin resistance (~50kΩ-100kΩ) allows a microscopic trickle of current to pass.',
            science: lang === 'hi'
              ? 'शरीर से होकर 9V बैटरी से मात्र 15 माइक्रो-एम्पियर (15 µA) का हल्का करंट ट्रांजिस्टर के बेस में जाता है, जो पूरी तरह सुरक्षित है।'
              : 'A minute electrostatic current (Ib ≈ 15 µA) flows through the human skin impedance safely into the base terminal.',
            badge: lang === 'hi' ? 'बायोमेट्रिक टच' : 'TOUCH SENSOR',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. ट्रांजिस्टर का 200 गुना एम्पलीफायर' : '2. 200x Transistor Current Gain (hFE)',
            subtitle: lang === 'hi' ? 'माइक्रो-करंट को मिली-एम्पियर में बदल देना' : 'Magnifying weak skin current into powerful drive',
            analogy: lang === 'hi'
              ? 'ट्रांजिस्टर एक सुपर-लाउडस्पीकर की तरह है जो उंगली की धीमी फुसफुसाहट को इतनी तेज आवाज बना देता है कि बल्ब जल उठे!'
              : 'The NPN transistor acts like a mega-amplifier, multiplying the microscopic skin current by 200 times into a muscular 30 mA!',
            science: lang === 'hi'
              ? 'Ic = hFE * Ib। 15 µA * 200 = 3000 µA = 3 mA से 30 mA तक करंट कलेक्टर से बहने लगता है और स्विच ऑन हो जाता है।'
              : 'Using high current gain (hFE ≈ 200), Ic = hFE * Ib amplifies 15 µA of base current into 30 mA of collector current.',
            badge: lang === 'hi' ? 'करंट गेन' : 'AMPLIFIER GAIN',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. जादुई एम्बिएंट हेलो लाइट चालू!' : '3. Futuristic Ambient Halo Illumination',
            subtitle: lang === 'hi' ? 'बिना किसी बटन के सिर्फ छूने से लाइट ऑन!' : 'Zero mechanical moving parts smart glass plate',
            analogy: lang === 'hi'
              ? 'होटलों और लग्जरी घरों में लगे मॉडर्न टच स्विच इसी सिद्धांत पर काम करते हैं — उंगली हटाते ही बंद, छूते ही चालू!'
              : 'Touching the glass plate instantly turns on the luxury ambient ring light on the wall with tactile visual feedback.',
            science: lang === 'hi'
              ? 'सॉलिड-स्टेट स्विच होने के कारण इसमें कोई खटपट या घिसावट नहीं होती और यह लाखों बार बिना खराब हुए काम करता है।'
              : 'Solid-state switching eliminates mechanical contact wear and arcing, ensuring millions of silent, ultra-fast actuation cycles.',
            badge: lang === 'hi' ? 'स्मार्ट टच' : 'SOLID STATE',
            icon: Volume2,
          },
        ];

      case 'auto-street-light':
      default:
        return [
          {
            step: 1,
            title: lang === 'hi' ? '1. रोशनी वाली आँख (LDR सेंसर)' : '1. The Light Eye (LDR Sensor)',
            subtitle: lang === 'hi' ? 'दिन में सोता है, रात में जागता है' : 'Sleeps in sunshine, wakes up in darkness',
            analogy: lang === 'hi'
              ? 'LDR एक ऐसी आँख है जो धूप में करंट को आराम से जाने देती है, लेकिन अंधेरा होते ही भारी रुकावट (100kΩ) बन जाती है।'
              : 'The LDR is like an electronic eye. In broad daylight it lets current flow easily (100Ω), but in the dark it surges to 100,000Ω, redirecting voltage toward the transistor!',
            science: lang === 'hi'
              ? 'दिन में LDR का रेजिस्टेंस 100Ω रहता है, जिससे बेस वोल्टेज 0.7V से कम रहता है। रात होते ही रेजिस्टेंस 100kΩ हो जाता है।'
              : 'Daylight keeps LDR resistance low (100Ω), grounding the base node. Night surges resistance to 100kΩ, raising base voltage past 0.7V.',
            badge: lang === 'hi' ? 'लाइट सेंसर' : 'OPTICAL SENSOR',
            icon: Zap,
          },
          {
            step: 2,
            title: lang === 'hi' ? '2. वोल्टेज डिवाइडर और ट्रांजिस्टर' : '2. Voltage Divider & Transistor Switch',
            subtitle: lang === 'hi' ? 'शाम होते ही ऑटोमैटिक ऑन' : 'Automatic tipping point at dusk',
            analogy: lang === 'hi'
              ? 'LDR और 10kΩ रेसिस्टर मिलकर एक तराजू की तरह काम करते हैं। जैसे ही अंधेरा बढ़ता है, ट्रांजिस्टर ऑन हो जाता है।'
              : 'The LDR and 10kΩ resistor act like a balance scale. When darkness tips the scale, base current turns ON the transistor switch!',
            science: lang === 'hi'
              ? 'वोल्टेज डिवाइडर फॉर्मूला: V_base = 9V * (R_div / (R_ldr + R_div))। अंधेरे में V_base 0.7V पार कर जाता है।'
              : 'Voltage divider formula: V_base = 9V * (R_div / (R_ldr + R_div)). At night, V_base surges past 0.7V to switch on the lamp.',
            badge: lang === 'hi' ? 'डिवाइडर लॉजिक' : 'DIVIDER LOGIC',
            icon: Activity,
          },
          {
            step: 3,
            title: lang === 'hi' ? '3. सड़क की लाइट चालू!' : '3. Street Lamp Illuminates the Road',
            subtitle: lang === 'hi' ? 'बिना इंसान के अपने आप ऑन' : 'Zero human intervention night safety',
            analogy: lang === 'hi'
              ? 'गाड़ियों और पैदल चलने वालों के लिए रोशनी चालू हो जाती है, और सुबह सूरज निकलते ही अपने आप बंद हो जाती है!'
              : 'The high-power amber LED casts light onto the sidewalk, safely guiding pedestrians and turning off at sunrise automatically!',
            science: lang === 'hi'
              ? 'ट्रांजिस्टर सैचुरेट होकर LED को फुल करंट देता है। 330Ω रेसिस्टर LED को जलने से बचाता है।'
              : 'Transistor saturation delivers 25 mA to the LED lamp through the 330Ω protective current-limiting resistor.',
            badge: lang === 'hi' ? 'लैंप आउटपुट' : 'LAMP OUTPUT',
            icon: Volume2,
          },
        ];
    }
  };

  const storySteps = getStorySteps();

  // DIY Challenge wiring tasks for Water Tank
  const challengeTasks = [
    {
      id: 1,
      title: lang === 'hi' ? 'टास्क 1: बैटरी से पानी के प्रोब को जोड़ो' : 'Task 1: Connect Battery (+) to Water Probe',
      desc:
        lang === 'hi'
          ? 'बैटरी के पॉजिटिव टर्मिनल से 9V पावर को टंकी के पहले तांबे के तार में भेजो।'
          : 'Wire 9V power from the Battery (+) terminal to the first copper probe in the water tank.',
      doneNote: lang === 'hi' ? '✨ शाबाश! अब पानी में 9V का चार्ज तैयार है।' : '✨ Great! 9V positive charge is now staged at the tank probe.',
    },
    {
      id: 2,
      title: lang === 'hi' ? 'टास्क 2: दूसरे प्रोब को ट्रांजिस्टर के Base से जोड़ो' : 'Task 2: Connect Water Probe to Transistor Base',
      desc:
        lang === 'hi'
          ? 'टंकी के दूसरे तार को 1kΩ रेसिस्टर के ज़रिए 2N2222 ट्रांजिस्टर के Base पिन से जोड़ो।'
          : 'Route the second probe through the 1kΩ resistor to the Base pin of the 2N2222 NPN transistor.',
      doneNote: lang === 'hi' ? '✨ शानदार! पानी टच होते ही ट्रांजिस्टर को सिग्नल मिल जाएगा।' : '✨ Awesome! The transistor can now detect water touch.',
    },
    {
      id: 3,
      title: lang === 'hi' ? 'टास्क 3: लाउड बज़र को ट्रांजिस्टर के Collector से जोड़ो' : 'Task 3: Connect Piezo Buzzer to Transistor Collector',
      desc:
        lang === 'hi'
          ? 'किचन के बज़र का नेगेटिव तार ट्रांजिस्टर के Collector पिन से जोड़ो ताकि स्विच बंद होने पर सायरन बज सके।'
          : 'Wire the Piezo Buzzer (-) lead to the Collector of the transistor to complete the alarm circuit loop.',
      doneNote: lang === 'hi' ? '🎉 कमाल कर दिया! पूरा अलार्म सर्किट तैयार हो गया!' : '🎉 Incredible! The entire alarm circuit is fully wired!',
    },
  ];

  // Celebration handler
  const handleCompleteMastery = () => {
    soundFX.playVictory();
    NativeBridge.haptic('success');
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00e5ff', '#ff007f', '#00e676', '#ffb400'],
    });
  };

  const handleCompleteChallengeTask = (taskId: number) => {
    if (completedChallengeSteps.includes(taskId)) return;
    soundFX.playConnect();
    NativeBridge.haptic('medium');
    const updated = [...completedChallengeSteps, taskId];
    setCompletedChallengeSteps(updated);

    if (updated.length === challengeTasks.length) {
      setTimeout(() => {
        handleCompleteMastery();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-slate-950">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block leading-none">
                {t.storyModeTitle}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight mt-0.5 truncate max-w-[260px] sm:max-w-md">
                {loc.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Nav Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/80 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('story');
            }}
            className={`py-2 px-3.5 rounded-t-xl font-bold transition flex items-center gap-1.5 border-t border-x ${
              activeTab === 'story'
                ? 'bg-slate-900 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.storyFlowBtn}</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('cutaway');
            }}
            className={`py-2 px-3.5 rounded-t-xl font-bold transition flex items-center gap-1.5 border-t border-x ${
              activeTab === 'cutaway'
                ? 'bg-slate-900 text-amber-300 border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.realCutawayBtn}</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('challenge');
            }}
            className={`py-2 px-3.5 rounded-t-xl font-bold transition flex items-center gap-1.5 border-t border-x ${
              activeTab === 'challenge'
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.diyChallengeBtn}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {/* ================================================================ */}
          {/* TAB 1: 3-STEP STORY FLOW                                         */}
          {/* ================================================================ */}
          {activeTab === 'story' && (
            <div className="space-y-5">
              {/* Step Progress Pills */}
              <div className="flex items-center justify-between gap-2">
                {[1, 2, 3].map((stepNum) => {
                  const isActive = currentStep === stepNum;
                  const isDone = currentStep > stepNum;
                  return (
                    <button
                      key={stepNum}
                      onClick={() => {
                        soundFX.playClick(1.2);
                        setCurrentStep(stepNum);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                          : isDone
                          ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900/40 border-white/5 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-cyan-400 text-slate-950'
                            : isDone
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {stepNum}
                        </span>
                        <span className="text-xs font-mono font-bold">
                          {t.stepWord} {stepNum}
                        </span>
                      </div>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Step Content Card */}
              {(() => {
                const stepData = storySteps[currentStep - 1];
                const IconComponent = stepData.icon;
                return (
                  <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold tracking-wider uppercase">
                          {stepData.badge}
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-white mt-1.5 leading-snug">
                          {stepData.title}
                        </h4>
                        <p className="text-xs text-cyan-400 font-mono mt-0.5">
                          {stepData.subtitle}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                        <IconComponent className="w-6 h-6 animate-pulse" />
                      </div>
                    </div>

                    {/* Layman Analogy Section */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                      <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.analogyTitle}</span>
                      </span>
                      <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-sans">
                        {stepData.analogy}
                      </p>
                    </div>

                    {/* Engineering Science Section */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-1 font-mono">
                      <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.scienceTitle}</span>
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {stepData.science}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  disabled={currentStep === 1}
                  onClick={() => {
                    soundFX.playClick();
                    setCurrentStep((prev) => Math.max(1, prev - 1));
                  }}
                  className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition ${
                    currentStep === 1
                      ? 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t.prevStepBtn}</span>
                </button>

                {currentStep < 3 ? (
                  <button
                    onClick={() => {
                      soundFX.playClick(1.3);
                      setCurrentStep((prev) => Math.min(3, prev + 1));
                    }}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 font-mono text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition"
                  >
                    <span>{t.nextStepBtn}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteMastery}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-mono text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition animate-bounce"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.iUnderstoodBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: REAL-WORLD CUTAWAY & SIMULATOR                            */}
          {/* ================================================================ */}
          {activeTab === 'cutaway' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 font-sans">
                {lang === 'hi'
                  ? 'नीचे दिए गए रियल कट-अवे में सीधे बटन्स व कंट्रोल्स से इंटरैक्ट करके असली दुनिया का इफ़ेक्ट देखें:'
                  : 'Interact directly with real-world controls below to observe live physical behavior in action:'}
              </p>
              <RealWorldCutawayView
                experiment={experiment}
                sliderValue={sliderValue}
                onSliderChange={onSliderChange}
                compact={false}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: DIY GHOST WIRE CHALLENGE                                  */}
          {/* ================================================================ */}
          {activeTab === 'challenge' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    {lang === 'hi' ? 'वायरिंग चैलेंज' : 'WIRING CHALLENGE'}
                  </span>
                  <h4 className="text-sm font-extrabold text-white">
                    {lang === 'hi' ? '3 तारों को खुद जोड़कर अलार्म चालू करो!' : 'Wire 3 Core Connections to Complete the Circuit!'}
                  </h4>
                </div>
                <div className="text-right font-mono text-xs font-bold text-emerald-400">
                  {completedChallengeSteps.length} / {challengeTasks.length} Done
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-2.5">
                {challengeTasks.map((task) => {
                  const isDone = completedChallengeSteps.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-900/80 border-white/10 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isDone ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {task.id}
                            </span>
                            <h5 className="text-xs sm:text-sm font-bold text-white">
                              {task.title}
                            </h5>
                          </div>
                          <p className="text-xs text-slate-300 pl-7">
                            {isDone ? task.doneNote : task.desc}
                          </p>
                        </div>

                        <button
                          onClick={() => handleCompleteChallengeTask(task.id)}
                          disabled={isDone}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 shadow-md shadow-cyan-500/20'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Done</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-slate-950" />
                              <span>{lang === 'hi' ? 'तार जोड़ें' : 'Connect'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {completedChallengeSteps.length === challengeTasks.length && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/50 text-center space-y-2 animate-in zoom-in-95">
                  <div className="text-2xl">🏆</div>
                  <h4 className="text-sm font-black text-white">
                    {lang === 'hi' ? 'बधाई हो! आपने वाटर अलार्म बनाना सीख लिया!' : 'Congratulations! You Mastered the Water Tank Alarm!'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {lang === 'hi' ? 'अब आप इस सर्किट को असली ब्रेडबोर्ड पर भी बना सकते हैं।' : 'You are now ready to build this real circuit on a physical breadboard.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
