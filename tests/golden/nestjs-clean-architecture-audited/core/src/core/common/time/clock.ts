/**
 * The clock the audited use cases read.
 *
 * A port rather than a direct `new Date()` so that generated tests can state
 * exactly what "now" was: an assertion about a timestamp the code invented is
 * either tautological or flaky.
 *
 * The concrete implementation lives here, in the Core, rather than in the
 * persistence adapter. It depends on nothing but a JavaScript builtin, which is
 * the same latitude the Core already takes with `Date` in its own models, and
 * routing a one-line wrapper through infrastructure would add a hop for no
 * architectural gain.
 */
export interface IClock {
  now(): Date;
}

export const IClockSymbol = Symbol('IClock');

export class SystemClock implements IClock {
  public now(): Date {
    return new Date();
  }
}
