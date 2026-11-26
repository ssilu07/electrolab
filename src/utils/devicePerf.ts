/**
 * Lightweight device performance tier detection.
 * Used to gracefully scale down GPU-heavy effects (2048px shadows, multi-pass
 * WebGL transmission, 24px CSS backdrop-blur) on budget Android devices
 * (e.g. 2-3 GB RAM / quad-core PowerVR GPUs) to prevent Unresponsive GPU ANRs.
 */

let cachedLowEnd: boolean | null = null;

export function isLowEndDevice(): boolean {
  if (cachedLowEnd !== null) return cachedLowEnd;
  if (typeof navigator === 'undefined') {
    cachedLowEnd = false;
    return false;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined;
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined;
  const isAndroid = /Android/i.test(nav.userAgent || '');

  // Budget Android devices (<=3GB RAM, or <=4 CPU cores on Android)
  cachedLowEnd = Boolean(
    (mem !== undefined && mem <= 3) ||
      (isAndroid && cores !== undefined && cores <= 4)
  );
  return cachedLowEnd;
}

export function applyDevicePerfAttribute(): void {
  if (typeof document === 'undefined') return;
  if (isLowEndDevice()) {
    document.documentElement.dataset.perf = 'low';
  } else {
    delete document.documentElement.dataset.perf;
  }
}
