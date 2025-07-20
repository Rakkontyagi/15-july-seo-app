/**
 * Comprehensive tests for CompetitorDataAverager
 * Tests the CORE functionality of competitor data averaging with 0.1% precision
 */

import { CompetitorDataAverager, CompetitorData, LSIKeywordData, EntityData, HeadingData } from '../competitor-data-averager';

describe('CompetitorDataAverager', () => {
  let averager: CompetitorDataAverager;
  let mockCompetitors: CompetitorData[];

  beforeEach(() => {
    averager = new CompetitorDataAverager();
    
    // Create comprehensive mock competitor data
    mockCompetitors = [
      {
        url: 'https://competitor1.com',
        wordCount: 1500,
        keywordDensity: 2.5,
        optimizedHeadings: 8,
        lsiKeywords: [
          { keyword: 'digital marketing', frequency: 5, density: 0.33, context: ['intro', 'conclusion'] },
          { keyword: 'SEO strategy', frequency: 3, density: 0.20, context: ['body'] }
        ],
        entities: [
          { text: 'Google', type: 'ORGANIZATION', frequency: 4, confidence: 0.95, context: ['paragraph1'] },
          { text: 'New York', type: 'LOCATION', frequency: 2, confidence: 0.90, context: ['paragraph2'] }
        ],
        readabilityScore: 75,
        contentQuality: 85,
        headings: [
          { level: 1, text: 'Main Title', keywordOptimized: true, lsiKeywords: ['digital marketing'] },
          { level: 2, text: 'Subtitle', keywordOptimized: true, lsiKeywords: ['SEO strategy'] }
        ],
        content: 'Sample content for competitor 1...'
      },
      {
        url: 'https://competitor2.com',
        wordCount: 1800,
        keywordDensity: 2.8,
        optimizedHeadings: 10,
        lsiKeywords: [
          { keyword: 'digital marketing', frequency: 6, density: 0.33, context: ['intro', 'body'] },
          { keyword: 'content strategy', frequency: 4, density: 0.22, context: ['body'] }
        ],
        entities: [
          { text: 'Facebook', type: 'ORGANIZATION', frequency: 3, confidence: 0.92, context: ['paragraph1'] },
          { text: 'California', type: 'LOCATION', frequency: 1, confidence: 0.88, context: ['paragraph3'] }
        ],
        readabilityScore: 78,
        contentQuality: 88,
        headings: [
          { level: 1, text: 'Another Title', keywordOptimized: true, lsiKeywords: ['digital marketing'] }
        ],
        content: 'Sample content for competitor 2...'
      },
      {
        url: 'https://competitor3.com',
        wordCount: 1200,
        keywordDensity: 2.2,
        optimizedHeadings: 6,
        lsiKeywords: [
          { keyword: 'digital marketing', frequency: 4, density: 0.33, context: ['intro'] },
          { keyword: 'online advertising', frequency: 2, density: 0.17, context: ['body'] }
        ],
        entities: [
          { text: 'Amazon', type: 'ORGANIZATION', frequency: 5, confidence: 0.97, context: ['paragraph1'] },
          { text: 'Seattle', type: 'LOCATION', frequency: 3, confidence: 0.93, context: ['paragraph2'] }
        ],
        readabilityScore: 72,
        contentQuality: 82,
        headings: [
          { level: 1, text: 'Third Title', keywordOptimized: false, lsiKeywords: [] }
        ],
        content: 'Sample content for competitor 3...'
      },
      {
        url: 'https://competitor4.com',
        wordCount: 2000,
        keywordDensity: 3.0,
        optimizedHeadings: 12,
        lsiKeywords: [
          { keyword: 'digital marketing', frequency: 7, density: 0.35, context: ['intro', 'body', 'conclusion'] },
          { keyword: 'social media', frequency: 5, density: 0.25, context: ['body'] }
        ],
        entities: [
          { text: 'Microsoft', type: 'ORGANIZATION', frequency: 6, confidence: 0.96, context: ['paragraph1'] },
          { text: 'Washington', type: 'LOCATION', frequency: 2, confidence: 0.89, context: ['paragraph3'] }
        ],
        readabilityScore: 80,
        contentQuality: 90,
        headings: [
          { level: 1, text: 'Fourth Title', keywordOptimized: true, lsiKeywords: ['digital marketing', 'social media'] }
        ],
        content: 'Sample content for competitor 4...'
      },
      {
        url: 'https://competitor5.com',
        wordCount: 1600,
        keywordDensity: 2.6,
        optimizedHeadings: 9,
        lsiKeywords: [
          { keyword: 'digital marketing', frequency: 5, density: 0.31, context: ['intro', 'body'] },
          { keyword: 'email marketing', frequency: 3, density: 0.19, context: ['body'] }
        ],
        entities: [
          { text: 'Apple', type: 'ORGANIZATION', frequency: 4, confidence: 0.94, context: ['paragraph1'] },
          { text: 'Texas', type: 'LOCATION', frequency: 1, confidence: 0.87, context: ['paragraph2'] }
        ],
        readabilityScore: 76,
        contentQuality: 86,
        headings: [
          { level: 1, text: 'Fifth Title', keywordOptimized: true, lsiKeywords: ['digital marketing'] }
        ],
        content: 'Sample content for competitor 5...'
      }
    ];
  });

  describe('calculateStatisticalAverages', () => {
    it('should calculate precise averages with 0.1% accuracy', async () => {
      const result = await averager.calculateStatisticalAverages(mockCompetitors);

      // Test word count average (1500+1800+1200+2000+1600)/5 = 1620
      expect(result.averageWordCount).toBe(1620);

      // Test keyword density average with 0.001 precision (2.5+2.8+2.2+3.0+2.6)/5 = 2.62
      expect(result.averageKeywordDensity).toBe(2.62);

      // Test optimized headings average (8+10+6+12+9)/5 = 9
      expect(result.averageOptimizedHeadings).toBe(9);

      // Test LSI keyword frequencies
      expect(result.lsiKeywordFrequencies).toBeDefined();
      expect(result.lsiKeywordFrequencies.length).toBeGreaterThan(0);

      // Test entity usage patterns
      expect(result.entityUsagePatterns).toBeDefined();
      expect(result.entityUsagePatterns.length).toBeGreaterThan(0);

      // Test statistical deviations
      expect(result.standardDeviations).toBeDefined();
      expect(result.standardDeviations.wordCount).toBeGreaterThan(0);

      // Test confidence intervals
      expect(result.confidenceIntervals).toBeDefined();
      expect(result.confidenceIntervals.wordCount.lower).toBeLessThan(result.averageWordCount);
      expect(result.confidenceIntervals.wordCount.upper).toBeGreaterThan(result.averageWordCount);
    });

    it('should analyze LSI keyword frequencies correctly', async () => {
      const result = await averager.calculateStatisticalAverages(mockCompetitors);
      
      // Find 'digital marketing' LSI keyword (appears in all competitors)
      const digitalMarketingLSI = result.lsiKeywordFrequencies.find(lsi => lsi.keyword === 'digital marketing');
      expect(digitalMarketingLSI).toBeDefined();
      expect(digitalMarketingLSI!.averageFrequency).toBe(5.4); // (5+6+4+7+5)/5 = 5.4
      expect(digitalMarketingLSI!.usagePattern).toBe('high');
      expect(digitalMarketingLSI!.contextualRelevance).toBeGreaterThan(0);
    });

    it('should analyze entity usage patterns correctly', async () => {
      const result = await averager.calculateStatisticalAverages(mockCompetitors);
      
      // Find ORGANIZATION entity pattern
      const orgPattern = result.entityUsagePatterns.find(pattern => pattern.entityType === 'ORGANIZATION');
      expect(orgPattern).toBeDefined();
      expect(orgPattern!.averageCount).toBe(4.4); // (4+3+5+6+4)/5 = 4.4
      expect(orgPattern!.commonEntities).toContain('Google');
      expect(orgPattern!.commonEntities).toContain('Facebook');
      expect(orgPattern!.usageDistribution).toHaveLength(5);
    });

    it('should throw error for incorrect competitor count', async () => {
      const invalidCompetitors = mockCompetitors.slice(0, 3); // Only 3 competitors
      
      await expect(averager.calculateStatisticalAverages(invalidCompetitors))
        .rejects.toThrow('Expected 5 competitors, got 3');
    });

    it('should validate competitor data structure', async () => {
      const invalidCompetitor = { ...mockCompetitors[0], wordCount: -100 };
      const invalidCompetitors = [invalidCompetitor, ...mockCompetitors.slice(1)];
      
      await expect(averager.calculateStatisticalAverages(invalidCompetitors))
        .rejects.toThrow('Competitor 1 has invalid word count: -100');
    });
  });

  describe('generateBenchmarkTargets', () => {
    it('should generate exact targets with 0.1% precision', async () => {
      const averages = await averager.calculateStatisticalAverages(mockCompetitors);
      const targets = averager.generateBenchmarkTargets(averages);

      // Test 0.1% precision for keyword density
      expect(targets.targetKeywordDensity).toBe(2.62); // Rounded to 0.001 precision
      expect(targets.targetOptimizedHeadings).toBe(9);
      expect(targets.targetWordCount).toBe(1620);

      // Test LSI keyword targets
      expect(targets.lsiKeywordTargets).toBeDefined();
      expect(targets.lsiKeywordTargets.length).toBeGreaterThan(0);
      
      const digitalMarketingTarget = targets.lsiKeywordTargets.find(target => target.keyword === 'digital marketing');
      expect(digitalMarketingTarget).toBeDefined();
      expect(digitalMarketingTarget!.targetFrequency).toBe(5); // Rounded from 5.4
      expect(digitalMarketingTarget!.placementStrategy).toBeDefined();

      // Test entity integration targets
      expect(targets.entityIntegrationTargets).toBeDefined();
      expect(targets.entityIntegrationTargets.length).toBeGreaterThan(0);
      
      const orgTarget = targets.entityIntegrationTargets.find(target => target.entityType === 'ORGANIZATION');
      expect(orgTarget).toBeDefined();
      expect(orgTarget!.targetCount).toBe(4); // Rounded from 4.4
      expect(orgTarget!.suggestedEntities).toBeDefined();
    });
  });

  describe('precision and accuracy requirements', () => {
    it('should meet 0.1% precision requirement for keyword density', async () => {
      const result = await averager.calculateStatisticalAverages(mockCompetitors);
      
      // Manual calculation: (2.5+2.8+2.2+3.0+2.6)/5 = 13.1/5 = 2.62
      const expectedAverage = 2.62;
      const actualAverage = result.averageKeywordDensity;
      
      // Test precision to 3 decimal places (0.001 = 0.1% of typical keyword density values)
      expect(Math.abs(actualAverage - expectedAverage)).toBeLessThan(0.001);
    });

    it('should provide statistical confidence intervals', async () => {
      const result = await averager.calculateStatisticalAverages(mockCompetitors);
      
      // Test that confidence intervals are reasonable
      const wordCountCI = result.confidenceIntervals.wordCount;
      const keywordDensityCI = result.confidenceIntervals.keywordDensity;
      
      expect(wordCountCI.lower).toBeLessThan(result.averageWordCount);
      expect(wordCountCI.upper).toBeGreaterThan(result.averageWordCount);
      expect(keywordDensityCI.lower).toBeLessThan(result.averageKeywordDensity);
      expect(keywordDensityCI.upper).toBeGreaterThan(result.averageKeywordDensity);
    });
  });

  describe('error handling and validation', () => {
    it('should handle missing LSI keywords gracefully', async () => {
      const competitorsWithoutLSI = mockCompetitors.map(comp => ({
        ...comp,
        lsiKeywords: []
      }));
      
      const result = await averager.calculateStatisticalAverages(competitorsWithoutLSI);
      expect(result.lsiKeywordFrequencies).toHaveLength(0);
    });

    it('should handle missing entities gracefully', async () => {
      const competitorsWithoutEntities = mockCompetitors.map(comp => ({
        ...comp,
        entities: []
      }));
      
      const result = await averager.calculateStatisticalAverages(competitorsWithoutEntities);
      expect(result.entityUsagePatterns).toHaveLength(0);
    });

    it('should validate LSI keyword structure', async () => {
      const invalidLSICompetitor = {
        ...mockCompetitors[0],
        lsiKeywords: [{ keyword: '', frequency: 'invalid', density: null }] as any
      };
      const invalidCompetitors = [invalidLSICompetitor, ...mockCompetitors.slice(1)];
      
      await expect(averager.calculateStatisticalAverages(invalidCompetitors))
        .rejects.toThrow('Competitor 1 LSI keyword 1 has invalid structure');
    });

    it('should validate entity structure', async () => {
      const invalidEntityCompetitor = {
        ...mockCompetitors[0],
        entities: [{ text: '', type: null, frequency: 'invalid' }] as any
      };
      const invalidCompetitors = [invalidEntityCompetitor, ...mockCompetitors.slice(1)];
      
      await expect(averager.calculateStatisticalAverages(invalidCompetitors))
        .rejects.toThrow('Competitor 1 entity 1 has invalid structure');
    });
  });
});
