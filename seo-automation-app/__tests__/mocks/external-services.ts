/**
 * Mock implementations for external services
 * Used in integration and unit tests
 */

// Mock Serper.dev API
export const mockSerperAPI = {
  search: jest.fn().mockResolvedValue({
    searchParameters: {
      q: 'test keyword',
      location: 'United States',
      hl: 'en',
      gl: 'us',
      type: 'search',
    },
    organic: [
      {
        position: 1,
        title: 'Top SEO Guide | Complete SEO Tutorial',
        link: 'https://example1.com/seo-guide',
        displayed_link: 'https://example1.com › seo-guide',
        snippet: 'The complete guide to SEO optimization and best practices...',
        date: '2023-01-01',
        sitelinks: [
          {
            title: 'SEO Basics',
            link: 'https://example1.com/seo-guide/basics',
          },
        ],
      },
      {
        position: 2,
        title: 'Advanced SEO Techniques | Expert Tips',
        link: 'https://example2.com/advanced-seo',
        displayed_link: 'https://example2.com › advanced-seo',
        snippet: 'Learn advanced SEO techniques to boost your rankings...',
        date: '2023-01-02',
      },
      {
        position: 3,
        title: 'SEO Tools and Resources | Free and Paid',
        link: 'https://example3.com/seo-tools',
        displayed_link: 'https://example3.com › seo-tools',
        snippet: 'Discover the best SEO tools for keyword research and analysis...',
        date: '2023-01-03',
      },
    ],
    peopleAlsoAsk: [
      {
        question: 'What is SEO?',
        snippet: 'SEO stands for Search Engine Optimization...',
        title: 'SEO Definition - Digital Marketing Guide',
        link: 'https://example.com/seo-definition',
      },
    ],
    relatedSearches: [
      {
        query: 'seo best practices',
      },
      {
        query: 'seo tutorial for beginners',
      },
    ],
  }),
  
  // Mock error scenarios
  searchError: jest.fn().mockRejectedValue(new Error('Serper API error')),
  
  // Mock rate limit scenario
  searchRateLimit: jest.fn().mockRejectedValue({
    status: 429,
    message: 'Rate limit exceeded',
  }),
}

// Mock Firecrawl API
export const mockFirecrawlAPI = {
  scrape: jest.fn().mockResolvedValue({
    success: true,
    data: {
      content: `
        <article>
          <h1>The Ultimate SEO Guide</h1>
          <p>Search Engine Optimization (SEO) is the practice of optimizing your website...</p>
          <h2>Key SEO Factors</h2>
          <ul>
            <li>Content Quality</li>
            <li>Technical SEO</li>
            <li>Backlinks</li>
            <li>User Experience</li>
          </ul>
          <p>Implementing these strategies will help improve your search rankings...</p>
        </article>
      `,
      markdown: `
# The Ultimate SEO Guide

Search Engine Optimization (SEO) is the practice of optimizing your website...

## Key SEO Factors

- Content Quality
- Technical SEO
- Backlinks
- User Experience

Implementing these strategies will help improve your search rankings...
      `,
      metadata: {
        title: 'The Ultimate SEO Guide',
        description: 'Complete guide to SEO optimization and best practices',
        language: 'en',
        sourceURL: 'https://example1.com/seo-guide',
        statusCode: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-length': '1234',
        },
      },
      linksOnPage: [
        'https://example1.com/seo-guide/basics',
        'https://example1.com/seo-guide/advanced',
        'https://example1.com/contact',
      ],
      screenshot: 'https://firecrawl.dev/screenshots/example1.png',
    },
  }),
  
  // Mock batch scraping
  scrapeMultiple: jest.fn().mockResolvedValue([
    {
      url: 'https://example1.com/seo-guide',
      success: true,
      data: {
        content: '<h1>SEO Guide</h1><p>Content...</p>',
        markdown: '# SEO Guide\n\nContent...',
        metadata: {
          title: 'SEO Guide',
          description: 'Complete SEO guide',
          sourceURL: 'https://example1.com/seo-guide',
        },
      },
    },
    {
      url: 'https://example2.com/advanced-seo',
      success: true,
      data: {
        content: '<h1>Advanced SEO</h1><p>Advanced content...</p>',
        markdown: '# Advanced SEO\n\nAdvanced content...',
        metadata: {
          title: 'Advanced SEO',
          description: 'Advanced SEO techniques',
          sourceURL: 'https://example2.com/advanced-seo',
        },
      },
    },
  ]),
  
  // Mock error scenarios
  scrapeError: jest.fn().mockRejectedValue(new Error('Firecrawl API error')),
  
  // Mock timeout scenario
  scrapeTimeout: jest.fn().mockRejectedValue(new Error('Request timeout')),
}

