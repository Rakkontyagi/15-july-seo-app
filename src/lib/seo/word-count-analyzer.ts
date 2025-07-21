/**
 * Word Count Analysis System for SEO Automation App
 * Provides comprehensive word count and content length analysis
 */

import { z } from 'zod';

export interface WordCountAnalysisResult {
  totalWords: number;
  totalCharacters: number;
  totalCharactersNoSpaces: number;
  totalSentences: number;
  totalParagraphs: number;
  averageWordsPerSentence: number;
  averageWordsPerParagraph: number;
  averageSentencesPerParagraph: number;
  averageCharactersPerWord: number;
  wordDistribution: {
    shortWords: number; // 1-3 characters
    mediumWords: number; // 4-6 characters
    longWords: number; // 7+ characters
  };
  wordLengthStats: {
    shortest: number;
    longest: number;
    average: number;
    median: number;
  };
  contentDepth: {
    score: number; // 0-100
    factors: {
      wordCount: number;
      sentenceVariety: number;
      vocabularyRichness: number;
      contentComplexity: number;
    };
  };
  readingTime: {
    fast: number; // 250 wpm
    average: number; // 200 wpm
    slow: number; // 150 wpm
  };
  contentDensity: {
    wordsPerSentence: number;
    charactersPerSentence: number;
    densityScore: number; // 0-100
  };
  uniqueWords: {
    count: number;
    percentage: number;
    topWords: Array<{
      word: string;
      frequency: number;
      percentage: number;
    }>;
  };
}

export interface WordCountComparisonResult {
  current: WordCountAnalysisResult;
  competitors: Array<{
    url: string;
    analysis: WordCountAnalysisResult;
  }>;
  comparison: {
    averageWordCount: number;
    wordCountRanking: number; // 1-based ranking
    lengthAdvantage: 'shorter' | 'average' | 'longer';
    recommendations: string[];
  };
}

export interface WordCountAnalysisOptions {
  includeStopWords?: boolean;
  minWordLength?: number;
  maxWordLength?: number;
  language?: string;
  customStopWords?: string[];
  analyzeComplexity?: boolean;
  compareWithCompetitors?: boolean;
}

const DEFAULT_OPTIONS: Required<WordCountAnalysisOptions> = {
  includeStopWords: true,
  minWordLength: 1,
  maxWordLength: 50,
  language: 'en',
  customStopWords: [],
  analyzeComplexity: true,
  compareWithCompetitors: false,
};

export class WordCountAnalyzer {
  private options: Required<WordCountAnalysisOptions>;
  private stopWords: Set<string>;

  constructor(options: WordCountAnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stopWords = new Set([
      ...this.getDefaultStopWords(),
      ...this.options.customStopWords,
    ]);
  }

  /**
   * Analyze word count and content metrics
   */
  analyzeContent(content: string): WordCountAnalysisResult {
    const cleanContent = this.cleanContent(content);
    
    // Basic counts
    const words = this.extractWords(cleanContent);
    const sentences = this.extractSentences(cleanContent);
    const paragraphs = this.extractParagraphs(cleanContent);
    
    const totalWords = words.length;
    const totalCharacters = cleanContent.length;
    const totalCharactersNoSpaces = cleanContent.replace(/\s/g, '').length;
    const totalSentences = sentences.length;
    const totalParagraphs = paragraphs.length;

    // Calculate averages
    const averageWordsPerSentence = totalSentences > 0 ? totalWords / totalSentences : 0;
    const averageWordsPerParagraph = totalParagraphs > 0 ? totalWords / totalParagraphs : 0;
    const averageSentencesPerParagraph = totalParagraphs > 0 ? totalSentences / totalParagraphs : 0;
    const averageCharactersPerWord = totalWords > 0 ? totalCharactersNoSpaces / totalWords : 0;

    // Word distribution analysis
    const wordDistribution = this.analyzeWordDistribution(words);
    const wordLengthStats = this.calculateWordLengthStats(words);
    
    // Content depth analysis
    const contentDepth = this.analyzeContentDepth(words, sentences, paragraphs);
    
    // Reading time calculation
    const readingTime = this.calculateReadingTime(totalWords);
    
    // Content density analysis
    const contentDensity = this.analyzeContentDensity(
      totalWords,
      totalCharacters,
      totalSentences
    );
    
    // Unique words analysis
    const uniqueWords = this.analyzeUniqueWords(words);

    return {
      totalWords,
      totalCharacters,
      totalCharactersNoSpaces,
      totalSentences,
      totalParagraphs,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      averageWordsPerParagraph: Math.round(averageWordsPerParagraph * 10) / 10,
      averageSentencesPerParagraph: Math.round(averageSentencesPerParagraph * 10) / 10,
      averageCharactersPerWord: Math.round(averageCharactersPerWord * 10) / 10,
      wordDistribution,
      wordLengthStats,
      contentDepth,
      readingTime,
      contentDensity,
      uniqueWords,
    };
  }

