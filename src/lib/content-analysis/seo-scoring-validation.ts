
import { SentenceTokenizer, WordTokenizer } from 'natural';
import * as compromise from 'compromise';
import { PrecisionSEOOptimizer } from './precision-seo-optimizer';
import { LSIKeywordIntegrator } from './lsi-integrator';
import { EntityOptimizer } from './entity-optimizer';
import { HeadingOptimizer } from './heading-optimizer';
import { ContentStructureAnalyzer } from './content-structure-analyzer';
import { UserIntentAlignmentSystem } from './user-intent-alignment';

export interface SEOScoreComponents {
  keywordOptimization: number;
  contentStructure: number;
  readability: number;
  technicalSEO: number;
  userExperience: number;
  competitorAlignment: number;
  intentAlignment: number;
  overallScore: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: SEOScoreComponents;
  criticalIssues: string[];
  recommendations: string[];
  optimizationGaps: string[];
  requiredActions: string[];
}

export interface QualityGate {
  name: string;
  weight: number;
  threshold: number;
  currentScore: number;
  passed: boolean;
  requirements: string[];
}

export interface OptimizationTarget {
  keyword: string;
  targetDensity: number;
  currentDensity: number;
  lsiCoverage: number;
  entityUsage: number;
  headingOptimization: number;
  intentAlignment: number;
  competitorGap: number;
}

export interface ComprehensiveValidation {
  validationResult: ValidationResult;
  qualityGates: QualityGate[];
  optimizationTargets: OptimizationTarget[];
  approvalStatus: 'approved' | 'needs_revision' | 'rejected';
  revisionsRequired: string[];
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  processingTime: number;
  accuracyScore: number;
  completenessScore: number;
  consistencyScore: number;
  precisionScore: number;
  validationDepth: number;
}

export class SEOScoringValidation {
  private readonly sentenceTokenizer = new SentenceTokenizer();
  private readonly wordTokenizer = new WordTokenizer();
  private readonly precisionOptimizer = new PrecisionSEOOptimizer();
  private readonly lsiIntegrator = new LSIKeywordIntegrator();
  private readonly entityOptimizer = new EntityOptimizer();
  private readonly headingOptimizer = new HeadingOptimizer();
  private readonly structureAnalyzer = new ContentStructureAnalyzer();
  private readonly intentAligner = new UserIntentAlignmentSystem();

  // Scoring weights for different components
  private readonly scoringWeights = {
    keywordOptimization: 0.20,
    contentStructure: 0.15,
    readability: 0.15,
    technicalSEO: 0.15,
    userExperience: 0.10,
    competitorAlignment: 0.15,
    intentAlignment: 0.10
  };

  // Quality thresholds
  private readonly qualityThresholds = {
    minimum: 70,
    good: 80,
    excellent: 90,
    precision: 0.01
  };

  /**
   * Validate SEO score against target with comprehensive analysis
   */
  validateSEOScore(content: string, targetScore: number): boolean {
    const validation = this.performComprehensiveValidation(content, '', targetScore);
    return validation.validationResult.isValid && validation.validationResult.score.overallScore >= targetScore;
  }

  /**
   * Calculate comprehensive SEO score
   */
  calculateComprehensiveSEOScore(content: string, keyword: string, competitorData?: any): SEOScoreComponents {
    const keywordOptimization = this.calculateKeywordOptimizationScore(content, keyword);
    const contentStructure = this.calculateContentStructureScore(content);
    const readability = this.calculateReadabilityScore(content);
    const technicalSEO = this.calculateTechnicalSEOScore(content);
    const userExperience = this.calculateUserExperienceScore(content);
    const competitorAlignment = this.calculateCompetitorAlignmentScore(content, competitorData);
    const intentAlignment = this.calculateIntentAlignmentScore(content, keyword);

    const overallScore = this.calculateWeightedOverallScore({
      keywordOptimization,
      contentStructure,
      readability,
      technicalSEO,
      userExperience,
      competitorAlignment,
      intentAlignment
    });

    return {
      keywordOptimization,
      contentStructure,
      readability,
      technicalSEO,
      userExperience,
      competitorAlignment,
      intentAlignment,
      overallScore
    };
  }

