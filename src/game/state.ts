import Decimal from 'break_eternity.js';
import {
  D, D0, D1, SAVE_KEY,
  COST_MULT_BASE, COST_MULT_GROWTH, COST_MULT_NOISE, COST_PROC_SEED,
} from './constants';

export interface GameState {
  energy: Decimal;
  sparks: Decimal;
  coins: Decimal;
  gens: Decimal[];
  bought: Decimal[];
  milestonesClaimed: Decimal[];
  upgrades: Record<string, number>;
  startTime: number;
  lastSave: number;
  lastSaveError: boolean;
}

export const state: GameState = {
  energy: D1,
  sparks: D1,
  coins: D0,
  gens: [D0],
  bought: [D0],
  milestonesClaimed: [D0],
  upgrades: {},
  startTime: Date.now(),
  lastSave: Date.now(),
  lastSaveError: false,
};

export let isResetting = false;
export function setResetting(v: boolean) { isResetting = v; }

export let isInSetup = localStorage.getItem('cascade-needs-setup') === '1';
export function setInSetup(v: boolean) { isInSetup = v; }

export let pendingScrollTop = 0;
export function consumePendingScrollTop(): number {
  const v = pendingScrollTop;
  pendingScrollTop = 0;
  return v;
}

// Lazy counter for tiers with bought > 0. Invalidate by setting to null.
let _unlockedCount: number | null = null;
export function getUnlockedCount(): number {
  if (_unlockedCount !== null) return _unlockedCount;
  let count = 0;
  for (let i = 0; i < state.bought.length; i++) {
    if (state.bought[i].gt(0)) count++;
  }
  _unlockedCount = count;
  return count;
}
export function bumpUnlockedCount() {
  if (_unlockedCount !== null) _unlockedCount++;
}
export function invalidateUnlockedCount() {
  _unlockedCount = null;
}

export function ensureTier(idx: number) {
  while (state.gens.length <= idx) {
    state.gens.push(D0);
    state.bought.push(D0);
    state.milestonesClaimed.push(D0);
  }
}

export function highestTierReached(): number {
  for (let i = state.bought.length - 1; i >= 0; i--) {
    if (state.bought[i] && state.bought[i].gt(0)) return i + 1;
  }
  return 0;
}

export function loadSave(simulate: (dt: number) => void) {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.gens) || !Array.isArray(parsed.bought)) return;
    const safeFinite = (v: Decimal, fallback: Decimal): Decimal =>
      (v && v.isFinite && v.isFinite()) ? v : fallback;
    state.energy = safeFinite(parsed.energy != null ? D(parsed.energy) : D1, D1);
    state.sparks = safeFinite(parsed.sparks != null ? D(parsed.sparks) : D1, D1);
    state.coins = safeFinite(parsed.coins != null ? D(parsed.coins) : D0, D0);
    state.gens = parsed.gens.map((g: string) => safeFinite(D(g), D0));
    state.bought = parsed.bought.map((b: string) => safeFinite(D(b), D0));
    state.milestonesClaimed = Array.isArray(parsed.milestonesClaimed)
      ? parsed.milestonesClaimed.map((m: string) => safeFinite(D(m), D0))
      : [];
    state.upgrades = (parsed.upgrades && typeof parsed.upgrades === 'object') ? parsed.upgrades : {};
    pendingScrollTop = typeof parsed.scrollTop === 'number' ? parsed.scrollTop : 0;
    while (state.gens.length < state.bought.length) state.gens.push(D0);
    while (state.bought.length < state.gens.length) state.bought.push(D0);
    while (state.milestonesClaimed.length < state.gens.length) state.milestonesClaimed.push(D0);
    state.startTime = parsed.startTime || Date.now();
    state.lastSave = parsed.lastSave || Date.now();
    const offlineMs = Math.max(0, Date.now() - state.lastSave);
    if (offlineMs > 1000 && !isInSetup) simulate(offlineMs / 1000);
  } catch (e) { console.error('save load failed', e); }
}

export function save(scrollTop: number) {
  if (isResetting || isInSetup) return;
  state.lastSave = Date.now();
  try {
    const serialized = {
      energy: state.energy.toString(),
      sparks: state.sparks.toString(),
      coins: state.coins.toString(),
      gens: state.gens.map(g => g.toString()),
      bought: state.bought.map(b => b.toString()),
      milestonesClaimed: state.milestonesClaimed.map(m => m.toString()),
      upgrades: state.upgrades,
      scrollTop,
      startTime: state.startTime,
      lastSave: state.lastSave,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialized));
    state.lastSaveError = false;
  } catch (e) {
    state.lastSaveError = true;
    console.error('save failed', e);
  }
}

export interface TierInfo { name: string; produces: string; energyCost: Decimal; prevGenCost: Decimal; }
export function nameForTier(idx: number): string { return 'Generator ' + (idx + 1); }

// Deterministic mulberry32-style hash: same `idx` always returns the same value in [0,1).
function tierRand01(idx: number): number {
  let h = (idx + COST_PROC_SEED) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

// Multiplier applied to go from cost(idx-1) to cost(idx). Grows slowly with idx
// and is jittered by deterministic per-tier noise. Always > 1 so costs are monotonic.
export function tierCostMultiplier(idx: number): number {
  if (idx <= 0) return 1;
  const base = COST_MULT_BASE + (idx - 1) * COST_MULT_GROWTH;
  const noise = (tierRand01(idx) * 2 - 1) * COST_MULT_NOISE;
  const mult = base * (1 + noise);
  return mult < 1.1 ? 1.1 : mult;
}

const _energyCostCache: Decimal[] = [D1];
export function energyCostFor(idx: number): Decimal {
  if (idx < 0) return D1;
  while (_energyCostCache.length <= idx) {
    const k = _energyCostCache.length;
    const prev = _energyCostCache[k - 1];
    const raw = prev.mul(tierCostMultiplier(k));
    _energyCostCache.push(raw.lt(1000) ? raw.round() : raw.floor());
  }
  return _energyCostCache[idx];
}

export function prevGenCostFor(idx: number): Decimal { return idx === 0 ? D0 : D(5 * idx); }
export function tierInfo(idx: number): TierInfo {
  return {
    name: nameForTier(idx),
    produces: idx === 0 ? 'Energy' : nameForTier(idx - 1),
    energyCost: energyCostFor(idx),
    prevGenCost: prevGenCostFor(idx),
  };
}
