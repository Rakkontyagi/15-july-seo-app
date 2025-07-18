
import { PorterStemmer } from 'natural';

export interface KeywordVariation {
  original: string;
  stemmed: string;
  variations: string[];
}

export interface DensityAnalysis {
  currentDensity: number;
  targetDensity: number;
  difference: number;
  requiresAdjustment: boolean;
  recommendedAction: 'increase' | 'decrease' | 'maintain';
  targetOccurrences: number;
  currentOccurrences: number;
}

export interface OptimizationResult {
  originalContent: string;
  optimizedContent: string;
  densityBefore: number;
  densityAfter: number;
  modificationsApplied: number;
  precision: number;
  isOptimized: boolean;
}

export class PrecisionSEOOptimizer {
  private readonly PRECISION_THRESHOLD = 0.01;
  private readonly MAX_ITERATIONS = 10;

  /**
   * Calculate exact keyword density with 0.01% precision
   */
  calculateExactKeywordDensity(content: string, keyword: string): number {
    const words = this.tokenizeContent(content);
    if (words.length === 0) return 0;
    
    const keywordOccurrences = this.countKeywordOccurrences(words, keyword);
    return Number(((keywordOccurrences / words.length) * 100).toFixed(2));
  }

  /**
   * Calculate keyword density including variations and stemmed forms
   */
  calculateVariationDensity(content: string, keyword: string): DensityAnalysis {
    const words = this.tokenizeContent(content);
    const variations = this.generateKeywordVariations(keyword);
    
    let totalOccurrences = 0;
    variations.variations.forEach(variation => {
      totalOccurrences += this.countKeywordOccurrences(words, variation);
    });

    const currentDensity = Number(((totalOccurrences / words.length) * 100).toFixed(2));
    
    return {
      currentDensity,
      targetDensity: 0,
      difference: 0,
      requiresAdjustment: false,
      recommendedAction: 'maintain',
      targetOccurrences: totalOccurrences,
      currentOccurrences: totalOccurrences
    };
  }

  /**
   * Optimize content to match competitor benchmark density
   */
  optimizeToCompetitorBenchmark(
    content: string, 
    keyword: string, 
    targetDensity: number
  ): OptimizationResult {
    const originalDensity = this.calculateExactKeywordDensity(content, keyword);
    const difference = Math.abs(originalDensity - targetDensity);
    
    if (difference <= this.PRECISION_THRESHOLD) {
      return {
        originalContent: content,
        optimizedContent: content,
        densityBefore: originalDensity,
        densityAfter: originalDensity,
        modificationsApplied: 0,
        precision: difference,
        isOptimized: true
      };
    }

    const optimizedContent = this.adjustKeywordDensity(content, keyword, targetDensity);
    const finalDensity = this.calculateExactKeywordDensity(optimizedContent, keyword);
    
    return {
      originalContent: content,
      optimizedContent,
      densityBefore: originalDensity,
      densityAfter: finalDensity,
      modificationsApplied: this.countModifications(content, optimizedContent),
      precision: Math.abs(finalDensity - targetDensity),
      isOptimized: Math.abs(finalDensity - targetDensity) <= this.PRECISION_THRESHOLD
    };
  }

  /**
   * Generate keyword variations including stemmed forms
   */
  private generateKeywordVariations(keyword: string): KeywordVariation {
    const stemmed = PorterStemmer.stem(keyword.toLowerCase());
    const variations = [
      keyword.toLowerCase(),
      stemmed,
      keyword.toLowerCase() + 's',
      keyword.toLowerCase() + 'ing',
      keyword.toLowerCase() + 'ed'
    ];

    return {
      original: keyword,
      stemmed,
      variations: [...new Set(variations)]
    };
  }

  /**
   * Adjust keyword density to match target with precision
   */
  private adjustKeywordDensity(content: string, keyword: string, targetDensity: number): string {
    const words = this.tokenizeContent(content);
    const currentOccurrences = this.countKeywordOccurrences(words, keyword);
    const targetOccurrences = Math.round((targetDensity / 100) * words.length);
    
    if (currentOccurrences === targetOccurrences) {
      return content;
    }

    let optimizedContent = content;
    
    if (currentOccurrences < targetOccurrences) {
      // Need to add keywords
      const keywordsToAdd = targetOccurrences - currentOccurrences;
      optimizedContent = this.addKeywordsNaturally(content, keyword, keywordsToAdd);
    } else {
      // Need to remove keywords
      const keywordsToRemove = currentOccurrences - targetOccurrences;
      optimizedContent = this.removeKeywordsNaturally(content, keyword, keywordsToRemove);
    }

    return optimizedContent;
  }

