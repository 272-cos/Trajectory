# USAF PFA Readiness Tracker - Development Plan

**Basis:** `docs/design.md` v1.3 | **Date:** February 2026
**Branch strategy:** One GitHub issue per sprint task → `claude/<slug>` branch → PR to `main`

---

## Current State vs. Design Spec

| Layer | Status | Gap |
|---|---|---|
| Scoring tables | ✅ Complete | All 18 brackets. WHTR universal table. |
| Scoring engine | ✅ Complete | All SL-01 through SL-10, EC edge cases, walk pass/fail |
| D-code codec | ✅ Complete | Encode/decode/CRC verified |
| S-code codec | ✅ Complete | S3 V3 full payload: base_id, whtr_offset, cardio_walk_pass; S2 backward compat |
| Input validation | ✅ Complete | IV-01 through IV-13 all enforced in UI |
| Profile tab | ✅ Complete | URL hydration (`?d=`), Web Share API, copy fallback |
| Self-Check tab | ✅ Complete | Walk option, segmented controls (UX-03), live scoring, sharing |
| Projection tab | ✅ Complete | Linear/log/historical trend models; per-component gap bars |
| History tab | ✅ Complete | S-code paste, trend chart, outlier toggle, sparklines |
| Report tab | ✅ Complete | Print + clipboard output, watermark, projection toggle |
| URL hydration | ✅ Complete | `?d=`, `?s=`, `?tab=` params with error toasts |
| Web Share API | ✅ Complete | `navigator.share()` + copy fallback |
| PWA / service worker | ❌ Not started | Offline support (Sprint 7) |
| Test coverage | ✅ Complete | 270 unit tests across scoring, codec, projection engines |

---

## Sprint Plan

### Sprint 2 - Engine Hardening + URL Hydration + S-Code Expansion [COMPLETE]

**Goal:** All scoring logic correct and tested. S-code carries full design-spec payload. URL hydration works.

---

#### Task 2.1 - Scoring Engine Edge Cases + Unit Tests

**Design references:** SL-01 through SL-10, EC-01, EC-02, EC-06, EC-07, EC-08, EC-10, EC-23

- [X] **SL-01 / EC-01:** Reps/time above chart max → clamp to max points (never 0)
- [X] **SL-02:** Reps/time below chart min → min row points (not 0, unless 0 reps)
- [X] **SL-10 / EC-10:** 0 reps on non-exempt → chart min points AND component failure
- [X] **SL-03:** Run time boundary: listed time is slowest valid time for that row (inclusive)
- [X] **SL-04:** HAMR gaps between ranges use containing bracket (no interpolation)
- [X] **SL-05 / EC-06:** WHtR rounded to 2 decimals before lookup (`0.495 → 0.50`)
- [X] **SL-06:** Composite = `round((earned/possible)*100, 1)` - match official rounding
- [X] **SL-07:** Walk = 0 earned, 0 possible for cardio; composite from remaining 3
- [X] **SL-08:** Component pass/fail checked independently of composite
- [X] **SL-09:** All components exempt → `composite = null`, no score
- [X] **EC-02:** Projection uses DOB + target date for age group (age-rollover)
- [X] **EC-07:** Run time at exact boundary passes (inclusive)
- [X] **EC-08:** HAMR shuttle between published ranges → containing bracket
- [X] **EC-23:** Height=0 or waist=0 → reject, prevent division by zero
- [X] Write Vitest unit tests for every rule above (≥1 test per rule, edge on boundary)

**Acceptance:** `npm test` passes, zero warnings. Every SL/EC item above has a passing test.

---

#### Task 2.2 - S-Code V3: Full Design-Spec Payload

**Design references:** §7.2 S-Code data model, GR-13 (altitude)

Expand S-code bit layout from 87 bits (V2) to full design-spec ~104 bits (V3):

| New Field | Bits | Range |
|---|---|---|
| `whtr_measured_offset` | 3 | 0-5 days before self-check |
| `cardio_walk_pass` | 1 | Boolean (only when cardio_type=walk) |
| `base_id` | 3 | 0=N/A, 1-7 (altitude base registry) |

