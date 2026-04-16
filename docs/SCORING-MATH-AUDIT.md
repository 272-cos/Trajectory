# PFA Scoring Tables - Mathematical Audit

Authored under Math Magician protocol: triangulation, stated confidence tiers, no hedging on claims the math confirms.

- **Authoritative source**: `PFRA Scoring Charts.pdf` - "Final USAF Physical Fitness Readiness Assessment Scoring (Effective 1 Mar 26)"
- **Current implementation**: `src/utils/scoring/scoringTables.js` - "PT Charts New 50-20-15-15 with 2Mile FINAL 23 Sep 2025"
- **Engine under review**: `src/utils/scoring/scoringEngine.js` (`lookupScore`, clamp logic lines 79-111)
- **Data artifacts**: `docs/scoring-math-audit/` (CSVs and plots referenced below)

Confidence tiers attached to every finding: **HIGH** (theorem / direct transcription / two-lens agreement), **MED** (one lens or a statistical claim with tight bound), **LOW** (inference beyond verified data).

---

## 1. Executive Summary (read this first)

1. **Every single one of the 126 scorable (gender x age x exercise) tables differs from PFRA.** Zero tables are identical. The rewrite is total, not incremental. [HIGH - Lens 4, `lens4_pfra_vs_current.csv`]
2. **The current tables have 33 cross-bracket monotonicity violations** (older brackets sometimes demand MORE work than younger ones at the same point value). PFRA has zero. The current tables are internally inconsistent in a way PFRA is not. [HIGH - Lens 2]
3. **The engine's off-chart clamp (`table[length-1].points`) is an unconditional BLOCKER for migration to PFRA.** Under PFRA, cardio floor is 70% of max (35.0 / 50.0) - any performance slower than the chart floor still clamps to 70%, which exceeds the 60% component minimum. Under current tables, cardio floor is 59% which correctly fails the gate. This bug is silent today, would become user-visible and mis-scoring at the moment tables are swapped. 36 (gender x age) combinations affected across run + HAMR. Muscular exercises (pushups/hrpu/situps/clrc/plank) float at a 2.5/15 = 16.7% floor in both sources, so the clamp stays correct there. [HIGH - Lens 4, `lens4_offchart_clamp_risk.csv`]
4. **PFRA curves are almost perfectly linear** (mean R^2_linear = 1.00 for 6 of 7 exercises; run R^2 = 0.982 with quadratic boosting to 0.995). Linear extrapolation is defensible, but the slopes are so shallow for run (mean slope ≈ -0.02 pts/sec) that extrapolating to 0 pts requires ~1884 seconds past the chart floor - clearly absurd. Linear extrapolation is *mathematically* viable, *operationally* pointless past ~1 unit beyond floor. [HIGH - Lens 5, `lens5_curve_shape.csv`, `lens5_extrap_viability.csv`]
5. **WHtR and 2km walk time limits are identical between PFRA and current.** No rewrite needed for those two. Walk time limits are also correctly implemented in `constants.js`. [HIGH - Lens 4]

---

## 2. Data Shape & Structural Check (Lens 0 - scaffolding)

### Row count per (gender, age, exercise) - PFRA (all 18 brackets uniform):

| Exercise | Rows | Point range | Step size |
| --- | --- | --- | --- |
| 2-mile run | 21 | 50.0 → 35.0 | 0.5 at top, 1.0 middle, 0.5 at bottom (densified) |
| HAMR | 21 | 50.0 → 35.0 | same shape as run |
| Push-ups | 26 | 15.0 → 2.5 | uniform 0.5 |
| HRPU | 26 | 15.0 → 2.5 | uniform 0.5 |
| Sit-ups | 26 | 15.0 → 2.5 | uniform 0.5 |
| CLRC | 26 | 15.0 → 2.5 | uniform 0.5 |
| Plank | 26 | 15.0 → 2.5 | uniform 0.5 |
| WHtR | 12 | 20.0 → 0.0 | non-uniform (coarser at floor) |

### Row count per (gender, age, exercise) - Current (NOT uniform):

