import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  TickMarkType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { bollinger, ema, macd, rsi, sma, vwap, type Series } from '../shared/indicators';
import { fmtNyDay, fmtNyFull, fmtNyMonth, fmtNyTime, nyDate } from '../shared/time';
import type { Bar, Timeframe } from '../shared/types';
import type { Indicators, Theme } from './state';

export function withAlpha(color: string, pct: number): string {
  if (pct >= 100) return color;
  const a = Math.max(0, Math.min(1, pct / 100));
  const hex = color.trim();
  if (/^#([0-9a-f]{6})$/i.test(hex)) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = hex.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const [r, g, b, a0 = '1'] = m[1].split(',').map((s) => s.trim());
    return `rgba(${r},${g},${b},${Number(a0) * a})`;
  }
  return color;
}

const ts = (t: number) => t as UTCTimestamp;
const line = (bars: Bar[], s: Series): LineData<Time>[] => {
  const out: LineData<Time>[] = [];
  s.forEach((v, i) => {
    if (v !== null && Number.isFinite(v)) out.push({ time: ts(bars[i].t), value: v });
  });
  return out;
};

interface Overlay {
  key: string;
  series: ISeriesApi<'Line'>;
}

export class ChartView {
  readonly chart: IChartApi;
  readonly candles: ISeriesApi<'Candlestick'>;
  private volume: ISeriesApi<'Histogram'>;
  private overlays: Overlay[] = [];
  private rsiSeries: ISeriesApi<'Line'>[] = [];
  private macdSeries: { line?: ISeriesApi<'Line'>; sig?: ISeriesApi<'Line'>; hist?: ISeriesApi<'Histogram'> } = {};
  bars: Bar[] = [];
  tf: Timeframe = '15M';
  private theme!: Theme;
  private ind!: Indicators;
  onCrosshair: (bar: Bar | null, prev: Bar | null) => void = () => {};

