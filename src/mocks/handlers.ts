/**
 * MSW Request Handlers
 * Following Quinn's recommendation for comprehensive external API mocking
 * 
 * This module provides realistic mock responses for all external APIs:
 * - OpenAI GPT-4 API
 * - Serper.dev SERP API
 * - Firecrawl content extraction API
 * - Supabase API endpoints
 */

import { http, HttpResponse } from 'msw';
import { serpMockData } from './data/serp-mock-data';
import { firecrawlMockData } from './data/firecrawl-mock-data';
import { openaiMockData } from './data/openai-mock-data';

// OpenAI API Handlers
export const openaiHandlers = [
  // Chat Completions
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any;
    const model = body.model || 'gpt-4-turbo-preview';
    const messages = body.messages || [];
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate realistic response based on request
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const isContentGeneration = lastMessage?.content?.includes('content') || 
                               lastMessage?.content?.includes('article') ||
                               lastMessage?.content?.includes('blog');
    
    if (isContentGeneration) {
      return HttpResponse.json(openaiMockData.contentGenerationResponse);
    }
    
    return HttpResponse.json(openaiMockData.defaultChatResponse);
  }),

  // Embeddings
  http.post('https://api.openai.com/v1/embeddings', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return HttpResponse.json(openaiMockData.embeddingsResponse);
  }),

  // Models
  http.get('https://api.openai.com/v1/models', () => {
    return HttpResponse.json(openaiMockData.modelsResponse);
  }),
];

// Serper.dev API Handlers
export const serperHandlers = [
  // Google Search
  http.post('https://google.serper.dev/search', async ({ request }) => {
    const body = await request.json() as any;
    const query = body.q || '';
    const location = body.gl || 'us';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // Return location-specific results
    const mockData = serpMockData.getSearchResults(query, location);
    return HttpResponse.json(mockData);
  }),

  // Google Images
  http.post('https://google.serper.dev/images', async ({ request }) => {
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 600));
    return HttpResponse.json(serpMockData.getImageResults(body.q));
  }),

  // Google News
  http.post('https://google.serper.dev/news', async ({ request }) => {
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 700));
    return HttpResponse.json(serpMockData.getNewsResults(body.q));
  }),
];

// Firecrawl API Handlers
export const firecrawlHandlers = [
  // Scrape URL
  http.post('https://api.firecrawl.dev/v0/scrape', async ({ request }) => {
    const body = await request.json() as any;
    const url = body.url || '';
    
    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Return realistic scraped content
    const mockData = firecrawlMockData.getScrapeResult(url);
    return HttpResponse.json(mockData);
  }),

  // Crawl website
  http.post('https://api.firecrawl.dev/v0/crawl', async ({ request }) => {
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return HttpResponse.json({
      success: true,
      jobId: `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Crawl job started successfully',
    });
  }),

  // Get crawl status
  http.get('https://api.firecrawl.dev/v0/crawl/status/:jobId', async ({ params }) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return HttpResponse.json({
      success: true,
      status: 'completed',
      current: 10,
      total: 10,
      data: firecrawlMockData.getCrawlResults(),
    });
  }),
];

// Supabase API Handlers
export const supabaseHandlers = [
  // Authentication
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (body.grant_type === 'password') {
      return HttpResponse.json({
        access_token: 'mock_access_token_' + Date.now(),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh_token_' + Date.now(),
        user: {
          id: 'mock_user_id',
          email: body.email,
          created_at: new Date().toISOString(),
        },
      });
    }
    
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }),

  // Database queries
  http.get('*/rest/v1/*', async ({ request }) => {
    const url = new URL(request.url);
    const table = url.pathname.split('/').pop();
    
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Return mock data based on table
    switch (table) {
      case 'projects':
        return HttpResponse.json([
          {
            id: '1',
            name: 'SEO Project 1',
            description: 'Mock project for testing',
            created_at: new Date().toISOString(),
          },
        ]);
      
      case 'content':
        return HttpResponse.json([
          {
            id: '1',
            title: 'Mock Content Title',
            content: 'Mock content body...',
            status: 'published',
            created_at: new Date().toISOString(),
          },
        ]);
      
      default:
        return HttpResponse.json([]);
    }
  }),

  // Database mutations
  http.post('*/rest/v1/*', async ({ request }) => {
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return HttpResponse.json({
      ...body,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),
];

// Internal API Handlers (for our own API routes)
export const internalApiHandlers = [
  // Content generation
  http.post('/api/content/generate', async ({ request }) => {
    const body = await request.json() as any;
    
    // Simulate content generation process
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
    
    return HttpResponse.json({
      success: true,
      content: {
        title: `Generated: ${body.topic || 'Sample Topic'}`,
        content: `# ${body.topic || 'Sample Topic'}\n\nThis is a mock generated content for testing purposes. The content would normally be much longer and more detailed.\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\n\nThis concludes the mock content generation.`,
        wordCount: 150,
        seoScore: 95,
        readabilityScore: 88,
        metadata: {
          keywords: body.keywords || ['sample', 'mock', 'testing'],
          generatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Competitor analysis
  http.post('/api/analysis/competitors', async ({ request }) => {
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return HttpResponse.json({
      success: true,
      analysis: {
        competitors: [
          {
            url: 'https://example1.com',
            title: 'Competitor 1',
            wordCount: 2500,
            keywordDensity: 2.3,
            headings: { h1: 1, h2: 5, h3: 8 },
          },
          {
            url: 'https://example2.com',
            title: 'Competitor 2',
            wordCount: 3200,
            keywordDensity: 1.8,
            headings: { h1: 1, h2: 7, h3: 12 },
          },
        ],
        averages: {
          wordCount: 2850,
          keywordDensity: 2.05,
          headingCount: 6,
        },
      },
    });
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        openai: 'connected',
        serper: 'connected',
        firecrawl: 'connected',
      },
    });
  }),
];

// Error simulation handlers (for testing error scenarios)
export const errorHandlers = [
  // Simulate OpenAI rate limit
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json(
      { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
      { status: 429 }
    );
  }),

  // Simulate Serper API error
  http.post('https://google.serper.dev/search', () => {
    return HttpResponse.json(
      { error: 'API quota exceeded' },
      { status: 403 }
    );
  }),

  // Simulate Firecrawl timeout
  http.post('https://api.firecrawl.dev/v0/scrape', () => {
    return HttpResponse.json(
      { error: 'Request timeout' },
      { status: 408 }
    );
  }),
];

// Combine all handlers
export const handlers = [
  ...openaiHandlers,
  ...serperHandlers,
  ...firecrawlHandlers,
  ...supabaseHandlers,
  ...internalApiHandlers,
];

// Export error handlers separately for testing error scenarios
export { errorHandlers };