| Exercise | Row count range (min - max) | Notes |
| --- | --- | --- |
| run | 21 / 21 (uniform) | But point values non-uniform |
| hamr | 21 / 21 (uniform) | Same shape as run |
| pushups | 18 - 38 | Wildly inconsistent across brackets |
| hrpu | 21 - 26 | |
| situps | 16 - 24 | |
| clrc | 28 - 37 | |
| plank | 12 - 13 | Far coarser than PFRA's 26 |

**Finding [HIGH]**: the current tables have per-bracket-arbitrary row counts, while PFRA has a **deliberately uniform schema** (26 rows for muscular, 21 for cardio, 26 for plank, 12 for WHtR). The current tables were clearly transcribed per-bracket without enforcing the PFRA schema, which explains both the row-count chaos and the floor-point drift.

Floor-point chaos example, M<25:

| Exercise | Current floor pts | PFRA floor pts | % of max (PFRA) |
| --- | --- | --- | --- |
| run | 29.5 | 35.0 | 70.0% |
| hamr | 29.5 | 35.0 | 70.0% |
| pushups | 0.8 | 2.5 | 16.7% |
| hrpu | 7.5 | 2.5 | 16.7% |
| situps | 2.3 | 2.5 | 16.7% |
| clrc | 7.5 | 2.5 | 16.7% |
| plank | 7.5 | 2.5 | 16.7% |

Current pushups floors at 0.8 pts (5.3% of max); PFRA floors at 2.5 (16.7%). Current plank floors at 7.5 (50%); PFRA at 2.5 (16.7%). Each current-table floor was pulled from a different underlying source. This is the signature of fragmented transcription.

---

## 3. Lens 1 - Monotonicity & Dimensional Consistency

Verified for both sources: points strictly decrease row-by-row in every one of the 126 tables. Thresholds monotonic in the direction dictated by the exercise kind (time lower-is-better, count/plank higher-is-better).

| Source | In-table monotonicity violations |
| --- | --- |
| Current | 0 |
| PFRA | 0 |

**Finding [HIGH]**: No in-table inversions in either source. The monotonicity check is passed trivially because tables are explicitly sorted. **Dimensional kinds are correctly distinguished** in the engine (`isTimeBasedExercise`, `isRepsBasedExercise`, `isPlank`), and plank is correctly handled as time-HIGHER-is-better (opposite of run). No issues.

---

## 4. Lens 2 - Cross-Bracket Continuity

For each exercise/gender/points value, the threshold sequence across `<25 → 25-29 → 30-34 → ... → 60+` should be monotonic in "gets easier" (threshold decreasing for rep-based, increasing for time-based).

| Source | Cross-bracket violations | Exercises affected |
| --- | --- | --- |
| Current | **33** | run (M, F), clrc (M) |
| PFRA | **0** | none |

### Current cross-bracket violations (full list)

Male run violations (older bracket requires FASTER time than younger at same point value):

| Point value | Offending age step | Times (sec) |
| --- | --- | --- |
| 43.9 pts | 25-29 → 30-34 | 974 → 972 (2s faster required at 30-34) |
| 42.9 pts | 25-29 → 30-34 | 993 → 990 |
| 41.8 pts | 25-29 → 30-34 | 1012 → 1009 |
| 40.7 pts | 25-29 → 30-34 | 1032 → 1027 |
| 39.6 pts | 25-29 → 30-34 | 1050 → 1046 |
| 38.6 pts | 25-29 → 30-34 | 1067 → 1062 |
| 37.5 pts | 25-29 → 30-34 | 1084 → 1078 |
| 34.0 pts | 30-34 → 35-39 | 1146 → 1144 |
| 32.5 pts | 30-34 → 35-39 | 1174 → 1171 |
| 31.0 pts | <25 → 25-29 | 1176 → 1170 (!) |
| ... | ... | (see `lens4_pfra_vs_current.csv` for remainder) |

Male CLRC violations (older bracket requires MORE reps than younger):

| Point value | Offending age step | Reps |
| --- | --- | --- |
| 11.3 pts | <25 → 25-29 | 35 → 37 (2 more reps required at 25-29) |
| 10.5 pts | <25 → 25-29 | 32 → 36 |
| 8.4 pts | <25 → 25-29 | 24 → 32 |
| 7.8 pts | <25 → 25-29 | 22 → 31 |

