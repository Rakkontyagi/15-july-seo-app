import { LSIKeywordIntegrator, LSIKeyword, LSIPattern } from '../lsi-integrator';

describe('LSIKeywordIntegrator', () => {
  let integrator: LSIKeywordIntegrator;

  beforeEach(() => {
    integrator = new LSIKeywordIntegrator();
  });

  const mockLSIKeywords: LSIKeyword[] = [
    {
      term: 'optimization',
      relevance: 0.8,
      semantic_score: 0.9,
      context_strength: 0.7
    },
    {
      term: 'ranking',
      relevance: 0.7,
      semantic_score: 0.8,
      context_strength: 0.6
    }
  ];

  const mockCompetitorPatterns: LSIPattern[] = [
    {
      term: 'optimization',
      frequency: 3,
      positions: [5, 15, 25],
      context_words: ['SEO', 'content', 'website'],
      semantic_weight: 0.9
    }
  ];

  describe('integrateSemanticTerms', () => {
    it('should integrate LSI keywords into content', () => {
      const content = 'This is a sample content about SEO strategies and techniques.';
      
      const result = integrator.integrateSemanticTerms(content, mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.optimizedContent).toContain('optimization');
      expect(result.integratedTerms).toBeGreaterThan(0);
      expect(result.semanticCoverage).toBeGreaterThan(0);
    });

    it('should maintain content naturalness', () => {
      const content = 'SEO is important for website visibility and search engine performance.';
      
      const result = integrator.integrateSemanticTerms(content, mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.naturalness_score).toBeGreaterThan(0);
      expect(result.context_preservation).toBeGreaterThan(50);
    });

    it('should filter keywords by minimum semantic score', () => {
      const lowScoreKeywords: LSIKeyword[] = [
        {
          term: 'lowscore',
          relevance: 0.1,
          semantic_score: 0.2, // Below minimum threshold
          context_strength: 0.1
        }
      ];
      
      const result = integrator.integrateSemanticTerms('Test content', lowScoreKeywords, []);
      
      expect(result.integratedTerms).toBe(0);
    });
  });

  describe('analyzeCompetitorLSIPatterns', () => {
    it('should analyze competitor content for LSI patterns', () => {
      const competitorContents = [
        'SEO optimization techniques for better ranking performance.',
        'Content optimization strategies improve search engine visibility.',
        'Website ranking factors include optimization and user experience.'
      ];
      
      const analysis = integrator.analyzeCompetitorLSIPatterns(competitorContents);
      
      expect(analysis.terms.length).toBeGreaterThan(0);
      expect(analysis.patterns.length).toBeGreaterThan(0);
      expect(analysis.semantic_density).toBeGreaterThan(0);
      expect(analysis.context_mapping).toBeDefined();
    });

    it('should calculate semantic density correctly', () => {
      const competitorContents = [
        'optimization ranking SEO',
        'content optimization strategies'
      ];
      
      const analysis = integrator.analyzeCompetitorLSIPatterns(competitorContents);
      
      expect(analysis.semantic_density).toBeGreaterThan(0);
      expect(analysis.semantic_density).toBeLessThanOrEqual(100);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const result = integrator.integrateSemanticTerms('', mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.integratedTerms).toBe(0);
      expect(result.semanticCoverage).toBe(0);
    });

    it('should handle empty LSI keywords array', () => {
      const content = 'Sample content for testing.';
      
      const result = integrator.integrateSemanticTerms(content, [], mockCompetitorPatterns);
      
      expect(result.integratedTerms).toBe(0);
      expect(result.optimizedContent).toBe(content);
    });

    it('should handle very short content', () => {
      const content = 'SEO.';
      
      const result = integrator.integrateSemanticTerms(content, mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.optimizedContent).toBeDefined();
      expect(result.context_preservation).toBeGreaterThan(0);
    });

    it('should handle content with existing LSI terms', () => {
      const content = 'SEO optimization is crucial for ranking improvement.';
      
      const result = integrator.integrateSemanticTerms(content, mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.semanticCoverage).toBeGreaterThan(0);
    });
  });

  describe('semantic analysis', () => {
    it('should calculate semantic coverage accurately', () => {
      const content = 'Content about optimization and ranking strategies.';
      
      const result = integrator.integrateSemanticTerms(content, mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.semanticCoverage).toBeGreaterThan(0);
      expect(result.semanticCoverage).toBeLessThanOrEqual(100);
    });

    it('should preserve context when integrating terms', () => {
      const originalContent = 'SEO strategies are important for website success.';
      
      const result = integrator.integrateSemanticTerms(originalContent, mockLSIKeywords, mockCompetitorPatterns);
      
      expect(result.context_preservation).toBeGreaterThan(70);
      expect(result.optimizedContent).toContain('SEO');
      expect(result.optimizedContent).toContain('website');
    });
  });
});