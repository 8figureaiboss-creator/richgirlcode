/* ===========================================================================
   RICH GIRL CODE — Content Engine
   engine.js  ·  The generator
   ---------------------------------------------------------------------------
   Deterministic by design. The same date always yields the same concept, so a
   plan you looked at last week is still there this week. "Reroll" bumps a
   stored variant number for that day — it does not randomise the calendar.
   =========================================================================== */
window.RGC = window.RGC || {};
RGC.engine = (function () {

  const DAY = 86400000;
  const EPOCH = Date.UTC(2026, 0, 4);   // a Sunday — anchors the weekly rotation
  const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* ---------- dates ---------- */
  function todayKey() {
    const d = new Date();
    return key(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  function key(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate());
  }
  function parse(k) {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  }
  function addDays(k, n) { return key(parse(k) + n * DAY); }
  function p2(n) { return n < 10 ? '0' + n : String(n); }
  function pretty(k) {
    const ms = parse(k), d = new Date(ms);
    return DOW[d.getUTCDay()] + ', ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }
  function shortDate(k) {
    const d = new Date(parse(k));
    return MON[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }

  /* ---------- deterministic helpers ---------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---------- the day's slot ---------- */
  function slotFor(dateKey) {
    const ms = parse(dateKey);
    const dayIndex = Math.floor((ms - EPOCH) / DAY);
    const dow = new Date(ms).getUTCDay();
    const week = Math.floor(dayIndex / 7);
    let plan = RGC.weekPlan.find(w => w.dow === dow) || RGC.weekPlan[0];

    // Work the smaller pillars in on a rotation so they are not orphaned
    if (dow === 6 && ((week % 3) + 3) % 3 === 2) {
      plan = { dow, label: 'Soft Saturday', pillar: 'sahm', format: 'system', swapped: true };
    }
    if (dow === 0 && ((week % 4) + 4) % 4 === 3) {
      plan = { dow, label: 'Sunday Reset', pillar: 'lifestyle', format: 'identity', swapped: true };
    }
    return { dayIndex, dow, week, plan };
  }

  function pillarById(id) { return RGC.pillars.find(p => p.id === id); }

  function pillarSlots(pillarId) {
    return RGC.weekPlan.filter(w => w.pillar === pillarId).map(w => w.dow).sort((a, b) => a - b);
  }

  /* A pillar that runs twice a week (Options Desk: Mon + Fri) must not serve the
     same topic on both days, so the slot's position within the week is part of
     the index, not just the week number. */
  function topicFor(pillarId, week, variant, dow) {
    const list = RGC.topics[pillarId] || [];
    if (!list.length) return null;
    const slots = pillarSlots(pillarId);
    const perWeek = Math.max(1, slots.length);
    const occ = Math.max(0, slots.indexOf(dow == null ? -1 : dow));
    const off = hash(pillarId) % list.length;
    const n = list.length;
    const i = (((week * perWeek + occ + off + (variant || 0)) % n) + n) % n;
    return list[i];
  }

  /* ---------- slide composition ---------- */
  const BEAT_MOTIFS = ['checklist', 'chain', 'grid', 'stack', 'split', 'ladder'];

  function composeSlides(o) {
    const { topic, format, slideCount, hookText, cta, kicker, footer } = o;
    const roles = (RGC.formats[format] || RGC.formats.teach).roles;
    const midRoles = roles.slice(1, -1);

    // build every candidate middle slide, then trim to fit
    const mids = [];
    let bi = 0;
    for (const r of midRoles) {
      if (r === 'proof') {
        if (topic.proof) mids.push({ role: 'proof', roleLabel: 'Proof', headline: 'The receipt', body: topic.proof, motif: 'stack' });
        continue;
      }
      const beat = topic.beats[bi];
      if (!beat) continue;
      bi++;
      mids.push({ role: r, roleLabel: labelFor(r, bi), headline: beat.h, body: beat.b, motif: null });
    }

    const room = Math.max(1, slideCount - 2);
    const keep = mids.slice(0, room);

    // visual rhythm: topic motif anchors the hook and returns on the last teaching slide
    const beatSlides = keep.filter(s => s.role !== 'proof');
    beatSlides.forEach((s, i) => {
      // stepping by i (not hashing per-slide) keeps neighbouring beats apart;
      // the final beat carries the topic's own diagram as the payoff reveal
      s.sig = (i === beatSlides.length - 1);
      s.motif = s.sig ? topic.motif : BEAT_MOTIFS[(hash(topic.id) + i) % BEAT_MOTIFS.length];
    });

    const slides = [
      { role: 'hook', roleLabel: 'Hook', headline: hookText, body: topic.promise, motif: topic.motif },
      ...keep,
      { role: 'cta', roleLabel: 'Call to action', headline: cta.text, body: cta.sub, motif: 'mark' }
    ];

    /* No two neighbouring slides may draw the same diagram. Two slides are
       deliberate and must keep their motif: the hook and the payoff reveal.
       So on a collision, repaint whichever of the pair is neither of those. */
    for (let i = 1; i < slides.length - 1; i++) {
      if (slides[i].motif !== slides[i - 1].motif) continue;
      let fix = slides[i].sig ? i - 1 : i;
      if (fix === 0) fix = i;                        // the hook is never repainted
      const before = slides[fix - 1] ? slides[fix - 1].motif : null;
      const after = slides[fix + 1] ? slides[fix + 1].motif : null;
      const alt = BEAT_MOTIFS.find(m => m !== before && m !== after && m !== slides[fix].motif);
      if (alt) slides[fix].motif = alt;
    }

    return slides.map((s, i) => Object.assign(s, {
      idx: i, total: slides.length, kicker,
      footer: i === slides.length - 1 ? footer : ''
    }));
  }

  function labelFor(role, n) {
    const m = { why: 'Why it matters', frame: 'The frame', myth: 'The myth', truth: 'The truth',
                context: 'Context', quote: 'The quote', beat: 'Beat ' + n };
    return m[role] || ('Beat ' + n);
  }

  /* ---------- captions ---------- */
  function buildCaptions(topic, pillar, hookText, cta, slides) {
    const boards = pillar.boards
      .map(slug => RGC.boards.find(b => b.slug === slug))
      .filter(Boolean);

    const teach = slides.filter(s => !['hook', 'cta', 'proof'].includes(s.role));

    const pinDescription =
      `${topic.promise} ${topic.beats[0].b} ` +
      `This is the plain-English version — no jargon, no hype, and the risk is named. ` +
      `Save it for the next time you are staring at an options chain wondering what to do. ` +
      `Full walkthrough inside Options Traders Academy.`;

    const igCaption = [
      hookText,
      '',
      ...teach.map((s, i) => `${i + 1}. ${s.headline} — ${s.body}`),
      '',
      topic.proof ? `📌 ${topic.proof}` : '',
      '',
      cta.text,
      cta.sub,
      '',
      RGC.disclaimers[hash(topic.id) % RGC.disclaimers.length],
      '',
      topic.tags.join(' ')
    ].filter(l => l !== undefined).join('\n');

    return {
      pinTitle: topic.title.length <= 100 ? topic.title : topic.title.slice(0, 97) + '...',
      pinDescription,
      hashtags: topic.tags.slice(),
      igCaption,
      altText: `${topic.title} — slide one of a ${slides.length}-part carousel. ${topic.promise}`,
      boards: boards.map(b => ({ name: b.name, slug: b.slug })),
      disclaimer: RGC.disclaimers[hash(topic.id) % RGC.disclaimers.length]
    };
  }

  /* ---------- the idea layer (rationale shown in the storyboard) ---------- */
  function buildIdea(topic, pillar, fmt, slot) {
    const metric = pillar.funnel === 'top' ? 'Saves and outbound follows'
                 : pillar.funnel === 'mid' ? 'Saves plus link clicks'
                 : 'Link clicks to the free trial';
    return {
      promise: topic.promise,
      audience: pillar.audience,
      rationale:
        `${slot.plan.label} is the ${pillar.name} slot. ${pillar.promise} ` +
        `Running it as a ${fmt.name.toLowerCase()} because ${fmt.note.toLowerCase()}`,
      whyNow: slot.plan.swapped
        ? `${pillar.name} rotates in this week so the smaller boards keep getting fed.`
        : `Fixed weekly slot — the rhythm is what trains the audience to come back.`,
      successMetric: metric,
      funnel: pillar.funnel,
      otaWeight: pillar.otaWeight,
      otaNote: pillar.otaWeight >= 0.8
        ? 'Direct Academy feeder — this one should carry an enrol CTA.'
        : pillar.otaWeight >= 0.5
          ? 'Warms the audience. Soft CTA only.'
          : 'Reach play. Do not pitch here.',
      imagePrompt: topic.imagePrompt,
      videoAngle: topic.videoAngle
    };
  }

  /* ---------- video plan (the Options Trader Academy bridge) ---------- */
  function buildVideo(topic, pillar, slides, cta) {
    const teach = slides.filter(s => !['hook', 'cta'].includes(s.role));
    let t = 0;
    const short = [
      { tc: '0:00–0:03', label: 'HOOK',  say: slides[0].headline, show: `Slide 1 as a full-frame card. Motif: ${slides[0].motif}.` },
      { tc: '0:03–0:10', label: 'STAKES', say: topic.promise, show: 'Hold on the hook card, push in slowly.' }
    ];
    t = 10;
    teach.forEach((s, i) => {
      const dur = s.role === 'proof' ? 10 : 11;
      short.push({
        tc: fmt(t) + '–' + fmt(t + dur),
        label: (s.roleLabel || 'BEAT').toUpperCase(),
        say: `${s.headline}. ${s.body}`,
        show: `Cut to slide ${s.idx + 1}. Motif: ${s.motif}. Animate the diagram building, do not talk over the reveal.`
      });
      t += dur;
    });
    short.push({ tc: fmt(t) + '–' + fmt(t + 8), label: 'CTA', say: `${cta.text} ${cta.sub}`, show: 'Slide ' + slides.length + ' — brand seal, hold for the full beat.' });
    const runtime = t + 8;

    return {
      runtimeSeconds: runtime,
      shortScript: short,
      bRoll: topic.imagePrompt,
      direction: topic.videoAngle,
      longOutline: [
        { part: 'Cold open (0:00–0:30)', note: `Lead with the hook line verbatim: "${slides[0].headline}". No intro, no logo sting.` },
        { part: 'Why this is confusing (0:30–2:00)', note: 'Name the wrong mental model the audience arrives with. Validate it before correcting it.' },
        ...teach.map((s, i) => ({
          part: `Section ${i + 1} — ${s.headline}`,
          note: `${s.body} Build the ${s.motif} diagram on screen while you explain. Pause at the finished diagram.`
        })),
        { part: 'Worked example on a real chain', note: topic.proof || 'Pull up a live chain and walk one real contract end to end.' },
        { part: 'What goes wrong', note: 'The single most common beginner error on this exact mechanic. Be specific and unglamorous.' },
        { part: 'Risk statement', note: 'Say the risk out loud. This is what separates education from hype.' },
        { part: `Close — ${cta.text}`, note: cta.sub + ' Point to the module by number so it feels like a map, not a pitch.' }
      ],
      shotList: slides.map(s => ({
        slide: s.idx + 1,
        role: s.roleLabel || s.role,
        shot: s.role === 'hook' ? 'Full-frame card, slow push in. 3s minimum.'
            : s.role === 'cta' ? 'Static card, no movement. Let the CTA land.'
            : `Card on screen, ${s.motif} diagram animates in. Cut on the completed diagram.`
      }))
    };
    function fmt(sec) { return Math.floor(sec / 60) + ':' + p2(sec % 60); }
  }

  /* ---------- alternatives ---------- */
  function buildAlternates(topic, pillar, state) {
    const n = topic.beats.length;

    const hooks = RGC.hookPatterns.map(hp => ({
      id: hp.id, label: hp.label, text: safeHook(hp, topic, n),
      active: hp.id === state.hookPatternId
    }));

    const themeKeys = Object.keys(RGC.themes);
    const themes = themeKeys.map(k => ({
      id: k, label: RGC.themes[k].name, accent: RGC.themes[k].accent,
      bg: RGC.themes[k].bg[0], active: k === state.themeKey
    }));

    const ctas = RGC.ctas.map(c => ({
      id: c.id, label: c.label,
      text: fillCta(c, topic, state), sub: c.sub, active: c.id === state.ctaId
    }));

    const formats = Object.keys(RGC.formats).map(k => ({
      id: k, label: RGC.formats[k].name, note: RGC.formats[k].note,
      slides: RGC.formats[k].roles.length, active: k === state.format
    }));

    const topicsInPillar = (RGC.topics[pillar.id] || []).map(t => ({
      id: t.id, label: t.title, promise: t.promise, active: t.id === topic.id
    }));

    return { hooks, themes, ctas, formats, topics: topicsInPillar };
  }

  function safeHook(hp, topic, n) {
    try { return hp.build(topic, n) || topic.title; }
    catch (e) { return topic.title; }
  }

  function fillCta(c, topic, state) {
    return c.text
      .replace('{mod}', topic.mod || 1)
      .replace('{part}', ((state.week || 0) % 8) + 1)
      .replace('{pillar}', state.pillarName || 'Rich Girl Code')
      .replace('{next}', state.nextTitle || 'the risk side of this trade');
  }

  /* =======================================================================
     buildCarousel — the whole package for one day
     ======================================================================= */
  function buildCarousel(dateKey, overrides) {
    overrides = overrides || {};
    const slot = slotFor(dateKey);
    const pillar = pillarById(overrides.pillar || slot.plan.pillar) || RGC.pillars[0];
    const variant = overrides.variant || 0;

    let topic = overrides.topicId
      ? (RGC.topics[pillar.id] || []).find(t => t.id === overrides.topicId)
      : null;
    if (!topic) topic = topicFor(pillar.id, slot.week, variant, slot.dow);
    if (!topic) topic = RGC.topics.options[0];

    const format = overrides.format || slot.plan.format;
    const fmt = RGC.formats[format] || RGC.formats.teach;
    const themeKey = overrides.themeKey || pillar.theme;
    const theme = RGC.themes[themeKey] || RGC.themes.academy;
    const slideCount = overrides.slideCount || 5;

    const hookPatternId = overrides.hookPatternId ||
      RGC.hookPatterns[hash(topic.id + dateKey) % RGC.hookPatterns.length].id;
    const hp = RGC.hookPatterns.find(h => h.id === hookPatternId) || RGC.hookPatterns[0];
    const hookText = overrides.hookText || safeHook(hp, topic, topic.beats.length);

    let nextTopic = topicFor(pillar.id, slot.week + 1, variant, slot.dow);
    if (nextTopic && nextTopic.id === topic.id) {
      nextTopic = topicFor(pillar.id, slot.week + 1, (variant || 0) + 1, slot.dow);
    }
    const state = { hookPatternId, themeKey, format, week: slot.week,
                    pillarName: pillar.name,
                    nextTitle: (nextTopic && nextTopic.id !== topic.id)
                      ? nextTopic.title : 'the risk side of this trade',
                    ctaId: null };

    const ctaId = overrides.ctaId ||
      (pillar.otaWeight >= 0.8 ? 'academy' : pillar.otaWeight >= 0.5 ? 'save' : 'series');
    state.ctaId = ctaId;
    const ctaDef = RGC.ctas.find(c => c.id === ctaId) || RGC.ctas[0];
    const cta = { id: ctaId, text: fillCta(ctaDef, topic, state), sub: ctaDef.sub };

    const disclaimer = RGC.disclaimers[hash(topic.id) % RGC.disclaimers.length];
    const slides = composeSlides({
      topic, format, slideCount, hookText, cta,
      kicker: `${pillar.name} · ${slot.plan.label}`,
      footer: ['options', 'literacy', 'sahm'].includes(pillar.id) ? disclaimer : ''
    });

    return {
      id: dateKey + ':' + pillar.id + ':' + topic.id,
      date: dateKey,
      prettyDate: pretty(dateKey),
      shortDate: shortDate(dateKey),
      dayLabel: slot.plan.label,
      week: slot.week,
      swapped: !!slot.plan.swapped,
      pillar: { id: pillar.id, name: pillar.name, funnel: pillar.funnel, otaWeight: pillar.otaWeight },
      topic: { id: topic.id, title: topic.title, promise: topic.promise, mod: topic.mod },
      format, formatName: fmt.name,
      themeKey, theme,
      slideCount: slides.length,
      hookPatternId, hookText,
      cta,
      slides,
      captions: buildCaptions(topic, pillar, hookText, cta, slides),
      idea: buildIdea(topic, pillar, fmt, slot),
      video: buildVideo(topic, pillar, slides, cta),
      alternates: buildAlternates(topic, pillar, state),
      variant
    };
  }

  /* ---------- the planned calendar ---------- */
  function calendar(startKey, days, overridesByDate) {
    const out = [];
    for (let i = 0; i < days; i++) {
      const k = addDays(startKey, i);
      out.push(buildCarousel(k, (overridesByDate || {})[k] || {}));
    }
    return out;
  }

  /* ---------- coverage: are the boards actually being fed? ---------- */
  function coverage(cals) {
    const byPillar = {};
    cals.forEach(c => { byPillar[c.pillar.id] = (byPillar[c.pillar.id] || 0) + 1; });
    return RGC.pillars.map(p => {
      const boards = p.boards.map(s => RGC.boards.find(b => b.slug === s)).filter(Boolean);
      return {
        id: p.id, name: p.name, posts: byPillar[p.id] || 0,
        share: cals.length ? (byPillar[p.id] || 0) / cals.length : 0,
        boards: boards.map(b => b.name), funnel: p.funnel, otaWeight: p.otaWeight
      };
    }).sort((a, b) => b.posts - a.posts);
  }

  return { buildCarousel, calendar, coverage, slotFor, todayKey, addDays, pretty,
           shortDate, key, parse, hash, pillarById, topicFor, DOW };
})();