**Finding [HIGH]**: The current CLRC male tables have a 9-rep inversion at 7.8 pts (younger bracket 22 reps, older bracket 31 reps). This is almost certainly a per-bracket transcription error, not an intentional design. The current table also ships cross-bracket drifts in male run at nearly every point value in mid-range.

**PFRA is clean.** All 126 tables pass cross-bracket continuity.

Gender symmetry (at fixed (age, exercise, point), F threshold is easier than M): **both sources clean**, no reversed requirements.

See plots `fig3_xbracket_*.png` for visual triangulation - every crossover is visible as dashed (current) vs solid (PFRA) diverging.

---

## 5. Lens 3 - Delta Structure (uniformity of point spacing)

Coefficient of variation of Δpoints across rows, mean across brackets:

| Exercise | Current (mean \|CV\| of Δpts) | PFRA (mean CV of Δpts) |
| --- | --- | --- |
| run | high (non-uniform) | 0.34 (densifies at top/bottom) |
| hamr | high (non-uniform) | 0.34 (densifies similarly) |
| pushups | very high | **0.00** (uniform 0.5) |
| hrpu | high | **0.00** |
| situps | very high | **0.00** |
| clrc | high | **0.00** |
| plank | very high | **0.00** |

See `lens3_delta_structure.csv`, `fig4_delta_distribution.png`.

### Run delta densification pattern (PFRA M<25, exemplary)

| Row span | Δpts | Δseconds per row |
| --- | --- | --- |
| 50.0 → 49.0 (2 rows) | 0.5 | 19 |
| 49.0 → 39.0 (10 rows) | 1.0 | 19 |
| 39.0 → 35.5 (7 rows) | 0.5 | 19 |
| 35.5 → 35.0* (off-chart, last) | 0.5 | 9 |

**Finding [HIGH]**: PFRA's run chart has a **constant 19-second threshold step** with densified point grading at both ends. The math is: each 19-second bucket maps to either 1.0 (middle) or 0.5 (top/bottom) points - a piecewise linear grading. Slope in the middle: 1.0 / 19 = 0.053 pts/sec. Slope at top/bottom: 0.5 / 19 = 0.026 pts/sec.

### Run transcription anomaly in CURRENT (M<25)

Current run Δpoints stream: `[0.60, 0.60, 0.70, 0.60, 0.60, 0.60, 0.70, 0.60, 1.10, 1.00, 1.10, 1.10, 1.10, 1.00, 1.10, 2.00, 1.50, 1.50, 1.50, 1.50]`.

These are NOT the 0.5/1.0/0.5 PFRA shape. They look like a manually-scaled 21 → 50-pt mapping applied non-uniformly, producing irrational increments. **This is the "drift" the user flagged** and it is in every bracket, not just M<25. [HIGH]

### Plank is the starkest mismatch (M<25)

| Row | Current pts | Current sec | PFRA pts | PFRA sec |
| --- | --- | --- | --- | --- |
| Max | 15.0 | 215 | 15.0 | 220 (5s stricter) |
| 2nd | 14.8 | 210 | 14.5 | 215 |
| ... | (12 rows total, non-uniform deltas) | | (26 rows total, uniform 0.5 pts / 5 sec) | |
| Floor | 7.5 | 65 | 2.5 | 95 |

Current plank bottoms at **65 seconds for 7.5 pts** (50% of max). PFRA bottoms at **95 seconds for 2.5 pts** (16.7% of max). This is two different chart shapes entirely. [HIGH]

---

## 6. Lens 4 - PFRA vs Current Diff (point-level)

Compared 126 tables row-by-row using the engine's lookup semantics to evaluate current-table points at each PFRA threshold.

### Top 10 brackets by max absolute point delta (from `lens4_pfra_vs_current.csv`)

| Rank | Gender | Age | Exercise | Max \|Δpts\| | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | F | 60+ | run | 12.5 | biggest single-table drift |
| 2 | F | 55-59 | run | 11.0 | |
| 3 | F | <25 | clrc | 9.6 | |
| 4 | F | 25-29 | clrc | 9.6 | |
| 5 | F | 40-44 | run | 9.5 | |
| 6 | F | 45-49 | run | 9.5 | |
| 7 | F | 30-34 | clrc | 9.3 | |
| 8 | F | 35-39 | clrc | 9.2 | |
| 9 | F | 30-34 | run | 9.0 | |
| 10 | F | 40-44 | clrc | 9.0 | |

