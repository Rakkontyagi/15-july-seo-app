
import nlp from 'compromise';

export function suggestVocabularyEnhancements(content: string): string[] {
  const doc = nlp(content);
  const suggestions: string[] = [];

  doc.words().forEach((word: any) => {
    const text = word.text.toLowerCase();
    // This is a very simplistic placeholder. Real suggestions would come from a thesaurus or NLP model.
    if (text === 'good') {
      suggestions.push(`Consider using 'excellent', 'superb', or 'favorable' instead of 'good'.`);
    } else if (text === 'bad') {
      suggestions.push(`Consider using 'poor', 'terrible', or 'unfavorable' instead of 'bad'.`);
    }
  });

  return suggestions;
}
