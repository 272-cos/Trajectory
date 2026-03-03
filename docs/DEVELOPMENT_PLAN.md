# USAF PFA Readiness Tracker — Development Plan

**Basis:** `docs/design.md` v1.3 | **Date:** February 2026
**Branch strategy:** One GitHub issue per sprint task → `claude/<slug>` branch → PR to `main`

---

## Current State vs. Design Spec

| Layer | Status | Gap |
|---|---|---|
| Scoring tables | ✅ Complete | All 18 brackets. WHTR universal table. |
| Scoring engine | ⚠️ Partial | Missing: walk pass/fail (SL-07), edge cases EC-01/SL-02/SL-10 unverified |
| D-code codec | ✅ Complete | Encode/decode/CRC verified |
| S-code codec | ⚠️ Partial | 87-bit V2; missing: `base_id`, `rpe`, `sleep`, `nutrition`, `injured`, `env_flags`, `confidence`, `whtr_offset`, `cardio_walk_pass` |
| Input validation | ⚠️ Partial | IV-01 through IV-13; most not enforced in UI |
| Profile tab | ✅ Functional | Missing: URL hydration (`?d=`), Web Share API |
| Self-Check tab | ⚠️ Partial | Missing: altitude toggle, walk option (IV-11), segmented controls (UX-03), feedback fields, sharing |
| Projection tab | ❌ Stub | 212-line placeholder; projection engine not built |
| History tab | ❌ Stub | 38-line placeholder; no chart, no outlier flagging |
| Report tab | ❌ Stub | 19-line placeholder; no output |
| URL hydration | ❌ Not started | `?d=`, `?s=`, `?tab=` params |
| Web Share API | ❌ Not started | `navigator.share()` + copy fallback |
| PWA / service worker | ❌ Not started | Offline support |
| Test coverage | ⚠️ Minimal | 2 App render tests; no scoring/codec unit tests |

---

## Sprint Plan

### Sprint 2 — Engine Hardening + URL Hydration + S-Code Expansion

**Goal:** All scoring logic correct and tested. S-code carries full design-spec payload. URL hydration works.

---

#### Task 2.1 — Scoring Engine Edge Cases + Unit Tests

**Design references:** SL-01 through SL-10, EC-01, EC-02, EC-06, EC-07, EC-08, EC-10, EC-23

- [X] **SL-01 / EC-01:** Reps/time above chart max → clamp to max points (never 0)
- [X] **SL-02:** Reps/time below chart min → min row points (not 0, unless 0 reps)
- [ ] **SL-10 / EC-10:** 0 reps on non-exempt → chart min points AND component failure
- [ ] **SL-03:** Run time boundary: listed time is slowest valid time for that row (inclusive)
- [ ] **SL-04:** HAMR gaps between ranges use containing bracket (no interpolation)
- [ ] **SL-05 / EC-06:** WHtR rounded to 2 decimals before lookup (`0.495 → 0.50`)
- [ ] **SL-06:** Composite = `round((earned/possible)*100, 1)` — match official rounding
- [ ] **SL-07:** Walk = 0 earned, 0 possible for cardio; composite from remaining 3
- [ ] **SL-08:** Component pass/fail checked independently of composite
- [ ] **SL-09:** All components exempt → `composite = null`, no score
- [ ] **EC-02:** Projection uses DOB + target date for age group (age-rollover)
- [ ] **EC-07:** Run time at exact boundary passes (inclusive)
- [ ] **EC-08:** HAMR shuttle between published ranges → containing bracket
- [ ] **EC-23:** Height=0 or waist=0 → reject, prevent division by zero
- [ ] Write Vitest unit tests for every rule above (≥1 test per rule, edge on boundary)

**Acceptance:** `npm test` passes, zero warnings. Every SL/EC item above has a passing test.

---

#### Task 2.2 — S-Code V3: Full Design-Spec Payload

**Design references:** §7.2 S-Code data model, GR-13 (altitude), GR-07 (injury), GR-08 (RPE), §10 Feedback

Expand S-code bit layout from 87 bits (V2) to full design-spec ~104 bits (V3):

| New Field | Bits | Range |
|---|---|---|
| `whtr_measured_offset` | 3 | 0–5 days before self-check |
| `cardio_walk_pass` | 1 | Boolean (only when cardio_type=walk) |
| `base_id` | 3 | 0=N/A, 1–7 (altitude base registry) |
| `rpe` | 3 | 0–4 mapped from 1–5 |
| `sleep_quality` | 2 | 0=poor / 1=fair / 2=good / 3=excellent |
| `nutrition` | 2 | 0=fasted / 1=light / 2=normal / 3=heavy |
| `injured` | 1 | 0=no / 1=yes |
| `environment_flags` | 6 | hot, cold, humid, windy, altitude\_notable, indoor |
| `confidence` | 3 | 0–4 mapped from 1–5 |

