/* ===========================================================================
   RICH GIRL CODE — Content Engine
   build.js  ·  The final build (gated)
   ---------------------------------------------------------------------------
   Every entry point here re-checks the gate. Calling them on an unapproved day
   throws rather than quietly producing files.
   =========================================================================== */
window.RGC = window.RGC || {};
RGC.build = (function () {

  const W = 1000, H = 1500;

  function assertApproved(car) {
    if (!RGC.store.canBuild(car.date)) {
      throw new Error('Not approved. Approve the storyboard for ' + car.prettyDate + ' before building.');
    }
  }

  /* ---------- rendering ---------- */
  function canvasFor(car, idx, w, h) {
    w = w || W; h = h || H;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    RGC.paint.slide(cv.getContext('2d'), car.slides[idx], car.theme, w, h);
    return cv;
  }

  function paintInto(cv, car, idx) {
    const dpr = 1;
    const w = cv.width, h = cv.height;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.scale(dpr, dpr);
    RGC.paint.slide(ctx, car.slides[idx], car.theme, w, h);
    ctx.restore();
  }

  /* ---------- downloads ---------- */
  function stem(car) { return 'rgc-' + car.date + '-' + car.topic.id; }

  function dl(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadSlide(car, idx) {
    assertApproved(car);
    return new Promise(res => {
      canvasFor(car, idx).toBlob(b => {
        dl(b, `${stem(car)}-${String(idx + 1).padStart(2, '0')}.png`);
        res();
      }, 'image/png');
    });
  }

  async function downloadAllSlides(car, onStep) {
    assertApproved(car);
    for (let i = 0; i < car.slides.length; i++) {
      await downloadSlide(car, i);
      if (onStep) onStep(i + 1, car.slides.length);
      await new Promise(r => setTimeout(r, 420)); // browsers throttle rapid downloads
    }
  }

  function downloadText(name, text, mime) {
    dl(new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' }), name);
  }

  /* ---------- text deliverables ---------- */
  function captionsMarkdown(car) {
    assertApproved(car);
    const c = car.captions;
    return [
      `# ${car.topic.title}`,
      ``,
      `**${car.prettyDate}** · ${car.dayLabel} · ${car.pillar.name} · ${car.formatName} · ${car.theme.name}`,
      ``,
      `Status at export: **${RGC.store.meta(RGC.store.statusOf(car.date)).label}**`,
      ``,
      `---`,
      ``,
      `## Pinterest`,
      ``,
      `**Title** (${c.pinTitle.length}/100)`,
      ``,
      c.pinTitle,
      ``,
      `**Description**`,
      ``,
      c.pinDescription,
      ``,
      `**Pin to boards:** ${c.boards.map(b => b.name).join(' · ') || '—'}`,
      ``,
      `**Alt text:** ${c.altText}`,
      ``,
      `---`,
      ``,
      `## Instagram / carousel caption`,
      ``,
      c.igCaption,
      ``,
      `---`,
      ``,
      `## Slides`,
      ``,
      ...car.slides.flatMap(s => [
        `### ${String(s.idx + 1).padStart(2, '0')} — ${s.roleLabel}`,
        ``,
        `**${s.headline}**`,
        ``,
        s.body || '_(no body copy)_',
        ``,
        `_Visual: ${s.motif}_`,
        ``
      ]),
      `---`,
      ``,
      `## Image direction (for Higgsfield / Midjourney)`,
      ``,
      car.idea.imagePrompt,
      ``,
      `**Disclaimer used:** ${c.disclaimer || '—'}`,
      ``
    ].join('\n');
  }

  function videoMarkdown(car) {
    assertApproved(car);
    const v = car.video;
    return [
      `# ${car.topic.title} — Options Traders Academy video pack`,
      ``,
      `**${car.prettyDate}** · ${car.pillar.name} · built from the approved carousel`,
      ``,
      `**Direction:** ${v.direction}`,
      ``,
      `**B-roll / thumbnail prompt:** ${v.bRoll}`,
      ``,
      `---`,
      ``,
      `## Short-form script (~${v.runtimeSeconds}s — Reels / Shorts / TikTok)`,
      ``,
      `| Time | Beat | Say | Show |`,
      `| --- | --- | --- | --- |`,
      ...v.shortScript.map(r =>
        `| ${r.tc} | ${r.label} | ${r.say.replace(/\|/g, '\\|')} | ${r.show.replace(/\|/g, '\\|')} |`),
      ``,
      `---`,
      ``,
      `## Long-form outline (lesson version)`,
      ``,
      ...v.longOutline.flatMap(p => [`### ${p.part}`, ``, p.note, ``]),
      `---`,
      ``,
      `## Shot list`,
      ``,
      ...v.shotList.map(s => `- **Slide ${s.slide}** (${s.role}) — ${s.shot}`),
      ``,
      `---`,
      ``,
      `## Compliance`,
      ``,
      `- ${car.captions.disclaimer || 'Add an education-only disclaimer before publishing.'}`,
      `- Say the risk out loud on camera. Do not promise outcomes.`,
      `- If you show a real position, show a losing one too.`,
      ``
    ].join('\n');
  }

  function jsonExport(car) {
    assertApproved(car);
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      status: RGC.store.statusOf(car.date),
      decisions: RGC.store.decisions(car.date),
      carousel: {
        date: car.date, dayLabel: car.dayLabel, pillar: car.pillar, topic: car.topic,
        format: car.format, theme: car.themeKey, hookText: car.hookText,
        cta: car.cta, slides: car.slides, captions: car.captions,
        idea: car.idea, video: car.video
      }
    }, null, 2);
  }

  /* ---------- a whole month at once ---------- */
  function planMarkdown(cals) {
    const rows = cals.map(c => {
      const st = RGC.store.meta(RGC.store.statusOf(c.date)).label;
      return `| ${c.shortDate} | ${c.dayLabel} | ${c.pillar.name} | ${c.topic.title.replace(/\|/g, '\\|')} | ${c.formatName} | ${st} |`;
    });
    const cov = RGC.engine.coverage(cals);
    return [
      `# Rich Girl Code — planned content`,
      ``,
      `${cals.length} days · ${cals[0].prettyDate} to ${cals[cals.length - 1].prettyDate}`,
      `Generated ${new Date().toISOString().slice(0, 10)} · source: pinterest.com/${RGC.profile.handle}`,
      ``,
      `## Schedule`,
      ``,
      `| Date | Slot | Pillar | Concept | Format | Status |`,
      `| --- | --- | --- | --- | --- | --- |`,
      ...rows,
      ``,
      `## Board coverage`,
      ``,
      `| Pillar | Posts | Share | Funnel | Boards fed |`,
      `| --- | --- | --- | --- | --- |`,
      ...cov.map(x => `| ${x.name} | ${x.posts} | ${(x.share * 100).toFixed(0)}% | ${x.funnel} | ${x.boards.join(', ')} |`),
      ``,
      `## Hooks`,
      ``,
      ...cals.map(c => `- **${c.shortDate}** — ${c.hookText}`),
      ``
    ].join('\n');
  }

  return { canvasFor, paintInto, downloadSlide, downloadAllSlides, downloadText,
           captionsMarkdown, videoMarkdown, jsonExport, planMarkdown, stem, assertApproved, W, H };
})();