  /**
   * Perform comprehensive validation with quality gates
   */
  performComprehensiveValidation(
    content: string,
    keyword: string,
    targetScore: number,
    competitorData?: any
  ): ComprehensiveValidation {
    const startTime = performance.now();

    // Calculate comprehensive score
    const score = this.calculateComprehensiveSEOScore(content, keyword, competitorData);

    // Check quality gates
    const qualityGates = this.evaluateQualityGates(score, content, keyword);

    // Validate against targets
    const validationResult = this.validateAgainstTargets(score, targetScore, qualityGates);

    // Calculate optimization targets
    const optimizationTargets = this.calculateOptimizationTargets(content, keyword, competitorData);

    // Determine approval status
    const approvalStatus = this.determineApprovalStatus(validationResult, qualityGates);

    // Generate required revisions
    const revisionsRequired = this.generateRevisionRequirements(validationResult, qualityGates);

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(
      startTime,
      score,
      validationResult,
      qualityGates
    );

    return {
      validationResult,
      qualityGates,
      optimizationTargets,
      approvalStatus,
      revisionsRequired,
      performanceMetrics
    };
  }

  /**
   * Validate precision targets are met
   */
  validatePrecisionTargets(content: string, targets: OptimizationTarget[]): boolean {
    for (const target of targets) {
      const currentDensity = this.precisionOptimizer.calculateExactKeywordDensity(content, target.keyword);
      const densityDifference = Math.abs(currentDensity - target.targetDensity);
      
      if (densityDifference > this.qualityThresholds.precision) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate approval gate report
   */
  generateApprovalGateReport(validation: ComprehensiveValidation): string {
    const report = [];
    
    report.push('# SEO Scoring Validation Report');
    report.push('');
    report.push(`**Approval Status**: ${validation.approvalStatus.toUpperCase()}`);
    report.push(`**Overall Score**: ${validation.validationResult.score.overallScore.toFixed(2)}/100`);
    report.push('');

    // Quality Gates
    report.push('## Quality Gates');
    validation.qualityGates.forEach(gate => {
      const status = gate.passed ? '✅ PASSED' : '❌ FAILED';
      report.push(`- **${gate.name}**: ${status} (${gate.currentScore.toFixed(2)}/${gate.threshold})`);
    });
    report.push('');

    // Critical Issues
    if (validation.validationResult.criticalIssues.length > 0) {
      report.push('## Critical Issues');
      validation.validationResult.criticalIssues.forEach(issue => {
        report.push(`- ${issue}`);
      });
      report.push('');
    }

    // Recommendations
    if (validation.validationResult.recommendations.length > 0) {
      report.push('## Recommendations');
      validation.validationResult.recommendations.forEach(rec => {
        report.push(`- ${rec}`);
      });
      report.push('');
    }

    // Required Actions
    if (validation.revisionsRequired.length > 0) {
      report.push('## Required Actions');
      validation.revisionsRequired.forEach(action => {
        report.push(`- ${action}`);
      });
    }

    return report.join('\n');
  }

  /**
   * Calculate keyword optimization score
   */
  private calculateKeywordOptimizationScore(content: string, keyword: string): number {
    if (!keyword) return 0;

    let score = 0;
    const maxScore = 100;

    // Keyword density (40% of score)
    const density = this.precisionOptimizer.calculateExactKeywordDensity(content, keyword);
    const optimalDensity = 2.0; // 2% is generally optimal
    const densityScore = Math.max(0, 100 - Math.abs(density - optimalDensity) * 20);
    score += densityScore * 0.4;

    // Keyword placement (30% of score)
    const placementScore = this.calculateKeywordPlacementScore(content, keyword);
    score += placementScore * 0.3;

    // Keyword variations (20% of score)
    const variationsScore = this.calculateKeywordVariationsScore(content, keyword);
    score += variationsScore * 0.2;

    // Semantic relevance (10% of score)
    const semanticScore = this.calculateSemanticRelevanceScore(content, keyword);
    score += semanticScore * 0.1;

    return Math.min(maxScore, score);
  }

  /**
   * Calculate content structure score
   */
  private calculateContentStructureScore(content: string): number {
    let score = 0;
    const maxScore = 100;

    // Heading structure (40% of score)
    const headingScore = this.calculateHeadingStructureScore(content);
    score += headingScore * 0.4;

    // Content organization (30% of score)
    const organizationScore = this.calculateContentOrganizationScore(content);
    score += organizationScore * 0.3;

    // Flow and transitions (20% of score)
    const flowScore = this.calculateContentFlowScore(content);
    score += flowScore * 0.2;

    // Logical structure (10% of score)
    const logicalScore = this.calculateLogicalStructureScore(content);
    score += logicalScore * 0.1;

    return Math.min(maxScore, score);
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(content: string): number {
    let score = 0;
    const maxScore = 100;

    // Sentence length (30% of score)
    const sentenceLengthScore = this.calculateSentenceLengthScore(content);
    score += sentenceLengthScore * 0.3;

    // Word complexity (25% of score)
    const wordComplexityScore = this.calculateWordComplexityScore(content);
    score += wordComplexityScore * 0.25;

    // Paragraph structure (25% of score)
    const paragraphScore = this.calculateParagraphStructureScore(content);
    score += paragraphScore * 0.25;

    // Readability metrics (20% of score)
    const readabilityMetrics = this.calculateReadabilityMetrics(content);
    score += readabilityMetrics * 0.2;

    return Math.min(maxScore, score);
  }

  /**
   * Calculate technical SEO score
   */
  private calculateTechnicalSEOScore(content: string): number {
    let score = 0;
    const maxScore = 100;

    // Content length (25% of score)
    const lengthScore = this.calculateContentLengthScore(content);
    score += lengthScore * 0.25;

    // Meta information (25% of score)
    const metaScore = this.calculateMetaInformationScore(content);
    score += metaScore * 0.25;

    // Internal linking (25% of score)
    const linkingScore = this.calculateInternalLinkingScore(content);
    score += linkingScore * 0.25;

    // Schema and structured data (25% of score)
    const schemaScore = this.calculateSchemaScore(content);
    score += schemaScore * 0.25;

    return Math.min(maxScore, score);
  }

  /**
   * Calculate user experience score
   */
  private calculateUserExperienceScore(content: string): number {
    let score = 0;
    const maxScore = 100;

    // Engagement factors (40% of score)
    const engagementScore = this.calculateEngagementScore(content);
    score += engagementScore * 0.4;

    // Accessibility (30% of score)
    const accessibilityScore = this.calculateAccessibilityScore(content);
    score += accessibilityScore * 0.3;

    // Mobile optimization (20% of score)
    const mobileScore = this.calculateMobileOptimizationScore(content);
    score += mobileScore * 0.2;

    // Page speed factors (10% of score)
    const speedScore = this.calculatePageSpeedScore(content);
    score += speedScore * 0.1;

    return Math.min(maxScore, score);
  }

  /**
   * Calculate competitor alignment score
   */
  private calculateCompetitorAlignmentScore(content: string, competitorData?: any): number {
    if (!competitorData) return 85; // Default score when no competitor data

    let score = 0;
    const maxScore = 100;

    // Topic coverage alignment (40% of score)
    const topicScore = this.calculateTopicAlignmentScore(content, competitorData);
    score += topicScore * 0.4;

    // Structure alignment (30% of score)
    const structureScore = this.calculateStructureAlignmentScore(content, competitorData);
    score += structureScore * 0.3;

    // Content depth alignment (20% of score)
    const depthScore = this.calculateContentDepthScore(content, competitorData);
    score += depthScore * 0.2;

    // Competitive advantage (10% of score)
    const advantageScore = this.calculateCompetitiveAdvantageScore(content, competitorData);
    score += advantageScore * 0.1;

    return Math.min(maxScore, score);
  }

  /**
   * Calculate intent alignment score
   */
  private calculateIntentAlignmentScore(content: string, keyword: string): number {
    if (!keyword) return 70; // Default score when no keyword

    const intent = this.intentAligner.classifySearchIntent(keyword, content);
    const satisfactionScore = this.intentAligner.calculateIntentSatisfactionScore(content, intent);
    
    return satisfactionScore.overallScore * 100;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedOverallScore(scores: Omit<SEOScoreComponents, 'overallScore'>): number {
    return (
      scores.keywordOptimization * this.scoringWeights.keywordOptimization +
      scores.contentStructure * this.scoringWeights.contentStructure +
      scores.readability * this.scoringWeights.readability +
      scores.technicalSEO * this.scoringWeights.technicalSEO +
      scores.userExperience * this.scoringWeights.userExperience +
      scores.competitorAlignment * this.scoringWeights.competitorAlignment +
      scores.intentAlignment * this.scoringWeights.intentAlignment
    );
  }

  /**
   * Evaluate quality gates
   */
  private evaluateQualityGates(score: SEOScoreComponents, content: string, keyword: string): QualityGate[] {
    const gates: QualityGate[] = [
      {
        name: 'Keyword Optimization',
        weight: this.scoringWeights.keywordOptimization,
        threshold: this.qualityThresholds.good,
        currentScore: score.keywordOptimization,
        passed: score.keywordOptimization >= this.qualityThresholds.good,
        requirements: ['Keyword density within optimal range', 'Proper keyword placement', 'Semantic variations included']
      },
      {
        name: 'Content Structure',
        weight: this.scoringWeights.contentStructure,
        threshold: this.qualityThresholds.good,
        currentScore: score.contentStructure,
        passed: score.contentStructure >= this.qualityThresholds.good,
        requirements: ['Proper heading hierarchy', 'Logical flow', 'Clear organization']
      },
      {
        name: 'Readability',
        weight: this.scoringWeights.readability,
        threshold: this.qualityThresholds.good,
        currentScore: score.readability,
        passed: score.readability >= this.qualityThresholds.good,
        requirements: ['Appropriate sentence length', 'Clear language', 'Good paragraph structure']
      },
      {
        name: 'Technical SEO',
        weight: this.scoringWeights.technicalSEO,
        threshold: this.qualityThresholds.good,
        currentScore: score.technicalSEO,
        passed: score.technicalSEO >= this.qualityThresholds.good,
        requirements: ['Optimal content length', 'Proper meta information', 'Internal linking']
      },
      {
        name: 'User Experience',
        weight: this.scoringWeights.userExperience,
        threshold: this.qualityThresholds.minimum,
        currentScore: score.userExperience,
        passed: score.userExperience >= this.qualityThresholds.minimum,
        requirements: ['Engaging content', 'Accessible design', 'Mobile optimization']
      },
      {
        name: 'Competitor Alignment',
        weight: this.scoringWeights.competitorAlignment,
        threshold: this.qualityThresholds.good,
        currentScore: score.competitorAlignment,
        passed: score.competitorAlignment >= this.qualityThresholds.good,
        requirements: ['Topic coverage matches competitors', 'Structural alignment', 'Competitive advantage']
      },
      {
        name: 'Intent Alignment',
        weight: this.scoringWeights.intentAlignment,
        threshold: this.qualityThresholds.good,
        currentScore: score.intentAlignment,
        passed: score.intentAlignment >= this.qualityThresholds.good,
        requirements: ['Matches search intent', 'Satisfies user needs', 'Appropriate content type']
      }
    ];

    return gates;
  }

  /**
   * Validate against targets
   */
  private validateAgainstTargets(score: SEOScoreComponents, targetScore: number, qualityGates: QualityGate[]): ValidationResult {
    const isValid = score.overallScore >= targetScore;
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];
    const optimizationGaps: string[] = [];
    const requiredActions: string[] = [];

    // Check for critical issues
    qualityGates.forEach(gate => {
      if (!gate.passed && gate.weight > 0.15) {
        criticalIssues.push(`Critical: ${gate.name} score (${gate.currentScore.toFixed(2)}) below threshold (${gate.threshold})`);
      }
    });

    // Generate recommendations
    if (score.keywordOptimization < this.qualityThresholds.excellent) {
      recommendations.push('Improve keyword optimization through better placement and variations');
    }
    if (score.contentStructure < this.qualityThresholds.excellent) {
      recommendations.push('Enhance content structure with clearer headings and organization');
    }
    if (score.readability < this.qualityThresholds.excellent) {
      recommendations.push('Improve readability with shorter sentences and clearer language');
    }

    // Identify optimization gaps
    Object.entries(score).forEach(([key, value]) => {
      if (key !== 'overallScore' && value < this.qualityThresholds.good) {
        optimizationGaps.push(`${key}: ${value.toFixed(2)} (needs improvement)`);
      }
    });

    // Generate required actions
    if (score.overallScore < targetScore) {
      requiredActions.push(`Increase overall score from ${score.overallScore.toFixed(2)} to ${targetScore}`);
    }
    
    criticalIssues.forEach(issue => {
      requiredActions.push(`Address critical issue: ${issue}`);
    });

    return {
      isValid,
      score,
      criticalIssues,
      recommendations,
      optimizationGaps,
      requiredActions
    };
  }

  /**
   * Calculate optimization targets
   */
  private calculateOptimizationTargets(content: string, keyword: string, competitorData?: any): OptimizationTarget[] {
    if (!keyword) return [];

    const currentDensity = this.precisionOptimizer.calculateExactKeywordDensity(content, keyword);
    const targetDensity = 2.0; // Optimal density
    
    return [{
      keyword,
      targetDensity,
      currentDensity,
      lsiCoverage: this.calculateLSICoverage(content, keyword),
      entityUsage: this.calculateEntityUsage(content),
      headingOptimization: this.calculateHeadingOptimization(content, keyword),
      intentAlignment: this.calculateIntentAlignmentScore(content, keyword) / 100,
      competitorGap: this.calculateCompetitorGap(content, competitorData)
    }];
  }

  /**
   * Determine approval status
   */
  private determineApprovalStatus(validation: ValidationResult, qualityGates: QualityGate[]): 'approved' | 'needs_revision' | 'rejected' {
    const criticalFailures = qualityGates.filter(gate => !gate.passed && gate.weight > 0.15).length;
    const totalFailures = qualityGates.filter(gate => !gate.passed).length;

    if (criticalFailures > 0) {
      return 'rejected';
    } else if (totalFailures > 2 || validation.score.overallScore < this.qualityThresholds.minimum) {
      return 'needs_revision';
    } else if (validation.isValid && validation.score.overallScore >= this.qualityThresholds.good) {
      return 'approved';
    } else {
      return 'needs_revision';
    }
  }

  /**
   * Generate revision requirements
   */
  private generateRevisionRequirements(validation: ValidationResult, qualityGates: QualityGate[]): string[] {
    const revisions: string[] = [];

    // Add critical issues as priority revisions
    validation.criticalIssues.forEach(issue => {
      revisions.push(`HIGH PRIORITY: ${issue}`);
    });

    // Add failed quality gates
    qualityGates.filter(gate => !gate.passed).forEach(gate => {
      revisions.push(`${gate.name}: Improve from ${gate.currentScore.toFixed(2)} to ${gate.threshold}`);
    });

    // Add optimization gaps
    validation.optimizationGaps.forEach(gap => {
      revisions.push(`Address optimization gap: ${gap}`);
    });

    return revisions;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    startTime: number,
    score: SEOScoreComponents,
    validation: ValidationResult,
    qualityGates: QualityGate[]
  ): PerformanceMetrics {
    const processingTime = performance.now() - startTime;
    const passedGates = qualityGates.filter(gate => gate.passed).length;
    const totalGates = qualityGates.length;

    return {
      processingTime,
      accuracyScore: score.overallScore / 100,
      completenessScore: passedGates / totalGates,
      consistencyScore: this.calculateConsistencyScore(score),
      precisionScore: this.calculatePrecisionScore(validation),
      validationDepth: totalGates
    };
  }

  /**
   * Helper methods for detailed scoring
   */
  private calculateKeywordPlacementScore(content: string, keyword: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Check title/heading placement (30 points)
    if (lowerContent.includes(`# ${lowerKeyword}`) || lowerContent.includes(`## ${lowerKeyword}`)) {
      score += 30;
    }

    // Check first paragraph (25 points)
    const firstParagraph = content.split('\n\n')[0] || '';
    if (firstParagraph.toLowerCase().includes(lowerKeyword)) {
      score += 25;
    }

    // Check last paragraph (20 points)
    const paragraphs = content.split('\n\n');
    const lastParagraph = paragraphs[paragraphs.length - 1] || '';
    if (lastParagraph.toLowerCase().includes(lowerKeyword)) {
      score += 20;
    }

    // Check subheadings (25 points)
    const subheadingMatches = (content.match(/^#{2,6}\s.*$/gm) || [])
      .filter(heading => heading.toLowerCase().includes(lowerKeyword));
    if (subheadingMatches.length > 0) {
      score += 25;
    }

    return Math.min(100, score);
  }

  private calculateKeywordVariationsScore(content: string, keyword: string): number {
    const variations = [
      keyword.toLowerCase(),
      keyword.toLowerCase() + 's',
      keyword.toLowerCase() + 'ing',
      keyword.toLowerCase() + 'ed',
      keyword.toLowerCase().replace(/s$/, ''),
    ];

    let foundVariations = 0;
    const lowerContent = content.toLowerCase();

    variations.forEach(variation => {
      if (lowerContent.includes(variation)) {
        foundVariations++;
      }
    });

    return (foundVariations / variations.length) * 100;
  }

  private calculateSemanticRelevanceScore(content: string, keyword: string): number {
    const doc = compromise(content);
    const keywordDoc = compromise(keyword);
    
    // Get related terms from content
    const nouns = doc.match('#Noun').out('array');
    const adjectives = doc.match('#Adjective').out('array');
    const verbs = doc.match('#Verb').out('array');
    
    // Simple semantic relevance based on related terms
    const keywordTerms = keywordDoc.match('#Noun').out('array');
    let relevanceScore = 0;
    
    keywordTerms.forEach(term => {
      if (nouns.includes(term) || adjectives.includes(term) || verbs.includes(term)) {
        relevanceScore += 20;
      }
    });

    return Math.min(100, relevanceScore);
  }

  private calculateHeadingStructureScore(content: string): number {
    const headings = this.headingOptimizer.extractHeadings(content);
    let score = 0;

    // Check for H1 (20 points)
    if (headings.some(h => h.level === 1)) {
      score += 20;
    }

    // Check for proper hierarchy (30 points)
    let hierarchyScore = 0;
    let previousLevel = 0;
    headings.forEach(heading => {
      if (heading.level <= previousLevel + 1) {
        hierarchyScore += 5;
      }
      previousLevel = heading.level;
    });
    score += Math.min(30, hierarchyScore);

    // Check for adequate heading distribution (25 points)
    const contentLength = this.wordTokenizer.tokenize(content).length;
    const headingRatio = headings.length / (contentLength / 100);
    if (headingRatio >= 0.5 && headingRatio <= 2) {
      score += 25;
    }

    // Check for descriptive headings (25 points)
    const descriptiveHeadings = headings.filter(h => h.text.split(' ').length >= 2);
    if (descriptiveHeadings.length >= headings.length * 0.8) {
      score += 25;
    }

    return Math.min(100, score);
  }

  private calculateContentOrganizationScore(content: string): number {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    let score = 0;

    // Check paragraph count (25 points)
    if (paragraphs.length >= 3 && paragraphs.length <= 20) {
      score += 25;
    }

    // Check paragraph length consistency (25 points)
    const paragraphLengths = paragraphs.map(p => p.split(' ').length);
    const avgLength = paragraphLengths.reduce((sum, len) => sum + len, 0) / paragraphLengths.length;
    const variance = paragraphLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / paragraphLengths.length;
    
    if (variance < avgLength * 0.5) {
      score += 25;
    }

    // Check for logical flow (25 points)
    const sentences = this.sentenceTokenizer.tokenize(content);
    const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'consequently'];
    const transitionCount = sentences.filter(sentence => 
      transitionWords.some(word => sentence.toLowerCase().includes(word))
    ).length;
    
    if (transitionCount >= sentences.length * 0.1) {
      score += 25;
    }

    // Check for clear sections (25 points)
    const headings = this.headingOptimizer.extractHeadings(content);
    if (headings.length >= 3) {
      score += 25;
    }

    return Math.min(100, score);
  }

  private calculateContentFlowScore(content: string): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    let score = 0;

    // Check sentence variety (40 points)
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    const hasVariety = sentenceLengths.some(len => len < avgLength * 0.7) && 
                      sentenceLengths.some(len => len > avgLength * 1.3);
    
    if (hasVariety) {
      score += 40;
    }

    // Check for smooth transitions (30 points)
    const transitionWords = ['first', 'next', 'then', 'finally', 'however', 'therefore', 'furthermore'];
    const transitionCount = sentences.filter(sentence => 
      transitionWords.some(word => sentence.toLowerCase().includes(word))
    ).length;
    
    if (transitionCount >= sentences.length * 0.15) {
      score += 30;
    }

    // Check for coherent structure (30 points)
    const paragraphs = content.split('\n\n');
    const coherentParagraphs = paragraphs.filter(p => p.trim().length > 100);
    
    if (coherentParagraphs.length >= paragraphs.length * 0.8) {
      score += 30;
    }

    return Math.min(100, score);
  }

  private calculateLogicalStructureScore(content: string): number {
    let score = 0;

    // Check for introduction (25 points)
    const paragraphs = content.split('\n\n');
    const firstParagraph = paragraphs[0] || '';
    if (firstParagraph.length > 100) {
      score += 25;
    }

    // Check for conclusion (25 points)
    const lastParagraph = paragraphs[paragraphs.length - 1] || '';
    if (lastParagraph.length > 100) {
      score += 25;
    }

    // Check for body development (25 points)
    if (paragraphs.length >= 5) {
      score += 25;
    }

    // Check for topic sentences (25 points)
    const topicSentences = paragraphs.filter(p => {
      const sentences = this.sentenceTokenizer.tokenize(p);
      return sentences.length > 0 && sentences[0].split(' ').length > 10;
    });
    
    if (topicSentences.length >= paragraphs.length * 0.6) {
      score += 25;
    }

    return Math.min(100, score);
  }

  private calculateSentenceLengthScore(content: string): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    
    // Optimal sentence length is 15-20 words
    const optimalRange = avgLength >= 15 && avgLength <= 20;
    
    return optimalRange ? 100 : Math.max(0, 100 - Math.abs(avgLength - 17.5) * 5);
  }

  private calculateWordComplexityScore(content: string): number {
    const words = this.wordTokenizer.tokenize(content);
    const complexWords = words.filter(word => word.length > 6);
    const complexityRatio = complexWords.length / words.length;
    
    // Optimal complexity ratio is 10-20%
    const optimalRange = complexityRatio >= 0.1 && complexityRatio <= 0.2;
    
    return optimalRange ? 100 : Math.max(0, 100 - Math.abs(complexityRatio - 0.15) * 500);
  }

  private calculateParagraphStructureScore(content: string): number {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const paragraphLengths = paragraphs.map(p => p.split(' ').length);
    const avgLength = paragraphLengths.reduce((sum, len) => sum + len, 0) / paragraphLengths.length;
    
    // Optimal paragraph length is 50-150 words
    const optimalRange = avgLength >= 50 && avgLength <= 150;
    
    return optimalRange ? 100 : Math.max(0, 100 - Math.abs(avgLength - 100) * 2);
  }

  private calculateReadabilityMetrics(content: string): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const words = this.wordTokenizer.tokenize(content);
    
    // Simple readability score based on sentence and word length
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Flesch Reading Ease approximation
    const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength / 5);
    
    return Math.min(100, Math.max(0, readabilityScore));
  }

