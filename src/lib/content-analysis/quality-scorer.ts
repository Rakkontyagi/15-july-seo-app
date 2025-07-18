
import { StageResult } from './quality-pipeline.types';

export interface QualityScore {
  overallScore: number;
  dimensionScores: DimensionScore[];
  passesThreshold: boolean;
  recommendations: string[];
  timestamp: Date;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  weightedScore: number;
  threshold: number;
  passes: boolean;
}

export const QUALITY_THRESHOLDS = {
  humanization: 85.0,
  authority: 88.0,
  eeat: 90.0,
  seo: 95.0,
  nlp: 92.0,
  userValue: 88.0,
  overall: 90.0,
} as const;

export const DIMENSION_WEIGHTS = {
  humanization: 0.15,
  authority: 0.20,
  eeat: 0.20,
  seo: 0.25,
  nlp: 0.10,
  userValue: 0.10,
} as const;

export class QualityScorer {
  calculateOverallScore(validationResults: StageResult[]): QualityScore {
    if (!validationResults || !Array.isArray(validationResults) || validationResults.length === 0) {
      throw new Error('Validation results must be a non-empty array');
    }

    // Validate that all required dimensions are present
    const requiredDimensions = Object.keys(DIMENSION_WEIGHTS);
    const providedDimensions = validationResults.map(r => r.stage);
    const missingDimensions = requiredDimensions.filter(d => !providedDimensions.includes(d));
    
    if (missingDimensions.length > 0) {
      throw new Error(`Missing required dimensions: ${missingDimensions.join(', ')}`);
    }

    const dimensionScores: DimensionScore[] = validationResults.map((result) => {
      const weight = DIMENSION_WEIGHTS[result.stage as keyof typeof DIMENSION_WEIGHTS] || 0;
      const threshold = QUALITY_THRESHOLDS[result.stage as keyof typeof QUALITY_THRESHOLDS] || 0;
      
      if (result.score < 0 || result.score > 100) {
        throw new Error(`Invalid score for ${result.stage}: ${result.score}. Score must be between 0 and 100.`);
      }

      return {
        dimension: result.stage,
        score: result.score,
        weightedScore: result.score * weight,
        threshold,
        passes: result.score >= threshold
      };
    });

    const overallScore = dimensionScores.reduce((sum, item) => sum + item.weightedScore, 0);

    return {
      overallScore: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
      dimensionScores,
      passesThreshold: overallScore >= QUALITY_THRESHOLDS.overall,
      recommendations: this.generateRecommendations(dimensionScores),
      timestamp: new Date()
    };
  }

  private generateRecommendations(dimensionScores: DimensionScore[]): string[] {
    const recommendations: string[] = [];
    
    // Sort by priority (lowest scores first, weighted by importance)
    const sortedDimensions = [...dimensionScores]
      .filter(item => !item.passes)
      .sort((a, b) => {
        const priorityA = (a.threshold - a.score) * (DIMENSION_WEIGHTS[a.dimension as keyof typeof DIMENSION_WEIGHTS] || 0);
        const priorityB = (b.threshold - b.score) * (DIMENSION_WEIGHTS[b.dimension as keyof typeof DIMENSION_WEIGHTS] || 0);
        return priorityB - priorityA;
      });

    sortedDimensions.forEach(item => {
      const gap = item.threshold - item.score;
      const priority = gap > 10 ? 'HIGH' : gap > 5 ? 'MEDIUM' : 'LOW';
      recommendations.push(
        `[${priority}] Improve ${item.dimension} score by ${gap.toFixed(1)} points (Current: ${item.score.toFixed(1)}, Target: ${item.threshold})`
      );
    });

    // Add general recommendations if overall score is low
    const overallScore = dimensionScores.reduce((sum, item) => sum + item.weightedScore, 0);
    if (overallScore < 80) {
      recommendations.unshift('CRITICAL: Overall content quality is below acceptable standards. Consider comprehensive revision.');
    }

    return recommendations;
  }

  /**
   * Get quality grade based on overall score
   */
  getQualityGrade(overallScore: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
    if (overallScore >= 95) return 'A+';
    if (overallScore >= 90) return 'A';
    if (overallScore >= 85) return 'B+';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 75) return 'C+';
    if (overallScore >= 70) return 'C';
    if (overallScore >= 60) return 'D';
    return 'F';
  }
}
