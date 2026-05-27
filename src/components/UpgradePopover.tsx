import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Decimal from 'break_eternity.js';
import { useUI } from '../context/UIContext';
import { fmt, fmtInt } from '../game/format';
import { D0, D1, SPARK_RATE } from '../game/constants';
import {
  genUpgradeLevel, genUpgradeBase, genCostLevel, genCostMaxLevel,
  sparksUpgradeLevel, coinsUpgradeLevel,
  computeUpgradeBuyPlan, applyUpgradeBuyPlan,
  genUpgradeKey, genCostKey,
} from '../game/upgrades';

const UPG_AMOUNTS = [
  { label: '1', pct: 0 },
  { label: '1%', pct: 1 },
  { label: '10%', pct: 10 },
  { label: '50%', pct: 50 },
  { label: 'Max', pct: 100 },
];

export function UpgradePopover() {
  const { state, dispatch } = useUI();
  const pop = state.upgradePopover;
  const ref = useRef<HTMLDivElement>(null);
  // Tick state to refresh popover during hold-buy
  const [, force] = useState(0);
  useEffect(() => {
    if (!pop) return;
    const id = window.setInterval(() => force(t => t + 1), 100);
    return () => clearInterval(id);
  }, [pop]);

  useEffect(() => {
    if (!pop) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      // Clicking another upgrade pill should swap the popover, not close it —
      // the pill's onClick already dispatched the new anchor.
      if ((e.target as Element)?.closest?.('.upgrade-pill')) return;
      dispatch({ type: 'set-upgrade-popover', popover: null });
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [pop, dispatch]);

  useLayoutEffect(() => {
    if (!pop || !ref.current) return;
    const r = pop.anchorRect;
    const popH = ref.current.offsetHeight;
    const popW = ref.current.offsetWidth;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const margin = 16;
    let top = r.top + r.height / 2 - popH / 2;
    if (top + popH > vh - margin) top = vh - margin - popH;
    if (top < margin) top = margin;
    let left = r.right + 12;
    if (left + popW > vw - margin) left = r.left - popW - 12;
    if (left < margin) left = margin;
    ref.current.style.left = left + 'px';
    ref.current.style.top = top + 'px';
  }, [pop]);

  if (!pop) return null;

  const pct = state.upgradeBuyAmountPct;
  const ctx = pop.ctx;
  let title = '—';
  let prodName = 'Production';
  let prodMetricLabel = 'Multiplier';
  let prodLvl = 0;
  let prodMetric: string = '1x';
  let prodPlan = { count: D0 as Decimal, cost: D1 as Decimal };
  let prodId = '';
  let showCost = false;
  let costLvl = 0;
  let costMetric = '100%';
  let costPlan = { count: D0 as Decimal, cost: D1 as Decimal };
  let costAtMax = false;
  let costAvailable = true;
  let costId = '';

  if (ctx.type === 'gen' && ctx.idx != null) {
    const idx = ctx.idx;
    title = 'Generator ' + (idx + 1);
    prodId = genUpgradeKey(idx);
    prodLvl = genUpgradeLevel(idx);
    prodMetric = fmt(Decimal.pow(2, prodLvl)) + 'x';
    prodPlan = computeUpgradeBuyPlan(prodLvl, pct, null, genUpgradeBase(idx));

    showCost = true;
    costId = genCostKey(idx);
    costLvl = genCostLevel(idx);
    const cMaxLvl = genCostMaxLevel(idx);
    const cMult = Decimal.pow(0.5, costLvl);
    const cPctDec = cMult.mul(100);
    if (costLvl === 0) costMetric = '100%';
    else if (cPctDec.gte(1)) costMetric = Math.round(cPctDec.toNumber()) + '%';
    else if (cPctDec.gte(0.01)) costMetric = cPctDec.toNumber().toFixed(2) + '%';
    else costMetric = '<0.01%';
    costAvailable = cMaxLvl > 0;
    costAtMax = costAvailable && costLvl >= cMaxLvl;
    costPlan = costAvailable && !costAtMax
      ? computeUpgradeBuyPlan(costLvl, pct, cMaxLvl, genUpgradeBase(idx))
      : { count: D0, cost: D0 };
  } else if (ctx.type === 'sparks') {
    title = 'Sparks';
    prodName = 'Production rate';
    prodMetricLabel = 'Per second';
    prodId = 'sparks';
    prodLvl = sparksUpgradeLevel();
    prodMetric = fmt(Decimal.pow(2, prodLvl).mul(SPARK_RATE));
    prodPlan = computeUpgradeBuyPlan(prodLvl, pct, null);
  } else if (ctx.type === 'coins') {
    title = 'Coins';
    prodName = 'Reward per milestone';
    prodMetricLabel = 'Per milestone';
    prodId = 'coins';
    prodLvl = coinsUpgradeLevel();
    prodMetric = fmt(Decimal.pow(2, prodLvl));
    prodPlan = computeUpgradeBuyPlan(prodLvl, pct, null);
  }

  const buyProd = () => {
    if (prodPlan.count.lte(0)) return false;
    return applyUpgradeBuyPlan(prodId, prodPlan);
  };
  const buyCost = () => {
    if (!costAvailable || costAtMax || costPlan.count.lte(0)) return false;
    return applyUpgradeBuyPlan(costId, costPlan);
  };

  const renderBuyButton = (
    label: string, plan: { count: Decimal; cost: Decimal }, onClick: () => boolean, disabled = false,
  ) => {
    const isOne = plan.cost.eq(1);
    const labelText = plan.count.gt(1) ? `${label} ×${fmtInt(plan.count)}` : label;
    return (
      <button
        className="btn-modal accent upgrade-buy"
        disabled={disabled || plan.count.lte(0)}
        onPointerDown={createHoldHandler(onClick)}
      >
        <span className="upgrade-buy-label">{labelText}</span>
        <span className="upgrade-buy-cost">{fmt(plan.cost)} coin{isOne ? '' : 's'}</span>
      </button>
    );
  };

  return (
    <div ref={ref} className="upgrade-popover" onClick={(e) => e.stopPropagation()}>
      <div className="upgrade-popover-header">
        <div className="upgrade-popover-title">{title}</div>
        <div className="amount-segment upg-segment">
          {UPG_AMOUNTS.map(a => (
            <button
              key={a.pct}
              className={'seg-btn' + (pct === a.pct ? ' selected' : '')}
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'set-upgrade-buy-amount', pct: a.pct }); }}
            >{a.label}</button>
          ))}
        </div>
      </div>

      <div className="upgrade-section">
        <div className="upgrade-section-name">{prodName}</div>
        <div className="upgrade-stat-grid">
          <div className="upgrade-stat">
            <div className="upgrade-stat-label">Level</div>
            <div className="upgrade-stat-value">{fmtInt(prodLvl)}</div>
          </div>
          <div className="upgrade-stat">
            <div className="upgrade-stat-label">{prodMetricLabel}</div>
            <div className="upgrade-stat-value">{prodMetric}</div>
          </div>
        </div>
        {renderBuyButton('Upgrade', prodPlan, buyProd)}
      </div>

      {showCost && (
        <div className="upgrade-section">
          <div className="upgrade-section-name">Cost reduction</div>
          <div className="upgrade-stat-grid">
            <div className="upgrade-stat">
              <div className="upgrade-stat-label">Level</div>
              <div className="upgrade-stat-value">{fmtInt(costLvl)}</div>
            </div>
            <div className="upgrade-stat">
              <div className="upgrade-stat-label">Cost factor</div>
              <div className="upgrade-stat-value">{costMetric}</div>
            </div>
          </div>
          {!costAvailable ? (
            <button className="btn-modal accent upgrade-buy" disabled>
              <span className="upgrade-buy-label">Not available</span>
              <span className="upgrade-buy-cost"></span>
            </button>
          ) : costAtMax ? (
            <button className="btn-modal accent upgrade-buy" disabled>
              <span className="upgrade-buy-label">MAX</span>
              <span className="upgrade-buy-cost"></span>
            </button>
          ) : (
            renderBuyButton('Upgrade', costPlan, buyCost)
          )}
        </div>
      )}
    </div>
  );
}

function createHoldHandler(buyFn: () => boolean) {
  return (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const btn = e.currentTarget;
    if (btn.disabled) return;
    e.stopPropagation();
    if (!buyFn()) return;
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    let delay = 200;
    let timer: number | null = null;
    const tick = () => {
      if (btn.disabled || !buyFn()) { stop(); return; }
      delay = Math.max(30, delay * 0.85);
      timer = window.setTimeout(tick, delay);
    };
    const stop = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      btn.removeEventListener('pointerup', stop);
      btn.removeEventListener('pointercancel', stop);
    };
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    timer = window.setTimeout(tick, 400);
  };
}
