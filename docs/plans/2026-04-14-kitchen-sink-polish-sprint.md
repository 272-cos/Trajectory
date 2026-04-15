# Trajectory - Kitchen Sink Polish Sprint

## Context

Trajectory is a mobile-first USAF PFA readiness tracker (`/mnt/cephfs/shared/projects/Trajectory/`, branch `claude/kitchen-sink-polish-sprint`, fresh merge of `main` at commit 627a83c). User walked through the live GitHub Pages build and the source tree and surfaced a backlog covering scoring-correctness bugs, cosmetic preferences that don't wire through, missing training-plan features, and UI inconsistency. This plan bundles all of it into one polish sprint.

**Problem being solved.** Scoring display lies on failing components (shows percentage of max instead of zero toward composite, no minimum-to-pass hint). "Training Exercise Preferences" in Trajectory is cosmetic - it doesn't drive the calendar or reverse-scoring. The Training Plan's Regenerate button does nothing useful and there's no backup path. Users are locked to 3 training days. Reverse Crunch exists in the engine but isn't selectable in the picker. The ProjectTab's "Personalized Weekly Training Plan" duplicates the dedicated Plan view. Milestones on Profile are dead-text prompts; they should live where users actually see them. HAMR metronome tones sound bad. Official AFPC charts may have drifted from ours.

**Intended outcome.** Polish-sprint PR on `claude/kitchen-sink-polish-sprint` that lands Tasks 1-7 and 9-10 (Task 8 absorbed into Task 2), keeps all 790 tests green, stays lint-clean at zero warnings, introduces no new em/en dashes, and surfaces no codec jargon in UI.

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

Fix the below-minimum bug, surface minimum-to-pass on failure, diff local tables against the official PDF.

**Scope.**
1. Parse `PFRA Scoring Charts.pdf` at repo root, diff against `scoringTables.js`. Reconciliation note goes into `docs/DEVELOPMENT_PLAN.md` under a new "AFPC chart reconciliation" subsection. If diffs exist, fix table values in the same PR as the test-fixture updates.
2. In `scoringEngine.js`, when a component scores below its DAFMAN minimum: display the raw score, tag "FAIL - 0 toward composite", contribute 0 to composite, and cascade to `overallPass: false`. Mirror the walk-fail precedent at `scoringEngine.js:304-305`.
3. Add `getMinimumToPass(exercise, age, gender)` wrapper in `reverseScoring.js` that returns the performance value meeting the 60% component minimum (50% for body comp).
4. Wire the minimum-to-pass display into SelfCheckTab (inline under each failing exercise input), ProjectTab (inline in each failing component card), and ReportTab (inline in per-component section).
5. Reweight strategy engine so failing components outrank passing-but-low ones in TOP ROI (multiplicative boost on the ROI score when the component is below minimum).

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

Single preference component serving both PlanTab (formerly "PFA Events") and Trajectory's "Training Exercise Preferences". Wires to calendar and reverse-scoring.

**Scope.**
1. New `src/components/shared/ExercisePreferencePicker.jsx` using PlanTab's existing preference panel style (`PlanTab.jsx:1011,1330-1372`) as canonical.
2. Categories: Cardio (run / HAMR / 2km walk), Strength (push-ups / HRPU), Core (sit-ups / CLRC / plank), Body Comp (WHtR). CLRC explicitly selectable - resolves original Task 8.
3. Rename PlanTab label "PFA Events" to "PFA Event Preferences".
4. Replace Trajectory's "Training Exercise Preferences" block (`ProjectTab.jsx:1333`) with the new component.
5. Extend `normalizePfaPreferences` in `exercisePreferences.js` so CLRC / HRPU / 2km-walk are explicit keys with migration-safe defaults.
6. Preference writes drive: `trainingCalendar.js` session-exercise picks, `reverseScoring.js` targets used for min-to-pass, `strategyEngine.js` ROI lane selection. Single source of truth in context state.
7. Defaulting: when `pfaPreferences` is unset, read the newest S-code and infer its recorded exercises; only fall back to run / push-ups / sit-ups / WHtR when no assessments exist.
8. Audit and either wire or delete every cosmetic button in the preference panels on PlanTab and ProjectTab.

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

