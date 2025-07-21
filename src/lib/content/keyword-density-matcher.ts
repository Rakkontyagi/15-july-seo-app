export interface KeywordTarget {
  keyword: string;
  targetDensity: number;
  currentDensity: number;
  status: 'under' | 'optimal' | 'over';
}

export interface DensityMatchResult {
  targets: KeywordTarget[];
  overallScore: number;
  recommendations: string[];
  optimizedContent?: string;
}

export class KeywordDensityMatcher {
  private static readonly OPTIMAL_DENSITY_RANGE = {
    primary: { min: 1.0, max: 3.0 },
    secondary: { min: 0.5, max: 2.0 },
    lsi: { min: 0.2, max: 1.0 },
  };

  static analyzeKeywordDensity(
    content: string,
    primaryKeywords: string[],
    secondaryKeywords: string[] = [],
    lsiKeywords: string[] = []
  ): DensityMatchResult {
    const wordCount = this.countWords(content);
    const targets: KeywordTarget[] = [];

    // Analyze primary keywords
    primaryKeywords.forEach(keyword => {
      const density = this.calculateDensity(content, keyword, wordCount);
      const target = this.OPTIMAL_DENSITY_RANGE.primary;
      targets.push({
        keyword,
        targetDensity: (target.min + target.max) / 2,
        currentDensity: density,
        status: this.getDensityStatus(density, target.min, target.max),
      });
    });

    // Analyze secondary keywords
    secondaryKeywords.forEach(keyword => {
      const density = this.calculateDensity(content, keyword, wordCount);
      const target = this.OPTIMAL_DENSITY_RANGE.secondary;
      targets.push({
        keyword,
        targetDensity: (target.min + target.max) / 2,
        currentDensity: density,
        status: this.getDensityStatus(density, target.min, target.max),
      });
    });

    // Analyze LSI keywords
    lsiKeywords.forEach(keyword => {
      const density = this.calculateDensity(content, keyword, wordCount);
      const target = this.OPTIMAL_DENSITY_RANGE.lsi;
      targets.push({
        keyword,
        targetDensity: (target.min + target.max) / 2,
        currentDensity: density,
        status: this.getDensityStatus(density, target.min, target.max),
      });
    });

    const overallScore = this.calculateOverallScore(targets);
    const recommendations = this.generateRecommendations(targets);

    return {
      targets,
      overallScore,
      recommendations,
    };
  }

  static optimizeContentDensity(
    content: string,
    targets: KeywordTarget[]
  ): string {
    let optimizedContent = content;
    
    // This is a simplified optimization - in production, use more sophisticated NLP
    targets.forEach(target => {
      if (target.status === 'under') {
        // Add keyword mentions naturally
        optimizedContent = this.addKeywordMentions(optimizedContent, target);
      } else if (target.status === 'over') {
        // Reduce keyword mentions
        optimizedContent = this.reduceKeywordMentions(optimizedContent, target);
      }
    });

    return optimizedContent;
  }

  private static countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private static calculateDensity(content: string, keyword: string, wordCount: number): number {
    const regex = new RegExp(keyword.toLowerCase(), 'gi');
    const matches = content.toLowerCase().match(regex) || [];
    return (matches.length / wordCount) * 100;
  }

  private static getDensityStatus(
    density: number,
    minTarget: number,
    maxTarget: number
  ): 'under' | 'optimal' | 'over' {
    if (density < minTarget) return 'under';
    if (density > maxTarget) return 'over';
    return 'optimal';
  }

  private static calculateOverallScore(targets: KeywordTarget[]): number {
    if (targets.length === 0) return 100;

    const optimalCount = targets.filter(t => t.status === 'optimal').length;
    return Math.round((optimalCount / targets.length) * 100);
  }

  private static generateRecommendations(targets: KeywordTarget[]): string[] {
    const recommendations: string[] = [];

    const underTargets = targets.filter(t => t.status === 'under');
    const overTargets = targets.filter(t => t.status === 'over');

    if (underTargets.length > 0) {
      recommendations.push(
        `Increase density for: ${underTargets.map(t => t.keyword).join(', ')}`
      );
    }

    if (overTargets.length > 0) {
      recommendations.push(
        `Reduce density for: ${overTargets.map(t => t.keyword).join(', ')}`
      );
    }

    if (underTargets.length === 0 && overTargets.length === 0) {
      recommendations.push('Keyword density is optimal for all targets');
    }

    return recommendations;
  }

  private static addKeywordMentions(content: string, target: KeywordTarget): string {
    // Simple implementation - in production, use more sophisticated text generation
    const sentences = content.split('. ');
    const targetSentenceIndex = Math.floor(sentences.length / 2);
    
    if (targetSentenceIndex < sentences.length) {
      const sentence = sentences[targetSentenceIndex];
      if (!sentence.toLowerCase().includes(target.keyword.toLowerCase())) {
        sentences[targetSentenceIndex] = sentence + ` This relates to ${target.keyword}.`;
      }
    }

    return sentences.join('. ');
  }

  private static reduceKeywordMentions(content: string, target: KeywordTarget): string {
    // Simple implementation - replace some keyword mentions with synonyms
    const regex = new RegExp(target.keyword, 'gi');
    let replacementCount = 0;
    const maxReplacements = Math.ceil(target.currentDensity - target.targetDensity);

    return content.replace(regex, (match) => {
      if (replacementCount < maxReplacements) {
        replacementCount++;
        return this.getKeywordSynonym(target.keyword);
      }
      return match;
    });
  }

  private static getKeywordSynonym(keyword: string): string {
    // Simple synonym mapping - in production, use a proper thesaurus API
    const synonyms: Record<string, string[]> = {
      'seo': ['search optimization', 'search engine optimization'],
      'content': ['material', 'information', 'text'],
      'marketing': ['promotion', 'advertising'],
      'business': ['company', 'organization', 'enterprise'],
    };

    const keywordSynonyms = synonyms[keyword.toLowerCase()];
    if (keywordSynonyms && keywordSynonyms.length > 0) {
      return keywordSynonyms[Math.floor(Math.random() * keywordSynonyms.length)];
    }

    return keyword;
  }
}
