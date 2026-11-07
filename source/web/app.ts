import css from './styles.css?inline';
import { ChartView } from './chart';
import { DataController, describeStatus, type ChartsHost, type DataStatus } from './data';
import { DrawingLayer, TOOL_DEFAULT_COLOR, type Tool } from './drawings';
import {
  BUILT_IN_THEMES,
  cssBackground,
  currentTheme,
  defaultState,
  migrate,
  uid,
  type AppState,
  type Drawing,
  type Theme,
} from './state';
import { ICONS, colorField, field, fmtPrice, fmtVol, h, num, parseColor, seg, svg, sw } from './ui';
import { TIMEFRAMES, type Bar, type Timeframe } from '../shared/types';

const LS_STATE = 'otac:state:v1';
const LS_ASSETS = 'otac:assets:v1';
const SAVE_DEBOUNCE = 1200;

type Asset = [symbol: string, name: string, exchange: string];

function loadFonts() {
  if (!document.getElementById('otac-style')) {
    const st = document.createElement('style');
    st.id = 'otac-style';
    st.textContent = css;
    document.head.append(st);
  }
  if (document.getElementById('otac-fonts')) return;
  const l = document.createElement('link');
  l.id = 'otac-fonts';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@500&display=swap';
  document.head.append(l);
}

function lsGet<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function lsSet(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked: server copy still saves */
  }
}

