# USAF PFA Readiness Tracker - Software Design Document

**v1.3 | February 2026 | DRAFT**

Reference: DAFMAN 36-2905 (Change 1, 22 Jan 2026)
Scoring Charts: AFPC 50-20-15-15 Model (23 Sep 2025, provisional)
Timeline: Diagnostic Mar-Jun 2026 | Scored Jul 2026+

---

## Terminology

This document uses precise language to separate what the member does independently from what the Air Force administers officially.

| Term | Means | Does NOT Mean |
|---|---|---|
| **PFA** | The official, AF-administered fitness evaluation at a FAC or by a UFAC. | Anything this app does. |
| **Self-check** | A member entering their own performance data into this app to estimate where they stand against PFA scoring tables. | An official score. A self-check has no official standing. |
| **Score estimate** | The app's computed output from a self-check. Based on official tables but produced unofficially. | An official PFA score. |
| **Readiness projection** | A forward-looking estimate of where the member's score estimate might land on a future date. | A guarantee. Projections are models, not promises. |
| **D-code** | A short string encoding demographics (DOB + gender). Entered once, reused across self-checks. | A personnel record. |
| **S-code** | A short string encoding a single self-check's raw data. One per self-check. | A score. S-codes contain raw input only. Score estimates are recalculated at decode time. |
| **Component** | One of the four PFA areas: cardio, strength, core, body composition. | An exercise. |
| **Exercise** | A specific movement within a component (e.g., HRPU within strength). | A component. |
| **Exempt** | A component the member is medically excused from via AF Form 469. Contributes 0 earned and 0 possible. | Untested. Exempt is formal medical status. |

---

## 1. Guardrails (Locked Decisions)

Final. These constrain all downstream design.

| ID | Decision | Rationale | Consequence |
|---|---|---|---|
| GR-01 | 2026+ standards ONLY. No legacy 60-20-20 model. | Forward-looking readiness tool. Old scores? Take a new self-check. | No legacy tables. No standard version selector. No cross-standard import. |
| GR-02 | D-code (demographics) separate from S-code (self-check). | Demographics rarely change. Self-check data changes every session. | Two code types. D-code entered once. S-codes created per session. |
| GR-03 | Each self-check produces its own unique S-code. | Atomic, portable, independently verifiable. | No H-code. History = collection of S-codes entered in a session. |
| GR-04 | D-code contains ONLY: DOB + gender. | DOB needed for age-group derivation at any date. Gender determines bracket. Height/waist are body measurements taken at self-check time. | D-code is maximally compact (~9 chars). Height/waist live in S-code. |
| GR-05 | Member must perform a new self-check to use projections. | Stale/cross-standard projections are misleading. | Projection engine requires 1+ S-codes from 2026 self-checks. |
| GR-06 | No free-text input anywhere. | Complicates encoding, inflates S-code, content moderation. | All feedback is enumerated. No notes. No injury description. No comments. |
| GR-07 | Injury is binary: Yes / No. | Multi-select injury regions add complexity without actionable value. | Single toggle. Yes = "Discuss with your medical provider and UFPM regarding AF Form 469 exemptions." |
| GR-08 | RPE capped at 5 levels. | Borg CR-10 is too granular for a self-check tool. | Enum: EASY / MODERATE / HARD / VERY_HARD / MAXIMAL. 3 bits. |
| GR-09 | Mobile-first. Desktop secondary. | Phone is primary device (gym, track, FAC). | Tailwind mobile-first. Touch targets >= 44px. Bottom-anchored actions. |
| GR-10 | Single-page app. GitHub Pages. Zero backend. | No auth. No database. Static deploy. | State lives in URL params, pasted codes, or session memory. |
| GR-11 | Unofficial tool. Persistent disclaimer. | Not a replacement for official scoring. | Every screen/report: "UNOFFICIAL SELF-CHECK." |
| GR-12 | No PII in codes. | Rank, name, unit entered at report time only. Never encoded. | D-code: DOB + gender. S-code: raw data. Report: PII entered at render, discarded after. |
| GR-13 | Altitude via static base registry, gated by state toggle. | Only 7 USAF installations exceed 5,000 ft. All in CO, WY, or NM. A static enum is simpler, more reliable, and mirrors how the AF will publish correction factors (per-base, not per-coordinate). | No API calls. No lat/long. No coordinates. No seed data. base_id enum in S-code (3 bits). |
| GR-14 | Extensible for future standard changes. | AF has revised timeline once already. Charts are provisional. | Scoring tables versioned. S-codes carry chart_version. Engine = pure function of (version, demographics, raw_data). |
| GR-15 | S-codes do NOT store computed scores. Scores recalculated at decode time. | Chart updates auto-re-score old S-codes. | Score estimate is derived, never persisted. |

