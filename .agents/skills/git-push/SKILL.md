---
name: git-push
description: Commit and push all current changes to GitHub with an auto-incrementing semantic version tag (x.x.x format, starting at 0.0.1). Use whenever the user asks to push, commit, or ship changes to git.
---

# Git Push

Commit and push all changes to the remote with an auto-incrementing version number.

## IMPORTANT: How to execute

Git push is a destructive git operation and **cannot be run directly by the main agent**.
You must create a Project Task with the exact shell commands below and let it run in an isolated environment.

## Version Format

`MAJOR.MINOR.PATCH` — e.g. `0.0.1`, `0.0.2`, `0.1.0`, `1.0.0`

- **PATCH** (`x.x.N`): bug fixes, small tweaks, config changes (default)
- **MINOR** (`x.N.0`): new features, meaningful additions
- **MAJOR** (`N.0.0`): breaking changes, full rewrites

## Steps

### 1. Find the current version tag

```bash
git tag --sort=-v:refname | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -1
```

If no tags exist, start from `0.0.0` so next PATCH = `0.0.1`.

### 2. Calculate next version

Parse the tag, increment the right part, reset lower parts to 0.

### 3. Write the Project Task plan

Write a plan file to `.local/tasks/git-push.md` with the exact commands:

```markdown
# Push vX.Y.Z to GitHub

## Steps
1. Stage all changes, commit, tag, and push:

```bash
git config user.email "agent@replit.com"
git config user.name "Replit Agent"
git add -A
git commit -m "vX.Y.Z — <short description>"
git tag X.Y.Z
git push origin main
git push origin X.Y.Z
```
```

### 4. Create and propose the task

Use `bulkCreateProjectTasks` then `proposeProjectTasks` so the user can approve the push.

### 5. Report to user

Tell them: "Ready to push **vX.Y.Z** — approve the task above to ship it."

## Example

Latest tag is `0.1.3` → next PATCH = `0.1.4`

Tell the user: "Ready to push **v0.1.4** — approve the task above to ship it."

## Notes

- `.env`, `.env.*`, `*.local` must already be in `.gitignore` — verify before pushing
- If `git push` fails due to no upstream: add `git push --set-upstream origin main` before the tag push
- If the repo has no commits at all, do an initial commit with `git add -A && git commit -m "v0.0.1 — initial commit"` first
