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

/* Schedules the entire 30s arrangement. `t0` is the AudioContext time to
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

  /* ── arrangement ────────────────────────────────────────────────────────── */

  // ACT I — tension (0.0 → 7.0) "the market doesn't wait"
  impact(0.0, 1.0);
  pad(0.15, [N.C2, N.C3, N.G3], 7.0, 0.3, 700);
  for (let i = 0; i < 14; i++) bass(0.5 + i * BEAT, N.C2, 0.3, 0.42 + (i % 4 === 0 ? 0.3 : 0));
  pluck(2.0, N.Eb4, 0.5, 0.3); pluck(3.0, N.G4, 0.5, 0.3); pluck(4.0, N.Bb4, 0.5, 0.34);
  pluck(5.0, N.C5, 0.45, 0.4); pluck(5.5, N.Bb4, 0.4, 0.3); pluck(6.0, N.G4, 0.9, 0.44);
  whoosh(7.0, 1.3, 0.7);
  for (let i = 0; i < 6; i++) hat(5.5 + i * 0.25, 0.1 + i * 0.07);

  // ACT II — the brand lands, groove enters (7.0 → 18.0)
  impact(7.0, 0.95);
  const chords = [
    [7.0,  [N.C3, N.Eb3, N.G3, N.C4]],
    [11.0, [N.Ab2, N.C3, N.Eb3, N.Ab3]],
    [14.0, [N.Bb2, N.F3, N.Bb3, N.D4]],
    [16.0, [N.C3, N.Eb3, N.G3, N.Bb3]],
  ];
  for (const [s, ch] of chords) pad(s, ch, s === 7.0 ? 4.2 : 3.2, 0.3, 2100);

  for (let b = 0; b < 22; b++) {               // 7.0 → 18.0 = 22 beats
    const s = 7.0 + b * BEAT;
    kick(s, b === 0 ? 1 : 0.85);
    hat(s + BEAT / 2, 0.42);
    hat(s + BEAT / 4, 0.14);
    if (b % 4 === 2) clap(s, 0.55);
    const bl = [N.C2, N.C2, N.Eb2, N.C2, N.Ab2, N.Ab2, N.Bb2, N.G2];
    bass(s, bl[b % 8], BEAT * 0.86, 0.85);
  }
  const mel = [N.G4, N.C5, N.Bb4, N.G4, N.Eb5, N.C5, N.Bb4, N.C5];
  for (let i = 0; i < 16; i++) pluck(11.5 + i * BEAT * 0.75, mel[i % 8], 0.3, 0.3);
  whoosh(11.5, 0.7, 0.45);
  whoosh(18.0, 0.7, 0.45);

  // ACT III — proof + lifestyle (18.0 → 26.5)
  for (let b = 0; b < 17; b++) {
    const s = 18.0 + b * BEAT;
    kick(s, 0.9);
    hat(s + BEAT / 2, 0.46);
    hat(s + BEAT / 4, 0.16);
    hat(s + BEAT * 0.75, 0.2);
    if (b % 4 === 2) clap(s, 0.6);
    const bl = [N.F2, N.F2, N.Ab2, N.F2, N.C2, N.C2, N.Eb2, N.G2];
    bass(s, bl[b % 8], BEAT * 0.86, 0.9);
  }
  pad(18.0, [N.F3, N.Ab3, N.C4, N.F4], 4.4, 0.28, 2400);
  pad(22.5, [N.C3, N.Eb3, N.G3, N.C4], 4.2, 0.3, 2600);
  for (let i = 0; i < 10; i++) pluck(22.6 + i * BEAT * 0.5, [N.C5, N.Eb5, N.G5, N.C6][i % 4], 0.22, 0.26);
  impact(18.0, 0.55);
  impact(22.5, 0.6);
  riser(24.5, 2.0, 0.85);
  for (let i = 0; i < 8; i++) hat(25.5 + i * (0.5 - i * 0.045), 0.2 + i * 0.07);

  // ACT IV — the close (26.5 → 30.0)
  impact(26.5, 1.15);
  pad(26.5, [N.C2, N.C3, N.Eb3, N.G3, N.C4, N.Eb4], 3.6, 0.42, 3000);
  bass(26.5, N.C2, 1.5, 1.0);
  bass(28.0, N.C2, 0.6, 0.7);
  bass(28.75, N.G1, 1.3, 0.8);
  kick(26.5, 1.0); kick(27.5, 0.7); kick(28.0, 0.9); kick(29.0, 0.75);
  clap(28.0, 0.5);
  pluck(26.6, N.C5, 0.8, 0.4); pluck(27.0, N.G5, 0.7, 0.34); pluck(27.4, N.C6, 1.2, 0.3);
  whoosh(29.9, 0.9, 0.3);

  return { master, duration: 30.5 };
}

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
async function bounceWav(seconds = 30.5, sampleRate = 48000) {
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
