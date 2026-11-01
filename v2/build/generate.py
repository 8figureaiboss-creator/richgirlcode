#!/usr/bin/env python3
"""
RICH GIRL CODE(TM) - static page generator.

One data table below drives the homepage and all nine house pages so the
ecosystem stays consistent. Output is plain static HTML with no runtime
dependency on this script; deploy v2/ as-is.

    python3 v2/build/generate.py

HOUSE NAMES AND DESCRIPTORS ARE VERBATIM FROM THE BRAND HANDOFF.
Nothing here invents products, prices, testimonials or statistics.
Content that must come from the live site is rendered as a labelled slot.
"""
import os, re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
TM = '<sup>&trade;</sup>'

# slug, number, display name, plain name, descriptor, accent, pillars, module, slot label, slots
HOUSES = [
    ("index", "01", "Rich Girl Code" + TM, "Rich Girl Code", "Parent brand", "#C8A253",
     ["Parent brand"], "home", "", 0),
    ("options-traders-os", "02", "Options Traders OS" + TM, "Options Traders OS",
     "Trading education and software", "#B08A3E",
     ["Trading education", "Software"], "programme", "Curriculum module", 8),
    ("8-figure-ai", "03", "8 Figure AI", "8 Figure AI",
     "AI assistants, GPTs, and technology", "#B9B3A4",
     ["AI assistants", "GPTs", "Technology"], "directory", "Directory listing", 6),
    ("rich-rabbit", "04", "Rich Rabbit", "Rich Rabbit", "Commerce", "#7B1C2E",
     ["Commerce"], "storefront", "Storefront item", 6),
    ("rgc-media-group", "05", "RGC Media Group", "RGC Media Group",
     "Media and entertainment", "#5A1322",
     ["Media", "Entertainment"], "editorial", "Production", 6),
    ("ethnicity-cosmetics", "06", "Ethnicity Cosmetics", "Ethnicity Cosmetics",
     "Beauty", "#AE7268", ["Beauty"], "storefront", "Storefront item", 6),
    ("black-girl-luxury-magazine", "07", "Black Girl Luxury Magazine",
     "Black Girl Luxury Magazine", "Editorial media", "#F0E9DC",
     ["Editorial media"], "editorial", "Issue", 6),
    ("rich-girl-code-music-group", "08", "Rich Girl Code Music Group" + TM,
     "Rich Girl Code Music Group", "Music and entertainment", "#6E2340",
     ["Music", "Entertainment"], "programme", "Release", 8),
    ("small-business-district", "09", "Small Business District", "Small Business District",
     "Business discovery and promotion", "#9A8456",
     ["Business discovery", "Promotion"], "directory", "Business listing", 6),
    ("verified-assets", "10", "Verified Assets", "Verified Assets",
     "Ecosystem house", "#D6C28A", ["Ecosystem house"], "storefront", "Storefront item", 6),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com" />\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;'
         '0,6..96,900;1,6..96,400&family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,300'
         '&display=swap" />')

SCRIPTS = ('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n'
           '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>\n'
           '<script src="{base}assets/rgc.js"></script>')

NAV = [("ecosystem", "Ecosystem"), ("founder", "Founder"), ("journal", "Journal"),
       ("commerce", "Commerce"), ("directories", "Directories"), ("media", "Media")]


