import { SystemClock } from './clock';

describe('SystemClock', () => {
  it('reads the current time', () => {
    const before = Date.now();

    const now = new SystemClock().now();

    // Bounded rather than exact: the only claim worth making about a real clock
    // is that it falls inside the interval the test itself observed.
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('advances between reads', () => {
    const clock = new SystemClock();

    const first = clock.now();
    const second = clock.now();

    expect(second.getTime()).toBeGreaterThanOrEqual(first.getTime());
  });
});