- [X] Bump schema version to `S3-` prefix, update `SCHEMA_VERSION = 3`
- [X] Update `BitWriter`/`BitReader` field sequence in `scode.js`
- [X] Update `bitpack.js` constants for new enums (base registry)
- [X] Backward-compat: V2 decode still works (detect prefix `S2-`)
- [X] Update `encodeSCode()` and `decodeSCode()` for new fields
- [X] Add base registry constant: `BASE_REGISTRY` array of 7 installations (§4)
- [X] CS-01 / CS-09: version detection - `S3-` current, `S2-` legacy decode, higher = "update the app"
- [X] Unit tests: encode → decode round-trip for all new fields; boundary values

**Acceptance:** Round-trip encode/decode passes for V2 and V3. All new fields survive codec. ~22-char output.

---

#### Task 2.3 - URL Hydration + Web Share API

**Design references:** §3.1 Web Share API, §3.2 URL Hydration, §3.3 Manual Code Entry, EC-28, EC-29, UX-08, UX-09, CS-03, CS-08

- [X] On app load: parse `?d=`, `?s=` (multiple), `?tab=` from `window.location.search`
- [X] Decode each param; CRC failure on any code = specific error toast, skip that param
- [X] D-code in S-code field → "This is a D-code. Paste it in Profile." (EC-17, CS-08)
- [X] S-code in D-code field → "This is an S-code. Paste it in History." (CS-08 reverse)
- [X] `?tab=` navigates to correct tab on load
- [X] EC-28: invalid code in URL param → error toast per bad param, still load valid params
- [X] EC-29: mismatched schema versions across `d`/`s` params → warn toast, load independently
- [X] Web Share API: `navigator.canShare()` feature detect; show Share button if supported
- [X] Share payload: `{ title: 'PFA Self-Check', text: url }` (use `text`, not `url` - iOS Safari fix)
- [X] Fallback: Copy button + "Link copied to clipboard!" toast on unsupported browsers
- [X] UX-09: paste fields strip whitespace and newlines before decode (ProfileTab + HistoryTab)
- [X] Share URLs constructed from current D-code + active S-code(s)

**Acceptance:** `?d=D1-xxx&s=S3-yyy&tab=check` loads correctly. Share button fires native share sheet on mobile. Copy fallback works on desktop. Bad CRC shows error, does not crash.

---

### Sprint 3 - Self-Check UI Completion [COMPLETE]

**Goal:** Self-Check tab fully implements design spec: altitude, walk, feedback fields, all IV/UX rules.

---

#### Task 3.1 - Input Validation (IV Rules)

**Design references:** §5.1 IV-01 through IV-13

- [x] **IV-01:** Self-check date picker max = today; future dates greyed out
- [x] **IV-02:** Target PFA date must be after most recent self-check date
- [x] **IV-03:** Target PFA date ≤ 365 days out ("beyond 1 year = unreliable")
- [x] **IV-04:** DOB age 17-65 at self-check date ("outside USAF service range")
- [x] **IV-05:** Height input clamped 48-84 inches; out-of-range rejected
- [x] **IV-06:** Waist input clamped 20.0-55.0 inches
- [x] **IV-07:** Run/walk time > 0:00 and ≤ 2:00:00; accepts `mm:ss` or `h:mm:ss`
- [x] **IV-08:** Reps input `min=0`; spinner enforces floor
- [x] **IV-09:** Plank time ≤ 10:00 (600 s); "Maximum plank entry is 10 minutes."
- [x] **IV-10:** At least one component non-exempt; show "All components exempt. No composite score possible."
- [x] **IV-11:** Walk option hidden unless cardio exemption ON (UX-05)
- [x] **IV-12:** HAMR accepts whole numbers OR `mm:ss`; colon triggers silent time-to-shuttle conversion (EC-25)
- [x] **IV-13:** Height required with waist for WHtR ("Enter both height and waist.")

**Acceptance:** Each validation rule has a manual test case. Invalid inputs show correct message. No silent failures.

---

#### Task 3.2 - Altitude + Walk Support in Self-Check UI

