/**
 * Benchmark Reporting System for Advanced Competitive Intelligence
 * Provides exact targets and actionable recommendations based on competitor analysis
 */

import { z } from 'zod';

export interface BenchmarkTarget {
  metric: string;
  currentValue: number;
  competitorAverage: number;
  competitorMedian: number;
  topPerformer: number;
  recommendedTarget: number;
  exactAction: string;
  priority: 'high' | 'medium' | 'low';
  impact: number; // 0-100
  effort: number; // 0-100
}

export interface KeywordBenchmark {
  keyword: string;
  currentDensity: number;
  competitorAverage: number;
  recommendedDensity: number;
  currentCount: number;
  recommendedCount: number;
  exactAction: string;
  placements: {
    title: boolean;
    headings: number;
    firstParagraph: boolean;
    lastParagraph: boolean;
    metaDescription: boolean;
  };
}

export interface HeadingBenchmark {
  level: string; // H1, H2, H3, etc.
  currentCount: number;
  competitorAverage: number;
  recommendedCount: number;
  keywordOptimized: number;
  recommendedKeywordOptimized: number;
  exactActions: string[];
}

export interface ContentBenchmark {
  wordCount: {
    current: number;
    competitorAverage: number;
    recommended: number;
    exactAction: string;
  };
  readabilityScore: {
    current: number;
    competitorAverage: number;
    recommended: number;
    exactAction: string;
  };
  topicCoverage: {
    current: number;
    competitorAverage: number;
    recommended: number;
    missingTopics: string[];
    exactActions: string[];
  };
}

export interface BenchmarkReport {
  overview: {
    overallGap: number; // -100 to 100
    competitivePosition: number; // 1-based ranking
    improvementPotential: number; // 0-100
    priorityActions: number;
  };
  keywordBenchmarks: KeywordBenchmark[];
  headingBenchmarks: HeadingBenchmark[];
  contentBenchmarks: ContentBenchmark;
  technicalBenchmarks: BenchmarkTarget[];
  gapAnalysis: {
    criticalGaps: BenchmarkTarget[];
    opportunities: BenchmarkTarget[];
    strengths: BenchmarkTarget[];
  };
  actionPlan: Array<{
    action: string;
    target: string;
    timeline: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }>;
  competitorInsights: {
    topPerformers: Array<{
      url: string;
      strengths: string[];
      tactics: string[];
    }>;
    commonPatterns: string[];
    uniqueOpportunities: string[];
  };
}

export interface BenchmarkReportOptions {
  primaryKeyword: string;
  targetKeywords?: string[];
  contentType?: 'blog' | 'article' | 'product' | 'landing' | 'guide';
  targetAudience?: 'general' | 'technical' | 'academic' | 'casual';
  includeCompetitorInsights?: boolean;
  prioritizeQuickWins?: boolean;
}

const DEFAULT_OPTIONS: Required<BenchmarkReportOptions> = {
  primaryKeyword: '',
  targetKeywords: [],
  contentType: 'article',
  targetAudience: 'general',
  includeCompetitorInsights: true,
  prioritizeQuickWins: true,
};

export class BenchmarkReporter {
  private options: Required<BenchmarkReportOptions>;

