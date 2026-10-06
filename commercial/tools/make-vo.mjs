#!/usr/bin/env node
/* ============================================================================
   make-vo.mjs — build a voice track that is already in sync with the picture.

   The films carry a cue sheet: every line has an exact in-point and an exact
   window. This reads that sheet, gets one audio clip per line from whichever
   engine you have, and lays each clip at its own in-point on a silent bed the
   length of the film. The result drops onto the cut with no nudging.

   It never stretches a line to fill its window — silence between lines is the
   point. It will gently compress one that OVERRUNS its window (up to 1.15x,
   which is inaudible) and tells you when it had to.

     # 1. write the cue sheet
     node render.mjs --film howto --script

     # 2. build the track (pick the engine you actually have)
     node tools/make-vo.mjs --film howto --engine say   --voice Samantha
     node tools/make-vo.mjs --film howto --engine piper  --model en_US-lessac-high.onnx
     node tools/make-vo.mjs --film howto --engine files  --dir ./vo-lines
     node tools/make-vo.mjs --film howto --engine tone          # timing check only

     # 3. mux it, with the score side-chained underneath
     node render.mjs --film howto --vo dist/ota-howto-vo.wav
     node render.mjs --film howto --vertical --vo dist/ota-howto-vo.wav

   ENGINES
     say    macOS, built in, nothing to install. `say -v '?'` lists voices;
            Samantha, Ava, Tom and Alex all read well for this.
     piper  free neural TTS, runs offline on any OS and sounds close to a real
            read. `pip install piper-tts`, then take a voice from
            huggingface.co/rhasspy/piper-voices (en_US-lessac-high is a good
            narrator; en_US-ryan-high is the male equivalent).
     files  you already have the lines as audio — from a booth, from ElevenLabs,
            from anywhere. Name them by cue number: 01.wav, 02.wav, … Any
            format ffmpeg reads is fine.
     tone   a beep per line, at the right length. Proves the timing without
            needing any voice at all.
   ========================================================================== */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const OUTDIR = join(here, '..', 'dist');

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const STEMS = { brand: 'ota-commercial', howto: 'ota-howto' };
const WHICH = val('--film', 'brand');
if (!STEMS[WHICH]) die(`unknown --film ${WHICH}; expected ${Object.keys(STEMS).join(' or ')}`);
const STEM = STEMS[WHICH];

const ENGINE = val('--engine', 'tone');
const VOICE = val('--voice', 'Samantha');
const RATE = val('--rate', null);                 // say: words per minute
const MODEL = val('--model', null);               // piper: path to .onnx
const LENGTH = val('--length-scale', '1.0');      // piper: >1 is slower
const DIR = val('--dir', null);                   // files: folder of line audio
const SR = 48000;

const cuePath = join(OUTDIR, `${STEM}-cues.json`);
if (!existsSync(cuePath)) die(`no cue sheet at ${cuePath}\n  run:  node render.mjs --film ${WHICH} --script`);
const { duration, cues } = JSON.parse(readFileSync(cuePath, 'utf8'));

console.log(`\n  ${STEM} — ${cues.length} lines over ${(duration / 1000).toFixed(2)}s · engine ${ENGINE}\n`);

const tmp = mkdtempSync(join(tmpdir(), 'ota-vo-'));
const clips = [];
let overruns = 0;

