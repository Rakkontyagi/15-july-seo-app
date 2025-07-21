import { ChaosEngineer, ChaosExperiment } from '../chaos-engineering';
import { jest } from '@jest/globals';

describe('Chaos Engineering Framework', () => {
  let chaosEngineer: ChaosEngineer;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    chaosEngineer = new ChaosEngineer();
    originalFetch = global.fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Experiment Registration and Management', () => {
    it('should register custom experiments', () => {
      const customExperiment: ChaosExperiment = {
        name: 'custom_test',
        description: 'Custom test experiment',
        duration: 5000,
        intensity: 'low',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'network_delay',
            probability: 0.5,
            parameters: { delay: 1000 }
          }
        ],
        expectedBehavior: 'Should handle delays gracefully',
        successCriteria: {
          maxErrorRate: 10,
          maxResponseTime: 2000,
          minSuccessRate: 90,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(customExperiment);

      // Verify experiment was registered (would need access to internal state)
      expect(() => chaosEngineer.runExperiment('custom_test')).not.toThrow();
    });

    it('should throw error for non-existent experiment', async () => {
      await expect(chaosEngineer.runExperiment('non_existent'))
        .rejects.toThrow("Experiment 'non_existent' not found");
    });
  });

  describe('Failure Injection', () => {
    it('should inject network delays', async () => {
      const delayExperiment: ChaosExperiment = {
        name: 'delay_test',
        description: 'Test network delays',
        duration: 2000,
        intensity: 'medium',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'network_delay',
            probability: 1.0, // Always delay
            parameters: { delay: 500 }
          }
        ],
        expectedBehavior: 'Should handle delays',
        successCriteria: {
          maxErrorRate: 0,
          maxResponseTime: 1000,
          minSuccessRate: 100,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(delayExperiment);

      // Mock fetch to track timing
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers()
      } as Response);
      global.fetch = mockFetch;

      const startTime = Date.now();
      const result = await chaosEngineer.runExperiment('delay_test');
      const endTime = Date.now();

      expect(result.metrics.averageResponseTime).toBeGreaterThan(400);
      expect(endTime - startTime).toBeGreaterThan(1500); // Should take at least experiment duration
    }, 10000);

    it('should inject service errors', async () => {
      const errorExperiment: ChaosExperiment = {
        name: 'error_test',
        description: 'Test service errors',
        duration: 1000,
        intensity: 'high',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'service_error',
            probability: 1.0, // Always error
            parameters: { status: 500 }
          }
        ],
        expectedBehavior: 'Should handle errors',
        successCriteria: {
          maxErrorRate: 100, // Expect all to fail
          maxResponseTime: 1000,
          minSuccessRate: 0,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(errorExperiment);

      const result = await chaosEngineer.runExperiment('error_test');

      expect(result.metrics.errorRate).toBe(100);
      expect(result.metrics.successfulRequests).toBe(0);
      expect(result.success).toBe(true); // Should pass because we expect 100% errors
    }, 5000);

    it('should inject network failures', async () => {
      const networkFailureExperiment: ChaosExperiment = {
        name: 'network_failure_test',
        description: 'Test network failures',
        duration: 1000,
        intensity: 'high',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'network_failure',
            probability: 1.0,
            parameters: {}
          }
        ],
        expectedBehavior: 'Should handle network failures',
        successCriteria: {
          maxErrorRate: 100,
          maxResponseTime: 1000,
          minSuccessRate: 0,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(networkFailureExperiment);

      const result = await chaosEngineer.runExperiment('network_failure_test');

      expect(result.metrics.errorRate).toBe(100);
      expect(result.metrics.failedRequests).toBeGreaterThan(0);
    }, 5000);

    it('should inject rate limiting', async () => {
      const rateLimitExperiment: ChaosExperiment = {
        name: 'rate_limit_test',
        description: 'Test rate limiting',
        duration: 1000,
        intensity: 'medium',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'rate_limit',
            probability: 0.5,
            parameters: {}
          }
        ],
        expectedBehavior: 'Should handle rate limits',
        successCriteria: {
          maxErrorRate: 60,
          maxResponseTime: 1000,
          minSuccessRate: 40,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(rateLimitExperiment);

      const result = await chaosEngineer.runExperiment('rate_limit_test');

      expect(result.metrics.errorRate).toBeGreaterThan(0);
      expect(result.metrics.errorRate).toBeLessThan(100);
    }, 5000);
  });

  describe('Success Criteria Evaluation', () => {
    it('should pass experiment when criteria are met', async () => {
      const passingExperiment: ChaosExperiment = {
        name: 'passing_test',
        description: 'Test that should pass',
        duration: 1000,
        intensity: 'low',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'network_delay',
            probability: 0.1, // Low failure rate
            parameters: { delay: 100 }
          }
        ],
        expectedBehavior: 'Should mostly succeed',
        successCriteria: {
          maxErrorRate: 20,
          maxResponseTime: 1000,
          minSuccessRate: 80,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(passingExperiment);

      // Mock mostly successful responses
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers()
      } as Response);

      const result = await chaosEngineer.runExperiment('passing_test');

      expect(result.success).toBe(true);
      expect(result.metrics.errorRate).toBeLessThan(20);
    }, 5000);

    it('should fail experiment when criteria are not met', async () => {
      const failingExperiment: ChaosExperiment = {
        name: 'failing_test',
        description: 'Test that should fail',
        duration: 1000,
        intensity: 'high',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'service_error',
            probability: 0.8, // High failure rate
            parameters: { status: 500 }
          }
        ],
        expectedBehavior: 'Should mostly fail',
        successCriteria: {
          maxErrorRate: 10, // Strict criteria
          maxResponseTime: 500,
          minSuccessRate: 90,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(failingExperiment);

      const result = await chaosEngineer.runExperiment('failing_test');

      expect(result.success).toBe(false);
      expect(result.metrics.errorRate).toBeGreaterThan(10);
    }, 5000);

    it('should check for required fallbacks', async () => {
      const fallbackExperiment: ChaosExperiment = {
        name: 'fallback_test',
        description: 'Test fallback requirements',
        duration: 1000,
        intensity: 'medium',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'service_error',
            probability: 0.5,
            parameters: { status: 503 }
          }
        ],
        expectedBehavior: 'Should use fallbacks',
        successCriteria: {
          maxErrorRate: 60,
          maxResponseTime: 2000,
          minSuccessRate: 40,
          requiredFallbacks: ['serpapi', 'scrapingbee']
        }
      };

      chaosEngineer.registerExperiment(fallbackExperiment);

      // Mock responses with fallback providers
      global.fetch = jest.fn().mockImplementation(() => {
        const headers = new Headers();
        headers.set('x-provider', Math.random() > 0.5 ? 'serpapi' : 'scrapingbee');
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          headers
        } as Response);
      });

      const result = await chaosEngineer.runExperiment('fallback_test');

      expect(result.metrics.fallbacksUsed.length).toBeGreaterThan(0);
    }, 5000);
  });

  describe('Event Timeline Tracking', () => {
    it('should track chaos events', async () => {
      const trackingExperiment: ChaosExperiment = {
        name: 'tracking_test',
        description: 'Test event tracking',
        duration: 1000,
        intensity: 'medium',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'network_delay',
            probability: 0.5,
            parameters: { delay: 200 }
          }
        ],
        expectedBehavior: 'Should track events',
        successCriteria: {
          maxErrorRate: 100,
          maxResponseTime: 5000,
          minSuccessRate: 0,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(trackingExperiment);

      const result = await chaosEngineer.runExperiment('tracking_test');

      expect(result.timeline).toBeDefined();
      expect(result.timeline.length).toBeGreaterThan(0);
      
      const failureEvents = result.timeline.filter(event => 
        event.type === 'failure_injected'
      );
      expect(failureEvents.length).toBeGreaterThan(0);
    }, 5000);
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations for high error rates', async () => {
      const highErrorExperiment: ChaosExperiment = {
        name: 'high_error_test',
        description: 'Test high error rate recommendations',
        duration: 1000,
        intensity: 'high',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'service_error',
            probability: 0.9,
            parameters: { status: 500 }
          }
        ],
        expectedBehavior: 'Should generate error recommendations',
        successCriteria: {
          maxErrorRate: 10,
          maxResponseTime: 1000,
          minSuccessRate: 90,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(highErrorExperiment);

      const result = await chaosEngineer.runExperiment('high_error_test');

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => 
        rec.includes('Error rate') && rec.includes('exceeds threshold')
      )).toBe(true);
    }, 5000);

    it('should generate recommendations for slow responses', async () => {
      const slowResponseExperiment: ChaosExperiment = {
        name: 'slow_response_test',
        description: 'Test slow response recommendations',
        duration: 1000,
        intensity: 'medium',
        targetServices: ['test.service.com'],
        failureTypes: [
          {
            type: 'network_delay',
            probability: 1.0,
            parameters: { delay: 2000 }
          }
        ],
        expectedBehavior: 'Should generate timing recommendations',
        successCriteria: {
          maxErrorRate: 0,
          maxResponseTime: 500, // Strict timing requirement
          minSuccessRate: 100,
          requiredFallbacks: []
        }
      };

      chaosEngineer.registerExperiment(slowResponseExperiment);

      // Mock fetch to ensure it's called
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers()
      } as Response);

      const result = await chaosEngineer.runExperiment('slow_response_test');

      expect(result.recommendations.some(rec => 
        rec.includes('response time') && rec.includes('exceeds threshold')
      )).toBe(true);
    }, 5000);
  });

  describe('Multiple Experiments', () => {
    it('should run all experiments sequentially', async () => {
      // Register multiple small experiments
      const experiments = [
        {
          name: 'multi_test_1',
          description: 'Multi test 1',
          duration: 500,
          intensity: 'low' as const,
          targetServices: ['test1.service.com'],
          failureTypes: [{ type: 'network_delay' as const, probability: 0.1, parameters: { delay: 100 } }],
          expectedBehavior: 'Should work',
          successCriteria: { maxErrorRate: 20, maxResponseTime: 1000, minSuccessRate: 80, requiredFallbacks: [] }
        },
        {
          name: 'multi_test_2',
          description: 'Multi test 2',
          duration: 500,
          intensity: 'low' as const,
          targetServices: ['test2.service.com'],
          failureTypes: [{ type: 'service_error' as const, probability: 0.1, parameters: { status: 500 } }],
          expectedBehavior: 'Should work',
          successCriteria: { maxErrorRate: 20, maxResponseTime: 1000, minSuccessRate: 80, requiredFallbacks: [] }
        }
      ];

      experiments.forEach(exp => chaosEngineer.registerExperiment(exp));

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers()
      } as Response);

      const results = await chaosEngineer.runAllExperiments();

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(r => r.experiment)).toBe(true);
    }, 10000);
  });
});
