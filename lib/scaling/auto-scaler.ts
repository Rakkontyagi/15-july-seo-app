/**
 * Auto-Scaling System
 * Intelligent traffic spike handling with automatic resource scaling
 */

import { EventEmitter } from 'events';
import { performanceTracker } from '../monitoring/performance-tracker';
import { memoryMonitor } from '../monitoring/memory-monitor';

export interface ScalingMetrics {
  timestamp: Date;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  activeConnections: number;
  queueLength: number;
  eventLoopLag: number;
}

export interface ScalingRule {
  name: string;
  metric: keyof ScalingMetrics;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  duration: number; // ms - how long condition must persist
  action: 'scale_up' | 'scale_down' | 'alert' | 'circuit_break';
  priority: number; // 1-10, higher = more important
  cooldown: number; // ms - minimum time between actions
  enabled: boolean;
}

export interface ScalingAction {
  id: string;
  rule: string;
  action: ScalingRule['action'];
  timestamp: Date;
  reason: string;
  metrics: ScalingMetrics;
  success: boolean;
  details?: any;
}

export interface LoadBalancerConfig {
  strategy: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash';
  healthCheckInterval: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  instances: Array<{
    id: string;
    url: string;
    weight: number;
    healthy: boolean;
    connections: number;
    lastHealthCheck?: Date;
  }>;
}

export interface AutoScalerConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  metricsWindow: number; // ms
  rules: ScalingRule[];
  loadBalancer: LoadBalancerConfig;
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenRequestLimit: number;
  };
}