try {
  for (const [i, c] of cues.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const raw = join(tmp, `${n}-raw.wav`);
    synth(c, raw, i);

    /* Clean it, then strip the lead-in. Every engine pads the front by a
       little; trimming to the first sound makes the in-point exact whatever
       produced the audio. Levelling is a single static gain rather than a
       dynamic one on purpose — a dynamic normaliser ramps its gain up over
       its first window, which swallows the first word of every line. */
    const clean = join(tmp, `${n}-clean.wav`);
    ff(['-i', raw, '-af', [
      'highpass=f=80',
      'afftdn=nf=-28',
      'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0:detection=peak',
      'areverse',
      'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.08:detection=peak',
      'areverse',
    ].join(','), '-ar', String(SR), '-ac', '2', clean]);

    const lift = Math.max(-6, Math.min(18, -3 - peakDb(clean)));
    const level = join(tmp, `${n}-level.wav`);
    ff(['-i', clean, '-af',
      `acompressor=threshold=0.18:ratio=2.6:attack=12:release=180,volume=${lift.toFixed(2)}dB`,
      '-ar', String(SR), '-ac', '2', level]);

    /* Fit the line to its window, but only ever by speeding it up slightly. */
    const want = c.d / 1000;
    const spoken = probe(level);
    const fitted = join(tmp, `${n}.wav`);
    if (spoken > want + 0.02) {
      const tempo = Math.min(1.15, spoken / want);
      ff(['-i', level, '-af', `atempo=${tempo.toFixed(4)}`, '-ar', String(SR), '-ac', '2', fitted]);
      if (spoken / tempo > want + 0.08) {
        overruns++;
        console.log(`  ! line ${n} runs ${spoken.toFixed(2)}s in a ${want.toFixed(2)}s window` +
                    ' — shorten the copy or widen the cue');
      }
    } else {
      ff(['-i', level, '-c:a', 'pcm_s16le', '-ar', String(SR), '-ac', '2', fitted]);
    }

    const got = probe(fitted);
    clips.push({ at: c.t, path: fitted, len: got });
    const bar = '\u258f'.repeat(Math.max(1, Math.round(got * 2)));
    console.log(`  ${n}  ${(c.t / 1000).toFixed(2).padStart(7)}s  ${got.toFixed(2)}s  ${bar}`);
  }

  /* Lay every clip on a silent bed the length of the film. */
  const args = ['-f', 'lavfi', '-t', String(duration / 1000 + 0.5),
                '-i', `anullsrc=channel_layout=stereo:sample_rate=${SR}`];
  for (const c of clips) args.push('-i', c.path);
  const chains = clips.map((c, i) =>
    `[${i + 1}:a]adelay=${Math.round(c.at)}|${Math.round(c.at)}[d${i}]`);
  const mix = `[0:a]${clips.map((_, i) => `[d${i}]`).join('')}` +
              `amix=inputs=${clips.length + 1}:duration=first:normalize=0,` +
              `alimiter=limit=0.89:attack=5:release=60[out]`;
  const out = join(OUTDIR, `${STEM}-vo.wav`);
  ff([...args, '-filter_complex', `${chains.join(';')};${mix}`, '-map', '[out]',
      '-ar', String(SR), '-ac', '2', out]);

  const mb = (readFileSync(out).length / 1024 / 1024).toFixed(1);
  console.log(`\n  ✓ ${out}  (${mb} MB)`);
  if (overruns) console.log(`  ${overruns} line(s) did not fit their window — see above.`);
  console.log(`\n  mux it:\n    node render.mjs --film ${WHICH} --vo ${out}` +
              `\n    node render.mjs --film ${WHICH} --vertical --vo ${out}\n`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

/* ── Engines ─────────────────────────────────────────────────────────────── */
function synth(cue, out, idx) {
  if (ENGINE === 'say') {
    const aiff = `${out}.aiff`;
    run('say', ['-v', VOICE, ...(RATE ? ['-r', String(RATE)] : []), '-o', aiff, cue.text],
      'macOS `say` not found — this engine only exists on a Mac.');
    ff(['-i', aiff, '-ar', String(SR), '-ac', '2', out]);

  } else if (ENGINE === 'piper') {
    if (!MODEL) die('--engine piper needs --model <voice.onnx>');
    if (!existsSync(MODEL)) die(`voice model not found: ${MODEL}`);
    const r = spawnSync('piper', ['-m', MODEL, '-f', out, '--length-scale', LENGTH],
      { input: cue.text, encoding: 'utf8' });
    if (r.error || r.status !== 0) {
      die(`piper failed: ${r.error ? r.error.message : (r.stderr || '').trim()}\n` +
          '  install:  pip install piper-tts');
    }

  } else if (ENGINE === 'files') {
    if (!DIR) die('--engine files needs --dir <folder>');
    const n = String(idx + 1).padStart(2, '0');
    const hit = readdirSync(DIR)
      .filter(f => /\.(wav|aiff?|mp3|m4a|flac|ogg)$/i.test(f))
      .sort()
      .find(f => f.startsWith(n) || f.startsWith(String(idx + 1) + '.') ||
                 f.startsWith(String(idx + 1) + '-'));
    if (!hit) die(`no audio file for line ${n} in ${DIR}\n  name them 01${extname('x.wav')}, 02.wav, …`);
    ff(['-i', join(DIR, hit), '-ar', String(SR), '-ac', '2', out]);

  } else if (ENGINE === 'tone') {
    /* A beep as long as the line would take at 160 wpm — timing only. */
    const words = cue.text.trim().split(/\s+/).length;
    const secs = Math.max(0.5, Math.min(cue.d / 1000, words / 160 * 60));
    ff(['-f', 'lavfi', '-i', `sine=frequency=${210 + (idx % 5) * 40}:duration=${secs.toFixed(3)}`,
        '-af', 'afade=t=in:d=0.04,afade=t=out:st=' + Math.max(0, secs - 0.06).toFixed(3) + ':d=0.06,volume=0.5',
        '-ar', String(SR), '-ac', '2', out]);

  } else {
    die(`unknown --engine ${ENGINE}; expected say, piper, files or tone`);
  }
}

/* ── Plumbing ────────────────────────────────────────────────────────────── */
function ff(args) {
  run('ffmpeg', ['-y', '-loglevel', 'error', ...args], 'ffmpeg not found — install it first.');
}
function run(cmd, args, hint) {
  try {
    execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    const msg = (e.stderr || '').toString().trim();
    die(`${cmd} failed${msg ? `:\n${msg}` : ''}${hint ? `\n  ${hint}` : ''}`);
  }
}
/* Peak level in dBFS, so each line can be lifted by a single static gain. */
function peakDb(p) {
  const r = spawnSync('ffmpeg', ['-i', p, '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' });
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(r.stderr || '');
  return m ? Number(m[1]) : -3;
}
function probe(p) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'csv=p=0', p]).toString().trim();
  return Number(out) || 0;
}
function die(m) { console.error(`\n  ${m}\n`); process.exit(1); }
