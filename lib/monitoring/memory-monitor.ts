/**
 * Memory Usage Monitor
 * Comprehensive memory monitoring, leak detection, and automatic cleanup
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { multiTierCache } from '../cache/multi-tier-cache';

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  memoryUsagePercent: number;
  gcStats?: {
    collections: number;
    duration: number;
    type: string;
  };
}

export interface MemoryAlert {
  type: 'warning' | 'critical' | 'leak_detected';
  message: string;
  timestamp: Date;
  memoryUsage: number;
  threshold: number;
  recommendations: string[];
}

export interface MemoryLeakDetection {
  isLeakDetected: boolean;
  leakRate: number; // MB per minute
  confidence: number; // 0-1 scale
  affectedComponents: string[];
  timeToAction: number; // minutes until critical
  recommendations: string[];
}

export interface MemoryConfiguration {
  warningThreshold: number; // MB
  criticalThreshold: number; // MB
  leakDetectionEnabled: boolean;
  leakDetectionInterval: number; // ms
  cleanupInterval: number; // ms
  maxSnapshots: number;
  gcForceInterval: number; // ms
  alertCallback?: (alert: MemoryAlert) => void;
}

export class MemoryMonitor extends EventEmitter {
  private static instance: MemoryMonitor;
  private config: MemoryConfiguration;
  private snapshots: MemorySnapshot[] = [];
  private isMonitoring = false;
  private intervals: NodeJS.Timeout[] = [];
  private lastCpuUsage: NodeJS.CpuUsage;
  private componentRegistry: Map<string, any> = new Map();
  private gcObserver?: PerformanceObserver;

  private constructor(config: MemoryConfiguration) {
    super();
    this.config = config;
    this.lastCpuUsage = process.cpuUsage();
    this.setupGCObserver();
  }

  public static getInstance(config?: MemoryConfiguration): MemoryMonitor {
    if (!MemoryMonitor.instance && config) {
      MemoryMonitor.instance = new MemoryMonitor(config);
    }
    return MemoryMonitor.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.emit('monitoring_started');

    // Regular memory snapshots
    const snapshotInterval = setInterval(() => {
      this.takeSnapshot();
    }, 30000); // Every 30 seconds

    // Leak detection
    if (this.config.leakDetectionEnabled) {
      const leakDetectionInterval = setInterval(() => {
        this.detectMemoryLeaks();
      }, this.config.leakDetectionInterval);
      
      this.intervals.push(leakDetectionInterval);
    }

    // Cleanup interval
    const cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    // Force GC interval (if available)
    if (global.gc && this.config.gcForceInterval > 0) {
      const gcInterval = setInterval(() => {
        this.forceGarbageCollection();
      }, this.config.gcForceInterval);
      
      this.intervals.push(gcInterval);
    }

    this.intervals.push(snapshotInterval, cleanupInterval);

    // Take initial snapshot
    this.takeSnapshot();
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }

    this.emit('monitoring_stopped');
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();

    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss,
      cpuUsage,
      uptime: process.uptime(),
      memoryUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    // Add to snapshots array
    this.snapshots.push(snapshot);

    // Limit snapshots to prevent memory growth
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check thresholds
    this.checkMemoryThresholds(snapshot);

    this.emit('snapshot_taken', snapshot);
    return snapshot;
  }

  /**
   * Detect memory leaks using trend analysis
   */
  detectMemoryLeaks(): MemoryLeakDetection {
    if (this.snapshots.length < 10) {
      return {
        isLeakDetected: false,
        leakRate: 0,
        confidence: 0,
        affectedComponents: [],
        timeToAction: Infinity,
        recommendations: ['Insufficient data for leak detection']
      };
    }

    // Analyze last 10 snapshots for trends
    const recentSnapshots = this.snapshots.slice(-10);
    const memoryTrend = this.calculateMemoryTrend(recentSnapshots);
    
    // Calculate leak rate (MB per minute)
    const timeSpan = (recentSnapshots[recentSnapshots.length - 1].timestamp.getTime() - 
                     recentSnapshots[0].timestamp.getTime()) / (1000 * 60);
    const memoryChange = (recentSnapshots[recentSnapshots.length - 1].heapUsed - 
                         recentSnapshots[0].heapUsed) / (1024 * 1024);
    const leakRate = memoryChange / timeSpan;

    // Determine if leak is detected
    const isLeakDetected = leakRate > 1 && memoryTrend.r2 > 0.7; // > 1MB/min with high correlation
    const confidence = Math.min(memoryTrend.r2, 1);

    // Analyze affected components
    const affectedComponents = this.analyzeAffectedComponents();

    // Calculate time to action
    const currentMemory = recentSnapshots[recentSnapshots.length - 1].heapUsed / (1024 * 1024);
    const timeToAction = isLeakDetected 
      ? Math.max(0, (this.config.criticalThreshold - currentMemory) / leakRate)
      : Infinity;

    const recommendations = this.generateLeakRecommendations(isLeakDetected, leakRate, affectedComponents);

    const detection: MemoryLeakDetection = {
      isLeakDetected,
      leakRate,
      confidence,
      affectedComponents,
      timeToAction,
      recommendations
    };

    if (isLeakDetected) {
      this.emitAlert({
        type: 'leak_detected',
        message: `Memory leak detected: ${leakRate.toFixed(2)} MB/min increase`,
        timestamp: new Date(),
        memoryUsage: currentMemory,
        threshold: this.config.criticalThreshold,
        recommendations
      });
    }

    this.emit('leak_detection_complete', detection);
    return detection;
  }

  /**
   * Register a component for monitoring
   */
  registerComponent(name: string, component: any): void {
    this.componentRegistry.set(name, {
      component,
      registeredAt: new Date(),
      lastChecked: new Date()
    });
  }

  /**
   * Unregister a component
   */
  unregisterComponent(name: string): void {
    this.componentRegistry.delete(name);
  }

  /**
   * Perform memory cleanup
   */
  async performCleanup(): Promise<{
    before: number;
    after: number;
    cleaned: number;
    actions: string[];
  }> {
    const beforeMemory = process.memoryUsage().heapUsed;
    const actions: string[] = [];

    try {
      // Clear expired cache entries
      await multiTierCache.cleanup();
      actions.push('Cache cleanup completed');

      // Clear old snapshots beyond limit
      if (this.snapshots.length > this.config.maxSnapshots) {
        const removed = this.snapshots.length - this.config.maxSnapshots;
        this.snapshots = this.snapshots.slice(-this.config.maxSnapshots);
        actions.push(`Removed ${removed} old memory snapshots`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        actions.push('Forced garbage collection');
      }

      // Clean up component registry
      this.cleanupComponentRegistry();
      actions.push('Component registry cleanup');

      // Clear large objects from memory
      this.clearLargeObjects();
      actions.push('Large object cleanup');

      const afterMemory = process.memoryUsage().heapUsed;
      const cleaned = beforeMemory - afterMemory;

      const result = {
        before: beforeMemory / (1024 * 1024),
        after: afterMemory / (1024 * 1024),
        cleaned: cleaned / (1024 * 1024),
        actions
      };

      this.emit('cleanup_completed', result);
      return result;

    } catch (error) {
      this.emit('cleanup_failed', error);
      throw error;
    }
  }

  /**
   * Get current memory statistics
   */
  getCurrentStats(): {
    current: MemorySnapshot;
    trend: {
      last5Min: number;
      last15Min: number;
      last1Hour: number;
    };
    health: 'good' | 'warning' | 'critical';
    recommendations: string[];
  } {
    const current = this.takeSnapshot();
    const now = new Date();

    // Calculate trends
    const last5Min = this.getMemoryTrendFor(5 * 60 * 1000, now);
    const last15Min = this.getMemoryTrendFor(15 * 60 * 1000, now);
    const last1Hour = this.getMemoryTrendFor(60 * 60 * 1000, now);

    // Determine health status
    const currentMemoryMB = current.heapUsed / (1024 * 1024);
    let health: 'good' | 'warning' | 'critical' = 'good';
    
    if (currentMemoryMB >= this.config.criticalThreshold) {
      health = 'critical';
    } else if (currentMemoryMB >= this.config.warningThreshold) {
      health = 'warning';
    }

    // Generate recommendations
    const recommendations = this.generateHealthRecommendations(current, health, last15Min);

    return {
      current,
      trend: {
        last5Min,
        last15Min,
        last1Hour
      },
      health,
      recommendations
    };
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory(limit?: number): MemorySnapshot[] {
    return limit ? this.snapshots.slice(-limit) : [...this.snapshots];
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const freed = (before - after) / (1024 * 1024);
      
      this.emit('gc_forced', { before, after, freed });
      return true;
    }
    return false;
  }

  /**
   * Set up garbage collection observer
   */
  private setupGCObserver(): void {
    try {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'gc') {
            this.emit('gc_event', {
              type: entry.name,
              duration: entry.duration,
              timestamp: new Date()
            });
          }
        }
      });
      
      this.gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      // GC observer not available in this environment
    }
  }

  /**
   * Check memory thresholds and emit alerts
   */
  private checkMemoryThresholds(snapshot: MemorySnapshot): void {
    const memoryMB = snapshot.heapUsed / (1024 * 1024);

    if (memoryMB >= this.config.criticalThreshold) {
      this.emitAlert({
        type: 'critical',
        message: `Critical memory usage: ${memoryMB.toFixed(1)}MB`,
        timestamp: snapshot.timestamp,
        memoryUsage: memoryMB,
        threshold: this.config.criticalThreshold,
        recommendations: [
          'Immediate cleanup required',
          'Consider restarting the application',
          'Review memory-intensive operations'
        ]
      });
    } else if (memoryMB >= this.config.warningThreshold) {
      this.emitAlert({
        type: 'warning',
        message: `High memory usage: ${memoryMB.toFixed(1)}MB`,
        timestamp: snapshot.timestamp,
        memoryUsage: memoryMB,
        threshold: this.config.warningThreshold,
        recommendations: [
          'Monitor memory usage closely',
          'Consider running cleanup',
          'Review recent operations'
        ]
      });
    }
  }

  /**
   * Emit memory alert
   */
  private emitAlert(alert: MemoryAlert): void {
    this.emit('memory_alert', alert);
    
    if (this.config.alertCallback) {
      this.config.alertCallback(alert);
    }
  }

  /**
   * Calculate memory trend using linear regression
   */
  private calculateMemoryTrend(snapshots: MemorySnapshot[]): { slope: number; r2: number } {
    if (snapshots.length < 2) return { slope: 0, r2: 0 };

    const n = snapshots.length;
    const x = snapshots.map((_, i) => i);
    const y = snapshots.map(s => s.heapUsed / (1024 * 1024));

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, r2 };
  }

  /**
   * Analyze affected components for memory leaks
   */
  private analyzeAffectedComponents(): string[] {
    const affected: string[] = [];
    
    for (const [name, data] of this.componentRegistry) {
      // Simple heuristic: check if component hasn't been accessed recently
      const timeSinceCheck = Date.now() - data.lastChecked.getTime();
      if (timeSinceCheck > 5 * 60 * 1000) { // 5 minutes
        affected.push(name);
      }
    }

    return affected;
  }

  /**
   * Generate leak recommendations
   */
  private generateLeakRecommendations(
    isLeakDetected: boolean, 
    leakRate: number, 
    affectedComponents: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (isLeakDetected) {
      recommendations.push('Memory leak detected - immediate investigation required');
      
      if (leakRate > 5) {
        recommendations.push('High leak rate - consider immediate restart');
      }
      
      if (affectedComponents.length > 0) {
        recommendations.push(`Review components: ${affectedComponents.join(', ')}`);
      }
      
      recommendations.push('Enable heap snapshots for detailed analysis');
      recommendations.push('Review recent code changes');
      recommendations.push('Check for unclosed resources (files, connections, timers)');
    }

    return recommendations;
  }

  /**
   * Get memory trend for specific time period
   */
  private getMemoryTrendFor(periodMs: number, endTime: Date): number {
    const startTime = new Date(endTime.getTime() - periodMs);
    const periodSnapshots = this.snapshots.filter(
      s => s.timestamp >= startTime && s.timestamp <= endTime
    );

    if (periodSnapshots.length < 2) return 0;

    const trend = this.calculateMemoryTrend(periodSnapshots);
    return trend.slope; // MB per snapshot interval
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(
    current: MemorySnapshot, 
    health: string, 
    trend: number
  ): string[] {
    const recommendations: string[] = [];

    if (health === 'critical') {
      recommendations.push('Critical memory usage - immediate action required');
      recommendations.push('Run memory cleanup');
      recommendations.push('Consider application restart');
    } else if (health === 'warning') {
      recommendations.push('High memory usage detected');
      recommendations.push('Monitor closely and run cleanup if needed');
    }

    if (trend > 0.5) {
      recommendations.push('Memory usage is trending upward');
      recommendations.push('Investigate potential memory leaks');
    }

    if (current.memoryUsagePercent > 80) {
      recommendations.push('Heap usage above 80% - consider increasing heap size');
    }

    return recommendations;
  }

  /**
   * Clean up component registry
   */
  private cleanupComponentRegistry(): void {
    const now = new Date();
    const staleThreshold = 60 * 60 * 1000; // 1 hour

    for (const [name, data] of this.componentRegistry) {
      if (now.getTime() - data.lastChecked.getTime() > staleThreshold) {
        this.componentRegistry.delete(name);
      }
    }
  }

  /**
   * Clear large objects from memory
   */
  private clearLargeObjects(): void {
    // This is a placeholder for application-specific cleanup
    // In a real implementation, this would clear known large objects
    
    // Clear any large temporary variables
    if ((global as any).tempCache) {
      (global as any).tempCache.clear();
    }
  }
}

// Export factory function and default configuration
export function createMemoryMonitor(config?: Partial<MemoryConfiguration>): MemoryMonitor {
  const defaultConfig: MemoryConfiguration = {
    warningThreshold: 512, // 512MB
    criticalThreshold: 1024, // 1GB
    leakDetectionEnabled: true,
    leakDetectionInterval: 2 * 60 * 1000, // 2 minutes
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
    maxSnapshots: 1000,
    gcForceInterval: 5 * 60 * 1000 // 5 minutes
  };

  return MemoryMonitor.getInstance({ ...defaultConfig, ...config });
}

// Export singleton instance
export const memoryMonitor = createMemoryMonitor();