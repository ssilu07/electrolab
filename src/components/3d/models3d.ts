import * as THREE from 'three';
import { CircuitComponent, CircuitWire, SimulationResult } from '../../types/circuit';
import { getComponentPins } from '../../engine/ComponentRegistry';

// Resistor IEC color map
const BAND_COLORS: number[] = [
  0x111827, // 0 Black
  0x78350f, // 1 Brown
  0xdc2626, // 2 Red
  0xea580c, // 3 Orange
  0xeab308, // 4 Yellow
  0x16a34a, // 5 Green
  0x2563eb, // 6 Blue
  0x9333ea, // 7 Violet
  0x64748b, // 8 Gray
  0xf8fafc, // 9 White
];

export function getResistorColorBands(resistance: number = 330): number[] {
  if (resistance <= 0) return [0x111827, 0x111827, 0x111827, 0xd97706];
  const rStr = Math.round(resistance).toString();
  let d1 = parseInt(rStr[0], 10) || 1;
  let d2 = parseInt(rStr[1] ?? '0', 10);
  let mult = Math.max(0, rStr.length - 2);

  const c1 = BAND_COLORS[Math.min(9, Math.max(0, d1))];
  const c2 = BAND_COLORS[Math.min(9, Math.max(0, d2))];
  const c3 = BAND_COLORS[Math.min(9, Math.max(0, mult))];
  const c4 = 0xd97706; // 5% Gold tolerance

  return [c1, c2, c3, c4];
}

/**
 * Creates 3D procedural mesh for a component
 */
