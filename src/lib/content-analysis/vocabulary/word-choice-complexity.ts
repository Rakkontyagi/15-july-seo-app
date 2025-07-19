
import nlp from 'compromise';

export function analyzeWordChoiceComplexity(content: string): number {
  const doc = nlp(content);
  const words = doc.terms().json();

  if (words.length === 0) return 0;

  // Simple metric: average word length
  const totalLength = words.reduce((sum: number, term: any) => sum + (term.text || '').length, 0);
  return totalLength / words.length;
}