---

## 2. Executive Summary

Single-page, mobile-first web app. USAF Airmen self-check fitness against 2026 PFA scoring tables (50-20-15-15), project readiness toward a future PFA date, generate a supervisor-ready report.

**Zero backend.** D-code entered once. Each self-check produces an S-code. History = collection of S-codes. Sharing via Web Share API and URL hydration.

### Regulatory Context (as of 8 Feb 2026)

Jan 6, 2026 update revised Sep 2025 announcement:

1. 2-mile run no longer mandatory for both semiannual PFAs; HAMR can substitute for both.
2. Diagnostic period: Mar 1 through Jun 30, 2026.
3. Official scored PFAs begin Jul 1, 2026.
4. PFA scores on performance briefs (colonels Feb 2026, LtCol/Maj/CMSgt May 2026).
5. Revised scoring charts "coming soon" but not yet published. Sep 2025 charts are provisional.

### Authorized Exercises (2026 PFA)

Per DAFMAN 36-2905 and Jan 6, 2026 update. All alternate exercises remain available. No exercises added or removed by Jan 2026 update.

| Component | Weight | Exercise Options | Notes |
|---|---|---|---|
| Cardio | 50 pts | 2-mile run \| 20m HAMR shuttle run | HAMR can substitute for both semiannual PFAs. 2km walk is profile-only. |
| Strength | 15 pts | 1-min push-ups \| 2-min hand-release push-ups (HRPU) | Member chooses one per PFA. |
| Core | 15 pts | 1-min sit-ups \| 2-min cross-leg reverse crunches (CLRC) \| Forearm plank (max time) | Member chooses one per PFA. |
| Body Comp | 20 pts | Waist-to-height ratio (WHtR) | Universal table (not age/gender-specific). Measured up to 5 days before PFA. |

### Exemption Model (Open Question)

Component exemptions driven by AF Form 469 (medical profile). 2km walk authorized only for members with cardio exemption. When exempt: 0 earned, 0 possible. App allows any exemption combination since member is self-reporting profile status.

**OPEN:** Are there any NEW exemption rules under the 2026 standard, or does AF Form 469 process remain unchanged?

---

## 3. Sharing & URL Hydration

### 3.1 Web Share API (navigator.share)

On mobile (iOS Safari, Chrome Android), native OS share sheet. Member taps Share, picks Messages/AirDrop/email/etc.

- Feature-detect with `navigator.canShare()` before showing Share button.
- Unsupported browsers: fall back to Copy button with confirmation toast.
- Share payload: `{ title: 'PFA Self-Check', text: url }`. Use `text` not `url` to avoid iOS Safari query-parameter stripping.

### 3.2 URL-Based State Hydration

On load, app reads query parameters and hydrates state.

| Param | Value | Behavior |
|---|---|---|
| `d` | D-code string | Decoded, loaded into demographics. Profile tab auto-populates. |
| `s` | S-code string | Decoded, loaded as self-check. Multiple allowed: `?s=S3-xxx&s=S3-yyy` |
| `tab` | profile \| check \| project \| history \| report | Navigates to tab on load. |

Example: `https://app.example.com/?d=D1-abc123ef&s=S3-xyz789ab&tab=check`

On load: decode D-code, decode S-code(s), navigate to tab. CRC failure on any code = specific error, ignore that param.

### 3.3 Manual Code Entry

Paste field in Profile tab for D-codes. Paste field in History tab for S-codes. Both strip whitespace/newlines, detect prefix mismatches, validate CRC.

---

## 4. Altitude Model

### The List

Only 7 USAF installations exceed 5,000 ft. All in three states.

