import Decimal from 'break_eternity.js';

export const PROD_RATE = 0.1;
export const SPARK_RATE = 1;
export const SAVE_KEY = 'cascade-save-v5';
export const THEME_KEY = 'cascade-theme';
export const ACCENT_KEY = 'cascade-accent';

export const D = (v: number | string | Decimal): Decimal => new Decimal(v);
export const D0 = D(0);
export const D1 = D(1);

export const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];

export const ACCENT_THEMES: Record<string, { light: string; dark: string }> = (() => {
  const fixed = (c: string) => ({ light: c, dark: c });
  return {
    salmon:  fixed('#e85d39'),
    red:     fixed('#dc2626'),
    maroon:  fixed('#7f1d1d'),
    amber:   fixed('#d97706'),
    yellow:  fixed('#ca8a04'),
    brown:   fixed('#7c4a1e'),
    olive:   fixed('#4d7c0f'),
    lime:    fixed('#65a30d'),
    teal:    fixed('#0d9488'),
    blue:    fixed('#2563eb'),
    indigo:  fixed('#4338ca'),
    purple:  fixed('#9333ea'),
    magenta: fixed('#a21caf'),
    pink:    fixed('#db2777'),
    slate:   fixed('#475569'),
    black:   fixed('#0a0a0a'),
    white:   fixed('#fafafa'),
  };
})();
