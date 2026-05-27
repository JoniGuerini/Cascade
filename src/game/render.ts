import Decimal from 'break_eternity.js';
import { D0, PROD_RATE } from './constants';
import { state, getUnlockedCount, ensureTier } from './state';
import {
  genUpgradeMult, genTotalUpgradeLevel, sparksUpgradeMult, sparksUpgradeLevel,
  coinsUpgradeLevel, costOf, prevGenNeeded, freeMode,
} from './upgrades';
import { canAffordOne, maxAffordable, buy } from './simulate';
import { fmt, fmtInt, fmtTier, formatElapsed } from './format';
import { runtime } from './runtime';

const ROW_GAP = 8;
const VIRTUAL_BUFFER = 5;
let measuredRowHeight = 66;
let lastVisibleCount = 0;
let lastBadgeWidth = '38px';

interface RowRefs {
  row: HTMLDivElement;
  owned: HTMLElement;
  rate: HTMLElement;
  milestones: HTMLElement;
  costEnergy: HTMLElement;
  costEnergyVal: HTMLElement;
  costPrev: HTMLElement;
  costPrevVal: HTMLElement;
  costPrevTier: HTMLElement;
  costSparks: HTMLElement;
  upgradeBadge: HTMLElement;
  buy1: HTMLButtonElement;
  buyMax: HTMLButtonElement;
}

const rowCache: Record<number, RowRefs> = {};

export function pulseBadge(idx: number) {
  const r = rowCache[idx];
  if (!r) return;
  const badge = r.row.querySelector('.tier-badge') as HTMLElement | null;
  if (!badge) return;
  badge.classList.remove('pulse');
  void badge.offsetWidth;
  badge.classList.add('pulse');
}

function getVisibleTierIndices(): number[] {
  const visible: number[] = [];
  let firstUnbought = state.bought.length;
  for (let i = 0; i < state.bought.length; i++) {
    if (state.bought[i].gt(0)) {
      visible.push(i);
    } else if (firstUnbought === state.bought.length) {
      firstUnbought = i;
    }
  }
  visible.push(firstUnbought);
  return visible;
}

function addRow(idx: number, rowsContainer: HTMLElement) {
  const row = document.createElement('div');
  row.className = 'gen-row';
  row.innerHTML = `
    <div><div class="tier-badge">${fmtTier(idx + 1)}</div></div>
    <div class="upgrade-cell"><button type="button" class="upgrade-pill" title="Upgrade this generator">+0</button></div>
    <div class="gen-num owned"></div>
    <div class="gen-num rate dim"></div>
    <div class="gen-num milestones dim"></div>
    <div class="cost-group">
      <span class="cost-energy">
        <svg class="cost-icon" viewBox="0 0 16 16" fill="currentColor" shape-rendering="geometricPrecision" aria-hidden="true">
          <path d="M10 1 L3 9 L7 9 L6 15 L13 7 L9 7 Z"/>
        </svg>
        <span class="cost-val"></span>
      </span>
      <span class="cost-prev"><span class="cost-prev-val"></span><span class="cost-prev-tier"></span></span>
      <span class="cost-sparks">
        <svg class="cost-icon" viewBox="0 0 16 16" fill="currentColor" shape-rendering="geometricPrecision" aria-hidden="true">
          <path d="M8 1 L10 6 L15 8 L10 10 L8 15 L6 10 L1 8 L6 6 Z"/>
        </svg>
        <span class="cost-val">1</span>
      </span>
    </div>
    <div><button type="button" class="buy-btn b1">Buy 1</button></div>
    <div><button type="button" class="buy-btn bmax">Max</button></div>
  `;
  rowsContainer.appendChild(row);

  const upgPill = row.querySelector('.upgrade-pill') as HTMLButtonElement;
  upgPill.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.bought[idx] || state.bought[idx].lte(0)) return;
    runtime.openUpgradePopover?.({ type: 'gen', idx }, e.currentTarget as HTMLElement);
  });

  const b1 = row.querySelector('.b1') as HTMLButtonElement;
  let holdTimer: number | null = null;
  let holdDelay = 200;
  const holdTick = () => {
    if (!rowCache[idx] || b1.disabled || !canAffordOne(idx)) { holdStop(); return; }
    buy(idx, 1, runtime.buyAmountPct, pulseBadge);
    holdDelay = Math.max(30, holdDelay * 0.85);
    holdTimer = window.setTimeout(holdTick, holdDelay);
  };
  const holdStop = () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    holdDelay = 200;
  };
  b1.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || b1.disabled) return;
    buy(idx, 1, runtime.buyAmountPct, pulseBadge);
    try { b1.setPointerCapture(e.pointerId); } catch (_) {}
    holdDelay = 200;
    holdTimer = window.setTimeout(holdTick, 400);
  });
  b1.addEventListener('pointerup', holdStop);
  b1.addEventListener('pointercancel', holdStop);

  const bmax = row.querySelector('.bmax') as HTMLButtonElement;
  bmax.addEventListener('click', () => buy(idx, 'max', runtime.buyAmountPct, pulseBadge));

  rowCache[idx] = {
    row,
    owned: row.querySelector('.owned') as HTMLElement,
    rate: row.querySelector('.rate') as HTMLElement,
    milestones: row.querySelector('.milestones') as HTMLElement,
    costEnergy: row.querySelector('.cost-energy') as HTMLElement,
    costEnergyVal: row.querySelector('.cost-energy .cost-val') as HTMLElement,
    costPrev: row.querySelector('.cost-prev') as HTMLElement,
    costPrevVal: row.querySelector('.cost-prev-val') as HTMLElement,
    costPrevTier: row.querySelector('.cost-prev-tier') as HTMLElement,
    costSparks: row.querySelector('.cost-sparks') as HTMLElement,
    upgradeBadge: upgPill,
    buy1: b1,
    buyMax: bmax,
  };
}

