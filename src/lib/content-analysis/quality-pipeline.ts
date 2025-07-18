
import { ContentRequirements, ValidationResult, StageResult, ValidationStage } from './quality-pipeline.types';

export class ContentQualityPipeline {
  private validationStages: ValidationStage[];

  constructor(validators: ValidationStage[]) {
    if (!validators || validators.length === 0) {
      throw new Error('At least one validator must be provided');
    }
    this.validationStages = validators;
  }

  async validateContent(content: string, requirements: ContentRequirements): Promise<ValidationResult> {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }
    if (!requirements) {
      throw new Error('Content requirements must be provided');
    }

    let currentContent = content;
    const stageResults: StageResult[] = [];

    try {
      for (const validator of this.validationStages) {
        const result = await validator.validate(currentContent, requirements);
        stageResults.push(result);

        if (result.needsRefinement && result.issues) {
          currentContent = await validator.refine(currentContent, result.issues);
        }

        if (!result.passesThreshold) {
          return this.createFailureResult(stageResults, result.stage);
        }
      }

      return this.createSuccessResult(stageResults, currentContent);
    } catch (error) {
      throw new Error(`Validation pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createFailureResult(stageResults: StageResult[], failedStage: string): ValidationResult {
    return {
      overallStatus: 'failed',
      failedStage,
      stageResults,
      finalContent: null,
    };
  }

  private createSuccessResult(stageResults: StageResult[], finalContent: string): ValidationResult {
    return {
      overallStatus: 'passed',
      failedStage: null,
      stageResults,
      finalContent,
    };
  }
}
