export interface HallucinationDetectionResult {
  hallucinationsDetected: boolean;
  hallucinationScore: number; // 0-100, higher means more likely to be hallucinated
  flaggedSentences: string[];
  recommendations: string[];
}

export class HallucinationDetector {
  /**
   * Detects potential AI hallucinations in content.
   * This is a simplified, rule-based approach. True hallucination detection is a complex
   * problem requiring advanced NLP, knowledge graphs, and real-time fact-checking.
   * @param content The content to analyze.
   * @param factVerificationResults Results from a fact verification process.
   * @returns Hallucination detection results.
   */
  detectHallucinations(content: string, factVerificationResults: Array<{ fact: string; isVerified: boolean; confidenceScore: number }>): HallucinationDetectionResult {
    const flaggedSentences: string[] = [];
    const recommendations: string[] = [];
    let hallucinationsDetected = false;
    let hallucinationScore = 0;

    const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 0);

    // Rule 1: Flag sentences containing unverified facts with low confidence
    factVerificationResults.forEach(result => {
      if (!result.isVerified && result.confidenceScore < 50) {
        const sentenceContainingFact = sentences.find(s => s.includes(result.fact));
        if (sentenceContainingFact && !flaggedSentences.includes(sentenceContainingFact)) {
          flaggedSentences.push(sentenceContainingFact);
          hallucinationsDetected = true;
          hallucinationScore += (100 - result.confidenceScore) * 0.5; // Higher score for lower confidence
          recommendations.push(`Review the claim: "${result.fact}". It could be a hallucination or unverified information.`);
        }
      }
    });

    // Rule 2: Look for overly confident or definitive statements without support (simplified)
    const definitivePhrases = ['undoubtedly', 'without a doubt', 'it is certain that', 'proven fact'];
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (definitivePhrases.some(phrase => lowerSentence.includes(phrase))) {
        // Check if this sentence has been verified or has a strong source
        const isFactVerified = factVerificationResults.some(fv => sentence.includes(fv.fact) && fv.isVerified);
        if (!isFactVerified) {
          if (!flaggedSentences.includes(sentence)) {
            flaggedSentences.push(sentence);
            hallucinationsDetected = true;
            hallucinationScore += 10;
            recommendations.push(`"${sentence.trim()}" contains a definitive statement. Ensure it is backed by verifiable facts.`);
          }
        }
      }
    });

    // Rule 3: Detect invented statistics or sources (simplified: look for patterns like "studies show X%" without context)
    const inventedStatRegex = /\b(?:studies show|research indicates|data reveals) (\d{1,3}%|\d{1,3} out of \d{1,3})\b/gi;
    let match;
    while ((match = inventedStatRegex.exec(content)) !== null) {
      const statSentence = sentences.find(s => s.includes(match[0]));
      if (statSentence && !flaggedSentences.includes(statSentence)) {
        // This is a very weak signal, needs external validation
        flaggedSentences.push(statSentence);
        hallucinationsDetected = true;
        hallucinationScore += 5;
        recommendations.push(`"${statSentence.trim()}" contains a statistic that may need verification. Ensure the source is cited.`);
      }
    }

    return {
      hallucinationsDetected,
      hallucinationScore: Math.min(100, hallucinationScore),
      flaggedSentences,
      recommendations,
    };
  }
}