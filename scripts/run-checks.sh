#!/bin/bash

set -e

echo "🔍 Running checks..."
echo ""

echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

echo "🎨 Running linter..."
pnpm lint || { echo "❌ Linting failed"; exit 1; }
echo "✅ Linting passed"
echo ""

echo "🔨 Building project..."
pnpm build || { echo "❌ Build failed"; exit 1; }
echo "✅ Build passed"
echo ""

echo "🧪 Running tests..."
pnpm vitest run || { echo "❌ Tests failed"; exit 1; }
echo "✅ Tests passed"
echo ""

echo "🎉 All checks passed!"
