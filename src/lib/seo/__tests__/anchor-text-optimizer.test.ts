import { AnchorTextOptimizer } from '../anchor-text-optimizer';
import { LsiKeyword } from '../types';

describe('AnchorTextOptimizer', () => {
  let optimizer: AnchorTextOptimizer;

  beforeEach(() => {
    optimizer = new AnchorTextOptimizer();
  });

  describe('generateAnchorTextSuggestions', () => {
    const mockLsiKeywords: LsiKeyword[] = [
      { term: 'digital marketing', relevance: 0.9, frequency: 15, context: 'marketing strategy' },
      { term: 'SEO optimization', relevance: 0.8, frequency: 12, context: 'search engine optimization' },
      { term: 'content strategy', relevance: 0.7, frequency: 8, context: 'content planning' }
    ];

    const mockContent = `
      Digital marketing is essential for modern businesses. 
      SEO optimization helps improve search rankings.
      A comprehensive content strategy drives engagement.
      Learn more about effective marketing techniques.
      Best practices for digital marketing success.
    `;

    it('should generate exact match anchor text', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch).toBeDefined();
      expect(exactMatch?.text).toBe('digital marketing');
      expect(exactMatch?.relevanceScore).toBe(100);
    });

    it('should generate LSI keyword anchor texts', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      const lsiSuggestions = suggestions.filter(s => s.type === 'lsi');
      expect(lsiSuggestions.length).toBeGreaterThan(0);
      
      const seoSuggestion = lsiSuggestions.find(s => s.text === 'SEO optimization');
      expect(seoSuggestion).toBeDefined();
      expect(seoSuggestion?.relevanceScore).toBeGreaterThan(80);
    });

    it('should generate natural language anchor texts', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      const naturalSuggestions = suggestions.filter(s => s.type === 'natural');
      expect(naturalSuggestions.length).toBeGreaterThan(0);
      
      // Should find phrases containing the keyword
      const naturalPhrase = naturalSuggestions.find(s => 
        s.text.toLowerCase().includes('digital marketing')
      );
      expect(naturalPhrase).toBeDefined();
    });

    it('should generate branded anchor texts', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      const brandedSuggestions = suggestions.filter(s => s.type === 'branded');
      expect(brandedSuggestions.length).toBeGreaterThan(0);
      
      // Should include generic branded terms
      const learnMore = brandedSuggestions.find(s => s.text === 'learn more');
      expect(learnMore).toBeDefined();
    });

    it('should generate navigational anchor texts', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      const navSuggestions = suggestions.filter(s => s.type === 'navigational');
      expect(navSuggestions.length).toBeGreaterThan(0);
      
      // Should include navigational terms
      const readMore = navSuggestions.find(s => s.text === 'read more');
      expect(readMore).toBeDefined();
    });

    it('should sort suggestions by relevance score', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      // Check that suggestions are sorted in descending order of relevance
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].relevanceScore).toBeGreaterThanOrEqual(
          suggestions[i + 1].relevanceScore
        );
      }
    });

    it('should remove duplicate suggestions', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        mockLsiKeywords
      );

      const texts = suggestions.map(s => s.text);
      const uniqueTexts = [...new Set(texts)];
      
      expect(texts.length).toBe(uniqueTexts.length);
    });

    it('should handle empty content gracefully', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        '',
        mockLsiKeywords
      );

      // Should still generate exact match and LSI suggestions
      expect(suggestions.length).toBeGreaterThan(0);
      
      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch).toBeDefined();
    });

    it('should handle empty LSI keywords', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        mockContent,
        []
      );

      // Should still generate exact, natural, branded, and navigational suggestions
      expect(suggestions.length).toBeGreaterThan(0);
      
      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch).toBeDefined();
      
      const lsiSuggestions = suggestions.filter(s => s.type === 'lsi');
      expect(lsiSuggestions.length).toBe(0);
    });

    it('should handle special characters in keywords', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'e-commerce & marketing',
        'E-commerce & marketing solutions for businesses.',
        []
      );

      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch?.text).toBe('e-commerce & marketing');
    });

    it('should generate phrase match variations', () => {
      const content = 'Best digital marketing strategies for small businesses';
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        content,
        mockLsiKeywords
      );

      const phraseSuggestions = suggestions.filter(s => s.type === 'phrase');
      expect(phraseSuggestions.length).toBeGreaterThan(0);
      
      // Should find phrase variations
      const phraseMatch = phraseSuggestions.find(s => 
        s.text.includes('digital marketing') && s.text !== 'digital marketing'
      );
      expect(phraseMatch).toBeDefined();
    });
  });

  describe('extractNaturalPhrases', () => {
    it('should extract phrases around keywords', () => {
      const content = 'Learn about digital marketing strategies that work for your business.';
      const phrases = optimizer['extractNaturalPhrases'](content, 'digital marketing', 3);

      expect(phrases.length).toBeGreaterThan(0);
      expect(phrases.some(phrase => phrase.includes('digital marketing'))).toBe(true);
    });

    it('should handle multiple occurrences', () => {
      const content = `
        Digital marketing is important. 
        Effective digital marketing strategies help businesses grow.
        Learn digital marketing techniques.
      `;
      const phrases = optimizer['extractNaturalPhrases'](content, 'digital marketing', 2);

      expect(phrases.length).toBeGreaterThan(1);
    });

    it('should respect word limit', () => {
      const content = 'This is a very long sentence about digital marketing strategies and techniques.';
      const phrases = optimizer['extractNaturalPhrases'](content, 'digital marketing', 2);

      phrases.forEach(phrase => {
        const words = phrase.split(' ');
        expect(words.length).toBeLessThanOrEqual(5); // keyword + 2 words before + 2 words after
      });
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate higher scores for exact matches', () => {
      const exactScore = optimizer['calculateRelevanceScore']('digital marketing', 'exact', 0.9);
      const lsiScore = optimizer['calculateRelevanceScore']('SEO optimization', 'lsi', 0.9);

      expect(exactScore).toBeGreaterThan(lsiScore);
    });

    it('should factor in LSI relevance', () => {
      const highRelevanceScore = optimizer['calculateRelevanceScore']('SEO optimization', 'lsi', 0.9);
      const lowRelevanceScore = optimizer['calculateRelevanceScore']('SEO optimization', 'lsi', 0.3);

      expect(highRelevanceScore).toBeGreaterThan(lowRelevanceScore);
    });

    it('should handle different anchor types appropriately', () => {
      const exactScore = optimizer['calculateRelevanceScore']('digital marketing', 'exact', 1.0);
      const phraseScore = optimizer['calculateRelevanceScore']('digital marketing strategies', 'phrase', 1.0);
      const naturalScore = optimizer['calculateRelevanceScore']('learn about digital marketing', 'natural', 1.0);
      const brandedScore = optimizer['calculateRelevanceScore']('click here', 'branded', 1.0);

      expect(exactScore).toBeGreaterThan(phraseScore);
      expect(phraseScore).toBeGreaterThan(naturalScore);
      expect(naturalScore).toBeGreaterThan(brandedScore);
    });
  });

  describe('edge cases', () => {
    it('should handle very short content', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'SEO',
        'SEO',
        []
      );

      expect(suggestions.length).toBeGreaterThan(0);
      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch?.text).toBe('SEO');
    });

    it('should handle very long keywords', () => {
      const longKeyword = 'comprehensive digital marketing strategy implementation guide';
      const suggestions = optimizer.generateAnchorTextSuggestions(
        longKeyword,
        `This is a ${longKeyword} for businesses.`,
        []
      );

      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch?.text).toBe(longKeyword);
    });

    it('should handle non-English characters', () => {
      const suggestions = optimizer.generateAnchorTextSuggestions(
        'café marketing',
        'Best café marketing strategies for success.',
        []
      );

      const exactMatch = suggestions.find(s => s.type === 'exact');
      expect(exactMatch?.text).toBe('café marketing');
    });

    it('should limit the number of suggestions', () => {
      const mockLsiKeywords: LsiKeyword[] = Array.from({ length: 50 }, (_, i) => ({
        term: `keyword${i}`,
        relevance: 0.8,
        frequency: 10,
        context: `context${i}`
      }));

      const suggestions = optimizer.generateAnchorTextSuggestions(
        'digital marketing',
        'Digital marketing content with many keywords.',
        mockLsiKeywords
      );

      // Should limit suggestions to a reasonable number
      expect(suggestions.length).toBeLessThanOrEqual(30);
    });
  });
});
