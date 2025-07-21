export interface HallucinationDetectionResult {
  hallucinationsDetected: boolean;
  hallucinationScore: number; // 0-100, higher means more likely to be hallucinated
  flaggedSentences: HallucinationFlag[];
  recommendations: string[];
  confidenceThreshold: number;
  detectionMethods: string[];
  processingTimeMs: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface HallucinationFlag {
  sentence: string;
  reason: string;
  confidence: number; // 0-100
  detectionMethod: string;
  suggestedFix?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HallucinationDetectionConfig {
  enableCrossReferenceValidation: boolean;
  enableLogicalConsistencyCheck: boolean;
  enableConfidenceScoreAnalysis: boolean;
  enablePatternRecognition: boolean;
  enableContextualAnalysis: boolean;
  confidenceThreshold: number; // 0-100
  strictMode: boolean;
  knowledgeBase: Map<string, any>;
}

export class HallucinationDetector {
  private config: HallucinationDetectionConfig;
  private knowledgePatterns: Map<string, RegExp>;
  private suspiciousPatterns: RegExp[];

  constructor(config: Partial<HallucinationDetectionConfig> = {}) {
    this.config = {
      enableCrossReferenceValidation: true,
      enableLogicalConsistencyCheck: true,
      enableConfidenceScoreAnalysis: true,
      enablePatternRecognition: true,
      enableContextualAnalysis: true,
      confidenceThreshold: 70,
      strictMode: false,
      knowledgeBase: new Map(),
      ...config
    };

    this.initializePatterns();
  }

  /**
   * Advanced hallucination detection using multiple algorithms and cross-referencing
   */
  detectHallucinations(
    content: string,
    factVerificationResults: Array<{ fact: string; isVerified: boolean; confidenceScore: number }> = []
  ): HallucinationDetectionResult {
    const startTime = performance.now();
    const flaggedSentences: HallucinationFlag[] = [];
    const recommendations: string[] = [];
    const detectionMethods: string[] = [];

    const sentences = this.extractSentences(content);

    // Method 1: Cross-reference validation against fact verification results
    if (this.config.enableCrossReferenceValidation && factVerificationResults.length > 0) {
      detectionMethods.push('cross_reference_validation');
      this.detectUnverifiedFacts(sentences, factVerificationResults, flaggedSentences);
    }

    // Method 2: Logical consistency checking
    if (this.config.enableLogicalConsistencyCheck) {
      detectionMethods.push('logical_consistency');
      this.detectLogicalInconsistencies(sentences, flaggedSentences);
    }

    // Method 3: Confidence score analysis
    if (this.config.enableConfidenceScoreAnalysis) {
      detectionMethods.push('confidence_analysis');
      this.analyzeConfidencePatterns(sentences, flaggedSentences);
    }

    // Method 4: Pattern recognition for common hallucination indicators
    if (this.config.enablePatternRecognition) {
      detectionMethods.push('pattern_recognition');
      this.detectSuspiciousPatterns(sentences, flaggedSentences);
    }

    // Method 5: Contextual analysis
    if (this.config.enableContextualAnalysis) {
      detectionMethods.push('contextual_analysis');
      this.analyzeContextualCoherence(content, sentences, flaggedSentences);
    }

    // Calculate overall hallucination score
    const hallucinationScore = this.calculateHallucinationScore(flaggedSentences, sentences.length);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(hallucinationScore);

    // Generate recommendations
    this.generateRecommendations(flaggedSentences, recommendations);

    const processingTimeMs = performance.now() - startTime;

    return {
      hallucinationsDetected: flaggedSentences.length > 0,
      hallucinationScore,
      flaggedSentences,
      recommendations,
      confidenceThreshold: this.config.confidenceThreshold,
      detectionMethods,
      processingTimeMs,
      riskLevel
    };
  }

  private initializePatterns(): void {
    this.knowledgePatterns = new Map([
      ['statistics', /\b\d+(?:\.\d+)?%\b|\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|trillion|thousand)\b/gi],
      ['dates', /\b(?:19|20)\d{2}\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4}\b/gi],
      ['scientific_claims', /\b(?:study|research|analysis|experiment|trial)\s+(?:shows?|indicates?|proves?|demonstrates?|reveals?)\b/gi],
      ['definitive_statements', /\b(?:always|never|all|none|every|completely|totally|absolutely|definitely|certainly)\b/gi]
    ]);

    this.suspiciousPatterns = [
      /\b(?:studies show|research indicates|experts say|data reveals)\s+(?:that\s+)?\d+%/gi,
      /\b(?:proven fact|scientific fact|undeniable truth|absolute certainty)\b/gi,
      /\b(?:impossible|never fails|100% guaranteed|always works|perfect solution)\b/gi,
      /\b(?:secret|hidden|they don't want you to know|breakthrough discovery)\b/gi
    ];
  }

  private extractSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short fragments
  }

  private detectUnverifiedFacts(
    sentences: string[],
    factVerificationResults: Array<{ fact: string; isVerified: boolean; confidenceScore: number }>,
    flaggedSentences: HallucinationFlag[]
  ): void {
    factVerificationResults.forEach(result => {
      if (!result.isVerified || result.confidenceScore < this.config.confidenceThreshold) {
        const sentenceContainingFact = sentences.find(s => s.toLowerCase().includes(result.fact.toLowerCase()));
        if (sentenceContainingFact) {
          const confidence = 100 - result.confidenceScore;
          flaggedSentences.push({
            sentence: sentenceContainingFact,
            reason: `Contains unverified fact: "${result.fact}"`,
            confidence,
            detectionMethod: 'cross_reference_validation',
            suggestedFix: `Verify the claim "${result.fact}" with authoritative sources`,
            severity: confidence > 80 ? 'critical' : confidence > 60 ? 'high' : 'medium'
          });
        }
      }
    });
  }

  private detectLogicalInconsistencies(sentences: string[], flaggedSentences: HallucinationFlag[]): void {
    // Check for contradictory statements within the content
    const contradictionPairs = [
      { positive: /\b(?:increases?|grows?|rises?|improves?)\b/gi, negative: /\b(?:decreases?|shrinks?|falls?|worsens?)\b/gi },
      { positive: /\b(?:safe|secure|protected)\b/gi, negative: /\b(?:dangerous|risky|vulnerable)\b/gi },
      { positive: /\b(?:easy|simple|straightforward)\b/gi, negative: /\b(?:difficult|complex|complicated)\b/gi }
    ];

    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const sentence1 = sentences[i].toLowerCase();
        const sentence2 = sentences[j].toLowerCase();

        contradictionPairs.forEach(pair => {
          if (pair.positive.test(sentence1) && pair.negative.test(sentence2) ||
              pair.negative.test(sentence1) && pair.positive.test(sentence2)) {
            // Check if they're talking about the same subject
            const commonWords = this.findCommonSubjects(sentence1, sentence2);
            if (commonWords.length > 0) {
              flaggedSentences.push({
                sentence: sentences[i],
                reason: `Potential logical inconsistency with: "${sentences[j]}"`,
                confidence: 60,
                detectionMethod: 'logical_consistency',
                suggestedFix: 'Review for contradictory statements and clarify context',
                severity: 'medium'
              });
            }
          }
        });
      }
    }
  }

  private analyzeConfidencePatterns(sentences: string[], flaggedSentences: HallucinationFlag[]): void {
    const overconfidentPatterns = [
      { pattern: /\b(?:undoubtedly|without a doubt|certainly|definitely|absolutely|unquestionably)\b/gi, weight: 15 },
      { pattern: /\b(?:proven fact|scientific fact|established truth|undeniable)\b/gi, weight: 20 },
      { pattern: /\b(?:always|never|all|none|every single|completely|totally)\b/gi, weight: 10 }
    ];

    sentences.forEach(sentence => {
      let confidenceScore = 0;
      const matchedPatterns: string[] = [];

      overconfidentPatterns.forEach(({ pattern, weight }) => {
        const matches = sentence.match(pattern);
        if (matches) {
          confidenceScore += weight * matches.length;
          matchedPatterns.push(...matches);
        }
      });

      if (confidenceScore > 20) {
        flaggedSentences.push({
          sentence,
          reason: `Overly confident language detected: ${matchedPatterns.join(', ')}`,
          confidence: Math.min(95, confidenceScore * 2),
          detectionMethod: 'confidence_analysis',
          suggestedFix: 'Consider using more nuanced language with appropriate qualifiers',
          severity: confidenceScore > 40 ? 'high' : 'medium'
        });
      }
    });
  }

  private detectSuspiciousPatterns(sentences: string[], flaggedSentences: HallucinationFlag[]): void {
    sentences.forEach(sentence => {
      this.suspiciousPatterns.forEach((pattern, index) => {
        const matches = sentence.match(pattern);
        if (matches) {
          const confidence = 70 + (index * 5); // Different patterns have different confidence levels
          flaggedSentences.push({
            sentence,
            reason: `Suspicious pattern detected: ${matches[0]}`,
            confidence,
            detectionMethod: 'pattern_recognition',
            suggestedFix: 'Verify claims and provide specific sources',
            severity: confidence > 85 ? 'high' : 'medium'
          });
        }
      });
    });
  }

  private analyzeContextualCoherence(content: string, sentences: string[], flaggedSentences: HallucinationFlag[]): void {
    // Check for topic drift or unrelated information
    const topics = this.extractTopics(content);
    const mainTopic = topics[0]; // Assume first/most frequent topic is main topic

    sentences.forEach(sentence => {
      const sentenceTopics = this.extractTopics(sentence);
      const relevanceScore = this.calculateTopicRelevance(sentenceTopics, mainTopic);

      if (relevanceScore < 0.3 && sentence.length > 50) { // Low relevance for substantial sentences
        flaggedSentences.push({
          sentence,
          reason: 'Content appears unrelated to main topic',
          confidence: 50,
          detectionMethod: 'contextual_analysis',
          suggestedFix: 'Ensure all content relates to the main topic or provide clear transitions',
          severity: 'low'
        });
      }
    });
  }

  private findCommonSubjects(sentence1: string, sentence2: string): string[] {
    const words1 = sentence1.split(/\s+/).filter(w => w.length > 3);
    const words2 = sentence2.split(/\s+/).filter(w => w.length > 3);
    return words1.filter(word => words2.includes(word));
  }

  private extractTopics(text: string): string[] {
    // Simplified topic extraction - in production, use proper NLP libraries
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency = new Map<string, number>();

    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private calculateTopicRelevance(sentenceTopics: string[], mainTopic: string): number {
    if (!mainTopic || sentenceTopics.length === 0) return 0.5;

    const relevantTopics = sentenceTopics.filter(topic =>
      topic.includes(mainTopic) || mainTopic.includes(topic)
    );

    return relevantTopics.length / sentenceTopics.length;
  }

  private calculateHallucinationScore(flaggedSentences: HallucinationFlag[], totalSentences: number): number {
    if (flaggedSentences.length === 0) return 0;

    const weightedScore = flaggedSentences.reduce((sum, flag) => {
      const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
      return sum + (flag.confidence * severityWeight[flag.severity]);
    }, 0);

    const averageScore = weightedScore / flaggedSentences.length;
    const densityPenalty = (flaggedSentences.length / totalSentences) * 20;

    return Math.min(100, Math.round(averageScore + densityPenalty));
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private generateRecommendations(flaggedSentences: HallucinationFlag[], recommendations: string[]): void {
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };

    flaggedSentences.forEach(flag => {
      severityCounts[flag.severity]++;
    });

    if (severityCounts.critical > 0) {
      recommendations.push('URGENT: Critical hallucination indicators detected. Immediate expert review required.');
    }

    if (severityCounts.high > 0) {
      recommendations.push('High-risk content detected. Comprehensive fact-checking recommended.');
    }

    if (severityCounts.medium > 2) {
      recommendations.push('Multiple medium-risk indicators. Consider additional verification steps.');
    }

    if (flaggedSentences.length > 0) {
      recommendations.push('Review flagged sentences and verify claims with authoritative sources.');
      recommendations.push('Consider adding proper citations and qualifying language where appropriate.');
    }
  }
}