**Design references:** §4 Altitude Model, GR-13, UX-13, IV-11, SL-07, EC-04, EC-05, EC-19

**Altitude:** (removed from scope)

**Walk:**
- [x] Walk option only shown when cardio exemption toggle is ON (IV-11)
- [x] Walk: separate pass/fail input (not scored like run/HAMR)
- [x] Walk pass: 0 earned, 0 possible for cardio; composite from remaining 3 (SL-07)
- [x] Walk fail: overall FAIL regardless of other components (EC-05)
- [x] EC-19: selecting walk clears/disables run input (run input hidden when cardio exempt)

**Acceptance:** Walk pass/fail displays correctly. Walk fail always produces overall FAIL.

---

#### Task 3.3 - Feedback Fields + UX Polish in Self-Check

**Design references:** UX-01 through UX-11

- [X] **UX-03:** Exercise type = segmented control (not dropdown) for cardio, strength, core
- [X] **UX-04:** Exemption toggle = separate switch per component
- [X] **UX-01:** Live score estimate banner updates on every input change (no "calculate" button)
- [X] **UX-02:** Component pass/fail badges (green/red) alongside points
- [X] **UX-10:** Diagnostic period auto-detected from self-check date; display "DIAGNOSTIC PERIOD" badge
- [X] **UX-11:** Time inputs accept `mm:ss` and total seconds; display always `mm:ss`

**Acceptance:** All UX rules pass visual inspection.

---

### Sprint 4 - Projection Engine [COMPLETE]

**Goal:** Full projection engine per §9 + §5.3, displayed in Project tab.

---

#### Task 4.1 - Projection Engine (Pure Functions)

**Design references:** §9 Projection Engine, §5.3 PG-01 through PG-08

- [X] **Linear model (1+ S-codes):** `daily_rate = (target - current) / days`; clamped to chart bounds (PG-01)
- [X] **Logarithmic model (2+ S-codes):** `projected = current + k * ln(1 + days/tau)`; diminishing returns
- [X] **Historical trend (3+ S-codes):** least-squares on non-outlier S-codes; linear or quadratic by R²; disabled below 3 (PG-03)
- [X] **PG-02:** Log model falls back to linear with only 1 data point
- [X] **PG-04:** Age group for projection = DOB + target_pfa_date (not self-check date)
- [X] **PG-05:** Cannot project exempt components
- [X] **PG-06:** Outlier-flagged S-codes excluded from trend fit
- [X] **PG-07:** Output: projected value, projected points, pass/fail, gap to minimum, required weekly improvement
- [X] **PG-08:** Amber warning when projected composite within 3 pts of 75.0
- [X] Unit tests: linear accuracy, log clamping, age-rollover bracket, 3+ S-code trend fit

**File:** `src/utils/projection/projectionEngine.js`

**Acceptance:** `npm test` passes. Each PG rule has a passing test.

---

#### Task 4.2 - Project Tab UI

**Design references:** §10 Tab 3 (Project), §5.3 PG rules

- [X] Target PFA date picker with IV-02/IV-03 validation
- [X] Model selector: Linear / Logarithmic / Historical Trend (historical disabled if <3 S-codes)
- [X] Per-component gap bars: current -> projected -> minimum threshold
- [X] Projected composite score
- [X] Amber warning banner when projected composite within 3 pts of 75.0 (PG-08)
- [X] "Days remaining" + "required weekly improvement" per failing component (PG-07)
- [X] GR-05: blocked until member has 1+ S-codes from 2026 self-checks

**Acceptance:** All three models display correctly. Age rollover handled. Outlier-excluded S-codes not plotted.

---

### Sprint 5 - History Tab [COMPLETE]

**Goal:** Full History tab per §10 Tab 4.

---

#### Task 5.1 - History Tab: S-Code Paste + Trend Chart

**Design references:** §10 Tab 4 (History), §3.3 Manual Code Entry, PG-06

