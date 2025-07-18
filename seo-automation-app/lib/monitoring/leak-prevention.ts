/**
 * Memory Leak Prevention System
 * Proactive measures to prevent common memory leak patterns
 */

import { EventEmitter } from 'events';
import { memoryMonitor } from './memory-monitor';

export interface LeakPreventionRule {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  fix: () => Promise<void>;
  severity: 'low' | 'medium' | 'high';
  lastRun?: Date;
  violations: number;
}

export interface ResourceTracker {
  type: 'timer' | 'listener' | 'stream' | 'connection' | 'cache';
  id: string;
  createdAt: Date;
  source: string;
  metadata?: any;
}

export interface LeakPreventionReport {
  timestamp: Date;
  rulesChecked: number;
  violationsFound: number;
  actionsPerformed: string[];
  resourcesTracked: {
    timers: number;
    listeners: number;
    streams: number;
    connections: number;
    caches: number;
  };
  recommendations: string[];
}

export class LeakPrevention extends EventEmitter {
  private static instance: LeakPrevention;
  private rules: Map<string, LeakPreventionRule> = new Map();
  private resources: Map<string, ResourceTracker> = new Map();
  private isActive = false;
  private checkInterval?: NodeJS.Timeout;
  private originalSetTimeout: typeof setTimeout;
  private originalSetInterval: typeof setInterval;
  private originalClearTimeout: typeof clearTimeout;
  private originalClearInterval: typeof clearInterval;

  private constructor() {
    super();
    this.setupDefaultRules();
    this.setupResourceTracking();
  }

  public static getInstance(): LeakPrevention {
    if (!LeakPrevention.instance) {
      LeakPrevention.instance = new LeakPrevention();
    }
    return LeakPrevention.instance;
  }

  /**
   * Start leak prevention monitoring
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.instrumentTimers();
    this.instrumentEventListeners();
    
    // Run checks every 5 minutes
    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, 5 * 60 * 1000);

    // Run initial check
    this.runAllChecks();

    this.emit('prevention_started');
  }

  /**
   * Stop leak prevention monitoring
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.restoreOriginalTimers();
    this.emit('prevention_stopped');
  }

  /**
   * Add custom leak prevention rule
   */
  addRule(rule: LeakPreventionRule): void {
    this.rules.set(rule.name, {
      ...rule,
      violations: 0
    });
  }

  /**
   * Remove leak prevention rule
   */
  removeRule(name: string): void {
    this.rules.delete(name);
  }

  /**
   * Run all leak prevention checks
   */
  async runAllChecks(): Promise<LeakPreventionReport> {
    const startTime = new Date();
    const actionsPerformed: string[] = [];
    let violationsFound = 0;

    for (const [name, rule] of this.rules) {
      try {
        const hasViolation = await rule.check();
        
        if (hasViolation) {
          violationsFound++;
          rule.violations++;
          
          this.emit('violation_detected', {
            rule: name,
            severity: rule.severity,
            description: rule.description
          });

          // Auto-fix if possible
          try {
            await rule.fix();
            actionsPerformed.push(`Fixed: ${name}`);
            
            this.emit('violation_fixed', {
              rule: name,
              description: rule.description
            });
          } catch (fixError) {
            actionsPerformed.push(`Failed to fix: ${name} - ${fixError.message}`);
          }
        }
        
        rule.lastRun = new Date();
      } catch (error) {
        this.emit('rule_error', {
          rule: name,
          error: error.message
        });
      }
    }

    const resourcesTracked = this.getResourceCounts();
    const recommendations = this.generateRecommendations(violationsFound, resourcesTracked);

    const report: LeakPreventionReport = {
      timestamp: startTime,
      rulesChecked: this.rules.size,
      violationsFound,
      actionsPerformed,
      resourcesTracked,
      recommendations
    };

    this.emit('check_completed', report);
    return report;
  }

  /**
   * Track a resource for leak detection
   */
  trackResource(resource: ResourceTracker): void {
    this.resources.set(resource.id, resource);
  }

  /**
   * Untrack a resource
   */
  untrackResource(id: string): void {
    this.resources.delete(id);
  }

  /**
   * Get all tracked resources by type
   */
  getTrackedResources(type?: ResourceTracker['type']): ResourceTracker[] {
    const resources = Array.from(this.resources.values());
    return type ? resources.filter(r => r.type === type) : resources;
  }

