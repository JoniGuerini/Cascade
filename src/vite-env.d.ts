/// <reference types="vite/client" />

declare module 'break_eternity.js' {
  // Minimal typing for break_eternity. The lib exposes Decimal as both a class
  // and the default export. We use it as a value, not for deep type-safety.
  type DecimalSource = number | string | Decimal;
  class Decimal {
    constructor(value?: DecimalSource);
    sign: number;
    add(v: DecimalSource): Decimal;
    sub(v: DecimalSource): Decimal;
    mul(v: DecimalSource): Decimal;
    div(v: DecimalSource): Decimal;
    pow(v: DecimalSource): Decimal;
    log10(): Decimal;
    log2(): Decimal;
    floor(): Decimal;
    eq(v: DecimalSource): boolean;
    gt(v: DecimalSource): boolean;
    gte(v: DecimalSource): boolean;
    lt(v: DecimalSource): boolean;
    lte(v: DecimalSource): boolean;
    isFinite(): boolean;
    toNumber(): number;
    toString(): string;
    static pow(base: DecimalSource, exp: DecimalSource): Decimal;
  }
  export default Decimal;
  export { Decimal, DecimalSource };
}
