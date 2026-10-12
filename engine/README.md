# Rich Girl Code — Daily Content Engine

A storyboard-first engine that plans a daily Pinterest carousel for
[@richgirlcode](https://www.pinterest.com/richgirlcode/) and turns each approved one into an
Options Traders Academy video pack.

**Nothing gets built until you approve it.** That is the whole design.

## Open it

```
cd engine && python3 -m http.server 8000
# then open http://localhost:8000
```

It also opens straight from the filesystem (`open index.html`), but approvals are saved in
`localStorage`, which some browsers keep empty for `file://` pages. Use the local server if you want
your approvals to stick.

No build step, no dependencies, no network calls. It runs entirely offline.

## The four stages

| Stage | What it does |
| --- | --- |
| **1 · Survey** | The Pinterest boards, mapped to eight content pillars. Editable — remap, add or remove boards and the whole plan re-weights. |
| **2 · Plan** | 30 days of generated concepts, each with a thumbnail and a status. |
| **3 · Storyboard** | Per day: the idea and why it was chosen, every slide rendered, all the captions, and alternative hooks / concepts / CTAs / formats / themes. **This is the approval gate.** |
| **4 · Build** | Locked until approved. Then: slide PNGs at 1000×1500, captions markdown, the video pack, and JSON. |

## The gate

```
draft ──► awaiting approval ──► approved ──► built
             │        ▲            │
             ▼        └────────────┘
      changes requested
```

Enforced rules:

- You cannot jump from draft straight to approved.
- Sending a day back **requires a note**.
- `build.js` re-checks the gate on every export and throws rather than quietly writing files.
- **Editing an approved day automatically revokes the approval.** Change a hook, a caption, a theme
  or a single word of body copy and it drops to draft with the reason written into the audit log.
  This is what guarantees the assets can never differ from the storyboard you signed off.

Every decision is timestamped and kept, and ships inside `carousel.json`.

## Why the visuals are drawn, not generated

`paint.js` is a canvas renderer with 15 diagram motifs (options payoff, theta decay, iron condor
P/L, IV crush, the wheel, growth curves, checklists, and so on). The same painter draws the
storyboard thumbnails and the final 1000×1500 export, so the preview is the product — there is no
second rendering path that could drift.

It also means the carousels need no photography and no image API. Each concept still carries an
`imagePrompt` for the video thumbnail and b-roll, ready to paste into Higgsfield or Midjourney.

## Editing the content

Everything editable lives in `data.js`:

- `RGC.boards` — the surveyed boards. Also editable in the UI (Survey tab).
- `RGC.pillars` — promise, audience, theme, funnel position, Academy pull.
- `RGC.topics` — the concept library, 36 topics across 8 pillars. Add one and it enters the
  rotation automatically.
- `RGC.weekPlan` — which pillar owns which weekday.
- `RGC.hookPatterns`, `RGC.ctas`, `RGC.themes`, `RGC.formats`, `RGC.disclaimers`.

A topic needs: `id, title, short, verb, promise, mod, motif, beats[], proof, tags[], imagePrompt,
videoAngle`. The engine maps `beats` onto slide roles by itself.

## Determinism

The same date always produces the same concept, so a plan reviewed last week is still there this
week. "Different concept" bumps a stored variant number for that one day; it never reshuffles the
calendar. Topic rotation accounts for a pillar's position within the week, so the Monday and Friday
Options Desk slots never serve the same topic.

## Files

| File | Role |
| --- | --- |
| `data.js` | Survey taxonomy + all content libraries |
| `paint.js` | Canvas renderer, 15 motifs, shared by preview and export |
| `engine.js` | Deterministic generator, weekly rotation, calendar, coverage |
| `store.js` | localStorage persistence + the approval state machine |
| `build.js` | Gated exports: PNG, captions.md, video.md, JSON, plan.md |
| `ui.js` | The four views and all wiring |

## Known gap

The survey is partial. This container's network policy blocks `pinterest.com`, so board names and
pin counts came from indexed board pages rather than from the profile directly. Rows marked
**partial** have a confirmed board but an unknown pin count. Correct anything wrong in the Survey
tab — it is persisted and the plan re-weights itself.
