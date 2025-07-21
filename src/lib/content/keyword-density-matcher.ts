/**
 * Keyword Density Matcher - Enhanced precision matching with competitor benchmarks
 * Integrates with CompetitorDataAverager and ContentIntegrationEngine
 */

import { BenchmarkTargets, CompetitorAnalysis } from './competitor-data-averager';
import { IntegratedContent } from './content-integration-engine';

export interface KeywordDensityMatch {
  keyword: string;
  currentDensity: number;
  targetDensity: number;
  difference: number;
  isMatched: boolean;
  precision: number;
  recommendedAction: 'increase' | 'decrease' | 'maintain';
}

export interface DensityMatchingResult {
  primaryKeyword: KeywordDensityMatch;
  lsiKeywords: KeywordDensityMatch[];
  overallMatch: boolean;
  averagePrecision: number;
  competitorAlignment: number;
  optimizationSuggestions: string[];
}

export interface KeywordVariation {
  term: string;
  density: number;
  frequency: number;
  positions: number[];
}

export class KeywordDensityMatcher {
  private readonly PRECISION_THRESHOLD = 0.01; // 0.01% precision requirement
  private readonly MAX_DENSITY_THRESHOLD = 3.5; // Prevent over-optimization
  private readonly MIN_DENSITY_THRESHOLD = 0.5; // Minimum for relevance

  /**
   * Match keyword densities against competitor benchmarks with precision
   */
  matchAgainstBenchmarks(
    content: string,
    primaryKeyword: string,
    lsiKeywords: string[],
    benchmarks: BenchmarkTargets
  ): DensityMatchingResult {
    // Analyze primary keyword
    const primaryMatch = this.analyzePrimaryKeywordMatch(content, primaryKeyword, benchmarks);
    
    // Analyze LSI keywords
    const lsiMatches = this.analyzeLSIKeywordMatches(content, lsiKeywords, benchmarks);
    
    // Calculate overall matching metrics
    const overallMatch = this.calculateOverallMatch(primaryMatch, lsiMatches);
    const averagePrecision = this.calculateAveragePrecision(primaryMatch, lsiMatches);
    const competitorAlignment = this.calculateCompetitorAlignment(primaryMatch, lsiMatches, benchmarks);
    
    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(primaryMatch, lsiMatches);

    return {
      primaryKeyword: primaryMatch,
      lsiKeywords: lsiMatches,
      overallMatch,
      averagePrecision,
      competitorAlignment,
      optimizationSuggestions,
    };
  }

  /**
   * Validate integrated content against competitor benchmarks
   */
  validateIntegratedContent(
    integratedContent: IntegratedContent,
    primaryKeyword: string,
    benchmarks: BenchmarkTargets
  ): {
    isValid: boolean;
    densityAccuracy: number;
    benchmarkCompliance: number;
    validationIssues: string[];
  } {
    const validationIssues: string[] = [];
    
    // Check primary keyword density accuracy
    const targetDensity = benchmarks.keywordDensity;
    const achievedDensity = integratedContent.keywordDensityAchieved;
    const densityDifference = Math.abs(achievedDensity - targetDensity);
    
    if (densityDifference > this.PRECISION_THRESHOLD) {
      validationIssues.push(`Keyword density precision issue: ${densityDifference.toFixed(4)}% difference from target`);
    }
    
    // Check over-optimization
    if (achievedDensity > this.MAX_DENSITY_THRESHOLD) {
      validationIssues.push(`Over-optimization risk: ${achievedDensity}% exceeds safe threshold of ${this.MAX_DENSITY_THRESHOLD}%`);
    }
    
    // Check under-optimization
    if (achievedDensity < this.MIN_DENSITY_THRESHOLD) {
      validationIssues.push(`Under-optimization: ${achievedDensity}% below minimum threshold of ${this.MIN_DENSITY_THRESHOLD}%`);
    }
    
    // Check heading optimization compliance
    if (integratedContent.headingOptimizationCount !== benchmarks.headingOptimization) {
      validationIssues.push(`Heading optimization mismatch: ${integratedContent.headingOptimizationCount} vs target ${benchmarks.headingOptimization}`);
    }
    
    // Check natural flow score
    if (integratedContent.naturalFlowScore < 70) {
      validationIssues.push(`Natural flow score too low: ${integratedContent.naturalFlowScore}% (minimum 70%)`);
    }

    const densityAccuracy = Math.max(0, 100 - (densityDifference * 100));
    const benchmarkCompliance = this.calculateBenchmarkCompliance(integratedContent, benchmarks);
    const isValid = validationIssues.length === 0;

    return {
      isValid,
      densityAccuracy,
      benchmarkCompliance,
      validationIssues,
    };
  }

