---
name: Delete output file before regenerating
description: When regenerating PDFs (or any artifact the user has open in a viewer), unlink the file first. Overwrite alone does not always propagate.
type: feedback
---
When regenerating an artifact the user is viewing (PDFs in Adobe Reader, screenshots, etc.), explicitly `unlink`/`rm -f` the target path *before* writing the new bytes. A plain overwrite does not reliably cause the user's viewer to pick up the new content.

**Why:** The user's PDF viewer holds the file open / caches it, and `fs.writeFileSync` over an open file was silently leaving stale content visible to them. Confirmed during the DAF 4446 live-calculator iteration (2026-04-19) when fixes appeared to do nothing until the file was deleted first.

**How to apply:** In any script that regenerates a user-facing file (especially under `screenshots/`, `/tmp/`, or any path the user opens in an external app), start with `fs.unlinkSync(path)` (or `rm -f path` in bash) before the write. When running one-shot `node` scripts for the user to inspect, delete-then-write is the default.
