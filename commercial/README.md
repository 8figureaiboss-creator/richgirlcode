# Options Traders Academy OS — the operating-system film

A broadcast-style commercial built entirely in code. No stock footage, no After Effects,
no video libraries, no CDN. Every frame — the 3D, the motion graphics, the UI on the
screens, the music — is computed in the browser at runtime from about 4,500 lines of
hand-written JavaScript.

**Open `dist/ota-commercial.html` in any browser and press play.** It is a single
self-contained file (fonts inlined, zero network requests) so it can be emailed,
dropped on a thumb drive, embedded in a page, or opened on a plane.

**Runtime: 1:14.** The supplied voice-over script is 160 words. Read at a brisk but
natural ad pace (~170 wpm) that is 57.6 seconds of continuous speech; add the cold open,
the beats between acts and an end card that holds long enough to be acted on, and the
cut lands at 74 seconds. It will not fit in 60 without cutting words — see
**Cutting it down** below for where to cut if a 60- or 30-second version is needed.

---

## Positioning

The film sells **an operating system, not an app.** The whole argument is built on one
reversal, and it is stated four times in four different registers:

1. **The problem, as the viewer lives it** (3.4s): ten app tiles drifting apart —
   CHARTS, BROKER, NEWS, SCANNER, DISCORD, NOTES, ALERTS, JOURNAL, SHEETS, YOUTUBE.
   **TEN APPS. NO SYSTEM.**
2. **The claim** (9.2s): they collapse into one mark. **ONE SYSTEM. / YOUR FINANCIAL
   OPERATING SYSTEM.**
3. **The proof** (16.4 → 53.2s): four acts that each show a different layer of the
   same system — build the play, build the contract, learn it, track it, then the
   portfolio and the lifestyle around it. An app does one of those. A system does all
   of them, which is the entire point.
4. **The close** (62.4s): black, the mark alone, and the line said plainly —
   *"You don't need another trading app. You need an operating system."*

That is why the close is an Apple-style product beat rather than a hard sell: the mark
is given silence and time before anything is asked for. The CTA, the guarantee and the
disclosure arrive only after the idea has landed.

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
it onto a gold-rimmed extruded tile, so what rotates on screen at 9.2s and 62.4s is
the logo itself, lit in 3D. The same paths stamp the mark into the app header, the
console nav, the player chrome and the vertical brand bar.

## The 1:14, act by act

| In | Out | Scene | Voice-over | What's on screen |
|---|---|---|---|---|
| 0.0 | 3.4 | `hook` | *(cold open — score only)* | Camera pushes through a living candlestick field; ticker strip; 24-hour session dial. **THE MARKET DOESN'T WAIT.** |
| 3.4 | 9.2 | `collapse` | "Trading shouldn't require ten different apps, scattered information, and guessing your next move." | Ten app tiles — CHARTS, BROKER, NEWS, SCANNER, DISCORD, SHEETS… — drift apart, then collapse into the single gold-rimmed Q. **TEN APPS. NO SYSTEM.** |
| 9.2 | 16.4 | `system` | "Meet the Options Traders Academy OS — one operating system to learn, analyze, trade, invest, and build wealth." | The logo plate turns in 3D under a specular sweep. **ONE SYSTEM. / YOUR FINANCIAL OPERATING SYSTEM.** + LEARN · ANALYZE · TRADE · INVEST · BUILD WEALTH. |
| 16.4 | 23.6 | `play` | "Choose your ticker. Upload your charts. Build your setup." | **Real screenshot, lit region by region:** Pick Ticker → Upload Charts → Get Contract, then *"What ticker are we trading today?"*, then QQQ / SPY / AAPL / NVDA. |
| 23.6 | 31.2 | `plan` | "Identify confirmation, entry, exit, risk level, and contract — all inside a structured framework built to help you stop chasing and start trading with discipline." | **Real screenshot, scrolled down the plan:** confirmation → entry → take-profit → stop/cut-loss → primary strike → OTM runner, each one illuminated in turn. **ANALYZE → CONFIRM → EXECUTE → MANAGE RISK.** |
| 31.2 | 38.4 | `academy` | "But OTA doesn't stop at the trade. Learn technical analysis, options strategies, risk management, psychology and the Greeks." | **32+** rolls up; eight module tiles deal out — Trading Academy, Risk Management 101, Greeks Mastery, Candle Anatomy, Technical Analysis, Options Strategies, Trading Psychology, $100 Wealth Playbook. |
| 38.4 | 45.6 | `track` | "Track your decisions in your trading journal, review your progress, and turn every market day into another lesson." | Daily Journal (graded entries), Hit List (watch rows), Mission Control (progress ring), then the real filled-trade screenshot. |
| 45.6 | 53.2 | `wealth` | "Because real wealth is bigger than one trade. Build and organize your investment portfolio, explore multiple asset classes," | A 3D allocation builds itself; eight asset-class tiles — Stocks, ETFs, Dividend & Income, REITs, Bonds, Precious Metals, Real Estate & Land, Luxury Goods. |
| 53.2 | 62.4 | `lifestyle` | "expand your financial education, and tap into the OTA lifestyle ecosystem. Options Traders Academy OS — built for what happens before the trade, during the trade, and long after it." | A gold Supercar Social Society membership card turns in 3D, then folds away as the mark takes its place and the picture falls to black. |
| 62.4 | 74.0 | `launch` | "You don't need another trading app. You need an operating system." | Black. The mark fades up alone and waits. Then the end card: wordmark, *Trade smarter. Learn deeper. Build bigger.*, **YOUR MARKET · YOUR EDUCATION · YOUR WEALTH · ONE SYSTEM**, CTA, **7-day money-back guarantee**, risk disclosure. |

