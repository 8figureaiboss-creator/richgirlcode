// Shared types used by both the Worker (server) and the chart workspace (browser).

export type Timeframe = '1M' | '5M' | '15M' | '1H' | '4H' | '1D';
export const TIMEFRAMES: Timeframe[] = ['1D', '4H', '1H', '15M', '5M', '1M'];

/** IEX = real-time, single exchange (Alpaca Basic). SIP = all US exchanges, delayed >= 15 min on Basic. */
export type Feed = 'iex' | 'sip';

/** One OHLCV candle. `t` = bucket start, Unix seconds (UTC). */
export interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  /** Volume-weighted average price of the trades inside this bar, when the provider supplies it. */
  vw?: number;
  n?: number;
}

/** One trading day from Alpaca's market calendar, converted to Unix seconds. */
export interface SessionDay {
  date: string; // YYYY-MM-DD (New York)
  open: number; // regular session open (09:30 ET normally)
  close: number; // regular session close (16:00, or 13:00 on half days)
  extOpen: number; // extended session open (04:00 ET)
  extClose: number; // extended session close (20:00 ET)
}

/** What the server says about where the numbers came from. Shown verbatim in the data badge. */
export interface DataProvenance {
  feed: Feed;
  /** 'realtime' only for IEX. 'delayed' for SIP on Basic. */
  timeliness: 'realtime' | 'delayed';
  /** Latest timestamp the server was allowed to request (Unix seconds). */
  asOf: number;
  label: string;
}

export interface BarsResponse {
  symbol: string;
  tf: Timeframe;
  ext: boolean;
  /** Completed history, excluding the bucket that is still forming. */
  bars: Bar[];
  /** 1-minute bars that make up the still-forming bucket (live IEX mode only). */
  formingMinutes: Bar[];
  provenance: DataProvenance;
  sessions: SessionDay[];
}

export interface ApiError {
  error: string;
  code: 'not_configured' | 'unauthorized' | 'upstream' | 'bad_request' | 'rate_limited' | 'locked';
}
