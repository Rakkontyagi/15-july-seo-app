
import { detectRepetitivePhrases } from './patterns/repetitive-phrases';
import { analyzeSentenceStructure } from './patterns/sentence-structure';
import { identifyPredictablePatterns } from './patterns/predictable-patterns';
import { loadAITypicalPhrases } from './data/ai-typical-phrases';
import { AIPatternAnalysis } from '../../types/content-analysis';

/**
 * Advanced AI Pattern Detector for identifying AI-generated content patterns
 * Implements comprehensive analysis across multiple dimensions
 */
export class AIPatternDetector {
  private aiTypicalPhrases: Set<string>;
  private readonly RISK_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8
  };

  constructor() {
    this.aiTypicalPhrases = loadAITypicalPhrases();
  }

  /**
   * Performs comprehensive AI pattern analysis on content
   */
  analyze(content: string): AIPatternAnalysis {
    if (!content || content.trim().length === 0) {
      return this.getEmptyAnalysis();
    }

    const repetitivePhrases = detectRepetitivePhrases(content);
    const sentenceStructurePatterns = analyzeSentenceStructure(content);
    const predictableWritingPatterns = identifyPredictablePatterns(content);
    const aiTypicalPhraseCount = this.countAITypicalPhrases(content);
    const patternFrequencyScore = this.calculatePatternFrequencyScore(
      content,
      repetitivePhrases,
      aiTypicalPhraseCount
    );
    const overallRiskScore = this.calculateOverallRiskScore(
      repetitivePhrases,
      sentenceStructurePatterns,
      predictableWritingPatterns,
      aiTypicalPhraseCount,
      content
    );

    return {
      repetitivePhrases,
      sentenceStructurePatterns,
      predictableWritingPatterns,
      aiTypicalPhraseCount,
      patternFrequencyScore,
      overallRiskScore
    };
  }

  private countAITypicalPhrases(content: string): number {
    const lowerContent = content.toLowerCase();
    let count = 0;

    this.aiTypicalPhrases.forEach(phrase => {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        count += matches.length;
      }
    });

    return count;
  }

  private calculatePatternFrequencyScore(
    content: string,
    repetitivePhrases: any[],
    aiTypicalPhraseCount: number
  ): number {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;

    if (totalWords === 0) return 0;

    // Calculate different pattern densities
    const repetitivePhraseDensity = (repetitivePhrases.length / totalWords) * 100;
    const aiTypicalPhraseDensity = (aiTypicalPhraseCount / totalWords) * 100;

    // Weight the scores based on severity
    const weightedRepetitiveScore = repetitivePhrases.reduce((score, phrase) => {
      const severityMultiplier = phrase.severity === 'high' ? 3 : phrase.severity === 'medium' ? 2 : 1;
      return score + (phrase.count * severityMultiplier);
    }, 0) / totalWords * 100;

    // Combine scores with appropriate weights
    return Math.min(
      (weightedRepetitiveScore * 0.4 + aiTypicalPhraseDensity * 0.6),
      100
    );
  }

  private calculateOverallRiskScore(
    repetitivePhrases: any[],
    sentenceStructurePatterns: any[],
    predictableWritingPatterns: any[],
    aiTypicalPhraseCount: number,
    content: string
  ): number {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;

    if (totalWords === 0) return 0;

    // Calculate individual risk components
    const repetitiveRisk = this.calculateRepetitiveRisk(repetitivePhrases, totalWords);
    const structureRisk = this.calculateStructureRisk(sentenceStructurePatterns);
    const predictableRisk = this.calculatePredictableRisk(predictableWritingPatterns);
    const aiPhraseRisk = Math.min((aiTypicalPhraseCount / totalWords) * 1000, 1); // Cap at 1.0

    // Weight the different risk factors
    const weights = {
      repetitive: 0.25,
      structure: 0.25,
      predictable: 0.3,
      aiPhrase: 0.2
    };

    const overallRisk = (
      repetitiveRisk * weights.repetitive +
      structureRisk * weights.structure +
      predictableRisk * weights.predictable +
      aiPhraseRisk * weights.aiPhrase
    );

    return Math.min(overallRisk, 1);
  }

  private calculateRepetitiveRisk(repetitivePhrases: any[], totalWords: number): number {
    if (repetitivePhrases.length === 0) return 0;

    const highSeverityCount = repetitivePhrases.filter(p => p.severity === 'high').length;
    const mediumSeverityCount = repetitivePhrases.filter(p => p.severity === 'medium').length;
    const lowSeverityCount = repetitivePhrases.filter(p => p.severity === 'low').length;

    const weightedScore = (highSeverityCount * 3 + mediumSeverityCount * 2 + lowSeverityCount * 1) / totalWords;
    return Math.min(weightedScore * 100, 1);
  }

  private calculateStructureRisk(structurePatterns: any[]): number {
    if (structurePatterns.length === 0) return 0;

    const avgRiskLevel = structurePatterns.reduce((sum, pattern) => sum + pattern.riskLevel, 0) / structurePatterns.length;
    const patternCount = structurePatterns.length;

    // More patterns with higher risk levels = higher overall risk
    return Math.min(avgRiskLevel * (1 + patternCount * 0.1), 1);
  }

  private calculatePredictableRisk(predictablePatterns: any[]): number {
    if (predictablePatterns.length === 0) return 0;

    const avgConfidence = predictablePatterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / predictablePatterns.length;
    const patternCount = predictablePatterns.length;

    // More predictable patterns with higher confidence = higher risk
    return Math.min(avgConfidence * (1 + patternCount * 0.15), 1);
  }

  private getEmptyAnalysis(): AIPatternAnalysis {
    return {
      repetitivePhrases: [],
      sentenceStructurePatterns: [],
      predictableWritingPatterns: [],
      aiTypicalPhraseCount: 0,
      patternFrequencyScore: 0,
      overallRiskScore: 0
    };
  }

  /**
   * Get risk level description based on overall risk score
   */
  getRiskLevel(overallRiskScore: number): 'low' | 'medium' | 'high' {
    if (overallRiskScore >= this.RISK_THRESHOLDS.HIGH) return 'high';
    if (overallRiskScore >= this.RISK_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  /**
   * Get recommendations based on analysis results
   */
  getRecommendations(analysis: AIPatternAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.repetitivePhrases.length > 0) {
      recommendations.push('Reduce repetitive phrases and vary your language');
    }

    if (analysis.sentenceStructurePatterns.length > 0) {
      recommendations.push('Vary sentence structures and beginnings');
    }

    if (analysis.predictableWritingPatterns.length > 0) {
      recommendations.push('Replace predictable transitions and conclusions');
    }

    if (analysis.aiTypicalPhraseCount > 0) {
      recommendations.push('Remove or replace AI-typical phrases');
    }

    if (analysis.overallRiskScore > this.RISK_THRESHOLDS.MEDIUM) {
      recommendations.push('Add personal anecdotes and specific examples');
      recommendations.push('Include more conversational elements');
    }

    return recommendations;
  }
}
