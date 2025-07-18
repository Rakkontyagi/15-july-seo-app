
import { AIPatternDetector } from '../ai-pattern-detector';
import { calculateStructuralPredictabilityScore } from '../patterns/structural-predictability-scoring';
import { calculateLexicalDiversityScore } from '../vocabulary/lexical-diversity-scoring';

export function validateAuthenticityScoring(content: string): number {
  const aiPatternDetector = new AIPatternDetector();
  const aiAnalysis = aiPatternDetector.analyze(content);

  const predictabilityScore = calculateStructuralPredictabilityScore(content);
  const lexicalDiversityScore = calculateLexicalDiversityScore(content);

  // Combine scores to get an overall authenticity score
  // Lower AI patterns, lower predictability, higher lexical diversity contribute to higher authenticity
  const authenticityScore = (
    (1 - aiAnalysis.patternFrequencyScore / 100) + // Normalize AI pattern score to be inverse
    (1 - predictabilityScore) + // Inverse predictability
    lexicalDiversityScore
  ) / 3; // Average of the three metrics

  return authenticityScore * 100; // Return as a percentage
}
