
import { assessVocabularyRange } from './vocabulary-range-assessment';

export function calculateLexicalDiversityScore(content: string): number {
  return assessVocabularyRange(content);
}
