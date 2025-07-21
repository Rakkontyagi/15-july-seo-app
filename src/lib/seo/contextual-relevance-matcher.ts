
import nlp from 'compromise';

export interface ContextualRelevanceResult {
  isRelevant: boolean;
  relevanceScore: number; // 0-100
  topicalAlignment: number; // How well the external content aligns with your content's topic
  contextualFit: number; // How well the external link fits within the specific context/paragraph
  semanticSimilarity: number; // Semantic similarity between contents
  entityOverlap: number; // Overlap of named entities
  intentAlignment: number; // Alignment of user intent
  commonTopics: string[];
  missingContextKeywords: string[];
  recommendations: string[];
  confidence: number; // Confidence in the relevance assessment
  detailedAnalysis: DetailedRelevanceAnalysis;
}

export interface DetailedRelevanceAnalysis {
  sharedTopics: string[];
  sharedEntities: string[];
  keywordOverlap: KeywordOverlapAnalysis;
  semanticConcepts: string[];
  contextualIndicators: string[];
  relevanceFactors: RelevanceFactor[];
}

export interface KeywordOverlapAnalysis {
  totalSharedKeywords: number;
  highValueKeywords: string[];
  mediumValueKeywords: string[];
  lowValueKeywords: string[];
  uniqueToSource: string[];
  uniqueToTarget: string[];
}

