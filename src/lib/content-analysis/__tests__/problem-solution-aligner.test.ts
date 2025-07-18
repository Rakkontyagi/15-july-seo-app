import { ProblemSolutionAligner } from '../problem-solution-aligner';

describe('ProblemSolutionAligner', () => {
  let aligner: ProblemSolutionAligner;

  beforeEach(() => {
    aligner = new ProblemSolutionAligner();
  });

  describe('Problem-Solution Alignment Validation', () => {
    it('should validate alignment between content and user problems', () => {
      const content = 'This article addresses the challenge of low SEO rankings. The solution is to implement better keyword optimization.';
      const userProblems = ['challenge', 'low rankings'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBeGreaterThan(0);
      expect(result.solutionCompleteness).toBeGreaterThan(0);
      expect(result.alignmentScore).toBeGreaterThan(0);
    });

    it('should achieve >90% problem-solution alignment requirement', () => {
      const content = 'The main challenge is poor SEO performance. Our solution involves comprehensive keyword research and optimization.';
      const userProblems = ['challenge'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBeGreaterThanOrEqual(0.9);
    });

    it('should handle content with no identified problems', () => {
      const content = 'SEO is important for websites. Search engines use algorithms.';
      const userProblems = ['ranking issues'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBe(0);
      expect(result.gapAnalysis).toContain('ranking issues');
    });

    it('should handle content with no user problems provided', () => {
      const content = 'This addresses the challenge of SEO optimization with effective solutions.';
      const userProblems: string[] = [];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBe(1.0);
      expect(result.gapAnalysis).toEqual([]);
    });
  });

  describe('Problem Coverage Calculation', () => {
    it('should calculate accurate problem coverage', () => {
      const content = 'This addresses the challenge and difficulty of SEO optimization.';
      const userProblems = ['challenge', 'difficulty', 'ranking'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBeCloseTo(0.67, 1); // 2 out of 3 problems covered
    });

    it('should return 100% coverage when all problems are addressed', () => {
      const content = 'This content addresses the challenge and difficulty users face.';
      const userProblems = ['challenge', 'difficulty'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBe(1.0);
    });
  });

  describe('Solution Completeness Assessment', () => {
    it('should assess solution completeness based on provided solutions', () => {
      const content = 'The solution to this problem involves using better SEO techniques.';
      const userProblems = ['SEO issues'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.solutionCompleteness).toBeGreaterThan(0);
    });

    it('should return 0 completeness when no solutions are provided', () => {
      const content = 'This content has no solutions mentioned.';
      const userProblems = ['SEO issues'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.solutionCompleteness).toBe(0);
    });
  });

  describe('Alignment Score Calculation', () => {
    it('should calculate alignment score based on problem-solution matching', () => {
      const content = 'The challenge is low rankings. The solution is better optimization.';
      const userProblems = ['challenge'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.alignmentScore).toBeGreaterThan(0);
    });

    it('should return 0 alignment score when no problems or solutions exist', () => {
      const content = 'This is general content without specific problems or solutions.';
      const userProblems = ['specific issue'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.alignmentScore).toBe(0);
    });
  });

  describe('Gap Analysis', () => {
    it('should identify gaps between user problems and content problems', () => {
      const content = 'This addresses the challenge of SEO.';
      const userProblems = ['challenge', 'difficulty', 'ranking issues'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.gapAnalysis).toContain('difficulty');
      expect(result.gapAnalysis).toContain('ranking issues');
      expect(result.gapAnalysis).not.toContain('challenge');
    });

    it('should return empty gap analysis when all problems are covered', () => {
      const content = 'This addresses the challenge and difficulty of SEO optimization.';
      const userProblems = ['challenge', 'difficulty'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.gapAnalysis).toEqual([]);
    });
  });

  describe('Solution Effectiveness Scoring', () => {
    it('should score solution effectiveness based on solution quality', () => {
      const content = 'The solution involves comprehensive keyword research and optimization.';
      const userProblems = ['ranking issues'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.solutionEffectiveness).toBeGreaterThan(0);
      expect(result.solutionEffectiveness).toBeLessThanOrEqual(1);
    });

    it('should return 0 effectiveness when no solutions are provided', () => {
      const content = 'This content has no solutions.';
      const userProblems = ['ranking issues'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.solutionEffectiveness).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = aligner.validateAlignment('', ['problem']);
      
      expect(result.problemCoverage).toBe(0);
      expect(result.solutionCompleteness).toBe(0);
      expect(result.alignmentScore).toBe(0);
    });

    it('should handle special characters in content', () => {
      const content = 'The challenge!!! is @#$% ranking. Solution: optimize & improve.';
      const userProblems = ['challenge'];
      
      const result = aligner.validateAlignment(content, userProblems);
      
      expect(result.problemCoverage).toBeGreaterThan(0);
    });
  });
});