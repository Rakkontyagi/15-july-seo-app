
import { SeoAnalysisResult } from './seo-analyzer';

export interface BenchmarkTargets {
  wordCount: number;
  keywordDensity: number;
  headingOptimization: number;
  lsiKeywords: Array<{ term: string; frequency: number }>;
  entities: Array<{ name: string; frequency: number }>;
}

export interface BenchmarkReport {
  targets: BenchmarkTargets;
  recommendations: string[];
  competitiveGaps: string[];
}

export class BenchmarkReporter {
  generateBenchmarks(competitorAnalyses: SeoAnalysisResult[]): BenchmarkReport {
    if (!competitorAnalyses || competitorAnalyses.length === 0) {
      return {
        targets: { wordCount: 0, keywordDensity: 0, headingOptimization: 0, lsiKeywords: [], entities: [] },
        recommendations: ['No competitor data available to generate benchmarks.'],
        competitiveGaps: [],
      };
    }

    // Calculate averages for numerical metrics
    const avgWordCount = this.calculateAverage(competitorAnalyses.map(c => c.wordAnalysis.wordCount));
    const avgKeywordDensity = this.calculateAverage(competitorAnalyses.map(c => c.keywordDensity));
    const avgHeadingOptimization = this.calculateAverage(competitorAnalyses.map(c => c.headingOptimizationMetrics.optimizationPercentage));

    // Aggregate LSI keywords and entities
    const allLsiKeywords: { [term: string]: number } = {};
    competitorAnalyses.forEach(c => {
      c.lsiKeywords.forEach(lsi => {
        allLsiKeywords[lsi.term] = (allLsiKeywords[lsi.term] || 0) + lsi.frequency;
      });
    });
    const topLsiKeywords = Object.keys(allLsiKeywords)
      .sort((a, b) => allLsiKeywords[b] - allLsiKeywords[a])
      .slice(0, 10) // Top 10 LSI keywords from competitors
      .map(term => ({ term, frequency: allLsiKeywords[term] }));

    const allEntities: { [name: string]: number } = {};
    competitorAnalyses.forEach(c => {
      c.entities.forEach(entity => {
        allEntities[entity.name] = (allEntities[entity.name] || 0) + entity.frequency;
      });
    });
    const topEntities = Object.keys(allEntities)
      .sort((a, b) => allEntities[b] - allEntities[a])
      .slice(0, 10) // Top 10 entities from competitors
      .map(name => ({ name, frequency: allEntities[name] }));

    const targets: BenchmarkTargets = {
      wordCount: Math.round(avgWordCount),
      keywordDensity: Number(avgKeywordDensity.toFixed(2)),
      headingOptimization: Number(avgHeadingOptimization.toFixed(1)),
      lsiKeywords: topLsiKeywords,
      entities: topEntities,
    };

    const recommendations = this.generateRecommendations(targets, competitorAnalyses);
    const competitiveGaps = this.identifyGaps(targets, competitorAnalyses);

    return {
      targets,
      recommendations,
      competitiveGaps,
    };
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
  }

  private generateRecommendations(targets: BenchmarkTargets, competitorAnalyses: SeoAnalysisResult[]): string[] {
    const recommendations: string[] = [];

    // Example recommendations based on targets
    recommendations.push(`Aim for a word count around ${targets.wordCount} words.`);
    recommendations.push(`Target a primary keyword density of ${targets.keywordDensity}%`);
    recommendations.push(`Optimize at least ${targets.headingOptimization}% of your headings with keywords/LSI terms.`);

    if (targets.lsiKeywords.length > 0) {
      recommendations.push(`Consider including these top LSI keywords: ${targets.lsiKeywords.map(l => l.term).join(', ')}.`);
    }
    if (targets.entities.length > 0) {
      recommendations.push(`Ensure your content covers these key entities: ${targets.entities.map(e => e.name).join(', ')}.`);
    }

    // Add more sophisticated recommendations based on gaps or specific metrics

    return recommendations;
  }

  private identifyGaps(targets: BenchmarkTargets, competitorAnalyses: SeoAnalysisResult[]): string[] {
    const gaps: string[] = [];

    // Example gap identification
    // This would typically compare *your* content's metrics against the benchmarks
    // For now, just identifying common areas for improvement based on competitor data

    const hasLowWordCount = competitorAnalyses.some(c => c.wordAnalysis.wordCount < targets.wordCount * 0.7);
    if (hasLowWordCount) {
      gaps.push('Some competitors have significantly lower word counts, indicating an opportunity to provide more comprehensive content.');
    }

    const hasHighKeywordStuffing = competitorAnalyses.some(c => c.keywordDensity > targets.keywordDensity * 1.5);
    if (hasHighKeywordStuffing) {
      gaps.push('Some competitors might be keyword stuffing; focus on natural language and user intent.');
    }

    return gaps;
  }
}