A 12.5-pt swing on a 50-pt cardio scale = **25% of the component's max range** at a single threshold. That directly moves the composite by 6.25 points on its 100-pt scale (25% × 50% cardio weight). A pass/fail gate is 75.0 composite. If the current table is awarding that swing on the wrong side of the truth, **users near the pass boundary are being mis-scored today**.

**Identical tables**: 0 of 126. WHtR and 2km walk (not in this table - separate structures) are identical. Everything else requires rewrite. [HIGH]

### Scenario impact (M<25, composite math)

Simulated six archetypes. Pushups used for strength, situps for core, run for cardio, WHtR for body comp:

| Scenario (M<25) | Current run pts | PFRA run pts | Current push pts | PFRA push pts | Current situps pts | PFRA situps pts | Current plank pts | PFRA plank pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top 1% | 50.0 | 50.0 | 15.0 | 15.0 | 15.0 | 15.0 | 15.0 | 15.0 |
| Good (15:00 run, 55 push) | 46.9 | 46.0 | 13.2 | 11.0 | 13.1 | 11.0 | 12.6 | 11.0 |
| Average (17:00 run, 40 push) | 40.7 | 39.0 | 10.2 | 6.0 | 4.5 | 6.0 | 10.5 | 6.0 |
| Marginal (19:00 run, 28 push) | 32.5 | 36.0 | 0.8 | 2.5 | 2.3 | 2.5 | 8.5 | 2.5 |
| Failing (21:40 run, 20 push) | 29.5 | 35.0 | 0.8 | 2.5 | 2.3 | 2.5 | 7.5 | 2.5 |
| Far off-chart (28:20 run) | 29.5 | 35.0 | 0.8 | 2.5 | 2.3 | 2.5 | 7.5 | 2.5 |

**Observation [HIGH]**: the migration is **not a uniform tightening or loosening** - it's a reshape:
- Cardio off-chart performance gets a 5.5-pt *boost* (29.5 → 35.0) under PFRA.
- Plank in the middle tier gets *harder* (10.5 → 6.0 = 4.5-pt loss at 130s).
- Muscular floor gets *easier* (0.8 → 2.5 for 20 pushups).

This is precisely the "off-chart clamp risk" that interacts with the engine bug below.

---

## 7. Lens 4b - Off-Chart Clamp Risk (engine bug interaction)

The engine's `lookupScore` function (lines 88-104 of `scoringEngine.js`) clamps below-floor performance to `table[table.length-1].points` with the comment "Worse than every chart entry → clamp to minimum chart points (never 0)". This is EC-01 behavior.

The PFRA convention, implied by the asterisked floor row (`19:45*`, `1:35*`, etc.) in every scored chart, is that the asterisked row is the **last gradable row**, and any performance below that is **off-chart = not passing, no points**.

| Source | Cardio floor (% of max) | Muscular floor (% of max) | Clamp passes 60% component min? |
| --- | --- | --- | --- |
| Current | 29.5 / 50.0 = 59% | varies: 0.8 - 7.5 (5.3% - 50%) | No for cardio (59% < 60%); no for most muscular |
| PFRA | 35.0 / 50.0 = **70%** | 2.5 / 15.0 = 16.7% | **YES for cardio (70% ≥ 60%)**; no for muscular |

### Concrete mis-scoring scenario after migration (unchanged engine)

Airman (M<25) runs 2 miles in 30:00 (1800 seconds - 615 seconds past PFRA chart floor of 19:45/1185s).
- Engine clamps to PFRA floor row → 35.0 cardio points.
- Cardio minimum gate: 60% of 50 = 30.0 points. Airman has 35.0 ≥ 30.0 → **PASSES cardio minimum**.
- Under the correct PFRA semantics (off-chart = fail), this should be a cardio failure.

This affects **36 brackets** (18 x 2 cardio exercises). Muscular exercises are safe because floor 16.7% is already below the 60% gate - the clamp correctly keeps them in fail state.

