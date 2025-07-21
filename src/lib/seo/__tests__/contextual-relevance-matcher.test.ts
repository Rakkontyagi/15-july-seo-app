import { ContextualRelevanceMatcher } from '../contextual-relevance-matcher';

// Mock compromise
jest.mock('compromise', () => {
  const mockDoc = {
    entities: () => ({
      out: (format: string) => format === 'array' ? ['SEO', 'Google', 'website'] : []
    }),
    topics: () => ({
      out: (format: string) => format === 'array' ? ['optimization', 'search', 'ranking'] : []
    }),
    nouns: () => ({
      out: (format: string) => format === 'array' ? ['optimization', 'content', 'website', 'ranking'] : []
    }),
    verbs: () => ({
      out: (format: string) => format === 'array' ? ['optimize', 'improve', 'enhance'] : []
    }),
    adjectives: () => ({
      out: (format: string) => format === 'array' ? ['good', 'better', 'effective'] : []
    })
  };

  return jest.fn(() => mockDoc);
});

describe('ContextualRelevanceMatcher', () => {
  let matcher: ContextualRelevanceMatcher;

  beforeEach(() => {
    matcher = new ContextualRelevanceMatcher();
    jest.clearAllMocks();
  });

  describe('matchRelevance', () => {
    it('should match highly relevant content', () => {
      const content = 'SEO optimization is crucial for website ranking and search visibility.';
      const linkTargetContent = 'Advanced SEO techniques help improve website ranking in search engines.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.isRelevant).toBe(true);
      expect(result.relevanceScore).toBeGreaterThan(60);
      expect(result.topicalAlignment).toBeGreaterThan(0);
      expect(result.contextualFit).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should identify low relevance content', () => {
      const content = 'SEO optimization techniques for websites.';
      const linkTargetContent = 'Cooking recipes for delicious meals and healthy eating.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.isRelevant).toBe(false);
      expect(result.relevanceScore).toBeLessThan(60);
      expect(result.recommendations).toContain(expect.stringContaining('below threshold'));
    });

    it('should find common topics between content', () => {
      const content = 'SEO optimization and search ranking strategies.';
      const linkTargetContent = 'Website optimization for better search rankings.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.commonTopics).toBeDefined();
      expect(Array.isArray(result.commonTopics)).toBe(true);
      expect(result.commonTopics.length).toBeGreaterThan(0);
    });

    it('should identify missing context keywords', () => {
      const content = 'Basic SEO information.';
      const linkTargetContent = 'Advanced SEO optimization techniques, keyword research, link building, and content marketing strategies.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.missingContextKeywords).toBeDefined();
      expect(Array.isArray(result.missingContextKeywords)).toBe(true);
    });

    it('should provide detailed analysis', () => {
      const content = 'SEO optimization for websites.';
      const linkTargetContent = 'Website SEO best practices.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.detailedAnalysis).toBeDefined();
      expect(result.detailedAnalysis.sharedTopics).toBeDefined();
      expect(result.detailedAnalysis.sharedEntities).toBeDefined();
      expect(result.detailedAnalysis.keywordOverlap).toBeDefined();
    });

    it('should respect analysis options', () => {
      const content = 'SEO optimization content.';
      const linkTargetContent = 'SEO best practices guide.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        includeSemanticAnalysis: false,
        includeEntityAnalysis: false,
        includeIntentAnalysis: false
      });

      expect(result.semanticSimilarity).toBe(0);
      expect(result.entityOverlap).toBe(0);
      expect(result.intentAlignment).toBe(0);
    });

    it('should handle minimum relevance threshold', () => {
      const content = 'SEO content.';
      const linkTargetContent = 'Unrelated cooking content.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        minimumRelevanceThreshold: 80
      });

      expect(result.isRelevant).toBe(false);
    });
  });

  describe('matchRelevanceSimple', () => {
    it('should provide backward compatibility', () => {
      const content = 'SEO optimization techniques.';
      const linkTargetContent = 'SEO best practices.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevanceSimple(content, linkTargetContent, mainKeyword);

      expect(result).toHaveProperty('isRelevant');
      expect(result).toHaveProperty('relevanceScore');
      expect(result).toHaveProperty('commonTopics');
      expect(result).toHaveProperty('missingContextKeywords');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('semantic analysis', () => {
    it('should calculate semantic similarity', () => {
      const content = 'SEO optimization improves website ranking.';
      const linkTargetContent = 'Website optimization enhances search rankings.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        includeSemanticAnalysis: true
      });

      expect(result.semanticSimilarity).toBeGreaterThan(0);
      expect(result.semanticSimilarity).toBeLessThanOrEqual(100);
    });

    it('should calculate entity overlap', () => {
      const content = 'Google SEO guidelines for websites.';
      const linkTargetContent = 'Google search optimization best practices.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        includeEntityAnalysis: true
      });

      expect(result.entityOverlap).toBeGreaterThanOrEqual(0);
      expect(result.entityOverlap).toBeLessThanOrEqual(100);
    });

    it('should analyze intent alignment', () => {
      const content = 'Learn SEO optimization techniques.';
      const linkTargetContent = 'SEO tutorial for beginners.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        includeIntentAnalysis: true
      });

      expect(result.intentAlignment).toBeGreaterThan(0);
      expect(result.intentAlignment).toBeLessThanOrEqual(100);
    });
  });

  describe('keyword analysis', () => {
    it('should extract keywords by frequency', () => {
      const content = 'SEO SEO optimization optimization website website ranking';
      const linkTargetContent = 'SEO optimization for website ranking improvement';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        keywordWeighting: 'frequency'
      });

      expect(result.relevanceScore).toBeGreaterThan(0);
    });

    it('should extract keywords semantically', () => {
      const content = 'SEO optimization techniques for better rankings';
      const linkTargetContent = 'Website optimization strategies for search engines';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword, {
        keywordWeighting: 'semantic'
      });

      expect(result.relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle empty content', () => {
      const result = matcher.matchRelevance('', '', 'SEO');

      expect(result.isRelevant).toBe(false);
      expect(result.relevanceScore).toBe(0);
      expect(result.commonTopics).toHaveLength(0);
    });

    it('should handle very short content', () => {
      const result = matcher.matchRelevance('SEO', 'SEO', 'SEO');

      expect(result).toBeDefined();
      expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters', () => {
      const content = 'SEO & optimization: "best practices" for websites!';
      const linkTargetContent = 'Website optimization (SEO) techniques & strategies.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result).toBeDefined();
      expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long content', () => {
      const longContent = 'SEO optimization '.repeat(1000);
      const linkTargetContent = 'SEO best practices '.repeat(500);
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(longContent, linkTargetContent, mainKeyword);

      expect(result).toBeDefined();
      expect(result.relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('recommendations', () => {
    it('should provide specific recommendations for low topical alignment', () => {
      const content = 'SEO optimization techniques.';
      const linkTargetContent = 'Completely unrelated cooking content.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('topical alignment')
      )).toBe(true);
    });

    it('should provide positive feedback for good matches', () => {
      const content = 'SEO optimization for websites.';
      const linkTargetContent = 'SEO best practices and optimization techniques.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      if (result.isRelevant) {
        expect(result.recommendations.some(r => 
          r.toLowerCase().includes('good') || r.toLowerCase().includes('match')
        )).toBe(true);
      }
    });
  });

  describe('confidence calculation', () => {
    it('should calculate higher confidence for longer content', () => {
      const shortContent = 'SEO';
      const longContent = 'SEO optimization techniques for improving website ranking in search engines with comprehensive strategies and best practices.';
      const linkTargetContent = 'SEO best practices guide.';
      const mainKeyword = 'SEO';

      const shortResult = matcher.matchRelevance(shortContent, linkTargetContent, mainKeyword);
      const longResult = matcher.matchRelevance(longContent, linkTargetContent, mainKeyword);

      expect(longResult.confidence).toBeGreaterThanOrEqual(shortResult.confidence);
    });

    it('should calculate confidence based on relevance score', () => {
      const content = 'SEO optimization techniques.';
      const highRelevanceTarget = 'SEO optimization best practices and techniques.';
      const lowRelevanceTarget = 'Cooking recipes and meal planning.';
      const mainKeyword = 'SEO';

      const highResult = matcher.matchRelevance(content, highRelevanceTarget, mainKeyword);
      const lowResult = matcher.matchRelevance(content, lowRelevanceTarget, mainKeyword);

      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });
  });

  describe('performance', () => {
    it('should complete analysis within reasonable time', () => {
      const content = 'SEO optimization techniques for website ranking improvement.';
      const linkTargetContent = 'Advanced SEO strategies and best practices for search engines.';
      const mainKeyword = 'SEO';

      const startTime = Date.now();
      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeDefined();
    });

    it('should handle multiple analyses efficiently', () => {
      const content = 'SEO optimization techniques.';
      const targets = Array.from({ length: 10 }, (_, i) => `SEO content ${i}`);
      const mainKeyword = 'SEO';

      const startTime = Date.now();
      const results = targets.map(target => 
        matcher.matchRelevance(content, target, mainKeyword)
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('detailed analysis', () => {
    it('should provide keyword overlap analysis', () => {
      const content = 'SEO optimization techniques for websites.';
      const linkTargetContent = 'Website SEO best practices and optimization.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.detailedAnalysis.keywordOverlap).toBeDefined();
      expect(result.detailedAnalysis.keywordOverlap.totalSharedKeywords).toBeGreaterThanOrEqual(0);
      expect(result.detailedAnalysis.keywordOverlap.highValueKeywords).toBeDefined();
      expect(result.detailedAnalysis.keywordOverlap.uniqueToSource).toBeDefined();
      expect(result.detailedAnalysis.keywordOverlap.uniqueToTarget).toBeDefined();
    });

    it('should identify shared topics and entities', () => {
      const content = 'Google SEO optimization for websites.';
      const linkTargetContent = 'Google search optimization techniques.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.detailedAnalysis.sharedTopics).toBeDefined();
      expect(result.detailedAnalysis.sharedEntities).toBeDefined();
      expect(Array.isArray(result.detailedAnalysis.sharedTopics)).toBe(true);
      expect(Array.isArray(result.detailedAnalysis.sharedEntities)).toBe(true);
    });

    it('should provide semantic concepts', () => {
      const content = 'SEO optimization and content marketing.';
      const linkTargetContent = 'Content optimization for search engines.';
      const mainKeyword = 'SEO';

      const result = matcher.matchRelevance(content, linkTargetContent, mainKeyword);

      expect(result.detailedAnalysis.semanticConcepts).toBeDefined();
      expect(Array.isArray(result.detailedAnalysis.semanticConcepts)).toBe(true);
    });
  });
});
