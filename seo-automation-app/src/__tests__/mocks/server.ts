/**
 * Mock Service Worker Server Setup for SEO Automation App
 * Provides comprehensive API mocking for testing
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProject = {
  id: 'test-project-id',
  name: 'Test Project',
  description: 'Test project description',
  user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockStory = {
  id: 'test-story-id',
  title: 'Test Story',
  content: 'Test story content with sufficient length for validation',
  project_id: 'test-project-id',
  status: 'draft',
  seo_metadata: {
    title: 'Test Story SEO Title',
    description: 'Test story SEO description with sufficient length for proper SEO validation and testing purposes in our application',
    keywords: ['test', 'story', 'seo'],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// API handlers
const handlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockUser,
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600000,
        },
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        user: mockUser,
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600000,
        },
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  rest.get('/api/auth/user', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }
    return res(ctx.status(200), ctx.json({ user: mockUser }));
  }),

  // Projects endpoints
  rest.get('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        projects: [mockProject],
        total: 1,
        page: 1,
        limit: 10,
      })
    );
  }),

  rest.post('/api/projects', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ project: mockProject }));
  }),

  rest.get('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'test-project-id') {
      return res(ctx.status(200), ctx.json({ project: mockProject }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Project not found' }));
  }),

  rest.put('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'test-project-id') {
      return res(ctx.status(200), ctx.json({ project: mockProject }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Project not found' }));
  }),

  rest.delete('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'test-project-id') {
      return res(ctx.status(200), ctx.json({ success: true }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Project not found' }));
  }),

  // Stories endpoints
  rest.get('/api/stories', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        stories: [mockStory],
        total: 1,
        page: 1,
        limit: 10,
      })
    );
  }),

  rest.post('/api/stories', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ story: mockStory }));
  }),

  rest.get('/api/stories/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'test-story-id') {
      return res(ctx.status(200), ctx.json({ story: mockStory }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Story not found' }));
  }),

  rest.put('/api/stories/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'test-story-id') {
      return res(ctx.status(200), ctx.json({ story: mockStory }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Story not found' }));
  }),

  rest.delete('/api/stories/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'test-story-id') {
      return res(ctx.status(200), ctx.json({ success: true }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Story not found' }));
  }),

  // Content generation endpoints
  rest.post('/api/content/generate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        content: 'Generated content with sufficient length for testing purposes and validation',
        metadata: {
          wordCount: 100,
          readingTime: 1,
          seoScore: 85,
        },
      })
    );
  }),

  rest.post('/api/content/analyze', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        analysis: {
          seoScore: 85,
          readabilityScore: 90,
          keywordDensity: 2.5,
          suggestions: ['Add more headings', 'Include internal links'],
        },
      })
    );
  }),

  // External API mocks
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        choices: [
          {
            message: {
              content: 'Mock OpenAI response for testing purposes',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })
    );
  }),

  rest.post('https://google.serper.dev/search', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        organic: [
          {
            title: 'Mock Search Result',
            link: 'https://example.com',
            snippet: 'Mock search result snippet',
          },
        ],
        searchInformation: {
          totalResults: 1,
          timeTaken: 0.5,
        },
      })
    );
  }),

  rest.post('https://api.firecrawl.dev/v0/scrape', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          content: 'Mock scraped content',
          metadata: {
            title: 'Mock Page Title',
            description: 'Mock page description',
          },
        },
      })
    );
  }),

  // Stripe API mocks
  rest.post('https://api.stripe.com/v1/customers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'cus_mock_customer',
        email: 'test@example.com',
        created: Date.now(),
      })
    );
  }),

  rest.post('https://api.stripe.com/v1/subscriptions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'sub_mock_subscription',
        status: 'active',
        current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
      })
    );
  }),

  // Error scenarios for testing
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Not found' }));
  }),

  rest.get('/api/error/timeout', (req, res, ctx) => {
    return res(ctx.delay(10000), ctx.status(408), ctx.json({ error: 'Timeout' }));
  }),

  // Rate limiting mock
  rest.get('/api/rate-limited', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.set('Retry-After', '60'),
      ctx.json({ error: 'Rate limit exceeded' })
    );
  }),
];

// Create server instance
export const server = setupServer(...handlers);

// Export handlers for individual test customization
export { handlers };

// Helper functions for test customization
export const mockApiError = (endpoint: string, status: number, message: string) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(status), ctx.json({ error: message }));
    })
  );
};

export const mockApiSuccess = (endpoint: string, data: any) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(data));
    })
  );
};

export const mockApiDelay = (endpoint: string, delay: number) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json({ success: true }));
    })
  );
};
