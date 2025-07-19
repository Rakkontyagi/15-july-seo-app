import { LSIAnchorTextGenerator } from '../lsi-anchor-text-generator';

// Mock compromise
jest.mock('compromise', () => {
  const mockDoc = {
    nouns: () => ({
      toPlural: () => ({ text: 'optimizations' })
    }),
    verbs: () => ({
      toPastTense: () => ({ text: 'optimized' }),
      toPresentTense: () => ({ text: 'optimize' }),
      length: 1
    })
  };
  return jest.fn(() => mockDoc);
});

describe('LSIAnchorTextGenerator', () => {
  let generator: LSIAnchorTextGenerator;

  beforeEach(() => {
    generator = new LSIAnchorTextGenerator();
    jest.clearAllMocks();
  });

  describe('generateAnchorText', () => {
    it('should generate basic anchor text variations', () => {
      const lsiKeywords = ['search optimization', 'website ranking', 'content marketing'];
      const mainKeyword = 'SEO';

      const result = generator.generateAnchorText(lsiKeywords, mainKeyword);

      expect(result).toContain('SEO');
      expect(result).toContain('search optimization');
      expect(result).toContain('website ranking');
      expect(result).toContain('content marketing');
    });

    it('should handle empty LSI keywords', () => {
      const result = generator.generateAnchorText([], 'SEO');

      expect(result).toContain('SEO');
      expect(result.length).toBeGreaterThan(1); // Should include other variations
    });

    it('should handle empty main keyword', () => {
      const lsiKeywords = ['optimization', 'ranking'];
      const result = generator.generateAnchorText(lsiKeywords, '');

      expect(result).toContain('optimization');
      expect(result).toContain('ranking');
    });
  });

  describe('generateAnchorTextStrategy', () => {
    it('should generate comprehensive anchor text strategy', () => {
      const lsiKeywords = ['search optimization', 'website ranking'];
      const mainKeyword = 'SEO';

      const strategy = generator.generateAnchorTextStrategy(lsiKeywords, mainKeyword);

      expect(strategy.variations).toBeDefined();
      expect(strategy.distribution).toBeDefined();
      expect(strategy.recommendations).toBeDefined();
      expect(strategy.diversityScore).toBeGreaterThanOrEqual(0);
      expect(strategy.diversityScore).toBeLessThanOrEqual(100);

      // Check variation types
      const variationTypes = strategy.variations.map(v => v.type);
      expect(variationTypes).toContain('exact');
      expect(variationTypes).toContain('lsi');
    });

    it('should respect maxVariations option', () => {
      const lsiKeywords = ['optimization', 'ranking', 'content', 'marketing', 'strategy'];
      const mainKeyword = 'SEO';

      const strategy = generator.generateAnchorTextStrategy(lsiKeywords, mainKeyword, {
        maxVariations: 5
      });

      expect(strategy.variations.length).toBeLessThanOrEqual(5);
    });

    it('should include branded anchors when provided', () => {
      const lsiKeywords = ['optimization'];
      const mainKeyword = 'SEO';

      const strategy = generator.generateAnchorTextStrategy(lsiKeywords, mainKeyword, {
        brandedAnchors: ['MyBrand', 'Company Name']
      });

      const brandedVariations = strategy.variations.filter(v => v.type === 'branded');
      expect(brandedVariations.length).toBeGreaterThan(0);
      expect(brandedVariations.some(v => v.text === 'MyBrand')).toBe(true);
    });

    it('should calculate diversity score correctly', () => {
      const lsiKeywords = ['optimization', 'ranking'];
      const mainKeyword = 'SEO';

      const strategy = generator.generateAnchorTextStrategy(lsiKeywords, mainKeyword);

      expect(strategy.diversityScore).toBeGreaterThan(0);
      expect(strategy.diversityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getNextAnchorText', () => {
    it('should return anchor text based on usage tracking', () => {
      const lsiKeywords = ['optimization', 'ranking'];
      const mainKeyword = 'SEO';

      const first = generator.getNextAnchorText(lsiKeywords, mainKeyword);
      const second = generator.getNextAnchorText(lsiKeywords, mainKeyword);

      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(first.text).toBeDefined();
      expect(second.text).toBeDefined();
    });

    it('should track usage correctly', () => {
      const lsiKeywords = ['optimization'];
      const mainKeyword = 'SEO';

      // Get same anchor text multiple times
      const anchor1 = generator.getNextAnchorText(lsiKeywords, mainKeyword);
      const anchor2 = generator.getNextAnchorText(lsiKeywords, mainKeyword);

      const stats = generator.getUsageStatistics();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it('should reset usage tracking', () => {
      const lsiKeywords = ['optimization'];
      const mainKeyword = 'SEO';

      generator.getNextAnchorText(lsiKeywords, mainKeyword);
      generator.resetUsageTracking();

      const stats = generator.getUsageStatistics();
      expect(Object.keys(stats).length).toBe(0);
    });
  });

  describe('anchor text types', () => {
    it('should generate exact match anchors', () => {
      const strategy = generator.generateAnchorTextStrategy([], 'SEO optimization');

      const exactMatches = strategy.variations.filter(v => v.type === 'exact');
      expect(exactMatches.length).toBeGreaterThan(0);
      expect(exactMatches[0].text).toBe('SEO optimization');
      expect(exactMatches[0].overOptimizationRisk).toBe('high');
    });

    it('should generate partial match anchors', () => {
      const strategy = generator.generateAnchorTextStrategy([], 'SEO optimization techniques', {
        includePartialMatches: true
      });

      const partialMatches = strategy.variations.filter(v => v.type === 'partial');
      expect(partialMatches.length).toBeGreaterThan(0);
    });

    it('should generate generic anchors', () => {
      const strategy = generator.generateAnchorTextStrategy([], 'SEO');

      const genericAnchors = strategy.variations.filter(v => v.type === 'generic');
      expect(genericAnchors.length).toBeGreaterThan(0);
      expect(genericAnchors.some(v => v.text === 'click here')).toBe(true);
      expect(genericAnchors.some(v => v.text === 'learn more')).toBe(true);
    });

    it('should generate natural language variations', () => {
      const strategy = generator.generateAnchorTextStrategy([], 'SEO optimization');

      const naturalVariations = strategy.variations.filter(v => v.type === 'natural');
      expect(naturalVariations.length).toBeGreaterThan(0);
    });
  });

  describe('over-optimization prevention', () => {
    it('should assess over-optimization risk correctly', () => {
      const strategy = generator.generateAnchorTextStrategy([], 'SEO');

      const highRiskVariations = strategy.variations.filter(v => v.overOptimizationRisk === 'high');
      const lowRiskVariations = strategy.variations.filter(v => v.overOptimizationRisk === 'low');

      expect(highRiskVariations.length).toBeGreaterThan(0);
      expect(lowRiskVariations.length).toBeGreaterThan(0);
    });

    it('should provide recommendations for over-optimization', () => {
      const strategy = generator.generateAnchorTextStrategy([], 'SEO', {
        avoidOverOptimization: true
      });

      expect(strategy.recommendations).toBeDefined();
      expect(Array.isArray(strategy.recommendations)).toBe(true);
    });

    it('should balance anchor text types when requested', () => {
      const strategy = generator.generateAnchorTextStrategy(['optimization'], 'SEO', {
        balanceAnchorTextTypes: true
      });

      const distribution = strategy.distribution;
      expect(distribution.exact).toBeLessThan(0.2); // Should limit exact matches
      expect(distribution.generic).toBeGreaterThan(0.1); // Should include generics
    });
  });

  describe('error handling', () => {
    it('should handle invalid input gracefully', () => {
      expect(() => {
        generator.generateAnchorText(null as any, undefined as any);
      }).not.toThrow();
    });

    it('should handle empty arrays', () => {
      const result = generator.generateAnchorText([], '');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle special characters in keywords', () => {
      const result = generator.generateAnchorText(['SEO & optimization'], 'SEO/SEM');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should handle large keyword lists efficiently', () => {
      const largeKeywordList = Array.from({ length: 100 }, (_, i) => `keyword${i}`);
      
      const startTime = Date.now();
      const strategy = generator.generateAnchorTextStrategy(largeKeywordList, 'main keyword');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(strategy.variations).toBeDefined();
    });

    it('should limit variations appropriately', () => {
      const largeKeywordList = Array.from({ length: 50 }, (_, i) => `keyword${i}`);
      
      const strategy = generator.generateAnchorTextStrategy(largeKeywordList, 'main keyword', {
        maxVariations: 10
      });

      expect(strategy.variations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('distribution calculation', () => {
    it('should calculate optimal distribution', () => {
      const strategy = generator.generateAnchorTextStrategy(['optimization'], 'SEO');

      const distribution = strategy.distribution;
      expect(distribution.exact).toBeDefined();
      expect(distribution.partial).toBeDefined();
      expect(distribution.branded).toBeDefined();
      expect(distribution.generic).toBeDefined();
      expect(distribution.lsi).toBeDefined();
      expect(distribution.natural).toBeDefined();

      // All percentages should sum to 1
      const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(1, 2);
    });

    it('should provide meaningful recommendations', () => {
      const strategy = generator.generateAnchorTextStrategy(['optimization'], 'SEO');

      expect(strategy.recommendations).toBeDefined();
      expect(Array.isArray(strategy.recommendations)).toBe(true);
    });
  });
});
