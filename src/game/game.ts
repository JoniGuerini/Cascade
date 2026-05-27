import { state, loadSave, save, consumePendingScrollTop, isInSetup } from './state';
import { simulate } from './simulate';
import { tryAutoBuy, tryEqualizer, tryFullAuto } from './autopilot';
import { render } from './render';
import { runtime } from './runtime';

interface InitDeps {
  scrollEl: HTMLElement;
  rowsContainer: HTMLElement;
  maxTierEl: HTMLElement | null;
  fpsEl: HTMLElement | null;
}

function currentSimulateInterval(): number {
  const n = state.gens.length;
  if (n > 50000) return 1 / 10;
  if (n > 10000) return 1 / 20;
  return 1 / 30;
}

let started = false;
let lastTick = 0;
let fpsLast = 0;
let fpsFrames = 0;
let simulateAccum = 0;
let lastVisibleAt = Date.now();
let wakeLock: any = null;
let saveTimer: number | null = null;

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { /* permission denied or unsupported */ }
  }
}

function setupCpuPressure() {
  const cpuInd = document.getElementById('cpu-ind');
  const cpuText = document.getElementById('cpu-text');
  if (!cpuInd || !cpuText) return;
  const PressureObserver = (window as any).PressureObserver;
  if (typeof PressureObserver === 'undefined') return;
  const labels: Record<string, { text: string; color: string }> = {
    nominal:  { text: 'idle',     color: 'var(--pos)' },
    fair:     { text: 'normal',   color: 'var(--text-1)' },
    serious:  { text: 'high',     color: 'var(--accent)' },
    critical: { text: 'critical', color: 'var(--neg)' },
  };
  try {
    const observer = new PressureObserver((records: any[]) => {
      const last = records[records.length - 1];
      if (!last) return;
      const meta = labels[last.state] || { text: last.state, color: 'var(--text-2)' };
      cpuText.textContent = meta.text;
      cpuText.style.color = meta.color;
    });
    observer.observe('cpu', { sampleInterval: 1000 }).then(() => {
      cpuInd.removeAttribute('hidden');
    }).catch(() => {});
  } catch (e) { /* unavailable */ }
}

export function initGame({ scrollEl, rowsContainer, maxTierEl, fpsEl }: InitDeps) {
  if (started) return;
  started = true;

  loadSave(simulate);
  runtime.isInSetup = () => isInSetup;

  const pending = consumePendingScrollTop();
  if (pending > 0) scrollEl.scrollTop = pending;

  setupCpuPressure();
  requestWakeLock();

  lastTick = performance.now();
  fpsLast = lastTick;

  const loop = (now: number) => {
    const dt = Math.min((now - lastTick) / 1000, 0.1);
    lastTick = now;
    if (!isInSetup) {
      simulateAccum += dt;
      if (simulateAccum >= currentSimulateInterval()) {
        simulate(simulateAccum);
        simulateAccum = 0;
      }
      const flags = {
        autoBuy: runtime.autoBuy,
        fullAuto: runtime.fullAuto,
        equalizer: runtime.equalizer,
        buyAmountPct: runtime.buyAmountPct,
        upgradeBuyAmountPct: runtime.upgradeBuyAmountPct,
        genCap: runtime.genCap,
        isInSetup: runtime.isInSetup,
      };
      tryAutoBuy(dt, flags);
      tryFullAuto(dt, flags);
      tryEqualizer(dt, flags);
    }
    render(rowsContainer, scrollEl, maxTierEl);
    fpsFrames++;
    if (now - fpsLast >= 500) {
      const fps = Math.round((fpsFrames * 1000) / (now - fpsLast));
      if (fpsEl) fpsEl.textContent = fps + ' fps';
      fpsFrames = 0;
      fpsLast = now;
    }
    requestAnimationFrame(loop);
  };

  saveTimer = window.setInterval(() => save(scrollEl.scrollTop), 5000);

  window.addEventListener('beforeunload', () => { save(scrollEl.scrollTop); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      save(scrollEl.scrollTop);
      lastVisibleAt = Date.now();
    } else if (document.visibilityState === 'visible') {
      const elapsedMs = Math.max(0, Date.now() - lastVisibleAt);
      if (elapsedMs > 500 && !isInSetup) simulate(elapsedMs / 1000);
      lastVisibleAt = Date.now();
      lastTick = performance.now();
      if (wakeLock === null) requestWakeLock();
    }
  });

  requestAnimationFrame(loop);
}

export function stopSaveTimer() {
  if (saveTimer != null) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
}
