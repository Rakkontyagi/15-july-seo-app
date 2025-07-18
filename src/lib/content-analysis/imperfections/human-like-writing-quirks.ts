
export function addHumanLikeWritingQuirks(content: string, quirk: string): string {
  const sentences = content.split('. ');
  if (sentences.length > 5) {
    // Insert quirk after the fifth sentence as an example
    return `${sentences[0]}. ${sentences[1]}. ${sentences[2]}. ${sentences[3]}. ${sentences[4]}. ${quirk}. ${sentences.slice(5).join('. ')}`;
  }
  return `${content} ${quirk}.`;
}
