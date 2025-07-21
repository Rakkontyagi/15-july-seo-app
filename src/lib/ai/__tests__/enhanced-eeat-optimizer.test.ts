import { EeatOptimizer, EeatOptimizationResult, EeatContext } from '../eeat-optimizer';

describe('Enhanced EeatOptimizer', () => {
  let optimizer: EeatOptimizer;

  beforeEach(() => {
    optimizer = new EeatOptimizer();
    jest.clearAllMocks();
  });

  describe('optimize', () => {
    it('should optimize content with strong E-E-A-T signals', async () => {
      const content = `
        I've been working in digital marketing for over 15 years, and I can tell you
        from experience that SEO has evolved dramatically. Research shows that content
        quality is now the primary ranking factor according to Google's documentation.
        
        Based on my work with over 500 clients, I've seen firsthand how these strategies
        deliver results. The data from our recent study of 10,000 websites confirms
        this trend with statistical significance.
      `;

      const context: EeatContext = {
        industry: 'digital marketing',
        keyword: 'SEO strategies',
        authorCredentials: 'Certified Digital Marketing Professional with 15+ years experience',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.eeatScore).toBeGreaterThan(45);
      expect(result.experienceScore).toBeGreaterThan(45);
      expect(result.expertiseScore).toBeGreaterThan(50);
      expect(result.authoritativenessScore).toBeGreaterThan(30);
      expect(result.trustworthinessScore).toBeGreaterThanOrEqual(50);
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    it('should identify and improve low E-E-A-T content', async () => {
      const content = `
        SEO is important for websites. You should do SEO to get better rankings.
        There are many SEO techniques that can help improve your website performance.
        SEO optimization is a good strategy for online success.
      `;

      const context: EeatContext = {
        industry: 'SEO',
        keyword: 'SEO optimization',
        contentType: 'guide'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.eeatScore).toBeLessThan(70);
      expect(result.improvementAreas.length).toBeGreaterThan(2);
      expect(result.eeatRecommendations.length).toBeGreaterThan(3);
      expect(result.eeatIssues.length).toBeGreaterThan(2);
    });

    it('should enhance experience indicators', async () => {
      const content = `
        Digital marketing strategies are important for business success.
        Companies should implement various marketing techniques to reach customers.
        Online marketing provides many opportunities for growth.
      `;

      const context: EeatContext = {
        industry: 'digital marketing',
        keyword: 'marketing strategies',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.improvementAreas).toContain('experience');
      expect(result.eeatRecommendations.some(r => r.includes('experience'))).toBe(true);
      expect(result.experienceScore).toBeLessThan(70);
    });

    it('should enhance expertise indicators', async () => {
      const content = `
        Technology is advancing rapidly in today's world. Companies are using
        new tools and methods to improve their operations. Innovation is key
        to staying competitive in the modern marketplace.
      `;

      const context: EeatContext = {
        industry: 'technology',
        keyword: 'technology innovation',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.improvementAreas).toContain('expertise');
      expect(result.eeatRecommendations.some(r => r.includes('technical depth'))).toBe(true);
      expect(result.expertiseScore).toBeLessThan(70);
    });

    it('should enhance authoritativeness signals', async () => {
      const content = `
        Marketing is effective for businesses. Many companies use marketing
        to promote their products and services. Marketing helps increase sales
        and customer awareness of brands.
      `;

      const context: EeatContext = {
        industry: 'marketing',
        keyword: 'marketing effectiveness',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.improvementAreas).toContain('authoritativeness');
      expect(result.eeatRecommendations.some(r => r.includes('credentials'))).toBe(true);
      expect(result.authoritativenessScore).toBeLessThan(60);
    });

    it('should enhance trustworthiness signals', async () => {
      const content = `
        This product is the best solution available. It will solve all your problems
        and provide amazing results. Everyone should use this product for success.
        It's guaranteed to work perfectly every time.
      `;

      const context: EeatContext = {
        industry: 'product review',
        keyword: 'product evaluation',
        contentType: 'review'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.improvementAreas).toContain('trustworthiness');
      expect(result.eeatRecommendations.some(r => r.includes('transparency'))).toBe(true);
      expect(result.trustworthinessScore).toBeLessThan(70);
    });

    it('should handle content with author credentials', async () => {
      const content = `
        Based on my research in computational linguistics, I can explain how
        natural language processing algorithms work. The peer-reviewed studies
        I've published demonstrate the effectiveness of these approaches.
      `;

      const context: EeatContext = {
        industry: 'artificial intelligence',
        keyword: 'natural language processing',
        authorCredentials: 'PhD in Computer Science, Published AI Researcher',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.authoritativenessScore).toBeGreaterThan(40);
      expect(result.expertiseScore).toBeGreaterThanOrEqual(45);
      expect(result.eeatScore).toBeGreaterThanOrEqual(45);
    });

    it('should handle empty content', async () => {
      const context: EeatContext = {
        industry: 'test',
        keyword: 'test',
        contentType: 'article'
      };

      await expect(optimizer.optimize('', context)).rejects.toThrow('Content must be a non-empty string');
    });

    it('should handle null content', async () => {
      const context: EeatContext = {
        industry: 'test',
        keyword: 'test',
        contentType: 'article'
      };

      await expect(optimizer.optimize(null as any, context)).rejects.toThrow('Content must be a non-empty string');
    });
  });

  describe('analyzeEEAT', () => {
    it('should analyze high-quality E-E-A-T content', async () => {
      const content = `
        In my 20 years of experience as a certified financial advisor, I've seen
        firsthand how market volatility affects investment portfolios. Research shows
        that diversified portfolios outperform concentrated ones by 15% annually.
        
        According to peer-reviewed studies published in the Journal of Finance,
        the data reveals consistent patterns across different market conditions.
        This analysis is based on transparent methodology and verified data sources.
      `;

      const context: EeatContext = {
        industry: 'finance',
        keyword: 'investment strategies',
        authorCredentials: 'Certified Financial Advisor, 20+ years experience',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.overallScore).toBeGreaterThan(45);
      expect(result.experience.score).toBeGreaterThan(45);
      expect(result.expertise.score).toBeGreaterThan(50);
      expect(result.authoritativeness.score).toBeGreaterThan(40);
      expect(result.trustworthiness.score).toBeGreaterThan(50);
    });

    it('should identify missing E-E-A-T elements', async () => {
      const content = `
        Investing is important for financial growth. People should invest money
        to build wealth over time. There are different investment options available
        for various risk tolerance levels.
      `;

      const context: EeatContext = {
        industry: 'finance',
        keyword: 'investing',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.experience.missingElements.length).toBeGreaterThan(0);
      expect(result.expertise.missingElements.length).toBeGreaterThan(0);
      expect(result.authoritativeness.missingElements.length).toBeGreaterThan(0);
      expect(result.trustworthiness.missingElements.length).toBeGreaterThan(0);
    });

    it('should provide specific improvement suggestions', async () => {
      const content = `
        Technology trends are changing rapidly. Companies need to adapt to new
        developments in the tech industry. Innovation drives business success.
      `;

      const context: EeatContext = {
        industry: 'technology',
        keyword: 'tech trends',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.experience.suggestions.length).toBeGreaterThan(0);
      expect(result.expertise.suggestions.length).toBeGreaterThan(0);
      expect(result.authoritativeness.suggestions.length).toBeGreaterThan(0);
      expect(result.trustworthiness.suggestions.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(2);
    });
  });

  describe('component analysis', () => {
    it('should detect experience indicators accurately', async () => {
      const content = `
        In my experience working with machine learning models, I've found that
        data quality is crucial. Having worked with over 100 different datasets,
        I can tell you from practical application that preprocessing makes a
        significant difference in model performance.
      `;

      const context: EeatContext = {
        industry: 'machine learning',
        keyword: 'data science',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.experience.indicators.length).toBeGreaterThan(2);
      expect(result.experience.indicators).toContain('in my experience');
      expect(result.experience.indicators).toContain('having worked with');
      expect(result.experience.indicators).toContain('practical application');
      expect(result.experience.score).toBeGreaterThan(70);
    });

    it('should detect expertise indicators accurately', async () => {
      const content = `
        Research shows that neural networks perform better with normalized data.
        Studies indicate that batch normalization reduces training time by 40%.
        According to peer-reviewed research, these findings are statistically significant.
        The scientific evidence supports these conclusions across multiple experiments.
      `;

      const context: EeatContext = {
        industry: 'artificial intelligence',
        keyword: 'neural networks',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.expertise.indicators.length).toBeGreaterThan(2);
      expect(result.expertise.indicators).toContain('research shows');
      expect(result.expertise.indicators).toContain('studies indicate');
      expect(result.expertise.indicators).toContain('peer-reviewed research');
      expect(result.expertise.score).toBeGreaterThan(70);
    });

    it('should detect authoritativeness indicators accurately', async () => {
      const content = `
        As a published researcher in computational biology, I've been featured in
        Nature and Science journals. My peer-reviewed work has been referenced by
        leading institutions and endorsed by the International Biology Association.
      `;

      const context: EeatContext = {
        industry: 'biology',
        keyword: 'computational biology',
        authorCredentials: 'PhD in Biology, Published Researcher',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.authoritativeness.indicators.length).toBeGreaterThan(2);
      expect(result.authoritativeness.indicators).toContain('published research');
      expect(result.authoritativeness.indicators).toContain('peer-reviewed');
      expect(result.authoritativeness.indicators).toContain('featured in');
      expect(result.authoritativeness.score).toBeGreaterThan(80);
    });

    it('should detect trustworthiness indicators accurately', async () => {
      const content = `
        This analysis is based on transparent methodology and verified data.
        All sources are fact-checked and updated regularly for accuracy.
        I provide honest assessment of both advantages and limitations.
        Contact information and privacy policy are available on our website.
      `;

      const context: EeatContext = {
        industry: 'research',
        keyword: 'data analysis',
        contentType: 'article'
      };

      const result = await optimizer.analyzeEEAT(content, context);

      expect(result.trustworthiness.indicators.length).toBeGreaterThan(3);
      expect(result.trustworthiness.indicators.some(i => i.includes('transparent') || i.includes('honest'))).toBe(true);
      expect(result.trustworthiness.indicators).toContain('verified data');
      expect(result.trustworthiness.indicators).toContain('fact-checked');
      expect(result.trustworthiness.score).toBeGreaterThan(80);
    });
  });

  describe('performance and reliability', () => {
    it('should complete optimization within reasonable time', async () => {
      const content = 'This is a test sentence for performance evaluation. '.repeat(200);
      const context: EeatContext = {
        industry: 'test',
        keyword: 'performance',
        contentType: 'article'
      };

      const startTime = Date.now();
      await optimizer.optimize(content, context);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should be consistent across multiple runs', async () => {
      const content = `
        Based on my experience in software development, I can provide insights
        into best practices. Research shows that code quality impacts performance.
      `;

      const context: EeatContext = {
        industry: 'software development',
        keyword: 'coding practices',
        contentType: 'article'
      };

      const result1 = await optimizer.optimize(content, context);
      const result2 = await optimizer.optimize(content, context);

      expect(Math.abs(result1.eeatScore - result2.eeatScore)).toBeLessThan(3);
      expect(result1.improvementAreas.length).toBe(result2.improvementAreas.length);
    });

    it('should handle concurrent optimization requests', async () => {
      const content = 'This is test content for concurrent E-E-A-T optimization.';
      const context: EeatContext = {
        industry: 'test',
        keyword: 'concurrent',
        contentType: 'article'
      };
      
      const promises = Array(5).fill(null).map(() => 
        optimizer.optimize(content, context)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.eeatScore).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very short content', async () => {
      const content = 'Short text.';
      const context: EeatContext = {
        industry: 'test',
        keyword: 'short',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.eeatScore).toBeGreaterThan(0);
      expect(result.improvementAreas.length).toBeGreaterThan(0);
    });

    it('should handle content with special characters', async () => {
      const content = `
        I've been working with AI/ML for 10+ years. The résumé shows my
        expertise in NLP & computer vision. My research (published in 2023)
        demonstrates 95% accuracy improvements.
      `;

      const context: EeatContext = {
        industry: 'artificial intelligence',
        keyword: 'AI research',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.eeatScore).toBeGreaterThan(0);
      expect(result.experienceScore).toBeGreaterThan(35);
    });

    it('should handle different content types appropriately', async () => {
      const reviewContent = `
        I've tested this product for 6 months. Based on my experience,
        it performs well but has some limitations. Honest assessment
        shows both pros and cons.
      `;

      const context: EeatContext = {
        industry: 'product testing',
        keyword: 'product review',
        contentType: 'review'
      };

      const result = await optimizer.optimize(reviewContent, context);

      expect(result.trustworthinessScore).toBeGreaterThan(55);
      expect(result.experienceScore).toBeGreaterThan(35);
    });

    it('should provide meaningful improvement recommendations', async () => {
      const content = `
        This topic is important. Many people are interested in this subject.
        There are various aspects to consider when discussing this matter.
      `;

      const context: EeatContext = {
        industry: 'general',
        keyword: 'topic discussion',
        contentType: 'article'
      };

      const result = await optimizer.optimize(content, context);

      expect(result.eeatRecommendations.length).toBeGreaterThan(3);
      expect(result.eeatIssues.length).toBeGreaterThan(2);
      expect(result.improvementAreas.length).toBe(4); // All four E-E-A-T components
    });
  });
});
