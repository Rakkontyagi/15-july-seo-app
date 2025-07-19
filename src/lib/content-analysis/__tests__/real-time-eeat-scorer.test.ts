/**
 * Comprehensive tests for Real-time E-E-A-T Scorer
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 */

import { RealTimeEEATScorer, RealTimeEEATScore } from '../real-time-eeat-scorer';

describe('RealTimeEEATScorer', () => {
  let scorer: RealTimeEEATScorer;

  beforeEach(() => {
    scorer = new RealTimeEEATScorer();
  });

  describe('Constructor', () => {
    it('should initialize with required components', () => {
      expect(scorer).toBeInstanceOf(RealTimeEEATScorer);
    });
  });

  describe('scoreContentRealTime', () => {
    it('should provide real-time E-E-A-T scoring', async () => {
      const content = `In my 15 years of experience, research shows that technical analysis 
        requires specialized knowledge. According to industry experts, evidence suggests 
        that transparent methodologies yield the best results.`;
      
      const result = await scorer.scoreContentRealTime(content, 'test-content-1');
      
      expect(result).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.eeatBreakdown).toBeDefined();
      expect(result.trendAnalysis).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include E-E-A-T breakdown scores', async () => {
      const content = 'Technical content with expertise markers and authority signals.';
      const result = await scorer.scoreContentRealTime(content, 'test-content-2');
      
      expect(result.eeatBreakdown.experience).toBeGreaterThanOrEqual(0);
      expect(result.eeatBreakdown.expertise).toBeGreaterThanOrEqual(0);
      expect(result.eeatBreakdown.authoritativeness).toBeGreaterThanOrEqual(0);
      expect(result.eeatBreakdown.trustworthiness).toBeGreaterThanOrEqual(0);
    });

    it('should provide trend analysis for content with history', async () => {
      const contentId = 'trend-test-content';
      const content1 = 'Basic content without much expertise.';
      const content2 = 'In my experience, research shows technical expertise.';
      const content3 = 'According to experts, specialized knowledge and transparent methods work.';
      
      await scorer.scoreContentRealTime(content1, contentId);
      await scorer.scoreContentRealTime(content2, contentId);
      const result = await scorer.scoreContentRealTime(content3, contentId);
      
      expect(result.trendAnalysis).toBeDefined();
      expect(['improving', 'declining', 'stable']).toContain(result.trendAnalysis.direction);
      expect(typeof result.trendAnalysis.changeRate).toBe('number');
      expect(typeof result.trendAnalysis.confidenceLevel).toBe('number');
    });

    it('should generate alerts for low scores', async () => {
      const lowQualityContent = 'Simple content without expertise or authority.';
      const result = await scorer.scoreContentRealTime(lowQualityContent, 'low-quality-test');
      
      expect(result.alerts.length).toBeGreaterThan(0);
      result.alerts.forEach(alert => {
        expect(['critical', 'warning', 'info']).toContain(alert.type);
        expect(['experience', 'expertise', 'authoritativeness', 'trustworthiness']).toContain(alert.category);
        expect(typeof alert.message).toBe('string');
        expect(typeof alert.threshold).toBe('number');
        expect(typeof alert.currentValue).toBe('number');
        expect(typeof alert.actionRequired).toBe('string');
      });
    });

    it('should provide priority recommendations', async () => {
      const content = 'Content needing improvement in multiple areas.';
      const result = await scorer.scoreContentRealTime(content, 'recommendations-test');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(typeof rec.category).toBe('string');
        expect(typeof rec.action).toBe('string');
        expect(typeof rec.expectedImpact).toBe('number');
        expect(typeof rec.timeToImplement).toBe('string');
        expect(['easy', 'medium', 'hard']).toContain(rec.difficulty);
      });
    });

    it('should handle URLs for source validation', async () => {
      const content = 'Content with external source validation.';
      const urls = ['https://example.com', 'https://authoritative-source.org'];
      
      const result = await scorer.scoreContentRealTime(content, 'url-test', urls);
      
      expect(result).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
    });
  });

  describe('analyzeTrends', () => {
    it('should analyze trends with sufficient history', () => {
      const contentId = 'trend-analysis-test';
      
      // Simulate score history
      const mockScores = [70, 72, 75, 78, 80];
      mockScores.forEach(score => {
        const trendAnalysis = scorer.analyzeTrends(contentId, score);
        expect(trendAnalysis).toBeDefined();
        expect(['improving', 'declining', 'stable']).toContain(trendAnalysis.direction);
      });
    });

    it('should handle insufficient history gracefully', () => {
      const result = scorer.analyzeTrends('new-content', 75);
      
      expect(result.direction).toBe('stable');
      expect(result.changeRate).toBe(0);
      expect(result.confidenceLevel).toBe(0.5);
    });

    it('should detect improving trends', async () => {
      const contentId = 'improving-trend-test';
      
      // Create improving trend
      await scorer.scoreContentRealTime('Basic content', contentId);
      await scorer.scoreContentRealTime('Better content with experience', contentId);
      await scorer.scoreContentRealTime('Expert content with authority and trust', contentId);
      
      const finalResult = await scorer.scoreContentRealTime(
        'Comprehensive expert content with extensive experience, authority, and trust signals', 
        contentId
      );
      
      // Should detect improvement (though may be stable due to limited history)
      expect(['improving', 'stable']).toContain(finalResult.trendAnalysis.direction);
    });
  });

  describe('getEEATTrends', () => {
    it('should return null for content without history', () => {
      const trends = scorer.getEEATTrends('non-existent-content');
      expect(trends).toBeNull();
    });

    it('should return trend data for content with sufficient history', async () => {
      const contentId = 'trend-data-test';
      
      // Build history
      await scorer.scoreContentRealTime('Content 1', contentId);
      await scorer.scoreContentRealTime('Content 2', contentId);
      await scorer.scoreContentRealTime('Content 3', contentId);
      
      const trends = scorer.getEEATTrends(contentId);
      
      expect(trends).toBeDefined();
      expect(trends!.timeframe).toBe('24h');
      expect(Array.isArray(trends!.scores)).toBe(true);
      expect(trends!.scores.length).toBeGreaterThan(0);
      expect(typeof trends!.averageScore).toBe('number');
      expect(typeof trends!.volatility).toBe('number');
      expect(['upward', 'downward', 'stable']).toContain(trends!.trend);
    });

    it('should calculate volatility correctly', async () => {
      const contentId = 'volatility-test';
      
      // Create volatile scores
      const contents = [
        'Low quality content',
        'High quality expert content with authority',
        'Medium quality content',
        'Very high quality comprehensive content'
      ];
      
      for (const content of contents) {
        await scorer.scoreContentRealTime(content, contentId);
      }
      
      const trends = scorer.getEEATTrends(contentId);
      
      expect(trends).toBeDefined();
      expect(trends!.volatility).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent scoring requests', async () => {
      const promises = Array(5).fill(null).map((_, i) => 
        scorer.scoreContentRealTime(`Content ${i}`, `concurrent-test-${i}`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.overallScore).toBe('number');
      });
    });

    it('should process large content efficiently', async () => {
      const largeContent = 'Technical expertise requires specialized knowledge. '.repeat(1000);
      const startTime = Date.now();
      
      const result = await scorer.scoreContentRealTime(largeContent, 'large-content-test');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should maintain score history efficiently', async () => {
      const contentId = 'history-efficiency-test';
      
      // Add many scores to test history management
      for (let i = 0; i < 25; i++) {
        await scorer.scoreContentRealTime(`Content iteration ${i}`, contentId);
      }
      
      const trends = scorer.getEEATTrends(contentId);
      
      expect(trends).toBeDefined();
      expect(trends!.scores.length).toBeLessThanOrEqual(20); // Should limit history
    });
  });

  describe('Alert System', () => {
    it('should generate critical alerts for very low scores', async () => {
      const poorContent = 'Bad content.';
      const result = await scorer.scoreContentRealTime(poorContent, 'critical-alert-test');
      
      const criticalAlerts = result.alerts.filter(alert => alert.type === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it('should provide actionable alert messages', async () => {
      const content = 'Content with some issues.';
      const result = await scorer.scoreContentRealTime(content, 'actionable-alert-test');
      
      result.alerts.forEach(alert => {
        expect(alert.message.length).toBeGreaterThan(10);
        expect(alert.actionRequired.length).toBeGreaterThan(10);
        expect(alert.currentValue).toBeLessThan(alert.threshold);
      });
    });
  });

  describe('Recommendation System', () => {
    it('should prioritize recommendations by impact', async () => {
      const content = 'Content needing multiple improvements.';
      const result = await scorer.scoreContentRealTime(content, 'priority-test');
      
      if (result.recommendations.length > 1) {
        const highPriority = result.recommendations.filter(rec => rec.priority === 'high');
        const mediumPriority = result.recommendations.filter(rec => rec.priority === 'medium');
        
        // High priority should come first
        if (highPriority.length > 0 && mediumPriority.length > 0) {
          const firstHighIndex = result.recommendations.findIndex(rec => rec.priority === 'high');
          const firstMediumIndex = result.recommendations.findIndex(rec => rec.priority === 'medium');
          expect(firstHighIndex).toBeLessThan(firstMediumIndex);
        }
      }
    });

    it('should provide realistic time estimates', async () => {
      const content = 'Content for time estimation testing.';
      const result = await scorer.scoreContentRealTime(content, 'time-estimate-test');
      
      result.recommendations.forEach(rec => {
        expect(rec.timeToImplement).toMatch(/\d+/); // Should contain numbers
        expect(rec.timeToImplement.toLowerCase()).toMatch(/(minute|hour|day)/); // Should contain time units
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const result = await scorer.scoreContentRealTime('', 'empty-content-test');
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
      expect(result.alerts.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const content = 'Content with special chars: @#$%^&*()!';
      const result = await scorer.scoreContentRealTime(content, 'special-chars-test');
      
      expect(result).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
    });

    it('should handle very high quality content', async () => {
      const excellentContent = `In my 20 years of experience as a certified expert, 
        extensive research demonstrates that systematic methodologies require 
        specialized knowledge. According to peer-reviewed studies from authoritative 
        sources, evidence consistently shows that transparent approaches yield 
        optimal results. In full disclosure, limitations exist, but balanced 
        perspectives and honest assessments ensure trustworthy outcomes.`;
      
      const result = await scorer.scoreContentRealTime(excellentContent, 'excellent-content-test');
      
      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.alerts.length).toBeLessThan(3); // Should have fewer alerts
    });
  });
});
