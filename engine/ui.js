/* ===========================================================================
   RICH GIRL CODE — Content Engine
   ui.js  ·  Views, wiring, and the storyboard screen
   =========================================================================== */
window.RGC = window.RGC || {};
RGC.ui = (function () {

  const E = () => RGC.engine, S = () => RGC.store, B = () => RGC.build;
  let view = 'survey', date = null, sel = 0, plan = [], planStart = null;
  const PLAN_DAYS = 30;

  /* ---------- tiny helpers ---------- */
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  let toastT;
  function toast(msg, kind) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'on' + (kind ? ' ' + kind : '');
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.className = ''; }, 2600);
  }

  /* ---------- board overrides from the survey editor ---------- */
  function applyBoardOverrides() {
    const b = S().settings().boards;
    if (Array.isArray(b) && b.length) RGC.boards = b;
  }

  /* ---------- carousel assembly (engine + per-slide text edits) ---------- */
  function carFor(d) {
    const ov = S().overridesFor(d);
    const car = E().buildCarousel(d, ov);
    const edits = ov.slideEdits || {};
    Object.keys(edits).forEach(k => {
      const i = +k, e = edits[k] || {}, s = car.slides[i];
      if (!s) return;
      if (e.headline != null && e.headline !== '') s.headline = e.headline;
      if (e.body != null) s.body = e.body;
      if (e.motif) s.motif = e.motif;
    });
    return car;
  }

  function rebuildPlan() {
    plan = [];
    for (let i = 0; i < PLAN_DAYS; i++) plan.push(carFor(E().addDays(planStart, i)));
  }

  /* ---------- canvas painting after innerHTML ---------- */
  function paintAll(root) {
    (root || document).querySelectorAll('canvas[data-paint]').forEach(cv => {
      const d = cv.getAttribute('data-paint'), i = +cv.getAttribute('data-i');
      const car = d === date ? current() : plan.find(c => c.date === d) || carFor(d);
      if (!car || !car.slides[i]) return;
      const w = +cv.getAttribute('width'), h = +cv.getAttribute('height');
      RGC.paint.slide(cv.getContext('2d'), car.slides[i], car.theme, w, h);
    });
  }

  let _cur = null, _curDate = null;
  function current() {
    if (_curDate !== date) { _cur = carFor(date); _curDate = date; }
    return _cur;
  }
  function invalidate() { _curDate = null; }

  /* =====================================================================
     HEADER
     ===================================================================== */
  function renderHeader() {
    const counts = S().summary(plan.map(c => c.date));
    $('gate').innerHTML =
      `<span class="gate-mini"><b>${counts.approved + counts.built}</b> approved</span>
       <span class="gate-mini"><b>${counts.in_review}</b> awaiting you</span>
       <span class="gate-mini"><b>${counts.draft + counts.changes_requested}</b> in draft</span>`;
    document.querySelectorAll('nav.tabs button').forEach(b =>
      b.classList.toggle('on', b.getAttribute('data-view') === view));
    document.querySelectorAll('.view').forEach(v =>
      v.classList.toggle('on', v.id === 'v-' + view));
  }

  /* =====================================================================
     SURVEY
     ===================================================================== */
  function renderSurvey() {
    const p = RGC.profile;
    const cov = E().coverage(plan);
    const pillarOpts = pid => RGC.pillars.map(x =>
      `<option value="${x.id}"${x.id === pid ? ' selected' : ''}>${esc(x.name)}</option>`).join('');

    const boardRows = RGC.boards.slice()
      .sort((a, b) => (b.pins || 0) - (a.pins || 0))
      .map(b => `<tr>
        <td><b style="color:var(--ink)">${esc(b.name)}</b>
            <div class="dim mono" style="font-size:.72rem">/${esc(b.slug)}/</div>
            ${b.note ? `<div class="dim" style="font-size:.76rem;margin-top:4px;max-width:46ch">${esc(b.note)}</div>` : ''}</td>
        <td class="num">${b.pins ? b.pins : '<span class="dim" style="font-weight:400">?</span>'}</td>
        <td><select data-act="board-pillar" data-slug="${esc(b.slug)}"
              style="background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:5px 8px;color:var(--txt)">
              ${pillarOpts(b.pillar)}</select></td>
        <td><span class="conf ${esc(b.confidence)}">${esc(b.confidence)}</span></td>
        <td style="text-align:right"><button class="btn sm" data-act="board-del" data-slug="${esc(b.slug)}">Remove</button></td>
      </tr>`).join('');

    const pillarCards = RGC.pillars.map(pl => {
      const boards = pl.boards.map(s => (RGC.boards.find(b => b.slug === s) || {}).name).filter(Boolean);
      const th = RGC.themes[pl.theme];
      const nTopics = (RGC.topics[pl.id] || []).length;
      return `<div class="card tight">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
          <i style="width:13px;height:13px;border-radius:50%;background:${th.accent};flex:none;box-shadow:0 0 0 3px ${th.accent}22"></i>
          <h3 style="flex:1">${esc(pl.name)}</h3>
          <span class="chip">${esc(pl.funnel)}</span>
        </div>
        <p style="font-size:.82rem;color:var(--txt);margin-bottom:10px">${esc(pl.promise)}</p>
        <p style="font-size:.78rem;color:var(--dim);margin-bottom:11px"><b style="color:var(--sub)">Who:</b> ${esc(pl.audience)}</p>
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
          <span class="dim" style="font-size:.66rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase">Academy pull</span>
          <div class="bar" style="flex:1"><i style="width:${Math.round(pl.otaWeight * 100)}%"></i></div>
          <b style="font-size:.76rem;color:var(--ink)">${Math.round(pl.otaWeight * 100)}%</b>
        </div>
        <div class="dim" style="font-size:.74rem">${nTopics} concept${nTopics === 1 ? '' : 's'} loaded · ${esc(boards.join(' · ') || 'no boards mapped')}</div>
      </div>`;
    }).join('');

    const covRows = cov.map(x => `<tr>
        <td><b style="color:var(--ink)">${esc(x.name)}</b></td>
        <td class="num">${x.posts}</td>
        <td style="min-width:120px"><div class="bar"><i style="width:${Math.round(x.share * 100)}%"></i></div></td>
        <td class="num">${(x.share * 100).toFixed(0)}%</td>
        <td class="dim" style="font-size:.8rem">${esc(x.boards.join(', ') || '—')}</td>
      </tr>`).join('');

    $('v-survey').innerHTML = `
      <div class="sec">
        <div class="eyebrow">Step 1 · Survey</div>
        <h1>What @${esc(p.handle)} is already about</h1>
        <p class="lede">${esc(p.bio)} The engine reads these boards as content pillars and plans against them, so every
        carousel it proposes has a board waiting for it.</p>
      </div>

      <div class="sec notice">
        <div class="ico">⚠</div>
        <div><b>The survey is partial, on purpose.</b> This container's network policy blocks pinterest.com, so
        board names and pin counts came from indexed board pages rather than from your profile directly. Rows marked
        <span class="conf confirmed">confirmed</span> were seen; <span class="conf partial">partial</span> means the board
        exists but the pin count is unknown. Fix anything that is wrong in the table below — the whole plan re-weights itself.
        Snapshot taken ${esc(p.surveyedOn)}; followers reported around ${esc(p.followers)}.</div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Boards → pillars</h2>
          <p class="lede">${RGC.boards.length} boards mapped onto ${RGC.pillars.length} pillars.</p></div>
          <div class="btn-row" style="margin-left:auto">
            <button class="btn sm" data-act="board-add">＋ Add a board</button>
            <button class="btn sm" data-act="board-reset">Reset to surveyed</button>
          </div>
        </div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Board</th><th style="text-align:right">Pins</th><th>Pillar</th><th>Confidence</th><th></th></tr></thead>
          <tbody>${boardRows}</tbody></table></div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>The eight pillars</h2>
          <p class="lede">Each one carries its own promise, audience, visual theme and pull toward the Academy.</p></div></div>
        <div class="grid g2">${pillarCards}</div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Does the plan actually feed every board?</h2>
          <p class="lede">Coverage across the ${PLAN_DAYS} planned days. Options Desk runs twice a week because it is the
          only pillar that sells the Academy directly.</p></div></div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Pillar</th><th style="text-align:right">Posts</th><th>Share</th><th style="text-align:right">%</th><th>Boards fed</th></tr></thead>
          <tbody>${covRows}</tbody></table></div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Weekly rhythm</h2>
          <p class="lede">A fixed slot per weekday. The two smallest pillars rotate in so their boards are not orphaned.</p></div></div>
        <div class="grid g4">${RGC.weekPlan.map(w => {
          const pl = E().pillarById(w.pillar), th = RGC.themes[pl.theme];
          return `<div class="card tight" style="border-top:2px solid ${th.accent}">
            <div class="cal-date">${esc(E().DOW[w.dow])}</div>
            <h3 style="margin:3px 0 6px">${esc(w.label)}</h3>
            <div class="chip gold" style="margin-bottom:7px">${esc(pl.name)}</div>
            <div class="dim" style="font-size:.76rem">${esc(RGC.formats[w.format].name)} format</div>
          </div>`;
        }).join('')}</div>
        <p class="dim" style="font-size:.8rem;margin-top:11px">Rotating in: ${RGC.swapIns.map(id =>
          esc(E().pillarById(id).name)).join(' (every 3rd Saturday), ')} (every 4th Sunday).</p>
      </div>`;
  }

  /* =====================================================================
     CALENDAR
     ===================================================================== */
  function renderCalendar() {
    const counts = S().summary(plan.map(c => c.date));
    const cards = plan.map(c => {
      const st = S().statusOf(c.date), m = S().meta(st);
      return `<div class="cal-card${c.date === date ? ' sel' : ''}" data-act="open" data-date="${c.date}">
        <canvas class="cal-thumb" width="200" height="300" data-paint="${c.date}" data-i="0"></canvas>
        <div class="cal-body">
          <div class="cal-date">${esc(c.shortDate)} · ${esc(c.dayLabel)}</div>
          <div class="cal-title">${esc(c.topic.title)}</div>
          <div class="cal-foot">
            <span class="pill ${m.tone}">${esc(m.label)}</span>
            ${c.swapped ? '<span class="chip">rotated in</span>' : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    $('v-calendar').innerHTML = `
      <div class="sec">
        <div class="eyebrow">Step 2 · Planned content</div>
        <h1>${PLAN_DAYS} days, already planned</h1>
        <p class="lede">Every day below is a generated concept with a storyboard behind it. Nothing here has been built —
        these are proposals. Click any day to review it.</p>
      </div>
      <div class="sec">
        <div class="sec-head">
          <div class="btn-row">
            <span class="pill muted">${counts.draft} draft</span>
            <span class="pill warn">${counts.in_review} awaiting approval</span>
            <span class="pill bad">${counts.changes_requested} needs changes</span>
            <span class="pill good">${counts.approved} approved</span>
            <span class="pill done">${counts.built} built</span>
          </div>
          <div class="btn-row" style="margin-left:auto">
            <button class="btn sm" data-act="submit-all">Send all drafts for approval</button>
            <button class="btn sm" data-act="dl-plan">Export plan (.md)</button>
          </div>
        </div>
        <div class="cal-grid">${cards}</div>
      </div>`;
  }

  /* =====================================================================
     STORYBOARD
     ===================================================================== */
  function renderStoryboard() {
    const car = current();
    const st = S().statusOf(date), m = S().meta(st);
    sel = Math.min(sel, car.slides.length - 1);
    const s = car.slides[sel];
    const ov = S().overridesFor(date);

    const slideCards = car.slides.map(x => `
      <div class="slide-card${x.idx === sel ? ' sel' : ''}" data-act="slide" data-i="${x.idx}">
        <canvas width="400" height="600" data-paint="${date}" data-i="${x.idx}"></canvas>
        <div class="slide-meta"><b>${esc(x.roleLabel)}</b><span>${x.motif}</span></div>
      </div>`).join('');

    const altRows = (kind, items, render) => items.map(it => `
      <button class="alt-row${it.active ? ' on' : ''}" data-act="alt" data-kind="${kind}" data-id="${esc(it.id)}">
        <span class="tick"></span><span class="txt">${render(it)}</span></button>`).join('');

    const capBlock = (label, id, text, note) => `
      <div class="cap-block">
        <div class="cap-head"><b>${esc(label)}</b>
          <span style="display:flex;gap:10px;align-items:center">
            ${note ? `<span class="dim" style="font-size:.7rem">${esc(note)}</span>` : ''}
            <button class="btn sm" data-act="copy" data-src="${id}">Copy</button></span></div>
        <div class="cap-body" id="${id}">${esc(text)}</div>
      </div>`;

    const log = S().decisions(date);

    $('v-storyboard').innerHTML = `
      <div class="sb-head">
        <button class="btn sm" data-act="shift" data-n="-1">←</button>
        <div>
          <div class="eyebrow" style="margin-bottom:3px">Step 3 · Storyboard — nothing is built yet</div>
          <h1>${esc(car.prettyDate)}</h1>
        </div>
        <button class="btn sm" data-act="shift" data-n="1">→</button>
        <span class="chip gold">${esc(car.dayLabel)}</span>
        <span class="chip">${esc(car.pillar.name)}</span>
        <span class="pill ${m.tone}" style="margin-left:auto">${esc(m.label)}</span>
      </div>

      <div class="sb-cols">
        <aside class="sb-left">
          <div class="card tight">
            <div class="eyebrow">The idea</div>
            <h2 style="font-size:1.05rem;line-height:1.3">${esc(car.topic.title)}</h2>
            <dl style="margin-top:10px">
              <div class="kv"><dt>Promise</dt><dd>${esc(car.idea.promise)}</dd></div>
              <div class="kv"><dt>Who it is for</dt><dd>${esc(car.idea.audience)}</dd></div>
              <div class="kv"><dt>Why this, today</dt><dd>${esc(car.idea.rationale)}</dd></div>
              <div class="kv"><dt>Why this slot</dt><dd>${esc(car.idea.whyNow)}</dd></div>
              <div class="kv"><dt>What success looks like</dt><dd>${esc(car.idea.successMetric)}</dd></div>
              <div class="kv"><dt>Academy pull</dt><dd>${esc(car.idea.otaNote)}</dd></div>
            </dl>
          </div>

          <div class="card tight">
            <div class="eyebrow">Structure</div>
            <dl>
              <div class="kv"><dt>Format</dt><dd>${esc(car.formatName)} — ${esc(RGC.formats[car.format].note)}</dd></div>
              <div class="kv"><dt>Theme</dt><dd>${esc(car.theme.name)}</dd></div>
              <div class="kv"><dt>Slides</dt><dd>${car.slideCount}</dd></div>
            </dl>
            <div class="field" style="margin:13px 0 0">
              <label>Slides per carousel</label>
              <select data-act="slidecount">
                ${[5, 6, 7, 8, 10].map(n => `<option value="${n}"${(ov.slideCount || 5) === n ? ' selected' : ''}>${n} slides${n === 5 ? ' — Pinterest max' : n === 10 ? ' — Instagram max' : ''}</option>`).join('')}
              </select>
              <span class="hint">Pinterest carousels cap at 5 images. Longer sets are for Instagram.</span>
            </div>
            <div class="btn-row" style="margin-top:13px">
              <button class="btn sm" data-act="reroll">↻ Different concept</button>
              <button class="btn sm" data-act="resetday">Reset day</button>
            </div>
          </div>

          <div class="card tight">
            <div class="eyebrow">Image direction</div>
            <p style="font-size:.84rem;margin-bottom:9px">For Higgsfield, Midjourney or a stock search — the carousel itself
            needs no photography, this is for the video thumbnail and b-roll.</p>
            ${capBlock('Prompt', 'cap-img', car.idea.imagePrompt)}
            <div class="eyebrow" style="margin-top:14px">Video angle</div>
            <p style="font-size:.84rem">${esc(car.idea.videoAngle)}</p>
          </div>
        </aside>

        <main>
          <div class="sec">
            <div class="sec-head"><div><h2>The visuals</h2>
              <p class="lede">Rendered at the real export size, scaled down. What you approve is what gets built —
              same renderer, no redraw.</p></div></div>
            <div class="strip">${slideCards}</div>
          </div>

          <div class="sec">
            <div class="sec-head"><div><h2>Slide ${sel + 1} — ${esc(s.roleLabel)}</h2>
              <p class="lede">Edit the copy and watch it re-render. Editing an approved day sends it back to draft.</p></div></div>
            <div class="ed-grid">
              <div>
                <div class="field">
                  <label>Headline${sel === 0 ? ' (this is the hook — it drives the captions too)' : ''}</label>
                  <textarea rows="3" data-act="edit" data-field="headline" data-i="${sel}">${esc(s.headline)}</textarea>
                </div>
                <div class="field">
                  <label>Body</label>
                  <textarea rows="4" data-act="edit" data-field="body" data-i="${sel}">${esc(s.body || '')}</textarea>
                </div>
                <div class="field">
                  <label>Visual motif</label>
                  <select data-act="edit" data-field="motif" data-i="${sel}">
                    ${RGC.paint.motifNames.map(mn => `<option value="${mn}"${mn === s.motif ? ' selected' : ''}>${mn}</option>`).join('')}
                  </select>
                  <span class="hint">Diagrams are drawn, not photographed — they stay legible at thumbnail size.</span>
                </div>
              </div>
              <div class="big-prev">
                <canvas width="1000" height="1500" data-paint="${date}" data-i="${sel}"></canvas>
              </div>
            </div>
          </div>

          <div class="sec">
            <div class="sec-head"><div><h2>Alternative options</h2>
              <p class="lede">Swap any of these in before you approve. Each one re-renders the whole carousel immediately.</p></div></div>

            <div class="alt-group">
              <h3>Hook — ${car.alternates.hooks.length} ways in</h3>
              <p>The first slide is the only one most people will ever see.</p>
              <div class="alt-rows">${altRows('hook', car.alternates.hooks,
                it => `<b>${esc(it.text)}</b><small>${esc(it.label)}</small>`)}</div>
            </div>

            <div class="alt-group">
              <h3>Concept — other topics in this pillar</h3>
              <p>Same slot, different teaching point.</p>
              <div class="alt-rows">${altRows('topic', car.alternates.topics,
                it => `<b>${esc(it.label)}</b><small>${esc(it.promise)}</small>`)}</div>
            </div>

            <div class="alt-group">
              <h3>Call to action</h3>
              <p>Options Desk days should pull toward the Academy. Reach days should not pitch at all.</p>
              <div class="alt-rows">${altRows('cta', car.alternates.ctas,
                it => `<b>${esc(it.text)}</b><small>${esc(it.sub)} · ${esc(it.label)}</small>`)}</div>
            </div>

            <div class="alt-group">
              <h3>Format</h3>
              <p>The slide skeleton. Changes the shape of the argument, not the topic.</p>
              <div class="alt-rows">${altRows('format', car.alternates.formats,
                it => `<b>${esc(it.label)} — ${it.slides} slides</b><small>${esc(it.note)}</small>`)}</div>
            </div>

            <div class="alt-group">
              <h3>Visual theme</h3>
              <p>Each pillar has a default so the feed stays legible, but nothing is locked.</p>
              <div class="alt-chips">${car.alternates.themes.map(t => `
                <button class="swatch${t.active ? ' on' : ''}" data-act="alt" data-kind="theme" data-id="${esc(t.id)}">
                  <i style="background:${t.accent}"></i>${esc(t.label)}</button>`).join('')}</div>
            </div>
          </div>

          <div class="sec">
            <div class="sec-head"><div><h2>Captions</h2>
              <p class="lede">Written for Pinterest search first. Boards: ${esc(car.captions.boards.map(b => b.name).join(' · ') || '—')}</p></div></div>
            ${capBlock('Pin title', 'cap-t', car.captions.pinTitle, car.captions.pinTitle.length + '/100')}
            ${capBlock('Pin description', 'cap-d', car.captions.pinDescription)}
            ${capBlock('Carousel / Instagram caption', 'cap-i', car.captions.igCaption)}
            ${capBlock('Alt text', 'cap-a', car.captions.altText)}
            ${capBlock('Hashtags', 'cap-h', car.captions.hashtags.join(' '))}
          </div>

          <div class="sec">
            <div class="sec-head"><div><h2>Video plan — Options Traders Academy</h2>
              <p class="lede">The carousel doubles as a storyboard for the video. ~${car.video.runtimeSeconds}s short form,
              plus a ${car.video.longOutline.length}-part lesson outline. Exportable once approved.</p></div></div>
            <div class="card">
              <div class="vs-row hd"><div>Time</div><div>Beat</div><div>Say</div><div>Show</div></div>
              ${car.video.shortScript.map(r => `<div class="vs-row">
                <time>${esc(r.tc)}</time><div class="lbl">${esc(r.label)}</div>
                <div class="say">${esc(r.say)}</div><div class="show">${esc(r.show)}</div></div>`).join('')}
            </div>
          </div>
        </main>
      </div>

      <div class="appr">
        <div class="appr-in">
          <span class="pill ${m.tone}">${esc(m.label)}</span>
          <input id="appr-note" placeholder="${st === 'in_review' ? 'Note (required if you send it back)…' : 'Optional note…'}" />
          ${st === 'draft' || st === 'changes_requested'
            ? `<button class="btn pri" data-act="status" data-to="in_review">Send for approval →</button>`
            : ''}
          ${st === 'in_review'
            ? `<button class="btn ok" data-act="status" data-to="approved">✓ Approve — unlock the build</button>
               <button class="btn no" data-act="status" data-to="changes_requested">Send back</button>`
            : ''}
          ${st === 'approved' || st === 'built'
            ? `<button class="btn pri" data-act="view" data-view="build">Go to build →</button>
               <button class="btn no" data-act="status" data-to="changes_requested">Revoke approval</button>`
            : ''}
        </div>
        ${log.length ? `<div class="log">${log.map(x => `<div class="log-row">
          <time>${esc(x.at.slice(0, 16).replace('T', ' '))}</time>
          <em>${esc(S().meta(x.to).label)}</em>
          <span>${esc(x.note || '(no note)')}</span></div>`).join('')}</div>` : ''}
      </div>`;
  }

  /* =====================================================================
     BUILD
     ===================================================================== */
  function renderBuild() {
    const car = current();
    const st = S().statusOf(date), m = S().meta(st);

    if (!S().canBuild(date)) {
      $('v-build').innerHTML = `
        <div class="sec">
          <div class="eyebrow">Step 4 · Final build</div>
          <h1>Locked</h1>
        </div>
        <div class="lock">
          <div class="ico">🔒</div>
          <h2>${esc(car.prettyDate)} is not approved yet</h2>
          <p>This day is <b>${esc(m.label.toLowerCase())}</b>. The build stage stays locked until you approve the
          storyboard, so no asset can ever differ from what you signed off on.</p>
          <div class="btn-row" style="justify-content:center">
            <button class="btn pri" data-act="view" data-view="storyboard">Review the storyboard →</button>
          </div>
        </div>`;
      return;
    }

    $('v-build').innerHTML = `
      <div class="sec">
        <div class="eyebrow">Step 4 · Final build — approved ${esc(st === 'built' ? 'and built' : '')}</div>
        <h1>${esc(car.topic.title)}</h1>
        <p class="lede">${esc(car.prettyDate)} · ${esc(car.pillar.name)} · ${car.slides.length} slides at
        ${B().W}×${B().H} (Pinterest 2:3). Rendered by the same painter you approved.</p>
      </div>

      <div class="sec notice info">
        <div class="ico">ℹ</div>
        <div><b>Downloads arrive one at a time.</b> Browsers throttle rapid saves, so "all slides" spaces them out by
        about half a second each. If your browser asks about multiple downloads, allow it.</div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Carousel</h2></div>
          <div class="btn-row" style="margin-left:auto">
            <button class="btn pri" data-act="dl-all">⬇ All ${car.slides.length} slides (PNG)</button>
          </div></div>
        <div class="strip">${car.slides.map(x => `
          <div class="slide-card">
            <canvas width="400" height="600" data-paint="${date}" data-i="${x.idx}"></canvas>
            <div class="slide-meta"><b>${esc(x.roleLabel)}</b>
              <button class="btn sm" data-act="dl-slide" data-i="${x.idx}">⬇</button></div>
          </div>`).join('')}</div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Deliverables</h2>
          <p class="lede">Everything downstream of the approval, in one place.</p></div></div>
        <div class="grid g3">
          <div class="card tight">
            <h3>Captions &amp; slide copy</h3>
            <p class="dim" style="font-size:.82rem;margin:6px 0 12px">Pin title, search description, alt text, the full
            carousel caption and every slide's copy.</p>
            <button class="btn" data-act="dl-captions">⬇ captions.md</button>
          </div>
          <div class="card tight">
            <h3>Academy video pack</h3>
            <p class="dim" style="font-size:.82rem;margin:6px 0 12px">Timecoded ${car.video.runtimeSeconds}s short script,
            ${car.video.longOutline.length}-part lesson outline, shot list and the compliance lines.</p>
            <button class="btn" data-act="dl-video">⬇ video.md</button>
          </div>
          <div class="card tight">
            <h3>Structured data</h3>
            <p class="dim" style="font-size:.82rem;margin:6px 0 12px">The whole carousel plus the approval audit trail,
            for a scheduler or the Base44 app.</p>
            <button class="btn" data-act="dl-json">⬇ carousel.json</button>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Lesson outline</h2></div></div>
        <div class="card">${car.video.longOutline.map(p => `
          <div class="kv"><dt>${esc(p.part)}</dt><dd>${esc(p.note)}</dd></div>`).join('')}</div>
      </div>

      <div class="sec">
        <div class="sec-head"><div><h2>Shot list</h2></div></div>
        <div class="card">${car.video.shotList.map(x => `
          <div class="kv"><dt>Slide ${x.slide} · ${esc(x.role)}</dt><dd>${esc(x.shot)}</dd></div>`).join('')}</div>
      </div>

      <div class="sec">
        <div class="btn-row">
          ${st === 'approved' ? `<button class="btn ok" data-act="status" data-to="built">Mark as built</button>` : ''}
          <button class="btn" data-act="view" data-view="calendar">← Back to the plan</button>
        </div>
      </div>`;
  }

  /* =====================================================================
     RENDER
     ===================================================================== */
  function render() {
    renderHeader();
    if (view === 'survey') renderSurvey();
    else if (view === 'calendar') renderCalendar();
    else if (view === 'storyboard') renderStoryboard();
    else if (view === 'build') renderBuild();
    paintAll($('v-' + view));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function softRender() {   // keep scroll position (used after edits)
    const y = window.scrollY;
    renderHeader();
    if (view === 'storyboard') renderStoryboard(); else if (view === 'build') renderBuild();
    paintAll($('v-' + view));
    window.scrollTo(0, y);
  }

  /* =====================================================================
     EVENTS
     ===================================================================== */
  function note() { const n = $('appr-note'); return n ? n.value : ''; }

  function onClick(ev) {
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    const act = t.getAttribute('data-act');

    if (act === 'view') { view = t.getAttribute('data-view'); render(); return; }

    if (act === 'open') { date = t.getAttribute('data-date'); sel = 0; invalidate(); view = 'storyboard'; render(); return; }

    if (act === 'shift') {
      date = E().addDays(date, +t.getAttribute('data-n')); sel = 0; invalidate();
      if (!plan.find(c => c.date === date)) { planStart = date; rebuildPlan(); }
      render(); return;
    }

    if (act === 'slide') { sel = +t.getAttribute('data-i'); softRender(); return; }

    if (act === 'alt') {
      const kind = t.getAttribute('data-kind'), id = t.getAttribute('data-id');
      const map = { hook: 'hookPatternId', theme: 'themeKey', cta: 'ctaId', format: 'format', topic: 'topicId' };
      const patch = {};
      patch[map[kind]] = id;
      if (kind === 'hook') patch.hookText = null;            // let the pattern regenerate it
      if (kind === 'topic') { patch.hookText = null; patch.slideEdits = {}; }
      const after = S().patch(date, patch, 'a different ' + kind + ' was selected');
      invalidate(); refreshPlanEntry();
      softRender();
      if (after === 'draft') toast('Changed — approval revoked, send it back for approval', 'bad');
      return;
    }

    if (act === 'reroll') {
      const ov = S().overridesFor(date);
      S().patch(date, { variant: (ov.variant || 0) + 1, topicId: null, hookText: null, slideEdits: {} },
                'the concept was rerolled');
      invalidate(); refreshPlanEntry(); softRender();
      toast('New concept for ' + current().shortDate, 'good'); return;
    }

    if (act === 'resetday') {
      S().clear(date); invalidate(); refreshPlanEntry(); sel = 0; render();
      toast('Day reset to the generated default'); return;
    }

    if (act === 'status') {
      const to = t.getAttribute('data-to');
      const r = S().setStatus(date, to, note());
      if (!r.ok) { toast(r.reason, 'bad'); return; }
      refreshPlanEntry();
      if (to === 'approved') { toast('Approved — the build is unlocked', 'good'); view = 'build'; render(); return; }
      if (to === 'built') { toast('Marked as built', 'good'); }
      if (to === 'in_review') { toast('Sent for approval'); }
      if (to === 'changes_requested') { toast('Sent back with your note', 'bad'); }
      softRender(); return;
    }

    if (act === 'submit-all') {
      let n = 0;
      plan.forEach(c => { if (S().canTransition(c.date, 'in_review')) { S().setStatus(c.date, 'in_review', 'Bulk submitted'); n++; } });
      render(); toast(n + ' day' + (n === 1 ? '' : 's') + ' sent for approval', 'good'); return;
    }

    if (act === 'copy') {
      const src = $(t.getAttribute('data-src'));
      if (!src) return;
      const txt = src.textContent;
      const done = () => { const o = t.textContent; t.textContent = 'Copied ✓'; t.classList.add('copied');
                           setTimeout(() => { t.textContent = o; t.classList.remove('copied'); }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done));
      } else fallbackCopy(txt, done);
      return;
    }

    /* ---- build exports ---- */
    try {
      if (act === 'dl-slide') { B().downloadSlide(current(), +t.getAttribute('data-i')); toast('Saving slide…'); return; }
      if (act === 'dl-all') {
        toast('Saving ' + current().slides.length + ' slides…');
        B().downloadAllSlides(current(), (i, n) => { if (i === n) toast('All ' + n + ' slides saved', 'good'); });
        return;
      }
      if (act === 'dl-captions') {
        const c = current();
        B().downloadText(B().stem(c) + '-captions.md', B().captionsMarkdown(c), 'text/markdown');
        toast('captions.md saved', 'good'); return;
      }
      if (act === 'dl-video') {
        const c = current();
        B().downloadText(B().stem(c) + '-video.md', B().videoMarkdown(c), 'text/markdown');
        toast('video.md saved', 'good'); return;
      }
      if (act === 'dl-json') {
        const c = current();
        B().downloadText(B().stem(c) + '.json', B().jsonExport(c), 'application/json');
        toast('carousel.json saved', 'good'); return;
      }
      if (act === 'dl-plan') {
        B().downloadText('rgc-content-plan-' + planStart + '.md', B().planMarkdown(plan), 'text/markdown');
        toast('Plan exported', 'good'); return;
      }
    } catch (e) { toast(e.message, 'bad'); return; }

    /* ---- survey board editor ---- */
    if (act === 'board-del') {
      const slug = t.getAttribute('data-slug');
      RGC.boards = RGC.boards.filter(b => b.slug !== slug);
      S().setSetting('boards', RGC.boards); rebuildPlan(); render();
      toast('Board removed'); return;
    }
    if (act === 'board-add') {
      const name = prompt('Board name, as it reads on Pinterest:');
      if (!name) return;
      const slug = (prompt('Board URL slug (the part after /richgirlcode/):',
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || '').trim();
      if (!slug) return;
      const pins = parseInt(prompt('Roughly how many pins? (blank if unknown)', '') || '0', 10) || 0;
      RGC.boards = RGC.boards.concat([{ slug, name, pins, pillar: RGC.pillars[0].id, confidence: 'confirmed' }]);
      S().setSetting('boards', RGC.boards); rebuildPlan(); render();
      toast('Board added — now map it to a pillar', 'good'); return;
    }
    if (act === 'board-reset') {
      S().setSetting('boards', null); location.reload(); return;
    }
  }

  function fallbackCopy(txt, done) {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Copy blocked — select the text manually', 'bad'); }
    ta.remove();
  }

  function onChange(ev) {
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    const act = t.getAttribute('data-act');

    if (act === 'edit') {
      const i = +t.getAttribute('data-i'), field = t.getAttribute('data-field'), val = t.value;
      let patch;
      if (field === 'headline' && i === 0) patch = { hookText: val };
      else {
        const ov = S().overridesFor(date);
        const se = Object.assign({}, ov.slideEdits || {});
        se[i] = Object.assign({}, se[i] || {});
        se[i][field] = val;
        patch = { slideEdits: se };
      }
      const after = S().patch(date, patch, 'slide ' + (i + 1) + ' was edited');
      invalidate(); refreshPlanEntry(); softRender();
      if (after === 'draft') toast('Edited — approval revoked', 'bad');
      return;
    }

    if (act === 'slidecount') {
      S().patch(date, { slideCount: +t.value }, 'the slide count changed');
      S().setSetting('slideCount', +t.value);
      invalidate(); rebuildPlan(); sel = 0; softRender(); return;
    }

    if (act === 'board-pillar') {
      const slug = t.getAttribute('data-slug');
      const b = RGC.boards.find(x => x.slug === slug);
      if (b) { b.pillar = t.value; S().setSetting('boards', RGC.boards); rebuildPlan(); render(); toast('Remapped'); }
      return;
    }
  }

  function refreshPlanEntry() {
    const i = plan.findIndex(c => c.date === date);
    if (i >= 0) plan[i] = carFor(date);
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  function boot() {
    applyBoardOverrides();
    date = E().todayKey();
    planStart = date;
    rebuildPlan();
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    $('today').textContent = E().pretty(date);
    render();
  }

  return { boot, render };
})();
