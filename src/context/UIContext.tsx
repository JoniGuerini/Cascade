import { createContext, useContext, useEffect, useReducer, useRef, ReactNode } from 'react';
import { runtime } from '../game/runtime';
import { setFreeMode as setFreeModeFlag } from '../game/upgrades';
import { ACCENT_THEMES } from '../game/constants';

export type ModalKind = 'setup' | 'reset' | 'leaderboard' | null;
export interface UpgradePopoverState {
  ctx: { type: 'gen' | 'sparks' | 'coins'; idx?: number };
  anchorRect: DOMRect;
}

const VALID_AMOUNTS = [1, 10, 50, 100];
const UPG_VALID_AMOUNTS = [0, 1, 10, 50, 100];

const initialState = (() => {
  const buyAmountPct = (() => {
    const v = parseInt(localStorage.getItem('cascade-buy-amount') || '100', 10);
    return VALID_AMOUNTS.includes(v) ? v : 100;
  })();
  const upgradeBuyAmountPct = (() => {
    const v = parseInt(localStorage.getItem('cascade-upgrade-buy-amount') || '100', 10);
    return UPG_VALID_AMOUNTS.includes(v) ? v : 100;
  })();
  const genCap = (() => {
    const v = parseInt(localStorage.getItem('cascade-gen-cap') || '0', 10);
    return (isFinite(v) && v >= 1) ? v : 0;
  })();
  const freeModeLocked = localStorage.getItem('cascade-freemode-locked') === '1';
  return {
    theme: (localStorage.getItem('cascade-theme') as 'light' | 'dark' | null)
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') as 'light' | 'dark',
    accent: localStorage.getItem('cascade-accent') || 'salmon',
    freeMode: localStorage.getItem('cascade-freemode') === '1',
    freeModeLocked,
    buyAmountPct,
    upgradeBuyAmountPct,
    genCap,
    autoBuy: localStorage.getItem('cascade-autobuy') === '1',
    fullAuto: localStorage.getItem('cascade-fullauto') === '1',
    equalizer: localStorage.getItem('cascade-equalizer') === '1',
    needsSetup: localStorage.getItem('cascade-needs-setup') === '1',
    activeModal: (localStorage.getItem('cascade-needs-setup') === '1' ? 'setup' : null) as ModalKind,
    paletteOpen: false,
    upgradePopover: null as UpgradePopoverState | null,
  };
})();

type State = typeof initialState;

