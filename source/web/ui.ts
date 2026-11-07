// Tiny DOM helpers and form controls shared by the workspace panels.

type Attrs = Record<string, any> | null;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...kids: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && typeof v !== 'string') (el as any)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export const svg = (paths: string) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = paths;
  return s;
};

export const ICONS = {
  cursor: '<path d="M5 3l14 7-6 2-2 6z"/>',
  trend: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M6.6 16.6 17.4 7.4"/>',
  ray: '<circle cx="5" cy="18" r="2"/><path d="M6.6 16.6 20 5"/><path d="M15 5h5v5"/>',
  hline: '<path d="M3 12h18"/><circle cx="12" cy="12" r="2"/>',
  support: '<rect x="3" y="13" width="18" height="6" rx="1.5"/><path d="M6 9l3-3 3 3 3-3 3 3"/>',
  resistance: '<rect x="3" y="5" width="18" height="6" rx="1.5"/><path d="M6 15l3 3 3-3 3 3 3-3"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
  magnet: '<path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M6 8h3M15 8h3"/><path d="M9 4v7a3 3 0 0 0 6 0V4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  wave: '<path d="M3 17l4-6 4 3 4-8 6 9"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
};

export function parseColor(c: string): { hex: string; a: number } {
  const s = (c ?? '').trim().toLowerCase();
  if (s === 'transparent') return { hex: '#000000', a: 0 };
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return { hex: '#' + m[1].split('').map((x) => x + x).join(''), a: 100 };
  m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) return { hex: '#' + m[1], a: m[2] ? Math.round((parseInt(m[2], 16) / 255) * 100) : 100 };
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(',').map((x) => x.trim());
    const hx = (n: string) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0');
    return { hex: `#${hx(r)}${hx(g)}${hx(b)}`, a: Math.round(Number(a) * 100) };
  }
  return { hex: '#ffffff', a: 100 };
}

export function makeColor(hex: string, a: number): string {
  if (a >= 100) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${(a / 100).toFixed(2)})`;
}

/** Color picker with an opacity slider. */
export function colorField(value: string, onChange: (c: string) => void, withAlpha = true) {
  const { hex, a } = parseColor(value);
  let cur = { hex, a };
  const pick = h('input', { type: 'color', value: hex, 'aria-label': 'Color' }) as HTMLInputElement;
  const alpha = h('input', { type: 'range', min: '0', max: '100', value: String(a), 'aria-label': 'Opacity', title: 'Opacity' }) as HTMLInputElement;
  const emit = () => onChange(makeColor(cur.hex, cur.a));
  pick.addEventListener('input', () => {
    cur.hex = pick.value;
    emit();
  });
  alpha.addEventListener('input', () => {
    cur.a = Number(alpha.value);
    emit();
  });
  return h('span', { class: 'otac-color' }, pick, withAlpha ? alpha : null);
}

export function sw(checked: boolean, onChange: (v: boolean) => void, label = '') {
  const i = h('input', { type: 'checkbox', class: 'otac-switch', 'aria-label': label }) as HTMLInputElement;
  i.checked = checked;
  i.addEventListener('change', () => onChange(i.checked));
  return i;
}

export function num(value: number, onChange: (v: number) => void, min = 1, max = 500, step = 1) {
  const i = h('input', { type: 'number', class: 'otac-num', min: String(min), max: String(max), step: String(step), value: String(value) }) as HTMLInputElement;
  i.addEventListener('change', () => {
    const v = Number(i.value);
    if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
    else i.value = String(value);
  });
  return i;
}

export function field(label: string, ...controls: (Node | null)[]) {
  return h('div', { class: 'otac-field' }, h('label', null, label), h('span', { style: { display: 'inline-flex', gap: '8px', alignItems: 'center' } }, ...controls));
}

export function seg<T extends string>(options: { value: T; label: string; title?: string }[], current: T, onPick: (v: T) => void) {
  const wrap = h('div', { class: 'otac-seg', role: 'group' });
  for (const o of options) {
    wrap.append(
      h('button', { type: 'button', 'aria-pressed': String(o.value === current), title: o.title, onclick: () => onPick(o.value) }, o.label),
    );
  }
  return wrap;
}

export const fmtPrice = (p: number) => (p >= 1000 ? p.toFixed(2) : p >= 1 ? p.toFixed(2) : p.toFixed(4));
export const fmtVol = (v: number) => (v >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(Math.round(v)));
