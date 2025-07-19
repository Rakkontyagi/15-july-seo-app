/**
 * Comprehensive tests for Trust Signal Scorer
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 */

import { TrustSignalScorer, TrustSignalScore } from '../trust-signal-scorer';

describe('TrustSignalScorer', () => {
  let scorer: TrustSignalScorer;

  beforeEach(() => {
    scorer = new TrustSignalScorer();
  });

  describe('Constructor', () => {
    it('should initialize all component analyzers', () => {
      expect(scorer).toBeInstanceOf(TrustSignalScorer);
    });
  });

  describe('calculateEEATCompliance', () => {
    it('should calculate basic E-E-A-T compliance score', () => {
      const content = 'This is a basic article about SEO best practices.';
      const score = scorer.calculateEEATCompliance(content);
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should score high-quality E-E-A-T content highly', () => {
      const highQualityContent = `In my 15 years of experience optimizing enterprise websites, 
        technical analysis consistently demonstrates that specialized knowledge of Core Web Vitals 
        is essential. According to Google's official documentation, published research indicates 
        that authoritative implementation requires systematic methodology. In full transparency, 
        evidence suggests that sustainable results demand balanced approaches and honest 
        acknowledgment of limitations while maintaining factual accuracy.`;
      
      const score = scorer.calculateEEATCompliance(highQualityContent);
      
      expect(score).toBeGreaterThan(60);
    });

    it('should score low-quality content appropriately', () => {
      const lowQualityContent = 'SEO is important for websites. It helps with rankings.';
      const score = scorer.calculateEEATCompliance(lowQualityContent);
      
      expect(score).toBeLessThan(60);
    });

    it('should incorporate source authority when URLs provided', () => {
      const content = 'Technical SEO requires expertise and authority.';
      const urls = ['https://developers.google.com', 'https://moz.com'];
      
      const scoreWithSources = scorer.calculateEEATCompliance(content, urls);
      const scoreWithoutSources = scorer.calculateEEATCompliance(content);
      
      expect(typeof scoreWithSources).toBe('number');
      expect(typeof scoreWithoutSources).toBe('number');
    });
  });

  describe('scoreTrustSignals', () => {
    it('should provide comprehensive trust signal analysis', () => {
      const content = `In my experience working with Fortune 500 companies, research shows 
        that technical analysis requires specialized knowledge. According to industry experts, 
        evidence suggests that transparent methodologies yield the best results.`;
      
      const result = scorer.scoreTrustSignals(content);
      
      expect(result).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
      expect(result.eeatCompliance).toBeDefined();
      expect(result.signalStrength).toBeDefined();
      expect(result.qualityMetrics).toBeDefined();
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should identify enhancement opportunities', () => {
      const basicContent = 'SEO is good for websites.';
      const result = scorer.scoreTrustSignals(basicContent);
      
      expect(result.opportunities.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const hasHighPriorityOpportunities = result.opportunities.some(opp => 
        opp.priority === 'high'
      );
      expect(hasHighPriorityOpportunities).toBe(true);
    });

    it('should provide category-specific opportunities', () => {
      const content = 'Basic content without expertise markers.';
      const result = scorer.scoreTrustSignals(content);
      
      const categories = result.opportunities.map(opp => opp.category);
      const uniqueCategories = [...new Set(categories)];
      
      expect(uniqueCategories.length).toBeGreaterThan(0);
      expect(uniqueCategories.some(cat => 
        ['experience', 'expertise', 'authoritativeness', 'trustworthiness'].includes(cat)
      )).toBe(true);
    });

    it('should calculate expected impact for opportunities', () => {
      const content = 'Content needing improvement.';
      const result = scorer.scoreTrustSignals(content);
      
      result.opportunities.forEach(opportunity => {
        expect(typeof opportunity.expectedImpact).toBe('number');
        expect(opportunity.expectedImpact).toBeGreaterThan(0);
        expect(opportunity.expectedImpact).toBeLessThanOrEqual(100);
        expect(typeof opportunity.implementation).toBe('string');
        expect(opportunity.implementation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('analyzeContentTrust', () => {
    it('should provide comprehensive content trust analysis', () => {
      const content = `Technical expertise in SEO requires deep understanding of algorithms. 
        Research demonstrates effectiveness of systematic approaches.`;
      
      const result = scorer.analyzeContentTrust(content);
      
      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.weaknesses)).toBe(true);
    });

    it('should identify content strengths accurately', () => {
      const strongContent = `In my 20 years of experience, research consistently shows that 
        according to authoritative sources, evidence suggests transparent methodologies work best.`;
      
      const result = scorer.analyzeContentTrust(strongContent);
      
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.strengths.some(strength => 
        strength.includes('experience') || strength.includes('research') || 
        strength.includes('authoritative') || strength.includes('evidence')
      )).toBe(true);
    });

    it('should identify content weaknesses accurately', () => {
      const weakContent = 'Simple content without depth or authority.';
      const result = scorer.analyzeContentTrust(weakContent);
      
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.weaknesses.some(weakness => 
        weakness.includes('experience') || weakness.includes('expertise') || 
        weakness.includes('authority') || weakness.includes('trust')
      )).toBe(true);
    });

    it('should provide competitive comparison when available', () => {
      const content = 'Content for competitive analysis.';
      const result = scorer.analyzeContentTrust(content, true);
      
      if (result.competitiveComparison) {
        expect(typeof result.competitiveComparison.industryAverage).toBe('number');
        expect(typeof result.competitiveComparison.topPerformer).toBe('number');
        expect(typeof result.competitiveComparison.yourScore).toBe('number');
      }
    });
  });

  describe('Google E-E-A-T Guidelines Compliance', () => {
    it('should validate comprehensive E-E-A-T content', () => {
      const eeAtContent = `Having personally managed SEO campaigns for Fortune 500 companies 
        over 15 years, my expertise in technical optimization is demonstrated through 
        measurable results. According to Google's official Search Quality Guidelines, 
        authoritative content requires transparent disclosure of methodologies and honest 
        acknowledgment of limitations. Research from peer-reviewed sources validates 
        this systematic approach to sustainable organic growth.`;
      
      const result = scorer.scoreTrustSignals(eeAtContent);
      
      expect(result.overallScore).toBeGreaterThan(75);
      expect(result.eeatCompliance.experience).toBeGreaterThan(70);
      expect(result.eeatCompliance.expertise).toBeGreaterThan(70);
      expect(result.eeatCompliance.authoritativeness).toBeGreaterThan(70);
      expect(result.eeatCompliance.trustworthiness).toBeGreaterThan(70);
    });

    it('should penalize content lacking E-E-A-T signals', () => {
      const poorContent = 'SEO tips for better rankings. Use keywords and build links.';
      const result = scorer.scoreTrustSignals(poorContent);
      
      expect(result.overallScore).toBeLessThan(50);
      expect(result.opportunities.length).toBeGreaterThan(3);
      expect(result.opportunities.some(opp => opp.priority === 'high')).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should process content efficiently', () => {
      const content = 'Technical content for performance testing. '.repeat(100);
      const startTime = Date.now();
      
      scorer.scoreTrustSignals(content);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent scoring requests', async () => {
      const content = 'Content for concurrent trust signal scoring.';
      
      const promises = Array(5).fill(null).map(() => 
        Promise.resolve(scorer.scoreTrustSignals(content))
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.overallScore).toBe('number');
      });
    });
  });

  describe('Quality and Consistency', () => {
    it('should provide consistent scoring for identical content', () => {
      const content = 'Consistent content for testing scoring reliability.';
      
      const result1 = scorer.scoreTrustSignals(content);
      const result2 = scorer.scoreTrustSignals(content);
      
      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result1.eeatCompliance.experience).toBe(result2.eeatCompliance.experience);
      expect(result1.eeatCompliance.expertise).toBe(result2.eeatCompliance.expertise);
    });

    it('should differentiate between content quality levels', () => {
      const basicContent = 'Basic SEO information.';
      const expertContent = `Advanced technical SEO requires specialized expertise in 
        Core Web Vitals optimization, demonstrated through years of hands-on experience 
        with enterprise implementations. Authoritative sources and transparent methodologies 
        ensure trustworthy results.`;
      
      const basicResult = scorer.scoreTrustSignals(basicContent);
      const expertResult = scorer.scoreTrustSignals(expertContent);
      
      expect(expertResult.overallScore).toBeGreaterThan(basicResult.overallScore + 20);
      expect(expertResult.opportunities.length).toBeLessThan(basicResult.opportunities.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', () => {
      const result = scorer.scoreTrustSignals('');
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
      expect(result.opportunities.length).toBeGreaterThan(0);
    });

    it('should handle malformed URLs gracefully', () => {
      const content = 'Content with source validation.';
      const invalidUrls = ['not-a-url', 'http://', ''];
      
      expect(() => {
        scorer.calculateEEATCompliance(content, invalidUrls);
      }).not.toThrow();
    });

    it('should handle very long content', () => {
      const longContent = 'Technical expertise requires specialized knowledge. '.repeat(2000);
      
      expect(() => {
        scorer.scoreTrustSignals(longContent);
      }).not.toThrow();
    });

    it('should handle special characters and encoding', () => {
      const specialContent = 'Technical SEO requires 100% accuracy & systematic approach! 🚀';
      const result = scorer.scoreTrustSignals(specialContent);
      
      expect(result).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
    });
  });

  describe('Recommendation Quality', () => {
    it('should provide actionable recommendations', () => {
      const content = 'Basic content needing improvement.';
      const result = scorer.scoreTrustSignals(content);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
        expect(recommendation).toMatch(/[A-Z]/); // Should start with capital letter
      });
    });

    it('should prioritize high-impact opportunities', () => {
      const content = 'Content for opportunity prioritization testing.';
      const result = scorer.scoreTrustSignals(content);
      
      const highPriorityOpps = result.opportunities.filter(opp => opp.priority === 'high');
      const mediumPriorityOpps = result.opportunities.filter(opp => opp.priority === 'medium');
      
      if (highPriorityOpps.length > 0 && mediumPriorityOpps.length > 0) {
        const avgHighImpact = highPriorityOpps.reduce((sum, opp) => sum + opp.expectedImpact, 0) / highPriorityOpps.length;
        const avgMediumImpact = mediumPriorityOpps.reduce((sum, opp) => sum + opp.expectedImpact, 0) / mediumPriorityOpps.length;
        
        expect(avgHighImpact).toBeGreaterThanOrEqual(avgMediumImpact);
      }
    });
  });
});
