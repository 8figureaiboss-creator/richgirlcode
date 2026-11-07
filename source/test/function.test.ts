import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nyDate } from '../shared/time';

// Stubbed Alpaca: shapes match Alpaca's API, values are synthetic and exist only inside this test.
const calls: { url: string; headers: Record<string, string> }[] = [];
let env: Record<string, string> = {};

function calendarRows(start: string, end: string) {
  const rows = [];
  for (let d = new Date(start + 'T12:00:00Z'); d <= new Date(end + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    rows.push({ date: d.toISOString().slice(0, 10), open: '09:30', close: '16:00', session_open: '0400', session_close: '2000' });
  }
  return rows;
}

function fakeFetch(input: string, init?: RequestInit) {
  const url = new URL(input);
  calls.push({ url: input, headers: Object.fromEntries(new Headers(init?.headers).entries()) });
  let body: unknown = {};
  if (url.pathname === '/v2/calendar') body = calendarRows(url.searchParams.get('start')!, url.searchParams.get('end')!);
  else if (url.pathname === '/v2/clock') body = { is_open: false, next_open: 'x', next_close: 'y', timestamp: 'z' };
  else if (url.pathname.endsWith('/bars')) {
    // A 15-minute bar every 15 minutes across the requested range, as Alpaca would return (incl. pre/post).
    const start = Date.parse(url.searchParams.get('start')!) / 1000;
    const end = Date.parse(url.searchParams.get('end')!) / 1000;
    const step = url.searchParams.get('timeframe') === '1Min' ? 60 : url.searchParams.get('timeframe') === '1Day' ? 86400 : 900;
    const bars = [];
    for (let t = Math.ceil(start / step) * step; t < end && bars.length < 10000; t += step) {
      bars.push({ t: new Date(t * 1000).toISOString(), o: 100, h: 101, l: 99, c: 100.5, v: 10, vw: 100.2, n: 1 });
    }
    body = { bars, next_page_token: null };
  } else if (url.pathname.endsWith('/trades/latest')) body = { trade: { p: 123.45, t: new Date().toISOString() } };
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
}

const owner = { email: 'owner@example.com', role: 'admin' };
const member = { email: 'student@example.com', role: 'user' };

async function call(user: unknown, body: unknown) {
  const { default: handler } = await import('../base44/function-src/entry');
  const req = new Request('https://app.example/functions/otaCharts', {
    method: 'POST',
    headers: user ? { 'x-test-user': JSON.stringify(user) } : {},
    body: JSON.stringify(body),
  });
  const res = await handler(req);
  return { status: res.status, json: await res.json() };
}

beforeEach(() => {
  calls.length = 0;
  env = {};
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  vi.stubGlobal('Deno', { env: { get: (k: string) => env[k] } });
});
afterEach(() => vi.unstubAllGlobals());

describe('otaCharts function', () => {
  it('refuses anyone who is not the owner', async () => {
    expect((await call(null, { action: 'status' })).status).toBe(403);
    expect((await call(member, { action: 'status' })).status).toBe(403);
    env.OTA_OWNER_EMAIL = 'owner@example.com';
    expect((await call({ email: 'other@x.com', role: 'admin' }, { action: 'status' })).status).toBe(403);
    expect((await call(owner, { action: 'status' })).status).toBe(200);
  });

  it('reports "not connected" honestly when keys are missing', async () => {
    const s = await call(owner, { action: 'status' });
    expect(s.json.configured).toBe(false);
    const b = await call(owner, { action: 'bars', symbol: 'SPY', tf: '1H', feed: 'iex' });
    expect(b.status).toBe(503);
    expect(b.json.code).toBe('not_configured');
    expect(calls).toHaveLength(0);
  });

  it('keeps keys in server-to-Alpaca headers and returns session-aligned 1H candles', async () => {
    env.ALPACA_KEY_ID = 'KEYID';
    env.ALPACA_SECRET_KEY = 'SECRET';
    const r = await call(owner, { action: 'bars', symbol: 'spy', tf: '1H', feed: 'iex', ext: false });
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.json)).not.toContain('SECRET');
    expect(calls.every((c) => c.headers['apca-api-secret-key'] === 'SECRET')).toBe(true);
    expect(r.json.provenance.label).toContain('IEX');
    const bars = r.json.bars as { t: number }[];
    expect(bars.length).toBeGreaterThan(100);
    // Every regular-hours 1H candle starts at :30 New York time and no weekend candles exist.
    for (const b of bars) {
      const d = new Date(b.t * 1000);
      expect(d.getUTCMinutes()).toBe(30);
      expect([0, 6]).not.toContain(new Date(nyDate(b.t) + 'T12:00:00Z').getUTCDay());
    }
  });

  it('never asks Alpaca for consolidated data newer than 15 minutes', async () => {
    env.ALPACA_KEY_ID = 'K';
    env.ALPACA_SECRET_KEY = 'S';
    const r = await call(owner, { action: 'bars', symbol: 'QQQ', tf: '5M', feed: 'sip' });
    expect(r.status).toBe(200);
    expect(r.json.provenance.timeliness).toBe('delayed');
    const limit = Date.now() / 1000 - 15 * 60;
    for (const c of calls.filter((c) => c.url.includes('/bars'))) {
      expect(new URL(c.url).searchParams.get('feed')).toBe('sip');
      expect(Date.parse(new URL(c.url).searchParams.get('end')!) / 1000).toBeLessThan(limit);
    }
    expect(calls.some((c) => c.url.includes('trades/latest'))).toBe(false);
  });

  it('rejects bad input', async () => {
    env.ALPACA_KEY_ID = 'K';
    env.ALPACA_SECRET_KEY = 'S';
    expect((await call(owner, { action: 'bars', symbol: 'SPY;DROP', tf: '1H' })).status).toBe(400);
    expect((await call(owner, { action: 'bars', symbol: 'SPY', tf: '2H' })).status).toBe(400);
  });
});
