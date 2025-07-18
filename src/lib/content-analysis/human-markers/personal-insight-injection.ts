
export function injectPersonalInsight(content: string, insight: string): string {
  const sentences = content.split('. ');
  if (sentences.length > 1) {
    // Insert insight after the first sentence as an example
    return `${sentences[0]}. ${insight}. ${sentences.slice(1).join('. ')}`;
  }
  return `${content} ${insight}.`;
}