- [x] S-code paste field: strips whitespace/newlines (UX-09); validates CRC (CS-02/CS-03)
- [x] Decoded S-code list: date, exercise, component scores
- [x] Per-S-code outlier flag toggle (PG-06)
- [x] Trend mini-chart: time series of composite score across S-codes (Recharts)
- [x] Per-component sparklines
- [x] Historical trend requires 3+ S-codes - show "Need 3+ self-checks" below threshold (EC-12)
- [x] EC-20: two S-codes same date → both shown, let member flag outlier
- [x] CS-08: D-code pasted into S-code field → "This is a D-code. Paste it in Profile."
- [x] EC-14: S-code in diagnostic period → "DIAGNOSTIC PERIOD" badge in list

**Acceptance:** Paste → decode → display works. Chart renders with 1-5 S-codes. Outlier toggle excludes from trend.

---

### Sprint 6 - Report Tab [COMPLETE]

**Goal:** Full report generation per §10 Tab 5 + §5.6 RP rules.

---

#### Task 6.1 - Report Tab

**Design references:** §10 Tab 5 (Report), §5.6 RP-01 through RP-08

- [x] **RP-01:** Rank/name/unit entered at render time; never stored, never encoded
- [x] **UX-07:** Tab blocked until 1+ self-checks scored
- [x] Report body: member info, D-code used, S-code(s) used, per-component score breakdown
- [x] **RP-03:** Watermark: "UNOFFICIAL SELF-CHECK" on every page
- [x] **RP-04:** Scoring chart version displayed ("Sep 2025 Provisional")
- [x] **RP-05:** S-codes in diagnostic period flagged "DIAGNOSTIC PERIOD (non-scored)"
- [x] **RP-07:** Footer: "Prepared by member for supervisory awareness."
- [x] **RP-08:** Projection section optional toggle; when ON, include per-component projections
- [x] **RP-06 / UX-08:** Output: clipboard (plain text) + print-optimized HTML (`window.print()`)
- [x] EC-03: all exempt → exemption-status-only report

**Acceptance:** Report renders without PII stored. Print stylesheet hides UI chrome. Copy pastes clean text.

---

### Sprint 7 - Polish, Accessibility, PWA

**Goal:** Production-ready. Offline capable. Accessible.

---

#### Task 7.1 - Accessibility + Responsive Polish

**Design references:** GR-09 (mobile-first), §10 Tech Stack

- [x] Touch targets ≥ 44px on all interactive elements (min-h-[44px] + py-2 on all buttons)
- [x] Bottom-anchored action buttons on mobile (sticky bottom-0 on Generate S-Code card)
- [x] ARIA labels on all inputs, toggles, and icon buttons (aria-label, htmlFor/id, role=switch, role=tablist/tab)
- [x] Keyboard navigation through all tabs and form fields (focus:ring on all interactive, role=tab with aria-selected, OnboardingModal Escape key)
- [x] Color contrast meets WCAG AA (verified: green/red badges pass at 7.5:1+ contrast; blue-100/blue-800 at 6.1:1)
- [ ] Test on iOS Safari + Chrome Android

---

#### Task 7.2 - PWA + Service Worker

**Design references:** §12 Phase P7

- [x] Vite PWA plugin (`vite-plugin-pwa`) installed and configured
- [x] `manifest.webmanifest`: name, short_name, icons (SVG any/maskable), theme_color, display=standalone, start_url/scope set to /Trajectory/
- [x] Service worker: cache-first via Workbox generateSW; precaches all static assets (JS, CSS, HTML, SVG); navigateFallback for SPA routing
- [x] Offline banner: `OfflineBanner.jsx` - shows "You're offline. All features still work." on window offline event; hides on online event
- [x] Install prompt: `InstallPrompt.jsx` - listens for beforeinstallprompt, shows "Install Trajectory" card bottom-right; calls event.prompt() on accept; dismissible

---

#### Task 7.3 - Scoring Chart Update Banner

**Design references:** EC-24, Risk Register (chart revision HIGH prob)

