import { QualityScorer, QUALITY_THRESHOLDS, DIMENSION_WEIGHTS } from '../quality-scorer';
import { StageResult } from '../quality-pipeline.types';

describe('QualityScorer', () => {
  let scorer: QualityScorer;

  beforeEach(() => {
    scorer = new QualityScorer();
  });

  describe('calculateOverallScore', () => {
    const createStageResult = (stage: string, score: number): StageResult => ({
      stage,
      score,
      passesThreshold: score >= QUALITY_THRESHOLDS[stage as keyof typeof QUALITY_THRESHOLDS],
      needsRefinement: false
    });

    const validStageResults: StageResult[] = [
      createStageResult('humanization', 90),
      createStageResult('authority', 92),
      createStageResult('eeat', 95),
      createStageResult('seo', 98),
      createStageResult('nlp', 88),
      createStageResult('userValue', 91)
    ];

    it('should calculate correct overall score with valid results', () => {
      const result = scorer.calculateOverallScore(validStageResults);

      // Calculate expected score manually
      const expectedScore = 
        90 * DIMENSION_WEIGHTS.humanization +
        92 * DIMENSION_WEIGHTS.authority +
        95 * DIMENSION_WEIGHTS.eeat +
        98 * DIMENSION_WEIGHTS.seo +
        88 * DIMENSION_WEIGHTS.nlp +
        91 * DIMENSION_WEIGHTS.userValue;

      expect(result.overallScore).toBeCloseTo(expectedScore, 2);
      expect(result.passesThreshold).toBe(true);
      expect(result.dimensionScores).toHaveLength(6);
    });

    it('should identify failing dimensions', () => {
      const failingResults = [
        createStageResult('humanization', 80), // Below threshold (85)
        createStageResult('authority', 85),    // Below threshold (88)
        createStageResult('eeat', 95),
        createStageResult('seo', 98),
        createStageResult('nlp', 88),
        createStageResult('userValue', 91)
      ];

      const result = scorer.calculateOverallScore(failingResults);

      expect(result.recommendations.some(rec => rec.includes('humanization'))).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('authority'))).toBe(true);
    });

    it('should handle edge case scores', () => {
      const edgeResults = [
        createStageResult('humanization', 0),
        createStageResult('authority', 100),
        createStageResult('eeat', 50),
        createStageResult('seo', 75),
        createStageResult('nlp', 25),
        createStageResult('userValue', 100)
      ];

      const result = scorer.calculateOverallScore(edgeResults);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should throw error for empty results', () => {
      expect(() => scorer.calculateOverallScore([])).toThrow('Validation results must be a non-empty array');
      expect(() => scorer.calculateOverallScore(null as any)).toThrow('Validation results must be a non-empty array');
    });

    it('should throw error for missing required dimensions', () => {
      const incompleteResults = [
        createStageResult('humanization', 90),
        createStageResult('authority', 92)
        // Missing other required dimensions
      ];

      expect(() => scorer.calculateOverallScore(incompleteResults))
        .toThrow('Missing required dimensions');
    });

    it('should throw error for invalid scores', () => {
      const invalidResults = [
        { ...createStageResult('humanization', 150), score: 150 }, // Invalid score > 100
        createStageResult('authority', 92),
        createStageResult('eeat', 95),
        createStageResult('seo', 98),
        createStageResult('nlp', 88),
        createStageResult('userValue', 91)
      ];

      expect(() => scorer.calculateOverallScore(invalidResults))
        .toThrow('Invalid score for humanization: 150');
    });

    it('should prioritize recommendations by impact', () => {
      const mixedResults = [
        createStageResult('humanization', 70), // 15 points below threshold
        createStageResult('authority', 80),    // 8 points below threshold  
        createStageResult('eeat', 85),         // 5 points below threshold
        createStageResult('seo', 90),          // 5 points below threshold (but higher weight)
        createStageResult('nlp', 88),
        createStageResult('userValue', 91)
      ];

      const result = scorer.calculateOverallScore(mixedResults);

      // Humanization should be prioritized due to largest gap (15 points)
      expect(result.recommendations[0]).toContain('humanization');
    });

    it('should add critical warning for very low scores', () => {
      const lowScoreResults = [
        createStageResult('humanization', 50),
        createStageResult('authority', 50),
        createStageResult('eeat', 50),
        createStageResult('seo', 50),
        createStageResult('nlp', 50),
        createStageResult('userValue', 50)
      ];

      const result = scorer.calculateOverallScore(lowScoreResults);

      expect(result.recommendations[0]).toContain('CRITICAL');
      expect(result.recommendations[0]).toContain('comprehensive revision');
    });

    it('should include timestamp in results', () => {
      const result = scorer.calculateOverallScore(validStageResults);
      
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getQualityGrade', () => {
    it('should return correct grades for score ranges', () => {
      expect(scorer.getQualityGrade(98)).toBe('A+');
      expect(scorer.getQualityGrade(95)).toBe('A+');
      expect(scorer.getQualityGrade(92)).toBe('A');
      expect(scorer.getQualityGrade(90)).toBe('A');
      expect(scorer.getQualityGrade(87)).toBe('B+');
      expect(scorer.getQualityGrade(85)).toBe('B+');
      expect(scorer.getQualityGrade(82)).toBe('B');
      expect(scorer.getQualityGrade(80)).toBe('B');
      expect(scorer.getQualityGrade(77)).toBe('C+');
      expect(scorer.getQualityGrade(75)).toBe('C+');
      expect(scorer.getQualityGrade(72)).toBe('C');
      expect(scorer.getQualityGrade(70)).toBe('C');
      expect(scorer.getQualityGrade(65)).toBe('D');
      expect(scorer.getQualityGrade(60)).toBe('D');
      expect(scorer.getQualityGrade(50)).toBe('F');
      expect(scorer.getQualityGrade(0)).toBe('F');
    });

    it('should handle edge cases', () => {
      expect(scorer.getQualityGrade(100)).toBe('A+');
      expect(scorer.getQualityGrade(59.9)).toBe('F');
    });
  });
});