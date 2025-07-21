
import { logger } from '../utils/logger';

export interface UniquenessVerificationResult {
  isUnique: boolean;
  similarityScore: number; // 0-100, lower is more unique
  plagiarismDetectedPhrases: string[];
  recommendations: string[];
  confidence: number;
  duplicatePercentage: number;
  originalityScore: number;
  semanticSimilarityScore: number;
  sources: PotentialSource[];
}

export interface PotentialSource {
  url?: string;
  title?: string;
  similarity: number;
  matchedPhrases: string[];
  type: 'exact_match' | 'paraphrase' | 'semantic_similarity';
}

export interface UniquenessOptions {
  strictness: 'lenient' | 'moderate' | 'strict';
  checkSemanticSimilarity: boolean;
  minPhraseLength: number;
  maxSimilarityThreshold: number;
  enableExternalCheck: boolean;
}

/**
 * Production-Grade Uniqueness Verifier
 * Ensures generated content is original and passes plagiarism detection
 */
export class UniquenessVerifier {
  private readonly commonPhrases = [
    'in today\'s world',
    'it is important to note',
    'on the other hand',
    'in conclusion',
    'as we can see',
    'it should be noted',
    'in other words',
    'for example',
    'such as',
    'in addition'
  ];

  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
  ]);

  /**
   * Comprehensive uniqueness verification with multiple detection methods
   */
  async verifyUniqueness(
    content: string,
    comparisonCorpus: string[] = [],
    options: UniquenessOptions = {
      strictness: 'moderate',
      checkSemanticSimilarity: true,
      minPhraseLength: 5,
      maxSimilarityThreshold: 15,
      enableExternalCheck: false // Set to true when external APIs are available
    }
  ): Promise<UniquenessVerificationResult> {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Content must be a non-empty string');
      }

      const recommendations: string[] = [];
      const plagiarismDetectedPhrases: string[] = [];
      const sources: PotentialSource[] = [];

      // Step 1: Exact phrase matching
      const exactMatches = await this.detectExactMatches(content, comparisonCorpus, options);
      plagiarismDetectedPhrases.push(...exactMatches.phrases);
      sources.push(...exactMatches.sources);

      // Step 2: Paraphrase detection
      const paraphraseMatches = await this.detectParaphrases(content, comparisonCorpus, options);
      sources.push(...paraphraseMatches);

      // Step 3: Semantic similarity analysis
      let semanticSimilarityScore = 0;
      if (options.checkSemanticSimilarity) {
        semanticSimilarityScore = await this.analyzeSemanticSimilarity(content, comparisonCorpus);
      }

      // Step 4: Common phrase detection
      const commonPhraseMatches = this.detectCommonPhrases(content);
      plagiarismDetectedPhrases.push(...commonPhraseMatches);

      // Step 5: Calculate scores
      const duplicatePercentage = this.calculateDuplicatePercentage(content, plagiarismDetectedPhrases);
      const originalityScore = Math.max(0, 100 - duplicatePercentage);
      const similarityScore = Math.max(duplicatePercentage, semanticSimilarityScore);

      // Step 6: Determine uniqueness
      const isUnique = this.determineUniqueness(similarityScore, options);

      // Step 7: Generate recommendations
      recommendations.push(...this.generateRecommendations(plagiarismDetectedPhrases, similarityScore, options));

      const confidence = this.calculateConfidence(content, comparisonCorpus, options);

      logger.info('Uniqueness verification completed', {
        contentLength: content.length,
        similarityScore,
        originalityScore,
        duplicatePercentage,
        isUnique,
        sourcesFound: sources.length
      });

      return {
        isUnique,
        similarityScore,
        plagiarismDetectedPhrases,
        recommendations,
        confidence,
        duplicatePercentage,
        originalityScore,
        semanticSimilarityScore,
        sources
      };

    } catch (error) {
      logger.error('Uniqueness verification failed', { error });
      throw new Error(`Uniqueness verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect exact phrase matches
   */
  private async detectExactMatches(
    content: string,
    comparisonCorpus: string[],
    options: UniquenessOptions
  ): Promise<{ phrases: string[], sources: PotentialSource[] }> {
    const phrases: string[] = [];
    const sources: PotentialSource[] = [];

    const contentPhrases = this.extractPhrases(content, options.minPhraseLength);

    comparisonCorpus.forEach((compareText, index) => {
      const comparePhrases = this.extractPhrases(compareText, options.minPhraseLength);

      contentPhrases.forEach(phrase => {
        if (comparePhrases.includes(phrase) && !this.isCommonPhrase(phrase)) {
          phrases.push(phrase);

          // Find or create source
          let source = sources.find(s => s.title === `Source ${index + 1}`);
          if (!source) {
            source = {
              title: `Source ${index + 1}`,
              similarity: 0,
              matchedPhrases: [],
              type: 'exact_match'
            };
            sources.push(source);
          }

          source.matchedPhrases.push(phrase);
          source.similarity = Math.max(source.similarity, (phrase.length / content.length) * 100);
        }
      });
    });

    return { phrases: [...new Set(phrases)], sources };
  }

  /**
   * Detect paraphrases using advanced NLP techniques
   */
  private async detectParaphrases(
    content: string,
    comparisonCorpus: string[],
    options: UniquenessOptions
  ): Promise<PotentialSource[]> {
    const sources: PotentialSource[] = [];

    // This would integrate with external paraphrase detection APIs
    // For now, implementing basic semantic similarity

    const contentSentences = this.extractSentences(content);

    comparisonCorpus.forEach((compareText, index) => {
      const compareSentences = this.extractSentences(compareText);
      const matchedPhrases: string[] = [];
      let totalSimilarity = 0;
      let matches = 0;

      contentSentences.forEach(contentSentence => {
        compareSentences.forEach(compareSentence => {
          const similarity = this.calculateSentenceSimilarity(contentSentence, compareSentence);
          if (similarity > 0.7) { // 70% similarity threshold for paraphrases
            matchedPhrases.push(contentSentence);
            totalSimilarity += similarity;
            matches++;
          }
        });
      });

      if (matches > 0) {
        sources.push({
          title: `Paraphrase Source ${index + 1}`,
          similarity: (totalSimilarity / matches) * 100,
          matchedPhrases,
          type: 'paraphrase'
        });
      }
    });

    return sources;
  }

  /**
   * Analyze semantic similarity
   */
  private async analyzeSemanticSimilarity(content: string, comparisonCorpus: string[]): Promise<number> {
    if (comparisonCorpus.length === 0) return 0;

    let maxSimilarity = 0;

    comparisonCorpus.forEach(compareText => {
      const similarity = this.calculateTextSimilarity(content, compareText);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return maxSimilarity;
  }

  /**
   * Detect common phrases that might indicate generic content
   */
  private detectCommonPhrases(content: string): string[] {
    const detectedPhrases: string[] = [];
    const lowerContent = content.toLowerCase();

    this.commonPhrases.forEach(phrase => {
      if (lowerContent.includes(phrase)) {
        detectedPhrases.push(phrase);
      }
    });

    return detectedPhrases;
  }

  /**
   * Calculate duplicate percentage
   */
  private calculateDuplicatePercentage(content: string, duplicatePhrases: string[]): number {
    if (duplicatePhrases.length === 0) return 0;

    const totalDuplicateLength = duplicatePhrases.reduce((sum, phrase) => sum + phrase.length, 0);
    return Math.min(100, (totalDuplicateLength / content.length) * 100);
  }

  /**
   * Determine if content is unique based on similarity score and options
   */
  private determineUniqueness(similarityScore: number, options: UniquenessOptions): boolean {
    const threshold = options.strictness === 'strict' ? 5 :
                     options.strictness === 'moderate' ? 15 : 25;

    return similarityScore <= Math.min(threshold, options.maxSimilarityThreshold);
  }

  /**
   * Generate recommendations for improving uniqueness
   */
  private generateRecommendations(
    plagiarismPhrases: string[],
    similarityScore: number,
    options: UniquenessOptions
  ): string[] {
    const recommendations: string[] = [];

    if (similarityScore > options.maxSimilarityThreshold) {
      recommendations.push('Content similarity is too high - consider significant rewriting');
    }

    if (plagiarismPhrases.length > 0) {
      recommendations.push(`Replace or rephrase ${plagiarismPhrases.length} detected duplicate phrases`);

      if (plagiarismPhrases.length > 5) {
        recommendations.push('Consider completely rewriting sections with high similarity');
      }
    }

    const commonPhraseCount = plagiarismPhrases.filter(phrase =>
      this.commonPhrases.includes(phrase)
    ).length;

    if (commonPhraseCount > 2) {
      recommendations.push('Reduce use of common phrases and clichés');
    }

    if (recommendations.length === 0) {
      recommendations.push('Content appears unique and original');
    }

    return recommendations;
  }

  /**
   * Calculate confidence in uniqueness assessment
   */
  private calculateConfidence(
    content: string,
    comparisonCorpus: string[],
    options: UniquenessOptions
  ): number {
    let confidence = 70; // Base confidence

    // More comparison sources = higher confidence
    confidence += Math.min(20, comparisonCorpus.length * 2);

    // Longer content = higher confidence
    confidence += Math.min(10, content.length / 100);

    // Stricter settings = higher confidence in results
    if (options.strictness === 'strict') confidence += 5;
    if (options.checkSemanticSimilarity) confidence += 5;

    return Math.min(95, confidence);
  }

  /**
   * Extract phrases of minimum length from text
   */
  private extractPhrases(text: string, minLength: number): string[] {
    const words = this.normalizeText(text).split(' ');
    const phrases: string[] = [];

    for (let i = 0; i <= words.length - minLength; i++) {
      const phrase = words.slice(i, i + minLength).join(' ');
      if (!this.containsOnlyStopWords(phrase)) {
        phrases.push(phrase);
      }
    }

    return phrases;
  }

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short sentences
  }

  /**
   * Calculate similarity between two sentences
   */
  private calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
    const words1 = new Set(this.normalizeText(sentence1).split(' '));
    const words2 = new Set(this.normalizeText(sentence2).split(' '));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Calculate overall text similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.normalizeText(text1).split(' '));
    const words2 = new Set(this.normalizeText(text2).split(' '));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return (intersection.size / union.size) * 100;
  }

  /**
   * Check if phrase is a common phrase
   */
  private isCommonPhrase(phrase: string): boolean {
    return this.commonPhrases.some(common => phrase.toLowerCase().includes(common));
  }

  /**
   * Check if phrase contains only stop words
   */
  private containsOnlyStopWords(phrase: string): boolean {
    const words = phrase.toLowerCase().split(' ');
    return words.every(word => this.stopWords.has(word));
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
