/**
 * Performance Tracker
 * Comprehensive performance monitoring for memory, CPU, and system resources
 */

import { EventEmitter } from 'events';
import { memoryMonitor, MemorySnapshot } from './memory-monitor';
import { leakPrevention } from './leak-prevention';
import { performance, PerformanceObserver } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: Date;
  memory: MemorySnapshot;
  cpu: {
    usage: NodeJS.CpuUsage;
    loadAverage: number[];
    utilizationPercent: number;
  };
  eventLoop: {
    lag: number;
    utilizationPercent: number;
  };
  gc: {
    totalCollections: number;
    totalDuration: number;
    collections: Array<{
      type: string;
      duration: number;
      timestamp: Date;
    }>;
  };
  resources: {
    fileDescriptors: number;
    activeHandles: number;
    activeRequests: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

export interface PerformanceAlert {
  type: 'cpu' | 'memory' | 'eventloop' | 'gc' | 'performance';
  severity: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  recommendations: string[];
}

export interface PerformanceThresholds {
  memory: {
    warning: number; // MB
    critical: number; // MB
  };
  cpu: {
    warning: number; // %
    critical: number; // %
  };
  eventLoop: {
    warning: number; // ms
    critical: number; // ms
  };
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
}

export class PerformanceTracker extends EventEmitter {
  private static instance: PerformanceTracker;
  private isTracking = false;
  private intervals: NodeJS.Timeout[] = [];
  private metrics: PerformanceMetrics[] = [];
  private gcObserver?: PerformanceObserver;
  private thresholds: PerformanceThresholds;
  private requests: Map<string, { startTime: number; endTime?: number }> = new Map();
  private gcStats = {
    totalCollections: 0,
    totalDuration: 0,
    collections: [] as Array<{ type: string; duration: number; timestamp: Date }>
  };
  private lastCpuUsage: NodeJS.CpuUsage;
  private eventLoopLag = 0;

  private constructor(thresholds: PerformanceThresholds) {
    super();
    this.thresholds = thresholds;
    this.lastCpuUsage = process.cpuUsage();
    this.setupGCMonitoring();
    this.setupEventLoopMonitoring();
  }

  public static getInstance(thresholds?: PerformanceThresholds): PerformanceTracker {
    if (!PerformanceTracker.instance && thresholds) {
      PerformanceTracker.instance = new PerformanceTracker(thresholds);
    }
    return PerformanceTracker.instance;
  }

  /**
   * Start performance tracking
   */
  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    // Start memory monitoring
    memoryMonitor.startMonitoring();

    // Start leak prevention
    leakPrevention.start();

    // Collect metrics every 30 seconds
    const metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Check thresholds every minute
    const thresholdInterval = setInterval(() => {
      this.checkThresholds();
    }, 60000);

    this.intervals.push(metricsInterval, thresholdInterval);

    // Initial metrics collection
    this.collectMetrics();

    this.emit('tracking_started');
  }

  /**
   * Stop performance tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Stop intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Stop monitoring systems
    memoryMonitor.stopMonitoring();
    leakPrevention.stop();

    // Disconnect observers
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }

    this.emit('tracking_stopped');
  }

  /**
   * Collect current performance metrics
   */
  collectMetrics(): PerformanceMetrics {
    const timestamp = new Date();
    
    // Memory metrics
    const memory = memoryMonitor.takeSnapshot();

    // CPU metrics
    const cpuUsage = process.cpuUsage ? process.cpuUsage(this.lastCpuUsage) : { user: 0, system: 0 };
    if (process.cpuUsage) {
      this.lastCpuUsage = process.cpuUsage();
    }
    const loadAverage = (process as any).loadavg ? (process as any).loadavg() : [0, 0, 0];
    const utilizationPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100;

    // Event loop metrics
    const eventLoop = {
      lag: this.eventLoopLag,
      utilizationPercent: Math.min(this.eventLoopLag / 10, 100) // Assume 10ms is 100% utilization
    };

    // Resource metrics
    const resources = {
      fileDescriptors: this.getFileDescriptorCount(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length
    };

    // Performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics();

    const metrics: PerformanceMetrics = {
      timestamp,
      memory,
      cpu: {
        usage: cpuUsage,
        loadAverage,
        utilizationPercent
      },
      eventLoop,
      gc: { ...this.gcStats },
      resources,
      performance: performanceMetrics
    };

    // Store metrics
    this.metrics.push(metrics);

    // Limit stored metrics to prevent memory growth
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    this.emit('metrics_collected', metrics);
    return metrics;
  }

  /**
   * Track request performance
   */
  trackRequest(requestId: string): {
    start: () => void;
    end: () => number;
  } {
    return {
      start: () => {
        this.requests.set(requestId, { startTime: performance.now() });
      },
      end: () => {
        const request = this.requests.get(requestId);
        if (request) {
          request.endTime = performance.now();
          const duration = request.endTime - request.startTime;
          this.requests.delete(requestId);
          return duration;
        }
        return 0;
      }
    };
  }

  /**
   * Get performance statistics for a time period
   */
  getPerformanceStats(periodMinutes: number = 60): {
    averageMemory: number;
    peakMemory: number;
    averageCpu: number;
    peakCpu: number;
    averageEventLoopLag: number;
    peakEventLoopLag: number;
    gcFrequency: number;
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
  } {
    const cutoff = new Date(Date.now() - periodMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        averageMemory: 0,
        peakMemory: 0,
        averageCpu: 0,
        peakCpu: 0,
        averageEventLoopLag: 0,
        peakEventLoopLag: 0,
        gcFrequency: 0,
        responseTime: { p50: 0, p95: 0, p99: 0 }
      };
    }

    // Memory stats
    const memoryValues = recentMetrics.map(m => m.memory.heapUsed / (1024 * 1024));
    const averageMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const peakMemory = Math.max(...memoryValues);

    // CPU stats
    const cpuValues = recentMetrics.map(m => m.cpu.utilizationPercent);
    const averageCpu = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
    const peakCpu = Math.max(...cpuValues);

    // Event loop stats
    const eventLoopValues = recentMetrics.map(m => m.eventLoop.lag);
    const averageEventLoopLag = eventLoopValues.reduce((a, b) => a + b, 0) / eventLoopValues.length;
    const peakEventLoopLag = Math.max(...eventLoopValues);

    // GC frequency
    const gcCollections = recentMetrics.reduce((sum, m) => sum + m.gc.collections.length, 0);
    const gcFrequency = gcCollections / (periodMinutes / 60); // Per hour

    // Response time percentiles (mock data for now)
    const responseTime = {
      p50: 100,
      p95: 250,
      p99: 500
    };

    return {
      averageMemory,
      peakMemory,
      averageCpu,
      peakCpu,
      averageEventLoopLag,
      peakEventLoopLag,
      gcFrequency,
      responseTime
    };
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: {
      memory: 'healthy' | 'warning' | 'critical';
      cpu: 'healthy' | 'warning' | 'critical';
      eventLoop: 'healthy' | 'warning' | 'critical';
      resources: 'healthy' | 'warning' | 'critical';
    };
    recommendations: string[];
  } {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) {
      return {
        overall: 'critical',
        components: {
          memory: 'critical',
          cpu: 'critical',
          eventLoop: 'critical',
          resources: 'critical'
        },
        recommendations: ['No metrics available - start performance tracking']
      };
    }

    // Check each component
    const memory = this.checkMemoryHealth(currentMetrics);
    const cpu = this.checkCpuHealth(currentMetrics);
    const eventLoop = this.checkEventLoopHealth(currentMetrics);
    const resources = this.checkResourceHealth(currentMetrics);

    // Determine overall health
    const components = { memory, cpu, eventLoop, resources };
    const healthScores = Object.values(components).map(status => 
      status === 'healthy' ? 2 : status === 'warning' ? 1 : 0
    );
    const averageScore = healthScores.reduce((a: number, b: number) => a + b, 0) / healthScores.length;

    let overall: 'healthy' | 'warning' | 'critical';
    if (averageScore >= 1.5) overall = 'healthy';
    else if (averageScore >= 0.5) overall = 'warning';
    else overall = 'critical';

    // Generate recommendations
    const recommendations = this.generateHealthRecommendations(components, currentMetrics);

    return {
      overall,
      components,
      recommendations
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): {
    summary: {
      trackingDuration: number;
      totalMetrics: number;
      healthStatus: string;
      alerts: number;
    };
    trends: {
      memoryTrend: 'increasing' | 'stable' | 'decreasing';
      cpuTrend: 'increasing' | 'stable' | 'decreasing';
      performanceTrend: 'improving' | 'stable' | 'degrading';
    };
    recommendations: string[];
    alerts: PerformanceAlert[];
  } {
    const stats = this.getPerformanceStats(60);
    const healthStatus = this.getHealthStatus();
    
    const trackingDuration = this.metrics.length > 0 
      ? (Date.now() - this.metrics[0].timestamp.getTime()) / (1000 * 60 * 60) // hours
      : 0;

    // Analyze trends
    const trends = this.analyzeTrends();

    // Get recent alerts
    const alerts = this.getRecentAlerts(60);

    const recommendations = [
      ...healthStatus.recommendations,
      ...this.generatePerformanceRecommendations(stats, trends)
    ];

    return {
      summary: {
        trackingDuration,
        totalMetrics: this.metrics.length,
        healthStatus: healthStatus.overall,
        alerts: alerts.length
      },
      trends,
      recommendations,
      alerts
    };
  }

  /**
   * Setup garbage collection monitoring
   */
  private setupGCMonitoring(): void {
    try {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'gc') {
            this.gcStats.totalCollections++;
            this.gcStats.totalDuration += entry.duration;
            this.gcStats.collections.push({
              type: entry.name || 'unknown',
              duration: entry.duration,
              timestamp: new Date()
            });

            // Keep only last 100 GC events
            if (this.gcStats.collections.length > 100) {
              this.gcStats.collections.shift();
            }
          }
        }
      });

      this.gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      // GC observer not available
    }
  }

  /**
   * Setup event loop lag monitoring
   */
  private setupEventLoopMonitoring(): void {
    setInterval(() => {
      const start = performance.now();
      setImmediate(() => {
        this.eventLoopLag = performance.now() - start;
      });
    }, 1000);
  }

  /**
   * Check performance thresholds and emit alerts
   */
  private checkThresholds(): void {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;

    const alerts: PerformanceAlert[] = [];

    // Memory threshold check
    const memoryMB = currentMetrics.memory.heapUsed / (1024 * 1024);
    if (memoryMB >= this.thresholds.memory.critical) {
      alerts.push({
        type: 'memory',
        severity: 'critical',
        message: `Critical memory usage: ${memoryMB.toFixed(1)}MB`,
        metric: 'heap_used',
        value: memoryMB,
        threshold: this.thresholds.memory.critical,
        timestamp: new Date(),
        recommendations: [
          'Immediate memory cleanup required',
          'Consider application restart',
          'Review memory-intensive operations'
        ]
      });
    } else if (memoryMB >= this.thresholds.memory.warning) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${memoryMB.toFixed(1)}MB`,
        metric: 'heap_used',
        value: memoryMB,
        threshold: this.thresholds.memory.warning,
        timestamp: new Date(),
        recommendations: [
          'Monitor memory usage closely',
          'Consider running cleanup',
          'Review recent operations'
        ]
      });
    }

    // CPU threshold check
    if (currentMetrics.cpu.utilizationPercent >= this.thresholds.cpu.critical) {
      alerts.push({
        type: 'cpu',
        severity: 'critical',
        message: `Critical CPU usage: ${currentMetrics.cpu.utilizationPercent.toFixed(1)}%`,
        metric: 'cpu_utilization',
        value: currentMetrics.cpu.utilizationPercent,
        threshold: this.thresholds.cpu.critical,
        timestamp: new Date(),
        recommendations: [
          'High CPU load detected',
          'Review CPU-intensive operations',
          'Consider scaling resources'
        ]
      });
    }

    // Event loop threshold check
    if (currentMetrics.eventLoop.lag >= this.thresholds.eventLoop.critical) {
      alerts.push({
        type: 'eventloop',
        severity: 'critical',
        message: `Critical event loop lag: ${currentMetrics.eventLoop.lag.toFixed(1)}ms`,
        metric: 'event_loop_lag',
        value: currentMetrics.eventLoop.lag,
        threshold: this.thresholds.eventLoop.critical,
        timestamp: new Date(),
        recommendations: [
          'Event loop blocking detected',
          'Review synchronous operations',
          'Consider breaking up long-running tasks'
        ]
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      this.emit('performance_alert', alert);
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): PerformanceMetrics['performance'] {
    // This would be enhanced with actual request tracking
    return {
      responseTime: 150, // Mock data
      throughput: 100,   // Mock data
      errorRate: 0.01    // Mock data
    };
  }

  /**
   * Get file descriptor count
   */
  private getFileDescriptorCount(): number {
    try {
      const fs = require('fs');
      return fs.readdirSync('/proc/self/fd').length;
    } catch {
      return 0; // Not available on this system
    }
  }

  /**
   * Check memory health status
   */
  private checkMemoryHealth(metrics: PerformanceMetrics): 'healthy' | 'warning' | 'critical' {
    const memoryMB = metrics.memory.heapUsed / (1024 * 1024);
    
    if (memoryMB >= this.thresholds.memory.critical) return 'critical';
    if (memoryMB >= this.thresholds.memory.warning) return 'warning';
    return 'healthy';
  }

  /**
   * Check CPU health status
   */
  private checkCpuHealth(metrics: PerformanceMetrics): 'healthy' | 'warning' | 'critical' {
    if (metrics.cpu.utilizationPercent >= this.thresholds.cpu.critical) return 'critical';
    if (metrics.cpu.utilizationPercent >= this.thresholds.cpu.warning) return 'warning';
    return 'healthy';
  }

  /**
   * Check event loop health status
   */
  private checkEventLoopHealth(metrics: PerformanceMetrics): 'healthy' | 'warning' | 'critical' {
    if (metrics.eventLoop.lag >= this.thresholds.eventLoop.critical) return 'critical';
    if (metrics.eventLoop.lag >= this.thresholds.eventLoop.warning) return 'warning';
    return 'healthy';
  }

  /**
   * Check resource health status
   */
  private checkResourceHealth(metrics: PerformanceMetrics): 'healthy' | 'warning' | 'critical' {
    const totalHandles = metrics.resources.activeHandles + metrics.resources.activeRequests;
    
    if (totalHandles > 1000) return 'critical';
    if (totalHandles > 500) return 'warning';
    return 'healthy';
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(
    components: { [key: string]: string },
    metrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (components.memory !== 'healthy') {
      recommendations.push('Memory usage is elevated - consider cleanup or optimization');
    }

    if (components.cpu !== 'healthy') {
      recommendations.push('CPU usage is high - review CPU-intensive operations');
    }

    if (components.eventLoop !== 'healthy') {
      recommendations.push('Event loop lag detected - review blocking operations');
    }

    if (components.resources !== 'healthy') {
      recommendations.push('High resource usage - check for resource leaks');
    }

    if (metrics.gc.collections.length > 10) {
      recommendations.push('Frequent garbage collection - review memory allocation patterns');
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): {
    memoryTrend: 'increasing' | 'stable' | 'decreasing';
    cpuTrend: 'increasing' | 'stable' | 'decreasing';
    performanceTrend: 'improving' | 'stable' | 'degrading';
  } {
    if (this.metrics.length < 10) {
      return {
        memoryTrend: 'stable',
        cpuTrend: 'stable',
        performanceTrend: 'stable'
      };
    }

    const recent = this.metrics.slice(-10);
    
    // Memory trend
    const memoryValues = recent.map(m => m.memory.heapUsed);
    const memoryTrend = this.calculateTrend(memoryValues);

    // CPU trend
    const cpuValues = recent.map(m => m.cpu.utilizationPercent);
    const cpuTrend = this.calculateTrend(cpuValues);

    // Performance trend (inverse of event loop lag)
    const performanceValues = recent.map(m => -m.eventLoop.lag);
    const performanceTrend = this.calculateTrend(performanceValues);

    return {
      memoryTrend: memoryTrend > 0.1 ? 'increasing' : memoryTrend < -0.1 ? 'decreasing' : 'stable',
      cpuTrend: cpuTrend > 0.1 ? 'increasing' : cpuTrend < -0.1 ? 'decreasing' : 'stable',
      performanceTrend: performanceTrend > 0.1 ? 'improving' : performanceTrend < -0.1 ? 'degrading' : 'stable'
    };
  }

  /**
   * Calculate trend slope for array of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Get recent alerts
   */
  private getRecentAlerts(minutes: number): PerformanceAlert[] {
    // This would be enhanced with actual alert storage
    return [];
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(
    stats: any,
    trends: any
  ): string[] {
    const recommendations: string[] = [];

    if (trends.memoryTrend === 'increasing') {
      recommendations.push('Memory usage is trending upward - investigate potential leaks');
    }

    if (trends.cpuTrend === 'increasing') {
      recommendations.push('CPU usage is increasing - review recent changes');
    }

    if (trends.performanceTrend === 'degrading') {
      recommendations.push('Performance is degrading - analyze bottlenecks');
    }

    if (stats.gcFrequency > 10) {
      recommendations.push('High GC frequency - optimize memory allocation');
    }

    return recommendations;
  }
}

// Export factory function with default thresholds
export function createPerformanceTracker(thresholds?: Partial<PerformanceThresholds>): PerformanceTracker {
  const defaultThresholds: PerformanceThresholds = {
    memory: {
      warning: 512, // 512MB
      critical: 1024 // 1GB
    },
    cpu: {
      warning: 70, // 70%
      critical: 90 // 90%
    },
    eventLoop: {
      warning: 10, // 10ms
      critical: 50 // 50ms
    },
    responseTime: {
      warning: 500, // 500ms
      critical: 1000 // 1000ms
    }
  };

  return PerformanceTracker.getInstance({ ...defaultThresholds, ...thresholds });
}

// Export singleton instance
export const performanceTracker = createPerformanceTracker();