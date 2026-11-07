import { describe, expect, it } from 'vitest';
import { aggregate, bucketOf, calendarFrom, normalizeDaily, sessionFromAlpaca } from '../shared/candles';
import { nyDate, nyToUtc } from '../shared/time';
import type { Bar } from '../shared/types';

// Calendar rows shaped like Alpaca's /v2/calendar response. These are calendar fixtures, not prices.
const cal = calendarFrom(
  [
    { date: '2026-10-30', open: '09:30', close: '16:00', session_open: '0400', session_close: '2000' }, // EDT
    { date: '2026-11-02', open: '09:30', close: '16:00', session_open: '0400', session_close: '2000' }, // EST (DST ended Nov 1)
    { date: '2026-11-25', open: '09:30', close: '16:00', session_open: '0400', session_close: '2000' },
    // 2026-11-26 Thanksgiving: market closed, no row
    { date: '2026-11-27', open: '09:30', close: '13:00', session_open: '0400', session_close: '1700' }, // half day
  ].map(sessionFromAlpaca),
);

const iso = (s: number) => new Date(s * 1000).toISOString();

describe('New York time', () => {
  it('handles DST on both sides of the switch', () => {
    expect(iso(nyToUtc('2026-10-30', '09:30'))).toBe('2026-10-30T13:30:00.000Z'); // EDT, UTC-4
    expect(iso(nyToUtc('2026-11-02', '09:30'))).toBe('2026-11-02T14:30:00.000Z'); // EST, UTC-5
    expect(nyDate(nyToUtc('2026-11-02', '23:59'))).toBe('2026-11-02');
  });
});

describe('bucketOf', () => {
  const t = (d: string, hm: string) => nyToUtc(d, hm);

  it('anchors regular-hours 1H candles at 9:30', () => {
    expect(bucketOf(t('2026-11-02', '09:30'), '1H', cal, false)).toBe(t('2026-11-02', '09:30'));
    expect(bucketOf(t('2026-11-02', '10:29'), '1H', cal, false)).toBe(t('2026-11-02', '09:30'));
    expect(bucketOf(t('2026-11-02', '10:30'), '1H', cal, false)).toBe(t('2026-11-02', '10:30'));
    expect(bucketOf(t('2026-11-02', '15:59'), '1H', cal, false)).toBe(t('2026-11-02', '15:30'));
  });

  it('drops pre/post-market in regular-hours mode', () => {
    expect(bucketOf(t('2026-11-02', '09:29'), '5M', cal, false)).toBeNull();
    expect(bucketOf(t('2026-11-02', '16:00'), '5M', cal, false)).toBeNull();
  });

  it('splits regular-hours 4H at 13:30', () => {
    expect(bucketOf(t('2026-11-02', '13:29'), '4H', cal, false)).toBe(t('2026-11-02', '09:30'));
    expect(bucketOf(t('2026-11-02', '13:30'), '4H', cal, false)).toBe(t('2026-11-02', '13:30'));
  });

  it('uses clock-aligned buckets from 04:00 in extended-hours mode', () => {
    expect(bucketOf(t('2026-11-02', '09:45'), '1H', cal, true)).toBe(t('2026-11-02', '09:00'));
    expect(bucketOf(t('2026-11-02', '19:59'), '4H', cal, true)).toBe(t('2026-11-02', '16:00'));
    expect(bucketOf(t('2026-11-02', '03:59'), '1M', cal, true)).toBeNull();
  });

  it('ends half days at the early close and skips holidays', () => {
    expect(bucketOf(t('2026-11-27', '12:59'), '15M', cal, false)).toBe(t('2026-11-27', '12:45'));
    expect(bucketOf(t('2026-11-27', '13:00'), '15M', cal, false)).toBeNull();
    expect(bucketOf(t('2026-11-26', '10:00'), '1H', cal, false)).toBeNull();
  });

  it('stamps daily candles at New York midnight', () => {
    expect(bucketOf(t('2026-11-02', '11:00'), '1D', cal, false)).toBe(t('2026-11-02', '00:00'));
  });
});

describe('aggregate', () => {
  // Synthetic 15-minute bars for arithmetic checks only (never shown in the app).
  const bar = (hm: string, o: number, h: number, l: number, c: number, v: number): Bar => ({
    t: nyToUtc('2026-11-02', hm),
    o,
    h,
    l,
    c,
    v,
  });

  it('builds a 9:30 1H candle from four 15M bars and ignores premarket', () => {
    const src = [
      bar('09:15', 1, 1, 1, 1, 999), // premarket, must be dropped
      bar('09:30', 10, 12, 9, 11, 100),
      bar('09:45', 11, 13, 10, 12, 100),
      bar('10:00', 12, 12, 8, 9, 100),
      bar('10:15', 9, 10, 9, 10, 100),
      bar('10:30', 10, 11, 10, 11, 50),
    ];
    const out = aggregate(src, '1H', cal, false);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ t: nyToUtc('2026-11-02', '09:30'), o: 10, h: 13, l: 8, c: 10, v: 400 });
    expect(out[1]).toMatchObject({ t: nyToUtc('2026-11-02', '10:30'), o: 10, c: 11, v: 50 });
  });

  it('keeps candles from different days apart across a holiday', () => {
    const src: Bar[] = [
      { t: nyToUtc('2026-11-25', '15:45'), o: 1, h: 2, l: 1, c: 2, v: 10 },
      { t: nyToUtc('2026-11-26', '10:00'), o: 5, h: 5, l: 5, c: 5, v: 10 }, // holiday: dropped
      { t: nyToUtc('2026-11-27', '09:30'), o: 3, h: 4, l: 3, c: 4, v: 10 },
    ];
    const out = aggregate(src, '4H', cal, false);
    expect(out.map((b) => iso(b.t))).toEqual(['2026-11-25T18:30:00.000Z', '2026-11-27T14:30:00.000Z']);
  });

  it('normalizes provider daily bars and drops non-trading days', () => {
    const src: Bar[] = [
      { t: Date.parse('2026-11-02T05:00:00Z') / 1000, o: 1, h: 1, l: 1, c: 1, v: 1 },
      { t: Date.parse('2026-11-26T05:00:00Z') / 1000, o: 1, h: 1, l: 1, c: 1, v: 1 },
    ];
    const out = normalizeDaily(src, cal);
    expect(out).toHaveLength(1);
    expect(nyDate(out[0].t)).toBe('2026-11-02');
  });
});