function luminance(color: string) {
  const { hex } = parseColor(color);
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export class OtaChartsApp {
  private s: AppState;
  private root: HTMLElement;
  private view!: ChartView;
  private layer!: DrawingLayer;
  private data!: DataController;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private quotesTimer: ReturnType<typeof setInterval> | null = null;
  private quotes: Record<string, { price: number; prevClose: number | null }> = {};
  private assets: Asset[] | null = null;
  private status: DataStatus = { kind: 'loading' };
  private overlay: HTMLElement | null = null;
  private els = {} as Record<string, HTMLElement>;
  private destroyed = false;

  constructor(private mountEl: HTMLElement, private host: ChartsHost) {
    loadFonts();
    this.s = migrate(lsGet(LS_STATE)) ?? defaultState();
    this.root = h('div', { class: 'otac' });
    mountEl.append(this.root);
    // On phone-width screens start with the watchlist tucked away (not saved as a preference).
    if (mountEl.clientWidth && mountEl.clientWidth < 860) this.s.panel.watchlist = false;
    this.build();
    this.applyTheme();
    this.reload();
    this.startQuotes();
    void this.syncFromServer();
  }

  // ---------- persistence ----------
  private save(immediateServer = false) {
    this.s.updatedAt = Date.now();
    lsSet(LS_STATE, this.s);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    const run = () => this.host.saveState(this.s).catch((e) => console.warn('[My Charts] save failed', e));
    if (immediateServer) void run();
    else this.saveTimer = setTimeout(run, SAVE_DEBOUNCE);
  }

  private async syncFromServer() {
    try {
      const remote = await this.host.loadState();
      if (this.destroyed || !remote) return;
      const r = migrate(remote);
      if (r.updatedAt > this.s.updatedAt) {
        this.s = r;
        lsSet(LS_STATE, r);
        this.rebuildChrome();
        this.applyTheme();
        this.view.setIndicators(this.s.indicators);
        this.layer.refresh();
        this.reload();
      } else if (this.s.updatedAt > r.updatedAt) {
        this.save(true);
      }
    } catch (e) {
      console.warn('[My Charts] could not load saved workspace', e);
    }
  }

  // ---------- layout ----------
  private build() {
    const top = h('header', { class: 'otac-top' });
    const tools = h('nav', { class: 'otac-tools', 'aria-label': 'Drawing tools' });
    const stage = h('main', { class: 'otac-stage' });
    const watch = h('aside', { class: 'otac-watch', 'aria-label': 'Watchlist' });
    this.root.append(top, h('div', { class: 'otac-body' }, tools, stage, watch));
    Object.assign(this.els, { top, tools, stage, watch });

    const chartEl = h('div', { class: 'otac-chart' });
    const legend = h('div', { class: 'otac-legend' });
    const drawbar = h('div', { class: 'otac-drawbar', role: 'toolbar', 'aria-label': 'Selected drawing' });
    const empty = h('div', { class: 'otac-empty' });
    stage.append(chartEl, legend, drawbar, empty);
    Object.assign(this.els, { chartEl, legend, drawbar, empty });

    this.view = new ChartView(chartEl);
    this.view.onCrosshair = (bar, prev) => this.renderLegend(bar, prev);
    this.view.setIndicators(this.s.indicators);
    this.layer = new DrawingLayer(
      this.view,
      chartEl,
      () => this.s.drawings[this.s.symbol] ?? [],
      (list, transient) => {
        this.s.drawings[this.s.symbol] = list;
        if (!transient) this.save();
      },
      (d) => this.renderDrawbar(d),
      () => this.setTool('cursor'),
    );
    this.data = new DataController(
      this.host,
      (bars) => {
        this.view.setBars(bars, this.s.tf);
        this.view.chart.timeScale().scrollToRealTime();
        this.layer.refresh();
        this.renderLegend(null, null);
      },
      (bars) => {
        this.view.mergeBars(bars);
        this.layer.refresh();
        this.renderLegend(null, null);
      },
      (st) => {
        this.status = st;
        this.renderBadge();
        this.renderEmpty();
        this.renderLegend(null, null);
      },
      () => this.s.pollSeconds,
    );
    this.rebuildChrome();
  }

  private rebuildChrome() {
    this.renderTop();
    this.renderTools();
    this.renderWatch();
    this.renderLegend(null, null);
  }

  private renderTop() {
    const top = this.els.top;
    top.replaceChildren();
    const asset = this.assetFor(this.s.symbol);
    top.append(
      h('div', { class: 'otac-brand' }, h('i'), 'My Charts'),
      h('button', { class: 'otac-symbol', type: 'button', title: 'Search symbols', onclick: () => this.openSearch() }, h('b', null, this.s.symbol), h('span', null, asset?.[1] ?? 'Search')),
      seg(
        TIMEFRAMES.map((tf) => ({ value: tf, label: tf })),
        this.s.tf,
        (tf) => this.set({ tf }),
      ),
      h('button', { class: 'otac-btn', type: 'button', onclick: () => this.openIndicators() }, svg(ICONS.wave), 'Indicators'),
      h('button', { class: 'otac-btn', type: 'button', onclick: () => this.openThemes() }, svg(ICONS.palette), 'Theme'),
      h('div', { class: 'otac-spacer' }),
      seg(
        [
          { value: 'rth', label: 'RTH', title: 'Regular hours 9:30–4:00 ET' },
          { value: 'eth', label: 'ETH', title: 'Extended hours 4:00 AM–8:00 PM ET' },
        ],
        this.s.ext ? 'eth' : 'rth',
        (v) => this.set({ ext: v === 'eth' }),
      ),
      seg(
        [
          { value: 'iex', label: 'Real-time IEX', title: 'Real-time trades from the IEX exchange only (free)' },
          { value: 'sip', label: 'Delayed SIP', title: 'All US exchanges, delayed at least 15 minutes (free)' },
        ],
        this.s.feed,
        (feed) => this.set({ feed }),
      ),
      (this.els.badge = h('div', { class: 'otac-badge', role: 'status', 'aria-live': 'polite' })),
      h('button', { class: 'otac-btn', type: 'button', title: 'Toggle watchlist', 'aria-pressed': String(this.s.panel.watchlist), onclick: () => this.toggleWatch() }, svg(ICONS.list)),
    );
    this.renderBadge();
  }

  private renderTools() {
    const tools: { tool: Tool; tip: string; icon: string }[] = [
      { tool: 'cursor', tip: 'Select / move  (Esc)', icon: ICONS.cursor },
      { tool: 'trend', tip: 'Trendline', icon: ICONS.trend },
      { tool: 'ray', tip: 'Ray (extends right)', icon: ICONS.ray },
      { tool: 'hline', tip: 'Horizontal line', icon: ICONS.hline },
      { tool: 'support', tip: 'Support zone', icon: ICONS.support },
      { tool: 'resistance', tip: 'Resistance zone', icon: ICONS.resistance },
      { tool: 'rect', tip: 'Rectangle', icon: ICONS.rect },
    ];
    const nav = this.els.tools;
    nav.replaceChildren();
    for (const t of tools) {
      nav.append(h('button', { class: 'otac-tool', type: 'button', 'data-tip': t.tip, 'aria-label': t.tip, 'aria-pressed': String(this.layer.tool === t.tool), onclick: () => this.setTool(t.tool) }, svg(t.icon)));
    }
    nav.append(
      h('hr'),
      h('button', { class: 'otac-tool', type: 'button', 'data-tip': `Magnet snap to OHLC: ${this.layer.magnet ? 'on' : 'off'}`, 'aria-label': 'Magnet', 'aria-pressed': String(this.layer.magnet), onclick: () => { this.layer.magnet = !this.layer.magnet; this.renderTools(); } }, svg(ICONS.magnet)),
      h('button', {
        class: 'otac-tool',
        type: 'button',
        'data-tip': `Clear all drawings on ${this.s.symbol}`,
        'aria-label': 'Clear drawings',
        onclick: () => {
          const n = (this.s.drawings[this.s.symbol] ?? []).length;
          if (n && confirm(`Delete all ${n} drawing${n > 1 ? 's' : ''} on ${this.s.symbol}?`)) {
            this.s.drawings[this.s.symbol] = [];
            this.layer.select(null);
            this.layer.refresh();
            this.save();
          }
        },
      }, svg(ICONS.trash)),
    );
  }

  private setTool(t: Tool) {
    this.layer.setTool(t);
    this.renderTools();
  }

  // ---------- watchlist ----------
  private toggleWatch() {
    this.s.panel.watchlist = !this.s.panel.watchlist;
    this.save();
    this.renderWatch();
    this.renderTop();
  }

  private renderWatch() {
    const w = this.els.watch;
    w.hidden = !this.s.panel.watchlist;
    w.replaceChildren();
    const input = h('input', { type: 'text', placeholder: 'Add ticker…', 'aria-label': 'Add ticker to watchlist', autocomplete: 'off', spellcheck: false }) as HTMLInputElement;
    const sugg = h('div', { class: 'otac-sugg', hidden: true });
    const add = (sym: string) => {
      sym = sym.trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(sym)) return;
      if (!this.s.watchlist.includes(sym)) this.s.watchlist.push(sym);
      this.save();
      this.renderWatch();
      void this.refreshQuotes();
    };
    this.attachAutocomplete(input, sugg, add);
    const list = h('div', { class: 'otac-list', role: 'list' });
    for (const sym of this.s.watchlist) {
      const q = this.quotes[sym];
      const chg = q && q.prevClose ? ((q.price - q.prevClose) / q.prevClose) * 100 : null;
      const row = h(
        'div',
        { class: 'otac-row', role: 'listitem', tabindex: '0', 'aria-current': String(sym === this.s.symbol), onclick: () => this.set({ symbol: sym }), onkeydown: (e: KeyboardEvent) => e.key === 'Enter' && this.set({ symbol: sym }) },
        h('div', null, h('b', null, sym), h('div', { style: { fontSize: '10.5px', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' } }, this.assetFor(sym)?.[1] ?? '')),
        h('div', { class: 'px' }, q ? fmtPrice(q.price) : '—', chg !== null ? h('small', { class: chg >= 0 ? 'pos' : 'neg' }, `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`) : null),
        h('button', {
          class: 'x',
          type: 'button',
          'aria-label': `Remove ${sym}`,
          onclick: (e: Event) => {
            e.stopPropagation();
            this.s.watchlist = this.s.watchlist.filter((x) => x !== sym);
            this.save();
            this.renderWatch();
          },
        }, '×'),
      );
      list.append(row);
    }
    w.append(
      h('header', null, 'Watchlist', h('small', null, `${this.s.watchlist.length} symbols`)),
      h('div', { class: 'otac-add' }, svg(ICONS.search), input, sugg),
      list,
      h('div', { class: 'otac-foot' }, Object.keys(this.quotes).length ? 'Prices: last IEX trade · updates every 30s' : 'Prices appear once market data is connected'),
    );
  }

  private startQuotes() {
    void this.refreshQuotes();
    this.quotesTimer = setInterval(() => {
      if (!document.hidden) void this.refreshQuotes();
    }, 30_000);
  }

  private async refreshQuotes() {
    if (!this.s.watchlist.length) return;
    try {
      const r = await this.host.call<{ quotes: Record<string, { price: number; prevClose: number | null }> }>('quotes', { symbols: this.s.watchlist });
      this.quotes = r.quotes ?? {};
    } catch {
      this.quotes = {};
    }
    if (!this.destroyed) this.renderWatch();
  }

  // ---------- symbol search ----------
  private assetFor(sym: string): Asset | undefined {
    return this.assets?.find((a) => a[0] === sym);
  }

  private async ensureAssets(): Promise<Asset[]> {
    if (this.assets) return this.assets;
    const cached = lsGet<{ fetchedAt: number; assets: Asset[] }>(LS_ASSETS);
    if (cached && Date.now() - cached.fetchedAt < 7 * 864e5) return (this.assets = cached.assets);
    try {
      const r = await this.host.call<{ fetchedAt: number; assets: Asset[] }>('assets');
      lsSet(LS_ASSETS, r);
      this.assets = r.assets;
      this.renderTop();
      this.renderWatch();
    } catch {
      this.assets = cached?.assets ?? [];
    }
    return this.assets;
  }

  private search(q: string, list: Asset[]): Asset[] {
    q = q.trim().toUpperCase();
    if (!q) return [];
    const exact: Asset[] = [];
    const prefix: Asset[] = [];
    const named: Asset[] = [];
    for (const a of list) {
      if (a[0] === q) exact.push(a);
      else if (a[0].startsWith(q)) prefix.push(a);
      else if (q.length > 1 && a[1].toUpperCase().includes(q)) named.push(a);
      if (prefix.length > 40 && named.length > 40) break;
    }
    prefix.sort((a, b) => a[0].length - b[0].length);
    const res = [...exact, ...prefix, ...named].slice(0, 12);
    if (!exact.length && /^[A-Z][A-Z0-9.\-]{0,9}$/.test(q)) res.unshift([q, 'Use this ticker', '']);
    return res;
  }

  private attachAutocomplete(input: HTMLInputElement, box: HTMLElement, pick: (sym: string) => void) {
    let active = 0;
    let items: Asset[] = [];
    const render = () => {
      box.replaceChildren();
      box.hidden = !items.length;
      items.forEach((a, i) =>
        box.append(
          h('button', { type: 'button', role: 'option', 'aria-selected': String(i === active), onmousedown: (e: Event) => { e.preventDefault(); choose(a[0]); } }, h('b', null, a[0]), h('span', null, a[1]), h('small', null, a[2])),
        ),
      );
    };
    const choose = (sym: string) => {
      pick(sym);
      input.value = '';
      items = [];
      render();
    };
    input.addEventListener('focus', () => void this.ensureAssets());
    input.addEventListener('input', async () => {
      const list = await this.ensureAssets();
      items = this.search(input.value, list);
      active = 0;
      render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') active = Math.min(items.length - 1, active + 1);
      else if (e.key === 'ArrowUp') active = Math.max(0, active - 1);
      else if (e.key === 'Enter') {
        e.preventDefault();
        choose(items[active]?.[0] ?? input.value);
        return;
      } else if (e.key === 'Escape') {
        items = [];
      } else return;
      render();
    });
    input.addEventListener('blur', () => setTimeout(() => ((box.hidden = true)), 120));
  }

  private openSearch() {
    const input = h('input', { type: 'text', placeholder: 'Search ticker or company…', 'aria-label': 'Search symbols', autocomplete: 'off', spellcheck: false }) as HTMLInputElement;
    const box = h('div', { class: 'otac-sugg', hidden: true });
    this.attachAutocomplete(input, box, (sym) => {
      this.closeOverlay();
      this.set({ symbol: sym });
    });
    const wrap = h('div', { class: 'otac-add', style: { margin: '0' } }, svg(ICONS.search), input, box);
    this.openModal('Symbol search', h('div', { class: 'otac-search-modal' }, wrap, h('p', { class: 'otac-note' }, 'US-listed stocks and ETFs. Press Enter to open.')));
    setTimeout(() => input.focus(), 30);
  }

  // ---------- state changes ----------
  private set(patch: Partial<AppState>) {
    const prev = { symbol: this.s.symbol, tf: this.s.tf, feed: this.s.feed, ext: this.s.ext };
    Object.assign(this.s, patch);
    this.save();
    if (patch.symbol && patch.symbol !== prev.symbol) this.layer.select(null);
    this.renderTop();
    this.renderWatch();
    if (prev.symbol !== this.s.symbol || prev.tf !== this.s.tf || prev.feed !== this.s.feed || prev.ext !== this.s.ext) this.reload();
  }

  private reload() {
    this.view.setBars([], this.s.tf);
    this.layer.refresh();
    void this.data.load({ symbol: this.s.symbol, tf: this.s.tf, feed: this.s.feed, ext: this.s.ext });
  }

  // ---------- legend / badge / empty states ----------
  private renderLegend(bar: Bar | null, prev: Bar | null) {
    const bars = this.view?.bars ?? [];
    bar ??= bars.at(-1) ?? null;
    prev ??= bars.length > 1 ? bars.at(-2)! : null;
    const L = this.els.legend;
    if (!L) return;
    L.replaceChildren();
    const row1 = h('div', { class: 'row1' }, h('span', { class: 'sym' }, this.s.symbol), h('span', { class: 'tf' }, `${this.s.tf} · ${this.s.ext ? 'ETH' : 'RTH'} · ET`));
    L.append(row1);
    if (bar) {
      const chg = prev ? bar.c - prev.c : 0;
      const pct = prev ? (chg / prev.c) * 100 : 0;
      L.append(
        h(
          'div',
          { class: 'ohlc' },
          ...(['o', 'h', 'l', 'c'] as const).map((k) => h('span', null, h('em', null, k.toUpperCase()), fmtPrice(bar![k]))),
          h('span', null, h('em', null, 'V'), fmtVol(bar.v)),
          prev ? h('span', { class: `chg ${chg >= 0 ? 'pos' : 'neg'}` }, `${chg >= 0 ? '+' : ''}${chg.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`) : null,
        ),
      );
    }
    if (this.status.kind === 'ok') {
      const d = describeStatus(this.status, this.s.pollSeconds);
      L.append(h('div', { class: 'src' }, h('b', null, d.title), ' · ', d.detail));
    }
    const ind = this.s.indicators;
    const tags: [string, string][] = [];
    ind.ema.filter((m) => m.on).forEach((m) => tags.push([`EMA ${m.period}`, m.color]));
    ind.sma.filter((m) => m.on).forEach((m) => tags.push([`SMA ${m.period}`, m.color]));
    if (ind.vwap.on && this.s.tf !== '1D') tags.push(['VWAP', ind.vwap.color]);
    if (ind.bb.on) tags.push([`BB ${ind.bb.period}, ${ind.bb.mult}`, ind.bb.color]);
    if (tags.length) L.append(h('div', { class: 'ind' }, ...tags.map(([t, c]) => h('span', { style: { color: c } }, '● ' + t))));
  }

  private renderBadge() {
    const b = this.els.badge;
    if (!b) return;
    const d = describeStatus(this.status, this.s.pollSeconds);
    b.dataset.tone = d.tone;
    b.title = d.detail;
    b.replaceChildren(h('i'), h('span', null, d.title), h('small', null, d.detail));
  }

  private renderEmpty() {
    const e = this.els.empty;
    e.replaceChildren();
    const st = this.status;
    const card = (...kids: (Node | string | null)[]) => e.append(h('div', null, ...kids));
    if (st.kind === 'loading') card(h('div', { class: 'otac-spinner' }), h('p', null, `Loading ${this.s.symbol} · ${this.s.tf}…`));
    else if (st.kind === 'not_configured')
      card(
        h('h3', null, 'Market data isn’t connected yet'),
        h('p', null, 'Your watchlist, drawings, indicators and themes all work and save. Candles appear once your free Alpaca keys are added to Base44 Secrets — no prices are ever simulated.'),
      );
    else if (st.kind === 'error')
      card(
        h('h3', null, 'Data unavailable'),
        h('p', null, st.message),
        h('div', { class: 'otac-actions', style: { justifyContent: 'center' } }, h('button', { class: 'otac-btn primary', type: 'button', onclick: () => this.reload() }, 'Try again')),
      );
    else if (st.kind === 'ok' && st.empty)
      card(h('h3', null, 'No candles'), h('p', null, `${this.s.feed === 'iex' ? 'IEX' : 'SIP'} has no ${this.s.ext ? 'extended' : 'regular'}-hours trades for ${this.s.symbol} on ${this.s.tf} in this window. Try another feed or session.`));
  }

  // ---------- selected drawing toolbar ----------
  private renderDrawbar(d: Drawing | null) {
    const bar = this.els.drawbar;
    bar.classList.toggle('show', !!d);
    bar.replaceChildren();
    if (!d) return;
    const palette = [TOOL_DEFAULT_COLOR[d.type], '#e3c27a', '#f2a7c3', '#8fb8ff', '#5fd0a0', '#f27878', '#a487c4', '#ffffff'].filter((c, i, a) => a.indexOf(c) === i);
    for (const c of palette) {
      bar.append(h('button', { class: 'sw', type: 'button', 'aria-label': `Color ${c}`, 'aria-pressed': String(d.color === c), style: { background: c }, onclick: () => this.patchDrawing(d.id, { color: c }) }));
    }
    bar.append(
      colorField(d.color, (c) => this.patchDrawing(d.id, { color: c }, false), false),
      seg(
        [1, 2, 3].map((w) => ({ value: String(w), label: `${w}px` })),
        String(Math.round(d.width)),
        (w) => this.patchDrawing(d.id, { width: Number(w) }),
      ),
      h('button', { class: 'otac-btn', type: 'button', 'aria-pressed': String(!!d.dashed), onclick: () => this.patchDrawing(d.id, { dashed: !d.dashed }) }, d.dashed ? 'Dashed' : 'Solid'),
      h('button', { class: 'otac-btn', type: 'button', 'aria-label': 'Delete drawing', onclick: () => this.layer.remove(d.id) }, svg(ICONS.trash)),
    );
  }

  private patchDrawing(id: string, patch: Partial<Drawing>, rerender = true) {
    this.layer.update(id, patch);
    this.save();
    if (rerender) this.renderDrawbar(this.s.drawings[this.s.symbol]?.find((x) => x.id === id) ?? null);
  }

  // ---------- overlays ----------
  private closeOverlay() {
    this.overlay?.remove();
    this.overlay = null;
  }

  private openModal(title: string, body: Node) {
    this.closeOverlay();
    const scrim = h(
      'div',
      { class: 'otac-scrim', onmousedown: (e: Event) => e.target === scrim && this.closeOverlay(), onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && this.closeOverlay() },
      h('div', { class: 'otac-sheet narrow', role: 'dialog', 'aria-label': title }, h('header', null, h('h2', null, title), h('button', { class: 'otac-close', type: 'button', 'aria-label': 'Close', onclick: () => this.closeOverlay() }, '×')), h('div', { class: 'content' }, body)),
    );
    this.root.append(scrim);
    this.overlay = scrim;
  }

  private openDrawer(title: string, build: (content: HTMLElement) => void) {
    this.closeOverlay();
    const content = h('div', { class: 'content' });
    const drawer = h(
      'div',
      { class: 'otac-drawer', role: 'dialog', 'aria-label': title, onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && this.closeOverlay() },
      h('header', null, h('h2', null, title), h('button', { class: 'otac-close', type: 'button', 'aria-label': 'Close', onclick: () => this.closeOverlay() }, '×')),
      content,
    );
    build(content);
    this.root.append(drawer);
    this.overlay = drawer;
  }

  // ---------- indicators ----------
  private openIndicators() {
    const ind = this.s.indicators;
    const apply = () => {
      this.view.setIndicators(ind);
      this.renderLegend(null, null);
      this.save();
    };
    const draw = (c: HTMLElement) => {
      c.replaceChildren();
      const lineRows = (kind: 'ema' | 'sma') =>
        ind[kind].map((m, i) =>
          field(
            `${kind.toUpperCase()}`,
            sw(m.on, (v) => { m.on = v; apply(); }, `${kind} ${m.period}`),
            num(m.period, (v) => { m.period = v; apply(); }, 1, 500),
            colorField(m.color, (col) => { m.color = col; apply(); }, false),
            h('button', { class: 'otac-mini danger', type: 'button', onclick: () => { ind[kind].splice(i, 1); apply(); draw(c); } }, 'Remove'),
          ),
        );
      c.append(
        h('h4', null, 'Moving averages'),
        ...lineRows('ema'),
        ...lineRows('sma'),
        h(
          'div',
          { class: 'otac-actions', style: { justifyContent: 'flex-start', marginTop: '10px' } },
          h('button', { class: 'otac-btn', type: 'button', onclick: () => { ind.ema.push({ on: true, period: 50, color: '#8fb8ff' }); apply(); draw(c); } }, '+ EMA'),
          h('button', { class: 'otac-btn', type: 'button', onclick: () => { ind.sma.push({ on: true, period: 200, color: '#ff9f6b' }); apply(); draw(c); } }, '+ SMA'),
        ),
        h('h4', null, 'VWAP'),
        field('Session VWAP (resets each day)', sw(ind.vwap.on, (v) => { ind.vwap.on = v; apply(); }), colorField(ind.vwap.color, (col) => { ind.vwap.color = col; apply(); }, false)),
        h('p', { class: 'otac-note' }, 'Intraday only (hidden on 1D). On the IEX feed it is weighted by IEX trades only.'),
        h('h4', null, 'Bollinger Bands'),
        field('Show', sw(ind.bb.on, (v) => { ind.bb.on = v; apply(); }), colorField(ind.bb.color, (col) => { ind.bb.color = col; apply(); }, false)),
        field('Length / Std dev', num(ind.bb.period, (v) => { ind.bb.period = v; apply(); }, 2, 300), num(ind.bb.mult, (v) => { ind.bb.mult = v; apply(); }, 0.5, 5, 0.1)),
        h('h4', null, 'Volume'),
        field('Volume bars', sw(ind.volume.on, (v) => { ind.volume.on = v; apply(); })),
        h('h4', null, 'RSI'),
        field('Show RSI pane', sw(ind.rsi.on, (v) => { ind.rsi.on = v; apply(); }), colorField(ind.rsi.color, (col) => { ind.rsi.color = col; apply(); }, false)),
        field('Length', num(ind.rsi.period, (v) => { ind.rsi.period = v; apply(); }, 2, 100)),
        field('Overbought / Oversold', num(ind.rsi.upper, (v) => { ind.rsi.upper = v; apply(); }, 50, 100), num(ind.rsi.lower, (v) => { ind.rsi.lower = v; apply(); }, 0, 50)),
        h('h4', null, 'MACD'),
        field('Show MACD pane', sw(ind.macd.on, (v) => { ind.macd.on = v; apply(); })),
        field('Fast / Slow / Signal', num(ind.macd.fast, (v) => { ind.macd.fast = v; apply(); }, 2, 100), num(ind.macd.slow, (v) => { ind.macd.slow = v; apply(); }, 3, 200), num(ind.macd.signal, (v) => { ind.macd.signal = v; apply(); }, 2, 100)),
        field('MACD / Signal', colorField(ind.macd.line, (col) => { ind.macd.line = col; apply(); }, false), colorField(ind.macd.sig, (col) => { ind.macd.sig = col; apply(); }, false)),
        field('Histogram + / −', colorField(ind.macd.up, (col) => { ind.macd.up = col; apply(); }), colorField(ind.macd.down, (col) => { ind.macd.down = col; apply(); })),
        h('h4', null, 'Live refresh'),
        field('Refresh every (seconds)', num(this.s.pollSeconds, (v) => { this.s.pollSeconds = v; this.save(); this.renderBadge(); }, 3, 60)),
        h('p', { class: 'otac-note' }, 'Each refresh is one call to your Base44 function. Refreshing pauses when this tab is hidden or the session is closed.'),
      );
    };
    this.openDrawer('Indicators', draw);
  }

  // ---------- theme studio ----------
  private applyTheme() {
    const t = currentTheme(this.s);
    this.root.style.background = cssBackground(t);
    this.root.dataset.tone = luminance(t.text) < 0.45 ? 'light' : 'dark';
    this.root.style.setProperty('--accent', t.accent);
    this.view.applyTheme(t);
  }

  /** Editing a built-in theme makes a personal copy first, so presets are never lost. */
  private editableTheme(): Theme {
    const t = currentTheme(this.s);
    if (!t.builtIn) return t;
    const copy: Theme = { ...structuredClone(t), id: uid(), name: `${t.name} — Mine`, builtIn: false };
    this.s.themes.push(copy);
    this.s.themeId = copy.id;
    return copy;
  }

  private openThemes() {
    let selStop = 0;
    const draw = (c: HTMLElement) => {
      c.replaceChildren();
      const cur = currentTheme(this.s);
      const edit = (fn: (t: Theme) => void, redraw = false) => {
        const t = this.editableTheme();
        fn(t);
        this.applyTheme();
        this.save();
        if (redraw || t.id !== cur.id) draw(c);
      };

      // presets
      const grid = h('div', { class: 'otac-presetgrid' });
      for (const t of this.s.themes) {
        const chip = h('div', { class: 'chip', style: { background: cssBackground(t) } });
        [
          [8, 14, t.up.body === 'rgba(0,0,0,0)' || t.hollowUp ? 'transparent' : t.up.body, t.up.border],
          [18, 20, t.down.body, t.down.border],
          [28, 10, t.hollowUp ? 'transparent' : t.up.body, t.up.border],
        ].forEach(([left, hgt, fill, border]) =>
          chip.append(h('i', { style: { left: `${left}px`, height: `${hgt}px`, background: String(fill), border: `1px solid ${border}` } })),
        );
        grid.append(
          h('button', { class: 'otac-preset', type: 'button', 'aria-pressed': String(t.id === this.s.themeId), onclick: () => { this.s.themeId = t.id; this.applyTheme(); this.save(); draw(c); } }, chip, h('div', null, t.name, h('small', null, t.builtIn ? 'Preset' : 'Saved theme'))),
        );
      }
      c.append(h('h4', null, 'Saved themes'), grid);

      const nameInput = h('input', { class: 'otac-name', value: cur.name, 'aria-label': 'Theme name', disabled: !!cur.builtIn }) as HTMLInputElement;
      nameInput.addEventListener('change', () => edit((t) => (t.name = nameInput.value.trim() || t.name), true));
      c.append(
        h(
          'div',
          { class: 'otac-actions', style: { justifyContent: 'space-between', alignItems: 'center' } },
          nameInput,
          h('span', { style: { display: 'inline-flex', gap: '8px' } },
            h('button', { class: 'otac-btn', type: 'button', onclick: () => { const t = structuredClone(cur); t.id = uid(); t.builtIn = false; t.name = `${cur.name} copy`; this.s.themes.push(t); this.s.themeId = t.id; this.save(); draw(c); } }, 'Save as new'),
            cur.builtIn ? null : h('button', { class: 'otac-btn', type: 'button', onclick: () => { if (!confirm(`Delete theme “${cur.name}”?`)) return; this.s.themes = this.s.themes.filter((x) => x.id !== cur.id); this.s.themeId = BUILT_IN_THEMES[0].id; this.applyTheme(); this.save(); draw(c); } }, 'Delete'),
          ),
        ),
        cur.builtIn ? h('p', { class: 'otac-note' }, 'Presets stay untouched — your first edit saves a personal copy.') : '',
      );

      // background
      c.append(h('h4', null, 'Background'));
      c.append(
        field(
          'Style',
          seg(
            [
              { value: 'solid', label: 'Solid' },
              { value: 'linear', label: 'Ombré' },
              { value: 'radial', label: 'Glow' },
            ],
            cur.bg.mode,
            (mode) => edit((t) => (t.bg.mode = mode), true),
          ),
        ),
      );
      if (cur.bg.mode === 'solid') {
        c.append(field('Color', colorField(cur.bg.color, (col) => edit((t) => (t.bg.color = col)), false)));
      } else {
        const stops = cur.bg.stops;
        selStop = Math.min(selStop, stops.length - 1);
        const bar = h('div', { class: 'otac-gradbar', style: { background: `linear-gradient(90deg, ${[...stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos}%`).join(', ')})` }, title: 'Click to add a color stop' });
        bar.addEventListener('mousedown', (e) => {
          if (e.target !== bar) return;
          const r = bar.getBoundingClientRect();
          const pos = Math.round(((e.clientX - r.left) / r.width) * 100);
          edit((t) => {
            t.bg.stops.push({ color: t.bg.stops[selStop]?.color ?? '#333333', pos });
            selStop = t.bg.stops.length - 1;
          }, true);
        });
        stops.forEach((s, i) => {
          const knob = h('button', { class: 'stop', type: 'button', 'aria-label': `Color stop ${i + 1}`, 'aria-pressed': String(i === selStop), style: { left: `${s.pos}%`, background: s.color } });
          knob.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            selStop = i;
            const r = bar.getBoundingClientRect();
            const move = (ev: PointerEvent) => {
              const pos = Math.max(0, Math.min(100, Math.round(((ev.clientX - r.left) / r.width) * 100)));
              edit((t) => (t.bg.stops[i].pos = pos));
              knob.style.left = `${pos}%`;
              const sorted = [...currentTheme(this.s).bg.stops].sort((a, b) => a.pos - b.pos);
              bar.style.background = `linear-gradient(90deg, ${sorted.map((x) => `${x.color} ${x.pos}%`).join(', ')})`;
            };
            const up = () => {
              window.removeEventListener('pointermove', move);
              window.removeEventListener('pointerup', up);
              draw(c);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
          });
          bar.append(knob);
        });
        const st = stops[selStop];
        c.append(
          bar,
          field(
            `Stop ${selStop + 1} color`,
            colorField(st.color, (col) => edit((t) => (t.bg.stops[selStop].color = col))),
            stops.length > 2 ? h('button', { class: 'otac-mini danger', type: 'button', onclick: () => edit((t) => { t.bg.stops.splice(selStop, 1); selStop = 0; }, true) }, 'Remove') : null,
          ),
          cur.bg.mode === 'linear'
            ? field('Angle', (() => {
                const r = h('input', { type: 'range', class: 'otac-range', min: '0', max: '360', value: String(cur.bg.angle), 'aria-label': 'Gradient angle' }) as HTMLInputElement;
                r.addEventListener('input', () => edit((t) => (t.bg.angle = Number(r.value))));
                return r;
              })())
            : '',
        );
      }

      // candles
      c.append(
        h('h4', null, 'Candles'),
        h(
          'div',
          null,
          field('Bullish body · border · wick', colorField(cur.up.body, (col) => edit((t) => (t.up.body = col))), colorField(cur.up.border, (col) => edit((t) => (t.up.border = col)), false), colorField(cur.up.wick, (col) => edit((t) => (t.up.wick = col)), false)),
          field('Bearish body · border · wick', colorField(cur.down.body, (col) => edit((t) => (t.down.body = col))), colorField(cur.down.border, (col) => edit((t) => (t.down.border = col)), false), colorField(cur.down.wick, (col) => edit((t) => (t.down.wick = col)), false)),
          field('Hollow bullish candles', sw(cur.hollowUp, (v) => edit((t) => (t.hollowUp = v)))),
          field('Show borders', sw(cur.borders, (v) => edit((t) => (t.borders = v)))),
          field('Show wicks', sw(cur.wicks, (v) => edit((t) => (t.wicks = v)))),
          field('Body opacity', (() => {
            const r = h('input', { type: 'range', class: 'otac-range', min: '10', max: '100', value: String(cur.bodyOpacity), 'aria-label': 'Body opacity' }) as HTMLInputElement;
            r.addEventListener('input', () => edit((t) => (t.bodyOpacity = Number(r.value))));
            return r;
          })()),
          field('Volume up / down', colorField(cur.volUp, (col) => edit((t) => (t.volUp = col))), colorField(cur.volDown, (col) => edit((t) => (t.volDown = col)))),
        ),
        h('h4', null, 'Grid & text'),
        field('Show grid', sw(cur.grid.show, (v) => edit((t) => (t.grid.show = v)))),
        field('Vertical grid', colorField(cur.grid.v, (col) => edit((t) => (t.grid.v = col)))),
        field('Horizontal grid', colorField(cur.grid.h, (col) => edit((t) => (t.grid.h = col)))),
        field('Text', colorField(cur.text, (col) => edit((t) => (t.text = col)), false)),
        field('Crosshair', colorField(cur.crosshair, (col) => edit((t) => (t.crosshair = col)), false)),
        field('Accent', colorField(cur.accent, (col) => edit((t) => (t.accent = col)), false)),
      );
    };
    this.openDrawer('Theme studio', draw);
  }

  destroy() {
    this.destroyed = true;
    this.data.destroy();
    this.layer.destroy();
    this.view.destroy();
    if (this.quotesTimer) clearInterval(this.quotesTimer);
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      void this.host.saveState(this.s).catch(() => {});
    }
    this.root.remove();
  }
}

export function mount(el: HTMLElement, host: ChartsHost) {
  const app = new OtaChartsApp(el, host);
  return { destroy: () => app.destroy() };
}
