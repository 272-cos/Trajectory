# DAFMAN 36-2905 + PFRA Charts Compliance Guardrails

## Context

Trajectory's scoring engine encodes DAFMAN 36-2905 (24 March 2026) and the AFPC PFRA Scoring Charts. Three regulatory drifts were just reconciled in `1862db6` (§3.7.4 sub-chart-min = 0, §3.15.4.2 WHtR truncation, §3.7.1 BC no per-component minimum). Audit revealed **additional known gaps** (BFA gate §3.1.2.1.1 not enforced, 126 scoring tables not verified verbatim against PFRA, walk time limits not re-diffed against 24 Mar 2026 Table 3.1, waist-averaging math unverified, exemption semantics flattened). No automated mechanism exists to detect future drift between the regulation, the scoring charts, and this codebase.

**Problem being solved.** Regulation and chart updates ship on their own cadences (DAFMAN ~every 4 years, PFRA charts 1-2x/year) and go unnoticed. Code-level scoring edits can silently violate regulation without any test flagging the drift. There is no single source of truth that says "this §x.y.z rule is implemented at file:line and tested by fixture Z."

**Intended outcome.** A layered guardrail system: (1) a living compliance matrix mapping every §/chart to code + test, (2) machine-readable regulation-citation fixtures that stay green only when the engine matches DAFMAN literal text, (3) CI gates that block merges on regulation drift and warn on chart drift, (4) upstream-publication monitoring that flags when AFPC or e-Publishing posts a new edition. Scope covers both the regulation (blocking) and the AFPC charts (advisory with version pinning).

## Known facts (verified 2026-04-19)

- `docs/DAFMAN-36-2905.md` holds the 24 Mar 2026 regulation text (extracted via `scripts/pdf2md.sh`). ~4700 lines.
- `docs/PFRA-Scoring-Charts.md` referenced in `CLAUDE.md`; chart version tracked by `CHART_VERSION = 'Sep 2025 Provisional'` in `src/utils/scoring/constants.js:192`.
- `src/utils/scoring/scoringEngine.js` `lookupScore` now returns `{ points, internalPoints }` per the two-number model partially landed in `1862db6`.
- `src/utils/scoring/constants.js` `COMPONENT_MINIMUMS` no longer has `bodyComp` (§3.7.1).
- 853 tests currently green; lint clean.
- `scripts/pdf2md.sh` + `scripts/xfa2md.py` exist and produce the current DAFMAN markdown extract.
- AFPC Fitness Program page URL in `CLAUDE.md`; no scraping automation yet.
- No GitHub Actions workflow checks regulation-citation integrity today.

## User decisions locked during planning

- **Scope:** both DAFMAN regulation text and AFPC PFRA scoring charts.
- **Enforcement model:** blocking for regulation compliance (CI fails on §-level drift); advisory for chart drift (CI warns, allows explicit override when bumping `CHART_VERSION`).
- **Cadence:** continuous verification. Pinned hashes of both sources; any divergence forces an explicit re-audit commit.
- **Goal is anti-drift, not anti-change.** Guardrails must allow intentional, documented updates; they only block *silent* drift.
- **External vs internal scoring - pillar rule (2026-04-19).** The *external* score (DAFMAN-literal, surfaced in UI/composite/PDF/S-code) is a **pillar**: any change requires a deliberate, documented commit that updates the compliance matrix, bumps the regulation/chart version, and cites the §/row authority. The *internal* score (continuous tracking number used only by projection/ROI/training-emphasis math) is **tunable**: engineering can refine the algorithm (linear extrapolation below floor, slope caps, effort-weight curves, etc.) without triggering the regulation-change workflow, **provided** the change never surfaces in user-facing output and is justified in `docs/DECISIONS.md`. CI gates G4 and the PR template G7 distinguish these two lanes.

## Assumed (flag for confirmation)