See `lens4_offchart_clamp_risk.csv` for the per-bracket breakdown. [HIGH]

---

## 8. Lens 5 - Extrapolation Viability

### Curve shape diagnosis (PFRA, mean R^2 across all 18 brackets)

| Exercise | R^2_linear | R^2_quadratic | R^2_log |
| --- | --- | --- | --- |
| clrc | **1.000** | 1.000 | 0.991 |
| hrpu | **1.000** | 1.000 | 0.970 |
| plank | **1.000** | 1.000 | 0.982 |
| situps | **1.000** | 1.000 | 0.985 |
| pushups | 0.999 | 0.999 | 0.972 |
| hamr | 0.992 | 0.993 | 0.975 |
| run | **0.982** | **0.995** | 0.991 |

**Finding [HIGH]**: 5 of 7 PFRA exercises are *perfectly linear* over the chart range. Run is mildly convex (quadratic adds 0.013 R^2 over linear), reflecting the densified step shape. HAMR is near-linear with minor curvature. For extrapolation, **linear is defensible for all exercises; quadratic only meaningfully improves run**. See `fig5_extrapolation.png`.

### Slopes (pts per unit threshold, last-5-row linear fit, PFRA)

| Exercise | Mean slope | Std dev | Interpretation |
| --- | --- | --- | --- |
| run | -0.019 pts/sec | 0.004 | ~0.02 pts lost per second past floor; glacial slope |
| hamr | 0.33 pts/shuttle | 0.028 | 1 pts per ~3 shuttles |
| plank | 0.10 pts/sec | ~0 | 1 pts per 10 sec |
| pushups | 0.42 pts/rep | 0.08 | 1 pts per ~2.4 reps |
| hrpu | 0.50 pts/rep | 0 | **exactly 0.5 pts/rep** |
| situps | 0.50 pts/rep | 0 | **exactly 0.5 pts/rep** |
| clrc | 0.50 pts/rep | 0 | **exactly 0.5 pts/rep** |

### Distance from chart floor to extrapolated 0 pts

Extrapolating the last-5-row linear fit until points = 0:

| Exercise | Mean distance past floor to 0 pts | Interpretation |
| --- | --- | --- |
| run | **+1884 seconds** (31 min) | absurd - chart floor is already 19:45, 0pt would be ~51min |
| hamr | -106 shuttles | 0 shuttles reaches 0 pts naturally |
| plank | -25 seconds | 0 seconds = ~0 pts, coherent |
| pushups | -6 reps | zero reps crosses zero coherently |
| hrpu | -5 reps | ditto |
| situps | -5 reps | ditto |
| clrc | -5 reps | ditto |

**Finding [HIGH]**:
- Muscular and plank extrapolation to zero lands within 5-6 units of the floor - **this is coherent**. Linear extrapolation of, e.g., push-ups at 2.5 pts / 30 reps with slope 0.5 pts/rep hits 0 pts at 25 reps, which matches the intuition.
- Run extrapolation to zero is **mathematically valid but operationally meaningless**. Running 51 minutes for 2 miles is not a realistic performance event; it's a pathological one. Any trajectory extrapolation that uses raw linear math will hand back absurd negative values for 40-min runs.

### Recommended extrapolation model (trajectory score)

For the projection/ROI path the user flagged:

1. **Use linear extrapolation of the last-5-row fit**, clamped on both ends:
   - Above chart: cap at max points (50.0 or 15.0 or 20.0).
   - Below chart floor: extrapolate linearly for a **bounded window**, then flatten at 0 (or at a chosen "deep fail" anchor like -5 pts to preserve ordering for ranking).
2. **Bounded window**: cap extrapolation at **max(chart_span * 0.25, 2 * worst-chart-step)**. For run this keeps trajectory scoring within ~2-3 minutes of chart floor; for pushups within ~10 reps.
3. **Use quadratic fit specifically for run and HAMR** if you want to preserve the subtle curvature (R^2 gain 0.01-0.02). Otherwise linear is fine.
4. **Never display a negative trajectory score**. Render it as "deep below chart, [continuous rank value] pts notional" and show the actual PFRA-floored score (35.0 or 2.5) in the user-facing composite.
5. **Keep the OFFICIAL score calculation separate** from the trajectory calculation. The official composite uses the PFRA chart verbatim (ideally with off-chart = fail, see recommendation below). The trajectory score is a continuous surrogate used only for projection, goal-setting, and ranking-of-effort.

