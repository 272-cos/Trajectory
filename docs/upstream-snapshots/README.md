# docs/upstream-snapshots/

Drop-zone for upstream USAF publication PDFs downloaded by
`scripts/check-upstream-pubs.sh` when drift is detected against
`docs/UPSTREAM-PINS.json`.

## What lands here

- `<key>.pdf` — the **current live** PDF for a pinned source when that source
  has drifted (URL rotated, Last-Modified changed, or sha256 changed).
- `<key>-parent.html` — saved when the AFPC parent page structure no longer
  yields exactly one match for a source's `match_regex`.

Files are **gitignored** (`.gitignore`). The durable record of upstream state
lives in `docs/UPSTREAM-PINS.json`; the PDFs here are throwaway review
artifacts (DAFMAN is ~40MB, not suitable for git history). CI uploads this
directory as a workflow artifact so reviewers can download it.

## When files appear

Two paths:

1. **Drift detected at deploy time.** `scripts/check-upstream-pubs.sh` (run by
   the `deploy.yml` workflow) saves the new PDF here and exits non-zero. Deploy
   is blocked.
2. **Refresh mode.** Running `bash scripts/check-upstream-pubs.sh --refresh`
   re-downloads every source and refreshes the snapshots. Use this only when
   intentionally accepting a new upstream publication.

## The review workflow

The whole point of this directory is that the check script does **not** know
what changed, so it refuses to decide for you.

1. Open the drifted `<key>.pdf` and diff against your local/archived prior
   version, Wayback Machine, or the change bars in the PDF itself.
2. Update `docs/DAFMAN-COMPLIANCE-MATRIX.md` with cited changes.
3. Update `src/utils/scoring/**` constants/tables if scoring math changed.
4. Update `src/components/**` disclaimer/version strings if the regulation
   citation or effective date moved.
5. Run `bash scripts/check-upstream-pubs.sh --refresh` to rewrite
   `docs/UPSTREAM-PINS.json` with current values.
6. Commit the pin diff + compliance matrix + scoring changes **together** so
   the audit trail shows the regulation change and the code change as one
   linked commit. Do not commit the snapshot PDFs (gitignored).

## Why snapshots instead of auto-accepting

See `docs/DECISIONS.md` under "Upstream drift: download-and-halt, never
auto-accept" (2026-04-19). Short version: auto-accepting an upstream change
in the pin file with no human review defeats the entire point of having a
pin, because we would never notice a substantive regulation change until a
user pointed out a scoring bug. Halt + snapshot forces the right reflex.