  /**
   * Compare content with competitors
   */
  compareWithCompetitors(
    currentContent: string,
    competitorContents: Array<{ url: string; content: string }>
  ): WordCountComparisonResult {
    const current = this.analyzeContent(currentContent);
    
    const competitors = competitorContents.map(({ url, content }) => ({
      url,
      analysis: this.analyzeContent(content),
    }));

    // Calculate comparison metrics
    const allWordCounts = [current.totalWords, ...competitors.map(c => c.analysis.totalWords)];
    const averageWordCount = Math.round(
      allWordCounts.reduce((sum, count) => sum + count, 0) / allWordCounts.length
    );

    // Determine ranking (1-based, lower is better for longer content)
    const sortedCounts = [...allWordCounts].sort((a, b) => b - a);
    const wordCountRanking = sortedCounts.indexOf(current.totalWords) + 1;

    // Determine length advantage
    let lengthAdvantage: 'shorter' | 'average' | 'longer';
    if (current.totalWords < averageWordCount * 0.8) {
      lengthAdvantage = 'shorter';
    } else if (current.totalWords > averageWordCount * 1.2) {
      lengthAdvantage = 'longer';
    } else {
      lengthAdvantage = 'average';
    }

    // Generate recommendations
    const recommendations = this.generateComparisonRecommendations(
      current,
      competitors.map(c => c.analysis),
      lengthAdvantage,
      wordCountRanking
    );

    return {
      current,
      competitors,
      comparison: {
        averageWordCount,
        wordCountRanking,
        lengthAdvantage,
        recommendations,
      },
    };
  }

  /**
   * Clean content for analysis
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Extract words from content
   */
  private extractWords(content: string): string[] {
    const words = content
      .toLowerCase()
      .match(/\b\w+\b/g) || [];

    return words.filter(word => 
      word.length >= this.options.minWordLength &&
      word.length <= this.options.maxWordLength &&
      (this.options.includeStopWords || !this.stopWords.has(word))
    );
  }

  /**
   * Extract sentences from content
   */
  private extractSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Extract paragraphs from content
   */
  private extractParagraphs(content: string): string[] {
    return content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Analyze word distribution by length
   */
  private analyzeWordDistribution(words: string[]) {
    let shortWords = 0;
    let mediumWords = 0;
    let longWords = 0;

    words.forEach(word => {
      if (word.length <= 3) {
        shortWords++;
      } else if (word.length <= 6) {
        mediumWords++;
      } else {
        longWords++;
      }
    });

    return {
      shortWords,
      mediumWords,
      longWords,
    };
  }

  /**
   * Calculate word length statistics
   */
  private calculateWordLengthStats(words: string[]) {
    if (words.length === 0) {
      return { shortest: 0, longest: 0, average: 0, median: 0 };
    }

    const lengths = words.map(word => word.length);
    lengths.sort((a, b) => a - b);

    const shortest = lengths[0];
    const longest = lengths[lengths.length - 1];
    const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const median = lengths.length % 2 === 0
      ? (lengths[lengths.length / 2 - 1] + lengths[lengths.length / 2]) / 2
      : lengths[Math.floor(lengths.length / 2)];

    return {
      shortest,
      longest,
      average: Math.round(average * 10) / 10,
      median,
    };
  }

  /**
   * Analyze content depth and complexity
   */
  private analyzeContentDepth(words: string[], sentences: string[], paragraphs: string[]) {
    if (!this.options.analyzeComplexity) {
      return {
        score: 50,
        factors: {
          wordCount: 50,
          sentenceVariety: 50,
          vocabularyRichness: 50,
          contentComplexity: 50,
        },
      };
    }

    // Word count factor (0-100)
    const wordCountFactor = Math.min(100, (words.length / 1000) * 100);

    // Sentence variety factor (based on sentence length variation)
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    const sentenceVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
    const sentenceVarietyFactor = Math.min(100, sentenceVariance * 2);

    // Vocabulary richness (unique words / total words)
    const uniqueWordCount = new Set(words).size;
    const vocabularyRichnessFactor = (uniqueWordCount / words.length) * 100;

    // Content complexity (based on word length and sentence structure)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const complexityFactor = Math.min(100, (avgWordLength - 3) * 20);

    // Overall score
    const score = Math.round(
      (wordCountFactor + sentenceVarietyFactor + vocabularyRichnessFactor + complexityFactor) / 4
    );

    return {
      score,
      factors: {
        wordCount: Math.round(wordCountFactor),
        sentenceVariety: Math.round(sentenceVarietyFactor),
        vocabularyRichness: Math.round(vocabularyRichnessFactor),
        contentComplexity: Math.round(complexityFactor),
      },
    };
  }

  /**
   * Calculate reading time
   */
  private calculateReadingTime(wordCount: number) {
    return {
      fast: Math.ceil(wordCount / 250), // 250 wpm
      average: Math.ceil(wordCount / 200), // 200 wpm
      slow: Math.ceil(wordCount / 150), // 150 wpm
    };
  }

  /**
   * Analyze content density
   */
  private analyzeContentDensity(wordCount: number, charCount: number, sentenceCount: number) {
    const wordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const charactersPerSentence = sentenceCount > 0 ? charCount / sentenceCount : 0;
    
    // Density score based on optimal ranges
    let densityScore = 100;
    
    // Optimal words per sentence: 15-20
    if (wordsPerSentence < 10 || wordsPerSentence > 25) {
      densityScore -= 20;
    } else if (wordsPerSentence < 15 || wordsPerSentence > 20) {
      densityScore -= 10;
    }
    
    // Optimal characters per sentence: 75-100
    if (charactersPerSentence < 50 || charactersPerSentence > 150) {
      densityScore -= 20;
    } else if (charactersPerSentence < 75 || charactersPerSentence > 100) {
      densityScore -= 10;
    }

    return {
      wordsPerSentence: Math.round(wordsPerSentence * 10) / 10,
      charactersPerSentence: Math.round(charactersPerSentence * 10) / 10,
      densityScore: Math.max(0, densityScore),
    };
  }

  /**
   * Analyze unique words
   */
  private analyzeUniqueWords(words: string[]) {
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const uniqueCount = wordFreq.size;
    const uniquePercentage = words.length > 0 ? (uniqueCount / words.length) * 100 : 0;

    const topWords = Array.from(wordFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, frequency]) => ({
        word,
        frequency,
        percentage: Math.round((frequency / words.length) * 10000) / 100,
      }));

