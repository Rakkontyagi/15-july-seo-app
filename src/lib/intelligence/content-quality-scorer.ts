/**
 * Competitor Content Quality Scorer for Advanced Competitive Intelligence
 * Analyzes and scores content quality using multiple readability and engagement metrics
 */

import { z } from 'zod';

export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  smogIndex: number;
  automatedReadabilityIndex: number;
  colemanLiauIndex: number;
  gunningFogIndex: number;
  averageGrade: number;
  readabilityScore: number; // 0-100
}

export interface ContentStructureMetrics {
  paragraphCount: number;
  averageParagraphLength: number;
  sentenceCount: number;
  averageSentenceLength: number;
  wordCount: number;
  averageWordLength: number;
  structureScore: number; // 0-100
  organizationScore: number; // 0-100
}

export interface OptimizationMetrics {
  keywordDensity: number;
  keywordDistribution: number; // 0-100
  headingOptimization: number; // 0-100
  metaOptimization: number; // 0-100
  internalLinking: number; // 0-100
  optimizationScore: number; // 0-100
}

export interface UniquenessMetrics {
  originalityScore: number; // 0-100
  duplicateContentPercentage: number;
  uniquePhrases: number;
  commonPhrases: number;
  uniquenessScore: number; // 0-100
}

export interface EngagementMetrics {
  emotionalWords: number;
  actionWords: number;
  questionCount: number;
  exclamationCount: number;
  personalPronouns: number;
  engagementScore: number; // 0-100
}

export interface ContentQualityResult {
  readability: ReadabilityMetrics;
  structure: ContentStructureMetrics;
  optimization: OptimizationMetrics;
  uniqueness: UniquenessMetrics;
  engagement: EngagementMetrics;
  overallScore: number; // 0-100
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ContentQualityOptions {
  primaryKeyword?: string;
  targetAudience?: 'general' | 'technical' | 'academic' | 'casual';
  contentType?: 'blog' | 'article' | 'product' | 'landing' | 'guide';
  includeReadability?: boolean;
  includeEngagement?: boolean;
  includeUniqueness?: boolean;
  language?: string;
}

const DEFAULT_OPTIONS: Required<ContentQualityOptions> = {
  primaryKeyword: '',
  targetAudience: 'general',
  contentType: 'article',
  includeReadability: true,
  includeEngagement: true,
  includeUniqueness: true,
  language: 'en',
};

export class ContentQualityScorer {
  private options: Required<ContentQualityOptions>;
  private emotionalWords: Set<string>;
  private actionWords: Set<string>;
  private stopWords: Set<string>;

  constructor(options: ContentQualityOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.emotionalWords = new Set(this.getEmotionalWords());
    this.actionWords = new Set(this.getActionWords());
    this.stopWords = new Set(this.getStopWords());
  }

