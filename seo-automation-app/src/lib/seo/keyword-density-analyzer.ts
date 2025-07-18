/**
 * Keyword Density Analysis System for SEO Automation App
 * Provides comprehensive keyword frequency and density analysis
 */

import { z } from 'zod';

export interface KeywordDensityResult {
  keyword: string;
  variations: string[];
  frequency: number;
  density: number; // percentage
  positions: number[];
  prominence: {
    inTitle: boolean;
    inHeadings: number; // count in headings
    inFirstParagraph: boolean;
    inLastParagraph: boolean;
    inMetaDescription: boolean;
    prominenceScore: number; // 0-100
  };
  distribution: {
    firstHalf: number;
    secondHalf: number;
    evenDistribution: boolean;
    distributionScore: number; // 0-100
  };
  context: Array<{
    position: number;
    sentence: string;
    surrounding: string;
  }>;
}

export interface KeywordDensityAnalysisResult {
  content: {
    totalWords: number;
    totalCharacters: number;
    analyzedText: string;
  };
  primaryKeyword: KeywordDensityResult;
  keywordVariations: KeywordDensityResult[];
  relatedKeywords: KeywordDensityResult[];
  overallDensity: {
    totalKeywordDensity: number;
    optimalRange: { min: number; max: number };
    isOptimal: boolean;
    recommendations: string[];
  };
  competitorComparison?: {
    averageDensity: number;
    ranking: number;
    competitorData: Array<{
      url: string;
      density: number;
      frequency: number;
    }>;
    recommendations: string[];
  };
}

export interface KeywordDensityOptions {
  primaryKeyword: string;
  keywordVariations?: string[];
  relatedKeywords?: string[];
  caseSensitive?: boolean;
  includePartialMatches?: boolean;
  stemming?: boolean;
  language?: string;
  optimalDensityRange?: { min: number; max: number };
  analyzeProminence?: boolean;
  analyzeDistribution?: boolean;
  extractContext?: boolean;
  contextLength?: number;
}

const DEFAULT_OPTIONS: Required<KeywordDensityOptions> = {
  primaryKeyword: '',
  keywordVariations: [],
  relatedKeywords: [],
  caseSensitive: false,
  includePartialMatches: false,
  stemming: false,
  language: 'en',
  optimalDensityRange: { min: 1, max: 3 },
  analyzeProminence: true,
  analyzeDistribution: true,
  extractContext: true,
  contextLength: 100,
};

export class KeywordDensityAnalyzer {
  private options: Required<KeywordDensityOptions>;

