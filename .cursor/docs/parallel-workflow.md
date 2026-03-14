# Parallel Workflow (Multiple Branches on Same Machine)

Use Portree to run dev servers for multiple worktrees at once. Each worktree gets its own port; one proxy routes by subdomain.

## Quick Start

```bash
cd /Users/aykutalpgirayates/workspace/Hustle
portree proxy start
portree up --all
```

Then open:
- **main branch**: http://main.localhost:3000
- **Other worktrees**: http://&lt;slug&gt;.localhost:3000 (e.g. `b34796ef.localhost:3000` for commit b34796ef)

Use `portree ls` to see worktrees and their slugs.

## Before First Run (per worktree)

Each worktree needs dependencies and env vars before `portree up` can start it:

```bash
cd /path/to/worktree
pnpm install
vercel env pull .env.local --yes --token $VERCEL_TOKEN
# Or copy from main: cp /Users/aykutalpgirayates/workspace/Hustle/.env.local .env.local
```

## Daily Workflow

| Goal | Commands |
|------|----------|
| Start all worktrees | `cd <main-repo> && portree proxy start && portree up --all` |
| Stop all | `cd <main-repo> && portree down --all` |
| Start only main | `cd <main-repo> && portree proxy start && portree up` |
| Start one worktree | `cd <worktree> && portree proxy start && portree up` |
| Dashboard | `portree dash` |

## Notes

- **Slug = branch name or commit hash** (e.g. `main`, `b34796ef`). Multiple worktrees on the same commit share a slug; routing may be ambiguous.
- **Proxy runs on port 3000**; dev servers use 3100–3199.
- **setup-dev** (chat start) targets the ceh worktree; for full parallel, run the commands above from the main repo.
