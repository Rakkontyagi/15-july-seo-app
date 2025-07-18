
import { detectRepetitivePhrases } from './patterns/repetitive-phrases';
import { analyzeSentenceStructure } from './patterns/sentence-structure';
import { identifyPredictablePatterns } from './patterns/predictable-patterns';
import { loadAITypicalPhrases } from './data/ai-typical-phrases';

export interface AIPatternAnalysis {
  repetitivePhrases: string[];
  sentenceStructurePatterns: any;
  predictableWritingPatterns: any;
  aiTypicalPhraseCount: number;
  patternFrequencyScore: number;
}

export class AIPatternDetector {
  private aiTypicalPhrases: Set<string>;

  constructor() {
    this.aiTypicalPhrases = loadAITypicalPhrases();
  }

  analyze(content: string): AIPatternAnalysis {
    const repetitivePhrases = detectRepetitivePhrases(content);
    const sentenceStructurePatterns = analyzeSentenceStructure(content);
    const predictableWritingPatterns = identifyPredictablePatterns(content);
    const aiTypicalPhraseCount = this.countAITypicalPhrases(content);
    const patternFrequencyScore = this.calculatePatternFrequencyScore(content, repetitivePhrases, aiTypicalPhraseCount);

    return {
      repetitivePhrases,
      sentenceStructurePatterns,
      predictableWritingPatterns,
      aiTypicalPhraseCount,
      patternFrequencyScore,
    };
  }

  private countAITypicalPhrases(content: string): number {
    let count = 0;
    this.aiTypicalPhrases.forEach(phrase => {
      if (content.includes(phrase)) {
        count++;
      }
    });
    return count;
  }

  private calculatePatternFrequencyScore(content: string, repetitivePhrases: string[], aiTypicalPhraseCount: number): number {
    const totalWords = content.split(/\s+/).length;
    if (totalWords === 0) return 0;

    const repetitivePhraseDensity = (repetitivePhrases.length / totalWords) * 100;
    const aiTypicalPhraseDensity = (aiTypicalPhraseCount / totalWords) * 100;

    // Simple scoring: higher density of patterns means higher score
    return (repetitivePhraseDensity + aiTypicalPhraseDensity) / 2;
  }
}
