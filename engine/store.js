/* ===========================================================================
   RICH GIRL CODE — Content Engine
   store.js  ·  Persistence + the approval gate
   ---------------------------------------------------------------------------
   The gate is the point of this file. Nothing can be exported until a day is
   APPROVED, and editing an approved day revokes the approval automatically —
   so you can never ship assets that differ from the storyboard you signed off.
   =========================================================================== */
window.RGC = window.RGC || {};
RGC.store = (function () {

  const KEY = 'rgc.engine.v2';

  const STATUS = {
    draft:             { label: 'Draft',            tone: 'muted',  can: ['in_review'] },
    in_review:         { label: 'Awaiting approval', tone: 'warn',  can: ['approved', 'changes_requested'] },
    changes_requested: { label: 'Changes requested', tone: 'bad',   can: ['in_review'] },
    approved:          { label: 'Approved',          tone: 'good',  can: ['built', 'changes_requested'] },
    built:             { label: 'Built',             tone: 'done',  can: ['changes_requested'] }
  };

  let state = load();

  function blank() {
    return { v: 2, overrides: {}, status: {}, decisions: {}, settings: { slideCount: 5 } };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const p = JSON.parse(raw);
      return Object.assign(blank(), p, {
        overrides: p.overrides || {}, status: p.status || {},
        decisions: p.decisions || {}, settings: Object.assign({ slideCount: 5 }, p.settings || {})
      });
    } catch (e) { return blank(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* private mode / blocked storage — the app still works in-session */ }
  }

  /* ---------- overrides ---------- */
  function overridesFor(date) {
    const o = Object.assign({}, state.overrides[date] || {});
    if (!o.slideCount) o.slideCount = state.settings.slideCount;
    return o;
  }

  /* Editing a signed-off day pulls the approval. This is deliberate. */
  function patch(date, patchObj, reasonLabel) {
    const before = statusOf(date);
    state.overrides[date] = Object.assign({}, state.overrides[date] || {}, patchObj);
    if (before === 'approved' || before === 'built') {
      setStatus(date, 'draft',
        'Approval revoked automatically: ' + (reasonLabel || 'the storyboard was edited') + '.', true);
    }
    save();
    return statusOf(date);
  }

  function clear(date) {
    delete state.overrides[date];
    delete state.status[date];
    delete state.decisions[date];
    save();
  }

  /* ---------- the gate ---------- */
  function statusOf(date) { return state.status[date] || 'draft'; }
  function meta(status) { return STATUS[status] || STATUS.draft; }

  function canTransition(date, to) {
    return meta(statusOf(date)).can.indexOf(to) !== -1;
  }

  function setStatus(date, to, note, force) {
    const from = statusOf(date);
    if (!force && !canTransition(date, to)) {
      return { ok: false, reason: `Cannot go from "${meta(from).label}" to "${meta(to).label}".` };
    }
    if (to === 'changes_requested' && !force && !(note && note.trim())) {
      return { ok: false, reason: 'Say what needs to change — a note is required to send it back.' };
    }
    state.status[date] = to;
    (state.decisions[date] = state.decisions[date] || []).push({
      at: new Date().toISOString(), from, to, note: (note || '').trim()
    });
    save();
    return { ok: true, from, to };
  }

  function decisions(date) { return (state.decisions[date] || []).slice().reverse(); }

  /* Only these two states may produce files. */
  function canBuild(date) {
    const s = statusOf(date);
    return s === 'approved' || s === 'built';
  }

  /* ---------- settings ---------- */
  function settings() { return Object.assign({}, state.settings); }
  function setSetting(k, v) { state.settings[k] = v; save(); }

  /* ---------- whole-plan helpers ---------- */
  function summary(dates) {
    const counts = { draft: 0, in_review: 0, changes_requested: 0, approved: 0, built: 0 };
    dates.forEach(d => { counts[statusOf(d)]++; });
    return counts;
  }

  function exportState() { return JSON.stringify(state, null, 2); }
  function importState(json) {
    const p = JSON.parse(json);
    if (!p || typeof p !== 'object') throw new Error('Not a valid engine file.');
    state = Object.assign(blank(), p);
    save();
  }
  function resetAll() { state = blank(); save(); }

  return { STATUS, overridesFor, patch, clear, statusOf, meta, canTransition,
           setStatus, decisions, canBuild, settings, setSetting, summary,
           exportState, importState, resetAll };
})();