  /**
   * Force cleanup of all tracked resources
   */
  async forceCleanup(): Promise<{
    cleaned: number;
    failed: number;
    actions: string[];
  }> {
    let cleaned = 0;
    let failed = 0;
    const actions: string[] = [];

    // Clear timers
    const timers = this.getTrackedResources('timer');
    for (const timer of timers) {
      try {
        clearTimeout(parseInt(timer.id));
        this.untrackResource(timer.id);
        cleaned++;
        actions.push(`Cleared timer: ${timer.id}`);
      } catch (error) {
        failed++;
      }
    }

    // Remove event listeners
    const listeners = this.getTrackedResources('listener');
    for (const listener of listeners) {
      try {
        if (listener.metadata?.target && listener.metadata?.event && listener.metadata?.handler) {
          listener.metadata.target.removeEventListener(
            listener.metadata.event, 
            listener.metadata.handler
          );
          this.untrackResource(listener.id);
          cleaned++;
          actions.push(`Removed listener: ${listener.metadata.event}`);
        }
      } catch (error) {
        failed++;
      }
    }

    // Close streams
    const streams = this.getTrackedResources('stream');
    for (const stream of streams) {
      try {
        if (stream.metadata?.stream && typeof stream.metadata.stream.destroy === 'function') {
          stream.metadata.stream.destroy();
          this.untrackResource(stream.id);
          cleaned++;
          actions.push(`Closed stream: ${stream.id}`);
        }
      } catch (error) {
        failed++;
      }
    }

    // Close connections
    const connections = this.getTrackedResources('connection');
    for (const connection of connections) {
      try {
        if (connection.metadata?.connection && typeof connection.metadata.connection.end === 'function') {
          connection.metadata.connection.end();
          this.untrackResource(connection.id);
          cleaned++;
          actions.push(`Closed connection: ${connection.id}`);
        }
      } catch (error) {
        failed++;
      }
    }

    const result = { cleaned, failed, actions };
    this.emit('force_cleanup_completed', result);
    return result;
  }

  /**
   * Setup default leak prevention rules
   */
  private setupDefaultRules(): void {
    // Timer leak detection
    this.addRule({
      name: 'timer_leak_detection',
      description: 'Detect excessive number of active timers',
      severity: 'high',
      check: async () => {
        const timers = this.getTrackedResources('timer');
        return timers.length > 100; // More than 100 active timers
      },
      fix: async () => {
        const timers = this.getTrackedResources('timer');
        const oldTimers = timers.filter(t => 
          Date.now() - t.createdAt.getTime() > 30 * 60 * 1000 // Older than 30 minutes
        );
        
        for (const timer of oldTimers) {
          clearTimeout(parseInt(timer.id));
          this.untrackResource(timer.id);
        }
      }
    });

    // Event listener leak detection
    this.addRule({
      name: 'event_listener_leak_detection',
      description: 'Detect excessive number of event listeners',
      severity: 'medium',
      check: async () => {
        const listeners = this.getTrackedResources('listener');
        return listeners.length > 200; // More than 200 active listeners
      },
      fix: async () => {
        const listeners = this.getTrackedResources('listener');
        const duplicates = this.findDuplicateListeners(listeners);
        
        for (const duplicate of duplicates) {
          if (duplicate.metadata?.target && duplicate.metadata?.event && duplicate.metadata?.handler) {
            duplicate.metadata.target.removeEventListener(
              duplicate.metadata.event,
              duplicate.metadata.handler
            );
            this.untrackResource(duplicate.id);
          }
        }
      }
    });

    // Stream leak detection
    this.addRule({
      name: 'stream_leak_detection',
      description: 'Detect unclosed streams',
      severity: 'high',
      check: async () => {
        const streams = this.getTrackedResources('stream');
        const unclosedStreams = streams.filter(s => 
          s.metadata?.stream && !s.metadata.stream.destroyed && !s.metadata.stream.closed
        );
        return unclosedStreams.length > 10; // More than 10 unclosed streams
      },
      fix: async () => {
        const streams = this.getTrackedResources('stream');
        const oldStreams = streams.filter(s => 
          Date.now() - s.createdAt.getTime() > 10 * 60 * 1000 // Older than 10 minutes
        );
        
        for (const stream of oldStreams) {
          if (stream.metadata?.stream && typeof stream.metadata.stream.destroy === 'function') {
            stream.metadata.stream.destroy();
            this.untrackResource(stream.id);
          }
        }
      }
    });

    // Cache size monitoring
    this.addRule({
      name: 'cache_size_monitoring',
      description: 'Monitor cache sizes for excessive growth',
      severity: 'medium',
      check: async () => {
        const caches = this.getTrackedResources('cache');
        for (const cache of caches) {
          if (cache.metadata?.size && cache.metadata.size > cache.metadata.maxSize * 0.9) {
            return true; // Cache is 90% full
          }
        }
        return false;
      },
      fix: async () => {
        const caches = this.getTrackedResources('cache');
        for (const cache of caches) {
          if (cache.metadata?.cache && typeof cache.metadata.cache.cleanup === 'function') {
            await cache.metadata.cache.cleanup();
          }
        }
      }
    });

    // Global object pollution detection
    this.addRule({
      name: 'global_pollution_detection',
      description: 'Detect pollution of global object',
      severity: 'medium',
      check: async () => {
        const globalKeys = Object.keys(global).length;
        return globalKeys > 50; // Arbitrary threshold
      },
      fix: async () => {
        // Can't automatically fix global pollution, but can warn
        this.emit('warning', {
          message: 'Global object pollution detected',
          recommendation: 'Review code for global variable assignments'
        });
      }
    });
  }

