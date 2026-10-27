import {
  CircuitComponent,
  CircuitWire,
  SimulationResult,
} from '../types/circuit';
import { getComponentPins } from './ComponentRegistry';

/**
 * Union-Find Disjoint Set Union data structure for pin node clustering
 */
class UnionFind {
  private parent: Map<string, string> = new Map();

  find(i: string): string {
    if (!this.parent.has(i)) {
      this.parent.set(i, i);
      return i;
    }
    const p = this.parent.get(i)!;
    if (p === i) return i;
    const root = this.find(p);
    this.parent.set(i, root);
    return root;
  }

  union(i: string, j: string): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ);
    }
  }
}

/**
 * Solves dense linear system A * x = b via Gaussian Elimination with partial pivoting
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  if (n === 0) return [];

  const M: number[][] = new Array(n);
  for (let i = 0; i < n; i++) {
    M[i] = new Array(n + 1);
    for (let j = 0; j < n; j++) {
      M[i][j] = A[i][j];
    }
    M[i][n] = b[i];
  }

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) {
      M[col][col] += 1e-9;
    } else if (maxRow !== col) {
      const temp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = temp;
    }

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = M[row][col] / M[col][col];
        if (Math.abs(factor) > 1e-15) {
          for (let k = col; k <= n; k++) {
            M[row][k] -= factor * M[col][k];
          }
        }
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (Math.abs(M[i][i]) > 1e-12) {
      x[i] = M[i][n] / M[i][i];
    } else {
      x[i] = 0;
    }
    if (!Number.isFinite(x[i])) {
      x[i] = 0;
    }
  }

  return x;
}

export interface SolverOptions {
  dt?: number; // Timestep in seconds (e.g. 0.001)
  subSteps?: number; // Number of sub-steps per frame
  willItBlow?: boolean; // Enable catastrophic failure
  oscilloscopeProbePinId?: string | null;
  oscilloscopeGroundPinId?: string | null;
}

export class MnaCircuitSolver {
  private simTime: number = 0;
  private capacitorVoltages: Map<string, number> = new Map();
  private inductorCurrents: Map<string, number> = new Map();
  private timerStates: Map<string, { latch: boolean }> = new Map();
  private blownComponents: Set<string> = new Set();
  private blownReasons: Map<string, string> = new Map();

  public reset(): void {
    this.simTime = 0;
    this.capacitorVoltages.clear();
    this.inductorCurrents.clear();
    this.timerStates.clear();
    this.blownComponents.clear();
    this.blownReasons.clear();
  }

  public step(
    components: CircuitComponent[],
    wires: CircuitWire[],
    options: SolverOptions = {}
  ): SimulationResult {
    const dt = options.dt ?? 0.001; // 1ms default sub-step
    const subSteps = options.subSteps ?? 10;
    const willItBlow = options.willItBlow ?? true;

    let latestResult: SimulationResult = {
      nodeVoltages: new Map(),
      pinToNode: new Map(),
      pinVoltages: new Map(),
      branchCurrents: new Map(),
      componentPower: new Map(),
      blownComponents: new Set(this.blownComponents),
      oscilloscopeVoltage: 0,
      buzzerActive: false,
      buzzerFreq: 0,
      buzzerVolume: 0,
      hasShortCircuit: false,
      totalCurrent: 0,
      totalPower: 0,
      activeNodeCount: 0,
      simTime: this.simTime,
    };

    for (let step = 0; step < subSteps; step++) {
      latestResult = this.solveSingleStep(components, wires, dt, willItBlow, options);
      this.simTime += dt;
      latestResult.simTime = this.simTime;
    }

    return latestResult;
  }

  private solveSingleStep(
    components: CircuitComponent[],
    wires: CircuitWire[],
    dt: number,
    willItBlow: boolean,
    options: SolverOptions
  ): SimulationResult {
    // 1. Gather all pins
    const allPins: { id: string; comp: CircuitComponent }[] = [];
    const compMap = new Map<string, CircuitComponent>();
    for (const comp of components) {
      compMap.set(comp.id, comp);
      const pins = getComponentPins(comp);
      for (const p of pins) {
        allPins.push({ id: p.id, comp });
      }
    }

    // 2. Identify nodes via Union-Find
    const uf = new UnionFind();
    for (const p of allPins) {
      uf.find(p.id);
    }
    for (const w of wires) {
      uf.union(w.fromPinId, w.toPinId);
    }

    // Determine Ground node:
    let groundRoot: string | null = null;
    for (const comp of components) {
      if (comp.type === 'ground') {
        const pins = getComponentPins(comp);
        if (pins.length > 0) {
          groundRoot = uf.find(pins[0].id);
          break;
        }
      }
    }
    if (!groundRoot) {
      for (const comp of components) {
        if (comp.type === 'battery' || comp.type === 'ac_source') {
          groundRoot = uf.find(`${comp.id}:neg`);
          break;
        }
      }
    }

    const rootToNode = new Map<string, number>();
    if (groundRoot) {
      rootToNode.set(groundRoot, 0);
    }

    let nextNodeIdx = groundRoot ? 1 : 0;
    for (const p of allPins) {
      const root = uf.find(p.id);
      if (!rootToNode.has(root)) {
        rootToNode.set(root, nextNodeIdx++);
      }
    }

    const totalNodes = nextNodeIdx;
    const pinToNode = new Map<string, number>();
    for (const p of allPins) {
      pinToNode.set(p.id, rootToNode.get(uf.find(p.id)) ?? 0);
    }

    const startNode = (groundRoot || totalNodes > 1) ? 1 : 0;
    const solveNodeCount = Math.max(0, totalNodes - startNode);

    // Identify Voltage sources to include in MNA
    interface VoltageSourceBranch {
      id: string;
      nodePlus: number;
      nodeMinus: number;
      voltage: number;
      internalR: number;
    }

    const vSources: VoltageSourceBranch[] = [];

    for (const comp of components) {
      if (this.blownComponents.has(comp.id)) continue;

      if (comp.type === 'battery') {
        const nPlus = pinToNode.get(`${comp.id}:pos`) ?? 0;
        const nMinus = pinToNode.get(`${comp.id}:neg`) ?? 0;
        vSources.push({
          id: comp.id,
          nodePlus: nPlus,
          nodeMinus: nMinus,
          voltage: comp.properties.voltage ?? 9.0,
          internalR: 0.1,
        });
      } else if (comp.type === 'ac_source') {
        const nPlus = pinToNode.get(`${comp.id}:pos`) ?? 0;
        const nMinus = pinToNode.get(`${comp.id}:neg`) ?? 0;
        const freq = comp.properties.frequency ?? 60.0;
        const vPeak = comp.properties.voltage ?? 5.0;
        const wave = comp.properties.waveType ?? 'sine';
        let vInst = 0;

        const phase = (this.simTime * freq) % 1.0;
        if (wave === 'sine') {
          vInst = vPeak * Math.sin(2 * Math.PI * this.simTime * freq);
        } else if (wave === 'square') {
          vInst = phase < 0.5 ? vPeak : -vPeak;
        } else if (wave === 'triangle') {
          vInst = phase < 0.5 ? vPeak * (4 * phase - 1) : vPeak * (3 - 4 * phase);
        }

        vSources.push({
          id: comp.id,
          nodePlus: nPlus,
          nodeMinus: nMinus,
          voltage: vInst,
          internalR: 1.0,
        });
      }
    }

    const numEq = solveNodeCount + vSources.length;
    const A: number[][] = Array.from({ length: numEq }, () => new Array(numEq).fill(0));
    const b: number[] = new Array(numEq).fill(0);

    const getNodeIdx = (n: number) => n - startNode;

    const stampConductance = (nodeA: number, nodeB: number, g: number) => {
      if (!Number.isFinite(g) || g <= 0) return;
      const idxA = getNodeIdx(nodeA);
      const idxB = getNodeIdx(nodeB);

      if (nodeA >= startNode && idxA < solveNodeCount) {
        A[idxA][idxA] += g;
        if (nodeB >= startNode && idxB < solveNodeCount) {
          A[idxA][idxB] -= g;
        }
      }
      if (nodeB >= startNode && idxB < solveNodeCount) {
        A[idxB][idxB] += g;
        if (nodeA >= startNode && idxA < solveNodeCount) {
          A[idxB][idxA] -= g;
        }
      }
    };

    const stampCurrentSource = (fromNode: number, toNode: number, I: number) => {
      const idxFrom = getNodeIdx(fromNode);
      const idxTo = getNodeIdx(toNode);
      if (fromNode >= startNode && idxFrom < solveNodeCount) {
        b[idxFrom] -= I;
      }
      if (toNode >= startNode && idxTo < solveNodeCount) {
        b[idxTo] += I;
      }
    };

    // Stamp passive & nonlinear components
    for (const comp of components) {
      if (this.blownComponents.has(comp.id)) continue;

      switch (comp.type) {
        case 'resistor': {
          const n1 = pinToNode.get(`${comp.id}:p1`) ?? 0;
          const n2 = pinToNode.get(`${comp.id}:p2`) ?? 0;
          const r = Math.max(0.1, comp.properties.resistance ?? 330);
          stampConductance(n1, n2, 1 / r);
          break;
        }

        case 'potentiometer': {
          const nA = pinToNode.get(`${comp.id}:a`) ?? 0;
          const nW = pinToNode.get(`${comp.id}:w`) ?? 0;
          const nB = pinToNode.get(`${comp.id}:b`) ?? 0;
          const totalR = Math.max(10, comp.properties.resistance ?? 10000);
          const slider = Math.min(0.999, Math.max(0.001, comp.properties.sliderValue ?? 0.5));
          const r1 = Math.max(0.1, totalR * slider);
          const r2 = Math.max(0.1, totalR * (1 - slider));
          stampConductance(nA, nW, 1 / r1);
          stampConductance(nW, nB, 1 / r2);
          break;
        }

        case 'ldr': {
          const n1 = pinToNode.get(`${comp.id}:p1`) ?? 0;
          const n2 = pinToNode.get(`${comp.id}:p2`) ?? 0;
          const light = Math.min(1, Math.max(0, comp.properties.sliderValue ?? 0.5));
          const r = 100 * Math.pow(10000, 1 - light);
          stampConductance(n1, n2, 1 / r);
          break;
        }

        case 'switch':
        case 'pushbutton': {
          const n1 = pinToNode.get(`${comp.id}:p1`) ?? 0;
          const n2 = pinToNode.get(`${comp.id}:p2`) ?? 0;
          const isClosed = comp.properties.closed ?? false;
          const r = isClosed ? 0.001 : 1e8;
          stampConductance(n1, n2, 1 / r);
          break;
        }

        case 'relay': {
          // Coil pins
          const nC1 = pinToNode.get(`${comp.id}:coil1`) ?? 0;
          const nC2 = pinToNode.get(`${comp.id}:coil2`) ?? 0;
          stampConductance(nC1, nC2, 1 / 100); // 100 Ohm coil

          const vCoilPrev = Math.abs(this.capacitorVoltages.get(`${comp.id}:vcoil`) ?? 0);
          const isEnergized = vCoilPrev >= 3.0; // 3V pull-in threshold
          comp.properties.relayEnergized = isEnergized;

          const nCom = pinToNode.get(`${comp.id}:com`) ?? 0;
          const nNo = pinToNode.get(`${comp.id}:no`) ?? 0;
          const nNc = pinToNode.get(`${comp.id}:nc`) ?? 0;

          if (isEnergized) {
            stampConductance(nCom, nNo, 1 / 0.001); // COM-NO closed
            stampConductance(nCom, nNc, 1e-8); // COM-NC open
          } else {
            stampConductance(nCom, nNc, 1 / 0.001); // COM-NC closed
            stampConductance(nCom, nNo, 1e-8); // COM-NO open
          }
          break;
        }

        case 'capacitor': {
          const n1 = pinToNode.get(`${comp.id}:pos`) ?? 0;
          const n2 = pinToNode.get(`${comp.id}:neg`) ?? 0;
          const c = Math.max(1e-12, comp.properties.capacitance ?? 100e-6);
          const geq = c / dt;
          const vPrev = this.capacitorVoltages.get(comp.id) ?? 0;
          stampConductance(n1, n2, geq);
          stampCurrentSource(n1, n2, geq * vPrev);
          break;
        }

        case 'inductor': {
          const n1 = pinToNode.get(`${comp.id}:p1`) ?? 0;
          const n2 = pinToNode.get(`${comp.id}:p2`) ?? 0;
          const l = Math.max(1e-6, comp.properties.inductance ?? 0.01);
          // Norton equivalent for inductor: G = dt / L, I_eq = I_prev
          const geq = dt / l;
          const iPrev = this.inductorCurrents.get(comp.id) ?? 0;
          stampConductance(n1, n2, geq);
          stampCurrentSource(n1, n2, iPrev);
          break;
        }

        case 'diode':
        case 'led': {
          const nA = pinToNode.get(`${comp.id}:anode`) ?? 0;
          const nK = pinToNode.get(`${comp.id}:cathode`) ?? 0;
          const vf = comp.type === 'led' ? 2.0 : 0.7;
          const rOn = comp.type === 'led' ? 15 : 5;
          const vPrev = (this.capacitorVoltages.get(`${comp.id}:vd`) ?? 0);
          if (vPrev > vf) {
            stampConductance(nA, nK, 1 / rOn);
            stampCurrentSource(nA, nK, vf / rOn);
          } else {
            stampConductance(nA, nK, 1e-8);
          }
          break;
        }

        case 'transistor_npn': {
          const nB = pinToNode.get(`${comp.id}:b`) ?? 0;
          const nC = pinToNode.get(`${comp.id}:c`) ?? 0;
          const nE = pinToNode.get(`${comp.id}:e`) ?? 0;
          const vbe = (this.capacitorVoltages.get(`${comp.id}:vbe`) ?? 0);
          if (vbe > 0.65) {
            stampConductance(nB, nE, 1 / 50);
            stampConductance(nC, nE, 1 / 1.0);
          } else {
            stampConductance(nB, nE, 1e-7);
            stampConductance(nC, nE, 1e-7);
          }
          break;
        }

        case 'buzzer': {
          const n1 = pinToNode.get(`${comp.id}:pos`) ?? 0;
          const n2 = pinToNode.get(`${comp.id}:neg`) ?? 0;
          stampConductance(n1, n2, 1 / 150);
          break;
        }

        case 'gate_and':
        case 'gate_or':
        case 'gate_not':
        case 'gate_xor': {
          let in1High = false;
          let in2High = false;

          if (comp.type === 'gate_not') {
            const vIn = this.capacitorVoltages.get(`${comp.id}:in`) ?? 0;
            in1High = vIn > 2.0;
          } else {
            const vIn1 = this.capacitorVoltages.get(`${comp.id}:in1`) ?? 0;
            const vIn2 = this.capacitorVoltages.get(`${comp.id}:in2`) ?? 0;
            in1High = vIn1 > 2.0;
            in2High = vIn2 > 2.0;
          }

          let outHigh = false;
          if (comp.type === 'gate_and') outHigh = in1High && in2High;
          if (comp.type === 'gate_or') outHigh = in1High || in2High;
          if (comp.type === 'gate_xor') outHigh = in1High !== in2High;
          if (comp.type === 'gate_not') outHigh = !in1High;

          comp.properties.logicOutputHigh = outHigh;

          const nOut = pinToNode.get(`${comp.id}:out`) ?? 0;
          const outV = outHigh ? 5.0 : 0.0;
          const rOut = 50;
          stampConductance(nOut, 0, 1 / rOut);
          stampCurrentSource(0, nOut, outV / rOut);
          break;
        }

        case 'timer_555': {
          const nGnd = pinToNode.get(`${comp.id}:gnd`) ?? 0;
          const nOut = pinToNode.get(`${comp.id}:out`) ?? 0;
          const nDisch = pinToNode.get(`${comp.id}:disch`) ?? 0;

          const vVcc = this.capacitorVoltages.get(`${comp.id}:vcc`) ?? 9;
          const vTrig = this.capacitorVoltages.get(`${comp.id}:trig`) ?? 0;
          const vThres = this.capacitorVoltages.get(`${comp.id}:thres`) ?? 0;

          let timerState = this.timerStates.get(comp.id);
          if (!timerState) {
            timerState = { latch: true };
            this.timerStates.set(comp.id, timerState);
          }

          const thresLevel = (2 / 3) * Math.max(1, vVcc);
          const trigLevel = (1 / 3) * Math.max(1, vVcc);

          if (vThres > thresLevel) {
            timerState.latch = false;
          } else if (vTrig < trigLevel) {
            timerState.latch = true;
          }

          const isHigh = timerState.latch;
          comp.properties.logicOutputHigh = isHigh;

          const outV = isHigh ? Math.max(0, vVcc - 1.2) : 0.1;
          const rOut = 30;
          stampConductance(nOut, nGnd, 1 / rOut);
          stampCurrentSource(nGnd, nOut, outV / rOut);

          if (!isHigh) {
            stampConductance(nDisch, nGnd, 1 / 10);
          } else {
            stampConductance(nDisch, nGnd, 1e-7);
          }
          break;
        }
      }
    }

    // Stamp independent voltage sources
    for (let k = 0; k < vSources.length; k++) {
      const vs = vSources[k];
      const eqIdx = solveNodeCount + k;
      const idxPlus = getNodeIdx(vs.nodePlus);
      const idxMinus = getNodeIdx(vs.nodeMinus);

      if (vs.nodePlus >= startNode && idxPlus < solveNodeCount) {
        A[idxPlus][eqIdx] += 1;
        A[eqIdx][idxPlus] += 1;
      }
      if (vs.nodeMinus >= startNode && idxMinus < solveNodeCount) {
        A[idxMinus][eqIdx] -= 1;
        A[eqIdx][idxMinus] -= 1;
      }

      A[eqIdx][eqIdx] -= vs.internalR;
      b[eqIdx] = vs.voltage;
    }

    for (let i = 0; i < solveNodeCount; i++) {
      A[i][i] += 1e-9;
    }

    const solution = solveLinearSystem(A, b) || new Array(numEq).fill(0);

    const nodeVoltages = new Map<number, number>();
    nodeVoltages.set(0, 0);

    for (let n = startNode; n < totalNodes; n++) {
      const idx = getNodeIdx(n);
      nodeVoltages.set(n, solution[idx] ?? 0);
    }

    const pinVoltages = new Map<string, number>();
    for (const p of allPins) {
      const node = pinToNode.get(p.id) ?? 0;
      const v = nodeVoltages.get(node) ?? 0;
      pinVoltages.set(p.id, v);
    }

    let buzzerActive = false;
    let buzzerFreq = 440;
    let buzzerVol = 0;
    let hasShortCircuit = false;
    let totalCurrent = 0;
    let totalPower = 0;
    const branchCurrents = new Map<string, number>();
    const componentPower = new Map<string, number>();

    for (const comp of components) {
      if (this.blownComponents.has(comp.id)) continue;

      if (comp.type === 'capacitor') {
        const vp = pinVoltages.get(`${comp.id}:pos`) ?? 0;
        const vn = pinVoltages.get(`${comp.id}:neg`) ?? 0;
        const vDiff = vp - vn;
        this.capacitorVoltages.set(comp.id, vDiff);
        const c = comp.properties.capacitance ?? 100e-6;
        const current = (c * (vDiff - (this.capacitorVoltages.get(`${comp.id}:prev`) ?? 0))) / dt;
        this.capacitorVoltages.set(`${comp.id}:prev`, vDiff);
        branchCurrents.set(comp.id, current);

        if (willItBlow && vDiff < -2.0) {
          this.blownComponents.add(comp.id);
          this.blownReasons.set(comp.id, 'Capacitor exploded: Reverse polarity breakdown!');
        }
      } else if (comp.type === 'inductor') {
        const v1 = pinVoltages.get(`${comp.id}:p1`) ?? 0;
        const v2 = pinVoltages.get(`${comp.id}:p2`) ?? 0;
        const vDiff = v1 - v2;
        const l = Math.max(1e-6, comp.properties.inductance ?? 0.01);
        const prevI = this.inductorCurrents.get(comp.id) ?? 0;
        const current = prevI + (vDiff * dt) / l;
        this.inductorCurrents.set(comp.id, current);
        branchCurrents.set(comp.id, current);
      } else if (comp.type === 'relay') {
        const vc1 = pinVoltages.get(`${comp.id}:coil1`) ?? 0;
        const vc2 = pinVoltages.get(`${comp.id}:coil2`) ?? 0;
        const vDiff = vc1 - vc2;
        this.capacitorVoltages.set(`${comp.id}:vcoil`, vDiff);
        const coilI = vDiff / 100;
        branchCurrents.set(comp.id, coilI);
      } else if (comp.type === 'led' || comp.type === 'diode') {
        const va = pinVoltages.get(`${comp.id}:anode`) ?? 0;
        const vk = pinVoltages.get(`${comp.id}:cathode`) ?? 0;
        const vd = va - vk;
        this.capacitorVoltages.set(`${comp.id}:vd`, vd);

        const vf = comp.type === 'led' ? 2.0 : 0.7;
        const rOn = comp.type === 'led' ? 15 : 5;
        const current = vd > vf ? (vd - vf) / rOn : 0;
        branchCurrents.set(comp.id, current);
        const p = Math.abs(vd * current);
        componentPower.set(comp.id, p);
        totalPower += p;
        totalCurrent += Math.abs(current);

        if (comp.type === 'led' && willItBlow) {
          const maxI = comp.properties.maxCurrent ?? 0.030;
          if (current > maxI) {
            this.blownComponents.add(comp.id);
            this.blownReasons.set(
              comp.id,
              `LED Pop! Forward current (${(current * 1000).toFixed(1)}mA) exceeded safe rating (30mA).`
            );
          }
        }
      } else if (comp.type === 'resistor') {
        const v1 = pinVoltages.get(`${comp.id}:p1`) ?? 0;
        const v2 = pinVoltages.get(`${comp.id}:p2`) ?? 0;
        const vDiff = v1 - v2;
        const r = Math.max(0.1, comp.properties.resistance ?? 330);
        const current = vDiff / r;
        const power = Math.abs(vDiff * current);
        branchCurrents.set(comp.id, Math.abs(current));
        componentPower.set(comp.id, power);
        totalPower += power;
        totalCurrent += Math.abs(current);

        if (willItBlow) {
          const maxP = comp.properties.ratedPower ?? 0.25;
          if (power > maxP * 4) {
            this.blownComponents.add(comp.id);
            this.blownReasons.set(
              comp.id,
              `Resistor Burnt! Dissipated power (${power.toFixed(2)}W) exceeded 1/4W rating.`
            );
          }
        }
      } else if (comp.type === 'buzzer') {
        const vp = pinVoltages.get(`${comp.id}:pos`) ?? 0;
        const vn = pinVoltages.get(`${comp.id}:neg`) ?? 0;
        const vDiff = Math.abs(vp - vn);
        const current = vDiff / 150;
        branchCurrents.set(comp.id, current);
        totalCurrent += current;
        if (vDiff > 1.2) {
          buzzerActive = true;
          buzzerFreq = 1200 + Math.min(2000, vDiff * 250);
          buzzerVol = Math.min(1.0, vDiff / 5.0);
        }
      } else if (comp.type === 'battery' || comp.type === 'ac_source') {
        const k = vSources.findIndex((v) => v.id === comp.id);
        if (k >= 0) {
          const batI = Math.abs(solution[solveNodeCount + k] ?? 0);
          branchCurrents.set(comp.id, batI);
          totalCurrent += batI;
          if (batI > 5.0) {
            hasShortCircuit = true;
          }
        }
      } else if (comp.type === 'timer_555') {
        this.capacitorVoltages.set(`${comp.id}:vcc`, pinVoltages.get(`${comp.id}:vcc`) ?? 0);
        this.capacitorVoltages.set(`${comp.id}:trig`, pinVoltages.get(`${comp.id}:trig`) ?? 0);
        this.capacitorVoltages.set(`${comp.id}:thres`, pinVoltages.get(`${comp.id}:thres`) ?? 0);
      } else if (comp.type === 'transistor_npn') {
        const vb = pinVoltages.get(`${comp.id}:b`) ?? 0;
        const ve = pinVoltages.get(`${comp.id}:e`) ?? 0;
        this.capacitorVoltages.set(`${comp.id}:vbe`, vb - ve);
      } else if (comp.type.startsWith('gate_')) {
        if (comp.type === 'gate_not') {
          this.capacitorVoltages.set(`${comp.id}:in`, pinVoltages.get(`${comp.id}:in`) ?? 0);
        } else {
          this.capacitorVoltages.set(`${comp.id}:in1`, pinVoltages.get(`${comp.id}:in1`) ?? 0);
          this.capacitorVoltages.set(`${comp.id}:in2`, pinVoltages.get(`${comp.id}:in2`) ?? 0);
        }
      }
    }

    // Calculate wire currents
    for (const wire of wires) {
      const vFrom = pinVoltages.get(wire.fromPinId) ?? 0;
      const vTo = pinVoltages.get(wire.toPinId) ?? 0;
      const fromCompId = wire.fromPinId.split(':')[0];
      const toCompId = wire.toPinId.split(':')[0];
      const iFrom = branchCurrents.get(fromCompId) ?? 0;
      const iTo = branchCurrents.get(toCompId) ?? 0;
      const avgI = Math.max(iFrom, iTo);

      wire.current = (vFrom >= vTo ? 1 : -1) * avgI;
      wire.isOverheating = Math.abs(wire.current) > 2.5;
      if (wire.isOverheating) {
        hasShortCircuit = true;
      }
    }

    let oscV = 0;
    if (options.oscilloscopeProbePinId) {
      const probeV = pinVoltages.get(options.oscilloscopeProbePinId) ?? 0;
      const gndV = options.oscilloscopeGroundPinId
        ? pinVoltages.get(options.oscilloscopeGroundPinId) ?? 0
        : 0;
      oscV = probeV - gndV;
    }

    return {
      nodeVoltages,
      pinToNode,
      pinVoltages,
      branchCurrents,
      componentPower,
      blownComponents: new Set(this.blownComponents),
      oscilloscopeVoltage: oscV,
      buzzerActive,
      buzzerFreq,
      buzzerVolume: buzzerVol,
      hasShortCircuit,
      totalCurrent,
      totalPower,
      activeNodeCount: totalNodes,
      simTime: this.simTime,
    };
  }

  public getBlownReason(id: string): string | undefined {
    return this.blownReasons.get(id);
  }

  public repairComponent(id: string): void {
    this.blownComponents.delete(id);
    this.blownReasons.delete(id);
  }
}
