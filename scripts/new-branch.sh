#!/usr/bin/env bash
# Create new branch as worktree, run ready, open in new Cursor window.
# Usage: pnpm branch <branch-name>
# Example: pnpm branch feature/auth

set -e
BRANCH="$1"
[[ -z "$BRANCH" ]] && { echo "Usage: pnpm branch <branch-name>"; exit 1; }

MAIN_REPO=$(cd "$(git rev-parse --show-toplevel)" && git worktree list --porcelain | awk '/^worktree /{print $2; exit}')
REPO_NAME=$(basename "$MAIN_REPO")
WT_BASE="$HOME/.cursor/worktrees/$REPO_NAME"
WT_SLUG=$(echo "$BRANCH" | tr '/' '-')
WT_PATH="$WT_BASE/$WT_SLUG"

mkdir -p "$WT_BASE"
git worktree add "$WT_PATH" -b "$BRANCH"

cd "$WT_PATH"
pnpm ready

echo ""
echo "Opening in new Cursor window..."
cursor "$WT_PATH"
