# Trajectory - Kitchen Sink Polish Sprint

## Context

Trajectory is a mobile-first USAF PFA readiness tracker (`/mnt/cephfs/shared/projects/Trajectory/`, branch `claude/kitchen-sink-polish-sprint`, fresh merge of `main` at commit 627a83c). User walked through the live GitHub Pages build and the source tree and surfaced a backlog covering scoring-correctness bugs, cosmetic preferences that don't wire through, missing training-plan features, and UI inconsistency. This plan bundles all of it into one polish sprint.

**Problem being solved.** Scoring display lies on failing components (shows percentage of max instead of zero toward composite, no minimum-to-pass hint). "Training Exercise Preferences" in Trajectory is cosmetic - it doesn't drive the calendar or reverse-scoring. The Training Plan's Regenerate button does nothing useful and there's no backup path. Users are locked to 3 training days. Reverse Crunch exists in the engine but isn't selectable in the picker. The ProjectTab's "Personalized Weekly Training Plan" duplicates the dedicated Plan view. Milestones on Profile are dead-text prompts; they should live where users actually see them. HAMR metronome tones sound bad. Official AFPC charts may have drifted from ours.

**Intended outcome.** Polish-sprint PR on `claude/kitchen-sink-polish-sprint` that lands Tasks 1-7 and 9-10 (Task 8 absorbed into Task 2), keeps all 790 tests green, stays lint-clean at zero warnings, introduces no new em/en dashes, and surfaces no codec jargon in UI.

## Sprint-level completion tracker

- [x] Task 1 - Scoring correctness + PFRA chart diff + minimum-to-pass surfacing (shipped `bdded00`)
- [x] Task 2 - Unified ExercisePreferencePicker (shipped `dd2865d`)
- [x] Task 3 - Full-state backup and restore (shipped `4854cde`)
- [x] Task 4 - Calendar days freedom + overtraining modal + constant-load scaling (shipped `claude/implement-task-3-agents-Xeq9k`)
- [x] Task 5 - Pill selector standardization (shipped `claude/complete-task-5-kitchen-sink-fLqq1`)
- [ ] Task 6 - Milestones relocation
- [x] Task 7 - ROI math transparency
- [x] Task 9 - HAMR countdown cadence simplification (shipped `4de016c`)
- [ ] Task 10 - AFPC research stream
- [x] **Added mid-sprint:** AF Form 4446 PDF generator (`504aa51`, `5d7cc85`, `729edf1`, `57ea675`, `8a1595c`) - pdf-lib AcroForm with 4 PKCS#7 signature widgets. Wired into SelfCheck + History tabs (`3c34a25`).
- [x] **Added mid-sprint:** Q11 scoring duplication audit - see [`docs/SCORING-DUPLICATION-MAP.md`](../SCORING-DUPLICATION-MAP.md) (828 lines, 134 touch points across 32 files). Prerequisite for the downstream rewrite items below.
- [x] **Added mid-sprint (2026-04-19):** HAMR level-up audio now reuses the start-of-session 3-2-1-GO countdown pattern (see Task 9 section below) instead of the original triple beep.
- [x] **Added mid-sprint (2026-04-19):** No-forced-flows modal audit - OnboardingModal, OvertrainingWarningModal, UnsavedWarningModal, ReportTab alert(). Policy captured as durable feedback memory (`feedback_no_forced_flows.md`).
- [x] **Added mid-sprint (2026-04-19):** DAFMAN 36-2905 (24 Mar 2026) re-alignment (`1862db6`) - three §-level fixes against the newly-downloaded regulation: sub-chart-min scores 0 external per §3.7.4, WHtR truncated (not rounded) per §3.15.4.2, Body Composition has no per-component minimum per §3.7.1. Also lands the minimum-viable half of the D1 two-number split: `lookupScore` now returns both `points` (DAFMAN-literal external) and `internalPoints` (chart-min clamp for projection/ROI). Linear-extrapolation-below-floor still deferred to the full D1 PR. 853 tests green.
- [ ] All 853 existing + new tests green
- [ ] `npm run lint` zero warnings
- [ ] Grep sweep clean (no em/en dashes, no codec jargon, no internal tracking IDs)
- [ ] Sprint PR merged to `main`

## Confirmed facts (from code + live HTML snapshot + user)

