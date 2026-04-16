# Scoring Strategy Discussion - PFRA Alignment, Off-Chart Algorithm, Trajectory Math

## Status

- Created: 2026-04-16
- Branch: `claude/kitchen-sink-polish-sprint`
- Sibling artifacts: `docs/SCORING-MATH-AUDIT.md` (math-magician lens audit), `docs/scoring-math-audit/` (17 plots + 6 CSVs)
- Purpose: permanent record of the scoring architecture discussion, the boss directive that resolves the off-chart question, and every open question that remains before code is written.

## BOSS DIRECTIVE (locked, 2026-04-16)

Two distinct scores coexist in the application. They MUST be kept separate at every layer of the codebase:

### External score (DAFMAN-literal, user-visible)

- When a component fails to meet its minimum scoring performance: **display zero points, always.**
- No synthesized scores. No gradations. No partial credit. Not in the UI, not in the PDF, not in codes, not in exports, not anywhere the user can see.
- This is the ONLY number shown on AF Form 4446, composite score, pass/fail badges, component cards, ROI breakdowns, projection endpoints, achievement badges, or any export/share surface.
- Passing off-chart performances get the official chart point; failing-to-meet-minimum performances get 0. Period.

### Internal score (trajectory math, never user-visible)

- Extrapolate performance below chart floor as a **signed continuous number that can go negative.**
- Conceptual model: as the user's performance drifts further from the passing goal, the internal number becomes more negative. As they train and their performance improves, the internal number gradually climbs back toward zero, then through zero, and eventually into positive on-chart territory.
- Purpose: give the projection engine, ROI ranker, and training plan prescriber a continuous signal so they can "gradually move the bar" instead of sitting at a flat 0 until the user crosses the chart floor in a single discontinuous step.
- **Never exposed to the user as a score.** Under no circumstances does a negative number, a "trajectory-equivalent," or an "internal fitness index" appear in the UI, PDF, Report, History, or any code string.
- The user sees: "You failed to meet the minimum" and "0 points." Nothing else.

### Why this is correct

- Faithful to DAFMAN: the only number anyone is legally entitled to is the official one, and the official one is zero when minimums fail.
- Faithful to the user's goal: they don't need a pseudo-score; they need to know (a) they failed, (b) what the target is, (c) how to close the gap. The internal number powers (c) invisibly.
- Kills the projection step-function problem: a user who runs 30:00 today and 20:00 in 10 weeks would have a flat external score of 0, 0, 0, 0, 0, 35 — useless as a progress signal. The internal score moves every week, enabling accurate forecasting without misrepresenting the official score.
- Prevents UI ambiguity: there is no "but your internal score is -12" conversation. The user never sees it.

## Origin

Reviewing `PFRA Scoring Charts.pdf` (header "Final USAF Physical Fitness Readiness Assessment Scoring, Effective 1 Mar 26") against `src/utils/scoring/scoringTables.js` (sourced from "PT Charts New 50-20-15-15 with 2Mile FINAL 23 Sep 2025") surfaced three entangled problems:

1. **Table drift.** Our tables disagree with PFRA for the 2-mile run. Quick check of Male <25 showed our 49.4 / 48.8 / 48.1 pts at irregular time intervals vs PFRA's clean 49.5 / 49.0 / 48.0 at ~19-21 second intervals. Math-magician audit subsequently confirmed: **all 126 scored tables disagree with PFRA; the rewrite is total.**
2. **Off-chart algorithmic bug.** `scoringEngine.js:88-104` clamps off-chart performances to `table[length-1].points`. Under current tables the clamp floor for M<25 run is 29.5 pts (59%, fails the 60% cardio minimum) so the pass cascade masks the bug. Under PFRA tables the floor jumps to 35.0 pts (70%, silently passes the 60% minimum). The algorithm MUST change in lockstep with the table rewrite.
3. **The trajectory-math question.** What does "off-chart" mean for the app's projection/ROI/training-prescription math? DAFMAN says 0; the app needs continuous signal. **Resolved by the boss directive above.**

## Math-magician findings summary

From `docs/SCORING-MATH-AUDIT.md`:

