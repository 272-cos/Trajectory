# DAFMAN Compliance Matrix

**Regulation:** DAFMAN 36-2905, 24 March 2026 (supersedes 22 April 2022 edition)
**Scoring Charts:** Final USAF Physical Fitness Readiness Assessment Scoring (Effective 1 Mar 26)
**Last Updated:** 2026-04-24

This matrix maps each DAFMAN provision to the corresponding code implementation,
serving as the authoritative record for scoring pillar changes (see `docs/DECISIONS.md`).

---

## §3.1 - Composite Score

| Provision | Description | Code Location | Status |
| :--- | :--- | :--- | :--- |
| §3.1 | Composite >= 75.0 to pass overall PFA | `PASSING_COMPOSITE = 75.0` in `constants.js`; `compositePass = composite >= PASSING_COMPOSITE` in `scoringEngine.js:calculateCompositeScore` | COMPLIANT |
| §3.1 | Composite = round((earned/possible)*100, 1 decimal) | `Math.round((totalEarned / totalPossible) * 1000) / 10` in `scoringEngine.js:calculateCompositeScore` | COMPLIANT |

---

## §3.7.1 - Body Composition No Minimum

| Provision | Description | Code Location | Status |
| :--- | :--- | :--- | :--- |
| §3.7.1 | "Body Composition does not have a minimum requirement" | `COMPONENTS_WITH_CHART_FLOOR_MINIMUM` excludes `bodyComp`; `componentMinimumMet()` returns `true` for bodyComp | COMPLIANT |
| §3.7.1 | BC contributes WHtR-chart points to composite; no floor gate | `lookupScore(WHTR, ...)` returns chart value including 0 for >=0.60; no `componentMinimumMet` gate applied | COMPLIANT |

---

## §3.7.3 - 2km Walk Pass/Fail

| Provision | Description | Code Location | Status |
| :--- | :--- | :--- | :--- |
| §3.7.3 | 2km Walk is pass/fail only; contributes 0/0 to composite | `walkOnly: true` path in `calculateComponentScore`; `walkComponents` excluded from `totalEarned/totalPossible` | COMPLIANT |
| EC-05 | Walk failure = overall PFA failure regardless of composite | `walkFailed = walkComponents.some(w => w.pass === false)` in `calculateCompositeScore`; `overallPass &&= !walkFailed` | COMPLIANT |

---

## §3.7.4 - Chart Floor Minimum (Asterisk Row)

| Provision | Description | Code Location | Status |
| :--- | :--- | :--- | :--- |
| §3.7.4 | "Repetitions/durations below the required minimum receive a component score of zero" | `lookupScore()`: `points = 0` for below-chart performance (reps/plank: `!matched`; run: `!matched` and not WHTR) | COMPLIANT |
| §3.7.4 | Below-* row = component failure | `componentMinimumMet(type, points)`: returns `false` when `points === 0` for cardio/strength/core | COMPLIANT |
| §3.7.4 | Asterisk row IS the minimum threshold | `getMinimumToPass()` returns `table[table.length - 1]` (the * row) for reverse lookup | COMPLIANT |
| §3.7.4 | Below-* is distinct from composite failure | `belowMinimum` flag in component result; `allComponentsPass` gate separate from `compositePass` gate | COMPLIANT |

---

## §3.15.4.2 - WHtR Truncation

| Provision | Description | Code Location | Status |
| :--- | :--- | :--- | :--- |
| §3.15.4.2 | "WHtR results are truncated (not rounded) to the first two decimals" | `Math.floor(value * 100) / 100` in `lookupScore()` before table lookup | COMPLIANT |

---

## Component Weights (50-20-15-15 Model)

| Component | Weight | Code | Status |
| :--- | :--- | :--- | :--- |
| Cardio | 50 pts max | `COMPONENT_WEIGHTS.cardio = 50` | COMPLIANT |
| Body Comp | 20 pts max | `COMPONENT_WEIGHTS.bodyComp = 20` | COMPLIANT |
| Strength | 15 pts max | `COMPONENT_WEIGHTS.strength = 15` | COMPLIANT |
| Core | 15 pts max | `COMPONENT_WEIGHTS.core = 15` | COMPLIANT |

---

## Scoring Chart Floor Values (Reference)

These are the * row values from the PFRA Scoring Charts (verified against
`docs/PFRA-Scoring-Charts.md`). The `chartFloor.test.js` test suite audits
these programmatically.

| Exercise | Floor Points | Notes |
| :--- | :--- | :--- |
| 2-Mile Run (all brackets) | 35.0 pts | Last row is the * row |
| HAMR Shuttle (all brackets) | 35.0 pts | Last row is the * row |
| Push-ups (all brackets) | 2.5 pts | Last row is the * row |
| HRPU (all brackets) | 2.5 pts | Last row is the * row |
| Sit-ups (all brackets) | 2.5 pts | Last row is the * row |
| CLRC (all brackets) | 2.5 pts | Last row is the * row |
| Forearm Plank (all brackets) | 2.5 pts | Last row is the * row |
| WHtR | N/A | No floor minimum per §3.7.1 |

---

## Change History

| Date | Change | Authority | PR/Commit |
| :--- | :--- | :--- | :--- |
| 2026-04-24 | Replaced legacy 60% percentage-based minimums with DAFMAN-literal chart floor (* row) minimums per §3.7.4 | DAFMAN 36-2905 §3.7.4 | Branch: `claude/dafman-component-minimums-HGkVN` |
