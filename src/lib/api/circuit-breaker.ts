/**
 * Circuit Breaker Implementation
 * Validates Quinn's recommendation for external API fallback strategies
 * Implements proven circuit breaker pattern with comprehensive monitoring
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  successThreshold: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private nextAttempt: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Next attempt in ${this.nextAttempt - Date.now()}ms`);
      } else {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log(`🔄 Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log(`✅ Circuit breaker ${this.name} recovered to CLOSED`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttempt = Date.now() + this.config.recoveryTimeout;
        console.log(`🚨 Circuit breaker ${this.name} opened due to ${this.failureCount} failures`);
      }
    }
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    };
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.nextAttempt = 0;
    console.log(`🔄 Circuit breaker ${this.name} manually reset`);
  }
}

// Circuit breaker instances for each external service
export const circuitBreakers = {
  serper: new CircuitBreaker('serper', {
    failureThreshold: 3,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 10000, // 10 seconds
    successThreshold: 2,
  }),
  
  firecrawl: new CircuitBreaker('firecrawl', {
    failureThreshold: 3,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 10000, // 10 seconds
    successThreshold: 2,
  }),
  
  openai: new CircuitBreaker('openai', {
    failureThreshold: 5, // Higher threshold for AI service
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 5000, // 5 seconds
    successThreshold: 3,
  }),
};

// Circuit breaker monitoring
export class CircuitBreakerMonitor {
  private static instance: CircuitBreakerMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): CircuitBreakerMonitor {
    if (!CircuitBreakerMonitor.instance) {
      CircuitBreakerMonitor.instance = new CircuitBreakerMonitor();
    }
    return CircuitBreakerMonitor.instance;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.checkCircuitBreakerHealth();
    }, 30000); // Check every 30 seconds

    console.log('🔍 Circuit breaker monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Circuit breaker monitoring stopped');
    }
  }

  private checkCircuitBreakerHealth(): void {
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
      const metrics = breaker.getMetrics();
      
      // Log circuit breaker status
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Circuit Breaker ${name}:`, {
          state: metrics.state,
          failures: metrics.failureCount,
          total: metrics.totalRequests,
          failureRate: metrics.totalRequests > 0 ? 
            (metrics.totalFailures / metrics.totalRequests * 100).toFixed(2) + '%' : '0%'
        });
      }

      // Send metrics to monitoring service
      if (typeof window !== 'undefined') {
        fetch('/api/monitoring/circuit-breakers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: name,
            metrics,
            timestamp: Date.now(),
          }),
        }).catch(error => {
          console.warn(`Failed to send circuit breaker metrics for ${name}:`, error);
        });
      }

      // Alert on circuit breaker state changes
      if (metrics.state === CircuitState.OPEN) {
        this.sendAlert(name, 'Circuit breaker opened', 'high', metrics);
      } else if (metrics.state === CircuitState.HALF_OPEN) {
        this.sendAlert(name, 'Circuit breaker in recovery', 'medium', metrics);
      }
    });
  }

  private sendAlert(service: string, message: string, severity: string, metrics: CircuitBreakerMetrics): void {
    // Send to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(`Circuit Breaker Alert: ${service} - ${message}`, {
        level: severity as any,
        extra: { service, metrics },
        tags: { component: 'circuit-breaker', service },
      });
    }

    // Log to console
    console.warn(`🚨 Circuit Breaker Alert [${severity}]: ${service} - ${message}`, metrics);
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const allMetrics: Record<string, CircuitBreakerMetrics> = {};
    
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
      allMetrics[name] = breaker.getMetrics();
    });
    
    return allMetrics;
  }

  resetAllCircuitBreakers(): void {
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
      breaker.reset();
    });
    console.log('🔄 All circuit breakers reset');
  }
}

// Export singleton monitor instance
export const circuitBreakerMonitor = CircuitBreakerMonitor.getInstance();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  circuitBreakerMonitor.startMonitoring();
}

// Global type declarations
declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, options?: any) => void;
    };
  }
}