- **Every one of 126 scored tables disagrees with PFRA.** Zero identical. Only WHtR (12 rows) and 2km walk (5-bracket pass/fail table) match.
- **Off-chart clamp is a hard BLOCKER for migration.** Cardio floor = 35/50 = 70%, above the 60% gate. Silent false-pass risk confirmed.
- **Current tables have 33 cross-bracket monotonicity violations; PFRA has 0.** Worst: male CLRC `<25 -> 25-29` at 7.8 pts (22 vs 31 reps, 9-rep jump - transcription error in current tables).
- **PFRA is near-perfectly linear** (R^2 >= 0.98 for all 7 exercises, = 1.000 for muscular and plank). Linear extrapolation is defensible for the internal trajectory score.
- **Plank is the starkest structural mismatch.** Current: 12-13 rows with non-uniform deltas, 7.5-pt floor. PFRA: 26 rows, uniform 0.1 pts/sec linear, 2.5-pt floor.

## Architectural implications of the boss directive

### Subsystem-level mapping

| Subsystem | Uses external | Uses internal |
|---|---|---|
| AF Form 4446 PDF | yes | no |
| SelfCheckTab score display | yes | no |
| HistoryTab list / rows | yes | no |
| ReportTab (supervisor) | yes | no |
| Composite score + pass gate | yes | no |
| Achievement badges / milestones | yes | no |
| Share / export / S-code payload | yes | no |
| ProjectTab projection chart | yes (endpoint labels) | yes (curve shape) |
| strategyEngine ROI ranking | yes (user-visible pts gained) | yes (ordering math) |
| optimalAllocation priority | no | yes |
| phaseEngine emphasis weighting | no | yes |
| Calendar intensity scaling | no | yes |

### New / changed engine primitives (conceptual, not yet code)

1. `calculateOfficialScore(exercise, value, bracket, gender)` - DAFMAN-literal. 0 if below-minimum or off-chart. Drives everything user-visible.
2. `calculateInternalScore(exercise, value, bracket, gender)` - continuous signed. Linear extrapolation below chart floor; can go negative. NEVER rendered.
3. `calculateComponentScore()` returns BOTH, clearly labeled, with strong typing or naming convention so a developer cannot accidentally pipe internal to a display surface.
4. Test harness includes a guard: any call site rendering a score must take `official`, not `internal`. Could be enforced by an eslint rule or naming convention like `internalPointsDoNotRender`.

### Linear extrapolation specification (for internal score only)

- Slope = `(points[n-1] - points[n]) / (threshold[n-1] - threshold[n])` using the last two on-chart rows.
- Internal score for off-chart value V = `chartFloor.points - slope * |V - chartFloor.threshold|` (direction-aware: for time-based lower-is-better, V > chartFloor.threshold; for rep-based higher-is-better, V < chartFloor.threshold).
- No artificial floor. Internal score is allowed to go arbitrarily negative.
- For WHtR: chart already reaches 0.0 at the floor. Extrapolation simply continues into negative as ratio worsens beyond 0.60.
- For walk: no points anyway (pass/fail); internal model N/A.

### Projection chart behavior under directive

- User sees: external score curve. Wherever external = 0, the curve is flat at 0.
- Under the hood: internal score curve drives the line's SHAPE and SLOPE so that projected time-to-pass is accurate.
- Visual treatment: possibly render the "0 zone" with a distinct label ("below minimum - training required") rather than a data point, so the user understands they're in a pre-passing regime without seeing a synthesized number.
- Design detail pending (open question below).

## Confirmed decisions (from prior discussion turns)

- **Sprint integration.** Findings + code changes append to `docs/plans/2026-04-14-kitchen-sink-polish-sprint.md`; no new plan document for this work.
- **Silent rescore for old S-codes.** No migration banner. When a user re-opens a saved assessment post-change, it re-scores with the new engine automatically. The engine "just got more correct."
- **Unified PDF code-gen is FUTURE work.** Not this sprint, not in the kitchen plan. Goes on the `docs/DEVELOPMENT_PLAN.md` roadmap as a future item.
- **PDF is NOT 100% accurate to AF Form 4446.** In scope for this body of work. Needs side-by-side rendering against `af1067_unsec.pdf` at 300dpi, punch list of discrepancies, targeted fixes.
- **Off-chart external = 0, internal = signed continuous.** Per boss directive above. No longer an open question.

## Open questions (remaining after boss directive)

### Trajectory math