  /**
   * Score content quality
   */
  scoreContentQuality(content: string, html?: string): ContentQualityResult {
    const cleanContent = this.cleanContent(content);
    
    // Calculate all metrics
    const readability = this.options.includeReadability 
      ? this.calculateReadabilityMetrics(cleanContent)
      : this.getDefaultReadability();

    const structure = this.calculateStructureMetrics(cleanContent);
    
    const optimization = this.calculateOptimizationMetrics(cleanContent, html);
    
    const uniqueness = this.options.includeUniqueness
      ? this.calculateUniquenessMetrics(cleanContent)
      : this.getDefaultUniqueness();

    const engagement = this.options.includeEngagement
      ? this.calculateEngagementMetrics(cleanContent)
      : this.getDefaultEngagement();

    // Calculate overall score
    const overallScore = this.calculateOverallScore(readability, structure, optimization, uniqueness, engagement);
    
    // Determine quality grade
    const qualityGrade = this.getQualityGrade(overallScore);
    
    // Generate insights
    const strengths = this.identifyStrengths(readability, structure, optimization, uniqueness, engagement);
    const weaknesses = this.identifyWeaknesses(readability, structure, optimization, uniqueness, engagement);
    const recommendations = this.generateRecommendations(weaknesses, overallScore);

    return {
      readability,
      structure,
      optimization,
      uniqueness,
      engagement,
      overallScore,
      qualityGrade,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  /**
   * Calculate readability metrics
   */
  private calculateReadabilityMetrics(content: string): ReadabilityMetrics {
    const sentences = this.extractSentences(content);
    const words = this.extractWords(content);
    const syllables = this.countSyllables(words);

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    // Flesch Reading Ease
    const fleschReadingEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    // SMOG Index
    const complexWords = this.countComplexWords(words);
    const smogIndex = 1.0430 * Math.sqrt(complexWords * (30 / sentences.length)) + 3.1291;

    // Automated Readability Index
    const characters = content.replace(/\s/g, '').length;
    const automatedReadabilityIndex = 4.71 * (characters / words.length) + 0.5 * (words.length / sentences.length) - 21.43;

    // Coleman-Liau Index
    const avgCharsPerWord = characters / words.length;
    const avgSentencesPer100Words = (sentences.length / words.length) * 100;
    const colemanLiauIndex = 0.0588 * avgCharsPerWord * 100 / words.length * 100 - 0.296 * avgSentencesPer100Words - 15.8;

    // Gunning Fog Index
    const gunningFogIndex = 0.4 * (avgSentenceLength + 100 * (complexWords / words.length));

    // Average grade level
    const grades = [fleschKincaidGrade, smogIndex, automatedReadabilityIndex, colemanLiauIndex, gunningFogIndex];
    const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;

    // Convert to readability score (0-100)
    const readabilityScore = Math.max(0, Math.min(100, 100 - (averageGrade - 8) * 10));

    return {
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
      fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
      smogIndex: Math.round(smogIndex * 10) / 10,
      automatedReadabilityIndex: Math.round(automatedReadabilityIndex * 10) / 10,
      colemanLiauIndex: Math.round(colemanLiauIndex * 10) / 10,
      gunningFogIndex: Math.round(gunningFogIndex * 10) / 10,
      averageGrade: Math.round(averageGrade * 10) / 10,
      readabilityScore: Math.round(readabilityScore),
    };
  }

  /**
   * Calculate structure metrics
   */
  private calculateStructureMetrics(content: string): ContentStructureMetrics {
    const paragraphs = this.extractParagraphs(content);
    const sentences = this.extractSentences(content);
    const words = this.extractWords(content);

    const paragraphCount = paragraphs.length;
    const averageParagraphLength = paragraphCount > 0 
      ? words.length / paragraphCount 
      : 0;

    const sentenceCount = sentences.length;
    const averageSentenceLength = sentenceCount > 0 
      ? words.length / sentenceCount 
      : 0;

    const wordCount = words.length;
    const averageWordLength = wordCount > 0 
      ? content.replace(/\s/g, '').length / wordCount 
      : 0;

    // Structure score based on optimal ranges
    let structureScore = 100;
    
    // Optimal paragraph length: 50-150 words
    if (averageParagraphLength < 30 || averageParagraphLength > 200) {
      structureScore -= 20;
    }
    
    // Optimal sentence length: 15-25 words
    if (averageSentenceLength < 10 || averageSentenceLength > 30) {
      structureScore -= 20;
    }
    
    // Optimal word length: 4-6 characters
    if (averageWordLength < 3 || averageWordLength > 8) {
      structureScore -= 10;
    }

    // Organization score based on paragraph distribution
    const paragraphLengths = paragraphs.map(p => this.extractWords(p).length);
    const lengthVariance = this.calculateVariance(paragraphLengths);
    const organizationScore = Math.max(0, 100 - lengthVariance);

    return {
      paragraphCount,
      averageParagraphLength: Math.round(averageParagraphLength * 10) / 10,
      sentenceCount,
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      wordCount,
      averageWordLength: Math.round(averageWordLength * 10) / 10,
      structureScore: Math.max(0, structureScore),
      organizationScore: Math.round(organizationScore),
    };
  }

  /**
   * Calculate optimization metrics
   */
  private calculateOptimizationMetrics(content: string, html?: string): OptimizationMetrics {
    let keywordDensity = 0;
    let keywordDistribution = 50;
    
    if (this.options.primaryKeyword) {
      const words = this.extractWords(content);
      const keywordCount = this.countKeywordOccurrences(content, this.options.primaryKeyword);
      keywordDensity = words.length > 0 ? (keywordCount / words.length) * 100 : 0;
      keywordDistribution = this.calculateKeywordDistribution(content, this.options.primaryKeyword);
    }

    // Heading optimization (simplified)
    const headingOptimization = html ? this.analyzeHeadingOptimization(html) : 50;
    
    // Meta optimization (simplified)
    const metaOptimization = html ? this.analyzeMetaOptimization(html) : 50;
    
    // Internal linking (simplified)
    const internalLinking = html ? this.analyzeInternalLinking(html) : 50;

    // Overall optimization score
    const optimizationScore = Math.round(
      (keywordDistribution + headingOptimization + metaOptimization + internalLinking) / 4
    );

    return {
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      keywordDistribution,
      headingOptimization,
      metaOptimization,
      internalLinking,
      optimizationScore,
    };
  }

  /**
   * Calculate uniqueness metrics
   */
  private calculateUniquenessMetrics(content: string): UniquenessMetrics {
    const sentences = this.extractSentences(content);
    const phrases = this.extractPhrases(content);
    
    // Simple uniqueness calculation (would need external API for real duplicate detection)
    const uniquePhrases = phrases.length;
    const commonPhrases = this.countCommonPhrases(phrases);
    const duplicateContentPercentage = commonPhrases > 0 ? (commonPhrases / phrases.length) * 100 : 0;
    
    const originalityScore = Math.max(0, 100 - duplicateContentPercentage);
    const uniquenessScore = Math.round((originalityScore + (uniquePhrases / phrases.length) * 100) / 2);

    return {
      originalityScore: Math.round(originalityScore),
      duplicateContentPercentage: Math.round(duplicateContentPercentage * 10) / 10,
      uniquePhrases,
      commonPhrases,
      uniquenessScore,
    };
  }

  /**
   * Calculate engagement metrics
   */
  private calculateEngagementMetrics(content: string): EngagementMetrics {
    const words = this.extractWords(content);
    const sentences = this.extractSentences(content);
    
    const emotionalWords = words.filter(word => this.emotionalWords.has(word.toLowerCase())).length;
    const actionWords = words.filter(word => this.actionWords.has(word.toLowerCase())).length;
    const questionCount = (content.match(/\?/g) || []).length;
    const exclamationCount = (content.match(/!/g) || []).length;
    const personalPronouns = this.countPersonalPronouns(words);

    // Calculate engagement score
    const emotionalScore = Math.min(100, (emotionalWords / words.length) * 1000);
    const actionScore = Math.min(100, (actionWords / words.length) * 1000);
    const interactionScore = Math.min(100, ((questionCount + exclamationCount) / sentences.length) * 100);
    const personalScore = Math.min(100, (personalPronouns / words.length) * 500);

    const engagementScore = Math.round((emotionalScore + actionScore + interactionScore + personalScore) / 4);

    return {
      emotionalWords,
      actionWords,
      questionCount,
      exclamationCount,
      personalPronouns,
      engagementScore,
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    readability: ReadabilityMetrics,
    structure: ContentStructureMetrics,
    optimization: OptimizationMetrics,
    uniqueness: UniquenessMetrics,
    engagement: EngagementMetrics
  ): number {
    const weights = {
      readability: 0.25,
      structure: 0.20,
      optimization: 0.25,
      uniqueness: 0.15,
      engagement: 0.15,
    };

    return Math.round(
      readability.readabilityScore * weights.readability +
      structure.structureScore * weights.structure +
      optimization.optimizationScore * weights.optimization +
      uniqueness.uniquenessScore * weights.uniqueness +
      engagement.engagementScore * weights.engagement
    );
  }

  /**
   * Get quality grade
   */
  private getQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(
    readability: ReadabilityMetrics,
    structure: ContentStructureMetrics,
    optimization: OptimizationMetrics,
    uniqueness: UniquenessMetrics,
    engagement: EngagementMetrics
  ): string[] {
    const strengths: string[] = [];

    if (readability.readabilityScore >= 80) {
      strengths.push('Excellent readability for target audience');
    }

    if (structure.structureScore >= 80) {
      strengths.push('Well-organized content structure');
    }

    if (optimization.optimizationScore >= 80) {
      strengths.push('Strong SEO optimization');
    }

    if (uniqueness.uniquenessScore >= 80) {
      strengths.push('High content originality');
    }

    if (engagement.engagementScore >= 80) {
      strengths.push('Engaging and interactive content');
    }

    if (structure.averageSentenceLength >= 15 && structure.averageSentenceLength <= 25) {
      strengths.push('Optimal sentence length for readability');
    }

    if (optimization.keywordDensity >= 1 && optimization.keywordDensity <= 3) {
      strengths.push('Optimal keyword density');
    }

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private identifyWeaknesses(
    readability: ReadabilityMetrics,
    structure: ContentStructureMetrics,
    optimization: OptimizationMetrics,
    uniqueness: UniquenessMetrics,
    engagement: EngagementMetrics
  ): string[] {
    const weaknesses: string[] = [];

    if (readability.readabilityScore < 60) {
      weaknesses.push('Poor readability - content may be too complex');
    }

    if (structure.structureScore < 60) {
      weaknesses.push('Poor content structure and organization');
    }

    if (optimization.optimizationScore < 60) {
      weaknesses.push('Insufficient SEO optimization');
    }

    if (uniqueness.uniquenessScore < 60) {
      weaknesses.push('Low content originality');
    }

    if (engagement.engagementScore < 60) {
      weaknesses.push('Low engagement potential');
    }

    if (structure.averageSentenceLength > 30) {
      weaknesses.push('Sentences are too long');
    }

    if (structure.averageSentenceLength < 10) {
      weaknesses.push('Sentences are too short');
    }

    if (optimization.keywordDensity > 5) {
      weaknesses.push('Keyword density too high (keyword stuffing)');
    }

    if (optimization.keywordDensity < 0.5) {
      weaknesses.push('Keyword density too low');
    }

    return weaknesses;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(weaknesses: string[], overallScore: number): string[] {
    const recommendations: string[] = [];

    if (overallScore < 70) {
      recommendations.push('Overall content quality needs significant improvement');
    }

    weaknesses.forEach(weakness => {
      if (weakness.includes('readability')) {
        recommendations.push('Simplify language and reduce sentence complexity');
      }
      if (weakness.includes('structure')) {
        recommendations.push('Improve paragraph organization and content flow');
      }
      if (weakness.includes('optimization')) {
        recommendations.push('Enhance SEO elements including keywords and meta tags');
      }
      if (weakness.includes('originality')) {
        recommendations.push('Add more unique insights and original content');
      }
      if (weakness.includes('engagement')) {
        recommendations.push('Include more questions, examples, and interactive elements');
      }
      if (weakness.includes('sentences are too long')) {
        recommendations.push('Break down long sentences into shorter, clearer ones');
      }
      if (weakness.includes('keyword density too high')) {
        recommendations.push('Reduce keyword usage to avoid over-optimization');
      }
      if (weakness.includes('keyword density too low')) {
        recommendations.push('Increase natural keyword usage throughout content');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Content quality is excellent - maintain current standards');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Helper methods
  private cleanContent(content: string): string {
    return content.replace(/[^\w\s.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private extractSentences(content: string): string[] {
    return content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  }

  private extractWords(content: string): string[] {
    return content.toLowerCase().split(/\s+/).filter(word => word.length > 0 && !this.stopWords.has(word));
  }

  private extractParagraphs(content: string): string[] {
    return content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
  }

  private extractPhrases(content: string): string[] {
    const sentences = this.extractSentences(content);
    const phrases: string[] = [];

    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/);
      for (let i = 0; i < words.length - 2; i++) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
    });

    return phrases;
  }

  private countSyllables(words: string[]): number {
    return words.reduce((total, word) => total + this.countWordSyllables(word), 0);
  }

  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let syllables = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllables++;
      }
      previousWasVowel = isVowel;
    }

    if (word.endsWith('e')) syllables--;
    return Math.max(1, syllables);
  }

  private countComplexWords(words: string[]): number {
    return words.filter(word => this.countWordSyllables(word) >= 3).length;
  }

  private countKeywordOccurrences(content: string, keyword: string): number {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return (content.match(regex) || []).length;
  }

  private calculateKeywordDistribution(content: string, keyword: string): number {
    const sections = content.split(/\n\s*\n/);
    const sectionsWithKeyword = sections.filter(section =>
      section.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    return sections.length > 0 ? (sectionsWithKeyword / sections.length) * 100 : 0;
  }

  private analyzeHeadingOptimization(html: string): number {
    const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
    if (headingMatches.length === 0) return 30;

    const keywordInHeadings = this.options.primaryKeyword ?
      headingMatches.filter(heading =>
        heading.toLowerCase().includes(this.options.primaryKeyword.toLowerCase())
      ).length : 0;

    return Math.min(100, (keywordInHeadings / headingMatches.length) * 100 + 30);
  }

  private analyzeMetaOptimization(html: string): number {
    let score = 50;

    if (html.includes('<title>')) score += 20;
    if (html.includes('name="description"')) score += 20;
    if (this.options.primaryKeyword && html.toLowerCase().includes(this.options.primaryKeyword.toLowerCase())) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private analyzeInternalLinking(html: string): number {
    const internalLinks = (html.match(/<a[^>]*href="[^"]*"[^>]*>/gi) || []).filter(link =>
      !link.includes('http://') && !link.includes('https://')
    );

    return Math.min(100, internalLinks.length * 10 + 30);
  }

  private countCommonPhrases(phrases: string[]): number {
    const commonPhrases = new Set([
      'in this article', 'as we can see', 'it is important', 'on the other hand',
      'in conclusion', 'first of all', 'in addition to', 'as a result'
    ]);

    return phrases.filter(phrase => commonPhrases.has(phrase.toLowerCase())).length;
  }

  private countPersonalPronouns(words: string[]): number {
    const pronouns = new Set(['i', 'you', 'we', 'us', 'our', 'your', 'my', 'me']);
    return words.filter(word => pronouns.has(word.toLowerCase())).length;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;

    return Math.sqrt(variance);
  }

  // Default metrics for disabled features
  private getDefaultReadability(): ReadabilityMetrics {
    return {
      fleschKincaidGrade: 8.0,
      fleschReadingEase: 70.0,
      smogIndex: 8.0,
      automatedReadabilityIndex: 8.0,
      colemanLiauIndex: 8.0,
      gunningFogIndex: 8.0,
      averageGrade: 8.0,
      readabilityScore: 70,
    };
  }

  private getDefaultUniqueness(): UniquenessMetrics {
    return {
      originalityScore: 75,
      duplicateContentPercentage: 25,
      uniquePhrases: 100,
      commonPhrases: 25,
      uniquenessScore: 75,
    };
  }

  private getDefaultEngagement(): EngagementMetrics {
    return {
      emotionalWords: 10,
      actionWords: 5,
      questionCount: 2,
      exclamationCount: 1,
      personalPronouns: 15,
      engagementScore: 60,
    };
  }

  // Word lists
  private getEmotionalWords(): string[] {
    return [
      'amazing', 'awesome', 'brilliant', 'excellent', 'fantastic', 'great', 'incredible',
      'outstanding', 'perfect', 'wonderful', 'exciting', 'thrilling', 'inspiring',
      'powerful', 'effective', 'successful', 'proven', 'guaranteed', 'exclusive',
      'limited', 'urgent', 'important', 'critical', 'essential', 'vital'
    ];
  }

  private getActionWords(): string[] {
    return [
      'discover', 'learn', 'find', 'get', 'start', 'begin', 'create', 'build',
      'develop', 'improve', 'increase', 'boost', 'enhance', 'optimize', 'maximize',
      'achieve', 'reach', 'attain', 'gain', 'obtain', 'acquire', 'master',
      'unlock', 'reveal', 'uncover', 'explore', 'investigate', 'analyze'
    ];
  }

  private getStopWords(): string[] {
    return [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
      'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their'
    ];
  }
}

// Factory function
export const createContentQualityScorer = (options?: ContentQualityOptions): ContentQualityScorer => {
  return new ContentQualityScorer(options);
};

// Default export
export default ContentQualityScorer;
