import os from 'os';

interface ScalingMetrics {
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  errorRate: number;
}

interface ScalingRule {
  metric: keyof ScalingMetrics;
  threshold: number;
  action: 'scale-up' | 'scale-down' | 'none';
}

export class AutoScaler {
  private minInstances = 1;
  private maxInstances = 10;
  private currentInstances = 1;
  private cpuThreshold = 70;
  private memoryThreshold = 80;
  private requestRateThreshold = 1000;
  private errorRateThreshold = 5;
  private scalingRules: ScalingRule[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cooldownPeriod = 300000; // 5 minutes in milliseconds
  private lastScaleAction = 0;

  constructor() {
    this.initializeScalingRules();
    this.startMonitoring();
  }

  private initializeScalingRules() {
    this.scalingRules = [
      { metric: 'cpuUsage', threshold: this.cpuThreshold, action: 'scale-up' },
      { metric: 'cpuUsage', threshold: this.cpuThreshold / 2, action: 'scale-down' },
      { metric: 'memoryUsage', threshold: this.memoryThreshold, action: 'scale-up' },
      { metric: 'memoryUsage', threshold: this.memoryThreshold / 2, action: 'scale-down' },
      { metric: 'requestRate', threshold: this.requestRateThreshold, action: 'scale-up' },
      { metric: 'errorRate', threshold: this.errorRateThreshold, action: 'scale-up' }
    ];
  }

  public startMonitoring(interval = 10000) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMetrics();
    }, interval);
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private checkMetrics() {
    try {
      const metrics = this.collectMetrics();
      this.evaluateScalingRules(metrics);
    } catch (error) {
      console.error('Error checking metrics:', error);
    }
  }

  private collectMetrics(): ScalingMetrics {
    // Cross-platform CPU usage calculation
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - (totalIdle / totalTick * 100);

    // Memory usage calculation
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // These would typically come from application metrics
    // For now, using placeholder values
    const requestRate = 0; // Would come from actual request metrics
    const errorRate = 0;   // Would come from actual error metrics

    return {
      cpuUsage,
      memoryUsage,
      requestRate,
      errorRate
    };
  }

  private evaluateScalingRules(metrics: ScalingMetrics) {
    // Check if we're in cooldown period
    const now = Date.now();
    if (now - this.lastScaleAction < this.cooldownPeriod) {
      return;
    }

    for (const rule of this.scalingRules) {
      const metricValue = metrics[rule.metric];

      if (rule.action === 'scale-up' && metricValue > rule.threshold) {
        this.scaleUp();
        this.lastScaleAction = now;
        break;
      } else if (rule.action === 'scale-down' && metricValue < rule.threshold) {
        this.scaleDown();
        this.lastScaleAction = now;
        break;
      }
    }
  }

  private scaleUp() {
    if (this.currentInstances >= this.maxInstances) {
      console.log(`Already at maximum instances (${this.maxInstances})`);
      return;
    }

    console.log('Scaling up...');
    this.currentInstances++;

    try {
      // Implementation would depend on deployment environment
      // For Docker: docker service scale app=N
      // For Kubernetes: kubectl scale deployment app --replicas=N
      // For AWS: aws autoscaling set-desired-capacity
      console.log(`Scaled up to ${this.currentInstances} instances`);
    } catch (error) {
      console.error('Error scaling up:', error);
      this.currentInstances--; // Revert the count if scaling failed
    }
  }

  private scaleDown() {
    if (this.currentInstances <= this.minInstances) {
      console.log(`Already at minimum instances (${this.minInstances})`);
      return;
    }

    console.log('Scaling down...');
    this.currentInstances--;

    try {
      // Implementation would depend on deployment environment
      // Similar to scaleUp but reducing instance count
      console.log(`Scaled down to ${this.currentInstances} instances`);
    } catch (error) {
      console.error('Error scaling down:', error);
      this.currentInstances++; // Revert the count if scaling failed
    }
  }
}