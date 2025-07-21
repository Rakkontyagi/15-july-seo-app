#!/usr/bin/env node

/**
 * Custom Test Runner for SEO Automation App
 * Handles Jest environment setup and configuration
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Clear Next.js cache before running tests
const fs = require('fs');
const nextCacheDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('Clearing Next.js cache...');
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
}

// Get test arguments
const args = process.argv.slice(2);

// Configure Jest options
const jestArgs = [
  '--detectOpenHandles',
  '--forceExit',
  '--maxWorkers=50%',
  ...args
];

console.log('Starting Jest test runner...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Arguments:', jestArgs.join(' '));

// Run Jest
const jest = spawn('npx', ['jest', ...jestArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    FORCE_COLOR: '1',
  }
});

jest.on('error', (error) => {
  console.error('Failed to start Jest:', error);
  process.exit(1);
});

jest.on('exit', (code) => {
  process.exit(code);
});