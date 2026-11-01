# Rich Girl Code™ — v2 development version

Separate development version of the ecosystem site. The repository's original
root `index.html` is **not touched** by anything in this folder.

## Audit finding

Before this branch, this repository contained exactly one file: `index.html`,
a standalone **Options Traders Academy** landing page. It contains no mention
of Rich Girl Code or any of the ten houses, none of the brand copy, no forms,
no outbound links (all 20 CTAs are `href="#"`), and no SEO metadata beyond
charset and viewport.

The live site and `www.richgirlcode.com` were unreachable from the build
environment, so the live implementation could not be audited or ported.

**This folder is therefore the presentation layer, not a content port.** Every
house name and descriptor is verbatim from the brand handoff. Nothing else is
asserted: no products, prices, testimonials or statistics appear anywhere.
Content that must come from the live site is rendered as a labelled slot.

> The existing root `index.html` **does** contain fabricated testimonials with
> dollar figures, student counts and a two-tier price structure. Review those
> against what is actually true before that page goes anywhere public.

## Structure

```
v2/
├── index.html                  Homepage (parent brand)
├── assets/
│   ├── rgc.css                 Design system — tokens, layout, components
│   └── rgc.js                  Motion layer — entrance, cursor, reveals
├── houses/                     Nine house pages
│   ├── options-traders-os.html
│   ├── 8-figure-ai.html
│   ├── rich-rabbit.html
│   ├── rgc-media-group.html
│   ├── ethnicity-cosmetics.html
│   ├── black-girl-luxury-magazine.html
│   ├── rich-girl-code-music-group.html
│   ├── small-business-district.html
│   └── verified-assets.html
└── build/generate.py           Generator — one data table drives all 10 pages
```

Static HTML with no build step required to deploy. Serve `v2/` as the web root.

## Regenerating

All ten pages come from the `HOUSES` table at the top of `build/generate.py`.
Edit the table or the page functions, then:

```bash
python3 v2/build/generate.py
```

Editing a generated `.html` directly works too, but the next generator run
overwrites it — put lasting changes in `generate.py` or in `assets/`.

## Brand

**Deep blue ground, white, pink accent.** Bodoni Moda display over Jost. Key
copy: *Own Your 2027.* and *Curated by the culture. Founded for the people.*

| Role | Token | Value |
|---|---|---|
| Page ground | `--ink` | `#060D20` |
| Raised surface | `--ink-2` / `--ink-3` | `#0A1430` / `#132149` |
| White band | `--paper` | `#F6F8FF` |
| Text | `--white` / `--white-dim` | `#EEF3FF` / `#B9C6E8` |
| Deep blue | `--blue` / `--blue-lt` | `#1B3A8F` / `#3E63C8` |
| Pink accent | `--pink` / `--pink-lt` / `--pink-dk` | `#F08FB4` / `#FBC6DB` / `#B85C83` |

Per-house accents are set as `--accent` on `:root` in each page's head, so a
house inherits the whole system and tints it. All ten sit in the blue-to-pink
family so no house falls outside the palette.

## Technology

GSAP 3.12.5 + ScrollTrigger from cdnjs, two Google Fonts families, and the two
files in `assets/`. **Zero image requests** — all imagery is generated in CSS
from gradients and an SVG grain filter, so there is nothing to optimise and
nothing to wait for.

No Three.js. Nothing in the ecosystem presentation needs a genuine 3D
experience, and a WebGL layer would cost mobile performance for no gain. Add it
only if a specific house gains something real from it.

## What is functional

These work now, with no backend:

- **Mobile navigation** — hamburger below 980px opening a full drawer with all
  ten houses and every section. Focus moves in, Tab is trapped, Escape closes,
  body scroll is locked while open, and a resize to desktop releases it.
- **Directory search** — live client-side filter on the 8 Figure AI and Small
  Business District directories, with a running count and a no-match state.
  It filters whatever listings are present, so it keeps working once real ones
  are ported in.
- **Showcase rail** — prev/next buttons that scroll by exactly one card and
  disable at each end, alongside drag and trackpad scrolling.
- **Ecosystem index** — hover or keyboard focus swaps the generative stage
  panel; every row links to its house page.
- **Back to top** — appears past 600px.
- **Scrollspy** — the homepage nav marks the section you are in.
- **Skip link** — first tab stop on every page, jumping past the masthead.
- **Newsletter field** — real email validation with an inline error. On a valid
  address it says the list endpoint still needs connecting. It never claims an
  address was stored, because nothing stores it yet.

Verified in Chromium at 1440px and 390px: 31 checks covering all of the above,
no console errors, no horizontal overflow. Interaction is set up before GSAP
loads, so all of it still works if the CDN is blocked or slow.

### Not functional yet, and why

Anything needing the live site or a backend: product catalogues and prices,
purchase and checkout links, journal posts, founder copy, directory listings,
and newsletter storage. These are deliberately empty rather than filled with
invented content.

## Accessibility and performance

- All motion is skipped under `prefers-reduced-motion`, including rail and
  back-to-top smooth scrolling.
- Every section renders **complete at rest**. Motion is additive via
  `gsap.from()`, so nothing depends on JavaScript to become visible.
- The ecosystem index responds to keyboard focus, not just hover.
- The drawer carries `aria-expanded`/`aria-controls`; search reports counts via
  `aria-live`; the skip link is the first tab stop.
- Visible focus rings throughout; `:focus-visible` with a pink outline.
- Side gutters use `max(18px, env(safe-area-inset-*))` to clear phone system
  bars; no horizontal page scroll at 400px.
- Each page carries title, description, canonical, Open Graph and Twitter tags;
  the homepage adds Organization JSON-LD listing all nine subsidiary houses.

## Porting the live content

When the live site is reachable, the slots to fill are:

| Where | What ports in |
|---|---|
| Homepage founder section | Portrait, founder copy |
| Homepage journal grid | Posts, kickers, links |
| Homepage showcase rail | Products, imagery, prices, purchase links |
| Each house page hero/frame | House imagery and copy |
| `programme` modules | Module or release titles and ordering |
| `directory` modules | Listings, categories, search |
| `editorial` modules | Issues, features, bylines |
| `storefront` modules | Products, imagery, prices, purchase links |
| Footer newsletter | The live list endpoint |

The newsletter field currently states that it needs a live endpoint rather than
faking a success message. Wire it to the real list before launch.

Also still needed from the live site: working URLs, existing SEO metadata to
preserve, and any analytics or payment integrations.
