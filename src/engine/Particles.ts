// ============================================================================
// Particle & Visual FX System for ElectroCraft
// Handles Electron Flow, Wire Smoke, Ballistic Sparks, Explosions, & Screen Shake
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
  alpha: number;
  color: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId: number = 1;
  private shockwaves: Shockwave[] = [];
  private flashes: ExplosionFlash[] = [];
  private trauma: number = 0; // Screen shake trauma (0 to 1)

  public clear(): void {
    this.particles = [];
    this.shockwaves = [];
    this.flashes = [];
    this.trauma = 0;
  }

  /**
   * Add screen shake trauma
   */
  public addTrauma(amount: number = 0.6): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Returns current screen shake offset { x, y, rotation }
   */
  public getScreenShake(): { x: number; y: number; angle: number } {
    if (this.trauma <= 0.001) return { x: 0, y: 0, angle: 0 };
    // Non-linear trauma decay creates punchy, satisfying haptic feel
    const shake = this.trauma * this.trauma;
    const maxOffset = 14; // pixels
    const maxAngle = 0.02; // radians
    return {
      x: (Math.random() * 2 - 1) * maxOffset * shake,
      y: (Math.random() * 2 - 1) * maxOffset * shake,
      angle: (Math.random() * 2 - 1) * maxAngle * shake,
    };
  }

  /**
   * Spawn catastrophic explosion particles at (x, y) with intense screen shake
   */
  public triggerExplosion(x: number, y: number, color: string = '#f43f5e'): void {
    // Add violent screen shake trauma
    this.addTrauma(0.85);

    // Initial blinding fireball flash
    this.flashes.push({
      x,
      y,
      radius: 40,
      alpha: 1.0,
      color: '#ffffff',
    });

    // Dual concentric chromatic shockwaves
    // Inner fast shockwave
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 35,
      alpha: 1.0,
      color: '#ffffff',
      width: 4,
    });
    // Outer expanding colored shockwave
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: 65,
      alpha: 0.9,
      color,
      width: 3,
    });
    // Fiery amber secondary ring
    this.shockwaves.push({
      x,
      y,
      radius: 2,
      maxRadius: 50,
      alpha: 0.8,
      color: '#f59e0b',
      width: 2.5,
    });

    // High velocity ballistic sparks with glowing embers
    const sparkCount = 45;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 6.5;
      const isWhiteHot = Math.random() > 0.4;
      this.particles.push({
        id: this.nextId++,
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2.0 + Math.random() * 2.8,
        color: isWhiteHot ? '#ffffff' : Math.random() > 0.3 ? '#fde047' : '#f97316',
        alpha: 1.0,
      });
    }

    // Billowing dark soot and smoke clouds
    const smokeCount = 22;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.6;
      this.particles.push({
        id: this.nextId++,
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: -0.8 - Math.random() * 1.2, // thermal drift upward
        life: 1.0,
        maxLife: 0.9 + Math.random() * 0.9,
        size: 6 + Math.random() * 8,
        color: Math.random() > 0.5 ? '#334155' : '#1e293b',
        alpha: 0.75,
      });
    }
  }

  /**
   * Spawn gentle smoke for overheated resistor or wire
   */
  public triggerSmoke(x: number, y: number): void {
    if (Math.random() > 0.4) return;
    this.particles.push({
      id: this.nextId++,
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.9 - Math.random() * 0.6,
      life: 1.0,
      maxLife: 0.7 + Math.random() * 0.7,
      size: 4 + Math.random() * 5,
      color: '#64748b',
      alpha: 0.55,
    });
  }

  /**
   * Spawn and update electron particles traveling along wires
   */
  public updateElectrons(
    wires: CircuitWire[],
    pinMap: Map<string, CircuitPin>,
    gridSize: number,
    dt: number
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
      if (absI < 0.0005) continue; // No flow if negligible current

      const fromPin = pinMap.get(wire.fromPinId);
      const toPin = pinMap.get(wire.toPinId);
      if (!fromPin || !toPin) continue;

      const p1x = fromPin.x * gridSize;
      const p1y = fromPin.y * gridSize;
      const p2x = toPin.x * gridSize;
      const p2y = toPin.y * gridSize;
      const dist = Math.hypot(p2x - p1x, p2y - p1y);

      // Target count scales with distance and current
      const density = Math.min(18, Math.max(3, Math.floor(dist / 16)));
      const currentCount = existingByWire.get(wire.id) ?? 0;

      if (currentCount < density && Math.random() < 0.45) {
        // Speed scales smoothly with current
        const speed = Math.min(3.2, Math.max(0.4, Math.log10(absI * 1000 + 1) * 0.75));
        const direction = current >= 0 ? 1 : -1;

        // Dynamic color based on current intensity
        let particleColor = '#38bdf8'; // Electric Cyan (normal)
        if (absI > 1.5) {
          particleColor = '#ef4444'; // Red Hot (extreme overload)
        } else if (absI > 0.4) {
          particleColor = '#f59e0b'; // Electric Amber (high current)
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
   * Physics step for all particles, shockwaves, and flashes
   */
  public update(dt: number, wires: CircuitWire[], pinMap: Map<string, CircuitPin>, gridSize: number): void {
    // Decay screen shake trauma smoothly
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    }

    // Update explosion flashes
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.radius += 80 * dt;
      f.alpha -= 3.5 * dt;
      if (f.alpha <= 0) {
        this.flashes.splice(i, 1);
      }
    }

    this.updateElectrons(wires, pinMap, gridSize, dt);

    const wireMap = new Map<string, CircuitWire>();
    for (const w of wires) wireMap.set(w.id, w);

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 130 * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
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
        const midY = (p1y + p2y) / 2 + Math.min(32, dist * 0.16);

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

        p.alpha = Math.max(0, p.life);
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;

        if (p.type === 'spark') {
          p.vy += 5.2 * dt; // gravity
          p.vx *= 0.97; // drag
        } else if (p.type === 'smoke') {
          p.size += 4.5 * dt; // volumetric expansion
          p.vx += (Math.random() - 0.5) * 0.25;
        }
      }
    }
  }

  /**
   * Render all particles, flashes, and shockwaves to canvas context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // 1. Render explosion fireball flashes
    for (const f of this.flashes) {
      if (f.alpha <= 0) continue;
      ctx.save();
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(1, f.radius));
      grad.addColorStop(0, `rgba(255, 255, 255, ${f.alpha * 0.9})`);
      grad.addColorStop(0.3, `rgba(254, 240, 138, ${f.alpha * 0.7})`);
      grad.addColorStop(0.7, `rgba(249, 115, 22, ${f.alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, Math.max(1, f.radius), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Render shockwaves
    for (const sw of this.shockwaves) {
      const r = Math.max(0.1, sw.radius);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.width;
      ctx.globalAlpha = sw.alpha * 0.85;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render particles (Smoke first, then Sparks, then Electrons on top)
    for (const p of this.particles) {
      if (p.type !== 'smoke') continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * 0.65));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.particles) {
      if (p.type !== 'spark') continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      const s = Math.max(0.1, p.size);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();
      // White-hot center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.particles) {
      if (p.type !== 'electron') continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      const s = Math.max(0.1, p.size);

      // Kinetic Motion Comet Trail (High-Vis Energy Flow "Juice")
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

      // Layer 1: Vibrant outer neon glow halo
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Ultra-bright white-hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

