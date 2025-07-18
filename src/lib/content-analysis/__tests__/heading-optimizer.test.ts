import { HeadingOptimizer, HeadingCounts, KeywordHeadingCounts } from '../heading-optimizer';

describe('HeadingOptimizer', () => {
  let optimizer: HeadingOptimizer;

  beforeEach(() => {
    optimizer = new HeadingOptimizer();
  });

  describe('countHeadings', () => {
    it('should count HTML headings correctly', () => {
      const content = `
        <h1>Main Title</h1>
        <h2>Section Title</h2>
        <h3>Subsection</h3>
        <h2>Another Section</h2>
      `;
      
      const counts = optimizer.countHeadings(content);
      
      expect(counts.h1).toBe(1);
      expect(counts.h2).toBe(2);
      expect(counts.h3).toBe(1);
      expect(counts.h4).toBe(0);
    });

    it('should count Markdown headings correctly', () => {
      const content = `
        # Main Title
        ## Section Title
        ### Subsection
        ## Another Section
        #### Deep Section
      `;
      
      const counts = optimizer.countHeadings(content);
      
      expect(counts.h1).toBe(1);
      expect(counts.h2).toBe(2);
      expect(counts.h3).toBe(1);
      expect(counts.h4).toBe(1);
    });

    it('should count mixed HTML and Markdown headings', () => {
      const content = `
        # Markdown H1
        <h2>HTML H2</h2>
        ## Markdown H2
        <h3>HTML H3</h3>
      `;
      
      const counts = optimizer.countHeadings(content);
      
      expect(counts.h1).toBe(1);
      expect(counts.h2).toBe(2);
      expect(counts.h3).toBe(1);
    });
  });

  describe('countKeywordHeadings', () => {
    it('should count headings containing keywords', () => {
      const content = `
        # SEO Optimization Guide
        ## Content SEO Strategies
        ### Link Building
        ## SEO Tools Review
      `;
      const keyword = 'SEO';
      
      const counts = optimizer.countKeywordHeadings(content, keyword);
      
      expect(counts.h1).toBe(1);
      expect(counts.h2).toBe(2);
      expect(counts.h3).toBe(0);
    });

    it('should be case insensitive', () => {
      const content = `
        # seo optimization
        ## SEO Strategies
        ### Seo Tools
      `;
      const keyword = 'SEO';
      
      const counts = optimizer.countKeywordHeadings(content, keyword);
      
      expect(counts.h1).toBe(1);
      expect(counts.h2).toBe(1);
      expect(counts.h3).toBe(1);
    });
  });

  describe('extractHeadings', () => {
    it('should extract heading details', () => {
      const content = `
        # Main SEO Title
        ## Section About Optimization
        ### Technical Details
      `;
      
      const headings = optimizer.extractHeadings(content);
      
      expect(headings).toHaveLength(3);
      expect(headings[0].level).toBe(1);
      expect(headings[0].text).toBe('Main SEO Title');
      expect(headings[1].level).toBe(2);
      expect(headings[2].level).toBe(3);
    });

    it('should sort headings by position', () => {
      const content = `
        Content before
        ## Second Heading
        More content
        # First Heading
        Final content
        ### Third Heading
      `;
      
      const headings = optimizer.extractHeadings(content);
      
      expect(headings).toHaveLength(3);
      // Should be sorted by position in document
      expect(headings[0].text).toBe('Second Heading');
      expect(headings[1].text).toBe('First Heading');
      expect(headings[2].text).toBe('Third Heading');
    });
  });

  describe('analyzeCompetitorHeadings', () => {
    it('should analyze competitor heading patterns', () => {
      const competitorContents = [
        `# SEO Guide\n## Keyword Research\n### Tools\n## Content Optimization`,
        `# Digital Marketing\n## SEO Strategies\n## Content Marketing`,
        `# Website Optimization\n## Technical SEO\n### Page Speed\n### Mobile SEO`
      ];
      const keyword = 'SEO';
      
      const analysis = optimizer.analyzeCompetitorHeadings(competitorContents, keyword);
      
      expect(analysis.averageHeadingCounts.h1).toBeGreaterThan(0);
      expect(analysis.averageHeadingCounts.h2).toBeGreaterThan(0);
      expect(analysis.keywordHeadingCounts.h1).toBeGreaterThan(0);
      expect(analysis.keywordIntegrationRate).toBeGreaterThan(0);
    });

    it('should calculate optimal distribution', () => {
      const competitorContents = [
        `# Title\n## Section 1\n## Section 2\n### Subsection`,
        `# Another Title\n## Another Section\n### Sub 1\n### Sub 2`
      ];
      const keyword = 'test';
      
      const analysis = optimizer.analyzeCompetitorHeadings(competitorContents, keyword);
      
      expect(analysis.optimalDistribution.h1).toBeGreaterThan(0);
      expect(analysis.optimalDistribution.h2).toBeGreaterThan(0);
      expect(analysis.optimalDistribution.h3).toBeGreaterThan(0);
    });
  });

  describe('optimizeHeadings', () => {
    it('should optimize heading structure', () => {
      const content = `
        # SEO Guide
        Some content here.
        More content that needs structure.
      `;
      const keyword = 'SEO';
      const targetCounts: HeadingCounts = { h1: 1, h2: 2, h3: 1, h4: 0, h5: 0, h6: 0 };
      const targetKeywordCounts: KeywordHeadingCounts = { h1: 1, h2: 1, h3: 0, h4: 0, h5: 0, h6: 0 };
      
      const result = optimizer.optimizeHeadings(content, keyword, targetCounts, targetKeywordCounts);
      
      expect(result.headingsOptimized).toBeGreaterThan(0);
      expect(result.structureScore).toBeGreaterThan(0);
      expect(result.seoScore).toBeGreaterThan(0);
    });

    it('should integrate keywords into headings', () => {
      const content = `
        # Guide to Optimization
        ## Content Strategies
        ### Technical Implementation
      `;
      const keyword = 'SEO';
      const targetCounts: HeadingCounts = { h1: 1, h2: 2, h3: 1, h4: 0, h5: 0, h6: 0 };
      const targetKeywordCounts: KeywordHeadingCounts = { h1: 1, h2: 2, h3: 1, h4: 0, h5: 0, h6: 0 };
      
      const result = optimizer.optimizeHeadings(content, keyword, targetCounts, targetKeywordCounts);
      
      expect(result.optimizedContent).toContain('SEO');
      expect(result.keywordIntegration).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const counts = optimizer.countHeadings('');
      
      expect(counts.h1).toBe(0);
      expect(counts.h2).toBe(0);
      expect(counts.h3).toBe(0);
    });

    it('should handle content without headings', () => {
      const content = 'This is just regular content without any headings.';
      
      const counts = optimizer.countHeadings(content);
      const headings = optimizer.extractHeadings(content);
      
      expect(counts.h1).toBe(0);
      expect(headings).toHaveLength(0);
    });

    it('should handle malformed HTML headings', () => {
      const content = `
        <h1>Valid heading</h1>
        <h2>Unclosed heading
        <h3></h3>
        <h4>Another valid</h4>
      `;
      
      const counts = optimizer.countHeadings(content);
      
      expect(counts.h1).toBe(1);
      expect(counts.h4).toBe(1);
    });

    it('should handle very long heading text', () => {
      const longHeading = 'A'.repeat(200);
      const content = `# ${longHeading}`;
      
      const headings = optimizer.extractHeadings(content);
      
      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe(longHeading);
    });
  });

  describe('heading quality metrics', () => {
    it('should calculate readability scores', () => {
      const content = `
        # Clear and Concise SEO Title
        ## Well Structured Section About Optimization
        ### Technical Implementation Details
      `;
      
      const headings = optimizer.extractHeadings(content);
      
      headings.forEach(heading => {
        expect(heading.readabilityScore).toBeGreaterThanOrEqual(0);
        expect(heading.readabilityScore).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate semantic relevance', () => {
      const content = `
        # SEO Optimization Guide
        ## Keyword Research Methods
        ### Content Analysis Tools
      `;
      
      const headings = optimizer.extractHeadings(content);
      
      headings.forEach(heading => {
        expect(heading.semanticRelevance).toBeGreaterThanOrEqual(0);
        expect(heading.semanticRelevance).toBeLessThanOrEqual(1);
      });
    });
  });
});