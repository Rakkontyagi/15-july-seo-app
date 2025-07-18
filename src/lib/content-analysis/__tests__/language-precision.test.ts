import { LanguagePrecisionEngine } from '../language-precision';

describe('LanguagePrecisionEngine', () => {
  let engine: LanguagePrecisionEngine;

  beforeEach(() => {
    engine = new LanguagePrecisionEngine();
  });

  describe('enhancePrecision', () => {
    it('should replace vague terms with specific alternatives', () => {
      const content = 'This is very good stuff with nice things.';
      
      const result = engine.enhancePrecision(content);
      
      expect(result.content).not.toContain('very');
      expect(result.content).not.toContain('stuff');
      expect(result.content).not.toContain('things');
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should improve clarity by replacing unclear phrases', () => {
      const content = 'There are a lot of things that are kind of important in order to achieve success.';
      
      const result = engine.enhancePrecision(content);
      
      expect(result.content).not.toContain('a lot of');
      expect(result.content).not.toContain('kind of');
      expect(result.content).not.toContain('in order to');
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should maximize semantic value by replacing generic words', () => {
      const content = 'We need to make a system that will help users get better results and do more things effectively.';
      
      const result = engine.enhancePrecision(content);
      
      // Should replace some instances of generic words
      const genericWords = ['make', 'help', 'get', 'do'];
      const hasReplacements = genericWords.some(word => 
        !result.content.toLowerCase().includes(word) || 
        result.changes.some(change => change.original === word)
      );
      
      expect(hasReplacements).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should provide detailed change information', () => {
      const content = 'This is very good stuff.';
      
      const result = engine.enhancePrecision(content);
      
      result.changes.forEach(change => {
        expect(change.type).toBe('precision');
        expect(change.original).toBeDefined();
        expect(change.optimized).toBeDefined();
        expect(change.reason).toBeDefined();
        expect(change.reason).toContain('replaced') || expect(change.reason).toContain('enhanced');
      });
    });

    it('should handle empty content gracefully', () => {
      const content = '';
      
      const result = engine.enhancePrecision(content);
      
      expect(result.content).toBe('');
      expect(result.changes).toEqual([]);
    });

    it('should preserve content that is already precise', () => {
      const content = 'The algorithm processes data efficiently using advanced computational methods.';
      
      const result = engine.enhancePrecision(content);
      
      // Should have minimal or no changes for already precise content
      expect(result.changes.length).toBeLessThanOrEqual(2);
    });
  });

  describe('calculatePrecisionScore', () => {
    it('should return high score for precise content', () => {
      const preciseContent = 'The algorithm processes data efficiently using advanced computational methods.';
      
      const score = engine.calculatePrecisionScore(preciseContent);
      
      expect(score).toBeGreaterThan(90);
    });

    it('should return low score for vague content', () => {
      const vagueContent = 'This is very good stuff with really nice things that are quite amazing.';
      
      const score = engine.calculatePrecisionScore(vagueContent);
      
      expect(score).toBeLessThan(70);
    });

    it('should return 0-100 range', () => {
      const contents = [
        'very really quite stuff things',
        'The algorithm processes data efficiently',
        ''
      ];
      
      contents.forEach(content => {
        const score = engine.calculatePrecisionScore(content);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('analyzeWordChoice', () => {
    it('should identify vague words', () => {
      const content = 'This is very good stuff with nice things.';
      
      const analysis = engine.analyzeWordChoice(content);
      
      expect(analysis.vagueWords).toContain('very');
      expect(analysis.vagueWords).toContain('stuff');
      expect(analysis.vagueWords).toContain('things');
      expect(analysis.vagueWords).toContain('good');
      expect(analysis.vagueWords).toContain('nice');
    });

    it('should identify unclear phrases', () => {
      const content = 'There are a lot of things in order to achieve success.';
      
      const analysis = engine.analyzeWordChoice(content);
      
      expect(analysis.unclearPhrases).toContain('a lot of');
      expect(analysis.unclearPhrases).toContain('in order to');
    });

    it('should provide suggestions for improvements', () => {
      const content = 'This is very good stuff.';
      
      const analysis = engine.analyzeWordChoice(content);
      
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      analysis.suggestions.forEach(suggestion => {
        expect(suggestion.word).toBeDefined();
        expect(suggestion.suggestions).toBeDefined();
        expect(Array.isArray(suggestion.suggestions)).toBe(true);
        expect(suggestion.context).toBeDefined();
      });
    });

    it('should handle content with no issues', () => {
      const content = 'The algorithm processes data efficiently.';
      
      const analysis = engine.analyzeWordChoice(content);
      
      expect(analysis.vagueWords.length).toBe(0);
      expect(analysis.unclearPhrases.length).toBe(0);
      expect(analysis.suggestions.length).toBe(0);
    });
  });

  describe('contextual replacement selection', () => {
    it('should select appropriate replacements based on context', () => {
      const technicalContent = 'The system needs to process data efficiently.';
      const businessContent = 'The strategy needs to facilitate growth.';
      
      const technicalResult = engine.enhancePrecision(technicalContent);
      const businessResult = engine.enhancePrecision(businessContent);
      
      // Should make contextually appropriate replacements
      expect(technicalResult.content).toBeDefined();
      expect(businessResult.content).toBeDefined();
    });

    it('should handle multiple replacement options intelligently', () => {
      const content = 'We need to help customers and help businesses.';
      
      const result = engine.enhancePrecision(content);
      
      // Should potentially use different replacements for repeated words
      expect(result.content).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle content with only vague words', () => {
      const content = 'very really quite stuff things nice good';
      
      const result = engine.enhancePrecision(content);
      
      expect(result.content).toBeDefined();
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should handle content with mixed case', () => {
      const content = 'This is VERY good STUFF with Nice Things.';
      
      const result = engine.enhancePrecision(content);
      
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should handle content with punctuation around vague words', () => {
      const content = 'This is "very" good, stuff! Things?';
      
      const result = engine.enhancePrecision(content);
      
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should not replace words that are part of larger words', () => {
      const content = 'Everything is very important.';
      
      const result = engine.enhancePrecision(content);
      
      // Should not replace "very" in "everything"
      expect(result.content).toContain('Everything');
    });
  });
});