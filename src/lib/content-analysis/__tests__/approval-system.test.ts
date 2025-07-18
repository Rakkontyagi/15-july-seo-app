import { ContentApprovalSystem } from '../approval-system';
import { StageResult } from '../quality-pipeline.types';

describe('ContentApprovalSystem', () => {
  let approvalSystem: ContentApprovalSystem;

  beforeEach(() => {
    approvalSystem = new ContentApprovalSystem();
  });

  const createStageResult = (stage: string, score: number): StageResult => ({
    stage,
    score,
    passesThreshold: score >= 85,
    needsRefinement: false
  });

  const createHighQualityResults = (): StageResult[] => [
    createStageResult('humanization', 90),
    createStageResult('authority', 92),
    createStageResult('eeat', 95),
    createStageResult('seo', 98),
    createStageResult('nlp', 88),
    createStageResult('userValue', 91)
  ];

  const createLowQualityResults = (): StageResult[] => [
    createStageResult('humanization', 70),
    createStageResult('authority', 75),
    createStageResult('eeat', 80),
    createStageResult('seo', 85),
    createStageResult('nlp', 70),
    createStageResult('userValue', 75)
  ];

  describe('approveContent', () => {
    it('should approve high-quality content', () => {
      const result = approvalSystem.approveContent(createHighQualityResults());

      expect(result.status).toBe('approved');
      expect(result.message).toContain('approved for publication');
      expect(result.overallScore).toBeGreaterThan(90);
      expect(result.qualityGrade).toMatch(/^[AB]/);
      expect(result.canRetry).toBe(true);
      expect(result.criticalIssues).toHaveLength(0);
    });

    it('should reject low-quality content', () => {
      const result = approvalSystem.approveContent(createLowQualityResults());

      expect(result.status).toBe('rejected');
      expect(result.message).toContain('rejected');
      expect(result.overallScore).toBeLessThan(90);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify critical issues', () => {
      const criticalResults = [
        createStageResult('humanization', 90),
        createStageResult('authority', 70), // Below critical threshold
        createStageResult('eeat', 80),      // Below critical threshold
        createStageResult('seo', 85),       // Below critical threshold
        createStageResult('nlp', 88),
        createStageResult('userValue', 91)
      ];

      const result = approvalSystem.approveContent(criticalResults);

      expect(result.status).toBe('rejected');
      expect(result.criticalIssues.length).toBeGreaterThan(0);
      expect(result.criticalIssues.some(issue => issue.includes('CRITICAL'))).toBe(true);
    });

    it('should handle pending status for borderline content', () => {
      const borderlineResults = [
        createStageResult('humanization', 87),
        createStageResult('authority', 89),
        createStageResult('eeat', 91),
        createStageResult('seo', 96),
        createStageResult('nlp', 85),
        createStageResult('userValue', 88)
      ];

      const result = approvalSystem.approveContent(borderlineResults);

      // Should be approved or pending based on overall score
      expect(['approved', 'pending']).toContain(result.status);
    });

    it('should throw error for invalid input', () => {
      expect(() => approvalSystem.approveContent([])).toThrow('Stage results must be a non-empty array');
      expect(() => approvalSystem.approveContent(null as any)).toThrow('Stage results must be a non-empty array');
    });

    it('should use custom criteria when provided', () => {
      const customCriteria = {
        minimumOverallScore: 95.0,
        allowPartialApproval: true
      };

      const result = approvalSystem.approveContent(createHighQualityResults(), customCriteria);

      // With higher threshold, might not pass
      if (result.overallScore < 95) {
        expect(result.status).not.toBe('approved');
      }
    });

    it('should include approval timestamp', () => {
      const result = approvalSystem.approveContent(createHighQualityResults());

      expect(result.approvalTimestamp).toBeInstanceOf(Date);
      expect(result.approvalTimestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('batchApprove', () => {
    it('should process multiple content pieces', () => {
      const contentBatch = [
        { id: 'content-1', stageResults: createHighQualityResults() },
        { id: 'content-2', stageResults: createLowQualityResults() }
      ];

      const results = approvalSystem.batchApprove(contentBatch);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['content-1'].status).toBe('approved');
      expect(results['content-2'].status).toBe('rejected');
    });

    it('should handle errors in batch processing', () => {
      const contentBatch = [
        { id: 'content-1', stageResults: [] }, // Invalid - empty results
        { id: 'content-2', stageResults: createHighQualityResults() }
      ];

      const results = approvalSystem.batchApprove(contentBatch);

      expect(results['content-1'].status).toBe('rejected');
      expect(results['content-1'].message).toContain('Approval failed');
      expect(results['content-2'].status).toBe('approved');
    });
  });

  describe('getApprovalStats', () => {
    it('should calculate correct statistics', () => {
      const approvalResults = [
        { status: 'approved' as const, overallScore: 95, qualityGrade: 'A+' },
        { status: 'approved' as const, overallScore: 92, qualityGrade: 'A' },
        { status: 'rejected' as const, overallScore: 75, qualityGrade: 'C+' },
        { status: 'pending' as const, overallScore: 87, qualityGrade: 'B+' }
      ].map(partial => ({
        ...partial,
        message: '',
        recommendations: [],
        approvalTimestamp: new Date(),
        criticalIssues: [],
        canRetry: true
      }));

      const stats = approvalSystem.getApprovalStats(approvalResults);

      expect(stats.totalProcessed).toBe(4);
      expect(stats.approved).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.averageScore).toBe((95 + 92 + 75 + 87) / 4);
      expect(stats.gradeDistribution['A+']).toBe(1);
      expect(stats.gradeDistribution['A']).toBe(1);
      expect(stats.gradeDistribution['C+']).toBe(1);
      expect(stats.gradeDistribution['B+']).toBe(1);
    });

    it('should handle empty results array', () => {
      const stats = approvalSystem.getApprovalStats([]);

      expect(stats.totalProcessed).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(Object.keys(stats.gradeDistribution)).toHaveLength(0);
    });
  });

  describe('custom approval criteria', () => {
    it('should respect custom minimum score', () => {
      const customSystem = new ContentApprovalSystem({
        minimumOverallScore: 95.0
      });

      const goodButNotGreatResults = createHighQualityResults();
      const result = customSystem.approveContent(goodButNotGreatResults);

      // Depending on the actual calculated score, this might be rejected with higher threshold
      if (result.overallScore < 95) {
        expect(result.status).not.toBe('approved');
      }
    });

    it('should allow partial approval when configured', () => {
      const customSystem = new ContentApprovalSystem({
        allowPartialApproval: true,
        minimumOverallScore: 95.0
      });

      const borderlineResults = createHighQualityResults();
      const result = customSystem.approveContent(borderlineResults);

      expect(result.canRetry).toBe(true);
    });
  });
});