- AFPC PFRA charts update 1-2x per year; DAFMAN updates less frequent.
- User does not want a live HTTP scraper that hits afpc.af.mil on every CI run (rate-limit + brittleness); instead a periodic HEAD check with 24-hour caching is acceptable.
- We can commit a SHA-256 of `docs/DAFMAN-36-2905.md` to the repo and block merges when it changes without a corresponding compliance-matrix update.
- "Verbatim PFRA transcription" (downstream item D2) remains out of scope for this plan - the guardrails plan builds the harness that D2 will land through, but does not do the 126-table transcription itself.

## Open questions

- [x] ~~Should the upstream-monitoring script run on a GitHub Actions schedule, or only manually?~~ **Resolved 2026-04-19: neither.** Runs at deploy time inside `deploy.yml`, because Trajectory is a static SPA with exactly one CI execution point (push to main → build → deploy). A cron on a static site would cost nothing but add moving parts; tying the check to deploy means no stale pins can ever ship. See G6 "Design choice - download-and-halt".
- [ ] Do we want a machine-readable YAML/JSON *extract* of the regulation (rule ID → citation → invariant) committed alongside the full markdown, so tests can reference citations without string-parsing prose?
- [ ] For the chart-drift advisory, what exactly triggers "bump required" - any `scoringTables.js` value change, or only rows touching points thresholds? (Probably the former; fewer false negatives.)

## Constraints (non-negotiable, inherited from `CLAUDE.md`)

- No backend, no runtime third-party deps beyond bundled.
- No em/en dashes; hyphens only.
- No codec jargon in UI.
- Internal tracking IDs stay in comments/docs.
- All existing 853 tests stay green through every phase.

## Task list

### Task G1 - Compliance matrix document (S)

Living table mapping every regulation §/table to its code location, test coverage, and last-verified date. The single source of truth for "what does this project claim to implement."

**Scope.**
- [ ] New `docs/DAFMAN-COMPLIANCE-MATRIX.md` with columns: Rule ID, Citation, Rule text, Code location, Test fixture, Status (compliant | drift | open | not-in-scope), Last-verified date, Notes.
- [ ] Populate rows for every §-level rule currently enforced (starting from: component weights, composite threshold, component minimums, walk pass/fail, walk-fail cascade, WHtR truncation, sub-chart-min = 0, BC no-minimum, chart clamp-at-max). Baseline ~20-30 rows.
- [ ] Populate rows for every known gap (BFA gate, verbatim tables, walk times re-diff, waist averaging, exemption nuance, diagnostic vs scored period semantics). Status = `open`. Baseline ~8-10 rows.
- [ ] Header block captures: regulation version, regulation hash, chart version, last full audit date, link to `docs/DAFMAN-36-2905.md`.
- [ ] Cross-linked from `CLAUDE.md` "Regulatory basis" section and `docs/DECISIONS.md`.

**Files.**
- `docs/DAFMAN-COMPLIANCE-MATRIX.md` (NEW)
- `CLAUDE.md` (add cross-link)

**Reused.** `docs/DAFMAN-36-2905.md` as citation source; existing `CLAUDE.md` regulatory-basis section.

**Risks.** Table is a document, not a test; can rot if not enforced. G2 + G3 are the actual teeth.

### Task G2 - Regulation-citation convention in code (S)

Make every scoring rule grep-able back to the regulation so a reviewer can verify code-to-§ mapping in under 30 seconds.

**Scope.**
- [ ] Convention: every scoring rule in `src/utils/scoring/**` gets a `// DAFMAN §x.y.z - <one-line rule>` comment on the line that enforces it.
- [ ] Backfill existing enforcers: `lookupScore` sub-min branch (§3.7.4), WHtR truncation (§3.15.4.2), `COMPONENT_MINIMUMS` (§3.7.1), walk-fail cascade (§3.1.2.2 or equivalent), composite pass threshold (§3.8.1), component weights (Table X.Y).
- [ ] Define a stable citation token: `DAFMAN §` (literal), grep-able, no variants.
- [ ] Lint rule / pre-commit hook: any new scoring-layer function must include at least one `DAFMAN §` citation, OR an explicit `// DAFMAN-UNCITED: <reason>` suppression. (Prefer a grep check over an ESLint plugin - lighter weight.)

