// Workspace state: everything that's remembered between visits.
import type { Feed, Timeframe } from '../shared/types';

export interface GradientStop {
  color: string;
  pos: number; // 0-100
}

export interface Theme {
  id: string;
  name: string;
  builtIn?: boolean;
  bg: { mode: 'solid' | 'linear' | 'radial'; color: string; angle: number; stops: GradientStop[] };
  text: string;
  grid: { show: boolean; v: string; h: string };
  crosshair: string;
  up: { body: string; border: string; wick: string };
  down: { body: string; border: string; wick: string };
  hollowUp: boolean;
  bodyOpacity: number; // 0-100
  borders: boolean;
  wicks: boolean;
  volUp: string;
  volDown: string;
  accent: string; // UI accent (buttons, active timeframe)
}

export interface LineCfg {
  on: boolean;
  period: number;
  color: string;
}

export interface Indicators {
  sma: LineCfg[];
  ema: LineCfg[];
  vwap: { on: boolean; color: string };
  bb: { on: boolean; period: number; mult: number; color: string };
  volume: { on: boolean };
  rsi: { on: boolean; period: number; color: string; upper: number; lower: number };
  macd: { on: boolean; fast: number; slow: number; signal: number; line: string; sig: string; up: string; down: string };
}

export type DrawingType = 'trend' | 'ray' | 'hline' | 'support' | 'resistance' | 'rect';

export interface Point {
  t: number; // unix seconds (may lie between or beyond candles)
  p: number; // price
}

export interface Drawing {
  id: string;
  type: DrawingType;
  a: Point;
  b?: Point;
  color: string;
  width: number;
  dashed?: boolean;
}

export interface AppState {
  v: 1;
  updatedAt: number;
  symbol: string;
  tf: Timeframe;
  feed: Feed;
  ext: boolean;
  watchlist: string[];
  themeId: string;
  themes: Theme[];
  indicators: Indicators;
  drawings: Record<string, Drawing[]>;
  panel: { watchlist: boolean };
  pollSeconds: number;
}

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'ota-emerald',
    name: 'OTA Emerald',
    builtIn: true,
    bg: { mode: 'linear', color: '#08231b', angle: 165, stops: [{ color: '#0d3326', pos: 0 }, { color: '#071a14', pos: 55 }, { color: '#04100c', pos: 100 }] },
    text: '#e9dfc7',
    grid: { show: true, v: 'rgba(233,223,199,0.05)', h: 'rgba(233,223,199,0.07)' },
    crosshair: '#c9a24a',
    up: { body: '#c9a24a', border: '#e3c27a', wick: '#e3c27a' },
    down: { body: '#2a5b4a', border: '#5f9c86', wick: '#5f9c86' },
    hollowUp: false,
    bodyOpacity: 100,
    borders: true,
    wicks: true,
    volUp: 'rgba(201,162,74,0.35)',
    volDown: 'rgba(95,156,134,0.35)',
    accent: '#c9a24a',
  },
  {
    id: 'rose-ombre',
    name: 'Rosé Ombré',
    builtIn: true,
    bg: { mode: 'linear', color: '#1d1020', angle: 180, stops: [{ color: '#2b1330', pos: 0 }, { color: '#1a0f22', pos: 50 }, { color: '#0e0a14', pos: 100 }] },
    text: '#f3dfe8',
    grid: { show: true, v: 'rgba(243,223,232,0.04)', h: 'rgba(243,223,232,0.06)' },
    crosshair: '#f2a7c3',
    up: { body: '#f2a7c3', border: '#f7c6d8', wick: '#f7c6d8' },
    down: { body: '#6b4c8a', border: '#a487c4', wick: '#a487c4' },
    hollowUp: false,
    bodyOpacity: 100,
    borders: true,
    wicks: true,
    volUp: 'rgba(242,167,195,0.32)',
    volDown: 'rgba(164,135,196,0.32)',
    accent: '#f2a7c3',
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    builtIn: true,
    bg: { mode: 'radial', color: '#0b0d12', angle: 0, stops: [{ color: '#1a1d27', pos: 0 }, { color: '#0b0d12', pos: 70 }, { color: '#06070a', pos: 100 }] },
    text: '#d9d4c7',
    grid: { show: true, v: 'rgba(255,255,255,0.035)', h: 'rgba(255,255,255,0.05)' },
    crosshair: '#d4af37',
    up: { body: 'rgba(0,0,0,0)', border: '#d4af37', wick: '#d4af37' },
    down: { body: '#8a8f9c', border: '#8a8f9c', wick: '#8a8f9c' },
    hollowUp: true,
    bodyOpacity: 100,
    borders: true,
    wicks: true,
    volUp: 'rgba(212,175,55,0.3)',
    volDown: 'rgba(138,143,156,0.3)',
    accent: '#d4af37',
  },
  {
    id: 'classic',
    name: 'Classic Dark',
    builtIn: true,
    bg: { mode: 'solid', color: '#131722', angle: 180, stops: [{ color: '#131722', pos: 0 }, { color: '#131722', pos: 100 }] },
    text: '#d1d4dc',
    grid: { show: true, v: 'rgba(42,46,57,0.6)', h: 'rgba(42,46,57,0.6)' },
    crosshair: '#758696',
    up: { body: '#26a69a', border: '#26a69a', wick: '#26a69a' },
    down: { body: '#ef5350', border: '#ef5350', wick: '#ef5350' },
    hollowUp: false,
    bodyOpacity: 100,
    borders: true,
    wicks: true,
    volUp: 'rgba(38,166,154,0.4)',
    volDown: 'rgba(239,83,80,0.4)',
    accent: '#2962ff',
  },
  {
    id: 'cream-paper',
    name: 'Cream Paper',
    builtIn: true,
    bg: { mode: 'linear', color: '#f7f1e3', angle: 180, stops: [{ color: '#fbf7ee', pos: 0 }, { color: '#f1e8d4', pos: 100 }] },
    text: '#2a2a22',
    grid: { show: true, v: 'rgba(42,42,34,0.06)', h: 'rgba(42,42,34,0.08)' },
    crosshair: '#0d3326',
    up: { body: '#0d6b4f', border: '#0d6b4f', wick: '#0d6b4f' },
    down: { body: '#b3473a', border: '#b3473a', wick: '#b3473a' },
    hollowUp: false,
    bodyOpacity: 100,
    borders: true,
    wicks: true,
    volUp: 'rgba(13,107,79,0.25)',
    volDown: 'rgba(179,71,58,0.25)',
    accent: '#0d6b4f',
  },
];