export class AutoScaler extends EventEmitter {
  private static instance: AutoScaler;
  private config: AutoScalerConfig;
  private metrics: ScalingMetrics[] = [];
  private actions: ScalingAction[] = [];
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];
  private lastActionTime: Map<string, number> = new Map();
  private circuitBreakerState: 'closed' | 'open' | 'half_open' = 'closed';
  private circuitBreakerFailures = 0;
  private circuitBreakerLastFailure = 0;
  private currentInstances = 1;

  private constructor(config: AutoScalerConfig) {
    super();
    this.config = config;
    this.currentInstances = config.minInstances;
  }

  public static getInstance(config?: AutoScalerConfig): AutoScaler {
    if (!AutoScaler.instance && config) {
      AutoScaler.instance = new AutoScaler(config);
    }
    return AutoScaler.instance;
  }

  /**
   * Start auto-scaling monitoring
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) return;

    this.isRunning = true;
    this.emit('scaler_started');

    // Collect metrics every 30 seconds
    const metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Evaluate scaling rules every minute
    const rulesInterval = setInterval(() => {
      this.evaluateRules();
    }, 60000);

    // Health check load balancer instances every 30 seconds
    const healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.loadBalancer.healthCheckInterval);

    // Update circuit breaker state every 10 seconds
    const circuitBreakerInterval = setInterval(() => {
      this.updateCircuitBreakerState();
    }, 10000);

    this.intervals.push(metricsInterval, rulesInterval, healthCheckInterval, circuitBreakerInterval);

    // Initial metrics collection
    this.collectMetrics();
  }

  /**
   * Stop auto-scaling monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    this.emit('scaler_stopped');
  }

  /**
   * Add scaling rule
   */
  addRule(rule: ScalingRule): void {
    this.config.rules.push(rule);
    this.emit('rule_added', rule);
  }

  /**
   * Remove scaling rule
   */
  removeRule(name: string): void {
    const index = this.config.rules.findIndex(rule => rule.name === name);
    if (index >= 0) {
      const removed = this.config.rules.splice(index, 1)[0];
      this.emit('rule_removed', removed);
    }
  }

  /**
   * Scale up instances
   */
  async scaleUp(reason: string): Promise<boolean> {
    if (this.currentInstances >= this.config.maxInstances) {
      this.emit('scale_up_blocked', { 
        reason: 'Max instances reached', 
        current: this.currentInstances 
      });
      return false;
    }

    // Check cooldown
    const lastScaleUp = this.lastActionTime.get('scale_up') || 0;
    if (Date.now() - lastScaleUp < this.config.scaleUpCooldown) {
      this.emit('scale_up_blocked', { 
        reason: 'Cooldown period active',
        remainingCooldown: this.config.scaleUpCooldown - (Date.now() - lastScaleUp)
      });
      return false;
    }

    try {
      // Add new instance
      const newInstance = await this.createNewInstance();
      this.config.loadBalancer.instances.push(newInstance);
      this.currentInstances++;

      this.lastActionTime.set('scale_up', Date.now());

      const action: ScalingAction = {
        id: `scale_up_${Date.now()}`,
        rule: 'manual',
        action: 'scale_up',
        timestamp: new Date(),
        reason,
        metrics: this.getCurrentMetrics(),
        success: true,
        details: { 
          newInstance: newInstance.id,
          totalInstances: this.currentInstances 
        }
      };

      this.actions.push(action);
      this.emit('scaled_up', action);

      return true;
    } catch (error) {
      const action: ScalingAction = {
        id: `scale_up_failed_${Date.now()}`,
        rule: 'manual',
        action: 'scale_up',
        timestamp: new Date(),
        reason,
        metrics: this.getCurrentMetrics(),
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      this.actions.push(action);
      this.emit('scale_up_failed', action);

      return false;
    }
  }

  /**
   * Scale down instances
   */
  async scaleDown(reason: string): Promise<boolean> {
    if (this.currentInstances <= this.config.minInstances) {
      this.emit('scale_down_blocked', { 
        reason: 'Min instances reached', 
        current: this.currentInstances 
      });
      return false;
    }

    // Check cooldown
    const lastScaleDown = this.lastActionTime.get('scale_down') || 0;
    if (Date.now() - lastScaleDown < this.config.scaleDownCooldown) {
      this.emit('scale_down_blocked', { 
        reason: 'Cooldown period active',
        remainingCooldown: this.config.scaleDownCooldown - (Date.now() - lastScaleDown)
      });
      return false;
    }

    try {
      // Remove least utilized instance
      const instanceToRemove = this.findLeastUtilizedInstance();
      if (!instanceToRemove) {
        throw new Error('No instance available for removal');
      }

      await this.terminateInstance(instanceToRemove.id);
      
      const index = this.config.loadBalancer.instances.findIndex(
        inst => inst.id === instanceToRemove.id
      );
      if (index >= 0) {
        this.config.loadBalancer.instances.splice(index, 1);
      }
      
      this.currentInstances--;
      this.lastActionTime.set('scale_down', Date.now());

      const action: ScalingAction = {
        id: `scale_down_${Date.now()}`,
        rule: 'manual',
        action: 'scale_down',
        timestamp: new Date(),
        reason,
        metrics: this.getCurrentMetrics(),
        success: true,
        details: { 
          removedInstance: instanceToRemove.id,
          totalInstances: this.currentInstances 
        }
      };

      this.actions.push(action);
      this.emit('scaled_down', action);

      return true;
    } catch (error) {
      const action: ScalingAction = {
        id: `scale_down_failed_${Date.now()}`,
        rule: 'manual',
        action: 'scale_down',
        timestamp: new Date(),
        reason,
        metrics: this.getCurrentMetrics(),
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      this.actions.push(action);
      this.emit('scale_down_failed', action);

      return false;
    }
  }

  /**
   * Get next instance for load balancing
   */
  getNextInstance(): { id: string; url: string } | null {
    const healthyInstances = this.config.loadBalancer.instances.filter(
      inst => inst.healthy
    );

    if (healthyInstances.length === 0) {
      return null;
    }

    // Circuit breaker check
    if (this.circuitBreakerState === 'open') {
      this.emit('request_blocked', { reason: 'Circuit breaker open' });
      return null;
    }

    switch (this.config.loadBalancer.strategy) {
      case 'round_robin':
        return this.roundRobinSelection(healthyInstances);
      case 'least_connections':
        return this.leastConnectionsSelection(healthyInstances);
      case 'weighted':
        return this.weightedSelection(healthyInstances);
      case 'ip_hash':
        return this.ipHashSelection(healthyInstances);
      default:
        return healthyInstances[0];
    }
  }

  /**
   * Record request completion for metrics
   */
  recordRequest(instanceId: string, responseTime: number, success: boolean): void {
    const instance = this.config.loadBalancer.instances.find(
      inst => inst.id === instanceId
    );
    
    if (instance) {
      instance.connections = Math.max(0, instance.connections - 1);
    }

    // Update circuit breaker
    if (!success) {
      this.circuitBreakerFailures++;
      this.circuitBreakerLastFailure = Date.now();
    } else if (this.circuitBreakerState === 'half_open') {
      // Successful request in half-open state
      this.circuitBreakerState = 'closed';
      this.circuitBreakerFailures = 0;
      this.emit('circuit_breaker_closed');
    }

    this.emit('request_completed', {
      instanceId,
      responseTime,
      success,
      circuitBreakerState: this.circuitBreakerState
    });
  }

  /**
   * Get current scaling status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    instances: number;
    healthyInstances: number;
    circuitBreakerState: string;
    recentActions: ScalingAction[];
    currentMetrics: ScalingMetrics;
    recommendations: string[];
  } {
    const healthyInstances = this.config.loadBalancer.instances.filter(
      inst => inst.healthy
    ).length;

    const recentActions = this.actions
      .filter(action => Date.now() - action.timestamp.getTime() < 60 * 60 * 1000) // Last hour
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const recommendations = this.generateRecommendations();

    return {
      enabled: this.config.enabled,
      running: this.isRunning,
      instances: this.currentInstances,
      healthyInstances,
      circuitBreakerState: this.circuitBreakerState,
      recentActions,
      currentMetrics: this.getCurrentMetrics(),
      recommendations
    };
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    const currentMetrics = this.getCurrentMetrics();
    this.metrics.push(currentMetrics);

    // Limit stored metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    this.emit('metrics_collected', currentMetrics);
  }

  /**
   * Get current system metrics
   */
  private getCurrentMetrics(): ScalingMetrics {
    // Get metrics from monitoring systems
    const memoryStats = memoryMonitor.getCurrentStats();
    const performanceStats = performanceTracker.getPerformanceStats(5); // Last 5 minutes

    // Calculate derived metrics
    const activeConnections = this.config.loadBalancer.instances.reduce(
      (sum, inst) => sum + inst.connections, 0
    );

    return {
      timestamp: new Date(),
      requestsPerSecond: this.calculateRequestsPerSecond(),
      averageResponseTime: performanceStats.responseTime.p50,
      errorRate: this.calculateErrorRate(),
      cpuUtilization: performanceStats.averageCpu,
      memoryUtilization: (memoryStats.current.heapUsed / memoryStats.current.heapTotal) * 100,
      activeConnections,
      queueLength: this.getQueueLength(),
      eventLoopLag: performanceStats.averageEventLoopLag
    };
  }

  /**
   * Evaluate scaling rules
   */
  private async evaluateRules(): Promise<void> {
    const currentMetrics = this.getCurrentMetrics();
    
    // Sort rules by priority (highest first)
    const sortedRules = this.config.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      // Check cooldown
      const lastAction = this.lastActionTime.get(rule.action) || 0;
      const cooldownRemaining = rule.cooldown - (Date.now() - lastAction);
      
      if (cooldownRemaining > 0) {
        continue;
      }

      // Evaluate condition
      const metricValue = currentMetrics[rule.metric];
      const numericValue = typeof metricValue === 'number' ? metricValue : 0;
      const conditionMet = this.evaluateCondition(numericValue, rule.operator, rule.threshold);

      if (conditionMet) {
        // Check if condition has persisted for required duration
        const persistentCondition = this.checkConditionPersistence(rule, rule.duration);
        
        if (persistentCondition) {
          await this.executeAction(rule, currentMetrics);
        }
      }
    }
  }

  /**
   * Execute scaling action
   */
  private async executeAction(rule: ScalingRule, metrics: ScalingMetrics): Promise<void> {
    const reason = `Rule: ${rule.name} - ${rule.metric} ${rule.operator} ${rule.threshold}`;

    try {
      let success = false;

      switch (rule.action) {
        case 'scale_up':
          success = await this.scaleUp(reason);
          break;
        case 'scale_down':
          success = await this.scaleDown(reason);
          break;
        case 'circuit_break':
          this.openCircuitBreaker(reason);
          success = true;
          break;
        case 'alert':
          this.sendAlert(rule, metrics);
          success = true;
          break;
      }

      const action: ScalingAction = {
        id: `${rule.action}_${Date.now()}`,
        rule: rule.name,
        action: rule.action,
        timestamp: new Date(),
        reason,
        metrics,
        success,
        details: { rule }
      };

      this.actions.push(action);
      this.emit('action_executed', action);

    } catch (error) {
      this.emit('action_failed', {
        rule: rule.name,
        action: rule.action,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics
      });
    }
  }

  /**
   * Perform health checks on instances
   */
  private async performHealthChecks(): Promise<void> {
    const promises = this.config.loadBalancer.instances.map(async (instance) => {
      try {
        const isHealthy = await this.checkInstanceHealth(instance);
        
        if (instance.healthy !== isHealthy) {
          instance.healthy = isHealthy;
          instance.lastHealthCheck = new Date();
          
          this.emit('instance_health_changed', {
            instanceId: instance.id,
            healthy: isHealthy,
            url: instance.url
          });
        }
      } catch (error) {
        instance.healthy = false;
        instance.lastHealthCheck = new Date();
        
        this.emit('health_check_failed', {
          instanceId: instance.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreakerState(): void {
    if (!this.config.circuitBreaker.enabled) return;

    const now = Date.now();
    const timeSinceLastFailure = now - this.circuitBreakerLastFailure;

    switch (this.circuitBreakerState) {
      case 'closed':
        if (this.circuitBreakerFailures >= this.config.circuitBreaker.failureThreshold) {
          this.circuitBreakerState = 'open';
          this.emit('circuit_breaker_opened', {
            failures: this.circuitBreakerFailures,
            threshold: this.config.circuitBreaker.failureThreshold
          });
        }
        break;

      case 'open':
        if (timeSinceLastFailure >= this.config.circuitBreaker.recoveryTimeout) {
          this.circuitBreakerState = 'half_open';
          this.emit('circuit_breaker_half_open');
        }
        break;

      case 'half_open':
        // State is managed in recordRequest method
        break;
    }
  }

  /**
   * Load balancing strategies
   */
  private roundRobinSelection(instances: any[]): any {
    // Simple round-robin implementation
    const index = Date.now() % instances.length;
    instances[index].connections++;
    return instances[index];
  }

  private leastConnectionsSelection(instances: any[]): any {
    const leastConnected = instances.reduce((min, current) => 
      current.connections < min.connections ? current : min
    );
    leastConnected.connections++;
    return leastConnected;
  }

  private weightedSelection(instances: any[]): any {
    const totalWeight = instances.reduce((sum, inst) => sum + inst.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        instance.connections++;
        return instance;
      }
    }
    
    // Fallback to first instance
    instances[0].connections++;
    return instances[0];
  }

  private ipHashSelection(instances: any[]): any {
    // For simplicity, use timestamp-based selection
    // In real implementation, would use actual client IP
    const hash = Date.now();
    const index = hash % instances.length;
    instances[index].connections++;
    return instances[index];
  }

  /**
   * Helper methods
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private checkConditionPersistence(rule: ScalingRule, duration: number): boolean {
    const cutoff = Date.now() - duration;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() >= cutoff);
    
    return recentMetrics.every(metrics => {
      const metricValue = metrics[rule.metric];
      const numericValue = typeof metricValue === 'number' ? metricValue : 0;
      return this.evaluateCondition(numericValue, rule.operator, rule.threshold);
    });
  }

  private calculateRequestsPerSecond(): number {
    // Mock implementation - would be calculated from actual request metrics
    return Math.random() * 100;
  }

  private calculateErrorRate(): number {
    // Mock implementation - would be calculated from actual error metrics
    return Math.random() * 0.05; // 0-5% error rate
  }

  private getQueueLength(): number {
    // Mock implementation - would get actual queue length
    return Math.floor(Math.random() * 10);
  }

  private async createNewInstance(): Promise<any> {
    // Mock implementation - would create actual instance
    const id = `instance_${Date.now()}`;
    const port = 3000 + this.currentInstances;
    
    return {
      id,
      url: `http://localhost:${port}`,
      weight: 1,
      healthy: true,
      connections: 0,
      lastHealthCheck: new Date()
    };
  }

  private async terminateInstance(instanceId: string): Promise<void> {
    // Mock implementation - would terminate actual instance
    this.emit('instance_terminated', { instanceId });
  }

  private findLeastUtilizedInstance(): any {
    return this.config.loadBalancer.instances
      .filter(inst => inst.healthy)
      .reduce((min, current) => 
        current.connections < min.connections ? current : min
      );
  }

  private async checkInstanceHealth(instance: any): Promise<boolean> {
    // Mock implementation - would perform actual health check
    return Math.random() > 0.1; // 90% chance of being healthy
  }

  private openCircuitBreaker(reason: string): void {
    this.circuitBreakerState = 'open';
    this.emit('circuit_breaker_opened', { reason });
  }

  private sendAlert(rule: ScalingRule, metrics: ScalingMetrics): void {
    this.emit('scaling_alert', {
      rule: rule.name,
      message: `Scaling alert triggered: ${rule.name}`,
      metrics,
      severity: rule.priority > 7 ? 'critical' : rule.priority > 4 ? 'warning' : 'info'
    });
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const currentMetrics = this.getCurrentMetrics();
    const healthyInstances = this.config.loadBalancer.instances.filter(inst => inst.healthy).length;

    if (healthyInstances < this.config.minInstances) {
      recommendations.push('Some instances are unhealthy - consider scaling up');
    }

    if (currentMetrics.cpuUtilization > 80) {
      recommendations.push('High CPU utilization detected - consider scaling up');
    }

    if (currentMetrics.memoryUtilization > 85) {
      recommendations.push('High memory utilization detected - monitor for memory leaks');
    }

    if (currentMetrics.averageResponseTime > 1000) {
      recommendations.push('High response times detected - investigate performance bottlenecks');
    }

    if (this.circuitBreakerState === 'open') {
      recommendations.push('Circuit breaker is open - investigate system issues');
    }

    if (currentMetrics.errorRate > 0.05) {
      recommendations.push('High error rate detected - investigate application issues');
    }

    return recommendations;
  }
}

// Export factory function and default configurations
export function createAutoScaler(config?: Partial<AutoScalerConfig>): AutoScaler {
  const defaultConfig: AutoScalerConfig = {
    enabled: true,
    minInstances: 1,
    maxInstances: 10,
    scaleUpCooldown: 5 * 60 * 1000, // 5 minutes
    scaleDownCooldown: 10 * 60 * 1000, // 10 minutes
    metricsWindow: 5 * 60 * 1000, // 5 minutes
    rules: [
      {
        name: 'high_cpu_scale_up',
        metric: 'cpuUtilization',
        operator: 'gt',
        threshold: 70,
        duration: 2 * 60 * 1000, // 2 minutes
        action: 'scale_up',
        priority: 8,
        cooldown: 5 * 60 * 1000,
        enabled: true
      },
      {
        name: 'high_memory_scale_up',
        metric: 'memoryUtilization',
        operator: 'gt',
        threshold: 80,
        duration: 3 * 60 * 1000, // 3 minutes
        action: 'scale_up',
        priority: 7,
        cooldown: 5 * 60 * 1000,
        enabled: true
      },
      {
        name: 'high_response_time_scale_up',
        metric: 'averageResponseTime',
        operator: 'gt',
        threshold: 1000,
        duration: 2 * 60 * 1000,
        action: 'scale_up',
        priority: 6,
        cooldown: 5 * 60 * 1000,
        enabled: true
      },
      {
        name: 'low_cpu_scale_down',
        metric: 'cpuUtilization',
        operator: 'lt',
        threshold: 20,
        duration: 10 * 60 * 1000, // 10 minutes
        action: 'scale_down',
        priority: 3,
        cooldown: 10 * 60 * 1000,
        enabled: true
      },
      {
        name: 'high_error_rate_circuit_break',
        metric: 'errorRate',
        operator: 'gt',
        threshold: 0.1, // 10% error rate
        duration: 1 * 60 * 1000, // 1 minute
        action: 'circuit_break',
        priority: 10,
        cooldown: 2 * 60 * 1000,
        enabled: true
      }
    ],
    loadBalancer: {
      strategy: 'least_connections',
      healthCheckInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      instances: [
        {
          id: 'instance_1',
          url: 'http://localhost:3000',
          weight: 1,
          healthy: true,
          connections: 0
        }
      ]
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      halfOpenRequestLimit: 3
    }
  };

  return AutoScaler.getInstance({ ...defaultConfig, ...config });
}

// Export singleton instance
export const autoScaler = createAutoScaler();