
import nlp from 'compromise';

export function analyzeWordChoiceComplexity(content: string): number {
  const doc = nlp(content);
  const words = doc.words().out('array');

  if (words.length === 0) return 0;

  // Simple metric: average word length
  const totalLength = words.reduce((sum: number, word: string) => sum + word.length, 0);
  return totalLength / words.length;
}
