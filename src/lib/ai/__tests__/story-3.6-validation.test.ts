/**
 * Story 3.6: Content Validation & Anti-Hallucination - Comprehensive Tests
 * Tests RealTimeFactVerifier, AntiHallucinationEngine, SourceValidator, and ExpertiseValidator
 */

import { RealTimeFactVerifier } from '../real-time-fact-verifier';
import { AntiHallucinationEngine } from '../anti-hallucination-engine';
import { SourceValidator } from '../source-validator';
import { ExpertiseValidator } from '../expertise-validator';
import { CrossSearchEngineOptimizer } from '../cross-search-engine-optimizer';

describe('Story 3.6: Content Validation & Anti-Hallucination', () => {
  let factVerifier: RealTimeFactVerifier;
  let hallucinationEngine: AntiHallucinationEngine;
  let sourceValidator: SourceValidator;
  let expertiseValidator: ExpertiseValidator;
  let crossEngineOptimizer: CrossSearchEngineOptimizer;

  const testContent = `
    # Advanced SEO Strategies for 2025

    Search engine optimization has evolved significantly over the past 20+ years. 
    According to recent studies, 75% of users never scroll past the first page of search results.
    
    ## Industry Insights from Experience
    
    In my experience working with Fortune 500 companies, I've seen that the most effective 
    SEO strategies combine technical excellence with high-quality content. Case studies from 
    our recent client work show an average 150% increase in organic traffic.
    
    ## Data-Driven Recommendations
    
    Research from Stanford University indicates that websites with structured data 
    see 30% better click-through rates. Best practices include:
    
    - Implementing schema markup
    - Optimizing for Core Web Vitals
    - Creating comprehensive content clusters
    
    ## Current Market Trends
    
    The SEO landscape in 2025 is dominated by AI-powered search algorithms. 
    Google's latest updates prioritize E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
    
    [Source: Google Search Central](https://developers.google.com/search)
    [Research Paper: SEO Trends 2025](https://example-university.edu/seo-research)
  `;

  const testContentWithIssues = `
    # Revolutionary SEO Breakthrough

    Our groundbreaking research proves that 100% of websites using our method 
    achieve first-page rankings within 24 hours. This has never been done before 
    in the history of SEO.
    
    According to our internal studies, search engines will completely change 
    their algorithms next month. We have insider information that Google 
    will prioritize websites with purple backgrounds.
    
    Obviously, everyone knows that keyword stuffing is the best SEO strategy. 
    SEO SEO SEO optimization optimization optimization is clearly the way to go.
    
    Our CEO, who invented the internet, guarantees these results.
  `;

  beforeEach(() => {
    factVerifier = new RealTimeFactVerifier();
    hallucinationEngine = new AntiHallucinationEngine();
    sourceValidator = new SourceValidator();
    expertiseValidator = new ExpertiseValidator();
    crossEngineOptimizer = new CrossSearchEngineOptimizer();
  });

  describe('RealTimeFactVerifier', () => {
    it('should verify factual claims in content', async () => {
      const result = await factVerifier.verifyContentFacts(testContent);

      expect(result.totalClaims).toBeGreaterThan(0);
      expect(result.verifiedClaims).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
      expect(result.currentInformationCompliance).toBeGreaterThanOrEqual(0);
      expect(result.overallVerificationStatus).toMatch(/^(VERIFIED|PARTIAL|FAILED)$/);
    });

    it('should flag suspicious claims', async () => {
      const result = await factVerifier.verifyContentFacts(testContentWithIssues);

      expect(result.flaggedClaims.length).toBeGreaterThan(0);
      expect(result.overallVerificationStatus).toBe('FAILED');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should assess 2025 compliance', async () => {
      const result = await factVerifier.verifyContentFacts(testContent);

      expect(result.currentInformationCompliance).toBeGreaterThan(0);
      expect(typeof result.currentInformationCompliance).toBe('number');
    });

    it('should provide detailed flagged claims', async () => {
      const result = await factVerifier.verifyContentFacts(testContentWithIssues);

      expect(result.flaggedClaims.length).toBeGreaterThan(0);
      result.flaggedClaims.forEach(claim => {
        expect(claim.claim).toBeDefined();
        expect(claim.verified).toBe(false);
        expect(claim.confidence).toBeGreaterThanOrEqual(0);
        expect(claim.reasoning).toBeDefined();
      });
    });
  });

  describe('AntiHallucinationEngine', () => {
    it('should detect hallucination risks', async () => {
      const result = await hallucinationEngine.preventHallucinations(testContentWithIssues);

      expect(result.hallucinationRisk).toBeGreaterThan(0.5);
      expect(result.approvalStatus).toMatch(/^(APPROVED|NEEDS_REVIEW|REJECTED)$/);
      expect(result.flaggedSections.length).toBeGreaterThan(0);
    });

    it('should approve high-quality content', async () => {
      const result = await hallucinationEngine.preventHallucinations(testContent);

      expect(result.hallucinationRisk).toBeLessThan(0.7);
      expect(result.approvalStatus).toMatch(/^(APPROVED|NEEDS_REVIEW)$/);
    });

    it('should provide detailed detection results', async () => {
      const result = await hallucinationEngine.preventHallucinations(testContent);

      expect(result.detectionResults.factualAccuracy).toBeDefined();
      expect(result.detectionResults.sourceValidation).toBeDefined();
      expect(result.detectionResults.consistencyCheck).toBeDefined();
      
      expect(result.detectionResults.factualAccuracy.score).toBeGreaterThanOrEqual(0);
      expect(result.detectionResults.sourceValidation.score).toBeGreaterThanOrEqual(0);
      expect(result.detectionResults.consistencyCheck.score).toBeGreaterThanOrEqual(0);
    });

    it('should flag problematic sections with recommendations', async () => {
      const result = await hallucinationEngine.preventHallucinations(testContentWithIssues);

      expect(result.flaggedSections.length).toBeGreaterThan(0);
      result.flaggedSections.forEach(section => {
        expect(section.text).toBeDefined();
        expect(section.riskLevel).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
        expect(section.reason).toBeDefined();
        expect(section.suggestedFix).toBeDefined();
        expect(section.confidence).toBeGreaterThan(0);
      });
    });

    it('should generate actionable recommendations', async () => {
      const result = await hallucinationEngine.preventHallucinations(testContentWithIssues);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('CRITICAL');
    });
  });

  describe('SourceValidator', () => {
    it('should analyze citations in content', async () => {
      const result = await sourceValidator.analyzeCitations(testContent);

      expect(result.totalCitations).toBeGreaterThan(0);
      expect(result.validCitations).toBeGreaterThanOrEqual(0);
      expect(result.citationQuality).toBeGreaterThanOrEqual(0);
      expect(result.sourceDistribution).toBeDefined();
    });

    it('should validate individual sources', async () => {
      const result = await sourceValidator.validateSource('https://developers.google.com/search');

      expect(result.isValid).toBeDefined();
      expect(result.sourceCredibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.sourceCredibilityScore).toBeLessThanOrEqual(100);
      expect(result.sourceType).toMatch(/^(ACADEMIC|GOVERNMENT|COMMERCIAL|NEWS|UNKNOWN)$/);
      expect(result.accessibility).toMatch(/^(ACCESSIBLE|RESTRICTED|BROKEN)$/);
    });

    it('should identify missing citations', async () => {
      const result = await sourceValidator.analyzeCitations(testContentWithIssues);

      expect(result.missingCitations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide detailed validation information', async () => {
      const result = await sourceValidator.validateSource('https://example-university.edu/research');

      expect(result.validationDetails).toBeDefined();
      expect(result.validationDetails.domainCredibility).toBeGreaterThanOrEqual(0);
      expect(result.validationDetails.authorityIndicators).toBeDefined();
      expect(Array.isArray(result.validationDetails.warnings)).toBe(true);
      expect(Array.isArray(result.validationDetails.recommendations)).toBe(true);
    });
  });

  describe('ExpertiseValidator', () => {
    it('should validate expertise level in content', async () => {
      const result = await expertiseValidator.validateExpertiseLevel(testContent, 'technology');

      expect(result.expertiseScore).toBeGreaterThanOrEqual(0);
      expect(result.expertiseScore).toBeLessThanOrEqual(1);
      expect(result.expertiseLevel).toMatch(/^(NOVICE|INTERMEDIATE|ADVANCED|EXPERT|MASTER)$/);
      expect(result.industryDepth).toBeGreaterThanOrEqual(0);
    });

    it('should detect expertise indicators', async () => {
      const result = await expertiseValidator.validateExpertiseLevel(testContent, 'technology');

      expect(result.experienceIndicators.length).toBeGreaterThan(0);
      result.experienceIndicators.forEach(indicator => {
        expect(indicator.type).toMatch(/^(CASE_STUDY|INDUSTRY_INSIGHT|EXPERIENCE_ADVICE|DATA_DRIVEN|BEST_PRACTICE)$/);
        expect(indicator.expertiseLevel).toBeGreaterThan(0);
        expect(indicator.confidence).toBeGreaterThan(0);
      });
    });

    it('should identify authority signals', async () => {
      const result = await expertiseValidator.validateExpertiseLevel(testContent, 'technology');

      expect(result.authoritySignals.length).toBeGreaterThanOrEqual(0);
      result.authoritySignals.forEach(signal => {
        expect(signal.type).toMatch(/^(EXPERIENCE_REFERENCE|INDUSTRY_KNOWLEDGE|TECHNICAL_DEPTH|PRACTICAL_WISDOM|THOUGHT_LEADERSHIP)$/);
        expect(signal.strength).toBeGreaterThan(0);
        expect(signal.description).toBeDefined();
      });
    });

    it('should provide expertise enhancement recommendations', async () => {
      const result = await expertiseValidator.validateExpertiseLevel(testContentWithIssues, 'technology');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.validationDetails).toBeDefined();
      expect(result.validationDetails.caseStudyCount).toBeGreaterThanOrEqual(0);
      expect(result.validationDetails.industryInsightCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CrossSearchEngineOptimizer', () => {
    it('should optimize for all major search engines', async () => {
      const result = await crossEngineOptimizer.optimizeForAllSearchEngines(testContent, ['SEO', 'optimization']);

      expect(result.googleScore).toBeGreaterThanOrEqual(0);
      expect(result.bingScore).toBeGreaterThanOrEqual(0);
      expect(result.duckDuckGoScore).toBeGreaterThanOrEqual(0);
      expect(result.yahooScore).toBeGreaterThanOrEqual(0);
      expect(result.overallOptimization).toBeGreaterThanOrEqual(0);
    });

    it('should provide engine-specific optimizations', async () => {
      const result = await crossEngineOptimizer.optimizeForAllSearchEngines(testContent, ['SEO']);

      expect(result.engineSpecificOptimizations.google).toBeDefined();
      expect(result.engineSpecificOptimizations.bing).toBeDefined();
      expect(result.engineSpecificOptimizations.duckDuckGo).toBeDefined();
      expect(result.engineSpecificOptimizations.yahoo).toBeDefined();

      Object.values(result.engineSpecificOptimizations).forEach(optimization => {
        expect(optimization.score).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(optimization.strengths)).toBe(true);
        expect(Array.isArray(optimization.weaknesses)).toBe(true);
        expect(Array.isArray(optimization.recommendations)).toBe(true);
      });
    });

    it('should assess authority ranking potential', async () => {
      const result = await crossEngineOptimizer.optimizeForAllSearchEngines(testContent, ['SEO']);

      expect(result.authorityRankingPotential).toBeGreaterThanOrEqual(0);
      expect(result.authorityRankingPotential).toBeLessThanOrEqual(1);
    });

    it('should generate cross-engine recommendations', async () => {
      const result = await crossEngineOptimizer.optimizeForAllSearchEngines(testContent, ['SEO']);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full content validation workflow', async () => {
      // Step 1: Fact verification
      const factResult = await factVerifier.verifyContentFacts(testContent);
      
      // Step 2: Hallucination detection
      const hallucinationResult = await hallucinationEngine.preventHallucinations(testContent);
      
      // Step 3: Source validation
      const sourceResult = await sourceValidator.analyzeCitations(testContent);
      
      // Step 4: Expertise validation
      const expertiseResult = await expertiseValidator.validateExpertiseLevel(testContent, 'technology');
      
      // Step 5: Cross-engine optimization
      const optimizationResult = await crossEngineOptimizer.optimizeForAllSearchEngines(testContent, ['SEO']);

      // Verify all components completed successfully
      expect(factResult.overallVerificationStatus).toBeDefined();
      expect(hallucinationResult.approvalStatus).toBeDefined();
      expect(sourceResult.citationQuality).toBeGreaterThanOrEqual(0);
      expect(expertiseResult.expertiseLevel).toBeDefined();
      expect(optimizationResult.overallOptimization).toBeGreaterThanOrEqual(0);
    });

    it('should handle problematic content appropriately', async () => {
      const factResult = await factVerifier.verifyContentFacts(testContentWithIssues);
      const hallucinationResult = await hallucinationEngine.preventHallucinations(testContentWithIssues);
      
      // Should flag issues
      expect(factResult.overallVerificationStatus).toBe('FAILED');
      expect(hallucinationResult.approvalStatus).toBe('REJECTED');
      expect(hallucinationResult.hallucinationRisk).toBeGreaterThan(0.5);
    });

    it('should provide comprehensive validation metrics', async () => {
      const factResult = await factVerifier.verifyContentFacts(testContent);
      const hallucinationResult = await hallucinationEngine.preventHallucinations(testContent);
      const sourceResult = await sourceValidator.analyzeCitations(testContent);
      const expertiseResult = await expertiseValidator.validateExpertiseLevel(testContent, 'technology');

      // Calculate overall validation score
      const overallScore = (
        factResult.confidenceScore * 0.3 +
        (1 - hallucinationResult.hallucinationRisk) * 0.3 +
        sourceResult.citationQuality * 0.2 +
        expertiseResult.expertiseScore * 0.2
      );

      expect(overallScore).toBeGreaterThan(0);
      expect(overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance and Accuracy', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      await Promise.all([
        factVerifier.verifyContentFacts(testContent),
        hallucinationEngine.preventHallucinations(testContent),
        sourceValidator.analyzeCitations(testContent),
        expertiseValidator.validateExpertiseLevel(testContent, 'technology'),
      ]);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should maintain consistency across multiple runs', async () => {
      const results = await Promise.all([
        factVerifier.verifyContentFacts(testContent),
        factVerifier.verifyContentFacts(testContent),
        factVerifier.verifyContentFacts(testContent),
      ]);

      // Results should be consistent
      expect(results[0].totalClaims).toBe(results[1].totalClaims);
      expect(results[1].totalClaims).toBe(results[2].totalClaims);
    });

    it('should handle edge cases gracefully', async () => {
      const emptyContent = '';
      const shortContent = 'Short content.';
      
      // Should not throw errors
      await expect(factVerifier.verifyContentFacts(emptyContent)).resolves.toBeDefined();
      await expect(hallucinationEngine.preventHallucinations(shortContent)).resolves.toBeDefined();
      await expect(sourceValidator.analyzeCitations(emptyContent)).resolves.toBeDefined();
      await expect(expertiseValidator.validateExpertiseLevel(shortContent, 'technology')).resolves.toBeDefined();
    });
  });

  describe('2025 Compliance', () => {
    it('should ensure 2025 information compliance', async () => {
      const result = await factVerifier.verifyContentFacts(testContent);
      
      expect(result.currentInformationCompliance).toBeGreaterThan(0);
      
      // Check for 2025-specific compliance
      result.flaggedClaims.forEach(claim => {
        expect(claim.compliance2025).toBeDefined();
      });
    });

    it('should validate current search engine requirements', async () => {
      const result = await crossEngineOptimizer.optimizeForAllSearchEngines(testContent, ['SEO']);
      
      // Should optimize for current 2025 search engine algorithms
      expect(result.overallOptimization).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });
});
