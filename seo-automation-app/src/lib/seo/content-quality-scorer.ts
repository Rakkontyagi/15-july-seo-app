
import { WordAnalysis } from './word-count';
import { HeadingAnalysis } from './heading-analyzer';
import { ContentStructureAnalysisResult } from './content-structure-analyzer';

export interface ContentQualityMetrics {
  readabilityScore: number; // Flesch-Kincaid or similar
  structureScore: number; // From ContentStructureAnalysisResult
  optimizationEffectiveness: number; // Based on keyword, heading, LSI, entity usage
  uniquenessScore: number; // Placeholder for now, would need plagiarism check
  engagementPotential: number; // Placeholder for now, based on patterns, readability
}

export function scoreContentQuality(
  wordAnalysis: WordAnalysis,
  headingAnalysis: HeadingAnalysis,
  contentStructure: ContentStructureAnalysisResult,
  keywordDensity: number,
  lsiKeywordsCount: number,
  entitiesCount: number
): ContentQualityMetrics {
  // Readability Score (from wordAnalysis)
  const readabilityScore = wordAnalysis.readabilityScore;

  // Structure Score (from contentStructure)
  const structureScore = contentStructure.overview.structureScore;

  // Optimization Effectiveness (simplified calculation)
  let optimizationEffectiveness = 0;
  optimizationEffectiveness += Math.min(100, keywordDensity * 10); // Scale density
  optimizationEffectiveness += Math.min(100, headingAnalysis.optimizationScore); // Heading optimization
  optimizationEffectiveness += Math.min(100, lsiKeywordsCount * 5); // LSI presence
  optimizationEffectiveness += Math.min(100, entitiesCount * 5); // Entity presence
  optimizationEffectiveness = Math.min(100, optimizationEffectiveness / 4); // Average

  // Uniqueness Score (placeholder)
  const uniquenessScore = 80; // Assume good for now

  // Engagement Potential (placeholder)
  const engagementPotential = 75; // Assume good for now

  return {
    readabilityScore,
    structureScore,
    optimizationEffectiveness,
    uniquenessScore,
    engagementPotential,
  };
}
