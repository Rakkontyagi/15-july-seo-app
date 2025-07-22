/**
 * Mock Service Worker Server Setup for SEO Automation App
 * Provides comprehensive API mocking for testing
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

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
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
        user: mockUser,
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600000,
        },
      }, { status: 200 });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
        user: mockUser,
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600000,
        },
      }, { status: 200 });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.get('/api/auth/user', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({ user: mockUser }, { status: 200 });
  }),

  // Projects endpoints
  http.get('/api/projects', () => {
    return HttpResponse.json({
        projects: [mockProject],
        total: 1,
        page: 1,
        limit: 10,
      }, { status: 200 });
  }),

  http.post('/api/projects', () => {
    return HttpResponse.json({ project: mockProject }, { status: 201 });
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const { id } = params;
    if (id === 'test-project-id') {
      return HttpResponse.json({ project: mockProject }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  }),

  http.put('/api/projects/:id', ({ params }) => {
    const { id } = params;
    if (id === 'test-project-id') {
      return HttpResponse.json({ project: mockProject }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  }),

  http.delete('/api/projects/:id', ({ params }) => {
    const { id } = params;
    if (id === 'test-project-id') {
      return HttpResponse.json({ success: true }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  }),

  // Stories endpoints
  http.get('/api/stories', () => {
    return HttpResponse.json({
        stories: [mockStory],
        total: 1,
        page: 1,
        limit: 10,
      }, { status: 200 });
  }),

  http.post('/api/stories', () => {
    return HttpResponse.json({ story: mockStory }, { status: 201 });
  }),

  http.get('/api/stories/:id', ({ params }) => {
    const { id } = params;
    if (id === 'test-story-id') {
      return HttpResponse.json({ story: mockStory }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Story not found' }, { status: 404 });
  }),

  http.put('/api/stories/:id', ({ params }) => {
    const { id } = params;
    if (id === 'test-story-id') {
      return HttpResponse.json({ story: mockStory }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Story not found' }, { status: 404 });
  }),

  http.delete('/api/stories/:id', ({ params }) => {
    const { id } = params;
    if (id === 'test-story-id') {
      return HttpResponse.json({ success: true }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Story not found' }, { status: 404 });
  }),

  // Content generation endpoints
  http.post('/api/content/generate', (req, res, ctx) => {
    return HttpResponse.json({
        content: 'Generated content with sufficient length for testing purposes and validation',
        metadata: {
          wordCount: 100,
          readingTime: 1,
          seoScore: 85,
        },
      }, { status: 200 });
  }),

  http.post('/api/content/analyze', (req, res, ctx) => {
    return HttpResponse.json({
        analysis: {
          seoScore: 85,
          readabilityScore: 90,
          keywordDensity: 2.5,
          suggestions: ['Add more headings', 'Include internal links'],
        },
      }, { status: 200 });
  }),

  // External API mocks
  http.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return HttpResponse.json({
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
      }, { status: 200 });
  }),

  http.post('https://google.serper.dev/search', (req, res, ctx) => {
    return HttpResponse.json({
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
      }, { status: 200 });
  }),

  http.post('https://api.firecrawl.dev/v0/scrape', (req, res, ctx) => {
    return HttpResponse.json({
        success: true,
        data: {
          content: 'Mock scraped content',
          metadata: {
            title: 'Mock Page Title',
            description: 'Mock page description',
          },
        },
      }, { status: 200 });
  }),

  // Stripe API mocks
  http.post('https://api.stripe.com/v1/customers', (req, res, ctx) => {
    return HttpResponse.json({
        id: 'cus_mock_customer',
        email: 'test@example.com',
        created: Date.now(),
      }, { status: 200 });
  }),

  http.post('https://api.stripe.com/v1/subscriptions', (req, res, ctx) => {
    return HttpResponse.json({
        id: 'sub_mock_subscription',
        status: 'active',
        current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }, { status: 200 });
  }),

  // Error scenarios for testing
  http.get('/api/error/500', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }),

  http.get('/api/error/404', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Not found' }));
  }),

  http.get('/api/error/timeout', (req, res, ctx) => {
    return res(ctx.delay(10000), ctx.status(408), ctx.json({ error: 'Timeout' }));
  }),

  // Rate limiting mock
  http.get('/api/rate-limited', (req, res, ctx) => {
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
    http.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(status), ctx.json({ error: message }));
    })
  );
};

export const mockApiSuccess = (endpoint: string, data: any) => {
  server.use(
    http.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(data));
    })
  );
};

export const mockApiDelay = (endpoint: string, delay: number) => {
  server.use(
    http.get(endpoint, (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json({ success: true }));
    })
  );
};
