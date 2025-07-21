
import compromise from 'compromise';
import { LengthDistribution } from '../../../types/content-analysis';

/**
 * Analyzes sentence length distribution to detect AI-generated patterns
 * Human writing typically has more varied sentence lengths
 */
export function analyzeSentenceLengthDistribution(content: string): LengthDistribution {
  // Simple sentence splitting instead of using compromise
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => ({ text: s.trim() }));

  if (sentences.length === 0) {
    return getEmptyDistribution();
  }

  const lengths = sentences.map((sentence: any) =>
    sentence.terms ? sentence.terms.length : 0
  ).filter(length => length > 0);

  if (lengths.length === 0) {
    return getEmptyDistribution();
  }

  const averageLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = calculateVariance(lengths, averageLength);
  const distribution = calculateDistribution(lengths);
  const diversityScore = calculateDiversityScore(lengths, variance);

  return {
    averageLength: Math.round(averageLength * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    distribution,
    diversityScore: Math.round(diversityScore * 100) / 100
  };
}

function calculateVariance(lengths: number[], average: number): number {
  const squaredDifferences = lengths.map(length => Math.pow(length - average, 2));
  return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / lengths.length;
}

function calculateDistribution(lengths: number[]): { [range: string]: number } {
  const distribution: { [range: string]: number } = {
    'very-short (1-5)': 0,
    'short (6-10)': 0,
    'medium (11-20)': 0,
    'long (21-30)': 0,
    'very-long (31+)': 0
  };

  lengths.forEach(length => {
    if (length <= 5) {
      distribution['very-short (1-5)']++;
    } else if (length <= 10) {
      distribution['short (6-10)']++;
    } else if (length <= 20) {
      distribution['medium (11-20)']++;
    } else if (length <= 30) {
      distribution['long (21-30)']++;
    } else {
      distribution['very-long (31+)']++;
    }
  });

  // Convert to percentages
  const total = lengths.length;
  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateDiversityScore(lengths: number[], variance: number): number {
  // Higher variance generally indicates more diverse sentence lengths
  // But we also want to check for good distribution across ranges

  const uniqueLengths = new Set(lengths).size;
  const totalSentences = lengths.length;
  const uniquenessRatio = uniqueLengths / totalSentences;

  // Normalize variance (typical variance for good writing is around 20-50)
  const normalizedVariance = Math.min(variance / 50, 1);

  // Combine uniqueness and variance for diversity score
  const diversityScore = (uniquenessRatio * 0.4 + normalizedVariance * 0.6);

  return Math.max(0, Math.min(1, diversityScore));
}

function getEmptyDistribution(): LengthDistribution {
  return {
    averageLength: 0,
    variance: 0,
    distribution: {
      'very-short (1-5)': 0,
      'short (6-10)': 0,
      'medium (11-20)': 0,
      'long (21-30)': 0,
      'very-long (31+)': 0
    },
    diversityScore: 0
  };
}

/**
 * Legacy function for backward compatibility
 */
export function analyzeSentenceLengthDistributionLegacy(content: string): { length: number; count: number }[] {
  const sentences = content.split(/[.!?]+\s*/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const distribution: { [key: number]: number } = {};

  lengths.forEach(len => {
    distribution[len] = (distribution[len] || 0) + 1;
  });

  return Object.keys(distribution).map(len => ({
    length: parseInt(len),
    count: distribution[parseInt(len)],
  })).sort((a, b) => a.length - b.length);
}
