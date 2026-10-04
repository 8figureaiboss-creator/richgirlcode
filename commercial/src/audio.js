/* ============================================================================
   audio.js — the score, synthesised from scratch in WebAudio.
   No samples, no CDN. The same scheduler runs on a live AudioContext (playback)
   and on an OfflineAudioContext (bounce to WAV for the MP4 mux), so what you
   hear in the browser is bit-identical to what lands in the video.
   Tempo 120 BPM → beat 0.5s, bar 2s. Key: C minor.
   ========================================================================== */

const BEAT = 0.5;
const BAR  = BEAT * 4;
const N = {                                   // frequencies, Hz
  C1: 32.70, G1: 49.00, C2: 65.41, Eb2: 77.78, F2: 87.31, G2: 98.00, Ab2: 103.83,
  Bb2: 116.54, C3: 130.81, Eb3: 155.56, F3: 174.61, G3: 196.00, Ab3: 207.65,
  Bb3: 233.08, C4: 261.63, D4: 293.66, Eb4: 311.13, F4: 349.23, G4: 392.00,
  Ab4: 415.30, Bb4: 466.16, C5: 523.25, Eb5: 622.25, G5: 783.99, C6: 1046.50,
};

function makeNoise(ac, seconds = 2) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + w * 0.42) * 0.72;          // slightly pink — less harsh
    d[i] = last;
  }
  return buf;
}

function makeIR(ac, seconds = 2.6, decay = 3.1) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - t * 0.2);
    }
  }
  return buf;
}

/* Schedules the entire 74s arrangement. `t0` is the AudioContext time to
   anchor bar 0 to; `from` lets playback start mid-timeline (for scrubbing). */
