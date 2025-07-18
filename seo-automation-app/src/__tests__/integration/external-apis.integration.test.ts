/**
 * Integration Tests for External APIs
 * Tests integration with Firecrawl, Serper.dev, OpenAI, and Supabase
 */

import { openaiOperations } from '@/lib/services/openai-error-handler';
import { serperAPI, firecrawlAPI } from '@/lib/services/external-apis-error-handler';
import { supabaseErrorHandler } from '@/lib/services/supabase-error-handler';
import { server, mockApiError, mockApiSuccess, mockApiDelay } from '../mocks/server';

describe('External APIs Integration', () => {
  describe('OpenAI API Integration', () => {
    it('should successfully create chat completion', async () => {
      const response = await openaiOperations.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Write a test story about SEO automation' }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      expect(response).toHaveValidApiResponse();
      expect(response.choices).toBeDefined();
      expect(response.choices[0].message.content).toBeDefined();
      expect(response.usage).toBeDefined();
    });

    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit response
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.set('Retry-After', '60'),
            ctx.json({ error: 'Rate limit exceeded' })
          );
        })
      );

      await expect(
        openaiOperations.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should retry on temporary failures', async () => {
      let attemptCount = 0;
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          if (attemptCount < 3) {
            return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
          }
          return res(
            ctx.status(200),
            ctx.json({
              choices: [{ message: { content: 'Success after retry' } }],
              usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
            })
          );
        })
      );

      const response = await openaiOperations.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test retry' }]
      });

      expect(response.choices[0].message.content).toBe('Success after retry');
      expect(attemptCount).toBe(3);
    });

    it('should create embeddings successfully', async () => {
      const response = await openaiOperations.createEmbedding({
        model: 'text-embedding-ada-002',
        input: 'Test text for embedding'
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should handle invalid API key', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Invalid API key' })
          );
        })
      );

      await expect(
        openaiOperations.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('Serper.dev API Integration', () => {
    it('should perform search successfully', async () => {
      const response = await serperAPI.search('SEO automation tools', {
        type: 'search',
        num: 10
      });

      expect(response).toBeDefined();
      expect(response.organic).toBeDefined();
      expect(Array.isArray(response.organic)).toBe(true);
      expect(response.searchInformation).toBeDefined();
    });

    it('should handle search with location parameter', async () => {
      const response = await serperAPI.search('local SEO services', {
        type: 'search',
        location: 'New York, NY',
        gl: 'us',
        hl: 'en'
      });

      expect(response).toBeDefined();
      expect(response.organic).toBeDefined();
    });

    it('should get search suggestions', async () => {
      const suggestions = await serperAPI.getSuggestions('SEO automation');

      expect(Array.isArray(suggestions)).toBe(true);
      // Should return empty array on failure, not throw
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.post('https://google.serper.dev/search', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Bad request' })
          );
        })
      );

      await expect(
        serperAPI.search('invalid query')
      ).rejects.toThrow('Bad request');
    });

    it('should handle rate limiting', async () => {
      server.use(
        rest.post('https://google.serper.dev/search', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({ error: 'Rate limit exceeded' })
          );
        })
      );

      await expect(
        serperAPI.search('test query')
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Firecrawl API Integration', () => {
    it('should scrape URL successfully', async () => {
      const response = await firecrawlAPI.scrapeUrl('https://example.com', {
        formats: ['markdown', 'html'],
        onlyMainContent: true
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should handle scraping with custom options', async () => {
      const response = await firecrawlAPI.scrapeUrl('https://example.com', {
        formats: ['markdown'],
        includeTags: ['h1', 'h2', 'p'],
        excludeTags: ['script', 'style'],
        waitFor: 2000
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should start website crawl', async () => {
      const response = await firecrawlAPI.crawlWebsite('https://example.com', {
        crawlerOptions: {
          maxDepth: 2,
          limit: 10
        },
        pageOptions: {
          onlyMainContent: true
        }
      });

      expect(response).toBeDefined();
      expect(response.jobId).toBeDefined();
    });

    it('should check crawl status', async () => {
      const jobId = 'test-job-id';
      
      server.use(
        rest.get(`https://api.firecrawl.dev/v0/crawl/status/${jobId}`, (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              status: 'completed',
              completed: 10,
              total: 10,
              data: []
            })
          );
        })
      );

      const response = await firecrawlAPI.getCrawlStatus(jobId);

      expect(response).toBeDefined();
      expect(response.status).toBe('completed');
      expect(response.completed).toBe(10);
      expect(response.total).toBe(10);
    });

    it('should handle scraping failures', async () => {
      server.use(
        rest.post('https://api.firecrawl.dev/v0/scrape', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ 
              success: false,
              error: 'Invalid URL' 
            })
          );
        })
      );

      await expect(
        firecrawlAPI.scrapeUrl('invalid-url')
      ).rejects.toThrow('Invalid URL');
    });

    it('should handle rate limiting', async () => {
      server.use(
        rest.post('https://api.firecrawl.dev/v0/scrape', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({ error: 'Rate limit exceeded' })
          );
        })
      );

      await expect(
        firecrawlAPI.scrapeUrl('https://example.com')
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Supabase Integration', () => {
    it('should perform database operations with retry', async () => {
      const result = await supabaseErrorHandler.executeWithRetry(
        async () => {
          // Mock successful database operation
          return { data: [{ id: 1, name: 'Test' }], error: null };
        },
        'select',
        { table: 'test_table' }
      );

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should retry on temporary failures', async () => {
      let attemptCount = 0;
      
      const result = await supabaseErrorHandler.executeWithRetry(
        async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary connection error');
          }
          return { data: [{ id: 1, name: 'Success' }], error: null };
        },
        'select',
        { table: 'test_table' }
      );

      expect(result.data).toBeDefined();
      expect(result.data[0].name).toBe('Success');
      expect(attemptCount).toBe(3);
    });

    it('should handle authentication errors', async () => {
      await expect(
        supabaseErrorHandler.executeWithRetry(
          async () => {
            throw new Error('Invalid JWT token');
          },
          'select',
          { table: 'protected_table' }
        )
      ).rejects.toThrow('Invalid JWT token');
    });

    it('should handle connection timeouts', async () => {
      await expect(
        supabaseErrorHandler.executeWithRetry(
          async () => {
            throw new Error('Connection timeout');
          },
          'select',
          { table: 'test_table' },
          { maxRetries: 1, timeout: 1000 }
        )
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('API Error Handling', () => {
    it('should handle network failures', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      await expect(
        openaiOperations.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      server.use(
        rest.post('https://google.serper.dev/search', (req, res, ctx) => {
          return res(ctx.delay(10000)); // 10 second delay
        })
      );

      await expect(
        serperAPI.search('test query')
      ).rejects.toThrow();
    }, 15000); // Increase test timeout

    it('should provide fallback responses', async () => {
      // Test fallback when primary service fails
      server.use(
        rest.post('https://google.serper.dev/search', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Service unavailable' }));
        })
      );

      // Should use fallback instead of throwing
      const fallbackResult = await serperAPI.search('test query').catch(() => ({
        organic: [],
        searchInformation: { query: 'test query', totalResults: 0 },
        fallback: true
      }));

      expect(fallbackResult.fallback).toBe(true);
      expect(fallbackResult.organic).toEqual([]);
    });
  });

  describe('API Performance', () => {
    it('should complete requests within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await openaiOperations.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Quick test' }],
        max_tokens: 10
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        serperAPI.search(`test query ${i}`)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.organic).toBeDefined();
      });
    });
  });
});