| base_id | Installation | State | Elevation (ft) |
|---|---|---|---|
| 1 | USAF Academy | CO | 7,258 |
| 2 | Schriever SFB | CO | 6,200 |
| 3 | Cheyenne Mountain SFS | CO | 6,100 |
| 4 | F.E. Warren AFB | WY | 6,065 |
| 5 | Peterson SFB | CO | 6,035 |
| 6 | Buckley SFB | CO | 5,662 |
| 7 | Kirtland AFB | NM | 5,400 |

### UX Flow

1. Toggle: "Are you at a base in CO, WY, or NM?" Default: **No**.
2. **No** → altitude = null, no adjustment, dropdown hidden, nothing stored.
3. **Yes** → dropdown of 7 bases appears. Member picks one. Elevation populates from the constant.
4. S-code stores `base_id` (3 bits, 0-7). 0 = not applicable.

### Extensibility

When AF publishes altitude correction tables, factors will be per-base. The registry mirrors that structure. Adding a base = adding a row to the array.

---

## 5. Validation & Logic Guardrails

### 5.1 Input Validation

| ID | Rule | Enforcement | User Feedback |
|---|---|---|---|
| IV-01 | Self-check date cannot be in the future. | Date picker max = today. | Greyed out future dates. |
| IV-02 | Target PFA date must be after most recent self-check date. | Validation on entry. | "Target date must be after your last self-check." |
| IV-03 | Target PFA date cannot exceed 365 days out. | Validation on entry. | "Target dates beyond 1 year produce unreliable projections." |
| IV-04 | DOB must produce age 17-65 at self-check date. | Validation on decode/entry. | "Age at self-check date is outside USAF service range." |
| IV-05 | Height: 48-84 inches. | Input clamp. | Out-of-range rejected. |
| IV-06 | Waist: 20.0-55.0 inches. | Input clamp. | Out-of-range rejected. |
| IV-07 | Run/walk time: > 0:00 and <= 2:00:00. | Validation. Accepts mm:ss or h:mm:ss. | "Enter a valid time between 0:01 and 2:00:00." |
| IV-08 | Reps cannot be negative. | Input min=0. | Spinner enforces floor of 0. |
| IV-09 | Plank time <= 10:00 (600 seconds). | Input clamp. | "Maximum plank entry is 10 minutes." |
| IV-10 | At least one component must be non-exempt. | Validation on calculation. | "All components exempt. No composite score possible." |
| IV-11 | Walk option only visible when cardio exemption ON. | UI enforces. | Walk hidden for non-profiled members. |
| IV-12 | HAMR: whole numbers (shuttles) OR time (mm:ss). Presence of `:` triggers time-to-shuttle conversion (hidden feature). | Input parsing. | No UI indication of time mode. Just works. |
| IV-13 | Height required alongside waist for WHtR. | Both required if non-exempt. | "Enter both height and waist for body composition scoring." |

> **HAMR Time-to-Shuttle (Hidden Feature):** If input contains `:` (e.g., "12:30"), silently convert to shuttle count via HAMR timing table. Round down to last completed shuttle. Undocumented. Member enters what they know.

### 5.2 Scoring Logic

| ID | Rule | Why |
|---|---|---|
| SL-01 | Reps/time at or above chart max → max points. Never 0. | Known bug in other apps: exceeding max falls through table. |
| SL-02 | Reps/time at or below chart min → min row points (unless truly 0 reps). | 0 is the only value below chart minimum. |
| SL-03 | Run time boundary: listed time is the SLOWEST time for that point value. | Off-by-one flips pass/fail. |
| SL-04 | HAMR ranges that skip shuttle counts: inclusive brackets. | 94 shuttles falls into 92-96. No interpolation. |
| SL-05 | WHtR = waist / height, rounded to 2 decimals (standard rounding) before lookup. | 0.495 → 0.50. |
| SL-06 | Composite = (earned / possible) x 100, rounded to 1 decimal. | Must match official rounding. |
| SL-07 | Walk: 0 earned, 0 possible for cardio. Composite from remaining components. | Walk completers scored as if cardio exempt. |
| SL-08 | Component pass/fail independent of composite. Check BOTH. | 80+ composite still fails if any component below minimum. |
| SL-09 | All components exempt = exempt. No score. No composite. "Fully exempt per AF Form 469." | Not 0. Not N/A. Exempt. |
| SL-10 | 0 reps on non-exempt component = chart lowest value AND component minimum failure. | Tested-and-scored-zero is not exempt. |

