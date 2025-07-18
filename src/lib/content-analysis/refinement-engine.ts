
import { QualityScorer, QualityScore } from './quality-scorer';
import { ContentRequirements, StageResult, ValidationStage } from './quality-pipeline.types';

export interface RefinementResult {
  finalContent: string;
  iterations: number;
  remainingIssues: string[];
  qualityImprovement: number;
  convergenceReached: boolean;
  processingTimeMs: number;
}

export interface RefinementAction {
  type: 'keyword-optimization' | 'readability' | 'structure' | 'grammar' | 'authority' | 'eeat';
  priority: 'high' | 'medium' | 'low';
  description: string;
  apply: (content: string) => string;
}

export class AutomatedRefinementEngine {
  private qualityScorer: QualityScorer;
  private validators: ValidationStage[];
  private readonly convergenceThreshold = 2.0; // Stop if improvement < 2 points

  constructor(validators: ValidationStage[] = []) {
    this.qualityScorer = new QualityScorer();
    this.validators = validators;
  }

  async refineContent(
    content: string,
    initialIssues: string[],
    requirements: ContentRequirements,
    maxIterations: number = 5
  ): Promise<RefinementResult> {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }
    if (!initialIssues || !Array.isArray(initialIssues)) {
      throw new Error('Initial issues must be an array');
    }
    if (maxIterations < 1 || maxIterations > 10) {
      throw new Error('Max iterations must be between 1 and 10');
    }

    const startTime = Date.now();
    let currentContent = content;
    let iteration = 0;
    let remainingIssues = [...initialIssues];
    let previousScore = 0;
    let convergenceReached = false;

    // Get initial quality score
    if (this.validators.length > 0) {
      const initialResults = await this.assessContent(currentContent, requirements);
      const initialQuality = this.qualityScorer.calculateOverallScore(initialResults);
      previousScore = initialQuality.overallScore;
    }

    while (iteration < maxIterations && remainingIssues.length > 0 && !convergenceReached) {
      const iterationStart = Date.now();
      
      // Prioritize and apply refinements
      const refinementActions = this.prioritizeRefinements(remainingIssues, requirements);
      currentContent = await this.applyRefinements(currentContent, refinementActions);

      // Re-assess quality
      let currentScore = previousScore;
      if (this.validators.length > 0) {
        const currentResults = await this.assessContent(currentContent, requirements);
        const currentQuality = this.qualityScorer.calculateOverallScore(currentResults);
        currentScore = currentQuality.overallScore;
        remainingIssues = currentQuality.recommendations;
      }

      // Check for convergence
      const improvement = currentScore - previousScore;
      if (improvement < this.convergenceThreshold) {
        convergenceReached = true;
      }

      previousScore = currentScore;
      iteration++;

      console.log(`Refinement iteration ${iteration}: Score improved by ${improvement.toFixed(2)} points`);
    }

    const processingTimeMs = Date.now() - startTime;
    const qualityImprovement = previousScore - (this.validators.length > 0 ? 0 : previousScore);

    return {
      finalContent: currentContent,
      iterations: iteration,
      remainingIssues,
      qualityImprovement,
      convergenceReached,
      processingTimeMs
    };
  }

  private async assessContent(content: string, requirements: ContentRequirements): Promise<StageResult[]> {
    const results: StageResult[] = [];
    
    for (const validator of this.validators) {
      try {
        const result = await validator.validate(content, requirements);
        results.push(result);
      } catch (error) {
        // If a validator fails, create a default result
        results.push({
          stage: 'unknown',
          score: 50,
          passesThreshold: false,
          needsRefinement: true,
          issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    }

    return results;
  }

  private prioritizeRefinements(issues: string[], requirements: ContentRequirements): RefinementAction[] {
    const actions: RefinementAction[] = [];

    issues.forEach(issue => {
      if (issue.toLowerCase().includes('keyword')) {
        actions.push({
          type: 'keyword-optimization',
          priority: 'high',
          description: 'Optimize keyword density and placement',
          apply: (content) => this.optimizeKeywords(content, requirements.keywords)
        });
      }
      
      if (issue.toLowerCase().includes('readability')) {
        actions.push({
          type: 'readability',
          priority: 'medium',
          description: 'Improve content readability',
          apply: (content) => this.improveReadability(content)
        });
      }

      if (issue.toLowerCase().includes('structure')) {
        actions.push({
          type: 'structure',
          priority: 'high',
          description: 'Improve content structure',
          apply: (content) => this.improveStructure(content)
        });
      }

      if (issue.toLowerCase().includes('grammar') || issue.toLowerCase().includes('typo')) {
        actions.push({
          type: 'grammar',
          priority: 'medium',
          description: 'Fix grammar and spelling issues',
          apply: (content) => this.fixGrammarIssues(content)
        });
      }
    });

    // Sort by priority
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async applyRefinements(content: string, actions: RefinementAction[]): Promise<string> {
    let refinedContent = content;

    for (const action of actions) {
      try {
        refinedContent = action.apply(refinedContent);
      } catch (error) {
        console.warn(`Failed to apply refinement ${action.type}:`, error);
      }
    }

    return refinedContent;
  }

  private optimizeKeywords(content: string, keywords: string[]): string {
    let optimized = content;
    
    keywords.forEach(keyword => {
      // Simple keyword optimization - replace generic terms with target keywords
      const genericTerms = ['thing', 'stuff', 'item', 'element'];
      genericTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (optimized.match(regex) && !optimized.toLowerCase().includes(keyword.toLowerCase())) {
          optimized = optimized.replace(regex, keyword);
        }
      });
    });

    return optimized;
  }

  private improveReadability(content: string): string {
    // Break up long sentences
    return content
      .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Add paragraph breaks
      .replace(/,\s*and\s*([^,]{20,})/g, '. Additionally, $1') // Break long clauses
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .trim();
  }

  private improveStructure(content: string): string {
    // Add basic structure if missing
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length > 3 && !content.includes('#')) {
      // Add headings for better structure
      const structured = lines.map((line, index) => {
        if (index === 0) return `# ${line}`;
        if (index % 3 === 0) return `## ${line}`;
        return line;
      });
      return structured.join('\n\n');
    }

    return content;
  }

  private fixGrammarIssues(content: string): string {
    return content
      .replace(/\bteh\b/g, 'the')
      .replace(/\brecieve\b/g, 'receive')
      .replace(/\bseperate\b/g, 'separate')
      .replace(/\boccured\b/g, 'occurred')
      .replace(/\bdefinately\b/g, 'definitely')
      .replace(/\bI is\b/g, 'I am')
      .replace(/\byour welcome\b/gi, "you're welcome");
  }
}
