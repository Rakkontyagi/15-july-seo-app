
export function addNaturalFlowInterruption(content: string): string {
  const sentences = content.split('. ');
  if (sentences.length > 3) {
    const randomIndex = Math.floor(Math.random() * (sentences.length - 2)) + 1;
    const interruption = "(On a slightly different note, it's worth considering...)";
    sentences.splice(randomIndex, 0, interruption);
  }
  return sentences.join('. ');
}
