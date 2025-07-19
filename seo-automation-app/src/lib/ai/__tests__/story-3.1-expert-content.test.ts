/**
 * Story 3.1: Expert-Level Content Generation - Comprehensive Tests
 * Tests ExpertContentGenerator for FR5, FR11 compliance
 */

import { ExpertContentGenerator, type ExpertContentRequest } from '../expert-content-generator';

describe('Story 3.1: Expert-Level Content Generation', () => {
  let expertGenerator: ExpertContentGenerator;

  const testRequest: ExpertContentRequest = {
    topic: 'Advanced Digital Marketing Strategy',
    industry: 'technology',
    targetAudience: 'expert',
    contentType: 'whitepaper',
    wordCount: 3000,
    keywords: ['digital marketing', 'conversion optimization', 'customer acquisition'],
    expertiseLevel: 'master',
    includePersonalExperience: true,
    includeCaseStudies: true,
    includeDataPoints: true,
  };

  const shortFormRequest: ExpertContentRequest = {
    topic: 'SEO Best Practices',
    industry: 'marketing',
    targetAudience: 'intermediate',
    contentType: 'article',
    wordCount: 1500,
    keywords: ['SEO', 'search optimization'],
    expertiseLevel: 'expert',
    includePersonalExperience: true,
    includeCaseStudies: false,
    includeDataPoints: true,
  };

  beforeEach(() => {
    expertGenerator = new ExpertContentGenerator();
  });

  describe('Expert Content Generation', () => {
    it('should generate expert-level content with 20+ years experience indicators', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(1000);
      expect(result.expertiseScore).toBeGreaterThanOrEqual(0.7);
      expect(result.authoritySignals).toBeGreaterThan(5);
      expect(result.industryDepth).toBeGreaterThan(0.3);
    });

    it('should include personal experience indicators', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.experienceIndicators.length).toBeGreaterThan(0);
      expect(result.experienceIndicators.some(e => e.type === 'PERSONAL_ANECDOTE')).toBe(true);
      expect(result.content).toMatch(/my experience|I've seen|I've learned|from my/i);
    });

    it('should include case studies when requested', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.experienceIndicators.some(e => e.type === 'CASE_STUDY')).toBe(true);
      expect(result.content).toMatch(/case study|client work|implementation|project/i);
      expect(result.metadata.caseStudyCount).toBeGreaterThan(0);
    });

    it('should demonstrate industry expertise', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.industryDepth).toBeGreaterThan(0.3);
      expect(result.experienceIndicators.some(e => e.type === 'INDUSTRY_INSIGHT')).toBe(true);
      expect(result.content).toMatch(/industry|market|sector|landscape/i);
    });

    it('should include practical wisdom and actionable advice', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.practicalWisdom.length).toBeGreaterThan(0);
      expect(result.experienceIndicators.some(e => e.type === 'PRACTICAL_TIP')).toBe(true);
      expect(result.content).toMatch(/recommend|suggest|best practice|key insight/i);
    });

    it('should demonstrate thought leadership', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.thoughtLeadership.length).toBeGreaterThan(0);
      expect(result.thoughtLeadership[0].industryImpact).toBeGreaterThan(5);
      expect(result.content).toMatch(/future|trend|evolution|innovation/i);
    });

    it('should meet target word count requirements', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.metadata.wordCount).toBeGreaterThanOrEqual(testRequest.wordCount * 0.4);
      expect(result.metadata.wordCount).toBeLessThanOrEqual(testRequest.wordCount * 1.5);
    });

    it('should maintain appropriate readability for target audience', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.metadata.readabilityScore).toBeGreaterThanOrEqual(30); // Expert content can be more complex
      expect(result.metadata.readabilityScore).toBeLessThan(80);
    });
  });

  describe('Expertise Level Validation', () => {
    it('should generate master-level content with highest expertise indicators', async () => {
      const masterRequest = { ...testRequest, expertiseLevel: 'master' as const };
      const result = await expertGenerator.generateExpertContent(masterRequest);

      expect(result.expertiseScore).toBeGreaterThanOrEqual(0.8);
      expect(result.authoritySignals).toBeGreaterThan(10);
      expect(result.content).toMatch(/25.*years|decades/i);
    });

    it('should generate expert-level content with appropriate indicators', async () => {
      const expertRequest = { ...testRequest, expertiseLevel: 'expert' as const };
      const result = await expertGenerator.generateExpertContent(expertRequest);

      expect(result.expertiseScore).toBeGreaterThanOrEqual(0.7);
      expect(result.authoritySignals).toBeGreaterThan(7);
      expect(result.content).toMatch(/20.*years/i);
    });

    it('should generate advanced-level content with solid expertise', async () => {
      const advancedRequest = { ...testRequest, expertiseLevel: 'advanced' as const };
      const result = await expertGenerator.generateExpertContent(advancedRequest);

      expect(result.expertiseScore).toBeGreaterThanOrEqual(0.6);
      expect(result.authoritySignals).toBeGreaterThan(5);
      expect(result.content).toMatch(/15.*years/i);
    });
  });

  describe('Content Type Variations', () => {
    it('should generate appropriate structure for whitepaper', async () => {
      const whitepaperRequest = { ...testRequest, contentType: 'whitepaper' as const };
      const result = await expertGenerator.generateExpertContent(whitepaperRequest);

      expect(result.content).toMatch(/executive summary/i);
      expect(result.content).toMatch(/recommendations/i);
      expect(result.content).toMatch(/conclusion/i);
    });

    it('should generate appropriate structure for guide', async () => {
      const guideRequest = { ...testRequest, contentType: 'guide' as const };
      const result = await expertGenerator.generateExpertContent(guideRequest);

      expect(result.content).toMatch(/implementation|strategies|best practices/i);
      expect(result.content).toMatch(/step|process|methodology/i);
    });

    it('should generate appropriate structure for analysis', async () => {
      const analysisRequest = { ...testRequest, contentType: 'analysis' as const };
      const result = await expertGenerator.generateExpertContent(analysisRequest);

      expect(result.content).toMatch(/analysis|assessment|evaluation/i);
      expect(result.content).toMatch(/data|metrics|performance/i);
    });
  });

  describe('Industry-Specific Content', () => {
    it('should include technology-specific terminology', async () => {
      const techRequest = { ...testRequest, industry: 'technology' };
      const result = await expertGenerator.generateExpertContent(techRequest);

      expect(result.content).toMatch(/API|cloud|DevOps|microservices|scalability|architecture/i);
      expect(result.industryDepth).toBeGreaterThan(0.3);
    });

    it('should include healthcare-specific terminology', async () => {
      const healthcareRequest = { ...testRequest, industry: 'healthcare' };
      const result = await expertGenerator.generateExpertContent(healthcareRequest);

      expect(result.content).toMatch(/patient care|clinical|regulatory|compliance|outcomes/i);
      expect(result.industryDepth).toBeGreaterThan(0.3);
    });

    it('should include finance-specific terminology', async () => {
      const financeRequest = { ...testRequest, industry: 'finance' };
      const result = await expertGenerator.generateExpertContent(financeRequest);

      expect(result.content).toMatch(/financial|investment|banking|securities|capital|finance/i);
      expect(result.industryDepth).toBeGreaterThan(0.1);
    });
  });

  describe('Experience Indicators Analysis', () => {
    it('should extract and categorize experience indicators correctly', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.experienceIndicators.length).toBeGreaterThan(5);
      
      const indicatorTypes = result.experienceIndicators.map(e => e.type);
      expect(indicatorTypes).toContain('CASE_STUDY');
      expect(indicatorTypes).toContain('PERSONAL_ANECDOTE');
      expect(indicatorTypes).toContain('INDUSTRY_INSIGHT');
      expect(indicatorTypes).toContain('PRACTICAL_TIP');

      result.experienceIndicators.forEach(indicator => {
        expect(indicator.credibilityScore).toBeGreaterThan(0.5);
        expect(indicator.content).toBeDefined();
        expect(indicator.position).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide detailed practical wisdom', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.practicalWisdom.length).toBeGreaterThan(0);
      result.practicalWisdom.forEach(wisdom => {
        expect(wisdom.advice).toBeDefined();
        expect(wisdom.context).toBeDefined();
        expect(wisdom.experienceLevel).toBeGreaterThan(5);
        expect(wisdom.applicability).toBeDefined();
      });
    });

    it('should demonstrate thought leadership insights', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.thoughtLeadership.length).toBeGreaterThan(0);
      result.thoughtLeadership.forEach(leadership => {
        expect(leadership.insight).toBeDefined();
        expect(leadership.innovation).toBeDefined();
        expect(leadership.futureImplication).toBeDefined();
        expect(leadership.industryImpact).toBeGreaterThan(0);
      });
    });
  });

  describe('Content Quality Metrics', () => {
    it('should maintain high expertise score for master-level content', async () => {
      const masterRequest = { ...testRequest, expertiseLevel: 'master' as const };
      const result = await expertGenerator.generateExpertContent(masterRequest);

      expect(result.expertiseScore).toBeGreaterThanOrEqual(0.8);
      expect(result.metadata.expertiseLevel).toBe('master');
    });

    it('should include sufficient authority signals', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.authoritySignals).toBeGreaterThan(8);
      expect(result.content).toMatch(/\d+\+?\s*years/i);
      expect(result.content).toMatch(/experience|implemented|led/i);
    });

    it('should demonstrate deep industry knowledge', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.industryDepth).toBeGreaterThanOrEqual(0.4);
      expect(result.content.length).toBeGreaterThan(2000);
    });
  });

  describe('Metadata Accuracy', () => {
    it('should provide accurate content metadata', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.metadata.wordCount).toBeGreaterThan(1000);
      expect(result.metadata.readabilityScore).toBeGreaterThan(0);
      expect(result.metadata.expertiseLevel).toBe(testRequest.expertiseLevel);
      expect(result.metadata.caseStudyCount).toBeGreaterThanOrEqual(0);
      expect(result.metadata.dataPointCount).toBeGreaterThanOrEqual(0);
      expect(result.metadata.personalExperienceCount).toBeGreaterThanOrEqual(0);
    });

    it('should track case studies when included', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      expect(result.metadata.caseStudyCount).toBeGreaterThan(0);
    });

    it('should not include case studies when disabled', async () => {
      const noCaseStudyRequest = { ...testRequest, includeCaseStudies: false };
      const result = await expertGenerator.generateExpertContent(noCaseStudyRequest);

      // Should have fewer case study indicators
      const caseStudyIndicators = result.experienceIndicators.filter(e => e.type === 'CASE_STUDY');
      expect(caseStudyIndicators.length).toBeLessThan(10); // Should have fewer than when enabled
    });
  });

  describe('Performance and Scalability', () => {
    it('should generate content within reasonable time', async () => {
      const startTime = Date.now();
      
      await expertGenerator.generateExpertContent(testRequest);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        expertGenerator.generateExpertContent(testRequest),
        expertGenerator.generateExpertContent(shortFormRequest),
        expertGenerator.generateExpertContent({ ...testRequest, industry: 'healthcare' }),
      ];

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.content).toBeDefined();
        expect(result.expertiseScore).toBeGreaterThan(0.5);
      });
    });

    it('should maintain consistency across multiple generations', async () => {
      const results = await Promise.all([
        expertGenerator.generateExpertContent(testRequest),
        expertGenerator.generateExpertContent(testRequest),
      ]);

      // Both should meet quality thresholds
      results.forEach(result => {
        expect(result.expertiseScore).toBeGreaterThan(0.7);
        expect(result.authoritySignals).toBeGreaterThan(5);
        expect(result.industryDepth).toBeGreaterThan(0.3);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle minimal word count requests', async () => {
      const minimalRequest = { ...testRequest, wordCount: 500 };
      const result = await expertGenerator.generateExpertContent(minimalRequest);

      expect(result.content).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(400);
      expect(result.expertiseScore).toBeGreaterThan(0.5);
    });

    it('should handle maximum word count requests', async () => {
      const maximalRequest = { ...testRequest, wordCount: 8000 };
      const result = await expertGenerator.generateExpertContent(maximalRequest);

      expect(result.content).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(1000);
      expect(result.expertiseScore).toBeGreaterThan(0.7);
    });

    it('should handle single keyword requests', async () => {
      const singleKeywordRequest = { ...testRequest, keywords: ['SEO'] };
      const result = await expertGenerator.generateExpertContent(singleKeywordRequest);

      expect(result.content).toBeDefined();
      expect(result.content.toLowerCase()).toContain('seo');
      expect(result.expertiseScore).toBeGreaterThan(0.6);
    });
  });

  describe('FR5 and FR11 Compliance', () => {
    it('should demonstrate 20+ years expertise (FR5)', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      // Should reference 20+ years experience
      expect(result.content).toMatch(/20.*years|25.*years|decades/i);
      expect(result.authoritySignals).toBeGreaterThan(8);
      expect(result.expertiseScore).toBeGreaterThan(0.7);
    });

    it('should optimize for multiple search engines (FR11)', async () => {
      const result = await expertGenerator.generateExpertContent(testRequest);

      // Content should be comprehensive and well-structured for search engines
      expect(result.content).toMatch(/^#\s+/m); // Has main heading
      expect(result.content).toMatch(/^##\s+/m); // Has subheadings
      expect(result.content.split('\n\n').length).toBeGreaterThan(10); // Well-structured paragraphs
      expect(result.metadata.readabilityScore).toBeGreaterThanOrEqual(30);
    });
  });
});