- [ ] Bump schema version to `S3-` prefix, update `SCHEMA_VERSION = 3`
- [ ] Update `BitWriter`/`BitReader` field sequence in `scode.js`
- [ ] Update `bitpack.js` constants for new enums (base registry, RPE, sleep, nutrition, confidence)
- [ ] Backward-compat: V2 decode still works (detect prefix `S2-`)
- [ ] Update `encodeSCode()` and `decodeSCode()` for new fields
- [ ] Add base registry constant: `BASE_REGISTRY` array of 7 installations (§4)
- [ ] CS-01 / CS-09: version detection — `S3-` current, `S2-` legacy decode, higher = "update the app"
- [ ] Unit tests: encode → decode round-trip for all new fields; boundary values

**Acceptance:** Round-trip encode/decode passes for V2 and V3. All new fields survive codec. ~22-char output.

---

#### Task 2.3 — URL Hydration + Web Share API

**Design references:** §3.1 Web Share API, §3.2 URL Hydration, §3.3 Manual Code Entry, EC-28, EC-29, UX-08, UX-09, CS-03, CS-08

- [ ] On app load: parse `?d=`, `?s=` (multiple), `?tab=` from `window.location.search`
- [ ] Decode each param; CRC failure on any code = specific error toast, skip that param
- [ ] D-code in S-code field → "This is a D-code. Paste it in Profile." (EC-17, CS-08)
- [ ] `?tab=` navigates to correct tab on load
- [ ] EC-28: invalid code in URL param → error per bad param, still load valid params
- [ ] EC-29: mismatched schema versions across `d`/`s` params → warn, load independently
- [ ] Web Share API: `navigator.canShare()` feature detect; show Share button if supported
- [ ] Share payload: `{ title: 'PFA Self-Check', text: url }` (use `text`, not `url` — iOS Safari fix)
- [ ] Fallback: Copy button + "Copied!" confirmation toast on unsupported browsers
- [ ] UX-09: paste fields strip whitespace and newlines before decode
- [ ] Share URLs constructed from current D-code + active S-code(s)

**Acceptance:** `?d=D1-xxx&s=S3-yyy&tab=check` loads correctly. Share button fires native share sheet on mobile. Copy fallback works on desktop. Bad CRC shows error, does not crash.

---

### Sprint 3 — Self-Check UI Completion

**Goal:** Self-Check tab fully implements design spec: altitude, walk, feedback fields, all IV/UX rules.

---

#### Task 3.1 — Input Validation (IV Rules)

**Design references:** §5.1 IV-01 through IV-13

- [ ] **IV-01:** Self-check date picker max = today; future dates greyed out
- [ ] **IV-02:** Target PFA date must be after most recent self-check date
- [ ] **IV-03:** Target PFA date ≤ 365 days out ("beyond 1 year = unreliable")
- [ ] **IV-04:** DOB age 17–65 at self-check date ("outside USAF service range")
- [ ] **IV-05:** Height input clamped 48–84 inches; out-of-range rejected
- [ ] **IV-06:** Waist input clamped 20.0–55.0 inches
- [ ] **IV-07:** Run/walk time > 0:00 and ≤ 2:00:00; accepts `mm:ss` or `h:mm:ss`
- [ ] **IV-08:** Reps input `min=0`; spinner enforces floor
- [ ] **IV-09:** Plank time ≤ 10:00 (600 s); "Maximum plank entry is 10 minutes."
- [ ] **IV-10:** At least one component non-exempt; show "All components exempt. No composite score possible."
- [ ] **IV-11:** Walk option hidden unless cardio exemption ON (UX-05)
- [ ] **IV-12:** HAMR accepts whole numbers OR `mm:ss`; colon triggers silent time-to-shuttle conversion (EC-25)
- [ ] **IV-13:** Height required with waist for WHtR ("Enter both height and waist.")

**Acceptance:** Each validation rule has a manual test case. Invalid inputs show correct message. No silent failures.

---

#### Task 3.2 — Altitude + Walk Support in Self-Check UI

**Design references:** §4 Altitude Model, GR-13, UX-13, IV-11, SL-07, EC-04, EC-05, EC-19

**Altitude:**
- [ ] State toggle: "Are you at a base in CO, WY, or NM?" Default: No
- [ ] Toggle ON → dropdown of 7 bases appears (from `BASE_REGISTRY`)
- [ ] Toggle OFF → `base_id = 0`, dropdown hidden
- [ ] Selected base writes `base_id` to S-code

**Walk:**
- [ ] Walk option only shown when cardio exemption toggle is ON (IV-11)
- [ ] Walk: separate pass/fail input (not scored like run/HAMR)
- [ ] Walk pass: 0 earned, 0 possible for cardio; composite from remaining 3 (SL-07)
- [ ] Walk fail: overall FAIL regardless of other components (EC-05)
- [ ] EC-19: selecting walk clears/disables run input

