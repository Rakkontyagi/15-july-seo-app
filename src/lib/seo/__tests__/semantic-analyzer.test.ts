import { SemanticAnalyzer } from '../semantic-analyzer';

// Mock compromise
jest.mock('compromise', () => {
  const mockDoc = {
    topics: () => ({
      json: () => [
        { text: 'SEO', count: 3 },
        { text: 'optimization', count: 2 },
        { text: 'content', count: 4 }
      ],
      out: (format: string) => format === 'array' ? ['SEO', 'optimization', 'content'] : []
    }),
    entities: () => ({
      json: () => [
        { text: 'Google', count: 2 },
        { text: 'website', count: 3 }
      ],
      out: (format: string) => format === 'array' ? ['Google', 'website'] : []
    }),
    sentences: () => ({
      json: () => [
        { text: 'SEO is important for website optimization.' },
        { text: 'Content quality affects search rankings.' }
      ],
      length: 2
    }),
    nouns: () => ({
      json: () => [
        { text: 'optimization' },
        { text: 'content' },
        { text: 'website' },
        { text: 'rankings' }
      ],
      toPlural: () => ({ text: 'optimizations' }),
      out: (format: string) => format === 'array' ? ['optimization', 'content', 'website', 'rankings'] : []
    }),
    verbs: () => ({
      toPastTense: () => ({ text: 'optimized' }),
      toPresentTense: () => ({ text: 'optimize' }),
      length: 1
    })
  };

  return jest.fn(() => mockDoc);
});