type Action =
  | { type: 'set-theme'; theme: 'light' | 'dark' }
  | { type: 'set-accent'; accent: string }
  | { type: 'toggle-free-mode' }
  | { type: 'lock-free-mode'; value: boolean }
  | { type: 'set-buy-amount'; pct: number }
  | { type: 'set-upgrade-buy-amount'; pct: number }
  | { type: 'set-gen-cap'; cap: number }
  | { type: 'toggle-autobuy' }
  | { type: 'toggle-fullauto' }
  | { type: 'toggle-equalizer' }
  | { type: 'set-modal'; modal: ModalKind }
  | { type: 'set-palette-open'; open: boolean }
  | { type: 'set-upgrade-popover'; popover: UpgradePopoverState | null }
  | { type: 'mark-setup-done' };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set-theme': return { ...s, theme: a.theme };
    case 'set-accent': return { ...s, accent: a.accent };
    case 'toggle-free-mode':
      if (s.freeModeLocked) return s;
      return { ...s, freeMode: !s.freeMode };
    case 'lock-free-mode': return { ...s, freeModeLocked: a.value };
    case 'set-buy-amount': return { ...s, buyAmountPct: a.pct };
    case 'set-upgrade-buy-amount': return { ...s, upgradeBuyAmountPct: a.pct };
    case 'set-gen-cap': return { ...s, genCap: a.cap };
    case 'toggle-autobuy': return { ...s, autoBuy: !s.autoBuy };
    case 'toggle-fullauto': return { ...s, fullAuto: !s.fullAuto };
    case 'toggle-equalizer': return { ...s, equalizer: !s.equalizer };
    case 'set-modal': return { ...s, activeModal: a.modal };
    case 'set-palette-open': return { ...s, paletteOpen: a.open };
    case 'set-upgrade-popover': return { ...s, upgradePopover: a.popover };
    case 'mark-setup-done': return { ...s, needsSetup: false, activeModal: null };
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const prev = useRef(state);

  // Persist single-value flags + push to runtime
  useEffect(() => {
    localStorage.setItem('cascade-theme', state.theme);
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('cascade-accent', state.accent);
    applyAccent(state.accent, state.theme === 'dark');
  }, [state.accent, state.theme]);

  useEffect(() => {
    setFreeModeFlag(state.freeMode);
    document.documentElement.classList.toggle('freemode', state.freeMode);
  }, [state.freeMode]);

  useEffect(() => {
    if (state.freeModeLocked) localStorage.setItem('cascade-freemode-locked', '1');
    else localStorage.removeItem('cascade-freemode-locked');
  }, [state.freeModeLocked]);

  useEffect(() => {
    runtime.buyAmountPct = state.buyAmountPct;
    localStorage.setItem('cascade-buy-amount', String(state.buyAmountPct));
  }, [state.buyAmountPct]);

  useEffect(() => {
    runtime.upgradeBuyAmountPct = state.upgradeBuyAmountPct;
    localStorage.setItem('cascade-upgrade-buy-amount', String(state.upgradeBuyAmountPct));
  }, [state.upgradeBuyAmountPct]);

  useEffect(() => {
    runtime.genCap = state.genCap;
    if (state.genCap > 0) localStorage.setItem('cascade-gen-cap', String(state.genCap));
    else localStorage.removeItem('cascade-gen-cap');
  }, [state.genCap]);

  useEffect(() => {
    runtime.autoBuy = state.autoBuy;
    localStorage.setItem('cascade-autobuy', state.autoBuy ? '1' : '0');
  }, [state.autoBuy]);

  useEffect(() => {
    runtime.fullAuto = state.fullAuto;
    localStorage.setItem('cascade-fullauto', state.fullAuto ? '1' : '0');
  }, [state.fullAuto]);

  useEffect(() => {
    runtime.equalizer = state.equalizer;
    localStorage.setItem('cascade-equalizer', state.equalizer ? '1' : '0');
  }, [state.equalizer]);

  prev.current = state;

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI must be inside UIProvider');
  return v;
}

// Accent application — keeps the imperative DOM mutation since it touches every
// swatch and CSS custom property on :root.
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function applyAccent(key: string, isDark: boolean) {
  const theme = ACCENT_THEMES[key] || ACCENT_THEMES.salmon;
  const accent = isDark ? theme.dark : theme.light;
  const softAlpha = isDark ? 0.14 : 0.10;
  const isLightAccent = luminance(accent) > 0.6;
  const accentText = isLightAccent ? '#0a0a0a' : '#ffffff';
  const accentTextSoft = isLightAccent ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.85)';
  const root = document.documentElement.style;
  root.setProperty('--accent', accent);
  root.setProperty('--accent-text', accentText);
  root.setProperty('--accent-text-soft', accentTextSoft);
  root.setProperty('--accent-soft', hexToRgba(accent, softAlpha));
  root.setProperty('--ring', hexToRgba(accent, isDark ? 0.28 : 0.20));
  root.setProperty('--accent-glow', hexToRgba(accent, isDark ? 0.32 : 0.40));
  document.querySelectorAll<HTMLElement>('.swatch').forEach(s => {
    const k = s.dataset.accent || '';
    const swatchTheme = ACCENT_THEMES[k];
    if (swatchTheme) s.style.setProperty('--c', isDark ? swatchTheme.dark : swatchTheme.light);
    s.classList.toggle('selected', k === key);
  });
}
