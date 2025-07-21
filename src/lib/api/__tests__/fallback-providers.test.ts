import { FallbackProviderSystem } from '../fallback-providers';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../error-handler');
jest.mock('../health-monitor');

describe('Fallback Provider System', () => {
  let fallbackSystem: FallbackProviderSystem;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fallbackSystem = new FallbackProviderSystem();
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Registration and Management', () => {
    it('should register providers with correct configuration', () => {
      const providers = fallbackSystem.getProviders();
      
      expect(providers).toHaveProperty('serper');
      expect(providers).toHaveProperty('serpapi');
      expect(providers).toHaveProperty('scrapingbee');
      
      expect(providers.serper.priority).toBe(1);
      expect(providers.serpapi.priority).toBe(2);
      expect(providers.scrapingbee.priority).toBe(3);
    });

    it('should enable and disable providers', () => {
      fallbackSystem.disableProvider('serpapi');
      const providers = fallbackSystem.getProviders();
      
      expect(providers.serpapi.enabled).toBe(false);
      
      fallbackSystem.enableProvider('serpapi');
      expect(providers.serpapi.enabled).toBe(true);
    });

    it('should update provider priority', () => {
      fallbackSystem.updateProviderPriority('scrapingbee', 1);
      const providers = fallbackSystem.getProviders();
      
      expect(providers.scrapingbee.priority).toBe(1);
    });
  });

  describe('Provider Health Management', () => {
    it('should track provider health status', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ organic: [] }),
      } as Response);

      await fallbackSystem.search({
        query: 'test query',
        location: 'US'
      });

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.status).toBe('healthy');
      expect(health.successRate).toBeGreaterThan(0);
    });

    it('should mark provider as unhealthy after failures', async () => {
      // Mock multiple failures
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      for (let i = 0; i < 5; i++) {
        try {
          await fallbackSystem.search({
            query: 'test query',
            location: 'US'
          });
        } catch (error) {
          // Expected failures
        }
      }

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.status).toBe('unhealthy');
      expect(health.successRate).toBe(0);
    });

    it('should recover provider health after successful requests', async () => {
      // First, make provider unhealthy
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 3; i++) {
        try {
          await fallbackSystem.search({ query: 'test' });
        } catch (error) {
          // Expected
        }
      }

      // Then recover with successful requests
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ organic: [] }),
      } as Response);

      for (let i = 0; i < 5; i++) {
        await fallbackSystem.search({ query: 'test' });
      }

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.status).toBe('healthy');
      expect(health.successRate).toBeGreaterThan(0.5);
    });
  });

  describe('Automatic Failover Logic', () => {
    it('should failover to next provider when primary fails', async () => {
      // Mock serper failure, serpapi success
      mockFetch.mockImplementation((url) => {
        if (url.toString().includes('serper.dev')) {
          return Promise.reject(new Error('Serper unavailable'));
        }
        if (url.toString().includes('serpapi.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ organic: [{ title: 'SerpApi result' }] }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown provider'));
      });

      const result = await fallbackSystem.search({
        query: 'test query',
        location: 'US'
      });

      expect(result.organic).toHaveLength(1);
      expect(result.organic[0].title).toBe('SerpApi result');
      expect(result.provider).toBe('serpapi');
    });

    it('should try all providers before failing', async () => {
      // Mock all providers failing
      mockFetch.mockRejectedValue(new Error('All services unavailable'));

      await expect(fallbackSystem.search({
        query: 'test query',
        location: 'US'
      })).rejects.toThrow('All search providers failed');

      // Should have attempted all 3 providers
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should skip unhealthy providers', async () => {
      // Mark serper as unhealthy
      fallbackSystem.updateProviderHealth('serper', {
        status: 'unhealthy',
        lastCheck: Date.now(),
        responseTime: 0,
        successRate: 0,
        errorRate: 100
      });

      // Mock serpapi success
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ organic: [{ title: 'SerpApi result' }] }),
      } as Response);

      const result = await fallbackSystem.search({
        query: 'test query',
        location: 'US'
      });

      expect(result.provider).toBe('serpapi');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should skip serper
    });

    it('should respect provider priority order', async () => {
      // Change scrapingbee to highest priority
      fallbackSystem.updateProviderPriority('scrapingbee', 0);

      // Mock scrapingbee success
      mockFetch.mockImplementation((url) => {
        if (url.toString().includes('scrapingbee.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ organic: [{ title: 'ScrapingBee result' }] }),
          } as Response);
        }
        return Promise.reject(new Error('Other providers fail'));
      });

      const result = await fallbackSystem.search({
        query: 'test query',
        location: 'US'
      });

      expect(result.provider).toBe('scrapingbee');
      expect(result.organic[0].title).toBe('ScrapingBee result');
    });
  });

  describe('Provider-Specific Search Implementation', () => {
    it('should format Serper.dev requests correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          organic: [{ title: 'Test', link: 'https://example.com' }],
          searchInformation: { totalResults: 1 }
        }),
      } as Response);

      await fallbackSystem.search({
        query: 'test query',
        location: 'US',
        num: 10
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://google.serper.dev/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-KEY': expect.any(String),
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            q: 'test query',
            gl: 'US',
            num: 10
          })
        })
      );
    });

    it('should format SerpApi requests correctly', async () => {
      // Force use of SerpApi by disabling Serper
      fallbackSystem.disableProvider('serper');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          organic_results: [{ title: 'Test', link: 'https://example.com' }],
          search_information: { total_results: 1 }
        }),
      } as Response);

      await fallbackSystem.search({
        query: 'test query',
        location: 'US',
        num: 10
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('serpapi.com'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should format ScrapingBee requests correctly', async () => {
      // Force use of ScrapingBee
      fallbackSystem.disableProvider('serper');
      fallbackSystem.disableProvider('serpapi');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          organic_results: [{ title: 'Test', link: 'https://example.com' }]
        }),
      } as Response);

      await fallbackSystem.search({
        query: 'test query',
        location: 'US'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('scrapingbee.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-KEY': expect.any(String)
          })
        })
      );
    });
  });

  describe('Response Normalization', () => {
    it('should normalize different provider response formats', async () => {
      // Test Serper format
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic: [{ title: 'Test', link: 'https://example.com', snippet: 'Description' }],
          searchInformation: { totalResults: 1 }
        }),
      } as Response);

      const serperResult = await fallbackSystem.search({ query: 'test' });

      expect(serperResult.organic[0]).toEqual({
        title: 'Test',
        link: 'https://example.com',
        snippet: 'Description'
      });

      // Test SerpApi format (different structure)
      fallbackSystem.disableProvider('serper');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic_results: [{ title: 'Test', link: 'https://example.com', snippet: 'Description' }],
          search_information: { total_results: 1 }
        }),
      } as Response);

      const serpApiResult = await fallbackSystem.search({ query: 'test' });

      expect(serpApiResult.organic[0]).toEqual({
        title: 'Test',
        link: 'https://example.com',
        snippet: 'Description'
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times for each provider', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ organic: [] }),
            } as Response);
          }, 100); // 100ms delay
        });
      });

      await fallbackSystem.search({ query: 'test' });

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.responseTime).toBeGreaterThan(90);
      expect(health.responseTime).toBeLessThan(200);
    });

    it('should calculate success rates accurately', async () => {
      // 3 successes, 2 failures
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ organic: [] }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ organic: [] }) } as Response)
        .mockRejectedValueOnce(new Error('Failure'))
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ organic: [] }) } as Response);

      for (let i = 0; i < 5; i++) {
        try {
          await fallbackSystem.search({ query: 'test' });
        } catch (error) {
          // Expected failures
        }
      }

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.successRate).toBe(60); // 3/5 = 60%
      expect(health.errorRate).toBe(40); // 2/5 = 40%
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      await expect(fallbackSystem.search({
        query: 'test',
        timeout: 50 // Shorter than mock delay
      })).rejects.toThrow();

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.status).toBe('degraded');
    });

    it('should handle malformed responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: 'response' }),
      } as Response);

      await expect(fallbackSystem.search({ query: 'test' }))
        .rejects.toThrow('Invalid response format');
    });

    it('should handle rate limiting responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' }),
      } as Response);

      await expect(fallbackSystem.search({ query: 'test' }))
        .rejects.toThrow('Rate limited');

      const health = fallbackSystem.getProviderHealth('serper');
      expect(health.status).toBe('degraded');
    });
  });
});