export const DEFAULT_INDICATORS: Indicators = {
  sma: [
    { on: false, period: 50, color: '#8fb8ff' },
    { on: false, period: 200, color: '#ff9f6b' },
  ],
  ema: [
    { on: true, period: 9, color: '#e3c27a' },
    { on: true, period: 21, color: '#7fd1b9' },
  ],
  vwap: { on: true, color: '#f2a7c3' },
  bb: { on: false, period: 20, mult: 2, color: '#a487c4' },
  volume: { on: true },
  rsi: { on: true, period: 14, color: '#e3c27a', upper: 70, lower: 30 },
  macd: { on: false, fast: 12, slow: 26, signal: 9, line: '#7fd1b9', sig: '#e3c27a', up: 'rgba(127,209,185,0.6)', down: 'rgba(242,120,120,0.6)' },
};

export function defaultState(): AppState {
  return {
    v: 1,
    updatedAt: 0,
    symbol: 'SPY',
    tf: '15M',
    feed: 'iex',
    ext: false,
    watchlist: ['SPY', 'QQQ', 'GLD', 'IWM', 'AAPL', 'NVDA', 'TSLA'],
    themeId: 'ota-emerald',
    themes: BUILT_IN_THEMES.map((t) => structuredClone(t)),
    indicators: structuredClone(DEFAULT_INDICATORS),
    drawings: {},
    panel: { watchlist: true },
    pollSeconds: 5,
  };
}

/** Fill in anything missing from an older saved state, and keep built-in themes up to date. */
export function migrate(raw: any): AppState {
  const d = defaultState();
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return d;
  const userThemes = (Array.isArray(raw.themes) ? raw.themes : []).filter((t: Theme) => t && !t.builtIn);
  return {
    ...d,
    ...raw,
    themes: [...d.themes, ...userThemes],
    indicators: { ...d.indicators, ...(raw.indicators ?? {}) },
    drawings: raw.drawings ?? {},
    panel: { ...d.panel, ...(raw.panel ?? {}) },
  };
}

export function currentTheme(s: AppState): Theme {
  return s.themes.find((t) => t.id === s.themeId) ?? s.themes[0];
}

export function cssBackground(t: Theme): string {
  const stops = [...t.bg.stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos}%`).join(', ');
  if (t.bg.mode === 'linear') return `linear-gradient(${t.bg.angle}deg, ${stops})`;
  if (t.bg.mode === 'radial') return `radial-gradient(ellipse at 50% 30%, ${stops})`;
  return t.bg.color;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
