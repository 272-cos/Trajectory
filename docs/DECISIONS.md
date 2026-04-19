# Implementation Decisions - Sprint 1

**Date**: February 8, 2026
**Context**: Transitioning from design to implementation with user feedback

## Key Decisions from User Feedback

### 1. Profile & Target Date (UPDATED - Sprint 2b)
- **D-code**: Permanent demographic (DOB + gender) - stays separate
- **Target PFA date**: Separate field, changes per PFA cycle
- **Implementation**: Moved to Profile tab (UX simplification)
- **Self-Check Date**: Automatically uses today's date (transparent to user)
- **Rationale**: S-code automatically logs date on generation, no need to ask twice
- **Future**: May prompt "Did you take your PFA?" day after target date

### 2. Partial Component Testing (NEW)
**Intent**: Users don't need to complete all 4 components in one session
- Can test single component (e.g., just cardio today)
- Can test multiple components (e.g., cardio + strength)
- S-code should support partial data with null/empty for untested components
- Score calculation: Only calculate composite if ALL 4 components present
- **UI**: Show individual component scores always, composite only when all present

### 3. Performance Recommendations - Tiered System (NEW)

**Threshold Tiers:**
1. **Below 75.0 (FAILING)**: Focus on fundamentals to reach passing
   - Basic progressions
   - Form corrections
   - Beginner-friendly techniques

2. **75.0-80.0 (MARGINAL PASS)**: Solidify passing score
   - Intermediate techniques
   - Consistency tips
   - Avoid regression

3. **Above 80.0 (STRONG PASS)**: Excel beyond requirements
   - Advanced challenges
   - Distance/time goals
   - Performance optimization
   - Competitive edge

**Body Composition Recommendations:**
- Calorie counting guidance
- Clean eating habits
- Dietary journal recommendations
- Nutritionist consultation suggestion
- NOT just "lose weight" - actionable nutrition advice

**Exemption Logic:**
- No recommendations for exempt components
- Don't suggest cardio for cardio exemption (obviously)
- Smart filtering based on profile status

### 4. UI Placement (CLARIFIED)

**Self-Check Tab:**
- After user enters first component score
- Show individual component tracking
- Collapsible "💪 Improvement Tips" section per component
- Tips appear as soon as component score calculated

**Project Tab:**
- Future PFA projections
- Gap analysis for upcoming assessment
- Weekly improvement targets

**Training Tips (from Historical):**
- Analyze trends across multiple S-codes
- Identify weak patterns
- Suggest focus areas

### 5. Terminology Changes

- **"Personal Assessment"** > preferred over "self-check" in UI
- **First mention**: "Personal Assessment (Self-Check)" with explanation
- **Subsequent**: Just "Personal Assessment" or "Assessment"
- **Clarify**: Unofficial vs USAF-sanctioned PFA
- **Banner**: Persistent "UNOFFICIAL" warning eliminates need for repeated disclaimers

### 6. Report Simplification (CHANGED)

**REMOVED from supervisor report:**
- ❌ Unit
- ❌ Rank
- ❌ Name

**KEPT in supervisor report:**
- ✅ D-code (for verification)
- ✅ S-code(s) (for verification)
- ✅ Scores and component breakdown
- ✅ Timestamp
- ✅ Link to app with embedded codes

**Rationale**: Codes are verification. Supervisor knows who their people are. Less PII = better.

### 7. Data Storage Strategy (CLARIFIED)

**localStorage: Primary + Backup**
- Primary storage for D-code (persist across sessions)
- Primary storage for S-code history
- Backup: Codes in URL params for sharing
- Design principle: No backend, but use browser storage

**Data Model:**
```javascript
localStorage = {
  'pfa_dcode': 'D1-abc123ef',
  'pfa_scodes': ['S3-xyz...', 'S3-abc...', ...],
  'pfa_target_date': '2026-07-01',
  'pfa_onboarded': true
}
```

### 8. Onboarding Flow (NEW)

**Modal on First Visit:**
1. Welcome screen
2. "Do you have previous assessment codes?"
   - **Yes**: Paste D-code and S-codes → load data
   - **No**: Start fresh → guide to Profile tab
3. Explain terminology: "Personal Assessment vs Official PFA"
4. Set expectations: "Your data stays private"
5. Dismiss → never show again (localStorage flag)

### 9. Scoring Brackets

**Full 18 Brackets: Complete (Sprint 2)**
- All 9 AFPC age brackets: <25, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60+
- Both genders: Male, Female
- Total: 9 age brackets x 2 genders x 4+ exercise tables = all AFPC scoring charts

### 10. Military Fitness Research (TODO)

**Research Sources:**
- Air Force PT improvement programs
- Army ACFT training guides
- Navy PRT preparation
- Bodyweight training progressions
- Sprint/interval training protocols
- Calisthenics progressions (no equipment)

**Output**: Evidence-based recommendation database

**TODO - Video Tutorial Integration:**
- Include verified YouTube video tutorials in recommendations
- Link to official form guides, training progressions
- Vet sources for accuracy (official military channels, certified trainers)
- Store video IDs in recommendation database for embedding/linking

## Technical Decisions

