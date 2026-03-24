#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🔍 Starting v0 project checks...\n');

const checks = [
  { name: 'Lint', cmd: 'pnpm lint' },
  { name: 'Build', cmd: 'pnpm build' },
  { name: 'Tests', cmd: 'pnpm test' },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    console.log(`\n📋 Running ${check.name}...`);
    console.log(`Command: ${check.cmd}\n`);
    execSync(check.cmd, { stdio: 'inherit' });
    console.log(`\n✅ ${check.name} passed`);
    passed++;
  } catch {
    console.log(`\n❌ ${check.name} failed`);
    failed++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
