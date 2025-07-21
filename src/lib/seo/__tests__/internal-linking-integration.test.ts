import { InternalLinkingAnalyzer } from '../internal-linking-analyzer';
import { SitemapParser } from '../sitemap-parser';
import { PageContentAnalyzer } from '../page-content-analyzer';
import { AnchorTextOptimizer } from '../anchor-text-optimizer';
import { LinkRelevanceScorer } from '../link-relevance-scorer';
import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('../sitemap-parser');
jest.mock('../page-content-analyzer');

describe('Internal Linking Integration Tests', () => {
  let analyzer: InternalLinkingAnalyzer;
  let mockSitemapParser: jest.Mocked<SitemapParser>;
  let mockPageContentAnalyzer: jest.Mocked<PageContentAnalyzer>;

  beforeEach(() => {
    analyzer = new InternalLinkingAnalyzer();
    mockSitemapParser = analyzer['sitemapParser'] as jest.Mocked<SitemapParser>;
    mockPageContentAnalyzer = analyzer['pageContentAnalyzer'] as jest.Mocked<PageContentAnalyzer>;
  });

  describe('Complete Internal Linking Workflow', () => {
    const mockSitemapUrls = [
      { loc: 'https://example.com/', lastmod: '2023-01-01' },
      { loc: 'https://example.com/about', lastmod: '2023-01-02' },
      { loc: 'https://example.com/services', lastmod: '2023-01-03' },
      { loc: 'https://example.com/blog/seo-tips', lastmod: '2023-01-04' },
      { loc: 'https://example.com/blog/content-marketing', lastmod: '2023-01-05' }
    ];

    const mockPageAnalyses = [
      {
        url: 'https://example.com/',
        topicalRelevanceScore: 85,
        lsiKeywords: [
          { term: 'digital marketing', relevance: 0.9, frequency: 15, context: 'homepage content' },
          { term: 'SEO services', relevance: 0.8, frequency: 12, context: 'service offerings' }
        ],
        mainTopics: ['digital marketing', 'business growth'],
        pageAuthorityScore: 90,
        contentQualityScore: 88
      },
      {
        url: 'https://example.com/about',
        topicalRelevanceScore: 70,
        lsiKeywords: [
          { term: 'company history', relevance: 0.7, frequency: 8, context: 'about us' },
          { term: 'team expertise', relevance: 0.6, frequency: 6, context: 'team description' }
        ],
        mainTopics: ['company information', 'team'],
        pageAuthorityScore: 75,
        contentQualityScore: 80
      },
      {
        url: 'https://example.com/services',
        topicalRelevanceScore: 92,
        lsiKeywords: [
          { term: 'SEO optimization', relevance: 0.95, frequency: 20, context: 'service details' },
          { term: 'digital marketing', relevance: 0.9, frequency: 18, context: 'marketing services' },
          { term: 'content strategy', relevance: 0.85, frequency: 15, context: 'content services' }
        ],
        mainTopics: ['SEO services', 'digital marketing', 'content strategy'],
        pageAuthorityScore: 85,
        contentQualityScore: 90
      },
      {
        url: 'https://example.com/blog/seo-tips',
        topicalRelevanceScore: 88,
        lsiKeywords: [
          { term: 'SEO optimization', relevance: 0.9, frequency: 25, context: 'SEO tips content' },
          { term: 'search rankings', relevance: 0.8, frequency: 12, context: 'ranking factors' },
          { term: 'keyword research', relevance: 0.75, frequency: 10, context: 'SEO techniques' }
        ],
        mainTopics: ['SEO optimization', 'search rankings'],
        pageAuthorityScore: 80,
        contentQualityScore: 85
      },
      {
        url: 'https://example.com/blog/content-marketing',
        topicalRelevanceScore: 86,
        lsiKeywords: [
          { term: 'content strategy', relevance: 0.9, frequency: 22, context: 'content marketing' },
          { term: 'digital marketing', relevance: 0.85, frequency: 16, context: 'marketing strategy' },
          { term: 'audience engagement', relevance: 0.8, frequency: 14, context: 'engagement tactics' }
        ],
        mainTopics: ['content marketing', 'digital marketing'],
        pageAuthorityScore: 78,
        contentQualityScore: 87
      }
    ];

    beforeEach(() => {
      // Mock sitemap parsing
      mockSitemapParser.fetchAndParseSitemap.mockResolvedValue(mockSitemapUrls);

      // Mock page content analysis
      mockPageAnalyses.forEach((analysis, index) => {
        mockPageContentAnalyzer.analyze.mockResolvedValueOnce(analysis);
      });

      // Mock content fetching (would normally use Firecrawl)
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'Homepage content about digital marketing and SEO services.' }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'About our company and team expertise in digital marketing.' }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'Our SEO optimization and digital marketing services.' }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'SEO tips and optimization techniques for better search rankings.' }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'Content marketing strategies for audience engagement.' }
          })
        } as Response);
    });

    it('should complete full internal linking analysis workflow', async () => {
      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');

      // Verify page discovery and analysis
      expect(pages).toHaveLength(5);
      expect(pages[0].url).toBe('https://example.com/');
      expect(pages[0].analysisResult?.topicalRelevanceScore).toBe(85);

      // Find topical relationships
      const relationships = await analyzer.findTopicalRelationships(pages);

      // Verify relationships are found
      expect(relationships.length).toBeGreaterThan(0);

      // Should find relationship between homepage and services (both have digital marketing)
      const homepageToServices = relationships.find(rel =>
        rel.sourceUrl === 'https://example.com/' &&
        rel.targetUrl === 'https://example.com/services'
      );
      expect(homepageToServices).toBeDefined();
      expect(homepageToServices?.commonLsiKeywords).toContainEqual(
        expect.objectContaining({ term: 'digital marketing' })
      );

      // Should find relationship between services and SEO blog (both have SEO optimization)
      const servicesToSeoBlog = relationships.find(rel =>
        rel.sourceUrl === 'https://example.com/services' &&
        rel.targetUrl === 'https://example.com/blog/seo-tips'
      );
      expect(servicesToSeoBlog).toBeDefined();
      expect(servicesToSeoBlog?.commonLsiKeywords).toContainEqual(
        expect.objectContaining({ term: 'SEO optimization' })
      );
    });

    it('should generate anchor text suggestions for relationships', async () => {
      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');
      const relationships = await analyzer.findTopicalRelationships(pages);

      const anchorTextOptimizer = new AnchorTextOptimizer();

      // Generate anchor text for homepage to services relationship
      const homepageToServices = relationships.find(rel =>
        rel.sourceUrl === 'https://example.com/' &&
        rel.targetUrl === 'https://example.com/services'
      );

      if (homepageToServices) {
        const sourcePage = pages.find(p => p.url === homepageToServices.sourceUrl);
        const targetPage = pages.find(p => p.url === homepageToServices.targetUrl);

        const anchorSuggestions = anchorTextOptimizer.generateAnchorTextSuggestions(
          'digital marketing',
          sourcePage?.content || '',
          targetPage?.analysisResult?.lsiKeywords || []
        );

        expect(anchorSuggestions.length).toBeGreaterThan(0);
        expect(anchorSuggestions[0].type).toBe('exact');
        expect(anchorSuggestions[0].text).toBe('digital marketing');

        // Should include LSI suggestions
        const lsiSuggestions = anchorSuggestions.filter(s => s.type === 'lsi');
        expect(lsiSuggestions.length).toBeGreaterThan(0);
      }
    });

    it('should calculate link relevance scores', async () => {
      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');
      const relationships = await analyzer.findTopicalRelationships(pages);

      const linkRelevanceScorer = new LinkRelevanceScorer();

      // Calculate relevance for homepage to services
      const homepageToServices = relationships.find(rel =>
        rel.sourceUrl === 'https://example.com/' &&
        rel.targetUrl === 'https://example.com/services'
      );

      if (homepageToServices) {
        const sourcePage = pages.find(p => p.url === homepageToServices.sourceUrl);
        const targetPage = pages.find(p => p.url === homepageToServices.targetUrl);

        const sourceContext = {
          url: sourcePage!.url,
          topics: sourcePage!.analysisResult!.mainTopics,
          authorityScore: sourcePage!.analysisResult!.pageAuthorityScore,
          contentQualityScore: sourcePage!.analysisResult!.contentQualityScore
        };

        const targetContext = {
          url: targetPage!.url,
          topics: targetPage!.analysisResult!.mainTopics,
          authorityScore: targetPage!.analysisResult!.pageAuthorityScore,
          contentQualityScore: targetPage!.analysisResult!.contentQualityScore
        };

        const relevanceScore = linkRelevanceScorer.calculateRelevance(
          sourceContext,
          targetContext,
          'digital marketing'
        );

        expect(relevanceScore.score).toBeGreaterThan(0);
        expect(relevanceScore.score).toBeLessThanOrEqual(100);
        expect(relevanceScore.breakdown).toBeDefined();
        expect(relevanceScore.recommendations).toBeDefined();
      }
    });

    it('should handle errors gracefully during analysis', async () => {
      // Mock a fetch error for one page
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'Homepage content' }
          })
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'Services content' }
          })
        } as Response);

      // Should continue analysis despite one page failing
      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');

      // Should have analyzed available pages
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.length).toBeLessThan(mockSitemapUrls.length);
    });

    it('should filter out low-quality relationships', async () => {
      // Mock low relevance analysis for some pages
      mockPageContentAnalyzer.analyze
        .mockResolvedValueOnce({
          url: 'https://example.com/',
          topicalRelevanceScore: 20, // Low relevance
          lsiKeywords: [],
          mainTopics: ['unrelated topic'],
          pageAuthorityScore: 30,
          contentQualityScore: 25
        })
        .mockResolvedValueOnce({
          url: 'https://example.com/about',
          topicalRelevanceScore: 90,
          lsiKeywords: [
            { term: 'digital marketing', relevance: 0.9, frequency: 15, context: 'content' }
          ],
          mainTopics: ['digital marketing'],
          pageAuthorityScore: 85,
          contentQualityScore: 88
        });

      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');
      const relationships = await analyzer.findTopicalRelationships(pages);

      // Should filter out relationships with low-quality pages
      const lowQualityRelationships = relationships.filter(rel =>
        rel.sourceUrl === 'https://example.com/' || rel.targetUrl === 'https://example.com/'
      );

      expect(lowQualityRelationships.length).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large sitemaps efficiently', async () => {
      // Generate large sitemap
      const largeSitemap = Array.from({ length: 100 }, (_, i) => ({
        loc: `https://example.com/page${i}`,
        lastmod: '2023-01-01'
      }));

      mockSitemapParser.fetchAndParseSitemap.mockResolvedValue(largeSitemap);

      // Mock quick analysis responses
      for (let i = 0; i < 100; i++) {
        mockPageContentAnalyzer.analyze.mockResolvedValueOnce({
          url: `https://example.com/page${i}`,
          topicalRelevanceScore: 75,
          lsiKeywords: [
            { term: 'keyword', relevance: 0.8, frequency: 10, context: 'content' }
          ],
          mainTopics: ['topic'],
          pageAuthorityScore: 70,
          contentQualityScore: 75
        });
      }

      const startTime = Date.now();
      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');
      const endTime = Date.now();

      expect(pages.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
