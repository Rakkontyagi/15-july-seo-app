/**
 * Comprehensive tests for ExpertContentGenerator
 * Tests the enhanced 20+ years expertise validation and authority signal integration
 */

import { ExpertContentGenerator, ExpertContentRequest, ExpertiseScore, AuthorityEnhancedContent } from '../expert-content-generator';

describe('ExpertContentGenerator', () => {
  let generator: ExpertContentGenerator;
  let mockRequest: ExpertContentRequest;

  beforeEach(() => {
    generator = new ExpertContentGenerator();
    
    mockRequest = {
      topic: 'Digital Marketing Strategy',
      industry: 'marketing',
      targetAudience: 'expert',
      contentType: 'guide',
      wordCount: 2000,
      keywords: ['digital marketing', 'SEO strategy', 'content optimization'],
      expertiseLevel: 'expert',
      includePersonalExperience: true,
      includeCaseStudies: true,
      includeDataPoints: true,
      requireAuthoritySignals: true,
      targetExpertiseScore: 85
    };
  });

  describe('validateExpertiseLevel', () => {
    it('should validate 20+ years expertise level with 70%+ score', async () => {
      const expertContent = `
        Having spent over 20 years working extensively in the marketing sector, I've witnessed firsthand the evolution of digital marketing from emerging concept to critical business imperative. Through direct involvement in 100+ implementations across Fortune 500 companies and innovative startups alike, I've developed deep insights into what truly drives success in this domain.

        In my 25 years as a marketing strategist, I've led teams across multiple industries including technology, healthcare, and finance. The most effective approach I've found is combining data-driven decision making with creative innovation. From my experience leading 150+ marketing transformations, the key factor is stakeholder alignment.

        During a recent project with a Fortune 500 technology client, we discovered that personalized content strategies resulted in 40% improvement in conversion rates. This practical implementation taught us valuable lessons about audience segmentation and content optimization.

        I've published extensively on digital marketing trends and have been recognized as a thought leader in the industry. My methodology development includes creating frameworks that have been adopted by organizations worldwide.
      `;

      const result = await generator.validateExpertiseLevel(expertContent, 'marketing');

      expect(result.overallScore).toBeGreaterThanOrEqual(70);
      expect(result.expertiseIndicators.yearsOfExperience).toBeGreaterThanOrEqual(20);
      expect(result.industryDepth.industryKnowledge).toBeGreaterThan(0);
      expect(result.experienceSignals.practicalExamples).toBeGreaterThan(0);
      expect(result.authorityMarkers.thoughtLeadership).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    it('should throw error when expertise score is below 70%', async () => {
      const lowExpertiseContent = `
        I have some experience in marketing. I've worked on a few projects and learned some things along the way.
        Marketing is important for businesses and there are various strategies that can be used.
      `;

      await expect(generator.validateExpertiseLevel(lowExpertiseContent, 'marketing'))
        .rejects.toThrow('Content expertise score');
    });

    it('should analyze expertise indicators correctly', async () => {
      const expertContent = `
        In my 22 years of experience, I've led 75 major implementations across various industries.
        Having worked with multiple sectors including technology and healthcare, I've developed comprehensive knowledge.
        My extensive understanding of market dynamics has been recognized through industry awards.
        I've managed teams of 50+ professionals and directed organizational transformations.
      `;

      const result = await generator.validateExpertiseLevel(expertContent, 'marketing');

      expect(result.expertiseIndicators.yearsOfExperience).toBe(22);
      expect(result.expertiseIndicators.projectCount).toBeGreaterThan(0);
      expect(result.expertiseIndicators.industryBreadth).toBeGreaterThan(0);
      expect(result.expertiseIndicators.technicalDepth).toBeGreaterThan(0);
      expect(result.expertiseIndicators.leadershipExperience).toBeGreaterThan(0);
    });

    it('should validate industry knowledge depth', async () => {
      const industryContent = `
        The marketing landscape has evolved significantly with digital transformation and automation.
        Current trends indicate a shift toward AI marketing and personalization, which aligns with my observations.
        Traditional advertising methods like print media and broadcast have given way to digital channels.
        Future innovations will likely include predictive personalization and immersive experiences.
        Understanding competitive landscape and market dynamics is crucial for success.
      `;

      const result = await generator.validateExpertiseLevel(industryContent, 'marketing');

      expect(result.industryDepth.industryKnowledge).toBeGreaterThan(0);
      expect(result.industryDepth.currentTrends).toBeGreaterThan(0);
      expect(result.industryDepth.historicalContext).toBeGreaterThan(0);
      expect(result.industryDepth.futureInsights).toBeGreaterThan(0);
      expect(result.industryDepth.competitiveUnderstanding).toBeGreaterThan(0);
    });

    it('should detect experience signals', async () => {
      const experienceContent = `
        In practice, I've found that real-world implementation requires hands-on experience.
        Through practical application, I learned that stakeholder engagement is crucial.
        I discovered that data-driven approaches solve complex problems more effectively.
        Having developed multiple frameworks and methodologies, I've addressed various challenges.
        I've taught and mentored over 200 professionals in advanced marketing techniques.
      `;

      const result = await generator.validateExpertiseLevel(experienceContent, 'marketing');

      expect(result.experienceSignals.practicalExamples).toBeGreaterThan(0);
      expect(result.experienceSignals.lessonsLearned).toBeGreaterThan(0);
      expect(result.experienceSignals.methodologyDevelopment).toBeGreaterThan(0);
      expect(result.experienceSignals.problemSolving).toBeGreaterThan(0);
      expect(result.experienceSignals.mentorshipEvidence).toBeGreaterThan(0);
    });

    it('should identify authority markers', async () => {
      const authorityContent = `
        I predict that the future of marketing will be driven by AI and automation trends.
        Having pioneered several innovative approaches, I've introduced new methodologies to the industry.
        My work has been recognized through industry awards and I've been featured in publications.
        I regularly speak at conferences and conduct workshops on advanced marketing strategies.
        I've published research papers and authored multiple studies on marketing effectiveness.
      `;

      const result = await generator.validateExpertiseLevel(authorityContent, 'marketing');

      expect(result.authorityMarkers.thoughtLeadership).toBeGreaterThan(0);
      expect(result.authorityMarkers.innovationContributions).toBeGreaterThan(0);
      expect(result.authorityMarkers.industryRecognition).toBeGreaterThan(0);
      expect(result.authorityMarkers.publicSpeaking).toBeGreaterThan(0);
      expect(result.authorityMarkers.publicationHistory).toBeGreaterThan(0);
    });
  });

  describe('integrateAuthoritySignals', () => {
    it('should integrate authority signals with minimum threshold', async () => {
      const baseContent = `
        Digital marketing strategy requires comprehensive understanding of customer behavior and market dynamics.
        Effective implementation involves multiple touchpoints and data-driven optimization.
      `;

      const result = await generator.integrateAuthoritySignals(baseContent, 'marketing');

      expect(result.authorityScore).toBeGreaterThanOrEqual(8); // Minimum threshold
      expect(result.enhancedContent).toContain(baseContent);
      expect(result.enhancedContent.length).toBeGreaterThan(baseContent.length);
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.eeatOptimization).toBeDefined();
      expect(result.eeatOptimization.overallEEAT).toBeGreaterThan(0);
    });

    it('should throw error when authority signals are below threshold', async () => {
      // Mock the private methods to return low scores
      const originalCalculateAuthorityScore = (generator as any).calculateAuthorityScore;
      (generator as any).calculateAuthorityScore = jest.fn().mockReturnValue(5); // Below threshold

      const baseContent = 'Simple content without authority signals.';

      await expect(generator.integrateAuthoritySignals(baseContent, 'marketing'))
        .rejects.toThrow('Authority signal count 5 below required 8 threshold');

      // Restore original method
      (generator as any).calculateAuthorityScore = originalCalculateAuthorityScore;
    });

    it('should generate E-E-A-T optimization', async () => {
      const expertContent = `
        With 20+ years of experience in marketing, I've developed expertise in digital strategies.
        As a recognized authority in the field, I've published reliable and accurate research.
        My proven methodologies have been verified through extensive testing and implementation.
      `;

      const result = await generator.integrateAuthoritySignals(expertContent, 'marketing');

      expect(result.eeatOptimization.experience).toBeGreaterThan(0);
      expect(result.eeatOptimization.expertise).toBeGreaterThan(0);
      expect(result.eeatOptimization.authoritativeness).toBeGreaterThan(0);
      expect(result.eeatOptimization.trustworthiness).toBeGreaterThan(0);
      expect(result.eeatOptimization.overallEEAT).toBeGreaterThan(0);
    });

    it('should compile authority sources correctly', async () => {
      const baseContent = 'Marketing strategy content for authority enhancement.';

      const result = await generator.integrateAuthoritySignals(baseContent, 'marketing');

      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      
      const sourceTypes = result.sources.map(source => source.type);
      expect(sourceTypes).toContain('case_study');
      expect(sourceTypes).toContain('statistic');
      
      result.sources.forEach(source => {
        expect(source.credibility).toBeGreaterThan(0);
        expect(source.relevance).toBeGreaterThan(0);
        expect(source.recency).toBeGreaterThan(0);
        expect(source.content).toBeDefined();
      });
    });
  });

  describe('comprehensive expertise validation', () => {
    it('should meet all PRD requirements for expert content', async () => {
      const comprehensiveExpertContent = `
        # Mastering Digital Marketing: A 25-Year Practitioner's Guide

        Having spent over 25 years working extensively in the marketing sector, I've witnessed firsthand the evolution of digital marketing from emerging concept to critical business imperative. Through direct involvement in 200+ implementations across Fortune 500 companies and innovative startups alike, I've developed deep insights into what truly drives success in this domain.

        ## Industry Context and Evolution

        The marketing landscape has undergone significant transformation over the past two decades. Digital transformation and automation have fundamentally altered how organizations approach customer engagement. What we're seeing now is a convergence of AI marketing, personalization, and omnichannel strategies that demands a more sophisticated approach to digital marketing strategy.

        From my perspective, having guided organizations through multiple industry cycles, the current environment presents both unprecedented opportunities and complex challenges. The integration of SEO strategy with traditional marketing practices has become essential for competitive advantage.

        ## Real-World Implementation Strategies

        Based on extensive field experience, I've identified several fundamental principles that consistently drive success in digital marketing:

        1. **Data-Driven Decision Making**: Every initiative must be backed by comprehensive analytics
        2. **Customer-Centric Approach**: Understanding audience behavior drives strategy
        3. **Iterative Optimization**: Continuous testing and refinement improve outcomes
        4. **Cross-Channel Integration**: Holistic approaches maximize impact
        5. **Technology Leverage**: AI and automation enhance efficiency and effectiveness

        These principles emerged from analyzing patterns across 200+ different implementations and represent the distilled wisdom of years of hands-on experience.

        ## Case Studies and Lessons Learned

        During a recent engagement with a Fortune 500 technology organization, we faced the challenge of implementing personalized marketing across 15 global markets. The key insight that emerged was the critical importance of cultural adaptation while maintaining brand consistency.

        **Challenge**: Standardizing processes while respecting local market requirements
        **Solution**: Developed a flexible framework with core standards and local customization options
        **Result**: 65% improvement in engagement metrics across all locations

        Working with a rapidly growing startup in the e-commerce space, we needed to implement scalable marketing automation while maintaining agility and innovation capacity.

        **Challenge**: Balancing structure with flexibility during rapid growth
        **Solution**: Implemented lightweight processes with built-in scaling mechanisms
        **Result**: Maintained 95% operational efficiency through 400% growth period

        ## Advanced Techniques and Best Practices

        Advanced practitioners in digital marketing leverage several sophisticated techniques:

        **1. Predictive Analytics Integration**
        Using historical data patterns to anticipate customer behavior and optimize campaigns before performance issues arise.

        **2. Cross-Functional Optimization**
        Implementing holistic approaches that optimize across traditional departmental boundaries for maximum organizational impact.

        **3. AI-Powered Personalization**
        Developing systems that automatically adjust content and messaging based on individual user behavior and preferences.

        ## Future Trends and Strategic Implications

        Based on current market analysis and emerging technology trends, several key developments will shape the future of digital marketing:

        **1. AI-Driven Automation**
        Intelligent systems will increasingly handle routine optimization tasks, allowing human expertise to focus on strategic and creative challenges.

        **2. Privacy-First Marketing**
        Solutions will need to balance personalization with privacy requirements, requiring innovative approaches to data collection and usage.

        **3. Immersive Experiences**
        Virtual and augmented reality will become integral to customer engagement strategies.

        Organizations that begin preparing for these trends now will have significant competitive advantages as they become mainstream.

        ## Conclusion and Key Takeaways

        The journey toward mastering digital marketing requires both strategic thinking and practical execution. The insights shared here represent the culmination of 25 years of dedicated work in this field.

        The most important lesson I've learned is that sustainable success comes from understanding not just the technical aspects, but the broader ecosystem of factors that influence customer behavior and business outcomes.
      `;

      // Test expertise validation
      const expertiseResult = await generator.validateExpertiseLevel(comprehensiveExpertContent, 'marketing');
      expect(expertiseResult.overallScore).toBeGreaterThanOrEqual(70);
      expect(expertiseResult.expertiseIndicators.yearsOfExperience).toBeGreaterThanOrEqual(20);

      // Test authority signal integration
      const authorityResult = await generator.integrateAuthoritySignals(comprehensiveExpertContent, 'marketing');
      expect(authorityResult.authorityScore).toBeGreaterThanOrEqual(8);
      expect(authorityResult.eeatOptimization.overallEEAT).toBeGreaterThan(0);

      // Verify comprehensive coverage
      expect(expertiseResult.industryDepth.industryKnowledge).toBeGreaterThan(50);
      expect(expertiseResult.experienceSignals.practicalExamples).toBeGreaterThan(50);
      expect(expertiseResult.authorityMarkers.thoughtLeadership).toBeGreaterThan(30);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty content gracefully', async () => {
      const emptyContent = '';

      await expect(generator.validateExpertiseLevel(emptyContent, 'marketing'))
        .rejects.toThrow('Content expertise score');
    });

    it('should handle unknown industry gracefully', async () => {
      const expertContent = `
        Having spent over 20 years in this field, I've developed extensive expertise and knowledge.
        My experience includes leading multiple projects and developing innovative solutions.
      `;

      const result = await generator.validateExpertiseLevel(expertContent, 'unknown_industry');
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should provide meaningful recommendations for improvement', async () => {
      const lowScoreContent = `
        I have worked in marketing for a few years and have some experience with digital strategies.
        Marketing is important and there are various approaches that can be effective.
      `;

      try {
        await generator.validateExpertiseLevel(lowScoreContent, 'marketing');
      } catch (error) {
        // Expected to throw, but we want to test the recommendations logic
        expect(error).toBeDefined();
      }

      // Test with content that passes but has room for improvement
      const improvableContent = `
        Having worked in marketing for 20 years, I've gained experience in digital strategies.
        I've worked on several projects and learned various techniques for optimization.
        Marketing requires understanding of customer behavior and market dynamics.
      `;

      const result = await generator.validateExpertiseLevel(improvableContent, 'marketing');
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