function buildScore(ac, dest, { t0 = 0, from = 0, gain = 0.58 } = {}) {
  const noise = makeNoise(ac, 3);

  const master = ac.createGain();
  master.gain.value = gain;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -17; comp.knee.value = 20;
  comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;
  /* Soft-clip stage: a waveshaper catches the trailer impacts that would
     otherwise punch through the compressor's attack time. */
  const limiter = ac.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = (i / 1023) * 2 - 1;
    curve[i] = Math.tanh(x * 1.35) * 0.88;
  }
  limiter.curve = curve;
  limiter.oversample = '4x';
  master.connect(comp).connect(limiter).connect(dest);

  const verb = ac.createConvolver();
  verb.buffer = makeIR(ac);
  const verbSend = ac.createGain();
  verbSend.gain.value = 0.34;
  verbSend.connect(verb).connect(master);

  const bus = (wet = 0) => {
    const g = ac.createGain();
    g.connect(master);
    if (wet > 0) { const s = ac.createGain(); s.gain.value = wet; g.connect(s).connect(verbSend); }
    return g;
  };
  const drumBus = bus(0.1), bassBus = bus(0.04), padBus = bus(0.9), leadBus = bus(0.55), fxBus = bus(0.7);

  const at = (sec) => t0 + sec - from;
  const live = (sec, tail = 0) => sec + tail >= from;      // skip already-past events

  /* ── voices ─────────────────────────────────────────────────────────────── */
  function kick(sec, vel = 1) {
    if (!live(sec, 0.4)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.05 * vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g).connect(drumBus); o.start(t); o.stop(t + 0.4);

    const c = ac.createBufferSource(), cg = ac.createGain(), cf = ac.createBiquadFilter();
    c.buffer = noise; cf.type = 'bandpass'; cf.frequency.value = 1900; cf.Q.value = 0.9;
    cg.gain.setValueAtTime(0.16 * vel, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    c.connect(cf).connect(cg).connect(drumBus); c.start(t); c.stop(t + 0.05);
  }

  function hat(sec, vel = 0.5, open = false) {
    if (!live(sec, 0.2)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; s.playbackRate.value = 1.6;
    f.type = 'highpass'; f.frequency.value = 7600;
    const dur = open ? 0.2 : 0.045;
    g.gain.setValueAtTime(0.28 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(drumBus); s.start(t); s.stop(t + dur + 0.02);
  }

  function clap(sec, vel = 0.7) {
    if (!live(sec, 0.3)) return;
    const t = Math.max(at(sec), ac.currentTime);
    for (let i = 0; i < 3; i++) {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noise; f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.6;
      const tt = t + i * 0.011;
      g.gain.setValueAtTime(0.2 * vel, tt);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + (i === 2 ? 0.17 : 0.04));
      s.connect(f).connect(g).connect(drumBus); s.start(tt); s.stop(tt + 0.22);
    }
  }

  function bass(sec, freq, dur, vel = 0.9) {
    if (!live(sec, dur + 0.2)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const o = ac.createOscillator(), o2 = ac.createOscillator();
    const f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 6;
    const sg = ac.createGain(); sg.gain.value = 0.3;
    f.type = 'lowpass'; f.frequency.setValueAtTime(260, t);
    f.frequency.exponentialRampToValueAtTime(140, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.72 * vel, t + 0.018);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.72, 0.08);
    o.connect(g); o2.connect(sg).connect(g);
    g.connect(f).connect(bassBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.3); o2.stop(t + dur + 0.3);
  }

  function pad(sec, freqs, dur, vel = 0.5, cutoff = 1500) {
    if (!live(sec, dur + 1)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff * 0.55, t);
    f.frequency.linearRampToValueAtTime(cutoff, t + dur * 0.5);
    f.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + Math.min(0.9, dur * 0.35));
    g.gain.setTargetAtTime(0.0001, t + dur * 0.78, dur * 0.18);
    g.connect(f).connect(padBus);
    for (const fr of freqs) {
      for (const det of [-7, 7]) {
        const o = ac.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det;
        const og = ac.createGain(); og.gain.value = 0.17 / freqs.length;
        o.connect(og).connect(g); o.start(t); o.stop(t + dur + 1.2);
      }
    }
  }

  function pluck(sec, freq, dur = 0.26, vel = 0.5) {
    if (!live(sec, dur + 0.4)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq * 7, t);
    f.frequency.exponentialRampToValueAtTime(freq * 1.6, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.34 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(leadBus);
    o.start(t); o.stop(t + dur + 0.1);
  }

  /* Trailer hit: sub drop + noise crack + metallic tail. */
  function impact(sec, vel = 1) {
    if (!live(sec, 2.2)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(210, t);
    o.frequency.exponentialRampToValueAtTime(26, t + 1.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.25 * vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    o.connect(g).connect(fxBus); o.start(t); o.stop(t + 1.6);

    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), ng = ac.createGain();
    s.buffer = noise; f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t);
    f.frequency.exponentialRampToValueAtTime(380, t + 0.8);
    ng.gain.setValueAtTime(0.5 * vel, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    s.connect(f).connect(ng).connect(fxBus); s.start(t); s.stop(t + 1.1);
  }

  /* Reverse-swell whoosh landing exactly on `sec`. */
  function whoosh(sec, dur = 0.8, vel = 0.5) {
    if (!live(sec, 0.4)) return;
    const t = Math.max(at(sec) - dur, ac.currentTime);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; s.playbackRate.value = 0.85;
    f.type = 'bandpass'; f.Q.value = 1.1;
    f.frequency.setValueAtTime(240, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42 * vel, t + dur * 0.92);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.14);
    s.connect(f).connect(g).connect(fxBus); s.start(t); s.stop(t + dur + 0.2);
  }

  /* Classic uplifter into the CTA. */
  function riser(sec, dur = 2.0, vel = 0.5) {
    if (!live(sec, dur + 0.3)) return;
    const t = Math.max(at(sec), ac.currentTime);
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + dur);
    f.type = 'bandpass'; f.Q.value = 3.4;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(4200, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3 * vel, t + dur * 0.88);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    o.connect(f).connect(g).connect(fxBus); o.start(t); o.stop(t + dur + 0.2);

    const s = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain();
    s.buffer = noise; s.loop = true;
    nf.type = 'highpass';
    nf.frequency.setValueAtTime(600, t);
    nf.frequency.exponentialRampToValueAtTime(9000, t + dur);
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.2 * vel, t + dur * 0.9);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    s.connect(nf).connect(ng).connect(fxBus); s.start(t); s.stop(t + dur + 0.2);
  }

  /* ── arrangement ──────────────────────────────────────────────────────────
     120 BPM, so one bar = 2s. Which arrangement plays is chosen by the cut
     the page loaded, and every impact in each of them lands on a picture cut.
     The helpers below are shared; the arrangements themselves are at the foot
     of this file, written against them. */

  /* Lay a groove over a span. `drive` scales how busy and how loud the kit is. */
  function groove(from2, to, { drive = 1, kickA = 0.85, clapOn = 2,
                               line = [N.C2, N.C2, N.Eb2, N.C2, N.Ab2, N.Ab2, N.Bb2, N.G2] } = {}) {
    const beats = Math.round((to - from2) / BEAT);
    for (let b = 0; b < beats; b++) {
      const s2 = from2 + b * BEAT;
      kick(s2, (b === 0 ? 1 : kickA) * drive);
      hat(s2 + BEAT / 2, 0.44 * drive);
      hat(s2 + BEAT / 4, 0.15 * drive);
      if (drive > 0.93) hat(s2 + BEAT * 0.75, 0.2 * drive);
      if (b % 4 === clapOn) clap(s2, 0.58 * drive);
      bass(s2, line[b % line.length], BEAT * 0.86, 0.88 * drive);
    }
  }

  const CHORD = {
    Cm:   [N.C3, N.Eb3, N.G3, N.C4],
    CmHi: [N.C3, N.Eb3, N.G3, N.Bb3],
    Ab:   [N.Ab2, N.C3, N.Eb3, N.Ab3],
    Bb:   [N.Bb2, N.F3, N.Bb3, N.D4],
    Eb:   [N.Eb3, N.G3, N.Bb3, N.Eb4],
    Fm:   [N.F3, N.Ab3, N.C4, N.F4],
    G:    [N.G3, N.Bb3, N.D4, N.G4],
  };
  const prog = (list, dur = 3.4, amp = 0.3, cut = 2300) => {
    for (const [s2, ch] of list) pad(s2, CHORD[ch], dur, amp, cut);
  };
  const MEL = [N.G4, N.C5, N.Bb4, N.G4, N.Eb5, N.C5, N.Bb4, N.C5];

  const KIT = { kick, hat, clap, bass, pluck, pad, riser, whoosh, impact, groove, prog, MEL };
  const seconds = ARRANGEMENTS[(window.OTA_CUT && window.OTA_CUT.score) || 'film'](KIT);
  return { master, duration: seconds + 0.6 };
}

