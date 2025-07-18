import { SEOScoringValidation, OptimizationTarget } from '../seo-scoring-validation';

describe('SEOScoringValidation', () => {
  let validator: SEOScoringValidation;

  beforeEach(() => {
    validator = new SEOScoringValidation();
  });

  describe('validateSEOScore', () => {
    it('should validate SEO score against target', () => {
      const content = `
        # SEO Optimization Guide
        
        Search engine optimization is crucial for website visibility.
        This comprehensive guide covers keyword research, content optimization,
        and technical SEO best practices for better rankings.
        
        ## Keyword Research
        
        Keyword research forms the foundation of SEO strategy.
        
        ## Content Optimization
        
        Content optimization involves improving text quality and relevance.
      `;
      const targetScore = 75;
      
      const isValid = validator.validateSEOScore(content, targetScore);
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should return false for content below target score', () => {
      const poorContent = 'Short content without optimization.';
      const highTarget = 95;
      
      const isValid = validator.validateSEOScore(poorContent, highTarget);
      
      expect(isValid).toBe(false);
    });
  });

  describe('calculateComprehensiveSEOScore', () => {
    it('should calculate comprehensive SEO score', () => {
      const content = `
        # SEO Best Practices Guide
        
        Search engine optimization requires understanding of ranking factors.
        This guide covers keyword research, content optimization, and technical SEO.
        
        ## Keyword Research Methods
        
        Effective keyword research involves analyzing search volume and competition.
        
        ## Content Optimization Strategies
        
        Content should be valuable, relevant, and well-structured for users.
        
        ## Technical SEO Implementation
        
        Technical aspects include site speed, mobile optimization, and crawlability.
      `;
      const keyword = 'SEO';
      
      const score = validator.calculateComprehensiveSEOScore(content, keyword);
      
      expect(score).toHaveProperty('keywordOptimization');
      expect(score).toHaveProperty('contentStructure');
      expect(score).toHaveProperty('readability');
      expect(score).toHaveProperty('technicalSEO');
      expect(score).toHaveProperty('userExperience');
      expect(score).toHaveProperty('competitorAlignment');
      expect(score).toHaveProperty('intentAlignment');
      expect(score).toHaveProperty('overallScore');
      
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
    });

    it('should score keyword optimization accurately', () => {
      const content = 'SEO optimization is important for SEO success and SEO rankings.';
      const keyword = 'SEO';
      
      const score = validator.calculateComprehensiveSEOScore(content, keyword);
      
      expect(score.keywordOptimization).toBeGreaterThan(0);
      expect(score.keywordOptimization).toBeLessThanOrEqual(100);
    });
  });

  describe('performComprehensiveValidation', () => {
    it('should perform comprehensive validation with quality gates', () => {
      const content = `
        # Complete SEO Guide
        
        This comprehensive guide covers all aspects of search engine optimization.
        
        ## Introduction to SEO
        
        Search engine optimization helps websites rank better in search results.
        
        ## Keyword Research
        
        Research involves finding relevant terms your audience searches for.
        
        ## Content Creation
        
        Create valuable content that satisfies user intent and search queries.
        
        ## Technical Optimization
        
        Ensure your website is fast, mobile-friendly, and crawlable.
        
        ## Conclusion
        
        SEO success requires consistent effort and continuous optimization.
      `;
      const keyword = 'SEO';
      const targetScore = 80;
      
      const validation = validator.performComprehensiveValidation(content, keyword, targetScore);
      
      expect(validation).toHaveProperty('validationResult');
      expect(validation).toHaveProperty('qualityGates');
      expect(validation).toHaveProperty('optimizationTargets');
      expect(validation).toHaveProperty('approvalStatus');
      expect(validation).toHaveProperty('revisionsRequired');
      expect(validation).toHaveProperty('performanceMetrics');
      
      expect(validation.qualityGates.length).toBeGreaterThan(0);
      expect(['approved', 'needs_revision', 'rejected']).toContain(validation.approvalStatus);
    });

    it('should identify quality gate failures', () => {
      const poorContent = 'Bad content.';
      const keyword = 'SEO';
      const targetScore = 90;
      
      const validation = validator.performComprehensiveValidation(poorContent, keyword, targetScore);
      
      const failedGates = validation.qualityGates.filter(gate => !gate.passed);
      expect(failedGates.length).toBeGreaterThan(0);
      expect(validation.approvalStatus).not.toBe('approved');
    });
  });

  describe('validatePrecisionTargets', () => {
    it('should validate precision targets', () => {
      const content = 'SEO optimization helps improve SEO rankings and SEO performance.';
      const targets: OptimizationTarget[] = [
        {
          keyword: 'SEO',
          targetDensity: 25.0,
          currentDensity: 25.0,
          lsiCoverage: 0.8,
          entityUsage: 0.7,
          headingOptimization: 0.9,
          intentAlignment: 0.8,
          competitorGap: 0.1
        }
      ];
      
      const isValid = validator.validatePrecisionTargets(content, targets);
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should fail validation when precision threshold exceeded', () => {
      const content = 'Content without target keyword.';
      const targets: OptimizationTarget[] = [
        {
          keyword: 'SEO',
          targetDensity: 10.0,
          currentDensity: 0.0,
          lsiCoverage: 0.5,
          entityUsage: 0.5,
          headingOptimization: 0.5,
          intentAlignment: 0.5,
          competitorGap: 0.5
        }
      ];
      
      const isValid = validator.validatePrecisionTargets(content, targets);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateApprovalGateReport', () => {
    it('should generate comprehensive approval report', () => {
      const content = 'SEO guide with optimization techniques.';
      const validation = validator.performComprehensiveValidation(content, 'SEO', 75);
      
      const report = validator.generateApprovalGateReport(validation);
      
      expect(report).toContain('SEO Scoring Validation Report');
      expect(report).toContain('Approval Status');
      expect(report).toContain('Overall Score');
      expect(report).toContain('Quality Gates');
    });
  });

  describe('scoring components', () => {
    it('should calculate keyword optimization score', () => {
      const content = `
        # SEO Optimization Guide
        SEO strategies help improve search engine rankings.
        This SEO guide covers optimization techniques.
      `;
      const keyword = 'SEO';
      
      const score = validator.calculateComprehensiveSEOScore(content, keyword);
      
      expect(score.keywordOptimization).toBeGreaterThan(0);
    });

    it('should calculate content structure score', () => {
      const content = `
        # Main Title
        Introduction paragraph with relevant content.
        
        ## Section One
        Detailed content about the topic.
        
        ## Section Two
        More detailed information and examples.
        
        Conclusion paragraph summarizing key points.
      `;
      
      const score = validator.calculateComprehensiveSEOScore(content, 'test');
      
      expect(score.contentStructure).toBeGreaterThan(0);
    });

    it('should calculate readability score', () => {
      const content = `
        This content has good readability. Sentences are clear and concise.
        The writing style is appropriate for the target audience.
        Paragraphs are well-structured and easy to follow.
      `;
      
      const score = validator.calculateComprehensiveSEOScore(content, 'test');
      
      expect(score.readability).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const score = validator.calculateComprehensiveSEOScore('', 'test');
      
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle content without keyword', () => {
      const content = 'Content without the target term.';
      const keyword = 'nonexistent';
      
      const score = validator.calculateComprehensiveSEOScore(content, keyword);
      
      expect(score.keywordOptimization).toBe(0);
    });

    it('should handle very long content', () => {
      const longContent = 'SEO optimization content. '.repeat(1000);
      
      const score = validator.calculateComprehensiveSEOScore(longContent, 'SEO');
      
      expect(score.overallScore).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const content = 'SEO-optimization! SEO? SEO... SEO/content.';
      
      const score = validator.calculateComprehensiveSEOScore(content, 'SEO');
      
      expect(score.keywordOptimization).toBeGreaterThan(0);
    });
  });

  describe('quality gates', () => {
    it('should evaluate all quality gates', () => {
      const content = 'Comprehensive SEO content with proper structure and optimization.';
      const validation = validator.performComprehensiveValidation(content, 'SEO', 80);
      
      const expectedGates = [
        'Keyword Optimization',
        'Content Structure',
        'Readability',
        'Technical SEO',
        'User Experience',
        'Competitor Alignment',
        'Intent Alignment'
      ];
      
      expectedGates.forEach(gateName => {
        const gate = validation.qualityGates.find(g => g.name === gateName);
        expect(gate).toBeDefined();
        expect(gate?.currentScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should determine approval status correctly', () => {
      const goodContent = `
        # Excellent SEO Guide
        
        This comprehensive guide provides detailed information about search engine optimization.
        
        ## Keyword Research
        Research helps identify the best terms for your content strategy.
        
        ## Content Optimization
        Optimize your content for both users and search engines.
        
        ## Technical SEO
        Technical aspects ensure your site is crawlable and fast.
      `;
      
      const validation = validator.performComprehensiveValidation(goodContent, 'SEO', 70);
      
      expect(['approved', 'needs_revision']).toContain(validation.approvalStatus);
    });
  });
});