- [x] `CHART_VERSION` constant + `CHART_RELEASE_DATE` in `constants.js`; `ReportTab.jsx` imports from there (no duplicate)
- [x] Banner component `ChartUpdateBanner.jsx`: "Using Sep 2025 Provisional scoring tables. Check afpc.af.mil for updates." with link
- [x] Banner dismissible per session: sessionStorage key includes chart version (`pfa_chart_banner_dismissed_${CHART_VERSION}`) so bumping version shows banner again in the new session
- [x] When new chart data ships: bump `CHART_VERSION` + `CHART_RELEASE_DATE` in `constants.js`, add new table module to `scoringTables.js`; existing S-codes re-score automatically because they store raw values (GR-15) - documented in constants.js comment

---

### Sprint 8 - Practice Tools + BestScore Optimizer

**Goal:** Fill competitive gaps no existing app addresses: built-in practice timing tools and exercise-combo optimization.

**Research basis:** Competitive analysis (Appendix B) identified that every existing AF fitness app is score-in/score-out only. No app combines scoring with practice utilities. Community feedback (r/AirForce, app reviews) consistently requests: (1) integrated HAMR practice audio, (2) stopwatch for run timing, (3) "which exercise combo gives me the best score?"

---

#### Task 8.1 - Effort-Weighted Score Strategy Engine

**Rationale:** The USSF/USAF PFA Calculator app ($0.99) has a "BestScore" feature, but it is naive - it just picks the combo that produces the highest raw score without considering training effort. Running 30 seconds faster might yield +1 pt while doing 10 more push-ups yields +5 pts. A smarter engine analyzes the scoring curve slope at the user's current performance level to find where marginal effort produces the greatest score gain.

**Core concept - Marginal Return Analysis:**

Each scoring table defines a curve: performance input (reps, time, shuttles) mapped to points. The slope of that curve at the user's current value tells you how much score you gain per unit of improvement. Near the top of a curve, massive effort gains tiny points (diminishing returns). Near a pass/fail boundary, small effort gains large points (high leverage).

**Strategy engine logic:**

1. For each component, calculate the **marginal points per unit improvement** at the user's current value
   - Run: points gained per 10 seconds faster
   - HAMR: points gained per 2 additional shuttles
   - Push-ups/HRPU: points gained per 5 additional reps
   - Sit-ups/CLRC: points gained per 5 additional reps
   - Plank: points gained per 15 additional seconds
   - WHtR: points gained per 0.01 ratio improvement
2. Normalize across components by estimated **training effort per unit** (evidence-based from fitness research)
   - Example: gaining 5 push-up reps takes ~2 weeks of training; gaining 10s on 2-mile takes ~3-4 weeks
   - Effort estimates sourced from `docs/RESEARCH-FITNESS-PROGRAMS.md`
3. Rank components by **points-per-training-week** (effort-adjusted ROI)
4. Cross-exercise comparison: for each component, compare exercise options at equivalent effort
   - "10 more push-ups (+3.1 pts) vs 8 more HRPU (+4.2 pts) - both ~2 weeks training"
5. Output: prioritized strategy, not just a max-score combo

**Preference override system:**

- [x] User can "lock" any exercise choice (e.g., "I prefer HRPU regardless")
- [x] Locked exercises excluded from optimization - engine works around them
- [x] UI: lock icon toggle per component exercise selector
- [x] Locked preference saved to localStorage (`pfa_exercise_prefs`)
- [x] Strategy recalculates with locked choices as constraints
- [x] Display explains trade-off: "You chose HRPU (preferred). Push-ups would score +2.1 pts higher, but HRPU has better effort ROI at your level."

**Implementation:**

- [x] `strategyEngine(demographics, rawInputs, preferences)` - core analysis function
- [x] `marginalReturn(exerciseType, currentValue, bracket)` - slope at current point on scoring curve
- [x] `effortEstimate(exerciseType, currentValue, targetValue)` - weeks of training to bridge gap
- [x] Effort constants: `EFFORT_FACTORS` in `constants.js` (calibrated from fitness research)
- [x] Output per component: { exercise, currentPts, marginalROI, effortWeeks, recommendation }
- [x] Output overall: ranked list of "best bang for your training time" actions
- [x] Handle exemptions: skip exempt components
- [x] Handle "already maxed" components: flag as "no further gains possible"
- [x] UI: "Strategy" section in Self-Check results - prioritized action list
- [x] Display: "Focus Area: Core (+4.8 pts available, ~2 weeks). Your cardio is near ceiling (+0.3 pts available)."
- [x] Unit tests: verify marginal return calculation, preference locking, cross-component ranking

