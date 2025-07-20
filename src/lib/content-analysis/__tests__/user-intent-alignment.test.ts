import { UserIntentAlignmentSystem, SearchIntent } from '../user-intent-alignment';

describe('UserIntentAlignmentSystem', () => {
  let system: UserIntentAlignmentSystem;

  beforeEach(() => {
    system = new UserIntentAlignmentSystem();
  });

  describe('classifySearchIntent', () => {
    it('should classify informational intent', () => {
      const query = 'how to optimize SEO for better rankings';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('informational');
      expect(intent.confidence).toBeGreaterThan(0);
      expect(intent.indicators).toContain('how');
    });

    it('should classify navigational intent', () => {
      const query = 'Google Search Console login page';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('navigational');
      expect(intent.confidence).toBeGreaterThan(0);
      expect(intent.indicators).toContain('login');
    });

    it('should classify transactional intent', () => {
      const query = 'buy SEO tools online now';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('transactional');
      expect(intent.confidence).toBeGreaterThan(0);
      expect(intent.indicators).toContain('buy');
    });

    it('should classify commercial intent', () => {
      const query = 'best SEO tools comparison review';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('commercial');
      expect(intent.confidence).toBeGreaterThan(0);
      expect(intent.indicators).toContain('best');
    });

    it('should determine urgency level', () => {
      const urgentQuery = 'urgent SEO fix needed now';
      const casualQuery = 'SEO tips for beginners';
      
      const urgentIntent = system.classifySearchIntent(urgentQuery);
      const casualIntent = system.classifySearchIntent(casualQuery);
      
      expect(urgentIntent.urgency).toBe('high');
      expect(casualIntent.urgency).toBe('low');
    });
  });

  describe('analyzeUserBehaviorPatterns', () => {
    it('should analyze user behavior from search queries', () => {
      const queries = [
        'how to improve SEO rankings',
        'best SEO tools 2024',
        'buy premium SEO software'
      ];
      const contentSamples = [
        'Guide to SEO improvement techniques',
        'Review of top SEO tools',
        'Premium SEO software features'
      ];
      
      const patterns = system.analyzeUserBehaviorPatterns(queries, contentSamples);
      
      expect(patterns).toHaveLength(3);
      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('searchQuery');
        expect(pattern).toHaveProperty('expectedContentType');
        expect(pattern).toHaveProperty('satisfactionIndicators');
        expect(pattern).toHaveProperty('bounceRiskFactors');
        expect(pattern).toHaveProperty('engagementTriggers');
      });
    });
  });

  describe('calculateIntentSatisfactionScore', () => {
    it('should calculate satisfaction score for informational content', () => {
      const content = `
        How to Optimize SEO Rankings
        
        SEO optimization involves several key steps:
        1. Keyword research
        2. Content optimization
        3. Technical improvements
        
        For example, keyword research helps identify target terms.
      `;
      const targetIntent: SearchIntent = {
        type: 'informational',
        confidence: 0.9,
        indicators: ['how', 'optimize'],
        urgency: 'medium'
      };
      
      const score = system.calculateIntentSatisfactionScore(content, targetIntent);
      
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.informationalScore).toBeGreaterThan(0);
      expect(score.contentGaps).toBeDefined();
      expect(score.recommendations).toBeDefined();
    });

    it('should calculate satisfaction score for transactional content', () => {
      const content = `
        Buy Premium SEO Tools
        
        Our SEO software includes:
        - Keyword tracking
        - Competitor analysis
        - Pricing: $99/month
        
        Order now and get started today!
      `;
      const targetIntent: SearchIntent = {
        type: 'transactional',
        confidence: 0.8,
        indicators: ['buy', 'premium'],
        urgency: 'high'
      };
      
      const score = system.calculateIntentSatisfactionScore(content, targetIntent);
      
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.transactionalScore).toBeGreaterThan(0);
    });
  });

  describe('alignContentWithIntent', () => {
    it('should align content with informational intent', () => {
      const content = 'SEO strategies are important for website success.';
      const targetIntent: SearchIntent = {
        type: 'informational',
        confidence: 0.8,
        indicators: ['how', 'guide'],
        subtype: 'how-to',
        urgency: 'medium'
      };
      
      const result = system.alignContentWithIntent(content, targetIntent);
      
      expect(result.optimizedContent).toContain('how to');
      expect(result.modificationsApplied).toBeGreaterThan(0);
      expect(result.alignmentScore).toBeGreaterThan(0);
    });

    it('should align content with navigational intent', () => {
      const content = 'Information about our SEO services.';
      const targetIntent: SearchIntent = {
        type: 'navigational',
        confidence: 0.7,
        indicators: ['page', 'access'],
        urgency: 'medium'
      };
      
      const result = system.alignContentWithIntent(content, targetIntent);
      
      expect(result.optimizedContent.toLowerCase()).toContain('navigate');
      expect(result.modificationsApplied).toBeGreaterThan(0);
    });

    it('should align content with transactional intent', () => {
      const content = 'Our SEO tools help improve rankings.';
      const targetIntent: SearchIntent = {
        type: 'transactional',
        confidence: 0.9,
        indicators: ['buy', 'purchase'],
        urgency: 'high'
      };
      
      const result = system.alignContentWithIntent(content, targetIntent);
      
      expect(result.optimizedContent).toContain('purchase');
      expect(result.modificationsApplied).toBeGreaterThan(0);
    });

    it('should align content with commercial intent', () => {
      const content = 'SEO tools comparison and analysis.';
      const targetIntent: SearchIntent = {
        type: 'commercial',
        confidence: 0.8,
        indicators: ['compare', 'best'],
        urgency: 'medium'
      };
      
      const result = system.alignContentWithIntent(content, targetIntent);
      
      expect(result.optimizedContent.toLowerCase()).toContain('compare');
      expect(result.modificationsApplied).toBeGreaterThan(0);
    });
  });

  describe('analyzeCompetitorIntentStrategy', () => {
    it('should analyze competitor intent strategies', () => {
      const competitorContents = [
        'How to improve SEO rankings with proven strategies',
        'Best SEO tools comparison and reviews',
        'Buy premium SEO software with advanced features'
      ];
      const searchQueries = [
        'how to improve SEO',
        'best SEO tools',
        'buy SEO software'
      ];
      
      const analysis = system.analyzeCompetitorIntentStrategy(competitorContents, searchQueries);
      
      expect(analysis).toHaveProperty('dominantIntent');
      expect(analysis).toHaveProperty('intentDistribution');
      expect(analysis).toHaveProperty('satisfactionFactors');
      expect(analysis).toHaveProperty('contentStrategies');
      expect(analysis).toHaveProperty('userBehaviorPatterns');
      
      expect(analysis.dominantIntent.type).toBeDefined();
      expect(analysis.intentDistribution.informational).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const intent = system.classifySearchIntent('');
      
      expect(intent.type).toBeDefined();
      expect(intent.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle ambiguous queries', () => {
      const query = 'SEO';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBeDefined();
      expect(intent.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long queries', () => {
      const longQuery = 'how to optimize SEO for better search engine rankings '.repeat(10);
      
      const intent = system.classifySearchIntent(longQuery);
      
      expect(intent.type).toBe('informational');
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it('should handle mixed intent signals', () => {
      const query = 'how to buy the best SEO tools guide';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBeDefined();
      expect(intent.confidence).toBeGreaterThan(0);
    });
  });

  describe('intent subtypes', () => {
    it('should identify how-to subtype for informational intent', () => {
      const query = 'how to optimize website for search engines';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('informational');
      expect(intent.subtype).toBe('how-to');
    });

    it('should identify definition subtype for informational intent', () => {
      const query = 'what is search engine optimization';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('informational');
      expect(intent.subtype).toBe('definition');
    });

    it('should identify comparison subtype for commercial intent', () => {
      const query = 'SEMrush vs Ahrefs comparison';
      
      const intent = system.classifySearchIntent(query);
      
      expect(intent.type).toBe('commercial');
      expect(intent.subtype).toBe('comparison');
    });
  });

  describe('satisfaction factors', () => {
    it('should identify satisfaction indicators', () => {
      const query = 'how to improve SEO';
      const content = 'Step-by-step guide with examples and actionable advice.';
      
      const patterns = system.analyzeUserBehaviorPatterns([query], [content]);
      
      expect(patterns[0].satisfactionIndicators.length).toBeGreaterThan(0);
    });

    it('should identify bounce risk factors', () => {
      const query = 'comprehensive SEO guide';
      const content = 'Short content.';
      
      const patterns = system.analyzeUserBehaviorPatterns([query], [content]);
      
      expect(patterns[0].bounceRiskFactors).toContain('Content too short');
    });

    it('should identify engagement triggers', () => {
      const query = 'SEO tools';
      const content = 'Try our interactive SEO tools now and see your results.';
      
      const patterns = system.analyzeUserBehaviorPatterns([query], [content]);
      
      expect(patterns[0].engagementTriggers.length).toBeGreaterThan(0);
    });
  });
});