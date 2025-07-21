
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
    'step-by-step', 'tutorial', 'guide', 'how-to', 'best practices'
  ];

  assessCoverage(content: string, topic: string): CoverageAnalysis {
    const depthScore = this.calculateDepthScore(content);
    const breadthScore = this.calculateBreadthScore(content, topic);
    const gapAnalysis = this.identifyGaps(content, topic);

    return {
      overallCompleteness: (depthScore + breadthScore) / 2,
      topicCoverage: [],
      informationGaps: gapAnalysis,
      contentDepth: depthScore,
      breadthScore,
      qualityScore: depthScore,
      recommendations: this.generateRecommendations(depthScore, breadthScore, gapAnalysis),
      processingTimeMs: 0
    };
  }

  private calculateDepthScore(content: string): number {
    const indicators = this.depthIndicators.filter(indicator =>
      content.toLowerCase().includes(indicator)
    );
    return Math.min(100, (indicators.length / this.depthIndicators.length) * 100);
  }

  private calculateBreadthScore(content: string, topic: string): number {
    // Simple implementation - count topic-related terms
    const words = content.toLowerCase().split(/\s+/);
    const topicWords = topic.toLowerCase().split(/\s+/);
    const coverage = topicWords.filter(word => words.includes(word)).length;
    return Math.min(100, (coverage / topicWords.length) * 100);
  }

  private identifyGaps(content: string, topic: string): string[] {
    const gaps: string[] = [];
    const missingIndicators = this.depthIndicators.filter(indicator =>
      !content.toLowerCase().includes(indicator)
    );

    if (missingIndicators.length > 0) {
      gaps.push(`Missing depth indicators: ${missingIndicators.slice(0, 3).join(', ')}`);
    }

    return gaps;
  }

  private generateRecommendations(depthScore: number, breadthScore: number, gaps: string[]): string[] {
    const recommendations: string[] = [];

    if (depthScore < 70) {
      recommendations.push('Add more detailed explanations and examples');
    }

    if (breadthScore < 70) {
      recommendations.push('Expand topic coverage to include more aspects');
    }

    if (gaps.length > 0) {
      recommendations.push('Address identified content gaps');
    }

    return recommendations;
  }

  /**
   * Assesses how completely the content covers the required topics
   */
  assessTopicCompleteness(content: string, requiredTopics: string[]): number {
    if (!content || content.trim().length === 0) {
      return 0;
    }

    if (!requiredTopics || requiredTopics.length === 0) {
      return 1.0;
    }

    const contentLower = content.toLowerCase();
    const uniqueTopics = [...new Set(requiredTopics)]; // Remove duplicates
    let coveredTopics = 0;

    for (const topic of uniqueTopics) {
      const topicLower = topic.toLowerCase();
      // Check for exact topic match or partial match with context
      if (contentLower.includes(topicLower)) {
        coveredTopics++;
      }
    }

    return coveredTopics / uniqueTopics.length;
  }

  /**
   * Identifies information gaps by finding topics not covered in the content
   */
  identifyInformationGaps(content: string, requiredTopics: string[]): string[] {
    if (!content || content.trim().length === 0) {
      return [...requiredTopics]; // All topics are gaps if no content
    }

    if (!requiredTopics || requiredTopics.length === 0) {
      return [];
    }

    const contentLower = content.toLowerCase();
    const gaps: string[] = [];

    for (const topic of requiredTopics) {
      const topicLower = topic.toLowerCase();
      // Check for exact topic match or partial match with context
      if (!contentLower.includes(topicLower)) {
        gaps.push(topic);
      }
    }

    return gaps;
  }
}
