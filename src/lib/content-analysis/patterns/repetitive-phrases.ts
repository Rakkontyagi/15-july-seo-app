
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

  // Sort by severity and frequency
  return repetitivePhrases.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity] || b.count - a.count;
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
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = phrase.split(' ');
  const significantWords = words.filter(word => !stopWords.has(word));

  // Phrase must have at least one significant word
  return significantWords.length > 0 && phrase.length > 3;
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

  if (count >= baseThreshold * 2) {
    return 'high';
  } else if (count >= baseThreshold * 1.5) {
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
