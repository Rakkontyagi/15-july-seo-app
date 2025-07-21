/**
 * Text Analysis System for SEO Automation App
 * Provides comprehensive text analysis including readability, sentiment, keywords, and SEO metrics
 */

import { z } from 'zod';

export interface TextAnalysisResult {
  content: string;
  statistics: {
    characterCount: number;
    characterCountNoSpaces: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
    averageSentencesPerParagraph: number;
    averageCharactersPerWord: number;
  };
  readability: {
    fleschKincaidGrade: number;
    fleschReadingEase: number;
    gunningFogIndex: number;
    colemanLiauIndex: number;
    automatedReadabilityIndex: number;
    smogIndex: number;
    readingLevel: 'very_easy' | 'easy' | 'fairly_easy' | 'standard' | 'fairly_difficult' | 'difficult' | 'very_difficult';
    estimatedReadingTime: number; // in minutes
  };
  sentiment: {
    score: number; // -1 to 1
    magnitude: number; // 0 to 1
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number;
  };
  keywords: {
    singleWords: Array<{ word: string; frequency: number; density: number }>;
    phrases: Array<{ phrase: string; frequency: number; density: number }>;
    entities: Array<{ entity: string; type: string; frequency: number }>;
  };
  seo: {
    titleSuggestions: string[];
    metaDescriptionSuggestions: string[];
    keywordDensity: Record<string, number>;
    topKeywords: string[];
    contentScore: number; // 0-100
    recommendations: string[];
  };
  structure: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    hasCallToAction: boolean;
    listCount: number;
    linkCount: number;
    imageCount: number;
    headingDistribution: Record<string, number>;
  };
  quality: {
    grammarIssues: Array<{ type: string; message: string; position: number }>;
    spellingErrors: Array<{ word: string; suggestions: string[]; position: number }>;
    duplicateContent: Array<{ text: string; occurrences: number }>;
    overallScore: number; // 0-100
  };
}

export interface TextAnalysisOptions {
  includeReadability?: boolean;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
  includeSEO?: boolean;
  includeStructure?: boolean;
  includeQuality?: boolean;
  language?: string;
  targetKeywords?: string[];
  minKeywordLength?: number;
  maxKeywordLength?: number;
  keywordDensityThreshold?: number;
}

const DEFAULT_OPTIONS: Required<TextAnalysisOptions> = {
  includeReadability: true,
  includeSentiment: true,
  includeKeywords: true,
  includeSEO: true,
  includeStructure: true,
  includeQuality: true,
  language: 'en',
  targetKeywords: [],
  minKeywordLength: 3,
  maxKeywordLength: 50,
  keywordDensityThreshold: 0.03, // 3%
};

export class TextAnalyzer {
  private options: Required<TextAnalysisOptions>;
  private stopWords: Set<string>;

  constructor(options: TextAnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stopWords = new Set(this.getStopWords());
  }