**Acceptance:** Altitude toggle/dropdown round-trips through S-code. Walk pass/fail displays correctly. Walk fail always produces overall FAIL.

---

#### Task 3.3 — Feedback Fields + UX Polish in Self-Check

**Design references:** §10 Feedback table, UX-01 through UX-13, GR-06, GR-07, GR-08

- [ ] **UX-03:** Exercise type = segmented control (not dropdown) for cardio, strength, core
- [ ] **UX-04:** Exemption toggle = separate switch per component
- [ ] **UX-01:** Live score estimate banner updates on every input change (no "calculate" button)
- [ ] **UX-02:** Component pass/fail badges (green/red) alongside points
- [ ] **UX-10:** Diagnostic period auto-detected from self-check date; display "DIAGNOSTIC PERIOD" badge
- [ ] **UX-11:** Time inputs accept `mm:ss` and total seconds; display always `mm:ss`
- [ ] **UX-12:** Injury toggle ON → display "Discuss with your medical provider and UFPM regarding AF Form 469 exemptions."
- [ ] **UX-13:** Altitude state toggle → base dropdown
- [ ] Feedback section: RPE (5 levels), Sleep (4), Nutrition (4), Injured (bool), Environment (6-flag bitmask), Confidence (5 levels)
- [ ] All feedback fields encoded into S-code V3

**Acceptance:** All UX rules pass visual inspection. Feedback fields round-trip through S-code.

---

### Sprint 4 — Projection Engine

**Goal:** Full projection engine per §9 + §5.3, displayed in Project tab.

---

#### Task 4.1 — Projection Engine (Pure Functions)

**Design references:** §9 Projection Engine, §5.3 PG-01 through PG-08

- [ ] **Linear model (1+ S-codes):** `daily_rate = (target - current) / days`; clamped to chart bounds (PG-01)
- [ ] **Logarithmic model (2+ S-codes):** `projected = current + k * ln(1 + days/tau)`; diminishing returns
- [ ] **Historical trend (3+ S-codes):** least-squares on non-outlier S-codes; linear or quadratic by R²; disabled below 3 (PG-03)
- [ ] **PG-02:** Log model falls back to linear with only 1 data point
- [ ] **PG-04:** Age group for projection = DOB + target_pfa_date (not self-check date)
- [ ] **PG-05:** Cannot project exempt components
- [ ] **PG-06:** Outlier-flagged S-codes excluded from trend fit
- [ ] **PG-07:** Output: projected value, projected points, pass/fail, gap to minimum, required weekly improvement
- [ ] **PG-08:** Amber warning when projected composite within 3 pts of 75.0
- [ ] Unit tests: linear accuracy, log clamping, age-rollover bracket, 3+ S-code trend fit

**File:** `src/utils/projection/projectionEngine.js`

**Acceptance:** `npm test` passes. Each PG rule has a passing test.

---

#### Task 4.2 — Project Tab UI

**Design references:** §10 Tab 3 (Project), §5.3 PG rules

- [ ] Target PFA date picker with IV-02/IV-03 validation
- [ ] Model selector: Linear / Logarithmic / Historical Trend (historical disabled if <3 S-codes)
- [ ] Per-component gap bars: current → projected → minimum threshold
- [ ] Projected composite score
- [ ] Amber warning banner when projected composite within 3 pts of 75.0 (PG-08)
- [ ] "Days remaining" + "required weekly improvement" per failing component (PG-07)
- [ ] GR-05: blocked until member has 1+ S-codes from 2026 self-checks

**Acceptance:** All three models display correctly. Age rollover handled. Outlier-excluded S-codes not plotted.

---

### Sprint 5 — History Tab

**Goal:** Full History tab per §10 Tab 4.

---

#### Task 5.1 — History Tab: S-Code Paste + Trend Chart

**Design references:** §10 Tab 4 (History), §3.3 Manual Code Entry, PG-06

- [ ] S-code paste field: strips whitespace/newlines (UX-09); validates CRC (CS-02/CS-03)
- [ ] Decoded S-code list: date, exercise, component scores
- [ ] Per-S-code outlier flag toggle (PG-06)
- [ ] Trend mini-chart: time series of composite score across S-codes (Recharts)
- [ ] Per-component sparklines
- [ ] Historical trend requires 3+ S-codes — show "Need 3+ self-checks" below threshold (EC-12)
- [ ] EC-20: two S-codes same date → both shown, let member flag outlier
- [ ] CS-08: D-code pasted into S-code field → "This is a D-code. Paste it in Profile."
- [ ] EC-14: S-code in diagnostic period → "DIAGNOSTIC PERIOD" badge in list

