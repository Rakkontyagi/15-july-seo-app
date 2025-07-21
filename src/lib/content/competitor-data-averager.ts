export interface CompetitorData {
  url: string;
  title: string;
  wordCount: number;
  headingCount: number;
  keywordDensity: Record<string, number>;
  readabilityScore: number;
}

export interface AveragedMetrics {
  averageWordCount: number;
  averageHeadingCount: number;
  averageKeywordDensity: Record<string, number>;
  averageReadabilityScore: number;
  recommendations: string[];
}

export class CompetitorDataAverager {
  static averageCompetitorData(competitors: CompetitorData[]): AveragedMetrics {
    if (competitors.length === 0) {
      return {
        averageWordCount: 1000,
        averageHeadingCount: 5,
        averageKeywordDensity: {},
        averageReadabilityScore: 70,
        recommendations: ['No competitor data available'],
      };
    }

    const totalWordCount = competitors.reduce((sum, comp) => sum + comp.wordCount, 0);
    const totalHeadingCount = competitors.reduce((sum, comp) => sum + comp.headingCount, 0);
    const totalReadabilityScore = competitors.reduce((sum, comp) => sum + comp.readabilityScore, 0);

    // Average keyword densities
    const allKeywords = new Set<string>();
    competitors.forEach(comp => {
      Object.keys(comp.keywordDensity).forEach(keyword => allKeywords.add(keyword));
    });

    const averageKeywordDensity: Record<string, number> = {};
    allKeywords.forEach(keyword => {
      const densities = competitors
        .map(comp => comp.keywordDensity[keyword] || 0)
        .filter(density => density > 0);
      
      if (densities.length > 0) {
        averageKeywordDensity[keyword] = densities.reduce((sum, density) => sum + density, 0) / densities.length;
      }
    });

    const averageWordCount = Math.round(totalWordCount / competitors.length);
    const averageHeadingCount = Math.round(totalHeadingCount / competitors.length);
    const averageReadabilityScore = Math.round(totalReadabilityScore / competitors.length);

    const recommendations = this.generateRecommendations({
      averageWordCount,
      averageHeadingCount,
      averageKeywordDensity,
      averageReadabilityScore,
      recommendations: [],
    });

    return {
      averageWordCount,
      averageHeadingCount,
      averageKeywordDensity,
      averageReadabilityScore,
      recommendations,
    };
  }

  private static generateRecommendations(metrics: AveragedMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.averageWordCount < 500) {
      recommendations.push('Consider increasing content length to at least 500 words');
    } else if (metrics.averageWordCount > 3000) {
      recommendations.push('Content might be too long, consider breaking into multiple pieces');
    }

    if (metrics.averageHeadingCount < 3) {
      recommendations.push('Add more headings to improve content structure');
    }

    if (metrics.averageReadabilityScore < 60) {
      recommendations.push('Improve readability by using simpler sentences and words');
    }

    const topKeywords = Object.entries(metrics.averageKeywordDensity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topKeywords.length > 0) {
      recommendations.push(`Focus on these top keywords: ${topKeywords.map(([keyword]) => keyword).join(', ')}`);
    }

    return recommendations;
  }
}
