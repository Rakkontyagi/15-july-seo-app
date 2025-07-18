import { z } from 'zod';

// Define the input schema for semantic optimization
const SemanticOptimizationInputSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  mainKeywords: z.array(z.string()).min(1, 'At least one main keyword is required.'),
});

// Define the output schema for semantic optimization
const SemanticOptimizationOutputSchema = z.object({
  optimizedContent: z.string(),
  suggestedTerms: z.array(z.string()),
});

export type SemanticOptimizationInput = z.infer<typeof SemanticOptimizationInputSchema>;
export type SemanticOptimizationOutput = z.infer<typeof SemanticOptimizationOutputSchema>;

export class SemanticOptimizationService {
  private synonymMap: Map<string, string[]> = new Map([
    ['seo', ['search engine optimization', 'SERP', 'ranking']],
    ['content', ['article', 'blog post', 'text', 'copy']],
    ['marketing', ['promotion', 'advertising', 'brand awareness']],
    ['keyword', ['query', 'search term', 'phrase']],
  ]);

  /**
   * Performs semantic optimization on the given content.
   * This simplified implementation replaces main keywords with a related synonym/phrase
   * from a predefined map to enhance semantic richness.
   *
   * @param input - The input containing content and main keywords.
   * @returns The semantic optimization output with optimized content and suggested terms.
   */
  async optimize(input: SemanticOptimizationInput): Promise<SemanticOptimizationOutput> {
    SemanticOptimizationInputSchema.parse(input); // Validate input

    const { content, mainKeywords } = input;
    let optimizedContent = content;
    const suggestedTerms: string[] = [];

    for (const keyword of mainKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      const synonyms = this.synonymMap.get(lowerKeyword);

      if (synonyms && synonyms.length > 0) {
        // For simplicity, we'll just pick the first synonym
        const replacementTerm = synonyms[0];
        suggestedTerms.push(replacementTerm);

        // Replace occurrences of the main keyword with the replacement term
        // This is a basic string replacement; a real NLP solution would be more context-aware.
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        optimizedContent = optimizedContent.replace(regex, replacementTerm);
      }
    }

    return {
      optimizedContent,
      suggestedTerms,
    };
  }
}
