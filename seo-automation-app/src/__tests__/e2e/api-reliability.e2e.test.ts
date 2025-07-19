/**
 * End-to-End API Reliability Tests
 * 
 * These tests verify the complete API reliability and fallback system
 * works correctly in real-world scenarios.
 */

import { FallbackProviderSystem } from '../../lib/api/fallback-providers';
import { ApiErrorHandler } from '../../lib/api/error-handler';
import { HealthMonitor } from '../../lib/api/health-monitor';
import { ChaosEngineer } from '../../lib/testing/chaos-engineering';
import { jest } from '@jest/globals';

describe('End-to-End API Reliability', () => {
  let fallbackSystem: FallbackProviderSystem;
  let errorHandler: ApiErrorHandler;
  let healthMonitor: HealthMonitor;
  let chaosEngineer: ChaosEngineer;

  beforeEach(() => {
    fallbackSystem = new FallbackProviderSystem();
    errorHandler = new ApiErrorHandler();
    healthMonitor = new HealthMonitor({
      checkInterval: 5000,
      services: [
        {
          name: 'serper',
          url: 'https://google.serper.dev/search',
          method: 'POST',
          timeout: 5000,
          expectedStatus: 200
        }
      ]
    });
    chaosEngineer = new ChaosEngineer();
  });

  afterEach(() => {
    healthMonitor.stop();
  });

  describe('Complete Workflow Reliability', () => {
    it('should handle complete primary service failure with automatic fallback', async () => {
      // Mock primary service failure
      const mockFetch = jest.fn()
        .mockRejectedValueOnce(new Error('Serper service unavailable'))
        .mockRejectedValueOnce(new Error('Serper service unavailable'))
        .mockRejectedValueOnce(new Error('Serper service unavailable'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            organic_results: [{ title: 'SerpApi Result', link: 'https://example.com' }],
            search_information: { total_results: 1 }
          })
        } as Response);

      global.fetch = mockFetch;

      const result = await fallbackSystem.search({
        query: 'test query',
        location: 'US'
      });

      expect(result.organic).toHaveLength(1);
      expect(result.provider).toBe('serpapi');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 3 serper failures + 1 serpapi success
    });

    it('should maintain service through intermittent failures', async () => {
      let requestCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        requestCount++;
        
        // Fail every 3rd request
        if (requestCount % 3 === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            organic: [{ title: 'Success', link: 'https://example.com' }],
            searchInformation: { totalResults: 1 }
          })
        } as Response);
      });

      global.fetch = mockFetch;

      const results = [];
      const errors = [];

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        try {
          const result = await fallbackSystem.search({
            query: `test query ${i}`,
            location: 'US'
          });
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
      }

      // Should have some successes despite intermittent failures
      expect(results.length).toBeGreaterThan(5);
      expect(errors.length).toBeLessThan(5);
    });

    it('should handle rate limiting with automatic retry and fallback', async () => {
      let rateLimitCount = 0;
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.toString().includes('serper.dev')) {
          rateLimitCount++;
          if (rateLimitCount <= 3) {
            return Promise.resolve({
              ok: false,
              status: 429,
              json: () => Promise.resolve({ error: 'Rate limit exceeded' })
            } as Response);
          }
        }
        
        // SerpApi success
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            organic_results: [{ title: 'SerpApi Success', link: 'https://example.com' }],
            search_information: { total_results: 1 }
          })
        } as Response);
      });

      global.fetch = mockFetch;

      const result = await fallbackSystem.search({
        query: 'rate limit test',
        location: 'US'
      });

      expect(result.organic).toHaveLength(1);
      expect(result.provider).toBe('serpapi');
    });

    it('should recover from circuit breaker state', async () => {
      // First, trigger circuit breaker by causing failures
      const mockFetch = jest.fn()
        .mockRejectedValue(new Error('Service unavailable'));

      global.fetch = mockFetch;

      // Cause 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://google.serper.dev/search',
            retries: 0
          });
        } catch (error) {
          // Expected failures
        }
      }

      // Next request should be blocked by circuit breaker
      try {
        await errorHandler.makeRequest({
          url: 'https://google.serper.dev/search'
        });
        fail('Should have been blocked by circuit breaker');
      } catch (error) {
        expect(error.message).toContain('circuit breaker open');
      }

      // Mock time passage and service recovery
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);

      // Should now succeed (circuit breaker in HALF_OPEN, then CLOSED)
      const result = await errorHandler.makeRequest({
        url: 'https://google.serper.dev/search'
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Health Monitoring Integration', () => {
    it('should detect and respond to service degradation', async () => {
      const alertEvents: any[] = [];
      healthMonitor.on('alert', (alert) => {
        alertEvents.push(alert);
      });

      // Mock degraded service (slow responses)
      const mockFetch = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ status: 'ok' })
            } as Response);
          }, 6000); // 6 second delay = degraded
        });
      });

      global.fetch = mockFetch;

      await healthMonitor.checkService('serper');

      expect(alertEvents.length).toBeGreaterThan(0);
      expect(alertEvents[0].type).toBe('service_degraded');
      expect(alertEvents[0].service).toBe('serper');
    });

    it('should track service recovery', async () => {
      const alertEvents: any[] = [];
      healthMonitor.on('alert', (alert) => {
        alertEvents.push(alert);
      });

      // First make service unhealthy
      global.fetch = jest.fn().mockRejectedValue(new Error('Service down'));
      
      for (let i = 0; i < 2; i++) {
        await healthMonitor.checkService('serper');
      }

      // Then recover
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' })
      } as Response);

      await healthMonitor.checkService('serper');

      const recoveryAlerts = alertEvents.filter(alert => 
        alert.type === 'service_recovered'
      );
      expect(recoveryAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Chaos Engineering Integration', () => {
    it('should pass primary service failure experiment', async () => {
      // Mock fallback behavior
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.toString().includes('serper.dev')) {
          return Promise.reject(new Error('Primary service down'));
        }
        if (url.toString().includes('serpapi.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ organic: [] }),
            headers: new Headers([['x-provider', 'serpapi']])
          } as Response);
        }
        return Promise.reject(new Error('Unknown service'));
      });

      const result = await chaosEngineer.runExperiment('primary_service_failure');

      expect(result.success).toBe(true);
      expect(result.metrics.fallbacksUsed).toContain('serpapi');
      expect(result.metrics.errorRate).toBeLessThan(20);
    }, 35000);

    it('should handle network instability experiment', async () => {
      // Mock unstable network
      let requestCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        requestCount++;
        
        if (requestCount % 4 === 0) {
          return Promise.reject(new Error('Network failure'));
        }
        
        if (requestCount % 3 === 0) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ organic: [] }),
                headers: new Headers()
              } as Response);
            }, 2000); // Slow response
          });
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ organic: [] }),
          headers: new Headers()
        } as Response);
      });

      const result = await chaosEngineer.runExperiment('network_instability');

      expect(result.metrics.totalRequests).toBeGreaterThan(0);
      expect(result.metrics.successfulRequests).toBeGreaterThan(0);
    }, 50000);
  });

  describe('Performance Under Load', () => {
    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 20;
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          organic: [{ title: 'Test', link: 'https://example.com' }],
          searchInformation: { totalResults: 1 }
        })
      } as Response);

      global.fetch = mockFetch;

      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fallbackSystem.search({
          query: `concurrent test ${i}`,
          location: 'US'
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / concurrentRequests;

      expect(results.length).toBe(concurrentRequests);
      expect(results.every(r => r.organic.length > 0)).toBe(true);
      expect(avgTimePerRequest).toBeLessThan(1000); // Less than 1 second per request
      expect(totalTime).toBeLessThan(10000); // Total time less than 10 seconds

      console.log(`Concurrent load test: ${concurrentRequests} requests in ${totalTime}ms`);
      console.log(`Average time per request: ${avgTimePerRequest.toFixed(2)}ms`);
    });

    it('should handle mixed success/failure scenarios', async () => {
      let requestCount = 0;
      const mockFetch = jest.fn().mockImplementation((url) => {
        requestCount++;
        
        // 70% success rate
        if (requestCount % 10 < 7) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              organic: [{ title: 'Success', link: 'https://example.com' }],
              searchInformation: { totalResults: 1 }
            })
          } as Response);
        }
        
        // 30% failure rate
        return Promise.reject(new Error('Random failure'));
      });

      global.fetch = mockFetch;

      const results = [];
      const errors = [];

      for (let i = 0; i < 20; i++) {
        try {
          const result = await fallbackSystem.search({
            query: `mixed test ${i}`,
            location: 'US'
          });
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
      }

      const successRate = (results.length / 20) * 100;
      
      expect(successRate).toBeGreaterThan(60); // Should maintain reasonable success rate
      expect(results.length).toBeGreaterThan(10);
      
      console.log(`Mixed scenario: ${successRate}% success rate`);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from complete system failure', async () => {
      // Simulate complete system failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Complete system failure'));

      // All requests should fail initially
      for (let i = 0; i < 3; i++) {
        try {
          await fallbackSystem.search({ query: 'test' });
          fail('Should have failed');
        } catch (error) {
          expect(error.message).toContain('All search providers failed');
        }
      }

      // System recovery
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          organic: [{ title: 'Recovery Success', link: 'https://example.com' }],
          searchInformation: { totalResults: 1 }
        })
      } as Response);

      // Should now succeed
      const result = await fallbackSystem.search({ query: 'recovery test' });
      
      expect(result.organic).toHaveLength(1);
      expect(result.organic[0].title).toBe('Recovery Success');
    });

    it('should maintain data consistency during failures', async () => {
      const responses: any[] = [];
      
      // Mock inconsistent responses
      global.fetch = jest.fn().mockImplementation(() => {
        const random = Math.random();
        
        if (random < 0.3) {
          return Promise.reject(new Error('Network failure'));
        }
        
        if (random < 0.6) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server error' })
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            organic: [{ title: 'Consistent Data', link: 'https://example.com' }],
            searchInformation: { totalResults: 1 }
          })
        } as Response);
      });

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        try {
          const result = await fallbackSystem.search({ query: `consistency test ${i}` });
          responses.push(result);
        } catch (error) {
          // Some failures expected
        }
      }

      // All successful responses should have consistent structure
      expect(responses.length).toBeGreaterThan(0);
      responses.forEach(response => {
        expect(response).toHaveProperty('organic');
        expect(response).toHaveProperty('searchInformation');
        expect(Array.isArray(response.organic)).toBe(true);
      });
    });
  });
});
