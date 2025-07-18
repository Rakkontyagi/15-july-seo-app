
export interface ContentRequirements {
  targetAudience: string;
  tone: string;
  keywords: string[];
  minQualityScore?: number;
  contentType?: 'article' | 'blog' | 'product' | 'landing';
}

export interface StageResult {
  stage: string;
  score: number;
  passesThreshold: boolean;
  needsRefinement: boolean;
  issues?: string[];
  processingTimeMs?: number;
}

export interface ValidationResult {
  overallStatus: 'passed' | 'failed';
  failedStage: string | null;
  stageResults: StageResult[];
  finalContent: string | null;
  totalProcessingTimeMs?: number;
}

export interface ValidationStage {
  validate(content: string, requirements: ContentRequirements): Promise<StageResult>;
  refine(content: string, issues: string[]): Promise<string>;
}