- Five tabs at top: Profile, Self-Check, Trajectory, History, Tools (`src/components/layout/TabNavigation.jsx:9-15`).
- Profile renders a **Milestones** section via `<AchievementBadges>` (`src/components/shared/AchievementBadges.jsx:128`). This is the component the user wants moved to HistoryTab, below exports.
- Trajectory's "Milestones" are a DIFFERENT concept - a chart-overlay toggle for taper/mock-test/fractional-test dates (`src/components/tabs/ProjectTab.jsx:215-219`). Not moving.
- PFRA Scoring Charts PDF is at repo root: `PFRA Scoring Charts.pdf`.
- `pfaPreferences` already exists in AppContext (`src/context/AppContext.jsx:354-361,403,424`) and storage - shape is extensible, not a rewrite.
- Reverse Crunch (CLRC) already lives in `resources.js:247-285` and `EXERCISES.CLRC`; preference picker just needs to expose it.
- Reverse lookup already handles all 8 exercises (`src/utils/scoring/reverseScoring.js:88-130`) - "minimum to pass" is a wrapper call, not new engine math.
- Walk-fail cascade already exists (`src/utils/scoring/scoringEngine.js:304-305`) - replicable pattern for below-minimum component handling.
- Days-per-week locked to 3 at three gate sites in PlanTab (`src/components/tabs/PlanTab.jsx:549,668,678`).
- HAMR countdown synthesizes oscillator tones in `src/components/tools/HamrMetronome.jsx:38-155`. Current pattern emits **seven total signals**: three 440Hz tones ("3"), two 440Hz tones ("2"), one 660Hz tone ("1"), plus an ascending sweep ("go"). Tones sound fine; the pattern is too busy and hard to read.

## User decisions locked during planning

- **Milestones source.** AchievementBadges on Profile (confirmed via live HTML snapshot). Move to HistoryTab below Export/Import.
- **Max training days.** No cap. Range 3-7, one overtraining modal on first >3 selection, no further friction.
- **HAMR audio.** Simplify the countdown pattern, no binary MP3/OGG assets this sprint. Tones themselves sound fine; there are just too many of them and the pattern is not legible. Reduce to a small number of clearly-spaced signals. User will author a real 3-2-1 sample in a future pass.
- **Below-minimum display.** Show raw score with "FAIL - 0 toward composite" label, zero composite contribution, force overall FAIL.
- **Minimum-to-pass surface.** SelfCheckTab, Trajectory (ProjectTab), and Supervisor Report only. Not History.
- **ExercisePreferencePicker.** One shared component using PlanTab's visual style. Replaces both the PlanTab preference panel and Trajectory's "Training Exercise Preferences" block.
- **Preferences defaulting.** Infer from latest assessment code's recorded exercises; fall back to run / push-ups / sit-ups / WHtR only when no history exists.
- **Backup scope.** Full-state export + file-picker restore with overwrite confirm modal.
- **AFPC scrape.** Findings inline in `docs/DEVELOPMENT_PLAN.md` as lower-priority candidate sprints - no separate research doc.

## Constraints (non-negotiable, from `CLAUDE.md`)

- No backend, no analytics, no third-party runtime deps beyond bundled.
- No em dashes or en dashes anywhere; hyphens only.
- No codec jargon in UI: "profile code" and "assessment code" exclusively.
- No internal tracking IDs (TR-XX, PG-XX, etc.) in user-facing text.
- Cardio vs strength phrasing must stay separated via `getRepInstruction(sessionType)`.
- All 790 existing tests stay green.

## Task list

### Task 1 - Scoring correctness + PFRA chart diff + minimum-to-pass surfacing (L)

- [x] **Task 1 complete** (shipped `bdded00 feat: scoring correctness - below-min fix, min-to-pass hints, ROI boost, chart diff`)

Fix the below-minimum bug, surface minimum-to-pass on failure, diff local tables against the official PDF.

**Scope.**
- [ ] Parse `PFRA Scoring Charts.pdf` at repo root, diff against `scoringTables.js`. Reconciliation note goes into `docs/DEVELOPMENT_PLAN.md` under a new "AFPC chart reconciliation" subsection. If diffs exist, fix table values in the same PR as the test-fixture updates.
- [ ] In `scoringEngine.js`, when a component scores below its DAFMAN minimum: display the raw score, tag "FAIL - 0 toward composite", contribute 0 to composite, and cascade to `overallPass: false`. Mirror the walk-fail precedent at `scoringEngine.js:304-305`.
- [ ] Add `getMinimumToPass(exercise, age, gender)` wrapper in `reverseScoring.js` that returns the performance value meeting the 60% component minimum (50% for body comp).
- [ ] Wire the minimum-to-pass display into SelfCheckTab (inline under each failing exercise input), ProjectTab (inline in each failing component card), and ReportTab (inline in per-component section).
- [ ] Reweight strategy engine so failing components outrank passing-but-low ones in TOP ROI (multiplicative boost on the ROI score when the component is below minimum).

**Files.**
- `PFRA Scoring Charts.pdf` (read-only source)
- `src/utils/scoring/scoringEngine.js:136,153-175,200,236,262,295-316`
- `src/utils/scoring/reverseScoring.js:88-130` (new `getMinimumToPass` export)
- `src/utils/scoring/scoringTables.js` (only if PDF diff forces value changes)
- `src/utils/scoring/strategyEngine.js` (failing-component ROI boost)
- `src/components/tabs/SelfCheckTab.jsx` (failing-input hint)
- `src/components/tabs/ProjectTab.jsx` (failing-component hint)
- `src/components/tabs/ReportTab.jsx` (failing-component hint)

