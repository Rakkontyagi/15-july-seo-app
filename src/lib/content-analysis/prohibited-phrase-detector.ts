export interface ProhibitedPhrase {
  phrase: string;
  category: 'spam' | 'misleading' | 'inappropriate' | 'low-quality';
  severity: 'low' | 'medium' | 'high';
  replacement?: string;
}

export interface ProhibitedPhraseResult {
  found: ProhibitedPhrase[];
  score: number;
  recommendations: string[];
}

export class ProhibitedPhraseDetector {
  private prohibitedPhrases: ProhibitedPhrase[] = [
    // Spam phrases
    { phrase: 'click here', category: 'spam', severity: 'medium', replacement: 'learn more' },
    { phrase: 'buy now', category: 'spam', severity: 'low', replacement: 'get started' },
    { phrase: 'limited time offer', category: 'spam', severity: 'high' },
    { phrase: 'act now', category: 'spam', severity: 'medium' },
    { phrase: 'guaranteed results', category: 'misleading', severity: 'high' },
    
    // Misleading phrases
    { phrase: '100% guaranteed', category: 'misleading', severity: 'high' },
    { phrase: 'instant results', category: 'misleading', severity: 'high' },
    { phrase: 'no risk', category: 'misleading', severity: 'medium' },
    { phrase: 'secret formula', category: 'misleading', severity: 'high' },
    
    // Low-quality phrases
    { phrase: 'amazing', category: 'low-quality', severity: 'low', replacement: 'effective' },
    { phrase: 'incredible', category: 'low-quality', severity: 'low', replacement: 'notable' },
    { phrase: 'unbelievable', category: 'low-quality', severity: 'medium', replacement: 'remarkable' },
    { phrase: 'mind-blowing', category: 'low-quality', severity: 'medium', replacement: 'impressive' }
  ];

  detect(content: string): ProhibitedPhraseResult {
    const found: ProhibitedPhrase[] = [];
    const contentLower = content.toLowerCase();

    for (const phrase of this.prohibitedPhrases) {
      if (contentLower.includes(phrase.phrase.toLowerCase())) {
        found.push(phrase);
      }
    }

    const score = this.calculateScore(found, content.length);
    const recommendations = this.generateRecommendations(found);

    return {
      found,
      score,
      recommendations
    };
  }

  private calculateScore(found: ProhibitedPhrase[], contentLength: number): number {
    if (found.length === 0) return 100;

    const severityWeights = { low: 1, medium: 2, high: 3 };
    const totalPenalty = found.reduce((sum, phrase) => sum + severityWeights[phrase.severity], 0);
    const maxPenalty = found.length * 3; // Maximum possible penalty
    
    // Calculate score based on penalty ratio and content length
    const penaltyRatio = totalPenalty / maxPenalty;
    const lengthFactor = Math.min(contentLength / 1000, 1); // Normalize by 1000 words
    
    return Math.max(0, 100 - (penaltyRatio * 50 * (1 + lengthFactor)));
  }

  private generateRecommendations(found: ProhibitedPhrase[]): string[] {
    const recommendations: string[] = [];

    if (found.length === 0) {
      recommendations.push('Great! No prohibited phrases detected.');
      return recommendations;
    }

    const categories = [...new Set(found.map(p => p.category))];
    
    for (const category of categories) {
      const categoryPhrases = found.filter(p => p.category === category);
      
      switch (category) {
        case 'spam':
          recommendations.push(`Remove ${categoryPhrases.length} spam-like phrases to improve content quality`);
          break;
        case 'misleading':
          recommendations.push(`Replace ${categoryPhrases.length} misleading claims with factual statements`);
          break;
        case 'inappropriate':
          recommendations.push(`Review ${categoryPhrases.length} inappropriate phrases for professional tone`);
          break;
        case 'low-quality':
          recommendations.push(`Enhance ${categoryPhrases.length} low-quality phrases with more specific language`);
          break;
      }
    }

    // Add specific replacement suggestions
    const withReplacements = found.filter(p => p.replacement);
    if (withReplacements.length > 0) {
      recommendations.push('Consider these replacements:');
      withReplacements.forEach(phrase => {
        recommendations.push(`• "${phrase.phrase}" → "${phrase.replacement}"`);
      });
    }

    return recommendations;
  }

  addCustomPhrase(phrase: ProhibitedPhrase): void {
    this.prohibitedPhrases.push(phrase);
  }

  removePhrase(phrase: string): void {
    this.prohibitedPhrases = this.prohibitedPhrases.filter(p => p.phrase !== phrase);
  }

  getCategories(): string[] {
    return [...new Set(this.prohibitedPhrases.map(p => p.category))];
  }

  getPhrasesByCategory(category: string): ProhibitedPhrase[] {
    return this.prohibitedPhrases.filter(p => p.category === category);
  }
}
