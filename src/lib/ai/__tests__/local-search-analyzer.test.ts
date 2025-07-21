/**
 * Unit Tests for Local Search Analyzer
 * Tests regional search pattern analysis and local optimization recommendations
 */

import { LocalSearchAnalyzer, LocalSearchPatternAnalysisResult } from '../local-search-analyzer';

describe('LocalSearchAnalyzer', () => {
  let analyzer: LocalSearchAnalyzer;

  beforeEach(() => {
    analyzer = new LocalSearchAnalyzer();
  });

  describe('analyze', () => {
    describe('UAE/Dubai analysis', () => {
      it('should analyze UAE search patterns correctly', () => {
        const result = analyzer.analyze('UAE', 'SEO services');

        expect(result.regionalSearchBehavior).toContain('High mobile search usage.');
        expect(result.regionalSearchBehavior).toContain('Emphasis on luxury and high-end products.');
        expect(result.localOptimizationPatterns).toContain('Inclusion of Arabic keywords alongside English.');
        expect(result.culturalSearchPreferences).toContain('Formal and respectful tone.');
        expect(result.regionSpecificContentStructure).toContain('Often includes sections on cultural relevance.');
        expect(result.localUserIntentClassification).toContain('Strong transactional intent for services.');
        expect(result.recommendations).toContain('Ensure mobile-first design and localized content.');
      });

      it('should handle Dubai-specific searches', () => {
        const result = analyzer.analyze('Dubai', 'digital marketing');

        expect(result.regionalSearchBehavior).toContain('High mobile search usage.');
        expect(result.localOptimizationPatterns).toContain('Inclusion of Arabic keywords alongside English.');
        expect(result.culturalSearchPreferences).toContain('Formal and respectful tone.');
      });
    });

    describe('UK analysis', () => {
      it('should analyze UK search patterns correctly', () => {
        const result = analyzer.analyze('UK', 'SEO optimization');

        expect(result.regionalSearchBehavior).toContain('Preference for detailed, factual information.');
        expect(result.regionalSearchBehavior).toContain('Lower tolerance for hyperbolic claims.');
        expect(result.localOptimizationPatterns).toContain('British English spelling and terminology.');
        expect(result.culturalSearchPreferences).toContain('Reserved and factual communication style.');
        expect(result.regionSpecificContentStructure).toContain('Structured with clear headings and bullet points.');
        expect(result.localUserIntentClassification).toContain('Strong informational intent.');
        expect(result.recommendations).toContain('Use British English and avoid overly promotional language.');
      });

      it('should handle United Kingdom variations', () => {
        const result = analyzer.analyze('United Kingdom', 'content marketing');

        expect(result.regionalSearchBehavior).toContain('Preference for detailed, factual information.');
        expect(result.localOptimizationPatterns).toContain('British English spelling and terminology.');
      });
    });

    describe('US analysis', () => {
      it('should analyze US search patterns correctly', () => {
        const result = analyzer.analyze('US', 'SEO services');

        expect(result.regionalSearchBehavior).toContain('Direct and benefit-focused search queries.');
        expect(result.regionalSearchBehavior).toContain('High expectation for immediate value.');
        expect(result.localOptimizationPatterns).toContain('American English spelling and terminology.');
        expect(result.culturalSearchPreferences).toContain('Direct and action-oriented communication.');
        expect(result.regionSpecificContentStructure).toContain('Clear value propositions and CTAs.');
        expect(result.localUserIntentClassification).toContain('Mixed transactional and informational intent.');
        expect(result.recommendations).toContain('Emphasize clear benefits and strong calls-to-action.');
      });

      it('should handle United States variations', () => {
        const result = analyzer.analyze('United States', 'digital marketing');

        expect(result.regionalSearchBehavior).toContain('Direct and benefit-focused search queries.');
        expect(result.localOptimizationPatterns).toContain('American English spelling and terminology.');
      });
    });

    describe('Australia analysis', () => {
      it('should analyze Australian search patterns correctly', () => {
        const result = analyzer.analyze('Australia', 'SEO services');

        expect(result.regionalSearchBehavior).toContain('Casual and friendly search approach.');
        expect(result.regionalSearchBehavior).toContain('Preference for authentic, down-to-earth content.');
        expect(result.localOptimizationPatterns).toContain('Australian English spelling and slang.');
        expect(result.culturalSearchPreferences).toContain('Informal but professional tone.');
        expect(result.regionSpecificContentStructure).toContain('Conversational style with practical examples.');
        expect(result.localUserIntentClassification).toContain('Balanced informational and transactional intent.');
        expect(result.recommendations).toContain('Use Australian English and maintain a friendly, approachable tone.');
      });

      it('should handle AU abbreviation', () => {
        const result = analyzer.analyze('AU', 'content marketing');

        expect(result.regionalSearchBehavior).toContain('Casual and friendly search approach.');
        expect(result.localOptimizationPatterns).toContain('Australian English spelling and slang.');
      });
    });

    describe('default/unknown region analysis', () => {
      it('should provide generic analysis for unknown regions', () => {
        const result = analyzer.analyze('Unknown Country', 'SEO services');

        expect(result.regionalSearchBehavior).toContain('General search behavior patterns.');
        expect(result.localOptimizationPatterns).toContain('Standard SEO optimization techniques.');
        expect(result.culturalSearchPreferences).toContain('Professional and neutral tone.');
        expect(result.regionSpecificContentStructure).toContain('Standard content structure with clear headings.');
        expect(result.localUserIntentClassification).toContain('Mixed search intent patterns.');
        expect(result.recommendations).toContain('Follow general SEO best practices and maintain professional tone.');
      });

      it('should handle empty region', () => {
        const result = analyzer.analyze('', 'SEO services');

        expect(result.regionalSearchBehavior).toContain('General search behavior patterns.');
        expect(result.localOptimizationPatterns).toContain('Standard SEO optimization techniques.');
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('keyword-specific analysis', () => {
    it('should incorporate keyword context in analysis', () => {
      const seoResult = analyzer.analyze('UAE', 'SEO services');
      const ecommerceResult = analyzer.analyze('UAE', 'ecommerce platform');

      // Both should have UAE-specific patterns
      expect(seoResult.regionalSearchBehavior).toContain('High mobile search usage.');
      expect(ecommerceResult.regionalSearchBehavior).toContain('High mobile search usage.');

      // But recommendations might differ based on keyword
      expect(seoResult.recommendations).toBeDefined();
      expect(ecommerceResult.recommendations).toBeDefined();
    });

    it('should handle special characters in keywords', () => {
      const result = analyzer.analyze('UAE', 'SEO & SEM services');

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty keywords', () => {
      const result = analyzer.analyze('UAE', '');

      expect(result).toBeDefined();
      expect(result.regionalSearchBehavior.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('case sensitivity and normalization', () => {
    it('should handle case-insensitive region matching', () => {
      const lowerResult = analyzer.analyze('uae', 'SEO services');
      const upperResult = analyzer.analyze('UAE', 'SEO services');
      const mixedResult = analyzer.analyze('Uae', 'SEO services');

      expect(lowerResult.regionalSearchBehavior).toEqual(upperResult.regionalSearchBehavior);
      expect(upperResult.regionalSearchBehavior).toEqual(mixedResult.regionalSearchBehavior);
    });

    it('should handle case-insensitive keyword matching', () => {
      const lowerResult = analyzer.analyze('UAE', 'seo services');
      const upperResult = analyzer.analyze('UAE', 'SEO SERVICES');
      const mixedResult = analyzer.analyze('UAE', 'Seo Services');

      expect(lowerResult.regionalSearchBehavior).toEqual(upperResult.regionalSearchBehavior);
      expect(upperResult.regionalSearchBehavior).toEqual(mixedResult.regionalSearchBehavior);
    });
  });

  describe('result structure validation', () => {
    it('should return properly structured results', () => {
      const result = analyzer.analyze('UAE', 'SEO services');

      expect(result).toHaveProperty('regionalSearchBehavior');
      expect(result).toHaveProperty('localOptimizationPatterns');
      expect(result).toHaveProperty('culturalSearchPreferences');
      expect(result).toHaveProperty('regionSpecificContentStructure');
      expect(result).toHaveProperty('localUserIntentClassification');
      expect(result).toHaveProperty('recommendations');

      expect(Array.isArray(result.regionalSearchBehavior)).toBe(true);
      expect(Array.isArray(result.localOptimizationPatterns)).toBe(true);
      expect(Array.isArray(result.culturalSearchPreferences)).toBe(true);
      expect(Array.isArray(result.regionSpecificContentStructure)).toBe(true);
      expect(Array.isArray(result.localUserIntentClassification)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should ensure all arrays have content', () => {
      const regions = ['UAE', 'UK', 'US', 'Australia', 'Unknown'];
      
      regions.forEach(region => {
        const result = analyzer.analyze(region, 'SEO services');
        
        expect(result.regionalSearchBehavior.length).toBeGreaterThan(0);
        expect(result.localOptimizationPatterns.length).toBeGreaterThan(0);
        expect(result.culturalSearchPreferences.length).toBeGreaterThan(0);
        expect(result.regionSpecificContentStructure.length).toBeGreaterThan(0);
        expect(result.localUserIntentClassification.length).toBeGreaterThan(0);
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null inputs gracefully', () => {
      expect(() => analyzer.analyze(null as any, 'SEO services')).not.toThrow();
      expect(() => analyzer.analyze('UAE', null as any)).not.toThrow();
    });

    it('should handle undefined inputs gracefully', () => {
      expect(() => analyzer.analyze(undefined as any, 'SEO services')).not.toThrow();
      expect(() => analyzer.analyze('UAE', undefined as any)).not.toThrow();
    });

    it('should handle very long inputs', () => {
      const longRegion = 'A'.repeat(1000);
      const longKeyword = 'B'.repeat(1000);

      expect(() => analyzer.analyze(longRegion, 'SEO services')).not.toThrow();
      expect(() => analyzer.analyze('UAE', longKeyword)).not.toThrow();
    });

    it('should handle special characters and unicode', () => {
      const unicodeRegion = '阿联酋';
      const unicodeKeyword = 'SEO 服务 🚀';

      expect(() => analyzer.analyze(unicodeRegion, 'SEO services')).not.toThrow();
      expect(() => analyzer.analyze('UAE', unicodeKeyword)).not.toThrow();
    });

    it('should handle HTML/script injection attempts', () => {
      const maliciousRegion = '<script>alert("xss")</script>';
      const maliciousKeyword = '"; DROP TABLE users; --';

      expect(() => analyzer.analyze(maliciousRegion, 'SEO services')).not.toThrow();
      expect(() => analyzer.analyze('UAE', maliciousKeyword)).not.toThrow();
    });
  });
});