### Component Architecture
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx (persistent banner)
│   │   ├── TabNavigation.jsx
│   │   └── OnboardingModal.jsx
│   ├── tabs/
│   │   ├── ProfileTab.jsx
│   │   ├── SelfCheckTab.jsx
│   │   ├── ProjectTab.jsx
│   │   ├── HistoryTab.jsx
│   │   └── ReportTab.jsx
│   ├── selfcheck/
│   │   ├── ComponentInput.jsx (cardio/strength/core/bodycomp)
│   │   ├── ScoreBanner.jsx (live score display)
│   │   └── ImprovementTips.jsx (recommendations)
│   └── shared/
│       ├── CodeDisplay.jsx (D/S-code with copy/share)
│       └── Button.jsx
├── utils/
│   ├── scoring/
│   │   ├── scoringEngine.js (pure functions)
│   │   ├── scoringTables.js (data)
│   │   └── constants.js
│   ├── codec/
│   │   ├── dcode.js (encode/decode)
│   │   └── scode.js (encode/decode)
│   ├── recommendations/
│   │   ├── recommendationEngine.js
│   │   └── recommendationData.js (tips database)
│   └── storage/
│       └── localStorage.js (helper functions)
└── hooks/
    ├── useLocalStorage.js
    └── useScoring.js
```

### State Management
- **Global State**: React Context for D-code, S-codes, current tab
- **Local State**: Component-level for form inputs
- **Persistence**: localStorage sync on state changes

### Scoring Engine - Partial Support
```javascript
function calculateScore(components, demographics) {
  // components can have null values
  const tested = components.filter(c => c !== null)

  // Individual scores always calculated
  const individualScores = tested.map(c => scoreLookup(c, demographics))

  // Composite only if all 4 present
  const composite = tested.length === 4
    ? calculateComposite(individualScores)
    : null

  return { individualScores, composite }
}
```

### 11. UX Refinement - Date Handling (Sprint 2b)

**Problem Identified:**
- Original design had assessment date picker in Self-Check tab
- S-code already automatically encodes the assessment date
- Asking user for date twice is redundant
- Target PFA date was intended for different purpose (future projection)

**Solution Implemented:**
1. **Self-Check Tab**: Removed date picker, auto-use today's date
   - Display message: "Recording today's self-check (MM/DD/YYYY)"
   - S-code encodes date automatically when generated
   - User doesn't need to think about dates during self-check
2. **Profile Tab**: Added target PFA date input field
   - Labeled: "Target PFA Date"
   - Help text: "Set your upcoming official PFA date to see your trajectory"
   - Saved to localStorage (pfa_target_date)
   - Will be used by Trajectory tab for projections
3. **AppContext**: Added targetPfaDate global state
   - Loaded from localStorage on mount
   - updateTargetPfaDate() function for updates
   - Accessible to all tabs via useApp() hook

**User Quote:**
> "If it does we can keep that transparent to the user, never have to ask for it, just scode and go. target pfa date should be set on profile page"

**Benefits:**
- Cleaner UX (one less input during self-check)
- Faster workflow (S-code and go)
- Logical separation: Demographics in Profile, daily checks in Self-Check
- Target date enables future Trajectory tab features

## Implementation Priority

**Sprint 1 (Complete):**
1. ✅ Update design docs
2. ✅ Research military fitness programs
3. ✅ Build tab navigation
4. ✅ Build onboarding modal
5. ✅ Build Profile tab with D-code
6. ✅ Build Self-Check tab (partial component support)
7. ✅ Implement simplified scoring (2-3 brackets)
8. ✅ Build recommendation engine
9. ✅ localStorage integration

**Sprint 2 (Complete):**
- ✅ S-code V3 (feedback block, bit-packed)
- ✅ All 18 AFPC scoring brackets (9 age x 2 gender)
- ✅ History tab with S-code paste, decode, timeline
- ✅ Trend visualization

**Sprint 3 (In Progress):**
- ✅ URL hydration for code sharing (?d=, ?s=, ?tab=)
- ✅ Web Share API with clipboard fallback
- ✅ 2km walk option (IV-11, profile-only)
- ✅ HAMR time-to-shuttle conversion (IV-12)
- ✅ Input validation caps (run max 2:00:00, plank max 10:00)
- ✅ EC-05: Walk failed = overall FAIL
- Projection engine (linear/log models, gap analysis)
- Report tab (supervisor report generation)

---

**Status**: Decisions documented. Ready to execute Sprint 1.

---

## Kitchen Sink Polish Sprint

### Training-day range 3-7 with constant per-session load

**Date:** 2026-04-18

**Context:** Users previously locked to exactly 3 training days per week. Experienced trainees wanted 4-7. The expansion raises the question: when a user jumps from 3 to 5 days, does the phase engine cut per-session volume by 40% (pro-rate) or keep it constant (let weekly volume scale linearly)?

**Decision:** Keep per-session volume **constant**. Weekly volume scales linearly with day count.

**Rationale:**
- Phase engine reads per-session parameters (sets, reps, duration, intensity) from `phaseConfig` indexed by phase and session role. No references to `preferredDays.length`, no weekly aggregate anywhere.
- Pro-rating punishes experienced trainees who chose more days for a reason: to get more total work. Holding weekly volume constant would make "more days" a UX no-op.
- The overtraining risk is addressed by the one-time acknowledgement modal at the UI layer, not by shrinking sessions at the engine layer.

**Enforcement:** `phaseEngine.js` has no `preferredDays` parameter at all. Any future PR adding one should be rejected unless the intent is explicit weekly-volume control, in which case it should be named `weeklyVolumeCap` and documented here.
