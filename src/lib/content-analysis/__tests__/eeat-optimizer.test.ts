/**
 * Comprehensive tests for E-E-A-T Optimizer
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 */

import { EEATOptimizer, EEATAnalysis } from '../eeat-optimizer';

describe('EEATOptimizer', () => {
  let optimizer: EEATOptimizer;

  beforeEach(() => {
    optimizer = new EEATOptimizer();
  });

  describe('Constructor', () => {
    it('should initialize with predefined markers', () => {
      expect(optimizer).toBeInstanceOf(EEATOptimizer);
    });
  });

  describe('analyzeEEAT', () => {
    it('should return complete E-E-A-T analysis for basic content', () => {
      const content = 'This is a basic article about SEO techniques.';
      const result = optimizer.analyzeEEAT(content);
      
      expect(result).toBeDefined();
      expect(result.experience).toBeGreaterThanOrEqual(0);
      expect(result.experience).toBeLessThanOrEqual(100);
      expect(result.expertise).toBeGreaterThanOrEqual(0);
      expect(result.expertise).toBeLessThanOrEqual(100);
      expect(result.authoritativeness).toBeGreaterThanOrEqual(0);
      expect(result.authoritativeness).toBeLessThanOrEqual(100);
      expect(result.trustworthiness).toBeGreaterThanOrEqual(0);
      expect(result.trustworthiness).toBeLessThanOrEqual(100);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should detect high experience markers', () => {
      const content = `In my experience working with SEO for over 10 years, I have personally 
        seen how technical analysis and real-world application of best practices can 
        dramatically improve rankings. From my work with Fortune 500 companies, 
        I've learned that practical examples and case studies provide the most value.`;
      
      const result = optimizer.analyzeEEAT(content);
      
      expect(result.experience).toBeGreaterThan(70);
      expect(result.details.experienceMarkers.length).toBeGreaterThan(0);
      expect(result.details.experienceMarkers).toContain('In my experience');
      expect(result.details.experienceMarkers).toContain('I have personally');
      expect(result.details.experienceMarkers).toContain('From my work with');
    });

    it('should detect expertise indicators', () => {
      const content = `Research shows that technical analysis of core web vitals is crucial. 
        Studies indicate that advanced techniques like schema markup and entity optimization 
        require specialized knowledge. According to experts in the field, industry standards 
        demand professional methodology and expert consensus on best practices.`;
      
      const result = optimizer.analyzeEEAT(content);
      
      expect(result.expertise).toBeGreaterThan(60);
      expect(result.details.expertiseIndicators.length).toBeGreaterThan(0);
      expect(result.details.expertiseIndicators).toContain('research shows');
      expect(result.details.expertiseIndicators).toContain('studies indicate');
      expect(result.details.expertiseIndicators).toContain('according to experts');
    });

    it('should detect authority signals', () => {
      const content = `According to Google's official documentation, published by Moz Research, 
        and referenced in Search Engine Journal, the authoritative source for SEO guidelines 
        comes from peer-reviewed studies. As stated by industry leaders, this established 
        methodology is recognized by major search engines.`;
      
      const result = optimizer.analyzeEEAT(content);
      
      expect(result.authoritativeness).toBeGreaterThan(60);
      expect(result.details.authoritySignals.length).toBeGreaterThan(0);
      expect(result.details.authoritySignals).toContain('According to');
      expect(result.details.authoritySignals).toContain('Published by');
      expect(result.details.authoritySignals).toContain('Referenced in');
    });

    it('should detect trustworthiness elements', () => {
      const content = `It's important to note that while this method is effective, limitations include 
        potential compatibility issues. In full transparency, evidence suggests that results 
        may vary. To be honest, this approach requires careful consideration of factual accuracy 
        and maintaining a balanced perspective throughout implementation.`;
      
      const result = optimizer.analyzeEEAT(content);
      
      expect(result.trustworthiness).toBeGreaterThan(60);
      expect(result.details.trustElements.length).toBeGreaterThan(0);
      expect(result.details.trustElements).toContain('It\'s important to note');
      expect(result.details.trustElements).toContain('In full transparency');
      expect(result.details.trustElements).toContain('To be honest');
    });

    it('should provide appropriate recommendations for low scores', () => {
      const content = 'SEO is good for websites.';
      const result = optimizer.analyzeEEAT(content);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => 
        rec.includes('experience') || rec.includes('expertise') || 
        rec.includes('authority') || rec.includes('trust')
      )).toBe(true);
    });

    it('should handle empty content gracefully', () => {
      const result = optimizer.analyzeEEAT('');
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
      expect(result.experience).toBe(0);
      expect(result.expertise).toBe(0);
      expect(result.authoritativeness).toBe(0);
      expect(result.trustworthiness).toBe(0);
    });

    it('should handle very long content efficiently', () => {
      const longContent = 'This is a test sentence. '.repeat(1000);
      const startTime = Date.now();
      
      const result = optimizer.analyzeEEAT(longContent);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Google E-E-A-T Guidelines Compliance', () => {
    it('should validate against Google Experience guidelines', () => {
      const experienceContent = `Having personally managed SEO campaigns for over 15 years, 
        I've encountered every major algorithm update firsthand. In my experience working 
        directly with e-commerce sites generating $50M+ annually, I've learned that 
        real-world application of technical SEO principles requires deep understanding 
        of both user behavior and search engine mechanics.`;
      
      const result = optimizer.analyzeEEAT(experienceContent);
      
      // Google values first-hand experience
      expect(result.experience).toBeGreaterThan(75);
      expect(result.details.experienceMarkers).toContain('Having personally');
      expect(result.details.experienceMarkers).toContain('In my experience');
    });

    it('should validate against Google Expertise guidelines', () => {
      const expertiseContent = `Technical analysis reveals that Core Web Vitals optimization 
        requires specialized knowledge of JavaScript execution, critical rendering path, 
        and advanced caching strategies. Research from Google's PageSpeed team indicates 
        that expert-level implementation of resource prioritization can improve LCP by 40%.`;
      
      const result = optimizer.analyzeEEAT(expertiseContent);
      
      // Google values demonstrated expertise
      expect(result.expertise).toBeGreaterThan(70);
      expect(result.details.expertiseIndicators).toContain('technical analysis');
      expect(result.details.expertiseIndicators).toContain('specialized knowledge');
    });

    it('should validate against Google Authoritativeness guidelines', () => {
      const authorityContent = `According to Google's Search Quality Evaluator Guidelines, 
        published by the official Google Search Central blog, authoritative sources must 
        demonstrate industry recognition. As referenced in peer-reviewed studies from 
        Stanford University and cited by Search Engine Land, established methodology 
        requires verification from multiple authoritative sources.`;
      
      const result = optimizer.analyzeEEAT(expertiseContent);
      
      // Google values authoritative sources and citations
      expect(result.authoritativeness).toBeGreaterThan(70);
    });

    it('should validate against Google Trustworthiness guidelines', () => {
      const trustContent = `In full transparency, this methodology has limitations that 
        must be acknowledged. Evidence suggests effectiveness varies by industry, and 
        it's important to note that results require 3-6 months to materialize. 
        Factual accuracy demands citing peer-reviewed sources and maintaining 
        balanced perspectives on controversial topics.`;
      
      const result = optimizer.analyzeEEAT(trustContent);
      
      // Google values transparency and honesty
      expect(result.trustworthiness).toBeGreaterThan(70);
      expect(result.details.trustElements).toContain('In full transparency');
      expect(result.details.trustElements).toContain('Evidence suggests');
    });
  });

  describe('Performance Tests', () => {
    it('should process medium content efficiently', () => {
      const mediumContent = 'This is a test sentence with some experience markers. '.repeat(100);
      const startTime = Date.now();
      
      optimizer.analyzeEEAT(mediumContent);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle concurrent analysis requests', async () => {
      const content = 'Test content for concurrent processing.';
      
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(optimizer.analyzeEEAT(content))
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.overallScore).toBe('number');
      });
    });
  });

  describe('Quality Tests', () => {
    it('should provide consistent scoring for identical content', () => {
      const content = 'In my experience, research shows that according to experts, evidence suggests this approach works.';
      
      const result1 = optimizer.analyzeEEAT(content);
      const result2 = optimizer.analyzeEEAT(content);
      
      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result1.experience).toBe(result2.experience);
      expect(result1.expertise).toBe(result2.expertise);
      expect(result1.authoritativeness).toBe(result2.authoritativeness);
      expect(result1.trustworthiness).toBe(result2.trustworthiness);
    });

    it('should differentiate between high and low quality content', () => {
      const lowQualityContent = 'SEO is important for websites.';
      const highQualityContent = `In my 15 years of experience optimizing enterprise websites, 
        research consistently shows that technical SEO implementation requires specialized knowledge. 
        According to Google's official guidelines, published studies indicate that authoritative 
        sources must demonstrate expertise. In full transparency, evidence suggests that 
        sustainable results require balanced approaches and honest acknowledgment of limitations.`;
      
      const lowResult = optimizer.analyzeEEAT(lowQualityContent);
      const highResult = optimizer.analyzeEEAT(highQualityContent);
      
      expect(highResult.overallScore).toBeGreaterThan(lowResult.overallScore);
      expect(highResult.experience).toBeGreaterThan(lowResult.experience);
      expect(highResult.expertise).toBeGreaterThan(lowResult.expertise);
      expect(highResult.authoritativeness).toBeGreaterThan(lowResult.authoritativeness);
      expect(highResult.trustworthiness).toBeGreaterThan(lowResult.trustworthiness);
    });
  });

  describe('Edge Cases', () => {
    it('should handle content with only punctuation', () => {
      const result = optimizer.analyzeEEAT('!!! ??? ... ,,, ;;;');
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
    });

    it('should handle content with numbers and special characters', () => {
      const content = 'In my experience, 95% of websites need SEO. Research shows $1,000 investment yields 300% ROI.';
      const result = optimizer.analyzeEEAT(content);
      
      expect(result).toBeDefined();
      expect(result.experience).toBeGreaterThan(0);
    });

    it('should handle mixed language content', () => {
      const content = 'In my experience, según los expertos, research shows effectiveness.';
      const result = optimizer.analyzeEEAT(content);
      
      expect(result).toBeDefined();
      expect(result.experience).toBeGreaterThan(0);
    });
  });
});
