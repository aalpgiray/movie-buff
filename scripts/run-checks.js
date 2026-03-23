#!/usr/bin/env node

import { spawnSync } from 'child_process';

const projectRoot = '/vercel/share/v0-project';
const checks = [
  { name: 'Lint', command: 'eslint', args: ['.'] },
  { name: 'Build', command: 'next', args: ['build'] },
  { name: 'Type Check', command: 'tsc', args: ['--noEmit'] }
];

console.log('🚀 Running project checks...\n');

let allPassed = true;

for (const check of checks) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Running: ${check.name}`);
  console.log(`Command: ${check.command} ${check.args.join(' ')}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const result = spawnSync('npx', [check.command, ...check.args], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  if (result.status === 0) {
    console.log(`\n✅ ${check.name} passed\n`);
  } else {
    console.log(`\n❌ ${check.name} failed\n`);
    allPassed = false;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (allPassed) {
  console.log('✅ All checks passed!');
} else {
  console.log('❌ Some checks failed. See details above.');
  process.exit(1);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
