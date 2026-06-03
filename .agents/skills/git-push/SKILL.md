---
name: git-push
description: Commit and push all current changes to GitHub with an auto-incrementing semantic version tag (x.x.x format, starting at 0.0.1). Use whenever the user asks to push, commit, or ship changes to git.
---

# Git Push

Commit all changes with an auto-incrementing version tag and guide the user to push.

## IMPORTANT: Sandbox limitation

The agent sandbox **cannot run `git push`** — the remote write is blocked for security.
The agent can stage and commit locally, but the actual push must be done by the user via the **Replit Git panel** (the branch icon in the left sidebar) or from their local machine.

## Version Format

`MAJOR.MINOR.PATCH` — e.g. `0.0.1`, `0.0.2`, `0.1.0`, `1.0.0`

- **PATCH** (`x.x.N`): bug fixes, small tweaks, config changes (default)
- **MINOR** (`x.N.0`): new features, meaningful additions
- **MAJOR** (`N.0.0`): breaking changes, full rewrites

## Steps

### 1. Find the current version tag

```bash
git --no-optional-locks tag --sort=-v:refname | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -1
```

If no tags exist, start from `0.0.0` → next PATCH = `0.0.1`.

### 2. Calculate next version

Parse the tag, increment the right part, reset lower parts to 0.

### 3. Tell the user what version is next

Say: "I'll tag this as **vX.Y.Z**. Once committed, open the Git panel (branch icon in the left sidebar) and click **Push** to ship it to GitHub."

### 4. Stage and commit (no push)

```bash
git --no-optional-locks config user.email "agent@replit.com"
git --no-optional-locks config user.name "Replit Agent"
git add -A
git --no-optional-locks commit -m "vX.Y.Z — <short description of changes>"
git --no-optional-locks tag X.Y.Z
```

### 5. Confirm to user

Say: "Committed and tagged **vX.Y.Z** locally. Open the Git panel and hit **Push** — Render and Vercel will deploy automatically."

## Notes

- `.env`, `.env.*`, `*.local` must be in `.gitignore` before committing — always verify
- `git push` and `git push origin <tag>` are blocked in the sandbox; user must push via Replit UI or local terminal
- Use `--no-optional-locks` on all read-only git commands to avoid lock conflicts