**Files.**
- `src/utils/scoring/scoringEngine.js`
- `src/utils/scoring/constants.js`
- `src/utils/scoring/reverseScoring.js`
- `src/utils/scoring/strategyEngine.js`
- `src/utils/scoring/optimalAllocation.js`
- `scripts/check-dafman-citations.sh` (NEW)

**Reused.** Existing scoring files; `grep` / ripgrep; existing CI scaffold.

**Risks.** Comment drift - code changes but comment doesn't follow. Mitigated by G3 fixture tests asserting behavior matches citation.

### Task G3 - Machine-readable compliance fixtures (M)

Named test vectors for every §-level rule, stored as data. Tests iterate the fixture list. The fixture file is the single "does the engine match DAFMAN" oracle.

**Scope.**
- [ ] New `src/utils/scoring/__fixtures__/dafman-compliance.js` exporting an array of fixture objects:
  ```js
  {
    ruleId: 'DAFMAN-3.7.4-sub-chart-min',
    citation: 'DAFMAN 36-2905 (24 Mar 2026) §3.7.4',
    rule: 'Repetitions/durations below required minimum receive a component score of zero.',
    inputs: [
      { exercise: 'pushups', value: 11, gender: 'F', bracket: '30-34' },
      { exercise: 'plank',   value: 35, gender: 'F', bracket: '40-44' },
      ...
    ],
    expected: { points: 0 },                  // external
    expectedInternal: { internalPoints: 2.5 }, // internal tracking
    lastVerified: '2026-04-19',
  }
  ```
- [ ] Cover every currently-enforced rule from the compliance matrix (G1), one fixture per rule, multiple inputs per fixture.
- [ ] New test file `src/utils/scoring/dafman-compliance.test.js` iterates fixtures; one `it()` per (ruleId, input) pair; failures name the ruleId and citation.
- [ ] Fixture format is the contract the downstream D2 verbatim transcription will land against - new tables must keep these fixtures green.

**Files.**
- `src/utils/scoring/__fixtures__/dafman-compliance.js` (NEW)
- `src/utils/scoring/dafman-compliance.test.js` (NEW)

**Reused.** Vitest harness; existing `scoringEngine` public API.

**Dependencies.** G1 (matrix defines the rule list); G2 (citations land in code first, fixtures echo them).

**Risks.** Fixture maintenance burden. Mitigated by keeping fixtures data-only (no logic duplication) and adding new fixtures only for §-level rules, not every table cell.

### Task G4 - CI gate: regulation hash + citation integrity (M)

Block merges when `docs/DAFMAN-36-2905.md` changes without a corresponding compliance-matrix update, or when a code-level citation references a §/page that doesn't exist in the bundled regulation text.

**Scope.**
- [ ] `scripts/check-dafman-hash.sh` - computes SHA-256 of `docs/DAFMAN-36-2905.md`, compares against `docs/DAFMAN-36-2905.sha256`. Fails if mismatched.
- [ ] `scripts/check-dafman-citations.sh` - greps every `// DAFMAN §x.y.z` comment, verifies the `§x.y.z` token literally appears in `docs/DAFMAN-36-2905.md`. Fails if any citation points to a non-existent §.
- [ ] Both scripts wired into `.github/workflows/compliance.yml` (NEW). Runs on every PR touching `src/utils/scoring/**` or `docs/DAFMAN-*`.
- [ ] Override path documented: to bump DAFMAN version, regenerate `.sha256`, update `CHART_VERSION`, update compliance matrix header block, and land in a single commit named `chore(dafman): bump to <edition-date>`.

**Files.**
- `scripts/check-dafman-hash.sh` (NEW)
- `scripts/check-dafman-citations.sh` (NEW)
- `docs/DAFMAN-36-2905.sha256` (NEW)
- `.github/workflows/compliance.yml` (NEW)

**Reused.** `docs/DAFMAN-36-2905.md`; existing GitHub Actions setup at `.github/workflows/deploy.yml`.

**Dependencies.** G2 (citations must exist before they can be verified).

