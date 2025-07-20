#!/usr/bin/env node

/**
 * Development Mock Setup Script
 * Sets up MSW (Mock Service Worker) for local development
 * Implements Quinn's recommendation for external API mocks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up development mocks...');

// Create mocks directory structure
const mockDirs = [
  'src/mocks',
  'src/mocks/handlers',
  'src/mocks/data',
  'src/mocks/fixtures',
];

mockDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create MSW handlers for external APIs
const mswHandlers = `// MSW Handlers for External APIs
// Implements Quinn's recommendation for comprehensive API mocking

import { rest } from 'msw';
import { serpMockData } from './data/serp-mock-data';
import { firecrawlMockData } from './data/firecrawl-mock-data';
import { openaiMockData } from './data/openai-mock-data';

export const handlers = [
  // Serper.dev API Mock
  rest.post('https://google.serper.dev/search', (req, res, ctx) => {
    const { q: query } = req.body as any;
    
    console.log('🔍 Mock SERP API called with query:', query);
    
    return res(
      ctx.status(200),
      ctx.json(serpMockData.getResults(query))
    );
  }),

  // Firecrawl API Mock
  rest.post('https://api.firecrawl.dev/v0/scrape', (req, res, ctx) => {
    const { url } = req.body as any;
    
    console.log('🕷️ Mock Firecrawl API called with URL:', url);
    
    return res(
      ctx.status(200),
      ctx.json(firecrawlMockData.getScrapeResult(url))
    );
  }),

  // OpenAI API Mock
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    const { messages, model } = req.body as any;
    
    console.log('🤖 Mock OpenAI API called with model:', model);
    
    return res(
      ctx.status(200),
      ctx.json(openaiMockData.getChatCompletion(messages, model))
    );
  }),

  // Supabase API Mocks (for offline development)
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
        },
      })
    );
  }),

  // Health check endpoints
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'development-mock',
      })
    );
  }),
];
`;

// Create mock data generators
const serpMockData = `// SERP Mock Data Generator
// Provides realistic SERP data for development

export class SerpMockData {
  static getResults(query: string) {
    const baseResults = {
      searchParameters: {
        q: query,
        gl: 'us',
        hl: 'en',
        num: 10,
      },
      organic: [
        {
          position: 1,
          title: \`Best \${query} Guide 2024 - Complete Tutorial\`,
          link: 'https://example1.com/guide',
          snippet: \`Comprehensive guide to \${query}. Learn everything you need to know with our expert tips and strategies.\`,
          sitelinks: [
            {
              title: 'Getting Started',
              link: 'https://example1.com/guide/getting-started',
            },
          ],
        },
        {
          position: 2,
          title: \`\${query} Tools & Resources - Top 10 List\`,
          link: 'https://example2.com/tools',
          snippet: \`Discover the best tools and resources for \${query}. Compare features, pricing, and user reviews.\`,
        },
        {
          position: 3,
          title: \`How to Master \${query} in 2024\`,
          link: 'https://example3.com/master',
          snippet: \`Step-by-step tutorial on mastering \${query}. Includes practical examples and case studies.\`,
        },
      ],
      peopleAlsoAsk: [
        \`What is \${query}?\`,
        \`How does \${query} work?\`,
        \`Best practices for \${query}\`,
        \`Common \${query} mistakes to avoid\`,
      ],
      relatedSearches: [
        \`\${query} tutorial\`,
        \`\${query} best practices\`,
        \`\${query} tools\`,
        \`\${query} examples\`,
      ],
    };

    // Add some randomization for more realistic testing
    const randomDelay = Math.random() * 1000 + 500; // 500-1500ms delay
    
    return new Promise(resolve => {
      setTimeout(() => resolve(baseResults), randomDelay);
    });
  }
}

export const serpMockData = SerpMockData;
`;

const firecrawlMockData = `// Firecrawl Mock Data Generator
// Provides realistic scraped content for development

export class FirecrawlMockData {
  static getScrapeResult(url: string) {
    const domain = new URL(url).hostname;
    
    const mockContent = \`
# \${domain.replace('www.', '').replace('.com', '')} Content

This is mock content scraped from \${url}. 

## Key Points

- High-quality content about the topic
- Well-structured with proper headings
- Includes relevant keywords and phrases
- Optimized for search engines

## Main Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### Subsection

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Conclusion

This mock content provides a realistic example of what would be scraped from a real website, including proper structure and relevant information.
    \`.trim();

    return {
      success: true,
      data: {
        content: mockContent,
        markdown: mockContent,
        html: \`<h1>\${domain} Content</h1><p>Mock HTML content...</p>\`,
        metadata: {
          title: \`\${domain} - Mock Page Title\`,
          description: \`Mock description for \${domain}\`,
          keywords: ['mock', 'content', 'development'],
          ogTitle: \`\${domain} - Mock Page\`,
          ogDescription: \`Mock description for \${domain}\`,
        },
        links: [
          \`\${url}/page1\`,
          \`\${url}/page2\`,
          \`\${url}/page3\`,
        ],
      },
    };
  }
}

export const firecrawlMockData = FirecrawlMockData;
`;

const openaiMockData = `// OpenAI Mock Data Generator
// Provides realistic AI responses for development

export class OpenAIMockData {
  static getChatCompletion(messages: any[], model: string) {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || '';
    
    // Generate mock response based on the request
    let mockResponse = '';
    
    if (userContent.includes('generate content')) {
      mockResponse = this.generateMockContent(userContent);
    } else if (userContent.includes('analyze')) {
      mockResponse = this.generateMockAnalysis(userContent);
    } else {
      mockResponse = this.generateGenericResponse(userContent);
    }

    return {
      id: \`chatcmpl-mock-\${Date.now()}\`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: mockResponse,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: userContent.length / 4,
        completion_tokens: mockResponse.length / 4,
        total_tokens: (userContent.length + mockResponse.length) / 4,
      },
    };
  }

  static generateMockContent(prompt: string) {
    return \`# Mock Generated Content

This is a mock response from the OpenAI API for development purposes.

## Introduction

Based on your request: "\${prompt.substring(0, 100)}...", here's the generated content.

## Main Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This mock content demonstrates the structure and quality of content that would be generated by the actual AI service.

### Key Benefits

1. **High Quality**: Professional-grade content
2. **SEO Optimized**: Includes relevant keywords
3. **Well Structured**: Proper headings and formatting
4. **Engaging**: Written to capture reader attention

## Conclusion

This mock content provides a realistic example of AI-generated content for development and testing purposes.

*Note: This is mock content for development. In production, this would be replaced with actual AI-generated content.*
    \`;
  }

  static generateMockAnalysis(prompt: string) {
    return \`## Content Analysis Results

Based on the provided content, here's the analysis:

### SEO Score: 85/100

**Strengths:**
- Good keyword density
- Proper heading structure
- Relevant meta information

**Areas for Improvement:**
- Add more internal links
- Optimize image alt text
- Improve readability score

### Recommendations

1. Increase keyword variations
2. Add more subheadings
3. Include relevant statistics
4. Optimize for featured snippets

*Note: This is mock analysis for development purposes.*
    \`;
  }

  static generateGenericResponse(prompt: string) {
    return \`Thank you for your request. This is a mock response from the OpenAI API.

Your prompt: "\${prompt.substring(0, 200)}..."

This mock response helps with development and testing without using actual API credits.
    \`;
  }
}

export const openaiMockData = OpenAIMockData;
`;

// Write the files
const files = [
  { path: 'src/mocks/handlers.ts', content: mswHandlers },
  { path: 'src/mocks/data/serp-mock-data.ts', content: serpMockData },
  { path: 'src/mocks/data/firecrawl-mock-data.ts', content: firecrawlMockData },
  { path: 'src/mocks/data/openai-mock-data.ts', content: openaiMockData },
];

files.forEach(({ path: filePath, content }) => {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created: ${filePath}`);
});

// Create MSW setup file
const mswSetup = `// MSW Setup for Development
// Browser setup for Mock Service Worker

import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Setup MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Start worker in development
if (process.env.NODE_ENV === 'development' && process.env.MOCK_EXTERNAL_APIS === 'true') {
  worker.start({
    onUnhandledRequest: 'warn',
  });
  console.log('🔧 MSW: Mock Service Worker started');
}
`;

fs.writeFileSync('src/mocks/browser.ts', mswSetup);
console.log('✅ Created: src/mocks/browser.ts');

// Create Node.js MSW setup
const mswNodeSetup = `// MSW Setup for Node.js (Testing)
// Server setup for Mock Service Worker

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server for Node.js environment (testing)
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});
`;

fs.writeFileSync('src/mocks/server.ts', mswNodeSetup);
console.log('✅ Created: src/mocks/server.ts');

console.log('');
console.log('🎉 Mock setup complete!');
console.log('');
console.log('To use mocks in development:');
console.log('  npm run dev:mock');
console.log('');
console.log('To start mock servers:');
console.log('  npm run mock:start');
console.log('');
console.log('Mocks are automatically used in tests.');
