
import { analyzeSentenceLengthDistribution } from './sentence-length-distribution';
import { analyzeParagraphStructureVariation } from './paragraph-structure-variation';

export function calculateStructuralPredictabilityScore(content: string): number {
  if (!content || content.trim().length === 0) {
    return 0;
  }

  const sentenceLengthData = analyzeSentenceLengthDistribution(content);
  const paragraphLengthData = analyzeParagraphStructureVariation(content);

  // Use the variance and diversity scores from the analysis with safety checks
  const sentenceVariance = isNaN(sentenceLengthData.variance) ? 0 : sentenceLengthData.variance;
  const paragraphVariance = isNaN(paragraphLengthData.variance) ? 0 : paragraphLengthData.variance;

  // Calculate predictability: low variance = high predictability
  // Normalize variances to 0-1 scale
  const maxSentenceVariance = 50; // Typical max variance for sentence lengths
  const maxParagraphVariance = 200; // Typical max variance for paragraph lengths

  const normalizedSentenceVariance = Math.min(1, sentenceVariance / maxSentenceVariance);
  const normalizedParagraphVariance = Math.min(1, paragraphVariance / maxParagraphVariance);

  // Convert to predictability: 1 - variance (so low variance = high predictability)
  const sentencePredictability = 1 - normalizedSentenceVariance;
  const paragraphPredictability = 1 - normalizedParagraphVariance;

  const result = (sentencePredictability + paragraphPredictability) / 2;
  return isNaN(result) ? 0 : Math.max(0, Math.min(1, result));
}
