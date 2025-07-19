
import { analyzeSentenceLengthDistribution } from './sentence-length-distribution';
import { analyzeParagraphStructureVariation } from './paragraph-structure-variation';

export function calculateStructuralPredictabilityScore(content: string): number {
  const sentenceLengthData = analyzeSentenceLengthDistribution(content);
  const paragraphLengthData = analyzeParagraphStructureVariation(content);

  // Use the variance and diversity scores from the analysis
  const sentenceVariance = sentenceLengthData.variance;
  const paragraphVariance = paragraphLengthData.variance;

  // Normalize and combine scores (example logic)
  const normalizedSentenceVariance = Math.min(1, sentenceVariance / 50); // Assuming average sentence length around 20-30
  const normalizedParagraphVariance = Math.min(1, paragraphVariance / 200); // Assuming average paragraph length around 100-150

  return (normalizedSentenceVariance + normalizedParagraphVariance) / 2;
}
