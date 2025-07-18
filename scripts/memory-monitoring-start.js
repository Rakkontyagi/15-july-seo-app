#!/usr/bin/env node

const { MemoryMonitor } = require('../src/lib/monitoring/memory-monitor');

// Parse command line arguments
const args = process.argv.slice(2);
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const thresholdsArg = args.find(arg => arg.startsWith('--thresholds='));

// Default interval is 5 seconds (5000ms)
let interval = 5000;
if (intervalArg) {
  const intervalValue = parseInt(intervalArg.split('=')[1], 10);
  if (!isNaN(intervalValue) && intervalValue > 0) {
    interval = intervalValue;
  }
}

// Parse thresholds if provided
let thresholds = {};
if (thresholdsArg) {
  try {
    thresholds = JSON.parse(thresholdsArg.split('=')[1]);
  } catch (error) {
    console.error('Invalid thresholds JSON:', error);
  }
}

console.log(`Starting memory monitoring with interval: ${interval}ms`);
if (Object.keys(thresholds).length > 0) {
  console.log('Custom thresholds:', thresholds);
}

// Create and start the memory monitor
const monitor = new MemoryMonitor(thresholds);

// Set up event listeners
monitor.on('alert', (alert) => {
  console.log(`[${alert.level.toUpperCase()}] ${alert.message}`);
});

monitor.on('leak-detected', (result) => {
  console.log(`[LEAK DETECTED] Possible memory leak detected with ${result.confidence.toFixed(2)} confidence`);
  console.log(`Growth rate: ${result.growthRate.toFixed(2)} MB/minute`);
  console.log(`Recommendation: ${result.recommendation}`);
});

// Start monitoring
monitor.start(interval);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping memory monitoring...');
  monitor.stop();
  process.exit(0);
});

console.log('Memory monitoring started. Press Ctrl+C to stop.');