**Reused.** Walk-fail cascade pattern; existing `failedComponents` accumulator at `scoringEngine.js:236`; existing reverse lookup per-exercise logic.

**Risks.** PDF diff may cascade into test-fixture churn across `scoringEngine.test.js`, `strategyEngine.test.js`, `optimalAllocation.test.js`. Mitigation: diff-first inspection, all table/test updates in the same commit.

### Task 2 - Unified ExercisePreferencePicker (L, absorbs original Tasks 8, 9, 10, 11)

- [x] **Task 2 complete** (shipped `dd2865d`)

Single preference component serving both PlanTab (formerly "PFA Events") and Trajectory's "Training Exercise Preferences". Wires to calendar and reverse-scoring.

**Scope.**
- [x] New `src/components/shared/ExercisePreferencePicker.jsx` using PlanTab's existing preference panel style (`PlanTab.jsx:1011,1330-1372`) as canonical.
- [x] Categories: Cardio (run / HAMR / 2km walk), Strength (push-ups / HRPU), Core (sit-ups / CLRC / plank), Body Comp (WHtR). CLRC explicitly selectable - resolves original Task 8.
- [x] Rename PlanTab label "PFA Events" to "PFA Event Preferences".
- [x] Replace Trajectory's "Training Exercise Preferences" block (`ProjectTab.jsx:1333`) with the new component.
- [x] Extend `normalizePfaPreferences` in `exercisePreferences.js` so CLRC / HRPU / 2km-walk are explicit keys with migration-safe defaults.
- [x] Preference writes drive: `trainingCalendar.js` session-exercise picks, `strategyEngine.js` ROI lane selection via `toStrategyPrefs()`. Single source of truth in context state.
- [x] Defaulting: when `pfaPreferences` is unset, read the newest S-code and infer its recorded exercises; only fall back to run / push-ups / sit-ups / WHtR when no assessments exist.
- [x] Audit and either wire or delete every cosmetic button in the preference panels on PlanTab and ProjectTab.

**Files.**
- `src/components/shared/ExercisePreferencePicker.jsx` (NEW)
- `src/components/tabs/PlanTab.jsx:1011,1013,1330-1372` (replace panel, rename label)
- `src/components/tabs/ProjectTab.jsx:27,598,1247,1333` (replace preference block)
- `src/components/tabs/SelfCheckTab.jsx` (read prefs for pre-select)
- `src/context/AppContext.jsx:354-361,403,424` (extend normalizer)
- `src/utils/training/exercisePreferences.js` (migration-safe keys + inference-from-latest-scode helper)
- `src/utils/training/phaseEngine.js` (audit core-session branch for CLRC routing)
- `src/utils/training/trainingCalendar.js` (consume pref-driven exercise picks)

**Reused.** Existing `pfaPreferences` context slot; existing `resources.js:247-285` CLRC entries; existing storage round-trip.

**Dependencies.** Task 1 (minimum-to-pass API must exist before preferences can drive it).

### Task 3 - Full-state backup and restore (M)

- [x] **Task 3 complete** (shipped `4854cde`)

Replace the non-functional PlanTab Regenerate button with a Back-Up action; build export + restore.

**Scope.**
- [x] Define backup JSON shape: `{ version, exportedAt, dcode, scodes, pfaPreferences, preferredDays, targetPfaDate, phaseState, sessionProgress, intensityScaling, onboardingFlags, showMilestones, overtrainingAck }`.
- [x] Extend HistoryTab's existing JSON export (`HistoryTab.jsx:324-389`) to cover the full state rather than just scodes.
- [x] Replace PlanTab's Regenerate button (`PlanTab.jsx:850-855`) with a "Back Up" button that invokes the same export.
- [x] Add restore via file picker: `<input type="file" accept="application/json">` + schema-version validation + blocking overwrite-confirm modal before write.
- [x] Expose `exportFullState()` and `importFullState(obj)` helpers in `localStorage.js`.

**Files.**
- `src/components/tabs/HistoryTab.jsx:324-389,479` (extend export UI, add import)
- `src/components/tabs/PlanTab.jsx:850-855` (swap button target)
- `src/components/shared/OverwriteConfirmModal.jsx` (NEW)
- `src/utils/storage/localStorage.js:322,339,383,412` (add full-state helpers)

**Reused.** HistoryTab's existing JSON export scaffolding; existing localStorage key inventory at line 412.

**Dependencies.** Tasks 1 + 2 (backup schema must capture the new pref shape and any new state keys they add).

### Task 4 - Calendar days freedom + overtraining modal + constant-load scaling (M)

- [x] **Task 4 complete**

Allow 3-7 training days; show a blocking modal once per profile on first selection above 3; phase engine keeps per-session load constant.