1. ~~**Internal-score negative floor.**~~ **RESOLVED 2026-04-16.** Cap the internal score at ~2x the chart's own height below the floor (e.g., if the chart runs 35-50, cap hidden score at -15 = 2 chart-heights below 35). Prevents pathological forecasts while preserving the signed-continuous concept.
2. ~~**Internal-score exposure surfaces.**~~ **RESOLVED 2026-04-16.** Defense in depth: (a) one-time grep sweep at implementation, (b) naming convention (`_internalScoreDoNotRender` or similar unambiguous marker), (c) type/wrapper so display functions refuse internal-score objects at runtime. All three.
3. ~~**ROI label when external is 0.**~~ **RESOLVED 2026-04-16.** Sort by internal delta. Label reads **"+35 to enter scoring chart"** when below minimum; normal **"+X points"** when above. Ranking math and display labels diverge by design.
4. ~~**Projection chart rendering of the 0 zone.**~~ **RESOLVED 2026-04-16.** Dashed pre-qualifying line + solid post-qualifying line, with a visible milestone annotation at the week the user crosses the threshold. Hidden internal number still shapes the dashed segment's slope; dashed styling signals "not yet scoring." Milestone annotation makes the crossing explicit.

### Tables

5. ~~**Anomaly preservation.**~~ **RESOLVED 2026-04-16.** EXACTLY ZERO DEVIATIONS from PFRA. Faithful mirror. Each oddity gets a comment in `scoringTables.js` AND an entry in `docs/SCORING-ANOMALIES.md` documenting what we see and why we chose to preserve it verbatim.
6. **Monotonicity CI gate** — PARTIAL CLARIFICATION NEEDED. User confirmed "tables must match PFRA exactly; throw out anything that does not." That resolves the data source question. The remaining half of Q6 is about adding an automated test that REJECTS any future PR that breaks bracket-over-bracket monotonicity - a safety net against re-introducing transcription errors when the tables are next edited. Not the same as Q5. See clarification offered to user 2026-04-16.
7. ~~**Dimensional typing.**~~ **RESOLVED 2026-04-16.** Do it this sprint. Add `dimension` (TIME | COUNT | RATIO), `unit` (SECONDS | REPS | SHUTTLES | NONE), `direction` (LOWER_IS_BETTER | HIGHER_IS_BETTER) to each exercise definition. Engine gets one code path instead of `isPlank || isRun` special-cases.
8. ~~**Asterisk semantics.**~~ **RESOLVED 2026-04-16.** Our inference ("slowest scoring performance; below this = off-chart") is the working definition. Document in `docs/SCORING-ANOMALIES.md` as "inferred, pending authoritative AFPC confirmation."

### PDF / AF Form 4446

9. ~~**Side-by-side process.**~~ **RESOLVED 2026-04-16.** Pre-sprint sanity task. GOAL STATE: finish it THIS SESSION. Render real form + our PDF at 300dpi, diff, punch list, fix.
10. ~~**Tolerance bar.**~~ **RESOLVED 2026-04-16.** "Printed side by side, indistinguishable." Right sections / labels / shading / selection rendering / input types per field / positions within 5px. Where the real form has misaligned lines, WE MAY clean them up - ours slightly better is fine, we are not required to copy imperfections.

### Code unification

11. ~~**Duplication map.**~~ **RESOLVED 2026-04-16.** Thorough read-only audit now. Produces a duplication-map document before engine refactor. Single agent run, read-only.
12. ~~**Gap analysis API placement.**~~ **RESOLVED 2026-04-16.** New `gapEngine.js`. Separate from `strategyEngine.js` (ROI/effort math) because gap (distance) and strategy (effort-weighted return) are different concepts.

## Questions still open after 2026-04-16 directives

- **Q3** - ROI label when external is 0
- **Q4** - Projection chart rendering of the 0 zone
- **Q6** - Add CI gate to auto-reject future bracket-monotonicity regressions (half-clarified; needs confirmation)

## Dependency order for resolving remaining questions

Q11 (duplication audit) -> Q1 (internal floor policy) -> Q3/Q4 (ROI display + projection rendering) -> Q9 (PDF side-by-side) -> Q5-Q8 (table specifics) -> engine refactor code starts.

## Recommended next action

Run the duplication audit (Q11) as a read-only pass so we know the full surface area the internal/external split must touch before anyone writes a line of engine code. Math-magician's audit is done. Duplication audit is the remaining prerequisite.

## Changelog

- 2026-04-16: File created. Boss directive locked. Math audit sibling artifacts in place. 12 open questions grouped by topic with a recommended resolution order.
