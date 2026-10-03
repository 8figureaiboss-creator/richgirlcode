# Options Traders Academy — 30-second commercial

A broadcast-style spot built entirely in code. No stock footage, no After Effects, no
video libraries, no CDN. Every frame — the 3D, the motion graphics, the UI on the
screens, the music — is computed in the browser at runtime from about 3,000 lines of
hand-written JavaScript.

**Open `dist/ota-commercial-30s.html` in any browser and press play.** It is a single
self-contained file (fonts inlined, zero network requests) so it can be emailed,
dropped on a thumb drive, embedded in a page, or opened on a plane.

---

## The 30 seconds

| In | Out | Scene | Voice-over | What's on screen |
|---|---|---|---|---|
| 0.0 | 3.4 | `hook` | "The market doesn't wait." | Camera pushes through a living candlestick field; ticker strip; 24-hour session dial. |
| 3.4 | 7.2 | `globe` | "Trillions move while you sleep. Most people just watch." | Wireframe globe, capital-flow arcs firing between eight financial centres; Tokyo/London/New York session bars overlap under a live playhead. |
| 7.2 | 11.6 | `brand` | "Options Traders Academy hands you the edge." | The data collapses into the extruded gold mark. Logo lock-up, specular sweep, anamorphic flare. |
| 11.6 | 15.4 | `pillars` | "Options. Futures. Investing — one system." | Three 3D pillars land: live option chain, futures ladder, allocation donut. |
| 15.4 | 19.2 | `curriculum` | "8 modules. 200+ lessons. Live setups you can actually follow." | A floating dashboard ticks the curriculum off module by module while the trade desk fills with alerts. |
| 19.2 | 23.0 | `growth` | "Real risk management. A portfolio that compounds." | Compounding towers rise, a 3D equity ribbon extrudes above them, a hex risk shield forms; position size / max loss / R:R meters stack. |
| 23.0 | 26.8 | `pocket` | "In your pocket. 24 hours. 365 days a year." | The phone rotates in running the live app UI; orbital session rails spin, pips light Sydney → New York. |
| 26.8 | 30.0 | `close` | "Start free today." | Mark + wordmark lock-up, pulsing CTA, URL, trust badges, risk disclosure. |

Roughly 75 words — the right density for 30 seconds at a confident read. The cue sheet
(with exact in-points in milliseconds) is `OTA_CONFIG.vo` at the top of the HTML, and it
drives both the burned-in captions and the script panel under the player, so the three
can never drift apart.

### Recording the voice-over
Male or female, mid-range, unhurried — the copy is written to breathe. Land
"**edge**" (7.6s), "**one system**" (14.4s) and "**free**" (28.4s) on the musical
accents. The score's own impacts sit at 0.0s, 7.2s, 18.0s, 22.5s and 26.5s; duck the
music 4–5 dB under the VO and it mixes itself. `dist/*.wav` is the isolated score stem
for that mix.

---

## Producing files

```bash
node build.mjs                      # src/* → dist/ota-commercial-30s.html (single file)

node render.mjs                     # → dist/ota-commercial-30s.mp4  (1920×1080, 30fps, H.264 + AAC)
node render.mjs --vertical          # → 1080×1920 for Reels / TikTok / Shorts
node render.mjs --fps 60            # smoother motion for web hero use
node render.mjs --no-captions       # clean plate for a dub or a different language
node render.mjs --gif               # also write a muted looping GIF
node render.mjs --stills            # one PNG per scene, for review or thumbnails

node tools/fetch-fonts.mjs          # regenerate the inlined webfonts (needs network)
```

`render.mjs` does not screen-record. It drives `window.OTA_FILM.renderAt(ms, frame)` in
headless Chromium one frame at a time and pipes the PNGs straight into ffmpeg, so the
output is frame-exact and identical on any machine, however slow. The score is bounced
through an `OfflineAudioContext` to WAV and muxed in, so the MP4 carries real audio.

---

## Making it yours