**Scope.**
- [x] Remove the three `preferredDays.length !== 3` gates in `PlanTab.jsx:549,668,678`. (Gate updated to `< 3` at line 699; toggle capped at 7 via `next.length > 7` guard.)
- [x] Allow selection of 3-7 days. No upper cap beyond 7. (`handleToggleDay` max=7, `handleConfirmDays` min=3/max=7 enforced.)
- [x] First time a user selects >3 days, fire a blocking modal: `"Rest is integral to the plan. The biggest risk is injury forcing time off."` Single ack persisted at `pfa_overtraining_ack` in localStorage. Do not re-prompt after ack. (OvertrainingWarningModal wired; `handleOvertrainingAcknowledge` sets ack; subsequent calls skip modal.)
- [x] `phaseEngine.js`: keep per-session volume invariant; weekly volume scales linearly with day count. Do NOT pro-rate. Audit session-generation first, document current behavior in a short note in `docs/DECISIONS.md`. (Confirmed: `prescribeSession` has no `preferredDays` param; DECISIONS.md lines 284-297 document this. New `phaseEngine.test.js` suite of 7 invariance tests verifies the guarantee.)
- [x] `trainingCalendar.js`: layout respects variable day count; avoid back-to-back hard sessions by default when count permits. (Calendar uses `getTrainingDaysForWeek(week, preferredDays)` - any count 3-7 works. BUILD_PLUS HIGH sessions at non-adjacent template indices 0 and 3; BASE/BUILD have no HIGH sessions. UI `hasConsecutiveDays` warning guards against user-selected consecutive days.)

**Files.**
- `src/components/tabs/PlanTab.jsx:549,668,678,921-1005`
- `src/components/shared/OvertrainingWarningModal.jsx` (NEW)
- `src/utils/training/phaseEngine.js` (audit + invariance guarantee)
- `src/utils/training/trainingCalendar.js` (variable-day layout)
- `src/utils/storage/localStorage.js` (add `pfa_overtraining_ack` helpers)

**Reused.** Existing `preferredDays` persistence path.