  /**
   * Add keywords naturally to content
   */
  private addKeywordsNaturally(content: string, keyword: string, count: number): string {
    const sentences = content.split(/[.!?]+/);
    const variations = this.generateKeywordVariations(keyword);
    let optimizedContent = content;
    let addedCount = 0;

    for (let i = 0; i < sentences.length && addedCount < count; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 50 && !sentence.toLowerCase().includes(keyword.toLowerCase())) {
        const variation = variations.variations[addedCount % variations.variations.length];
        const insertionPoint = Math.floor(sentence.length * 0.3);
        
        const beforeInsertion = sentence.substring(0, insertionPoint);
        const afterInsertion = sentence.substring(insertionPoint);
        
        const enhancedSentence = `${beforeInsertion} ${variation} ${afterInsertion}`;
        optimizedContent = optimizedContent.replace(sentence, enhancedSentence);
        addedCount++;
      }
    }

    return optimizedContent;
  }

  /**
   * Remove keywords naturally from content
   */
  private removeKeywordsNaturally(content: string, keyword: string, count: number): string {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = content.match(keywordRegex) || [];
    
    if (matches.length <= count) {
      return content;
    }

    let optimizedContent = content;
    let removedCount = 0;
    
    // Remove keywords from less important positions first
    const sentences = content.split(/[.!?]+/);
    
    for (let i = sentences.length - 1; i >= 0 && removedCount < count; i--) {
      const sentence = sentences[i];
      if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
        const synonyms = this.getKeywordSynonyms(keyword);
        if (synonyms.length > 0) {
          const synonym = synonyms[removedCount % synonyms.length];
          optimizedContent = optimizedContent.replace(
            new RegExp(`\\b${keyword}\\b`, 'i'),
            synonym
          );
          removedCount++;
        }
      }
    }

    return optimizedContent;
  }

  /**
   * Get synonym alternatives for keyword
   */
  private getKeywordSynonyms(keyword: string): string[] {
    // Basic synonym mapping - in production, this would use a thesaurus API
    const synonymMap: { [key: string]: string[] } = {
      'seo': ['search optimization', 'search engine optimization', 'organic search'],
      'content': ['material', 'information', 'text', 'copy'],
      'optimization': ['improvement', 'enhancement', 'refinement'],
      'marketing': ['promotion', 'advertising', 'outreach'],
      'strategy': ['approach', 'plan', 'method', 'technique']
    };

    return synonymMap[keyword.toLowerCase()] || [];
  }

  /**
   * Tokenize content into words
   */
  private tokenizeContent(content: string): string[] {
    return content.toLowerCase().match(/\b\w+\b/g) || [];
  }

  /**
   * Count keyword occurrences with exact matching
   */
  private countKeywordOccurrences(words: string[], keyword: string): number {
    const lowerCaseKeyword = keyword.toLowerCase();
    
    // Handle multi-word keywords
    if (lowerCaseKeyword.includes(' ')) {
      const keywordWords = lowerCaseKeyword.split(' ');
      let count = 0;
      
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        let matches = true;
        for (let j = 0; j < keywordWords.length; j++) {
          if (words[i + j] !== keywordWords[j]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          count++;
        }
      }
      return count;
    }
    
    // Handle single-word keywords
    return words.filter(word => word === lowerCaseKeyword).length;
  }

  /**
   * Count modifications between original and optimized content
   */
  private countModifications(original: string, optimized: string): number {
    const originalWords = this.tokenizeContent(original);
    const optimizedWords = this.tokenizeContent(optimized);
    
    return Math.abs(originalWords.length - optimizedWords.length);
  }

  /**
   * Validate optimization precision
   */
  validateOptimization(content: string, keyword: string, targetDensity: number): boolean {
    const actualDensity = this.calculateExactKeywordDensity(content, keyword);
    const difference = Math.abs(actualDensity - targetDensity);
    return difference <= this.PRECISION_THRESHOLD;
  }

  /**
   * Get detailed optimization report
   */
  getOptimizationReport(content: string, keyword: string, targetDensity: number): DensityAnalysis {
    const words = this.tokenizeContent(content);
    const currentOccurrences = this.countKeywordOccurrences(words, keyword);
    const currentDensity = Number(((currentOccurrences / words.length) * 100).toFixed(2));
    const targetOccurrences = Math.round((targetDensity / 100) * words.length);
    const difference = Math.abs(currentDensity - targetDensity);

    return {
      currentDensity,
      targetDensity,
      difference,
      requiresAdjustment: difference > this.PRECISION_THRESHOLD,
      recommendedAction: currentDensity < targetDensity ? 'increase' : 
                        currentDensity > targetDensity ? 'decrease' : 'maintain',
      targetOccurrences,
      currentOccurrences
    };
  }
}