def head(title, desc, canonical, base, accent=None):
    style = ('\n<style>:root{--accent:%s}</style>' % accent) if accent else ''
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>{title}</title>
<meta name="description" content="{desc}" />
<link rel="canonical" href="{canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Rich Girl Code" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:url" content="{canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="theme-color" content="#0A0A0B" />
{FONTS}
<link rel="stylesheet" href="{base}assets/rgc.css" />{style}
</head>
<body>

<div class="curtain" aria-hidden="true">
  <p class="curtain__mark" id="curtainMark">Rich Girl Code</p>
  <span class="curtain__line"><i></i></span>
</div>
<div class="cursor" id="cursor" aria-hidden="true"></div>
"""


def masthead(base, is_home):
    if is_home:
        links = "\n".join(
            f'      <a href="#{a}">{b}</a>' for a, b in NAV)
    else:
        links = ('      <a href="%sindex.html#ecosystem">All houses</a>\n'
                 '      <a href="%sindex.html#journal">Journal</a>\n'
                 '      <a href="%sindex.html#directories">Directories</a>\n'
                 '      <a href="%sindex.html#media">Media</a>' % (base, base, base, base))
    return f"""
<header class="masthead">
  <div class="masthead__in">
    <a class="wordmark" href="{base}index.html">Rich Girl Code<sup>&trade;</sup></a>
    <nav class="navlinks" aria-label="Primary">
{links}
    </nav>
  </div>
</header>
"""


def footer(base):
    col_a = "\n".join(
        f'            <li><a href="{base}{"index.html" if h[0]=="index" else "houses/"+h[0]+".html"}">{h[2]}</a></li>'
        for h in HOUSES[:5])
    col_b = "\n".join(
        f'            <li><a href="{base}houses/{h[0]}.html">{h[2]}</a></li>'
        for h in HOUSES[5:])
    return f"""
<footer class="foot">
  <div class="shell">
    <div class="foot__top">
      <div>
        <p class="foot__mark">Own Your<br />2027.</p>
        <p class="lede" style="margin-top:1rem">Curated by the culture. Founded for the people.</p>
        <form class="signup" id="signup" novalidate>
          <label for="emailField" class="sr-only">Email address</label>
          <input id="emailField" name="email" type="email" placeholder="Email address" autocomplete="email" />
          <button type="submit">Join</button>
          <p class="signup__note" id="signupNote" role="status"></p>
        </form>
      </div>
      <nav class="foot__cols" aria-label="Ecosystem">
        <div>
          <h3>Houses</h3>
          <ul>
{col_a}
          </ul>
        </div>
        <div>
          <h3>&nbsp;</h3>
          <ul>
{col_b}
          </ul>
        </div>
        <div>
          <h3>Ecosystem</h3>
          <ul>
            <li><a href="{base}index.html#founder">The Founder</a></li>
            <li><a href="{base}index.html#journal">The Journal</a></li>
            <li><a href="{base}index.html#commerce">Showcase</a></li>
            <li><a href="{base}index.html#directories">Directories</a></li>
            <li><a href="{base}index.html#media">Studios</a></li>
          </ul>
        </div>
      </nav>
    </div>
    <div class="foot__base">
      <span>&copy; <span id="yr">2026</span> Rich Girl Code&trade;</span>
      <span>richgirlcode.com</span>
    </div>
  </div>
</footer>

{SCRIPTS.format(base=base)}
</body>
</html>
"""


def strip_nav(current_slug, base):
    cells = []
    for h in HOUSES:
        if h[0] == current_slug:
            continue
        href = f"{base}index.html" if h[0] == "index" else f"{base}houses/{h[0]}.html"
        cells.append(f'      <a href="{href}"><b>{h[2]}</b><span>{h[4]}</span></a>')
    return ("\n".join(cells))


# ── house page modules ──────────────────────────────────────
def mod_programme(label, n):
    rows = "\n".join(
        f'        <li><b>{i:02d}</b><span>{label} {i:02d}<em>Ports from the live site</em></span></li>'
        for i in range(1, n + 1))
    return f"""      <ol class="steps">
{rows}
      </ol>"""


def mod_directory(label, n):
    cards = "\n".join(
        f"""        <article class="jcard">
          <div class="jcard__art"></div>
          <div class="jcard__body">
            <p class="jcard__kicker">{label}</p>
            <h3 class="jcard__title">{label} {i:02d}</h3>
            <p class="pend" style="margin-top:auto">Live listing</p>
          </div>
        </article>""" for i in range(1, n + 1))
    return f"""      <div class="jgrid">
{cards}
      </div>"""


mod_editorial = mod_directory


def mod_storefront(label, n):
    cards = "\n".join(
        f"""        <article class="shop">
          <div class="shop__art"><i>{label} {i:02d}</i></div>
          <div class="shop__body">
            <h3 class="shop__name">{label} {i:02d}</h3>
            <p class="shop__meta">Ports from the live storefront</p>
          </div>
        </article>""" for i in range(1, n + 1))
    return f"""      <div class="rail">
{cards}
      </div>"""


MODULES = {"programme": mod_programme, "directory": mod_directory,
           "editorial": mod_editorial, "storefront": mod_storefront}

MODULE_TITLES = {"programme": ("The <em>Index</em>", "Programme"),
                 "directory": ("The <em>Directory</em>", "Discovery"),
                 "editorial": ("The <em>Archive</em>", "Editorial"),
                 "storefront": ("The <em>Storefront</em>", "Commerce")}

EMPTY_COPY = {
    "programme": "Module titles, lesson counts and ordering port from the live site. "
                 "Nothing is listed here that has not been published there.",
    "directory": "Listings, categories and search port from the live directory. "
                 "Nothing is listed here that has not been published there.",
    "editorial": "Issues, features and bylines port from the live archive. "
                 "Nothing is listed here that has not been published there.",
    "storefront": "Product names, imagery, prices and purchase links port from the "
                  "live storefront. No price or product is shown until it does.",
}


def build_house(h):
    slug, num, name, plain, desc, accent, pillars, module, label, slots = h
    base = "../"
    title = f"{plain} — Rich Girl Code"
    canonical = f"https://www.richgirlcode.com/houses/{slug}/"
    mod_title, mod_eyebrow = MODULE_TITLES[module]
    pillar_slabs = "\n".join(
        f"""        <div class="slab">
          <p class="eyebrow">Pillar {i:02d}</p>
          <h3 class="slab__title">{p}</h3>
        </div>""" for i, p in enumerate(pillars, 1))

    return (head(title, f"{plain} — {desc}. Part of the Rich Girl Code ecosystem.",
                 canonical, base, accent)
            + masthead(base, False)
            + f"""
<main>
  <section class="hero hero--house">
    <div class="hero__glow"></div>
    <div class="shell hero__in">
      <p class="eyebrow">House {num} &mdash; {desc}</p>
      <h1 class="hero__title display">{name}</h1>
      <div class="hero__foot">
        <p class="hero__tag">Curated by the culture.<br />Founded for the people.</p>
        <p class="scrollcue"><i></i> {desc}</p>
      </div>
    </div>
  </section>

  <section class="sec sec--alt">
    <div class="shell">
      <div class="ed">
        <div class="frame">
          <div class="frame__art"></div>
          <div class="frame__veil"></div>
        </div>
        <div>
          <p class="eyebrow">The house</p>
          <h2 class="sec__title display" style="margin-block:.6rem 1.1rem">{name}</h2>
          <p class="lede">{desc}. One of ten houses in the Rich Girl Code ecosystem,
            standing on its own and answering to the same standard.</p>
          <p class="pend">Imagery and house copy port from the live site</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">What this house carries</p>
          <h2 class="sec__title display">The <em>Pillars</em></h2>
        </div>
      </div>
      <div class="two">
{pillar_slabs}
      </div>
    </div>
  </section>

  <section class="sec sec--alt">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">{mod_eyebrow}</p>
          <h2 class="sec__title display">{mod_title}</h2>
        </div>
      </div>
{MODULES[module](label, slots)}
      <div class="empty" style="margin-top:clamp(1.6rem,4vw,2.6rem)">
        <p class="eyebrow" style="justify-content:center">Awaiting live content</p>
        <h3>{slots} slots, ready to fill</h3>
        <p>{EMPTY_COPY[module]}</p>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">Ten houses, one ecosystem</p>
          <h2 class="sec__title display">Elsewhere in the <em>ecosystem</em></h2>
        </div>
        <a class="cta" href="{base}index.html#ecosystem">All houses</a>
      </div>
      <nav class="strip" aria-label="Other houses">
{strip_nav(slug, base)}
      </nav>
    </div>
  </section>
</main>
"""
            + footer(base))


def build_home():
    base = ""
    rows = []
    for h in HOUSES:
        slug, num, name, plain, desc, accent = h[0], h[1], h[2], h[3], h[4], h[5]
        href = "#top" if slug == "index" else f"houses/{slug}.html"
        on = " is-on" if slug == "index" else ""
        rows.append(
            f'          <li class="eco__row{on}" style="--row-accent:{accent}">'
            f'<a class="eco__link" href="{href}">'
            f'<span class="eco__num">{num}</span>'
            f'<span class="eco__name">{name}</span>'
            f'<span class="eco__desc">{desc}</span></a></li>')
    eco_rows = "\n".join(rows)

    def card(kicker, title, pend):
        return (f'        <article class="jcard"><div class="jcard__art"></div>'
                f'<div class="jcard__body"><p class="jcard__kicker">{kicker}</p>'
                f'<h3 class="jcard__title">{title}</h3>'
                f'<p class="pend" style="margin-top:auto">{pend}</p></div></article>')

    journal = "\n".join(card("Feature", "Journal entry", "Live post") for _ in range(3))

    def shop(house_name, meta, accent):
        return (f'        <article class="shop" style="--accent:{accent}">'
                f'<div class="shop__art"><i>{house_name}</i></div>'
                f'<div class="shop__body"><h3 class="shop__name">Storefront item</h3>'
                f'<p class="shop__meta">{meta}</p>'
                f'<p class="pend">Live product</p></div></article>')

    rail = "\n".join([
        shop("Rich Rabbit", "Commerce", "#7B1C2E"),
        shop("Ethnicity Cosmetics", "Beauty", "#AE7268"),
        shop("Verified Assets", "Ecosystem house", "#D6C28A"),
        shop("Rich Rabbit", "Commerce", "#7B1C2E"),
    ])

    jsonld = ('{"@context":"https://schema.org","@type":"Organization",'
              '"name":"Rich Girl Code","url":"https://www.richgirlcode.com/",'
              '"slogan":"Curated by the culture. Founded for the people.",'
              '"subOrganization":[' + ",".join(
                  '{"@type":"Organization","name":"%s"}' % h[3] for h in HOUSES[1:]) + ']}')

    return (head("Rich Girl Code",
                 "Rich Girl Code™ — the ecosystem. Own Your 2027. "
                 "Curated by the culture. Founded for the people.",
                 "https://www.richgirlcode.com/", base)
            + f'<script type="application/ld+json">\n{jsonld}\n</script>\n'
            + masthead(base, True)
            + f"""
<main id="top">

  <section class="hero">
    <div class="hero__glow"></div>
    <div class="shell hero__in">
      <p class="eyebrow">The Ecosystem &mdash; Est. by the culture</p>
      <h1 class="hero__title">Own Your <em>2027.</em></h1>
      <div class="hero__foot">
        <p class="hero__tag">Curated by the culture.<br />Founded for the people.</p>
        <p class="scrollcue"><i></i> Ten houses</p>
      </div>
    </div>
  </section>

  <section class="band" aria-hidden="true">
    <div class="band__track" id="bandTrack">
      <span class="band__item"><span>Own Your 2027.</span><span class="band__dot"></span><span>Curated by the culture.</span><span class="band__dot"></span></span>
      <span class="band__item"><span>Own Your 2027.</span><span class="band__dot"></span><span>Curated by the culture.</span><span class="band__dot"></span></span>
    </div>
  </section>

  <section class="sec" id="ecosystem">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">Ten houses, one ecosystem</p>
          <h2 class="sec__title display">The <em>Ecosystem</em></h2>
        </div>
        <p class="lede">Every house stands on its own and answers to the same standard. Choose where you enter.</p>
      </div>
      <div class="eco__grid">
        <ul class="eco__list" id="ecoList">
{eco_rows}
        </ul>
        <div class="eco__stage" id="ecoStage" aria-hidden="true"></div>
      </div>
    </div>
  </section>

  <section class="sec sec--alt" id="founder">
    <div class="shell">
      <div class="ed">
        <div class="frame">
          <div class="frame__art"></div>
          <div class="frame__veil"></div>
        </div>
        <div>
          <p class="eyebrow">The Founder</p>
          <h2 class="sec__title display" style="margin-block:.6rem 1.1rem">Founded for the <em>people</em></h2>
          <p class="lede">The founder section keeps its place at the centre of the homepage,
            between the ecosystem index and the journal.</p>
          <p class="pend">Portrait and founder copy port from the live site</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="journal">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">Editorial</p>
          <h2 class="sec__title display">The <em>Journal</em></h2>
        </div>
        <a class="cta" href="houses/black-girl-luxury-magazine.html">Read the journal</a>
      </div>
      <div class="jgrid">
{journal}
      </div>
    </div>
  </section>

  <section class="sec sec--alt" id="commerce">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">Commerce &amp; beauty</p>
          <h2 class="sec__title display">The <em>Showcase</em></h2>
        </div>
        <p class="lede">Rich Rabbit, Ethnicity Cosmetics and Verified Assets share one showcase rail. Drag or scroll.</p>
      </div>
{rail}
      <p class="pend">Product names, imagery, prices and purchase links port from the live storefronts</p>
    </div>
  </section>

  <section class="sec" id="directories">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">Discovery</p>
          <h2 class="sec__title display">The <em>Directories</em></h2>
        </div>
      </div>
      <div class="two">
        <div class="slab" style="--accent:#B9B3A4">
          <p class="eyebrow">8 Figure AI</p>
          <h3 class="slab__title">AI Directory</h3>
          <p class="lede">AI assistants, GPTs and technology, indexed and searchable.</p>
          <a class="cta" href="houses/8-figure-ai.html">Open the directory</a>
        </div>
        <div class="slab" style="--accent:#9A8456">
          <p class="eyebrow">Small Business District</p>
          <h3 class="slab__title">Business Discovery</h3>
          <p class="lede">Business discovery and promotion across the district.</p>
          <a class="cta" href="houses/small-business-district.html">Enter the district</a>
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec--alt" id="media">
    <div class="shell">
      <div class="sec__head">
        <div>
          <p class="eyebrow">Media &amp; entertainment</p>
          <h2 class="sec__title display">The <em>Studios</em></h2>
        </div>
      </div>
      <div class="two">
        <div class="slab" style="--accent:#5A1322">
          <p class="eyebrow">House 05</p>
          <h3 class="slab__title">RGC Media Group</h3>
          <p class="lede">Media and entertainment.</p>
          <a class="cta" href="houses/rgc-media-group.html">Enter</a>
        </div>
        <div class="slab" style="--accent:#6E2340">
          <p class="eyebrow">House 08</p>
          <h3 class="slab__title">Rich Girl Code Music Group&trade;</h3>
          <p class="lede">Music and entertainment.</p>
          <a class="cta" href="houses/rich-girl-code-music-group.html">Enter</a>
        </div>
        <div class="slab" style="--accent:#F0E9DC">
          <p class="eyebrow">House 07</p>
          <h3 class="slab__title">Black Girl Luxury Magazine</h3>
          <p class="lede">Editorial media.</p>
          <a class="cta" href="houses/black-girl-luxury-magazine.html">Enter</a>
        </div>
      </div>
      <p class="pend">Reels, releases and issues port from the live media sections</p>
    </div>
  </section>
</main>
"""
            + footer(base))


def main():
    os.makedirs(os.path.join(OUT, "houses"), exist_ok=True)
    written = []
    p = os.path.join(OUT, "index.html")
    open(p, "w", encoding="utf-8").write(build_home())
    written.append(("index.html", os.path.getsize(p)))
    for h in HOUSES:
        if h[0] == "index":
            continue
        p = os.path.join(OUT, "houses", h[0] + ".html")
        open(p, "w", encoding="utf-8").write(build_house(h))
        written.append(("houses/" + h[0] + ".html", os.path.getsize(p)))
    for name, size in written:
        print(f"  {name:48s} {size:>7,d} bytes")
    print(f"{len(written)} pages written")


if __name__ == "__main__":
    main()
