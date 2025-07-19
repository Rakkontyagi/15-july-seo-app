/**
 * Chaos Engineering Framework for API Reliability Testing
 * 
 * This framework simulates various failure scenarios to test
 * the resilience of our API reliability and fallback systems.
 */

export interface ChaosExperiment {
  name: string;
  description: string;
  duration: number; // milliseconds
  intensity: 'low' | 'medium' | 'high';
  targetServices: string[];
  failureTypes: FailureType[];
  expectedBehavior: string;
  successCriteria: SuccessCriteria;
}

export interface FailureType {
  type: 'network_delay' | 'network_failure' | 'service_error' | 'timeout' | 'rate_limit' | 'partial_failure';
  probability: number; // 0-1
  parameters: Record<string, any>;
}

export interface SuccessCriteria {
  maxErrorRate: number; // percentage
  maxResponseTime: number; // milliseconds
  minSuccessRate: number; // percentage
  requiredFallbacks: string[];
}

export interface ChaosResult {
  experiment: string;
  success: boolean;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    fallbacksUsed: string[];
  };
  timeline: ChaosEvent[];
  recommendations: string[];
}

export interface ChaosEvent {
  timestamp: number;
  type: 'failure_injected' | 'recovery' | 'fallback_triggered' | 'circuit_opened' | 'circuit_closed';
  service: string;
  details: Record<string, any>;
}

export class ChaosEngineer {
  private experiments: Map<string, ChaosExperiment> = new Map();
  private activeExperiments: Set<string> = new Set();
  private originalFetch: typeof fetch;
  private chaosEvents: ChaosEvent[] = [];

  constructor() {
    this.originalFetch = global.fetch;
    this.setupDefaultExperiments();
  }

  /**
   * Register a chaos experiment
   */
  registerExperiment(experiment: ChaosExperiment): void {
    this.experiments.set(experiment.name, experiment);
  }

  /**
   * Run a specific chaos experiment
   */
  async runExperiment(experimentName: string): Promise<ChaosResult> {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) {
      throw new Error(`Experiment '${experimentName}' not found`);
    }

    console.log(`🔥 Starting chaos experiment: ${experiment.name}`);
    console.log(`📝 Description: ${experiment.description}`);
    console.log(`⏱️ Duration: ${experiment.duration}ms`);
    console.log(`🎯 Target services: ${experiment.targetServices.join(', ')}`);

    this.activeExperiments.add(experimentName);
    this.chaosEvents = [];

    // Inject chaos
    this.injectChaos(experiment);

