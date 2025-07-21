import { HealthMonitor } from '../health-monitor';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../logging/logger');

describe('Health Monitor', () => {
  let healthMonitor: HealthMonitor;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    healthMonitor = new HealthMonitor({
      checkInterval: 1000, // 1 second for testing
      alertThreshold: 2,
      services: [
        {
          name: 'serper',
          url: 'https://google.serper.dev/search',
          method: 'POST',
          timeout: 5000,
          expectedStatus: 200,
          headers: { 'X-API-KEY': 'test-key' },
          body: { q: 'health check' }
        },
        {
          name: 'serpapi',
          url: 'https://serpapi.com/search',
          method: 'GET',
          timeout: 5000,
          expectedStatus: 200
        }
      ]
    });

    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    healthMonitor.stop();
    jest.restoreAllMocks();
  });

  describe('Health Check Execution', () => {
    it('should perform health checks for all configured services', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      await healthMonitor.checkAllServices();

      expect(mockFetch).toHaveBeenCalledTimes(2); // serper + serpapi
      
      const serperHealth = healthMonitor.getServiceHealth('serper');
      const serpapiHealth = healthMonitor.getServiceHealth('serpapi');
      
      expect(serperHealth.status).toBe('healthy');
      expect(serpapiHealth.status).toBe('healthy');
    });

    it('should detect unhealthy services', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.toString().includes('serper.dev')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Internal server error' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'ok' }),
        } as Response);
      });

      await healthMonitor.checkAllServices();

      const serperHealth = healthMonitor.getServiceHealth('serper');
      const serpapiHealth = healthMonitor.getServiceHealth('serpapi');
      
      expect(serperHealth.status).toBe('unhealthy');
      expect(serpapiHealth.status).toBe('healthy');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      await healthMonitor.checkAllServices();

      const serperHealth = healthMonitor.getServiceHealth('serper');
      expect(serperHealth.status).toBe('unhealthy');
      expect(serperHealth.lastError).toContain('timeout');
    });

    it('should track response times', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ status: 'ok' }),
            } as Response);
          }, 150); // 150ms delay
        });
      });

      await healthMonitor.checkAllServices();

      const serperHealth = healthMonitor.getServiceHealth('serper');
      expect(serperHealth.responseTime).toBeGreaterThan(140);
      expect(serperHealth.responseTime).toBeLessThan(200);
    });
  });

  describe('Health Status Management', () => {
    it('should maintain health history', async () => {
      // First check - healthy
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      await healthMonitor.checkService('serper');

      // Second check - unhealthy
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response);

      await healthMonitor.checkService('serper');

      const history = healthMonitor.getServiceHistory('serper');
      expect(history).toHaveLength(2);
      expect(history[0].status).toBe('healthy');
      expect(history[1].status).toBe('unhealthy');
    });

    it('should calculate uptime percentage', async () => {
      // 3 healthy, 2 unhealthy checks
      const responses = [
        { ok: true, status: 200 },
        { ok: true, status: 200 },
        { ok: false, status: 500 },
        { ok: false, status: 500 },
        { ok: true, status: 200 }
      ];

      for (const response of responses) {
        mockFetch.mockResolvedValueOnce({
          ...response,
          json: () => Promise.resolve({}),
        } as Response);

        await healthMonitor.checkService('serper');
      }

      const health = healthMonitor.getServiceHealth('serper');
      expect(health.uptime).toBe(60); // 3/5 = 60%
    });

    it('should detect service degradation', async () => {
      // Slow but successful responses
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ status: 'ok' }),
            } as Response);
          }, 8000); // 8 seconds - very slow
        });
      });

      await healthMonitor.checkService('serper');

      const health = healthMonitor.getServiceHealth('serper');
      expect(health.status).toBe('degraded'); // Slow response = degraded
    });
  });

  describe('Alerting System', () => {
    it('should trigger alerts for consecutive failures', async () => {
      const alertSpy = jest.fn();
      healthMonitor.on('alert', alertSpy);

      // Mock consecutive failures
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      // Trigger failures equal to alert threshold
      for (let i = 0; i < 2; i++) {
        await healthMonitor.checkService('serper');
      }

      expect(alertSpy).toHaveBeenCalledWith({
        service: 'serper',
        type: 'service_down',
        message: expect.stringContaining('consecutive failures'),
        severity: 'high',
        timestamp: expect.any(Number)
      });
    });

    it('should trigger recovery alerts', async () => {
      const alertSpy = jest.fn();
      healthMonitor.on('alert', alertSpy);

      // First make service unhealthy
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 2; i++) {
        await healthMonitor.checkService('serper');
      }

      // Then recover
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      await healthMonitor.checkService('serper');

      expect(alertSpy).toHaveBeenCalledWith({
        service: 'serper',
        type: 'service_recovered',
        message: expect.stringContaining('recovered'),
        severity: 'info',
        timestamp: expect.any(Number)
      });
    });

    it('should trigger degradation alerts for slow responses', async () => {
      const alertSpy = jest.fn();
      healthMonitor.on('alert', alertSpy);

      // Mock slow responses
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ status: 'ok' }),
            } as Response);
          }, 7000); // 7 seconds
        });
      });

      await healthMonitor.checkService('serper');

      expect(alertSpy).toHaveBeenCalledWith({
        service: 'serper',
        type: 'service_degraded',
        message: expect.stringContaining('slow response'),
        severity: 'medium',
        timestamp: expect.any(Number)
      });
    });

    it('should not spam alerts for known issues', async () => {
      const alertSpy = jest.fn();
      healthMonitor.on('alert', alertSpy);

      // Mock multiple consecutive failures
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      // Should only alert once for the same issue
      for (let i = 0; i < 5; i++) {
        await healthMonitor.checkService('serper');
      }

      const serviceDownAlerts = alertSpy.mock.calls.filter(
        call => call[0].type === 'service_down'
      );
      expect(serviceDownAlerts).toHaveLength(1);
    });
  });

  describe('Automatic Health Monitoring', () => {
    it('should start and stop automatic monitoring', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      healthMonitor.start();

      // Wait for at least one check cycle
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(mockFetch).toHaveBeenCalled();

      healthMonitor.stop();

      // Clear previous calls
      mockFetch.mockClear();

      // Wait another cycle - should not make more calls
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle errors during automatic monitoring', async () => {
      const errorSpy = jest.fn();
      healthMonitor.on('error', errorSpy);

      mockFetch.mockRejectedValue(new Error('Network error'));

      healthMonitor.start();
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(errorSpy).not.toHaveBeenCalled(); // Should handle gracefully
      
      const health = healthMonitor.getServiceHealth('serper');
      expect(health.status).toBe('unhealthy');

      healthMonitor.stop();
    });
  });

  describe('Service Configuration', () => {
    it('should add new services dynamically', () => {
      healthMonitor.addService({
        name: 'scrapingbee',
        url: 'https://app.scrapingbee.com/api/v1',
        method: 'POST',
        timeout: 5000,
        expectedStatus: 200
      });

      const services = healthMonitor.getServices();
      expect(services).toHaveLength(3);
      expect(services.find(s => s.name === 'scrapingbee')).toBeDefined();
    });

    it('should remove services', () => {
      healthMonitor.removeService('serpapi');

      const services = healthMonitor.getServices();
      expect(services).toHaveLength(1);
      expect(services.find(s => s.name === 'serpapi')).toBeUndefined();
    });

    it('should update service configuration', () => {
      healthMonitor.updateService('serper', {
        timeout: 10000,
        expectedStatus: 201
      });

      const services = healthMonitor.getServices();
      const serperService = services.find(s => s.name === 'serper');
      
      expect(serperService?.timeout).toBe(10000);
      expect(serperService?.expectedStatus).toBe(201);
    });
  });

  describe('Metrics and Analytics', () => {
    it('should provide overall system health', async () => {
      // Mock mixed health states
      mockFetch.mockImplementation((url) => {
        if (url.toString().includes('serper.dev')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'ok' }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
        } as Response);
      });

      await healthMonitor.checkAllServices();

      const systemHealth = healthMonitor.getSystemHealth();
      expect(systemHealth.overallStatus).toBe('degraded'); // Mixed health
      expect(systemHealth.healthyServices).toBe(1);
      expect(systemHealth.unhealthyServices).toBe(1);
      expect(systemHealth.totalServices).toBe(2);
    });

    it('should export health metrics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      await healthMonitor.checkAllServices();

      const metrics = healthMonitor.exportMetrics();
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('services');
      expect(metrics.services).toHaveProperty('serper');
      expect(metrics.services).toHaveProperty('serpapi');
    });
  });
});
