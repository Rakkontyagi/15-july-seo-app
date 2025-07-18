
export function insertSubjectiveCommentary(content: string, commentary: string): string {
  const sentences = content.split('. ');
  if (sentences.length > 3) {
    // Insert commentary after the third sentence as an example
    return `${sentences[0]}. ${sentences[1]}. ${sentences[2]}. ${commentary}. ${sentences.slice(3).join('. ')}`;
  }
  return `${content} ${commentary}.`;
}
