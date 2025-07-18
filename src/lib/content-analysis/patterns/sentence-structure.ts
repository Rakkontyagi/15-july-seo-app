
import nlp from 'compromise';

export function analyzeSentenceStructure(content: string): any {
  const doc = nlp(content);
  const sentences = doc.sentences();

  const analysis = sentences.json().map((s: any) => ({
    text: s.text,
    words: s.terms.length,
    pos: s.terms.map((t: any) => t.tags[0]), // Part-of-speech tags
  }));

  return analysis;
}