describe('SemanticAnalyzer', () => {
  let analyzer: SemanticAnalyzer;

  beforeEach(() => {
    analyzer = new SemanticAnalyzer();
    jest.clearAllMocks();
  });

  describe('analyzeContent', () => {
    it('should analyze content and return semantic analysis', () => {
      const content = 'SEO optimization is crucial for website content. Google ranks websites based on content quality.';
      
      const result = analyzer.analyzeContent(content);

      expect(result.topics).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.concepts).toBeDefined();
      expect(result.semanticDensity).toBeGreaterThan(0);
      expect(result.topicalCoherence).toBeGreaterThanOrEqual(0);
      expect(result.contentThemes).toBeDefined();
    });

    it('should handle empty content', () => {
      const result = analyzer.analyzeContent('');

      expect(result.topics).toEqual([]);
      expect(result.entities).toEqual([]);
      expect(result.concepts).toEqual([]);
      expect(result.semanticDensity).toBe(0);
      expect(result.topicalCoherence).toBe(0);
      expect(result.contentThemes).toEqual([]);
    });

    it('should respect analysis options', () => {
      const content = 'SEO optimization content for testing.';
      
      const result = analyzer.analyzeContent(content, {
        includeEntities: false,
        analyzeConcepts: false,
        findRelationships: false,
        extractThemes: false
      });

      expect(result.entities).toEqual([]);
      expect(result.concepts).toEqual([]);
      expect(result.relationships).toEqual([]);
      expect(result.contentThemes).toEqual([]);
    });

    it('should filter topics by minimum frequency', () => {
      const content = 'SEO optimization content for testing.';
      
      const result = analyzer.analyzeContent(content, {
        minTopicFrequency: 5 // Higher than any topic count in mock
      });

      expect(result.topics).toEqual([]);
    });

    it('should limit number of topics', () => {
      const content = 'SEO optimization content for testing.';
      
      const result = analyzer.analyzeContent(content, {
        maxTopics: 2
      });

      expect(result.topics.length).toBeLessThanOrEqual(2);
    });
  });

  describe('identifyTopicalRelationships', () => {
    it('should identify relationships between similar content', () => {
      const content1 = 'SEO optimization is important for website rankings.';
      const content2 = 'Website optimization helps improve search engine rankings.';

      const result = analyzer.identifyTopicalRelationships(content1, content2);

      expect(result.similarityScore).toBeGreaterThan(0);
      expect(result.commonTopics).toBeDefined();
      expect(result.uniqueTopics1).toBeDefined();
      expect(result.uniqueTopics2).toBeDefined();
      expect(result.semanticOverlap).toBeGreaterThanOrEqual(0);
      expect(result.conceptualDistance).toBeGreaterThanOrEqual(0);
      expect(result.linkingOpportunities).toBeDefined();
    });

    it('should return low similarity for unrelated content', () => {
      const content1 = 'SEO optimization techniques for websites.';
      const content2 = 'Cooking recipes for delicious meals.';

      const result = analyzer.identifyTopicalRelationships(content1, content2);

      expect(result.similarityScore).toBeLessThan(0.5);
      expect(result.commonTopics).toHaveLength(0);
    });

    it('should find linking opportunities', () => {
      const content1 = 'SEO optimization is crucial for website success.';
      const content2 = 'Website optimization techniques improve search rankings.';

      const result = analyzer.identifyTopicalRelationships(content1, content2);

      expect(result.linkingOpportunities).toBeDefined();
      expect(Array.isArray(result.linkingOpportunities)).toBe(true);
    });

    it('should handle identical content', () => {
      const content = 'SEO optimization is important for websites.';

      const result = analyzer.identifyTopicalRelationships(content, content);

      expect(result.similarityScore).toBeCloseTo(1, 1);
      expect(result.semanticOverlap).toBeCloseTo(1, 1);
    });
  });

  describe('findContentClusters', () => {
    it('should group similar content into clusters', () => {
      const contentItems = [
        { id: '1', content: 'SEO optimization techniques for websites.' },
        { id: '2', content: 'Website optimization best practices.' },
        { id: '3', content: 'Cooking recipes for healthy meals.' },
        { id: '4', content: 'SEO strategies for better rankings.' }
      ];

      const clusters = analyzer.findContentClusters(contentItems);

      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      
      if (clusters.length > 0) {
        expect(clusters[0]).toHaveProperty('clusterId');
        expect(clusters[0]).toHaveProperty('items');
        expect(clusters[0]).toHaveProperty('commonThemes');
        expect(clusters[0]).toHaveProperty('coherenceScore');
      }
    });

    it('should handle single item', () => {
      const contentItems = [
        { id: '1', content: 'SEO optimization techniques.' }
      ];

      const clusters = analyzer.findContentClusters(contentItems);

      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
    });

    it('should handle empty input', () => {
      const clusters = analyzer.findContentClusters([]);

      expect(clusters).toEqual([]);
    });
  });

  describe('backward compatibility', () => {
    it('should maintain backward compatibility with simple interface', () => {
      const content = 'SEO optimization content for testing.';
      
      const result = analyzer.analyzeContent(content);

      // Check that the old interface still works
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('entities');
      expect(Array.isArray(result.topics)).toBe(true);
      expect(Array.isArray(result.entities)).toBe(true);
    });

    it('should calculate simple topical relationships', () => {
      const content1 = 'SEO optimization techniques.';
      const content2 = 'Website optimization strategies.';

      const result = analyzer.identifyTopicalRelationships(content1, content2);

      expect(typeof result.similarityScore).toBe('number');
      expect(result.similarityScore).toBeGreaterThanOrEqual(0);
      expect(result.similarityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('error handling', () => {
    it('should handle malformed content gracefully', () => {
      const malformedContent = '\x00\x01\x02invalid content\x03\x04';

      expect(() => {
        analyzer.analyzeContent(malformedContent);
      }).not.toThrow();
    });

    it('should handle very long content', () => {
      const longContent = 'SEO optimization '.repeat(10000);

      const result = analyzer.analyzeContent(longContent);

      expect(result).toBeDefined();
      expect(result.topics).toBeDefined();
    });

    it('should handle special characters', () => {
      const specialContent = 'SEO & optimization: "best practices" for websites! @2023 #seo';

      const result = analyzer.analyzeContent(specialContent);

      expect(result).toBeDefined();
      expect(result.topics).toBeDefined();
    });
  });

  describe('performance considerations', () => {
    it('should complete analysis within reasonable time', async () => {
      const content = 'SEO optimization is crucial for website success. ' +
                    'Content quality affects search engine rankings. ' +
                    'Website optimization techniques improve visibility.';

      const startTime = Date.now();
      const result = analyzer.analyzeContent(content);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeDefined();
    });

    it('should handle multiple analyses efficiently', () => {
      const contents = [
        'SEO optimization techniques for websites.',
        'Content marketing strategies for businesses.',
        'Website development best practices.',
        'Search engine ranking factors.',
        'Digital marketing optimization methods.'
      ];

      const startTime = Date.now();
      const results = contents.map(content => analyzer.analyzeContent(content));
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.topics).toBeDefined();
      });
    });
  });

  describe('semantic density calculation', () => {
    it('should calculate semantic density correctly', () => {
      const richContent = 'SEO optimization techniques for website content marketing. ' +
                         'Search engine algorithms analyze content quality and relevance. ' +
                         'Digital marketing strategies improve online visibility.';

      const result = analyzer.analyzeContent(richContent);

      expect(result.semanticDensity).toBeGreaterThan(0);
      expect(result.semanticDensity).toBeLessThanOrEqual(1);
    });

    it('should return low density for sparse content', () => {
      const sparseContent = 'The quick brown fox jumps over the lazy dog.';

      const result = analyzer.analyzeContent(sparseContent);

      expect(result.semanticDensity).toBeGreaterThanOrEqual(0);
      expect(result.semanticDensity).toBeLessThan(0.5);
    });
  });

  describe('topical coherence', () => {
    it('should calculate coherence for related topics', () => {
      const coherentContent = 'SEO optimization improves website rankings. ' +
                             'Search engine optimization techniques enhance visibility. ' +
                             'Website optimization strategies boost organic traffic.';

      const result = analyzer.analyzeContent(coherentContent);

      expect(result.topicalCoherence).toBeGreaterThanOrEqual(0);
      expect(result.topicalCoherence).toBeLessThanOrEqual(1);
    });

    it('should return low coherence for unrelated topics', () => {
      const incoherentContent = 'SEO optimization techniques. Cooking recipes. Weather forecast.';

      const result = analyzer.analyzeContent(incoherentContent);

      expect(result.topicalCoherence).toBeGreaterThanOrEqual(0);
      expect(result.topicalCoherence).toBeLessThan(0.5);
    });
  });
});