  constructor(options: BenchmarkReportOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateBenchmarkReport(
    currentAnalysis: any,
    competitorAnalyses: Array<{ url: string; analysis: any }>
  ): BenchmarkReport {
    // Calculate competitor statistics
    const competitorStats = this.calculateCompetitorStatistics(competitorAnalyses);

    // Generate keyword benchmarks
    const keywordBenchmarks = this.generateKeywordBenchmarks(
      currentAnalysis,
      competitorStats
    );

    // Generate heading benchmarks
    const headingBenchmarks = this.generateHeadingBenchmarks(
      currentAnalysis,
      competitorStats
    );

    // Generate content benchmarks
    const contentBenchmarks = this.generateContentBenchmarks(
      currentAnalysis,
      competitorStats
    );

    // Generate technical benchmarks
    const technicalBenchmarks = this.generateTechnicalBenchmarks(
      currentAnalysis,
      competitorStats
    );

    // Perform gap analysis
    const gapAnalysis = this.performGapAnalysis([
      ...technicalBenchmarks,
      ...this.convertKeywordBenchmarksToTargets(keywordBenchmarks),
      ...this.convertHeadingBenchmarksToTargets(headingBenchmarks),
    ]);

    // Generate action plan
    const actionPlan = this.generateActionPlan(
      keywordBenchmarks,
      headingBenchmarks,
      contentBenchmarks,
      gapAnalysis
    );

    // Generate competitor insights
    const competitorInsights = this.options.includeCompetitorInsights
      ? this.generateCompetitorInsights(competitorAnalyses)
      : this.getDefaultCompetitorInsights();

    // Calculate overview metrics
    const overview = this.calculateOverviewMetrics(
      gapAnalysis,
      actionPlan,
      competitorAnalyses.length
    );

    return {
      overview,
      keywordBenchmarks,
      headingBenchmarks,
      contentBenchmarks,
      technicalBenchmarks,
      gapAnalysis,
      actionPlan,
      competitorInsights,
    };
  }

  /**
   * Calculate competitor statistics
   */
  private calculateCompetitorStatistics(competitorAnalyses: Array<{ url: string; analysis: any }>) {
    const stats = {
      wordCount: this.calculateStats(competitorAnalyses.map(c => c.analysis.wordCount?.totalWords || 0)),
      keywordDensity: this.calculateStats(competitorAnalyses.map(c => c.analysis.keywordDensity?.primaryKeyword?.density || 0)),
      headingCount: this.calculateStats(competitorAnalyses.map(c => c.analysis.headingOptimization?.overallAnalysis?.totalHeadings || 0)),
      h1Count: this.calculateStats(competitorAnalyses.map(c => c.analysis.headingOptimization?.overallAnalysis?.h1Count || 0)),
      readabilityScore: this.calculateStats(competitorAnalyses.map(c => c.analysis.contentStructure?.overview?.readabilityScore || 0)),
      metaTagScore: this.calculateStats(competitorAnalyses.map(c => c.analysis.metaTags?.scores?.overall || 0)),
      topicCoverage: this.calculateStats(competitorAnalyses.map(c => c.analysis.lsiKeywords?.topicCoverage?.score || 0)),
    };

    return stats;
  }

  /**
   * Calculate statistical measures
   */
  private calculateStats(values: number[]) {
    if (values.length === 0) return { average: 0, median: 0, min: 0, max: 0, topPerformer: 0 };

    const sorted = values.sort((a, b) => a - b);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      topPerformer: sorted[sorted.length - 1], // Highest value
    };
  }

  /**
   * Generate keyword benchmarks
   */
  private generateKeywordBenchmarks(currentAnalysis: any, competitorStats: any): KeywordBenchmark[] {
    const benchmarks: KeywordBenchmark[] = [];

    // Primary keyword benchmark
    if (this.options.primaryKeyword) {
      const currentDensity = currentAnalysis.keywordDensity?.primaryKeyword?.density || 0;
      const competitorAverage = competitorStats.keywordDensity.average;
      const recommendedDensity = Math.max(1.5, Math.min(3.0, competitorAverage * 1.1));
      
      const currentWordCount = currentAnalysis.wordCount?.totalWords || 1000;
      const currentCount = Math.round((currentDensity / 100) * currentWordCount);
      const recommendedCount = Math.round((recommendedDensity / 100) * currentWordCount);

      benchmarks.push({
        keyword: this.options.primaryKeyword,
        currentDensity,
        competitorAverage,
        recommendedDensity,
        currentCount,
        recommendedCount,
        exactAction: this.generateKeywordAction(currentCount, recommendedCount, this.options.primaryKeyword),
        placements: {
          title: currentAnalysis.metaTags?.analysis?.title?.keywordPresence || false,
          headings: currentAnalysis.headingOptimization?.keywordDistribution?.totalKeywordHeadings || 0,
          firstParagraph: true, // Simplified
          lastParagraph: false, // Simplified
          metaDescription: currentAnalysis.metaTags?.analysis?.description?.keywordPresence || false,
        },
      });
    }

    // Target keywords benchmarks
    this.options.targetKeywords.forEach(keyword => {
      const currentDensity = 0; // Simplified - would need actual analysis
      const recommendedDensity = Math.max(0.5, competitorAverage * 0.8);
      const currentWordCount = currentAnalysis.wordCount?.totalWords || 1000;
      const currentCount = Math.round((currentDensity / 100) * currentWordCount);
      const recommendedCount = Math.round((recommendedDensity / 100) * currentWordCount);

      benchmarks.push({
        keyword,
        currentDensity,
        competitorAverage: competitorStats.keywordDensity.average * 0.8,
        recommendedDensity,
        currentCount,
        recommendedCount,
        exactAction: this.generateKeywordAction(currentCount, recommendedCount, keyword),
        placements: {
          title: false,
          headings: 0,
          firstParagraph: false,
          lastParagraph: false,
          metaDescription: false,
        },
      });
    });

    return benchmarks;
  }