    return {
      count: uniqueCount,
      percentage: Math.round(uniquePercentage * 10) / 10,
      topWords,
    };
  }

  /**
   * Generate comparison recommendations
   */
  private generateComparisonRecommendations(
    current: WordCountAnalysisResult,
    competitors: WordCountAnalysisResult[],
    lengthAdvantage: 'shorter' | 'average' | 'longer',
    ranking: number
  ): string[] {
    const recommendations: string[] = [];

    // Word count recommendations
    if (lengthAdvantage === 'shorter') {
      recommendations.push('Consider expanding your content to match competitor length for better SEO performance');
    } else if (lengthAdvantage === 'longer' && ranking > 3) {
      recommendations.push('Your content is longer than competitors but may benefit from better structure and focus');
    }

    // Content depth recommendations
    const avgCompetitorDepth = competitors.reduce((sum, c) => sum + c.contentDepth.score, 0) / competitors.length;
    if (current.contentDepth.score < avgCompetitorDepth - 10) {
      recommendations.push('Improve content depth and complexity to match top-performing competitors');
    }

    // Vocabulary richness recommendations
    const avgCompetitorVocab = competitors.reduce((sum, c) => sum + c.uniqueWords.percentage, 0) / competitors.length;
    if (current.uniqueWords.percentage < avgCompetitorVocab - 5) {
      recommendations.push('Increase vocabulary diversity to improve content quality and engagement');
    }

    // Reading time recommendations
    const avgCompetitorReadingTime = competitors.reduce((sum, c) => sum + c.readingTime.average, 0) / competitors.length;
    if (current.readingTime.average < avgCompetitorReadingTime * 0.7) {
      recommendations.push('Consider adding more comprehensive information to increase reading time');
    }

    // Sentence structure recommendations
    const avgCompetitorSentenceLength = competitors.reduce((sum, c) => sum + c.averageWordsPerSentence, 0) / competitors.length;
    if (Math.abs(current.averageWordsPerSentence - avgCompetitorSentenceLength) > 5) {
      recommendations.push('Adjust sentence length to match successful competitor patterns');
    }

    return recommendations;
  }

  /**
   * Get default stop words
   */
  private getDefaultStopWords(): string[] {
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
export const createWordCountAnalyzer = (options?: WordCountAnalysisOptions): WordCountAnalyzer => {
  return new WordCountAnalyzer(options);
};

// Default export
export default WordCountAnalyzer;
