// Local test harness. NOT shipped. Two modes:
//   (default)       → behaves exactly like Base44 before Alpaca keys are added: "not connected".
//   ?mode=fixture   → synthetic candles so layout/drawings/themes can be checked. Clearly bannered.
import { mount } from '../web/app';
import type { ChartsHost } from '../web/data';
import { TF_SECONDS, aggregate, calendarFrom } from '../shared/candles';
import { addDays, nyDate, nyToUtc } from '../shared/time';
import type { Bar, SessionDay, Timeframe } from '../shared/types';

const mode = new URLSearchParams(location.search).get('mode');
let saved: unknown = null;

function notConfigured(): never {
  const e = new Error('Market data is not connected yet (Alpaca keys missing).') as Error & { code: string };
  e.code = 'not_configured';
  throw e;
}

function fixtureSessions(): SessionDay[] {
  const out: SessionDay[] = [];
  const end = nyDate(Date.now() / 1000);
  for (let i = 400; i >= 0; i--) {
    const d = addDays(end, -i);
    const wd = new Date(d + 'T12:00:00Z').getUTCDay();
    if (wd === 0 || wd === 6) continue;
    out.push({ date: d, open: nyToUtc(d, '0930'), close: nyToUtc(d, '1600'), extOpen: nyToUtc(d, '0400'), extClose: nyToUtc(d, '2000') });
  }
  return out;
}

function fixtureBars(tf: Timeframe, ext: boolean): Bar[] {
  const sessions = fixtureSessions();
  const cal = calendarFrom(sessions);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  let px = 500;
  const step = tf === '1D' ? 900 : Math.min(TF_SECONDS[tf], 900);
  const lookback = { '1M': 3, '5M': 8, '15M': 20, '1H': 60, '4H': 200, '1D': 400 }[tf];
  const src: Bar[] = [];
  for (const s of sessions.slice(-lookback)) {
    for (let t = s.extOpen; t < s.extClose; t += step) {
      const o = px;
      px = Math.max(5, px + rnd() * px * 0.004 + Math.sin(t / 90000) * 0.15);
      const hi = Math.max(o, px) + Math.abs(rnd()) * px * 0.002;
      const lo = Math.min(o, px) - Math.abs(rnd()) * px * 0.002;
      src.push({ t, o, h: hi, l: lo, c: px, v: Math.round(2e5 + Math.abs(rnd()) * 8e5) });
    }
  }
  return aggregate(src, tf, cal, ext);
}

const host: ChartsHost = {
  async call(action: string, args: Record<string, unknown> = {}): Promise<any> {
    await new Promise((r) => setTimeout(r, 250));
    if (action === 'status') return { configured: mode === 'fixture' };
    if (mode !== 'fixture') notConfigured();
    const tf = args.tf as Timeframe;
    if (action === 'bars') {
      const bars = fixtureBars(tf, !!args.ext);
      return { symbol: args.symbol, tf, ext: !!args.ext, bars, formingMinutes: [], provenance: { feed: 'iex', timeliness: 'realtime', asOf: bars.at(-1)!.t, label: 'TEST FIXTURE' }, sessions: [] };
    }
    if (action === 'tail') return { bars: [], provenance: { feed: 'iex', timeliness: 'realtime', asOf: Date.now() / 1000, label: 'TEST FIXTURE' }, marketOpen: false };
    if (action === 'quotes') return { quotes: {} };
    if (action === 'assets') return { fetchedAt: Date.now(), assets: [['SPY', 'SPDR S&P 500 ETF Trust', 'ARCA'], ['QQQ', 'Invesco QQQ Trust', 'NASDAQ'], ['GLD', 'SPDR Gold Shares', 'ARCA'], ['AAPL', 'Apple Inc.', 'NASDAQ']] };
    throw new Error('unknown action ' + action);
  },
  async loadState() {
    return saved;
  },
  async saveState(s) {
    saved = structuredClone(s);
    (window as any).__savedState = saved;
  },
};

if (mode === 'fixture') document.body.classList.add('fixture');
(window as any).__app = mount(document.getElementById('charts')!, host);