  private calculateContentLengthScore(content: string): number {
    const wordCount = this.wordTokenizer.tokenize(content).length;
    
    // Optimal content length is 1000-2500 words
    if (wordCount >= 1000 && wordCount <= 2500) {
      return 100;
    } else if (wordCount >= 500 && wordCount < 1000) {
      return 75;
    } else if (wordCount >= 300 && wordCount < 500) {
      return 50;
    } else {
      return 25;
    }
  }

  private calculateMetaInformationScore(content: string): number {
    let score = 0;
    
    // Check for meta description patterns
    if (content.includes('meta') || content.includes('description')) {
      score += 25;
    }
    
    // Check for title optimization
    if (content.includes('title') || content.includes('heading')) {
      score += 25;
    }
    
    // Check for alt text references
    if (content.includes('alt') || content.includes('image')) {
      score += 25;
    }
    
    // Check for structured data
    if (content.includes('schema') || content.includes('structured')) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  private calculateInternalLinkingScore(content: string): number {
    const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const wordCount = this.wordTokenizer.tokenize(content).length;
    
    // Optimal linking ratio is 1-3 links per 100 words
    const linkRatio = (linkMatches.length / wordCount) * 100;
    
    if (linkRatio >= 1 && linkRatio <= 3) {
      return 100;
    } else {
      return Math.max(0, 100 - Math.abs(linkRatio - 2) * 25);
    }
  }

  private calculateSchemaScore(content: string): number {
    // Simple schema detection
    const schemaIndicators = ['schema', 'structured', 'json-ld', 'microdata'];
    let score = 0;
    
    schemaIndicators.forEach(indicator => {
      if (content.toLowerCase().includes(indicator)) {
        score += 25;
      }
    });
    
    return Math.min(100, score);
  }

  private calculateEngagementScore(content: string): number {
    let score = 0;
    
    // Check for engaging elements
    const engagingElements = ['question', 'example', 'story', 'case study', 'tip'];
    engagingElements.forEach(element => {
      if (content.toLowerCase().includes(element)) {
        score += 20;
      }
    });
    
    return Math.min(100, score);
  }

  private calculateAccessibilityScore(content: string): number {
    let score = 0;
    
    // Check for accessibility features
    const accessibilityFeatures = ['alt', 'aria', 'heading', 'list', 'table'];
    accessibilityFeatures.forEach(feature => {
      if (content.toLowerCase().includes(feature)) {
        score += 20;
      }
    });
    
    return Math.min(100, score);
  }

  private calculateMobileOptimizationScore(content: string): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    // Shorter sentences are better for mobile
    return avgSentenceLength <= 20 ? 100 : Math.max(0, 100 - (avgSentenceLength - 20) * 5);
  }