  constructor(private host: HTMLElement) {
    this.chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        fontFamily: "'Manrope', system-ui, sans-serif",
        fontSize: 11,
        panes: { separatorColor: 'rgba(255,255,255,0.08)', separatorHoverColor: 'rgba(255,255,255,0.18)', enableResize: true },
        attributionLogo: true, // Required by the Lightweight Charts license (links to tradingview.com).
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: {
        borderVisible: false,
        rightOffset: 8,
        barSpacing: 8,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time, type: TickMarkType) => {
          const t = time as number;
          if (type === TickMarkType.Year) return new Date(t * 1000).getUTCFullYear().toString();
          if (type === TickMarkType.Month) return fmtNyMonth(t);
          if (type === TickMarkType.DayOfMonth || this.tf === '1D') return fmtNyDay(t);
          return fmtNyTime(t);
        },
      },
      localization: { timeFormatter: (time: Time) => fmtNyFull(time as number, this.tf === '1D') + (this.tf === '1D' ? '' : ' ET') },
    });
    this.candles = this.chart.addSeries(CandlestickSeries, { priceLineVisible: true, lastValueVisible: true });
    this.volume = this.chart.addSeries(HistogramSeries, { priceScaleId: 'vol', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false });
    this.chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, visible: false });

    this.chart.subscribeCrosshairMove((p) => {
      if (!p.time) return this.onCrosshair(null, null);
      const i = this.indexOf(p.time as number);
      this.onCrosshair(i >= 0 ? this.bars[i] : null, i > 0 ? this.bars[i - 1] : null);
    });
  }

  indexOf(t: number): number {
    let lo = 0;
    let hi = this.bars.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.bars[mid].t === t) return mid;
      if (this.bars[mid].t < t) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  applyTheme(t: Theme) {
    this.theme = t;
    const grid = t.grid.show ? t.grid : { v: 'transparent', h: 'transparent' };
    this.chart.applyOptions({
      layout: { textColor: t.text },
      grid: { vertLines: { color: grid.v }, horzLines: { color: grid.h } },
      crosshair: {
        vertLine: { color: withAlpha(t.crosshair, 60), labelBackgroundColor: t.crosshair },
        horzLine: { color: withAlpha(t.crosshair, 60), labelBackgroundColor: t.crosshair },
      },
    });
    const op = t.bodyOpacity;
    this.candles.applyOptions({
      upColor: t.hollowUp ? 'rgba(0,0,0,0)' : withAlpha(t.up.body, op),
      downColor: withAlpha(t.down.body, op),
      borderVisible: t.borders || t.hollowUp,
      borderUpColor: t.up.border,
      borderDownColor: t.down.border,
      wickVisible: t.wicks,
      wickUpColor: t.up.wick,
      wickDownColor: t.down.wick,
    });
    if (this.bars.length) this.renderVolume();
  }

  setIndicators(ind: Indicators) {
    this.ind = ind;
    this.renderIndicators();
  }

  /** Replace all candles (new symbol/timeframe). */
  setBars(bars: Bar[], tf: Timeframe) {
    this.tf = tf;
    this.bars = bars;
    this.candles.setData(bars.map((b) => ({ time: ts(b.t), open: b.o, high: b.h, low: b.l, close: b.c })));
    this.renderVolume();
    this.renderIndicators();
  }

  /** Merge refreshed candles (t >= first incoming) without resetting the view. */
  mergeBars(fresh: Bar[]) {
    if (!fresh.length) return;
    const from = fresh[0].t;
    const keep = this.bars.filter((b) => b.t < from);
    this.bars = [...keep, ...fresh];
    for (const b of fresh) this.candles.update({ time: ts(b.t), open: b.o, high: b.h, low: b.l, close: b.c });
    this.renderVolume();
    this.renderIndicators();
  }

  private renderVolume() {
    const t = this.theme;
    if (!t) return;
    const on = this.ind?.volume.on ?? true;
    this.volume.applyOptions({ visible: on });
    this.volume.setData(on ? this.bars.map((b) => ({ time: ts(b.t), value: b.v, color: b.c >= b.o ? t.volUp : t.volDown })) : []);
  }

  private clearOverlays() {
    for (const o of this.overlays) this.chart.removeSeries(o.series);
    this.overlays = [];
  }

  private addLine(key: string, data: LineData<Time>[], color: string, width = 1.5, style = LineStyle.Solid, pane = 0) {
    const s = this.chart.addSeries(
      LineSeries,
      { color, lineWidth: width as 1, lineStyle: style, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, title: '' },
      pane,
    );
    s.setData(data);
    this.overlays.push({ key, series: s });
    return s;
  }

  private renderIndicators() {
    const ind = this.ind;
    if (!ind) return;
    const bars = this.bars;
    const closes = bars.map((b) => b.c);
    this.clearOverlays();

    for (const m of ind.sma) if (m.on) this.addLine(`sma${m.period}`, line(bars, sma(closes, m.period)), m.color);
    for (const m of ind.ema) if (m.on) this.addLine(`ema${m.period}`, line(bars, ema(closes, m.period)), m.color);
    if (ind.vwap.on && this.tf !== '1D') {
      // Hide the connector into the first candle of each new session so the daily reset reads as a break.
      const v = vwap(bars);
      const data = line(bars, v).map((pt, i, arr) =>
        i > 0 && nyDate(pt.time as number) !== nyDate(arr[i - 1].time as number) ? { ...pt, color: 'rgba(0,0,0,0)' } : pt,
      );
      this.addLine('vwap', data, ind.vwap.color, 2);
    }
    if (ind.bb.on) {
      const b = bollinger(closes, ind.bb.period, ind.bb.mult);
      this.addLine('bbU', line(bars, b.upper), ind.bb.color, 1);
      this.addLine('bbM', line(bars, b.mid), withAlpha(ind.bb.color, 60), 1, LineStyle.Dashed);
      this.addLine('bbL', line(bars, b.lower), ind.bb.color, 1);
    }

    // Lower panes: rebuild so pane order is always price → RSI → MACD.
    const panes = this.chart.panes();
    for (let i = panes.length - 1; i >= 1; i--) this.chart.removePane(i);
    let pane = 1;
    if (ind.rsi.on) {
      const s = this.addLine('rsi', line(bars, rsi(closes, ind.rsi.period)), ind.rsi.color, 1.5, LineStyle.Solid, pane);
      s.applyOptions({ lastValueVisible: true });
      s.createPriceLine({ price: ind.rsi.upper, color: 'rgba(242,120,120,0.5)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '' });
      s.createPriceLine({ price: ind.rsi.lower, color: 'rgba(127,209,185,0.5)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '' });
      pane++;
    }
    if (ind.macd.on) {
      const m = macd(closes, ind.macd.fast, ind.macd.slow, ind.macd.signal);
      const hist = this.chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
      hist.setData(
        m.hist.flatMap((v, i) => (v === null ? [] : [{ time: ts(bars[i].t), value: v, color: v >= 0 ? ind.macd.up : ind.macd.down }])),
      );
      this.overlays.push({ key: 'macdH', series: hist as unknown as ISeriesApi<'Line'> });
      this.addLine('macdL', line(bars, m.line), ind.macd.line, 1.5, LineStyle.Solid, pane);
      this.addLine('macdS', line(bars, m.signal), ind.macd.sig, 1.5, LineStyle.Solid, pane);
    }
    // Price pane gets most of the room; each lower pane an equal, readable share.
    this.chart.panes().forEach((p, i) => p.setStretchFactor(i === 0 ? 4 : 1));
  }

  /** Fractional bar index for any time, including between candles and in the future. */
  timeToLogical(t: number): number | null {
    const bars = this.bars;
    const n = bars.length;
    if (!n) return null;
    const step = n > 1 ? bars[n - 1].t - bars[n - 2].t : 60;
    if (t >= bars[n - 1].t) return n - 1 + (t - bars[n - 1].t) / Math.max(step, 1);
    if (t <= bars[0].t) return (t - bars[0].t) / Math.max(n > 1 ? bars[1].t - bars[0].t : step, 1);
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (bars[mid].t <= t) lo = mid;
      else hi = mid;
    }
    const span = bars[hi].t - bars[lo].t;
    return lo + (span > 0 ? (t - bars[lo].t) / span : 0);
  }

  logicalToTime(l: number): number | null {
    const bars = this.bars;
    const n = bars.length;
    if (!n) return null;
    const step = n > 1 ? bars[n - 1].t - bars[n - 2].t : 60;
    if (l >= n - 1) return Math.round(bars[n - 1].t + (l - (n - 1)) * step);
    if (l <= 0) return Math.round(bars[0].t + l * step);
    const i = Math.floor(l);
    return Math.round(bars[i].t + (l - i) * (bars[i + 1].t - bars[i].t));
  }

  xOf(t: number): number | null {
    const l = this.timeToLogical(t);
    return l === null ? null : this.chart.timeScale().logicalToCoordinate(l as never);
  }

  destroy() {
    this.chart.remove();
  }
}
