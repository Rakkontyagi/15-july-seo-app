
import { QualityScorer, QualityScore } from './quality-scorer';
import { StageResult } from './quality-pipeline.types';

export interface ApprovalResult {
  status: 'approved' | 'rejected' | 'pending';
  message: string;
  overallScore: number;
  qualityGrade: string;
  recommendations: string[];
  approvalTimestamp: Date;
  criticalIssues: string[];
  canRetry: boolean;
}

export interface ApprovalCriteria {
  minimumOverallScore: number;
  requiredDimensions: string[];
  criticalDimensionThresholds: { [key: string]: number };
  allowPartialApproval: boolean;
}

export class ContentApprovalSystem {
  private qualityScorer: QualityScorer;
  private defaultCriteria: ApprovalCriteria;

  constructor(criteria?: Partial<ApprovalCriteria>) {
    this.qualityScorer = new QualityScorer();
    this.defaultCriteria = {
      minimumOverallScore: 90.0,
      requiredDimensions: ['humanization', 'authority', 'eeat', 'seo', 'nlp', 'userValue'],
      criticalDimensionThresholds: {
        seo: 95.0,
        eeat: 90.0,
        authority: 88.0
      },
      allowPartialApproval: false,
      ...criteria
    };
  }

  approveContent(stageResults: StageResult[], customCriteria?: Partial<ApprovalCriteria>): ApprovalResult {
    if (!stageResults || !Array.isArray(stageResults) || stageResults.length === 0) {
      throw new Error('Stage results must be a non-empty array');
    }

    const criteria = { ...this.defaultCriteria, ...customCriteria };
    const qualityScore = this.qualityScorer.calculateOverallScore(stageResults);
    const criticalIssues = this.identifyCriticalIssues(qualityScore, criteria);
    
    const approvalResult: ApprovalResult = {
      status: this.determineApprovalStatus(qualityScore, criteria, criticalIssues),
      message: this.generateApprovalMessage(qualityScore, criticalIssues),
      overallScore: qualityScore.overallScore,
      qualityGrade: this.qualityScorer.getQualityGrade(qualityScore.overallScore),
      recommendations: qualityScore.recommendations,
      approvalTimestamp: new Date(),
      criticalIssues,
      canRetry: criticalIssues.length === 0 || criteria.allowPartialApproval
    };

    return approvalResult;
  }

  private determineApprovalStatus(
    qualityScore: QualityScore, 
    criteria: ApprovalCriteria, 
    criticalIssues: string[]
  ): 'approved' | 'rejected' | 'pending' {
    // Check for critical issues first
    if (criticalIssues.length > 0) {
      return 'rejected';
    }

    // Check overall score
    if (qualityScore.overallScore < criteria.minimumOverallScore) {
      return qualityScore.overallScore >= (criteria.minimumOverallScore - 5) ? 'pending' : 'rejected';
    }

    // Check if all required dimensions are present and passing
    const providedDimensions = qualityScore.dimensionScores.map(d => d.dimension);
    const missingDimensions = criteria.requiredDimensions.filter(d => !providedDimensions.includes(d));
    
    if (missingDimensions.length > 0) {
      return 'rejected';
    }

    // All checks passed
    return 'approved';
  }

  private identifyCriticalIssues(qualityScore: QualityScore, criteria: ApprovalCriteria): string[] {
    const criticalIssues: string[] = [];

    // Check critical dimension thresholds
    Object.entries(criteria.criticalDimensionThresholds).forEach(([dimension, threshold]) => {
      const dimensionScore = qualityScore.dimensionScores.find(d => d.dimension === dimension);
      if (dimensionScore && dimensionScore.score < threshold) {
        criticalIssues.push(
          `CRITICAL: ${dimension} score (${dimensionScore.score.toFixed(1)}) is below critical threshold (${threshold})`
        );
      }
    });

    // Check for extremely low overall score
    if (qualityScore.overallScore < 60) {
      criticalIssues.push('CRITICAL: Overall content quality is unacceptably low');
    }

    // Check for multiple failing dimensions
    const failingDimensions = qualityScore.dimensionScores.filter(d => !d.passes);
    if (failingDimensions.length >= 3) {
      criticalIssues.push('CRITICAL: Multiple quality dimensions are failing');
    }

    return criticalIssues;
  }

  private generateApprovalMessage(qualityScore: QualityScore, criticalIssues: string[]): string {
    if (criticalIssues.length > 0) {
      return `Content rejected due to critical quality issues. Score: ${qualityScore.overallScore.toFixed(1)}%. Critical issues must be resolved before resubmission.`;
    }

    if (qualityScore.passesThreshold) {
      return `Content approved for publication. Excellent quality score: ${qualityScore.overallScore.toFixed(1)}% (Grade: ${this.qualityScorer.getQualityGrade(qualityScore.overallScore)}).`;
    }

    if (qualityScore.overallScore >= 85) {
      return `Content pending approval. Good quality score: ${qualityScore.overallScore.toFixed(1)}%, but minor improvements recommended.`;
    }

    return `Content rejected. Quality score: ${qualityScore.overallScore.toFixed(1)}% is below acceptable standards. Significant improvements required.`;
  }

  /**
   * Batch approve multiple content pieces
   */
  batchApprove(contentResults: { id: string; stageResults: StageResult[] }[]): { [contentId: string]: ApprovalResult } {
    const results: { [contentId: string]: ApprovalResult } = {};

    contentResults.forEach(({ id, stageResults }) => {
      try {
        results[id] = this.approveContent(stageResults);
      } catch (error) {
        results[id] = {
          status: 'rejected',
          message: `Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          overallScore: 0,
          qualityGrade: 'F',
          recommendations: ['Fix approval system errors'],
          approvalTimestamp: new Date(),
          criticalIssues: ['System error during approval'],
          canRetry: true
        };
      }
    });

    return results;
  }

  /**
   * Get approval statistics
   */
  getApprovalStats(approvalResults: ApprovalResult[]): {
    totalProcessed: number;
    approved: number;
    rejected: number;
    pending: number;
    averageScore: number;
    gradeDistribution: { [grade: string]: number };
  } {
    const stats = {
      totalProcessed: approvalResults.length,
      approved: 0,
      rejected: 0,
      pending: 0,
      averageScore: 0,
      gradeDistribution: {} as { [grade: string]: number }
    };

    if (approvalResults.length === 0) return stats;

    let totalScore = 0;
    approvalResults.forEach(result => {
      stats[result.status]++;
      totalScore += result.overallScore;
      
      const grade = result.qualityGrade;
      stats.gradeDistribution[grade] = (stats.gradeDistribution[grade] || 0) + 1;
    });

    stats.averageScore = totalScore / approvalResults.length;
    return stats;
  }
}
