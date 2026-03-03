# Trajectory - USAF PFA Readiness Tracker

A mobile-first web app for USAF Airmen to self-assess fitness performance against 2026 PFA scoring standards, project future readiness, and generate supervisor reports. Zero backend — all data stays in the browser.

## Project Constraints (Non-Negotiable)

1. **No backend** — static site only (GitHub Pages)
2. **No PII in codes** — D-codes: DOB+gender only; S-codes: performance data only
3. **No tracking** — no analytics, no cookies, no third parties
4. **Unofficial only** — always display "UNOFFICIAL ESTIMATE" disclaimer
5. **Privacy-first** — all storage via localStorage; no cloud sync
6. **Zero-dependency scoring** — pure JS functions, no external scoring APIs
7. **Regulatory basis** — DAFMAN 36-2905 (Change 1, 22 Jan 2026) + AFPC 50-20-15-15 model

## Development Commands

```bash
npm run dev       # Local dev server with HMR (Vite)
npm run build     # Production build → dist/
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
│       ├── HistoryTab.jsx           # S-code paste + trend visualization
│       └── ReportTab.jsx            # Supervisor report generation
└── utils/
    ├── scoring/
    │   ├── scoringEngine.js         # Pure functions: lookupScore(), calculateComposite()
    │   ├── scoringTables.js         # Lookup tables by gender/age/exercise (2026 provisional)
    │   └── constants.js             # Weights (50-20-15-15), exercise enums, age groups
    ├── codec/
    │   ├── dcode.js                 # D-code encode/decode (DOB + gender → ~9 chars)
    │   ├── scode.js                 # S-code encode/decode (assessment data → ~19 chars)
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

### S-Code (Self-Check, one per session)
- **Format:** `S2-[base64url bit-packed][CRC-8]` (~19 chars)
- **Compression:** 93.7% reduction vs V1 JSON format (19 vs 301 chars)
- **Bit allocation (87 bits total):**

  | Component   | Bits | Details                                 |
  |-------------|------|-----------------------------------------|
  | Header      | 24   | version:4, chart:4, date:15, diag:1     |
  | Flags       | 4    | component presence (4×1 bit)            |
  | Cardio      | 14   | exercise:2, exempt:1, value:11          |
  | Strength    | 9    | exercise:1, exempt:1, value:7           |
  | Core        | 14   | exercise:2, exempt:1, value:11          |
  | Body Comp   | 22   | exempt:1, height:11, waist:10           |

### localStorage Keys
```javascript
{
  'pfa_dcode':       'D1-abc123ef',         // demographics code
  'pfa_scodes':      ['S2-xyz...', ...],    // JSON array of assessment codes
  'pfa_target_date': '2026-07-01',          // ISO date for trajectory tab
  'pfa_onboarded':   'true'                 // first-visit modal flag
}
```

## Scoring Model (2026)

- **Component weights:** Cardio 50%, Body Comp 20%, Strength 15%, Core 15%
- **Passing thresholds:** 75.0 composite + component minimums (60% per component; body comp 50%)
- **Age brackets:** 6 groups (<20, 20-29, 30-39, 40-49, 50-59, 60+) × 2 genders = 12 tables
- **Supported exercises:**
  - Cardio: 2-mile run, HAMR shuttle, 2km walk
  - Strength: Push-ups (1-min), HRPU (2-min)
  - Core: Sit-ups (1-min), CLRC (2-min), Forearm Plank
  - Body Comp: Waist-to-Height Ratio
- **Diagnostic period:** Mar 1 – Jun 30, 2026 (non-scored; auto-detected from S-code date)
- **Scored PFAs begin:** Jul 1, 2026

## Partial Component Testing

Users can test any subset of components. Rules:
- Individual component scores always displayed when data present
- Composite score shown **only** when all 4 components are recorded
- Exempt components contribute 0 earned and 0 possible to composite

## Sprint Status

| Sprint | Status    | Scope                                                    |
|--------|-----------|----------------------------------------------------------|
| 1      | Complete  | Core tabs, scoring, codecs, recommendations, localStorage |
| 2      | Planned   | History tab charts, URL hydration, full 18-bracket scoring |
| 3      | Planned   | Trajectory projections, Report generation, PWA support   |

## Documentation

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — Sprint 1 implementation decisions and UX rationale
- [`docs/QUICKSTART.md`](docs/QUICKSTART.md) — 2-minute user onboarding guide
- [`docs/design.md`](docs/design.md) — Full software design spec (v1.3)
- [`docs/RESEARCH-FITNESS-PROGRAMS.md`](docs/RESEARCH-FITNESS-PROGRAMS.md) — Evidence-based training recommendations by exercise/tier

## Agents

Specialized subagents for domain-specific development tasks live in [`.claude/agents/`](.claude/agents/):

- **[scoring-agent](.claude/agents/scoring-agent.md)** — Scoring tables, engine logic, age/gender bracket expansion
- **[codec-agent](.claude/agents/codec-agent.md)** — S-code/D-code encoding, bit-packing, compression

## Deployment

- **Hosting:** GitHub Pages at `https://272-cos.github.io/PFA/`
- **Trigger:** Push to `main` → GitHub Actions builds and deploys
- **Base path:** `/PFA/` (configured in `vite.config.js`)
- **SPA routing:** `public/404.html` redirects to `index.html` for client-side routing
