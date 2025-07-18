
import nlp from 'compromise';

export function randomizeSentenceStructure(content: string): string {
  const doc = nlp(content);
  const sentences = doc.sentences().out('array');

  // Simple randomization: shuffle sentences
  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }

  return sentences.join(' ');
}