    const startTime = Date.now();
    const metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimeSum: 0,
      maxResponseTime: 0,
      fallbacksUsed: new Set<string>()
    };

    // Run experiment for specified duration
    const endTime = startTime + experiment.duration;
    
    while (Date.now() < endTime) {
      try {
        const requestStart = Date.now();
        
        // Simulate API request
        const response = await this.simulateApiRequest(experiment.targetServices[0]);
        
        const responseTime = Date.now() - requestStart;
        metrics.totalRequests++;
        metrics.responseTimeSum += responseTime;
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

        if (response.success) {
          metrics.successfulRequests++;
          if (response.provider && response.provider !== 'primary') {
            metrics.fallbacksUsed.add(response.provider);
          }
        } else {
          metrics.failedRequests++;
        }

        // Wait before next request
        await this.sleep(100);
      } catch (error) {
        metrics.totalRequests++;
        metrics.failedRequests++;
      }
    }

    // Stop chaos injection
    this.stopChaos();
    this.activeExperiments.delete(experimentName);

    // Calculate final metrics
    const result: ChaosResult = {
      experiment: experimentName,
      success: this.evaluateSuccess(experiment, metrics),
      metrics: {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        averageResponseTime: metrics.responseTimeSum / metrics.totalRequests,
        maxResponseTime: metrics.maxResponseTime,
        errorRate: (metrics.failedRequests / metrics.totalRequests) * 100,
        fallbacksUsed: Array.from(metrics.fallbacksUsed)
      },
      timeline: this.chaosEvents,
      recommendations: this.generateRecommendations(experiment, metrics)
    };

    console.log(`✅ Chaos experiment completed: ${experimentName}`);
    console.log(`📊 Results: ${result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`📈 Error rate: ${result.metrics.errorRate.toFixed(2)}%`);
    console.log(`⚡ Avg response time: ${result.metrics.averageResponseTime.toFixed(2)}ms`);

    return result;
  }

  /**
   * Run all registered experiments
   */
  async runAllExperiments(): Promise<ChaosResult[]> {
    const results: ChaosResult[] = [];
    
    for (const experimentName of this.experiments.keys()) {
      try {
        const result = await this.runExperiment(experimentName);
        results.push(result);
        
        // Wait between experiments
        await this.sleep(2000);
      } catch (error) {
        console.error(`Failed to run experiment ${experimentName}:`, error);
      }
    }

    return results;
  }

  /**
   * Inject chaos based on experiment configuration
   */
  private injectChaos(experiment: ChaosExperiment): void {
    global.fetch = this.createChaosFetch(experiment);
  }

  /**
   * Stop chaos injection
   */
  private stopChaos(): void {
    global.fetch = this.originalFetch;
  }

  /**
   * Create a chaotic fetch function
   */
  private createChaosFetch(experiment: ChaosExperiment): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Check if this request should be affected by chaos
      const shouldAffect = experiment.targetServices.some(service => 
        url.includes(service) || url.includes(service.replace('.', '-'))
      );

      if (!shouldAffect) {
        return this.originalFetch(input, init);
      }

      // Apply chaos based on failure types
      for (const failureType of experiment.failureTypes) {
        if (Math.random() < failureType.probability) {
          const chaosEvent: ChaosEvent = {
            timestamp: Date.now(),
            type: 'failure_injected',
            service: this.extractServiceName(url),
            details: { failureType: failureType.type, parameters: failureType.parameters }
          };
          this.chaosEvents.push(chaosEvent);

          return this.simulateFailure(failureType, url);
        }
      }

      // Normal request
      return this.originalFetch(input, init);
    };
  }

  /**
   * Simulate different types of failures
   */
  private async simulateFailure(failureType: FailureType, url: string): Promise<Response> {
    switch (failureType.type) {
      case 'network_delay':
        await this.sleep(failureType.parameters.delay || 5000);
        return this.originalFetch(url);

      case 'network_failure':
        throw new Error('Network connection failed');

      case 'service_error':
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: failureType.parameters.status || 500,
            statusText: 'Internal Server Error',
            headers: { 'Content-Type': 'application/json' }
          }
        );

      case 'timeout':
        await this.sleep(failureType.parameters.timeout || 30000);
        throw new Error('Request timeout');

      case 'rate_limit':
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { 
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '60'
            }
          }
        );

      case 'partial_failure':
        if (Math.random() < 0.5) {
          return new Response(
            JSON.stringify({ organic: [], error: 'Partial data available' }),
            { status: 206, statusText: 'Partial Content' }
          );
        }
        return this.originalFetch(url);

      default:
        return this.originalFetch(url);
    }
  }

  /**
   * Simulate an API request for testing
   */
  private async simulateApiRequest(service: string): Promise<{ success: boolean; provider?: string }> {
    try {
      const response = await fetch(`https://${service}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 'test query' })
      });

      return {
        success: response.ok,
        provider: response.headers.get('x-provider') || 'primary'
      };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Evaluate if experiment was successful
   */
  private evaluateSuccess(experiment: ChaosExperiment, metrics: any): boolean {
    const criteria = experiment.successCriteria;
    const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    const avgResponseTime = metrics.responseTimeSum / metrics.totalRequests;

    return (
      errorRate <= criteria.maxErrorRate &&
      avgResponseTime <= criteria.maxResponseTime &&
      successRate >= criteria.minSuccessRate &&
      criteria.requiredFallbacks.every(fallback => 
        metrics.fallbacksUsed.has(fallback)
      )
    );
  }

  /**
   * Generate recommendations based on experiment results
   */
  private generateRecommendations(experiment: ChaosExperiment, metrics: any): string[] {
    const recommendations: string[] = [];
    const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
    const avgResponseTime = metrics.responseTimeSum / metrics.totalRequests;

    if (errorRate > experiment.successCriteria.maxErrorRate) {
      recommendations.push(`Error rate (${errorRate.toFixed(2)}%) exceeds threshold. Consider improving error handling.`);
    }

    if (avgResponseTime > experiment.successCriteria.maxResponseTime) {
      recommendations.push(`Average response time (${avgResponseTime.toFixed(2)}ms) exceeds threshold. Consider optimizing timeouts.`);
    }

    if (metrics.fallbacksUsed.size === 0) {
      recommendations.push('No fallback providers were used. Verify fallback system is working correctly.');
    }

    if (metrics.maxResponseTime > 10000) {
      recommendations.push('Some requests took very long. Consider implementing request timeouts.');
    }

    return recommendations;
  }

  /**
   * Extract service name from URL
   */
  private extractServiceName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Setup default chaos experiments
   */
  private setupDefaultExperiments(): void {
    // Primary service failure experiment
    this.registerExperiment({
      name: 'primary_service_failure',
      description: 'Test fallback when primary search service fails completely',
      duration: 30000, // 30 seconds
      intensity: 'high',
      targetServices: ['google.serper.dev'],
      failureTypes: [
        {
          type: 'service_error',
          probability: 1.0, // 100% failure rate
          parameters: { status: 503 }
        }
      ],
      expectedBehavior: 'Should automatically failover to SerpApi or ScrapingBee',
      successCriteria: {
        maxErrorRate: 20,
        maxResponseTime: 10000,
        minSuccessRate: 80,
        requiredFallbacks: ['serpapi']
      }
    });

    // Network instability experiment
    this.registerExperiment({
      name: 'network_instability',
      description: 'Test resilience under unstable network conditions',
      duration: 45000, // 45 seconds
      intensity: 'medium',
      targetServices: ['google.serper.dev', 'serpapi.com'],
      failureTypes: [
        {
          type: 'network_delay',
          probability: 0.3,
          parameters: { delay: 3000 }
        },
        {
          type: 'network_failure',
          probability: 0.1,
          parameters: {}
        }
      ],
      expectedBehavior: 'Should handle delays gracefully and retry failed requests',
      successCriteria: {
        maxErrorRate: 15,
        maxResponseTime: 8000,
        minSuccessRate: 85,
        requiredFallbacks: []
      }
    });

    // Rate limiting experiment
    this.registerExperiment({
      name: 'rate_limiting_stress',
      description: 'Test behavior when hitting rate limits',
      duration: 20000, // 20 seconds
      intensity: 'medium',
      targetServices: ['google.serper.dev'],
      failureTypes: [
        {
          type: 'rate_limit',
          probability: 0.4,
          parameters: {}
        }
      ],
      expectedBehavior: 'Should respect rate limits and use fallback providers',
      successCriteria: {
        maxErrorRate: 25,
        maxResponseTime: 5000,
        minSuccessRate: 75,
        requiredFallbacks: ['serpapi']
      }
    });

    // Partial failure experiment
    this.registerExperiment({
      name: 'partial_service_degradation',
      description: 'Test handling of partial service degradation',
      duration: 35000, // 35 seconds
      intensity: 'low',
      targetServices: ['google.serper.dev', 'serpapi.com'],
      failureTypes: [
        {
          type: 'partial_failure',
          probability: 0.2,
          parameters: {}
        },
        {
          type: 'network_delay',
          probability: 0.1,
          parameters: { delay: 2000 }
        }
      ],
      expectedBehavior: 'Should handle partial responses and maintain service quality',
      successCriteria: {
        maxErrorRate: 10,
        maxResponseTime: 6000,
        minSuccessRate: 90,
        requiredFallbacks: []
      }
    });
  }
}
