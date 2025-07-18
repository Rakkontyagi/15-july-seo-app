import { z } from 'zod';

// Define the input schema for content gap analysis
const ContentGapAnalysisInputSchema = z.object({
  targetContent: z.string().min(10, 'Target content must be at least 10 characters long.'),
  competitorContents: z.array(z.string()).min(1, 'At least one competitor content is required.'),
  keywordsToAnalyze: z.array(z.string()).min(1, 'At least one keyword to analyze is required.'),
});

// Define the output schema for content gap analysis
const ContentGapAnalysisOutputSchema = z.object({
  missingKeywords: z.array(z.string()),
  presentKeywords: z.array(z.string()),
  gapScore: z.number().min(0).max(1),
});

export type ContentGapAnalysisInput = z.infer<typeof ContentGapAnalysisInputSchema>;
export type ContentGapAnalysisOutput = z.infer<typeof ContentGapAnalysisOutputSchema>;

export class ContentGapAnalysisService {
  /**
   * Performs content gap analysis by comparing target content against competitor content.
   * This is a simplified implementation. A real-world scenario would involve more
   * sophisticated NLP and semantic analysis.
   *
   * @param input - The input containing target content, competitor contents, and keywords to analyze.
   * @returns The content gap analysis output with missing and present keywords, and a gap score.
   */
  async analyze(input: ContentGapAnalysisInput): Promise<ContentGapAnalysisOutput> {
    ContentGapAnalysisInputSchema.parse(input); // Validate input

    const { targetContent, competitorContents, keywordsToAnalyze } = input;

    const missingKeywords: string[] = [];
    const presentKeywords: string[] = [];

    const targetContentLower = targetContent.toLowerCase();
    const competitorContentsLower = competitorContents.map(c => c.toLowerCase());

    for (const keyword of keywordsToAnalyze) {
      const keywordLower = keyword.toLowerCase();

      // Check if keyword is in target content
      const isPresentInTarget = targetContentLower.includes(keywordLower);

      // Check if keyword is in any competitor content
      const isPresentInCompetitors = competitorContentsLower.some(compContent =>
        compContent.includes(keywordLower)
      );

      if (isPresentInCompetitors && !isPresentInTarget) {
        missingKeywords.push(keyword);
      } else if (isPresentInTarget) {
        presentKeywords.push(keyword);
      }
    }

    const totalKeywords = keywordsToAnalyze.length;
    const gapScore = totalKeywords > 0 ? missingKeywords.length / totalKeywords : 0;

    return {
      missingKeywords,
      presentKeywords,
      gapScore: parseFloat(gapScore.toFixed(2)),
    };
  }
}
