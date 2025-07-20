
import { RepetitivePhrase } from '../../../types/content-analysis';

/**
 * Detects repetitive phrases in content that may indicate AI generation
 * Analyzes n-grams of various lengths and identifies patterns
 */
export function detectRepetitivePhrases(content: string): RepetitivePhrase[] {
  const repetitivePhrases: RepetitivePhrase[] = [];

  // Analyze different phrase lengths (2-5 words)
  for (let phraseLength = 2; phraseLength <= 5; phraseLength++) {
    const phrases = extractPhrases(content, phraseLength);
    const repetitive = findRepetitivePhrases(phrases, phraseLength);
    repetitivePhrases.push(...repetitive);
  }

  // Remove shorter phrases that are subsets of longer phrases with same frequency
  const filteredPhrases = repetitivePhrases.filter((phrase, index) => {
    return !repetitivePhrases.some((otherPhrase, otherIndex) => {
      return otherIndex !== index &&
             otherPhrase.phrase.length > phrase.phrase.length &&
             otherPhrase.phrase.includes(phrase.phrase) &&
             otherPhrase.count === phrase.count;
    });
  });

  // Sort by severity, then frequency, then prefer shorter phrases
  return filteredPhrases.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;

    const countDiff = b.count - a.count;
    if (countDiff !== 0) return countDiff;

    // Prefer shorter phrases when everything else is equal
    return a.phrase.length - b.phrase.length;
  });
}

function extractPhrases(content: string, phraseLength: number): Map<string, number[]> {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);

  const phrases = new Map<string, number[]>();

  for (let i = 0; i <= words.length - phraseLength; i++) {
    const phrase = words.slice(i, i + phraseLength).join(' ');

    // Skip phrases with common stop words only
    if (isSignificantPhrase(phrase)) {
      if (!phrases.has(phrase)) {
        phrases.set(phrase, []);
      }
      phrases.get(phrase)!.push(i);
    }
  }

  return phrases;
}

function findRepetitivePhrases(phrases: Map<string, number[]>, phraseLength: number): RepetitivePhrase[] {
  const repetitive: RepetitivePhrase[] = [];
  const minOccurrences = getMinOccurrences(phraseLength);

  for (const [phrase, positions] of phrases.entries()) {
    if (positions.length >= minOccurrences) {
      const severity = calculateSeverity(positions.length, phraseLength);

      repetitive.push({
        phrase,
        count: positions.length,
        positions,
        severity
      });
    }
  }

  return repetitive;
}

function isSignificantPhrase(phrase: string): boolean {
  const stopWords = new Set([
    'the', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'that', 'these', 'those'
  ]);

  const words = phrase.split(' ');
  const significantWords = words.filter(word => !stopWords.has(word));

  // Allow phrases with at least one significant word, or common patterns that might be repetitive
  // Even if mostly stop words, repetitive patterns can indicate AI generation
  return (significantWords.length > 0 || words.length >= 3) && phrase.length > 2;
}

function getMinOccurrences(phraseLength: number): number {
  // Longer phrases need fewer occurrences to be considered repetitive
  switch (phraseLength) {
    case 2: return 4;
    case 3: return 3;
    case 4: return 2;
    case 5: return 2;
    default: return 3;
  }
}

function calculateSeverity(count: number, phraseLength: number): 'low' | 'medium' | 'high' {
  const baseThreshold = getMinOccurrences(phraseLength);

  // More lenient thresholds for better detection
  if (count >= baseThreshold * 1.5) {
    return 'high';
  } else if (count >= baseThreshold * 1.2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Legacy function for backward compatibility
 */
export function detectRepetitivePhrasesLegacy(content: string): string[] {
  const phrases = detectRepetitivePhrases(content);
  return phrases.map(p => p.phrase);
}