  /**
   * Generate keyword action
   */
  private generateKeywordAction(currentCount: number, recommendedCount: number, keyword: string): string {
    const difference = recommendedCount - currentCount;
    
    if (difference > 0) {
      return `Add "${keyword}" ${difference} more time${difference > 1 ? 's' : ''} throughout the content`;
    } else if (difference < 0) {
      return `Remove "${keyword}" ${Math.abs(difference)} time${Math.abs(difference) > 1 ? 's' : ''} to avoid over-optimization`;
    } else {
      return `Keyword "${keyword}" usage is optimal`;
    }
  }

  /**
   * Generate heading benchmarks
   */
  private generateHeadingBenchmarks(currentAnalysis: any, competitorStats: any): HeadingBenchmark[] {
    const benchmarks: HeadingBenchmark[] = [];

    const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    
    headingLevels.forEach(level => {
      const currentCount = this.getCurrentHeadingCount(currentAnalysis, level);
      const competitorAverage = this.getCompetitorHeadingAverage(competitorStats, level);
      const recommendedCount = Math.round(competitorAverage * 1.1);
      
      const keywordOptimized = this.getCurrentKeywordOptimizedHeadings(currentAnalysis, level);
      const recommendedKeywordOptimized = Math.max(1, Math.round(recommendedCount * 0.6));

      benchmarks.push({
        level,
        currentCount,
        competitorAverage,
        recommendedCount,
        keywordOptimized,
        recommendedKeywordOptimized,
        exactActions: this.generateHeadingActions(
          level,
          currentCount,
          recommendedCount,
          keywordOptimized,
          recommendedKeywordOptimized
        ),
      });
    });

    return benchmarks.filter(b => b.recommendedCount > 0 || b.currentCount > 0);
  }

  /**
   * Generate heading actions
   */
  private generateHeadingActions(
    level: string,
    currentCount: number,
    recommendedCount: number,
    keywordOptimized: number,
    recommendedKeywordOptimized: number
  ): string[] {
    const actions: string[] = [];

    const countDifference = recommendedCount - currentCount;
    if (countDifference > 0) {
      actions.push(`Add ${countDifference} more ${level} heading${countDifference > 1 ? 's' : ''}`);
    } else if (countDifference < 0) {
      actions.push(`Remove ${Math.abs(countDifference)} ${level} heading${Math.abs(countDifference) > 1 ? 's' : ''}`);
    }

    const keywordDifference = recommendedKeywordOptimized - keywordOptimized;
    if (keywordDifference > 0) {
      actions.push(`Optimize ${keywordDifference} more ${level} heading${keywordDifference > 1 ? 's' : ''} with target keywords`);
    }

    if (actions.length === 0) {
      actions.push(`${level} headings are optimally configured`);
    }

    return actions;
  }

  /**
   * Generate content benchmarks
   */
  private generateContentBenchmarks(currentAnalysis: any, competitorStats: any): ContentBenchmark {
    const currentWordCount = currentAnalysis.wordCount?.totalWords || 0;
    const competitorAverageWordCount = competitorStats.wordCount.average;
    const recommendedWordCount = Math.round(competitorAverageWordCount * 1.1);

    const currentReadability = currentAnalysis.contentStructure?.overview?.readabilityScore || 0;
    const competitorAverageReadability = competitorStats.readabilityScore.average;
    const recommendedReadability = Math.max(70, competitorAverageReadability);

    const currentTopicCoverage = currentAnalysis.lsiKeywords?.topicCoverage?.score || 0;
    const competitorAverageTopicCoverage = competitorStats.topicCoverage.average;
    const recommendedTopicCoverage = Math.max(80, competitorAverageTopicCoverage);

    return {
      wordCount: {
        current: currentWordCount,
        competitorAverage: competitorAverageWordCount,
        recommended: recommendedWordCount,
        exactAction: this.generateWordCountAction(currentWordCount, recommendedWordCount),
      },
      readabilityScore: {
        current: currentReadability,
        competitorAverage: competitorAverageReadability,
        recommended: recommendedReadability,
        exactAction: this.generateReadabilityAction(currentReadability, recommendedReadability),
      },
      topicCoverage: {
        current: currentTopicCoverage,
        competitorAverage: competitorAverageTopicCoverage,
        recommended: recommendedTopicCoverage,
        missingTopics: currentAnalysis.lsiKeywords?.topicCoverage?.missingTopics || [],
        exactActions: this.generateTopicCoverageActions(
          currentTopicCoverage,
          recommendedTopicCoverage,
          currentAnalysis.lsiKeywords?.topicCoverage?.missingTopics || []
        ),
      },
    };
  }