export function render(rowsContainer: HTMLElement, scrollEl: HTMLElement, maxTierEl: HTMLElement | null) {
  const setText = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el && el.textContent !== v) el.textContent = v;
  };
  setText('energy', fmt(state.energy));
  setText('rate', '+' + fmt((state.gens[0] || D0).mul(genUpgradeMult(0)).mul(PROD_RATE)));
  setText('sparks', fmt(state.sparks));
  const sparksFlowing = state.bought[0] && state.bought[0].gt(0);
  setText('spark-rate', sparksFlowing ? '+' + fmt(sparksUpgradeMult().mul(1)) : '+0');
  setText('coins', fmt(state.coins));

  const sparksLvl = sparksUpgradeLevel();
  const sparksPill = document.getElementById('sparks-upgrade-pill');
  if (sparksPill) {
    sparksPill.textContent = '+' + fmtInt(sparksLvl);
    sparksPill.classList.toggle('has-level', sparksLvl > 0);
  }
  const coinsLvl = coinsUpgradeLevel();
  const coinsPill = document.getElementById('coins-upgrade-pill');
  if (coinsPill) {
    coinsPill.textContent = '+' + fmtInt(coinsLvl);
    coinsPill.classList.toggle('has-level', coinsLvl > 0);
  }
  const maxTier = getUnlockedCount();
  const maxTierText = maxTier > 0 ? fmtTier(maxTier) : '—';
  if (maxTierEl && maxTierEl.textContent !== maxTierText) maxTierEl.textContent = maxTierText;

  const highestVisibleTier = Math.max(state.bought.length, maxTier + 1);
  const tierStrLen = fmtTier(highestVisibleTier).length;
  const badgeW = Math.max(38, tierStrLen * 8 + 20);
  const badgeWStr = badgeW + 'px';
  if (lastBadgeWidth !== badgeWStr) {
    document.documentElement.style.setProperty('--tier-badge-min', badgeWStr);
    lastBadgeWidth = badgeWStr;
  }

  const visible = getVisibleTierIndices();
  let newlyUnlocked: number | null = null;
  let wasNearBottom = false;
  if (visible.length > lastVisibleCount && lastVisibleCount > 0) {
    newlyUnlocked = visible[visible.length - 1];
    wasNearBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 80;
  }
  lastVisibleCount = visible.length;

  const anyRow = rowsContainer.querySelector('.gen-row') as HTMLElement | null;
  if (anyRow && anyRow.offsetHeight > 0) measuredRowHeight = anyRow.offsetHeight;
  const itemHeight = measuredRowHeight + ROW_GAP;
  rowsContainer.style.height = (visible.length * itemHeight - ROW_GAP) + 'px';

  const scrollTop = scrollEl.scrollTop;
  const clientHeight = scrollEl.clientHeight;
  const firstIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - VIRTUAL_BUFFER);
  const lastIdx = Math.min(visible.length - 1, Math.ceil((scrollTop + clientHeight) / itemHeight) + VIRTUAL_BUFFER);

  const tiersInView = new Set<number>();
  for (let i = firstIdx; i <= lastIdx; i++) tiersInView.add(visible[i]);

  for (const k of Object.keys(rowCache)) {
    const idx = +k;
    if (!tiersInView.has(idx)) {
      rowCache[idx].row.remove();
      delete rowCache[idx];
    }
  }

  for (let i = firstIdx; i <= lastIdx; i++) {
    const idx = visible[i];
    if (!rowCache[idx]) addRow(idx, rowsContainer);
    rowCache[idx].row.style.top = (i * itemHeight) + 'px';
  }

  if (newlyUnlocked !== null && rowCache[newlyUnlocked]) {
    const row = rowCache[newlyUnlocked].row;
    row.classList.remove('new-tier');
    void row.offsetWidth;
    row.classList.add('new-tier');
    setTimeout(() => row.classList.remove('new-tier'), 500);
  }

  if (wasNearBottom) {
    requestAnimationFrame(() => {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    });
  }

  for (const idx of tiersInView) {
    const r = rowCache[idx];
    const cost = costOf(idx);
    const prevCost = prevGenNeeded(idx);
    const hasEnergy = state.energy.gte(cost);
    const hasPrev = freeMode || idx === 0 || (state.gens[idx - 1] || D0).gte(prevCost);
    const hasSparks = state.sparks.gte(1);
    const canAfford = hasEnergy && hasPrev && hasSparks;
    const max = maxAffordable(idx, runtime.buyAmountPct);
    const owned = state.gens[idx] || D0;
    const isBought = (state.bought[idx] || D0).gt(0);
    const tierRate = owned.mul(genUpgradeMult(idx)).mul(PROD_RATE);

    r.row.classList.toggle('has-owned', isBought);
    r.row.classList.toggle('is-next', !isBought);

    const lvl = genTotalUpgradeLevel(idx);
    const lvlText = '+' + fmtInt(lvl);
    if (r.upgradeBadge.textContent !== lvlText) r.upgradeBadge.textContent = lvlText;
    r.upgradeBadge.classList.toggle('has-level', lvl > 0);

    r.owned.textContent = fmt(owned);
    r.owned.classList.toggle('muted', owned.lt(0.01));
    r.rate.textContent = owned.gt(0.01) ? '+' + fmt(tierRate) + '/s' : '—';
    r.rate.classList.toggle('muted', owned.lte(0.01));

    const milestonesReached = state.milestonesClaimed[idx] || D0;
    const hasMilestones = milestonesReached.gt(0);
    r.milestones.textContent = hasMilestones ? fmtInt(milestonesReached) : '—';
    r.milestones.classList.toggle('muted', !hasMilestones);

    r.costEnergyVal.textContent = fmt(cost);
    r.costEnergy.classList.toggle('lacking', !hasEnergy);
    const showPrev = idx > 0 && prevCost.gt(0);
    if (showPrev) {
      r.costPrevVal.textContent = fmt(prevCost);
      r.costPrevTier.textContent = fmtTier(idx);
    } else {
      r.costPrevVal.textContent = '';
      r.costPrevTier.textContent = '';
    }
    r.costPrev.style.display = showPrev ? '' : 'none';
    r.costPrev.classList.toggle('lacking', showPrev && !hasPrev);
    r.costSparks.classList.toggle('lacking', !hasSparks);

    if (r.buy1.disabled !== !canAfford) r.buy1.disabled = !canAfford;
    r.buy1.classList.toggle('afford', canAfford);
    const maxDisabled = max.count.lte(0);
    if (r.buyMax.disabled !== maxDisabled) r.buyMax.disabled = maxDisabled;
    const maxText = max.count.gt(0) ? '+' + fmtInt(max.count) : 'Max';
    if (r.buyMax.textContent !== maxText) r.buyMax.textContent = maxText;
  }

  const elapsedSeconds = runtime.isInSetup() ? 0 : Math.floor((Date.now() - state.startTime) / 1000);
  const elEl = document.getElementById('elapsed-text');
  if (elEl) elEl.textContent = formatElapsed(elapsedSeconds);
}
