export interface WordAnalysis {
  wordCount: number;
  uniqueWordCount: number;
  averageWordLength: number;
  readabilityScore: number; // Flesch-Kincaid or similar
  complexityScore: number; // Based on sentence length, polysyllabic words
}

export function analyzeWords(text: string): WordAnalysis {
  if (!text) {
    return {
      wordCount: 0,
      uniqueWordCount: 0,
      averageWordLength: 0,
      readabilityScore: 0,
      complexityScore: 0,
    };
  }

  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  const uniqueWords = new Set(words.map(word => word.toLowerCase()));
  const uniqueWordCount = uniqueWords.size;

  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const averageWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;

  // Simplified Readability (Flesch-Kincaid approximation)
  const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 0);
  const numSentences = sentences.length;
  const numSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const readabilityScore = 206.835 - 1.015 * (wordCount / numSentences) - 84.6 * (numSyllables / wordCount);

  // Simplified Complexity Score (based on average sentence length and polysyllabic words)
  const averageSentenceLength = numSentences > 0 ? wordCount / numSentences : 0;
  const polysyllabicWords = words.filter(word => countSyllables(word) >= 3).length;
  const complexityScore = (averageSentenceLength * 0.5) + (polysyllabicWords / wordCount * 100 * 0.5);

  return {
    wordCount,
    uniqueWordCount,
    averageWordLength,
    readabilityScore: Math.max(0, readabilityScore),
    complexityScore: Math.max(0, complexityScore),
  };
}

// Very basic syllable counter (can be improved with a library)
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length === 0) return 0;
  let count = 0;
  const vowels = 'aeiouy';
  if (vowels.includes(word[0])) {
    count++;
  }
  for (let i = 1; i < word.length; i++) {
    if (vowels.includes(word[i]) && !vowels.includes(word[i - 1])) {
      count++;
    }
  }
  if (word.endsWith('e')) {
    count--;
  }
  if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) {
    count++;
  }
  return Math.max(1, count);
}