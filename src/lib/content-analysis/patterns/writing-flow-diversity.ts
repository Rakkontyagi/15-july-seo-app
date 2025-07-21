
import nlp from 'compromise';

export function measureWritingFlowDiversity(content: string): number {
  // Simple sentence splitting instead of using compromise
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => ({ text: s.trim() }));

  if (sentences.length < 2) return 1.0; // A single sentence has perfect flow diversity

  let transitions = 0;
  for (let i = 0; i < sentences.length - 1; i++) {
    const currentSentence = sentences[i].text;
    const nextSentence = sentences[i + 1].text;

    // Simple check for transition words/phrases
    if (currentSentence.endsWith('.') && nextSentence.match(/^(However|Therefore|Meanwhile|In addition|Furthermore)/i)) {
      transitions++;
    }
  }

  // A simple metric: ratio of transitions to total sentences
  return transitions / (sentences.length - 1);
}
