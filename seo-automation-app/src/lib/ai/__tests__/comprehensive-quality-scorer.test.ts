import { ComprehensiveQualityScorer, QualityScore, QualityStandards } from '../comprehensive-quality-scorer';

describe('ComprehensiveQualityScorer', () => {
  let scorer: ComprehensiveQualityScorer;

  beforeEach(() => {
    scorer = new ComprehensiveQualityScorer();
    jest.clearAllMocks();
  });

  describe('calculateOverallQuality', () => {
    it('should score high-quality professional content', async () => {
      const content = `
        # Advanced SEO Strategies for 2025

        ## Introduction

        I've been working in SEO for over 15 years, and I can tell you that the landscape
        has changed dramatically. What worked five years ago might actually hurt your
        rankings today.

        ## Key Strategies

        Based on my experience with over 500 client websites, here are the strategies
        that consistently deliver results:

        ### 1. Content Quality Focus

        Research from leading SEO experts shows that content quality is now the primary
        ranking factor. According to Google's own documentation, they prioritize content
        that demonstrates expertise, experience, authoritativeness, and trustworthiness.

        ### 2. Technical SEO Excellence

        The data reveals that 73% of websites have technical issues that impact their
        search performance. I've seen firsthand how fixing these issues can lead to
        immediate ranking improvements.

        ## Conclusion

        These strategies have helped my clients achieve an average 150% increase in
        organic traffic. The key is consistent implementation and regular monitoring.

        *Sources: Google Search Quality Guidelines, SEMrush Industry Report 2024*
      `;

      const result = await scorer.calculateOverallQuality(content, 'SEO strategies');

      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.professionalWritingScore).toBeGreaterThan(75);
      expect(result.seoComplianceScore).toBeGreaterThan(50);
      expect(result.readabilityScore).toBeGreaterThan(65);
      expect(result.eeatScore).toBeGreaterThan(70);
      expect(result.passesQualityGate).toBe(true);
    });

    it('should score low-quality content appropriately', async () => {
      const content = `
        seo is important. you need to do seo. seo helps websites. seo is good.
        furthermore it is important to note that seo is cutting-edge technology.
        moreover this comprehensive solution provides state-of-the-art functionality.
      `;

      const result = await scorer.calculateOverallQuality(content, 'SEO');

      expect(result.overallScore).toBeLessThan(80);
      expect(result.professionalWritingScore).toBeLessThan(90);
      expect(result.readabilityScore).toBeLessThan(80);
      expect(result.authenticityScore).toBeLessThan(70);
      expect(result.passesQualityGate).toBe(false);
    });

    it('should evaluate SEO compliance accurately', async () => {
      const contentWithGoodSEO = `
        # Best SEO Practices for 2025

        ## Understanding SEO Fundamentals

        SEO optimization requires a strategic approach. When implementing SEO strategies,
        focus on these key areas:

        ### Technical SEO Requirements

        - Site speed optimization
        - Mobile responsiveness
        - Proper heading structure

        ### Content SEO Guidelines

        Quality content with proper SEO keyword density (1-2%) performs best.
        [Learn more about SEO](https://example.com/seo-guide)

        ## Advanced SEO Techniques

        Professional SEO practitioners recommend these advanced techniques for
        better search engine optimization results.
      `;

      const result = await scorer.calculateOverallQuality(contentWithGoodSEO, 'SEO');

      expect(result.seoComplianceScore).toBeGreaterThan(50);
      expect(result.breakdown.keywordOptimization).toBeGreaterThan(65);
      expect(result.breakdown.structuralSEO).toBeGreaterThan(70);
    });

    it('should handle content without target keyword', async () => {
      const content = `
        This is well-written professional content with good structure and flow.
        It demonstrates expertise and provides valuable insights to readers.
        The writing is clear, engaging, and maintains a consistent professional tone.
      `;

      const result = await scorer.calculateOverallQuality(content);

      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.seoComplianceScore).toBe(70); // Base score without keyword
      expect(result.professionalWritingScore).toBeGreaterThan(80);
    });

    it('should apply custom quality standards', async () => {
      const content = `
        This is decent content that meets basic standards but isn't exceptional.
        It has some good points and covers the topic adequately.
      `;

      const customStandards: QualityStandards = {
        minOverallScore: 95,
        minProfessionalWriting: 95,
        minSEOCompliance: 90,
        minReadability: 85,
        minAuthenticity: 90,
        minUniqueness: 95,
        minEEAT: 85,
        requireAllGatesPass: true
      };

      const result = await scorer.calculateOverallQuality(content, undefined, customStandards);

      expect(result.passesQualityGate).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      await expect(scorer.calculateOverallQuality('')).rejects.toThrow('Content must be a non-empty string');
    });

    it('should handle null content', async () => {
      await expect(scorer.calculateOverallQuality(null as any)).rejects.toThrow('Content must be a non-empty string');
    });
  });

  describe('validateProfessionalStandards', () => {
    it('should validate high-quality professional content', async () => {
      const content = `
        Based on my 20 years of experience in digital marketing, I can confidently say
        that content quality is the foundation of successful SEO. The data from our
        recent analysis of 10,000 websites confirms this trend.

        Our research methodology involved comprehensive analysis of ranking factors,
        user engagement metrics, and conversion rates. The results clearly demonstrate
        the correlation between content quality and search performance.
      `;

      const result = await scorer.validateProfessionalStandards(content);

      expect(result).toBe(true);
    });

    it('should reject low-quality content', async () => {
      const content = `
        seo is good. you should do seo. seo helps. furthermore it is important to
        note that seo is cutting-edge. moreover this comprehensive solution is good.
      `;

      const result = await scorer.validateProfessionalStandards(content);

      expect(result).toBe(false);
    });
  });

  describe('scoreSEOCompliance', () => {
    it('should score well-optimized content highly', async () => {
      const content = `
        # Digital Marketing Strategies

        ## Effective Digital Marketing Approaches

        Digital marketing success requires strategic planning. When developing digital
        marketing campaigns, consider these digital marketing best practices:

        ### Content Marketing in Digital Marketing

        Quality content drives digital marketing results. Research shows that businesses
        using digital marketing see 2.8x better revenue growth.

        [Source: Digital Marketing Institute](https://example.com)
      `;

      const score = await scorer.scoreSEOCompliance(content, 'digital marketing');

      expect(score).toBeGreaterThan(50);
    });

    it('should score poorly optimized content lower', async () => {
      const content = `
        This content has no headings and doesn't mention the target keyword at all.
        It's just generic text without any optimization or structure.
      `;

      const score = await scorer.scoreSEOCompliance(content, 'SEO optimization');

      expect(score).toBeLessThan(90);
    });

    it('should handle content without target keyword', async () => {
      const content = `
        # Well Structured Content

        ## Good Heading Hierarchy

        This content has good structure with proper headings and reasonable length.
        It includes external links and maintains good readability.

        [External link](https://example.com)
      `;

      const score = await scorer.scoreSEOCompliance(content);

      expect(score).toBe(70); // Base score without keyword optimization
    });
  });

  describe('quality breakdown analysis', () => {
    it('should provide detailed quality breakdown', async () => {
      const content = `
        # Professional Content Example

        ## Expert Analysis

        Based on extensive research and 15 years of industry experience, I can provide
        these insights. The data from peer-reviewed studies supports these conclusions.

        ### Key Findings

        Our analysis of 5,000 case studies reveals significant patterns. The statistics
        show a 95% correlation between quality metrics and performance outcomes.

        ## Transparent Methodology

        This analysis follows established industry standards and best practices.
        All data sources are verified and regularly updated for accuracy.

        *Disclaimer: Results may vary based on individual circumstances.*
      `;

      const result = await scorer.calculateOverallQuality(content, 'analysis');

      expect(result.breakdown.grammar).toBeGreaterThan(80);
      expect(result.breakdown.coherence).toBeGreaterThan(75);
      expect(result.breakdown.expertise).toBeGreaterThan(70);
      expect(result.breakdown.experience).toBeGreaterThan(65);
      expect(result.breakdown.authoritativeness).toBeGreaterThan(75);
      expect(result.breakdown.trustworthiness).toBeGreaterThan(80);
    });

    it('should identify specific improvement areas', async () => {
      const content = `
        this is low quality content with poor grammar and no structure.
        it has no headings no proper sentences and uses generic language.
        furthermore it is important to note that this cutting-edge solution
        provides comprehensive functionality with state-of-the-art technology.
      `;

      const result = await scorer.calculateOverallQuality(content);

      expect(result.breakdown.grammar).toBeLessThan(90);
      expect(result.breakdown.syntax).toBeLessThan(90);
      expect(result.breakdown.structuralSEO).toBeLessThan(90);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('performance and reliability', () => {
    it('should complete scoring within reasonable time', async () => {
      const content = 'This is a test sentence for performance evaluation. '.repeat(500);
      const startTime = Date.now();

      await scorer.calculateOverallQuality(content);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should be consistent across multiple runs', async () => {
      const content = `
        # Consistent Quality Content

        This content should produce consistent quality scores across multiple evaluations.
        It maintains professional standards and demonstrates expertise in the subject matter.
      `;

      const result1 = await scorer.calculateOverallQuality(content);
      const result2 = await scorer.calculateOverallQuality(content);

      expect(Math.abs(result1.overallScore - result2.overallScore)).toBeLessThan(2);
      expect(result1.passesQualityGate).toBe(result2.passesQualityGate);
    });

    it('should handle concurrent scoring requests', async () => {
      const content = 'This is test content for concurrent quality scoring.';
      
      const promises = Array(5).fill(null).map(() => 
        scorer.calculateOverallQuality(content)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.overallScore).toBeGreaterThan(0);
        expect(result.passesQualityGate).toBeDefined();
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very short content', async () => {
      const content = 'Short content.';

      const result = await scorer.calculateOverallQuality(content);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.seoComplianceScore).toBeLessThan(80); // Penalized for length
    });

    it('should handle very long content', async () => {
      const content = `
        # Comprehensive Guide
        
        ${Array(1000).fill('This is a detailed sentence with professional content. ').join('')}
      `;

      const result = await scorer.calculateOverallQuality(content);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.readabilityScore).toBeDefined();
    });

    it('should handle content with special characters', async () => {
      const content = `
        # Content with Special Characters

        This content includes émojis 🚀, spëcial characters, and ñumbers (123).
        It should still be scored accurately despite these elements.
      `;

      const result = await scorer.calculateOverallQuality(content);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.professionalWritingScore).toBeGreaterThan(70);
    });

    it('should provide meaningful recommendations', async () => {
      const content = `
        poor content with no structure bad grammar and generic language.
        furthermore it is important to note that this cutting-edge solution
        provides comprehensive state-of-the-art functionality.
      `;

      const result = await scorer.calculateOverallQuality(content);

      expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
      expect(result.recommendations.length).toBeGreaterThan(0);
      // Check that recommendations contain relevant improvement suggestions
      expect(result.recommendations.some(r =>
        r.includes('professional') || r.includes('authenticity') || r.includes('quality') ||
        r.includes('writing') || r.includes('improve') || r.includes('enhance') ||
        r.includes('SEO') || r.includes('readability') || r.includes('E-E-A-T')
      )).toBe(true);
    });

    it('should handle content with mixed quality elements', async () => {
      const content = `
        # Excellent Professional Heading

        This paragraph demonstrates high-quality writing with proper grammar,
        clear structure, and professional tone. It provides valuable insights
        based on extensive research and practical experience.

        but then this paragraph has poor grammar no punctuation and uses
        generic phrases like cutting-edge technology and comprehensive solutions
        furthermore it is important to note that this is problematic
      `;

      const result = await scorer.calculateOverallQuality(content);

      expect(result.overallScore).toBeGreaterThan(60);
      expect(result.overallScore).toBeLessThan(85);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