/* ── Arrangements ───────────────────────────────────────────────────────────
   Each takes the instrument kit and returns the arrangement's length in
   seconds. Times are absolute film time, so an impact at 9.2 is the cut at
   9.2. ─────────────────────────────────────────────────────────────────── */
const ARRANGEMENTS = {};

/* The 74s brand film. */
ARRANGEMENTS.film = ({ kick, hat, clap, bass, pluck, pad, riser, whoosh, impact, groove, prog, MEL }) => {

  /* COLD OPEN (0.0 → 3.4) — tension only. No groove under the first picture. */
  impact(0.0, 1.0);
  pad(0.15, [N.C2, N.C3, N.G3], 3.5, 0.3, 700);
  for (let i = 0; i < 7; i++) bass(0.5 + i * BEAT, N.C2, 0.3, 0.42 + (i % 4 === 0 ? 0.3 : 0));
  pluck(1.0, N.Eb4, 0.5, 0.28); pluck(2.0, N.G4, 0.5, 0.3); pluck(2.75, N.Bb4, 0.6, 0.34);
  whoosh(3.4, 1.1, 0.6);

  /* ACT I a — the collapse (3.4 → 9.2). Fragments, then a riser to the brand. */
  impact(3.4, 0.7);
  prog([[3.4, 'Cm'], [6.2, 'Ab']], 2.9, 0.26, 1200);
  for (let i = 0; i < 11; i++) bass(3.5 + i * BEAT, i % 2 ? N.C2 : N.Ab2, 0.26, 0.4);
  for (let i = 0; i < 8; i++) pluck(3.6 + i * BEAT * 1.5, [N.C5, N.Bb4, N.G4, N.Eb4][i % 4], 0.22, 0.2 + i * 0.014);
  for (let i = 0; i < 11; i++) hat(5.4 + i * 0.3, 0.09 + i * 0.028);
  riser(7.2, 2.0, 0.9);
  whoosh(9.2, 0.9, 0.5);

  /* ACT I b — the brand lands (9.2 → 16.4). Full groove in. */
  impact(9.2, 1.1);
  prog([[9.2, 'Cm'], [12.4, 'Ab'], [14.4, 'Bb']], 3.4, 0.3, 2100);
  groove(9.2, 16.4, { drive: 1 });
  for (let i = 0; i < 14; i++) pluck(11.4 + i * BEAT * 0.75, MEL[i % 8], 0.3, 0.3);
  whoosh(16.4, 0.7, 0.45);

  /* ACT II a — build the play (16.4 → 23.6). */
  impact(16.4, 0.7);
  prog([[16.4, 'Fm'], [19.6, 'Cm'], [21.6, 'Eb']], 3.2, 0.28, 2400);
  groove(16.4, 23.6, { drive: 0.9, line: [N.F2, N.F2, N.Ab2, N.F2, N.C2, N.C2, N.Eb2, N.G2] });
  for (let i = 0; i < 10; i++) pluck(17.0 + i * BEAT, [N.C5, N.Eb5, N.G5, N.Eb5][i % 4], 0.24, 0.22);

  /* ACT II b — the contract (23.6 → 31.2). */
  impact(23.6, 0.8);
  prog([[23.6, 'Cm'], [26.0, 'Ab'], [28.4, 'Bb'], [30.4, 'CmHi']], 2.6, 0.3, 2500);
  groove(23.6, 31.2, { drive: 1 });
  for (let i = 0; i < 12; i++) pluck(24.2 + i * BEAT * 0.75, MEL[i % 8], 0.26, 0.24);
  riser(29.9, 1.3, 0.55);

  /* ACT III a — the Academy (31.2 → 38.4). The one bright lift in the film. */
  impact(31.2, 0.95);
  prog([[31.2, 'Ab'], [34.4, 'Eb'], [36.4, 'Bb']], 3.2, 0.3, 2600);
  groove(31.2, 38.4, { drive: 0.94, line: [N.Ab2, N.Ab2, N.C3, N.Ab2, N.Eb2, N.Eb2, N.Bb2, N.G2] });
  for (let i = 0; i < 14; i++) pluck(31.4 + i * BEAT * 0.75, [N.Eb5, N.G5, N.C6, N.G5][i % 4], 0.22, 0.22);

  /* ACT III b — journal, hit list, mission control (38.4 → 45.6). */
  impact(38.4, 0.6);
  prog([[38.4, 'Fm'], [41.2, 'Cm'], [43.6, 'G']], 3.0, 0.28, 2400);
  groove(38.4, 45.6, { drive: 0.88, line: [N.F2, N.F2, N.Ab2, N.F2, N.C2, N.G1, N.C2, N.Eb2] });
  for (let i = 0; i < 10; i++) pluck(39.0 + i * BEAT, [N.C5, N.F4, N.Ab4, N.C5][i % 4], 0.26, 0.2);

  /* ACT IV a — the portfolio (45.6 → 53.2). Wider, more air. */
  impact(45.6, 1.0);
  prog([[45.6, 'Cm'], [48.4, 'Eb'], [50.8, 'Ab']], 3.4, 0.32, 2800);
  groove(45.6, 53.2, { drive: 1 });
  for (let i = 0; i < 12; i++) pluck(46.2 + i * BEAT * 0.75, [N.G4, N.C5, N.Eb5, N.G5][i % 4], 0.3, 0.24);

  /* ACT IV b — the lifestyle (53.2 → 62.4), stripped back from 59.4 so the
     bridge into the close lands in near-silence. */
  impact(53.2, 0.85);
  prog([[53.2, 'Ab'], [56.0, 'Bb'], [58.4, 'Cm']], 3.6, 0.34, 3000);
  groove(53.2, 59.4, { drive: 0.94, line: [N.Ab2, N.Ab2, N.C3, N.Ab2, N.Bb2, N.Bb2, N.F2, N.G2] });
  for (let i = 0; i < 10; i++) pluck(53.4 + i * BEAT * 0.75, [N.C5, N.Eb5, N.G5, N.C6][i % 4], 0.26, 0.26);
  bass(59.4, N.C2, 1.6, 0.7);
  bass(61.0, N.Ab2, 1.4, 0.55);
  pad(59.4, [N.C2, N.C3, N.Eb3, N.G3], 4.0, 0.3, 1400);
  whoosh(62.4, 1.6, 0.5);

  /* CLOSE — the launch beat (62.4 → 74.0). Almost nothing, then one resolve. */
  impact(62.4, 1.2);
  pad(62.6, [N.C2, N.C3, N.G3], 6.0, 0.26, 900);
  bass(62.6, N.C2, 2.4, 0.75);
  pluck(63.2, N.C5, 1.1, 0.26);
  pluck(65.4, N.G4, 1.0, 0.2);
  pad(66.6, [N.Ab2, N.C3, N.Eb3, N.Ab3], 4.0, 0.26, 1500);
  bass(66.6, N.Ab2, 2.0, 0.6);
  riser(68.4, 1.8, 0.55);

  /* The end card gets the only full cadence in the film. */
  impact(70.2, 1.15);
  pad(70.2, [N.C2, N.C3, N.Eb3, N.G3, N.C4, N.Eb4], 3.4, 0.42, 3000);
  bass(70.2, N.C2, 1.6, 1.0);
  bass(71.8, N.G1, 1.6, 0.8);
  kick(70.2, 1.0); kick(71.2, 0.7); kick(71.7, 0.9); kick(72.7, 0.75);
  clap(71.7, 0.5);
  pluck(70.3, N.C5, 0.8, 0.4); pluck(70.7, N.G5, 0.7, 0.34); pluck(71.1, N.C6, 1.2, 0.3);
  whoosh(73.3, 0.9, 0.3);

  return 74.0;
};

