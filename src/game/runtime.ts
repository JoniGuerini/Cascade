// Mutable runtime — the React UI layer writes into this; the game loop reads from it.
// Kept outside React state because the game loop runs at 60Hz and we want zero
// React re-renders from these reads.

export interface UpgradeContext {
  type: 'gen' | 'sparks' | 'coins';
  idx?: number;
}

export interface Runtime {
  buyAmountPct: number;
  upgradeBuyAmountPct: number;
  autoBuy: boolean;
  fullAuto: boolean;
  equalizer: boolean;
  genCap: number;
  isInSetup: () => boolean;
  openUpgradePopover?: (ctx: UpgradeContext, anchor: HTMLElement) => void;
}

export const runtime: Runtime = {
  buyAmountPct: 100,
  upgradeBuyAmountPct: 100,
  autoBuy: false,
  fullAuto: false,
  equalizer: false,
  genCap: 0,
  isInSetup: () => false,
};
