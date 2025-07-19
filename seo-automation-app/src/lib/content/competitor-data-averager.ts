/**
 * Competitor Data Averager - Calculates precise averages across competitor analysis data
 * Implements FR4: Exact competitor data averaging for benchmark targets
 */

export interface CompetitorAnalysis {
  url: string;
  wordCount: number;
  keywordDensity: number;
  headingOptimization: number;
  lsiKeywordCount: number;
  entityCount: number;
  readabilityScore: number;
  contentQuality: number;
}

export interface BenchmarkTargets {
  wordCount: number;
  keywordDensity: number;
  headingOptimization: number;
  lsiKeywordTargets: number;
  entityTargets: number;
  readabilityTarget: number;
  qualityTarget: number;
  statisticalMetrics: {
    wordCountStats: StatisticalMetrics;
    keywordDensityStats: StatisticalMetrics;
    headingOptimizationStats: StatisticalMetrics;
  };
}

export interface StatisticalMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  range: { min: number; max: number };
  confidence95: { lower: number; upper: number };
}

export interface EntityAverages {
  averageEntityCount: number;
  topEntityTypes: Array<{ type: string; averageCount: number }>;
  entityDensityTarget: number;
}

export class CompetitorDataAverager {
  private readonly REQUIRED_COMPETITOR_COUNT = 5;
  private readonly PRECISION_DECIMALS = 2;

  /**
   * Calculate precise averages across all 5 competitors
   * Implements exact averaging as specified in FR4
   */
  calculatePreciseAverages(competitors: CompetitorAnalysis[]): BenchmarkTargets {
    this.validateCompetitorData(competitors);

    // Calculate basic averages
    const avgWordCount = this.calculateMean(competitors.map(c => c.wordCount));
    const avgKeywordDensity = this.calculateMean(competitors.map(c => c.keywordDensity));
    const avgHeadingOptimization = this.calculateMean(competitors.map(c => c.headingOptimization));
    const avgLSIUsage = this.calculateMean(competitors.map(c => c.lsiKeywordCount));
    const avgEntityCount = this.calculateMean(competitors.map(c => c.entityCount));
    const avgReadability = this.calculateMean(competitors.map(c => c.readabilityScore));
    const avgQuality = this.calculateMean(competitors.map(c => c.contentQuality));

    // Calculate statistical metrics for key indicators
    const wordCountStats = this.calculateStatisticalMetrics(competitors.map(c => c.wordCount));
    const keywordDensityStats = this.calculateStatisticalMetrics(competitors.map(c => c.keywordDensity));
    const headingOptimizationStats = this.calculateStatisticalMetrics(competitors.map(c => c.headingOptimization));

    return {
      wordCount: Math.round(avgWordCount),
      keywordDensity: Number(avgKeywordDensity.toFixed(this.PRECISION_DECIMALS)),
      headingOptimization: Math.round(avgHeadingOptimization),
      lsiKeywordTargets: Math.round(avgLSIUsage),
      entityTargets: Math.round(avgEntityCount),
      readabilityTarget: Number(avgReadability.toFixed(1)),
      qualityTarget: Number(avgQuality.toFixed(1)),
      statisticalMetrics: {
        wordCountStats,
        keywordDensityStats,
        headingOptimizationStats,
      },
    };
  }

  /**
   * Calculate entity averages with type breakdown
   */
  calculateEntityAverages(competitors: CompetitorAnalysis[]): EntityAverages {
    const totalEntityCount = competitors.reduce((sum, c) => sum + c.entityCount, 0);
    const averageEntityCount = totalEntityCount / competitors.length;

    // Simulate entity type analysis (in real implementation, this would analyze actual entity data)
    const topEntityTypes = [
      { type: 'PERSON', averageCount: Math.round(averageEntityCount * 0.3) },
      { type: 'ORGANIZATION', averageCount: Math.round(averageEntityCount * 0.25) },
      { type: 'LOCATION', averageCount: Math.round(averageEntityCount * 0.2) },
      { type: 'PRODUCT', averageCount: Math.round(averageEntityCount * 0.15) },
      { type: 'EVENT', averageCount: Math.round(averageEntityCount * 0.1) },
    ];

    const avgWordCount = this.calculateMean(competitors.map(c => c.wordCount));
    const entityDensityTarget = Number(((averageEntityCount / avgWordCount) * 100).toFixed(2));

    return {
      averageEntityCount: Math.round(averageEntityCount),
      topEntityTypes,
      entityDensityTarget,
    };
  }