Everything sales-facing is in one block at the top of the HTML (and of `src/shell.html`):

```js
window.OTA_CONFIG = {
  brand, tagline, cta, url, badges, disclaimer, vo: [ … ]
};
```

Change the URL, the offer, the trust badges or any caption there and rebuild — nothing
else needs touching. The gold/ink palette lives in `C` inside `src/core.js` and matches
the existing landing page (`#D4AF37` on `#05070B`).

### Before this runs anywhere paid — please read

- **`url` is a placeholder.** `OPTIONSTRADERSACADEMY.COM` is a guess; set the real domain.
- **The claims are taken from the existing landing page** (8 modules, 200+ lessons,
  7-day free trial, 30-day guarantee, daily live setups). Verify each is currently true
  before the spot airs — an ad makes them a promise.
- **No performance claims are made, deliberately.** There is no win rate, no profit
  figure, no student-earnings number anywhere in the film. Every screen is marked
  `ILLUSTRATIVE`, and the meters show strategy *parameters* (position size, max loss,
  target R:R) rather than results. That is both safer and, in this category, more
  persuasive — specific profit claims are the single biggest regulatory exposure in
  trading education advertising.
- **The risk disclosure is on screen for the final 1.1 seconds** and in the footer. Check
  the wording against whatever your jurisdiction and ad platform require; Meta, Google
  and TikTok each have their own financial-services policy.
- **The instructors, testimonials and dollar figures on the landing page are not used
  here.** If any of those are not real people with verifiable records, they are a bigger
  problem than the commercial.

---

## How it's built

```
src/
  shell.html     page shell + OTA_CONFIG (the only block you edit to re-skin)
  fonts.css      generated — Inter + JetBrains Mono inlined as base64 woff2
  style.css      player chrome
  math3d.js      vec3 / mat4, column-major like GLSL · ear-clipping triangulator
  geometry.js    procedural meshes: extrude, box, wire sphere, torus, rings,
                 rounded rect, chevron, great-circle arcs
  render3d.js    painter's-algorithm renderer: cull, depth sort, Blinn-Phong +
                 rim + fill, glow lines, 3D-anchored billboards
  texquad.js     perspective-correct texture mapping on a 2D canvas
  core.js        easing, deterministic noise, kinetic typography, timeline
  fx.js          bloom, RGB split, grain, vignette, scrim, flare, sweep, ticker
  audio.js       the score, synthesised in WebAudio + offline WAV bounce
  ui.js          the in-film product UI (phone + dashboard)
  scenes-a.js    acts I & II   (0.0 → 15.4s)
  scenes-b.js    acts III & IV (15.4 → 30.0s)
  main.js        compositing, post chain, transport, OTA_FILM seek API
build.mjs        inlines src/* into one portable HTML file
render.mjs       headless frame-exact capture → MP4 / GIF / stills
tools/           one-off font fetcher
```

Three parts are worth a look if you're judging the engineering:

**The renderer is hand-written.** `render3d.js` transforms vertices through
model → view → clip → screen, culls back-faces by screen-space winding, depth-sorts every
triangle, line and billboard into one list, and shades each face with a key/fill/rim/
specular model. Painter's algorithm has a known failure mode — coplanar surfaces have no
stable order — which is why the phone's gold rim is offset in local Z *and* given an
explicit `zBias`.

**The screens are real 3D surfaces, not flat overlays.** Canvas2D only offers affine
transforms, so `texquad.js` subdivides each quad in *world* space, projects the grid, and
draws every sub-triangle with its own affine map. Because the subdivision happens before
projection the mapping is exact, not approximated — that's why the dashboard tracks the
slab and the app UI tracks the phone as they rotate.

**Nothing depends on frame history.** Every scene is a pure function of its local time,
so the film can be scrubbed, replayed or stepped frame-by-frame and look identical every
time. That property is what makes a deterministic MP4 render possible at all.

Hotkeys in the player: `space` play · `←`/`→` step one frame · `R` restart · `M` mute ·
`C` captions · `V` 9:16.
