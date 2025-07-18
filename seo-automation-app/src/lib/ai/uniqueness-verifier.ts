
export interface UniquenessVerificationResult {
  isUnique: boolean;
  similarityScore: number; // 0-100, lower is more unique
  plagiarismDetectedPhrases: string[];
  recommendations: string[];
}

export class UniquenessVerifier {
  /**
   * Verifies the uniqueness of content. This is a simplified, rule-based approach.
   * A real plagiarism detection system would involve comparing against a vast database
   * of existing content using advanced NLP techniques.
   * @param content The content to verify.
   * @param comparisonCorpus Optional: A list of other content strings to compare against.
   * @returns Uniqueness verification results.
   */
  verifyUniqueness(content: string, comparisonCorpus: string[] = []): UniquenessVerificationResult {
    const recommendations: string[] = [];
    const plagiarismDetectedPhrases: string[] = [];

    let similarityScore = 0;
    let isUnique = true;

    const contentWords = this.normalizeText(content).split(' ');

    // Simple self-plagiarism check (repeated phrases within the content itself)
    const repeatedPhrase = this.findRepeatedPhrases(contentWords, 5); // Check for 5-word repetitions
    if (repeatedPhrase) {
      plagiarismDetectedPhrases.push(`Repeated phrase detected: "${repeatedPhrase}"`);
      similarityScore += 20;
      isUnique = false;
      recommendations.push('Rephrase or vary repetitive sentences and phrases within the content.');
    }

    // Compare against provided corpus (simplified)
    comparisonCorpus.forEach(corpusText => {
      const corpusWords = this.normalizeText(corpusText).split(' ');
      const commonWords = contentWords.filter(word => corpusWords.includes(word));
      const currentSimilarity = (commonWords.length / Math.min(contentWords.length, corpusWords.length)) * 100;

      if (currentSimilarity > 30) { // Arbitrary threshold for similarity
        similarityScore = Math.max(similarityScore, currentSimilarity);
        isUnique = false;
        recommendations.push(`Content shows ${currentSimilarity.toFixed(2)}% similarity with a comparison document. Consider rephrasing sections.`);
        // For simplicity, not extracting exact phrases from corpus comparison here
      }
    });

    if (similarityScore > 0) {
      isUnique = false;
    }

    return {
      isUnique,
      similarityScore: Number(similarityScore.toFixed(2)),
      plagiarismDetectedPhrases,
      recommendations,
    };
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s\s+/g, ' ').trim();
  }

  private findRepeatedPhrases(words: string[], phraseLength: number): string | null {
    if (words.length < phraseLength * 2) return null;

    const phrases = new Map<string, number>();
    for (let i = 0; i <= words.length - phraseLength; i++) {
      const phrase = words.slice(i, i + phraseLength).join(' ');
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }

    for (const [phrase, count] of phrases.entries()) {
      if (count > 1) {
        return phrase;
      }
    }
    return null;
  }
}
