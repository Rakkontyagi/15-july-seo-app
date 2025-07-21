/**
 * Content Topic Distribution Mapper for Advanced Competitive Intelligence
 * Maps percentage coverage of each subtopic across competitor content
 */

import { z } from 'zod';

export interface TopicDistribution {
  topic: string;
  subtopics: Array<{
    name: string;
    coverage: number; // percentage of content
    frequency: number; // number of mentions
    prominence: number; // 0-100 score based on position and context
    keywords: string[];
    sentences: string[];
  }>;
  totalCoverage: number; // percentage of total content
  coherenceScore: number; // 0-100
  depthScore: number; // 0-100
  breadthScore: number; // 0-100
}

export interface TopicFlow {
  sequence: string[];
  transitions: Array<{
    from: string;
    to: string;
    strength: number; // 0-100
    transitionWords: string[];
  }>;
  logicalProgression: boolean;
  flowScore: number; // 0-100
}

export interface TopicDistributionResult {
  mainTopics: TopicDistribution[];
  topicFlow: TopicFlow;
  topicCoverage: {
    totalTopics: number;
    averageCoverage: number;
    topicBalance: number; // 0-100
    topicDiversity: number; // 0-100
  };
  competitorComparison?: {
    topicGaps: string[];
    overCoveredTopics: string[];
    underCoveredTopics: string[];
    uniqueTopics: string[];
    recommendations: string[];
  };
}

export interface TopicDistributionOptions {
  primaryKeyword: string;
  industryTerms?: string[];
  minTopicCoverage?: number; // minimum percentage to be considered a topic
  maxTopics?: number;
  includeSubtopics?: boolean;
  analyzeFlow?: boolean;
  language?: string;
}

const DEFAULT_OPTIONS: Required<TopicDistributionOptions> = {
  primaryKeyword: '',
  industryTerms: [],
  minTopicCoverage: 2.0, // 2% minimum coverage
  maxTopics: 20,
  includeSubtopics: true,
  analyzeFlow: true,
  language: 'en',
};

export class TopicDistributionMapper {
  private options: Required<TopicDistributionOptions>;
  private topicKeywords: Map<string, string[]>;
  private transitionWords: Set<string>;

  constructor(options: TopicDistributionOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.topicKeywords = this.buildTopicKeywords();
    this.transitionWords = new Set(this.getTransitionWords());
  }

  /**
   * Map topic distribution in content
   */
  mapTopicDistribution(content: string): TopicDistributionResult {
    const cleanContent = this.cleanContent(content);
    const sentences = this.extractSentences(cleanContent);
    const paragraphs = this.extractParagraphs(cleanContent);

    // Identify main topics
    const mainTopics = this.identifyMainTopics(cleanContent, sentences, paragraphs);

    // Analyze topic flow
    const topicFlow = this.options.analyzeFlow 
      ? this.analyzeTopicFlow(sentences, mainTopics)
      : this.createEmptyFlow();

    // Calculate topic coverage metrics
    const topicCoverage = this.calculateTopicCoverage(mainTopics);

    return {
      mainTopics,
      topicFlow,
      topicCoverage,
    };
  }