**File:** `src/utils/scoring/strategyEngine.js`

**Acceptance:** Engine correctly identifies highest-ROI component. Preference locks respected. Diminishing returns flagged. Effort estimates are reasonable (not arbitrary).

---

#### Task 8.2 - Stopwatch + Lap Timer

**Rationale:** Every Airman currently uses a separate phone clock app to time their 2-mile run practice. No existing AF fitness app includes a built-in timer. Integrating one keeps users in-app and enables direct score lookup from timed results.

- [ ] New tab or modal: "Practice Tools"
- [ ] Stopwatch: start/stop/reset with lap/split support
- [ ] Lap display: lap number, lap time, cumulative time
- [ ] Auto-score integration: "Your 2-mile time of 16:42 = X pts for your bracket"
- [ ] Persist last timed result in sessionStorage (offer to use in Self-Check)
- [ ] Large, touch-friendly controls (44px+ targets per GR-09)
- [ ] Works offline (no external dependencies)
- [ ] Screen wake lock (`navigator.wakeLock`) to prevent screen timeout during timing

**Acceptance:** Timer accurate to 0.1s. Lap splits display correctly. Score lookup works for user's bracket. Wake lock prevents screen sleep.

---

#### Task 8.3 - HAMR Practice Metronome

**Rationale:** HAMR failure is primarily a timing/rhythm problem, not a cardio problem (per r/AirForce community consensus). Official HAMR audio exists on SoundCloud and base websites, but no app integrates a metronome/beep generator. Users juggle separate audio files + timer apps. Building this with Web Audio API requires zero external dependencies.

- [x] HAMR beep generator using Web Audio API (no audio files needed)
- [x] Follows official Leger 20m shuttle protocol: Level 1 starts at ~8.5 km/h, increments per level
- [x] Beep cadence: one beep per shuttle, triple beep on level change
- [x] Visual display: current level, shuttle count within level, total shuttles, elapsed time
- [x] Auto-score: "You completed 54 shuttles = X pts for your bracket"
- [x] Pause/resume support
- [x] Level selector: start from any level (for experienced users warming up)
- [x] Audio works in background (for running with phone in pocket)
- [x] Screen wake lock during active session
- [x] Unit tests: verify beep intervals match official HAMR timing table per level

**File:** `src/utils/hamr/hamrMetronome.js` (pure timing logic), component in `src/components/tools/`

**Acceptance:** Beep intervals match official HAMR audio within 50ms tolerance. Shuttle count increments correctly per level. Auto-score matches scoring engine output.

---

#### Task 8.4 - Exercise Comparison View

**Rationale:** With multiple exercise options per component (run vs HAMR, push-ups vs HRPU, sit-ups vs CLRC vs plank), Airmen need to see how their performance translates across alternatives. No existing tool shows side-by-side "if you did X reps of push-ups, you'd need Y reps of HRPU for the same score."

- [ ] Side-by-side comparison: "With push-ups you'd score X, with HRPU you'd score Y"
- [ ] Per-component: show all exercise options and equivalent scores
- [ ] Accessible from Self-Check tab results
- [ ] Uses existing scoring engine - no new scoring logic
- [ ] Visual: bar chart or simple table comparing points per exercise option

**Acceptance:** Comparison accurately reflects scoring tables for all exercise options within each component.

---

### Sprint 9 - Training Resources + Curated Content

**Goal:** Bridge the gap between scoring and improvement with curated, evidence-based training guidance.

---

#### Task 9.1 - Curated Training Resource Links

**Rationale:** Multiple sources exist (HPRC, DVIDS official videos, Total Force Hub workout plans) but Airmen don't know where to find them. Centralizing verified links per component/exercise adds value without creating content or violating the no-backend constraint.

