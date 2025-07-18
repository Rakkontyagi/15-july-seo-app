
export interface CoverageAnalysis {
  overallCompleteness: number;
  topicCoverage: TopicCoverage[];
  informationGaps: string[];
  contentDepth: number;
  breadthScore: number;
  qualityScore: number;
  recommendations: string[];
  processingTimeMs: number;
}

export interface TopicCoverage {
  topic: string;
  covered: boolean;
  depth: number;
  mentions: number;
  context: string[];
  importance: 'high' | 'medium' | 'low';
}

export class ComprehensiveCoverageAssessor {
  private readonly depthIndicators = [
    'definition', 'explanation', 'example', 'case study', 'research', 'study',
    'analysis', 'comparison', 'pros and cons', 'advantages', 'disadvantages',
    'step-by-st