  /**
   * Extract keyword variations and their densities
   */
  extractKeywordVariations(content: string, baseKeyword: string): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const words = this.tokenizeContent(content);
    const totalWords = words.length;

    // Generate common variations
    const keywordVariations = this.generateKeywordVariations(baseKeyword);
    
    keywordVariations.forEach(variation => {
      const positions = this.findKeywordPositions(words, variation);
      const frequency = positions.length;
      const density = Number(((frequency / totalWords) * 100).toFixed(2));
      
      if (frequency > 0) {
        variations.push({
          term: variation,
          density,
          frequency,
          positions,
        });
      }
    });

    return variations.sort((a, b) => b.density - a.density);
  }

  /**
   * Calculate competitor density alignment score
   */
  calculateCompetitorAlignment(
    competitors: CompetitorAnalysis[],
    currentDensity: number,
    targetDensity: number
  ): number {
    if (!competitors || competitors.length === 0) {
      return 0;
    }

    const competitorDensities = competitors.map(c => c.keywordDensity).filter(d => !isNaN(d) && d >= 0);
    if (competitorDensities.length === 0) {
      return 0;
    }

    const competitorMean = competitorDensities.reduce((a, b) => a + b, 0) / competitorDensities.length;

    // Calculate how well current density aligns with competitor average
    const alignmentWithCompetitors = Math.max(0, 100 - Math.abs(currentDensity - competitorMean) * 10);

    // Calculate how well target density matches competitor average
    const targetAlignment = Math.max(0, 100 - Math.abs(targetDensity - competitorMean) * 10);

    const result = (alignmentWithCompetitors + targetAlignment) / 2;
    return Number(result.toFixed(1));
  }

  // Private helper methods
  private analyzePrimaryKeywordMatch(content: string, keyword: string, benchmarks: BenchmarkTargets): KeywordDensityMatch {
    const currentDensity = this.calculateKeywordDensity(content, keyword);
    const targetDensity = benchmarks.keywordDensity;
    const difference = Math.abs(currentDensity - targetDensity);
    const precision = Math.max(0, 100 - (difference * 100));
    
    return {
      keyword,
      currentDensity,
      targetDensity,
      difference,
      isMatched: difference <= this.PRECISION_THRESHOLD,
      precision,
      recommendedAction: currentDensity < targetDensity ? 'increase' : 
                        currentDensity > targetDensity ? 'decrease' : 'maintain',
    };
  }

  private analyzeLSIKeywordMatches(content: string, lsiKeywords: string[], benchmarks: BenchmarkTargets): KeywordDensityMatch[] {
    const targetLSIDensity = benchmarks.lsiKeywordTargets / 100; // Convert to percentage
    
    return lsiKeywords.map(keyword => {
      const currentDensity = this.calculateKeywordDensity(content, keyword);
      const difference = Math.abs(currentDensity - targetLSIDensity);
      const precision = Math.max(0, 100 - (difference * 100));
      
      return {
        keyword,
        currentDensity,
        targetDensity: targetLSIDensity,
        difference,
        isMatched: difference <= this.PRECISION_THRESHOLD,
        precision,
        recommendedAction: currentDensity < targetLSIDensity ? 'increase' : 
                          currentDensity > targetLSIDensity ? 'decrease' : 'maintain',
      };
    });
  }

  private calculateKeywordDensity(content: string, keyword: string): number {
    const words = this.tokenizeContent(content);
    const keywordCount = this.countKeywordOccurrences(words, keyword);
    return Number(((keywordCount / words.length) * 100).toFixed(2));
  }

  private tokenizeContent(content: string): string[] {
    return content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private countKeywordOccurrences(words: string[], keyword: string): number {
    const keywordLower = keyword.toLowerCase();
    return words.filter(word => word === keywordLower).length;
  }

  private calculateOverallMatch(primary: KeywordDensityMatch, lsi: KeywordDensityMatch[]): boolean {
    const lsiMatched = lsi.filter(k => k.isMatched).length;
    const lsiTotal = lsi.length;
    const lsiMatchRate = lsiTotal > 0 ? lsiMatched / lsiTotal : 1;
    
    return primary.isMatched && lsiMatchRate >= 0.8; // 80% of LSI keywords must match
  }

  private calculateAveragePrecision(primary: KeywordDensityMatch, lsi: KeywordDensityMatch[]): number {
    const allPrecisions = [primary.precision, ...lsi.map(k => k.precision)];
    const average = allPrecisions.reduce((a, b) => a + b, 0) / allPrecisions.length;
    return Number(average.toFixed(1));
  }

  private calculateCompetitorAlignment(primary: KeywordDensityMatch, lsi: KeywordDensityMatch[], benchmarks: BenchmarkTargets): number {
    // Simplified alignment calculation
    const primaryAlignment = primary.isMatched ? 100 : Math.max(0, 100 - primary.difference * 50);
    const lsiAlignment = lsi.length > 0 ? 
      lsi.reduce((sum, k) => sum + (k.isMatched ? 100 : Math.max(0, 100 - k.difference * 50)), 0) / lsi.length : 100;
    
    return Number(((primaryAlignment + lsiAlignment) / 2).toFixed(1));
  }

  private generateOptimizationSuggestions(primary: KeywordDensityMatch, lsi: KeywordDensityMatch[]): string[] {
    const suggestions: string[] = [];
    
    if (!primary.isMatched) {
      suggestions.push(`${primary.recommendedAction} primary keyword "${primary.keyword}" density by ${primary.difference.toFixed(2)}%`);
    }
    
    const unmatchedLSI = lsi.filter(k => !k.isMatched);
    if (unmatchedLSI.length > 0) {
      suggestions.push(`Adjust ${unmatchedLSI.length} LSI keywords for better density matching`);
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Keyword density optimization is on target - maintain current levels');
    }
    
    return suggestions;
  }

  private generateKeywordVariations(baseKeyword: string): string[] {
    // Enhanced variation generation
    const variations = [baseKeyword.toLowerCase()];
    const words = baseKeyword.toLowerCase().split(' ');

    // Add individual words
    if (words.length > 1) {
      variations.push(...words);
    }

    // Add common variations
    variations.push(baseKeyword.toLowerCase() + 's');
    variations.push(baseKeyword.toLowerCase().replace(/s$/, ''));

    // Add partial matches for compound keywords
    if (words.length === 2) {
      variations.push(words[0]);
      variations.push(words[1]);
      variations.push(words.reverse().join(' '));
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  private findKeywordPositions(words: string[], keyword: string): number[] {
    const positions: number[] = [];
    const keywordLower = keyword.toLowerCase();
    
    words.forEach((word, index) => {
      if (word === keywordLower) {
        positions.push(index);
      }
    });
    
    return positions;
  }

  private calculateBenchmarkCompliance(content: IntegratedContent, benchmarks: BenchmarkTargets): number {
    let compliance = 0;
    let totalChecks = 0;
    
    // Check keyword density compliance
    const densityDiff = Math.abs(content.keywordDensityAchieved - benchmarks.keywordDensity);
    compliance += densityDiff <= this.PRECISION_THRESHOLD ? 100 : Math.max(0, 100 - densityDiff * 50);
    totalChecks++;
    
    // Check heading optimization compliance
    const headingMatch = content.headingOptimizationCount === benchmarks.headingOptimization;
    compliance += headingMatch ? 100 : 50;
    totalChecks++;
    
    // Check natural flow compliance
    compliance += content.naturalFlowScore;
    totalChecks++;
    
    return Number((compliance / totalChecks).toFixed(1));
  }
}
