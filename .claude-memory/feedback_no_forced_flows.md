---
name: No forced/locking flows
description: Every modal, gate, and interaction must offer a cancel / back / dismiss path unless a prior design doc explicitly justifies locking the user in
type: feedback
originSessionId: 418ae4cd-3c94-4dc7-afcb-f773805e9744
---
Every modal, dialog, confirmation, and click-gate in the Trajectory app must offer a way out — Cancel, Back, Close, Escape, or backdrop click — so the user can always back out, navigate elsewhere, or dismiss without being forced to commit.

**Why:** User wants agency at every step; locked-in flows feel coercive and make the app brittle when users hit a screen they did not intend to reach. The onboarding modal being non-dismissable on first run, or a confirmation modal with only a "yes" option and no "cancel," are examples of the bad pattern.

**How to apply:**
- When adding a new modal/dialog: include a cancel/close affordance, wire ESC key, and make the backdrop click dismiss unless there's a strong reason not to.
- When the user's exit would lose data: still provide the exit, but warn ("you will lose unsaved changes").
- The only exception is when a prior design artifact (docs/DECISIONS.md, a plan in docs/plans/, or an AF regulation constraint) explicitly states a particular flow must be locking/forced. In that case, cite it when leaving the lock in place.
- This applies to both new code and any audit/cleanup of existing screens.