  /**
   * Calculate mean with precision
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = this.calculateMean(squaredDifferences);
    return Math.sqrt(variance);
  }

  /**
   * Calculate range (min/max)
   */
  private calculateRange(values: number[]): { min: number; max: number } {
    if (values.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Calculate 95% confidence interval
   */
  private calculateConfidenceInterval(values: number[]): { lower: number; upper: number } {
    if (values.length === 0) return { lower: 0, upper: 0 };
    
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values);
    const marginOfError = 1.96 * (stdDev / Math.sqrt(values.length)); // 95% confidence
    
    return {
      lower: Number((mean - marginOfError).toFixed(this.PRECISION_DECIMALS)),
      upper: Number((mean + marginOfError).toFixed(this.PRECISION_DECIMALS)),
    };
  }

  /**
   * Calculate comprehensive statistical metrics
   */
  private calculateStatisticalMetrics(values: number[]): StatisticalMetrics {
    return {
      mean: Number(this.calculateMean(values).toFixed(this.PRECISION_DECIMALS)),
      median: Number(this.calculateMedian(values).toFixed(this.PRECISION_DECIMALS)),
      standardDeviation: Number(this.calculateStandardDeviation(values).toFixed(this.PRECISION_DECIMALS)),
      range: this.calculateRange(values),
      confidence95: this.calculateConfidenceInterval(values),
    };
  }

  /**
   * Validate competitor data meets requirements
   */
  private validateCompetitorData(competitors: CompetitorAnalysis[]): void {
    if (!competitors || competitors.length !== this.REQUIRED_COMPETITOR_COUNT) {
      throw new Error(`Exactly ${this.REQUIRED_COMPETITOR_COUNT} competitors required for precise averaging. Received: ${competitors?.length || 0}`);
    }

    // Validate each competitor has required data
    competitors.forEach((competitor, index) => {
      if (!competitor.url) {
        throw new Error(`Competitor ${index + 1} missing URL`);
      }
      if (typeof competitor.wordCount !== 'number' || competitor.wordCount <= 0) {
        throw new Error(`Competitor ${index + 1} has invalid word count: ${competitor.wordCount}`);
      }
      if (typeof competitor.keywordDensity !== 'number' || competitor.keywordDensity < 0) {
        throw new Error(`Competitor ${index + 1} has invalid keyword density: ${competitor.keywordDensity}`);
      }
    });
  }

  /**
   * Generate averaging report for debugging and validation
   */
  generateAveragingReport(competitors: CompetitorAnalysis[], benchmarks: BenchmarkTargets): {
    summary: string;
    details: Array<{ metric: string; values: number[]; average: number; target: number }>;
    validation: { isValid: boolean; issues: string[] };
  } {
    const details = [
      {
        metric: 'Word Count',
        values: competitors.map(c => c.wordCount),
        average: Math.round(this.calculateMean(competitors.map(c => c.wordCount))),
        target: benchmarks.wordCount,
      },
      {
        metric: 'Keyword Density',
        values: competitors.map(c => c.keywordDensity),
        average: Number(this.calculateMean(competitors.map(c => c.keywordDensity)).toFixed(2)),
        target: benchmarks.keywordDensity,
      },
      {
        metric: 'Heading Optimization',
        values: competitors.map(c => c.headingOptimization),
        average: Math.round(this.calculateMean(competitors.map(c => c.headingOptimization))),
        target: benchmarks.headingOptimization,
      },
    ];

    const issues: string[] = [];
    let isValid = true;

    // Validate precision - allow for rounding differences in targets
    details.forEach(detail => {
      const precision = Math.abs(detail.average - detail.target);
      if (precision > 0.1) { // More lenient threshold for validation
        issues.push(`${detail.metric} precision issue: ${precision.toFixed(4)} difference`);
        isValid = false;
      }
    });

    return {
      summary: `Analyzed ${competitors.length} competitors with ${isValid ? 'VALID' : 'INVALID'} precision`,
      details,
      validation: { isValid, issues },
    };
  }
}