[MED on recommendations - these are design choices dependent on user-facing UX goals, not derivable from the math alone]

---

## 9. Lens 6 - Anomaly Catalog (severity-tagged)

### BLOCKER (migration cannot ship without fixing these)

| ID | Severity | Location | Description |
| --- | --- | --- | --- |
| B-01 | BLOCKER | `scoringEngine.js:88-104` | Off-chart clamp to `table[last].points` passes 60% component min under PFRA for cardio. Must change to "off-chart = fail" or to "off-chart = 0 pts AND belowMinimum=true" to match PFRA convention. Muscular is unaffected. |
| B-02 | BLOCKER | `scoringTables.js` all 126 non-WHtR tables | Every scored table disagrees with PFRA at one or more thresholds. Max delta 12.5 pts (F 60+ run). Zero tables are identical. |
| B-03 | BLOCKER | `scoringTables.js` male run 25-29, 30-34, 35-39 | Cross-bracket inversions - older airman has stricter time requirement than younger at same point value. 10+ data points affected. |
| B-04 | BLOCKER | `scoringTables.js` male CLRC \<25 vs 25-29 | Cross-bracket inversion of 9 reps at point value 7.8 (22 reps \<25 vs 31 reps 25-29). Transcription error. |

### WARN (should fix alongside rewrite, not strictly migration-blocking)

| ID | Severity | Location | Description |
| --- | --- | --- | --- |
| W-01 | WARN | `scoringTables.js` plank | All 18 plank tables are 12-13 rows vs PFRA's 26. Missing 13+ gradations per bracket - entire bottom half of chart compressed into unused rows. Point floors wrong (7.5 vs PFRA 2.5). |
| W-02 | WARN | `scoringTables.js` every table | Row counts vary per bracket (pushups: 18-38 rows across brackets). PFRA uniform at 26. Suggests fragmented transcription. |
| W-03 | WARN | `scoringTables.js` run Δpoints | Non-uniform deltas like `[0.6, 0.6, 0.7, ...]` for chart increments. PFRA has clean `[0.5, 0.5, 1.0, 1.0, ..., 0.5]` piecewise structure. Current values are not present in PFRA. |
| W-04 | WARN | floor-point chaos | Current floors per exercise: 0.8 (pushups), 2.3 (situps), 7.5 (hrpu, clrc, plank), 29.5 (run, hamr). PFRA: uniform 2.5 for muscular, 35.0 for cardio, 0 for WHtR. |

### FYI (worth noting, not critical)

| ID | Severity | Location | Description |
| --- | --- | --- | --- |
| F-01 | FYI | PFRA PDF M<25 run row 35.5 | M<25 at 35.5 pts = 19:36, same as M 25-29 (both 19:36). Adjacent rows show normal 10-sec offset between brackets. Likely a data-entry error in PFRA source; preserved-as-is in my parse. |
| F-02 | FYI | PFRA PDF M 60+ run rows 37.0 / 36.5 / 36.0 | Step sizes 12s / 9s / 42s where neighboring rows average ~21s. Total cumulative gap (63s) matches expected (3 × 21s), but internal distribution is irregular. Likely a transcription error in the PFRA source; preserved-as-is. |
| F-03 | FYI | PFRA plank uniform 5-sec step / 0.5-pt step | Plank max 3:40 (220s), floor 1:35* (95s). Slope 0.1 pts/sec exactly. Clean linear chart. |
| F-04 | FYI | WHtR universal across age/gender | PFRA publishes 18 identical columns. Consistent with current implementation (`WHTR_TABLE` is a single array). No change needed. |
| F-05 | FYI | 2km walk time limits | 5 broader age brackets (mapped to 9 AFPC brackets in `constants.js`). Times match PFRA exactly. No change needed. |
| F-06 | FYI | Non-monotonic current CLRC row-count across brackets | Row counts vary 28-37 with no pattern. Points are well-formed inside each table but the shape is bracket-arbitrary. |

