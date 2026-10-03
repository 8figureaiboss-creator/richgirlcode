/* ============================================================================
   main.js — the player. Builds the timeline, composites scenes (with real
   cross-dissolves through off-screen buffers), runs the post chain, and exposes
   a frame-exact seek API (window.OTA_FILM) so the MP4 renderer can step the
   film one frame at a time instead of screen-recording it.
   ========================================================================== */

const STAGE_W = 1920, STAGE_H = 1080;
const DURATION = 30000;

/* ── Shot list ───────────────────────────────────────────────────────────── */
const TL = new Timeline(DURATION);
TL.add('hook',       0,     3400,  sceneHook,       { xfade: 0 })
  .add('globe',      3400,  7200,  sceneGlobe,      { xfade: 220 })
  .add('brand',      7200,  11600, sceneBrand,      { xfade: 0 })
  .add('pillars',    11600, 15400, scenePillars,    { xfade: 200 })
  .add('curriculum', 15400, 19200, sceneCurriculum, { xfade: 200 })
  .add('growth',     19200, 23000, sceneGrowth,     { xfade: 200 })
  .add('pocket',     23000, 26800, scenePocket,     { xfade: 200 })
  .add('close',      26800, 30000, sceneClose,      { xfade: 0 });

/* Hard cuts get an RGB-split + flash kick. */
const CUTS = [0, 7200, 11600, 26800];

class Film {
  constructor(display) {
    this.display = display;
    this.dctx = display.getContext('2d');

    this.stage = this._cv(STAGE_W, STAGE_H);
    this.buf   = this._cv(STAGE_W, STAGE_H);
    this.copy  = this._cv(STAGE_W, STAGE_H);
    this.bloom = this._cv(STAGE_W / 3, STAGE_H / 3);

    this.sctx = this.stage.getContext('2d');
    this.bctx = this.buf.getContext('2d');

    this.S = new Scene3D();
    this.cam = new Camera();

    this.aspect = 'wide';
    this.captions = true;
    this.frame = 0;
    FX.initGrain();
  }

  _cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
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
      t, p: clamp(t / dur), W: STAGE_W, H: STAGE_H,
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
      sctx.fillRect(0, 0, STAGE_W, STAGE_H);
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

    FX.bloom(sctx, this.stage, this.bloom, 0.3, 4.5);

    let kick = 0;
    for (const c of CUTS) {
      const d = ms - c;
      if (d >= 0 && d < 260) kick = Math.max(kick, 1 - d / 260);
    }
    if (kick > 0.02) FX.aberration(sctx, this.stage, this.copy, kick * 7);

    FX.grain(sctx, STAGE_W, STAGE_H, this.frame, 0.042);
    FX.vignette(sctx, STAGE_W, STAGE_H, 0.58);
    FX.scanlines(sctx, STAGE_W, STAGE_H, 0.022, 4);

    /* Edge-to-edge grade. */
    sctx.save();
    sctx.globalCompositeOperation = 'overlay';
    sctx.globalAlpha = 0.1;
    const grade = sctx.createLinearGradient(0, 0, STAGE_W, STAGE_H);
    grade.addColorStop(0, '#2B3A66');
    grade.addColorStop(1, '#4A3306');
    sctx.fillStyle = grade;
    sctx.fillRect(0, 0, STAGE_W, STAGE_H);
    sctx.restore();