  constructor(options: KeywordDensityOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze keyword density in content
   */
  analyzeContent(
    content: string,
    title?: string,
    headings?: string[],
    metaDescription?: string
  ): KeywordDensityAnalysisResult {
    const cleanContent = this.cleanContent(content);
    const words = this.extractWords(cleanContent);
    const totalWords = words.length;

    // Analyze primary keyword
    const primaryKeyword = this.analyzeKeyword(
      this.options.primaryKeyword,
      cleanContent,
      words,
      title,
      headings,
      metaDescription
    );

    // Analyze keyword variations
    const keywordVariations = this.options.keywordVariations.map(variation =>
      this.analyzeKeyword(variation, cleanContent, words, title, headings, metaDescription)
    );

    // Analyze related keywords
    const relatedKeywords = this.options.relatedKeywords.map(related =>
      this.analyzeKeyword(related, cleanContent, words, title, headings, metaDescription)
    );

    // Calculate overall density
    const totalKeywordFrequency = primaryKeyword.frequency + 
      keywordVariations.reduce((sum, kw) => sum + kw.frequency, 0);
    const totalKeywordDensity = totalWords > 0 ? (totalKeywordFrequency / totalWords) * 100 : 0;

    const isOptimal = totalKeywordDensity >= this.options.optimalDensityRange.min &&
                     totalKeywordDensity <= this.options.optimalDensityRange.max;

    const overallDensity = {
      totalKeywordDensity: Math.round(totalKeywordDensity * 100) / 100,
      optimalRange: this.options.optimalDensityRange,
      isOptimal,
      recommendations: this.generateDensityRecommendations(totalKeywordDensity, primaryKeyword),
    };

    return {
      content: {
        totalWords,
        totalCharacters: cleanContent.length,
        analyzedText: cleanContent.substring(0, 500) + (cleanContent.length > 500 ? '...' : ''),
      },
      primaryKeyword,
      keywordVariations,
      relatedKeywords,
      overallDensity,
    };
  }

  /**
   * Compare with competitor content
   */
  compareWithCompetitors(
    currentAnalysis: KeywordDensityAnalysisResult,
    competitorContents: Array<{ url: string; content: string; title?: string; headings?: string[]; metaDescription?: string }>
  ): KeywordDensityAnalysisResult {
    const competitorAnalyses = competitorContents.map(({ url, content, title, headings, metaDescription }) => {
      const analysis = this.analyzeContent(content, title, headings, metaDescription);
      return {
        url,
        density: analysis.primaryKeyword.density,
        frequency: analysis.primaryKeyword.frequency,
      };
    });

    const averageDensity = competitorAnalyses.length > 0
      ? competitorAnalyses.reduce((sum, comp) => sum + comp.density, 0) / competitorAnalyses.length
      : 0;

    // Calculate ranking (1-based, higher density = better ranking for SEO)
    const allDensities = [currentAnalysis.primaryKeyword.density, ...competitorAnalyses.map(c => c.density)];
    const sortedDensities = [...allDensities].sort((a, b) => b - a);
    const ranking = sortedDensities.indexOf(currentAnalysis.primaryKeyword.density) + 1;

    const competitorComparison = {
      averageDensity: Math.round(averageDensity * 100) / 100,
      ranking,
      competitorData: competitorAnalyses,
      recommendations: this.generateCompetitorRecommendations(
        currentAnalysis.primaryKeyword.density,
        averageDensity,
        ranking
      ),
    };

    return {
      ...currentAnalysis,
      competitorComparison,
    };
  }

  /**
   * Analyze individual keyword
   */
  private analyzeKeyword(
    keyword: string,
    content: string,
    words: string[],
    title?: string,
    headings?: string[],
    metaDescription?: string
  ): KeywordDensityResult {
    const keywordWords = this.extractWords(keyword);
    const keywordLength = keywordWords.length;
    
    // Find all occurrences
    const positions: number[] = [];
    const context: KeywordDensityResult['context'] = [];
    
    // Search for exact phrase matches
    for (let i = 0; i <= words.length - keywordLength; i++) {
      const slice = words.slice(i, i + keywordLength);
      const sliceText = slice.join(' ');
      
      if (this.matchesKeyword(sliceText, keyword)) {
        positions.push(i);
        
        if (this.options.extractContext) {
          const contextStart = Math.max(0, i - 10);
          const contextEnd = Math.min(words.length, i + keywordLength + 10);
          const contextWords = words.slice(contextStart, contextEnd);
          const sentence = this.extractSentenceContaining(content, sliceText);
          
          context.push({
            position: i,
            sentence,
            surrounding: contextWords.join(' '),
          });
        }
      }
    }

    const frequency = positions.length;
    const density = words.length > 0 ? (frequency / words.length) * 100 : 0;

    // Analyze prominence
    const prominence = this.options.analyzeProminence
      ? this.analyzeProminence(keyword, title, headings, metaDescription, content)
      : {
          inTitle: false,
          inHeadings: 0,
          inFirstParagraph: false,
          inLastParagraph: false,
          inMetaDescription: false,
          prominenceScore: 0,
        };

    // Analyze distribution
    const distribution = this.options.analyzeDistribution
      ? this.analyzeDistribution(positions, words.length)
      : {
          firstHalf: 0,
          secondHalf: 0,
          evenDistribution: false,
          distributionScore: 0,
        };

    return {
      keyword,
      variations: this.generateVariations(keyword),
      frequency,
      density: Math.round(density * 100) / 100,
      positions,
      prominence,
      distribution,
      context: context.slice(0, 5), // Limit to first 5 contexts
    };
  }

  /**
   * Check if text matches keyword
   */
  private matchesKeyword(text: string, keyword: string): boolean {
    const normalizedText = this.options.caseSensitive ? text : text.toLowerCase();
    const normalizedKeyword = this.options.caseSensitive ? keyword : keyword.toLowerCase();

    if (this.options.includePartialMatches) {
      return normalizedText.includes(normalizedKeyword);
    }

    return normalizedText === normalizedKeyword;
  }

  /**
   * Analyze keyword prominence
   */
  private analyzeProminence(
    keyword: string,
    title?: string,
    headings?: string[],
    metaDescription?: string,
    content?: string
  ) {
    const normalizedKeyword = this.options.caseSensitive ? keyword : keyword.toLowerCase();
    
    const inTitle = title ? this.containsKeyword(title, normalizedKeyword) : false;
    const inHeadings = headings ? headings.filter(h => this.containsKeyword(h, normalizedKeyword)).length : 0;
    const inMetaDescription = metaDescription ? this.containsKeyword(metaDescription, normalizedKeyword) : false;
    
    let inFirstParagraph = false;
    let inLastParagraph = false;
    
    if (content) {
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      if (paragraphs.length > 0) {
        inFirstParagraph = this.containsKeyword(paragraphs[0], normalizedKeyword);
        inLastParagraph = this.containsKeyword(paragraphs[paragraphs.length - 1], normalizedKeyword);
      }
    }

    // Calculate prominence score
    let prominenceScore = 0;
    if (inTitle) prominenceScore += 30;
    if (inHeadings > 0) prominenceScore += Math.min(25, inHeadings * 10);
    if (inFirstParagraph) prominenceScore += 20;
    if (inMetaDescription) prominenceScore += 15;
    if (inLastParagraph) prominenceScore += 10;

    return {
      inTitle,
      inHeadings,
      inFirstParagraph,
      inLastParagraph,
      inMetaDescription,
      prominenceScore: Math.min(100, prominenceScore),
    };
  }

  /**
   * Analyze keyword distribution
   */
  private analyzeDistribution(positions: number[], totalWords: number) {
    if (positions.length === 0 || totalWords === 0) {
      return {
        firstHalf: 0,
        secondHalf: 0,
        evenDistribution: false,
        distributionScore: 0,
      };
    }

    const midPoint = totalWords / 2;
    const firstHalf = positions.filter(pos => pos < midPoint).length;
    const secondHalf = positions.filter(pos => pos >= midPoint).length;
    
    // Check for even distribution (within 20% difference)
    const total = firstHalf + secondHalf;
    const expectedHalf = total / 2;
    const difference = Math.abs(firstHalf - expectedHalf) / expectedHalf;
    const evenDistribution = difference <= 0.2;

    // Calculate distribution score
    let distributionScore = 100;
    if (!evenDistribution) {
      distributionScore -= difference * 50;
    }

    // Penalize clustering (keywords too close together)
    if (positions.length > 1) {
      const distances = [];
      for (let i = 1; i < positions.length; i++) {
        distances.push(positions[i] - positions[i - 1]);
      }
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const expectedDistance = totalWords / positions.length;
      
      if (avgDistance < expectedDistance * 0.5) {
        distributionScore -= 20; // Penalty for clustering
      }
    }

    return {
      firstHalf,
      secondHalf,
      evenDistribution,
      distributionScore: Math.max(0, Math.round(distributionScore)),
    };
  }

  /**
   * Check if text contains keyword
   */
  private containsKeyword(text: string, keyword: string): boolean {
    const normalizedText = this.options.caseSensitive ? text : text.toLowerCase();
    const normalizedKeyword = this.options.caseSensitive ? keyword : keyword.toLowerCase();
    return normalizedText.includes(normalizedKeyword);
  }

  /**
   * Extract sentence containing specific text
   */
  private extractSentenceContaining(content: string, text: string): string {
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const normalizedText = this.options.caseSensitive ? text : text.toLowerCase();
    
    for (const sentence of sentences) {
      const normalizedSentence = this.options.caseSensitive ? sentence : sentence.toLowerCase();
      if (normalizedSentence.includes(normalizedText)) {
        return sentence.substring(0, 200) + (sentence.length > 200 ? '...' : '');
      }
    }
    
    return '';
  }

  /**
   * Generate keyword variations
   */
  private generateVariations(keyword: string): string[] {
    const variations: string[] = [];
    
    // Add plural/singular forms
    if (keyword.endsWith('s')) {
      variations.push(keyword.slice(0, -1));
    } else {
      variations.push(keyword + 's');
    }
    
    // Add common variations
    if (keyword.includes(' ')) {
      variations.push(keyword.replace(/\s+/g, ''));
      variations.push(keyword.replace(/\s+/g, '-'));
    }
    
    return [...new Set(variations)];
  }

  /**
   * Generate density recommendations
   */
  private generateDensityRecommendations(density: number, primaryKeyword: KeywordDensityResult): string[] {
    const recommendations: string[] = [];
    const { min, max } = this.options.optimalDensityRange;

    if (density < min) {
      recommendations.push(`Increase keyword density to at least ${min}% (currently ${density.toFixed(2)}%)`);
      recommendations.push('Add more instances of your primary keyword naturally throughout the content');
      
      if (primaryKeyword.prominence.prominenceScore < 50) {
        recommendations.push('Include the keyword in title, headings, and first paragraph for better prominence');
      }
    } else if (density > max) {
      recommendations.push(`Reduce keyword density to below ${max}% to avoid over-optimization (currently ${density.toFixed(2)}%)`);
      recommendations.push('Replace some keyword instances with synonyms or related terms');
      recommendations.push('Focus on natural language and user experience over keyword stuffing');
    } else {
      recommendations.push('Keyword density is within optimal range');
      
      if (!primaryKeyword.distribution.evenDistribution) {
        recommendations.push('Improve keyword distribution throughout the content for better SEO');
      }
    }

    if (primaryKeyword.frequency === 0) {
      recommendations.push('Primary keyword not found in content - ensure it appears naturally');
    }

    return recommendations;
  }

  /**
   * Generate competitor comparison recommendations
   */
  private generateCompetitorRecommendations(
    currentDensity: number,
    averageDensity: number,
    ranking: number
  ): string[] {
    const recommendations: string[] = [];

    if (ranking > 3) {
      recommendations.push('Your keyword density is below top competitors - consider optimization');
    }

    if (currentDensity < averageDensity * 0.8) {
      recommendations.push(`Increase keyword density to match competitors (average: ${averageDensity.toFixed(2)}%)`);
    } else if (currentDensity > averageDensity * 1.5) {
      recommendations.push('Your keyword density is significantly higher than competitors - ensure natural usage');
    }

    if (ranking === 1) {
      recommendations.push('Excellent keyword density compared to competitors - maintain this level');
    }

    return recommendations;
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
    const text = this.options.caseSensitive ? content : content.toLowerCase();
    return text.match(/\b\w+\b/g) || [];
  }
}

// Factory function
export const createKeywordDensityAnalyzer = (options: KeywordDensityOptions): KeywordDensityAnalyzer => {
  return new KeywordDensityAnalyzer(options);
};

// Default export
export default KeywordDensityAnalyzer;
