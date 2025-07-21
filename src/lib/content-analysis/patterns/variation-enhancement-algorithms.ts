
import nlp from 'compromise';

export function enhanceVariation(content: string): string {
  // Simple sentence variation instead of using compromise
  let result = content;

  // Example 1: Vary sentence beginnings
  result = result.replace(/\bThe\s+/g, (match, offset) => {
    // Randomly replace some instances of "The" with alternatives
    const alternatives = ["This ", "That ", "A ", "An "];
    return Math.random() > 0.7 ? alternatives[Math.floor(Math.random() * alternatives.length)] : match;
  });

  // Example 2: Simple sentence variation
  const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) {
    // This is highly simplistic and would need advanced NLP for proper merging/splitting
    // For now, just a placeholder to show the intent
  }

  return result;
}