  /**
   * Generate word count action
   */
  private generateWordCountAction(current: number, recommended: number): string {
    const difference = recommended - current;

    if (difference > 100) {
      return `Add approximately ${difference} words to match competitor depth`;
    } else if (difference < -100) {
      return `Consider reducing content by ${Math.abs(difference)} words for better focus`;
    } else {
      return 'Word count is competitive';
    }
  }

  /**
   * Generate readability action
   */
  private generateReadabilityAction(current: number, recommended: number): string {
    const difference = recommended - current;

    if (difference > 10) {
      return `Improve readability score by ${difference} points through simpler language and shorter sentences`;
    } else if (difference < -10) {
      return 'Readability is above competitor average - maintain current level';
    } else {
      return 'Readability is competitive';
    }
  }

  /**
   * Generate topic coverage actions
   */
  private generateTopicCoverageActions(
    current: number,
    recommended: number,
    missingTopics: string[]
  ): string[] {
    const actions: string[] = [];

    const difference = recommended - current;
    if (difference > 10) {
      actions.push(`Improve topic coverage by ${difference} points`);
    }

    if (missingTopics.length > 0) {
      actions.push(`Add content covering: ${missingTopics.slice(0, 3).join(', ')}`);
    }

    if (actions.length === 0) {
      actions.push('Topic coverage is competitive');
    }

    return actions;
  }

  /**
   * Generate technical benchmarks
   */
  private generateTechnicalBenchmarks(currentAnalysis: any, competitorStats: any): BenchmarkTarget[] {
    const benchmarks: BenchmarkTarget[] = [];

    // Meta tag optimization
    const currentMetaScore = currentAnalysis.metaTags?.scores?.overall || 0;
    const competitorMetaAverage = competitorStats.metaTagScore.average;

    benchmarks.push({
      metric: 'Meta Tag Optimization',
      currentValue: currentMetaScore,
      competitorAverage: competitorMetaAverage,
      competitorMedian: competitorStats.metaTagScore.median,
      topPerformer: competitorStats.metaTagScore.topPerformer,
      recommendedTarget: Math.max(85, competitorMetaAverage * 1.1),
      exactAction: this.generateMetaTagAction(currentMetaScore, competitorMetaAverage),
      priority: currentMetaScore < competitorMetaAverage ? 'high' : 'medium',
      impact: 85,
      effort: 30,
    });

    return benchmarks;
  }

  /**
   * Generate meta tag action
   */
  private generateMetaTagAction(current: number, competitorAverage: number): string {
    if (current < competitorAverage - 10) {
      return 'Optimize title tag, meta description, and social media tags';
    } else if (current < competitorAverage) {
      return 'Fine-tune meta tags for better optimization';
    } else {
      return 'Meta tag optimization is competitive';
    }
  }

  /**
   * Perform gap analysis
   */
  private performGapAnalysis(benchmarks: BenchmarkTarget[]) {
    const criticalGaps = benchmarks.filter(b =>
      b.currentValue < b.competitorAverage * 0.8 && b.priority === 'high'
    );

    const opportunities = benchmarks.filter(b =>
      b.currentValue < b.topPerformer * 0.9 && b.impact > 70
    );

    const strengths = benchmarks.filter(b =>
      b.currentValue > b.competitorAverage * 1.1
    );

    return {
      criticalGaps,
      opportunities,
      strengths,
    };
  }

