/**
 * Comprehensive tests for AutomatedContentPipeline
 * Tests end-to-end automated content generation and publishing
 */

import { AutomatedContentPipeline, ContentGenerationRequest, ContentGenerationResult } from '../automated-content-pipeline';

describe('AutomatedContentPipeline', () => {
  let pipeline: AutomatedContentPipeline;
  let mockRequest: ContentGenerationRequest;

  beforeEach(() => {
    pipeline = new AutomatedContentPipeline();
    
    mockRequest = {
      topic: 'Digital Marketing Strategy',
      industry: 'marketing',
      targetAudience: 'expert',
      contentType: 'guide',
      wordCount: 2000,
      keywords: ['digital marketing', 'SEO strategy', 'content optimization'],
      location: 'United States',
      competitorUrls: [
        'https://example1.com/digital-marketing-guide',
        'https://example2.com/seo-strategy-tips',
        'https://example3.com/content-optimization'
      ],
      cmsTargets: ['wordpress-main', 'drupal-blog'],
      publishOptions: {
        status: 'draft',
        categories: ['Marketing', 'SEO'],
        tags: ['digital marketing', 'strategy', 'optimization']
      },
      qualityRequirements: {
        minimumExpertiseScore: 70, // Real content generation should achieve this
        minimumConfidenceScore: 80, // Real data integration ensures high confidence
        maximumHallucinationRisk: 10 // Real data reduces hallucination risk
      },
      researchOptions: {
        searchDepth: 10,
        includeLocalCompetitors: true,
        requireRealData: false // Set to false for testing to avoid API calls
      }
    };
  });

  describe('generateContent', () => {
    it('should execute complete content generation pipeline successfully', async () => {
      const result = await pipeline.generateContent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.qualityMetrics).toBeDefined();
      expect(result.publishResults).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);

      // Verify content structure
      expect(result.content!.title).toBeDefined();
      expect(result.content!.content).toBeDefined();
      expect(result.content!.excerpt).toBeDefined();
      expect(result.content!.metaTitle).toBeDefined();
      expect(result.content!.metaDescription).toBeDefined();
      expect(result.content!.slug).toBeDefined();
      expect(result.content!.keywords).toEqual(mockRequest.keywords);
      expect(result.content!.categories).toEqual(mockRequest.publishOptions.categories);
      expect(result.content!.tags).toEqual(mockRequest.publishOptions.tags);
    });

    it('should meet quality requirements', async () => {
      const result = await pipeline.generateContent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.qualityMetrics).toBeDefined();
      
      const metrics = result.qualityMetrics!;
      expect(metrics.expertiseScore).toBeGreaterThanOrEqual(mockRequest.qualityRequirements.minimumExpertiseScore);
      expect(metrics.confidenceScore).toBeGreaterThanOrEqual(mockRequest.qualityRequirements.minimumConfidenceScore);
      expect(metrics.hallucinationRisk).toBeLessThanOrEqual(mockRequest.qualityRequirements.maximumHallucinationRisk);
      expect(metrics.competitorAlignment).toBeGreaterThan(0);
      expect(metrics.seoOptimization).toBeGreaterThan(0);
    });

    it('should generate SEO-optimized content', async () => {
      const result = await pipeline.generateContent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();

      const content = result.content!;
      
      // Check meta title length
      expect(content.metaTitle.length).toBeLessThanOrEqual(60);
      
      // Check meta description length
      expect(content.metaDescription.length).toBeLessThanOrEqual(160);
      
      // Check slug format
      expect(content.slug).toMatch(/^[a-z0-9-]+$/);
      expect(content.slug).not.toContain(' ');
      
      // Check keyword presence
      const primaryKeyword = mockRequest.keywords[0].toLowerCase();
      expect(
        content.title.toLowerCase().includes(primaryKeyword) ||
        content.metaTitle.toLowerCase().includes(primaryKeyword)
      ).toBe(true);
    });

    it('should publish to multiple CMS platforms', async () => {
      const result = await pipeline.generateContent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.publishResults).toBeDefined();
      
      const publishResults = result.publishResults!;
      expect(Object.keys(publishResults)).toEqual(mockRequest.cmsTargets);
      
      // Check each CMS publish result
      mockRequest.cmsTargets.forEach(cmsId => {
        expect(publishResults[cmsId]).toBeDefined();
        expect(publishResults[cmsId].success).toBeDefined();
      });
    });

    it('should handle different content types', async () => {
      const contentTypes: Array<ContentGenerationRequest['contentType']> = [
        'article', 'guide', 'tutorial', 'analysis', 'whitepaper'
      ];

      for (const contentType of contentTypes) {
        const request = { ...mockRequest, contentType };
        const result = await pipeline.generateContent(request);

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      }
    });

    it('should handle different target audiences', async () => {
      const audiences: Array<ContentGenerationRequest['targetAudience']> = [
        'beginner', 'intermediate', 'expert', 'mixed'
      ];

      for (const targetAudience of audiences) {
        const request = { ...mockRequest, targetAudience };
        const result = await pipeline.generateContent(request);

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      }
    });

    it('should handle different industries', async () => {
      const industries = ['technology', 'healthcare', 'finance', 'manufacturing'];

      for (const industry of industries) {
        const request = { ...mockRequest, industry };
        const result = await pipeline.generateContent(request);

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      }
    });

    it('should respect word count requirements', async () => {
      const wordCounts = [1000, 1500, 2000, 3000];

      for (const wordCount of wordCounts) {
        const request = { ...mockRequest, wordCount };
        const result = await pipeline.generateContent(request);

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        
        // Content should be reasonably close to requested word count
        const actualWordCount = result.content!.content.split(/\s+/).length;
        expect(actualWordCount).toBeGreaterThan(wordCount * 0.8); // At least 80% of requested
      }
    });

    it('should handle scheduled publishing', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const request = {
        ...mockRequest,
        publishOptions: {
          ...mockRequest.publishOptions,
          status: 'scheduled' as const,
          publishDate: futureDate
        }
      };

      const result = await pipeline.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.publishResults).toBeDefined();
    });

    it('should include warnings when appropriate', async () => {
      // Test with edge case that might generate warnings
      const request = {
        ...mockRequest,
        keywords: [], // Empty keywords might generate warnings
        competitorUrls: [] // No competitors might generate warnings
      };

      const result = await pipeline.generateContent(request);

      // Should still succeed but might have warnings
      expect(result.success).toBe(true);
      // Warnings are optional, so we just check if they exist they're an array
      if (result.warnings) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid topic gracefully', async () => {
      const request = { ...mockRequest, topic: '' };
      const result = await pipeline.generateContent(request);

      // Should handle gracefully - either succeed with generated content or fail with clear error
      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty keywords array', async () => {
      const request = { ...mockRequest, keywords: [] };
      const result = await pipeline.generateContent(request);

      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle invalid CMS targets', async () => {
      const request = { ...mockRequest, cmsTargets: ['invalid-cms'] };
      const result = await pipeline.generateContent(request);

      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      
      if (result.publishResults) {
        expect(result.publishResults['invalid-cms']).toBeDefined();
        expect(result.publishResults['invalid-cms'].success).toBe(false);
      }
    });

    it('should handle very high quality requirements', async () => {
      const request = {
        ...mockRequest,
        qualityRequirements: {
          minimumExpertiseScore: 95,
          minimumConfidenceScore: 98,
          maximumHallucinationRisk: 1
        }
      };

      const result = await pipeline.generateContent(request);

      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(error => 
          error.includes('score') || error.includes('risk')
        )).toBe(true);
      }
    });
  });

  describe('performance and scalability', () => {
    it('should complete pipeline within reasonable time', async () => {
      const startTime = Date.now();
      const result = await pipeline.generateContent(mockRequest);
      const endTime = Date.now();

      expect(result.processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(endTime - startTime).toBeGreaterThanOrEqual(result.processingTime * 0.9); // Processing time should be accurate
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(3).fill(null).map((_, index) => ({
        ...mockRequest,
        topic: `${mockRequest.topic} ${index + 1}`
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => pipeline.generateContent(request))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBeDefined();
        expect(result.processingTime).toBeGreaterThan(0);
      });

      // Concurrent execution should be faster than sequential
      const totalSequentialTime = results.reduce((sum, result) => sum + result.processingTime, 0);
      const actualTime = endTime - startTime;
      expect(actualTime).toBeLessThan(totalSequentialTime * 0.8);
    });

    it('should handle large content requests', async () => {
      const request = {
        ...mockRequest,
        wordCount: 5000,
        keywords: Array(20).fill(null).map((_, i) => `keyword${i + 1}`),
        competitorUrls: Array(10).fill(null).map((_, i) => `https://competitor${i + 1}.com`)
      };

      const result = await pipeline.generateContent(request);

      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      
      if (result.success) {
        expect(result.content).toBeDefined();
        expect(result.qualityMetrics).toBeDefined();
      }
    });
  });

  describe('integration validation', () => {
    it('should properly integrate all pipeline components', async () => {
      const result = await pipeline.generateContent(mockRequest);

      expect(result.success).toBe(true);
      
      // Verify all components were used
      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics!.expertiseScore).toBeGreaterThan(0);
      expect(result.qualityMetrics!.confidenceScore).toBeGreaterThan(0);
      expect(result.qualityMetrics!.hallucinationRisk).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics!.competitorAlignment).toBeGreaterThan(0);
      expect(result.qualityMetrics!.seoOptimization).toBeGreaterThan(0);
      
      // Verify content quality
      expect(result.content).toBeDefined();
      expect(result.content!.content.length).toBeGreaterThan(500);
      expect(result.content!.title).toBeTruthy();
      expect(result.content!.metaTitle).toBeTruthy();
      expect(result.content!.metaDescription).toBeTruthy();
    });

    it('should maintain data consistency throughout pipeline', async () => {
      const result = await pipeline.generateContent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      
      const content = result.content!;
      
      // Keywords should be preserved
      expect(content.keywords).toEqual(mockRequest.keywords);
      
      // Categories and tags should be preserved
      expect(content.categories).toEqual(mockRequest.publishOptions.categories);
      expect(content.tags).toEqual(mockRequest.publishOptions.tags);
      
      // Content should be related to the topic
      expect(
        content.title.toLowerCase().includes(mockRequest.topic.toLowerCase()) ||
        content.content.toLowerCase().includes(mockRequest.topic.toLowerCase())
      ).toBe(true);
    });
  });
});
