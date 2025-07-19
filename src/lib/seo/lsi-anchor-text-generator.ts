
import nlp from 'compromise';

export interface AnchorTextOptions {
  maxVariations?: number;
  includePartialMatches?: boolean;
  avoidOverOptimization?: boolean;
  naturalLanguageWeight?: number;
  brandedAnchors?: string[];
}

export interface AnchorTextVariation {
  text: string;
  type: 'exact' | 'partial' | 'branded' | 'generic' | 'lsi' | 'natural';
  relevanceScore: number;
  overOptimizationRisk: 'low' | 'medium' | 'high';
  usage: number;
}

export interface AnchorTextStrategy {
  variations: AnchorTextVariation[];
  distribution: Record<string, number>;
  recommendations: string[];
  diversityScore: number;
}

/**
 * Advanced LSI anchor text generator that creates varied, natural anchor text
 * using keyword variations, related terms, and semantic analysis to avoid over-optimization
 */
export class LSIAnchorTextGenerator {
  private readonly defaultOptions: Required<AnchorTextOptions> = {
    maxVariations: 20,
    includePartialMatches: true,
    avoidOverOptimization: true,
    naturalLanguageWeight: 0.4,
    brandedAnchors: []
  };

  private usageTracker: Map<string, number> = new Map();

  /**
   * Generate comprehensive anchor text strategy with LSI variations
   */
  generateAnchorTextStrategy(
    lsiKeywords: string[],
    mainKeyword: string,
    options: AnchorTextOptions = {}
  ): AnchorTextStrategy {
    const opts = { ...this.defaultOptions, ...options };
    const variations = this.generateAllVariations(lsiKeywords, mainKeyword, opts);
    const distribution = this.calculateOptimalDistribution(variations);
    const recommendations = this.generateRecommendations(variations, distribution);
    const diversityScore = this.calculateDiversityScore(variations);

    return {
      variations,
      distribution,
      recommendations,
      diversityScore
    };
  }

  /**
   * Generate simple anchor text array (backward compatibility)
   */
  generateAnchorText(lsiKeywords: string[], mainKeyword: string): string[] {
    const strategy = this.generateAnchorTextStrategy(lsiKeywords, mainKeyword);
    return strategy.variations.map(v => v.text);
  }

  /**
   * Get next anchor text based on optimal distribution strategy
   */
  getNextAnchorText(
    lsiKeywords: string[],
    mainKeyword: string,
    options: AnchorTextOptions = {}
  ): AnchorTextVariation {
    const strategy = this.generateAnchorTextStrategy(lsiKeywords, mainKeyword, options);

    // Find the variation with lowest usage relative to its target distribution
    const bestVariation = strategy.variations.reduce((best, current) => {
      const currentUsage = this.usageTracker.get(current.text) || 0;
      const bestUsage = this.usageTracker.get(best.text) || 0;
      const currentTarget = strategy.distribution[current.type] || 0;
      const bestTarget = strategy.distribution[best.type] || 0;

      const currentRatio = currentTarget > 0 ? currentUsage / currentTarget : Infinity;
      const bestRatio = bestTarget > 0 ? bestUsage / bestTarget : Infinity;

      return currentRatio < bestRatio ? current : best;
    });

    // Track usage
    this.usageTracker.set(bestVariation.text, (this.usageTracker.get(bestVariation.text) || 0) + 1);

    return bestVariation;
  }

  /**
   * Generate all possible anchor text variations
   */
  private generateAllVariations(
    lsiKeywords: string[],
    mainKeyword: string,
    options: Required<AnchorTextOptions>
  ): AnchorTextVariation[] {
    const variations: AnchorTextVariation[] = [];

    // Exact match anchor
    variations.push({
      text: mainKeyword,
      type: 'exact',
      relevanceScore: 100,
      overOptimizationRisk: 'high',
      usage: 0
    });

    // LSI keyword variations
    lsiKeywords.forEach(lsi => {
      variations.push({
        text: lsi,
        type: 'lsi',
        relevanceScore: this.calculateRelevanceScore(lsi, mainKeyword),
        overOptimizationRisk: 'low',
        usage: 0
      });
    });

    // Partial match variations
    if (options.includePartialMatches) {
      variations.push(...this.generatePartialMatches(mainKeyword));
    }

    // Natural language variations
    variations.push(...this.generateNaturalLanguageVariations(mainKeyword, lsiKeywords));

    // Generic anchors
    variations.push(...this.generateGenericAnchors());

    // Branded anchors
    if (options.brandedAnchors.length > 0) {
      options.brandedAnchors.forEach(brand => {
        variations.push({
          text: brand,
          type: 'branded',
          relevanceScore: 70,
          overOptimizationRisk: 'low',
          usage: 0
        });
      });
    }

    return variations.slice(0, options.maxVariations);
  }

  /**
   * Generate partial match variations
   */
  private generatePartialMatches(mainKeyword: string): AnchorTextVariation[] {
    const words = mainKeyword.split(' ');
    const variations: AnchorTextVariation[] = [];

    if (words.length > 1) {
      // Single word variations
      words.forEach(word => {
        if (word.length > 3) { // Avoid very short words
          variations.push({
            text: word,
            type: 'partial',
            relevanceScore: 60,
            overOptimizationRisk: 'medium',
            usage: 0
          });
        }
      });

      // Two-word combinations
      for (let i = 0; i < words.length - 1; i++) {
        const combination = `${words[i]} ${words[i + 1]}`;
        variations.push({
          text: combination,
          type: 'partial',
          relevanceScore: 80,
          overOptimizationRisk: 'medium',
          usage: 0
        });
      }
    }

    return variations;
  }