  /**
   * Generate action plan
   */
  private generateActionPlan(
    keywordBenchmarks: KeywordBenchmark[],
    headingBenchmarks: HeadingBenchmark[],
    contentBenchmarks: ContentBenchmark,
    gapAnalysis: any
  ) {
    const actions: BenchmarkReport['actionPlan'] = [];

    // High priority keyword actions
    keywordBenchmarks.forEach(kb => {
      if (kb.currentDensity < kb.competitorAverage * 0.8) {
        actions.push({
          action: kb.exactAction,
          target: `${kb.recommendedDensity}% density (${kb.recommendedCount} occurrences)`,
          timeline: 'Immediate',
          priority: 'high',
          expectedImpact: 'Improved keyword relevance and search visibility',
        });
      }
    });

    // Heading optimization actions
    headingBenchmarks.forEach(hb => {
      if (hb.currentCount < hb.recommendedCount) {
        actions.push({
          action: hb.exactActions[0] || 'Optimize headings',
          target: `${hb.recommendedCount} ${hb.level} headings with ${hb.recommendedKeywordOptimized} keyword-optimized`,
          timeline: 'Short-term',
          priority: 'medium',
          expectedImpact: 'Better content structure and keyword distribution',
        });
      }
    });

    // Content benchmark actions
    if (contentBenchmarks.wordCount.current < contentBenchmarks.wordCount.recommended) {
      actions.push({
        action: contentBenchmarks.wordCount.exactAction,
        target: `${contentBenchmarks.wordCount.recommended} words`,
        timeline: 'Medium-term',
        priority: 'medium',
        expectedImpact: 'Increased content depth and authority',
      });
    }

    // Critical gap actions
    gapAnalysis.criticalGaps.forEach((gap: BenchmarkTarget) => {
      actions.push({
        action: gap.exactAction,
        target: `${gap.recommendedTarget} (vs current ${gap.currentValue})`,
        timeline: 'Immediate',
        priority: 'high',
        expectedImpact: `High impact improvement in ${gap.metric.toLowerCase()}`,
      });
    });

    return actions.slice(0, 10); // Limit to top 10 actions
  }