  /**
   * Setup resource tracking by instrumenting APIs
   */
  private setupResourceTracking(): void {
    // Store original functions
    this.originalSetTimeout = global.setTimeout;
    this.originalSetInterval = global.setInterval;
    this.originalClearTimeout = global.clearTimeout;
    this.originalClearInterval = global.clearInterval;
  }

  /**
   * Instrument timer functions for tracking
   */
  private instrumentTimers(): void {
    const self = this;

    global.setTimeout = function(callback: Function, delay: number, ...args: any[]) {
      const id = self.originalSetTimeout.call(this, callback, delay, ...args);
      
      self.trackResource({
        type: 'timer',
        id: id.toString(),
        createdAt: new Date(),
        source: self.getCallStack(),
        metadata: { type: 'timeout', delay }
      });

      return id;
    };

    global.setInterval = function(callback: Function, delay: number, ...args: any[]) {
      const id = self.originalSetInterval.call(this, callback, delay, ...args);
      
      self.trackResource({
        type: 'timer',
        id: id.toString(),
        createdAt: new Date(),
        source: self.getCallStack(),
        metadata: { type: 'interval', delay }
      });

      return id;
    };

    global.clearTimeout = function(id: NodeJS.Timeout) {
      self.untrackResource(id.toString());
      return self.originalClearTimeout.call(this, id);
    };

    global.clearInterval = function(id: NodeJS.Timeout) {
      self.untrackResource(id.toString());
      return self.originalClearInterval.call(this, id);
    };
  }

  /**
   * Instrument event listeners for tracking
   */
  private instrumentEventListeners(): void {
    if (typeof EventTarget !== 'undefined') {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
      const self = this;

      EventTarget.prototype.addEventListener = function(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) {
        const id = `${Date.now()}_${Math.random()}`;
        
        self.trackResource({
          type: 'listener',
          id,
          createdAt: new Date(),
          source: self.getCallStack(),
          metadata: {
            target: this,
            event: type,
            handler: listener,
            options
          }
        });

        return originalAddEventListener.call(this, type, listener, options);
      };

      EventTarget.prototype.removeEventListener = function(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
      ) {
        // Find and untrack the listener
        const listeners = self.getTrackedResources('listener');
        const matchingListener = listeners.find(l => 
          l.metadata?.target === this &&
          l.metadata?.event === type &&
          l.metadata?.handler === listener
        );

        if (matchingListener) {
          self.untrackResource(matchingListener.id);
        }

        return originalRemoveEventListener.call(this, type, listener, options);
      };
    }
  }

  /**
   * Restore original timer functions
   */
  private restoreOriginalTimers(): void {
    global.setTimeout = this.originalSetTimeout;
    global.setInterval = this.originalSetInterval;
    global.clearTimeout = this.originalClearTimeout;
    global.clearInterval = this.originalClearInterval;
  }

  /**
   * Get call stack for tracking resource creation
   */
  private getCallStack(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    return lines.slice(2, 4).join('\n'); // Get relevant caller info
  }

  /**
   * Find duplicate event listeners
   */
  private findDuplicateListeners(listeners: ResourceTracker[]): ResourceTracker[] {
    const seen = new Map<string, ResourceTracker>();
    const duplicates: ResourceTracker[] = [];

    for (const listener of listeners) {
      if (listener.metadata?.target && listener.metadata?.event) {
        const key = `${listener.metadata.target.constructor.name}_${listener.metadata.event}`;
        
        if (seen.has(key)) {
          duplicates.push(listener);
        } else {
          seen.set(key, listener);
        }
      }
    }

    return duplicates;
  }

  /**
   * Get resource counts by type
   */
  private getResourceCounts(): LeakPreventionReport['resourcesTracked'] {
    const counts = {
      timers: 0,
      listeners: 0,
      streams: 0,
      connections: 0,
      caches: 0
    };

    for (const resource of this.resources.values()) {
      if (resource.type in counts) {
        counts[resource.type]++;
      }
    }

    return counts;
  }

  /**
   * Generate recommendations based on current state
   */
  private generateRecommendations(
    violations: number,
    resourceCounts: LeakPreventionReport['resourcesTracked']
  ): string[] {
    const recommendations: string[] = [];

    if (violations > 0) {
      recommendations.push(`${violations} leak prevention violations detected`);
    }

    if (resourceCounts.timers > 50) {
      recommendations.push('High number of active timers - review timer usage');
    }

    if (resourceCounts.listeners > 100) {
      recommendations.push('High number of event listeners - check for memory leaks');
    }

    if (resourceCounts.streams > 5) {
      recommendations.push('Multiple open streams detected - ensure proper cleanup');
    }

    if (resourceCounts.connections > 10) {
      recommendations.push('Multiple open connections - monitor connection pooling');
    }

    if (violations === 0 && Object.values(resourceCounts).every(count => count < 10)) {
      recommendations.push('Memory leak prevention is working effectively');
    }

    return recommendations;
  }
}

// Export singleton instance
export const leakPrevention = LeakPrevention.getInstance();