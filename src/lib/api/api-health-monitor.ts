
import { EventEmitter } from 'events';

export interface ApiHealthMetrics {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // in ms
  errorRate: number; // percentage
  lastChecked: Date;
  lastError?: string;
}

export class ApiHealthMonitor extends EventEmitter {
  private healthStatus: Map<string, ApiHealthMetrics> = new Map();
  private checkInterval: number;

  constructor(checkInterval: number = 5000) { // Check every 5 seconds
    super();
    this.checkInterval = checkInterval;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.emit('check'); // Emit a check event for external services to listen to
    }, this.checkInterval);
  }

  updateHealth(metrics: ApiHealthMetrics): void {
    this.healthStatus.set(metrics.provider, metrics);
    this.emit('healthUpdate', metrics);

    if (metrics.status === 'unhealthy') {
      this.emit('providerUnhealthy', metrics.provider);
    } else if (metrics.status === 'degraded') {
      this.emit('providerDegraded', metrics.provider);
    }
  }

  getHealth(provider: string): ApiHealthMetrics | undefined {
    return this.healthStatus.get(provider);
  }

  getAllHealth(): ApiHealthMetrics[] {
    return Array.from(this.healthStatus.values());
  }

  // Placeholder for automatic provider switching logic
  // This would typically be handled by the SERPAnalysisService or a higher-level orchestrator
  recommendProviderSwitch(): string | null {
    const healthyProviders = Array.from(this.healthStatus.values()).filter(m => m.status === 'healthy');
    if (healthyProviders.length > 0) {
      // Simple logic: pick the one with the lowest response time
      healthyProviders.sort((a, b) => a.responseTime - b.responseTime);
      return healthyProviders[0].provider;
    }
    return null;
  }

  // Placeholder for alerting
  sendAlert(message: string, severity: 'info' | 'warn' | 'error'): void {
    console.log(`ALERT [${severity.toUpperCase()}]: ${message}`);
    // In a real system, integrate with PagerDuty, Slack, email, etc.
  }
}
