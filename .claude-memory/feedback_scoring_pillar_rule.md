---
name: External scoring is the DAFMAN pillar; internal scoring is tunable
description: Trajectory's scoring engine returns two numbers per exercise — external (DAFMAN-literal, pillar, change-controlled) and internal (tunable, engineering judgment, never rendered). Do not treat them the same.
type: feedback
originSessionId: a41a46a0-4be1-4b0d-bf72-082121407250
---
**Rule.** Trajectory's scoring engine returns `points` (external) and `internalPoints` (internal). They have different change-control rules:

- **External (`points`, composite, pass/fail, UI, PDF, S-code) is a PILLAR.** Must match DAFMAN 36-2905 + AFPC PFRA Scoring Charts literally. Any change requires a deliberate commit that (a) updates `docs/DAFMAN-COMPLIANCE-MATRIX.md`, (b) bumps regulation/chart version constants, (c) cites the §/table/row authority, and (d) is recorded in `docs/DECISIONS.md`. No silent edits, no "I rounded differently," no "it felt more fair."
- **Internal (`internalPoints`) is TUNABLE.** Feeds only projection, ROI, training emphasis, and optimal-allocation math. Engineering can refine the algorithm without the regulation-change workflow, provided it never surfaces in user-facing output and is justified in `docs/DECISIONS.md`.
- **If unsure which bucket:** treat as external. DAFMAN is the pillar; internal is the shock absorber.

**Why:** DAFMAN is the legal authority — UI/PDF must be defensible line-by-line against the regulation. Even well-intentioned drift on the external number is a compliance problem. Meanwhile, projection and ROI math operate below chart floor and beyond thresholds in ways the regulation doesn't specify; forcing a DAFMAN-literal 0 there makes trajectory math useless ("how far below the floor am I?" has no answer). Separating the two lets the engine be regulation-literal where it must be and algorithmically useful where DAFMAN is silent. Established 2026-04-19 after the DAFMAN 36-2905 (24 Mar 2026) realignment commit `1862db6` partially shipped the D1 two-number split.

**How to apply:**
- When writing or reviewing scoring code, first ask: "does this affect what the user sees / the PDF / the composite / the S-code?" If yes → external → treat as pillar, require citation.
- Grep-check: `internalPoints` must never appear in `src/components/**` JSX that renders to screen.
- Any PR that touches `src/utils/scoring/**` must declare in the description whether the change is external (needs citation + matrix row) or internal (needs DECISIONS.md entry).
- Full guardrail stack: `docs/plans/2026-04-19-dafman-compliance-guardrails.md`.
- Authority docs: `CLAUDE.md` (Key scoring rules section), `docs/DECISIONS.md` (External vs internal scoring section).
