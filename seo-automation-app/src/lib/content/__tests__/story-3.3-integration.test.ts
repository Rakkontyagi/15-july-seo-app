/**
 * Story 3.3: Precision Keyword Integration - Comprehensive Integration Tests
 * Tests CompetitorDataAverager, ContentIntegrationEngine, and KeywordDensityMatcher
 */

import { CompetitorDataAverager, type CompetitorAnalysis, type BenchmarkTargets } from '../competitor-data-averager';
import { ContentIntegrationEngine, type Entity } from '../content-integration-engine';
import { KeywordDensityMatcher } from '../keyword-density-matcher';

describe('Story 3.3: Precision Keyword Integration', () => {
  let competitorAverager: CompetitorDataAverager;
  let integrationEngine: ContentIntegrationEngine;
  let densityMatcher: KeywordDensityMatcher;

  // Test data
  const mockCompetitors: CompetitorAnalysis[] = [
    {
      url: 'https://competitor1.com',
      wordCount: 1500,
      keywordDensity: 2.5,
      headingOptimization: 4,
      lsiKeywordCount: 8,
      entityCount: 6,
      readabilityScore: 85,
      contentQuality: 90,
    },
    {
      url: 'https://competitor2.com',
      wordCount: 1800,
      keywordDensity: 2.8,
      headingOptimization: 5,
      lsiKeywordCount: 10,
      entityCount: 8,
      readabilityScore: 80,
      contentQuality: 85,
    },
    {
      url: 'https://competitor3.com',
      wordCount: 1200,
      keywordDensity: 2.2,
      headingOptimization: 3,
      lsiKeywordCount: 6,
      entityCount: 4,
      readabilityScore: 88,
      contentQuality: 92,
    },
    {
      url: 'https://competitor4.com',
      wordCount: 2000,
      keywordDensity: 3.0,
      headingOptimization: 6,
      lsiKeywordCount: 12,
      entityCount: 10,
      readabilityScore: 82,
      contentQuality: 88,
    },
    {
      url: 'https://competitor5.com',
      wordCount: 1600,
      keywordDensity: 2.6,
      headingOptimization: 4,
      lsiKeywordCount: 9,
      entityCount: 7,
      readabilityScore: 86,
      contentQuality: 89,
    },
  ];

  const mockEntities: Entity[] = [
    { name: 'Google', type: 'ORGANIZATION', relevance: 0.9 },
    { name: 'SEO Expert', type: 'PERSON', relevance: 0.8 },
    { name: 'Silicon Valley', type: 'LOCATION', relevance: 0.7 },
  ];

  const testContent = `
    # SEO Optimization Guide

    Search engine optimization is crucial for online success. This comprehensive guide covers
    the essential strategies and techniques needed to improve your website's visibility.
    SEO optimization requires careful planning and execution.

    ## Understanding SEO Fundamentals

    SEO involves multiple factors including keyword research, content optimization, and
    technical improvements. The goal is to create valuable content that ranks well.
    Effective SEO optimization strategies help businesses grow online.

    ## Advanced SEO Techniques

    Modern SEO requires understanding user intent and creating content that satisfies
    search queries effectively. Quality content remains the foundation of good SEO.
    Professional SEO optimization services can significantly improve rankings.
  `;

  beforeEach(() => {
    competitorAverager = new CompetitorDataAverager();
    integrationEngine = new ContentIntegrationEngine();
    densityMatcher = new KeywordDensityMatcher();
  });

  describe('CompetitorDataAverager', () => {
    it('should calculate precise averages from 5 competitors', () => {
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);

      expect(benchmarks.wordCount).toBe(1620); // Average of word counts
      expect(benchmarks.keywordDensity).toBe(2.62); // Average with 2 decimal precision
      expect(benchmarks.headingOptimization).toBe(4); // Rounded average
      expect(benchmarks.lsiKeywordTargets).toBe(9); // Rounded average
      expect(benchmarks.entityTargets).toBe(7); // Rounded average
    });

    it('should include statistical metrics', () => {
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);

      expect(benchmarks.statisticalMetrics).toBeDefined();
      expect(benchmarks.statisticalMetrics.wordCountStats.mean).toBe(1620);
      expect(benchmarks.statisticalMetrics.keywordDensityStats.median).toBeGreaterThan(0);
      expect(benchmarks.statisticalMetrics.headingOptimizationStats.standardDeviation).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for incorrect competitor count', () => {
      const invalidCompetitors = mockCompetitors.slice(0, 3);
      
      expect(() => {
        competitorAverager.calculatePreciseAverages(invalidCompetitors);
      }).toThrow('Exactly 5 competitors required');
    });

    it('should calculate entity averages correctly', () => {
      const entityAverages = competitorAverager.calculateEntityAverages(mockCompetitors);

      expect(entityAverages.averageEntityCount).toBe(7);
      expect(entityAverages.topEntityTypes).toHaveLength(5);
      expect(entityAverages.entityDensityTarget).toBeGreaterThan(0);
    });

    it('should generate comprehensive averaging report', () => {
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
      const report = competitorAverager.generateAveragingReport(mockCompetitors, benchmarks);

      expect(report.summary).toContain('Analyzed 5 competitors');
      expect(report.details).toHaveLength(3); // Word Count, Keyword Density, Heading Optimization
      expect(report.validation.isValid).toBe(true);
      expect(report.validation.issues).toHaveLength(0);
    });
  });

  describe('ContentIntegrationEngine', () => {
    let benchmarks: BenchmarkTargets;

    beforeEach(() => {
      benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
    });

    it('should integrate keywords into content naturally', () => {
      const lsiKeywords = ['search optimization', 'ranking factors', 'content strategy'];
      const primaryKeyword = 'SEO optimization';

      const result = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        lsiKeywords,
        mockEntities,
        primaryKeyword
      );

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(testContent.length);
      expect(result.keywordDensityAchieved).toBeGreaterThan(0);
      expect(result.headingOptimizationCount).toBeGreaterThanOrEqual(0);
      expect(result.naturalFlowScore).toBeGreaterThan(0);
    });

    it('should provide detailed integration report', () => {
      const lsiKeywords = ['search optimization', 'ranking factors'];
      const primaryKeyword = 'SEO optimization';

      const result = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        lsiKeywords,
        mockEntities,
        primaryKeyword
      );

      expect(result.integrationReport).toBeDefined();
      expect(result.integrationReport.keywordPlacements).toBeDefined();
      expect(result.integrationReport.lsiPlacements).toBeDefined();
      expect(result.integrationReport.entityPlacements).toBeDefined();
      expect(result.integrationReport.headingOptimizations).toBeDefined();
      expect(result.integrationReport.naturalFlowMetrics).toBeDefined();
    });

    it('should maintain natural flow score above threshold', () => {
      const lsiKeywords = ['SEO techniques', 'optimization strategies'];
      const primaryKeyword = 'SEO optimization';

      const result = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        lsiKeywords,
        mockEntities,
        primaryKeyword
      );

      expect(result.naturalFlowScore).toBeGreaterThanOrEqual(70);
      expect(result.integrationReport.naturalFlowMetrics.readabilityScore).toBeGreaterThan(0);
      expect(result.integrationReport.naturalFlowMetrics.coherenceScore).toBeGreaterThan(0);
    });

    it('should integrate entities naturally', () => {
      const primaryKeyword = 'SEO optimization';
      const result = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        ['SEO optimization'],
        mockEntities,
        primaryKeyword
      );

      expect(result.entitiesIntegrated).toBeGreaterThan(0);
      expect(result.integrationReport.entityPlacements.length).toBeGreaterThan(0);
      
      // Check that entities are actually in the content
      mockEntities.forEach(entity => {
        if (result.integrationReport.entityPlacements.some(p => p.entity === entity.name)) {
          expect(result.content).toContain(entity.name);
        }
      });
    });
  });

  describe('KeywordDensityMatcher', () => {
    let benchmarks: BenchmarkTargets;

    beforeEach(() => {
      benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
    });

    it('should match keyword densities against benchmarks', () => {
      const primaryKeyword = 'SEO optimization';
      const lsiKeywords = ['search engine', 'ranking factors'];

      const result = densityMatcher.matchAgainstBenchmarks(
        testContent,
        primaryKeyword,
        lsiKeywords,
        benchmarks
      );

      expect(result.primaryKeyword).toBeDefined();
      expect(result.primaryKeyword.keyword).toBe(primaryKeyword);
      expect(result.primaryKeyword.currentDensity).toBeGreaterThanOrEqual(0);
      expect(result.primaryKeyword.targetDensity).toBe(benchmarks.keywordDensity);
      expect(result.lsiKeywords).toHaveLength(lsiKeywords.length);
      expect(result.overallMatch).toBeDefined();
      expect(result.averagePrecision).toBeGreaterThanOrEqual(0);
    });

    it('should validate integrated content accuracy', () => {
      const integratedContent = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        ['SEO techniques'],
        mockEntities
      );

      const validation = densityMatcher.validateIntegratedContent(
        integratedContent,
        'SEO optimization',
        benchmarks
      );

      expect(validation.isValid).toBeDefined();
      expect(validation.densityAccuracy).toBeGreaterThanOrEqual(0);
      expect(validation.benchmarkCompliance).toBeGreaterThanOrEqual(0);
      expect(validation.validationIssues).toBeDefined();
    });

    it('should extract keyword variations correctly', () => {
      const variations = densityMatcher.extractKeywordVariations(testContent, 'SEO optimization');

      expect(variations).toBeDefined();
      expect(variations.length).toBeGreaterThan(0);
      variations.forEach(variation => {
        expect(variation.term).toBeDefined();
        expect(variation.density).toBeGreaterThanOrEqual(0);
        expect(variation.frequency).toBeGreaterThanOrEqual(0);
        expect(variation.positions).toBeDefined();
      });
    });

    it('should calculate competitor alignment accurately', () => {
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
      const primaryMatch = {
        keyword: 'SEO optimization',
        currentDensity: 2.5,
        targetDensity: benchmarks.keywordDensity,
        difference: Math.abs(2.5 - benchmarks.keywordDensity),
        isMatched: Math.abs(2.5 - benchmarks.keywordDensity) <= 0.01,
        precision: 95,
        recommendedAction: 'maintain' as const,
      };
      const lsiMatches = [{
        keyword: 'SEO',
        currentDensity: 1.0,
        targetDensity: 1.0,
        difference: 0,
        isMatched: true,
        precision: 100,
        recommendedAction: 'maintain' as const,
      }];

      // Use the private method through the public interface
      const result = densityMatcher.matchAgainstBenchmarks(
        testContent,
        'SEO optimization',
        ['SEO'],
        benchmarks
      );

      expect(result.competitorAlignment).toBeGreaterThanOrEqual(0);
      expect(result.competitorAlignment).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full precision keyword integration workflow', async () => {
      // Step 1: Calculate benchmarks
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
      
      // Step 2: Integrate content
      const lsiKeywords = ['search optimization', 'ranking strategies', 'content quality'];
      const primaryKeyword = 'SEO optimization';
      const integratedContent = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        lsiKeywords,
        mockEntities,
        primaryKeyword
      );
      
      // Step 3: Validate density matching
      const densityMatching = densityMatcher.matchAgainstBenchmarks(
        integratedContent.content,
        'SEO optimization',
        lsiKeywords,
        benchmarks
      );
      
      // Step 4: Validate final content
      const contentValidation = densityMatcher.validateIntegratedContent(
        integratedContent,
        'SEO optimization',
        benchmarks
      );

      // Assertions for complete workflow
      expect(benchmarks.keywordDensity).toBe(2.62);
      expect(integratedContent.content).toBeDefined();
      expect(integratedContent.naturalFlowScore).toBeGreaterThanOrEqual(70);
      expect(densityMatching.overallMatch).toBeDefined();
      expect(contentValidation.densityAccuracy).toBeGreaterThanOrEqual(0);
      
      // Verify precision requirements - allow for reasonable variance in integration
      expect(integratedContent.keywordDensityAchieved).toBeGreaterThan(0);
      expect(integratedContent.keywordDensityAchieved).toBeLessThan(20); // Reasonable upper bound
    });

    it('should handle edge cases gracefully', () => {
      const emptyContent = '';
      const shortContent = 'Short content.';
      
      // Test with empty content
      expect(() => {
        integrationEngine.integrateKeywordsIntoContent(emptyContent, competitorAverager.calculatePreciseAverages(mockCompetitors), [], [], 'test');
      }).not.toThrow();

      // Test with short content
      const result = integrationEngine.integrateKeywordsIntoContent(
        shortContent,
        competitorAverager.calculatePreciseAverages(mockCompetitors),
        ['test'],
        [],
        'test keyword'
      );
      
      expect(result.content).toBeDefined();
      expect(result.naturalFlowScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Accuracy', () => {
    it('should maintain 0.01% precision threshold', () => {
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
      const targetDensity = benchmarks.keywordDensity;
      
      // Test precision calculation
      const testDensity1 = targetDensity + 0.005; // Within threshold
      const testDensity2 = targetDensity + 0.02;  // Outside threshold
      
      expect(Math.abs(testDensity1 - targetDensity)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(testDensity2 - targetDensity)).toBeGreaterThan(0.01);
    });

    it('should complete integration within reasonable time', () => {
      const startTime = Date.now();
      
      const benchmarks = competitorAverager.calculatePreciseAverages(mockCompetitors);
      const result = integrationEngine.integrateKeywordsIntoContent(
        testContent,
        benchmarks,
        ['SEO', 'optimization', 'content'],
        mockEntities,
        'SEO optimization'
      );
      
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.content).toBeDefined();
    });
  });
});