    this._present(ms);
  }

  /* Compose the stage into the delivery frame (16:9 or 9:16). */
  _present(ms) {
    const vertical = this.aspect === 'vertical';
    const OW = vertical ? 1080 : STAGE_W;
    const OH = vertical ? 1920 : STAGE_H;
    if (this.display.width !== OW || this.display.height !== OH) {
      this.display.width = OW; this.display.height = OH;
    }
    const d = this.dctx;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalAlpha = 1;
    d.globalCompositeOperation = 'source-over';
    d.filter = 'none';
    d.fillStyle = '#000';
    d.fillRect(0, 0, OW, OH);

    /* Final grade — restores the contrast the bloom pass softens. */
    d.filter = 'contrast(1.1) saturate(1.06) brightness(1.04)';
    if (!vertical) {
      d.drawImage(this.stage, 0, 0, OW, OH);
      d.filter = 'none';
      if (this.captions) this._captions(d, OW, OH, ms, OH - 128);
    } else {
      const sw = OW, sh = OW * (STAGE_H / STAGE_W);
      const sy = (OH - sh) / 2 + 26;
      /* Fill the letterbox with a blown-up, blurred, darkened copy of the frame
         rather than dead black — the bands then read as ambient light from the
         shot instead of as a crop. */
      d.filter = 'blur(42px) brightness(0.3) saturate(1.25)';
      const cov = Math.max(OW / STAGE_W, OH / STAGE_H) * 1.1;
      const cw = STAGE_W * cov, chh = STAGE_H * cov;
      d.drawImage(this.stage, (OW - cw) / 2, (OH - chh) / 2, cw, chh);
      d.filter = 'contrast(1.1) saturate(1.06) brightness(1.04)';
      d.drawImage(this.stage, 0, sy, sw, sh);
      d.filter = 'none';
      this._verticalChrome(d, OW, OH, ms, sy, sh);
      if (this.captions) this._captions(d, OW, OH, ms, sy + sh + 86, 0.72);
    }
  }

  _verticalChrome(d, W, H, ms, sy, sh) {
    /* Hairline rules turn the 16:9 window's edges into a deliberate frame
       rather than a seam against the blurred backdrop. */
    d.save();
    for (const y of [sy, sy + sh]) {
      const g = d.createLinearGradient(0, y, W, y);
      g.addColorStop(0, 'rgba(212,175,55,0)');
      g.addColorStop(0.5, 'rgba(212,175,55,0.5)');
      g.addColorStop(1, 'rgba(212,175,55,0)');
      d.fillStyle = g;
      d.fillRect(0, y - 1, W, 2);
    }
    d.restore();

    /* Brand bar, top. */
    d.save();
    d.fillStyle = C.gold;
    const mx = 64, my = 150;
    d.beginPath();
    d.moveTo(mx, my + 34); d.lineTo(mx + 19, my); d.lineTo(mx + 38, my + 34);
    d.lineTo(mx + 28, my + 34); d.lineTo(mx + 19, my + 17); d.lineTo(mx + 10, my + 34);
    d.closePath(); d.fill();
    setFont(d, 30, 900);
    d.fillStyle = C.white;
    d.textBaseline = 'middle';
    tracked(d, 'OPTIONS TRADERS ACADEMY', mx + 54, my + 18, 2.2);
    setFont(d, 19, 700);
    d.fillStyle = rgba(C.gold, 0.9);
    tracked(d, CFG.tagline, mx, my + 68, 4);
    d.restore();

    /* CTA bar, bottom. */
    const bp = E.outExpo(clamp((ms - 1200) / 900));
    d.save();
    d.globalAlpha = bp;
    const bw = W - 128, bh = 96, bx = 64, by = H - 250;
    roundRect(d, bx, by, bw, bh, 12);
    const g = d.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, C.goldLt); g.addColorStop(0.55, C.gold); g.addColorStop(1, C.goldDk);
    d.fillStyle = g; d.fill();
    setFont(d, 32, 900);
    d.fillStyle = '#0A0C10';
    d.textBaseline = 'middle';
    tracked(d, CFG.cta, W / 2, by + bh / 2 + 1, 3, 'center');
    setFont(d, 21, 800, true);
    d.fillStyle = rgba(C.white, 0.9);
    tracked(d, CFG.url, W / 2, by + bh + 42, 2, 'center');
    setFont(d, 13, 500);
    d.fillStyle = rgba(C.slate, 0.7);
    d.textAlign = 'center';
    d.fillText(CFG.disclaimer[0], W / 2, H - 56);
    d.fillText(CFG.disclaimer[1], W / 2, H - 38);
    d.textAlign = 'left';
    d.restore();
  }

  _captions(d, W, H, ms, y, scale = 1) {
    const line = CFG.vo.find(v => ms >= v.t && ms < v.t + v.d);
    if (!line) return;
    const a = Math.min(1, (ms - line.t) / 120, (line.t + line.d - ms) / 160);
    d.save();
    d.globalAlpha = clamp(a);
    setFont(d, 34 * scale, 800);
    const words = line.text.toUpperCase();
    const tw = d.measureText(words).width;
    const pad = 26 * scale;
    roundRect(d, W / 2 - tw / 2 - pad, y - 32 * scale, tw + pad * 2, 54 * scale, 8);
    d.fillStyle = 'rgba(4,6,10,0.76)';
    d.fill();
    d.fillStyle = C.white;
    d.textAlign = 'center';
    d.textBaseline = 'middle';
    d.fillText(words, W / 2, y - 4 * scale);
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
  els.time.textContent = `${fmt(Math.min(ms, DURATION))} / 30.00s`;
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

/* Poster frame. */
film.renderAt(1500);
update(0);

/* Exposed for the headless MP4 renderer. */
window.OTA_FILM = {
  duration: DURATION,
  stageW: STAGE_W,
  stageH: STAGE_H,
  scenes: TL.scenes.map(s => ({ name: s.name, start: s.start, end: s.end })),
  setAspect(a) { film.aspect = a; },
  setCaptions(v) { film.captions = v; },
  renderAt(ms, frameIdx) { film.renderAt(ms, frameIdx); },
  canvas: () => film.display,
  bounceWav,
  ready: true,
};
