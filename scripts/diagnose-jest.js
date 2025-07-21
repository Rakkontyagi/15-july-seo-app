#!/usr/bin/env node

/**
 * Jest Diagnostics Script
 * Helps diagnose and fix Jest environment issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running Jest Diagnostics...\n');

// Check Node version
console.log('1. Node.js Version:');
console.log(`   ${process.version}`);
console.log(`   ${process.version >= 'v18.0.0' ? '✅ Compatible' : '❌ Requires Node.js 18 or higher'}\n`);

// Check if Jest is installed
console.log('2. Jest Installation:');
try {
  const jestVersion = execSync('npx jest --version', { encoding: 'utf8' }).trim();
  console.log(`   ✅ Jest installed: ${jestVersion}`);
} catch (error) {
  console.log('   ❌ Jest not found');
}

// Check for required dependencies
console.log('\n3. Required Dependencies:');
const requiredDeps = [
  '@testing-library/react',
  '@testing-library/jest-dom',
  '@types/jest',
  'jest-environment-jsdom'
];

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

requiredDeps.forEach(dep => {
  if (allDeps[dep]) {
    console.log(`   ✅ ${dep}: ${allDeps[dep]}`);
  } else {
    console.log(`   ❌ ${dep}: Not installed`);
  }
});

// Check for conflicting dependencies
console.log('\n4. Potential Conflicts:');
const conflicts = [
  { name: 'react', expected: '19.1.0' },
  { name: 'react-dom', expected: '19.1.0' },
  { name: 'next', expected: '15.4.1' }
];

conflicts.forEach(({ name, expected }) => {
  const actual = allDeps[name];
  if (actual === expected) {
    console.log(`   ✅ ${name}: ${actual}`);
  } else {
    console.log(`   ⚠️  ${name}: ${actual} (expected ${expected})`);
  }
});

// Check Jest configuration files
console.log('\n5. Configuration Files:');
const configFiles = [
  'jest.config.js',
  'jest.setup.js',
  'src/setupTests.ts',
  'src/__tests__/setup.ts'
];

configFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// Check for common issues
console.log('\n6. Common Issues Check:');

// Check for .next directory
const nextDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextDir)) {
  console.log('   ⚠️  .next directory exists - may cause issues with Jest');
  console.log('      Run: rm -rf .next');
} else {
  console.log('   ✅ No .next directory');
}

// Check for node_modules/.cache
const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  console.log('   ⚠️  node_modules/.cache exists - may cause issues');
  console.log('      Run: rm -rf node_modules/.cache');
} else {
  console.log('   ✅ No node_modules/.cache');
}

// Test TypeScript configuration
console.log('\n7. TypeScript Configuration:');
try {
  execSync('npx tsc --noEmit --project tsconfig.json', { encoding: 'utf8' });
  console.log('   ✅ TypeScript configuration valid');
} catch (error) {
  console.log('   ❌ TypeScript configuration issues');
}

// Recommendations
console.log('\n📋 Recommendations:');
console.log('1. Clear all caches: rm -rf .next node_modules/.cache');
console.log('2. Reinstall dependencies: rm -rf node_modules && npm install --legacy-peer-deps');
console.log('3. Use the custom test runner: node scripts/test-runner.js');
console.log('4. For specific test: node scripts/test-runner.js path/to/test.test.ts');

console.log('\n✅ Diagnostics complete!');