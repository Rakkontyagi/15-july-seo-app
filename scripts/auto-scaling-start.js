#!/usr/bin/env node

const { AutoScaler } = require('../src/lib/scaling/auto-scaler');

// Parse command line arguments
const args = process.argv.slice(2);
const minArg = args.find(arg => arg.startsWith('--min='));
const maxArg = args.find(arg => arg.startsWith('--max='));
const cpuThresholdArg = args.find(arg => arg.startsWith('--cpu-threshold='));
const memThresholdArg = args.find(arg => arg.startsWith('--mem-threshold='));

// Create auto scaler instance
const autoScaler = new AutoScaler();

// Configure auto scaler based on command line arguments
if (minArg) {
  const minValue = parseInt(minArg.split('=')[1], 10);
  if (!isNaN(minValue) && minValue > 0) {
    autoScaler.minInstances = minValue;
  }
}

if (maxArg) {
  const maxValue = parseInt(maxArg.split('=')[1], 10);
  if (!isNaN(maxValue) && maxValue > 0) {
    autoScaler.maxInstances = maxValue;
  }
}

if (cpuThresholdArg) {
  const cpuThreshold = parseInt(cpuThresholdArg.split('=')[1], 10);
  if (!isNaN(cpuThreshold) && cpuThreshold > 0) {
    autoScaler.cpuThreshold = cpuThreshold;
  }
}

if (memThresholdArg) {
  const memThreshold = parseInt(memThresholdArg.split('=')[1], 10);
  if (!isNaN(memThreshold) && memThreshold > 0) {
    autoScaler.memoryThreshold = memThreshold;
  }
}

console.log('Starting auto-scaling service with configuration:');
console.log(`- Min instances: ${autoScaler.minInstances}`);
console.log(`- Max instances: ${autoScaler.maxInstances}`);
console.log(`- CPU threshold: ${autoScaler.cpuThreshold}%`);
console.log(`- Memory threshold: ${autoScaler.memoryThreshold}%`);

// Start monitoring
autoScaler.startMonitoring();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping auto-scaling service...');
  autoScaler.stopMonitoring();
  process.exit(0);
});

console.log('Auto-scaling service started. Press Ctrl+C to stop.');