### 5.3 Projection

| ID | Rule | Why |
|---|---|---|
| PG-01 | Projections clamped to scoring table bounds. | Linear can project negative times or 200 push-ups. |
| PG-02 | Log model falls back to linear with 1 data point. | Log fitting needs 2+. |
| PG-03 | Historical trend requires 3+ self-checks. Below that, disabled. | "Need 3+ self-checks for historical trend analysis." |
| PG-04 | Age group for projection uses DOB + target_pfa_date. | Member aging into new bracket gets different standards. |
| PG-05 | Cannot project improvement on exempt component. | No data to project from. |
| PG-06 | Member can flag S-code as outlier to exclude from trend. | Bad days skew fit. |
| PG-07 | Output includes days remaining + required weekly improvement for each failing component. | Actionable, not just pass/fail. |
| PG-08 | Amber warning when projected composite within 3 pts of 75.0. | "Margin is thin." |

### 5.4 Code Strings

| ID | Rule | Why |
|---|---|---|
| CS-01 | D-code prefix: `D1-`. S-code prefix: `S3-`. Digit = schema version. | Self-identifying. Version enables schema evolution. |
| CS-02 | CRC-8 appended to every code. | Catches truncation/corruption. |
| CS-03 | Decode failure = specific error. Never silent wrong data. | "Invalid code: checksum mismatch." |
| CS-04 | D-code: schema version + DOB + gender. | No height. No PII. Maximally compact. |
| CS-05 | S-code: schema version + chart version + date + height + waist + components + feedback + base_id. | Height/waist are body measurements, not demographics. |
| CS-06 | S-codes do NOT contain computed scores. | Recalculated at decode time (GR-15). |
| CS-07 | Base64url (RFC 4648 section 5). No padding. | URL-safe. |
| CS-08 | D-code in S-code field → specific error. | Prefix detection. |
| CS-09 | Future schema version → "Code from newer version. Please update the app." | Forward compat. |

### 5.5 UX

| ID | Rule | Why |
|---|---|---|
| UX-01 | Live score estimate banner. No "calculate" button. | Immediate feedback. |
| UX-02 | Component pass/fail badges (green/red) alongside points. | Must see both. |
| UX-03 | Exercise type = segmented control, not dropdown. | One-tap vs two-tap. |
| UX-04 | Exemption toggle = separate switch per component. | Exempt is status, not exercise. |
| UX-05 | Walk only appears when cardio exemption ON. | Profile-only. |
| UX-06 | All exempt = clear message, not score of 0. | "Fully exempt. No score estimate possible." |
| UX-07 | Report tab blocked until 1+ self-checks scored. | No empty reports. |
| UX-08 | Code display: Copy button + Share button (Web Share API). | Copy for desktop. Share for mobile. |
| UX-09 | Code paste field strips whitespace/newlines. | Notes apps add breaks. |
| UX-10 | Diagnostic period auto-detected from self-check date. | No manual checkbox. |
| UX-11 | Time inputs accept mm:ss and total seconds. Display always mm:ss. | Some think in seconds, others mm:ss. |
| UX-12 | Injury = Yes → guidance text. | Directive, not diagnostic. |
| UX-13 | Altitude: state toggle → base dropdown. | Simple. Gated. 7 options. |

### 5.6 Report

| ID | Rule | Why |
|---|---|---|
| RP-01 | Rank/name/unit at report time. Never stored. Never encoded. | PII protection. |
| RP-02 | Report includes D-code and S-code(s) used. | Independent verification. |
| RP-03 | Watermark: "UNOFFICIAL SELF-CHECK." | Prevents misuse. |
| RP-04 | Includes scoring chart version. | Traceability. |
| RP-05 | Diagnostic period dates: "DIAGNOSTIC PERIOD (non-scored)." | Prevents confusion. |
| RP-06 | Output: clipboard (plain text) + print-optimized HTML. | Email/Teams + hardcopy. |
| RP-07 | Footer: "Prepared by member for supervisory awareness." | Sets expectation. |
| RP-08 | Projection section optional (toggled). | Some want current status only. |

---

## 6. Edge Cases

