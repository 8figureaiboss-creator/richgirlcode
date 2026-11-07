// New York time helpers. All stored times are true UTC Unix seconds; New York is only used
// to decide session boundaries and to format labels. DST is handled by Intl, not by hand.

export const NY = 'America/New_York';

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function nyParts(ms: number) {
  const p: Record<string, number> = {};
  for (const part of partsFmt.formatToParts(new Date(ms))) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Minutes New York is offset from UTC at the given instant (e.g. -300 in winter, -240 in summer). */
export function nyOffsetMinutes(ms: number): number {
  const p = nyParts(ms);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** Convert a New York wall-clock date + time ("09:30" or "0930") to UTC Unix seconds. */
export function nyToUtc(date: string, hhmm: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const clean = hhmm.replace(':', '');
  const h = Number(clean.slice(0, 2));
  const mi = Number(clean.slice(2, 4));
  const naive = Date.UTC(y, m - 1, d, h, mi);
  let t = naive - nyOffsetMinutes(naive) * 60000;
  const off2 = nyOffsetMinutes(t);
  t = naive - off2 * 60000;
  return Math.floor(t / 1000);
}

/** New York calendar date (YYYY-MM-DD) for a UTC Unix-seconds instant. */
export function nyDate(sec: number): string {
  const p = nyParts(sec * 1000);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY, hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY, month: 'short', day: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY, month: 'short' });
const fullFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
});
const fullDayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const fmtNyTime = (sec: number) => timeFmt.format(sec * 1000);
export const fmtNyDay = (sec: number) => dayFmt.format(sec * 1000);
export const fmtNyMonth = (sec: number) => monthFmt.format(sec * 1000);
export const fmtNyFull = (sec: number, daily: boolean) => (daily ? fullDayFmt : fullFmt).format(sec * 1000);
