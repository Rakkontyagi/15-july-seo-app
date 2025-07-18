import { ComprehensiveCoverageAssessor } from '../comprehensive-coverage-assessor';

describe('ComprehensiveCoverageAssessor', () => {
  let assessor: ComprehensiveCoverageAssessor;

  beforeEach(() => {
    assessor = new ComprehensiveCoverageAssessor();
  });

  describe('Topic Completeness Assessment', () => {
    it('should assess topic completeness accurately', () => {
      const content = 'This article covers SEO fundamentals, keyword research, and content optimization techniques.';
      const requiredTopics = ['SEO fundamentals', 'keyword research', 'content optimization'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(1.0); // 100% coverage
    });

    it('should handle partial topic coverage', () => {
      const content = 'This article covers SEO fundamentals and keyword research.';
      const requiredTopics = ['SEO fundamentals', 'keyword research', 'content optimization'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBeCloseTo(0.67, 1); // 2 out of 3 topics covered
    });

    it('should achieve >95% comprehensive coverage requirement', () => {
      const content = 'Complete guide covering SEO fundamentals, keyword research, content optimization, technical SEO, and link building strategies.';
      const requiredTopics = ['SEO fundamentals', 'keyword research', 'content optimization', 'technical SEO', 'link building'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBeGreaterThanOrEqual(0.95);
    });

    it('should handle case-insensitive topic matching', () => {
      const content = 'This covers seo FUNDAMENTALS and Keyword Research.';
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(1.0);
    });

    it('should return 0 when no topics are covered', () => {
      const content = 'This article talks about general web development.';
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(0);
    });

    it('should handle empty required topics', () => {
      const content = 'This article covers various SEO topics.';
      const requiredTopics: string[] = [];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(1.0); // 100% of 0 topics = 1.0
    });
  });

  describe('Information Gap Identification', () => {
    it('should identify missing topics correctly', () => {
      const content = 'This article covers SEO fundamentals and keyword research.';
      const requiredTopics = ['SEO fundamentals', 'keyword research', 'content optimization', 'technical SEO'];
      
      const gaps = assessor.identifyInformationGaps(content, requiredTopics);
      
      expect(gaps).toContain('content optimization');
      expect(gaps).toContain('technical SEO');
      expect(gaps).not.toContain('SEO fundamentals');
      expect(gaps).not.toContain('keyword research');
    });

    it('should return empty array when all topics are covered', () => {
      const content = 'Comprehensive guide covering SEO fundamentals, keyword research, and content optimization.';
      const requiredTopics = ['SEO fundamentals', 'keyword research', 'content optimization'];
      
      const gaps = assessor.identifyInformationGaps(content, requiredTopics);
      
      expect(gaps).toEqual([]);
    });

    it('should handle case-insensitive gap detection', () => {
      const content = 'This covers seo FUNDAMENTALS.';
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const gaps = assessor.identifyInformationGaps(content, requiredTopics);
      
      expect(gaps).toContain('keyword research');
      expect(gaps).not.toContain('SEO fundamentals');
    });

    it('should identify all gaps when no topics are covered', () => {
      const content = 'This article talks about general web development.';
      const requiredTopics = ['SEO fundamentals', 'keyword research', 'content optimization'];
      
      const gaps = assessor.identifyInformationGaps(content, requiredTopics);
      
      expect(gaps).toEqual(requiredTopics);
    });

    it('should handle empty content', () => {
      const content = '';
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const gaps = assessor.identifyInformationGaps(content, requiredTopics);
      
      expect(gaps).toEqual(requiredTopics);
    });

    it('should handle empty required topics', () => {
      const content = 'This article covers various SEO topics.';
      const requiredTopics: string[] = [];
      
      const gaps = assessor.identifyInformationGaps(content, requiredTopics);
      
      expect(gaps).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      const longContent = 'SEO fundamentals '.repeat(1000) + 'keyword research '.repeat(1000);
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(longContent, requiredTopics);
      
      expect(completeness).toBe(1.0);
    });

    it('should handle special characters in content', () => {
      const content = 'This covers SEO!!! fundamentals @#$% and keyword-research.';
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(1.0);
    });

    it('should handle special characters in required topics', () => {
      const content = 'This covers SEO/SEM fundamentals and keyword research.';
      const requiredTopics = ['SEO/SEM fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(1.0);
    });

    it('should handle duplicate topics in required list', () => {
      const content = 'This covers SEO fundamentals thoroughly.';
      const requiredTopics = ['SEO fundamentals', 'SEO fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBeCloseTo(0.67, 1); // 2 out of 3 entries covered
    });

    it('should handle partial topic name matches', () => {
      const content = 'This covers SEO and keyword topics.';
      const requiredTopics = ['SEO fundamentals', 'keyword research'];
      
      const completeness = assessor.assessTopicCompleteness(content, requiredTopics);
      
      expect(completeness).toBe(0); // Partial matches should not count
    });
  });
});