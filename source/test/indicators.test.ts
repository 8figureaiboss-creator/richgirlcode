import { describe, expect, it } from 'vitest';
import { bollinger, ema, macd, rsi, sma, vwap } from '../shared/indicators';
import { nyToUtc } from '../shared/time';

describe('indicators', () => {
  it('SMA', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('EMA seeds with SMA then smooths', () => {
    const e = ema([1, 2, 3, 4], 3);
    expect(e[2]).toBe(2);
    expect(e[3]).toBeCloseTo(3, 10); // 4*0.5 + 2*0.5
  });

  it('RSI is 100 for a series that only rises and ~50 for a perfect zig-zag', () => {
    const up = Array.from({ length: 30 }, (_, i) => i + 1);
    expect(rsi(up, 14)[29]).toBe(100);
    const zig = Array.from({ length: 60 }, (_, i) => (i % 2 ? 11 : 10));
    expect(rsi(zig, 14)[59]).toBeGreaterThan(45);
    expect(rsi(zig, 14)[59]).toBeLessThan(55);
  });

  it('MACD of a flat series is zero', () => {
    const flat = new Array(50).fill(7);
    const m = macd(flat);
    expect(m.line[49]).toBeCloseTo(0, 10);
    expect(m.signal[49]).toBeCloseTo(0, 10);
    expect(m.hist[49]).toBeCloseTo(0, 10);
    expect(m.signal[33]).not.toBeNull(); // 26 + 9 - 2
    expect(m.signal[32]).toBeNull();
  });

  it('Bollinger bands collapse onto the mean for a flat series', () => {
    const b = bollinger(new Array(25).fill(3), 20, 2);
    expect(b.upper[24]).toBe(3);
    expect(b.lower[24]).toBe(3);
  });

  it('VWAP resets at each New York trading day', () => {
    const bars = [
      { t: nyToUtc('2026-11-02', '09:30'), o: 10, h: 10, l: 10, c: 10, v: 100 },
      { t: nyToUtc('2026-11-02', '09:31'), o: 20, h: 20, l: 20, c: 20, v: 100 },
      { t: nyToUtc('2026-11-03', '09:30'), o: 50, h: 50, l: 50, c: 50, v: 1 },
    ];
    expect(vwap(bars)).toEqual([10, 15, 50]);
  });
});