  /**
   * Analyze text content
   */
  async analyzeText(content: string): Promise<TextAnalysisResult> {
    const cleanContent = this.cleanText(content);
    
    const result: TextAnalysisResult = {
      content: cleanContent,
      statistics: this.calculateStatistics(cleanContent),
      readability: this.options.includeReadability ? this.calculateReadability(cleanContent) : {} as any,
      sentiment: this.options.includeSentiment ? await this.analyzeSentiment(cleanContent) : {} as any,
      keywords: this.options.includeKeywords ? this.extractKeywords(cleanContent) : {} as any,
      seo: this.options.includeSEO ? this.analyzeSEO(cleanContent) : {} as any,
      structure: this.options.includeStructure ? this.analyzeStructure(cleanContent) : {} as any,
      quality: this.options.includeQuality ? await this.analyzeQuality(cleanContent) : {} as any,
    };

    return result;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Calculate basic text statistics
   */
  private calculateStatistics(text: string) {
    const characterCount = text.length;
    const characterCountNoSpaces = text.replace(/\s/g, '').length;
    
    const words = this.getWords(text);
    const wordCount = words.length;
    
    const sentences = this.getSentences(text);
    const sentenceCount = sentences.length;
    
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    return {
      characterCount,
      characterCountNoSpaces,
      wordCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : 0,
      averageSentencesPerParagraph: paragraphCount > 0 ? sentenceCount / paragraphCount : 0,
      averageCharactersPerWord: wordCount > 0 ? characterCountNoSpaces / wordCount : 0,
    };
  }

  /**
   * Calculate readability metrics
   */
  private calculateReadability(text: string) {
    const words = this.getWords(text);
    const sentences = this.getSentences(text);
    const syllables = this.countSyllables(text);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const syllableCount = syllables;

    if (wordCount === 0 || sentenceCount === 0) {
      return {
        fleschKincaidGrade: 0,
        fleschReadingEase: 0,
        gunningFogIndex: 0,
        colemanLiauIndex: 0,
        automatedReadabilityIndex: 0,
        smogIndex: 0,
        readingLevel: 'standard' as const,
        estimatedReadingTime: 0,
      };
    }

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / wordCount;

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    // Flesch Reading Ease
    const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Gunning Fog Index
    const complexWords = words.filter(word => this.countWordSyllables(word) >= 3).length;
    const gunningFogIndex = 0.4 * (avgWordsPerSentence + 100 * (complexWords / wordCount));

    // Coleman-Liau Index
    const avgCharsPerWord = text.replace(/\s/g, '').length / wordCount;
    const colemanLiauIndex = 0.0588 * (avgCharsPerWord * 100 / wordCount) - 0.296 * (sentenceCount * 100 / wordCount) - 15.8;

    // Automated Readability Index
    const automatedReadabilityIndex = 4.71 * avgCharsPerWord + 0.5 * avgWordsPerSentence - 21.43;

    // SMOG Index
    const smogIndex = 1.043 * Math.sqrt(complexWords * (30 / sentenceCount)) + 3.1291;

    // Determine reading level
    const readingLevel = this.getReadingLevel(fleschReadingEase);

    // Estimated reading time (average 200 words per minute)
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    return {
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
      fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
      gunningFogIndex: Math.round(gunningFogIndex * 10) / 10,
      colemanLiauIndex: Math.round(colemanLiauIndex * 10) / 10,
      automatedReadabilityIndex: Math.round(automatedReadabilityIndex * 10) / 10,
      smogIndex: Math.round(smogIndex * 10) / 10,
      readingLevel,
      estimatedReadingTime,
    };
  }

  /**
   * Analyze sentiment
   */
  private async analyzeSentiment(text: string) {
    // Simple sentiment analysis using word lists
    // In production, you might want to use a more sophisticated service
    const positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect',
      'best', 'better', 'improve', 'success', 'win', 'achieve', 'accomplish'
    ]);

