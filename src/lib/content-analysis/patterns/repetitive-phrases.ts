
export function detectRepetitivePhrases(content: string): string[] {
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const phraseCounts: { [key: string]: number } = {};
  const repetitivePhrases: string[] = [];

  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  }

  for (const phrase in phraseCounts) {
    if (phraseCounts[phrase] > 2) { // Adjust threshold as needed
      repetitivePhrases.push(phrase);
    }
  }

  return repetitivePhrases;
}