export function buildComponent3D(
  comp: CircuitComponent,
  sim: SimulationResult,
  isSelected: boolean
): THREE.Group {
  const group = new THREE.Group();
  group.name = `comp_${comp.id}`;
  group.position.set(comp.x, 0, comp.y);
  group.rotation.y = -(comp.rotation * Math.PI) / 180;

  const isBlown = comp.properties.isBlown || sim.blownComponents.has(comp.id);
  const current = sim.branchCurrents.get(comp.id) ?? 0;

  // Selection outline / ring on table surface
  if (isSelected) {
    const ringGeo = new THREE.RingGeometry(1.8, 2.1, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.04;
    group.add(ringMesh);
  }

  // Common shared materials
  const leadMetalMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.9,
    roughness: 0.2,
  });

  const charredMat = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    roughness: 0.9,
    metalness: 0.1,
  });

  switch (comp.type) {
    case 'battery': {
      // 9V Battery Model
      const bodyMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.5,
            roughness: 0.35,
          });
      const bodyGeo = new THREE.BoxGeometry(2.8, 1.4, 1.6);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      body.castShadow = true;
      group.add(body);

      // Gold label stripe
      if (!isBlown) {
        const stripeGeo = new THREE.BoxGeometry(2.82, 0.45, 1.62);
        const stripeMat = new THREE.MeshStandardMaterial({
          color: 0xeab308,
          metalness: 0.7,
          roughness: 0.3,
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.7;
        group.add(stripe);
      }

      // Snap terminals (+ hexagonal, - circular)
      const termHexGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.35, 6);
      const termHex = new THREE.Mesh(termHexGeo, leadMetalMat);
      termHex.position.set(0.7, 1.55, 0);
      group.add(termHex);

      const termCupGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
      const termCup = new THREE.Mesh(termCupGeo, leadMetalMat);
      termCup.position.set(-0.7, 1.55, 0);
      group.add(termCup);

      // Lead pins entering table holes
      const pin1 = createLeadPin(-2, 0);
      const pin2 = createLeadPin(2, 0);
      group.add(pin1, pin2);
      break;
    }

    case 'ac_source': {
      // Bench Generator Box
      const benchMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.4,
            roughness: 0.4,
          });
      const benchGeo = new THREE.BoxGeometry(3.2, 1.6, 2.0);
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.y = 0.8;
      bench.castShadow = true;
      group.add(bench);

      // Glowing LCD Screen
      const screenGeo = new THREE.PlaneGeometry(1.6, 0.8);
      screenGeo.rotateX(-Math.PI / 8); // angled screen
      const screenMat = new THREE.MeshBasicMaterial({
        color: isBlown ? 0x050505 : 0x064e3b,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 1.0, 1.02);
      group.add(screen);

      // Sine curve trace on screen
      if (!isBlown) {
        const wavePts: THREE.Vector3[] = [];
        for (let i = -0.7; i <= 0.7; i += 0.05) {
          wavePts.push(new THREE.Vector3(i, 0.95 + Math.sin(i * 12) * 0.2, 1.05));
        }
        const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePts);
        const waveMat = new THREE.LineBasicMaterial({ color: 0x34d399 });
        const waveLine = new THREE.Line(waveGeo, waveMat);
        group.add(waveLine);
      }

      // Terminals
      const tPos = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      tPos.position.set(0.9, 0.45, 1.05);
      tPos.rotateX(Math.PI / 2);
      const tNeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      tNeg.position.set(-0.9, 0.45, 1.05);
      tNeg.rotateX(Math.PI / 2);
      group.add(tPos, tNeg);

      group.add(createLeadPin(-2, 0), createLeadPin(2, 0));
      break;
    }

    case 'resistor': {
      // 1/4W Ceramic Resistor Body
      const bands = getResistorColorBands(comp.properties.resistance);
      const bodyColor = isBlown ? 0x222222 : 0xd6c29a; // warm ceramic beige
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.6,
        metalness: 0.1,
      });

      const bodyGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.6, 16);
      bodyGeo.rotateZ(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.4;
      body.castShadow = true;
      group.add(body);

      // Resistor Color Bands
      if (!isBlown) {
        const bandPositions = [-0.5, -0.2, 0.1, 0.5];
        bandPositions.forEach((posX, idx) => {
          const bGeo = new THREE.CylinderGeometry(0.375, 0.375, 0.12, 16);
          bGeo.rotateZ(Math.PI / 2);
          const bMat = new THREE.MeshStandardMaterial({
            color: bands[idx],
            roughness: 0.4,
            metalness: idx === 3 ? 0.8 : 0.1,
          });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set(posX, 0.4, 0);
          group.add(bMesh);
        });
      }

      // Leads: Silver wire extending out left and right then bent down to pin positions
      const leadLeft = createBentLead([-0.8, 0.4, 0], [-2, 0.4, 0], [-2, 0.05, 0]);
      const leadRight = createBentLead([0.8, 0.4, 0], [2, 0.4, 0], [2, 0.05, 0]);
      group.add(leadLeft, leadRight);
      break;
    }

    case 'potentiometer': {
      // Trimpot / Rotary Potentiometer
      const potBaseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.6, 24);
      const potBaseMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
      const potBase = new THREE.Mesh(potBaseGeo, potBaseMat);
      potBase.position.y = 0.3;
      group.add(potBase);

      // Top rotating knob
      const knobGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 24);
      const knobMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.8,
        roughness: 0.2,
      });
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.position.y = 0.75;

      // Pointer notch on knob reflecting sliderValue (0..1 -> -135deg to +135deg)
      const val = comp.properties.sliderValue ?? 0.5;
      knob.rotation.y = -Math.PI * 0.75 + val * Math.PI * 1.5;

      const notchGeo = new THREE.BoxGeometry(0.1, 0.05, 0.55);
      const notchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(0, 0.26, 0.2);
      knob.add(notch);

      group.add(knob);
      group.add(createLeadPin(-2, -1), createLeadPin(0, 1), createLeadPin(2, -1));
      break;
    }

    case 'capacitor': {
      // Electrolytic Aluminum Can
      const canMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({
            color: 0x1e3a8a, // dark electrolytic blue
            roughness: 0.3,
            metalness: 0.4,
          });
      const canGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 20);
      const can = new THREE.Mesh(canGeo, canMat);
      can.position.y = 0.75;
      can.castShadow = true;
      group.add(can);

      // Aluminum top scored vent
      const topGeo = new THREE.CylinderGeometry(0.53, 0.53, 0.05, 20);
      const topMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.2 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 1.47;
      group.add(top);

      // Negative stripe down side
      if (!isBlown) {
        const stripeGeo = new THREE.PlaneGeometry(0.2, 1.35);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(-0.555, 0.75, 0);
        stripe.rotateY(-Math.PI / 2);
        group.add(stripe);
      }

      group.add(createLeadPin(-1, 0), createLeadPin(1, 0));
      break;
    }

    case 'inductor': {
      // Toroidal copper wound inductor
      const coreGeo = new THREE.TorusGeometry(0.65, 0.25, 16, 32);
      coreGeo.rotateX(Math.PI / 2);
      const coreMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({
            color: 0xb45309, // shiny enameled copper
            metalness: 0.85,
            roughness: 0.25,
          });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0.45;
      group.add(core);

      group.add(createLeadPin(-2, 0), createLeadPin(2, 0));
      break;
    }

    case 'led': {
      // 5mm Diffused / Glossy Dome LED
      const colorKey = comp.properties.color || 'red';
      const colorHexMap: Record<string, number> = {
        red: 0xef4444,
        green: 0x22c55e,
        blue: 0x3b82f6,
        yellow: 0xeab308,
        amber: 0xf97316,
      };
      const baseHex = colorHexMap[colorKey] || 0xef4444;

      // Current flow determines brightness & glow!
      const isLit = !isBlown && Math.abs(current) > 0.001;
      const intensity = Math.min(2.5, Math.abs(current) * 80);

      const ledMat = isBlown
        ? charredMat
        : new THREE.MeshPhysicalMaterial({
            color: baseHex,
            emissive: isLit ? baseHex : 0x000000,
            emissiveIntensity: isLit ? 1.2 * intensity : 0,
            transparent: true,
            opacity: 0.85,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.3,
          });

      // Cylindrical base + hemispherical dome
      const cylGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.7, 24);
      const cyl = new THREE.Mesh(cylGeo, ledMat);
      cyl.position.y = 0.55;
      cyl.castShadow = true;
      group.add(cyl);

      const domeGeo = new THREE.SphereGeometry(0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, ledMat);
      dome.position.y = 0.9;
      group.add(dome);

      // Flange rim at bottom
      const rimGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.1, 24);
      const rim = new THREE.Mesh(rimGeo, ledMat);
      rim.position.y = 0.22;
      group.add(rim);

      // Real 3D PointLight emission in the 3D scene!
      if (isLit) {
        const ledLight = new THREE.PointLight(baseHex, 1.5 * intensity, 6);
        ledLight.position.set(0, 1.1, 0);
        group.add(ledLight);
      }

      group.add(createLeadPin(-1, 0), createLeadPin(1, 0));
      break;
    }

    case 'diode': {
      // 1N4007 Black Cylinder with Silver Cathode Band
      const dMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
      const dGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.3, 16);
      dGeo.rotateZ(Math.PI / 2);
      const dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.y = 0.35;
      group.add(dMesh);

      // Silver band (Cathode)
      if (!isBlown) {
        const bandGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.2, 16);
        bandGeo.rotateZ(Math.PI / 2);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.set(0.4, 0.35, 0);
        group.add(band);
      }

      group.add(createBentLead([-0.65, 0.35, 0], [-1.5, 0.35, 0], [-1.5, 0.05, 0]));
      group.add(createBentLead([0.65, 0.35, 0], [1.5, 0.35, 0], [1.5, 0.05, 0]));
      break;
    }

    case 'switch': {
      // Miniature Toggle Switch with animated lever
      const boxGeo = new THREE.BoxGeometry(1.2, 0.6, 0.9);
      const boxMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.3 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 0.3;
      group.add(box);

      // Threaded metallic collar
      const collarGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
      const collar = new THREE.Mesh(collarGeo, leadMetalMat);
      collar.position.y = 0.7;
      group.add(collar);

      // Flippable lever: tilts forward if closed (ON) or backward if open (OFF)
      const isClosed = comp.properties.closed ?? false;
      const leverGroup = new THREE.Group();
      leverGroup.position.set(0, 0.8, 0);
      leverGroup.rotation.z = isClosed ? -0.45 : 0.45; // Animated tilt!

      const leverGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.0, 16);
      leverGeo.translate(0, 0.5, 0);
      const lever = new THREE.Mesh(leverGeo, leadMetalMat);
      leverGroup.add(lever);

      // Shiny red / chrome tip
      const tipGeo = new THREE.SphereGeometry(0.2, 16, 16);
      tipGeo.translate(0, 1.0, 0);
      const tipMat = new THREE.MeshStandardMaterial({
        color: isClosed ? 0x10b981 : 0xef4444,
        metalness: 0.6,
        roughness: 0.2,
      });
      leverGroup.add(new THREE.Mesh(tipGeo, tipMat));

      group.add(leverGroup);
      group.add(createLeadPin(-1, 0), createLeadPin(1, 0));
      break;
    }

    case 'pushbutton': {
      // Tactile Micro Switch
      const baseGeo = new THREE.BoxGeometry(1.1, 0.4, 1.1);
      const baseMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.2;
      group.add(base);

      // Plunger button (depresses when pressed)
      const isPressed = comp.properties.closed ?? false;
      const plungerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.35, 16);
      const plungerMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
      });
      const plunger = new THREE.Mesh(plungerGeo, plungerMat);
      plunger.position.y = isPressed ? 0.38 : 0.48; // moves down when clicked!
      group.add(plunger);

      group.add(createLeadPin(-1, 0), createLeadPin(1, 0));
      break;
    }

    case 'relay': {
      // Sugar Cube Polycarbonate Relay
      const relayGeo = new THREE.BoxGeometry(2.4, 1.4, 1.6);
      const relayMat = isBlown
        ? charredMat
        : new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            transmission: 0.6,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85,
          });
      const relayMesh = new THREE.Mesh(relayGeo, relayMat);
      relayMesh.position.y = 0.7;
      group.add(relayMesh);

      // Internal electromagnetic copper coil
      const coilGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
      coilGeo.rotateZ(Math.PI / 2);
      const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8 });
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.position.set(0, 0.6, 0);
      group.add(coil);

      group.add(
        createLeadPin(-2, -1),
        createLeadPin(-2, 1),
        createLeadPin(2, -1),
        createLeadPin(2, 0),
        createLeadPin(2, 1)
      );
      break;
    }

    case 'ldr': {
      // Light Dependent Resistor (Cadmium Sulfide sensor)
      const discGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 24);
      const discMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.y = 0.3;
      group.add(disc);

      // Red serpentine track on face
      const trackGeo = new THREE.RingGeometry(0.2, 0.5, 16);
      trackGeo.rotateX(-Math.PI / 2);
      const trackMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.position.y = 0.41;
      group.add(track);

      group.add(createLeadPin(-1, 0), createLeadPin(1, 0));
      break;
    }

    case 'transistor_npn': {
      // TO-92 Half-Cylinder Package
      const tGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.9, 16, 1, false, 0, Math.PI);
      const tMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
      const tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.y = 0.55;
      group.add(tMesh);

      // Flat front face
      const faceGeo = new THREE.PlaneGeometry(0.8, 0.9);
      const face = new THREE.Mesh(faceGeo, tMat);
      face.position.set(0, 0.55, 0);
      group.add(face);

      group.add(createLeadPin(-1, -1), createLeadPin(0, 1), createLeadPin(1, -1));
      break;
    }

    case 'buzzer': {
      // Piezo Sounder Cylinder
      const bGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 24);
      const bMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.y = 0.35;
      group.add(bMesh);

      // Center sound hole
      const holeGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.y = 0.71;
      group.add(hole);

      // Sound pulsation rings when buzzer active
      if (sim.buzzerActive && !isBlown) {
        const ringGeo = new THREE.RingGeometry(0.35, 0.55, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.7,
        });
        const soundWave = new THREE.Mesh(ringGeo, ringMat);
        soundWave.position.y = 0.85;
        group.add(soundWave);
      }

      group.add(createLeadPin(-1, 0), createLeadPin(1, 0));
      break;
    }

    case 'timer_555':
    case 'gate_and':
    case 'gate_or':
    case 'gate_not':
    case 'gate_xor': {
      // Real DIP IC Chip (DIP-8 / DIP-14)
      const icLength = comp.type === 'timer_555' ? 2.6 : 3.6;
      const icGeo = new THREE.BoxGeometry(icLength, 0.5, 1.3);
      const icMat = isBlown
        ? charredMat
        : new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
      const icMesh = new THREE.Mesh(icGeo, icMat);
      icMesh.position.y = 0.35;
      icMesh.castShadow = true;
      group.add(icMesh);

      // Pin 1 orientation notch at one end
      const notchGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.52, 16, 1, false, 0, Math.PI);
      notchGeo.rotateZ(Math.PI / 2);
      const notch = new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: 0x09090b }));
      notch.position.set(-icLength / 2, 0.35, 0);
      group.add(notch);

      // Pin 1 dot
      const dotGeo = new THREE.CircleGeometry(0.08, 12);
      dotGeo.rotateX(-Math.PI / 2);
      const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
      dot.position.set(-icLength / 2 + 0.35, 0.61, 0.4);
      group.add(dot);

      // Silkscreen text chip label
      const labelText =
        comp.type === 'timer_555'
          ? 'NE555'
          : comp.type === 'gate_and'
          ? '74HC08'
          : comp.type === 'gate_or'
          ? '74HC32'
          : comp.type === 'gate_not'
          ? '74HC04'
          : '74HC86';

      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, 128, 48);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 64, 24);
      }
      const labelTex = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
      const labelGeo = new THREE.PlaneGeometry(1.4, 0.5);
      labelGeo.rotateX(-Math.PI / 2);
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.set(0, 0.61, 0);
      group.add(labelMesh);

      // Add pins from registry
      const pins = getComponentPins(comp);
      pins.forEach((p) => {
        const rx = p.x - comp.x;
        const ry = p.y - comp.y;
        group.add(createLeadPin(rx, ry));
      });
      break;
    }

    case 'ground': {
      // Chassis Ground Stake
      const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 16);
      const post = new THREE.Mesh(postGeo, leadMetalMat);
      post.position.y = 0.4;
      group.add(post);

      // Horizontal ground bars
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
      bar1.position.y = 0.45;
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
      bar2.position.y = 0.32;
      const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
      bar3.position.y = 0.19;
      group.add(bar1, bar2, bar3);

      group.add(createLeadPin(0, 0));
      break;
    }

    default:
      break;
  }

  // 3D Explosion sparks & smoke puff if blown!
  if (isBlown) {
    const puffCount = 12;
    const puffGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0x374151,
      transparent: true,
      opacity: 0.6,
    });
    for (let i = 0; i < puffCount; i++) {
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(
        (Math.random() - 0.5) * 1.5,
        0.5 + Math.random() * 1.8,
        (Math.random() - 0.5) * 1.5
      );
      group.add(puff);
    }
  }

  return group;
}

