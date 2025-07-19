/**
 * Unit Tests for Cultural Adapter
 * Tests cultural adaptation, sensitivity analysis, and regional compliance
 */

import { CulturalAdapter, CulturalAdaptationResult } from '../cultural-adapter';

describe('CulturalAdapter', () => {
  let adapter: CulturalAdapter;

  beforeEach(() => {
    adapter = new CulturalAdapter();
  });

  describe('adaptContentCulturally', () => {
    describe('UAE/Middle East adaptations', () => {
      it('should identify cultural sensitivity issues for UAE', () => {
        const content = 'Our restaurant serves the best pork dishes and alcohol selection in Dubai.';
        const region = 'UAE';
        const tone = 'casual';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.culturalSensitivityIssues.some(issue =>
          issue.includes('alcohol') || issue.includes('pork')
        )).toBe(true);
        expect(result.appropriatenessIssues.some(issue =>
          issue.includes('not be appropriate due to cultural norms')
        )).toBe(true);
        expect(result.culturalRelevanceScore).toBeLessThan(80);
      });

      it('should recommend formal tone for UAE market', () => {
        const content = 'Hey there! Check out our awesome SEO services!';
        const region = 'UAE';
        const tone = 'casual';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.recommendations.some(rec =>
          rec.includes('formal') && rec.includes('respectful')
        )).toBe(true);
        expect(result.culturalRelevanceScore).toBeLessThan(90);
      });

      it('should provide appropriate suggestions for UAE market', () => {
        const content = 'Professional SEO services for business growth.';
        const region = 'UAE';
        const tone = 'professional';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.localMarketAdaptationSuggestions.some(suggestion =>
          suggestion.includes('Arabic keywords')
        )).toBe(true);
        expect(result.localMarketAdaptationSuggestions.some(suggestion =>
          suggestion.includes('local business listings')
        )).toBe(true);
      });
    });

    describe('UK adaptations', () => {
      it('should recommend British English for UK market', () => {
        const content = 'Our optimization services help you realize your goals.';
        const region = 'UK';
        const tone = 'professional';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.localMarketAdaptationSuggestions.some(suggestion =>
          suggestion.includes('British English')
        )).toBe(true);
        expect(result.complianceIssues.some(issue =>
          issue.includes('ASA') || issue.includes('UK advertising')
        )).toBe(true);
      });

      it('should recommend factual approach for UK market', () => {
        const content = 'Amazing, incredible, fantastic SEO results guaranteed!';
        const region = 'UK';
        const tone = 'enthusiastic';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.localMarketAdaptationSuggestions.some(suggestion =>
          suggestion.includes('factual information')
        )).toBe(true);
      });
    });

    describe('US adaptations', () => {
      it('should recommend direct tone for US market', () => {
        const content = 'We humbly suggest that our services might possibly help.';
        const region = 'US';
        const tone = 'very formal';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.recommendations.some(rec =>
          rec.includes('direct') && rec.includes('benefit')
        )).toBe(true);
      });

      it('should suggest American English and clear CTAs', () => {
        const content = 'Professional SEO optimisation services.';
        const region = 'US';
        const tone = 'professional';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.localMarketAdaptationSuggestions.some(suggestion =>
          suggestion.includes('American English')
        )).toBe(true);
        expect(result.localMarketAdaptationSuggestions.some(suggestion =>
          suggestion.includes('calls to action') || suggestion.includes('call to action')
        )).toBe(true);
        expect(result.complianceIssues.some(issue =>
          issue.includes('FTC')
        )).toBe(true);
      });
    });

    describe('general cultural adaptations', () => {
      it('should recommend localization for global references', () => {
        const content = 'Our global SEO strategies work worldwide for everyone.';
        const region = 'UAE';
        const tone = 'professional';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.recommendations.some(rec =>
          rec.includes('Localize') || rec.includes('global references')
        )).toBe(true);
        expect(result.culturalRelevanceScore).toBeLessThanOrEqual(95);
      });

      it('should handle culturally appropriate content well', () => {
        const content = 'Professional SEO services tailored for the UAE market with local expertise.';
        const region = 'UAE';
        const tone = 'professional';

        const result = adapter.adaptContentCulturally(content, region, tone);

        expect(result.culturalRelevanceScore).toBeGreaterThan(80);
        expect(result.culturalSensitivityIssues).toHaveLength(0);
        expect(result.appropriatenessIssues).toHaveLength(0);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty content', () => {
      const result = adapter.adaptContentCulturally('', 'UAE', 'professional');

      expect(result).toBeDefined();
      expect(result.culturalRelevanceScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    it('should handle unknown regions', () => {
      const content = 'SEO services for your business.';
      const region = 'Unknown Country';
      const tone = 'professional';

      const result = adapter.adaptContentCulturally(content, region, tone);

      expect(result).toBeDefined();
      expect(result.culturalRelevanceScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    it('should handle case-insensitive regions', () => {
      const content = 'Professional SEO services.';
      
      const uaeResult = adapter.adaptContentCulturally(content, 'uae', 'professional');
      const UAEResult = adapter.adaptContentCulturally(content, 'UAE', 'professional');
      const mixedResult = adapter.adaptContentCulturally(content, 'Uae', 'professional');

      expect(uaeResult.localMarketAdaptationSuggestions).toEqual(UAEResult.localMarketAdaptationSuggestions);
      expect(UAEResult.localMarketAdaptationSuggestions).toEqual(mixedResult.localMarketAdaptationSuggestions);
    });

    it('should handle very long content', () => {
      const longContent = 'SEO services. '.repeat(1000);
      const region = 'UAE';
      const tone = 'professional';

      const result = adapter.adaptContentCulturally(longContent, region, tone);

      expect(result).toBeDefined();
      expect(result.culturalRelevanceScore).toBeGreaterThan(0);
    });

    it('should handle special characters and unicode', () => {
      const content = 'SEO خدمات 🚀 für Unternehmen';
      const region = 'UAE';
      const tone = 'professional';

      const result = adapter.adaptContentCulturally(content, region, tone);

      expect(result).toBeDefined();
      expect(result.culturalRelevanceScore).toBeGreaterThan(0);
    });

    it('should handle null or undefined inputs gracefully', () => {
      expect(() => adapter.adaptContentCulturally(null as any, 'UAE', 'professional')).not.toThrow();
      expect(() => adapter.adaptContentCulturally('content', null as any, 'professional')).not.toThrow();
      expect(() => adapter.adaptContentCulturally('content', 'UAE', null as any)).not.toThrow();
    });
  });

  describe('cultural relevance scoring', () => {
    it('should calculate appropriate cultural relevance scores', () => {
      const perfectContent = 'Professional SEO services tailored for the UAE market.';
      const problematicContent = 'Hey! Check out our awesome pork and alcohol-focused restaurant in Dubai!';

      const perfectResult = adapter.adaptContentCulturally(perfectContent, 'UAE', 'professional');
      const problematicResult = adapter.adaptContentCulturally(problematicContent, 'UAE', 'casual');

      expect(perfectResult.culturalRelevanceScore).toBeGreaterThan(problematicResult.culturalRelevanceScore);
      expect(perfectResult.culturalRelevanceScore).toBeGreaterThan(80);
      expect(problematicResult.culturalRelevanceScore).toBeLessThan(60);
    });

    it('should ensure scores are within valid range', () => {
      const testCases = [
        { content: '', region: 'UAE', tone: 'professional' },
        { content: 'Perfect professional content for UAE market', region: 'UAE', tone: 'professional' },
        { content: 'Terrible alcohol pork casual content', region: 'UAE', tone: 'casual' }
      ];

      testCases.forEach(({ content, region, tone }) => {
        const result = adapter.adaptContentCulturally(content, region, tone);
        expect(result.culturalRelevanceScore).toBeGreaterThanOrEqual(0);
        expect(result.culturalRelevanceScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('compliance and recommendations', () => {
    it('should provide region-specific compliance recommendations', () => {
      const regions = ['UAE', 'UK', 'US'];
      const content = 'Professional SEO services for your business.';

      regions.forEach(region => {
        const result = adapter.adaptContentCulturally(content, region, 'professional');
        expect(result.complianceIssues.length).toBeGreaterThan(0);
        expect(result.localMarketAdaptationSuggestions.length).toBeGreaterThan(0);
      });
    });

    it('should provide actionable recommendations', () => {
      const content = 'Global SEO services with casual approach.';
      const result = adapter.adaptContentCulturally(content, 'UAE', 'casual');

      result.recommendations.forEach(recommendation => {
        expect(recommendation).toBeTruthy();
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
      });
    });
  });
});
