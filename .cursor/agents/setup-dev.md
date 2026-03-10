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

3. **Start the dev server** — Run `pnpm dev` in the worktree. Start it in the background so it keeps running.

## Commands to run

```bash
cd /Users/aykutalpgirayates/.cursor/worktrees/Hustle/ceh && vercel env pull .env.local --yes --token $VERCEL_TOKEN && pnpm dev
```

Run this in the background. If the dev server is already running (e.g. port in use), that's fine — the user can continue.