  /**
   * Compare with competitor content
   */
  compareWithCompetitors(
    currentResult: TopicDistributionResult,
    competitorContents: Array<{ url: string; content: string }>
  ): TopicDistributionResult {
    const competitorResults = competitorContents.map(({ url, content }) => ({
      url,
      result: this.mapTopicDistribution(content),
    }));

    // Aggregate competitor topics
    const competitorTopics = new Set<string>();
    const competitorTopicCoverage = new Map<string, number[]>();

    competitorResults.forEach(({ result }) => {
      result.mainTopics.forEach(topic => {
        competitorTopics.add(topic.topic);
        if (!competitorTopicCoverage.has(topic.topic)) {
          competitorTopicCoverage.set(topic.topic, []);
        }
        competitorTopicCoverage.get(topic.topic)!.push(topic.totalCoverage);
      });
    });

    // Identify gaps and opportunities
    const currentTopics = new Set(currentResult.mainTopics.map(t => t.topic));
    
    const topicGaps = Array.from(competitorTopics).filter(topic => !currentTopics.has(topic));
    const uniqueTopics = Array.from(currentTopics).filter(topic => !competitorTopics.has(topic));

    // Identify over/under covered topics
    const overCoveredTopics: string[] = [];
    const underCoveredTopics: string[] = [];

    currentResult.mainTopics.forEach(currentTopic => {
      const competitorCoverages = competitorTopicCoverage.get(currentTopic.topic);
      if (competitorCoverages && competitorCoverages.length > 0) {
        const avgCompetitorCoverage = competitorCoverages.reduce((sum, c) => sum + c, 0) / competitorCoverages.length;
        
        if (currentTopic.totalCoverage > avgCompetitorCoverage * 1.5) {
          overCoveredTopics.push(currentTopic.topic);
        } else if (currentTopic.totalCoverage < avgCompetitorCoverage * 0.5) {
          underCoveredTopics.push(currentTopic.topic);
        }
      }
    });

    const recommendations = this.generateTopicRecommendations(
      topicGaps,
      overCoveredTopics,
      underCoveredTopics,
      uniqueTopics
    );

    const competitorComparison = {
      topicGaps,
      overCoveredTopics,
      underCoveredTopics,
      uniqueTopics,
      recommendations,
    };

    return {
      ...currentResult,
      competitorComparison,
    };
  }