- [ ] Resource registry: `src/utils/training/resources.js` - static array of verified links
- [ ] Categories: per-component (cardio, strength, core, body comp) and per-exercise
- [ ] Include: DVIDS HAMR instruction video, HPRC training series, official HAMR audio (SoundCloud)
- [ ] Display: collapsible "Training Resources" section per component in Self-Check results
- [ ] Link validation: each entry has title, URL, source (official/vetted), and last-verified date
- [ ] No embedded content - external links only (no iframe, no video embed)
- [ ] Periodic review: documented process for verifying links still work

**Acceptance:** Each component has at least 2 verified training resource links. Links open in new tab. Sources attributed.

---

#### Task 9.2 - Personalized Training Suggestions

**Rationale:** The existing recommendation engine provides tiered tips (FAILING/MARGINAL/STRONG). Extending it with specific weekly training plans based on the user's weakest component and their gap to passing would match the Army's Guard Fit app feature set - which is frequently cited as a benchmark.

- [ ] Extend `recommendationEngine.js` with weekly plan generator
- [ ] Input: current component scores, target date, bracket
- [ ] Output: prioritized weekly plan (e.g., "3x interval runs, 2x HAMR practice, 1x long run")
- [ ] Plans scaled to gap size: larger deficit = more aggressive plan
- [ ] Time-aware: plans adjust based on weeks until target PFA date
- [ ] Display in Project tab alongside projection data
- [ ] Evidence basis: source from `docs/RESEARCH-FITNESS-PROGRAMS.md`

**Acceptance:** Training suggestions are specific to user's weakest component. Plans adjust based on time to target date.

---

## Competitive Analysis & Opportunity Assessment

*Added: March 2026 | Basis: App store analysis, community research (r/AirForce, app reviews), web tool survey*

### Appendix B: Competitive Landscape

#### Existing Apps & Web Tools

| Tool | Type | Cost | Key Features | Gaps |
|---|---|---|---|---|
| **USSF/USAF PFA Calculator** (Patrick Smith) | iOS/Android | $0.99 | All 2026 charts, BestScore optimizer, altitude adjust, exemptions | No history, no projection, no practice tools, no sharing |
| **Total Force Hub PT 2026** | Web | Free | Calculator, 4-week HAMR plan (blog), countdown timer | Static blog content, no save/track, no codes |
| **usafptcalculator.com** | Web | Free | All cardio options, score charts | Basic calc only, no history |
| **afptcalculator.com** | Web | Free | 2026 standards, practice scoring | Basic calc only |
| **airforceptcalculator.com** | Web | Free | Simplified scoring logic | Basic calc only, unofficial disclaimer |
| **Air Force Fitness Testing** | iOS | Free | Updated 2026 standards | Limited features |
| **AF Tracker** (meDEVELOPMENT) | iOS | Free | PT calc, test reminders, social | Outdated (pre-2026), no HAMR |
| **Guard Fit** (Army NG) | iOS/Android | Free | Track, Train, Compete, Tools | Army-specific (APFT/ACFT), not USAF |

#### Feature Comparison Matrix

| Feature | PFA Calc App | TFH Web | Other Web Calcs | Guard Fit (Army) | **Trajectory (Ours)** |
|---|---|---|---|---|---|
| 2026 score calculation | Yes | Yes | Yes | No (Army) | **Yes** |
| All exercise options | Yes | Yes | Partial | N/A | **Yes** |
| Effort-weighted strategy | **Yes** (naive) | No | No | No | Planned (Sprint 8) - effort-adjusted, with preference locks |
| Altitude adjustment | **Yes** | No | No | No | **Yes** (base registry) |
| Historical tracking | No | No | No | **Yes** | **Yes** (S-codes) |
| Score projection | No | No | No | No | **Yes** (Sprint 4) |
| Portable data (codes) | No | No | No | No | **Yes** (D-code/S-code) |
| Supervisor report | No | No | No | No | **Yes** (Sprint 6) |
| HAMR practice tool | No | No | No | No | Planned (Sprint 8) |
| Stopwatch/timer | No | No | No | No | Planned (Sprint 8) |
| Training plans | No | Static blog | No | **Yes** (auto-generated) | Planned (Sprint 9) |
| Web Share API | No | No | No | No | **Yes** |
| URL hydration | No | No | No | No | **Yes** |
| Offline/PWA | Native app | No | No | Native app | Planned (Sprint 7) |
| Privacy-first (no backend) | Unknown | Unknown | Unknown | Unknown | **Yes** |

