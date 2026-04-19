# refs/

Reference-only source material: official USAF PDFs, forms, and working documents the project was built against. **Not** shipped to users; not referenced by any build or runtime code path (verified by grep across `scripts/`, `vite.config.js`, `package.json`, `src/**`).

## What lives here

| File | What it is | Extraction path |
|---|---|---|
| `DAFMAN36-2905.pdf` | Older 2.6MB copy of DAFMAN 36-2905 | `pdftotext` |
| `PFRA Scoring Charts.pdf` | Static PDF, source of truth for all 126 scoring tables | `pdftotext` -> `docs/PFRA-Scoring-Charts.md` |
| `Tab 4. The Warfighter's Fitness Playbook  2.0 Feb 2026.pdf` | AFPC training guidance source | `pdftotext` -> `docs/Warfighters-Fitness-Playbook.md` |
| `af4446.pdf` | AF Form 4446 (Adobe LiveCycle **XFA**, AES-encrypted) | `scripts/pdf2md.sh` auto-routes to `scripts/xfa2md.py` (decrypts via qpdf, walks /XFA template stream) |
| `Training_Plan_Adaptation_Verification.docx` | Working doc, kept as historical reference | - |

## Extraction gotchas (inherited lessons)

- **XFA vs static.** Run `pdfinfo <file>` first. If `Form: XFA`, `pdftotext` returns only the "Please wait..." fallback page; use `scripts/pdf2md.sh`.
- **Print-to-PDF rasters.** If `Producer: Microsoft: Print To PDF`, there is no text layer, no XFA. Only OCR would work; ask for a text-bearing copy instead.
- **"Unsec" suffix does not mean decrypted.** Past experience: a file named `af4446_unsec.pdf` was a 21KB wrapper with only the fallback page; a file named `af1067_unsec.pdf` was actually a raster print of 4446 (wrong form number). Verify by opening the internal title + form type with `pdfinfo`, not by filename.

## Current live source of truth

The **live** DAFMAN 36-2905 and PFRA Scoring Charts are pinned and fetched at deploy time by `scripts/check-upstream-pubs.sh` (see `docs/UPSTREAM-PINS.json`). Files in this directory are historical snapshots, not authoritative.