// Mock OpenAI API
export const mockOpenAIAPI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: 1700000000,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: `# SEO Best Practices for 2024

Search Engine Optimization remains crucial for online visibility. Here are the key strategies:

## Content Quality
Create valuable, original content that addresses user intent. Focus on:
- Comprehensive topic coverage
- Clear, engaging writing style
- Regular content updates
- Proper keyword integration

## Technical SEO
Ensure your website is technically sound:
- Fast loading speeds
- Mobile responsiveness
- Proper URL structure
- XML sitemaps

## User Experience
Optimize for user satisfaction:
- Intuitive navigation
- Clear calls-to-action
- Accessible design
- Engaging multimedia

Implementing these practices will improve your search rankings and user engagement.`,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 180,
          total_tokens: 330,
        },
      }),
    },
  },
  
  // Mock error scenarios
  chatError: jest.fn().mockRejectedValue(new Error('OpenAI API error')),
  
  // Mock rate limit scenario
  chatRateLimit: jest.fn().mockRejectedValue({
    status: 429,
    message: 'Rate limit exceeded',
  }),
}

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Date.now() + 3600000,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: '2023-01-01T00:00:00.000Z',
          },
        },
      },
      error: null,
    }),
    
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00.000Z',
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Date.now() + 3600000,
        },
      },
      error: null,
    }),
    
    signUp: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00.000Z',
        },
        session: null,
      },
      error: null,
    }),
    
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
  },
  
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'test-id',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      },
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: {
        id: 'test-id',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      },
      error: null,
    }),
  })),
  
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({
        data: {
          path: 'test-file.txt',
          id: 'test-id',
          fullPath: 'bucket/test-file.txt',
        },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['test content'], { type: 'text/plain' }),
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      list: jest.fn().mockResolvedValue({
        data: [
          {
            name: 'test-file.txt',
            id: 'test-id',
            updated_at: '2023-01-01T00:00:00.000Z',
            created_at: '2023-01-01T00:00:00.000Z',
            last_accessed_at: '2023-01-01T00:00:00.000Z',
            metadata: {},
          },
        ],
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: {
          publicUrl: 'https://supabase.co/storage/v1/object/public/bucket/test-file.txt',
        },
      }),
    })),
  },
  
  realtime: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
  },
}

// Mock Stripe API
export const mockStripeAPI = {
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      created: 1700000000,
      default_source: null,
      invoice_settings: {
        default_payment_method: null,
      },
    }),
    
    retrieve: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      created: 1700000000,
      subscriptions: {
        data: [
          {
            id: 'sub_test123',
            status: 'active',
            current_period_end: 1700000000 + 30 * 24 * 60 * 60,
            items: {
              data: [
                {
                  price: {
                    id: 'price_test123',
                    nickname: 'Pro Plan',
                    unit_amount: 2900,
                    currency: 'usd',
                    recurring: {
                      interval: 'month',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    }),
  },
  
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      current_period_end: 1700000000 + 30 * 24 * 60 * 60,
      customer: 'cus_test123',
      items: {
        data: [
          {
            price: {
              id: 'price_test123',
              nickname: 'Pro Plan',
              unit_amount: 2900,
              currency: 'usd',
              recurring: {
                interval: 'month',
              },
            },
          },
        ],
      },
    }),
    
    update: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      current_period_end: 1700000000 + 30 * 24 * 60 * 60,
      customer: 'cus_test123',
    }),
    
    cancel: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'canceled',
      canceled_at: 1700000000,
    }),
  },
  
  prices: {
    list: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'price_test123',
          nickname: 'Pro Plan',
          unit_amount: 2900,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
        },
      ],
    }),
  },
}

// Export all mocks
export const externalServiceMocks = {
  serper: mockSerperAPI,
  firecrawl: mockFirecrawlAPI,
  openai: mockOpenAIAPI,
  supabase: mockSupabaseClient,
  stripe: mockStripeAPI,
}

// Helper function to setup all mocks
export const setupExternalServiceMocks = () => {
  // Mock modules
  jest.doMock('@/lib/services/serper', () => mockSerperAPI)
  jest.doMock('@/lib/services/firecrawl', () => mockFirecrawlAPI)
  jest.doMock('@/lib/services/openai', () => mockOpenAIAPI)
  jest.doMock('@/lib/supabase/client', () => ({ createClient: () => mockSupabaseClient }))
  jest.doMock('stripe', () => mockStripeAPI)
}

// Helper function to reset all mocks
export const resetExternalServiceMocks = () => {
  Object.values(externalServiceMocks).forEach(mockService => {
    if (typeof mockService === 'object') {
      Object.values(mockService).forEach(mockMethod => {
        if (jest.isMockFunction(mockMethod)) {
          mockMethod.mockReset()
        }
      })
    }
  })
}