#### Community-Identified Pain Points (r/AirForce, App Reviews, Forums)

1. **HAMR timing/rhythm** - "People who fail HAMR almost never lack cardio - they mis-time the first 3 turns." Users juggle separate SoundCloud audio + generic timer apps.
2. **Exercise choice confusion** - "I don't know if I should do push-ups or HRPU for my age bracket." No tool shows side-by-side comparison.
3. **No progress tracking** - #1 app review request: "Let me save workouts with dates to track improvement over time."
4. **Beep audio consistency** - "The beep timing feels inconsistent on older speakers." Need reliable, device-generated audio.
5. **Score-to-action gap** - Users get a score but no guidance on what to do about it. Guard Fit (Army) cited as benchmark.
6. **Fragmented tools** - Airmen use 3-4 separate apps: calculator + stopwatch + HAMR audio + notes app.

#### Our Differentiation (Already Built or In Progress)

| Differentiator | Status | Competitive Position |
|---|---|---|
| Portable S-code/D-code system | Complete | **Unique** - no competitor has portable data |
| Score projection engine | Sprint 4 | **Unique** - no competitor projects future scores |
| Supervisor report generation | Sprint 6 | **Unique** - no competitor generates reports |
| Web Share API + URL hydration | Sprint 3 (complete) | **Unique** - no competitor has code sharing |
| Tiered recommendations | Complete | Partial match (Guard Fit has auto plans) |
| Privacy-first / zero-backend | Complete | **Unique** - all competitors are opaque on data |
| Diagnostic period detection | Complete | **Unique** - auto-detects from S-code date |

#### Recommended Priorities (New Features)

| Priority | Feature | Sprint | Effort | Value | Rationale |
|---|---|---|---|---|---|
| **P1** | Effort-weighted score strategy | 8.1 | Medium | High | Smarter than competitor BestScore - analyzes marginal ROI per training hour, not just max score. Includes preference overrides. |
| **P2** | HAMR practice metronome | 8.3 | Medium | High | No competitor has this; addresses #1 community pain point |
| **P3** | Stopwatch + lap timer | 8.2 | Low | Medium | Consolidates fragmented tool use; keeps users in-app |
| **P4** | Exercise comparison view | 8.4 | Low | Medium | Addresses exercise choice confusion; simple UI over existing engine |
| **P5** | Curated training links | 9.1 | Low | Medium | Low effort, curated official resources (DVIDS, HPRC) |
| **P6** | Personalized training plans | 9.2 | High | High | Matches Guard Fit benchmark; needs research-backed plans |

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
1. `scoringEngine.js` - all SL rules + EC edge cases (Task 2.1)
2. `scode.js` V3 - round-trip encode/decode, boundary values (Task 2.2)
3. `projectionEngine.js` - model accuracy, clamping, age-rollover (Task 4.1)

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

| Sprint | Tasks | Status | Key Deliverable |
|---|---|---|---|
| 2 | 2.1, 2.2, 2.3 | ✅ Complete | Hardened engine + full S-code V3 + URL hydration |
| 3 | 3.1, 3.2, 3.3 | ✅ Complete | Self-Check tab feature-complete |
| 4 | 4.1, 4.2 | ✅ Complete | Projection engine + Project tab |
| 5 | 5.1 | ✅ Complete | History tab with trend chart |
| 6 | 6.1 | ✅ Complete | Report generation |
| 7 | 7.1, 7.2, 7.3 | ✅ Complete | PWA + accessibility + chart update banner |
| 8 | 8.1, 8.2, 8.3, 8.4 | 🔄 In Progress | 8.1 complete (effort-weighted strategy engine); 8.2 complete (stopwatch); 8.3 complete (HAMR metronome); 8.4 pending (exercise comparison) |
| 9 | 9.1, 9.2 | ❌ Pending | Curated training resources + personalized training plans |
