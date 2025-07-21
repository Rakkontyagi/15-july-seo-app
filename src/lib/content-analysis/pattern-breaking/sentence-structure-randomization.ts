
import nlp from 'compromise';

export function randomizeSentenceStructure(content: string): string {
  // Simple sentence splitting instead of using compromise
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim());

  // Simple randomization: shuffle sentences
  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }

  return sentences.join(' ');
}