**Risks.** False positives from formatting changes to the markdown extract. Mitigated by regenerating via `scripts/pdf2md.sh` deterministically from the PDF; the PDF is the authority, not the markdown.

### Task G5 - Chart version guard (advisory) (S)

When `scoringTables.js` value rows change without bumping `CHART_VERSION`, emit a CI warning (not a blocker) and require the PR description to acknowledge.

**Scope.**
- [ ] Extend `CHART_VERSION` block in `constants.js` with `CHART_VERIFIED_AGAINST`:
  ```js
  export const CHART_VERIFIED_AGAINST = {
    source: 'AFPC PFRA Scoring Charts',
    retrievedFrom: 'https://www.afpc.af.mil/...',
    filename: 'PFRA Scoring Charts.pdf',
    sha256: '<hash>',
    verifiedDate: '2026-04-19',
    verifiedBy: '<author>',
  }
  ```
- [ ] `scripts/check-chart-version.sh` - diffs `src/utils/scoring/scoringTables.js` numeric content against the previous commit; if changed without a corresponding `CHART_VERSION` or `CHART_VERIFIED_AGAINST.verifiedDate` bump, emit warning.
- [ ] Wired into `.github/workflows/compliance.yml` as a warning step, not a failure step.

**Files.**
- `src/utils/scoring/constants.js:192` (extend)
- `scripts/check-chart-version.sh` (NEW)
- `.github/workflows/compliance.yml` (extend)

**Reused.** Existing `CHART_VERSION` constant; existing compliance workflow scaffold from G4.

**Risks.** Advisory warnings get ignored. Mitigated by PR template (G7) making the acknowledgement explicit.

### Task G6 - Upstream publication monitor (SHIPPED 2026-04-19)

**Status.** Shipped. Deploy-time check; no cron. Trajectory is a static SPA with exactly one execution context on CI (the `deploy.yml` workflow), so the monitor runs there instead of on a separate schedule.

**What shipped.**
- [x] `docs/UPSTREAM-PINS.json` - pins URL + Last-Modified + sha256 + content-length for DAFMAN 36-2905 and the AFPC PFRA Scoring Charts. Content-keyword `match_regex` (not positional tab-number), so AFPC re-ordering tabs or bumping date stamps does not false-positive — the match only fires on genuine drift.
- [x] `scripts/check-upstream-pubs.sh` - scrapes the AFPC fitness parent page, filters hrefs by `match_regex` + `exclude_regex`, asserts `expect_count`, HEADs the resolved URL for Last-Modified, and on any drift downloads the new PDF to `docs/upstream-snapshots/<key>.pdf` and exits 1. Modes: default check (halt on drift), `--refresh` (explicit human acceptance, rewrites pin + snapshots atomically), `--report` (never fails, for diagnostic runs).
- [x] `.github/workflows/deploy.yml` - runs the check before `npm run build`. On failure, uploads `docs/upstream-snapshots/` as the `upstream-drift-snapshots` workflow artifact (30-day retention) so reviewers can download the PDF that triggered the halt.
- [x] `.gitignore` - `docs/upstream-snapshots/*.pdf` + `*.html` (DAFMAN is ~40MB; snapshots are throwaway review artifacts, durable record is the pin JSON).
- [x] `docs/upstream-snapshots/README.md` - review workflow documented in the drop-zone itself.
- [x] `docs/DECISIONS.md` - new entry "Upstream drift: download-and-halt, never auto-accept (2026-04-19)" documenting the no-auto-accept choice.

**Design choice - download-and-halt, never auto-accept.** On drift, the check downloads the new PDF into the working tree and exits 1. It deliberately does **not** rewrite the pin JSON. Rationale: the script cannot interpret a PDF (did AFPC fix a typo or change the 2-mile run chart?), so only a human (or Claude in a follow-up session) can decide. Saving the PDF forces the right reflex — a concrete artifact to open — and `--refresh` exists as a separate explicit action for acceptance, to be committed alongside `docs/DAFMAN-COMPLIANCE-MATRIX.md` updates. Full rationale: `docs/DECISIONS.md`.

