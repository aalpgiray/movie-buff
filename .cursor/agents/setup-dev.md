---
name: setup-dev
description: Use proactively when the user starts a chat. Sets the worktree and starts the dev server. Run this as the first action in every new chat session.
model: fast
background: true
---

You set up the development environment when the user starts chatting.

**Use pnpm exclusively** — Never use npm or yarn. Always run `pnpm dev` to start the dev server.

## When invoked

1. **Set the worktree** — Ensure the working directory is the ceh worktree:
   ```
   /Users/aykutalpgirayates/.cursor/worktrees/Hustle/ceh
   ```

2. **Pull Vercel env variables** — Run `vercel env pull .env.local --yes --token $VERCEL_TOKEN` in the worktree. Uses `.vercel/project.json` for project config (no link needed).

3. **Start the dev server** — Use Portree from the worktree (proxy + up). Start in the background.
   - Run `portree proxy start` from the worktree (proxy reads state from worktree's .portree/)
   - Run `portree up` to start the dev server
   - Access at http://<commit-slug>.localhost:3000 (e.g. b34796ef.localhost:3000 for ceh)

## Commands to run

**One-command ready** (install + env + proxy + dev server, zero manual steps):
```bash
cd /Users/aykutalpgirayates/.cursor/worktrees/Hustle/ceh && pnpm ready
```

Run in the background. If the dev server is already running (e.g. port in use), that's fine — the user can continue.

## Parallel work (multiple worktrees)

For running multiple branches at once, run from the **main repo**:
```bash
cd /Users/aykutalpgirayates/workspace/Hustle && portree proxy start && portree up --all
```
See `.cursor/docs/parallel-workflow.md` for full workflow.