**Acceptance:** Paste → decode → display works. Chart renders with 1–5 S-codes. Outlier toggle excludes from trend.

---

### Sprint 6 — Report Tab

**Goal:** Full report generation per §10 Tab 5 + §5.6 RP rules.

---

#### Task 6.1 — Report Tab

**Design references:** §10 Tab 5 (Report), §5.6 RP-01 through RP-08

- [ ] **RP-01:** Rank/name/unit entered at render time; never stored, never encoded
- [ ] **UX-07:** Tab blocked until 1+ self-checks scored
- [ ] Report body: member info, D-code used, S-code(s) used, per-component score breakdown
- [ ] **RP-03:** Watermark: "UNOFFICIAL SELF-CHECK" on every page
- [ ] **RP-04:** Scoring chart version displayed ("Sep 2025 Provisional")
- [ ] **RP-05:** S-codes in diagnostic period flagged "DIAGNOSTIC PERIOD (non-scored)"
- [ ] **RP-07:** Footer: "Prepared by member for supervisory awareness."
- [ ] **RP-08:** Projection section optional toggle; when ON, include per-component projections
- [ ] **RP-06 / UX-08:** Output: clipboard (plain text) + print-optimized HTML (`window.print()`)
- [ ] EC-03: all exempt → exemption-status-only report

**Acceptance:** Report renders without PII stored. Print stylesheet hides UI chrome. Copy pastes clean text.

---

### Sprint 7 — Polish, Accessibility, PWA

**Goal:** Production-ready. Offline capable. Accessible.

---

#### Task 7.1 — Accessibility + Responsive Polish

**Design references:** GR-09 (mobile-first), §10 Tech Stack

- [ ] Touch targets ≥ 44px on all interactive elements
- [ ] Bottom-anchored action buttons on mobile
- [ ] ARIA labels on all inputs, toggles, and icon buttons
- [ ] Keyboard navigation through all tabs and form fields
- [ ] Color contrast meets WCAG AA (especially pass/fail badges)
- [ ] Test on iOS Safari + Chrome Android

---

#### Task 7.2 — PWA + Service Worker

**Design references:** §12 Phase P7

- [ ] Vite PWA plugin (`vite-plugin-pwa`)
- [ ] `manifest.json`: name, short_name, icons, theme_color, display=standalone
- [ ] Service worker: cache-first for static assets; network-first for none (no API calls)
- [ ] Offline banner: "You're offline. All features still work."
- [ ] Install prompt on supported browsers

---

#### Task 7.3 — Scoring Chart Update Banner

**Design references:** EC-24, Risk Register (chart revision HIGH prob)

- [ ] `CHART_VERSION` constant + `CHART_RELEASE_DATE` in `constants.js`
- [ ] Banner component: "Using Sep 2025 provisional charts. Check afpc.af.mil for updates."
- [ ] Banner dismissible per session (sessionStorage flag)
- [ ] When new chart data ships: bump `CHART_VERSION`, add new table module, existing S-codes re-score automatically (GR-15)

---

## Implementation Notes

### Do Not Add

Per design GR-06 and project constraints:
- No free-text input (notes, comments, injury description)
- No analytics, cookies, or third-party scripts
- No backend or API calls (except static asset fetches)
- No legacy 60-20-20 scoring model

### Testing Strategy

Every pure-function module gets Vitest unit tests before the UI is wired up:
1. `scoringEngine.js` — all SL rules + EC edge cases (Task 2.1)
2. `scode.js` V3 — round-trip encode/decode, boundary values (Task 2.2)
3. `projectionEngine.js` — model accuracy, clamping, age-rollover (Task 4.1)

UI component tests via React Testing Library for critical flows (Self-Check live score, code paste/validate, report generation).

### Open Questions (from §13)

| # | Question | Blocking Sprint |
|---|---|---|
| 1 | Will revised charts change point distributions? | Sprint 7 (chart update banner) |
| 2 | Altitude adjustments for 2-mile / HAMR? | Sprint 3 (altitude model) |
| 3 | 2km walk time limits unchanged? | Sprint 3 (walk support) |
| 4 | New exemption rules under 2026 standard? | Sprint 3 |
| 5 | HAMR timing table for time-to-shuttle conversion? | Sprint 2 Task 2.3 (IV-12) |

---

## Sprint Summary

| Sprint | Tasks | Key Deliverable |
|---|---|---|
| 2 | 2.1, 2.2, 2.3 | Hardened engine + full S-code V3 + URL hydration |
| 3 | 3.1, 3.2, 3.3 | Self-Check tab feature-complete |
| 4 | 4.1, 4.2 | Projection engine + Project tab |
| 5 | 5.1 | History tab with trend chart |
| 6 | 6.1 | Report generation |
| 7 | 7.1, 7.2, 7.3 | PWA + accessibility + chart update banner |
