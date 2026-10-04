/* ============================================================================
   main.js — the player. Builds the timeline, composites scenes (with real
   cross-dissolves through off-screen buffers), runs the post chain, and exposes
   a frame-exact seek API (window.OTA_FILM) so the MP4 renderer can step the
   film one frame at a time instead of screen-recording it.
   ========================================================================== */

/* The spot composes natively at both sizes. 9:16 is not the 16:9 frame
   letterboxed — every scene lays itself out again for the taller canvas. */
const SIZES = { wide: [1920, 1080], vertical: [1080, 1920] };

/* Instagram/TikTok chrome covers roughly the top 230px and bottom 420px of a
   1080x1920 Reel. Scenes keep anything that must be read inside this band. */
const SAFE = { top: 250, bottom: 440 };

/* ── Shot list ───────────────────────────────────────────────────────────────
   The cut itself lives with its scenes: whichever scenes file the page loads
   registers `window.OTA_CUT` with its duration, its shot list and its hard
   cuts. The player below is the same for every film. */
const CUT = window.OTA_CUT;
const DURATION = CUT.duration;
const TL = new Timeline(DURATION);
for (const s of CUT.scenes) TL.add(s.name, s.start, s.end, s.draw, { xfade: s.xfade || 0 });

/* Hard cuts get an RGB-split + flash kick. */
const CUTS = CUT.cuts;

class Film {
  constructor(display) {
    this.display = display;
    this.dctx = display.getContext('2d');

    this.stage = this._cv(1920, 1080);
    this.buf   = this._cv(1920, 1080);
    this.copy  = this._cv(1920, 1080);
    this.bloom = this._cv(640, 360);

    this.sctx = this.stage.getContext('2d');
    this.bctx = this.buf.getContext('2d');

    this.S = new Scene3D();
    this.cam = new Camera();

    this.aspect = 'wide';
    this.W = 1920; this.H = 1080;
    this.captions = true;
    this.frame = 0;
    FX.initGrain();
  }

  _cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /* Resize every buffer to the chosen delivery size. */
  setAspect(a) {
    if (!SIZES[a]) return;
    this.aspect = a;
    const [w, h] = SIZES[a];
    this.W = w; this.H = h;
    for (const [cv, sw, sh] of [[this.stage, w, h], [this.buf, w, h], [this.copy, w, h],
                                [this.bloom, Math.round(w / 3), Math.round(h / 3)]]) {
      cv.width = sw; cv.height = sh;
    }
    FX._vign = null;            // the vignette is cached per size
  }

  /* Render one scene into a given context. */
  _scene(ctx, scene, ms) {
    const t = Math.max(0, ms - scene.start);
    const dur = scene.end - scene.start;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.setLineDash([]);
    scene.draw(ctx, {
      t, p: clamp(t / dur), W: this.W, H: this.H, V: this.H > this.W, SAFE,
      S: this.S, cam: this.cam, abs: ms, frame: this.frame,
    });
  }

  /* ── One full frame, deterministic for any ms ── */
  renderAt(ms, frameIdx = null) {
    this.frame = frameIdx ?? Math.round(ms / 1000 * 30);
    ms = clamp(ms, 0, DURATION - 0.001);
    const act = TL.activeAt(ms);
    const sctx = this.sctx;

    if (!act.length) {
      sctx.fillStyle = '#000';
      sctx.fillRect(0, 0, this.W, this.H);
    } else {
      /* Oldest first; newest may dissolve in over the top. */
      act.sort((a, b) => a.start - b.start);
      for (let i = 0; i < act.length; i++) {
        const sc = act[i];
        const x = sc.xfade > 0
          ? clamp((ms - (sc.start - sc.xfade)) / sc.xfade)
          : 1;
        if (i === 0 || x >= 0.999) {
          this._scene(sctx, sc, ms);
        } else {
          this._scene(this.bctx, sc, ms);
          sctx.save();
          sctx.setTransform(1, 0, 0, 1, 0, 0);
          sctx.globalAlpha = E.inOutQuad(x);
          sctx.drawImage(this.buf, 0, 0);
          sctx.restore();
        }
      }
    }

    /* ── Post chain ── */
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalAlpha = 1;
    sctx.globalCompositeOperation = 'source-over';

    FX.bloom(sctx, this.stage, this.bloom, 0.24, 4);
    const W = this.W, H = this.H;

    let kick = 0;
    for (const c of CUTS) {
      const d = ms - c;
      if (d >= 0 && d < 260) kick = Math.max(kick, 1 - d / 260);
    }
    if (kick > 0.02) FX.aberration(sctx, this.stage, this.copy, kick * 7);

    FX.grain(sctx, W, H, this.frame, 0.042);
    FX.vignette(sctx, W, H, 0.58);
    FX.scanlines(sctx, W, H, 0.022, 4);

    /* Edge-to-edge grade. */
    sctx.save();
    sctx.globalCompositeOperation = 'overlay';
    sctx.globalAlpha = 0.1;
    const grade = sctx.createLinearGradient(0, 0, W, H);
    grade.addColorStop(0, '#0E4A28');
    grade.addColorStop(1, '#4A3306');
    sctx.fillStyle = grade;
    sctx.fillRect(0, 0, W, H);
    sctx.restore();

    this._present(ms);
  }

