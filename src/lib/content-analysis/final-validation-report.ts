import { ValidationResult, StageResult } from './quality-pipeline.types';
import { QualityScorer } from './quality-scorer';

export class FinalValidationReport {
  private qualityScorer: QualityScorer;

  constructor() {
    this.qualityScorer = new QualityScorer();
  }

  generateReport(validationResult: ValidationResult, stageResults: StageResult[], finalContent: string | null): string {
    let report = `# Content Validation Report\n\n`;

    report += `## Overall Status: ${validationResult.overallStatus.toUpperCase()}\n\n`;

    if (validationResult.failedStage) {
      report += `### Failed at Stage: ${validationResult.failedStage}\n\n`;
    }

    report += `## Stage-by-Stage Analysis\n\n`;
    stageResults.forEach(stage => {
      report += `### ${stage.stage} Stage\n`;
      report += `- Score: ${stage.score}\n`;
      report += `- Passed Threshold: ${stage.passesThreshold ? 'Yes' : 'No'}\n`;
      if (stage.issues && stage.issues.length > 0) {
        report += `- Issues: ${stage.issues.join(', ')}\n`;
      }
      report += `\n`;
    });

    const overallQuality = this.qualityScorer.calculateOverallScore(stageResults);
    report += `## Overall Quality Score: ${overallQuality.overallScore.toFixed(2)}%\n\n`;
    report += `### Dimension Scores\n`;
    overallQuality.dimensionScores.forEach(dim => {
      report += `- ${dim.dimension}: ${dim.score.toFixed(2)}% (Weighted: ${dim.weightedScore.toFixed(2)}%)\n`;
    });
    report += `\n`;

    if (overallQuality.recommendations && overallQuality.recommendations.length > 0) {
      report += `## Recommendations for Improvement\n\n`;
      overallQuality.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
      report += `\n`;
    }

    if (finalContent) {
      report += `## Final Content (if approved)\n\n`;
      report += `\`\`\`\n${finalContent}\n\`\`\`\n`;
    }

    return report;
  }
}
