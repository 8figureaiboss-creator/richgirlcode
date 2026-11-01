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

Black, white, deep burgundy, cream, refined metallic gold. Bodoni Moda display
over Jost. Key copy: *Own Your 2027.* and *Curated by the culture. Founded for
the people.*

Per-house accents are set as `--accent` on `:root` in each page's head, so a
house inherits the whole system and tints it.

## Technology

GSAP 3.12.5 + ScrollTrigger from cdnjs, two Google Fonts families, and the two
files in `assets/`. **Zero image requests** — all imagery is generated in CSS
from gradients and an SVG grain filter, so there is nothing to optimise and
nothing to wait for.

No Three.js. Nothing in the ecosystem presentation needs a genuine 3D
experience, and a WebGL layer would cost mobile performance for no gain. Add it
only if a specific house gains something real from it.

## Accessibility and performance

- All motion is skipped under `prefers-reduced-motion`.
- Every section renders **complete at rest**. Motion is additive via
  `gsap.from()`, so nothing depends on JavaScript to become visible.
- The ecosystem index responds to keyboard focus, not just hover.
- Visible focus rings throughout; `:focus-visible` with a gold outline.
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
