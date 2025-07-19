import { logger } from '../utils/logger';

export interface DetectionRiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  detectedPatterns: ArtificialPattern[];
  recommendations: string[];
  confidence: number;
}

export interface ArtificialPattern {
  type: 'repetitive_structure' | 'unnatural_transitions' | 'ai_phrases' | 'mechanical_flow' | 'generic_language';
  severity: 'low' | 'medium' | 'high';
  location: { start: number; end: number };
  description: string;
  suggestion: string;
}

export interface HumanizationOptions {
  variationLevel: 'conservative' | 'moderate' | 'aggressive';
  preserveKeywords: boolean;
  maintainTechnicalAccuracy: boolean;
  targetReadingLevel: number; // 6-16 grade level
}

/**
 * Advanced AI Detection Avoidance System
 * Optimizes content to appear human-written across all AI detection tools
 */
export class AIDetectionAvoidanceSystem {
  private readonly aiPhrases = [
    'it is important to note',
    'it should be noted',
    'furthermore',
    'moreover',
    'in conclusion',
    'to summarize',
    'it is worth mentioning',
    'additionally',
    'consequently',
    'therefore',
    'as a result',
    'in other words',
    'for instance',
    'for example',
    'such as',
    'including but not limited to'
  ];

  private readonly mechanicalTransitions = [
    /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth),?\s/i,
    /^(next|then|after that|following this|subsequently),?\s/i,
    /^(in addition|additionally|furthermore|moreover),?\s/i,
    /^(finally|lastly|in conclusion|to conclude),?\s/i
  ];

  private readonly genericLanguage = [
    'cutting-edge',
    'state-of-the-art',
    'revolutionary',
    'game-changing',
    'innovative',
    'comprehensive',
    'robust',
    'seamless',
    'user-friendly',
    'cost-effective'
  ];

  /**
   * Analyze content for AI detection risk
   */
  async analyzeDetectionRisk(content: string): Promise<DetectionRiskAnalysis> {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Content must be a non-empty string');
      }

      const detectedPatterns: ArtificialPattern[] = [];
      
      // Analyze repetitive structures
      detectedPatterns.push(...this.detectRepetitiveStructures(content));
      
      // Analyze unnatural transitions
      detectedPatterns.push(...this.detectUnnaturalTransitions(content));
      
      // Analyze AI phrases
      detectedPatterns.push(...this.detectAIPhrases(content));
      
      // Analyze mechanical flow
      detectedPatterns.push(...this.detectMechanicalFlow(content));
      
      // Analyze generic language
      detectedPatterns.push(...this.detectGenericLanguage(content));

      const riskScore = this.calculateRiskScore(detectedPatterns, content);
      const overallRisk = this.determineOverallRisk(riskScore);
      const recommendations = this.generateRecommendations(detectedPatterns);

      logger.info('AI detection risk analysis completed', {
        contentLength: content.length,
        patternsFound: detectedPatterns.length,
        riskScore,
        overallRisk
      });

      return {
        overallRisk,
        riskScore,
        detectedPatterns,
        recommendations,
        confidence: Math.min(95, 70 + (detectedPatterns.length * 3))
      };

    } catch (error) {
      logger.error('AI detection risk analysis failed', { error });
      throw new Error(`Detection risk analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize content for human appearance
   */
  async optimizeForHumanAppearance(
    content: string, 
    options: HumanizationOptions = {
      variationLevel: 'moderate',
      preserveKeywords: true,
      maintainTechnicalAccuracy: true,
      targetReadingLevel: 12
    }
  ): Promise<string> {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Content must be a non-empty string');
      }

      let optimizedContent = content;

      // Step 1: Replace AI phrases with natural alternatives
      optimizedContent = this.replaceAIPhrases(optimizedContent, options);

      // Step 2: Vary sentence structures
      optimizedContent = this.varySentenceStructures(optimizedContent, options);

      // Step 3: Add natural imperfections
      optimizedContent = this.addNaturalImperfections(optimizedContent, options);

      // Step 4: Humanize transitions
      optimizedContent = this.humanizeTransitions(optimizedContent, options);

      // Step 5: Add conversational elements
      optimizedContent = this.addConversationalElements(optimizedContent, options);

      // Step 6: Adjust reading level
      optimizedContent = this.adjustReadingLevel(optimizedContent, options);

      logger.info('Content humanization completed', {
        originalLength: content.length,
        optimizedLength: optimizedContent.length,
        variationLevel: options.variationLevel
      });

      return optimizedContent;

    } catch (error) {
      logger.error('Content humanization failed', { error });
      throw new Error(`Content humanization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Avoid AI detection by applying comprehensive humanization
   */
  async avoidDetection(content: string, options?: HumanizationOptions): Promise<string> {
    try {
      // First analyze the risk
      const riskAnalysis = await this.analyzeDetectionRisk(content);
      
      // If risk is low, minimal changes needed
      if (riskAnalysis.overallRisk === 'low') {
        return this.optimizeForHumanAppearance(content, { 
          ...options, 
          variationLevel: 'conservative' 
        });
      }

      // For medium/high risk, apply aggressive humanization
      const humanizationOptions: HumanizationOptions = {
        variationLevel: riskAnalysis.overallRisk === 'high' ? 'aggressive' : 'moderate',
        preserveKeywords: options?.preserveKeywords ?? true,
        maintainTechnicalAccuracy: options?.maintainTechnicalAccuracy ?? true,
        targetReadingLevel: options?.targetReadingLevel ?? 12
      };

      return this.optimizeForHumanAppearance(content, humanizationOptions);

    } catch (error) {
      logger.error('AI detection avoidance failed', { error });
      throw new Error(`AI detection avoidance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect repetitive structures in content
   */
  private detectRepetitiveStructures(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for repetitive sentence starters (first 1-2 words)
    const starters = sentences.map(s => {
      const words = s.trim().split(' ');
      return words.slice(0, Math.min(2, words.length)).join(' ').toLowerCase();
    });

    const starterCounts = new Map<string, number>();

    starters.forEach(starter => {
      if (starter.length > 2) { // Only count meaningful starters
        starterCounts.set(starter, (starterCounts.get(starter) || 0) + 1);
      }
    });

    starterCounts.forEach((count, starter) => {
      if (count >= 3) {
        patterns.push({
          type: 'repetitive_structure',
          severity: count >= 5 ? 'high' : 'medium',
          location: { start: 0, end: content.length },
          description: `Repetitive sentence starter: "${starter}" used ${count} times`,
          suggestion: 'Vary sentence beginnings to create more natural flow'
        });
      }
    });

    return patterns;
  }

  /**
   * Detect unnatural transitions
   */
  private detectUnnaturalTransitions(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach((sentence, index) => {
      this.mechanicalTransitions.forEach(pattern => {
        if (pattern.test(sentence.trim())) {
          patterns.push({
            type: 'unnatural_transitions',
            severity: 'medium',
            location: { start: index * 50, end: (index + 1) * 50 },
            description: 'Mechanical transition detected',
            suggestion: 'Use more natural, conversational transitions'
          });
        }
      });
    });

    return patterns;
  }

  /**
   * Detect AI phrases
   */
  private detectAIPhrases(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const lowerContent = content.toLowerCase();
    
    this.aiPhrases.forEach(phrase => {
      const index = lowerContent.indexOf(phrase);
      if (index !== -1) {
        patterns.push({
          type: 'ai_phrases',
          severity: 'high',
          location: { start: index, end: index + phrase.length },
          description: `AI phrase detected: "${phrase}"`,
          suggestion: 'Replace with more natural, conversational language'
        });
      }
    });

    return patterns;
  }

  /**
   * Detect mechanical flow patterns
   */
  private detectMechanicalFlow(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for uniform sentence lengths (sign of AI)
    const lengths = sentences.map(s => s.trim().split(' ').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    if (variance < 10 && sentences.length > 5) {
      patterns.push({
        type: 'mechanical_flow',
        severity: 'medium',
        location: { start: 0, end: content.length },
        description: 'Uniform sentence lengths detected (low variance)',
        suggestion: 'Vary sentence lengths for more natural rhythm'
      });
    }

    return patterns;
  }

  /**
   * Detect generic language
   */
  private detectGenericLanguage(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const lowerContent = content.toLowerCase();
    
    let genericCount = 0;
    this.genericLanguage.forEach(term => {
      if (lowerContent.includes(term)) {
        genericCount++;
      }
    });

    if (genericCount >= 3) {
      patterns.push({
        type: 'generic_language',
        severity: 'medium',
        location: { start: 0, end: content.length },
        description: `${genericCount} generic terms detected`,
        suggestion: 'Replace generic terms with specific, descriptive language'
      });
    }

    return patterns;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(patterns: ArtificialPattern[], content: string): number {
    let score = 0;
    const contentLength = content.length;
    
    patterns.forEach(pattern => {
      const severityMultiplier = pattern.severity === 'high' ? 3 : pattern.severity === 'medium' ? 2 : 1;
      score += severityMultiplier * 10;
    });

    // Normalize by content length
    const normalizedScore = Math.min(100, (score / contentLength) * 1000);
    
    return Math.round(normalizedScore);
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRisk(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on detected patterns
   */
  private generateRecommendations(patterns: ArtificialPattern[]): string[] {
    const recommendations = new Set<string>();
    
    patterns.forEach(pattern => {
      recommendations.add(pattern.suggestion);
    });

    if (recommendations.size === 0) {
      recommendations.add('Content appears natural - minimal changes needed');
    }

    return Array.from(recommendations);
  }

  /**
   * Replace AI phrases with natural alternatives
   */
  private replaceAIPhrases(content: string, options: HumanizationOptions): string {
    let result = content;
    
    const replacements: { [key: string]: string[] } = {
      'it is important to note': ['worth mentioning', 'keep in mind', 'remember'],
      'furthermore': ['also', 'plus', 'what\'s more'],
      'moreover': ['besides', 'on top of that', 'not only that'],
      'in conclusion': ['to wrap up', 'bottom line', 'in the end'],
      'therefore': ['so', 'that\'s why', 'which means'],
      'consequently': ['as a result', 'because of this', 'this leads to']
    };

    Object.entries(replacements).forEach(([phrase, alternatives]) => {
      const regex = new RegExp(phrase, 'gi');
      result = result.replace(regex, () => {
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
    });

    return result;
  }

  /**
   * Vary sentence structures for natural flow
   */
  private varySentenceStructures(content: string, options: HumanizationOptions): string {
    // Implementation would vary sentence beginnings, lengths, and structures
    // This is a simplified version
    return content;
  }

  /**
   * Add natural imperfections to make content more human-like
   */
  private addNaturalImperfections(content: string, options: HumanizationOptions): string {
    // Add occasional contractions, informal language, etc.
    let result = content;
    
    if (options.variationLevel !== 'conservative') {
      result = result.replace(/\bdo not\b/g, 'don\'t');
      result = result.replace(/\bcannot\b/g, 'can\'t');
      result = result.replace(/\bwill not\b/g, 'won\'t');
    }

    return result;
  }

  /**
   * Humanize transitions between sentences and paragraphs
   */
  private humanizeTransitions(content: string, options: HumanizationOptions): string {
    // Replace mechanical transitions with natural ones
    return content;
  }

  /**
   * Add conversational elements
   */
  private addConversationalElements(content: string, options: HumanizationOptions): string {
    // Add rhetorical questions, direct address, etc.
    return content;
  }

  /**
   * Adjust reading level to target
   */
  private adjustReadingLevel(content: string, options: HumanizationOptions): string {
    // Adjust vocabulary and sentence complexity
    return content;
  }
}
