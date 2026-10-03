# Options Traders Academy OS — 30-second commercial

A broadcast-style spot built entirely in code. No stock footage, no After Effects, no
video libraries, no CDN. Every frame — the 3D, the motion graphics, the UI on the
screens, the music — is computed in the browser at runtime from about 3,000 lines of
hand-written JavaScript.

**Open `dist/ota-commercial-30s.html` in any browser and press play.** It is a single
self-contained file (fonts inlined, zero network requests) so it can be emailed,
dropped on a thumb drive, embedded in a page, or opened on a plane.

---

## Positioning

The spot sells **an operating system, not an app.** That claim is made in the voice-over
("This isn't another app — it's an operating system for traders"), on screen as the
headline at 11.6s (**NOT AN APP. AN OPERATING SYSTEM.**), in the lock-up line
(*The trader's operating system.*), and — most importantly — in the product UI itself,
which is dressed as a system rather than a tool: `OTA OS v4.2`, `SYSTEM MODULES ·
8 OF 8 INSTALLED`, `LEARNING / TRADE DESK / RISK ENGINE / PORTFOLIO`, `ALL SYSTEMS
LIVE`, uptime and latency readouts. The three pillars at 11.6s are numbered
`MODULE 01/02/03` rather than listed as features.

## Brand

Taken from the supplied logo file, sampled exactly:

| | Hex | Use |
|---|---|---|
| Deep green | `#062010` | The logo plate; base ink for every background and surface |
| Cream | `#FEF5DA` | The mark, and all primary type |
| Gold | `#D4AF37` | Accent, rules, CTA, eyebrows |

**The mark is the supplied artwork itself, not a redraw.** `tools/trace-logo.py`
reads the original PNG, builds a coverage field from its anti-aliased pixels, and
runs marching squares at the 0.5 iso-level with linear interpolation on every cell
edge — recovering the outline at sub-pixel accuracy. The result is committed as
`src/logo-art.js` and drawn as vector paths (even-odd fill, so the Q's counter is a
true hole), which means the mark is pin-sharp at any size instead of an upscaled
159px bitmap.

`tools/verify-logo.py` rasterises those paths back and diffs them against the source:
**mean coverage error 0.49%, and not a single pixel off by more than half a step.**
Re-run the tracer if the artwork ever changes:

```bash
python3 tools/trace-logo.py tools/logo-source.png   # → src/logo-art.js
python3 tools/verify-logo.py tools/logo-source.png  # prove it still matches
```

`logoTexture()` composites plate + mark to an off-screen canvas and `texQuad3D` maps
it onto a gold-rimmed extruded tile, so what rotates on screen at 7.2s and 26.8s is
the logo itself, lit in 3D. The same paths stamp the mark into the app header, the
console nav, the player chrome and the vertical brand bar.

## The 30 seconds

| In | Out | Scene | Voice-over | What's on screen |
|---|---|---|---|---|
| 0.0 | 3.4 | `hook` | "The market doesn't wait." | Camera pushes through a living candlestick field; ticker strip; 24-hour session dial. |
| 3.4 | 7.2 | `globe` | "Trillions move while you sleep. Most people just watch." | Wireframe globe, capital-flow arcs between eight financial centres; Tokyo/London/New York sessions overlap under a live playhead. |
| 7.2 | 11.6 | `brand` | "This isn't another app. It's an operating system for traders." | The data collapses into the logo plate; wordmark lock-up, specular sweep, flare. |
| 11.6 | 15.4 | `pillars` | "Options. Futures. Investing — one system." | **NOT AN APP. AN OPERATING SYSTEM.** Three numbered system modules land as 3D cards. |
| 15.4 | 19.2 | `curriculum` | "It walks you through the play. Every step, every day." | **Real screenshot:** the Daily Play on the device — Pick Ticker → Upload Charts → Get Contract → End of Day, with the four steps stacked beside it. |
| 19.2 | 23.0 | `growth` | "Entry. Exit. Stop. Before you click buy. That's what defined risk looks like." | **Real screenshot:** the generated trade plan on the device; compounding towers and the equity ribbon behind; risk meters, then the result card. |
| 23.0 | 26.8 | `pocket` | "In your pocket. 24 hours. Right beside the tools you already open." | **Real screenshots:** the app home on the device, and the actual iOS home screen — OTA between TradingView and Robinhood. |
| 26.8 | 30.0 | `close` | "Get instant access today." | Logo plate, wordmark, CTA, URL, **7-day money-back guarantee**, risk disclosure. |

Roughly 75 words — the right density for 30 seconds at a confident read. The cue sheet
(with exact in-points in milliseconds) is `OTA_CONFIG.vo` at the top of the HTML, and it
drives both the burned-in captions and the script panel under the player, so the three
can never drift apart.

### Recording the voice-over
Male or female, mid-range, unhurried — the copy is written to breathe. Land
"**operating system**" (9.4s), "**one system**" (14.4s) and "**instant access**" (28.4s)
on the musical accents. The score's own impacts sit at 0.0s, 7.2s, 18.0s, 22.5s and
26.5s; duck the music 4–5 dB under the VO and it mixes itself. `dist/*.wav` is the
isolated score stem for that mix.

---

## Real product footage

Five screenshots of the shipped app carry the middle of the film, in place of
the invented UI the first cut used. `tools/pack-shots.mjs` conditions them and
inlines them as data URIs, so the delivered HTML is still one self-contained
file with no network requests:

| Shot | Where | Why it earns its place |
|---|---|---|
| `daily-play.jpg` | 15.4s | The actual guided loop. Shows the product *working*, not described. |
| `trade-plan.jpg` | 19.2s | Entry, exit, stop and strike on screen — the literal proof of "defined risk". |
| `app-home.jpg` | 23.0s | The real home screen of the app, on the 3D device. |
| `homescreen.jpg` | 24.7s | OTA installed between TradingView and Robinhood. "Installed, not a bookmark." |
| `result.jpg` | 22.3s | One real filled trade. See the warning below. |

Phone shots are pre-cropped to the 3D device's screen aspect (0.476) so they map
on with no letterbox, and `appHome` has its Safari toolbar trimmed off so the app
reads as an app. Re-run the packer after changing anything in `tools/shots/`:

```bash
node tools/pack-shots.mjs     # tools/shots/*.jpg → src/shots.js
```

Images are decoded before `window.OTA_FILM.ready` flips true, so the frame-exact
renderer can never capture a frame with an image still loading.

> **More shots are easy to add.** Drop the file in `tools/shots/`, add a line to
> `PLAN` in the packer, and point a scene at `IMG.<key>`. Good candidates: the
> Journal screen, the Hit List, a filled end-of-day grade, the Market tab.

### ⚠️ The result screenshot is a performance claim

`result.jpg` shows a single filled SPX call at **+225%**. That is the one element
in the film that makes a claim about outcomes, and it changes the spot's
regulatory profile:

- It is labelled **INDIVIDUAL RESULT · NOT TYPICAL** on screen, and the closing
  disclaimer says results shown are one individual's and are not typical.
- Meta, Google and TikTok all restrict financial-services ads that show returns.
  This frame is the most likely reason a version of this spot gets rejected.
- Showing one winning trade without the surrounding record is the classic FTC
  testimonial problem. If this is used, be ready to substantiate it.

One switch produces a version with no results in it at all:

```js
window.OTA_CONFIG = { showResult: false, … };
```

Everything else in the film stays claim-free by design: strategy *parameters*
(position size, max loss, target R:R) rather than outcomes.

## The offer, as stated in the film

The close says exactly one thing about terms: **7-DAY MONEY-BACK GUARANTEE**, beside
**INSTANT ACCESS**. There is deliberately no "free", no "free trial", no "7 days free"
and no 30-day guarantee anywhere in the spot — those read as a different offer and
would be a misrepresentation.

> ⚠️ The repository's `index.html` landing page still advertises a **7-day free trial**
> and a **30-day money-back guarantee**. That contradicts the real offer and contradicts
> this film. It is outside this commercial's scope, so it has been left untouched — but
> it should be corrected before either is used.

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
node render.mjs --web               # streamable copies + poster → dist/web/

node tools/fetch-fonts.mjs          # regenerate the inlined webfonts (needs network)
```

### Watching it in a browser

GitHub and most file pickers will not stream a 15 MB master — they hand it over as a
download. `node render.mjs --web` derives copies small enough to play inline (6.4 MB and
4.7 MB) plus a poster frame, which feed `dist/web/index.html`: a screening page with both
orientations, a format switch and the cue sheet. That page is committed; the media beside
it is derived and git-ignored, so regenerate it with the command above before publishing
the page anywhere.

`render.mjs` does not screen-record. It drives `window.OTA_FILM.renderAt(ms, frame)` in
headless Chromium one frame at a time and pipes the PNGs straight into ffmpeg, so the
output is frame-exact and identical on any machine, however slow. The score is bounced
through an `OfflineAudioContext` to WAV and muxed in, so the MP4 carries real audio.

---

## Making it yours

Everything sales-facing is in one block at the top of the HTML (and of `src/shell.html`):

```js
window.OTA_CONFIG = {
  brand, product, tagline, cta, url, badges, disclaimer, vo: [ … ]
};
```

Change the URL, the offer, the trust badges or any caption there and rebuild — nothing
else needs touching. The palette lives in `C` inside `src/core.js`.

### Before this runs anywhere paid — please read

- **`url` is a placeholder.** `OPTIONSTRADERSACADEMY.COM` is a guess; set the real domain.
- **The remaining claims come from the existing landing page** (8 modules, 200+ lessons,
  daily live setups). Verify each is currently true before the spot airs — an ad makes
  them a promise.
- **One performance claim, and it is deliberate and isolated.** The `result.jpg` frame
  at 22.3s shows a single filled trade at +225%; it is labelled *individual result, not
  typical* on screen and covered in the closing disclaimer, and `showResult: false`
  removes it entirely. See **The result screenshot is a performance claim** above —
  that one frame is the most likely reason a version of this spot gets rejected by an
  ad platform. Nothing else in the film makes one: no win rate, no earnings figure, and
  the meters show strategy *parameters* (position size, max loss, target R:R) rather
  than outcomes.
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
  fonts.css      generated — Inter, JetBrains Mono and Playfair Display inlined as base64
  logo-art.js    generated — the supplied logo traced to vector outlines
  shots.js       generated — the real product screenshots, inlined
  style.css      player chrome
  math3d.js      vec3 / mat4, column-major like GLSL · ear-clipping triangulator
  geometry.js    procedural meshes: extrude, box, wire sphere, torus, rings,
                 rounded rect, great-circle arcs
  render3d.js    painter's-algorithm renderer: cull, depth sort, Blinn-Phong +
                 rim + fill, glow lines, 3D-anchored billboards
  texquad.js     perspective-correct texture mapping on a 2D canvas
  core.js        brand palette, easing, deterministic noise, kinetic typography, timeline
  fx.js          bloom, RGB split, grain, vignette, scrim, flare, sweep, ticker
  audio.js       the score, synthesised in WebAudio + offline WAV bounce
  ui.js          the logo renderer and the in-film OS UI (phone + console)
  scenes-a.js    acts I & II   (0.0 → 15.4s)
  scenes-b.js    acts III & IV (15.4 → 30.0s)
  main.js        compositing, post chain, transport, OTA_FILM seek API
build.mjs        inlines src/* into one portable HTML file
render.mjs       headless frame-exact capture → MP4 / GIF / stills
tools/           font fetcher · logo tracer + verifier · screenshot packer · source art
```

Three parts are worth a look if you're judging the engineering:

**The renderer is hand-written.** `render3d.js` transforms vertices through
model → view → clip → screen, culls back-faces by screen-space winding, depth-sorts every
triangle, line and billboard into one list, and shades each face with a key/fill/rim/
specular model. Painter's algorithm has a known failure mode — coplanar surfaces have no
stable order — which is why the logo plate's gold rim and the phone's are each offset in
local Z *and* given an explicit `zBias`.

**The screens are real 3D surfaces, not flat overlays.** Canvas2D only offers affine
transforms, so `texquad.js` subdivides each quad in *world* space, projects the grid, and
draws every sub-triangle with its own affine map. Because the subdivision happens before
projection the mapping is exact, not approximated — that's why the logo tracks the plate,
the console tracks the slab, and the app UI tracks the phone as they rotate.

**Nothing depends on frame history.** Every scene is a pure function of its local time,
so the film can be scrubbed, replayed or stepped frame-by-frame and look identical every
time. That property is what makes a deterministic MP4 render possible at all.

Hotkeys in the player: `space` play · `←`/`→` step one frame · `R` restart · `M` mute ·
`C` captions · `V` 9:16.