/**
 * Creates a metal through-hole lead pin inserting into the breadboard/PCB
 */
function createLeadPin(offsetX: number, offsetZ: number): THREE.Mesh {
  const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // gold/silver contact pin
    metalness: 0.9,
    roughness: 0.2,
  });
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.position.set(offsetX, 0.15, offsetZ);
  return pin;
}

/**
 * Helper to build bent resistor/diode wire leads
 */
function createBentLead(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
): THREE.Mesh {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  const line1 = new THREE.LineCurve3(new THREE.Vector3(...p1), new THREE.Vector3(...p2));
  const line2 = new THREE.LineCurve3(new THREE.Vector3(...p2), new THREE.Vector3(...p3));
  curve.add(line1);
  curve.add(line2);

  const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.035, 6, false);
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
  return new THREE.Mesh(tubeGeo, tubeMat);
}

/**
 * Builds a 3D curved silicone jumper wire between two pin coordinates
 */
export function buildWire3D(
  wire: CircuitWire,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  sim: SimulationResult
): { tube: THREE.Mesh; pulseGroup: THREE.Group } {
  const current = sim.branchCurrents.get(wire.id) ?? wire.current ?? 0;
  const isOverheating = wire.isOverheating || sim.hasShortCircuit && Math.abs(current) > 1.5;

  // 3D coordinates
  const pStart = new THREE.Vector3(fromPos.x, 0.1, fromPos.y);
  const pEnd = new THREE.Vector3(toPos.x, 0.1, toPos.y);
  const dist = pStart.distanceTo(pEnd);

  // Natural catenary / parabolic arch height in 3D
  const archHeight = Math.min(3.5, 0.6 + dist * 0.25);
  const pMid = new THREE.Vector3(
    (pStart.x + pEnd.x) / 2,
    archHeight,
    (pStart.z + pEnd.z) / 2
  );

  const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.08, 8, false);

  // Wire color & material
  const wireColor = isOverheating ? 0xff3b30 : parseInt(wire.color.replace('#', '0x'), 16) || 0x3b82f6;
  const wireMat = new THREE.MeshStandardMaterial({
    color: wireColor,
    roughness: 0.35,
    metalness: 0.15,
    emissive: isOverheating ? 0xff2200 : 0x000000,
    emissiveIntensity: isOverheating ? 0.9 : 0,
  });

  const tube = new THREE.Mesh(tubeGeo, wireMat);
  tube.name = `wire_${wire.id}`;
  tube.castShadow = true;

  // Flowing glowing electrical charge pulses in 3D!
  const pulseGroup = new THREE.Group();
  pulseGroup.name = `wire_pulse_${wire.id}`;

  if (Math.abs(current) > 0.0001) {
    const pulseGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.9,
    });

    // 2 pulse sprites travelling along the wire curve
    const pulseCount = Math.max(1, Math.min(4, Math.floor(dist / 3)));
    for (let i = 0; i < pulseCount; i++) {
      const pMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pMesh.userData = {
        progress: (i / pulseCount),
        speed: Math.sign(current) * Math.max(0.2, Math.min(2.0, Math.abs(current) * 2.5)),
        curve,
      };
      const pt = curve.getPoint(pMesh.userData.progress);
      pMesh.position.copy(pt);
      pulseGroup.add(pMesh);
    }
  }

  return { tube, pulseGroup };
}
