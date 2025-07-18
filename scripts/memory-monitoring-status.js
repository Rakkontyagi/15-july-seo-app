#!/usr/bin/env node

const { MemoryMonitor } = require('../src/lib/monitoring/memory-monitor');

// Create a memory monitor instance just to get current status
const monitor = new MemoryMonitor();
const snapshot = monitor.getLatestSnapshot() || process.memoryUsage();

// Format memory values to MB with 2 decimal places
const formatMemory = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

console.log('=== Memory Status Report ===');
console.log('RSS (Resident Set Size):', formatMemory(snapshot.rss || snapshot.rss));
console.log('Heap Total:', formatMemory(snapshot.heapTotal || snapshot.heapTotal));
console.log('Heap Used:', formatMemory(snapshot.heapUsed || snapshot.heapUsed));
console.log('External:', formatMemory(snapshot.external || snapshot.external));

if (snapshot.arrayBuffers) {
  console.log('Array Buffers:', formatMemory(snapshot.arrayBuffers));
}

// Check for memory leaks
const memoryTrend = monitor.getMemoryTrend(5); // Last 5 minutes
console.log('\n=== Memory Trend (Last 5 Minutes) ===');
console.log('Trend:', memoryTrend.trend);
console.log('Rate:', memoryTrend.rate.toFixed(2), 'MB/minute');

// Check for resource leaks
const resourceLeaks = monitor.getResourceLeaks();
if (resourceLeaks.length > 0) {
  console.log('\n=== Resource Leaks Detected ===');
  resourceLeaks.forEach(leak => {
    console.log(`- ${leak.type}: ${leak.count} unclosed resources`);
  });
} else {
  console.log('\nNo resource leaks detected.');
}

// Try to force garbage collection if available
if (global.gc) {
  console.log('\nForcing garbage collection...');
  global.gc();
  
  // Get updated memory usage after GC
  const afterGC = process.memoryUsage();
  console.log('Heap Used After GC:', formatMemory(afterGC.heapUsed));
  console.log('Memory Freed:', formatMemory(snapshot.heapUsed - afterGC.heapUsed));
} else {
  console.log('\nGarbage collection not available. Run with --expose-gc flag to enable.');
}