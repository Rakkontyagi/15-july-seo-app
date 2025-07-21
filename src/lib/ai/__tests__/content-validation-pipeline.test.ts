/**
 * Comprehensive tests for ContentValidationPipeline
 * Tests real-time fact verification and anti-hallucination detection
 */

import { ContentValidationPipeline, FactVerificationResult, HallucinationDetectionResult } from '../content-validation-pipeline';

describe('ContentValidationPipeline', () => {
  let pipeline: ContentValidationPipeline;

  beforeEach(() => {
    pipeline = new ContentValidationPipeline();
  });

  describe('verifyFactsRealTime', () => {
    it('should verify facts with 80%+ confidence score', async () => {
      const factualContent = `
        According to recent research by Harvard University, 85% of companies have implemented digital transformation initiatives.
        Studies indicate that organizations using AI-powered analytics see a 40% improvement in decision-making speed.
        Industry reports suggest that by 2025, the global digital transformation market will reach $1.2 trillion.
        Data reveals that companies with strong digital capabilities are 23% more profitable than their competitors.
      `;

      const result = await pipeline.verifyFactsRealTime(factualContent);

      expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(result.verifiedClaims).toBeDefined();
      expect(result.verifiedClaims.length).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.lastVerified).toBeDefined();
      
      // Check that verified claims have proper structure
      result.verifiedClaims.forEach(claim => {
        expect(claim.claim).toBeDefined();
        expect(claim.verified).toBe(true);
        expect(claim.confidence).toBeGreaterThan(0);
        expect(claim.sources).toBeDefined();
      });
    });

    it('should throw error when confidence score is below 80%', async () => {
      const lowQualityContent = `
        Some random statistics without sources: 73% of things happen sometimes.
        Unverifiable claims about the future without any backing.
        Made-up numbers and percentages that cannot be verified.
      `;

      await expect(pipeline.verifyFactsRealTime(lowQualityContent))
        .rejects.toThrow('Fact verification confidence');
    });

    it('should extract factual claims correctly', async () => {
      const mixedContent = `
        This is general content about marketing strategies.
        According to McKinsey research, 67% of executives report improved ROI from digital initiatives.
        Marketing is important for business success.
        Studies indicate that personalized content increases engagement by 45%.
        Some general advice about best practices.
      `;

      const result = await pipeline.verifyFactsRealTime(mixedContent);

      expect(result.verifiedClaims.length).toBeGreaterThan(0);
      
      // Should extract the factual claims with statistics and authority references
      const claimTexts = result.verifiedClaims.map(claim => claim.claim);
      expect(claimTexts.some(claim => claim.includes('67%'))).toBe(true);
      expect(claimTexts.some(claim => claim.includes('45%'))).toBe(true);
    });

    it('should handle content with no factual claims', async () => {
      const generalContent = `
        Marketing is an important aspect of business growth.
        Companies should focus on customer satisfaction.
        Building strong relationships with clients leads to success.
        Strategic planning helps organizations achieve their goals.
      `;

      const result = await pipeline.verifyFactsRealTime(generalContent);

      expect(result.confidenceScore).toBe(100); // No claims to verify
      expect(result.verifiedClaims).toHaveLength(0);
      expect(result.unverifiedClaims).toHaveLength(0);
    });

    it('should categorize unverified claims correctly', async () => {
      const mixedContent = `
        According to reliable sources, 90% of businesses use digital marketing.
        Some vague statistic: 42% of something happens somewhere.
        Research shows that effective strategies improve outcomes.
      `;

      const result = await pipeline.verifyFactsRealTime(mixedContent);

      expect(result.unverifiedClaims).toBeDefined();
      result.unverifiedClaims.forEach(claim => {
        expect(claim.claim).toBeDefined();
        expect(claim.reason).toBeDefined();
        expect(claim.confidence).toBeDefined();
      });
    });
  });

  describe('detectHallucinations', () => {
    it('should detect hallucinations with <10% risk', async () => {
      const highQualityContent = `
        Digital marketing strategies have evolved significantly over the past decade.
        According to Forrester Research, companies implementing comprehensive digital strategies see improved customer engagement.
        Best practices include understanding your target audience and creating relevant content.
        Data-driven approaches help optimize campaign performance and ROI.
      `;

      const result = await pipeline.detectHallucinations(highQualityContent);

      expect(result.hallucinationRisk).toBeLessThan(10);
      expect(result.confidenceScore).toBeGreaterThan(90);
      expect(result.flaggedSections).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should throw error when hallucination risk exceeds 10%', async () => {
      const highRiskContent = `
        Exactly 73.456% of all companies will definitely achieve precisely 234% growth.
        All businesses always succeed when they never make mistakes.
        Completely accurate data shows that absolutely every organization totally benefits.
        According to unnamed sources, 100% of statistics are always perfectly reliable.
      `;

      await expect(pipeline.detectHallucinations(highRiskContent))
        .rejects.toThrow('Hallucination risk');
    });

    it('should detect suspicious patterns', async () => {
      const suspiciousContent = `
        Exactly 73.456% of companies achieve precisely this outcome.
        All businesses always succeed with this approach.
        Never has any organization failed using this method.
        Completely accurate data shows absolutely perfect results.
      `;

      const result = await pipeline.detectHallucinations(suspiciousContent);

      expect(result.flaggedSections.length).toBeGreaterThan(0);
      
      const suspiciousFlags = result.flaggedSections.filter(section => 
        section.riskType === 'suspicious_pattern'
      );
      expect(suspiciousFlags.length).toBeGreaterThan(0);
      
      // Check for overly specific claims
      expect(suspiciousFlags.some(flag => 
        flag.explanation.includes('specific')
      )).toBe(true);
    });

    it('should detect factual inconsistencies', async () => {
      const inconsistentContent = `
        Research shows that 25% of companies use digital marketing.
        The same study indicates that 75% of organizations implement digital strategies.
        Data reveals that 50% of businesses have digital transformation initiatives.
        Analysis found that 90% of companies utilize digital technologies.
      `;

      const result = await pipeline.detectHallucinations(inconsistentContent);

      const inconsistencyFlags = result.flaggedSections.filter(section => 
        section.riskType === 'factual_inconsistency'
      );
      expect(inconsistencyFlags.length).toBeGreaterThan(0);
    });

    it('should detect unverifiable source claims', async () => {
      const unverifiableContent = `
        According to research, companies see improved results.
        Studies indicate that strategies work effectively.
        Data reveals significant improvements in performance.
        Reports suggest that organizations benefit from implementation.
      `;

      const result = await pipeline.detectHallucinations(unverifiableContent);

      const sourceFlags = result.flaggedSections.filter(section => 
        section.riskType === 'unverifiable_claim'
      );
      expect(sourceFlags.length).toBeGreaterThan(0);
      
      sourceFlags.forEach(flag => {
        expect(flag.explanation).toContain('attribution');
      });
    });

    it('should detect AI-generated patterns', async () => {
      const aiContent = `
        It's important to note that digital marketing is crucial.
        Furthermore, it's worth noting that strategies matter.
        Moreover, it's important to note that implementation is key.
        In conclusion, it's worth noting that results vary.
        To summarize, it's important to note that success depends on execution.
      `;

      const result = await pipeline.detectHallucinations(aiContent);

      const aiFlags = result.flaggedSections.filter(section => 
        section.riskType === 'ai_pattern'
      );
      expect(aiFlags.length).toBeGreaterThan(0);
      
      aiFlags.forEach(flag => {
        expect(flag.explanation).toContain('AI-common phrase');
      });
    });

    it('should provide meaningful recommendations', async () => {
      const problematicContent = `
        According to sources, exactly 73.456% of companies always succeed.
        It's important to note that all businesses never fail.
        Furthermore, research shows that 25% and also 75% of organizations benefit.
        Moreover, it's worth noting that absolutely every strategy works perfectly.
      `;

      const result = await pipeline.detectHallucinations(problematicContent);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Should include specific recommendations
      const recommendationText = result.recommendations.join(' ');
      expect(recommendationText).toContain('source');
      expect(recommendationText).toContain('verify');
    });

    it('should calculate risk levels correctly', async () => {
      const lowRiskContent = `
        Digital marketing strategies help businesses reach their target audience.
        Effective content creation involves understanding customer needs.
        Analytics provide insights into campaign performance.
        Continuous optimization improves marketing outcomes.
      `;

      const mediumRiskContent = `
        According to research, companies see improvements.
        It's important to note that strategies matter.
        Data shows that 50% of businesses benefit.
        Furthermore, implementation is crucial for success.
      `;

      const lowRiskResult = await pipeline.detectHallucinations(lowRiskContent);
      const mediumRiskResult = await pipeline.detectHallucinations(mediumRiskContent);

      expect(lowRiskResult.hallucinationRisk).toBeLessThan(mediumRiskResult.hallucinationRisk);
      expect(lowRiskResult.confidenceScore).toBeGreaterThan(mediumRiskResult.confidenceScore);
    });
  });

  describe('comprehensive validation', () => {
    it('should handle complex content with multiple validation aspects', async () => {
      const complexContent = `
        # Digital Marketing Transformation: A Comprehensive Analysis

        ## Industry Overview
        According to Forrester Research, 78% of enterprises have accelerated their digital transformation initiatives in 2025.
        McKinsey studies indicate that organizations with advanced digital capabilities are 23% more profitable than their peers.

        ## Key Statistics
        Recent analysis by Deloitte reveals that companies investing in AI-powered marketing see:
        - 40% improvement in customer acquisition costs
        - 35% increase in customer lifetime value
        - 50% reduction in campaign optimization time

        ## Implementation Strategies
        Based on extensive field research, successful digital transformation requires:
        1. Strong leadership commitment and vision
        2. Cross-functional collaboration and alignment
        3. Data-driven decision making processes
        4. Continuous learning and adaptation

        ## Future Outlook
        Industry experts predict that by 2026, the global marketing automation market will reach $8.42 billion.
        Organizations that begin their transformation journey now will have significant competitive advantages.

        ## Conclusion
        The evidence clearly demonstrates that digital marketing transformation is not optional but essential for business success.
        Companies must act decisively to implement comprehensive strategies that leverage emerging technologies and data insights.
      `;

      // Test fact verification
      const factResult = await pipeline.verifyFactsRealTime(complexContent);
      expect(factResult.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(factResult.verifiedClaims.length).toBeGreaterThan(0);

      // Test hallucination detection
      const hallucinationResult = await pipeline.detectHallucinations(complexContent);
      expect(hallucinationResult.hallucinationRisk).toBeLessThan(10);
      expect(hallucinationResult.confidenceScore).toBeGreaterThan(90);

      // Verify comprehensive analysis
      expect(factResult.sources.length).toBeGreaterThan(0);
      expect(hallucinationResult.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty content gracefully', async () => {
      const emptyContent = '';

      const factResult = await pipeline.verifyFactsRealTime(emptyContent);
      expect(factResult.confidenceScore).toBe(100);
      expect(factResult.verifiedClaims).toHaveLength(0);

      const hallucinationResult = await pipeline.detectHallucinations(emptyContent);
      expect(hallucinationResult.hallucinationRisk).toBe(0);
      expect(hallucinationResult.confidenceScore).toBe(100);
    });

    it('should handle content with special characters', async () => {
      const specialContent = `
        According to research, 50% of companies use "advanced analytics" & AI.
        Studies show that organizations with $1M+ budgets see 25% improvement.
        Data indicates that 30% of businesses (especially SMEs) benefit from automation.
      `;

      const factResult = await pipeline.verifyFactsRealTime(specialContent);
      expect(factResult).toBeDefined();
      expect(factResult.confidenceScore).toBeGreaterThan(0);

      const hallucinationResult = await pipeline.detectHallucinations(specialContent);
      expect(hallucinationResult).toBeDefined();
      expect(hallucinationResult.hallucinationRisk).toBeGreaterThanOrEqual(0);
    });

    it('should provide detailed flagged section information', async () => {
      const flaggedContent = `
        Exactly 73.456% of companies always achieve precisely perfect results.
        According to unnamed sources, all businesses never fail completely.
      `;

      const result = await pipeline.detectHallucinations(flaggedContent);

      expect(result.flaggedSections.length).toBeGreaterThan(0);
      
      result.flaggedSections.forEach(section => {
        expect(section.text).toBeDefined();
        expect(section.startIndex).toBeGreaterThanOrEqual(0);
        expect(section.endIndex).toBeGreaterThan(section.startIndex);
        expect(section.riskType).toBeDefined();
        expect(section.riskLevel).toBeDefined();
        expect(section.explanation).toBeDefined();
      });
    });
  });
});