export interface RelevanceFactor {
  factor: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface ContextualRelevanceOptions {
  includeSemanticAnalysis?: boolean;
  includeEntityAnalysis?: boolean;
  includeIntentAnalysis?: boolean;
  minimumRelevanceThreshold?: number;
  contextWindowSize?: number;
  keywordWeighting?: 'frequency' | 'tfidf' | 'semantic';
  strictMode?: boolean;
}

export interface ContentAnalysisResult {
  keywords: string[];
  entities: string[];
  topics: string[];
  concepts: string[];
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  readabilityScore: number;
}

/**
 * Advanced contextual relevance matching system that ensures external links
 * support and enhance content topics using semantic analysis, entity recognition,
 * and intent alignment for optimal user experience
 */
export class ContextualRelevanceMatcher {
  private readonly defaultOptions: Required<ContextualRelevanceOptions> = {
    includeSemanticAnalysis: true,
    includeEntityAnalysis: true,
    includeIntentAnalysis: true,
    minimumRelevanceThreshold: 60,
    contextWindowSize: 200,
    keywordWeighting: 'semantic',
    strictMode: false
  };

  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after'
  ]);

  /**
   * Comprehensive contextual relevance matching with advanced NLP analysis
   */
  matchRelevance(
    content: string,
    linkTargetContent: string,
    mainKeyword: string,
    options: ContextualRelevanceOptions = {}
  ): ContextualRelevanceResult {
    const opts = { ...this.defaultOptions, ...options };

    // Analyze all content pieces
    const contentAnalysis = this.analyzeContent(content, opts);
    const targetAnalysis = this.analyzeContent(linkTargetContent, opts);

    // Calculate relevance factors
    const topicalAlignment = this.calculateTopicalAlignment(contentAnalysis, targetAnalysis);
    const contextualFit = this.calculateContextualFit(contentAnalysis, targetAnalysis, mainKeyword);
    const semanticSimilarity = opts.includeSemanticAnalysis
      ? this.calculateSemanticSimilarity(content, linkTargetContent)
      : 0;
    const entityOverlap = opts.includeEntityAnalysis
      ? this.calculateEntityOverlap(contentAnalysis.entities, targetAnalysis.entities)
      : 0;
    const intentAlignment = opts.includeIntentAnalysis
      ? this.calculateIntentAlignment(contentAnalysis.intent, targetAnalysis.intent)
      : 0;

    // Calculate overall relevance score
    const relevanceScore = this.calculateOverallRelevance({
      topicalAlignment,
      contextualFit,
      semanticSimilarity,
      entityOverlap,
      intentAlignment
    }, opts);

    // Determine if relevant
    const isRelevant = relevanceScore >= opts.minimumRelevanceThreshold;

    // Find common topics and missing keywords
    const commonTopics = this.findCommonTopics(contentAnalysis, targetAnalysis);
    const missingContextKeywords = this.findMissingKeywords(contentAnalysis, targetAnalysis);

    // Generate detailed analysis
    const detailedAnalysis = this.generateDetailedAnalysis(contentAnalysis, targetAnalysis);

    // Calculate confidence
    const confidence = this.calculateConfidence(content, linkTargetContent, relevanceScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      relevanceScore,
      topicalAlignment,
      contextualFit,
      semanticSimilarity,
      entityOverlap,
      intentAlignment,
      isRelevant,
      opts
    );

    return {
      isRelevant,
      relevanceScore: Math.round(relevanceScore * 100) / 100,
      topicalAlignment: Math.round(topicalAlignment * 100) / 100,
      contextualFit: Math.round(contextualFit * 100) / 100,
      semanticSimilarity: Math.round(semanticSimilarity * 100) / 100,
      entityOverlap: Math.round(entityOverlap * 100) / 100,
      intentAlignment: Math.round(intentAlignment * 100) / 100,
      commonTopics,
      missingContextKeywords,
      recommendations,
      confidence: Math.round(confidence * 100) / 100,
      detailedAnalysis
    };
  }

  /**
   * Simple relevance matching (backward compatibility)
   */
  matchRelevanceSimple(content: string, linkTargetContent: string, mainKeyword: string): ContextualRelevanceResult {
    return this.matchRelevance(content, linkTargetContent, mainKeyword, {
      includeSemanticAnalysis: false,
      includeEntityAnalysis: false,
      includeIntentAnalysis: false
    });
  }

  /**
   * Analyze content for keywords, entities, topics, and intent
   */
  private analyzeContent(content: string, options: Required<ContextualRelevanceOptions>): ContentAnalysisResult {
    const doc = nlp(content);

    // Extract keywords
    const keywords = this.extractAdvancedKeywords(content, options.keywordWeighting);

    // Extract entities
    const entities = options.includeEntityAnalysis
      ? doc.entities().out('array')
      : [];

    // Extract topics
    const topics = doc.topics().out('array');

    // Extract concepts (nouns and noun phrases)
    const concepts = doc.nouns().out('array').filter(noun => noun.length > 3);

    // Determine intent
    const intent = options.includeIntentAnalysis
      ? this.determineIntent(content)
      : 'informational';

    // Calculate sentiment
    const sentiment = this.calculateSentiment(content);

    // Calculate readability
    const readabilityScore = this.calculateReadability(content);

    return {
      keywords,
      entities,
      topics,
      concepts,
      intent,
      sentiment,
      readabilityScore
    };
  }

  private extractAdvancedKeywords(content: string, weighting: 'frequency' | 'tfidf' | 'semantic'): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.stopWords.has(word));

    switch (weighting) {
      case 'frequency':
        return this.extractByFrequency(words);
      case 'semantic':
        return this.extractBySemantic(content);
      default:
        return this.extractByFrequency(words);
    }
  }

  private extractByFrequency(words: string[]): string[] {
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private extractBySemantic(content: string): string[] {
    const doc = nlp(content);

    const semanticKeywords = [
      ...doc.topics().out('array'),
      ...doc.nouns().out('array').filter(noun => noun.length > 3)
    ];

    return [...new Set(semanticKeywords)].slice(0, 20);
  }

  // Additional helper methods...
  private calculateTopicalAlignment(
    contentAnalysis: ContentAnalysisResult,
    targetAnalysis: ContentAnalysisResult
  ): number {
    const contentTopics = new Set(contentAnalysis.topics.map(t => t.toLowerCase()));
    const targetTopics = new Set(targetAnalysis.topics.map(t => t.toLowerCase()));

    const intersection = new Set([...contentTopics].filter(topic => targetTopics.has(topic)));
    const union = new Set([...contentTopics, ...targetTopics]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  private calculateContextualFit(
    contentAnalysis: ContentAnalysisResult,
    targetAnalysis: ContentAnalysisResult,
    mainKeyword: string
  ): number {
    const contentKeywords = new Set(contentAnalysis.keywords.map(k => k.toLowerCase()));
    const targetKeywords = new Set(targetAnalysis.keywords.map(k => k.toLowerCase()));
    const keywordOverlap = new Set([...contentKeywords].filter(k => targetKeywords.has(k)));

    const keywordScore = contentKeywords.size > 0
      ? (keywordOverlap.size / contentKeywords.size) * 100
      : 0;

    const mainKeywordBoost = (
      contentAnalysis.keywords.some(k => k.toLowerCase().includes(mainKeyword.toLowerCase())) &&
      targetAnalysis.keywords.some(k => k.toLowerCase().includes(mainKeyword.toLowerCase()))
    ) ? 20 : 0;

    return Math.min(100, keywordScore + mainKeywordBoost);
  }

  private calculateSemanticSimilarity(content1: string, content2: string): number {
    const doc1 = nlp(content1);
    const doc2 = nlp(content2);

    const concepts1 = new Set([
      ...doc1.nouns().out('array'),
      ...doc1.verbs().out('array')
    ].map(c => c.toLowerCase()));

    const concepts2 = new Set([
      ...doc2.nouns().out('array'),
      ...doc2.verbs().out('array')
    ].map(c => c.toLowerCase()));

    const intersection = new Set([...concepts1].filter(c => concepts2.has(c)));
    const union = new Set([...concepts1, ...concepts2]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  private calculateEntityOverlap(entities1: string[], entities2: string[]): number {
    const set1 = new Set(entities1.map(e => e.toLowerCase()));
    const set2 = new Set(entities2.map(e => e.toLowerCase()));

    const intersection = new Set([...set1].filter(e => set2.has(e)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  private calculateIntentAlignment(intent1: string, intent2: string): number {
    if (intent1 === intent2) return 100;

    const intentCompatibility: Record<string, Record<string, number>> = {
      'informational': { 'informational': 100, 'educational': 80, 'commercial': 40 },
      'educational': { 'educational': 100, 'informational': 80, 'commercial': 50 },
      'commercial': { 'commercial': 100, 'informational': 40, 'educational': 50 }
    };

    return intentCompatibility[intent1]?.[intent2] || 50;
  }

  private calculateOverallRelevance(
    scores: {
      topicalAlignment: number;
      contextualFit: number;
      semanticSimilarity: number;
      entityOverlap: number;
      intentAlignment: number;
    },
    options: Required<ContextualRelevanceOptions>
  ): number {
    const weights = {
      topicalAlignment: 0.25,
      contextualFit: 0.25,
      semanticSimilarity: options.includeSemanticAnalysis ? 0.20 : 0,
      entityOverlap: options.includeEntityAnalysis ? 0.15 : 0,
      intentAlignment: options.includeIntentAnalysis ? 0.15 : 0
    };

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = Object.fromEntries(
      Object.entries(weights).map(([key, weight]) => [key, weight / totalWeight])
    );

    return (
      scores.topicalAlignment * normalizedWeights.topicalAlignment +
      scores.contextualFit * normalizedWeights.contextualFit +
      scores.semanticSimilarity * normalizedWeights.semanticSimilarity +
      scores.entityOverlap * normalizedWeights.entityOverlap +
      scores.intentAlignment * normalizedWeights.intentAlignment
    );
  }

  private findCommonTopics(
    contentAnalysis: ContentAnalysisResult,
    targetAnalysis: ContentAnalysisResult
  ): string[] {
    const contentTopics = new Set(contentAnalysis.topics.map(t => t.toLowerCase()));
    const targetTopics = new Set(targetAnalysis.topics.map(t => t.toLowerCase()));

    return [...contentTopics].filter(topic => targetTopics.has(topic));
  }

  private findMissingKeywords(
    contentAnalysis: ContentAnalysisResult,
    targetAnalysis: ContentAnalysisResult
  ): string[] {
    const contentKeywords = new Set(contentAnalysis.keywords.map(k => k.toLowerCase()));
    const targetKeywords = new Set(targetAnalysis.keywords.map(k => k.toLowerCase()));

    return [...targetKeywords].filter(keyword => !contentKeywords.has(keyword)).slice(0, 10);
  }

  private generateDetailedAnalysis(
    contentAnalysis: ContentAnalysisResult,
    targetAnalysis: ContentAnalysisResult
  ): DetailedRelevanceAnalysis {
    const sharedTopics = this.findCommonTopics(contentAnalysis, targetAnalysis);
    const sharedEntities = contentAnalysis.entities.filter(entity =>
      targetAnalysis.entities.includes(entity)
    );

    const keywordOverlap = this.analyzeKeywordOverlap(
      contentAnalysis.keywords,
      targetAnalysis.keywords
    );

    return {
      sharedTopics,
      sharedEntities,
      keywordOverlap,
      semanticConcepts: [...new Set([...contentAnalysis.concepts, ...targetAnalysis.concepts])],
      contextualIndicators: contentAnalysis.keywords.slice(0, 5),
      relevanceFactors: []
    };
  }

  private analyzeKeywordOverlap(keywords1: string[], keywords2: string[]): KeywordOverlapAnalysis {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));

    const shared = [...set1].filter(k => set2.has(k));

    return {
      totalSharedKeywords: shared.length,
      highValueKeywords: shared.slice(0, 5),
      mediumValueKeywords: shared.slice(5, 10),
      lowValueKeywords: shared.slice(10),
      uniqueToSource: [...set1].filter(k => !set2.has(k)),
      uniqueToTarget: [...set2].filter(k => !set1.has(k))
    };
  }

  private calculateConfidence(content: string, linkTargetContent: string, relevanceScore: number): number {
    const contentLengthFactor = Math.min(1, (content.length + linkTargetContent.length) / 2000);
    const scoreFactor = relevanceScore / 100;

    return (contentLengthFactor * 0.4 + scoreFactor * 0.6) * 100;
  }

  private generateRecommendations(
    relevanceScore: number,
    topicalAlignment: number,
    contextualFit: number,
    semanticSimilarity: number,
    entityOverlap: number,
    intentAlignment: number,
    isRelevant: boolean,
    options: Required<ContextualRelevanceOptions>
  ): string[] {
    const recommendations: string[] = [];

    if (!isRelevant) {
      recommendations.push(`Relevance score (${relevanceScore.toFixed(1)}) is below threshold.`);
    }

    if (topicalAlignment < 30) {
      recommendations.push('Low topical alignment detected.');
    }

    if (contextualFit < 40) {
      recommendations.push('Poor contextual fit.');
    }

    if (isRelevant && recommendations.length === 0) {
      recommendations.push('Good relevance match!');
    }

    return recommendations;
  }

  private determineIntent(content: string): string {
    const contentLower = content.toLowerCase();

    if (/\b(buy|purchase|price|cost|sale)\b/.test(contentLower)) {
      return 'commercial';
    }

    if (/\b(learn|tutorial|guide|how to)\b/.test(contentLower)) {
      return 'educational';
    }

    return 'informational';
  }

  private calculateSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible'];

    const contentLower = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    return Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2));
  }
}
