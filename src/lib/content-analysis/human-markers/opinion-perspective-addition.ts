
export function addOpinionAndPerspective(content: string, opinion: string): string {
  const sentences = content.split('. ');
  if (sentences.length > 2) {
    // Insert opinion after the second sentence as an example
    return `${sentences[0]}. ${sentences[1]}. ${opinion}. ${sentences.slice(2).join('. ')}`;
  }
  return `${content} ${opinion}.`;
}
