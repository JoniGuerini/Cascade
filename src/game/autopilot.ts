import { D0, D1 } from './constants';
import { state, ensureTier, invalidateUnlockedCount } from './state';
import {
  genUpgradeKey, genUpgradeLevel, genUpgradeBase,
  genCostKey, genCostLevel, genCostMaxLevel,
  sparksUpgradeLevel, coinsUpgradeLevel,
  computeUpgradeBuyPlan, applyUpgradeBuyPlan,
} from './upgrades';
import { canAffordOne, buy } from './simulate';

export interface AutopilotFlags {
  autoBuy: boolean;
  fullAuto: boolean;
  equalizer: boolean;
  buyAmountPct: number;
  upgradeBuyAmountPct: number;
  genCap: number;
  isInSetup: () => boolean;
  onPulse?: (idx: number) => void;
}

let autoBuyAccum = 0;
let equalizerAccum = 0;
let fullAutoAccum = 0;
let fullAutoQueueIdx = 0;

export function resetFullAutoQueue() { fullAutoQueueIdx = 0; }

function maxAutoGenIdx(genCap: number): number {
  return genCap > 0 ? genCap - 1 : Infinity;
}

export function tryAutoBuy(dt: number, f: AutopilotFlags) {
  if (!f.autoBuy || f.fullAuto || f.isInSetup()) return;
  autoBuyAccum += dt;
  if (autoBuyAccum < 0.1) return;
  autoBuyAccum = 0;
  const cap = maxAutoGenIdx(f.genCap);
  let targetIdx = -1;
  const scanLimit = Math.min(state.bought.length, cap + 1);
  for (let i = 0; i < scanLimit; i++) {
    if (state.bought[i].lte(0)) { targetIdx = i; break; }
  }
  if (targetIdx === -1) {
    const next = state.bought.length;
    if (next <= cap) {
      targetIdx = next;
      ensureTier(targetIdx);
    }
  }
  if (targetIdx >= 0 && targetIdx <= cap && canAffordOne(targetIdx)) {
    buy(targetIdx, 'max', f.buyAmountPct, f.onPulse);
  }
}

export function tryEqualizer(dt: number, f: AutopilotFlags) {
  if (!f.equalizer || f.isInSetup()) return;
  equalizerAccum += dt;
  if (equalizerAccum < 0.1) return;
  equalizerAccum = 0;

  const owned: number[] = [];
  for (let i = 0; i < state.gens.length; i++) {
    if (state.bought[i] && state.bought[i].gt(0)) owned.push(i);
  }
  if (owned.length === 0) return;

  let minProdLvl = Infinity;
  for (const idx of owned) minProdLvl = Math.min(minProdLvl, genUpgradeLevel(idx));
  for (const idx of owned) {
    if (genUpgradeLevel(idx) !== minProdLvl) continue;
    const plan = computeUpgradeBuyPlan(minProdLvl, 0, null, genUpgradeBase(idx));
    if (plan.count.lte(0)) break;
    applyUpgradeBuyPlan(genUpgradeKey(idx), plan);
  }

  const costEligible = owned.filter(i => genCostMaxLevel(i) > 0);
  if (costEligible.length === 0) return;
  let minCostLvl = Infinity;
  for (const idx of costEligible) minCostLvl = Math.min(minCostLvl, genCostLevel(idx));
  for (const idx of costEligible) {
    if (genCostLevel(idx) !== minCostLvl) continue;
    if (minCostLvl >= genCostMaxLevel(idx)) continue;
    const plan = computeUpgradeBuyPlan(minCostLvl, 0, genCostMaxLevel(idx), genUpgradeBase(idx));
    if (plan.count.lte(0)) break;
    applyUpgradeBuyPlan(genCostKey(idx), plan);
  }
}

export function tryFullAuto(dt: number, f: AutopilotFlags) {
  if (!f.fullAuto || f.isInSetup()) return;
  fullAutoAccum += dt;
  if (fullAutoAccum < 0.1) return;
  fullAutoAccum = 0;

  const slot = fullAutoQueueIdx;
  if (slot === 0) {
    const lvl = coinsUpgradeLevel();
    const plan = computeUpgradeBuyPlan(lvl, f.upgradeBuyAmountPct, null);
    if (plan.count.gt(0)) applyUpgradeBuyPlan('coins', plan);
  } else if (slot === 1) {
    const lvl = sparksUpgradeLevel();
    const plan = computeUpgradeBuyPlan(lvl, f.upgradeBuyAmountPct, null);
    if (plan.count.gt(0)) applyUpgradeBuyPlan('sparks', plan);
  } else if (slot === 2) {
    const cap = maxAutoGenIdx(f.genCap);
    let targetIdx = -1;
    const scanLimit = Math.min(state.bought.length, cap + 1);
    for (let i = 0; i < scanLimit; i++) {
      if (state.bought[i].lte(0)) { targetIdx = i; break; }
    }
    if (targetIdx === -1) {
      const next = state.bought.length;
      if (next <= cap) {
        targetIdx = next;
        ensureTier(targetIdx);
      }
    }
    if (targetIdx >= 0 && targetIdx <= cap && canAffordOne(targetIdx)) {
      buy(targetIdx, 'max', f.buyAmountPct, f.onPulse);
    } else {
      const startIdx = Math.min(state.bought.length - 1, cap);
      for (let i = startIdx; i >= 0; i--) {
        if (state.bought[i].gt(0) && canAffordOne(i)) { buy(i, 'max', f.buyAmountPct, f.onPulse); break; }
      }
    }
  } else {
    for (let i = state.gens.length - 1; i >= 0; i--) {
      if (!state.bought[i] || state.bought[i].lte(0)) continue;
      const base = genUpgradeBase(i);
      const pLvl = genUpgradeLevel(i);
      const pPlan = computeUpgradeBuyPlan(pLvl, f.upgradeBuyAmountPct, null, base);
      const cMaxLvl = genCostMaxLevel(i);
      const cLvlGen = genCostLevel(i);
      const cAvailable = cMaxLvl > 0 && cLvlGen < cMaxLvl;
      const cPlanGen = cAvailable
        ? computeUpgradeBuyPlan(cLvlGen, f.upgradeBuyAmountPct, cMaxLvl, base)
        : { count: D0, cost: D0 };
      if (pPlan.count.gt(0) || cPlanGen.count.gt(0)) {
        if (pPlan.count.gt(0)) applyUpgradeBuyPlan(genUpgradeKey(i), pPlan);
        if (cPlanGen.count.gt(0)) applyUpgradeBuyPlan(genCostKey(i), cPlanGen);
        break;
      }
    }
  }
  fullAutoQueueIdx = (fullAutoQueueIdx + 1) % 4;
}

export function stressTest(batch = 1000) {
  let nextIdx = 0;
  for (let i = state.bought.length - 1; i >= 0; i--) {
    if (state.bought[i].gt(0)) { nextIdx = i + 1; break; }
  }
  const endIdx = nextIdx + batch;
  ensureTier(endIdx - 1);
  for (let i = nextIdx; i < endIdx; i++) {
    if (state.bought[i].lte(0)) {
      state.bought[i] = D1;
      if (state.gens[i].lt(1)) state.gens[i] = D1;
    }
  }
  invalidateUnlockedCount();
}
