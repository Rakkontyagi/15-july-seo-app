
export function addAuthenticHesitation(content: string): string {
  const markers = ["Um,", "Uh,", "Well,", "You know,", "I mean,"];
  const sentences = content.split('. ');
  const newSentences = sentences.map(sentence => {
    if (Math.random() < 0.1) { // 10% chance to add a hesitation marker
      return `${markers[Math.floor(Math.random() * markers.length)]} ${sentence}`;
    }
    return sentence;
  });
  return newSentences.join('. ');
}
