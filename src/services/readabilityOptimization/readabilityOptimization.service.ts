import { z } from 'zod';

// Define the target audience levels
const AudienceLevelEnum = z.enum(['beginner', 'intermediate', 'advanced']);

// Define the input schema for readability optimization
const ReadabilityOptimizationInputSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  targetAudience: AudienceLevelEnum,
});

// Define the output schema for readability optimization
const ReadabilityOptimizationOutputSchema = z.object({
  originalReadabilityScore: z.number().min(0).max(100),
  optimizedContent: z.string(),
  optimizedReadabilityScore: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
});

export type ReadabilityOptimizationInput = z.infer<typeof ReadabilityOptimizationInputSchema>;
export type ReadabilityOptimizationOutput = z.infer<typeof ReadabilityOptimizationOutputSchema>;
export type AudienceLevel = z.infer<typeof AudienceLevelEnum>;

export class ReadabilityOptimizationService {
  private targetScores: Record<AudienceLevel, number> = {
    beginner: 85,     // High school level
    intermediate: 75, // College level
    advanced: 60,     // Graduate level
  };

  /**
   * Optimizes content readability for the target audience.
   * Uses simplified readability calculations and basic optimization techniques.
   *
   * @param input - The input containing content and target audience level.
   * @returns The readability optimization output with scores, optimized content, and suggestions.
   */
  async optimize(input: ReadabilityOptimizationInput): Promise<ReadabilityOptimizationOutput> {
    ReadabilityOptimizationInputSchema.parse(input); // Validate input

    const { content, targetAudience } = input;
    const originalScore = this.calculateReadabilityScore(content);
    const targetScore = this.targetScores[targetAudience];
    
    let optimizedContent = content;
    const suggestions: string[] = [];

    // Optimize if original score is below target
    if (originalScore < targetScore) {
      const optimizationResult = this.optimizeForReadability(content, targetAudience);
      optimizedContent = optimizationResult.content;
      suggestions.push(...optimizationResult.suggestions);
    } else {
      suggestions.push('Content readability is already suitable for the target audience.');
    }

    const optimizedScore = this.calculateReadabilityScore(optimizedContent);

    return {
      originalReadabilityScore: parseFloat(originalScore.toFixed(1)),
      optimizedContent,
      optimizedReadabilityScore: parseFloat(optimizedScore.toFixed(1)),
      suggestions,
    };
  }

  /**
   * Calculates a simplified readability score (0-100, higher is more readable).
   * Based on average sentence length and average word length.
   */
  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0) / words.length;

    // Improved readability formula (0-100, higher = more readable)
    // Start with a base score and apply penalties
    let score = 85;

    // Sentence length penalty (optimal: 8-15 words per sentence)
    if (avgSentenceLength > 30) {
      score -= (avgSentenceLength - 30) * 4;
    } else if (avgSentenceLength > 25) {
      score -= (avgSentenceLength - 25) * 3;
    } else if (avgSentenceLength > 20) {
      score -= (avgSentenceLength - 20) * 2;
    } else if (avgSentenceLength > 15) {
      score -= (avgSentenceLength - 15) * 1.5;
    }

    // Word length penalty (optimal: 3-5 characters per word)
    if (avgWordLength > 7) {
      score -= (avgWordLength - 7) * 12;
    } else if (avgWordLength > 6) {
      score -= (avgWordLength - 6) * 8;
    } else if (avgWordLength > 5) {
      score -= (avgWordLength - 5) * 4;
    }

    // Check for complex words that need replacement
    const complexWords = ['utilize', 'utilization', 'demonstrate', 'demonstrates', 'facilitate', 'sophisticated', 'extremely'];
    const contentLower = content.toLowerCase();
    const complexWordCount = complexWords.filter(word => contentLower.includes(word)).length;
    if (complexWordCount > 0) {
      score -= complexWordCount * 8;
    }

    // Bonus for very readable content
    if (avgSentenceLength <= 10 && avgWordLength <= 5 && complexWordCount === 0) {
      score += 10;
    }

    return Math.max(10, Math.min(100, score));
  }

  /**
   * Optimizes content for better readability based on target audience.
   */
  private optimizeForReadability(content: string, targetAudience: AudienceLevel): { content: string; suggestions: string[] } {
    let optimizedContent = content;
    const suggestions: string[] = [];

    // Split long sentences
    const sentences = optimizedContent.split(/([.!?]+)/).filter(s => s.trim().length > 0);
    const processedSentences: string[] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i]?.trim() || '';
      const punctuation = sentences[i + 1] || '.';

      if (sentence.length > 0) {
        const words = sentence.split(/\s+/);
        
        // For beginners, split sentences longer than 15 words
        // For intermediate, split sentences longer than 20 words
        // For advanced, split sentences longer than 25 words
        const maxWords = targetAudience === 'beginner' ? 15 : targetAudience === 'intermediate' ? 20 : 25;
        
        if (words.length > maxWords) {
          // Simple sentence splitting at conjunctions
          const splitPoint = this.findSplitPoint(words);
          if (splitPoint > 0 && splitPoint < words.length - 1) {
            const firstPart = words.slice(0, splitPoint).join(' ');
            const secondPart = words.slice(splitPoint).join(' ');
            processedSentences.push(firstPart + '. ' + secondPart + punctuation);
            suggestions.push('Split long sentences for better readability.');
          } else {
            processedSentences.push(sentence + punctuation);
          }
        } else {
          processedSentences.push(sentence + punctuation);
        }
      } else if (punctuation) {
        // Keep standalone punctuation
        if (processedSentences.length > 0) {
          processedSentences[processedSentences.length - 1] += punctuation;
        }
      }
    }

    optimizedContent = processedSentences.join(' ').replace(/\s+/g, ' ').trim();

    // Replace complex words for beginners
    if (targetAudience === 'beginner') {
      const complexWords = [
        { complex: 'utilize', simple: 'use' },
        { complex: 'utilization', simple: 'use' },
        { complex: 'demonstrate', simple: 'show' },
        { complex: 'demonstrates', simple: 'shows' },
        { complex: 'facilitate', simple: 'help' },
        { complex: 'subsequently', simple: 'then' },
        { complex: 'approximately', simple: 'about' },
        { complex: 'sophisticated', simple: 'advanced' },
        { complex: 'extremely', simple: 'very' },
      ];

      for (const wordPair of complexWords) {
        const regex = new RegExp(`\\b${wordPair.complex}\\b`, 'gi');
        if (optimizedContent.match(regex)) {
          optimizedContent = optimizedContent.replace(regex, wordPair.simple);
          suggestions.push(`Replaced "${wordPair.complex}" with simpler "${wordPair.simple}".`);
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Applied basic readability optimizations.');
    }

    return { content: optimizedContent, suggestions };
  }

  /**
   * Finds a good point to split a long sentence.
   */
  private findSplitPoint(words: string[]): number {
    const conjunctions = ['and', 'but', 'or', 'so', 'because', 'although', 'while', 'when', 'if'];
    
    // Look for conjunctions in the middle third of the sentence
    const start = Math.floor(words.length / 3);
    const end = Math.floor((words.length * 2) / 3);
    
    for (let i = start; i < end; i++) {
      if (conjunctions.includes(words[i]?.toLowerCase() || '')) {
        return i;
      }
    }
    
    // If no conjunction found, split at the midpoint
    return Math.floor(words.length / 2);
  }
}