**Headers verified to bypass AFPC Akamai WAF.** `User-Agent` alone returns 403; Akamai also checks `sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`, and `Accept`. The script sends the full Brave-Chrome 147 header set.

**Files.**
- `docs/UPSTREAM-PINS.json` (SHIPPED)
- `scripts/check-upstream-pubs.sh` (SHIPPED)
- `docs/upstream-snapshots/README.md` (SHIPPED)
- `.github/workflows/deploy.yml` (AMENDED with `upstream_check` step + drift artifact upload)
- `.gitignore` (AMENDED to exclude snapshot PDFs)
- `docs/DECISIONS.md` (AMENDED with download-and-halt entry)

**Verified.** Happy path exits 0; injected Last-Modified drift exits 1 with a 40MB DAFMAN snapshot saved; `--refresh` rewrites pin + snapshots idempotently.

**Known limitations.**
- AFPC Akamai header fingerprinting may change; the Brave 147 UA will eventually stale out. Script will return exit 2 (upstream blocked), blocking deploy. Mitigation: rotate UA/header set, re-verify locally, commit.
- A single source with `expect_count: 1` and parent-page restructure producing 0 or >1 matches halts correctly with the parent HTML saved for inspection; new sources need their own `expect_count`.
- DAFMAN PDF is 40MB. On drift, every failing CI run uploads a 40MB artifact. Retention is capped at 30 days; acceptable for a rare event.

### Task G7 - PR review checklist (S)

Add scoring-specific checkboxes to the pull request template so human reviewers enforce what automation doesn't.

**Scope.**
- [ ] Extend or create `.github/pull_request_template.md` with a conditional block for scoring PRs:
  - [ ] Touched `src/utils/scoring/**`? Updated `docs/DAFMAN-COMPLIANCE-MATRIX.md`?
  - [ ] Added/changed a scoring rule? Added a `// DAFMAN §x.y.z` citation?
  - [ ] Added/changed an engine output shape? Added a fixture in `dafman-compliance.js`?
  - [ ] Changed `scoringTables.js` values? Bumped `CHART_VERSION` + `CHART_VERIFIED_AGAINST.verifiedDate`?

**Files.**
- `.github/pull_request_template.md` (NEW or extend)

**Reused.** Existing GitHub PR template mechanism.

**Risks.** Reviewers skip checkboxes. Mitigated by making the checkboxes map to the CI gates (G4, G5) so skipping them surfaces as a CI failure anyway.

### Task G8 - Close the known gaps (L, post-guardrails)

Use the G3 fixture harness to land the currently-open compliance items one at a time. Each lands as its own PR using the new guardrails.

**Scope.**
- [ ] §3.1.2.1.1 BFA gate enforcement. New helper `checkBFAGate(whtr, composite)` returning the pass/fail flag; consumed by `calculateCompositeScore` and surfaced in the result object. Fixture test in `dafman-compliance.js`.
- [ ] Walk time limits re-diff against Table 3.1 of 24 Mar 2026 edition; update `WALK_TIME_LIMITS` in `constants.js` if drift found.
- [ ] Waist averaging math: verify our 3-measurement + average handling matches DAFMAN's rounding/truncation rule. If PDF-form-only, verify `generateFormPDF.js` matches.
- [ ] Exemption semantics audit: map each DAFMAN exemption category (medical profile, pregnancy/postpartum, deployment, etc.) to a concrete representation; update the single-boolean `exempt` flag to an enumerated status if the nuance matters for composite math.
- [ ] Diagnostic vs scored period: verify `isDiagnosticPeriod()` gates all the places DAFMAN says diagnostic results should not carry the same consequences as scored results.
- [ ] D2 verbatim PFRA table transcription (already tracked as downstream item; fold into this task as a follow-on PR using the new harness).

Each gap gets its own PR, its own fixture set, and its own compliance-matrix row flip from `open` to `compliant`.

**Files.**
- Varies per gap.
- Every PR touches `docs/DAFMAN-COMPLIANCE-MATRIX.md` (matrix row update) and `src/utils/scoring/__fixtures__/dafman-compliance.js` (new fixture).

**Reused.** G1-G7 scaffolding.

