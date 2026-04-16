# Trajectory - Repo Handoff Notes

Context for someone (human or agent) picking up this repo mid-sprint. Non-obvious things only - if it's already in `CLAUDE.md`, `README`, or the commit log, it's not repeated here.

Last updated: 2026-04-16. Branch: `claude/kitchen-sink-polish-sprint`.

---

## The sprint in one paragraph

Kitchen Sink Polish Sprint ([`docs/plans/2026-04-14-kitchen-sink-polish-sprint.md`](plans/2026-04-14-kitchen-sink-polish-sprint.md)) bundles scoring correctness, UI consistency, training-plan features, and backup/restore into one PR. Tasks 1 and 9 shipped. Tasks 2, 3, 4, 5, 6, 7, 10 remain. Four post-sprint "downstream items" (D1-D4) were added to the plan after a mid-sprint audit surfaced that the entire scoring corpus disagrees with the official PFRA charts - those rewrites are explicitly **out of scope for this sprint's PR** and tracked in the plan's Downstream section.

---

## Scoring engine - the load-bearing facts

Read these before touching anything in `src/utils/scoring/`.

### The table corpus is wrong, but wrong in a known way

All 126 scored tables (9 age brackets x 2 genders x 7 exercises) in `scoringTables.js` disagree with the official PFRA Scoring Charts (effective 2026-03-01). This was discovered during the PFRA chart review that produced `docs/SCORING-STRATEGY-DISCUSSION.md`. The fix is sequenced behind downstream items D1 → D2 → D3 (engine split → verbatim table rewrite → anomalies doc). **Do not "fix a single value" in isolation** - that causes fixture churn across three test files and hides the broader drift. Any table change is a full rewrite or nothing.

Example of the drift: 2-mile run, M<25. PFRA shows 49.5/49.0/48.0; we show 49.4/48.8/48.1. That pattern repeats across all tables.

### External score vs internal score

Boss directive captured in `docs/SCORING-STRATEGY-DISCUSSION.md`:

- **External score.** DAFMAN-literal. 0 below the chart floor. What the user sees. What goes on the PDF. What the composite uses. Pass-gate uses this.
- **Internal score.** Continuous and signed. Linear extrapolation using the slope of the last 2 chart rows below the floor, **floored at 2x chart height below the floor** (hard cap). Used for projection, ROI, and training-emphasis math only. **Never surfaces in UI.**

If you ever see an internal number in display code, that's a bug. Grep check: every `internalScore` reference should be in `projectionEngine`, `strategyEngine`, `gapEngine`, or their tests - never in `/components/`.

### Codec persists raw values only

D-codes and S-codes store raw performance values (reps, seconds, ratio) - **no calculated points are ever persisted**. This is what makes silent rescore of historical S-codes safe when tables are rewritten. Do not introduce points-caching in the codec. The whole point is that the app can recompute scores under any table version without user intervention.

### Below-minimum still contributes to composite

`scoringEngine.js:264` - a component scoring below its DAFMAN minimum still contributes its earned points to the composite. It just caps overall pass at false. This is DAFMAN-correct behavior and is counter-intuitive enough that it's been "fixed" by mistake before. Preserve across any rewrite.

### Walk-fail cascade is the pattern for all below-min cascades

`scoringEngine.js:304-305` is the precedent. Replicated by Task 1 for general below-minimum handling. If you need to add a new "this component's failure forces overall fail" rule, follow this pattern.

### Off-chart clamping is centralized

Three clamp handlers in `scoringEngine.js` (lines 88-91, 101-104) plus a defensive clamp in `projectionEngine.js`. **Nothing in display code re-implements clamping.** This was verified by the Q11 audit. If you're tempted to add a `Math.min/Math.max` near a points value in UI code, you're probably duplicating engine logic - don't.

---

## PDF generator - the other load-bearing facts

`src/utils/pdf/generateFormPDF.js` is 1013 lines. Do not skim.

### It's `pdf-lib` AcroForm, not jsPDF visual replica

HEAD is a `pdf-lib`-based AcroForm PDF with 4 PKCS#7 signature widgets, `/SigFieldLock /Include` dictionaries, and document-level JavaScript for CAC auto-fill. An earlier attempt to rewrite this as a jsPDF visual replica was made and reverted (it would have destroyed the signature infrastructure). If the file looks like it's using jsPDF, your working tree is wrong - `git log -- src/utils/pdf/generateFormPDF.js` should show commit `5d7cc85 feat(pdf): migrate generator to pdf-lib with AcroForm + 4 signature widgets` as the migration point.

### Signature widget field-lock arrays

Each of the 4 signature widgets (`pfra_admin_sig`, `member_sig`, `fac_ufac_sig`, `commander_sig`) has a `/SigFieldLock /Include` array that pins exactly the fields that widget locks on signing. Getting the lock arrays wrong breaks the legal-audit chain of the PDF. The mapping is at the bottom of `generateFormPDF.js` - read it, don't guess.