  /**
   * Generate competitor insights
   */
  private generateCompetitorInsights(competitorAnalyses: Array<{ url: string; analysis: any }>) {
    const topPerformers = competitorAnalyses
      .sort((a, b) => (b.analysis.overview?.overallScore || 0) - (a.analysis.overview?.overallScore || 0))
      .slice(0, 3)
      .map(competitor => ({
        url: competitor.url,
        strengths: this.identifyCompetitorStrengths(competitor.analysis),
        tactics: this.identifyCompetitorTactics(competitor.analysis),
      }));

    const commonPatterns = this.identifyCommonPatterns(competitorAnalyses);
    const uniqueOpportunities = this.identifyUniqueOpportunities(competitorAnalyses);

    return {
      topPerformers,
      commonPatterns,
      uniqueOpportunities,
    };
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverviewMetrics(gapAnalysis: any, actionPlan: any, competitorCount: number) {
    const overallGap = gapAnalysis.criticalGaps.length > 0 ? -30 :
                      gapAnalysis.opportunities.length > 0 ? -10 : 10;

    const competitivePosition = gapAnalysis.strengths.length > gapAnalysis.criticalGaps.length ? 1 :
                               gapAnalysis.criticalGaps.length > 3 ? 3 : 2;

    const improvementPotential = Math.min(100, gapAnalysis.opportunities.length * 15);
    const priorityActions = actionPlan.filter((a: any) => a.priority === 'high').length;

    return {
      overallGap,
      competitivePosition,
      improvementPotential,
      priorityActions,
    };
  }

  // Helper methods
  private getCurrentHeadingCount(analysis: any, level: string): number {
    // Simplified - would need actual heading analysis by level
    const totalHeadings = analysis.headingOptimization?.overallAnalysis?.totalHeadings || 0;
    if (level === 'H1') return analysis.headingOptimization?.overallAnalysis?.h1Count || 0;
    if (level === 'H2') return Math.round(totalHeadings * 0.4);
    if (level === 'H3') return Math.round(totalHeadings * 0.3);
    return Math.round(totalHeadings * 0.1);
  }

  private getCompetitorHeadingAverage(stats: any, level: string): number {
    if (level === 'H1') return stats.h1Count.average;
    return stats.headingCount.average * (level === 'H2' ? 0.4 : level === 'H3' ? 0.3 : 0.1);
  }

  private getCurrentKeywordOptimizedHeadings(analysis: any, level: string): number {
    const total = analysis.headingOptimization?.overallAnalysis?.keywordOptimizedHeadings || 0;
    return Math.round(total * (level === 'H1' ? 0.5 : level === 'H2' ? 0.3 : 0.2));
  }

  private convertKeywordBenchmarksToTargets(benchmarks: KeywordBenchmark[]): BenchmarkTarget[] {
    return benchmarks.map(kb => ({
      metric: `Keyword Density: ${kb.keyword}`,
      currentValue: kb.currentDensity,
      competitorAverage: kb.competitorAverage,
      competitorMedian: kb.competitorAverage,
      topPerformer: kb.competitorAverage * 1.2,
      recommendedTarget: kb.recommendedDensity,
      exactAction: kb.exactAction,
      priority: kb.currentDensity < kb.competitorAverage * 0.8 ? 'high' : 'medium',
      impact: 80,
      effort: 40,
    }));
  }

  private convertHeadingBenchmarksToTargets(benchmarks: HeadingBenchmark[]): BenchmarkTarget[] {
    return benchmarks.map(hb => ({
      metric: `${hb.level} Headings`,
      currentValue: hb.currentCount,
      competitorAverage: hb.competitorAverage,
      competitorMedian: hb.competitorAverage,
      topPerformer: hb.competitorAverage * 1.2,
      recommendedTarget: hb.recommendedCount,
      exactAction: hb.exactActions[0] || 'Optimize headings',
      priority: hb.currentCount < hb.recommendedCount ? 'medium' : 'low',
      impact: 60,
      effort: 50,
    }));
  }

  private identifyCompetitorStrengths(analysis: any): string[] {
    const strengths: string[] = [];

    if (analysis.overview?.overallScore > 80) strengths.push('High overall SEO score');
    if (analysis.keywordDensity?.overallDensity?.isOptimal) strengths.push('Optimal keyword density');
    if (analysis.metaTags?.scores?.overall > 85) strengths.push('Excellent meta tag optimization');

    return strengths;
  }

  private identifyCompetitorTactics(analysis: any): string[] {
    const tactics: string[] = [];

    if (analysis.wordCount?.totalWords > 2000) tactics.push('Long-form content strategy');
    if (analysis.headingOptimization?.overallAnalysis?.totalHeadings > 10) tactics.push('Extensive heading structure');
    if (analysis.lsiKeywords?.topicCoverage?.score > 80) tactics.push('Comprehensive topic coverage');

    return tactics;
  }

  private identifyCommonPatterns(competitorAnalyses: Array<{ url: string; analysis: any }>): string[] {
    const patterns: string[] = [];

    const avgWordCount = competitorAnalyses.reduce((sum, c) => sum + (c.analysis.wordCount?.totalWords || 0), 0) / competitorAnalyses.length;
    if (avgWordCount > 1500) patterns.push('Long-form content is standard');

    const avgHeadings = competitorAnalyses.reduce((sum, c) => sum + (c.analysis.headingOptimization?.overallAnalysis?.totalHeadings || 0), 0) / competitorAnalyses.length;
    if (avgHeadings > 8) patterns.push('Extensive use of headings for structure');

    return patterns;
  }

  private identifyUniqueOpportunities(competitorAnalyses: Array<{ url: string; analysis: any }>): string[] {
    const opportunities: string[] = [];

    const avgEngagement = competitorAnalyses.reduce((sum, c) => sum + (c.analysis.engagement?.engagementScore || 0), 0) / competitorAnalyses.length;
    if (avgEngagement < 60) opportunities.push('Improve content engagement above competitor average');

    const avgUniqueness = competitorAnalyses.reduce((sum, c) => sum + (c.analysis.uniqueness?.uniquenessScore || 0), 0) / competitorAnalyses.length;
    if (avgUniqueness < 70) opportunities.push('Create more unique and original content');

    return opportunities;
  }

  private getDefaultCompetitorInsights() {
    return {
      topPerformers: [],
      commonPatterns: ['Standard SEO practices observed'],
      uniqueOpportunities: ['Focus on content quality and user experience'],
    };
  }
}

// Factory function
export const createBenchmarkReporter = (options: BenchmarkReportOptions): BenchmarkReporter => {
  return new BenchmarkReporter(options);
};

// Default export
export default BenchmarkReporter;