  /**
   * Generate natural language variations using NLP
   */
  private generateNaturalLanguageVariations(
    mainKeyword: string,
    lsiKeywords: string[]
  ): AnchorTextVariation[] {
    const variations: AnchorTextVariation[] = [];
    const doc = nlp(mainKeyword);

    // Pluralization
    const plural = doc.nouns().toPlural().text();
    if (plural !== mainKeyword) {
      variations.push({
        text: plural,
        type: 'natural',
        relevanceScore: 90,
        overOptimizationRisk: 'low',
        usage: 0
      });
    }

    // Verb forms
    const verbs = doc.verbs();
    if (verbs.length > 0) {
      const pastTense = verbs.toPastTense().text();
      const presentTense = verbs.toPresentTense().text();

      [pastTense, presentTense].forEach(form => {
        if (form && form !== mainKeyword) {
          variations.push({
            text: form,
            type: 'natural',
            relevanceScore: 85,
            overOptimizationRisk: 'low',
            usage: 0
          });
        }
      });
    }

    // Contextual phrases
    const contextualPhrases = this.generateContextualPhrases(mainKeyword, lsiKeywords);
    variations.push(...contextualPhrases);

    return variations;
  }

  /**
   * Generate contextual phrases that naturally incorporate keywords
   */
  private generateContextualPhrases(mainKeyword: string, lsiKeywords: string[]): AnchorTextVariation[] {
    const phrases = [
      `learn about ${mainKeyword}`,
      `${mainKeyword} guide`,
      `${mainKeyword} tips`,
      `${mainKeyword} best practices`,
      `how to ${mainKeyword}`,
      `${mainKeyword} strategies`,
      `${mainKeyword} techniques`,
      `${mainKeyword} solutions`
    ];

    return phrases.map(phrase => ({
      text: phrase,
      type: 'natural' as const,
      relevanceScore: 75,
      overOptimizationRisk: 'low' as const,
      usage: 0
    }));
  }

  /**
   * Generate generic anchor texts
   */
  private generateGenericAnchors(): AnchorTextVariation[] {
    const genericTexts = [
      'click here',
      'read more',
      'learn more',
      'find out more',
      'discover',
      'explore',
      'see details',
      'view guide',
      'get started',
      'this resource'
    ];

    return genericTexts.map(text => ({
      text,
      type: 'generic' as const,
      relevanceScore: 30,
      overOptimizationRisk: 'low' as const,
      usage: 0
    }));
  }

  /**
   * Calculate relevance score between two terms
   */
  private calculateRelevanceScore(term1: string, term2: string): number {
    const words1 = term1.toLowerCase().split(' ');
    const words2 = term2.toLowerCase().split(' ');

    let commonWords = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        commonWords++;
      }
    });

    const maxWords = Math.max(words1.length, words2.length);
    return Math.round((commonWords / maxWords) * 100);
  }

  /**
   * Calculate optimal distribution of anchor text types
   */
  private calculateOptimalDistribution(variations: AnchorTextVariation[]): Record<string, number> {
    // SEO best practices for anchor text distribution
    return {
      exact: 0.05,      // 5% exact match
      partial: 0.15,    // 15% partial match
      branded: 0.20,    // 20% branded
      generic: 0.25,    // 25% generic
      lsi: 0.25,        // 25% LSI keywords
      natural: 0.10     // 10% natural language
    };
  }

  /**
   * Generate recommendations based on anchor text analysis
   */
  private generateRecommendations(
    variations: AnchorTextVariation[],
    distribution: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    const highRiskCount = variations.filter(v => v.overOptimizationRisk === 'high').length;
    if (highRiskCount > variations.length * 0.1) {
      recommendations.push('Reduce high-risk anchor texts to avoid over-optimization penalties');
    }

    const exactMatchCount = variations.filter(v => v.type === 'exact').length;
    if (exactMatchCount > 1) {
      recommendations.push('Limit exact match anchors to prevent keyword stuffing');
    }

    const genericCount = variations.filter(v => v.type === 'generic').length;
    if (genericCount < variations.length * 0.2) {
      recommendations.push('Add more generic anchor texts for natural link profile');
    }

    const lsiCount = variations.filter(v => v.type === 'lsi').length;
    if (lsiCount < variations.length * 0.2) {
      recommendations.push('Increase LSI keyword variations for semantic relevance');
    }

    return recommendations;
  }

  /**
   * Calculate diversity score of anchor text variations
   */
  private calculateDiversityScore(variations: AnchorTextVariation[]): number {
    const typeDistribution = variations.reduce((acc, variation) => {
      acc[variation.type] = (acc[variation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const types = Object.keys(typeDistribution);
    const totalVariations = variations.length;

    // Calculate entropy-based diversity score
    let entropy = 0;
    types.forEach(type => {
      const probability = typeDistribution[type] / totalVariations;
      entropy -= probability * Math.log2(probability);
    });

    // Normalize to 0-100 scale
    const maxEntropy = Math.log2(types.length);
    return Math.round((entropy / maxEntropy) * 100);
  }

  /**
   * Reset usage tracking
   */
  resetUsageTracking(): void {
    this.usageTracker.clear();
  }

  /**
   * Get current usage statistics
   */
  getUsageStatistics(): Record<string, number> {
    return Object.fromEntries(this.usageTracker);
  }
}