  /* The stage IS the delivery frame now — nothing to letterbox or inset. */
  _present(ms) {
    const W = this.W, H = this.H;
    if (this.display.width !== W || this.display.height !== H) {
      this.display.width = W; this.display.height = H;
    }
    const d = this.dctx;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalAlpha = 1;
    d.globalCompositeOperation = 'source-over';
    d.fillStyle = '#000';
    d.fillRect(0, 0, W, H);

    /* Final grade — restores the contrast the bloom pass softens. */
    d.filter = 'contrast(1.1) saturate(1.06) brightness(1.04)';
    d.drawImage(this.stage, 0, 0, W, H);
    d.filter = 'none';

    if (this.captions) {
      const vertical = H > W;
      this._captions(d, W, H, ms,
        vertical ? H - SAFE.bottom - 30 : H - 128,
        vertical ? 1.25 : 1);
    }
  }


  _captions(d, W, H, ms, y, scale = 1) {
    const line = CFG.vo.find(v => ms >= v.t && ms < v.t + v.d);
    if (!line) return;
    const a = Math.min(1, (ms - line.t) / 120, (line.t + line.d - ms) / 160);
    const size = 34 * scale;
    setFont(d, size, 800);

    /* Wrap to the gutters: a vertical frame is half as wide, so most cues
       need two lines. */
    const maxW = W - 120;
    const lines2 = [];
    let cur = '';
    for (const w of line.text.toUpperCase().split(' ')) {
      const test = cur ? `${cur} ${w}` : w;
      if (cur && d.measureText(test).width > maxW) { lines2.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines2.push(cur);

    const lh = size * 1.2, pad = 20 * scale;
    const boxW = Math.max(...lines2.map(l => d.measureText(l).width)) + pad * 2;
    const boxH = lines2.length * lh + pad;
    const top = y - boxH;

    d.save();
    d.globalAlpha = clamp(a);
    roundRect(d, W / 2 - boxW / 2, top, boxW, boxH, 10);
    d.fillStyle = 'rgba(3,14,8,0.82)';
    d.fill();
    d.fillStyle = C.cream;
    d.textAlign = 'center';
    d.textBaseline = 'middle';
    lines2.forEach((l, i) => d.fillText(l, W / 2, top + pad / 2 + lh * (i + 0.5)));
    d.textAlign = 'left';
    d.restore();
  }
}

/* ── Wiring ──────────────────────────────────────────────────────────────── */
const film = new Film(document.getElementById('stage'));
const score = new ScorePlayer();

let playing = false, startedAt = 0, pausedAt = 0, raf = 0;

const els = {
  play:  document.getElementById('btn-play'),
  mute:  document.getElementById('btn-mute'),
  cap:   document.getElementById('btn-cap'),
  asp:   document.getElementById('btn-aspect'),
  full:  document.getElementById('btn-full'),
  bar:   document.getElementById('bar'),
  fill:  document.getElementById('bar-fill'),
  time:  document.getElementById('time'),
  marks: document.getElementById('marks'),
  shell: document.getElementById('shell'),
  poster:document.getElementById('poster'),
};

function fmt(ms) {
  const s = ms / 1000;
  return `${s.toFixed(2).padStart(5, '0')}s`;
}

function tick() {
  if (!playing) return;
  const ms = performance.now() - startedAt;
  if (ms >= DURATION) {
    film.renderAt(DURATION - 1);
    setPlaying(false);
    pausedAt = DURATION - 1;
    update(DURATION);
    return;
  }
  film.renderAt(ms);
  update(ms);
  raf = requestAnimationFrame(tick);
}

function update(ms) {
  const f = clamp(ms / DURATION);
  els.fill.style.width = `${f * 100}%`;
  els.time.textContent = `${fmt(Math.min(ms, DURATION))} / ${(DURATION / 1000).toFixed(2)}s`;
  const sc = TL.scenes.find(s => ms >= s.start && ms < s.end);
  document.getElementById('scene-name').textContent = sc ? sc.name.toUpperCase() : '—';
}

function setPlaying(v) {
  playing = v;
  els.play.textContent = v ? '❙❙  PAUSE' : '▶  PLAY';
  els.play.classList.toggle('on', v);
  if (!v) cancelAnimationFrame(raf);
}

async function play(fromMs = null) {
  const from = fromMs ?? (pausedAt >= DURATION - 2 ? 0 : pausedAt);
  els.poster.classList.add('hidden');
  startedAt = performance.now() - from;
  setPlaying(true);
  await score.play(from);
  raf = requestAnimationFrame(tick);
}

function pause() {
  pausedAt = clamp(performance.now() - startedAt, 0, DURATION);
  setPlaying(false);
  score.stop();
}

els.play.onclick = () => (playing ? pause() : play());
els.poster.onclick = () => play(0);

els.mute.onclick = () => {
  const m = !score.muted;
  score.setMuted(m);
  els.mute.textContent = m ? '🔇  SOUND OFF' : '🔊  SOUND ON';
  els.mute.classList.toggle('on', !m);
  if (!m && playing) score.play(performance.now() - startedAt);
};

els.cap.onclick = () => {
  film.captions = !film.captions;
  els.cap.classList.toggle('on', film.captions);
  els.cap.textContent = film.captions ? '💬  CAPTIONS ON' : '💬  CAPTIONS OFF';
  film.renderAt(playing ? performance.now() - startedAt : pausedAt);
};

els.asp.onclick = () => {
  film.aspect = film.aspect === 'wide' ? 'vertical' : 'wide';
  els.shell.classList.toggle('vertical', film.aspect === 'vertical');
  els.asp.textContent = film.aspect === 'wide' ? '🖥  16:9' : '📱  9:16';
  film.renderAt(playing ? performance.now() - startedAt : pausedAt);
};

els.full.onclick = () => {
  const el = document.getElementById('frame');
  if (document.fullscreenElement) document.exitFullscreen();
  else el.requestFullscreen?.();
};

function scrubTo(ev) {
  const r = els.bar.getBoundingClientRect();
  const f = clamp((ev.clientX - r.left) / r.width);
  const ms = f * DURATION;
  pausedAt = ms;
  film.renderAt(ms);
  update(ms);
  if (playing) { startedAt = performance.now() - ms; score.play(ms); }
}
els.bar.onpointerdown = (e) => {
  scrubTo(e);
  const mv = (ev) => scrubTo(ev);
  const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
};

/* Scene markers on the scrub bar. */
TL.scenes.forEach((s, i) => {
  const m = document.createElement('button');
  m.className = 'mark';
  m.style.left = `${(s.start / DURATION) * 100}%`;
  m.title = `${s.name} · ${(s.start / 1000).toFixed(1)}s`;
  m.onclick = (e) => { e.stopPropagation(); pausedAt = s.start; film.renderAt(s.start); update(s.start); if (playing) { startedAt = performance.now() - s.start; score.play(s.start); } };
  els.marks.appendChild(m);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.key === 'r' || e.key === 'R') { pausedAt = 0; play(0); }
  if (e.key === 'm' || e.key === 'M') els.mute.click();
  if (e.key === 'c' || e.key === 'C') els.cap.click();
  if (e.key === 'v' || e.key === 'V') els.asp.click();
  if (e.key === 'ArrowRight') { pause(); pausedAt = clamp(pausedAt + 1000 / 30, 0, DURATION); film.renderAt(pausedAt); update(pausedAt); }
  if (e.key === 'ArrowLeft')  { pause(); pausedAt = clamp(pausedAt - 1000 / 30, 0, DURATION); film.renderAt(pausedAt); update(pausedAt); }
});

/* Exposed for the headless MP4 renderer. `ready` stays false until every
   screenshot has decoded, so no frame is ever captured half-loaded. */
window.OTA_FILM = {
  ready: false,
  duration: DURATION,
  get stageW() { return film.W; },
  get stageH() { return film.H; },
  scenes: TL.scenes.map(s => ({ name: s.name, start: s.start, end: s.end })),
  setAspect(a) { film.setAspect(a); },
  setCaptions(v) { film.captions = v; },
  renderAt(ms, frameIdx) { film.renderAt(ms, frameIdx); },
  canvas: () => film.display,
  bounceWav,
};

update(0);
els.poster.disabled = true;
Promise.all([loadShots(), document.fonts ? document.fonts.ready : Promise.resolve()])
  .then(() => {
    els.poster.disabled = false;
    film.renderAt(CUT.poster ?? 12600);   // poster frame
    window.OTA_FILM.ready = true;
  });
