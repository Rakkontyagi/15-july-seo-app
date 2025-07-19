
import nlp from 'compromise';

export function assessVocabularyRange(content: string): number {
  const doc = nlp(content);
  const terms = doc.terms().json();

  if (terms.length === 0) return 0;

  const words = terms.map((term: any) => term.text || '').filter(text => text.length > 0);
  const uniqueWords = new Set(words.map((word: string) => word.toLowerCase()));

  // Simple metric: ratio of unique words to total words
  return uniqueWords.size / words.length;
}
