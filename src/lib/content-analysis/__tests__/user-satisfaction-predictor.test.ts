import { UserSatisfactionPredictor } from '../user-satisfaction-predictor';

describe('UserSatisfactionPredictor', () => {
  let predictor: UserSatisfactionPredictor;

  beforeEach(() => {
    predictor = new UserSatisfactionPredictor();
  });

  describe('Satisfaction Prediction', () => {
    it('should predict satisfaction from positive content', () => {
      const content = 'This is an excellent SEO guide with amazing results. Users love these fantastic strategies that deliver outstanding performance.';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeGreaterThan(60); // Should be positive
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should predict low satisfaction from negative content', () => {
      const content = 'This terrible SEO guide is awful and disappointing. Users hate these horrible strategies that fail miserably.';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeLessThan(40); // Should be negative
      expect(satisfaction).toBeGreaterThanOrEqual(0);
    });

    it('should predict neutral satisfaction from neutral content', () => {
      const content = 'This is an SEO guide with standard information. It provides basic strategies and normal results.';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeGreaterThanOrEqual(40);
      expect(satisfaction).toBeLessThanOrEqual(60);
    });

    it('should achieve >88% satisfaction score requirement for high-quality content', () => {
      const content = 'This exceptional SEO guide delivers outstanding results with brilliant strategies. Users absolutely love these fantastic techniques that provide amazing success and excellent performance. Wonderful content with superb quality.';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeGreaterThanOrEqual(88);
    });

    it('should handle content with mixed sentiment', () => {
      const content = 'This SEO guide has excellent strategies but some disappointing results. Good techniques with poor execution.';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should return valid percentage range', () => {
      const testContents = [
        'Amazing excellent fantastic wonderful superb',
        'Terrible awful horrible disappointing bad',
        'Standard normal typical regular basic',
        'Great good nice helpful useful',
        'Poor weak inadequate insufficient limited'
      ];
      
      testContents.forEach(content => {
        const satisfaction = predictor.predictSatisfaction(content);
        expect(satisfaction).toBeGreaterThanOrEqual(0);
        expect(satisfaction).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Sentiment Analysis Accuracy', () => {
    it('should correctly identify highly positive content', () => {
      const content = 'Outstanding exceptional brilliant amazing fantastic superb wonderful excellent perfect';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeGreaterThan(80);
    });

    it('should correctly identify highly negative content', () => {
      const content = 'Terrible awful horrible disappointing bad poor weak inadequate insufficient';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeLessThan(20);
    });

    it('should handle content with no sentiment words', () => {
      const content = 'SEO optimization strategies for websites. Technical implementation of meta tags and keywords.';
      
      const satisfaction = predictor.predictSatisfaction(content);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should weigh positive and negative words appropriately', () => {
      const positiveContent = 'excellent excellent excellent';
      const negativeContent = 'terrible terrible terrible';
      
      const positiveSatisfaction = predictor.predictSatisfaction(positiveContent);
      const negativeSatisfaction = predictor.predictSatisfaction(negativeContent);
      
      expect(positiveSatisfaction).toBeGreaterThan(negativeSatisfaction);
    });
  });

  describe('Content Quality Assessment', () => {
    it('should predict higher satisfaction for comprehensive content', () => {
      const comprehensiveContent = 'This excellent SEO guide provides outstanding strategies with amazing results. Users love these fantastic techniques that deliver superb performance and wonderful outcomes.';
      const basicContent = 'SEO guide with strategies.';
      
      const comprehensiveSatisfaction = predictor.predictSatisfaction(comprehensiveContent);
      const basicSatisfaction = predictor.predictSatisfaction(basicContent);
      
      expect(comprehensiveSatisfaction).toBeGreaterThan(basicSatisfaction);
    });

    it('should handle technical SEO content appropriately', () => {
      const technicalContent = 'Implement robots.txt configuration for crawler optimization. Configure XML sitemaps with proper schema markup and structured data.';
      
      const satisfaction = predictor.predictSatisfaction(technicalContent);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should predict satisfaction for actionable content', () => {
      const actionableContent = 'Follow these excellent steps to achieve amazing SEO results. Implement these outstanding strategies for fantastic performance.';
      
      const satisfaction = predictor.predictSatisfaction(actionableContent);
      
      expect(satisfaction).toBeGreaterThan(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const satisfaction = predictor.predictSatisfaction('');
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should handle very long content', () => {
      const longContent = 'excellent '.repeat(10000);
      
      const satisfaction = predictor.predictSatisfaction(longContent);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should handle content with only punctuation', () => {
      const punctuationContent = '!!! ??? ... ;;; :::';
      
      const satisfaction = predictor.predictSatisfaction(punctuationContent);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should handle content with special characters', () => {
      const specialContent = 'SEO @#$% optimization &*() strategies []{} with excellent <> results.';
      
      const satisfaction = predictor.predictSatisfaction(specialContent);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should handle content with numbers', () => {
      const numberContent = 'Increase traffic by 300% with excellent SEO strategies. Achieve 95% success rate.';
      
      const satisfaction = predictor.predictSatisfaction(numberContent);
      
      expect(satisfaction).toBeGreaterThan(50);
    });

    it('should handle content with URLs and technical terms', () => {
      const technicalContent = 'Visit https://example.com for excellent SEO tools. Configure robots.txt and sitemap.xml files.';
      
      const satisfaction = predictor.predictSatisfaction(technicalContent);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should handle content with mixed languages', () => {
      const mixedContent = 'Excellent SEO strategies muy bueno très bon очень хорошо.';
      
      const satisfaction = predictor.predictSatisfaction(mixedContent);
      
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });

    it('should be consistent with repeated calls', () => {
      const content = 'This is an excellent SEO guide with outstanding results.';
      
      const satisfaction1 = predictor.predictSatisfaction(content);
      const satisfaction2 = predictor.predictSatisfaction(content);
      const satisfaction3 = predictor.predictSatisfaction(content);
      
      expect(satisfaction1).toBe(satisfaction2);
      expect(satisfaction2).toBe(satisfaction3);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple rapid predictions', () => {
      const testContents = [
        'Excellent SEO guide',
        'Terrible content quality',
        'Standard information',
        'Amazing results',
        'Poor performance'
      ];
      
      const start = Date.now();
      
      testContents.forEach(content => {
        const satisfaction = predictor.predictSatisfaction(content);
        expect(satisfaction).toBeGreaterThanOrEqual(0);
        expect(satisfaction).toBeLessThanOrEqual(100);
      });
      
      const end = Date.now();
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle content with extreme sentiment density', () => {
      const extremePositive = 'amazing excellent fantastic wonderful superb outstanding brilliant perfect '.repeat(100);
      const extremeNegative = 'terrible awful horrible disappointing bad poor weak inadequate '.repeat(100);
      
      const positiveSatisfaction = predictor.predictSatisfaction(extremePositive);
      const negativeSatisfaction = predictor.predictSatisfaction(extremeNegative);
      
      expect(positiveSatisfaction).toBeGreaterThan(negativeSatisfaction);
      expect(positiveSatisfaction).toBeLessThanOrEqual(100);
      expect(negativeSatisfaction).toBeGreaterThanOrEqual(0);
    });
  });
});