/* The 176s walkthrough. A bed, not a trailer: the kit stays light, every act
   boundary gets a soft marker rather than a hit, and the one place it drops
   out entirely is the "don't chase" beat. */
ARRANGEMENTS.howto = ({ kick, hat, clap, bass, pluck, pad, riser, whoosh, impact, groove, prog }) => {
  const LINE_C = [N.C2, N.C2, N.Eb2, N.C2, N.G2, N.G2, N.Ab2, N.G2];
  const LINE_F = [N.F2, N.F2, N.Ab2, N.F2, N.C2, N.C2, N.Eb2, N.C2];
  const LINE_A = [N.Ab2, N.Ab2, N.C3, N.Ab2, N.Eb2, N.Eb2, N.Bb2, N.G2];

  /* H1 ACCESS (0 → 18) — warm open, groove slides in under the title. */
  impact(0.0, 0.8);
  prog([[0.1, 'Cm'], [4.0, 'Ab'], [8.0, 'Eb'], [12.0, 'Bb'], [15.6, 'Cm']], 4.0, 0.3, 1900);
  bass(0.2, N.C2, 1.6, 0.6);
  groove(2.0, 18.0, { drive: 0.6, line: LINE_C, clapOn: 2 });
  for (let i = 0; i < 12; i++) pluck(4.0 + i * BEAT * 1.5, [N.C5, N.Eb5, N.G4, N.Bb4][i % 4], 0.26, 0.2);
  whoosh(18.0, 0.8, 0.4);

  /* H2 PROFILE (18 → 31) */
  impact(18.0, 0.55);
  prog([[18.0, 'Fm'], [22.0, 'Cm'], [26.0, 'Ab'], [29.6, 'Cm']], 4.0, 0.28, 2100);
  groove(18.0, 31.0, { drive: 0.64, line: LINE_F });
  for (let i = 0; i < 9; i++) pluck(19.0 + i * BEAT * 1.5, [N.C5, N.F4, N.Ab4, N.C5][i % 4], 0.24, 0.2);

  /* H3 CHOOSE (31 → 46.5) */
  impact(31.0, 0.6);
  prog([[31.0, 'Cm'], [35.0, 'Eb'], [39.0, 'Ab'], [43.0, 'Bb']], 4.0, 0.28, 2200);
  groove(31.0, 46.5, { drive: 0.68, line: LINE_C });
  for (let i = 0; i < 12; i++) pluck(32.0 + i * BEAT * 1.25, [N.G4, N.C5, N.Eb5, N.C5][i % 4], 0.24, 0.2);

  /* H4 UPLOAD (46.5 → 62.5) — the busiest stretch; five cards land on beats. */
  impact(46.5, 0.7);
  prog([[46.5, 'Ab'], [50.5, 'Eb'], [54.5, 'Bb'], [58.5, 'Cm']], 4.0, 0.3, 2400);
  groove(46.5, 62.5, { drive: 0.76, line: LINE_A });
  for (let i = 0; i < 5; i++) pluck(48.8 + i * 0.7, [N.C5, N.Eb5, N.G5, N.Bb4, N.C6][i], 0.3, 0.34);
  for (let i = 0; i < 10; i++) hat(59.0 + i * 0.28, 0.12 + i * 0.03);

  /* H5 ANALYZE (62.5 → 77) — the scan rides a riser into the verdicts. */
  impact(62.5, 0.85);
  prog([[62.5, 'Cm'], [66.5, 'Fm'], [70.5, 'G'], [74.0, 'Cm']], 4.0, 0.3, 2500);
  groove(62.5, 77.0, { drive: 0.7, line: LINE_C });
  riser(68.0, 1.8, 0.6);
  impact(69.9, 0.75);
  for (let i = 0; i < 3; i++) pluck(70.0 + i * 0.6, [N.C5, N.Eb5, N.G5][i], 0.36, 0.34);

  /* H6 STRATEGY (77 → 94.5) */
  impact(77.0, 0.6);
  prog([[77.0, 'Ab'], [81.0, 'Eb'], [85.0, 'Cm'], [89.0, 'Bb'], [92.6, 'Cm']], 4.0, 0.28, 2300);
  groove(77.0, 94.5, { drive: 0.7, line: LINE_A });
  for (let i = 0; i < 14; i++) pluck(78.0 + i * BEAT * 1.25, [N.Eb5, N.G5, N.C6, N.G5][i % 4], 0.22, 0.18);

  /* H7 CONTRACT (94.5 → 110.5) — the hand-off gets its own little figure. */
  impact(94.5, 0.65);
  prog([[94.5, 'Cm'], [98.5, 'Ab'], [102.5, 'Fm'], [106.5, 'Bb']], 4.0, 0.28, 2300);
  groove(94.5, 110.5, { drive: 0.74, line: LINE_C });
  for (let i = 0; i < 3; i++) pluck(105.0 + i * 1.0, [N.C5, N.G5, N.C6][i], 0.4, 0.32);
  whoosh(110.5, 1.2, 0.5);

  /* H8 CONFIRM (110.5 → 128.5) — the kit stops. This is the beat that matters. */
  impact(110.5, 0.9);
  pad(110.6, [N.C2, N.C3, N.G3], 7.0, 0.3, 1100);
  bass(110.6, N.C2, 2.6, 0.72);
  bass(114.0, N.Ab2, 2.2, 0.55);
  pluck(112.0, N.C5, 1.0, 0.22);
  pad(117.8, [N.Ab2, N.C3, N.Eb3, N.Ab3], 5.0, 0.28, 1500);
  groove(119.0, 128.5, { drive: 0.52, line: LINE_A, clapOn: 6 });
  for (let i = 0; i < 4; i++) pluck(120.0 + i * 1.6, [N.Eb5, N.C5, N.G4, N.C5][i], 0.34, 0.24);

  /* H9 CLOSE (128.5 → 152.5) — fullest the film gets. */
  impact(128.5, 1.0);
  prog([[128.5, 'Cm'], [132.5, 'Eb'], [136.5, 'Ab'], [140.5, 'Fm'],
        [144.5, 'Bb'], [148.5, 'Cm']], 4.2, 0.32, 2800);
  groove(128.5, 152.5, { drive: 0.88, line: LINE_C });
  for (let i = 0; i < 20; i++) pluck(129.0 + i * BEAT * 1.25, [N.G4, N.C5, N.Eb5, N.G5][i % 4], 0.26, 0.24);
  riser(150.6, 1.6, 0.5);

  /* H10 COACH (152.5 → 176) — strip back for the quote, resolve on the card. */
  impact(152.5, 0.95);
  pad(152.6, [N.C2, N.C3, N.Eb3, N.G3], 8.0, 0.3, 1300);
  bass(152.6, N.C2, 2.8, 0.7);
  bass(156.0, N.G1, 2.4, 0.55);
  pluck(153.4, N.C5, 1.2, 0.26);
  pluck(156.6, N.G4, 1.0, 0.2);
  pad(160.5, [N.Ab2, N.C3, N.Eb3, N.Ab3], 5.5, 0.28, 1600);
  bass(160.6, N.Ab2, 2.4, 0.58);
  riser(164.6, 1.8, 0.55);

  /* The card. */
  impact(166.5, 1.1);
  pad(166.5, [N.C2, N.C3, N.Eb3, N.G3, N.C4, N.Eb4], 4.4, 0.4, 3000);
  bass(166.5, N.C2, 1.8, 0.95);
  bass(168.5, N.G1, 1.8, 0.78);
  kick(166.5, 1.0); kick(167.5, 0.7); kick(168.0, 0.9); kick(169.0, 0.75);
  clap(168.0, 0.48);
  pluck(166.6, N.C5, 0.9, 0.38); pluck(167.0, N.G5, 0.8, 0.32); pluck(167.4, N.C6, 1.3, 0.3);
  pad(171.0, [N.C2, N.C3, N.G3], 4.4, 0.24, 1000);
  whoosh(175.2, 0.9, 0.26);
  return 176.0;
};

