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
npm run dev       # Local dev server with HMR (Vite)
npm run build     # Production build
npm run lint      # ESLint (zero warnings enforced)
npm test          # Vitest unit tests
npm run test:ui   # Vitest with browser UI
```

## Architecture

```
src/
├── App.jsx                         # Root: AppProvider + Header + TabNavigation
├── context/
│   └── AppContext.jsx               # Global state: dcode, scodes, targetPfaDate, activeTab
├── components/
│   ├── layout/
│   │   ├── Header.jsx               # Persistent banner with unofficial disclaimer
│   │   ├── TabNavigation.jsx        # 5-tab switcher
│   │   └── OnboardingModal.jsx      # First-visit modal (branching flow)
│   └── tabs/
│       ├── ProfileTab.jsx           # DOB+gender input, D-code, target PFA date
│       ├── SelfCheckTab.jsx         # Exercise inputs, live scoring, S-code gen
│       ├── ProjectTab.jsx           # Readiness projection to target PFA date
│       ├── HistoryTab.jsx           # S-code paste, decode, timeline display
│       └── ReportTab.jsx            # Supervisor report generation (planned)
└── utils/
    ├── scoring/
    │   ├── scoringEngine.js         # Pure functions: lookupScore(), calculateComposite()
    │   ├── scoringTables.js         # All 18 AFPC brackets (9 age x 2 gender)
    │   └── constants.js             # Weights (50-20-15-15), exercise enums, age brackets
    ├── codec/
    │   ├── dcode.js                 # D-code encode/decode (DOB + gender - ~9 chars)
    │   ├── scode.js                 # S-code V3 encode/decode (assessment data - ~22 chars)
    │   ├── bitpack.js               # BitWriter/BitReader for sub-byte packing
    │   ├── base64url.js             # RFC 4648 base64url (URL-safe, no padding)
    │   ├── crc8.js                  # CRC-8 integrity verification
    │   └── scode_v1_backup.js       # Legacy JSON format reference (V1 ~301 chars)
    ├── recommendations/
    │   └── recommendationEngine.js  # Tiered tips: FAILING(<75) / MARGINAL(75-80) / STRONG(>80)
    └── storage/
        └── localStorage.js          # Keys: pfa_dcode, pfa_scodes, pfa_target_date, pfa_onboarded
```

## Data Model

### D-Code (Demographics, permanent)
- **Format:** `D1-[base64url][CRC-8]` (~9 chars)
- **Payload:** schema version (4b), gender (1b), DOB days since 1950 (16b)
- **Usage:** One per profile; reused across all self-checks

### S-Code V3 (Self-Check, one per session)
- **Format:** `S3-[base64url bit-packed][CRC-8]` (~22 chars)
- **Compression:** 93.7% reduction vs V1 JSON format (22 vs 301 chars)
- **Bit layout (~110 bits total):**

  | Block       | Bits | Details                                      |
  |-------------|------|----------------------------------------------|
  | Header      | 24   | version:4, chart:4, date:15, diag:1          |
  | Flags       | 4    | component presence (4x1 bit)                 |
  | Cardio      | 14+  | exercise:2, exempt:1, value:11, [walk_pass:1]|
  | Strength    | 9    | exercise:1, exempt:1, value:7                |
  | Core        | 14   | exercise:2, exempt:1, value:11               |
  | Body Comp   | 25   | exempt:1, height:11, waist:10, offset:3      |
  | Reserved    | 20   | base_id:3 (altitude), reserved:17                                    |

- **Backward compat:** S2-prefixed codes decoded via V2 path

### localStorage Keys
```javascript
{
  'pfa_dcode':       'D1-abc123ef',         // demographics code
  'pfa_scodes':      ['S3-xyz...', ...],    // JSON array of assessment codes
  'pfa_target_date': '2026-07-01',          // ISO date for trajectory tab
  'pfa_onboarded':   'true'                 // first-visit modal flag
}
```

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

## Sprint Status

| Sprint | Status      | Scope                                                    |
|--------|-------------|----------------------------------------------------------|
| 1      | Complete    | Core tabs, scoring, codecs, recommendations, localStorage |
| 2      | Complete    | S-code V3 (feedback block), all 18 AFPC scoring brackets, History tab |
| 3      | Complete    | URL hydration, Web Share API, 2km walk, HAMR conversion, input validation, Projection engine, Report tab |
| 4      | Complete    | Projection engine + Project tab |
| 5      | Complete    | History tab with trend chart |
| 6      | Complete    | Report generation |
| 7      | Complete    | PWA + accessibility + chart update banner |
| 8      | Complete    | Strategy engine, stopwatch, HAMR metronome, exercise comparison |
| 9      | Complete    | Curated training resource links, personalized training plans |
| 10     | Complete    | Practice mode, training plan calendar tab, milestone overlays |

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

## Deployment

- **Hosting:** GitHub Pages at `https://272-cos.github.io/Trajectory/`
- **Trigger:** Push to `main` - GitHub Actions builds and deploys
- **Base path:** `/Trajectory/` (configured in `vite.config.js`)
- **SPA routing:** `public/404.html` redirects to `index.html` for client-side routing
