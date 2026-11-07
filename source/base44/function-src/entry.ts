// OTA Personal Charts — Base44 backend function ("otaCharts").
// Runs on Base44's server (Deno). Holds the Alpaca keys, checks that the caller is the owner,
// and returns session-correct candles. Nothing here ever sends the keys to the browser.
//
// Secrets (Base44 → Dashboard → Settings → Secrets / Environment variables):
//   ALPACA_KEY_ID       required
//   ALPACA_SECRET_KEY   required
//   OTA_OWNER_EMAIL     recommended — only this login may use the charts (otherwise: admins only)

// @ts-ignore Deno npm specifier, resolved by Base44 at runtime
import { createClientFromRequest } from 'npm:@base44/sdk';
import {
  LOOKBACK_DAYS,
  SOURCE_TF,
  TF_SECONDS,
  aggregate,
  bucketOf,
  calendarFrom,
  normalizeDaily,
  sessionFromAlpaca,
} from '../../shared/candles';
import { addDays, nyDate } from '../../shared/time';
import type { Bar, BarsResponse, DataProvenance, Feed, SessionDay, Timeframe } from '../../shared/types';
import { TIMEFRAMES } from '../../shared/types';

const DATA = 'https://data.alpaca.markets';
const TRADING_BASES = ['https://paper-api.alpaca.markets', 'https://api.alpaca.markets'];
/** Alpaca Basic only allows consolidated (SIP) data older than 15 minutes. 60 s of margin. */
const SIP_DELAY_SEC = 16 * 60;
const SYMBOL_RE = /^[A-Z][A-Z0-9.\-]{0,9}$/;

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function secret(name: string): Promise<string | undefined> {
  try {
    // @ts-ignore Deno global
    const v = globalThis.Deno?.env?.get(name);
    if (v) return v;
  } catch {
    /* not available */
  }
  try {
    // @ts-ignore Base44 runtime module
    const mod = await import('base44:runtime');
    return mod.secrets.get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

interface Keys {
  id: string;
  secret: string;
}

async function getKeys(): Promise<Keys | null> {
  const id = await secret('ALPACA_KEY_ID');
  const sec = await secret('ALPACA_SECRET_KEY');
  return id && sec ? { id, secret: sec } : null;
}

async function alpaca(keys: Keys, url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'APCA-API-KEY-ID': keys.id, 'APCA-API-SECRET-KEY': keys.secret, Accept: 'application/json' },
  });
  if (res.status === 429) throw new HttpError(429, 'rate_limited', 'Alpaca rate limit reached (200 calls/min on Basic). Try again in a minute.');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new HttpError(res.status === 401 || res.status === 403 ? 502 : 502, 'upstream', `Alpaca ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Calendar + clock live on the trading API; try paper first (most free accounts), then live. */
async function trading(keys: Keys, path: string): Promise<any> {
  let last: unknown;
  for (const base of TRADING_BASES) {
    try {
      return await alpaca(keys, base + path);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

async function sessions(keys: Keys, startDate: string, endDate: string): Promise<SessionDay[]> {
  const rows = await trading(keys, `/v2/calendar?start=${startDate}&end=${endDate}`);
  return (rows as any[]).map(sessionFromAlpaca);
}

const toBar = (b: any): Bar => ({ t: Math.floor(Date.parse(b.t) / 1000), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v, vw: b.vw, n: b.n });

async function fetchBars(keys: Keys, symbol: string, timeframe: string, feed: Feed, start: number, end: number, maxPages = 8): Promise<Bar[]> {
  const out: Bar[] = [];
  let token = '';
  for (let page = 0; page < maxPages; page++) {
    const q = new URLSearchParams({
      timeframe,
      start: new Date(start * 1000).toISOString(),
      end: new Date(end * 1000).toISOString(),
      limit: '10000',
      adjustment: 'split',
      feed,
      sort: 'asc',
    });
    if (token) q.set('page_token', token);
    const json = await alpaca(keys, `${DATA}/v2/stocks/${encodeURIComponent(symbol)}/bars?${q}`);
    for (const b of json.bars ?? []) out.push(toBar(b));
    token = json.next_page_token;
    if (!token) break;
  }
  return out;
}

function provenance(feed: Feed, asOf: number): DataProvenance {
  return feed === 'iex'
    ? { feed, timeliness: 'realtime', asOf, label: 'Real-time · IEX exchange only' }
    : { feed, timeliness: 'delayed', asOf, label: 'Delayed 15 min · All US exchanges (SIP)' };
}

function parseArgs(body: any) {
  const symbol = String(body.symbol ?? '').toUpperCase().trim();
  if (!SYMBOL_RE.test(symbol)) throw new HttpError(400, 'bad_request', 'Invalid symbol');
  const tf = body.tf as Timeframe;
  if (!TIMEFRAMES.includes(tf)) throw new HttpError(400, 'bad_request', 'Invalid timeframe');
  const feed: Feed = body.feed === 'sip' ? 'sip' : 'iex';
  const ext = Boolean(body.ext);
  return { symbol, tf, feed, ext };
}

/** Rebuild the candles at/after `from` from 1-minute bars so the newest candle is minute-accurate. */
async function minuteTail(keys: Keys, symbol: string, tf: Timeframe, feed: Feed, ext: boolean, from: number, end: number, cal: ReturnType<typeof calendarFrom>) {
  const mins = await fetchBars(keys, symbol, '1Min', feed, from, end, 3);
  return aggregate(mins, tf, cal, ext).filter((b) => b.t >= from);
}

async function latestTrade(keys: Keys, symbol: string): Promise<{ p: number; t: number } | null> {
  const json = await alpaca(keys, `${DATA}/v2/stocks/${encodeURIComponent(symbol)}/trades/latest?feed=iex`);
  const tr = json.trade;
  return tr ? { p: tr.p, t: Math.floor(Date.parse(tr.t) / 1000) } : null;
}

/** Fold the very latest IEX trade into the forming candle (price only; its volume arrives with the minute bar). */
function applyTrade(bars: Bar[], trade: { p: number; t: number } | null, tf: Timeframe, cal: ReturnType<typeof calendarFrom>, ext: boolean) {
  if (!trade) return;
  const bucket = bucketOf(trade.t, tf, cal, ext);
  if (bucket === null) return;
  const last = bars[bars.length - 1];
  if (last && last.t === bucket) {
    last.h = Math.max(last.h, trade.p);
    last.l = Math.min(last.l, trade.p);
    last.c = trade.p;
  } else if (!last || bucket > last.t) {
    bars.push({ t: bucket, o: trade.p, h: trade.p, l: trade.p, c: trade.p, v: 0 });
  }
}

async function handleBars(keys: Keys, body: any): Promise<BarsResponse> {
  const { symbol, tf, feed, ext } = parseArgs(body);
  const now = Math.floor(Date.now() / 1000);
  const end = feed === 'sip' ? now - SIP_DELAY_SEC : now;
  const startDate = addDays(nyDate(end), -LOOKBACK_DAYS[tf]);
  const days = await sessions(keys, addDays(startDate, -3), addDays(nyDate(end), 1));
  const cal = calendarFrom(days);
  const start = Date.parse(startDate + 'T00:00:00Z') / 1000;

  const raw = await fetchBars(keys, symbol, SOURCE_TF[tf], feed, start, end);
  let bars = tf === '1D' ? normalizeDaily(raw, cal) : aggregate(raw, tf, cal, ext);

  // If the session is open, the provider's newest coarse bar may be partial — rebuild that candle from minutes.
  const forming = bucketOf(end, tf, cal, ext);
  if (forming !== null) {
    bars = bars.filter((b) => b.t < forming);
    bars.push(...(await minuteTail(keys, symbol, tf, feed, ext, forming, end, cal)));
    if (feed === 'iex') applyTrade(bars, await latestTrade(keys, symbol), tf, cal, ext);
  }

  return { symbol, tf, ext, bars, formingMinutes: [], provenance: provenance(feed, end), sessions: days };
}

/** Lightweight refresh used while the chart is open: candles at/after `from`, minute-accurate. */
async function handleTail(keys: Keys, body: any) {
  const { symbol, tf, feed, ext } = parseArgs(body);
  const now = Math.floor(Date.now() / 1000);
  const end = feed === 'sip' ? now - SIP_DELAY_SEC : now;
  const from = Number(body.from);
  if (!Number.isFinite(from) || from < end - 3 * 86400 || from > end + 60) throw new HttpError(400, 'bad_request', 'Invalid from');
  const days = await sessions(keys, addDays(nyDate(from), -1), addDays(nyDate(end), 1));
  const cal = calendarFrom(days);
  const bars = await minuteTail(keys, symbol, tf, feed, ext, from, end, cal);
  if (feed === 'iex') applyTrade(bars, await latestTrade(keys, symbol), tf, cal, ext);
  return { bars, provenance: provenance(feed, end), marketOpen: bucketOf(end, tf, cal, ext) !== null, tfSeconds: TF_SECONDS[tf] };
}

async function handleQuotes(keys: Keys, body: any) {
  const symbols = (Array.isArray(body.symbols) ? body.symbols : [])
    .map((s: unknown) => String(s).toUpperCase())
    .filter((s: string) => SYMBOL_RE.test(s))
    .slice(0, 100);
  if (!symbols.length) return { quotes: {}, feed: 'iex' };
  const json = await alpaca(keys, `${DATA}/v2/stocks/snapshots?symbols=${symbols.join(',')}&feed=iex`);
  const quotes: Record<string, { price: number; prevClose: number | null; t: number }> = {};
  for (const [sym, s] of Object.entries<any>(json ?? {})) {
    if (!s?.latestTrade) continue;
    quotes[sym] = { price: s.latestTrade.p, prevClose: s.prevDailyBar?.c ?? null, t: Math.floor(Date.parse(s.latestTrade.t) / 1000) };
  }
  return { quotes, feed: 'iex', label: 'Last IEX trade' };
}

const LISTED = new Set(['NYSE', 'NASDAQ', 'ARCA', 'AMEX', 'BATS']);
async function handleAssets(keys: Keys) {
  const rows = await trading(keys, '/v2/assets?status=active&asset_class=us_equity');
  const assets = (rows as any[])
    .filter((a) => a.tradable && LISTED.has(a.exchange))
    .map((a) => [a.symbol, a.name ?? '', a.exchange]);
  return { assets, fetchedAt: Date.now() };
}

async function handleStatus(keys: Keys | null) {
  if (!keys) return { configured: false, message: 'Alpaca keys are not set in Base44 Secrets (ALPACA_KEY_ID, ALPACA_SECRET_KEY).' };
  try {
    const clock = await trading(keys, '/v2/clock');
    return { configured: true, connected: true, clock: { isOpen: clock.is_open, nextOpen: clock.next_open, nextClose: clock.next_close, timestamp: clock.timestamp } };
  } catch (e: any) {
    return { configured: true, connected: false, message: e.message };
  }
}

async function isOwner(req: Request): Promise<boolean> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return false;
  const owner = (await secret('OTA_OWNER_EMAIL'))?.trim().toLowerCase();
  if (owner) return String(user.email ?? '').toLowerCase() === owner;
  return user.role === 'admin';
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (!(await isOwner(req))) return Response.json({ error: 'My Charts is private to the owner account.', code: 'unauthorized' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const keys = await getKeys();
    if (body.action === 'status') return Response.json(await handleStatus(keys));
    if (!keys) return Response.json({ error: 'Market data is not connected yet (Alpaca keys missing).', code: 'not_configured' }, { status: 503 });
    switch (body.action) {
      case 'bars':
        return Response.json(await handleBars(keys, body));
      case 'tail':
        return Response.json(await handleTail(keys, body));
      case 'quotes':
        return Response.json(await handleQuotes(keys, body));
      case 'assets':
        return Response.json(await handleAssets(keys));
      default:
        return Response.json({ error: 'Unknown action', code: 'bad_request' }, { status: 400 });
    }
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    const code = e instanceof HttpError ? e.code : 'upstream';
    return Response.json({ error: e?.message ?? 'Unexpected error', code }, { status });
  }
}

// Base44 dashboard functions use Deno.serve; newer CLI functions use the default export above.
// Register with Deno.serve when the runtime offers it, without failing if it doesn't.
try {
  // @ts-ignore Deno global
  if (typeof globalThis.Deno?.serve === 'function') globalThis.Deno.serve(handler);
} catch {
  /* default export is used instead */
}
