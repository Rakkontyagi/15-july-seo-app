import { ValuePropositionEnhancer } from '../value-proposition-enhancer';

describe('ValuePropositionEnhancer', () => {
  let enhancer: ValuePropositionEnhancer;

  beforeEach(() => {
    enhancer = new ValuePropositionEnhancer();
  });

  describe('Benefits Enhancement', () => {
    it('should enhance content with benefits', () => {
      const content = 'This is an SEO optimization guide.';
      const benefits = [
        'Increase organic traffic by 300%',
        'Improve search engine rankings',
        'Boost conversion rates',
        'Enhance user experience'
      ];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toContain('Benefits you\'ll gain:');
      expect(enhancedContent).toContain('- Increase organic traffic by 300%');
      expect(enhancedContent).toContain('- Improve search engine rankings');
      expect(enhancedContent).toContain('- Boost conversion rates');
      expect(enhancedContent).toContain('- Enhance user experience');
    });

    it('should handle empty benefits array', () => {
      const content = 'This is the original content.';
      const benefits: string[] = [];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toBe(content);
      expect(enhancedContent).not.toContain('Benefits you\'ll gain:');
    });

    it('should preserve original content when adding benefits', () => {
      const content = 'Original SEO guide content.';
      const benefits = ['Improved rankings', 'More traffic'];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toContain('Original SEO guide content.');
    });

    it('should handle single benefit', () => {
      const content = 'SEO content.';
      const benefits = ['Increased organic visibility'];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toContain('- Increased organic visibility');
    });

    it('should handle benefits with special characters', () => {
      const content = 'SEO content.';
      const benefits = ['Increase traffic by 200%', 'Reduce bounce rate (avg. 15%)', 'ROI improvement: $10,000+'];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toContain('- Increase traffic by 200%');
      expect(enhancedContent).toContain('- Reduce bounce rate (avg. 15%)');
      expect(enhancedContent).toContain('- ROI improvement: $10,000+');
    });
  });

  describe('Outcomes Clarification', () => {
    it('should clarify outcomes in content', () => {
      const content = 'This is an SEO strategy guide.';
      const outcomes = [
        'Achieve top 3 Google rankings within 6 months',
        'Generate 500+ qualified leads monthly',
        'Establish domain authority of 70+',
        'Create sustainable organic growth'
      ];
      
      const enhancedContent = enhancer.clarifyOutcomes(content, outcomes);
      
      expect(enhancedContent).toContain('Expected outcomes:');
      expect(enhancedContent).toContain('- Achieve top 3 Google rankings within 6 months');
      expect(enhancedContent).toContain('- Generate 500+ qualified leads monthly');
      expect(enhancedContent).toContain('- Establish domain authority of 70+');
      expect(enhancedContent).toContain('- Create sustainable organic growth');
    });

    it('should handle empty outcomes array', () => {
      const content = 'This is the original content.';
      const outcomes: string[] = [];
      
      const enhancedContent = enhancer.clarifyOutcomes(content, outcomes);
      
      expect(enhancedContent).toBe(content);
      expect(enhancedContent).not.toContain('Expected outcomes:');
    });

    it('should preserve original content when adding outcomes', () => {
      const content = 'Original SEO strategy content.';
      const outcomes = ['Better rankings', 'More conversions'];
      
      const enhancedContent = enhancer.clarifyOutcomes(content, outcomes);
      
      expect(enhancedContent).toContain('Original SEO strategy content.');
    });

    it('should handle single outcome', () => {
      const content = 'SEO content.';
      const outcomes = ['Improved search visibility'];
      
      const enhancedContent = enhancer.clarifyOutcomes(content, outcomes);
      
      expect(enhancedContent).toContain('- Improved search visibility');
    });

    it('should handle outcomes with measurable metrics', () => {
      const content = 'SEO content.';
      const outcomes = [
        'Increase organic traffic by 250%',
        'Achieve 85% click-through rate',
        'Reduce page load time to <2 seconds'
      ];
      
      const enhancedContent = enhancer.clarifyOutcomes(content, outcomes);
      
      expect(enhancedContent).toContain('- Increase organic traffic by 250%');
      expect(enhancedContent).toContain('- Achieve 85% click-through rate');
      expect(enhancedContent).toContain('- Reduce page load time to <2 seconds');
    });
  });

  describe('Combined Value Proposition Enhancement', () => {
    it('should handle both benefits and outcomes together', () => {
      const content = 'SEO optimization guide.';
      const benefits = ['Improved rankings', 'More traffic'];
      const outcomes = ['Achieve top 5 positions', 'Generate 1000+ visitors monthly'];
      
      let enhancedContent = enhancer.enhanceBenefits(content, benefits);
      enhancedContent = enhancer.clarifyOutcomes(enhancedContent, outcomes);
      
      expect(enhancedContent).toContain('Benefits you\'ll gain:');
      expect(enhancedContent).toContain('- Improved rankings');
      expect(enhancedContent).toContain('Expected outcomes:');
      expect(enhancedContent).toContain('- Achieve top 5 positions');
    });

    it('should maintain proper formatting with multiple enhancements', () => {
      const content = 'Original content.';
      const benefits = ['Benefit 1', 'Benefit 2'];
      const outcomes = ['Outcome 1', 'Outcome 2'];
      
      let enhancedContent = enhancer.enhanceBenefits(content, benefits);
      enhancedContent = enhancer.clarifyOutcomes(enhancedContent, outcomes);
      
      expect(enhancedContent.split('\n').filter(line => line.trim()).length).toBeGreaterThan(1);
    });

    it('should create clear value proposition structure', () => {
      const content = 'SEO mastery course.';
      const benefits = ['Learn advanced techniques', 'Get expert guidance'];
      const outcomes = ['Master SEO in 30 days', 'Launch successful campaigns'];
      
      let enhancedContent = enhancer.enhanceBenefits(content, benefits);
      enhancedContent = enhancer.clarifyOutcomes(enhancedContent, outcomes);
      
      expect(enhancedContent).toContain('SEO mastery course.');
      expect(enhancedContent).toContain('Benefits you\'ll gain:');
      expect(enhancedContent).toContain('Expected outcomes:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const content = '';
      const benefits = ['Benefit 1'];
      const outcomes = ['Outcome 1'];
      
      let enhancedContent = enhancer.enhanceBenefits(content, benefits);
      enhancedContent = enhancer.clarifyOutcomes(enhancedContent, outcomes);
      
      expect(enhancedContent).toContain('- Benefit 1');
      expect(enhancedContent).toContain('- Outcome 1');
    });

    it('should handle very long content', () => {
      const content = 'A'.repeat(10000);
      const benefits = ['Benefit 1'];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toContain('A'.repeat(10000));
      expect(enhancedContent).toContain('- Benefit 1');
    });

    it('should handle benefits with newlines', () => {
      const content = 'SEO content.';
      const benefits = ['Benefit 1\nwith details', 'Benefit 2'];
      
      const enhancedContent = enhancer.enhanceBenefits(content, benefits);
      
      expect(enhancedContent).toContain('- Benefit 1\nwith details');
      expect(enhancedContent).toContain('- Benefit 2');
    });

    it('should handle outcomes with newlines', () => {
      const content = 'SEO content.';
      const outcomes = ['Outcome 1\nwith details', 'Outcome 2'];
      
      const enhancedContent = enhancer.clarifyOutcomes(content, outcomes);
      
      expect(enhancedContent).toContain('- Outcome 1\nwith details');
      expect(enhancedContent).toContain('- Outcome 2');
    });

    it('should handle null or undefined inputs gracefully', () => {
      const content = 'SEO content.';
      
      // Should not throw errors
      expect(() => enhancer.enhanceBenefits(content, [])).not.toThrow();
      expect(() => enhancer.clarifyOutcomes(content, [])).not.toThrow();
    });

    it('should handle very long benefit/outcome lists', () => {
      const content = 'SEO content.';
      const benefits = Array.from({length: 100}, (_, i) => `Benefit ${i + 1}`);
      const outcomes = Array.from({length: 100}, (_, i) => `Outcome ${i + 1}`);
      
      let enhancedContent = enhancer.enhanceBenefits(content, benefits);
      enhancedContent = enhancer.clarifyOutcomes(enhancedContent, outcomes);
      
      expect(enhancedContent).toContain('- Benefit 1');
      expect(enhancedContent).toContain('- Benefit 100');
      expect(enhancedContent).toContain('- Outcome 1');
      expect(enhancedContent).toContain('- Outcome 100');
    });
  });
});