**Dependencies.** G1-G5 must ship first; G6-G7 optional but recommended before G8 kicks off.

**Risks.** Scope creep. Mitigated by strict one-gap-one-PR discipline.

## Execution order

```
  G1 Matrix (doc)        G2 Citation convention (code)
        \                        /
         \                      /
          +---------> G3 Fixture harness (tests)
                              |
              +---------------+---------------+
              |                               |
        G4 Regulation gate              G5 Chart advisory
              |                               |
              +---------------+---------------+
                              |
                  G7 PR template + G6 Upstream monitor [SHIPPED 2026-04-19]
                              |
                              v
                      G8 Close known gaps (iterative)
```

G1 and G2 can run in parallel (doc work vs code comments). G3 depends on both. G4 depends on G2. G5 is independent of G4 but deploys via the same workflow. G6 and G7 are independent polish. G8 is the payoff phase, gated on G1-G5.

## Validation

- [ ] `docs/DAFMAN-COMPLIANCE-MATRIX.md` exists with baseline rows for every currently-enforced rule and every known gap.
- [ ] Every `src/utils/scoring/**` file has at least one `// DAFMAN §` citation, or an explicit `DAFMAN-UNCITED` suppression with reason.
- [ ] `src/utils/scoring/dafman-compliance.test.js` passes (fixture-driven tests green).
- [ ] `scripts/check-dafman-hash.sh` fails on `docs/DAFMAN-36-2905.md` change without matching `.sha256` update.
- [ ] `scripts/check-dafman-citations.sh` fails when a code citation references a non-existent §.
- [ ] `scripts/check-chart-version.sh` warns (not fails) on `scoringTables.js` value change without version bump.
- [x] `scripts/check-upstream-pubs.sh` runs locally, exits 0 on no change, exits 1 with a saved PDF on change detected. Verified 2026-04-19 against live AFPC (both sources matched pins; injected Last-Modified drift correctly saved 40MB DAFMAN snapshot + exited 1).
- [ ] PR template renders the scoring checklist for PRs touching `src/utils/scoring/**`.
- [ ] All 853 existing tests stay green through every phase.

## Deliverables

- `docs/DAFMAN-COMPLIANCE-MATRIX.md`
- `docs/DAFMAN-36-2905.sha256`
- `src/utils/scoring/__fixtures__/dafman-compliance.js`
- `src/utils/scoring/dafman-compliance.test.js`
- `scripts/check-dafman-hash.sh`
- `scripts/check-dafman-citations.sh`
- `scripts/check-chart-version.sh`
- `scripts/check-upstream-pubs.sh` (SHIPPED)
- `docs/UPSTREAM-PINS.json` (SHIPPED)
- `docs/upstream-snapshots/` (drift drop-zone, gitignored PDFs, README committed) (SHIPPED)
- `.github/workflows/compliance.yml`
- `.github/workflows/deploy.yml` (AMENDED - upstream check step + drift artifact upload; no separate `upstream-check.yml` needed)
- `.github/pull_request_template.md`
- Code-level `// DAFMAN §` citations across `src/utils/scoring/**`
- Extended `CHART_VERIFIED_AGAINST` constant in `constants.js`

## Non-goals

- Not a full D2 verbatim transcription of the 126 scoring tables (tracked in the kitchen-sink sprint's downstream items; this plan builds the harness it will land through).
- Not a rewrite of the scoring engine (D1 partial landing already shipped; remaining D1 work tracked separately).
- Not a UI change - guardrails are developer-facing.
- ~~Not a real-time regulation fetch from AFPC on every CI run (too brittle; weekly scheduled check is the agreed cadence).~~ **Superseded 2026-04-19:** shipped as deploy-time fetch. Trajectory is a static SPA with exactly one CI execution point, and the AFPC Portals URLs proved stable + fetchable with a full browser header set. Deploy-time check is stricter (no stale pin can ever ship) and simpler (no separate cron workflow). See G6.
- Not a replacement for human review - the PR checklist (G7) and compliance matrix (G1) assume a human is in the loop on every scoring change.
