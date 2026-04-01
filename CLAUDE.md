# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Trajectory - USAF PFA Readiness Tracker

A mobile-first web app for USAF Airmen to self-assess fitness performance against 2026 PFA scoring standards, project future readiness, and generate supervisor reports. Zero backend - all data stays in the browser.

## Project Constraints (Non-Negotiable)

1. **No backend** - static site only (GitHub Pages)
2. **No PII in codes** - D-codes: DOB+gender only; S-codes: performance data only
3. **No tracking** - no analytics, no cookies, no third parties
4. **Unofficial only** - always display "UNOFFICIAL ESTIMATE" disclaimer
5. **Privacy-first** - all storage via localStorage; no cloud sync
6. **Zero-dependency scoring** - pure JS functions, no external scoring APIs
7. **Regulatory basis** - DAFMAN 36-2905 (Change 1, 22 Jan 2026) + AFPC 50-20-15-15 model
8. **No em dashes or en dashes** - use only hyphens (-) throughout the codebase and docs
9. **No internal tracking codes in UI** - Internal references (TR-XX, PG-XX, CS-XX, IV-XX, RP-XX, etc.) must NEVER appear in user-facing text, labels, disclaimers, or rendered output. They belong only in code comments and documentation.

## Development Commands

```bash
npm install       # Install dependencies (required before first run)
npm run dev       # Local dev server with HMR (Vite)
npm run build     # Production build
npm run lint      # ESLint (zero warnings enforced, flat config)
npm test          # Vitest unit tests (watch mode)
npm test -- --run # Vitest single run (CI-friendly)
npm run test:ui   # Vitest with browser UI
```

To run a single test file:
```bash
npx vitest --run src/utils/scoring/scoringEngine.test.js
```

Tests use Vitest with jsdom environment and `globals: true` (no need to import describe/it/expect). Test files are co-located with source: `foo.js` -> `foo.test.js`.

## Architecture Overview

**Stack:** React 18 + Vite + Tailwind CSS + Recharts. PWA via vite-plugin-pwa (Workbox, cache-first).

**State management:** Single React context (`AppContext.jsx`) provides all global state via `useApp()` hook. State includes demographics (dcode), assessment history (scodes array), target PFA date, dark mode, personal goal, and UI state (activeTab, toasts, selfCheckDirty flag). URL hydration loads D-codes and S-codes from query params (`?d=...&s=...`).

**Data flow:**
```
User input -> encode to D-code/S-code -> localStorage
                                      -> AppContext state
                                      -> decode on read -> scoring engine -> UI
```

**Key directories:**
- `src/components/tabs/` - 8 tab views (Profile, SelfCheck, Project, History, Report, Tools, Plan, ExerciseComparison)
- `src/components/layout/` - Header, TabNavigation, OnboardingModal, PWA banners
- `src/components/shared/` - Reusable: ErrorBoundary, ShareModal, AchievementBadges, PfaCountdown
- `src/components/tools/` - Stopwatch, HamrMetronome, RunPacer
- `src/utils/scoring/` - Scoring engine, tables, constants, strategy engine, reverse scoring
- `src/utils/codec/` - D-code/S-code encode/decode with bit-packing and CRC-8
- `src/utils/training/` - Phase engine (16-week periodization), practice sessions, calendar, ICS export
- `src/utils/projection/` - Readiness forecasting (linear/logarithmic/least-squares models)

## Scoring Engine (Critical Path)

The scoring pipeline flows: `constants.js` (rules/brackets) -> `scoringTables.js` (18 lookup tables) -> `scoringEngine.js` (pure functions).

- **lookupScore()** - Threshold-based points lookup. Values above/below chart bounds clamp to max/min points (EC-01), never return 0.
- **calculateComponentScore()** - Single component scoring with exemption handling.
- **calculateCompositeScore()** - Weighted aggregate: `round((earned/possible)*1000)/10`. Pass requires 75.0 composite + per-component minimums (60% cardio/strength/core, 50% body comp).
- **strategyEngine.js** - ROI analysis: finds the next scoring threshold per exercise, computes effort-weeks to reach it.
- **reverseScoring.js** - Reverse lookup: "what performance do I need for X points?"

