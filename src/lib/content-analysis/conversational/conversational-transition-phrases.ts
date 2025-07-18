
export function addConversationalTransitionPhrases(content: string): string {
  const transitions = [
    "Anyway,",
    "So, what I'm saying is,",
    "But here's the thing,",
    "Moving on,",
    "To be fair,",
  ];

  const sentences = content.split('. ');
  const newSentences = sentences.map((sentence, index) => {
    if (index > 0 && Math.random() < 0.1) { // 10% chance to add a transition after the first sentence
      return `${transitions[Math.floor(Math.random() * transitions.length)]} ${sentence}`;
    }
    return sentence;
  });
  return newSentences.join('. ');
}