**Dependencies.** Task 2 (reuse the picker's pill style for the day selector).

### Task 5 - Pill selector standardization (M)

- [x] **Task 5 complete**

One canonical pill component used everywhere.

**Scope.**
- [x] Audit every inline pill/segmented-control pattern. Grep already flagged SelfCheckTab, PlanTab, ProjectTab, ExerciseComparison, OnboardingModal, Header, HintBanner, RunPacer, InstallPrompt, HamrMetronome, ReportTab. Confirmed actual pill/toggle patterns in SelfCheckTab (SegmentedControl x5, ToggleSwitch x1), PlanTab (day picker x2), and ReportTab (inline boolean toggle x1). Other flagged files only have decorative rounded-full elements, no interactive pill selectors.
- [x] Extract `<PillGroup>` (updated: multi-select + activeColor), `<PillToggle>` (new: boolean toggle), and `<SegmentedControl>` (new: moved from SelfCheckTab) into `src/components/shared/`. Single-select, multi-select, and boolean toggle variants supported.
- [x] Replace all ad-hoc pill markup with the shared components. Tailwind class names consolidated: SelfCheckTab local SegmentedControl and ToggleSwitch removed; ReportTab inline toggle replaced with PillToggle; PlanTab day picker buttons replaced with PillGroup multi.

**Files.**
- `src/components/shared/PillGroup.jsx` (NEW)
- `src/components/shared/PillToggle.jsx` (NEW)
- The 11 files enumerated above.

**Reused.** Existing Tailwind color tokens and focus-ring styles.

**Risks.** Scope creep into other UI inconsistencies. Mitigation: pills only; note other drift for a follow-up.

**Dependencies.** None, but should land before Task 2 so `<PillGroup>` is available when the picker is built. See execution order.

### Task 6 - Milestones relocation (S)

- [ ] **Task 6 complete**

Move `<AchievementBadges>` from ProfileTab to HistoryTab, below Export/Import.

**Scope.**
- [ ] Remove the AchievementBadges section from ProfileTab's render tree.
- [ ] Render it in HistoryTab directly below the Export/Import controls at `HistoryTab.jsx:479`.
- [ ] Storage key `pfa_show_milestones` is unchanged. Context plumbing untouched.
- [ ] ProjectTab's chart-overlay milestones (separate concept: taper/mock-test/fractional-test markers) are untouched.

**Files.**
- `src/components/tabs/ProfileTab.jsx` (remove AchievementBadges render)
- `src/components/tabs/HistoryTab.jsx:479` (add AchievementBadges render below exports)
- `src/components/shared/AchievementBadges.jsx` (no change, confirmed standalone)

**Reused.** `<AchievementBadges>` as-is; `showMilestones` context stays.

**Dependencies.** None.

### Task 7 - ROI math transparency (M)

- [ ] **Task 7 complete**

Replace Trajectory's "Personalized Weekly Training Plan" collapsible with an ROI breakdown panel.

**Scope.**
- [ ] Delete the "Personalized Weekly Training Plan" collapsible at `ProjectTab.jsx:609-651`. It duplicates PlanTab poorly.
- [ ] In its place, render `<ROIBreakdownPanel>` showing:
  - (a) Per-component: current points, projected points, delta, and points-per-standard-improvement unit (e.g., "every 30s off the run = +4 pts").
  - (b) Composite contribution formula: `sum(componentPoints * weight) / 100` with live values substituted.
  - (c) ROI ranking derivation: marginal-cost curve per component explaining why Component X ranks above Component Y.
- [ ] Walkthrough copy alongside each section: what the number means, why it matters, what the user can act on.

**Files.**
- `src/components/tabs/ProjectTab.jsx:609-651,653` (remove Weekly Training Plan block)
- `src/components/shared/ROIBreakdownPanel.jsx` (NEW)
- `src/utils/scoring/strategyEngine.js` (expose breakdown data if not already)
- `src/utils/scoring/optimalAllocation.js` (source of ranking)

**Reused.** `strategyEngine.js` and `optimalAllocation.js` already compute the underlying math; this is display-only.

**Dependencies.** Task 1 (ROI reweighting for failing components lands there; panel must reflect it).

### Task 8 - Absorbed

CLRC library addition is folded into Task 2 (picker exposes it; entries confirmed in `resources.js:247-285`). No separate work.

### Task 9 - HAMR countdown cadence simplification (S, no binary assets this sprint)

- [x] **Task 9 complete** (shipped `4de016c feat(task-9,pdf): HAMR cadence simplification + AF Form 1067 PDF generation`)
- [x] **Task 9 revisit (2026-04-19):** level-up signal (previously a triple beep at the end of each level) now reuses the same 440 Hz / sweep countdown pattern as session start, so level transitions are audibly identical to the 3-2-1-GO. Implemented by routing the level-change branch of `scheduleAudioBeep` through the existing `scheduleCountdownTone` / `scheduleSweepTone` helpers in `HamrMetronome.jsx`.

The current cadence emits seven signals (3 + 2 + 1 + sweep) which the user reports as too many and hard to read. Reduce to a clear Mario-Kart-style "3-2-1-GO" - four total signals - without changing timbre. User plans a sampled audio replacement in a future pass; this sprint is cadence only.

**Scope.**
- [ ] Replace `scheduleCountdown` in `HamrMetronome.jsx:124-151` with a four-signal pattern:
  - Tone 1 at t=0.0: 440Hz triangle, 0.4s ("3")
  - Tone 2 at t=1.0: 440Hz triangle, 0.4s ("2")
  - Tone 3 at t=2.0: 440Hz triangle, 0.4s ("1")
  - Final sweep at t=3.0: ascending 660->1320Hz over 0.6s ("GO")
  - Post-sweep pause then shuttle starts (total countdown ~4.1s, down from ~5.3s).
- [ ] Update `COUNTDOWN_TOTAL_S` constant to reflect the new total duration.
- [ ] Update the timeline-comment block at `HamrMetronome.jsx:51-56,114-123` to match.
- [ ] Simplify `navigator.vibrate` haptic pattern at line 148 to three short pulses plus one long (matches the new four-signal cadence).
- [ ] Preserve `scheduleCountdownTone`, `scheduleSweepTone`, and the skip/silence path - only the orchestration changes.

**Files.**
- `src/components/tools/HamrMetronome.jsx:38-56,114-151`

**Reused.** All existing oscillator/gain helper functions stay. No timbre changes (user confirmed tones themselves sound fine).

**Dependencies.** None.

### Task 10 - AFPC research stream (M, docs only)

- [ ] **Task 10 complete**

Recon https://www.afpc.af.mil/Career-Management/Fitness-Program/ and feed future sprints.

**Scope.**
- [ ] Fetch the AFPC Fitness Program page + PFRA scoring charts link.
- [ ] Produce three appended subsections in `docs/DEVELOPMENT_PLAN.md` under a new "AFPC recon (lower-priority candidate sprints)" heading:
  - (a) Table diff summary (complements Task 1's PDF diff with any web-only content).
  - (b) Exercises and policies we do not yet support, grouped by user value and feature similarity.
  - (c) Harvested official UI phrasing candidates.

**Files.**
- `docs/DEVELOPMENT_PLAN.md` (append section)

**Risks.** CAC-gated content would stall this. Mitigation: if pages require auth, document what's blocked and defer that subset.

**Dependencies.** Task 1 (table diff is synergistic).

## Execution order

- [ ] **Wave A (foundations, parallel).** Task 1, Task 5.
  Task 1 resolves the PDF diff question and lands the scoring/reverse-scoring APIs the rest depends on. Task 5 produces `<PillGroup>` for Task 2 to consume.
- [ ] **Wave B (preferences + backup, sequential).** Task 2, then Task 3.
  Task 2 sets the preference shape; Task 3's backup schema captures it.
- [ ] **Wave C (calendar + relocation + ROI, parallel).** Task 4, Task 6, Task 7.
  Task 7 depends on Task 1's failing-component ROI; Task 4 depends on Task 2's pill style.
- [ ] **Wave D (audio + research, parallel).** Task 9, Task 10.

## Validation

**Per task.**
- [ ] Task 1: add `scoringEngine.test.js` cases for below-min zero-composite + `overallPass: false`; `reverseScoring.test.js` cases for `getMinimumToPass` across all exercises and both genders; manual browser check that SelfCheckTab/Trajectory/ReportTab show "FAIL - 0 toward composite" labels with minimum-to-pass hints.
- [ ] Task 2: new `exercisePreferences.test.js` round-trip covering CLRC / HRPU / 2km-walk; manual preview where picker selection changes reverse-scoring targets in Trajectory and practice-session exercise in the calendar; grep confirms "PFA Events" -> "PFA Event Preferences".
- [x] Task 3: `localStorage.test.js` round-trip for `exportBackup`/`importBackup` verified (12 tests in localStorage.test.js cover export, import, invalid JSON, and key allow-list filtering); 998 tests green; lint zero warnings; all 15 implementation criteria verified by automated agent inspection.
- [x] Task 4: `phaseEngine.test.js` 7 new invariance tests pass (1005 total). Manual flow verified by agent code-trace: picks 5 -> modal fires (line 562-564); picks 5 again -> no modal (`!overtrainingAck` is false); picks 7 -> no friction (line 561 passes, line 562 skips). All 8 flow scenarios PASS.
- [ ] Task 5: visual diff of all 11 touched files; lint zero warnings; no behavior tests needed.
- [ ] Task 6: manual check that ProfileTab no longer renders AchievementBadges; HistoryTab shows it below Export/Import; ProjectTab chart overlay untouched.
- [ ] Task 7: snapshot test on `<ROIBreakdownPanel>`; manual spot-check that displayed numbers match `optimalAllocation.getAllocation()` output.
- [ ] Task 9: manual listen on iOS Safari and Chrome desktop; confirm four-signal 3-2-1-GO cadence is unambiguous and total countdown duration is ~4.1s; haptic pattern matches the new signal count.
- [ ] Task 10: `docs/DEVELOPMENT_PLAN.md` has the new section with all three subsections populated.

**Global gates (every PR).**
- [ ] `npm run lint` zero warnings.
- [ ] `npm test` all 790 existing + newly-added tests pass.
- [ ] `npm run dev` launches and every tab renders without console error.
- [ ] Grep sweep: no new em dashes (`–`) or en dashes (`—`); no "D-code" / "S-code" leaking into user-facing strings; no internal tracking IDs (`TR-`, `PG-`, `CS-`, `IV-`, `RP-`) in UI text.

## Deliverables

- [ ] Nine code-touching tasks landed (Task 8 absorbed into Task 2).
- [ ] `docs/DEVELOPMENT_PLAN.md` appended with AFPC recon section.
- [ ] `docs/DECISIONS.md` appended with the phase-engine constant-per-session decision.
- [ ] This plan at `/root/.claude/plans/functional-squishing-squid.md`.
- [ ] One planning entry added to `docs/DEVELOPMENT_PLAN.md` backlog referencing this plan.

## Mid-sprint additions (not in original plan, landed anyway)

Two workstreams appeared mid-sprint, got executed, and now belong in the status ledger so someone re-opening this plan doesn't think they're missing.

### A - AF Form 4446 PDF generation

- [x] `src/utils/pdf/generateFormPDF.js` migrated from jsPDF visual replica to `pdf-lib` AcroForm (1013 lines).
- [x] Four PKCS#7 signature widgets wired: `pfra_admin_sig`, `member_sig`, `fac_ufac_sig`, `commander_sig`. Each has a `/SigFieldLock /Include` array pinning the subset of fields that widget locks.
- [x] CAC auto-fill via document-level JavaScript - signer CN (`LAST.FIRST.MIDDLE.EDIPI`) populates name fields on sign.
- [x] Member-testing checkboxes (Accept as Official / Accept as DPFRA attempt / Dispute results), DNF, eligible-diagnostic, FAC/UFAC validity radios, POC block (`Controlled by: AF/A1P`, `POC: AF.A1P.Workflow@us.af.mil`), verbatim Privacy Act authority block, 3x waist measurement fields + average, body-fat percentage.
- [x] Integrated into SelfCheckTab and HistoryTab download actions (`3c34a25`).
- [x] Scored WHtR value persisted (not recomputed from raw) to keep display consistent with composite (`729edf1`).
- [x] Unauthorized watermark / disclaimer removed (`8a1595c`) - see memory entry `feedback_no_unauthorized_additions.md`.

Reusable tooling produced this session, **intentionally kept uncommitted** (user directive: "Keep don't commit beyond scope"):
- `scripts/pdf-to-html-form.mjs` - reusable PDF to HTML-form converter. Text PDFs via `pdftotext -bbox-layout`; image PDFs via `tesseract ... tsv` when `--tesseract` flag and binary are present; background-only fallback otherwise. Emits `<output>.html` + `<output>-assets/` (rendered PNGs via `pdftoppm`). Tested on our own generator output (68 fields inferred). Not yet tested on an image-only official PDF - tesseract was not installed on this node.

### C - No-forced-flows modal audit (2026-04-19)

User directive: "every modal every click [should] be able to be backed out [or] navigated to, not be locking [or] forced, unless this was a prior design choice that explicitly states it." Captured as durable feedback memory (`feedback_no_forced_flows.md`) so future modal work honors it by default.

Audited five modal surfaces + one OS `alert()`; four needed fixes, one (`ShareModal`) and one (`InstallPrompt`) were already clean.

- [x] `src/components/layout/OnboardingModal.jsx` - added always-visible × close button (top-right, all slides including first and last) and backdrop click dismiss. Both route through `handleSkip` so first-run still navigates to Profile and reopens simply close.
- [x] `src/components/shared/OvertrainingWarningModal.jsx` - added ESC key handler, backdrop click dismiss, and × close button. All three route to `onCancel`. Previously the only exits were the two action buttons.
- [x] `src/context/AppContext.jsx` `UnsavedWarningModal` - added visible "Keep editing" button between "Save Assessment" and "Leave without saving". ESC and backdrop click were already wired but the only visible options committed to an action.
- [x] `src/components/tabs/ReportTab.jsx` - replaced OS-native `alert('Failed to generate PDF...')` with `addToast(msg, 'error')` so PDF-generation failures surface as a dismissable toast instead of a blocking modal.

**Verification.** `npm run lint` zero warnings, `npm run build` clean.

### D - DAFMAN 36-2905 (24 Mar 2026) re-alignment (2026-04-19, shipped `1862db6`)

User pulled the current DAFMAN 36-2905 (dated 24 March 2026, supersedes the 22 April 2022 edition) and asked to diff it against what the scoring engine encodes. Three drift items surfaced - all three fixed in one commit with test suite updated atomically.

- [x] **§3.7.4 sub-chart-min = 0 external.** `scoringEngine.js` `lookupScore` no longer clamps sub-chart-min reps/durations to chart-minimum points. Returns `{ points: 0, internalPoints: <chart-min> }` for below-floor performance on reps-based, HAMR, plank, and time-based exercises. WHtR exempt (its chart already encodes 0 for ≥0.60, so external and internal coincide).
- [x] **§3.15.4.2 WHtR truncation.** Changed `Math.round(value * 100) / 100` to `Math.floor(value * 100) / 100` in `lookupScore`. 0.499 now stays at 0.49 (20 pts) instead of rounding up to 0.50 (19 pts). 0.559 stays at 0.55 (passing), 0.560 becomes 0.56.
- [x] **§3.7.1 Body Composition has no per-component minimum.** Removed `[COMPONENTS.BODY_COMP]: 50.0` from `COMPONENT_MINIMUMS`. Callers updated: `getMinimumToPass` returns `null` for WHtR, `projectionEngine.getMinPassingValue` returns `null` for bodyComp, `projectComponent` treats undefined minPct as 0 (always "passes" the component gate). The BFA failure gate (§3.1.2.1.1, WHtR >.55 AND composite <75) stays separate and is not enforced in this model yet.
- [x] **Two-number split (partial).** `lookupScore` now returns `{ points, maxPoints, percentage, internalPoints }`. `calculateComponentScore` propagates `internalPoints`. This is the minimum-viable half of D1 below - the API is shaped for it but does not yet do full linear extrapolation below floor.
- [x] **Tests updated (853 green).** Flipped sub-chart-min expectations from chart-min to 0 across `scoringEngine.test.js`, `scoringEngine.edgecase.test.js`, plus internalPoints assertions. `reverseScoring.test.js` 6 WHtR `getMinimumToPass` tests now expect `null`. `projectionEngine.test.js` + `.edgecase.test.js` WHtR threshold tests expect `null`. `optimalAllocation.edgecase.test.js` WHtR-0.60 `belowMinimum` now `false`.
- [x] **CLAUDE.md** regulatory citation updated; scoring rules section rewritten.

This landing **partially** subsumes D1 below - specifically the two-number API shape and the sub-floor = 0 external rule. The remaining D1 work (linear extrapolation below floor with 2x-floor hard cap for internal score, and audit of all internal-score consumers) is still open.

- [x] `docs/SCORING-DUPLICATION-MAP.md` produced - 828 lines, 134 scoring touch points across 32 files, grouped ENGINE (5) / AGGREGATION (8) / DISPLAY (43) / PROJECTION (12) / GAP-ROI (18) / TRAINING (5) / PDF (15) / CODEC (4) / TESTS (22) / DOCS (2).
- **Headline findings:**
  - Off-chart clamping is **not** externally duplicated - all 3 clamp handlers live inside `scoringEngine.js` (lines 88-91, 101-104, and a defensive clamp in `projectionEngine`). Clean starting point for the internal/external split.
  - Codec persists **raw performance values only** - no calculated points stored. Silent rescore of historical S-codes is therefore safe under any table rewrite.
  - **Incidental hotspots** (not on the split's critical path but in the blast radius): `.toFixed(1)` repeated 15+ times with no shared formatter; hardcoded `75.0` in 3 UI locations instead of `PASSING_COMPOSITE`; pass/fail rendered 47 times with no central helper.
  - **Critical preserved behavior:** a component below its DAFMAN minimum still contributes its earned points to the composite (it just caps overall pass at false). Any rewrite must keep this - the engine enforces it at line 264.
  - **Blast radius for the external/internal split: 23 files** - 7 DISPLAY entry points, 6 AGGREGATION/COMPOSITE readers, 4 PROJECTION consumers, 2 strategy/reverse-scoring engines, PDF export, test suite. Refactor difficulty: MEDIUM. Clean API boundaries exist.

This audit is the prerequisite for the four Downstream Items below.

## Downstream items (post-sprint, prerequisite = Q11 audit above)

Four workstreams surfaced by the SCORING-STRATEGY-DISCUSSION.md boss directive (external DAFMAN-literal score vs internal continuous score with linear extrapolation below chart floor). These are **out of scope for this sprint's PR** but tracked here so they aren't lost.

### D1 - Engine rewrite: `calculateOfficialScore` + `calculateInternalScore` (L, partially shipped `1862db6`)

- [x] Split `scoringEngine.js` into a two-number model. External score is the DAFMAN-literal display/composite/PDF number; internal score is a signed continuous number used for projection, ROI, and training emphasis only. **Minimum viable version shipped in `1862db6`:** `lookupScore` returns `{ points, internalPoints }`; below chart floor `points = 0` per §3.7.4 and `internalPoints = chart-minimum` (old clamp behavior preserved for trajectory math).
- [x] Below the chart floor, the external score is 0 and pass-gate is false. **(Shipped.)**
- [ ] Internal score is a linear extrapolation using the slope of the last 2 chart rows, **floored at 2x chart height below the floor** (hard cap to prevent runaway negative numbers). **Still open** - current implementation uses chart-minimum clamp, not linear extrapolation.
- [x] Above the chart ceiling, both scores clamp to max (EC-01 unchanged).
- [ ] Internal scores **must never surface in user-facing UI** - they are a computation-layer concept. Sanity check: grep for `internalPoints` usages and confirm every one is in projection/ROI/training code, not display. **Still open** - `internalPoints` is currently only consumed by `calculateComponentScore` propagation; no UI uses it yet, but an audit pass is still owed.
- [ ] Full D1 completion prerequisite for D4 (gapEngine) and recommended prior to D2 (table transcription). Blast radius = 23 files per the duplication map.

### D2 - Table rewrite: PFRA verbatim transcription (M)

- [ ] Replace all 126 scored tables (9 age brackets x 2 genders x 7 exercises) in `scoringTables.js` with verbatim values from `PFRA Scoring Charts.pdf`. Zero deviations.
- [ ] Preserve anomalies (non-monotonic rows, bracket-over-bracket inversions, boundary oddities) with source-line comments citing the chart page and row.
- [ ] Can run parallel to D1 if treated as data-only (tables are pure lookup data; engine consumes them identically).
- [ ] Test net: `scoringEngine.test.js` + `strategyEngine.test.js` + `optimalAllocation.test.js` fixtures all need regeneration because current tables disagree with PFRA across the board. Expect commit to bundle table + fixture updates atomically (same pattern as `bdded00`).

### D3 - Anomalies doc: `docs/SCORING-ANOMALIES.md` (S)

- [ ] Depends on D2. Document F-01 through F-05 anomalies with chart citations so the transcription is audit-defensible.
- [ ] Each anomaly gets: chart reference (page/row/bracket), observed value, what a monotonic table would say, why we preserved the chart value anyway (DAFMAN literal adherence), and a link from the corresponding source-line comment in `scoringTables.js`.
- [ ] Cross-linked from both `scoringTables.js` header and `CLAUDE.md` under the Authoritative Scoring Reference section.

### D4 - `gapEngine.js`: gap/distance math separated from ROI math (M)

- [ ] Depends on D1 (needs internal score to compute "distance below floor" cleanly without clamping at 0).
- [ ] New module `src/utils/scoring/gapEngine.js` owns: distance-below-floor, distance-to-next-threshold, distance-to-next-bracket-boundary, distance-to-composite-pass. All in both domain units (e.g., seconds, reps) and point-space.
- [ ] `strategyEngine.js` keeps ROI/effort/week math only. Pulls from gapEngine where it currently inlines gap computations.
- [ ] New `gapEngine.test.js` covers the 4 distance primitives across all exercises and both genders.

### Recommended execution order

```
  Q11 audit (done)
       |
       v
     D1 ------------+
       |            |
       v            v
     D4           D2
                    |
                    v
                   D3
```

D1 first (API contract for the two-number model). D2 can start in parallel once the engine's external/internal interfaces are stable. D4 requires D1's internal score. D3 requires D2's transcription to cite specific rows. Target: each as its own PR, not a mega-bundle - the test-fixture churn in D2 alone justifies isolation.
