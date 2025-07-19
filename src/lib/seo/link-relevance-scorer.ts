
import nlp from 'compromise';

export interface LinkRelevanceFactors {
  semanticSimilarity: number;
  topicalAuthority: number;
  keywordRelevance: number;
  contentQuality: number;
  contextualFit: number;
  userIntent: number;
}

export interface LinkScoringOptions {
  weights?: Partial<LinkRelevanceFactors>;
  minContentLength?: number;
  maxContentLength?: number;
  considerReadability?: boolean;
  analyzeEntities?: boolean;
}

export interface LinkRelevanceResult {
  overallScore: number;
  factors: LinkRelevanceFactors;
  confidence: number;
  recommendations: string[];
  riskAssessment: 'low' | 'medium' | 'high';
}

export interface TopicalAuthorityMetrics {
  contentDepth: number;
  expertiseIndicators: number;
  comprehensiveness: number;
  freshness: number;
}

/**
 * Advanced link relevance scoring system that prioritizes highest-value
 * internal linking opportunities based on topical authority, semantic similarity,
 * and contextual relevance using NLP and content analysis
 */
export class LinkRelevanceScorer {
  private readonly defaultWeights: LinkRelevanceFactors = {
    semanticSimilarity: 0.25,
    topicalAuthority: 0.20,
    keywordRelevance: 0.20,
    contentQuality: 0.15,
    contextualFit: 0.15,
    userIntent: 0.05
  };

  private readonly defaultOptions: Required<LinkScoringOptions> = {
    weights: this.defaultWeights,
    minContentLength: 300,
    maxContentLength: 10000,
    considerReadability: true,
    analyzeEntities: true
  };

