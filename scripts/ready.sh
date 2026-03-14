#!/usr/bin/env bash
# One-command "ready to go" for current worktree: install, env, proxy, dev server.
# Run from any worktree. Zero manual steps.

set -e
cd "$(git rev-parse --show-toplevel)"

echo "→ pnpm install"
pnpm install

# Env: vercel pull if linked, else copy from main repo
MAIN_REPO=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')
if [[ -f .vercel/project.json ]] && [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "→ vercel env pull"
  vercel env pull .env.local --yes --token "$VERCEL_TOKEN"
else
  echo "→ copy .env.local from main repo"
  cp "$MAIN_REPO/.env.local" .env.local 2>/dev/null || { echo "No .env.local in main repo; run vercel env pull there first"; exit 1; }
fi

# Stop any existing proxy (from main or elsewhere), then start from here
(cd "$MAIN_REPO" && portree proxy stop 2>/dev/null) || true
echo "→ portree proxy start"
portree proxy start
echo "→ portree up"
portree up

echo ""
echo "Ready. Run 'portree open' or visit http://<slug>.localhost:3000"
