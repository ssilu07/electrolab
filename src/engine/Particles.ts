// ============================================================================
// Particle & Visual FX System for ElectroLab
// Handles Electron Flow, Volumetric Smoke Plumes, Fireball Explosions,
// Electric Plasma Arcs, Debris Shards, Spark Trails, & Screen Shake
// ============================================================================

import { Particle, CircuitWire, CircuitPin } from '../types/circuit';

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  width: number;
}

interface ExplosionFlash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface ElectricArc {
  points: { x: number; y: number }[];
  alpha: number;
  color: string;
  width: number;
}

interface DebrisShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  w: number;
  h: number;
  color: string;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId: number = 1;
  private shockwaves: Shockwave[] = [];
  private flashes: ExplosionFlash[] = [];
  private arcs: ElectricArc[] = [];
  private debris: DebrisShard[] = [];
  private trauma: number = 0; // Screen shake trauma (0 to 1)
  private time: number = 0;

  public clear(): void {
    this.particles = [];
    this.shockwaves = [];
    this.flashes = [];
    this.arcs = [];
    this.debris = [];
    this.trauma = 0;
  }

  /**
   * Add screen shake trauma
   */
  public addTrauma(amount: number = 0.6): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Returns current screen shake offset { x, y, angle }
   */
  public getScreenShake(): { x: number; y: number; angle: number } {
    if (this.trauma <= 0.001) return { x: 0, y: 0, angle: 0 };
    const shake = this.trauma * this.trauma;
    const maxOffset = 18;
    const maxAngle = 0.024;
    return {
      x: (Math.random() * 2 - 1) * maxOffset * shake,
      y: (Math.random() * 2 - 1) * maxOffset * shake,
      angle: (Math.random() * 2 - 1) * maxAngle * shake,
    };
  }

  /**
   * Generate a jagged lightning bolt from (x, y) outward
   */
  private spawnElectricArc(x: number, y: number, length: number, color: string, width = 2.2): void {
    const angle = Math.random() * Math.PI * 2;
    const segments = 5 + Math.floor(Math.random() * 4);
    const points: { x: number; y: number }[] = [{ x, y }];
    let cx = x;
    let cy = y;
    const stepLen = length / segments;
    for (let i = 1; i <= segments; i++) {
      const jitter = (Math.random() - 0.5) * stepLen * 1.15;
      const perpX = -Math.sin(angle) * jitter;
      const perpY = Math.cos(angle) * jitter;
      cx += Math.cos(angle) * stepLen + perpX;
      cy += Math.sin(angle) * stepLen + perpY;
      points.push({ x: cx, y: cy });
    }
    this.arcs.push({ points, alpha: 1.0, color, width });
  }

  /**
   * Spawn crisp electric micro-sparks when connecting a wire to a pin
   */
  public triggerConnectSpark(x: number, y: number, color: string = '#38bdf8'): void {
    this.shockwaves.push({
      x,
      y,
      radius: 2,
      maxRadius: 22,
      alpha: 0.9,
      color,
      width: 2,
    });

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.0;
      this.particles.push({
        id: this.nextId++,
        type: 'spark',
        x,
        y,
        prevX: x,
        prevY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1.0,
        maxLife: 0.25 + Math.random() * 0.22,
        size: 1.4 + Math.random() * 1.6,
        color: i % 3 === 0 ? '#ffffff' : color,
        alpha: 1.0,
      });
    }
  }

  /**
   * Spawn cinematic multi-stage explosion at (x, y) with fireball, arcs, debris, and billowing volumetric smoke
   */
  public triggerExplosion(x: number, y: number, color: string = '#f97316'): void {
    this.addTrauma(0.95);

    // 1. Multi-layer blinding fireball flashes
    this.flashes.push({
      x,
      y,
      radius: 18,
      maxRadius: 115,
      alpha: 1.0,
      color: '#ffffff',
    });
    this.flashes.push({
      x,
      y,
      radius: 10,
      maxRadius: 85,
      alpha: 0.95,
      color: '#f97316',
    });

    // 2. Triple concentric chromatic shockwaves
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 58,
      alpha: 1.0,
      color: '#ffffff',
      width: 4.5,
    });
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: 96,
      alpha: 0.95,
      color,
      width: 3.5,
    });
    this.shockwaves.push({
      x,
      y,
      radius: 2,
      maxRadius: 128,
      alpha: 0.85,
      color: '#38bdf8',
      width: 2.2,
    });

    // 3. Branching Electric Plasma Arcs
    for (let i = 0; i < 8; i++) {
      this.spawnElectricArc(
        x,
        y,
        36 + Math.random() * 44,
        i % 2 === 0 ? '#fef08a' : '#38bdf8',
        2.0 + Math.random() * 1.2
      );
    }

    // 4. High-velocity ballistic sparks with streaking trails
    const sparkCount = 60;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 7.8;
      const roll = Math.random();
      const sparkColor =
        roll > 0.65 ? '#ffffff' : roll > 0.35 ? '#fde047' : roll > 0.12 ? '#fb923c' : '#ef4444';
      this.particles.push({
        id: this.nextId++,
        type: 'spark',
        x,
        y,
        prevX: x,
        prevY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        life: 1.0,
        maxLife: 0.55 + Math.random() * 0.65,
        size: 1.8 + Math.random() * 2.8,
        color: sparkColor,
        alpha: 1.0,
      });
    }

    // 5. Tumbling shattered component debris shards
    const shardColors = ['#1e293b', '#475569', '#b45309', '#dc2626', '#94a3b8'];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.2;
      this.debris.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.0,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 16,
        w: 3 + Math.random() * 5,
        h: 2 + Math.random() * 3.5,
        color: shardColors[i % shardColors.length],
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.7,
      });
    }

    // 6. Thick, high-visibility rising volumetric smoke plume (light-catching silver-ash + warm ember base)
    const smokeCount = 34;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.9;
      const isEmberLit = i < 10;
      this.particles.push({
        id: this.nextId++,
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(angle) * speed * 0.75,
        vy: -0.9 - Math.random() * 1.6,
        life: 1.0,
        maxLife: 1.6 + Math.random() * 1.6,
        size: 9 + Math.random() * 12,
        color: isEmberLit ? '#fb923c' : i % 2 === 0 ? '#cbd5e1' : '#94a3b8',
        alpha: isEmberLit ? 0.85 : 0.72,
      });
    }
  }

  /**
   * Continuous curling smoke rising from a blown/charred component until repaired
   */
  public triggerLingeringSmoke(x: number, y: number): void {
    if (Math.random() > 0.24) return;
    const isTinyEmber = Math.random() < 0.14;
    if (isTinyEmber) {
      this.particles.push({
        id: this.nextId++,
        type: 'spark',
        x: x + (Math.random() - 0.5) * 10,
        y: y - 2,
        prevX: x,
        prevY: y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -1.4 - Math.random() * 1.4,
        life: 1.0,
        maxLife: 0.35 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 1.2,
        color: Math.random() > 0.5 ? '#fb923c' : '#fde047',
        alpha: 0.95,
      });
    } else {
      this.particles.push({
        id: this.nextId++,
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 12,
        y: y - 4 + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.75 - Math.random() * 0.75,
        life: 1.0,
        maxLife: 1.5 + Math.random() * 1.3,
        size: 6 + Math.random() * 7,
        color: Math.random() > 0.4 ? '#cbd5e1' : '#94a3b8',
        alpha: 0.55,
      });
    }
  }

  /**
   * Pre-explosion overheat warning smoke & tiny crackling sparks (heatRatio: 0.7..1.0)
   */
  public triggerOverheatSmoke(x: number, y: number, heatRatio: number = 0.8): void {
    const chance = Math.min(0.45, 0.12 + (heatRatio - 0.7) * 0.9);
    if (Math.random() > chance) return;

    this.particles.push({
      id: this.nextId++,
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 10,
      y: y - 3,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.9 - Math.random() * 0.7,
      life: 1.0,
      maxLife: 1.0 + Math.random() * 0.9,
      size: 5 + Math.random() * 6,
      color: Math.random() > 0.3 ? '#e2e8f0' : '#fca5a5',
      alpha: 0.5,
    });

    if (heatRatio > 0.85 && Math.random() < 0.25) {
      this.spawnElectricArc(x, y, 16 + Math.random() * 14, '#fde047', 1.5);
    }
  }

  /**
   * Spawn visible smoke for overheated wire / short-circuit
   */
  public triggerSmoke(x: number, y: number): void {
    if (Math.random() > 0.45) return;
    this.particles.push({
      id: this.nextId++,
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.65,
      vy: -1.0 - Math.random() * 0.8,
      life: 1.0,
      maxLife: 1.2 + Math.random() * 1.1,
      size: 6 + Math.random() * 7,
      color: Math.random() > 0.35 ? '#cbd5e1' : '#f97316',
      alpha: 0.65,
    });
  }

  /**
   * Spawn and update electron particles traveling along wires
   */
  public updateElectrons(
    wires: CircuitWire[],
    pinMap: Map<string, CircuitPin>,
    gridSize: number,
    _dt: number
  ): void {
    const existingElectrons = this.particles.filter((p) => p.type === 'electron');
    const existingByWire = new Map<string, number>();
    for (const e of existingElectrons) {
      if (e.pathWireId) {
        existingByWire.set(e.pathWireId, (existingByWire.get(e.pathWireId) ?? 0) + 1);
      }
    }

    for (const wire of wires) {
      const current = wire.current;
      const absI = Math.abs(current);
      if (absI < 0.0005) continue;

      const fromPin = pinMap.get(wire.fromPinId);
      const toPin = pinMap.get(wire.toPinId);
      if (!fromPin || !toPin) continue;

      const p1x = fromPin.x * gridSize;
      const p1y = fromPin.y * gridSize;
      const p2x = toPin.x * gridSize;
      const p2y = toPin.y * gridSize;
      const dist = Math.hypot(p2x - p1x, p2y - p1y);

      const density = Math.min(18, Math.max(3, Math.floor(dist / 16)));
      const currentCount = existingByWire.get(wire.id) ?? 0;

      if (currentCount < density && Math.random() < 0.45) {
        const speed = Math.min(3.2, Math.max(0.4, Math.log10(absI * 1000 + 1) * 0.75));
        const direction = current >= 0 ? 1 : -1;

        let particleColor = '#38bdf8';
        if (absI > 1.5) {
          particleColor = '#ef4444';
        } else if (absI > 0.4) {
          particleColor = '#f59e0b';
        }

        this.particles.push({
          id: this.nextId++,
          type: 'electron',
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 1.0,
          maxLife: 6.0,
          size: absI > 1.0 ? 3.5 : 2.8,
          color: particleColor,
          alpha: 1.0,
          pathWireId: wire.id,
          pathT: direction > 0 ? 0 : 1,
          speed: speed * direction,
        });
      }
    }
  }

  /**
   * Physics step for all particles, shockwaves, flashes, arcs, and debris
   */
  public update(dt: number, wires: CircuitWire[], pinMap: Map<string, CircuitPin>, gridSize: number): void {
    this.time += dt;

    // Decay screen shake trauma smoothly
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.9);
    }

    // Update explosion fireball flashes
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.radius += (f.maxRadius - f.radius) * Math.min(1, dt * 8.5);
      f.alpha -= 1.65 * dt;
      if (f.alpha <= 0) {
        this.flashes.splice(i, 1);
      }
    }

    // Update electric plasma arcs
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const a = this.arcs[i];
      a.alpha -= 3.0 * dt;
      if (a.alpha <= 0) {
        this.arcs.splice(i, 1);
      }
    }

    // Update tumbling debris shards
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt / d.maxLife;
      if (d.life <= 0) {
        this.debris.splice(i, 1);
        continue;
      }
      d.x += d.vx * 60 * dt;
      d.y += d.vy * 60 * dt;
      d.vy += 8.5 * dt; // gravity
      d.vx *= 0.985;
      d.angle += d.spin * dt;
    }

    this.updateElectrons(wires, pinMap, gridSize, dt);

    const wireMap = new Map<string, CircuitWire>();
    for (const w of wires) wireMap.set(w.id, w);

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 175 * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Cap total non-electron particles for consistent 60fps on mobile
    if (this.particles.length > 360) {
      const idx = this.particles.findIndex((p) => p.type === 'smoke');
      if (idx !== -1) this.particles.splice(idx, 1);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'electron') {
        const wire = p.pathWireId ? wireMap.get(p.pathWireId) : undefined;
        if (!wire || !p.pathWireId) {
          this.particles.splice(i, 1);
          continue;
        }

        const fromPin = pinMap.get(wire.fromPinId);
        const toPin = pinMap.get(wire.toPinId);
        if (!fromPin || !toPin) {
          this.particles.splice(i, 1);
          continue;
        }

        const absI = Math.abs(wire.current);
        if (absI < 0.0005) {
          this.particles.splice(i, 1);
          continue;
        }

        const p1x = fromPin.x * gridSize;
        const p1y = fromPin.y * gridSize;
        const p2x = toPin.x * gridSize;
        const p2y = toPin.y * gridSize;
        const dist = Math.hypot(p2x - p1x, p2y - p1y);

        const stepT = ((p.speed ?? 1.0) * 85 * dt) / Math.max(20, dist);
        p.pathT = (p.pathT ?? 0) + stepT;

        if (p.pathT > 1 || p.pathT < 0) {
          this.particles.splice(i, 1);
          continue;
        }

        const t = p.pathT;
        const midX = (p1x + p2x) / 2;
        const midY = (p1y + p2y) / 2 + Math.min(28, dist * 0.14);

        const omt = 1 - t;
        const newX = omt * omt * p1x + 2 * omt * t * midX + t * t * p2x;
        const newY = omt * omt * p1y + 2 * omt * t * midY + t * t * p2y;
        if (p.x !== 0 || p.y !== 0) {
          p.prevX = p.x;
          p.prevY = p.y;
        } else {
          p.prevX = newX;
          p.prevY = newY;
        }
        p.x = newX;
        p.y = newY;
      } else {
        p.life -= dt / p.maxLife;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        p.prevX = p.x;
        p.prevY = p.y;
        p.alpha = Math.max(0, p.life);
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;

        if (p.type === 'spark') {
          p.vy += 6.0 * dt; // gravity
          p.vx *= 0.965; // air drag
        } else if (p.type === 'smoke') {
          p.size += 12.5 * dt; // rich volumetric expansion
          // Gentle sinusoidal thermal curl as smoke rises
          p.vx += Math.sin(this.time * 4 + p.id) * 0.04;
          p.vx *= 0.98;
        }
      }
    }
  }

  /**
   * Render all particles, fireballs, shockwaves, electric arcs, and debris
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // 1. Soft Volumetric Smoke Plumes (Rendered behind fireballs & sparks for depth)
    for (const p of this.particles) {
      if (p.type !== 'smoke') continue;
      const r = Math.max(1, p.size);
      const a = Math.max(0, Math.min(1, p.alpha * 0.72));
      ctx.save();
      const smokeGrad = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
      if (p.color === '#fb923c' || p.color === '#f97316') {
        smokeGrad.addColorStop(0, `rgba(251, 146, 60, ${a * 0.85})`);
        smokeGrad.addColorStop(0.45, `rgba(148, 163, 184, ${a * 0.55})`);
        smokeGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else {
        smokeGrad.addColorStop(0, `rgba(226, 232, 240, ${a * 0.72})`);
        smokeGrad.addColorStop(0.5, `rgba(148, 163, 184, ${a * 0.42})`);
        smokeGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
      }
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Multi-Layer Explosion Fireball Flashes
    for (const f of this.flashes) {
      if (f.alpha <= 0) continue;
      const r = Math.max(1, f.radius);
      ctx.save();
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${f.alpha})`);
      grad.addColorStop(0.28, `rgba(254, 240, 138, ${f.alpha * 0.9})`);
      grad.addColorStop(0.58, `rgba(249, 115, 22, ${f.alpha * 0.65})`);
      grad.addColorStop(0.85, `rgba(220, 38, 38, ${f.alpha * 0.3})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Concentric Shockwaves
    for (const sw of this.shockwaves) {
      const r = Math.max(0.1, sw.radius);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.width;
      ctx.globalAlpha = sw.alpha * 0.9;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Branching Electric Plasma Arcs
    for (const arc of this.arcs) {
      if (arc.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      for (let i = 1; i < arc.points.length; i++) {
        ctx.lineTo(arc.points[i].x, arc.points[i].y);
      }
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = arc.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.max(0, arc.alpha);
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 14;
      ctx.stroke();

      // White-hot inner lightning core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = arc.width * 0.45;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Tumbling Shattered Debris Shards
    for (const d of this.debris) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.globalAlpha = Math.max(0, Math.min(1, d.life));
      ctx.fillStyle = d.color;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.6;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.strokeRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }

    // 6. Ballistic Sparks with Glowing Motion Trails
    for (const p of this.particles) {
      if (p.type !== 'spark') continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      const s = Math.max(0.1, p.size);

      if (p.prevX !== undefined && p.prevY !== undefined) {
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = s * 1.15;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Electron Flow Comet Trails
    for (const p of this.particles) {
      if (p.type !== 'electron') continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      const s = Math.max(0.1, p.size);

      if (p.prevX !== undefined && p.prevY !== undefined && (p.x !== p.prevX || p.y !== p.prevY)) {
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = s * 1.5;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
      }

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
