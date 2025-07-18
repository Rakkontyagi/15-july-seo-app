
import { analyzeSentenceLengthDistribution } from './sentence-length-distribution';
import { analyzeParagraphStructureVariation } from './paragraph-structure-variation';

export function calculateStructuralPredictabilityScore(content: string): number {
  const sentenceLengths = analyzeSentenceLengthDistribution(content);
  const paragraphLengths = analyzeParagraphStructureVariation(content);

  // Simple scoring: higher variance in lengths means lower predictability
  const sentenceVariance = sentenceLengths.reduce((sum, dist) => sum + dist.length * dist.count, 0) / sentenceLengths.length;
  const paragraphVariance = paragraphLengths.reduce((sum, dist) => sum + dist.length * dist.count, 0) / paragraphLengths.length;

  // Normalize and combine scores (example logic)
  const normalizedSentenceVariance = Math.min(1, sentenceVariance / 50); // Assuming average sentence length around 20-30
  const normalizedParagraphVariance = Math.min(1, paragraphVariance / 200); // Assuming average paragraph length around 100-150

  return (normalizedSentenceVariance + normalizedParagraphVariance) / 2;
}