  private calculatePageSpeedScore(content: string): number {
    const contentSize = content.length;
    
    // Smaller content loads faster
    if (contentSize <= 10000) {
      return 100;
    } else if (contentSize <= 20000) {
      return 80;
    } else if (contentSize <= 30000) {
      return 60;
    } else {
      return 40;
    }
  }

  private calculateTopicAlignmentScore(content: string, competitorData: any): number {
    // Simplified topic alignment calculation
    return 85; // Default score
  }

  private calculateStructureAlignmentScore(content: string, competitorData: any): number {
    // Simplified structure alignment calculation
    return 80; // Default score
  }

  private calculateContentDepthScore(content: string, competitorData: any): number {
    const wordCount = this.wordTokenizer.tokenize(content).length;
    const competitorAverage = competitorData?.averageWordCount || 1500;
    
    // Score based on comparison to competitor average
    const ratio = wordCount / competitorAverage;
    if (ratio >= 0.8 && ratio <= 1.2) {
      return 100;
    } else {
      return Math.max(0, 100 - Math.abs(ratio - 1) * 100);
    }
  }

  private calculateCompetitiveAdvantageScore(content: string, competitorData: any): number {
    // Simplified competitive advantage calculation
    return 75; // Default score
  }

  private calculateLSICoverage(content: string, keyword: string): number {
    // Simplified LSI coverage calculation
    return 0.8; // 80% coverage
  }

  private calculateEntityUsage(content: string): number {
    const entities = this.entityOptimizer.extractEntitiesFromContent(content);
    return entities.length / 10; // Normalize to 0-1 scale
  }

  private calculateHeadingOptimization(content: string, keyword: string): number {
    const headings = this.headingOptimizer.extractHeadings(content);
    const keywordHeadings = headings.filter(h => 
      h.text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return headings.length > 0 ? keywordHeadings.length / headings.length : 0;
  }

  private calculateCompetitorGap(content: string, competitorData: any): number {
    // Simplified competitor gap calculation
    return 0.2; // 20% gap
  }

  private calculateConsistencyScore(score: SEOScoreComponents): number {
    const scores = [
      score.keywordOptimization,
      score.contentStructure,
      score.readability,
      score.technicalSEO,
      score.userExperience,
      score.competitorAlignment,
      score.intentAlignment
    ];
    
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / scores.length;
    
    return Math.max(0, 1 - variance / 1000);
  }

  private calculatePrecisionScore(validation: ValidationResult): number {
    const totalIssues = validation.criticalIssues.length + validation.optimizationGaps.length;
    return Math.max(0, 1 - totalIssues / 10);
  }
}