### CAC auto-fill via document-level JS

The PDF embeds a small JavaScript action that parses the signer certificate's CN (format `LAST.FIRST.MIDDLE.EDIPI`) and populates name fields. This requires the signer to have a CAC certificate; it's not a UI convenience. Preserve.

### af4446_unsec.pdf vs af1067_unsec.pdf

`af4446_unsec.pdf` at repo root is **XFA-only** - it renders as "Please wait..." in most viewers including `pdftoppm`. Use `af1067_unsec.pdf` for any printable/diff work. Both are intentionally untracked.

### No unauthorized additions

Load-bearing policy: no watermarks, no disclaimers, no features the user didn't ask for. See `.claude-memory/feedback_no_unauthorized_additions.md`. Commit `8a1595c fix(pdf): remove unauthorized UNOFFICIAL watermark and disclaimer` is the reminder of what happens when this is ignored.

---

## Session-produced artifacts (read order)

For someone coming in cold who wants the full scoring story:

1. [`docs/SCORING-STRATEGY-DISCUSSION.md`](SCORING-STRATEGY-DISCUSSION.md) - the 12-question locked punch list. Answers the "why" behind external/internal scoring, silent rescore, table rewrite, and the downstream items.
2. [`docs/SCORING-DUPLICATION-MAP.md`](SCORING-DUPLICATION-MAP.md) - 828 lines, 134 touch points across 32 files. The audit that justifies blast-radius estimates for D1-D4. Read this before any cross-module scoring refactor.
3. [`docs/SCORING-MATH-AUDIT.md`](SCORING-MATH-AUDIT.md) and [`docs/scoring-math-audit/`](scoring-math-audit/) - deeper math audit artifacts from an earlier pass.
4. [`docs/plans/2026-04-14-kitchen-sink-polish-sprint.md`](plans/2026-04-14-kitchen-sink-polish-sprint.md) - this sprint. Status ledger lives at the top; downstream items at the bottom.

---

## Uncommitted-by-design items

Things in the working tree that are **intentionally not tracked**. Don't `git add -A`.

| Path | Why |
|------|-----|
| `scripts/pdf-to-html-form.mjs` | Reusable PDF to HTML-form converter. Tested on text PDFs (68 fields inferred from our own output). Not tested on image-only PDFs because the node had no `tesseract`. Keep for later; commit only if it becomes a shipped tool. |
| `af4446_unsec.pdf` | XFA-only source. Useful for reference only. |
| `af1067_unsec.pdf` | Printable-form source used for 4446 diff work. |
| `Trajectory - USAF PFA Tracker.html` | Live-site HTML snapshot captured for the kitchen sprint planning session. |
| `claude.resume` | Session-resume state file. |

If you need to do an image-PDF conversion with `pdf-to-html-form.mjs`, install `tesseract-ocr` first and pass `--tesseract`.

---

## Environment gotchas

- **Shared Ceph mount across Proxmox nodes.** Repo lives at `/mnt/cephfs/shared/projects/Trajectory/`. Memory for Claude Code agents lives at `.claude-memory/` on the share, symlinked from local `~/.claude`. Any Proxmox node (trouble, mayhem, chaos) sees the same memory. Don't write to local-only memory dirs - they won't persist across nodes.
- **`tesseract` is not installed** on most nodes I've touched. Verify with `which tesseract` before trying OCR flows.
- **`pdftoppm`, `pdftotext`, `pdfinfo`** (poppler-utils) are installed and used by the PDF diff scripts.
- **Node 22** is the CI version (`.github/workflows/deploy.yml`).

---

## Branch / PR state

- **Current branch:** `claude/kitchen-sink-polish-sprint`.
- **Main branch:** `main`.
- **Open tasks on this branch:** Tasks 2, 3, 4, 5, 6, 7, 10 from the kitchen plan.
- **Shipped on this branch:** Task 1 (`bdded00`), Task 9 (`4de016c`), PDF generator migration (`504aa51` → `5d7cc85` → three follow-up fixes).
- **Post-sprint work:** D1 engine rewrite → D2 table rewrite → D3 anomalies doc, D4 gapEngine. See the plan's Downstream Items section for the dependency graph.

---

## When in doubt

- **Scoring question?** Read `SCORING-STRATEGY-DISCUSSION.md` first, then `SCORING-DUPLICATION-MAP.md`.
- **PDF question?** The file is `pdf-lib` AcroForm with signature widgets. If a proposed change would remove field-lock dicts or document-level JS, stop and verify against `af1067_unsec.pdf`.
- **Table value looks wrong?** It probably is. Don't patch one value - that's D2 territory.
- **Fresh UI feature request?** Check the sprint plan first to see if it's already scoped. If it's not, and it's not a bug fix, ask before adding.
- **Memory/feedback files?** Start with `.claude-memory/MEMORY.md` - it's the index.
