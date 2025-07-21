import { apiErrorHandler } from '../error-handler';
import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logApiCall: jest.fn(),
  }
}));

describe('Circuit Breaker Pattern', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Circuit Breaker State Management', () => {
    it('should start in CLOSED state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await apiErrorHandler.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET'
      });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should transition to OPEN state after threshold failures', async () => {
      const serviceName = 'api.example.com';
      
      // Mock 5 consecutive failures (threshold)
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      // Trigger 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await apiErrorHandler.makeRequest({
            url: 'https://api.example.com/test',
            method: 'GET',
            retries: 0 // No retries for faster testing
          });
        } catch (error) {
          // Expected failures
        }
      }

      // 6th request should fail immediately due to open circuit
      const startTime = Date.now();
      try {
        await apiErrorHandler.makeRequest({
          url: 'https://api.example.com/test',
          method: 'GET'
        });
      } catch (error) {
        const endTime = Date.now();
        expect(error.message).toContain('circuit breaker open');
        expect(endTime - startTime).toBeLessThan(100); // Should fail fast
      }

      // Should have made 5 actual requests, 6th blocked by circuit breaker
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should transition to HALF_OPEN state after timeout', async () => {
      const serviceName = 'api.example.com';
      
      // Open the circuit with failures
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Mock time passage (circuit breaker timeout is 60 seconds)
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(Date.now()) // Current time for circuit check
        .mockReturnValueOnce(Date.now() + 61000); // 61 seconds later

      // Next request should attempt to call service (HALF_OPEN)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await errorHandler.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET'
      });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(6); // 5 failures + 1 recovery attempt
    });

    it('should close circuit after successful HALF_OPEN request', async () => {
      // Open circuit
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Mock time passage
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000);

      // Successful recovery
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // First request should succeed (HALF_OPEN -> CLOSED)
      await errorHandler.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET'
      });

      // Second request should also succeed (circuit is CLOSED)
      await errorHandler.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET'
      });

      expect(mockFetch).toHaveBeenCalledTimes(7); // 5 failures + 2 successful
    });

    it('should reopen circuit if HALF_OPEN request fails', async () => {
      // Open circuit
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Mock time passage
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000);

      // Failed recovery attempt
      mockFetch.mockRejectedValueOnce(new Error('Still failing'));

      try {
        await errorHandler.makeRequest({
          url: 'https://api.example.com/test',
          retries: 0
        });
      } catch (error) {
        // Expected failure
      }

      // Next immediate request should be blocked (circuit reopened)
      try {
        await errorHandler.makeRequest({
          url: 'https://api.example.com/test',
          method: 'GET'
        });
      } catch (error) {
        expect(error.message).toContain('circuit breaker open');
      }

      expect(mockFetch).toHaveBeenCalledTimes(6); // 5 initial + 1 failed recovery
    });
  });

  describe('Circuit Breaker with Fallback', () => {
    it('should use fallback when circuit is open', async () => {
      // Open circuit
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Request with fallback
      const fallbackData = { fallback: true, data: 'cached' };
      const fallbackFn = jest.fn().mockResolvedValue(fallbackData);

      const result = await errorHandler.makeRequest({
        url: 'https://api.example.com/test',
        fallback: fallbackFn
      });

      expect(result).toEqual(fallbackData);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(5); // Only initial failures
    });

    it('should not use fallback when circuit is closed', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const fallbackFn = jest.fn().mockResolvedValue({ fallback: true });

      const result = await errorHandler.makeRequest({
        url: 'https://api.example.com/test',
        fallback: fallbackFn
      });

      expect(result).toEqual({ success: true });
      expect(fallbackFn).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Per-Service Circuit Breakers', () => {
    it('should maintain separate circuit states per service', async () => {
      // Fail service A
      mockFetch.mockImplementation((url) => {
        if (url.toString().includes('service-a.com')) {
          return Promise.reject(new Error('Service A unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      });

      // Open circuit for service A
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://service-a.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Service B should still work
      const resultB = await errorHandler.makeRequest({
        url: 'https://service-b.com/test'
      });

      expect(resultB).toEqual({ success: true });

      // Service A should be blocked
      try {
        await errorHandler.makeRequest({
          url: 'https://service-a.com/test'
        });
      } catch (error) {
        expect(error.message).toContain('circuit breaker open');
      }

      expect(mockFetch).toHaveBeenCalledTimes(6); // 5 service A failures + 1 service B success
    });
  });

  describe('Circuit Breaker Configuration', () => {
    it('should respect custom failure threshold', async () => {
      const customHandler = new ApiErrorHandler({
        circuitBreakerThreshold: 3 // Custom threshold
      });

      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      // Should open after 3 failures instead of 5
      for (let i = 0; i < 3; i++) {
        try {
          await customHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // 4th request should be blocked
      try {
        await customHandler.makeRequest({
          url: 'https://api.example.com/test'
        });
      } catch (error) {
        expect(error.message).toContain('circuit breaker open');
      }

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should respect custom timeout duration', async () => {
      const customHandler = new ApiErrorHandler({
        circuitBreakerTimeout: 5000 // 5 seconds instead of 60
      });

      // Open circuit
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 5; i++) {
        try {
          await customHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Mock 6 seconds passage
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6000);

      // Should attempt recovery
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await customHandler.makeRequest({
        url: 'https://api.example.com/test'
      });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });

  describe('Circuit Breaker Metrics', () => {
    it('should track circuit breaker state changes', async () => {
      const stateChanges: string[] = [];
      
      // Mock state tracking (would integrate with actual metrics)
      const originalMakeRequest = errorHandler.makeRequest.bind(errorHandler);
      errorHandler.makeRequest = async function(config) {
        const serviceName = this.extractServiceName(config.url);
        const state = this.getCircuitState(serviceName);
        stateChanges.push(`${serviceName}:${state}`);
        return originalMakeRequest(config);
      };

      // Open circuit
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.makeRequest({
            url: 'https://api.example.com/test',
            retries: 0
          });
        } catch (error) {
          // Expected
        }
      }

      // Check state transitions
      expect(stateChanges).toContain('api.example.com:CLOSED');
      expect(stateChanges).toContain('api.example.com:OPEN');
    });
  });
});
