import Decimal from 'break_eternity.js';
import { D, SUFFIXES } from './constants';

export function letterSuffix(idx: number): string {
  // 0='aa', 1='ab'... 25='az', 26='ba'... 675='zz', 676='aaa'...
  let len = 2;
  let block = 26 * 26;
  let i = idx;
  while (i >= block) {
    i -= block;
    len++;
    block *= 26;
  }
  let result = '';
  for (let j = 0; j < len; j++) {
    result = String.fromCharCode(97 + (i % 26)) + result;
    i = Math.floor(i / 26);
  }
  return result;
}

export function fmt(n: Decimal | number | null | undefined): string {
  if (n == null) return '0';
  const d: Decimal = typeof n === 'number' ? D(n) : n;
  if (!d.isFinite()) return '∞';
  if (d.lt(0.01)) return '0';
  if (d.lt(1000)) {
    const v = d.toNumber();
    if (v < 10) return v.toFixed(2);
    if (v < 100) return v.toFixed(1);
    return Math.floor(v).toString();
  }
  const log = d.log10();
  let tierD = log.div(3).floor();
  let mantissa = d.div(Decimal.pow(10, tierD.mul(3))).toNumber();
  if (!isFinite(mantissa)) return d.toString();
  if (mantissa >= 999.995) {
    mantissa /= 1000;
    tierD = tierD.add(1);
  }
  const tier = tierD.toNumber();
  if (!isFinite(tier)) return d.toString();
  const suffix = tier < SUFFIXES.length ? SUFFIXES[tier] : letterSuffix(tier - SUFFIXES.length);
  const numStr = mantissa.toFixed(2);
  return suffix ? numStr + ' ' + suffix : numStr;
}

export function fmtInt(n: Decimal | number): string {
  const d: Decimal = typeof n === 'number' ? D(n) : n;
  if (d.lt(1000)) return Math.floor(d.toNumber()).toString();
  return fmt(d);
}

export function fmtTier(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function formatElapsed(elapsed: number): string {
  const MINUTE = 60, HOUR = 3600, DAY = 86400, MONTH = 30 * DAY, YEAR = 365 * DAY;
  if (elapsed >= YEAR) {
    const y = Math.floor(elapsed / YEAR);
    const mo = Math.floor((elapsed % YEAR) / MONTH);
    return y + 'y ' + mo + 'mo';
  }
  if (elapsed >= MONTH) {
    const mo = Math.floor(elapsed / MONTH);
    const d = Math.floor((elapsed % MONTH) / DAY);
    return mo + 'mo ' + d + 'd';
  }
  if (elapsed >= DAY) {
    const d = Math.floor(elapsed / DAY);
    const h = Math.floor((elapsed % DAY) / HOUR);
    return d + 'd ' + h + 'h';
  }
  if (elapsed >= HOUR) {
    const h = Math.floor(elapsed / HOUR);
    const m = Math.floor((elapsed % HOUR) / MINUTE);
    return h + 'h ' + m + 'm';
  }
  if (elapsed >= MINUTE) {
    const m = Math.floor(elapsed / MINUTE);
    const s = elapsed % 60;
    return m + 'm ' + s + 's';
  }
  return elapsed + 's';
}
