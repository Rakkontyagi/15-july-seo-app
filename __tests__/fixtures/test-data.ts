/**
 * Test data fixtures for consistent testing
 */

import { faker } from '@faker-js/faker'

// User fixtures
export const userFixtures = {
  basicUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    email_confirmed_at: '2023-01-01T00:00:00.000Z',
    last_sign_in_at: '2023-01-01T00:00:00.000Z',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    },
  },
  
  premiumUser: {
    id: 'premium-user-id',
    email: 'premium@example.com',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    email_confirmed_at: '2023-01-01T00:00:00.000Z',
    last_sign_in_at: '2023-01-01T00:00:00.000Z',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {
      subscription_tier: 'premium',
    },
    user_metadata: {
      full_name: 'Premium User',
      avatar_url: 'https://example.com/premium-avatar.png',
    },
  },
  
  adminUser: {
    id: 'admin-user-id',
    email: 'admin@example.com',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    email_confirmed_at: '2023-01-01T00:00:00.000Z',
    last_sign_in_at: '2023-01-01T00:00:00.000Z',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {
      role: 'admin',
      subscription_tier: 'premium',
    },
    user_metadata: {
      full_name: 'Admin User',
      avatar_url: 'https://example.com/admin-avatar.png',
    },
  },
}

// Session fixtures
export const sessionFixtures = {
  validSession: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000, // 1 hour from now
    expires_in: 3600,
    token_type: 'bearer',
    user: userFixtures.basicUser,
  },
  
  expiredSession: {
    access_token: 'expired-access-token',
    refresh_token: 'expired-refresh-token',
    expires_at: Date.now() - 3600000, // 1 hour ago
    expires_in: -3600,
    token_type: 'bearer',
    user: userFixtures.basicUser,
  },
  
  premiumSession: {
    access_token: 'premium-access-token',
    refresh_token: 'premium-refresh-token',
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    token_type: 'bearer',
    user: userFixtures.premiumUser,
  },
}

// Content generation fixtures
export const contentFixtures = {
  seoAnalysis: {
    id: 'analysis-123',
    keyword: 'seo best practices',
    location: 'United States',
    language: 'en',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    user_id: userFixtures.basicUser.id,
    serp_results: {
      organic: [
        {
          position: 1,
          title: 'SEO Best Practices Guide',
          url: 'https://example1.com/seo-guide',
          snippet: 'Complete guide to SEO optimization...',
          domain: 'example1.com',
        },
        {
          position: 2,
          title: 'Advanced SEO Techniques',
          url: 'https://example2.com/advanced-seo',
          snippet: 'Learn advanced SEO strategies...',
          domain: 'example2.com',
        },
      ],
      peopleAlsoAsk: [
        {
          question: 'What is SEO?',
          snippet: 'SEO stands for Search Engine Optimization...',
          link: 'https://example.com/what-is-seo',
        },
      ],
      relatedSearches: [
        'seo tutorial',
        'seo tools',
        'seo optimization',
      ],
    },
    competitor_analysis: {
      top_competitors: [
        {
          domain: 'example1.com',
          title: 'SEO Best Practices Guide',
          content_length: 2500,
          keywords: ['seo', 'optimization', 'search engine'],
          headings: ['h1', 'h2', 'h3'],
          internal_links: 15,
          external_links: 8,
        },
        {
          domain: 'example2.com',
          title: 'Advanced SEO Techniques',
          content_length: 3200,
          keywords: ['seo', 'advanced', 'techniques'],
          headings: ['h1', 'h2', 'h3', 'h4'],
          internal_links: 22,
          external_links: 12,
        },
      ],
      average_content_length: 2850,
      common_keywords: ['seo', 'optimization', 'search'],
      content_gaps: ['local seo', 'mobile optimization'],
    },
    status: 'completed',
  },
  
  generatedContent: {
    id: 'content-456',
    title: 'The Ultimate Guide to SEO Best Practices in 2024',
    content: `# The Ultimate Guide to SEO Best Practices in 2024

Search Engine Optimization (SEO) remains one of the most crucial aspects of digital marketing. In this comprehensive guide, we'll explore the latest SEO best practices that can help your website rank higher in search results.

## Understanding SEO Fundamentals

SEO is the practice of optimizing your website to improve its visibility in search engine results pages (SERPs). When done correctly, SEO can drive organic traffic, increase brand awareness, and boost conversions.

### Key SEO Components

1. **Content Quality**: Create valuable, original content that addresses user intent
2. **Technical SEO**: Ensure your website is technically sound and crawlable
3. **User Experience**: Optimize for user satisfaction and engagement
4. **Mobile Optimization**: Ensure your site works perfectly on all devices

## Content Optimization Strategies

### Keyword Research and Implementation

Effective keyword research is the foundation of successful SEO. Use tools like Google Keyword Planner, SEMrush, or Ahrefs to identify relevant keywords with good search volume and manageable competition.

### On-Page SEO Best Practices

- Optimize title tags and meta descriptions
- Use header tags (H1, H2, H3) to structure content
- Include keywords naturally in your content
- Optimize images with alt text
- Create internal links to related content

## Technical SEO Essentials

### Site Speed Optimization

Page loading speed is a critical ranking factor. Optimize your website's performance by:
- Compressing images
- Minimizing CSS and JavaScript
- Using a content delivery network (CDN)
- Enabling browser caching

### Mobile-First Indexing

With mobile-first indexing, Google predominantly uses the mobile version of your site for indexing and ranking. Ensure your mobile site is fully functional and optimized.

## Measuring SEO Success

Track your SEO performance using tools like Google Analytics and Google Search Console. Monitor key metrics such as:
- Organic traffic growth
- Keyword rankings
- Click-through rates
- Conversion rates

## Conclusion

Implementing these SEO best practices will help improve your website's visibility and drive more organic traffic. Remember that SEO is a long-term strategy that requires consistency and patience.

Stay updated with the latest SEO trends and algorithm changes to maintain your competitive edge in the digital landscape.`,
    meta_description: 'Discover the essential SEO best practices for 2024. Learn how to optimize your website for better search engine rankings and increased organic traffic.',
    keyword: 'seo best practices',
    word_count: 1250,
    readability_score: 65,
    seo_score: 85,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    user_id: userFixtures.basicUser.id,
    analysis_id: 'analysis-123',
    status: 'published',
    tags: ['seo', 'digital marketing', 'optimization'],
  },
  
  draftContent: {
    id: 'draft-789',
    title: 'Local SEO Strategies for Small Businesses',
    content: 'Draft content for local SEO strategies...',
    meta_description: 'Learn effective local SEO strategies...',
    keyword: 'local seo',
    word_count: 800,
    readability_score: 70,
    seo_score: 0,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    user_id: userFixtures.basicUser.id,
    analysis_id: null,
    status: 'draft',
    tags: ['local seo', 'small business'],
  },
}

