import { apiRateLimiter, burstRateLimiter } from '../rate-limiter';
import { jest } from '@jest/globals';

// Mock Redis for testing
const mockRedis = {
  eval: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedis)
}));

describe('Rate Limiter Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful rate limit responses
    mockRedis.eval.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 });
  });

  describe('Load Testing', () => {
    it('should handle high concurrent request volume', async () => {
      const concurrentRequests = 100;
      const identifier = 'load-test-user';

      const startTime = Date.now();
      
      // Simulate concurrent requests
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        apiRateLimiter.limit(identifier)
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;

      // Performance assertions
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(successfulRequests).toBeGreaterThan(0);
      expect(mockRedis.eval).toHaveBeenCalledTimes(concurrentRequests);

      console.log(`Processed ${concurrentRequests} requests in ${processingTime}ms`);
      console.log(`Average time per request: ${(processingTime / concurrentRequests).toFixed(2)}ms`);
    }, 10000);

    it('should maintain accuracy under load', async () => {
      const requestCount = 50;
      const identifier = 'accuracy-test-user';
      let allowedRequests = 0;
      let deniedRequests = 0;

      // Mock rate limiter to allow first 10 requests, then deny
      mockRedis.eval.mockImplementation(() => {
        allowedRequests++;
        if (allowedRequests <= 10) {
          return Promise.resolve({
            success: true,
            limit: 10,
            remaining: 10 - allowedRequests,
            reset: Date.now() + 60000
          });
        } else {
          deniedRequests++;
          return Promise.resolve({
            success: false,
            limit: 10,
            remaining: 0,
            reset: Date.now() + 60000
          });
        }
      });

      const promises = Array.from({ length: requestCount }, () =>
        apiRateLimiter.limit(identifier)
      );

      const results = await Promise.all(promises);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      expect(successful).toBe(10); // Should allow exactly 10
      expect(failed).toBe(40); // Should deny the rest
    });

    it('should handle burst traffic with token bucket', async () => {
      const burstSize = 20;
      const identifier = 'burst-test-user';

      // Mock token bucket allowing burst
      mockRedis.eval.mockImplementation(() => {
        return Promise.resolve({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 10000
        });
      });

      const startTime = Date.now();
      
      // Send burst of requests
      const promises = Array.from({ length: burstSize }, () =>
        burstRateLimiter.limit(identifier)
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      const successfulRequests = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;

      expect(processingTime).toBeLessThan(2000); // Fast burst handling
      expect(successfulRequests).toBeGreaterThan(0);

      console.log(`Handled burst of ${burstSize} requests in ${processingTime}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain reasonable memory usage during sustained load', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 1000;
      const identifier = 'memory-test-user';

      // Simulate sustained load
      for (let i = 0; i < iterations; i++) {
        await apiRateLimiter.limit(`${identifier}-${i % 10}`); // 10 different users
        
        // Occasional garbage collection check
        if (i % 100 === 0) {
          if (global.gc) {
            global.gc();
          }
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`Memory increase after ${iterations} requests: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }, 15000);

    it('should handle Redis connection failures gracefully', async () => {
      const identifier = 'redis-failure-test';
      
      // Mock Redis failure
      mockRedis.eval.mockRejectedValue(new Error('Redis connection failed'));

      const startTime = Date.now();
      
      try {
        await apiRateLimiter.limit(identifier);
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should fail fast, not hang
        expect(responseTime).toBeLessThan(3000); // Within timeout
        expect(error.message).toContain('Redis connection failed');
      }
    });
  });

  describe('Distributed Rate Limiting', () => {
    it('should coordinate limits across multiple instances', async () => {
      const identifier = 'distributed-test-user';
      const instanceCount = 5;
      const requestsPerInstance = 10;

      // Mock distributed coordination
      let globalCounter = 0;
      mockRedis.eval.mockImplementation(() => {
        globalCounter++;
        return Promise.resolve({
          success: globalCounter <= 25, // Global limit of 25
          limit: 25,
          remaining: Math.max(0, 25 - globalCounter),
          reset: Date.now() + 60000
        });
      });

      // Simulate multiple instances making requests
      const instancePromises = Array.from({ length: instanceCount }, async (_, instanceId) => {
        const promises = Array.from({ length: requestsPerInstance }, () =>
          apiRateLimiter.limit(`${identifier}-instance-${instanceId}`)
        );
        return Promise.all(promises);
      });

      const allResults = await Promise.all(instancePromises);
      const flatResults = allResults.flat();

      const successfulRequests = flatResults.filter(r => r.success).length;
      const failedRequests = flatResults.filter(r => !r.success).length;

      expect(successfulRequests).toBeLessThanOrEqual(25);
      expect(successfulRequests + failedRequests).toBe(50);

      console.log(`Distributed test: ${successfulRequests} successful, ${failedRequests} failed`);
    });

    it('should handle network partitions', async () => {
      const identifier = 'partition-test-user';
      
      // Simulate network partition (timeout)
      mockRedis.eval.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      });

      const startTime = Date.now();
      
      try {
        await apiRateLimiter.limit(identifier);
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should timeout within reasonable time
        expect(responseTime).toBeGreaterThan(90);
        expect(responseTime).toBeLessThan(3000);
      }
    });
  });

  describe('Algorithm Performance Comparison', () => {
    it('should compare sliding window vs token bucket performance', async () => {
      const identifier = 'algorithm-comparison';
      const requestCount = 100;

      // Test sliding window (apiRateLimiter)
      const slidingWindowStart = Date.now();
      const slidingWindowPromises = Array.from({ length: requestCount }, () =>
        apiRateLimiter.limit(`${identifier}-sliding`)
      );
      await Promise.all(slidingWindowPromises);
      const slidingWindowTime = Date.now() - slidingWindowStart;

      // Test token bucket (burstRateLimiter)
      const tokenBucketStart = Date.now();
      const tokenBucketPromises = Array.from({ length: requestCount }, () =>
        burstRateLimiter.limit(`${identifier}-bucket`)
      );
      await Promise.all(tokenBucketPromises);
      const tokenBucketTime = Date.now() - tokenBucketStart;

      console.log(`Sliding window: ${slidingWindowTime}ms for ${requestCount} requests`);
      console.log(`Token bucket: ${tokenBucketTime}ms for ${requestCount} requests`);

      // Both should complete within reasonable time
      expect(slidingWindowTime).toBeLessThan(5000);
      expect(tokenBucketTime).toBeLessThan(5000);
    });

    it('should measure rate limiter overhead', async () => {
      const identifier = 'overhead-test';
      const iterations = 1000;

      // Measure time with rate limiting
      const withRateLimitStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        await apiRateLimiter.limit(`${identifier}-${i}`);
      }
      const withRateLimitTime = Date.now() - withRateLimitStart;

      // Measure time without rate limiting (just Redis calls)
      const withoutRateLimitStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        await mockRedis.get(`test-key-${i}`);
      }
      const withoutRateLimitTime = Date.now() - withoutRateLimitStart;

      const overhead = withRateLimitTime - withoutRateLimitTime;
      const overheadPerRequest = overhead / iterations;

      console.log(`Rate limiter overhead: ${overhead}ms total, ${overheadPerRequest.toFixed(2)}ms per request`);

      // Overhead should be minimal
      expect(overheadPerRequest).toBeLessThan(10); // Less than 10ms per request
    }, 15000);
  });

  describe('Edge Cases and Stress Testing', () => {
    it('should handle extremely high request rates', async () => {
      const identifier = 'stress-test-user';
      const requestCount = 1000;
      const batchSize = 50;

      const startTime = Date.now();
      
      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < requestCount; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, requestCount - i) }, () =>
          apiRateLimiter.limit(`${identifier}-${i}`)
        );
        await Promise.all(batch);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const requestsPerSecond = (requestCount / totalTime) * 1000;

      console.log(`Processed ${requestCount} requests in ${totalTime}ms`);
      console.log(`Rate: ${requestsPerSecond.toFixed(2)} requests/second`);

      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(requestsPerSecond).toBeGreaterThan(10); // At least 10 req/sec
    }, 35000);

    it('should handle malformed identifiers gracefully', async () => {
      const malformedIdentifiers = [
        '',
        null,
        undefined,
        'very-long-identifier-'.repeat(100),
        '特殊字符',
        '🚀🔥💯',
        '\n\r\t',
        JSON.stringify({ complex: 'object' })
      ];

      for (const identifier of malformedIdentifiers) {
        try {
          const result = await apiRateLimiter.limit(identifier as string);
          // Should either succeed or fail gracefully
          expect(typeof result).toBe('object');
        } catch (error) {
          // Graceful failure is acceptable
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    it('should maintain performance under memory pressure', async () => {
      // Create memory pressure
      const largeArrays: number[][] = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(i));
      }

      const identifier = 'memory-pressure-test';
      const requestCount = 100;

      const startTime = Date.now();
      
      const promises = Array.from({ length: requestCount }, (_, i) =>
        apiRateLimiter.limit(`${identifier}-${i}`)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      const successfulRequests = results.filter(r => r.success).length;

      // Should still perform reasonably under memory pressure
      expect(processingTime).toBeLessThan(10000);
      expect(successfulRequests).toBeGreaterThan(0);

      // Cleanup
      largeArrays.length = 0;

      console.log(`Under memory pressure: ${processingTime}ms for ${requestCount} requests`);
    });
  });
});