The cue sheet (exact in-points in milliseconds) is `OTA_CONFIG.vo` at the top of the
HTML. It drives the burned-in captions, the script panel under the player, the exported
recording sheet and the `.srt` — so the picture, the subtitles and the voice track can
never drift apart.

### Recording the voice-over

There is no text-to-speech in this build and none in the render container — the film
ships with the score only, and the voice track has to be recorded. Everything needed to
record it to picture is generated:

```bash
node render.mjs --script      # → dist/ota-voiceover-script.txt  and  dist/ota-captions.srt
```

The sheet gives every line its exact in-point, out-point, duration, word count and the
implied words-per-minute, plus the scene and the picture it plays over. Read each line
inside its own window and leave the gaps silent; the score and the picture already fill
them. Direction: mid-range, warm and certain, not hyped — the copy is written to breathe.
All 18 cues sit between 157 and 175 wpm except the two closing lines, which are
deliberately slower (144 and 130 wpm) because the picture is holding on the mark.

Then mix it in — the music is side-chained off the voice, not faded by hand, so the duck
follows the performance and rides back up in every gap:

```bash
node render.mjs --vo take3.wav              # → dist/ota-commercial-vo.mp4
node render.mjs --vertical --vo take3.wav   # → dist/ota-commercial-9x16-vo.mp4
```

`dist/ota-score.wav` is the isolated score stem if you would rather mix elsewhere. The
score's impacts sit on the act cuts — 0.0, 3.4, 9.2, 16.4, 23.6, 31.2, 38.4, 45.6, 53.2,
62.4 and the final cadence at 70.2 — and the kit deliberately drops out from 59.4s so the
last line lands in near-silence.

### Cutting it down

If a 60- or 30-second version is needed, cut whole acts rather than trimming inside them
— every scene is self-contained and the score is keyed to the act boundaries:

- **60s:** drop `wealth` (45.6 → 53.2) and shorten `lifestyle` to ~5s. Re-time the four
  Act IV cues and move the launch cut to 55.0.
- **30s:** keep `hook`, `collapse`, `system`, `plan`, `launch`. That is the whole
  argument — ten apps, one system, the actual plan, the close.

Both are edits to the `TL.add(...)` list and the `vo` cue sheet; nothing else changes.

---

## Real product footage

Five screenshots of the shipped app carry the middle of the film, in place of
the invented UI the first cut used. `tools/pack-shots.mjs` conditions them and
inlines them as data URIs, so the delivered HTML is still one self-contained
file with no network requests:

| Shot | Where | Why it earns its place |
|---|---|---|
| `daily-play.jpg` | 16.4 → 23.6s | The actual guided loop, lit region by region as the voice-over names each step. |
| `trade-plan.jpg` | 23.6 → 31.2s | Entry, exit, stop, strike and runner on screen — the literal proof of "defined risk". |
| `result.jpg` | 41.3 → 45.6s | One real filled trade. See the warning below. |
| `app-home.jpg` | *(held)* | Packed and available as `IMG.appHome`; not placed in this cut. |
| `homescreen.jpg` | *(held)* | Packed and available as `IMG.homescreen`; not placed in this cut. |

> **Acts III and IV are typographic because there are no screenshots for them yet.**
> The Trading Academy, Risk Management 101, Greeks Mastery, Candle Anatomy, the $100
> Wealth Playbook, the Daily Journal, Mission Control, the Hit List, My Wealth Portfolio,
> the asset-class pages and the Supercar Social Society all appear as designed motion
> graphics rather than captures. That is deliberate — inventing UI that looks like a
> screenshot would misrepresent the product. Send captures of those screens and they
> drop straight in: add the file to `tools/shots/`, add a line to `PLAN` in
> `tools/pack-shots.mjs`, and point the scene at `IMG.<key>` with a `screenPane`.

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
node build.mjs                      # src/* → dist/ota-commercial.html (single file)

node render.mjs                     # → dist/ota-commercial.mp4  (1920×1080, 30fps, H.264 + AAC)
node render.mjs --vertical          # → 1080×1920 for Reels / TikTok / Shorts
node render.mjs --vo take3.wav      # mux a recorded voice-over, score side-chained under it
node render.mjs --script            # timed VO recording sheet + .srt caption file
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

- **There is no URL in the film.** `OTA_CONFIG.url` is deliberately empty — the close
  carries the CTA and the guarantee only. Set it if a domain should be on screen.
- **The remaining claims come from the existing landing page** (8 modules, 200+ lessons,
  daily live setups). Verify each is currently true before the spot airs — an ad makes
  them a promise.
- **One performance claim, and it is deliberate and isolated.** The `result.jpg` frame
  at 41.3s shows a single filled trade at +225%; it is labelled *individual result, not
  typical* on screen and covered in the closing disclaimer, and `showResult: false`
  removes it entirely. See **The result screenshot is a performance claim** above —
  that one frame is the most likely reason a version of this spot gets rejected by an
  ad platform. Nothing else in the film makes one: no win rate, no earnings figure, and
  the meters show strategy *parameters* (position size, max loss, target R:R) rather
  than outcomes.
- **The risk disclosure is on screen for the final 3.5 seconds** and in the footer. Check
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
  scenes-a.js    the hook, and the scene library the earlier 30s cut used
  scenes-b.js    quadCorners + the remaining library scenes
  scenes-c.js    the four-act cut: screenPane / panKeys / spotlight / tileGrid,
                 and scenes 2-10 (3.4 → 74.0s)
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
