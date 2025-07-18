import { AdvancedNLPOptimizer } from '../nlp-optimizer';

describe('AdvancedNLPOptimizer', () => {
  let optimizer: AdvancedNLPOptimizer;

  beforeEach(() => {
    optimizer = new AdvancedNLPOptimizer();
  });

  describe('optimizeForNLP', () => {
    it('should optimize content with all NLP improvements', async () => {
      const content = 'This is a very meticulous approach to navigating the complexities of the realm. The content was written by the author.';
      
      const result = await optimizer.optimizeForNLP(content);
      
      expect(result.optimizedContent).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.changes).toBeDefined();
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should remove prohibited phrases', async () => {
      const content = 'This meticulous approach to navigating complexities in the realm of bespoke solutions.';
      
      const result = await optimizer.optimizeForNLP(content);
      
      expect(result.optimizedContent).not.toContain('meticulous');
      expect(result.optimizedContent).not.toContain('navigating');
      expect(result.optimizedContent).not.toContain('realm');
      expect(result.optimizedContent).not.toContain('bespoke');
      
      const prohibitedChanges = result.changes.filter(c => c.type === 'prohibited');
      expect(prohibitedChanges.length).toBeGreaterThan(0);
    });

    it('should enforce SVO structure', async () => {
      const content = 'The document was written by the author. The system was implemented by the team.';
      
      const result = await optimizer.optimizeForNLP(content);
      
      const svoChanges = result.changes.filter(c => c.type === 'svo');
      expect(svoChanges.length).toBeGreaterThan(0);
      expect(result.metrics.svoCompliance).toBeGreaterThan(0);
    });

    it('should calculate accurate metrics', async () => {
      const content = 'This is a test sentence. Another test sentence follows.';
      
      const result = await optimizer.optimizeForNLP(content);
      
      expect(result.metrics.svoCompliance).toBeGreaterThanOrEqual(0);
      expect(result.metrics.svoCompliance).toBeLessThanOrEqual(100);
      expect(result.metrics.languagePrecisionScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.languagePrecisionScore).toBeLessThanOrEqual(100);
      expect(result.metrics.fillerContentPercentage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.fillerContentPercentage).toBeLessThanOrEqual(100);
      expect(result.metrics.grammarAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.metrics.grammarAccuracy).toBeLessThanOrEqual(100);
      expect(result.metrics.semanticCoherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.semanticCoherenceScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty content gracefully', async () => {
      const content = '';
      
      const result = await optimizer.optimizeForNLP(content);
      
      expect(result.optimizedContent).toBe('');
      expect(result.changes).toEqual([]);
      expect(result.metrics.svoCompliance).toBe(0);
    });

    it('should preserve content meaning while optimizing', async () => {
      const content = 'The very important system helps users achieve their goals effectively.';
      
      const result = await optimizer.optimizeForNLP(content);
      
      // Should remove "very" but preserve core meaning
      expect(result.optimizedContent).toContain('system');
      expect(result.optimizedContent).toContain('users');
      expect(result.optimizedContent).toContain('goals');
      expect(result.optimizedContent).not.toContain('very');
    });
  });

  describe('SVO structure enforcement', () => {
    it('should identify passive voice sentences', () => {
      const content = 'The report was completed by the team.';
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      sentences.forEach(sentence => {
        const analysis = (optimizer as any).analyzeSVOStructure(sentence);
        expect(analysis.needsRestructuring).toBe(true);
      });
    });

    it('should preserve active voice sentences', () => {
      const content = 'The team completed the report.';
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      sentences.forEach(sentence => {
        const analysis = (optimizer as any).analyzeSVOStructure(sentence);
        expect(analysis.needsRestructuring).toBe(false);
      });
    });
  });

  describe('prohibited phrases detection', () => {
    it('should detect all prohibited phrases', async () => {
      const prohibitedPhrases = await (optimizer as any).getProhibitedPhrases();
      
      expect(prohibitedPhrases).toContainEqual(
        expect.objectContaining({ phrase: 'meticulous' })
      );
      expect(prohibitedPhrases).toContainEqual(
        expect.objectContaining({ phrase: 'navigating' })
      );
      expect(prohibitedPhrases).toContainEqual(
        expect.objectContaining({ phrase: 'realm' })
      );
    });

    it('should provide replacement suggestions', async () => {
      const prohibitedPhrases = await (optimizer as any).getProhibitedPhrases();
      
      prohibitedPhrases.forEach((phrase: any) => {
        expect(phrase.replacementSuggestions).toBeDefined();
        expect(Array.isArray(phrase.replacementSuggestions)).toBe(true);
        expect(phrase.replacementSuggestions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sentence complexity optimization', () => {
    it('should identify overly complex sentences', () => {
      const complexSentence = 'This is a very long and complex sentence that contains multiple clauses, which makes it difficult to read, and therefore should be simplified for better comprehension, although it contains important information that needs to be preserved.';
      
      const complexity = (optimizer as any).calculateSentenceComplexity(complexSentence);
      
      expect(complexity.score).toBeGreaterThan(0.5);
      expect(complexity.factors.length).toBeGreaterThan(0);
    });

    it('should preserve simple sentences', () => {
      const simpleSentence = 'This is a simple sentence.';
      
      const complexity = (optimizer as any).calculateSentenceComplexity(simpleSentence);
      
      expect(complexity.score).toBeLessThan(0.5);
    });
  });

  describe('metrics calculation', () => {
    it('should calculate SVO compliance correctly', () => {
      const sentences = ['The team completed the project.', 'The report was written by John.'];
      
      const compliance = (optimizer as any).calculateSVOCompliance(sentences);
      
      expect(compliance).toBe(50); // 1 out of 2 sentences is SVO compliant
    });

    it('should calculate filler percentage correctly', () => {
      const content = 'This is valuable content. This is filler content without value.';
      
      const percentage = (optimizer as any).calculateFillerPercentage(content);
      
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('should identify sentences with direct value', () => {
      const valuableSentence = 'Here is how to implement the solution effectively.';
      const fillerSentence = 'This is just some general information.';
      
      const hasValue1 = (optimizer as any).hasDirectValue(valuableSentence);
      const hasValue2 = (optimizer as any).hasDirectValue(fillerSentence);
      
      expect(hasValue1).toBe(true);
      expect(hasValue2).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle malformed content gracefully', async () => {
      const malformedContent = '...   !!!   ???';
      
      const result = await optimizer.optimizeForNLP(malformedContent);
      
      expect(result).toBeDefined();
      expect(result.optimizedContent).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should handle very short content', async () => {
      const shortContent = 'Hi.';
      
      const result = await optimizer.optimizeForNLP(shortContent);
      
      expect(result.optimizedContent).toBe('Hi.');
      expect(result.changes.length).toBe(0);
    });

    it('should handle content with only punctuation', async () => {
      const punctuationContent = '!@#$%^&*()';
      
      const result = await optimizer.optimizeForNLP(punctuationContent);
      
      expect(result).toBeDefined();
      expect(result.metrics.svoCompliance).toBe(0);
    });
  });
});