Replace the non-functional PlanTab Regenerate button with a Back-Up action; build export + restore.

**Scope.**
1. Define backup JSON shape: `{ version, exportedAt, dcode, scodes, pfaPreferences, preferredDays, targetPfaDate, phaseState, sessionProgress, intensityScaling, onboardingFlags, showMilestones, overtrainingAck }`.
2. Extend HistoryTab's existing JSON export (`HistoryTab.jsx:324-389`) to cover the full state rather than just scodes.
3. Replace PlanTab's Regenerate button (`PlanTab.jsx:850-855`) with a "Back Up" button that invokes the same export.
4. Add restore via file picker: `<input type="file" accept="application/json">` + schema-version validation + blocking overwrite-confirm modal before write.
5. Expose `exportFullState()` and `importFullState(obj)` helpers in `localStorage.js`.

**Files.**
- `src/components/tabs/HistoryTab.jsx:324-389,479` (extend export UI, add import)
- `src/components/tabs/PlanTab.jsx:850-855` (swap button target)
- `src/components/shared/OverwriteConfirmModal.jsx` (NEW)
- `src/utils/storage/localStorage.js:322,339,383,412` (add full-state helpers)

**Reused.** HistoryTab's existing JSON export scaffolding; existing localStorage key inventory at line 412.

**Dependencies.** Tasks 1 + 2 (backup schema must capture the new pref shape and any new state keys they add).

### Task 4 - Calendar days freedom + overtraining modal + constant-load scaling (M)

Allow 3-7 training days; show a blocking modal once per profile on first selection above 3; phase engine keeps per-session load constant.

**Scope.**
1. Remove the three `preferredDays.length !== 3` gates in `PlanTab.jsx:549,668,678`.
2. Allow selection of 3-7 days. No upper cap beyond 7.
3. First time a user selects >3 days, fire a blocking modal: `"Rest is integral to the plan. The biggest risk is injury forcing time off."` Single ack persisted at `pfa_overtraining_ack` in localStorage. Do not re-prompt after ack.
4. `phaseEngine.js`: keep per-session volume invariant; weekly volume scales linearly with day count. Do NOT pro-rate. Audit session-generation first, document current behavior in a short note in `docs/DECISIONS.md`.
5. `trainingCalendar.js`: layout respects variable day count; avoid back-to-back hard sessions by default when count permits.

**Files.**
- `src/components/tabs/PlanTab.jsx:549,668,678,921-1005`
- `src/components/shared/OvertrainingWarningModal.jsx` (NEW)
- `src/utils/training/phaseEngine.js` (audit + invariance guarantee)
- `src/utils/training/trainingCalendar.js` (variable-day layout)
- `src/utils/storage/localStorage.js` (add `pfa_overtraining_ack` helpers)

**Reused.** Existing `preferredDays` persistence path.