// API response fixtures
export const apiResponseFixtures = {
  successResponse: {
    success: true,
    data: contentFixtures.generatedContent,
    message: 'Content generated successfully',
    timestamp: '2023-01-01T00:00:00.000Z',
  },
  
  errorResponse: {
    success: false,
    error: 'Content generation failed',
    code: 'GENERATION_ERROR',
    message: 'Failed to generate content due to API limits',
    timestamp: '2023-01-01T00:00:00.000Z',
  },
  
  validationErrorResponse: {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors: [
      {
        field: 'keyword',
        message: 'Keyword is required',
      },
      {
        field: 'location',
        message: 'Location must be a valid country code',
      },
    ],
    timestamp: '2023-01-01T00:00:00.000Z',
  },
}

// Form data fixtures
export const formDataFixtures = {
  validLoginForm: {
    email: 'test@example.com',
    password: 'password123',
    remember: false,
  },
  
  validRegistrationForm: {
    email: 'newuser@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    fullName: 'New User',
    acceptTerms: true,
  },
  
  validContentGenerationForm: {
    keyword: 'seo best practices',
    location: 'United States',
    language: 'en',
    wordCount: 1500,
    tone: 'professional',
    includeImages: true,
    includeReferences: true,
  },
  
  invalidContentGenerationForm: {
    keyword: '',
    location: '',
    language: '',
    wordCount: -1,
    tone: 'invalid-tone',
    includeImages: 'not-boolean',
    includeReferences: 'not-boolean',
  },
}

// Database fixtures
export const databaseFixtures = {
  users: [
    userFixtures.basicUser,
    userFixtures.premiumUser,
    userFixtures.adminUser,
  ],
  
  content: [
    contentFixtures.generatedContent,
    contentFixtures.draftContent,
  ],
  
  subscriptions: [
    {
      id: 'sub-123',
      user_id: userFixtures.premiumUser.id,
      plan: 'premium',
      status: 'active',
      current_period_start: '2023-01-01T00:00:00.000Z',
      current_period_end: '2023-02-01T00:00:00.000Z',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    },
  ],
  
  usage: [
    {
      id: 'usage-123',
      user_id: userFixtures.basicUser.id,
      type: 'content_generation',
      count: 5,
      period: '2023-01',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    },
  ],
}

// Factory functions for generating test data
export const createTestUser = (overrides = {}) => ({
  ...userFixtures.basicUser,
  id: faker.string.uuid(),
  email: faker.internet.email(),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})

export const createTestContent = (overrides = {}) => ({
  ...contentFixtures.generatedContent,
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(5),
  keyword: faker.lorem.words(3),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})

export const createTestSession = (overrides = {}) => ({
  ...sessionFixtures.validSession,
  access_token: faker.string.alphanumeric(32),
  refresh_token: faker.string.alphanumeric(32),
  expires_at: Date.now() + 3600000,
  ...overrides,
})

// Export all fixtures
export const testFixtures = {
  users: userFixtures,
  sessions: sessionFixtures,
  content: contentFixtures,
  apiResponses: apiResponseFixtures,
  formData: formDataFixtures,
  database: databaseFixtures,
  factories: {
    user: createTestUser,
    content: createTestContent,
    session: createTestSession,
  },
}

export default testFixtures