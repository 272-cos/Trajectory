---
name: Commit plans into the repo, not just /root/.claude/plans
description: User wants planning artifacts committed into docs/plans/ on the Trajectory repo, not left as plan-mode files in the Claude home directory
type: feedback
originSessionId: a325d636-dda1-4622-85c5-9b0be0f7a933
---
When producing a planning document for Trajectory, always mirror it into `docs/plans/YYYY-MM-DD-<slug>.md` in the repo and commit + push. The plan-mode file at `/root/.claude/plans/` is ephemeral scaffolding; the repo copy is the durable artifact.

**Why:** User explicitly said "Take this plan write it to a file tell me what that file is, then push and commit that file to the repo" after a plan was produced only in the home-dir plan-mode location. They want planning artifacts in the repo so teammates and future sessions can find them via `git log` / `git blame` and so they show up on GitHub.

**How to apply:** After the plan is finalized (ExitPlanMode approved), copy the plan file into `docs/plans/YYYY-MM-DD-<slug>.md`, commit with `docs(plans):` conventional-commit prefix, push to the current branch. Tell the user the exact path.
