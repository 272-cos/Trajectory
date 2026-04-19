---
name: PDF reference files live in refs/
description: Which PDFs in refs/ are XFA forms vs rasterized prints vs static, and how to extract them
type: project
originSessionId: a41a46a0-4be1-4b0d-bf72-082121407250
---
Reference PDFs live in `refs/` (moved out of repo root 2026-04-19 cleanup). Each has a different extraction path:

- `refs/PFRA Scoring Charts.pdf` - static PDF, pdftotext-friendly. Historical source for scoring tables; the *live* copy is pinned + fetched at deploy time per `docs/UPSTREAM-PINS.json`.
- `refs/Tab 4. The Warfighter's Fitness Playbook  2.0 Feb 2026.pdf` - static, 72 pages.
- `refs/DAFMAN36-2905.pdf` - older 2.6MB copy; live copy pinned in `UPSTREAM-PINS.json`.
- `refs/af4446.pdf` - Adobe LiveCycle **XFA form**, AES-encrypted (print:yes copy:no). `pdftotext` returns only the "Please wait..." fallback page; must use `scripts/xfa2md.py` (decrypts via qpdf, walks /XFA template stream). `scripts/pdf2md.sh` auto-detects and routes.

**Historical gotcha (files since purged 2026-04-19):** `af4446_unsec.pdf` was **not** a decrypted 4446 - it was a 21KB wrapper/launcher PDF with the fallback page only, useless. `af1067_unsec.pdf` was **mislabeled** - internal PDF title was `af4446.pdf`; it was a Microsoft "Print To PDF" raster of the rendered 4446 form (no text layer, no XFA). Lesson: `*_unsec.pdf` does not mean "decrypted and usable"; verify with `pdfinfo` before treating as a source.

**Why:** These filenames look interchangeable but behave totally differently under extraction. Treating any `*_unsec.pdf` as a usable source wastes time.

**How to apply:** For any new AF-form PDF, run `pdfinfo` first to check `Form:` and `Producer:`. If `Form: XFA`, use `scripts/pdf2md.sh` (it auto-detects and routes to `xfa2md.py`). If producer is "Microsoft: Print To PDF", expect a raster and ask the user for a text-bearing copy before attempting extraction.