**Dependencies.** Task 2 (reuse the picker's pill style for the day selector).

### Task 5 - Pill selector standardization (M)

One canonical pill component used everywhere.

**Scope.**
1. Audit every inline pill/segmented-control pattern. Grep already flagged SelfCheckTab, PlanTab, ProjectTab, ExerciseComparison, OnboardingModal, Header, HintBanner, RunPacer, InstallPrompt, HamrMetronome, ReportTab.
2. Extract `<PillGroup>` and `<PillToggle>` into `src/components/shared/`. Single-select, multi-select, and boolean toggle variants supported.
3. Replace all ad-hoc pill markup with the shared component. Tailwind class names consolidated.

**Files.**
- `src/components/shared/PillGroup.jsx` (NEW)
- `src/components/shared/PillToggle.jsx` (NEW)
- The 11 files enumerated above.

**Reused.** Existing Tailwind color tokens and focus-ring styles.

**Risks.** Scope creep into other UI inconsistencies. Mitigation: pills only; note other drift for a follow-up.

**Dependencies.** None, but should land before Task 2 so `<PillGroup>` is available when the picker is built. See execution order.

### Task 6 - Milestones relocation (S)

Move `<AchievementBadges>` from ProfileTab to HistoryTab, below Export/Import.

**Scope.**
1. Remove the AchievementBadges section from ProfileTab's render tree.
2. Render it in HistoryTab directly below the Export/Import controls at `HistoryTab.jsx:479`.
3. Storage key `pfa_show_milestones` is unchanged. Context plumbing untouched.
4. ProjectTab's chart-overlay milestones (separate concept: taper/mock-test/fractional-test markers) are untouched.

**Files.**
- `src/components/tabs/ProfileTab.jsx` (remove AchievementBadges render)
- `src/components/tabs/HistoryTab.jsx:479` (add AchievementBadges render below exports)
- `src/components/shared/AchievementBadges.jsx` (no change, confirmed standalone)

**Reused.** `<AchievementBadges>` as-is; `showMilestones` context stays.

**Dependencies.** None.

### Task 7 - ROI math transparency (M)

Replace Trajectory's "Personalized Weekly Training Plan" collapsible with an ROI breakdown panel.

**Scope.**
1. Delete the "Personalized Weekly Training Plan" collapsible at `ProjectTab.jsx:609-651`. It duplicates PlanTab poorly.
2. In its place, render `<ROIBreakdownPanel>` showing:
   - (a) Per-component: current points, projected points, delta, and points-per-standard-improvement unit (e.g., "every 30s off the run = +4 pts").
   - (b) Composite contribution formula: `sum(componentPoints * weight) / 100` with live values substituted.
   - (c) ROI ranking derivation: marginal-cost curve per component explaining why Component X ranks above Component Y.
3. Walkthrough copy alongside each section: what the number means, why it matters, what the user can act on.

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

The current cadence emits seven signals (3 + 2 + 1 + sweep) which the user reports as too many and hard to read. Reduce to a clear Mario-Kart-style "3-2-1-GO" - four total signals - without changing timbre. User plans a sampled audio replacement in a future pass; this sprint is cadence only.

**Scope.**
1. Replace `scheduleCountdown` in `HamrMetronome.jsx:124-151` with a four-signal pattern:
   - Tone 1 at t=0.0: 440Hz triangle, 0.4s ("3")
   - Tone 2 at t=1.0: 440Hz triangle, 0.4s ("2")
   - Tone 3 at t=2.0: 440Hz triangle, 0.4s ("1")
   - Final sweep at t=3.0: ascending 660->1320Hz over 0.6s ("GO")
   - Post-sweep pause then shuttle starts (total countdown ~4.1s, down from ~5.3s).
2. Update `COUNTDOWN_TOTAL_S` constant to reflect the new total duration.
3. Update the timeline-comment block at `HamrMetronome.jsx:51-56,114-123` to match.
4. Simplify `navigator.vibrate` haptic pattern at line 148 to three short pulses plus one long (matches the new four-signal cadence).
5. Preserve `scheduleCountdownTone`, `scheduleSweepTone`, and the skip/silence path - only the orchestration changes.

**Files.**
- `src/components/tools/HamrMetronome.jsx:38-56,114-151`

**Reused.** All existing oscillator/gain helper functions stay. No timbre changes (user confirmed tones themselves sound fine).

**Dependencies.** None.

### Task 10 - AFPC research stream (M, docs only)

Recon https://www.afpc.af.mil/Career-Management/Fitness-Program/ and feed future sprints.

**Scope.**
1. Fetch the AFPC Fitness Program page + PFRA scoring charts link.
2. Produce three appended subsections in `docs/DEVELOPMENT_PLAN.md` under a new "AFPC recon (lower-priority candidate sprints)" heading:
   - (a) Table diff summary (complements Task 1's PDF diff with any web-only content).
   - (b) Exercises and policies we do not yet support, grouped by user value and feature similarity.
   - (c) Harvested official UI phrasing candidates.

**Files.**
- `docs/DEVELOPMENT_PLAN.md` (append section)

**Risks.** CAC-gated content would stall this. Mitigation: if pages require auth, document what's blocked and defer that subset.

**Dependencies.** Task 1 (table diff is synergistic).

## Execution order

- **Wave A (foundations, parallel).** Task 1, Task 5.
  Task 1 resolves the PDF diff question and lands the scoring/reverse-scoring APIs the rest depends on. Task 5 produces `<PillGroup>` for Task 2 to consume.
- **Wave B (preferences + backup, sequential).** Task 2, then Task 3.
  Task 2 sets the preference shape; Task 3's backup schema captures it.
- **Wave C (calendar + relocation + ROI, parallel).** Task 4, Task 6, Task 7.
  Task 7 depends on Task 1's failing-component ROI; Task 4 depends on Task 2's pill style.
- **Wave D (audio + research, parallel).** Task 9, Task 10.

## Validation

**Per task.**
- Task 1: add `scoringEngine.test.js` cases for below-min zero-composite + `overallPass: false`; `reverseScoring.test.js` cases for `getMinimumToPass` across all exercises and both genders; manual browser check that SelfCheckTab/Trajectory/ReportTab show "FAIL - 0 toward composite" labels with minimum-to-pass hints.
- Task 2: new `exercisePreferences.test.js` round-trip covering CLRC / HRPU / 2km-walk; manual preview where picker selection changes reverse-scoring targets in Trajectory and practice-session exercise in the calendar; grep confirms "PFA Events" -> "PFA Event Preferences".
- Task 3: `localStorage.test.js` round-trip for `exportFullState`/`importFullState`; manual full-wipe + restore on the dev server to confirm the app reopens identically.
- Task 4: `phaseEngine.test.js` asserts per-session volume is day-count-invariant; manual flow picks 5 days -> modal fires; picks 5 again -> no modal; picks 7 -> no additional friction.
- Task 5: visual diff of all 11 touched files; lint zero warnings; no behavior tests needed.
- Task 6: manual check that ProfileTab no longer renders AchievementBadges; HistoryTab shows it below Export/Import; ProjectTab chart overlay untouched.
- Task 7: snapshot test on `<ROIBreakdownPanel>`; manual spot-check that displayed numbers match `optimalAllocation.getAllocation()` output.
- Task 9: manual listen on iOS Safari and Chrome desktop; confirm four-signal 3-2-1-GO cadence is unambiguous and total countdown duration is ~4.1s; haptic pattern matches the new signal count.
- Task 10: `docs/DEVELOPMENT_PLAN.md` has the new section with all three subsections populated.

**Global gates (every PR).**
- `npm run lint` zero warnings.
- `npm test` all 790 existing + newly-added tests pass.
- `npm run dev` launches and every tab renders without console error.
- Grep sweep: no new em dashes (`–`) or en dashes (`—`); no "D-code" / "S-code" leaking into user-facing strings; no internal tracking IDs (`TR-`, `PG-`, `CS-`, `IV-`, `RP-`) in UI text.

## Deliverables

- Nine code-touching tasks landed (Task 8 absorbed into Task 2).
- `docs/DEVELOPMENT_PLAN.md` appended with AFPC recon section.
- `docs/DECISIONS.md` appended with the phase-engine constant-per-session decision.
- This plan at `/root/.claude/plans/functional-squishing-squid.md`.
- One planning entry added to `docs/DEVELOPMENT_PLAN.md` backlog referencing this plan.
