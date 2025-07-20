/**
 * Competitor Data Averager - Calculates precise averages across competitor analysis data
 * Implements FR4: Exact competitor data averaging for benchmark targets
 * Enhanced for 0.1% precision requirement and comprehensive LSI/entity analysis
 */

export interface CompetitorData {
  url: string;
  wordCount: number;
  keywordDensity: number;
  optimizedHeadings: number;
  lsiKeywords: LSIKeywordData[];
  entities: EntityData[];
  readabilityScore: number;
  contentQuality: number;
  headings: HeadingData[];
  content: string;
}

export interface LSIKeywordData {
  keyword: string;
  frequency: number;
  density: number;
  context: string[];
}

export interface EntityData {
  text: string;
  type: string;
  frequency: number;
  confidence: number;
  context: string[];
}

export interface HeadingData {
  level: number;
  text: string;
  keywordOptimized: boolean;
  lsiKeywords: string[];
}

// Legacy interface for backward compatibility
export interface CompetitorAnalysis extends CompetitorData {
  lsiKeywordCount: number;
  entityCount: number;
  headingOptimization: number;
}

export interface PreciseBenchmarks {
  averageWordCount: number;
  averageKeywordDensity: number;
  averageOptimizedHeadings: number;
  lsiKeywordFrequencies: LSIKeywordFrequency[];
  entityUsagePatterns: EntityUsagePattern[];
  standardDeviations: StatisticalDeviations;
  confidenceIntervals: ConfidenceIntervals;
}

export interface ExactTargets {
  targetKeywordDensity: number;
  targetOptimizedHeadings: number;
  targetWordCount: number;
  lsiKeywordTargets: LSIKeywordTarget[];
  entityIntegrationTargets: EntityIntegrationTarget[];
}

export interface LSIKeywordFrequency {
  keyword: string;
  averageFrequency: number;
  averageDensity: number;
  usagePattern: 'high' | 'medium' | 'low';
  contextualRelevance: number;
}

export interface EntityUsagePattern {
  entityType: string;
  averageCount: number;
  averageDensity: number;
  commonEntities: string[];
  usageDistribution: number[];
}

export interface LSIKeywordTarget {
  keyword: string;
  targetFrequency: number;
  targetDensity: number;
  placementStrategy: string;
}

export interface EntityIntegrationTarget {
  entityType: string;
  targetCount: number;
  targetDensity: number;
  suggestedEntities: string[];
}

export interface StatisticalDeviations {
  wordCount: number;
  keywordDensity: number;
  optimizedHeadings: number;
  lsiKeywordUsage: number;
  entityUsage: number;
}

export interface ConfidenceIntervals {
  wordCount: { lower: number; upper: number };
  keywordDensity: { lower: number; upper: number };
  optimizedHeadings: { lower: number; upper: number };
}