| ID | Edge Case | Expected Behavior | Severity |
|---|---|---|---|
| EC-01 | Reps exceed chart max | Clamp to max points. Never 0. | CRITICAL |
| EC-02 | Age group rollover between self-check and target PFA date | Projection uses DOB + target date. Self-check uses DOB + self-check date. | CRITICAL |
| EC-03 | All components exempt | "Fully exempt." Report: exemption status only. | HIGH |
| EC-04 | Walk pass + all muscular exempt | Walk = pass/fail. Composite = N/A. | HIGH |
| EC-05 | Walk failed | Overall FAIL regardless. | CRITICAL |
| EC-06 | WHtR at boundary (0.495 → 0.50) | Standard rounding to 2 decimals before lookup. | HIGH |
| EC-07 | Run time at exact minimum boundary | Boundary time IS the minimum passing time. | CRITICAL |
| EC-08 | HAMR shuttles between published ranges | Containing bracket. No interpolation. | HIGH |
| EC-09 | Plank as seconds vs mm:ss | Parse both. Display mm:ss. | MEDIUM |
| EC-10 | 0 reps on non-exempt component | Chart minimum row. Component FAILURE. | CRITICAL |
| EC-11 | Projection target in past | Reject: "Target date must be in the future." | LOW |
| EC-12 | 1 S-code, historical trend selected | Disable. "Requires 3+ self-checks." | LOW |
| EC-13 | S-code truncated/edited | CRC fails. "Invalid code. Checksum error." | HIGH |
| EC-14 | Self-check date in diagnostic period | Auto-flag. Report: "DIAGNOSTIC PERIOD." | MEDIUM |
| EC-15 | Mixed exercise choices | Each component independent. Any combo legal. | LOW |
| EC-16 | WHtR measured different day | Allow separate date. Both on report. | LOW |
| EC-17 | D-code in S-code field | "This is a D-code. Paste it in Profile." | MEDIUM |
| EC-18 | S-code from future schema version | "Code from newer version. Update the app." | MEDIUM |
| EC-19 | Walk selected + run data present | Walk clears/disables run input. | MEDIUM |
| EC-20 | Two self-checks same date | Allow. Let member flag outlier. | LOW |
| EC-21 | Browser session cleared | "Session expired. Re-enter your codes." | MEDIUM |
| EC-22 | DOB changed after S-codes loaded | Recalculate brackets immediately. | HIGH |
| EC-23 | Height=0 or waist=0 | Reject. Prevent division by zero. | CRITICAL |
| EC-24 | Scoring charts updated post-ship | Banner: "Using Sep 2025 charts. Check for updates." | HIGH |
| EC-25 | HAMR field receives time format | Silently convert to shuttle count. | MEDIUM |
| EC-26 | Run time 30:01-2:00:00 | Valid. Will score 0 / fail minimum. | LOW |
| EC-27 | Run time > 2:00:00 | Reject: "Maximum run time is 2 hours." | LOW |
| EC-28 | URL contains invalid code in params | Error for bad param. Load whatever is valid. | MEDIUM |
| EC-29 | URL has mismatched schema versions across d/s params | Decode independently. Warn if mismatch. | LOW |

---

## 7. Data Model

### 7.1 D-Code (Demographics)

Format: `D1-[base64url payload][CRC-8]`

| Field | Type | Bits | Range |
|---|---|---|---|
| schema_version | uint | 4 | 1-15. Current: 1. |
| gender | enum | 1 | 0=male, 1=female (per MPDIS). |
| dob_days_since_epoch | uint | 16 | Days since 1950-01-01. Covers through 2129. |

**Total: 21 bits.** With prefix + Base64url + CRC = ~9 characters.

Everything else derived at runtime: age group from DOB + any date, bracket from gender + age group.

### 7.2 S-Code V3 (Self-Check)

Format: `S3-[base64url(bit-packed payload + CRC-8)]`

**V3 bit layout (~110 bits, all 4 components present with run):**

