import { ContentAuthenticityVerifier, AuthenticityResult, AuthenticityOptions } from '../content-authenticity-verifier';

describe('ContentAuthenticityVerifier', () => {
  let verifier: ContentAuthenticityVerifier;

  beforeEach(() => {
    verifier = new ContentAuthenticityVerifier();
    jest.clearAllMocks();
  });

  describe('verifyAuthenticity', () => {
    it('should verify authentic, natural content', async () => {
      const content = `
        I've been working in this field for years, and honestly, it's been quite a journey.
        What I've learned is that there's no one-size-fits-all solution. Sometimes you need
        to try different approaches until you find what works. That's just how it goes.
      `;

      const result = await verifier.verifyAuthenticity(content);

      expect(result.isAuthentic).toBe(true);
      expect(result.authenticityScore).toBeGreaterThan(70);
      expect(result.naturalFlowScore).toBeGreaterThan(65);
      expect(result.confidence).toBeGreaterThanOrEqual(75);
    });

    it('should detect unnatural, robotic content', async () => {
      const content = `
        It is worth noting that it is crucial to understand that one must consider that
        it is imperative to note that it cannot be overstated that this solution is optimal.
        Firstly, we examine the data. Secondly, we analyze results. Thirdly, we conclude.
      `;

      const result = await verifier.verifyAuthenticity(content);

      expect(result.isAuthentic).toBe(false);
      expect(result.authenticityScore).toBeLessThan(70);
      expect(result.artificialPatterns.length).toBeGreaterThan(2);
      expect(result.artificialPatterns.some(p => p.type === 'unnatural_phrasing')).toBe(true);
      expect(result.artificialPatterns.some(p => p.type === 'robotic_structure')).toBe(true);
    });

    it('should detect inconsistent voice', async () => {
      const content = `
        Hey there! This is super exciting stuff that'll blow your mind!

        According to peer-reviewed research conducted by leading institutions,
        the statistical significance of these findings cannot be understated.

        Furthermore, it is important to note that this comprehensive analysis
        provides cutting-edge insights into state-of-the-art methodologies.

        Anyway, hope this helps! Let me know if you have questions!
      `;

      const result = await verifier.verifyAuthenticity(content);

      // Should detect artificial patterns due to mixed formal/informal tone
      expect(result.artificialPatterns.length).toBeGreaterThan(0);
      expect(result.authenticityScore).toBeLessThan(85);
    });

    it('should detect mechanical rhythm', async () => {
      const content = `
        This is sentence one. This is sentence two. This is sentence three.
        This is sentence four. This is sentence five. This is sentence six.
        This is sentence seven. This is sentence eight. This is sentence nine.
      `;

      const result = await verifier.verifyAuthenticity(content);

      expect(result.artificialPatterns.some(p => p.type === 'mechanical_rhythm')).toBe(true);
      expect(result.naturalFlowScore).toBeLessThan(70);
    });

    it('should detect generic expressions', async () => {
      const content = `
        Our cutting-edge technology provides a state-of-the-art solution with
        revolutionary approach and game-changing innovation. This comprehensive
        solution offers seamless integration with user-friendly interface.
      `;

      const result = await verifier.verifyAuthenticity(content);

      expect(result.artificialPatterns.some(p => p.type === 'generic_expressions')).toBe(true);
      expect(result.authenticityScore).toBeLessThan(80);
    });

    it('should handle different strictness levels', async () => {
      const content = `
        It is worth noting that this solution provides comprehensive functionality.
        Furthermore, it should be emphasized that this approach is effective.
      `;

      const lenientOptions: AuthenticityOptions = {
        strictness: 'lenient',
        checkVoiceConsistency: true,
        analyzeEmotionalTone: true,
        validateNaturalFlow: true
      };

      const strictOptions: AuthenticityOptions = {
        strictness: 'strict',
        checkVoiceConsistency: true,
        analyzeEmotionalTone: true,
        validateNaturalFlow: true
      };

      const lenientResult = await verifier.verifyAuthenticity(content, lenientOptions);
      const strictResult = await verifier.verifyAuthenticity(content, strictOptions);

      expect(lenientResult.authenticityScore).toBeGreaterThan(strictResult.authenticityScore);
      expect(lenientResult.authenticityScore).toBeGreaterThan(strictResult.authenticityScore);
      expect(strictResult.isAuthentic).toBe(false);
    });

    it('should handle empty content', async () => {
      await expect(verifier.verifyAuthenticity('')).rejects.toThrow('Content must be a non-empty string');
    });

    it('should handle null content', async () => {
      await expect(verifier.verifyAuthenticity(null as any)).rejects.toThrow('Content must be a non-empty string');
    });
  });

  describe('ensureNaturalFlow', () => {
    it('should improve unnatural content flow', async () => {
      const content = `
        It is worth noting that it is crucial to understand that one must consider
        that it is imperative to note that this solution is comprehensive.
      `;

      const result = await verifier.ensureNaturalFlow(content);

      expect(result).not.toContain('it is worth noting that');
      expect(result).not.toContain('it is crucial to understand that');
      expect(result).not.toContain('one must consider that');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should preserve natural content', async () => {
      const content = `
        I've found that the best approach is usually the simplest one.
        What works for me might not work for everyone, but here's my take.
      `;

      const result = await verifier.ensureNaturalFlow(content);

      expect(result).toContain('I\'ve found');
      expect(result).toContain('works for me');
      expect(result.length).toBeGreaterThan(content.length * 0.8);
    });

    it('should handle empty content', async () => {
      await expect(verifier.ensureNaturalFlow('')).rejects.toThrow('Content must be a non-empty string');
    });
  });

  describe('detectArtificialPatterns', () => {
    it('should detect multiple pattern types', async () => {
      const content = `
        It is worth noting that firstly, this cutting-edge technology provides
        state-of-the-art solutions. Secondly, it is crucial to understand that
        this comprehensive approach is revolutionary.
      `;

      const patterns = await verifier.detectArtificialPatterns(content);

      expect(patterns.length).toBeGreaterThan(2);
      expect(patterns.some(p => p.type === 'unnatural_phrasing')).toBe(true);
      expect(patterns.some(p => p.type === 'robotic_structure')).toBe(true);
      expect(patterns.some(p => p.type === 'generic_expressions')).toBe(true);
    });

    it('should return empty array for natural content', async () => {
      const content = `
        I love working with this technology. It's been a game-changer for my workflow.
        The results speak for themselves, and I couldn't be happier with the outcome.
      `;

      const patterns = await verifier.detectArtificialPatterns(content);

      expect(patterns.length).toBeLessThan(2);
    });

    it('should provide detailed pattern information', async () => {
      const content = 'It is worth noting that this solution is comprehensive.';

      const patterns = await verifier.detectArtificialPatterns(content);

      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.type).toBeDefined();
        expect(pattern.severity).toMatch(/^(low|medium|high)$/);
        expect(pattern.location).toHaveProperty('start');
        expect(pattern.location).toHaveProperty('end');
        expect(pattern.description).toBeDefined();
        expect(pattern.suggestion).toBeDefined();
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very short content', async () => {
      const content = 'Hi!';

      const result = await verifier.verifyAuthenticity(content);

      expect(result.isAuthentic).toBe(true);
      expect(result.artificialPatterns).toHaveLength(0);
    });

    it('should handle very long content', async () => {
      const content = 'This is a natural sentence that flows well. '.repeat(500);

      const result = await verifier.verifyAuthenticity(content);

      expect(result.confidence).toBeGreaterThan(70);
      expect(result.authenticityScore).toBeGreaterThan(0);
    });

    it('should handle content with special characters', async () => {
      const content = 'This content has émojis 🎉 and spëcial characters!';

      const result = await verifier.verifyAuthenticity(content);

      expect(result.isAuthentic).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle single paragraph content', async () => {
      const content = 'This is a single paragraph with natural flow and authentic voice.';

      const result = await verifier.verifyAuthenticity(content);

      expect(result.isAuthentic).toBe(true);
      expect(result.naturalFlowScore).toBeGreaterThan(50);
    });

    it('should provide meaningful recommendations', async () => {
      const content = `
        It is worth noting that it is crucial to understand that this solution
        provides cutting-edge technology with state-of-the-art functionality.
      `;

      const result = await verifier.verifyAuthenticity(content);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('conversational'))).toBe(true);
    });
  });

  describe('performance and reliability', () => {
    it('should complete verification within reasonable time', async () => {
      const content = 'This is a test sentence for performance. '.repeat(100);
      const startTime = Date.now();

      await verifier.verifyAuthenticity(content);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should be consistent across multiple runs', async () => {
      const content = `
        I've been working with this technology for years, and it's been great.
        The results are consistent, and I'm happy with the performance.
      `;

      const result1 = await verifier.verifyAuthenticity(content);
      const result2 = await verifier.verifyAuthenticity(content);

      expect(result1.isAuthentic).toBe(result2.isAuthentic);
      expect(Math.abs(result1.authenticityScore - result2.authenticityScore)).toBeLessThan(5);
      expect(result1.artificialPatterns.length).toBe(result2.artificialPatterns.length);
    });

    it('should handle concurrent requests', async () => {
      const content = 'This is a test for concurrent authenticity verification.';
      
      const promises = Array(5).fill(null).map(() => 
        verifier.verifyAuthenticity(content)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.isAuthentic).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should maintain accuracy with different content types', async () => {
      const naturalContent = `
        I love this approach because it works well for my needs.
        What I've found is that consistency is key to success.
      `;

      const artificialContent = `
        It is important to note that furthermore, this comprehensive solution
        provides cutting-edge functionality with state-of-the-art technology.
      `;

      const naturalResult = await verifier.verifyAuthenticity(naturalContent);
      const artificialResult = await verifier.verifyAuthenticity(artificialContent);

      expect(naturalResult.isAuthentic).toBe(true);
      expect(artificialResult.authenticityScore).toBeLessThan(naturalResult.authenticityScore);
      expect(naturalResult.authenticityScore).toBeGreaterThan(artificialResult.authenticityScore);
    });
  });
});
