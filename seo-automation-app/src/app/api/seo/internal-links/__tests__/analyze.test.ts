import { POST } from '../analyze/route';
import { NextRequest } from 'next/server';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/auth/middleware');
jest.mock('@/lib/seo/internal-linking-analyzer');
jest.mock('@supabase/supabase-js');

import { authenticateRequest } from '@/lib/auth/middleware';
import { InternalLinkingAnalyzer } from '@/lib/seo/internal-linking-analyzer';
import { createClient } from '@supabase/supabase-js';

const mockAuthenticateRequest = authenticateRequest as jest.MockedFunction<typeof authenticateRequest>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/seo/internal-links/analyze', () => {
  let mockSupabase: any;
  let mockAnalyzer: jest.Mocked<InternalLinkingAnalyzer>;

  beforeEach(() => {
    // Mock authenticated user
    mockAuthenticateRequest.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com'
    });

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'analysis-123' },
        error: null
      })
    };
    mockCreateClient.mockReturnValue(mockSupabase);

    // Mock analyzer
    mockAnalyzer = {
      discoverAndAnalyzePages: jest.fn(),
      findTopicalRelationships: jest.fn()
    } as any;

    // Mock the analyzer constructor
    (InternalLinkingAnalyzer as jest.MockedClass<typeof InternalLinkingAnalyzer>).mockImplementation(
      () => mockAnalyzer
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/seo/internal-links/analyze', () => {
    const validRequestBody = {
      domain: 'https://example.com',
      sitemapUrl: 'https://example.com/sitemap.xml',
      options: {
        maxPages: 50,
        includeAnchorTextSuggestions: true,
        includeDistributionAnalysis: true,
        includeContextualPlacements: true,
        primaryKeyword: 'digital marketing',
        targetKeywords: ['SEO', 'content marketing']
      }
    };

    const mockPages = [
      {
        url: 'https://example.com/',
        content: 'Homepage content about digital marketing',
        analysisResult: {
          topicalRelevanceScore: 85,
          lsiKeywords: [
            { term: 'digital marketing', relevance: 0.9, frequency: 15, context: 'homepage' }
          ],
          mainTopics: ['digital marketing'],
          pageAuthorityScore: 90,
          contentQualityScore: 88
        }
      },
      {
        url: 'https://example.com/services',
        content: 'Services page about SEO and digital marketing',
        analysisResult: {
          topicalRelevanceScore: 92,
          lsiKeywords: [
            { term: 'SEO optimization', relevance: 0.95, frequency: 20, context: 'services' }
          ],
          mainTopics: ['SEO services'],
          pageAuthorityScore: 85,
          contentQualityScore: 90
        }
      }
    ];

    const mockRelationships = [
      {
        sourceUrl: 'https://example.com/',
        targetUrl: 'https://example.com/services',
        commonLsiKeywords: [
          { term: 'digital marketing', relevance: 0.9, frequency: 15, context: 'shared' }
        ],
        relevanceScore: 85
      }
    ];

    beforeEach(() => {
      mockAnalyzer.discoverAndAnalyzePages.mockResolvedValue(mockPages);
      mockAnalyzer.findTopicalRelationships.mockResolvedValue(mockRelationships);
    });

    it('should successfully analyze internal linking opportunities', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.domain).toBe('https://example.com');
      expect(data.summary.pagesAnalyzed).toBe(2);
      expect(data.summary.linkingOpportunities).toBe(1);
      expect(data.results.topicalRelationships).toHaveLength(1);
    });

    it('should handle missing authentication', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate request body', async () => {
      const invalidRequestBody = {
        domain: 'invalid-url',
        options: {
          maxPages: -1 // Invalid
        }
      };

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should handle analysis with no pages found', async () => {
      mockAnalyzer.discoverAndAnalyzePages.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No pages found for analysis');
      expect(data.suggestion).toContain('sitemap URL');
    });

    it('should limit pages when maxPages is specified', async () => {
      const manyPages = Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        content: `Content for page ${i}`,
        analysisResult: {
          topicalRelevanceScore: 75,
          lsiKeywords: [],
          mainTopics: ['topic'],
          pageAuthorityScore: 70,
          contentQualityScore: 75
        }
      }));

      mockAnalyzer.discoverAndAnalyzePages.mockResolvedValue(manyPages);

      const requestWithLimit = {
        ...validRequestBody,
        options: { ...validRequestBody.options, maxPages: 10 }
      };

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(requestWithLimit)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.pagesAnalyzed).toBe(10);
    });

    it('should handle analyzer errors gracefully', async () => {
      mockAnalyzer.discoverAndAnalyzePages.mockRejectedValue(new Error('Sitemap fetch failed'));

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error during analysis');
      expect(data.message).toBe('Sitemap fetch failed');
    });

    it('should save analysis results to database', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('internal_linking_analysis');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          domain: 'https://example.com',
          sitemap_url: 'https://example.com/sitemap.xml',
          pages_analyzed: 2
        })
      );
    });

    it('should continue even if database save fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      // Should still return analysis results even if save fails
    });

    it('should include anchor text suggestions when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.anchorTextSuggestions).toBeDefined();
      expect(Array.isArray(data.results.anchorTextSuggestions)).toBe(true);
    });

    it('should exclude optional features when not requested', async () => {
      const minimalRequest = {
        domain: 'https://example.com',
        options: {
          includeAnchorTextSuggestions: false,
          includeDistributionAnalysis: false,
          includeContextualPlacements: false
        }
      };

      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(minimalRequest)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.anchorTextSuggestions).toBeUndefined();
      expect(data.results.distributionAnalysis).toBeUndefined();
      expect(data.results.contextualPlacements).toBeUndefined();
    });

    it('should handle non-POST methods', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'GET'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should include processing time in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.processingTime).toBeDefined();
      expect(typeof data.summary.processingTime).toBe('number');
      expect(data.metadata.processingTime).toBeDefined();
    });

    it('should include recommendations in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/internal-links/analyze', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.recommendations).toBeDefined();
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
    });
  });
});
