import Decimal from 'break_eternity.js';
import { D, D0, PROD_RATE, SPARK_RATE } from './constants';
import { state } from './state';
import { genUpgradeMult, sparksUpgradeMult, coinsUpgradeMult, costOf, prevGenNeeded, freeMode } from './upgrades';
import { ensureTier, bumpUnlockedCount } from './state';

let _milestoneAccum = 0;

export function simulate(dt: number) {
  const factorD = D(PROD_RATE * dt);
  const n = state.gens.length;
  for (let i = n - 1; i > 0; i--) {
    const g = state.gens[i];
    if (g.sign === 0) continue;
    state.gens[i - 1] = state.gens[i - 1].add(g.mul(genUpgradeMult(i)).mul(factorD));
  }
  if (state.gens[0].sign !== 0) {
    state.energy = state.energy.add(state.gens[0].mul(genUpgradeMult(0)).mul(factorD));
  }
  if (state.bought[0] && state.bought[0].gt(0)) {
    state.sparks = state.sparks.add(sparksUpgradeMult().mul(SPARK_RATE * dt));
  }
  _milestoneAccum += dt;
  if (_milestoneAccum >= 0.5) {
    _milestoneAccum = 0;
    checkMilestones();
  }
}

export function checkMilestones() {
  for (let i = 0; i < state.gens.length; i++) {
    const gen = state.gens[i];
    if (!gen || gen.lt(10) || !gen.isFinite()) continue;
    const claimedNow = gen.log10().floor();
    if (!claimedNow.isFinite()) continue;
    const claimed = state.milestonesClaimed[i] || D0;
    if (claimedNow.gt(claimed)) {
      const diff = claimedNow.sub(claimed);
      state.coins = state.coins.add(coinsUpgradeMult().mul(diff));
      state.milestonesClaimed[i] = claimedNow;
    }
  }
}

export function canAffordOne(idx: number): boolean {
  const e = costOf(idx);
  const p = prevGenNeeded(idx);
  if (state.energy.lt(e)) return false;
  if (state.sparks.lt(1)) return false;
  if (!freeMode && idx > 0 && (state.gens[idx - 1] || D0).lt(p)) return false;
  return true;
}

export function maxAffordable(idx: number, pct: number): { count: Decimal; energyCost: Decimal; prevCost: Decimal; sparkCost: Decimal } {
  const e = costOf(idx);
  const p = prevGenNeeded(idx);
  const maxByEnergy = state.energy.div(e).floor();
  const maxBySparks = state.sparks.floor();
  let maxByPrev: Decimal | null = null;
  if (!freeMode && idx > 0 && p.gt(0)) {
    maxByPrev = (state.gens[idx - 1] || D0).div(p).floor();
  }
  let count = maxByEnergy;
  if (maxBySparks.lt(count)) count = maxBySparks;
  if (maxByPrev !== null && maxByPrev.lt(count)) count = maxByPrev;
  if (count.lt(0)) count = D0;
  if (pct != null && pct < 100) {
    count = count.mul(pct).div(100).floor();
  }
  return { count, energyCost: count.mul(e), prevCost: count.mul(p), sparkCost: count };
}

export function buy(idx: number, count: number | 'max', buyAmountPct: number, onPulse?: (idx: number) => void) {
  ensureTier(idx);
  const wasUnlocked = state.bought[idx].gt(0);
  if (count === 'max') {
    const m = maxAffordable(idx, buyAmountPct);
    if (m.count.lte(0)) return;
    state.energy = state.energy.sub(m.energyCost);
    state.sparks = state.sparks.sub(m.sparkCost);
    if (!freeMode && idx > 0) state.gens[idx - 1] = state.gens[idx - 1].sub(m.prevCost);
    state.gens[idx] = state.gens[idx].add(m.count);
    state.bought[idx] = state.bought[idx].add(m.count);
  } else {
    if (!canAffordOne(idx)) return;
    state.energy = state.energy.sub(costOf(idx));
    state.sparks = state.sparks.sub(1);
    if (!freeMode && idx > 0) state.gens[idx - 1] = state.gens[idx - 1].sub(prevGenNeeded(idx));
    state.gens[idx] = state.gens[idx].add(1);
    state.bought[idx] = state.bought[idx].add(1);
  }
  if (!wasUnlocked && state.bought[idx].gt(0)) bumpUnlockedCount();
  if (onPulse) onPulse(idx);
}
