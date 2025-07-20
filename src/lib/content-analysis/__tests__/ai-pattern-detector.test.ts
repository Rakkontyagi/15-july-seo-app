/**
 * Comprehensive tests for AI Pattern Detector
 * Story 7.1: Internal AI Humanization Engine and Pattern Detection
 */

import { AIPatternDetector } from '../ai-pattern-detector';
import { detectRepetitivePhrases } from '../patterns/repetitive-phrases';
import { analyzeSentenceStructure } from '../patterns/sentence-structure';
import { identifyPredictablePatterns } from '../patterns/predictable-patterns';

describe('AIPatternDetector', () => {
  let detector: AIPatternDetector;

  beforeEach(() => {
    detector = new AIPatternDetector();
  });

  describe('Constructor', () => {
    it('should initialize with AI typical phrases loaded', () => {
      expect(detector).toBeInstanceOf(AIPatternDetector);
    });
  });

  describe('analyze', () => {
    it('should return empty analysis for empty content', () => {
      const result = detector.analyze('');
      
      expect(result).toEqual({
        repetitivePhrases: [],
        sentenceStructurePatterns: [],
        predictableWritingPatterns: [],
        aiTypicalPhraseCount: 0,
        patternFrequencyScore: 0,
        overallRiskScore: 0
      });
    });

    it('should detect AI-typical phrases', () => {
      const content = 'In conclusion, this is important to note that we should leverage synergy.';
      const result = detector.analyze(content);
      
      expect(result.aiTypicalPhraseCount).toBeGreaterThan(0);
      expect(result.patternFrequencyScore).toBeGreaterThan(0);
    });

    it('should detect repetitive phrases', () => {
      const content = 'This is a test. This is a test. This is a test. This is another sentence.';
      const result = detector.analyze(content);

      expect(result.repetitivePhrases.length).toBeGreaterThan(0);
      // Should detect some repetitive phrase with high frequency
      const topPhrase = result.repetitivePhrases[0];
      expect(topPhrase.count).toBeGreaterThanOrEqual(3);
      expect(topPhrase.phrase.length).toBeGreaterThan(0);
    });

    it('should analyze sentence structure patterns', () => {
      const content = 'The cat sat. The dog ran. The bird flew. The fish swam.';
      const result = detector.analyze(content);
      
      expect(result.sentenceStructurePatterns).toBeDefined();
      expect(Array.isArray(result.sentenceStructurePatterns)).toBe(true);
    });

    it('should identify predictable writing patterns', () => {
      const content = 'Furthermore, it is important to note that this content has predictable patterns. Moreover, the analysis shows clear AI indicators.';
      const result = detector.analyze(content);
      
      expect(result.predictableWritingPatterns).toBeDefined();
      expect(Array.isArray(result.predictableWritingPatterns)).toBe(true);
    });

    it('should calculate overall risk score', () => {
      const highRiskContent = 'In conclusion, it is important to note that furthermore, we should leverage synergy. Moreover, this paradigm shift will unlock the potential.';
      const result = detector.analyze(highRiskContent);
      
      expect(result.overallRiskScore).toBeGreaterThan(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(1);
    });

    it('should handle normal human-like content with low risk', () => {
      const humanContent = 'I went to the store yesterday. My friend Sarah was there too. We bought some groceries and chatted about our weekend plans.';
      const result = detector.analyze(humanContent);
      
      expect(result.overallRiskScore).toBeLessThan(0.5);
      expect(result.aiTypicalPhraseCount).toBe(0);
    });
  });

  describe('getRiskLevel', () => {
    it('should return correct risk levels', () => {
      expect(detector.getRiskLevel(0.2)).toBe('low');
      expect(detector.getRiskLevel(0.5)).toBe('medium');
      expect(detector.getRiskLevel(0.7)).toBe('medium');
      expect(detector.getRiskLevel(0.9)).toBe('high');
    });
  });

  describe('getRecommendations', () => {
    it('should provide recommendations for high-risk content', () => {
      const content = 'In conclusion, furthermore, it is important to note that this leverages synergy.';
      const analysis = detector.analyze(content);
      const recommendations = detector.getRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should provide fewer recommendations for low-risk content', () => {
      const content = 'I love pizza. My favorite topping is pepperoni. What about you?';
      const analysis = detector.analyze(content);
      const recommendations = detector.getRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short content', () => {
      const result = detector.analyze('Hi.');
      
      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeDefined();
    });

    it('should handle content with only punctuation', () => {
      const result = detector.analyze('!!! ??? ...');
      
      expect(result).toBeDefined();
      expect(result.repetitivePhrases.length).toBe(0);
    });

    it('should handle content with numbers and special characters', () => {
      const content = 'The year 2024 has 365 days. That\'s 8,760 hours or 525,600 minutes!';
      const result = detector.analyze(content);
      
      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeDefined();
    });

    it('should handle very long content', () => {
      const longContent = 'This is a sentence. '.repeat(100);
      const result = detector.analyze(longContent);
      
      expect(result).toBeDefined();
      expect(result.repetitivePhrases.length).toBeGreaterThan(0);
      expect(result.overallRiskScore).toBeGreaterThan(0.5);
    });
  });

  describe('Performance', () => {
    it('should process content within reasonable time', () => {
      const content = 'This is a test sentence. '.repeat(50);
      const startTime = Date.now();
      
      detector.analyze(content);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

describe('Repetitive Phrases Detection', () => {
  it('should detect phrases of different lengths', () => {
    const content = 'The quick brown fox jumps. The quick brown fox runs. The quick brown fox sleeps.';
    const phrases = detectRepetitivePhrases(content);
    
    expect(phrases.length).toBeGreaterThan(0);
    expect(phrases.some(p => p.phrase.includes('quick brown fox'))).toBe(true);
  });

  it('should calculate severity correctly', () => {
    const content = 'Test phrase here. Test phrase here. Test phrase here. Test phrase here.';
    const phrases = detectRepetitivePhrases(content);
    
    const testPhrase = phrases.find(p => p.phrase.includes('test phrase'));
    expect(testPhrase).toBeDefined();
    expect(testPhrase?.severity).toBe('high');
  });

  it('should ignore common stop words', () => {
    const content = 'The cat is here. The dog is there. The bird is everywhere.';
    const phrases = detectRepetitivePhrases(content);
    
    // Should not flag "the" or "is" as repetitive
    expect(phrases.every(p => !p.phrase.includes('the is'))).toBe(true);
  });
});

describe('Sentence Structure Analysis', () => {
  it('should identify repetitive sentence beginnings', () => {
    const content = 'The cat runs. The dog walks. The bird flies. The fish swims.';
    const patterns = analyzeSentenceStructure(content);
    
    expect(patterns.some(p => p.pattern.includes('Repetitive beginning'))).toBe(true);
  });

  it('should detect uniform sentence lengths', () => {
    const content = 'I like cats. I like dogs. I like birds. I like fish.';
    const patterns = analyzeSentenceStructure(content);
    
    expect(patterns.some(p => p.pattern.includes('Uniform sentence length'))).toBe(true);
  });
});

describe('Predictable Patterns Detection', () => {
  it('should identify conclusion patterns', () => {
    const content = 'This is content. In conclusion, we can see the results.';
    const patterns = identifyPredictablePatterns(content);
    
    expect(patterns.some(p => p.type === 'conclusion')).toBe(true);
  });

  it('should identify transition patterns', () => {
    const content = 'First point here. Furthermore, second point. Moreover, third point.';
    const patterns = identifyPredictablePatterns(content);
    
    expect(patterns.some(p => p.type === 'transition')).toBe(true);
  });

  it('should provide suggestions for improvements', () => {
    const content = 'However, this is a test. Nevertheless, it continues.';
    const patterns = identifyPredictablePatterns(content);
    
    patterns.forEach(pattern => {
      expect(pattern.suggestions).toBeDefined();
      expect(pattern.suggestions.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  let detector: AIPatternDetector;

  beforeEach(() => {
    detector = new AIPatternDetector();
  });

  it('should work with real-world AI-generated content', () => {
    const aiContent = `
      In today's digital landscape, it is important to understand that artificial intelligence
      has become a paradigm shift in how we approach content creation. Furthermore, the
      seamless integration of AI technologies has unlocked the potential for unprecedented
      efficiency. Moreover, this revolutionary breakthrough represents a holistic approach
      to solving complex challenges. In conclusion, the synergy between human creativity
      and AI capabilities will ultimately foster innovation across all industries.
    `;

    const result = detector.analyze(aiContent);
    
    expect(result.overallRiskScore).toBeGreaterThan(0.7);
    expect(result.aiTypicalPhraseCount).toBeGreaterThan(5);
    expect(result.predictableWritingPatterns.length).toBeGreaterThan(0);
  });

  it('should work with human-written content', () => {
    const humanContent = `
      Yesterday, I had the most amazing experience at the local farmer's market. 
      My neighbor Susan recommended this little stall that sells homemade jam. 
      The owner, an elderly gentleman with twinkling eyes, told me stories about 
      his grandmother's recipes while I sampled different flavors. I ended up 
      buying three jars - strawberry, apricot, and a unique lavender honey blend. 
      Can't wait to try them on my morning toast!
    `;
    
    const result = detector.analyze(humanContent);
    
    expect(result.overallRiskScore).toBeLessThan(0.3);
    expect(result.aiTypicalPhraseCount).toBe(0);
    expect(result.repetitivePhrases.length).toBe(0);
  });
});
