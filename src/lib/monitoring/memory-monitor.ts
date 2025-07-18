
import { performance } from 'perf_hooks';
import EventEmitter from 'events';

export interface MemorySnapshot {
  timestamp: number;
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers?: number;
}

export interface ResourceTracker {
  type: string;
  count: number;
  details: any[];
}

export interface LeakDetectionResult {
  detected: boolean;
  confidence: number;
  growthRate: number;
  recommendation: string;
}

export interface AlertThresholds {
  heapUsedWarning: number; // MB
  heapUsedCritical: number; // MB
  rssWarning: number; // MB
  rssCritical: number; // MB
  growthRateWarning: number; // MB/min
  growthRateCritical: number; // MB/min
}

export class MemoryMonitor extends EventEmitter {
  private interval: NodeJS.Timeout | null = null;
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots = 60; // Keep last 60 snapshots
  private resources: Map<string, ResourceTracker> = new Map();
  private thresholds: AlertThresholds = {
    heapUsedWarning: 500, // MB
    heapUsedCritical: 1000, // MB
    rssWarning: 1000, // MB
    rssCritical: 1500, // MB
    growthRateWarning: 5, // MB/min
    growthRateCritical: 10 // MB/min
  };
  
  constructor(thresholds?: Partial<AlertThresholds>) {
    super();
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }
  }

  start(interval = 5000) {
    this.interval = setInterval(() => {
      this.takeSnapshot();
      this.detectLeaks();
      this.checkThresholds();
    }, interval);
    
    return this;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    return this;
  }

  private takeSnapshot(): MemorySnapshot {
    const memoryUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      rss: memoryUsage.rss / (1024 * 1024), // Convert to MB
      heapTotal: memoryUsage.heapTotal / (1024 * 1024),
      heapUsed: memoryUsage.heapUsed / (1024 * 1024),
      external: memoryUsage.external / (1024 * 1024),
    };
    
    // Node.js v14+ includes arrayBuffers
    if ('arrayBuffers' in memoryUsage) {
      snapshot.arrayBuffers = (memoryUsage as any).arrayBuffers / (1024 * 1024);
    }
    
    this.snapshots.push(snapshot);
    
    // Keep only the last maxSnapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    
    return snapshot;
  }

  private detectLeaks(): LeakDetectionResult | null {
    if (this.snapshots.length < 10) {
      return null; // Need more data points
    }
    
    // Use linear regression to detect consistent memory growth
    const xValues: number[] = [];
    const yValues: number[] = [];
    
    // Use the last 10 snapshots for analysis
    const recentSnapshots = this.snapshots.slice(-10);
    
    recentSnapshots.forEach((snapshot, index) => {
      xValues.push(index);
      yValues.push(snapshot.heapUsed);
    });
    
    const { slope, r2 } = this.linearRegression(xValues, yValues);
    
    // Convert slope to MB/minute
    const growthRatePerMinute = slope * (60000 / 5000); // Assuming 5000ms interval
    
    const result: LeakDetectionResult = {
      detected: false,
      confidence: r2,
      growthRate: growthRatePerMinute,
      recommendation: ''
    };
    
    // If we have a strong correlation (r² > 0.9) and positive slope, likely a leak
    if (r2 > 0.9 && slope > 0) {
      result.detected = true;
      result.recommendation = 'Possible memory leak detected. Check for unclosed resources or circular references.';
      
      this.emit('leak-detected', result);
    }
    
    return result;
  }

  private linearRegression(x: number[], y: number[]): { slope: number, intercept: number, r2: number } {
    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate coefficient of determination (r²)
    const yMean = sumY / n;
    let totalVariation = 0;
    let explainedVariation = 0;
    
    for (let i = 0; i < n; i++) {
      totalVariation += Math.pow(y[i] - yMean, 2);
      explainedVariation += Math.pow((slope * x[i] + intercept) - yMean, 2);
    }
    
    const r2 = explainedVariation / totalVariation;
    
    return { slope, intercept, r2 };
  }

  private checkThresholds() {
    if (this.snapshots.length === 0) return;
    
    const latest = this.snapshots[this.snapshots.length - 1];
    
    // Check heap used thresholds
    if (latest.heapUsed >= this.thresholds.heapUsedCritical) {
      this.emit('alert', {
        level: 'critical',
        metric: 'heapUsed',
        value: latest.heapUsed,
        threshold: this.thresholds.heapUsedCritical,
        message: `Heap usage critical: ${latest.heapUsed.toFixed(2)} MB exceeds threshold of ${this.thresholds.heapUsedCritical} MB`
      });
    } else if (latest.heapUsed >= this.thresholds.heapUsedWarning) {
      this.emit('alert', {
        level: 'warning',
        metric: 'heapUsed',
        value: latest.heapUsed,
        threshold: this.thresholds.heapUsedWarning,
        message: `Heap usage warning: ${latest.heapUsed.toFixed(2)} MB exceeds threshold of ${this.thresholds.heapUsedWarning} MB`
      });
    }
    
    // Check RSS thresholds
    if (latest.rss >= this.thresholds.rssCritical) {
      this.emit('alert', {
        level: 'critical',
        metric: 'rss',
        value: latest.rss,
        threshold: this.thresholds.rssCritical,
        message: `RSS critical: ${latest.rss.toFixed(2)} MB exceeds threshold of ${this.thresholds.rssCritical} MB`
      });
    } else if (latest.rss >= this.thresholds.rssWarning) {
      this.emit('alert', {
        level: 'warning',
        metric: 'rss',
        value: latest.rss,
        threshold: this.thresholds.rssWarning,
        message: `RSS warning: ${latest.rss.toFixed(2)} MB exceeds threshold of ${this.thresholds.rssWarning} MB`
      });
    }
  }

  // Resource tracking methods
  trackResource(type: string, id: string, details: any = {}) {
    if (!this.resources.has(type)) {
      this.resources.set(type, { type, count: 0, details: [] });
    }
    
    const resource = this.resources.get(type)!;
    resource.count++;
    resource.details.push({ id, ...details, createdAt: Date.now() });
    
    return id;
  }

  releaseResource(type: string, id: string) {
    if (!this.resources.has(type)) return false;
    
    const resource = this.resources.get(type)!;
    const index = resource.details.findIndex(item => item.id === id);
    
    if (index !== -1) {
      resource.details.splice(index, 1);
      resource.count--;
      return true;
    }
    
    return false;
  }

  getResourceLeaks(): ResourceTracker[] {
    return Array.from(this.resources.values())
      .filter(resource => resource.count > 0);
  }

  // Utility methods
  getLatestSnapshot(): MemorySnapshot | null {
    if (this.snapshots.length === 0) return null;
    return this.snapshots[this.snapshots.length - 1];
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getMemoryTrend(minutes: number = 5): { trend: 'stable' | 'increasing' | 'decreasing', rate: number } {
    if (this.snapshots.length < 2) {
      return { trend: 'stable', rate: 0 };
    }
    
    const msPerMinute = 60 * 1000;
    const now = Date.now();
    const cutoff = now - (minutes * msPerMinute);
    
    const relevantSnapshots = this.snapshots.filter(s => s.timestamp >= cutoff);
    
    if (relevantSnapshots.length < 2) {
      return { trend: 'stable', rate: 0 };
    }
    
    const first = relevantSnapshots[0];
    const last = relevantSnapshots[relevantSnapshots.length - 1];
    
    const heapDiff = last.heapUsed - first.heapUsed;
    const timeDiffMinutes = (last.timestamp - first.timestamp) / msPerMinute;
    const rate = heapDiff / timeDiffMinutes;
    
    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    
    if (rate > 1) trend = 'increasing';
    else if (rate < -1) trend = 'decreasing';
    
    return { trend, rate };
  }

  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }

  setThresholds(thresholds: Partial<AlertThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    return this;
  }
}

// Add gc property to global for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      gc?: () => void;
    }
  }
}