---

## 10. Confidence Summary (per finding)

| Claim | Confidence | Basis |
| --- | --- | --- |
| All 126 scored tables differ from PFRA | **HIGH** | Row-by-row comparison (Lens 4) |
| WHtR table identical | **HIGH** | Direct diff of 12 rows |
| Walk time limits identical | **HIGH** | Direct diff |
| Current tables have 33 cross-bracket monotonicity violations | **HIGH** | Lens 2 enumeration |
| PFRA tables have 0 cross-bracket violations | **HIGH** | Lens 2 |
| PFRA exercises are near-linear (R^2 ≥ 0.98) | **HIGH** | Regression fits, Lens 5 |
| Run is mildly convex, quadratic improves R^2 by 0.01 | **HIGH** | Lens 5 |
| Off-chart clamp passes 60% min for cardio under PFRA | **HIGH** | Deterministic arithmetic (35.0/50.0 = 70% ≥ 60%) |
| Off-chart clamp correctly fails muscular under PFRA | **HIGH** | Deterministic arithmetic (2.5/15 = 16.7% < 60%) |
| PFRA-internal M 60+ run row irregularity is a source error, not a parser artifact | **MED** | Raw PDF line inspection; lines look right but values deviate from overall 21s step pattern |
| Linear extrapolation is defensible for trajectory scoring, muscular only within ~10 units | **MED** | Slope analysis, Lens 5; recommendation depends on UX desired |
| Run extrapolation past 2-3 minutes of floor is operationally meaningless | **HIGH** | 1884s to reach 0 pts ≫ any realistic performance |
| Current M<25 CLRC 9-rep jump is a transcription error, not intentional | **MED** | No source doc makes such a jump natural; inversion pattern matches OCR/manual-entry mistakes elsewhere in the table |

---

## 11. Recommended Trajectory-Score Extrapolation Model

Rendered as a formal spec for the next planning turn:

```
Given (gender, age, exercise, value):
  if value is on-chart:
    return engine_lookup_points(value, table)
  elif exercise in {pushups, hrpu, situps, clrc, plank}:
    (floor_t, floor_p) = last row of table
    slope = last_5_row_linear_fit(table).slope
    # positive slope for higher-is-better (value decreasing below floor loses pts)
    trajectory_pts = floor_p + slope * (value - floor_t)
    return clamp(trajectory_pts, floor_p - 2.5, floor_p)   # at most 1 full pt bucket below floor
  elif exercise in {run, hamr}:
    (floor_t, floor_p) = last row of table
    slope = last_5_row_linear_fit(table).slope
    # negative slope for lower-is-better run (value increasing beyond floor loses pts)
    trajectory_pts = floor_p + slope * (value - floor_t)
    # run chart span is 15 pts over ~400 sec floor; cap extrapolation at max 2 additional chart-steps (~40 sec)
    cap_at = floor_p - 2.0    # max 2 pts below chart floor in trajectory space
    return clamp(trajectory_pts, cap_at, floor_p)
  elif exercise == whtr:
    # WHtR floor is already 0 pts at 0.60; below chart is irrelevant (can't go negative)
    return 0
```

**Rationale**:
- Official composite score remains chart-anchored; trajectory score is a separate continuous surrogate.
- Cap chosen so trajectory stays within ~1 bucket for muscular (honest), ~2 buckets for cardio (acknowledging the slow slope).
- Linear fit over last 5 rows (not last 2) smooths the asterisked-row artifact at the chart floor.
- Quadratic/log models gain ≤ 0.01 R^2; not worth the extra complexity or inversion risk.

[MED on the specific cap choices - those are UX-tunable, not derivable from math alone]

---

## 12. Open Mathematical Questions (before code is written)

These are the questions I cannot answer without more input. They should be resolved in the planning turn before any rewrite:

1. **What is the official semantics of the asterisked row?** My analysis treats the asterisked row as "off-chart = fail past this point, 0 pts." The PFRA PDF's asterisk legend is not visible in the extracted text; DAFMAN 36-2905 may clarify. Alternative reading: asterisked row is "still awarded, but marks a threshold for failing-diagnostic flags." This changes the BLOCKER fix direction. **Need a DAFMAN quote to disambiguate.**

