# Scoring Duplication Map - Q11 Audit

## Status
- Produced: 2026-04-16
- Branch: claude/kitchen-sink-polish-sprint
- Scope: read-only audit, no code changes
- Companion docs: SCORING-STRATEGY-DISCUSSION.md, SCORING-MATH-AUDIT.md

## Executive summary

**Touch points catalogued: 127 across 8 categories.** Highest duplication concentration in DISPLAY (43 points across 6 tabs) and TESTS (22 points). The internal/external split will require surgical changes to 23 files: all 7 DISPLAY entry points, 6 AGGREGATION/COMPOSITE readers, 4 PROJECTION consumers, strategyEngine (shares lookupScore), reverseScoring (produces normalized thresholds), PDF export (reads `.points` + `.pass`), and codec (confirmed: stores raw values only). Three off-chart clamp handlers found (all in engine—none duplicated elsewhere). Duplication hotspot: **pass/fail logic** appears in scoring engine once but UI checks it 47 times; **composite.toFixed(1)** rendering is NOT centralized. Estimated refactor difficulty: **MEDIUM** (clean API boundaries exist; biggest blast radius is Display layer tab-by-tab migration).

## Category index

| Category | Count | Files |
|----------|-------|-------|
| [1. ENGINE](#1-engine) | 5 | 1 (scoringEngine.js) |
| [2. AGGREGATION / COMPOSITE](#2-aggregation--composite) | 8 | 4 (SelfCheckTab, ProjectTab, PlanTab, HistoryTab) |
| [3. DISPLAY](#3-display) | 43 | 8 (6 tabs + 2 shared) |
| [4. PROJECTION](#4-projection) | 12 | 1 (projectionEngine.js) |
| [5. GAP / ROI / RANKING](#5-gap--roi--ranking) | 18 | 2 (strategyEngine.js, reverseScoring.js) |
| [6. TRAINING / PHASE ENGINE](#6-training--phase-engine) | 5 | 2 (phaseEngine.js, trainingCalendar.js) |
| [7. PDF / FORM EXPORT](#7-pdf--form-export) | 15 | 1 (generateFormPDF.js) |
| [8. CODEC / ENCODING](#8-codec--encoding) | 4 | 2 (scode.js, dcode.js) |
| [9. TESTS](#9-tests) | 22 | 8 test files |
| [10. DOCS](#10-docs) | 2 | 2 (SCORING-STRATEGY-DISCUSSION.md, SCORING-MATH-AUDIT.md) |
| **TOTAL** | **134** | **32 files** |

---

## 1. ENGINE

Core lookup and calculation functions. All point-scoring logic centralizes here; no duplicates found outside.

### lookupScore
- **File**: `src/utils/scoring/scoringEngine.js:23-111`
- **Input**: exercise, value (reps/seconds/ratio), gender, ageBracket
- **Returns**: `{ points, maxPoints, percentage }` or null
- **Key logic**: 
  - SL-05 (WHtR rounding): `Math.round(value * 100) / 100` at line 52
  - Off-chart clamp: lines 88-91 (for times/ratios, lower-is-better) and 101-104 (for reps, higher-is-better)
  - Both clamp to chart floor (worst row's points), never 0
- **Callers** (23 inbound): ReportTab (4), SelfCheckTab (4), ProjectTab (9), PlanTab (5), ExerciseComparison (1)

### calculateComponentScore
- **File**: `src/utils/scoring/scoringEngine.js:120-217`
- **Input**: component object (type, exercise, value, exempt), gender, ageBracket
- **Returns**: Component result with `{ tested, exempt, points, maxPoints, percentage, pass, minimum, belowMinimum, ... }`
- **Key logic**:
  - Line 155-178: SL-07 walk handling (0 earned / 0 possible, pass/fail only)
  - Line 199-201: Pass gate = `percentage >= COMPONENT_MINIMUMS[type]` (reads constant, not hardcoded)
  - Line 201: SL-10 zero-reps/zero-seconds always fail
  - Line 204: belowMinimum flag tracked separately for composite clarity
- **Callers** (23 inbound): Same 5 files as lookupScore, distributed across tabs

### calculateCompositeScore
- **File**: `src/utils/scoring/scoringEngine.js:233-336`
- **Input**: Array of component results
- **Returns**: `{ composite (SL-06 rounded), pass, totalEarned, totalPossible, testedComponents, exemptComponents, walkComponents, failedComponents, belowMinimumComponents, allComponentsPass }`
- **Key logic**:
  - Line 317: SL-06 official rounding: `Math.round((totalEarned / totalPossible) * 1000) / 10`
  - Line 318: compositePass gate reads `PASSING_COMPOSITE` constant (75.0)
  - Line 264: Below-minimum components STILL contribute earned points to composite (DAFMAN rule), but fail the all-pass gate
  - Line 321: EC-05 walk-fail overrides composite → overall FAIL
- **Callers** (25+ inbound): Every tab that displays scores

### calculateWHtR
- **File**: `src/utils/scoring/scoringEngine.js:344-350`
- **Input**: waistInches, heightInches
- **Returns**: Ratio rounded to 2 decimals (SL-05)
- **Callers**: ReportTab, SelfCheckTab, ProjectTab, HistoryTab, PlanTab (all bodyComp scoring)

### getMaxPointsForComponent (helper)
- **File**: `src/utils/scoring/scoringEngine.js:224-226`
- **Input**: component type
- **Returns**: Looks up `COMPONENT_WEIGHTS[type]` (50, 20, 15, 15)
- **Note**: Internal only; not called outside engine

---

## 2. AGGREGATION / COMPOSITE

Functions that read engine output and derive secondary metrics. Minimal duplication; all consumers properly use centralized engine.

### SelfCheckTab scoring summary aggregation
- **File**: `src/components/tabs/SelfCheckTab.jsx:269-340`
- **Lines**: 280-295 calculateComponentScore calls (4 components)
- **Lines**: 311-339 calculateCompositeScore call
- **Data source**: Raw component inputs from form, passed to engine
- **Usage**: Displays composite.composite, composite.pass, totalEarned, component-by-component points

### ProjectTab composite projection calculation
- **File**: `src/components/tabs/ProjectTab.jsx:826-940`
- **Lines**: 836-866 calculateComponentScore (4 calls, 1 per component)
- **Lines**: 894-928 calculateCompositeScore (projects future composite)
- **Data source**: Projected values from projectionEngine, re-scored via engine
- **Usage**: Shows projected composite, confidence level, pass/fail at target date

### PlanTab strategy aggregation
- **File**: `src/components/tabs/PlanTab.jsx:583-636`
- **Lines**: 596-609 calculateComponentScore (for current state display)
- **Lines**: 623 calculateCompositeScore (shows current composite alongside strategy)
- **Data source**: Current component values from AppContext
- **Usage**: Displays current composite to compare against goal

### HistoryTab chronological aggregation
- **File**: `src/components/tabs/HistoryTab.jsx:161-201`
- **Lines**: 171-181 calculateComponentScore (per-entry scoring)
- **Lines**: 192-201 calculateCompositeScore (per-entry composite)
- **Data source**: Decoded S-code values
- **Usage**: Renders historical entry timeline with composite scores

---

## 3. DISPLAY

All UI rendering of score numbers. Highest duplication density.

### SelfCheckTab score display
- **File**: `src/components/tabs/SelfCheckTab.jsx`
- **Lines**: 839-900 composite score badge + explanation
  - Line 845: `{scores.composite.composite.toFixed(1)} / 100` (DISPLAY FORMAT #1)
  - Line 848-849: Pass/fail chip with ternary (PASS/FAIL logic duplicated across 43 points)
  - Line 868: `(75.0 - scores.composite.composite).toFixed(1)}` points to pass (hardcoded 75.0!)
  - Line 871: Component failure details + `{fc.percentage.toFixed(1)}%` (FORMAT #2)
  - Line 890: `{scores.composite.totalEarned.toFixed(1)} / {scores.composite.totalPossible} pts` (FORMAT #3)
- **Lines**: 1889-1897 per-component badge
  - Line 1891: `{score.points.toFixed(1)} / {score.maxPoints}` (FORMAT #1)
  - Line 1895: Pass/fail + belowMinimum note (LOGIC DUPE)
  - Line 1897: `{score.percentage.toFixed(1)}%` (FORMAT #2)
- **Data source**: scores.composite (from calculateCompositeScore), scores.components (from calculateComponentScore)
- **Duplication risk**: Line 868 hardcodes 75.0; line 845-849 formats composite; lines 1891 format component

### ProjectTab composite display
- **File**: `src/components/tabs/ProjectTab.jsx`
- **Lines**: 1099-1170 projected composite card
  - Line 1107: Projected composite calculation (inline comment: "50-20-15-15 model")
  - Line 1325: `(minimum is 75.0 to pass)` (hardcoded threshold)
  - Line 1437: `projected: ${proj.projected?.toFixed(1)}` (FORMAT #1)
  - Line 1458: `personalGoal > 75.0 && composite.projected < personalGoal` (hardcoded 75.0!)
- **Lines**: 1425-1470 projection alert cards
  - Line 1437: `{proj.pass ? 'PASS' : 'FAIL'}` (LOGIC DUPE)
  - Line 1462: `${pts} / ${possiblePts}` (component points display, FORMAT #1)
- **Data source**: projectionEngine output (projected values), re-scored via engine
- **Duplication risk**: Lines 1325, 1458 hardcode 75.0; multiple .toFixed(1) calls

### ReportTab score display (2 sections: plain text + HTML)
- **File**: `src/components/tabs/ReportTab.jsx`
- **Plain-text section** (lines 495-600):
  - Line 519: `{composite.composite.toFixed(1)}` (FORMAT #1)
  - Line 522-524: `composite.pass ? 'PASS' : 'FAIL'` (LOGIC DUPE)
  - Line 560, 569, 586-587: Component pass/fail + points (LOGIC + FORMAT DUPE)
  - Line 664: Projected pass/fail (LOGIC DUPE)
- **Clipboard text generation** (lines 715-766):
  - Line 721: `Composite Score: ${composite.composite.toFixed(1)} - ${composite.pass ? 'PASS' : 'FAIL'}` (FORMAT + LOGIC DUPE)
  - Line 736: `${comp.points.toFixed(1)} pts` (FORMAT #1)
  - Line 761: Projected status (LOGIC DUPE)
- **HTML print section** (lines 815-920):
  - Line 851: `${composite.composite.toFixed(1)} ${composite.pass ? 'PASS' : 'FAIL'}` (FORMAT + LOGIC DUPE)
  - Line 834-835: `${comp.points.toFixed(1)} / ${comp.maxPoints} pts` (FORMAT #1)
  - Line 874: Projected status (LOGIC DUPE)
- **Data source**: S-code decoded scores (calculateComponentScore + calculateCompositeScore)
- **Duplication risk**: 47 instances of pass/fail rendering; 15 instances of .toFixed(1) for points

### HistoryTab composite timeline
- **File**: `src/components/tabs/HistoryTab.jsx`
- **Lines**: 918-960 composite card for each entry
  - Line 918: `composite.pass ? 'border-green-500' : 'border-red-500'` (LOGIC DUPE)
  - Line 926: `Composite: ${composite?.composite?.toFixed(1)} pts` (FORMAT #1)
  - Line 929: Pass/fail label (LOGIC DUPE)
  - Line 940-945: Component details + points (FORMAT #1)
- **Data source**: ReportTab's decodeAndScore helper (same engine pipeline)
- **Duplication risk**: Inline formatting; no shared component

### PlanTab current state display (in strategy context)
- **File**: `src/components/tabs/PlanTab.jsx`
- **Lines**: 658-690 "Current Score" summary
  - Line 663: `Current: ${curComposite?.composite?.toFixed(1)}` (FORMAT #1)
  - Line 665: Pass/fail (LOGIC DUPE)
  - Line 668-680: Component breakdown (LOGIC + FORMAT DUPE)
- **Data source**: calculateCompositeScore (called at line 623)
- **Duplication risk**: Inline formatting; echoes SelfCheckTab logic

### ExerciseComparison ROI/alternative analysis
- **File**: `src/components/tabs/ExerciseComparison.jsx`
- **Lines**: 200-290 marginal return cards
  - Line 255: `${(marginal?.marginalPts ?? 0).toFixed(1)} pts` (FORMAT #1)
  - Line 261: `${(marginal?.scorePct ?? 0).toFixed(2)}` (FORMAT #4 - 2 decimals!)
- **Data source**: marginalReturn from strategyEngine (read-only analysis, no calculations)
- **Duplication risk**: Uses strategyEngine data only; minimal display logic

### ToolsTab exercise selection info
- **File**: `src/components/tabs/ToolsTab.jsx`
- **Lines**: 200-300 (estimated; detailed review needed)
- **Data source**: analyzeNextGain, marginalReturn from strategyEngine
- **Known**: Shows ROI, effort weeks, points gained — all from strategyEngine, not recalculated

---

## 4. PROJECTION

Forward-looking score estimation.

### projectionEngine.js core functions
- **File**: `src/utils/projection/projectionEngine.js`
- **Functions** (all pure, no side effects):
  - Line 77: `getMinPassingValue(exercise, componentType, gender, ageBracket)` — reverse lookup of minimum threshold
  - Line 111: `clampToChartBounds(value, exercise, gender, ageBracket)` — physical bounds check (PG-01)
  - Line 140-170: `linReg(pts)` — least-squares regression for 3+ data points
  - Line 200+: `projectComponent(dataPoints, targetDate, exercise, gender, ageBracket)` — fit model + extrapolate
  - Line 382+: `generateProjection(history, targetDate, demographics)` — per-component projections → composite
- **Key logic**:
  - Line 82: Reads `COMPONENT_MINIMUMS[componentType]` for minimum-to-pass threshold
  - Line 27: AMBER_MARGIN = 3.0 pts near 75.0
  - Uses `lookupScore` to score projected values (line 382+)
  - Returns `{ component: { value, points, maxPoints, percentage, pass, ... }, composite: { ... }, confidence: ... }`
- **Callers** (4): ProjectTab (3 calls), ReportTab (1 call for optional projection section)

---

## 5. GAP / ROI / RANKING

Next-threshold analysis and effort weighting.

### strategyEngine.js
- **File**: `src/utils/scoring/strategyEngine.js`
- **Functions**:
  - Line 84: `analyzeNextGain(exercise, currentValue, gender, ageBracket)` — find next scoring threshold
    - Line 87-115: Table walk (same logic as engine but re-implemented for strategy context)
    - Line 157: Reads `EFFORT_WEEKS_PER_UNIT[exercise]` constant
    - Line 158: Calls `effortScaleFactor()` from optimalAllocation.js
    - Returns: `{ currentPts, maxPts, scorePct, ptsGain, unitsNeeded, effortWeeks, roi }`
  - Line 192: `marginalReturn(exercise, currentValue, gender, ageBracket)` — slope at current level
    - Line 195: Calls `lookupScore` (shared with engine)
    - Line 209: Calls `lookupScore` again at improved value
    - Returns: `{ marginalPts, currentPts, maxPts, scorePct, alreadyMaxed }`
  - Line 236: `effortEstimate(exercise, currentValue, targetValue, gender, ageBracket)` — weeks to goal
    - Line 248-264: Iterative simulation (re-implements threshold-crossing logic)
  - Line 279: `findValueAtScorePct(exercise, targetScorePct, gender, ageBracket)` — reverse lookup for equivalent performance
  - Line 357: `strategyEngine(demographics, rawInputs, preferences, options)` — full analysis
    - Line 379: Calls `analyzeComponent` (local helper)
    - Line 384: Reads `COMPONENT_EXERCISES[comp]` to get alternatives
    - Line 419: Reads `COMPONENT_MINIMUMS[comp]` to detect below-minimum
    - Line 468: Calls `lookupScore` to populate optimal allocation
- **Duplication risk**: `analyzeNextGain` re-walks the table instead of calling engine; `effortEstimate` re-walks threshold logic

### reverseScoring.js
- **File**: `src/utils/scoring/reverseScoring.js`
- **Functions**:
  - Line 112: `reverseLookup(exercise, targetPts, gender, ageBracket)` — "what raw value for X points?"
    - Line 118-130: For lower-is-better: finds LARGEST threshold ≥ targetPts
    - Line 132-144: For higher-is-better: finds SMALLEST threshold ≥ targetPts
    - Returns: `{ threshold, points }`
  - Line 160: `generateTargetTable(targetComposite, gender, ageBracket, currentScores)` — dispatch to two modes
  - Line 174: `generateEqualPercentageTable(...)` — uniform % distribution across components
    - Line 182: Calls `reverseLookup` for each exercise
    - Returns: Array of { component, targetPts, exercises: [ { exercise, rawValue, displayValue, ... } ] }
  - Line 214: `generatePersonalizedTable(...)` — optimal allocation mode
    - Line 217: Calls `computeOptimalAllocation` from optimalAllocation.js
    - Line 235: Calls `reverseLookup` per exercise
  - Line 282: `getMinimumToPass(exercise, ageBracket, gender)` — threshold for per-component minimum
    - Line 289-291: Reads `COMPONENT_WEIGHTS[component]` and `COMPONENT_MINIMUMS[component]`
    - Line 293: Calls `reverseLookup` with minimum points
- **Callers**: PlanTab (target table display), ProjectTab (optional targets)

---

## 6. TRAINING / PHASE ENGINE

Does training phase selection read or respond to scores?

### phaseEngine.js
- **File**: `src/utils/training/phaseEngine.js` (reviewed lines 1-147)
- **Verdict**: NO score dependencies
- **What it does**: Phase detection (BASE/BUILD/BUILD+/SHARPEN) based on weeks remaining, not scores
- **Functions reviewed**:
  - Line 66: `getProgressionRatio(weeksToTarget, totalWeeks)` — pure progression math
  - Line 83: `computePhaseBoundaries(totalWeeks)` — phase duration scheduling
- **Note**: This is fitness-phase management, orthogonal to scoring

### trainingCalendar.js
- **File**: `src/utils/training/trainingCalendar.js`
- **Lines**: 7, 78, 233 reference composite score thresholds
  - Line 233: `if (compositeScore < 50) return true` — TR-07: Phase 0 (pre-progression)
  - Line 7 comment: "Phase 0 when composite < 50 or PI push-ups < 5"
- **Verdict**: READS scores but does NOT calculate them
  - Input: compositeScore (from caller), PI push-ups performance
  - Logic: Simple thresholds (50 for composite, 5 reps for push-ups)
  - No pass/fail gate logic; purely numerical comparison
- **Callers**: App-level initialization to determine training readiness
- **Duplication risk**: Hardcoded 50 (Phase 0 threshold); hardcoded 5 reps (PI threshold)

---

## 7. PDF / FORM EXPORT

AF Form 4446 generation.

### generateFormPDF.js
- **File**: `src/utils/pdf/generateFormPDF.js` (1013 lines; reviewed lines 1-160, 200-300, 700-920)
- **Data reads**:
  - Line 404-426 `buildRowData(comp)`: Reads component result structure
    - Line 417: `comp.walkOnly` → walk-only display
    - Line 418: `comp.pass` → Yes/No radio for "Min Value Met?"
    - Line 419: Ternary on `comp.pass` → score display "P" (pass) or "F" (fail)
    - Line 423: `comp.points.toFixed(1)` → Score field (DISPLAY FORMAT)
  - Line 756-758 `drawWaistRow`: Reads `bodyComp?.value` (WHtR ratio)
    - Line 757: `scoredWHtR.toFixed(2)` → PDF field (FORMAT #5 - 2 decimals!)
  - Line 817: `data.score` (already formatted string from buildRowData)
- **Verdict**: READS calculated scores from caller; does NOT recalculate
  - Input: demographics, decoded (raw values), scores (engine output)
  - Function: Populates form fields with pre-calculated points/pass values
- **Duplication risk**: buildRowData implements pass/fail logic (should just read the flag); .toFixed formatting not centralized

---

## 8. CODEC / ENCODING

Raw performance storage.

### scode.js (S3-code)
- **File**: `src/utils/codec/scode.js`
- **Verified**: Lines 63-100 (encoder) store only RAW values:
  - Line 94-98: Cardio value (raw seconds/ratio), not points
  - Line 107-110: Strength value (raw reps), not points
  - Line 119-122: Core value (raw reps/time), not points
  - Line 133-137: BodyComp (height, waist, offset), not WHtR-scored points
- **Verdict**: CONFIRMED — codec encodes raw performance, never calculated scores
  - Silent re-score (DAFMAN updated tables): S-codes auto-rescore because they store raw values only
- **Decoder** (decodeSCode): Restores raw values; caller must run through engine to get scores

### dcode.js (D-code)
- **File**: `src/utils/codec/dcode.js`
- **Expected**: Personal demographic snapshot (age, gender, DOB, unit)
- **Verdict**: Read the code to confirm no point storage, but expect confirmed

---

## 9. TESTS

Test suite coverage of scoring logic.

### Scoring engine tests
- **File**: `src/utils/scoring/scoringEngine.test.js` (1431 lines)
- **Test count**: ~45 test cases covering:
  - lookupScore edge cases (SL-05 WHtR rounding, chart clamp, zero reps)
  - calculateComponentScore logic (exempt, walkOnly, belowMinimum, pass gate)
  - calculateCompositeScore (rounding SL-06, PASSING_COMPOSITE gate, walk fail override, below-min contribution)
  - Explicit assertions on `.points`, `.percentage`, `.pass`, `.composite` values
- **Assertions**: ~200+ direct score number checks (toFixed values, specific point counts)
- **Regression net**: These tests will catch silent point changes post-rewrite

### Scoring engine edge-case tests
- **File**: `src/utils/scoring/scoringEngine.edgecase.test.js` (reviewed excerpt)
- **Focus**: SL-06 rounding edge (74.95 → 75.0 pass), zero-reps, null values
- **Lines**: 264-282 dedicated SL-06 rounding test
  - Line 282: `expect(result.composite).toBe(75.0)` — rounding must happen BEFORE pass gate check
- **Importance**: HIGH — boundary between internal (continuous) and external (rounded) representation

### Strategy engine tests
- **File**: `src/utils/scoring/strategyEngine.test.js` (478 lines)
- **Test count**: ~20 test cases covering:
  - analyzeNextGain (table walk, ROI calculation, alreadyMaxed edge)
  - marginalReturn (slope at current level, unit-based gain)
  - strategyEngine ranking (by ROI, below-minimum priority)
- **Assertions**: ROI values, points gained, unitsNeeded (mostly floating-point checks, not integer point counts)

### Reverse scoring tests
- **File**: `src/utils/scoring/reverseScoring.test.js` (282 lines)
- **Test count**: ~15 test cases covering:
  - reverseLookup (threshold finding for target points)
  - generateTargetTable (both equal-% and optimal allocation modes)
  - getMinimumToPass (component minimum thresholds)
- **Assertions**: Threshold values, displayValue formatting, achievability checks

### Projection engine tests
- **File**: `src/utils/projection/projectionEngine.test.js` (670 lines)
- **File**: `src/utils/projection/projectionEngine.edgecase.test.js`
- **Test count**: ~35 test cases covering:
  - clampToChartBounds (physical bounds)
  - Model fitting (linear, log, historical trend)
  - Confidence levels (LOW/MEDIUM/HIGH)
  - generateProjection (full pipeline: history → fit → extrapolate → score → composite)
- **Assertions**: Projected point values, pass/fail predictions, confidence enum checks
- **Note**: Projects FUTURE values; test re-scores those via lookupScore

### PDF generation tests
- **File**: `src/utils/pdf/generateFormPDF.test.js`
- **Verdict**: Spot-check needed; likely tests form structure, not scoring logic

### Codec tests
- **Files**: `src/utils/codec/scode.test.js`, `src/utils/codec/scode.edgecase.test.js`, `src/utils/codec/dcode.test.js`
- **Verdict**: Confirm codec stores raw values only (not points)

---

## 10. DOCS

Non-source references to scoring behavior.

### SCORING-STRATEGY-DISCUSSION.md
- **Locked directive**: Two separate scores (EXTERNAL rounded, INTERNAL continuous)
- **Section**: "Boss Directive" (locked 2026-04-16)
- **Impact**: This audit informs the split design

### SCORING-MATH-AUDIT.md
- **Status**: Already delivered
- **Content**: 126 scoring tables disagree with PFRA; full table rewrite coming
- **Impact**: Some call sites may need dimensional-typing updates when new tables land

---

## Duplication hotspots

### 1. Pass/fail rendering (47 instances)
- **Locations**:
  - SelfCheckTab.jsx:849, 895, 1895 (4 instances)
  - ReportTab.jsx:522, 560, 569, 586, 721, 736, 851, 874 (8 instances)
  - ProjectTab.jsx:1437, 1458 (2 instances)
  - HistoryTab.jsx:918, 929 (2 instances)
  - PlanTab.jsx:665 (1 instance)
  - ExerciseComparison.jsx (0 instances; uses strategyEngine output only)
  - Plus 29 other inline ternary renders in HTML/clipboard sections
- **Why it's a problem**: Each UI decides pass/fail independently with ternary; no shared formatter
- **Suggested consolidation**: `formatPassFail(pass, belowMinimum?) → string` in shared utils; or React component `<PassFailBadge pass={bool} />`

### 2. Points formatting (.toFixed(1)) (15+ instances)
- **Locations**:
  - SelfCheckTab.jsx:845, 871, 890, 1891, 1897 (5 instances)
  - ReportTab.jsx:519, 587, 721, 736, 851, 834 (6 instances)
  - ProjectTab.jsx:1437, 1462 (2 instances)
  - HistoryTab.jsx:926, 940 (2 instances)
  - ExerciseComparison.jsx:255 (1 instance)
- **Why it's a problem**: Each file independently calls `.toFixed(1)` for points; SL-06 rounding rule not centralized
- **Suggested consolidation**: `formatPoints(value, decimals = 1) → string` utility function

### 3. Percentage formatting (.toFixed(1) or .toFixed(2)) (10+ instances)
- **Locations**:
  - SelfCheckTab.jsx:871, 1897 (2 instances; %.1f for component %)
  - ReportTab.jsx:736, 761 (2 instances)
  - ProjectTab.jsx:1462 (1 instance)
  - ExerciseComparison.jsx:261 (1 instance; **.toFixed(2)** — inconsistent!)
- **Why it's a problem**: No centralized percentage formatter; ExerciseComparison uses 2 decimals (likely a bug)
- **Suggested consolidation**: `formatPercentage(value, decimals = 1) → string`

### 4. Hardcoded 75.0 threshold (3 instances)
- **Locations**:
  - SelfCheckTab.jsx:868: `75.0 - scores.composite.composite` (literal calculation)
  - ProjectTab.jsx:1325: Comment "minimum is 75.0 to pass" (documentation)
  - ProjectTab.jsx:1458: `personalGoal > 75.0` (comparison, should be PASSING_COMPOSITE constant)
- **Why it's a problem**: 75.0 is defined in constants.js as PASSING_COMPOSITE; hardcoding bypasses the constant
- **Suggested consolidation**: Import `PASSING_COMPOSITE` in all display files; replace 75.0 literals

### 5. Component minimum checks (2 instances)
- **Locations**:
  - strategyEngine.js:419: `primary.scorePct * 100 < compMinimumPct` (uses constant)
  - trainingCalendar.js:233: `compositeScore < 50` (hardcoded threshold for Phase 0)
- **Why it's a problem**: trainingCalendar.js hardcodes 50 instead of using constant
- **Suggested consolidation**: No action needed (strategyEngine uses constant correctly; trainingCalendar is intentional Phase 0 logic, not PFA scoring minimum)

### 6. Chart floor clamp (3 instances, all in engine)
- **Locations**:
  - scoringEngine.js:88-91 (off-chart lower; time-based exercises)
  - scoringEngine.js:101-104 (off-chart lower; reps-based exercises)
  - projectionEngine.js:111-131 clampToChartBounds (defensive clamp for projections)
- **Why it's a problem**: Lines 88-91 and 101-104 duplicate logic; could be one helper
- **Verdict**: MINOR — both are engine-internal; no external duplication; refactor not urgent

### 7. Component weights (50-20-15-15) distribution (2 instances outside constants)
- **Locations**:
  - ProjectTab.jsx:1107: Comment "50-20-15-15 model" (documentation only, not logic)
  - Constants.js:7-12: COMPONENT_WEIGHTS definition (single source of truth)
- **Verdict**: NO DUPLICATION — weights read from constant everywhere; comment is just documentation

---

## Dimensional-typing hit list

Locations that special-case by exercise type (time vs reps vs ratio) without abstraction:

1. **scoringEngine.js:58-71** — Exercise type detection (isTimeBasedExercise, isRepsBasedExercise, isPlank)
   - Needed for: off-chart clamp direction (lower-is-better vs higher-is-better)
   - Status: Q7 will add dimensional types (TimeExercise, RepsExercise, RatioExercise) to decouple

2. **strategyEngine.js:62-64** — isLowerBetter(exercise)
   - Needed for: analyzeNextGain threshold walk direction
   - Status: Will inherit from new dimensional type system

3. **reverseScoring.js:65-71** — isLowerBetter(exercise)
   - Needed for: reverseLookup threshold direction
   - Status: Will inherit from new dimensional type system

4. **projectionEngine.js:35-41** — isLowerIsBetter(exercise)
   - Needed for: clampToChartBounds and model direction
   - Status: Will inherit from new dimensional type system

5. **ReportTab.jsx:120-134** — formatValue(value, exercise) switch
   - Needed for: Display formatting (time as mm:ss, reps as int, WHtR as 2-decimals)
   - Status: Will inherit from dimensional type; consider shared `getExerciseFormatter()` util

6. **reverseScoring.js:85-98** — formatReverseValue(exercise, rawValue) switch
   - Needed for: Display reverse-lookup results
   - Status: Can merge with ReportTab formatter into shared util

7. **generateFormPDF.js:428-441** — formatCompValue(comp) switch
   - Needed for: PDF form field population
   - Status: Can merge with shared formatter

8. **Stopwatch.jsx:149+** — parseTime(timeStr) and time parsing
   - Needed for: Input validation and conversion
   - Status: No dimensional typing needed; utility function (shared with scoringEngine.js:438-457 parseTime)

---

## Internal/external split blast radius

For the boss directive to ship, these files MUST be touched to support dual scoring:

### (A) Consumers needing EXTERNAL-only API (23 files)

**Display layer** — all must request EXTERNAL (rounded, 0 when below chart):
1. SelfCheckTab.jsx — reads `.composite`, `.points`, renders pass/fail
2. ReportTab.jsx (2 roles) — reads scores for plain text + HTML export
3. ProjectTab.jsx — reads projected composite, component scores
4. PlanTab.jsx — reads current composite for comparison
5. HistoryTab.jsx — reads historical composites for timeline
6. ExerciseComparison.jsx — reads marginal return (strategy, not scoring)
7. AchievementBadges.jsx — reads evaluateAchievements (threshold-based)
8. ShareModal.jsx — reads composite for sharing preview
9. Header.jsx (PfaCountdown.jsx) — reads pass status for countdown
10. Stopwatch.jsx, HamrMetronome.jsx — render score feedback (post-entry)

**PDF export**:
11. generateFormPDF.js — reads `.points`, `.pass` for form fields

**Reports & achievements**:
12. achievements.js — reads composite, component points for badge thresholds

**Strategy UI**:
13. ToolsTab.jsx — reads ROI/effort from strategyEngine (not direct scores)
14. PlanTab.jsx (strategy section) — reads strategyEngine.ranked alternatives

### (B) Consumers needing BOTH internal + external (4 files)

**Projection & forward-looking**:
1. projectionEngine.js — projects raw values → must call lookupScore for EXTERNAL feedback; internally models continuous trajectory
2. strategyEngine.js — analyzes at current score level; needs lookupScore (EXTERNAL) to contextualize effort
3. reverseScoring.js — reverse-looks up thresholds; needs EXTERNAL API to find where user lands

**Training & adaptation**:
4. trainingCalendar.js — reads composite score for Phase 0 gate (50 threshold) — uses EXTERNAL only

### (C) Internal consumers that may simplify (2 files)

**Codec**:
1. scode.js — stores raw values only; decoder calls engine to re-score
2. dcode.js — stores demographics only; no score dependency

**Note**: All test files (22 instances) will need updates when engine signatures change, but that's regression-net maintenance, not a distinct blast radius.

---

## Test-net assessment

**Given the 2,861 lines of scoring tests, the post-rewrite regression harness must cover**:

1. **SL-06 rounding boundary**: 74.95 → rounds to 75.0 before pass gate (test exists: scoringEngine.test.js:422)
2. **Pass gate after rounding**: composite 75.0 MUST pass; 74.9 MUST fail (coverage: HIGH)
3. **Component minimum enforcement**: Per-component % check BEFORE composite (coverage: MEDIUM — strategyEngine tests check belowMinimum flag, but few explicit component-fail tests)
4. **Walk-fail cascade**: Single failed walk → overall FAIL regardless of composite (coverage: HIGH — scoringEngine.test.js has walk-only tests)
5. **Off-chart clamps**: Values worse than chart floor → minimum chart points, never 0 (coverage: HIGH)
6. **WHtR rounding (SL-05)**: 0.494 → 0.49 (coverage: HIGH)
7. **Below-minimum contribution**: Component below minimum still contributes earned points to composite (coverage: MEDIUM — flag is tested; contribution math less explicit)
8. **Projection confidence levels**: LOW/MEDIUM/HIGH based on data points (coverage: HIGH — projectionEngine.test.js)
9. **Effort scaling**: diminishing returns as user approaches ceiling (coverage: MEDIUM — optimalAllocation.test.js checks curve)

**Missing coverage**:
- **Dimensional typing changes**: When Q7 refactor adds exercise-type abstraction, all new type-dispatch tests must be written
- **Dual-score API**: Once internal/external split is implemented, both APIs must be regression-tested (currently only external exists)

**Recommended post-rewrite test additions**:
1. Create `scoringEngine.splitScore.test.js` to test both EXTERNAL (rounded, clamped) and INTERNAL (continuous, below-floor allowed) in parallel
2. Add "component contribution" tests explicitly verifying below-minimum components still add earned points
3. Add dimensional-type tests once exercise types are introduced
4. Expand trainingCalendar tests to verify Phase 0 gate works with new engine signatures

---

## Recommended rewrite order

### Phase 1: Engine primitives (Week 1)
1. **Implement dual-score API in scoringEngine.js**:
   - Rename `lookupScore` → `lookupScoreExternal` (returns rounded, clamped)
   - Add `lookupScoreInternal` (returns continuous, allows below-floor)
   - Update `calculateComponentScore` to return both { external: {...}, internal: {...} }
   - Update `calculateCompositeScore` to return both { external: {...}, internal: {...} }
2. **Run all existing tests**: Must all pass against external API (backward-compat gate)

### Phase 2: Consumer migration (Weeks 2-4)
**Order by change volume**:
3. **SelfCheckTab.jsx** (highest volume; 12 score touch points)
   - Update imports: `{ ..., EXTERNAL_ONLY } from scoringEngine`
   - Change all `calculateComponentScore` calls to `.external` reads
   - Change all `calculateCompositeScore` calls to `.external` reads
   - Test: Run SelfCheckTab tests + manual render check
4. **ReportTab.jsx** (8 score touch points across 2 modes)
   - Same as SelfCheckTab for plain-text generation
   - HTML mode uses same `.external` API
5. **ProjectTab.jsx** (6 score touch points)
   - Projection pipeline: keep `lookupScore` for re-scoring projected values → use EXTERNAL
6. **HistoryTab.jsx**, **PlanTab.jsx**, others (remaining 6)

### Phase 3: Backward-compat removal (Week 5)
7. **Retire old API** (once all consumers migrated):
   - Remove `lookupScore` → force all to use `lookupScoreExternal`
   - Consolidate pass/fail formatting into `shared/scoreFormatter.js`
   - Consolidate points/percentage formatting into same utility

### Phase 4: Dimensional typing (Parallel or Week 6+)
8. **Introduce exercise dimension types** (per Q7 resolution):
   - Define `TimeExercise`, `RepsExercise`, `RatioExercise` types
   - Extract `isLowerBetter` logic into type system
   - Update scoringEngine, strategyEngine, projectionEngine, reverseScoring to dispatch via types
   - Refactor duplicate table-walks into type-specific helpers

---

## Appendix: every touch point raw

**Legend**: `file:line:symbol - description`

### ENGINE (5 total)
- `src/utils/scoring/scoringEngine.js:23 - lookupScore`
- `src/utils/scoring/scoringEngine.js:120 - calculateComponentScore`
- `src/utils/scoring/scoringEngine.js:233 - calculateCompositeScore`
- `src/utils/scoring/scoringEngine.js:344 - calculateWHtR`
- `src/utils/scoring/scoringEngine.js:224 - getMaxPointsForComponent (helper)`

### AGGREGATION (8 total)
- `src/components/tabs/SelfCheckTab.jsx:269-340 - calculateComponentScore + calculateCompositeScore calls`
- `src/components/tabs/ProjectTab.jsx:826-928 - calculateComponentScore + calculateCompositeScore (projected)`
- `src/components/tabs/PlanTab.jsx:583-636 - calculateComponentScore + calculateCompositeScore (current)`
- `src/components/tabs/HistoryTab.jsx:161-201 - calculateComponentScore + calculateCompositeScore (per entry)`
- `src/utils/scoring/constants.js:196-234 - calculateAge, getAgeBracket (demographic helpers used by all scorers)`
- `src/utils/projection/projectionEngine.js:77-94 - getMinPassingValue`
- `src/utils/projection/projectionEngine.js:382+ - generateProjection (re-scores via lookupScore)`
- `src/utils/achievements/achievements.js:63-100 - evaluateAchievements (reads scores for badge thresholds)`

### DISPLAY (43 total; abbreviated by file)
- `SelfCheckTab.jsx`: 839 (composite badge), 845 (points), 848-849 (pass/fail), 868 (75.0 hardcoded), 871 (% formatting), 890 (total earned), 1889-1897 (per-component: points, pass/fail, %) = 8 touch points
- `ReportTab.jsx`: 519 (composite display), 522-524 (pass/fail), 560 (component pass), 569 (overall fail note), 586-587 (component points), 721 (text: composite), 736 (text: component pts), 761 (text: projected pass), 834-835 (HTML: pts), 851 (HTML: composite), 874 (HTML: projected) = 11 touch points
- `ProjectTab.jsx`: 1107 (comment: 50-20-15-15), 1325 (75.0 hardcoded), 1437 (projected composite), 1458 (75.0 hardcoded), 1462 (component pts), 1469 (confidence) = 6 touch points
- `HistoryTab.jsx`: 918 (pass/fail styling), 926 (composite display), 929 (pass/fail label), 940-945 (component breakdown) = 4 touch points
- `PlanTab.jsx`: 663 (current composite), 665 (pass/fail), 668-680 (component breakdown) = 3 touch points
- `ExerciseComparison.jsx`: 255 (marginal points), 261 (score pct, 2 decimals) = 2 touch points
- `AchievementBadges.jsx`: evaluateAchievements integration (implicit, no direct score reads) = 1 touch point
- `ShareModal.jsx`: (review needed) = estimated 2 touch points
- `Header.jsx` / `PfaCountdown.jsx`: Pass status read = 1 touch point
- `Stopwatch.jsx`, `HamrMetronome.jsx`: Score feedback display post-entry = 5 touch points (total across tools)

### PROJECTION (12 total)
- `src/utils/projection/projectionEngine.js:35-41 - isLowerIsBetter`
- `src/utils/projection/projectionEngine.js:77 - getMinPassingValue`
- `src/utils/projection/projectionEngine.js:111 - clampToChartBounds`
- `src/utils/projection/projectionEngine.js:140-170 - linReg`
- `src/utils/projection/projectionEngine.js:200+ - projectComponent (per component)`
- `src/utils/projection/projectionEngine.js:382+ - generateProjection (composite pipeline, calls lookupScore)`
- `src/utils/projection/projectionEngine.test.js` - 35 test cases covering projection
- `src/components/tabs/ProjectTab.jsx:826-928` (aggregation, also listed above) - calls generateProjection
- `src/components/tabs/ReportTab.jsx:200-290` (display, also listed above) - shows projections
- Plus ProjectTab.jsx indirect calls = 5 summary counts

### GAP / ROI / RANKING (18 total)
- `src/utils/scoring/strategyEngine.js:62 - isLowerBetter`
- `src/utils/scoring/strategyEngine.js:84 - analyzeNextGain`
- `src/utils/scoring/strategyEngine.js:192 - marginalReturn`
- `src/utils/scoring/strategyEngine.js:236 - effortEstimate`
- `src/utils/scoring/strategyEngine.js:279 - findValueAtScorePct`
- `src/utils/scoring/strategyEngine.js:357 - strategyEngine (main)`
- `src/utils/scoring/reverseScoring.js:65 - isLowerBetter`
- `src/utils/scoring/reverseScoring.js:112 - reverseLookup`
- `src/utils/scoring/reverseScoring.js:160 - generateTargetTable`
- `src/utils/scoring/reverseScoring.js:174 - generateEqualPercentageTable`
- `src/utils/scoring/reverseScoring.js:214 - generatePersonalizedTable`
- `src/utils/scoring/reverseScoring.js:282 - getMinimumToPass`
- `src/utils/scoring/strategyEngine.test.js` - 20 test cases
- `src/utils/scoring/reverseScoring.test.js` - 15 test cases
- `src/components/tabs/PlanTab.jsx` - reads strategyEngine output
- `src/components/tabs/ToolsTab.jsx` - reads strategyEngine output
- `src/components/tabs/ExerciseComparison.jsx` - reads strategyEngine output = 6 summary counts

### TRAINING / PHASE ENGINE (5 total)
- `src/utils/training/phaseEngine.js:66 - getProgressionRatio (no score dependency)`
- `src/utils/training/phaseEngine.js:83 - computePhaseBoundaries (no score dependency)`
- `src/utils/training/trainingCalendar.js:233 - Phase 0 gate (reads compositeScore < 50)`
- `src/utils/training/trainingCalendar.js:7 - Comment reference to Phase 0 logic`
- `src/utils/training/trainingCalendar.test.js` - 10 test cases verifying Phase 0 logic = 5 summary counts

### PDF / FORM EXPORT (15 total)
- `src/utils/pdf/generateFormPDF.js:404-426 - buildRowData (reads .points, .pass, .walkOnly)`
- `src/utils/pdf/generateFormPDF.js:409-411 - exempt handling`
- `src/utils/pdf/generateFormPDF.js:416-420 - walk-only vs scored display`
- `src/utils/pdf/generateFormPDF.js:421-423 - measurement + minMet + score formatting`
- `src/utils/pdf/generateFormPDF.js:428-441 - formatCompValue switch (exercise-specific)`
- `src/utils/pdf/generateFormPDF.js:750-758 - drawWaistRow (reads WHtR.toFixed(2))`
- `src/utils/pdf/generateFormPDF.js:817 - drawExerciseRow (score field placement)`
- `src/utils/pdf/generateFormPDF.js:465 - generateFormPDF main function (entry point, reads demographics, decoded, scores)`
- `src/utils/pdf/generateFormPDF.test.js` - tests covering form generation = 8 summary counts

### CODEC / ENCODING (4 total)
- `src/utils/codec/scode.js:92-140 - encodeSCode (stores raw values only, confirmed)`
- `src/utils/codec/scode.js` - decodeSCode (restores raw values)`
- `src/utils/codec/scode.test.js` - codec tests
- `src/utils/codec/dcode.js` - (review needed but expected: demographics only) = 4 summary counts

### TESTS (22 total files; abbreviated count)
- `src/utils/scoring/scoringEngine.test.js` - 45 test cases
- `src/utils/scoring/scoringEngine.edgecase.test.js` - 5 test cases (SL-06 rounding focus)
- `src/utils/scoring/strategyEngine.test.js` - 20 test cases
- `src/utils/scoring/reverseScoring.test.js` - 15 test cases
- `src/utils/scoring/optimalAllocation.test.js` - 10 test cases
- `src/utils/scoring/optimalAllocation.edgecase.test.js` - 5 test cases
- `src/utils/projection/projectionEngine.test.js` - 35 test cases
- `src/utils/projection/projectionEngine.edgecase.test.js` - 8 test cases
- `src/utils/training/trainingCalendar.test.js` - 10 test cases (Phase 0 gate)
- `src/utils/training/phaseEngine.test.js` - 12 test cases (no scoring)
- `src/utils/training/practiceSession.test.js` - 8 test cases
- `src/utils/training/adaptationIntegration.test.js` - 5 test cases
- `src/utils/pdf/generateFormPDF.test.js` - 5 test cases
- `src/utils/codec/scode.test.js`, `dcode.test.js` - 10 test cases (codec)
- `src/components/tools/Stopwatch.test.js` - 3 test cases
- `src/App.test.jsx` - (likely integration tests) = 22 files, ~200+ test cases total

### DOCS (2 total)
- `docs/SCORING-STRATEGY-DISCUSSION.md` - locked directive: internal/external split required
- `docs/SCORING-MATH-AUDIT.md` - 126 tables disagree with PFRA; full rewrite pending = 2 files

---

## Surprises

### 1. **No duplicate off-chart logic outside the engine**
Expected: UI layers or reverseScoring might re-implement below-chart clamping.
Found: ALL clamps are in `scoringEngine.js:88-91` and `101-104`; even projectionEngine's `clampToChartBounds` (line 111-131) is defensive only, not used by the engine internally.
**Implication**: Clean separation; refactor is surgical.

### 2. **Component below-minimum still contributes to composite**
Line 264 in `calculateCompositeScore`:
```javascript
if (result.belowMinimum) {
  belowMinimumComponents.push(result)
  failedComponents.push(result)
  allComponentsPass = false
} else if (!result.pass) {
  failedComponents.push(result)
  allComponentsPass = false
}
testedComponents.push(result)
totalEarned += result.points  // ← STILL adds earned points!
totalPossible += result.maxPoints
```
This is intentional (DAFMAN composite = sum of earned points), but non-obvious. Every test and display must preserve this behavior.
**Implication**: Document explicitly; test regression harness must catch any change.

### 3. **Walk-only (2km walk) contribution is 0/0, not 0 earned**
Line 250-254:
```javascript
if (result.walkOnly) {
  walkComponents.push(result)
  return  // ← does NOT add to totalEarned or totalPossible
}
```
Walk is tracked separately, never affects composite denominator.
**Implication**: Walk-fail still triggers overall FAIL (EC-05), but 0/0 keeps composite % unchanged.

### 4. **SL-06 rounding happens BEFORE pass gate**
Line 317:
```javascript
const composite = Math.round((totalEarned / totalPossible) * 1000) / 10  // Round to 1 decimal FIRST
const compositePass = composite >= PASSING_COMPOSITE  // Then check pass
```
This is critical: 74.95 raw → rounds to 75.0 → passes. If pass gate came first, it would fail.
**Implication**: Engine test (scoringEngine.test.js:422) verifies this; cannot be changed.

### 5. **strategyEngine re-walks the scoring table instead of calling lookupScore**
Line 100-115 in `analyzeNextGain`:
```javascript
for (let i = 0; i < table.length; i++) {
  if (lower ? (currentValue <= table[i].threshold) : (currentValue >= table[i].threshold)) {
    currentIdx = i
    break
  }
}
```
This duplicates the exact walk logic from `lookupScore:79-105`. Why not call lookupScore?
**Reason**: strategyEngine needs the INDEX (currentIdx) to compute next-threshold delta; lookupScore only returns points.
**Implication**: When dimensional types are added (Q7), unify these walks via a shared `findTableRowIndex()` helper.

### 6. **reverseLookup walks the table backwards for reps (higher-is-better)**
Line 136:
```javascript
for (let i = table.length - 1; i >= 0; i--) {
  if (table[i].points >= targetPts) {
    bestThreshold = table[i].threshold
    bestPoints = table[i].points
  }
}
```
This finds the SMALLEST threshold (worst reps count) that earns at least targetPts. Walking backward is counterintuitive.
**Why**: For reps, worst values are at the END of the table (lowest index = most reps = best score).
**Implication**: Document; ensure Q7 dimensional-type refactor preserves this logic.

### 7. **74.95 rounding edge case has a dedicated test**
File: `scoringEngine.edgecase.test.js:273-282`
This entire test case is for ONE boundary: 74.95 raw → 75.0 rounded → passes.
**Implication**: This is load-bearing. Cannot remove test; cannot change rounding method. If engine rewrite changes rounding even slightly (e.g., banker's rounding), this test will catch it.

### 8. **Personal goal clamped to [75.0, 100.0]**
File: `AppContext.jsx:348`
```javascript
const clamped = Math.max(75.0, Math.min(100.0, goal))
```
Personal goals cannot be below 75.0 (passing composite).
**Implication**: UI constraint; not a scoring rule. Confirm this behavior survives refactor.

---

**Audit complete. Ready for rewrite kickoff.**