  /**
   * Score link relevance with comprehensive analysis
   */
  scoreLinkRelevance(
    sourceContent: string,
    targetContent: string,
    linkText: string,
    options: LinkScoringOptions = {}
  ): LinkRelevanceResult {
    const opts = { ...this.defaultOptions, ...options };
    const weights = { ...this.defaultWeights, ...opts.weights };

    const factors = this.calculateAllFactors(sourceContent, targetContent, linkText, opts);
    const overallScore = this.calculateWeightedScore(factors, weights);
    const confidence = this.calculateConfidence(factors, sourceContent, targetContent);
    const recommendations = this.generateRecommendations(factors, overallScore);
    const riskAssessment = this.assessRisk(factors, overallScore);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      factors,
      confidence,
      recommendations,
      riskAssessment
    };
  }

  /**
   * Batch score multiple link opportunities
   */
  scoreMultipleLinks(
    sourceContent: string,
    linkOpportunities: Array<{ targetContent: string; linkText: string; url: string }>,
    options: LinkScoringOptions = {}
  ): Array<LinkRelevanceResult & { url: string; linkText: string }> {
    return linkOpportunities.map(opportunity => ({
      ...this.scoreLinkRelevance(sourceContent, opportunity.targetContent, opportunity.linkText, options),
      url: opportunity.url,
      linkText: opportunity.linkText
    })).sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Calculate all relevance factors
   */
  private calculateAllFactors(
    sourceContent: string,
    targetContent: string,
    linkText: string,
    options: Required<LinkScoringOptions>
  ): LinkRelevanceFactors {
    return {
      semanticSimilarity: this.calculateSemanticSimilarity(sourceContent, targetContent),
      topicalAuthority: this.calculateTopicalAuthority(targetContent),
      keywordRelevance: this.calculateKeywordRelevance(sourceContent, targetContent, linkText),
      contentQuality: this.calculateContentQuality(targetContent, options),
      contextualFit: this.calculateContextualFit(sourceContent, linkText),
      userIntent: this.calculateUserIntentAlignment(sourceContent, targetContent, linkText)
    };
  }

  /**
   * Calculate semantic similarity between source and target content
   */
  private calculateSemanticSimilarity(sourceContent: string, targetContent: string): number {
    const sourceDoc = nlp(sourceContent);
    const targetDoc = nlp(targetContent);

    // Extract key topics and entities
    const sourceTopics = sourceDoc.topics().out('array');
    const targetTopics = targetDoc.topics().out('array');
    const sourceEntities = sourceDoc.entities().out('array');
    const targetEntities = targetDoc.entities().out('array');

    // Calculate topic overlap
    const topicOverlap = this.calculateOverlap(sourceTopics, targetTopics);

    // Calculate entity overlap
    const entityOverlap = this.calculateOverlap(sourceEntities, targetEntities);

    // Calculate noun phrase similarity
    const sourceNouns = sourceDoc.nouns().out('array');
    const targetNouns = targetDoc.nouns().out('array');
    const nounOverlap = this.calculateOverlap(sourceNouns, targetNouns);

    // Weighted combination
    return (topicOverlap * 0.4 + entityOverlap * 0.35 + nounOverlap * 0.25);
  }

  /**
   * Calculate topical authority of target content
   */
  private calculateTopicalAuthority(targetContent: string): number {
    const metrics = this.analyzeTopicalAuthority(targetContent);

    // Weighted combination of authority metrics
    return (
      metrics.contentDepth * 0.3 +
      metrics.expertiseIndicators * 0.25 +
      metrics.comprehensiveness * 0.25 +
      metrics.freshness * 0.2
    );
  }

  /**
   * Analyze topical authority metrics
   */
  private analyzeTopicalAuthority(content: string): TopicalAuthorityMetrics {
    const doc = nlp(content);
    const wordCount = content.split(/\s+/).length;
    const sentences = doc.sentences().length;

    // Content depth based on structure and detail
    const headingCount = (content.match(/^#{1,6}\s/gm) || []).length;
    const listCount = (content.match(/^[\s]*[-*+]\s/gm) || []).length;
    const contentDepth = Math.min(1, (headingCount * 0.1 + listCount * 0.05 + wordCount / 2000));

    // Expertise indicators (technical terms, specific examples, data)
    const technicalTerms = this.countTechnicalTerms(content);
    const numbers = (content.match(/\b\d+(?:\.\d+)?%?\b/g) || []).length;
    const expertiseIndicators = Math.min(1, (technicalTerms * 0.02 + numbers * 0.01));

    // Comprehensiveness based on coverage breadth
    const uniqueTopics = doc.topics().out('array').length;
    const uniqueEntities = doc.entities().out('array').length;
    const comprehensiveness = Math.min(1, (uniqueTopics * 0.05 + uniqueEntities * 0.03));

    // Freshness (simplified - would need actual date analysis in production)
    const freshness = 0.8; // Placeholder - would analyze publication/update dates

    return {
      contentDepth,
      expertiseIndicators,
      comprehensiveness,
      freshness
    };
  }

  /**
   * Calculate keyword relevance between content and link text
   */
  private calculateKeywordRelevance(
    sourceContent: string,
    targetContent: string,
    linkText: string
  ): number {
    const linkWords = linkText.toLowerCase().split(/\s+/);
    const sourceWords = sourceContent.toLowerCase().split(/\s+/);
    const targetWords = targetContent.toLowerCase().split(/\s+/);

    // Direct keyword presence
    const sourceMatches = linkWords.filter(word => sourceWords.includes(word)).length;
    const targetMatches = linkWords.filter(word => targetWords.includes(word)).length;

    const directRelevance = (sourceMatches + targetMatches) / (linkWords.length * 2);

    // Semantic keyword variations
    const variations = this.generateKeywordVariations(linkText);
    const variationMatches = variations.filter(variation =>
      sourceContent.toLowerCase().includes(variation) ||
      targetContent.toLowerCase().includes(variation)
    ).length;

    const semanticRelevance = Math.min(1, variationMatches / variations.length);

    return (directRelevance * 0.7 + semanticRelevance * 0.3);
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(content: string, options: Required<LinkScoringOptions>): number {
    const wordCount = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Length appropriateness
    const lengthScore = this.calculateLengthScore(wordCount, options.minContentLength, options.maxContentLength);

    // Readability (simplified Flesch-Kincaid approximation)
    const readabilityScore = options.considerReadability ?
      this.calculateReadabilityScore(content, sentences, wordCount) : 0.8;

    // Structure quality
    const structureScore = this.calculateStructureScore(content);

    // Information density
    const densityScore = this.calculateInformationDensity(content);

    return (lengthScore * 0.25 + readabilityScore * 0.25 + structureScore * 0.25 + densityScore * 0.25);
  }

  /**
   * Calculate contextual fit of link text within source content
   */
  private calculateContextualFit(sourceContent: string, linkText: string): number {
    const linkWords = linkText.toLowerCase().split(/\s+/);
    const sentences = sourceContent.split(/[.!?]+/);

    let bestFit = 0;

    sentences.forEach(sentence => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const contextualWords = this.getContextualWords(sentence, linkText);
      const contextualRelevance = contextualWords.length / Math.max(1, sentenceWords.length);

      if (sentence.toLowerCase().includes(linkText.toLowerCase())) {
        const fit = 0.8 + (contextualRelevance * 0.2);
        bestFit = Math.max(bestFit, fit);
      } else {
        const wordMatches = linkWords.filter(word => sentenceWords.includes(word)).length;
        const fit = (wordMatches / linkWords.length) * 0.6 + (contextualRelevance * 0.4);
        bestFit = Math.max(bestFit, fit);
      }
    });

    return Math.min(1, bestFit);
  }

  /**
   * Calculate user intent alignment
   */
  private calculateUserIntentAlignment(
    sourceContent: string,
    targetContent: string,
    linkText: string
  ): number {
    // Analyze intent indicators in source content
    const sourceIntent = this.analyzeUserIntent(sourceContent);
    const targetIntent = this.analyzeUserIntent(targetContent);
    const linkIntent = this.analyzeUserIntent(linkText);

    // Calculate alignment between intents
    const sourceTargetAlignment = this.calculateIntentAlignment(sourceIntent, targetIntent);
    const linkTargetAlignment = this.calculateIntentAlignment(linkIntent, targetIntent);

    return (sourceTargetAlignment * 0.6 + linkTargetAlignment * 0.4);
  }

  /**
   * Helper method to calculate overlap between two arrays
   */
  private calculateOverlap(array1: string[], array2: string[]): number {
    if (array1.length === 0 || array2.length === 0) return 0;

    const set1 = new Set(array1.map(item => item.toLowerCase()));
    const set2 = new Set(array2.map(item => item.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate weighted score from factors
   */
  private calculateWeightedScore(factors: LinkRelevanceFactors, weights: LinkRelevanceFactors): number {
    return (
      factors.semanticSimilarity * weights.semanticSimilarity +
      factors.topicalAuthority * weights.topicalAuthority +
      factors.keywordRelevance * weights.keywordRelevance +
      factors.contentQuality * weights.contentQuality +
      factors.contextualFit * weights.contextualFit +
      factors.userIntent * weights.userIntent
    );
  }

  /**
   * Calculate confidence in the scoring
   */
  private calculateConfidence(
    factors: LinkRelevanceFactors,
    sourceContent: string,
    targetContent: string
  ): number {
    const sourceLength = sourceContent.split(/\s+/).length;
    const targetLength = targetContent.split(/\s+/).length;

    // Base confidence on content length and factor consistency
    const lengthConfidence = Math.min(1, (sourceLength + targetLength) / 1000);
    const factorVariance = this.calculateVariance(Object.values(factors));
    const consistencyConfidence = 1 - Math.min(1, factorVariance);

    return (lengthConfidence * 0.4 + consistencyConfidence * 0.6);
  }

  /**
   * Generate recommendations based on scoring factors
   */
  private generateRecommendations(factors: LinkRelevanceFactors, overallScore: number): string[] {
    const recommendations: string[] = [];

    if (overallScore < 0.3) {
      recommendations.push('Consider finding more relevant target content for this link');
    }

    if (factors.semanticSimilarity < 0.4) {
      recommendations.push('Improve semantic relevance between source and target content');
    }

    if (factors.keywordRelevance < 0.5) {
      recommendations.push('Use more relevant anchor text that better matches the target content');
    }

    if (factors.contextualFit < 0.4) {
      recommendations.push('Place the link in a more contextually relevant location within the source content');
    }

    if (factors.topicalAuthority < 0.5) {
      recommendations.push('Consider linking to more authoritative content on this topic');
    }

    if (factors.contentQuality < 0.6) {
      recommendations.push('Improve target content quality before linking');
    }

    return recommendations;
  }

  /**
   * Assess risk level of the link
   */
  private assessRisk(factors: LinkRelevanceFactors, overallScore: number): 'low' | 'medium' | 'high' {
    if (overallScore > 0.7 && factors.semanticSimilarity > 0.5) return 'low';
    if (overallScore > 0.4 && factors.keywordRelevance > 0.3) return 'medium';
    return 'high';
  }

  // Additional helper methods would be implemented here...
  private countTechnicalTerms(content: string): number {
    // Simplified implementation - would use domain-specific dictionaries
    const technicalPatterns = [
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\w+(?:tion|sion|ment|ness|ity|ism)\b/g, // Technical suffixes
    ];

    return technicalPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }

  private generateKeywordVariations(keyword: string): string[] {
    const doc = nlp(keyword);
    const variations: string[] = [];

    // Add plurals, verb forms, etc.
    variations.push(doc.nouns().toPlural().text());
    variations.push(doc.verbs().toPastTense().text());
    variations.push(doc.verbs().toPresentTense().text());

    return variations.filter(v => v && v !== keyword);
  }

  private calculateLengthScore(wordCount: number, min: number, max: number): number {
    if (wordCount < min) return wordCount / min;
    if (wordCount > max) return Math.max(0.5, max / wordCount);
    return 1;
  }

  private calculateReadabilityScore(content: string, sentences: string[], wordCount: number): number {
    const avgSentenceLength = wordCount / sentences.length;
    const complexWords = content.split(/\s+/).filter(word => word.length > 6).length;
    const complexWordRatio = complexWords / wordCount;

    // Simplified readability score (higher is better, normalized to 0-1)
    const score = Math.max(0, 1 - (avgSentenceLength / 25) - complexWordRatio);
    return Math.min(1, score);
  }

  private calculateStructureScore(content: string): number {
    const hasHeadings = /^#{1,6}\s/m.test(content);
    const hasLists = /^[\s]*[-*+]\s/m.test(content);
    const hasParagraphs = content.split('\n\n').length > 1;

    return (hasHeadings ? 0.4 : 0) + (hasLists ? 0.3 : 0) + (hasParagraphs ? 0.3 : 0);
  }

  private calculateInformationDensity(content: string): number {
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    return Math.min(1, uniqueWords / words.length);
  }

  private getContextualWords(sentence: string, linkText: string): string[] {
    // Simplified contextual word extraction
    const words = sentence.toLowerCase().split(/\s+/);
    const linkWords = linkText.toLowerCase().split(/\s+/);

    return words.filter(word =>
      word.length > 3 &&
      !linkWords.includes(word) &&
      !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/.test(word)
    );
  }

  private analyzeUserIntent(content: string): string {
    // Simplified intent analysis - would use more sophisticated NLP in production
    const intentKeywords = {
      informational: ['what', 'how', 'why', 'guide', 'tutorial', 'learn'],
      navigational: ['login', 'contact', 'about', 'home', 'site'],
      transactional: ['buy', 'purchase', 'order', 'price', 'cost', 'deal']
    };

    const contentLower = content.toLowerCase();
    let maxScore = 0;
    let dominantIntent = 'informational';

    Object.entries(intentKeywords).forEach(([intent, keywords]) => {
      const score = keywords.filter(keyword => contentLower.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        dominantIntent = intent;
      }
    });

    return dominantIntent;
  }

  private calculateIntentAlignment(intent1: string, intent2: string): number {
    return intent1 === intent2 ? 1 : 0.5;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