| Block | Bits | Details |
|---|---|---|
| Header | 24 | version:4, chart:4, date:15, diagnostic:1 |
| Flags | 4 | hasCardio:1, hasStrength:1, hasCore:1, hasBodyComp:1 |
| Cardio | 14+ | exercise:2, exempt:1, value:11, [walk_pass:1] |
| Strength | 9 | exercise:1, exempt:1, value:7 |
| Core | 14 | exercise:2, exempt:1, value:11 |
| Body Comp | 25 | exempt:1, height:11, waist:10, offset:3 |
| Feedback | 20 | base_id:3, rpe:3, sleep:2, nutrition:2, injured:1, env:6, confidence:3 |

**Note:** The feedback block is always encoded (20 bits, defaults to zeros) but UI collection is descoped - these fields are not actionable within the app's scope. The bits are reserved for future use.

**Backward compat:** S2-prefixed codes decoded via V2 path. V2 codes lack the feedback block and body comp offset.

**Total: ~110 bits.** With prefix + Base64url + CRC = ~22 characters.

No free text. No notes. No coordinates. All enumerated or numeric.

---

## 8. Scoring Engine

### Table Structure

Single active standard (v2025_sep, provisional).

```
TABLES[chartVersion][gender][ageGroup][exercise] = Array<{ threshold, points }>
```

- Sorted by threshold (descending for reps/shuttles, ascending for times).
- WHtR: single shared array (universal).
- Walk time limits: gender + age group (pass/fail only).
- Minimums: `MINIMUMS[chartVersion][gender][ageGroup][exercise] = value`.
- `chartVersion` key enables future swaps without touching engine.

### Composite Calculation

```
points_earned   = sum(each tested component's looked-up points)
points_possible = sum(each tested component's max weight)
composite       = round((earned / possible) * 100, 1)
pass            = composite >= 75.0 AND every_tested_component >= its_minimum
```

Component weights: Cardio 50 | WHtR 20 | Strength 15 | Core 15 | Total 100

---

## 9. Projection Engine

### Models

**Linear (1+ self-checks):** daily_rate = (target - current) / days. Clamped to chart bounds.

**Logarithmic (2+ self-checks):** projected = current + k * ln(1 + days / tau). Diminishing returns. Falls back to linear with 1 point.

**Historical Trend (3+ self-checks):** Least-squares on non-outlier S-codes. Linear or quadratic by R-squared. Confidence band widens with extrapolation. Disabled below 3.

### Per-Component Output

- Projected raw value at target PFA date
- Projected points (scored against target-date age bracket)
- Pass/fail against minimum
- Gap to minimum (positive = surplus, negative = deficit)
- Required weekly improvement (if failing)
- Confidence: HIGH (3+, good fit) / MEDIUM (2) / LOW (1, linear fallback)

---

## 10. UI Architecture

### Tab Structure

| Tab | Label | Purpose |
|---|---|---|
| 1 | Profile | D-code entry/display. DOB picker, gender toggle. Copy + Share. Paste field. |
| 2 | Self-Check | Exercise selectors (segmented), value inputs, exemption toggles, height, waist, altitude toggle/dropdown. Live score banner. S-code output with Copy + Share. |
| 3 | Project | Target PFA date, model selector, per-component gap bars, projected composite, amber warning. |
| 4 | History | S-code paste, decoded list, outlier flag, trend mini-chart. |
| 5 | Report | Rank/name/unit (not stored), feedback review, projection toggle, Copy + Print. |

### Feedback (Descoped from UI)

The feedback block is encoded in the S-code V3 bit layout (20 bits, defaults to zeros) but UI collection is descoped. These fields (RPE, sleep quality, nutrition, injured, environment, confidence) are not individually actionable within the app's scope. The bits are reserved for potential future use.

| Field | Type | Values | Bits | Status |
|---|---|---|---|---|
| RPE | Enum (5) | Easy / Moderate / Hard / Very Hard / Maximal | 3 | Encoded only |
| Sleep | Enum (4) | Poor / Fair / Good / Excellent | 2 | Encoded only |
| Nutrition | Enum (4) | Fasted / Light / Normal / Heavy | 2 | Encoded only |
| Injured | Bool | No / Yes | 1 | Encoded only |
| Environment | Bitmask (6) | Hot, Cold, Humid, Windy, Altitude Notable, Indoor | 6 | Encoded only |
| Confidence | Enum (5) | Not Ready / Uncertain / Neutral / Confident / Very Confident | 3 | Encoded only |

### Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React (Vite SPA) | Components, hooks, fast HMR |
| Styling | Tailwind CSS v3+ | Mobile-first, small bundle |
| Icons | Heroicons (React) | SVG, tree-shakeable |
| Charts | Recharts | React-native, responsive |
| Sharing | Web Share API + URL params | Native mobile + URL hydration |
| Hosting | GitHub Pages | Free, static, CI/CD |

---

## 11. Risk Register

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| Scoring charts revised before Jul 2026 | HIGH | HIGH | chart_version in S-code. Swappable module. Ship with Sep 2025. |
| Altitude adjustments never published for 2-mile | MED | MED | Ship without. Warning: "Official adjustments pending." |
| DoW mandate imposes gender-neutral minimums | MED | HIGH | Monitor. Modular brackets. |
| App mistaken for official scoring | MED | HIGH | Non-dismissible banner. Watermark. Footer. |
| iOS Safari strips URL query params via Web Share | MED | MED | Use `text` not `url` in navigator.share(). Trailing space workaround. |
| Walk time limits changed under new standard | MED | MED | Flag as provisional. Verify when DAFMAN publishes. |
| S-codes corrupted by messaging platform link preview | LOW | MED | Base64url. CRC catches corruption. |

---

## 12. Implementation Phases

| Phase | Deliverable | Depends On |
|---|---|---|
| P1: Scoring Engine | Pure function: (chartVersion, gender, dob, date, exercise, raw) → { points, pass, category }. All 18 brackets. WHtR. Walk. Minimums. Prorated. Unit tests for every edge case. | Verified AFPC scoring data. |
| P2: Code Codec | D-code / S-code encode/decode. Bit-packing. CRC-8. Base64url. Prefix detection. All error messages. | P1 data model. |
| P3: Profile + Self-Check UI | Tab shell. Profile (D-code). Self-Check (inputs, live scoring, S-code). Sharing. URL hydration. Altitude toggle/dropdown. | P1 + P2. |
| P4: Projection Engine | Linear + log. Target date. Age-rollover. Gap output. Clamping. All PG guardrails. | P3. |
| P5: History | S-code paste + list. Outlier flagging. Trend chart. Historical trend (3+). | P4. |
| P6: Report | Rank/name. Feedback review. Projection toggle. Clipboard + print. All RP guardrails. | P5. |
| P7: Polish + Deploy | Accessibility. Responsive. Service worker. GitHub Pages CI. | P6. |

---

## 13. Open Questions

| # | Question | Blocking? | Action |
|---|---|---|---|
| 1 | Will revised charts change point distributions, boundaries, or both? | YES (final data) | Ship Sep 2025. Monitor afpc.af.mil. |
| 2 | Altitude adjustments for 2-mile, HAMR, or both? | NO | Add correction layer when published. |
| 3 | 2km walk time limits unchanged under new model? | YES (walk feature) | Verify when DAFMAN publishes. |
| 4 | New exemption rules or AF Form 469 changes? | NO (allow any combo) | Verify if constraints exist. |
| 5 | HAMR timing table for time-to-shuttle conversion? | NO (nice-to-have) | Source from HAMR audio or published docs. |

---

## Appendix A: Changelog

| Version | Date | Changes |
|---|---|---|
| v1.0 | 8 Feb 2026 | Initial. Gap analysis, edge cases, data model, scoring engine, projection engine, UI. |
| v1.1 | 8 Feb 2026 | Guardrails locked. 2026 only. Separate D/S-codes. DOB captured. 52 guardrails. 24 edge cases. |
| v1.2 | 8 Feb 2026 | Terminology section. S-code renamed from A-code. D-code = DOB+gender only. No free text. Binary injury. RPE cap 5. Altitude via USGS EPQS. Web Share API + URL hydration. Run cap 2:00:00. HAMR time-to-shuttle hidden. 30 edge cases. |
| v1.3 | 8 Feb 2026 | Altitude model changed from API fetch to static base registry (7 bases, 3 states). Gated by state toggle. No API. No coordinates. No lat/long in S-code. base_id enum (3 bits) replaces lat(17)+lng(18)+elevation(14) = saved 46 bits. Removed Michigan base seed data. S-code shrinks from ~31 chars to ~22 chars. Removed EC-28 (API timeout). Markdown format. |
