// Indicator math. Each function returns one value per input bar (null where not yet defined),
// so outputs line up index-for-index with the candles.

import type { Bar } from './types';
import { nyDate } from './time';

export type Series = (number | null)[];

export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** EMA seeded with the SMA of the first `period` values (TradingView convention). */
export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's RSI. */
export function rsi(values: number[], period = 14): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line: Series = values.map((_, i) => (f[i] !== null && s[i] !== null ? (f[i] as number) - (s[i] as number) : null));
  const firstIdx = line.findIndex((v) => v !== null);
  const sig: Series = new Array(values.length).fill(null);
  if (firstIdx >= 0) {
    const tail = ema(line.slice(firstIdx) as number[], signal);
    tail.forEach((v, j) => (sig[firstIdx + j] = v));
  }
  const hist: Series = line.map((v, i) => (v !== null && sig[i] !== null ? v - (sig[i] as number) : null));
  return { line, signal: sig, hist };
}

/** Bollinger Bands using population standard deviation (TradingView convention). */
export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: Series = new Array(values.length).fill(null);
  const lower: Series = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const m = mid[i] as number;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += (values[j] - m) ** 2;
    const sd = Math.sqrt(s / period);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { mid, upper, lower };
}

/**
 * Session VWAP, reset at the start of each New York trading day. Uses each bar's own VWAP when the
 * provider supplies it (more accurate than the typical price), otherwise (H+L+C)/3.
 */
export function vwap(bars: Bar[]): Series {
  const out: Series = new Array(bars.length).fill(null);
  let day = '';
  let pv = 0;
  let vol = 0;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const d = nyDate(b.t);
    if (d !== day) {
      day = d;
      pv = 0;
      vol = 0;
    }
    const price = b.vw ?? (b.h + b.l + b.c) / 3;
    pv += price * b.v;
    vol += b.v;
    out[i] = vol > 0 ? pv / vol : null;
  }
  return out;
}