  /**
   * Clean content for analysis
   */
  private cleanContent(content: string): string {
    return content
      .replace(/[^\w\s.,!?;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Extract sentences from content
   */
  private extractSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short sentences
  }

  /**
   * Extract paragraphs from content
   */
  private extractParagraphs(content: string): string[] {
    return content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50); // Filter out very short paragraphs
  }

  /**
   * Identify main topics in content
   */
  private identifyMainTopics(content: string, sentences: string[], paragraphs: string[]): TopicDistribution[] {
    const topics: TopicDistribution[] = [];
    const words = content.split(/\s+/);
    const totalWords = words.length;

    // Analyze each potential topic
    this.topicKeywords.forEach((keywords, topicName) => {
      const topicAnalysis = this.analyzeTopicInContent(
        topicName,
        keywords,
        content,
        sentences,
        paragraphs,
        totalWords
      );

      if (topicAnalysis.totalCoverage >= this.options.minTopicCoverage) {
        topics.push(topicAnalysis);
      }
    });

    // Sort by coverage and limit to max topics
    return topics
      .sort((a, b) => b.totalCoverage - a.totalCoverage)
      .slice(0, this.options.maxTopics);
  }

  /**
   * Analyze specific topic in content
   */
  private analyzeTopicInContent(
    topicName: string,
    keywords: string[],
    content: string,
    sentences: string[],
    paragraphs: string[],
    totalWords: number
  ): TopicDistribution {
    let totalMentions = 0;
    const topicSentences: string[] = [];
    const foundKeywords: string[] = [];

    // Count keyword occurrences
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        totalMentions += matches.length;
        foundKeywords.push(keyword);
      }
    });

    // Find sentences containing topic keywords
    sentences.forEach(sentence => {
      if (keywords.some(keyword => sentence.includes(keyword))) {
        topicSentences.push(sentence);
      }
    });

    // Calculate coverage percentage
    const totalCoverage = totalWords > 0 ? (totalMentions / totalWords) * 100 : 0;

    // Calculate prominence based on position and context
    const prominence = this.calculateTopicProminence(keywords, content, sentences);

    // Generate subtopics if enabled
    const subtopics = this.options.includeSubtopics 
      ? this.generateSubtopics(topicName, topicSentences, foundKeywords)
      : [];

    // Calculate quality scores
    const coherenceScore = this.calculateCoherenceScore(topicSentences);
    const depthScore = this.calculateDepthScore(topicSentences, foundKeywords);
    const breadthScore = this.calculateBreadthScore(subtopics);

    return {
      topic: topicName,
      subtopics,
      totalCoverage: Math.round(totalCoverage * 100) / 100,
      coherenceScore,
      depthScore,
      breadthScore,
    };
  }

  /**
   * Calculate topic prominence
   */
  private calculateTopicProminence(keywords: string[], content: string, sentences: string[]): number {
    let prominenceScore = 0;
    const contentLength = content.length;

    keywords.forEach(keyword => {
      const firstOccurrence = content.indexOf(keyword);
      if (firstOccurrence !== -1) {
        // Higher score for keywords appearing earlier
        const positionScore = Math.max(0, 100 - (firstOccurrence / contentLength) * 100);
        prominenceScore += positionScore;

        // Bonus for keywords in first/last sentences
        const firstSentence = sentences[0] || '';
        const lastSentence = sentences[sentences.length - 1] || '';
        
        if (firstSentence.includes(keyword)) prominenceScore += 20;
        if (lastSentence.includes(keyword)) prominenceScore += 10;
      }
    });

    return Math.min(100, prominenceScore / keywords.length);
  }

  /**
   * Generate subtopics
   */
  private generateSubtopics(topicName: string, sentences: string[], keywords: string[]) {
    // Simple subtopic generation based on sentence clustering
    const subtopics: TopicDistribution['subtopics'] = [];
    
    // Group sentences by similar keywords
    const sentenceGroups = new Map<string, string[]>();
    
    sentences.forEach(sentence => {
      const matchingKeywords = keywords.filter(keyword => sentence.includes(keyword));
      if (matchingKeywords.length > 0) {
        const groupKey = matchingKeywords.sort().join('_');
        if (!sentenceGroups.has(groupKey)) {
          sentenceGroups.set(groupKey, []);
        }
        sentenceGroups.get(groupKey)!.push(sentence);
      }
    });

    // Convert groups to subtopics
    let subtopicIndex = 1;
    sentenceGroups.forEach((groupSentences, groupKey) => {
      if (groupSentences.length >= 2) { // Minimum 2 sentences for a subtopic
        const subtopicKeywords = groupKey.split('_');
        const coverage = (groupSentences.length / sentences.length) * 100;
        
        subtopics.push({
          name: `${topicName} Subtopic ${subtopicIndex}`,
          coverage: Math.round(coverage * 100) / 100,
          frequency: groupSentences.length,
          prominence: this.calculateTopicProminence(subtopicKeywords, groupSentences.join(' '), groupSentences),
          keywords: subtopicKeywords,
          sentences: groupSentences.slice(0, 3), // Limit to 3 example sentences
        });
        
        subtopicIndex++;
      }
    });

    return subtopics.slice(0, 5); // Limit to 5 subtopics per topic
  }

  /**
   * Calculate coherence score
   */
  private calculateCoherenceScore(sentences: string[]): number {
    if (sentences.length < 2) return 50;

    let coherenceScore = 0;
    const totalPairs = sentences.length - 1;

    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = this.calculateSentenceSimilarity(sentences[i], sentences[i + 1]);
      coherenceScore += similarity;
    }

    return Math.round((coherenceScore / totalPairs) * 100);
  }

  /**
   * Calculate sentence similarity
   */
  private calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
    const words1 = new Set(sentence1.split(/\s+/));
    const words2 = new Set(sentence2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate depth score
   */
  private calculateDepthScore(sentences: string[], keywords: string[]): number {
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    const keywordVariety = keywords.length;
    const sentenceCount = sentences.length;

    // Depth based on sentence length, keyword variety, and sentence count
    const lengthScore = Math.min(100, (avgSentenceLength / 20) * 100);
    const varietyScore = Math.min(100, keywordVariety * 20);
    const countScore = Math.min(100, sentenceCount * 10);

    return Math.round((lengthScore + varietyScore + countScore) / 3);
  }

  /**
   * Calculate breadth score
   */
  private calculateBreadthScore(subtopics: TopicDistribution['subtopics']): number {
    if (subtopics.length === 0) return 30;

    const subtopicCount = subtopics.length;
    const avgCoverage = subtopics.reduce((sum, st) => sum + st.coverage, 0) / subtopics.length;
    
    const countScore = Math.min(100, subtopicCount * 20);
    const coverageScore = Math.min(100, avgCoverage * 5);

    return Math.round((countScore + coverageScore) / 2);
  }

  /**
   * Analyze topic flow
   */
  private analyzeTopicFlow(sentences: string[], topics: TopicDistribution[]): TopicFlow {
    const topicSequence: string[] = [];
    const transitions: TopicFlow['transitions'] = [];

    // Map sentences to topics
    const sentenceTopics: string[] = [];
    sentences.forEach(sentence => {
      let bestTopic = '';
      let bestScore = 0;

      topics.forEach(topic => {
        const score = this.calculateTopicSentenceScore(sentence, topic);
        if (score > bestScore) {
          bestScore = score;
          bestTopic = topic.topic;
        }
      });

      if (bestTopic) {
        sentenceTopics.push(bestTopic);
      }
    });

    // Build topic sequence
    let currentTopic = '';
    sentenceTopics.forEach(topic => {
      if (topic !== currentTopic) {
        topicSequence.push(topic);
        currentTopic = topic;
      }
    });

    // Analyze transitions
    for (let i = 0; i < topicSequence.length - 1; i++) {
      const fromTopic = topicSequence[i];
      const toTopic = topicSequence[i + 1];

      const existingTransition = transitions.find(t => t.from === fromTopic && t.to === toTopic);
      if (existingTransition) {
        existingTransition.strength += 10;
      } else {
        transitions.push({
          from: fromTopic,
          to: toTopic,
          strength: 50,
          transitionWords: this.findTransitionWords(sentences, i),
        });
      }
    }

    // Check logical progression
    const logicalProgression = this.checkLogicalProgression(topicSequence);

    // Calculate flow score
    const flowScore = this.calculateFlowScore(topicSequence, transitions);

    return {
      sequence: topicSequence,
      transitions,
      logicalProgression,
      flowScore,
    };
  }

  /**
   * Calculate topic sentence score
   */
  private calculateTopicSentenceScore(sentence: string, topic: TopicDistribution): number {
    let score = 0;

    topic.subtopics.forEach(subtopic => {
      subtopic.keywords.forEach(keyword => {
        if (sentence.includes(keyword)) {
          score += 1;
        }
      });
    });

    return score;
  }

  /**
   * Find transition words between topics
   */
  private findTransitionWords(sentences: string[], transitionIndex: number): string[] {
    const transitionWords: string[] = [];

    if (transitionIndex < sentences.length - 1) {
      const sentence = sentences[transitionIndex + 1];
      const words = sentence.split(/\s+/);

      words.forEach(word => {
        if (this.transitionWords.has(word.toLowerCase())) {
          transitionWords.push(word);
        }
      });
    }

    return transitionWords.slice(0, 3); // Limit to 3 transition words
  }

  /**
   * Check logical progression
   */
  private checkLogicalProgression(sequence: string[]): boolean {
    // Simple heuristic: topics should not repeat too frequently
    const topicCounts = new Map<string, number>();

    sequence.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

    // Check if any topic appears more than 3 times (indicating poor flow)
    const maxRepeats = Math.max(...Array.from(topicCounts.values()));
    return maxRepeats <= 3;
  }

  /**
   * Calculate flow score
   */
  private calculateFlowScore(sequence: string[], transitions: TopicFlow['transitions']): number {
    let score = 100;

    // Penalize too many topic switches
    if (sequence.length > 10) {
      score -= (sequence.length - 10) * 5;
    }

    // Penalize weak transitions
    const weakTransitions = transitions.filter(t => t.strength < 30).length;
    score -= weakTransitions * 10;

    // Bonus for good transition words
    const transitionsWithWords = transitions.filter(t => t.transitionWords.length > 0).length;
    score += transitionsWithWords * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create empty flow for when flow analysis is disabled
   */
  private createEmptyFlow(): TopicFlow {
    return {
      sequence: [],
      transitions: [],
      logicalProgression: true,
      flowScore: 50,
    };
  }

  /**
   * Calculate topic coverage metrics
   */
  private calculateTopicCoverage(topics: TopicDistribution[]) {
    const totalTopics = topics.length;
    const averageCoverage = totalTopics > 0
      ? topics.reduce((sum, topic) => sum + topic.totalCoverage, 0) / totalTopics
      : 0;

    // Calculate topic balance (how evenly distributed topics are)
    const coverages = topics.map(t => t.totalCoverage);
    const maxCoverage = Math.max(...coverages);
    const minCoverage = Math.min(...coverages);
    const topicBalance = maxCoverage > 0 ? (1 - (maxCoverage - minCoverage) / maxCoverage) * 100 : 100;

    // Calculate topic diversity (variety of topics)
    const topicDiversity = Math.min(100, totalTopics * 10);

    return {
      totalTopics,
      averageCoverage: Math.round(averageCoverage * 100) / 100,
      topicBalance: Math.round(topicBalance),
      topicDiversity: Math.round(topicDiversity),
    };
  }

  /**
   * Generate topic recommendations
   */
  private generateTopicRecommendations(
    topicGaps: string[],
    overCoveredTopics: string[],
    underCoveredTopics: string[],
    uniqueTopics: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (topicGaps.length > 0) {
      recommendations.push(`Add missing topics: ${topicGaps.slice(0, 3).join(', ')}`);
    }

    if (underCoveredTopics.length > 0) {
      recommendations.push(`Expand coverage of: ${underCoveredTopics.slice(0, 3).join(', ')}`);
    }

    if (overCoveredTopics.length > 0) {
      recommendations.push(`Reduce emphasis on: ${overCoveredTopics.slice(0, 3).join(', ')}`);
    }

    if (uniqueTopics.length > 0) {
      recommendations.push(`Maintain unique coverage of: ${uniqueTopics.slice(0, 3).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Topic distribution is well-balanced compared to competitors');
    }

    return recommendations;
  }

  /**
   * Build topic keywords map
   */
  private buildTopicKeywords(): Map<string, string[]> {
    const topicMap = new Map<string, string[]>();

    // Add industry-specific topics based on primary keyword
    const primaryKeyword = this.options.primaryKeyword.toLowerCase();

    // SEO-related topics
    if (primaryKeyword.includes('seo') || primaryKeyword.includes('search')) {
      topicMap.set('Technical SEO', ['technical seo', 'site speed', 'crawling', 'indexing', 'schema markup', 'robots.txt']);
      topicMap.set('Content SEO', ['content optimization', 'keyword research', 'content strategy', 'blog posts']);
      topicMap.set('Link Building', ['backlinks', 'link building', 'domain authority', 'link profile']);
      topicMap.set('Local SEO', ['local seo', 'google my business', 'local search', 'citations']);
    }

    // Marketing-related topics
    if (primaryKeyword.includes('marketing') || primaryKeyword.includes('digital')) {
      topicMap.set('Digital Marketing', ['digital marketing', 'online marketing', 'internet marketing']);
      topicMap.set('Social Media', ['social media', 'facebook', 'twitter', 'instagram', 'linkedin']);
      topicMap.set('Email Marketing', ['email marketing', 'newsletters', 'email campaigns']);
      topicMap.set('PPC Advertising', ['ppc', 'google ads', 'paid advertising', 'adwords']);
    }

    // Add custom industry terms
    if (this.options.industryTerms.length > 0) {
      topicMap.set('Industry Specific', this.options.industryTerms);
    }

    // Add general topics if no specific ones found
    if (topicMap.size === 0) {
      topicMap.set('Introduction', ['introduction', 'overview', 'getting started', 'basics']);
      topicMap.set('Benefits', ['benefits', 'advantages', 'pros', 'value']);
      topicMap.set('Features', ['features', 'functionality', 'capabilities', 'tools']);
      topicMap.set('How To', ['how to', 'tutorial', 'guide', 'steps', 'process']);
      topicMap.set('Best Practices', ['best practices', 'tips', 'recommendations', 'advice']);
      topicMap.set('Examples', ['examples', 'case studies', 'samples', 'demonstrations']);
      topicMap.set('Conclusion', ['conclusion', 'summary', 'final thoughts', 'takeaways']);
    }

    return topicMap;
  }

  /**
   * Get transition words
   */
  private getTransitionWords(): string[] {
    return [
      // Addition
      'also', 'furthermore', 'moreover', 'additionally', 'besides', 'in addition',
      // Contrast
      'however', 'nevertheless', 'nonetheless', 'although', 'despite', 'while',
      // Sequence
      'first', 'second', 'third', 'next', 'then', 'finally', 'meanwhile',
      // Cause and Effect
      'therefore', 'consequently', 'as a result', 'because', 'since', 'thus',
      // Examples
      'for example', 'for instance', 'such as', 'including', 'namely',
      // Conclusion
      'in conclusion', 'to summarize', 'overall', 'in summary', 'ultimately',
    ];
  }
}

// Factory function
export const createTopicDistributionMapper = (options: TopicDistributionOptions): TopicDistributionMapper => {
  return new TopicDistributionMapper(options);
};

// Default export
export default TopicDistributionMapper;
