import Decimal from 'break_eternity.js';
import { D, D0, D1, SPARK_RATE } from './constants';
import { state, ensureTier, energyCostFor, prevGenCostFor } from './state';

export let freeMode = localStorage.getItem('cascade-freemode') === '1';
export function setFreeMode(v: boolean) {
  freeMode = v;
  localStorage.setItem('cascade-freemode', v ? '1' : '0');
}

// Coins
export function canAffordCoins(amount: Decimal | number): boolean {
  const cost = (typeof amount === 'number') ? D(amount) : amount;
  return state.coins.gte(cost);
}
export function spendCoins(amount: Decimal | number): boolean {
  const cost = (typeof amount === 'number') ? D(amount) : amount;
  if (!state.coins.gte(cost)) return false;
  state.coins = state.coins.sub(cost);
  return true;
}
export function addCoins(amount: Decimal | number) {
  const inc = (typeof amount === 'number') ? D(amount) : amount;
  state.coins = state.coins.add(inc);
}

// Generic upgrades
export function getUpgradeLevel(id: string): number { return state.upgrades[id] || 0; }
export function setUpgradeLevel(id: string, level: number) {
  if (level <= 0) delete state.upgrades[id];
  else state.upgrades[id] = level;
}
export function buyUpgrade(id: string, cost: Decimal): boolean {
  if (!spendCoins(cost)) return false;
  setUpgradeLevel(id, getUpgradeLevel(id) + 1);
  return true;
}

// Per-gen production upgrade
export function genUpgradeKey(idx: number): string { return 'gen-' + idx; }
export function genUpgradeLevel(idx: number): number { return getUpgradeLevel(genUpgradeKey(idx)); }

const _genUpgradeMultCache: Decimal[] = [];
const _genUpgradeMultCacheLvl: number[] = [];
export function genUpgradeMult(idx: number): Decimal {
  const lvl = genUpgradeLevel(idx);
  if (_genUpgradeMultCacheLvl[idx] !== lvl) {
    _genUpgradeMultCache[idx] = Decimal.pow(2, lvl);
    _genUpgradeMultCacheLvl[idx] = lvl;
  }
  return _genUpgradeMultCache[idx];
}
export function genUpgradeBase(idx: number): Decimal { return D(idx + 1); }
export function genUpgradeNextCost(idx: number): Decimal {
  return Decimal.pow(2, genUpgradeLevel(idx)).mul(genUpgradeBase(idx));
}
export function buyGenUpgrade(idx: number): boolean {
  return buyUpgrade(genUpgradeKey(idx), genUpgradeNextCost(idx));
}

// Per-gen cost reduction
export function genCostKey(idx: number): string { return 'gen-' + idx + '-cost'; }
export function genCostLevel(idx: number): number { return getUpgradeLevel(genCostKey(idx)); }
export function genCostMult(idx: number): Decimal { return Decimal.pow(0.5, genCostLevel(idx)); }
export function genCostNextCost(idx: number): Decimal {
  return Decimal.pow(2, genCostLevel(idx)).mul(genUpgradeBase(idx));
}
export function genCostMaxLevel(idx: number): number {
  if (idx === 0) return 0;
  const energy = energyCostFor(idx);
  const log10E = energy.log10();
  const log2BaseE = (typeof log10E === 'number' ? log10E : log10E.toNumber()) * 3.321928094887362;
  const prevRaw = prevGenCostFor(idx).toNumber();
  const log2BaseP = isFinite(prevRaw) && prevRaw > 1 ? Math.log2(prevRaw) : 0;
  const maxL = Math.max(isFinite(log2BaseE) ? log2BaseE : 0, log2BaseP);
  return Math.ceil(Math.max(0, maxL));
}
export function genCostAtMax(idx: number): boolean { return genCostLevel(idx) >= genCostMaxLevel(idx); }
export function buyGenCostUpgrade(idx: number): boolean {
  if (genCostAtMax(idx)) return false;
  return buyUpgrade(genCostKey(idx), genCostNextCost(idx));
}

export function genTotalUpgradeLevel(idx: number): number {
  return genUpgradeLevel(idx) + genCostLevel(idx);
}

