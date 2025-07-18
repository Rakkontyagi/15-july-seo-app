
export function injectSubtleInconsistency(content: string, inconsistency: string): string {
  const sentences = content.split('. ');
  if (sentences.length > 4) {
    // Insert inconsistency after the fourth sentence as an example
    return `${sentences[0]}. ${sentences[1]}. ${sentences[2]}. ${sentences[3]}. ${inconsistency}. ${sentences.slice(4).join('. ')}`;
  }
  return `${content} ${inconsistency}.`;
}