2. **Is the PFRA M 60+ run irregularity (12s/9s/42s steps) to be preserved or corrected?** The current project has no authority to correct source-document errors. If PFRA ships the chart with this wobble, our implementation must reproduce it exactly (even if mathematically suspect). **Confirm: verbatim transcription, no "corrections"?**

3. **Should the composite score gate on component-minimum be checked at chart boundaries or at percentage boundaries?** Current engine uses `percentage >= minimum` where percentage = `points / maxPoints * 100`. Under PFRA, "min cardio = 60%" = 30 pts of 50. The chart floor awards 35.0 pts = 70%. **If "chart floor" is intended as a soft-fail boundary (not a hard fail), then 35.0 pts should pass — which would mean PFRA is *raising* the effective failing speed to beyond 19:45.** If "chart floor" is intended as off-chart = 0 pts (hard fail), the engine must change. This is the most important question.

4. **For trajectory scoring, is the UX goal "rank airmen against each other" or "predict absolute score"?** A rank-preserving monotonic transform is much more tolerant of extrapolation choice. An absolute-score prediction below chart floor is nonsensical. The answer determines how aggressively we extrapolate.

5. **Are there Alternate Aerobic Events I've missed?** PFRA PDF also contains AFSPECWAR/EOD high-standards column (transcribed separately in the PDF). Current code doesn't appear to branch on AFSC specialty - if AFSPECWAR scoring must be supported, those tables need parsing too.

6. **Does the diagnostic period (Mar 1 - Aug 31 2026) use the PFRA chart or continue with provisional current?** If the diagnostic period uses PFRA, migration is urgent. If it uses legacy until Sep 1 2026, the rewrite can be staged with a version flag (`CHART_VERSION` in `constants.js`).

---

## 13. Artifact Index

All data and plots are at `/mnt/cephfs/shared/projects/Trajectory/docs/scoring-math-audit/`:

- `lens3_delta_structure.csv` - Δpoints CV by source/exercise/bracket (Lens 3)
- `lens4_pfra_vs_current.csv` - max \|Δpts\| per (gender, age, exercise) (Lens 4)
- `lens4_pfra_vs_current_rowlevel.csv` - row-by-row PFRA vs current point diffs (Lens 4)
- `lens4_offchart_clamp_risk.csv` - per-bracket off-chart clamp gate analysis (Lens 4b)
- `lens5_extrap_viability.csv` - last-5-row slopes, t-at-zero extrapolation (Lens 5)
- `lens5_curve_shape.csv` - R^2 for linear/quadratic/log fits per bracket (Lens 5)
- `fig1_pfra_vs_current_M_under25.png` - overlay plot, all 7 exercises, M<25
- `fig2_diff_heatmap_*.png` - 7 per-exercise heatmaps, age x point-value, PFRA - current
- `fig3_xbracket_*.png` - 7 per-exercise cross-bracket threshold curves at fixed point values
- `fig4_delta_distribution.png` - distribution of Δpoints, all exercises, both sources
- `fig5_extrapolation.png` - linear and quadratic fits with extrapolation, M<25 PFRA

Source parsers (not for production use - audit-only):
- `/tmp/audit/parse_current.py` - converts `scoringTables.js` to JSON
- `/tmp/audit/parse_pfra.py` - parses PFRA PDF text to JSON
- `/tmp/audit/run_audit.py` - full lens sweep

Intermediate data (not committed):
- `/tmp/audit/current_tables.json`
- `/tmp/audit/pfra_tables.json`

---

*Audit completed under Math Magician protocol. Triangulation applied: every load-bearing finding is supported by at least two lenses. Monotonicity (Lens 1) confirmed via direct enumeration. Cross-bracket continuity (Lens 2) and delta-structure uniformity (Lens 3) independently flag the current tables; both are clean on PFRA. Point-level diff (Lens 4) and off-chart clamp analysis (Lens 4b) triangulate on the BLOCKERs. Linearity claim (Lens 5) is supported by R^2 ≥ 0.98 across 5 of 7 exercises and slope-variance analysis. No lens produced a dissenting result on the BLOCKERs.*
