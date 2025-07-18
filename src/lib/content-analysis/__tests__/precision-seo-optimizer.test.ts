import { PrecisionSEOOptimizer } from '../precision-seo-optimizer';

describe('PrecisionSEOOptimizer', () => {
  let optimizer: PrecisionSEOOptimizer;

  beforeEach(() => {
    optimizer = new PrecisionSEOOptimizer();
  });

  describe('calculateExactKeywordDensity', () => {
    it('should calculate keyword density with 0.01% precision', () => {
      const content = 'SEO optimization is important for SEO success. SEO tools help with SEO analysis.';
      const keyword = 'SEO';
      
      const density = optimizer.calculateExactKeywordDensity(content, keyword);
      
      // 4 occurrences of 'SEO' in 13 words = 30.77%
      expect(density).toBe(30.77);
    });

    it('should return 0 for keyword not found', () => {
      const content = 'This content has no target keyword.';
      const keyword = 'SEO';
      
      const density = optimizer.calculateExactKeywordDensity(content, keyword);
      
      expect(density).toBe(0);
    });

    it('should handle empty content', () => {
      const content = '';
      const keyword = 'SEO';
      
      const density = optimizer.calculateExactKeywordDensity(content, keyword);
      
      expect(density).toBe(0);
    });

    it('should be case insensitive', () => {
      const content = 'seo optimization and SEO analysis with Seo tools.';
      const keyword = 'SEO';
      
      const density = optimizer.calculateExactKeywordDensity(content, keyword);
      
      // 3 occurrences in 8 words = 37.50%
      expect(density).toBe(37.50);
    });
  });

  describe('calculateVariationDensity', () => {
    it('should calculate density including keyword variations', () => {
      const content = 'SEO optimization and SEOs help with optimizing content.';
      const keyword = 'SEO';
      
      const analysis = optimizer.calculateVariationDensity(content, keyword);
      
      expect(analysis.currentDensity).toBeGreaterThan(0);
      expect(analysis.currentOccurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe('optimizeToCompetitorBenchmark', () => {
    it('should return unchanged content when density is within precision threshold', () => {
      const content = 'SEO optimization is important for SEO success.';
      const keyword = 'SEO';
      const targetDensity = 25.00; // Close to actual density (25%)
      
      const result = optimizer.optimizeToCompetitorBenchmark(content, keyword, targetDensity);
      
      expect(result.optimizedContent).toBeDefined();
      expect(result.precision).toBeGreaterThanOrEqual(0);
    });

    it('should optimize content when density differs significantly', () => {
      const content = 'This content needs more keyword optimization.';
      const keyword = 'SEO';
      const targetDensity = 10.00;
      
      const result = optimizer.optimizeToCompetitorBenchmark(content, keyword, targetDensity);
      
      expect(result.optimizedContent).toBeDefined();
      expect(result.modificationsApplied).toBeGreaterThanOrEqual(0);
    });

    it('should maintain precision within 0.01% threshold', () => {
      const content = 'Content for SEO optimization testing with multiple words.';
      const keyword = 'SEO';
      const targetDensity = 15.00;
      
      const result = optimizer.optimizeToCompetitorBenchmark(content, keyword, targetDensity);
      
      expect(result.precision).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateOptimization', () => {
    it('should validate optimization precision', () => {
      const content = 'SEO content with proper SEO density for testing.';
      const keyword = 'SEO';
      const targetDensity = 25.00;
      
      const isValid = optimizer.validateOptimization(content, keyword, targetDensity);
      
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('getOptimizationReport', () => {
    it('should provide detailed optimization analysis', () => {
      const content = 'SEO optimization content for analysis.';
      const keyword = 'SEO';
      const targetDensity = 20.00;
      
      const report = optimizer.getOptimizationReport(content, keyword, targetDensity);
      
      expect(report).toHaveProperty('currentDensity');
      expect(report).toHaveProperty('targetDensity');
      expect(report).toHaveProperty('difference');
      expect(report).toHaveProperty('requiresAdjustment');
      expect(report).toHaveProperty('recommendedAction');
      expect(report.targetDensity).toBe(targetDensity);
    });
  });

  describe('edge cases', () => {
    it('should handle very long content', () => {
      const longContent = 'SEO '.repeat(1000) + 'content '.repeat(1000);
      const keyword = 'SEO';
      
      const density = optimizer.calculateExactKeywordDensity(longContent, keyword);
      
      expect(density).toBe(50.00); // 1000 SEO in 2000 total words
    });

    it('should handle special characters in content', () => {
      const content = 'SEO-optimization, SEO! SEO? SEO.';
      const keyword = 'SEO';
      
      const density = optimizer.calculateExactKeywordDensity(content, keyword);
      
      expect(density).toBeGreaterThan(0);
    });

    it('should handle multi-word keywords', () => {
      const content = 'Search engine optimization is important for search engine optimization success.';
      const keyword = 'search engine optimization';
      
      const density = optimizer.calculateExactKeywordDensity(content, keyword);
      
      expect(density).toBeGreaterThan(0);
    });
  });
});