// Session-aware candle building.
//
// Rules (matching how TradingView draws US stocks):
//  * Regular hours (RTH): buckets are anchored at the session open, so 1H = 9:30, 10:30 ... 15:30
//    and 4H = 9:30-13:30, 13:30-16:00. Half days end at the calendar's early close.
//  * Extended hours (ETH): buckets are anchored at 04:00 ET, so 1H follows the clock and
//    4H = 4-8, 8-12, 12-16, 16-20.
//  * Trades outside the chosen session are dropped. Weekends/holidays never create candles.
//  * 1D candles are one per trading day, stamped at New York midnight.

import type { Bar, SessionDay, Timeframe } from './types';
import { nyDate, nyToUtc } from './time';

export const TF_SECONDS: Record<Timeframe, number> = {
  '1M': 60,
  '5M': 300,
  '15M': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
};

/** Provider bar size used as raw material for each timeframe. Each one divides its target evenly
 *  and is aligned to both 09:30 and 04:00, so no source bar ever straddles two buckets. */
export const SOURCE_TF: Record<Timeframe, '1Min' | '5Min' | '15Min' | '1Day'> = {
  '1M': '1Min',
  '5M': '5Min',
  '15M': '15Min',
  '1H': '15Min',
  '4H': '15Min',
  '1D': '1Day',
};

/** Calendar days of history to request on first load for each timeframe. */
export const LOOKBACK_DAYS: Record<Timeframe, number> = {
  '1M': 5,
  '5M': 21,
  '15M': 60,
  '1H': 150,
  '4H': 400,
  '1D': 365 * 6,
};

export type Calendar = Map<string, SessionDay>;

export function calendarFrom(days: SessionDay[]): Calendar {
  return new Map(days.map((d) => [d.date, d]));
}

/** Convert one Alpaca /v2/calendar row to Unix-second session bounds. */
export function sessionFromAlpaca(row: {
  date: string;
  open: string;
  close: string;
  session_open?: string;
  session_close?: string;
}): SessionDay {
  return {
    date: row.date,
    open: nyToUtc(row.date, row.open),
    close: nyToUtc(row.date, row.close),
    extOpen: nyToUtc(row.date, row.session_open ?? '0400'),
    extClose: nyToUtc(row.date, row.session_close ?? '2000'),
  };
}

/**
 * Start time of the candle that a trade/bar at `t` belongs to, or null if `t` falls outside
 * the selected session (or on a non-trading day).
 */
export function bucketOf(t: number, tf: Timeframe, cal: Calendar, ext: boolean): number | null {
  const day = cal.get(nyDate(t));
  if (!day) return null;
  const start = ext ? day.extOpen : day.open;
  const end = ext ? day.extClose : day.close;
  if (t < start || t >= end) return null;
  if (tf === '1D') return nyToUtc(day.date, '0000');
  const size = TF_SECONDS[tf];
  return start + Math.floor((t - start) / size) * size;
}

/** Merge bar `b` into candle `acc` (which must already cover the same bucket). */
export function mergeInto(acc: Bar, b: Bar): Bar {
  const v = acc.v + b.v;
  const pv = (acc.vw ?? acc.c) * acc.v + (b.vw ?? b.c) * b.v;
  return {
    t: acc.t,
    o: acc.o,
    h: Math.max(acc.h, b.h),
    l: Math.min(acc.l, b.l),
    c: b.c,
    v,
    vw: v > 0 ? pv / v : b.vw ?? acc.vw,
    n: (acc.n ?? 0) + (b.n ?? 0),
  };
}

/** Build target-timeframe candles from finer, time-sorted source bars. */
export function aggregate(src: Bar[], tf: Timeframe, cal: Calendar, ext: boolean): Bar[] {
  const out: Bar[] = [];
  for (const b of src) {
    const bucket = bucketOf(b.t, tf, cal, ext);
    if (bucket === null) continue;
    const last = out[out.length - 1];
    if (last && last.t === bucket) {
      out[out.length - 1] = mergeInto(last, b);
    } else if (!last || bucket > last.t) {
      out.push({ ...b, t: bucket, n: b.n ?? 0 });
    }
    // bucket < last.t would mean unsorted input; it is ignored rather than corrupting history.
  }
  return out;
}

/**
 * Daily candles from the provider are already one-per-day; restamp them to New York midnight and
 * drop anything that isn't a trading day on the calendar.
 */
export function normalizeDaily(src: Bar[], cal: Calendar): Bar[] {
  const out: Bar[] = [];
  for (const b of src) {
    // Provider daily bars are stamped at NY midnight expressed in UTC (04:00Z/05:00Z).
    const date = nyDate(b.t + 3600);
    if (!cal.has(date)) continue;
    out.push({ ...b, t: nyToUtc(date, '0000') });
  }
  return out;
}

/** Bucket start of the candle that is currently forming, or null if the session is closed. */
export function currentBucket(nowSec: number, tf: Timeframe, cal: Calendar, ext: boolean): number | null {
  return bucketOf(nowSec, tf, cal, ext);
}