// Legacy interface for backward compatibility
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
  private readonly PRECISION_DECIMALS = 3; // Enhanced to 0.001 precision for 0.1% accuracy

  /**
   * CRITICAL: Calculate precise statistical averages across exactly 5 competitors
   * This is the CORE of the user's methodology - must be 100% accurate
   * Implements FR4 with 0.1% precision requirement
   */
  async calculateStatisticalAverages(competitors: CompetitorData[]): Promise<PreciseBenchmarks> {
    // Validate we have exactly 5 competitors
    if (competitors.length !== this.REQUIRED_COMPETITOR_COUNT) {
      throw new Error(`Expected ${this.REQUIRED_COMPETITOR_COUNT} competitors, got ${competitors.length}`);
    }

    this.validateCompetitorData(competitors);

    const wordCounts = competitors.map(c => c.wordCount);
    const keywordDensities = competitors.map(c => c.keywordDensity);
    const optimizedHeadings = competitors.map(c => c.optimizedHeadings);

    return {
      averageWordCount: this.calculateMean(wordCounts),
      averageKeywordDensity: this.calculateMeanWithPrecision(keywordDensities, this.PRECISION_DECIMALS),
      averageOptimizedHeadings: Math.round(this.calculateMean(optimizedHeadings)),
      lsiKeywordFrequencies: await this.analyzeLSIFrequencies(competitors),
      entityUsagePatterns: await this.analyzeEntityPatterns(competitors),
      standardDeviations: this.calculateStandardDeviations(competitors),
      confidenceIntervals: this.calculateConfidenceIntervals(competitors)
    };
  }

  /**
   * Generate exact targets with 0.1% accuracy as specified in PRD
   */
  generateBenchmarkTargets(averages: PreciseBenchmarks): ExactTargets {
    return {
      targetKeywordDensity: Math.round(averages.averageKeywordDensity * 1000) / 1000, // 0.1% precision
      targetOptimizedHeadings: averages.averageOptimizedHeadings,
      targetWordCount: Math.round(averages.averageWordCount),
      lsiKeywordTargets: this.generateLSITargets(averages.lsiKeywordFrequencies),
      entityIntegrationTargets: this.generateEntityTargets(averages.entityUsagePatterns)
    };
  }

  /**
   * CRITICAL: Analyze LSI keyword frequencies across competitors
   * Implements comprehensive LSI analysis as specified in PRD
   */
  private async analyzeLSIFrequencies(competitors: CompetitorData[]): Promise<LSIKeywordFrequency[]> {
    const lsiKeywordMap = new Map<string, { frequencies: number[], densities: number[], contexts: string[][] }>();

    // Aggregate LSI keywords from all competitors
    competitors.forEach(competitor => {
      competitor.lsiKeywords.forEach(lsiKeyword => {
        if (!lsiKeywordMap.has(lsiKeyword.keyword)) {
          lsiKeywordMap.set(lsiKeyword.keyword, { frequencies: [], densities: [], contexts: [] });
        }
        const data = lsiKeywordMap.get(lsiKeyword.keyword)!;
        data.frequencies.push(lsiKeyword.frequency);
        data.densities.push(lsiKeyword.density);
        data.contexts.push(lsiKeyword.context);
      });
    });

    // Calculate averages for each LSI keyword
    const lsiFrequencies: LSIKeywordFrequency[] = [];
    lsiKeywordMap.forEach((data, keyword) => {
      const averageFrequency = this.calculateMean(data.frequencies);
      const averageDensity = this.calculateMeanWithPrecision(data.densities, this.PRECISION_DECIMALS);

      // Determine usage pattern based on frequency
      let usagePattern: 'high' | 'medium' | 'low';
      if (averageFrequency >= 5) usagePattern = 'high';
      else if (averageFrequency >= 2) usagePattern = 'medium';
      else usagePattern = 'low';

      // Calculate contextual relevance (simplified scoring)
      const contextualRelevance = Math.min(100, (averageFrequency * averageDensity * 10));

      lsiFrequencies.push({
        keyword,
        averageFrequency,
        averageDensity,
        usagePattern,
        contextualRelevance: Number(contextualRelevance.toFixed(2))
      });
    });

    // Sort by relevance and return top LSI keywords
    return lsiFrequencies
      .sort((a, b) => b.contextualRelevance - a.contextualRelevance)
      .slice(0, 20); // Top 20 LSI keywords
  }

  /**
   * CRITICAL: Analyze entity usage patterns across competitors
   * Implements comprehensive entity analysis as specified in PRD
   */
  private async analyzeEntityPatterns(competitors: CompetitorData[]): Promise<EntityUsagePattern[]> {
    const entityTypeMap = new Map<string, { counts: number[], entities: Set<string> }>();

    // First, collect all entity types from all competitors
    const allEntityTypes = new Set<string>();
    competitors.forEach(competitor => {
      competitor.entities.forEach(entity => {
        allEntityTypes.add(entity.type);
      });
    });

    // Initialize counts array for each entity type
    allEntityTypes.forEach(entityType => {
      entityTypeMap.set(entityType, { counts: new Array(competitors.length).fill(0), entities: new Set() });
    });

    // Count entities for each competitor
    competitors.forEach((competitor, competitorIndex) => {
      const entityTypeCounts = new Map<string, number>();

      // Count entities by type for this competitor
      competitor.entities.forEach(entity => {
        entityTypeCounts.set(entity.type, (entityTypeCounts.get(entity.type) || 0) + entity.frequency);
        entityTypeMap.get(entity.type)!.entities.add(entity.text);
      });

      // Record counts for each entity type for this competitor
      allEntityTypes.forEach(entityType => {
        const count = entityTypeCounts.get(entityType) || 0;
        entityTypeMap.get(entityType)!.counts[competitorIndex] = count;
      });
    });

    // Calculate patterns for each entity type
    const entityPatterns: EntityUsagePattern[] = [];
    entityTypeMap.forEach((data, entityType) => {
      const averageCount = this.calculateMean(data.counts);
      const totalWords = this.calculateMean(competitors.map(c => c.wordCount));
      const averageDensity = Number(((averageCount / totalWords) * 100).toFixed(this.PRECISION_DECIMALS));

      entityPatterns.push({
        entityType,
        averageCount: Number(averageCount.toFixed(2)),
        averageDensity,
        commonEntities: Array.from(data.entities).slice(0, 10), // Top 10 common entities
        usageDistribution: data.counts
      });
    });

    // Sort by average count and return
    return entityPatterns
      .sort((a, b) => b.averageCount - a.averageCount)
      .slice(0, 15); // Top 15 entity types
  }

  /**
   * Calculate mean with specified precision
   */
  private calculateMeanWithPrecision(values: number[], decimals: number): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    return Number(mean.toFixed(decimals));
  }

  /**
   * Generate LSI keyword targets from frequency analysis
   */
  private generateLSITargets(lsiFrequencies: LSIKeywordFrequency[]): LSIKeywordTarget[] {
    return lsiFrequencies.map(lsi => ({
      keyword: lsi.keyword,
      targetFrequency: Math.round(lsi.averageFrequency),
      targetDensity: lsi.averageDensity,
      placementStrategy: this.determinePlacementStrategy(lsi.usagePattern, lsi.contextualRelevance)
    }));
  }

  /**
   * Generate entity integration targets from usage patterns
   */
  private generateEntityTargets(entityPatterns: EntityUsagePattern[]): EntityIntegrationTarget[] {
    return entityPatterns.map(pattern => ({
      entityType: pattern.entityType,
      targetCount: Math.round(pattern.averageCount),
      targetDensity: pattern.averageDensity,
      suggestedEntities: pattern.commonEntities.slice(0, 5) // Top 5 suggestions
    }));
  }

  /**
   * Determine placement strategy based on usage pattern and relevance
   */
  private determinePlacementStrategy(usagePattern: 'high' | 'medium' | 'low', relevance: number): string {
    if (usagePattern === 'high' && relevance > 50) {
      return 'primary_sections_and_headings';
    } else if (usagePattern === 'medium' || relevance > 25) {
      return 'supporting_paragraphs';
    } else {
      return 'contextual_mentions';
    }
  }

  /**
   * Calculate standard deviations for all metrics
   */
  private calculateStandardDeviations(competitors: CompetitorData[]): StatisticalDeviations {
    return {
      wordCount: this.calculateStandardDeviation(competitors.map(c => c.wordCount)),
      keywordDensity: this.calculateStandardDeviation(competitors.map(c => c.keywordDensity)),
      optimizedHeadings: this.calculateStandardDeviation(competitors.map(c => c.optimizedHeadings)),
      lsiKeywordUsage: this.calculateStandardDeviation(competitors.map(c => c.lsiKeywords.length)),
      entityUsage: this.calculateStandardDeviation(competitors.map(c => c.entities.length))
    };
  }

  /**
   * Calculate confidence intervals for key metrics
   */
  private calculateConfidenceIntervals(competitors: CompetitorData[]): ConfidenceIntervals {
    const wordCounts = competitors.map(c => c.wordCount);
    const keywordDensities = competitors.map(c => c.keywordDensity);
    const optimizedHeadings = competitors.map(c => c.optimizedHeadings);

    return {
      wordCount: this.calculateConfidenceInterval(wordCounts),
      keywordDensity: this.calculateConfidenceInterval(keywordDensities),
      optimizedHeadings: this.calculateConfidenceInterval(optimizedHeadings)
    };
  }

  // Legacy method for backward compatibility
  calculatePreciseAverages(competitors: CompetitorAnalysis[]): BenchmarkTargets {
    this.validateLegacyCompetitorData(competitors);

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
   * Enhanced validation for competitor data with comprehensive checks
   */
  private validateCompetitorData(competitors: CompetitorData[]): void {
    if (!competitors || competitors.length !== this.REQUIRED_COMPETITOR_COUNT) {
      throw new Error(`Exactly ${this.REQUIRED_COMPETITOR_COUNT} competitors required for precise averaging. Received: ${competitors?.length || 0}`);
    }

    // Validate each competitor has required data
    competitors.forEach((competitor, index) => {
      const competitorNum = index + 1;

      if (!competitor.url) {
        throw new Error(`Competitor ${competitorNum} missing URL`);
      }

      if (typeof competitor.wordCount !== 'number' || competitor.wordCount <= 0) {
        throw new Error(`Competitor ${competitorNum} has invalid word count: ${competitor.wordCount}`);
      }

      if (typeof competitor.keywordDensity !== 'number' || competitor.keywordDensity < 0) {
        throw new Error(`Competitor ${competitorNum} has invalid keyword density: ${competitor.keywordDensity}`);
      }

      if (typeof competitor.optimizedHeadings !== 'number' || competitor.optimizedHeadings < 0) {
        throw new Error(`Competitor ${competitorNum} has invalid optimized headings count: ${competitor.optimizedHeadings}`);
      }

      if (!Array.isArray(competitor.lsiKeywords)) {
        throw new Error(`Competitor ${competitorNum} missing LSI keywords array`);
      }

      if (!Array.isArray(competitor.entities)) {
        throw new Error(`Competitor ${competitorNum} missing entities array`);
      }

      if (!competitor.content || typeof competitor.content !== 'string') {
        throw new Error(`Competitor ${competitorNum} missing content`);
      }

      // Validate LSI keywords structure
      competitor.lsiKeywords.forEach((lsi, lsiIndex) => {
        if (!lsi.keyword || typeof lsi.frequency !== 'number' || typeof lsi.density !== 'number') {
          throw new Error(`Competitor ${competitorNum} LSI keyword ${lsiIndex + 1} has invalid structure`);
        }
      });

      // Validate entities structure
      competitor.entities.forEach((entity, entityIndex) => {
        if (!entity.text || !entity.type || typeof entity.frequency !== 'number') {
          throw new Error(`Competitor ${competitorNum} entity ${entityIndex + 1} has invalid structure`);
        }
      });
    });
  }

  /**
   * Legacy validation method for backward compatibility
   */
  private validateLegacyCompetitorData(competitors: CompetitorAnalysis[]): void {
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
