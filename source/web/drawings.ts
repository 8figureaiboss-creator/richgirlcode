import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type { IPrimitivePaneRenderer, IPrimitivePaneView, ISeriesPrimitive, SeriesAttachedParameter, Time } from 'lightweight-charts';
import type { ChartView } from './chart';
import { withAlpha } from './chart';
import { uid, type Drawing, type DrawingType, type Point } from './state';

export type Tool = 'cursor' | DrawingType;

const TWO_POINT: DrawingType[] = ['trend', 'ray', 'support', 'resistance', 'rect'];
export const TOOL_DEFAULT_COLOR: Record<DrawingType, string> = {
  trend: '#e3c27a',
  ray: '#8fb8ff',
  hline: '#f2a7c3',
  support: '#5fd0a0',
  resistance: '#f27878',
  rect: '#a487c4',
};

type Px = { x: number; y: number };
type Hit = { d: Drawing; part: 'a' | 'b' | 'body' };

function distToSegment(p: Px, a: Px, b: Px): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export class DrawingLayer implements ISeriesPrimitive<Time> {
  private requestUpdate?: () => void;
  tool: Tool = 'cursor';
  magnet = true;
  selected: string | null = null;
  private draft: Drawing | null = null;
  private drag: { hit: Hit; start: Point; orig: Drawing } | null = null;
  private hover: string | null = null;
  private paneView: IPrimitivePaneView;
  private width = 0;
  private height = 0;

  constructor(
    private view: ChartView,
    private host: HTMLElement,
    private get: () => Drawing[],
    private set: (d: Drawing[], transient?: boolean) => void,
    private onSelect: (d: Drawing | null) => void,
    private onToolDone: () => void,
  ) {
    const self = this;
    const renderer: IPrimitivePaneRenderer = { draw: (target) => self.draw(target) };
    this.paneView = { renderer: () => renderer, zOrder: () => 'top' };
    view.candles.attachPrimitive(this);
    host.addEventListener('pointerdown', this.onDown, true);
    window.addEventListener('pointermove', this.onMove, true);
    window.addEventListener('pointerup', this.onUp, true);
    window.addEventListener('keydown', this.onKey);
  }

  // ---- ISeriesPrimitive ----
  attached(p: SeriesAttachedParameter<Time>) {
    this.requestUpdate = p.requestUpdate;
  }
  detached() {
    this.requestUpdate = undefined;
  }
  updateAllViews() {}
  paneViews() {
    return [this.paneView];
  }

  refresh() {
    this.requestUpdate?.();
  }

  setTool(t: Tool) {
    this.tool = t;
    this.draft = null;
    if (t !== 'cursor') this.select(null);
    this.lockChart(t !== 'cursor');
    this.host.style.cursor = t === 'cursor' ? '' : 'crosshair';
    this.refresh();
  }

  select(id: string | null) {
    this.selected = id;
    this.onSelect(id ? this.get().find((d) => d.id === id) ?? null : null);
    this.refresh();
  }

  update(id: string, patch: Partial<Drawing>) {
    this.set(this.get().map((d) => (d.id === id ? { ...d, ...patch } : d)));
    this.refresh();
  }

  remove(id: string) {
    this.set(this.get().filter((d) => d.id !== id));
    if (this.selected === id) this.select(null);
    this.refresh();
  }

  destroy() {
    this.host.removeEventListener('pointerdown', this.onDown, true);
    window.removeEventListener('pointermove', this.onMove, true);
    window.removeEventListener('pointerup', this.onUp, true);
    window.removeEventListener('keydown', this.onKey);
    this.view.candles.detachPrimitive(this);
  }

  // ---- coordinates ----
  private lockChart(lock: boolean) {
    this.view.chart.applyOptions({ handleScroll: !lock, handleScale: !lock });
  }

  private pricePaneHeight(): number {
    return this.view.chart.panes()[0]?.getHeight() ?? this.host.clientHeight;
  }

  private toPx(p: Point): Px | null {
    const x = this.view.xOf(p.t);
    const y = this.view.candles.priceToCoordinate(p.p);
    return x === null || y === null ? null : { x, y };
  }

  private toPoint(e: PointerEvent): Point | null {
    const r = this.host.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (y > this.pricePaneHeight() || x > this.view.chart.timeScale().width()) return null;
    const logical = this.view.chart.timeScale().coordinateToLogical(x);
    const price = this.view.candles.coordinateToPrice(y);
    if (logical === null || price === null) return null;
    let t = this.view.logicalToTime(logical as number);
    let p = price as number;
    if (t === null) return null;
    if (this.magnet) {
      const i = Math.round(logical as number);
      const bar = this.view.bars[i];
      if (bar) {
        const near = [bar.o, bar.h, bar.l, bar.c]
          .map((v) => ({ v, y: this.view.candles.priceToCoordinate(v) }))
          .filter((c) => c.y !== null)
          .sort((a, b) => Math.abs((a.y as number) - y) - Math.abs((b.y as number) - y))[0];
        if (near && Math.abs((near.y as number) - y) < 10) {
          p = near.v;
          t = bar.t;
        }
      }
    }
    return { t, p };
  }

  private findHit(e: PointerEvent): Hit | null {
    const r = this.host.getBoundingClientRect();
    const m: Px = { x: e.clientX - r.left, y: e.clientY - r.top };
    const W = this.view.chart.timeScale().width();
    const list = [...this.get()].reverse();
    for (const d of list) {
      const a = this.toPx(d.a);
      const b = d.b ? this.toPx(d.b) : null;
      if (!a) continue;
      if (d.id === this.selected) {
        if (Math.hypot(m.x - a.x, m.y - a.y) < 8) return { d, part: 'a' };
        if (b && Math.hypot(m.x - b.x, m.y - b.y) < 8) return { d, part: 'b' };
      }
      if (d.type === 'hline' && Math.abs(m.y - a.y) < 6) return { d, part: 'body' };
      if (!b) continue;
      if (d.type === 'trend' && distToSegment(m, a, b) < 6) return { d, part: 'body' };
      if (d.type === 'ray') {
        const end = this.rayEnd(a, b, W);
        if (distToSegment(m, a, end) < 6) return { d, part: 'body' };
      }
      if (d.type === 'support' || d.type === 'resistance') {
        if (m.y >= Math.min(a.y, b.y) - 4 && m.y <= Math.max(a.y, b.y) + 4) return { d, part: 'body' };
      }
      if (d.type === 'rect') {
        const inX = m.x >= Math.min(a.x, b.x) - 4 && m.x <= Math.max(a.x, b.x) + 4;
        const inY = m.y >= Math.min(a.y, b.y) - 4 && m.y <= Math.max(a.y, b.y) + 4;
        if (inX && inY) return { d, part: 'body' };
      }
    }
    return null;
  }

  private rayEnd(a: Px, b: Px, W: number): Px {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(dx) < 0.001) return { x: a.x, y: dy >= 0 ? 1e4 : -1e4 };
    const k = ((dx > 0 ? W : 0) - a.x) / dx;
    return { x: a.x + dx * Math.max(k, 1), y: a.y + dy * Math.max(k, 1) };
  }

  // ---- input ----
  private onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (this.tool !== 'cursor') {
      const p = this.toPoint(e);
      if (!p) return;
      e.stopPropagation();
      e.preventDefault();
      const type = this.tool as DrawingType;
      if (type === 'hline') {
        this.commit({ id: uid(), type, a: p, color: TOOL_DEFAULT_COLOR[type], width: 1.5 });
        return;
      }
      if (!this.draft) {
        this.draft = { id: uid(), type, a: p, b: { ...p }, color: TOOL_DEFAULT_COLOR[type], width: type === 'trend' || type === 'ray' ? 2 : 1.5 };
      } else {
        this.draft.b = p;
        const d = this.draft;
        this.draft = null;
        this.commit(d);
      }
      this.refresh();
      return;
    }
    const hit = this.findHit(e);
    if (!hit) {
      if (this.selected) this.select(null);
      return;
    }
    const start = this.toPoint(e);
    if (!start) return;
    e.stopPropagation();
    this.lockChart(true);
    this.select(hit.d.id);
    this.drag = { hit, start, orig: structuredClone(hit.d) };
  };

  private onMove = (e: PointerEvent) => {
    if (this.draft) {
      const p = this.toPoint(e);
      if (p) {
        this.draft.b = p;
        this.refresh();
      }
      return;
    }
    if (this.drag) {
      const p = this.toPoint(e);
      if (!p) return;
      const { hit, start, orig } = this.drag;
      const dt = p.t - start.t;
      const dp = p.p - start.p;
      const moved: Drawing = structuredClone(orig);
      if (hit.part === 'a') moved.a = p;
      else if (hit.part === 'b') moved.b = p;
      else {
        moved.a = { t: orig.a.t + dt, p: orig.a.p + dp };
        if (orig.b) moved.b = { t: orig.b.t + dt, p: orig.b.p + dp };
      }
      this.set(this.get().map((d) => (d.id === moved.id ? moved : d)), true);
      this.refresh();
      return;
    }
    if (this.tool === 'cursor' && this.host.contains(e.target as Node)) {
      const h = this.findHit(e)?.d.id ?? null;
      if (h !== this.hover) {
        this.hover = h;
        this.host.style.cursor = h ? 'pointer' : '';
        this.refresh();
      }
    }
  };

  private onUp = () => {
    if (this.drag) {
      this.drag = null;
      this.lockChart(false);
      this.set(this.get()); // persist final position
    }
  };

  private onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Escape') {
      if (this.draft || this.tool !== 'cursor') {
        this.draft = null;
        this.onToolDone();
      } else this.select(null);
      this.refresh();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected) {
      e.preventDefault();
      this.remove(this.selected);
    }
  };

  private commit(d: Drawing) {
    if (d.b && d.type !== 'hline' && TWO_POINT.includes(d.type)) {
      const a = this.toPx(d.a);
      const b = this.toPx(d.b);
      if (a && b && Math.hypot(a.x - b.x, a.y - b.y) < 3) return; // ignore accidental double-click
    }
    this.set([...this.get(), d]);
    this.onToolDone();
    this.select(d.id);
  }

  // ---- rendering ----
  private draw(target: CanvasRenderingTarget2D) {
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      this.width = mediaSize.width;
      this.height = mediaSize.height;
      const all = this.draft ? [...this.get(), this.draft] : this.get();
      for (const d of all) this.drawOne(ctx, d);
    });
  }

  private drawOne(ctx: CanvasRenderingContext2D, d: Drawing) {
    const a = this.toPx(d.a);
    if (!a) return;
    const b = d.b ? this.toPx(d.b) : null;
    const sel = d.id === this.selected;
    const hov = d.id === this.hover;
    const W = this.view.chart.timeScale().width();
    ctx.save();
    ctx.strokeStyle = d.color;
    ctx.lineWidth = d.width + (hov && !sel ? 0.75 : 0);
    ctx.setLineDash(d.dashed ? [6, 5] : []);
    ctx.lineCap = 'round';

    const label = (text: string, x: number, y: number, align: CanvasTextAlign = 'right') => {
      ctx.setLineDash([]);
      ctx.font = "600 10px 'Manrope', system-ui, sans-serif";
      const w = ctx.measureText(text).width + 10;
      const lx = align === 'right' ? x - w : x;
      ctx.fillStyle = withAlpha(d.color, 90);
      ctx.beginPath();
      ctx.roundRect(lx, y - 8, w, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#0b0b0b';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(text, lx + 5, y);
    };
    const fmt = (p: number) => (p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(2) : p.toFixed(4));

    if (d.type === 'hline') {
      ctx.beginPath();
      ctx.moveTo(0, a.y);
      ctx.lineTo(W, a.y);
      ctx.stroke();
      label(fmt(d.a.p), W - 4, a.y);
    } else if (b && (d.type === 'trend' || d.type === 'ray')) {
      const end = d.type === 'ray' ? this.rayEnd(a, b, W) : b;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (b && (d.type === 'support' || d.type === 'resistance')) {
      const top = Math.min(a.y, b.y);
      const bot = Math.max(a.y, b.y);
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, withAlpha(d.color, d.type === 'resistance' ? 26 : 10));
      g.addColorStop(1, withAlpha(d.color, d.type === 'resistance' ? 10 : 26));
      ctx.fillStyle = g;
      ctx.fillRect(0, top, W, bot - top);
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(W, top);
      ctx.moveTo(0, bot);
      ctx.lineTo(W, bot);
      ctx.stroke();
      const hi = Math.max(d.a.p, d.b!.p);
      const lo = Math.min(d.a.p, d.b!.p);
      label(`${d.type === 'support' ? 'SUPPORT' : 'RESISTANCE'}  ${fmt(lo)} – ${fmt(hi)}`, 8, (top + bot) / 2, 'left');
    } else if (b && d.type === 'rect') {
      ctx.fillStyle = withAlpha(d.color, 14);
      ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    }

    if (sel || d === this.draft) {
      ctx.setLineDash([]);
      for (const h of [a, b]) {
        if (!h || (d.type === 'hline' && h === b)) continue;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = d.color;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
