import { z } from 'zod';

// Define the input schema for topical analysis
const TopicalAnalysisInputSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required.'),
});

// Define the output schema for topical analysis
const TopicalAnalysisOutputSchema = z.object({
  clusters: z.array(z.object({
    topic: z.string(),
    keywords: z.array(z.string()),
    relevanceScore: z.number().min(0).max(1),
  })),
  unclusteredKeywords: z.array(z.string()),
});

export type TopicalAnalysisInput = z.infer<typeof TopicalAnalysisInputSchema>;
export type TopicalAnalysisOutput = z.infer<typeof TopicalAnalysisOutputSchema>;

export class TopicalAnalysisService {
  /**
   * Performs topical clustering analysis on the given content and keywords.
   * This is a simplified implementation for demonstration. A real-world scenario
   * would involve more sophisticated NLP techniques.
   *
   * @param input - The input containing content and keywords.
   * @returns The topical analysis output with keyword clusters.
   */
  async analyze(input: TopicalAnalysisInput): Promise<TopicalAnalysisOutput> {
    TopicalAnalysisInputSchema.parse(input); // Validate input

    const { content, keywords } = input;
    const clusters: TopicalAnalysisOutput['clusters'] = [];
    const unclusteredKeywords: string[] = [...keywords];

    // Simple clustering based on keyword co-occurrence in sentences
    const sentences = content.split(/[.!?]\s*/).filter(s => s.trim().length > 0);

    for (const keyword of keywords) {
      const matchingSentences = sentences.filter(sentence =>
        sentence.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matchingSentences.length > 0) {
        // For simplicity, we'll create a cluster for each keyword found in content
        // In a real scenario, you'd group related keywords into fewer topics.
        const topic = keyword; // Or derive a topic from related keywords
        const relevanceScore = matchingSentences.length / sentences.length;

        clusters.push({
          topic,
          keywords: [keyword],
          relevanceScore: parseFloat(relevanceScore.toFixed(2)),
        });

        // Remove clustered keyword from unclustered list
        const index = unclusteredKeywords.indexOf(keyword);
        if (index > -1) {
          unclusteredKeywords.splice(index, 1);
        }
      }
    }

    return {
      clusters,
      unclusteredKeywords,
    };
  }
}