Key scoring rules:
- 2km walk contributes 0/0 to composite (pass/fail only); walk failure = overall failure (EC-05)
- WHtR rounded to 2 decimals before lookup (SL-05)
- 0 reps clamps to chart minimum points but component still fails (SL-10)
- Exempt components contribute 0 earned and 0 possible to composite

## Codec System

Compact codes encode user data for sharing/storage without PII:

- **D-code** (`D1-[base64url][CRC-8]`, ~9 chars) - Demographics: schema(4b) + gender(1b) + DOB-days-since-1950(16b)
- **S-code** (`S3-[base64url][CRC-8]`, ~22 chars) - Assessment: ~110 bits covering all 4 components + metadata
- **Backward compat** - S2-prefixed codes decoded via V2 path
- Built on `bitpack.js` (BitWriter/BitReader), `base64url.js` (RFC 4648), `crc8.js`

## Training System

- **phaseEngine.js** - 16-week periodization: BASE(4) -> BUILD(4) -> BUILD+(4) -> SHARPEN(4) with intensity governors
- **practiceSession.js** - PI (Performance Indicator) workouts: 30-sec intervals predicting full-test results; fractional tests at 50%/75%
- **trainingCalendar.js** - Weekly schedule generation with phase-appropriate workouts

## Scoring Model (2026 per DAFMAN 36-2905)

- **Component weights:** Cardio 50%, Body Comp 20%, Strength 15%, Core 15%
- **Passing thresholds:** 75.0 composite + component minimums (60% per component; body comp 50%)
- **Age brackets:** 9 AFPC brackets (<25, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60+) x 2 genders = 18 tables
- **Supported exercises:**
  - Cardio: 2-mile run, HAMR shuttle, 2km walk (profile-only)
  - Strength: Push-ups (1-min), HRPU (2-min)
  - Core: Sit-ups (1-min), CLRC (2-min), Forearm Plank
  - Body Comp: Waist-to-Height Ratio
- **Diagnostic period:** Mar 1 - Aug 31, 2026 (non-scored; auto-detected from S-code date)
- **Scored PFAs begin:** Sep 1, 2026

## Partial Component Testing

Users can test any subset of components. Rules:
- Individual component scores always displayed when data present
- Composite score shown **only** when all 4 components are recorded
- Exempt components contribute 0 earned and 0 possible to composite

## Documentation

- [`docs/DECISIONS.md`](docs/DECISIONS.md) - Implementation decisions and UX rationale
- [`docs/QUICKSTART.md`](docs/QUICKSTART.md) - 2-minute user onboarding guide
- [`docs/design.md`](docs/design.md) - Full software design spec (v1.3)
- [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) - Sprint-level development plan
- [`docs/RESEARCH-FITNESS-PROGRAMS.md`](docs/RESEARCH-FITNESS-PROGRAMS.md) - Evidence-based training recommendations by exercise/tier

## Agents

Specialized subagents for domain-specific development tasks live in [`.claude/agents/`](.claude/agents/):

- **[scoring-agent](.claude/agents/scoring-agent.md)** - Scoring tables, engine logic, age/gender bracket expansion
- **[codec-agent](.claude/agents/codec-agent.md)** - S-code/D-code encoding, bit-packing, compression
- **[fitness-coach](.claude/agents/fitness-coach.md)** - PFA scoring, workout programming, fitness code generation

## Deployment

- **Hosting:** GitHub Pages at `https://272-cos.github.io/Trajectory/`
- **CI:** `.github/workflows/deploy.yml` - push to main triggers build (Node 22) and deploy
- **Base path:** `/Trajectory/` (configured in `vite.config.js`)
- **SPA routing:** `public/404.html` redirects to `index.html` for client-side routing
