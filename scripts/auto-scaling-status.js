#!/usr/bin/env node

const os = require('os');

// Get current system metrics
const cpus = os.cpus();
let totalIdle = 0;
let totalTick = 0;

cpus.forEach(cpu => {
  for (const type in cpu.times) {
    totalTick += cpu.times[type];
  }
  totalIdle += cpu.times.idle;
});

const cpuUsage = 100 - (totalIdle / totalTick * 100);
const totalMem = os.totalmem();
const freeMem = os.freemem();
const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

console.log('=== System Status Report ===');
console.log('CPU Usage:', cpuUsage.toFixed(2) + '%');
console.log('Memory Usage:', memoryUsage.toFixed(2) + '%');
console.log('Total Memory:', (totalMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB');
console.log('Free Memory:', (freeMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB');
console.log('Load Average:', os.loadavg());
console.log('Uptime:', (os.uptime() / 3600).toFixed(2) + ' hours');

// This would typically come from the auto-scaler service
// For now, we'll just show placeholder values
console.log('\n=== Auto-Scaling Status ===');
console.log('Current Instances: 1');
console.log('Min Instances: 1');
console.log('Max Instances: 10');
console.log('CPU Threshold: 70%');
console.log('Memory Threshold: 80%');
console.log('Last Scaling Action: None');
console.log('Cooldown Period: 5 minutes');

// Show scaling recommendation based on current metrics
console.log('\n=== Scaling Recommendation ===');
if (cpuUsage > 70 || memoryUsage > 80) {
  console.log('Recommendation: Scale Up');
  console.log('Reason: High resource utilization');
} else if (cpuUsage < 30 && memoryUsage < 40) {
  console.log('Recommendation: Scale Down');
  console.log('Reason: Low resource utilization');
} else {
  console.log('Recommendation: Maintain Current Scale');
  console.log('Reason: Resource utilization within optimal range');
}