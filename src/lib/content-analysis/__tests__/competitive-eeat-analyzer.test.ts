/**
 * Comprehensive tests for Competitive E-E-A-T Analyzer
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 */

import { CompetitiveEEATAnalyzer, CompetitiveAnalysis } from '../competitive-eeat-analyzer';

describe('CompetitiveEEATAnalyzer', () => {
  let analyzer: CompetitiveEEATAnalyzer;

  beforeEach(() => {
    analyzer = new CompetitiveEEATAnalyzer();
  });

  describe('Constructor', () => {
    it('should initialize with required components', () => {
      expect(analyzer).toBeInstanceOf(CompetitiveEEATAnalyzer);
    });
  });

  describe('analyzeCompetitive', () => {
    it('should perform comprehensive competitive analysis', async () => {
      const yourContent = `In my 10 years of experience, technical SEO requires specialized knowledge. 
        Research shows that systematic approaches work best.`;
      
      const competitors = [
        {
          content: `As a certified expert with 15 years of experience, according to industry studies, 
            advanced SEO techniques require deep technical expertise and authoritative sources.`,
          domain: 'competitor1.com',
          url: 'https://competitor1.com/article'
        },
        {
          content: `Basic SEO tips for beginners. Keywords are important for rankings.`,
          domain: 'competitor2.com'
        }
      ];
      
      const result = await analyzer.analyzeCompetitive(yourContent, competitors, 'seo');
      
      expect(result).toBeDefined();
      expect(result.yourContent).toBeDefined();
      expect(result.competitors).toHaveLength(2);
      expect(result.benchmarks).toBeDefined();
      expect(result.gapAnalysis).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.marketPosition).toBeDefined();
    });

    it('should analyze your content correctly', async () => {
      const content = 'Expert content with technical depth and authority signals.';
      const result = await analyzer.analyzeCompetitive(content, [], 'technology');
      
      expect(result.yourContent.title).toBe('Your Content');
      expect(result.yourContent.eeatScore).toBeDefined();
      expect(typeof result.yourContent.trustScore).toBe('number');
      expect(typeof result.yourContent.contentLength).toBe('number');
      expect(typeof result.yourContent.readabilityScore).toBe('number');
      expect(typeof result.yourContent.technicalDepth).toBe('number');
      expect(typeof result.yourContent.authoritySignals).toBe('number');
    });

    it('should analyze competitor content with additional metrics', async () => {
      const yourContent = 'Your content for comparison.';
      const competitors = [
        {
          content: 'Competitor content with expertise and authority.',
          domain: 'example.com',
          url: 'https://example.com/article'
        }
      ];
      
      const result = await analyzer.analyzeCompetitive(yourContent, competitors);
      
      const competitor = result.competitors[0];
      expect(competitor.domain).toBe('example.com');
      expect(competitor.url).toBe('https://example.com/article');
      expect(typeof competitor.domainAuthority).toBe('number');
      expect(typeof competitor.backlinks).toBe('number');
      expect(typeof competitor.socialShares).toBe('number');
      expect(typeof competitor.estimatedTraffic).toBe('number');
      expect(typeof competitor.contentQualityScore).toBe('number');
      expect(Array.isArray(competitor.strengthAreas)).toBe(true);
      expect(Array.isArray(competitor.weaknessAreas)).toBe(true);
    });

    it('should provide industry benchmarks', async () => {
      const result = await analyzer.analyzeCompetitive('Test content', [], 'finance');
      
      expect(result.benchmarks.averageEEATScore).toBeGreaterThan(0);
      expect(result.benchmarks.topPerformerScore).toBeGreaterThan(result.benchmarks.averageEEATScore);
      expect(result.benchmarks.industryStandards.experience).toBeGreaterThan(0);
      expect(result.benchmarks.industryStandards.expertise).toBeGreaterThan(0);
      expect(result.benchmarks.industryStandards.authoritativeness).toBeGreaterThan(0);
      expect(result.benchmarks.industryStandards.trustworthiness).toBeGreaterThan(0);
      expect(result.benchmarks.contentLengthBenchmark).toBeGreaterThan(0);
      expect(result.benchmarks.authoritySignalsBenchmark).toBeGreaterThan(0);
    });

    it('should perform gap analysis', async () => {
      const weakContent = 'Basic content without expertise.';
      const strongCompetitor = {
        content: `As a certified expert with 20 years of experience, according to peer-reviewed 
          research, specialized technical knowledge and authoritative sources are essential. 
          In full transparency, evidence suggests systematic approaches work best.`,
        domain: 'authority-site.com'
      };
      
      const result = await analyzer.analyzeCompetitive(weakContent, [strongCompetitor]);
      
      expect(result.gapAnalysis.experienceGap).toBeGreaterThanOrEqual(0);
      expect(result.gapAnalysis.expertiseGap).toBeGreaterThanOrEqual(0);
      expect(result.gapAnalysis.authoritativenessGap).toBeGreaterThanOrEqual(0);
      expect(result.gapAnalysis.trustworthinessGap).toBeGreaterThanOrEqual(0);
      expect(result.gapAnalysis.overallGap).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.gapAnalysis.priorityAreas)).toBe(true);
      
      result.gapAnalysis.priorityAreas.forEach(area => {
        expect(['experience', 'expertise', 'authoritativeness', 'trustworthiness']).toContain(area.area);
        expect(typeof area.gap).toBe('number');
        expect(['high', 'medium', 'low']).toContain(area.impact);
        expect(['easy', 'medium', 'hard']).toContain(area.difficulty);
      });
    });

    it('should generate competitive recommendations', async () => {
      const yourContent = 'Content needing improvement.';
      const competitors = [
        {
          content: 'Superior competitor content with expertise and authority.',
          domain: 'top-competitor.com'
        }
      ];
      
      const result = await analyzer.analyzeCompetitive(yourContent, competitors);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(['content', 'authority', 'technical', 'trust']).toContain(rec.category);
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority);
        expect(typeof rec.action).toBe('string');
        expect(typeof rec.competitorExample).toBe('string');
        expect(typeof rec.expectedImpact).toBe('number');
        expect(typeof rec.timeToImplement).toBe('string');
        expect(Array.isArray(rec.resources)).toBe(true);
      });
    });

    it('should determine market position', async () => {
      const yourContent = 'Average quality content.';
      const competitors = [
        { content: 'High quality expert content.', domain: 'leader.com' },
        { content: 'Low quality basic content.', domain: 'follower.com' },
        { content: 'Medium quality content.', domain: 'challenger.com' }
      ];
      
      const result = await analyzer.analyzeCompetitive(yourContent, competitors);
      
      expect(typeof result.marketPosition.rank).toBe('number');
      expect(result.marketPosition.rank).toBeGreaterThan(0);
      expect(result.marketPosition.rank).toBeLessThanOrEqual(4);
      expect(result.marketPosition.totalCompetitors).toBe(4);
      expect(typeof result.marketPosition.percentile).toBe('number');
      expect(['leader', 'challenger', 'follower', 'niche']).toContain(result.marketPosition.category);
      expect(Array.isArray(result.marketPosition.strengthAreas)).toBe(true);
      expect(Array.isArray(result.marketPosition.improvementAreas)).toBe(true);
    });
  });

  describe('Industry-Specific Analysis', () => {
    it('should handle SEO industry benchmarks', async () => {
      const result = await analyzer.analyzeCompetitive('SEO content', [], 'seo');
      
      expect(result.benchmarks.averageEEATScore).toBe(72);
      expect(result.benchmarks.topPerformerScore).toBe(89);
      expect(result.benchmarks.contentLengthBenchmark).toBe(2500);
    });

    it('should handle technology industry benchmarks', async () => {
      const result = await analyzer.analyzeCompetitive('Tech content', [], 'technology');
      
      expect(result.benchmarks.averageEEATScore).toBe(76);
      expect(result.benchmarks.topPerformerScore).toBe(92);
      expect(result.benchmarks.contentLengthBenchmark).toBe(3200);
    });

    it('should handle healthcare industry benchmarks', async () => {
      const result = await analyzer.analyzeCompetitive('Healthcare content', [], 'healthcare');
      
      expect(result.benchmarks.averageEEATScore).toBe(84);
      expect(result.benchmarks.topPerformerScore).toBe(96);
      expect(result.benchmarks.industryStandards.trustworthiness).toBe(95);
    });

    it('should default to SEO benchmarks for unknown industries', async () => {
      const result = await analyzer.analyzeCompetitive('Content', [], 'unknown-industry');
      
      expect(result.benchmarks.averageEEATScore).toBe(72); // SEO default
    });
  });

  describe('Content Quality Metrics', () => {
    it('should calculate readability scores', async () => {
      const simpleContent = 'Simple content. Easy to read. Short sentences.';
      const complexContent = `This is a significantly more complex sentence structure that contains 
        multiple clauses, sophisticated vocabulary, and intricate grammatical constructions that 
        may challenge readers with varying levels of educational background and linguistic proficiency.`;
      
      const simpleResult = await analyzer.analyzeCompetitive(simpleContent, []);
      const complexResult = await analyzer.analyzeCompetitive(complexContent, []);
      
      expect(simpleResult.yourContent.readabilityScore).toBeGreaterThan(complexResult.yourContent.readabilityScore);
    });

    it('should calculate technical depth scores', async () => {
      const basicContent = 'Simple content about websites.';
      const technicalContent = `Advanced API optimization requires sophisticated algorithmic 
        implementation of microservices architecture with containerization frameworks.`;
      
      const basicResult = await analyzer.analyzeCompetitive(basicContent, []);
      const technicalResult = await analyzer.analyzeCompetitive(technicalContent, []);
      
      expect(technicalResult.yourContent.technicalDepth).toBeGreaterThan(basicResult.yourContent.technicalDepth);
    });

    it('should identify strength and weakness areas', async () => {
      const strongContent = `In my extensive experience as a certified expert, research consistently 
        demonstrates that according to authoritative sources, evidence suggests transparent 
        methodologies work best.`;
      
      const result = await analyzer.analyzeCompetitive(strongContent, []);
      
      // Should identify some strengths
      expect(result.yourContent.eeatScore.experience).toBeGreaterThan(50);
    });
  });

  describe('Recommendation Quality', () => {
    it('should prioritize recommendations correctly', async () => {
      const poorContent = 'Poor content needing improvement.';
      const excellentCompetitor = {
        content: `Expert content with 20 years experience, authoritative sources, 
          and transparent methodology.`,
        domain: 'expert-site.com'
      };
      
      const result = await analyzer.analyzeCompetitive(poorContent, [excellentCompetitor]);
      
      // Should have high priority recommendations
      const highPriorityRecs = result.recommendations.filter(rec => rec.priority === 'high' || rec.priority === 'critical');
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });

    it('should provide actionable recommendations', async () => {
      const content = 'Content for recommendation testing.';
      const result = await analyzer.analyzeCompetitive(content, []);
      
      result.recommendations.forEach(rec => {
        expect(rec.action.length).toBeGreaterThan(20);
        expect(rec.competitorExample.length).toBeGreaterThan(10);
        expect(rec.expectedImpact).toBeGreaterThan(0);
        expect(rec.timeToImplement).toMatch(/\d+/);
        expect(rec.resources.length).toBeGreaterThan(0);
      });
    });

    it('should sort recommendations by priority', async () => {
      const content = 'Content needing multiple improvements.';
      const result = await analyzer.analyzeCompetitive(content, []);
      
      if (result.recommendations.length > 1) {
        const priorities = result.recommendations.map(rec => rec.priority);
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        for (let i = 1; i < priorities.length; i++) {
          expect(priorityOrder[priorities[i-1] as keyof typeof priorityOrder])
            .toBeGreaterThanOrEqual(priorityOrder[priorities[i] as keyof typeof priorityOrder]);
        }
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple competitors efficiently', async () => {
      const yourContent = 'Your content for performance testing.';
      const competitors = Array(10).fill(null).map((_, i) => ({
        content: `Competitor ${i} content with varying quality levels.`,
        domain: `competitor${i}.com`
      }));
      
      const startTime = Date.now();
      const result = await analyzer.analyzeCompetitive(yourContent, competitors);
      const endTime = Date.now();
      
      expect(result.competitors).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle empty competitor list', async () => {
      const result = await analyzer.analyzeCompetitive('Solo content', []);
      
      expect(result.competitors).toHaveLength(0);
      expect(result.marketPosition.rank).toBe(1);
      expect(result.marketPosition.totalCompetitors).toBe(1);
    });

    it('should handle very long content', async () => {
      const longContent = 'Technical expertise requires specialized knowledge. '.repeat(1000);
      const result = await analyzer.analyzeCompetitive(longContent, []);
      
      expect(result).toBeDefined();
      expect(result.yourContent.contentLength).toBeGreaterThan(5000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle identical content scores', async () => {
      const identicalContent = 'Identical content for testing.';
      const competitors = [
        { content: identicalContent, domain: 'site1.com' },
        { content: identicalContent, domain: 'site2.com' }
      ];
      
      const result = await analyzer.analyzeCompetitive(identicalContent, competitors);
      
      expect(result.marketPosition.rank).toBeGreaterThan(0);
      expect(result.gapAnalysis.overallGap).toBe(0);
    });

    it('should handle empty content', async () => {
      const result = await analyzer.analyzeCompetitive('', []);
      
      expect(result.yourContent.contentLength).toBe(0);
      expect(result.yourContent.eeatScore.overallScore).toBe(0);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Content with special chars: @#$%^&*()!';
      const result = await analyzer.analyzeCompetitive(specialContent, []);
      
      expect(result).toBeDefined();
      expect(typeof result.yourContent.eeatScore.overallScore).toBe('number');
    });
  });

  describe('Market Position Analysis', () => {
    it('should correctly identify market leaders', async () => {
      const excellentContent = `Expert content with 20 years experience, authoritative sources, 
        and comprehensive technical knowledge.`;
      const poorCompetitors = [
        { content: 'Basic content.', domain: 'basic1.com' },
        { content: 'Simple content.', domain: 'basic2.com' }
      ];
      
      const result = await analyzer.analyzeCompetitive(excellentContent, poorCompetitors);
      
      expect(result.marketPosition.rank).toBe(1);
      expect(result.marketPosition.category).toBe('leader');
      expect(result.marketPosition.percentile).toBeGreaterThan(80);
    });

    it('should correctly identify market followers', async () => {
      const poorContent = 'Basic content without expertise.';
      const strongCompetitors = [
        { content: 'Expert content with authority.', domain: 'expert1.com' },
        { content: 'Professional content with experience.', domain: 'expert2.com' }
      ];
      
      const result = await analyzer.analyzeCompetitive(poorContent, strongCompetitors);
      
      expect(result.marketPosition.rank).toBeGreaterThan(1);
      expect(['follower', 'niche']).toContain(result.marketPosition.category);
      expect(result.marketPosition.percentile).toBeLessThan(60);
    });
  });
});
