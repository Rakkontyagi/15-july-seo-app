
import nlp from 'compromise';

export function assessVocabularyRange(content: string): number {
  const doc = nlp(content);
  const words = doc.words().out('array');

  if (words.length === 0) return 0;

  const uniqueWords = new Set(words.map((word: string) => word.toLowerCase()));

  // Simple metric: ratio of unique words to total words
  return uniqueWords.size / words.length;
}