// Sparks upgrade
export function sparksUpgradeLevel(): number { return getUpgradeLevel('sparks'); }
let _sparksMultCache = D1, _sparksMultCacheLvl = -1;
export function sparksUpgradeMult(): Decimal {
  const lvl = sparksUpgradeLevel();
  if (_sparksMultCacheLvl !== lvl) {
    _sparksMultCache = Decimal.pow(2, lvl);
    _sparksMultCacheLvl = lvl;
  }
  return _sparksMultCache;
}
export function sparksUpgradeNextCost(): Decimal { return Decimal.pow(2, sparksUpgradeLevel()); }
export function buySparksUpgrade(): boolean { return buyUpgrade('sparks', sparksUpgradeNextCost()); }

// Coins upgrade
export function coinsUpgradeLevel(): number { return getUpgradeLevel('coins'); }
let _coinsMultCache = D1, _coinsMultCacheLvl = -1;
export function coinsUpgradeMult(): Decimal {
  const lvl = coinsUpgradeLevel();
  if (_coinsMultCacheLvl !== lvl) {
    _coinsMultCache = Decimal.pow(2, lvl);
    _coinsMultCacheLvl = lvl;
  }
  return _coinsMultCache;
}
export function coinsUpgradeNextCost(): Decimal { return Decimal.pow(2, coinsUpgradeLevel()); }
export function buyCoinsUpgrade(): boolean { return buyUpgrade('coins', coinsUpgradeNextCost()); }

// Cost helpers depending on upgrades
export function costOf(idx: number): Decimal {
  ensureTier(idx);
  const base = energyCostFor(idx);
  const lvl = genCostLevel(idx);
  if (lvl === 0) return base;
  const reduced = base.mul(Decimal.pow(0.5, lvl));
  return reduced.lt(1) ? D1 : reduced.floor();
}
export function prevGenNeeded(idx: number): Decimal {
  ensureTier(idx);
  const base = prevGenCostFor(idx);
  if (base.lte(0)) return base;
  const lvl = genCostLevel(idx);
  if (lvl === 0) return base;
  const reduced = base.mul(Decimal.pow(0.5, lvl));
  return reduced.lt(1) ? D1 : reduced.floor();
}

// Bulk-upgrade plan computation. Cost at level L = base × 2^L.
// To buy N levels starting at L: base × 2^L × (2^N − 1).
export function computeUpgradeBuyPlan(
  currentLevel: number,
  pct: number,
  maxLvl: number | null,
  base?: Decimal | number,
): { count: Decimal; cost: Decimal } {
  const baseD = (base && (base as Decimal).mul) ? (base as Decimal) : D((base as number) || 1);
  const nextCost = Decimal.pow(2, currentLevel).mul(baseD);
  const coins = state.coins;
  if (coins.lt(nextCost)) return { count: D0, cost: nextCost };

  const ratio = coins.div(nextCost);
  let maxN = ratio.add(1).log2().floor();
  if (!maxN.isFinite() || maxN.lt(1)) maxN = D1;

  if (maxLvl != null) {
    const remaining = D(Math.max(0, maxLvl - currentLevel));
    if (maxN.gt(remaining)) maxN = remaining;
  }

  let count = maxN;
  if (pct === 0) {
    count = maxN.gte(1) ? D1 : D0;
  } else if (pct != null && pct < 100) {
    count = count.mul(pct).div(100).floor();
    if (count.lt(1) && maxN.gte(1)) count = D1;
  }

  if (count.lte(0)) return { count: D0, cost: nextCost };

  const totalCost = nextCost.mul(Decimal.pow(2, count).sub(1));
  return { count, cost: totalCost };
}

export function applyUpgradeBuyPlan(id: string, plan: { count: Decimal; cost: Decimal }): boolean {
  if (plan.count.lte(0)) return false;
  if (state.coins.lt(plan.cost)) return false;
  state.coins = state.coins.sub(plan.cost);
  setUpgradeLevel(id, getUpgradeLevel(id) + plan.count.toNumber());
  return true;
}

export { SPARK_RATE };
