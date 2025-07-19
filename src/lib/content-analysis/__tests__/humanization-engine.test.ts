/**
 * Comprehensive tests for Internal Humanization Engine
 * Story 7.1: Internal AI Humanization Engine and Pattern Detection
 */

import { InternalHumanizationEngine } from '../humanization-engine';

describe('InternalHumanizationEngine', () => {
  let engine: InternalHumanizationEngine;

  beforeEach(() => {
    engine = new InternalHumanizationEngine();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeInstanceOf(InternalHumanizationEngine);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        aggressiveness: 'aggressive' as const,
        targetAudience: 'academic' as const
      };
      
      const customEngine = new InternalHumanizationEngine(customConfig);
      expect(customEngine).toBeInstanceOf(InternalHumanizationEngine);
    });
  });

  describe('detectAIPatterns', () => {
    it('should detect AI patterns in content', () => {
      const content = 'In conclusion, it is important to note that this leverages synergy.';
      const result = engine.detectAIPatterns(content);
      
      expect(result).toBeDefined();
      expect(result.aiTypicalPhraseCount).toBeGreaterThan(0);
      expect(result.overallRiskScore).toBeGreaterThan(0);
      expect(result.repetitivePhrases).toBeDefined();
      expect(result.sentenceStructurePatterns).toBeDefined();
      expect(result.predictableWritingPatterns).toBeDefined();
    });

    it('should throw error for empty content', () => {
      expect(() => engine.detectAIPatterns('')).toThrow('Content cannot be empty');
    });

    it('should handle whitespace-only content', () => {
      expect(() => engine.detectAIPatterns('   \n\t   ')).toThrow('Content cannot be empty');
    });
  });

  describe('analyzeSentenceVariation', () => {
    it('should analyze sentence structure variation', () => {
      const content = 'Short sentence. This is a longer sentence with more words. Very long sentence that contains multiple clauses and demonstrates complexity.';
      const result = engine.analyzeSentenceVariation(content);
      
      expect(result).toBeDefined();
      expect(result.lengthDistribution).toBeDefined();
      expect(result.structuralVariation).toBeDefined();
      expect(result.flowDiversity).toBeDefined();
      expect(result.predictabilityScore).toBeDefined();
      
      expect(result.lengthDistribution.averageLength).toBeGreaterThan(0);
      expect(result.lengthDistribution.diversityScore).toBeGreaterThanOrEqual(0);
      expect(result.lengthDistribution.diversityScore).toBeLessThanOrEqual(1);
    });

    it('should handle uniform sentence lengths', () => {
      const content = 'I like cats. I like dogs. I like birds.';
      const result = engine.analyzeSentenceVariation(content);
      
      expect(result.lengthDistribution.diversityScore).toBeLessThan(0.5);
      expect(result.predictabilityScore).toBeGreaterThan(0.5);
    });
  });

  describe('assessVocabularyRange', () => {
    it('should assess vocabulary complexity and range', () => {
      const content = 'The sophisticated methodology demonstrates exceptional capabilities through comprehensive analysis.';
      const result = engine.assessVocabularyRange(content);
      
      expect(result).toBeDefined();
      expect(result.complexity).toBeDefined();
      expect(result.range).toBeDefined();
      expect(result.diversity).toBeDefined();
      expect(result.enhancement).toBeDefined();
      
      expect(result.complexity.averageWordLength).toBeGreaterThan(0);
      expect(result.complexity.sophisticationLevel).toBeDefined();
      expect(result.range.uniqueWords).toBeGreaterThan(0);
      expect(result.range.totalWords).toBeGreaterThan(0);
    });

    it('should identify basic vocabulary', () => {
      const content = 'The cat sat on the mat. It was a big cat.';
      const result = engine.assessVocabularyRange(content);
      
      expect(result.complexity.sophisticationLevel).toBe('basic');
      expect(result.complexity.averageWordLength).toBeLessThan(5);
    });
  });

  describe('evaluateContentFlow', () => {
    it('should evaluate content flow and naturalness', () => {
      const content = 'First, we need to understand the basics. Then, we can move to advanced topics. Finally, we apply what we learned.';
      const result = engine.evaluateContentFlow(content);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty content', () => {
      const result = engine.evaluateContentFlow('');
      expect(result).toBe(0);
    });
  });

  describe('identifyHumanElements', () => {
    it('should identify human writing markers', () => {
      const content = 'I think this is interesting. In my experience, people often disagree. You know what I mean?';
      const result = engine.identifyHumanElements(content);
      
      expect(result).toBeDefined();
      expect(result.personalInsights).toBeDefined();
      expect(result.opinions).toBeDefined();
      expect(result.experiences).toBeDefined();
      expect(result.subjectiveCommentary).toBeDefined();
      expect(result.authenticVoice).toBeDefined();
    });
  });

  describe('humanizeContent', () => {
    it('should humanize AI-generated content', () => {
      const aiContent = 'In conclusion, it is important to note that this paradigm shift leverages synergy.';
      const result = engine.humanizeContent(aiContent);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(aiContent); // Should be modified
    });

    it('should throw error for empty content', () => {
      expect(() => engine.humanizeContent('')).toThrow('Content cannot be empty');
    });

    it('should preserve meaning while improving naturalness', () => {
      const content = 'Furthermore, the analysis demonstrates significant improvements.';
      const result = engine.humanizeContent(content);
      
      expect(result).toBeDefined();
      expect(result.toLowerCase()).toContain('analysis');
      expect(result.toLowerCase()).toContain('improvements');
    });
  });

  describe('processContent', () => {
    it('should perform comprehensive content processing', async () => {
      const content = 'In conclusion, this comprehensive analysis demonstrates that the paradigm shift leverages synergy.';
      const result = await engine.processContent(content);
      
      expect(result).toBeDefined();
      expect(result.originalContent).toBe(content);
      expect(result.humanizedContent).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
      
      // Check analysis components
      expect(result.analysis.aiPatterns).toBeDefined();
      expect(result.analysis.sentenceStructure).toBeDefined();
      expect(result.analysis.vocabulary).toBeDefined();
      expect(result.analysis.humanMarkers).toBeDefined();
      
      // Check metrics
      expect(result.metrics.humanizationScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.humanizationScore).toBeLessThanOrEqual(1);
      expect(result.metrics.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.authenticityScore).toBeLessThanOrEqual(1);
      expect(result.metrics.naturalness).toBeGreaterThanOrEqual(0);
      expect(result.metrics.naturalness).toBeLessThanOrEqual(1);
      expect(result.metrics.aiDetectionRisk).toBeGreaterThanOrEqual(0);
      expect(result.metrics.aiDetectionRisk).toBeLessThanOrEqual(1);
    });

    it('should provide recommendations for improvement', async () => {
      const aiContent = 'Furthermore, it is important to understand that this paradigm shift leverages synergy.';
      const result = await engine.processContent(aiContent);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect aggressiveness settings', () => {
      const conservativeEngine = new InternalHumanizationEngine({ aggressiveness: 'conservative' });
      const aggressiveEngine = new InternalHumanizationEngine({ aggressiveness: 'aggressive' });
      
      const content = 'Furthermore, this analysis demonstrates significant results.';
      
      const conservativeResult = conservativeEngine.humanizeContent(content);
      const aggressiveResult = aggressiveEngine.humanizeContent(content);
      
      expect(conservativeResult).toBeDefined();
      expect(aggressiveResult).toBeDefined();
      // Aggressive should make more changes
      expect(aggressiveResult).not.toBe(conservativeResult);
    });

    it('should respect feature toggles', () => {
      const limitedEngine = new InternalHumanizationEngine({
        enabledFeatures: {
          patternDetection: true,
          structureVariation: false,
          vocabularyEnhancement: false,
          humanMarkers: false,
          imperfections: false,
          conversationalElements: false,
          patternBreaking: false
        }
      });
      
      const content = 'This is a test sentence for processing.';
      const result = limitedEngine.humanizeContent(content);
      
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed content gracefully', () => {
      const malformedContent = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ \n\t\r';
      
      expect(() => engine.detectAIPatterns(malformedContent)).not.toThrow();
      expect(() => engine.humanizeContent(malformedContent)).not.toThrow();
    });

    it('should handle very long content', async () => {
      const longContent = 'This is a sentence. '.repeat(1000);
      
      const result = await engine.processContent(longContent);
      expect(result).toBeDefined();
      expect(result.processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle content with mixed languages', () => {
      const mixedContent = 'Hello world. Bonjour le monde. Hola mundo.';
      
      expect(() => engine.detectAIPatterns(mixedContent)).not.toThrow();
      expect(() => engine.humanizeContent(mixedContent)).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should process medium content efficiently', async () => {
      const mediumContent = 'This is a test sentence for performance evaluation. '.repeat(50);
      const startTime = Date.now();
      
      await engine.processContent(mediumContent);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      const content = 'Test content for concurrent processing.';
      
      const promises = Array(5).fill(null).map(() => engine.processContent(content));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.originalContent).toBe(content);
      });
    });
  });

  describe('Quality Assurance', () => {
    it('should improve AI detection risk scores', async () => {
      const aiContent = 'In conclusion, furthermore, it is important to note that this paradigm shift leverages synergy.';
      const result = await engine.processContent(aiContent);
      
      const originalRisk = result.analysis.aiPatterns.overallRiskScore;
      const finalRisk = result.metrics.aiDetectionRisk;
      
      expect(finalRisk).toBeLessThanOrEqual(originalRisk);
    });

    it('should maintain content meaning and intent', async () => {
      const content = 'The research study analyzed customer satisfaction metrics across multiple demographics.';
      const result = await engine.processContent(content);
      
      const humanized = result.humanizedContent.toLowerCase();
      expect(humanized).toContain('research');
      expect(humanized).toContain('customer');
      expect(humanized).toContain('satisfaction');
    });

    it('should increase naturalness scores', async () => {
      const artificialContent = 'Furthermore, the comprehensive analysis demonstrates that the paradigm shift leverages synergy.';
      const result = await engine.processContent(artificialContent);
      
      expect(result.metrics.naturalness).toBeGreaterThan(0.5);
      expect(result.metrics.authenticityScore).toBeGreaterThan(0.5);
    });
  });
});