/* ── Live playback controller ────────────────────────────────────────────── */
class ScorePlayer {
  constructor() { this.ac = null; this.nodes = null; this.muted = false; }

  async ensure() {
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ac = new AC();
    }
    if (this.ac.state === 'suspended') await this.ac.resume();
    return this.ac;
  }

  async play(fromMs = 0) {
    if (this.muted) return;
    await this.ensure();
    this.stop();
    this.gate = this.ac.createGain();
    this.gate.connect(this.ac.destination);
    buildScore(this.ac, this.gate, { t0: this.ac.currentTime + 0.06, from: fromMs / 1000 });
  }

  stop() {
    if (this.gate) {
      try {
        this.gate.gain.setTargetAtTime(0, this.ac.currentTime, 0.015);
        const g = this.gate;
        setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 220);
      } catch (e) {}
      this.gate = null;
    }
  }

  setMuted(m) { this.muted = m; if (m) this.stop(); }
}

/* Offline bounce → 16-bit PCM WAV, used by the MP4 renderer. */
async function bounceWav(seconds = 74.6, sampleRate = 48000) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ac = new OAC(2, Math.ceil(seconds * sampleRate), sampleRate);
  buildScore(ac, ac.destination, { t0: 0, from: 0 });
  const buf = await ac.startRendering();
  return encodeWav(buf);
}

function encodeWav(buf) {
  const ch = buf.numberOfChannels, len = buf.length;
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, len * ch * 2, true);

  const chans = [];
  for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      o += 2;
    }
  }
  return new Uint8Array(out.buffer);
}