    const negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry',
      'sad', 'disappointed', 'frustrated', 'problem', 'issue', 'fail',
      'worst', 'worse', 'difficult', 'hard', 'impossible', 'never'
    ]);

    const words = this.getWords(text.toLowerCase());
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.has(word)) positiveCount++;
      if (negativeWords.has(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords > 0 
      ? (positiveCount - negativeCount) / totalSentimentWords 
      : 0;

    const magnitude = totalSentimentWords / words.length;
    const confidence = Math.min(totalSentimentWords / 10, 1);

    let label: TextAnalysisResult['sentiment']['label'];
    if (score >= 0.6) label = 'very_positive';
    else if (score >= 0.2) label = 'positive';
    else if (score <= -0.6) label = 'very_negative';
    else if (score <= -0.2) label = 'negative';
    else label = 'neutral';

    return {
      score: Math.round(score * 100) / 100,
      magnitude: Math.round(magnitude * 100) / 100,
      label,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Extract keywords and phrases
   */
  private extractKeywords(text: string) {
    const words = this.getWords(text.toLowerCase())
      .filter(word => 
        word.length >= this.options.minKeywordLength &&
        !this.stopWords.has(word) &&
        /^[a-zA-Z]+$/.test(word)
      );

    // Single word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const totalWords = words.length;
    const singleWords = Array.from(wordFreq.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        density: frequency / totalWords,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    // Extract phrases (2-4 words)
    const phrases = this.extractPhrases(text, 2, 4);
    
    // Simple entity extraction (capitalized words)
    const entities = this.extractEntities(text);

    return {
      singleWords,
      phrases,
      entities,
    };
  }

  /**
   * Analyze SEO aspects
   */
  private analyzeSEO(text: string) {
    const words = this.getWords(text.toLowerCase());
    const sentences = this.getSentences(text);
    
    // Calculate keyword density
    const keywordDensity: Record<string, number> = {};
    this.options.targetKeywords.forEach(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      let count = 0;
      
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        const slice = words.slice(i, i + keywordWords.length);
        if (slice.join(' ') === keywordWords.join(' ')) {
          count++;
        }
      }
      
      keywordDensity[keyword] = count / words.length;
    });

    // Generate title suggestions
    const titleSuggestions = this.generateTitleSuggestions(text);
    
    // Generate meta description suggestions
    const metaDescriptionSuggestions = this.generateMetaDescriptionSuggestions(text);
    
    // Get top keywords
    const topKeywords = this.extractKeywords(text).singleWords
      .slice(0, 10)
      .map(kw => kw.word);

    // Calculate content score
    const contentScore = this.calculateContentScore(text, keywordDensity);

    // Generate recommendations
    const recommendations = this.generateSEORecommendations(text, keywordDensity, contentScore);

    return {
      titleSuggestions,
      metaDescriptionSuggestions,
      keywordDensity,
      topKeywords,
      contentScore,
      recommendations,
    };
  }

  /**
   * Analyze content structure
   */
  private analyzeStructure(text: string) {
    const hasIntroduction = this.hasIntroduction(text);
    const hasConclusion = this.hasConclusion(text);
    const hasCallToAction = this.hasCallToAction(text);
    
    // Count lists (simple detection)
    const listCount = (text.match(/^\s*[-*+]\s+/gm) || []).length +
                     (text.match(/^\s*\d+\.\s+/gm) || []).length;
    
    // Count links (markdown format)
    const linkCount = (text.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
    
    // Count images (markdown format)
    const imageCount = (text.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length;
    
    // Heading distribution
    const headingDistribution: Record<string, number> = {};
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`^#{${i}}\\s+`, 'gm');
      headingDistribution[`h${i}`] = (text.match(regex) || []).length;
    }

    return {
      hasIntroduction,
      hasConclusion,
      hasCallToAction,
      listCount,
      linkCount,
      imageCount,
      headingDistribution,
    };
  }

  /**
   * Analyze content quality
   */
  private async analyzeQuality(text: string) {
    // Simple quality checks
    const grammarIssues: Array<{ type: string; message: string; position: number }> = [];
    const spellingErrors: Array<{ word: string; suggestions: string[]; position: number }> = [];
    const duplicateContent: Array<{ text: string; occurrences: number }> = [];

    // Check for duplicate sentences
    const sentences = this.getSentences(text);
    const sentenceMap = new Map<string, number>();
    
    sentences.forEach(sentence => {
      const normalized = sentence.toLowerCase().trim();
      if (normalized.length > 20) {
        sentenceMap.set(normalized, (sentenceMap.get(normalized) || 0) + 1);
      }
    });

    sentenceMap.forEach((count, sentence) => {
      if (count > 1) {
        duplicateContent.push({
          text: sentence.substring(0, 100) + (sentence.length > 100 ? '...' : ''),
          occurrences: count,
        });
      }
    });

    // Calculate overall quality score
    let overallScore = 100;
    overallScore -= grammarIssues.length * 5;
    overallScore -= spellingErrors.length * 3;
    overallScore -= duplicateContent.length * 10;
    overallScore = Math.max(0, overallScore);

    return {
      grammarIssues,
      spellingErrors,
      duplicateContent,
      overallScore,
    };
  }

  // Helper methods
  private getWords(text: string): string[] {
    return text.match(/\b\w+\b/g) || [];
  }

  private getSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private countSyllables(text: string): number {
    const words = this.getWords(text);
    return words.reduce((total, word) => total + this.countWordSyllables(word), 0);
  }

  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }
    
    // Handle silent e
    if (word.endsWith('e')) {
      syllableCount--;
    }
    
    return Math.max(1, syllableCount);
  }

  private getReadingLevel(score: number): TextAnalysisResult['readability']['readingLevel'] {
    if (score >= 90) return 'very_easy';
    if (score >= 80) return 'easy';
    if (score >= 70) return 'fairly_easy';
    if (score >= 60) return 'standard';
    if (score >= 50) return 'fairly_difficult';
    if (score >= 30) return 'difficult';
    return 'very_difficult';
  }

  private extractPhrases(text: string, minLength: number, maxLength: number) {
    const words = this.getWords(text.toLowerCase());
    const phrases = new Map<string, number>();
    
    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length >= this.options.minKeywordLength && 
            phrase.length <= this.options.maxKeywordLength &&
            !this.stopWords.has(words[i])) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    }
    
    return Array.from(phrases.entries())
      .filter(([_, frequency]) => frequency > 1)
      .map(([phrase, frequency]) => ({
        phrase,
        frequency,
        density: frequency / words.length,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);
  }

  private extractEntities(text: string) {
    // Simple entity extraction based on capitalization
    const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
    const entityMap = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 2 && !this.stopWords.has(word.toLowerCase())) {
        entityMap.set(word, (entityMap.get(word) || 0) + 1);
      }
    });
    
    return Array.from(entityMap.entries())
      .map(([entity, frequency]) => ({
        entity,
        type: 'PERSON_OR_ORGANIZATION', // Simplified
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private generateTitleSuggestions(text: string): string[] {
    const keywords = this.extractKeywords(text).singleWords.slice(0, 5);
    const suggestions: string[] = [];
    
    // Generate title suggestions based on top keywords
    keywords.forEach(kw => {
      suggestions.push(`The Ultimate Guide to ${kw.word.charAt(0).toUpperCase() + kw.word.slice(1)}`);
      suggestions.push(`How to Master ${kw.word.charAt(0).toUpperCase() + kw.word.slice(1)}`);
      suggestions.push(`${kw.word.charAt(0).toUpperCase() + kw.word.slice(1)}: Everything You Need to Know`);
    });
    
    return suggestions.slice(0, 10);
  }

  private generateMetaDescriptionSuggestions(text: string): string[] {
    const sentences = this.getSentences(text);
    const suggestions: string[] = [];
    
    // Use first few sentences as base for meta descriptions
    sentences.slice(0, 3).forEach(sentence => {
      if (sentence.length >= 120 && sentence.length <= 160) {
        suggestions.push(sentence.trim());
      }
    });
    
    return suggestions.slice(0, 5);
  }

  private calculateContentScore(text: string, keywordDensity: Record<string, number>): number {
    let score = 50; // Base score
    
    const wordCount = this.getWords(text).length;
    
    // Word count scoring
    if (wordCount >= 300 && wordCount <= 2000) score += 20;
    else if (wordCount >= 200) score += 10;
    
    // Keyword density scoring
    Object.values(keywordDensity).forEach(density => {
      if (density >= 0.01 && density <= 0.03) score += 15;
      else if (density > 0.03) score -= 10;
    });
    
    return Math.min(100, Math.max(0, score));
  }

  private generateSEORecommendations(text: string, keywordDensity: Record<string, number>, contentScore: number): string[] {
    const recommendations: string[] = [];
    const wordCount = this.getWords(text).length;
    
    if (wordCount < 300) {
      recommendations.push('Increase content length to at least 300 words for better SEO');
    }
    
    if (Object.keys(keywordDensity).length === 0) {
      recommendations.push('Add target keywords to improve SEO relevance');
    }
    
    Object.entries(keywordDensity).forEach(([keyword, density]) => {
      if (density < 0.01) {
        recommendations.push(`Increase density of keyword "${keyword}" (currently ${(density * 100).toFixed(2)}%)`);
      } else if (density > 0.03) {
        recommendations.push(`Reduce density of keyword "${keyword}" to avoid over-optimization (currently ${(density * 100).toFixed(2)}%)`);
      }
    });
    
    if (contentScore < 70) {
      recommendations.push('Improve content quality and keyword optimization for better SEO performance');
    }
    
    return recommendations;
  }

  private hasIntroduction(text: string): boolean {
    const paragraphs = text.split('\n\n');
    const firstParagraph = paragraphs.length > 0 ? paragraphs[0] : '';
    return firstParagraph && firstParagraph.length > 100;
  }

  private hasConclusion(text: string): boolean {
    const paragraphs = text.split('\n\n');
    const lastParagraph = paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] : '';
    return lastParagraph && lastParagraph.length > 50 && 
           /\b(conclusion|summary|finally|in summary|to conclude)\b/i.test(lastParagraph);
  }

  private hasCallToAction(text: string): boolean {
    return /\b(click here|learn more|get started|sign up|subscribe|contact us|buy now|download)\b/i.test(text);
  }

  private getStopWords(): string[] {
    return [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'would', 'you', 'your', 'have', 'had',
      'this', 'these', 'they', 'were', 'been', 'their', 'said', 'each',
      'which', 'she', 'do', 'how', 'if', 'up', 'out', 'many', 'then',
      'them', 'can', 'could', 'should', 'would', 'about', 'after', 'all',
      'also', 'am', 'another', 'any', 'because', 'before', 'being', 'between',
      'both', 'but', 'came', 'come', 'did', 'each', 'even', 'every', 'get',
      'going', 'good', 'got', 'great', 'had', 'her', 'here', 'him', 'his',
      'how', 'i', 'into', 'just', 'like', 'make', 'me', 'more', 'most',
      'my', 'new', 'no', 'not', 'now', 'only', 'or', 'other', 'our', 'over',
      'own', 'people', 'same', 'see', 'so', 'some', 'take', 'than', 'time',
      'two', 'up', 'use', 'very', 'want', 'way', 'we', 'well', 'what',
      'when', 'where', 'who', 'why', 'work', 'year', 'years'
    ];
  }
}

// Factory function
export const createTextAnalyzer = (options?: TextAnalysisOptions): TextAnalyzer => {
  return new TextAnalyzer(options);
};

// Default export
export default TextAnalyzer;
