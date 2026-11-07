import { fmtNyTime } from '../shared/time';
import type { Bar, BarsResponse, DataProvenance, Feed, Timeframe } from '../shared/types';

/** What the embedding page (Base44) provides. The workspace never sees API keys. */
export interface ChartsHost {
  /** Invoke the otaCharts backend function. Rejects with an Error carrying `.code` on failure. */
  call<T = any>(action: string, args?: Record<string, unknown>): Promise<T>;
  loadState(): Promise<unknown | null>;
  saveState(state: unknown): Promise<void>;
}

export type DataStatus =
  | { kind: 'loading' }
  | { kind: 'not_configured'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; provenance: DataProvenance; live: boolean; marketOpen: boolean; lastUpdate: number; empty: boolean };

export interface Query {
  symbol: string;
  tf: Timeframe;
  feed: Feed;
  ext: boolean;
}

export class DataController {
  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private query: Query | null = null;
  private lastBarT = 0;
  private marketOpen = false;
  status: DataStatus = { kind: 'loading' };

  constructor(
    private host: ChartsHost,
    private onBars: (bars: Bar[], q: Query) => void,
    private onTail: (bars: Bar[]) => void,
    private onStatus: (s: DataStatus) => void,
    private pollSeconds: () => number,
  ) {
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private setStatus(s: DataStatus) {
    this.status = s;
    this.onStatus(s);
  }

  async load(q: Query) {
    const my = ++this.seq;
    this.query = q;
    this.stop();
    this.setStatus({ kind: 'loading' });
    try {
      const res = await this.host.call<BarsResponse>('bars', { ...q });
      if (my !== this.seq) return;
      this.lastBarT = res.bars.at(-1)?.t ?? 0;
      this.onBars(res.bars, q);
      // "Open" means the selected session (regular or extended) is in progress per Alpaca's market calendar.
      const now = Date.now() / 1000;
      const asOf = res.provenance.asOf;
      this.marketOpen = res.sessions.some((s) => asOf >= (q.ext ? s.extOpen : s.open) && asOf < (q.ext ? s.extClose : s.close));
      this.setStatus({
        kind: 'ok',
        provenance: res.provenance,
        live: false, // becomes true only after a successful refresh from the feed while the market is open
        marketOpen: this.marketOpen,
        lastUpdate: now,
        empty: res.bars.length === 0,
      });
      this.schedule();
    } catch (e: any) {
      if (my !== this.seq) return;
      this.fail(e);
    }
  }

  private fail(e: any) {
    if (e?.code === 'not_configured') this.setStatus({ kind: 'not_configured', message: e.message });
    else this.setStatus({ kind: 'error', message: e?.message ?? 'Could not load market data' });
  }

  private schedule() {
    this.stop();
    const q = this.query;
    if (!q) return;
    const secs = q.feed === 'iex' && this.marketOpen ? Math.max(3, this.pollSeconds()) : 60;
    this.timer = setTimeout(() => this.tick(), secs * 1000);
  }

  private async tick() {
    const q = this.query;
    if (!q) return;
    if (document.hidden) return; // resumes on visibilitychange
    const my = this.seq;
    try {
      const res = await this.host.call<{ bars: Bar[]; provenance: DataProvenance; marketOpen: boolean }>('tail', { ...q, from: this.lastBarT || Math.floor(Date.now() / 1000) - 3600 });
      if (my !== this.seq) return;
      if (res.bars.length) {
        this.onTail(res.bars);
        // Next refresh starts at the newest candle so it is always rebuilt in full from minutes.
        this.lastBarT = res.bars.at(-1)!.t;
      }
      this.marketOpen = res.marketOpen;
      const prev = this.status.kind === 'ok' ? this.status : null;
      this.setStatus({
        kind: 'ok',
        provenance: res.provenance,
        live: q.feed === 'iex' && res.marketOpen,
        marketOpen: res.marketOpen,
        lastUpdate: Date.now() / 1000,
        empty: prev?.empty ?? false,
      });
    } catch (e: any) {
      if (my !== this.seq) return;
      this.fail(e);
    }
    if (my === this.seq) this.schedule();
  }

  private onVisibility = () => {
    if (!document.hidden && this.query && this.status.kind === 'ok') {
      this.stop();
      void this.tick();
    }
  };

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  destroy() {
    this.seq++;
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}

/** Text for the provenance badge. Never claims "live" unless a feed refresh just succeeded. */
export function describeStatus(s: DataStatus, pollSeconds: number): { tone: 'live' | 'delayed' | 'idle' | 'off'; title: string; detail: string } {
  if (s.kind === 'loading') return { tone: 'idle', title: 'Loading…', detail: 'Requesting candles from Alpaca' };
  if (s.kind === 'not_configured') return { tone: 'off', title: 'No market data', detail: 'Data feed not connected yet — add Alpaca keys in Base44 Secrets.' };
  if (s.kind === 'error') return { tone: 'off', title: 'Data unavailable', detail: s.message };
  const asOf = fmtNyTime(s.provenance.asOf);
  if (s.provenance.feed === 'sip') {
    return { tone: 'delayed', title: 'Delayed 15 min', detail: `All US exchanges (consolidated) · as of ${asOf} ET · refreshes every 60s` };
  }
  if (s.live) return { tone: 'live', title: 'Live · IEX', detail: `Real-time, IEX exchange only · refreshes every ${pollSeconds}s · volume & VWAP count IEX trades only` };
  if (!s.marketOpen) return { tone: 'idle', title: 'IEX · session closed', detail: `Real-time IEX feed · no candle forming right now · last check ${asOf} ET` };
  return { tone: 'idle', title: 'IEX · connecting', detail: 'Waiting for the first real-time refresh' };
}
