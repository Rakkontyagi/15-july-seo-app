import { InternalLinkingAnalyzer } from '../internal-linking-analyzer';
import { SitemapParser } from '../sitemap-parser';
import { PageContentAnalyzer } from '../page-content-analyzer';
import { AnchorTextOptimizer } from '../anchor-text-optimizer';
import { LinkRelevanceScorer } from '../link-relevance-scorer';
import { LinkDistributionAnalyzer } from '../link-distribution-analyzer';
import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('../sitemap-parser');
jest.mock('../page-content-analyzer');

describe('Internal Linking Performance Tests', () => {
  let analyzer: InternalLinkingAnalyzer;
  let anchorTextOptimizer: AnchorTextOptimizer;
  let linkRelevanceScorer: LinkRelevanceScorer;
  let linkDistributionAnalyzer: LinkDistributionAnalyzer;

  beforeEach(() => {
    analyzer = new InternalLinkingAnalyzer();
    anchorTextOptimizer = new AnchorTextOptimizer();
    linkRelevanceScorer = new LinkRelevanceScorer();
    linkDistributionAnalyzer = new LinkDistributionAnalyzer();
  });

  describe('Large Scale Sitemap Analysis', () => {
    it('should handle 1000+ page sitemaps efficiently', async () => {
      const largeSitemap = Array.from({ length: 1000 }, (_, i) => ({
        loc: `https://example.com/page${i}`,
        lastmod: '2023-01-01',
        changefreq: 'weekly',
        priority: '0.8'
      }));

      const mockSitemapParser = analyzer['sitemapParser'] as jest.Mocked<SitemapParser>;
      const mockPageContentAnalyzer = analyzer['pageContentAnalyzer'] as jest.Mocked<PageContentAnalyzer>;

      mockSitemapParser.fetchAndParseSitemap.mockResolvedValue(largeSitemap);

      // Mock quick analysis responses
      for (let i = 0; i < 1000; i++) {
        mockPageContentAnalyzer.analyze.mockResolvedValueOnce({
          url: `https://example.com/page${i}`,
          topicalRelevanceScore: 75 + (i % 25), // Vary scores
          lsiKeywords: [
            { term: `keyword${i % 10}`, relevance: 0.8, frequency: 10, context: 'content' },
            { term: `topic${i % 5}`, relevance: 0.7, frequency: 8, context: 'content' }
          ],
          mainTopics: [`topic${i % 5}`, `category${i % 3}`],
          pageAuthorityScore: 70 + (i % 30),
          contentQualityScore: 75 + (i % 25)
        });
      }

      // Mock content fetching
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { content: 'Sample content for performance testing.' }
          })
        } as Response)
      );

      const startTime = Date.now();
      const pages = await analyzer.discoverAndAnalyzePages('https://example.com/sitemap.xml');
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(pages.length).toBe(1000);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      
      console.log(`Processed ${pages.length} pages in ${processingTime}ms`);
      console.log(`Average time per page: ${(processingTime / pages.length).toFixed(2)}ms`);
    }, 60000); // 60 second timeout

    it('should efficiently find relationships in large datasets', async () => {
      // Create 500 pages with overlapping topics
      const pages = Array.from({ length: 500 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        content: `Content for page ${i} about topic${i % 10}`,
        analysisResult: {
          topicalRelevanceScore: 75 + (i % 25),
          lsiKeywords: [
            { term: `keyword${i % 10}`, relevance: 0.8, frequency: 10, context: 'content' },
            { term: `topic${i % 5}`, relevance: 0.7, frequency: 8, context: 'content' }
          ],
          mainTopics: [`topic${i % 10}`, `category${i % 5}`],
          pageAuthorityScore: 70 + (i % 30),
          contentQualityScore: 75 + (i % 25)
        }
      }));

      const startTime = Date.now();
      const relationships = await analyzer.findTopicalRelationships(pages);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(relationships.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`Found ${relationships.length} relationships in ${processingTime}ms`);
      console.log(`Average time per relationship: ${(processingTime / relationships.length).toFixed(2)}ms`);
    }, 30000);
  });

  describe('Anchor Text Generation Performance', () => {
    it('should generate anchor text suggestions efficiently for large content', async () => {
      // Create large content (10,000 words)
      const largeContent = Array.from({ length: 10000 }, (_, i) => 
        `Word${i} digital marketing SEO optimization content strategy`
      ).join(' ');

      const lsiKeywords = Array.from({ length: 100 }, (_, i) => ({
        term: `keyword${i}`,
        relevance: 0.8,
        frequency: 10,
        context: 'content'
      }));

      const startTime = Date.now();
      const suggestions = anchorTextOptimizer.generateAnchorTextSuggestions(
        'digital marketing',
        largeContent,
        lsiKeywords
      );
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(suggestions.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Generated ${suggestions.length} anchor suggestions in ${processingTime}ms`);
    });

    it('should handle batch anchor text generation efficiently', async () => {
      const batchSize = 100;
      const content = 'Digital marketing and SEO optimization strategies for business growth.';
      const lsiKeywords = [
        { term: 'SEO optimization', relevance: 0.9, frequency: 15, context: 'content' },
        { term: 'business growth', relevance: 0.8, frequency: 12, context: 'content' }
      ];

      const startTime = Date.now();
      
      const promises = Array.from({ length: batchSize }, () =>
        anchorTextOptimizer.generateAnchorTextSuggestions(
          'digital marketing',
          content,
          lsiKeywords
        )
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(results.length).toBe(batchSize);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`Generated ${batchSize} anchor text batches in ${processingTime}ms`);
    });
  });

  describe('Link Relevance Scoring Performance', () => {
    it('should calculate relevance scores efficiently for large datasets', async () => {
      const sourceContext = {
        url: 'https://example.com/source',
        topics: ['digital marketing', 'SEO', 'content strategy'],
        authorityScore: 85,
        contentQualityScore: 90
      };

      const targetContexts = Array.from({ length: 1000 }, (_, i) => ({
        url: `https://example.com/target${i}`,
        topics: [`topic${i % 10}`, 'digital marketing', `category${i % 5}`],
        authorityScore: 70 + (i % 30),
        contentQualityScore: 75 + (i % 25)
      }));

      const startTime = Date.now();
      
      const scores = targetContexts.map(targetContext =>
        linkRelevanceScorer.calculateRelevance(
          sourceContext,
          targetContext,
          'digital marketing'
        )
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(scores.length).toBe(1000);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Calculated ${scores.length} relevance scores in ${processingTime}ms`);
      console.log(`Average time per score: ${(processingTime / scores.length).toFixed(2)}ms`);
    });
  });

  describe('Link Distribution Analysis Performance', () => {
    it('should analyze link distribution efficiently for large site architectures', async () => {
      // Create large site with 1000 pages and complex linking
      const pageLinkData = Array.from({ length: 1000 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        internalLinksTo: Array.from({ length: Math.floor(Math.random() * 20) + 1 }, (_, j) => 
          `https://example.com/page${(i + j + 1) % 1000}`
        ),
        internalLinksFrom: Array.from({ length: Math.floor(Math.random() * 15) + 1 }, (_, j) => 
          `https://example.com/page${(i - j - 1 + 1000) % 1000}`
        )
      }));

      const startTime = Date.now();
      const analysis = linkDistributionAnalyzer.analyze(pageLinkData, 'https://example.com/');
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(analysis.totalInternalLinks).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(15000); // Should complete within 15 seconds

      console.log(`Analyzed link distribution for ${pageLinkData.length} pages in ${processingTime}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should maintain reasonable memory usage during large analysis', async () => {
      const initialMemory = process.memoryUsage();

      // Process large dataset
      const pages = Array.from({ length: 500 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        content: `Large content block for page ${i} `.repeat(1000), // ~25KB per page
        analysisResult: {
          topicalRelevanceScore: 75,
          lsiKeywords: Array.from({ length: 50 }, (_, j) => ({
            term: `keyword${j}`,
            relevance: 0.8,
            frequency: 10,
            context: 'content'
          })),
          mainTopics: [`topic${i % 10}`],
          pageAuthorityScore: 70,
          contentQualityScore: 75
        }
      }));

      const relationships = await analyzer.findTopicalRelationships(pages);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(relationships.length).toBeGreaterThan(0);
      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle concurrent analysis requests efficiently', async () => {
      const concurrentRequests = 10;
      const pagesPerRequest = 50;

      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        const pages = Array.from({ length: pagesPerRequest }, (_, j) => ({
          url: `https://example${i}.com/page${j}`,
          content: `Content for request ${i} page ${j}`,
          analysisResult: {
            topicalRelevanceScore: 75,
            lsiKeywords: [
              { term: `keyword${j % 10}`, relevance: 0.8, frequency: 10, context: 'content' }
            ],
            mainTopics: [`topic${j % 5}`],
            pageAuthorityScore: 70,
            contentQualityScore: 75
          }
        }));

        return analyzer.findTopicalRelationships(pages);
      });

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(results.length).toBe(concurrentRequests);
      expect(processingTime).toBeLessThan(20000); // Should complete within 20 seconds

      console.log(`Processed ${concurrentRequests} concurrent requests in ${processingTime}ms`);
    });
  });
});
