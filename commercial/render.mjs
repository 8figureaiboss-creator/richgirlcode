#!/usr/bin/env node
/* ============================================================================
   render.mjs — turns the live film into a deliverable file.

   It does NOT screen-record. It drives window.OTA_FILM.renderAt(ms, frame) in
   headless Chromium one frame at a time, so the output is frame-exact and
   independent of how fast the machine happens to be. Frames are piped straight
   into ffmpeg (nothing hits the disk), and the score is bounced through an
   OfflineAudioContext to WAV and muxed in.

     node render.mjs                     1920×1080 · 30 fps · MP4 + audio
     node render.mjs --vertical          1080×1920 for Reels / TikTok / Shorts
     node render.mjs --fps 60            smoother motion, 2× the frames
     node render.mjs --no-captions       clean plate for a different language
     node render.mjs --gif               also write a muted looping GIF
     node render.mjs --stills            contact sheet of key frames only
   ========================================================================== */
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FILM = join(here, 'dist', 'ota-commercial-30s.html');
const OUTDIR = join(here, 'dist');

/* Playwright may be installed globally in this environment rather than locally. */
const require = createRequire(import.meta.url);
let chromium;
for (const base of [here, '/opt/node-tools', '/usr/lib/node_modules', process.cwd()]) {
  try { ({ chromium } = require(require.resolve('playwright', { paths: [base] }))); break; } catch {}
}
if (!chromium) {
  console.error('playwright not found — install it, or run `node build.mjs` and open dist/ in a browser.');
  process.exit(1);
}

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const FPS = Number(val('--fps', 30));
const VERTICAL = flag('--vertical');
const CAPTIONS = !flag('--no-captions');
const WANT_GIF = flag('--gif');
const STILLS = flag('--stills');
const NAME = `ota-commercial-30s${VERTICAL ? '-9x16' : ''}${FPS !== 30 ? `-${FPS}fps` : ''}`;

const t0 = Date.now();
await mkdir(OUTDIR, { recursive: true });

console.log(`\n  OTA · 30s spot — headless render`);
console.log(`  ${VERTICAL ? '1080×1920 (9:16)' : '1920×1080 (16:9)'} · ${FPS} fps · captions ${CAPTIONS ? 'on' : 'off'}\n`);

const browser = await chromium.launch({
  args: ['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('  ! page error:', e.message); });

await page.goto(`file://${FILM}`, { waitUntil: 'load' });
await page.waitForFunction('window.OTA_FILM && window.OTA_FILM.ready', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(([v, c]) => {
  document.getElementById('poster').classList.add('hidden');
  window.OTA_FILM.setAspect(v ? 'vertical' : 'wide');
  window.OTA_FILM.setCaptions(c);
}, [VERTICAL, CAPTIONS]);

const DURATION = await page.evaluate(() => window.OTA_FILM.duration);

/* ── Stills mode: one PNG per scene, for review ── */
if (STILLS) {
  const scenes = await page.evaluate(() => window.OTA_FILM.scenes);
  const dir = join(OUTDIR, 'stills');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const marks = [];
  for (const s of scenes) marks.push([s.name, s.start + (s.end - s.start) * 0.55]);
  for (const [name, ms] of marks) {
    const b64 = await page.evaluate((m) => {
      window.OTA_FILM.renderAt(m);
      return window.OTA_FILM.canvas().toDataURL('image/png').split(',')[1];
    }, ms);
    const f = join(dir, `${String(Math.round(ms)).padStart(5, '0')}-${name}.png`);
    await writeFile(f, Buffer.from(b64, 'base64'));
    console.log(`  still  ${name.padEnd(12)} ${(ms / 1000).toFixed(2)}s`);
  }
  await browser.close();
  console.log(`\n  → ${dir}\n`);
  process.exit(0);
}

/* ── Score: bounce offline to WAV ── */
process.stdout.write('  bouncing score … ');
const wavB64 = await page.evaluate(async () => {
  const bytes = await window.OTA_FILM.bounceWav(30.6, 48000);
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
});
const wavPath = join(OUTDIR, `${NAME}.wav`);
await writeFile(wavPath, Buffer.from(wavB64, 'base64'));
console.log(`${(Buffer.from(wavB64, 'base64').length / 1024 / 1024).toFixed(1)} MB WAV`);

/* ── Video: stream PNG frames into ffmpeg ── */
const TOTAL = Math.round((DURATION / 1000) * FPS);
const mp4Path = join(OUTDIR, `${NAME}.mp4`);

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', 'pipe:0',
  '-i', wavPath,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
  '-x264-params', 'keyint=60:min-keyint=30',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest',
  mp4Path,
], { stdio: ['pipe', 'inherit', 'inherit'] });

let ffDead = null;
ff.on('error', (e) => { ffDead = e; });
ff.on('close', (c) => { if (c !== 0 && !ffDead) ffDead = new Error(`ffmpeg exited ${c}`); });

ff.stdin.on('error', (e) => { ffDead = ffDead || e; });
const write = (buf) => new Promise((res) => {
  if (ff.stdin.write(buf)) return res();
  ff.stdin.once('drain', res);
});

for (let f = 0; f < TOTAL; f++) {
  const ms = (f / FPS) * 1000;
  const b64 = await page.evaluate(([m, idx]) => {
    window.OTA_FILM.renderAt(m, idx);
    return window.OTA_FILM.canvas().toDataURL('image/png').split(',')[1];
  }, [ms, f]);
  await write(Buffer.from(b64, 'base64'));
  if (ffDead) throw ffDead;
  if (f % Math.ceil(TOTAL / 40) === 0 || f === TOTAL - 1) {
    const pct = ((f + 1) / TOTAL) * 100;
    const bar = '█'.repeat(Math.round(pct / 2.5)).padEnd(40, '·');
    process.stdout.write(`\r  ${bar} ${pct.toFixed(0).padStart(3)}%  frame ${f + 1}/${TOTAL}`);
  }
}
ff.stdin.end();
await new Promise((res, rej) => { ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))); });
console.log('');

/* ── Optional GIF (muted, halved) ── */
if (WANT_GIF) {
  process.stdout.write('  gif … ');
  const pal = join(OUTDIR, 'palette.png');
  const fil = `fps=12,scale=${VERTICAL ? 400 : 600}:-1:flags=lanczos`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4Path, '-vf', `${fil},palettegen=stats_mode=diff`, pal]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4Path, '-i', pal,
    '-lavfi', `${fil}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`, join(OUTDIR, `${NAME}.gif`)]);
  await rm(pal, { force: true });
  console.log('done');
}

await browser.close();

const size = (p) => { try { return (require('node:fs').statSync(p).size / 1024 / 1024).toFixed(2) + ' MB'; } catch { return '?'; } };
console.log(`\n  ✓ ${mp4Path}  (${size(mp4Path)})`);
if (WANT_GIF) console.log(`  ✓ ${join(OUTDIR, NAME + '.gif')}  (${size(join(OUTDIR, NAME + '.gif'))})`);
console.log(`  ✓ ${wavPath}  (${size(wavPath)})  — score stem, for a mix with VO`);
console.log(`    ${TOTAL} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
