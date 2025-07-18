/**
 * Heading Optimization Analysis System for SEO Automation App
 * Analyzes heading structure and keyword optimization for SEO
 */

import { z } from 'zod';

export interface HeadingOptimizationResult {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  wordCount: number;
  characterCount: number;
  keywordAnalysis: {
    containsPrimaryKeyword: boolean;
    containsKeywordVariations: string[];
    keywordDensity: number;
    keywordPosition: 'beginning' | 'middle' | 'end' | 'not_found';
  };
  optimization: {
    score: number; // 0-100
    isOptimal: boolean;
    issues: string[];
    recommendations: string[];
  };
  structure: {
    position: number;
    isProperHierarchy: boolean;
    hasSubheadings: boolean;
    parentLevel?: number;
    childrenCount: number;
  };
  seoMetrics: {
    length: 'too_short' | 'optimal' | 'too_long';
    readability: number; // 0-100
    clickworthiness: number; // 0-100
    uniqueness: boolean;
  };
}

export interface HeadingOptimizationAnalysisResult {
  headings: HeadingOptimizationResult[];
  overallAnalysis: {
    totalHeadings: number;
    h1Count: number;
    keywordOptimizedHeadings: number;
    averageOptimizationScore: number;
    hierarchyScore: number; // 0-100
    distributionScore: number; // 0-100
  };
  keywordDistribution: {
    h1Keywords: number;
    h2Keywords: number;
    h3Keywords: number;
    totalKeywordHeadings: number;
    distributionBalance: number; // 0-100
  };
  competitorComparison?: {
    averageHeadingCount: number;
    averageKeywordOptimization: number;
    ranking: number;
    recommendations: string[];
  };
  recommendations: string[];
}

export interface HeadingOptimizationOptions {
  primaryKeyword: string;
  keywordVariations?: string[];
  relatedKeywords?: string[];
  optimalLengths?: {
    h1: { min: number; max: number };
    h2: { min: number; max: number };
    h3: { min: number; max: number };
  };
  caseSensitive?: boolean;
  analyzeClickworthiness?: boolean;
  checkUniqueness?: boolean;
  language?: string;
}

const DEFAULT_OPTIONS: Required<HeadingOptimizationOptions> = {
  primaryKeyword: '',
  keywordVariations: [],
  relatedKeywords: [],
  optimalLengths: {
    h1: { min: 20, max: 60 },
    h2: { min: 15, max: 50 },
    h3: { min: 10, max: 40 },
  },
  caseSensitive: false,
  analyzeClickworthiness: true,
  checkUniqueness: true,
  language: 'en',
};

export class HeadingOptimizationAnalyzer {
  private options: Required<HeadingOptimizationOptions>;

  constructor(options: HeadingOptimizationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze heading optimization
   */
  analyzeHeadings(headings: Array<{ level: number; text: string; position: number }>): HeadingOptimizationAnalysisResult {
    const headingResults: HeadingOptimizationResult[] = [];
    
    // Analyze each heading
    headings.forEach((heading, index) => {
      const result = this.analyzeHeading(heading, headings, index);
      headingResults.push(result);
    });

    // Calculate overall analysis
    const overallAnalysis = this.calculateOverallAnalysis(headingResults);
    
    // Analyze keyword distribution
    const keywordDistribution = this.analyzeKeywordDistribution(headingResults);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(headingResults, overallAnalysis, keywordDistribution);

    return {
      headings: headingResults,
      overallAnalysis,
      keywordDistribution,
      recommendations,
    };
  }

  /**
   * Compare with competitor headings
   */
  compareWithCompetitors(
    currentAnalysis: HeadingOptimizationAnalysisResult,
    competitorHeadings: Array<{
      url: string;
      headings: Array<{ level: number; text: string; position: number }>;
    }>
  ): HeadingOptimizationAnalysisResult {
    const competitorAnalyses = competitorHeadings.map(({ url, headings }) => {
      const analysis = this.analyzeHeadings(headings);
      return {
        url,
        headingCount: analysis.overallAnalysis.totalHeadings,
        keywordOptimization: analysis.overallAnalysis.averageOptimizationScore,
        keywordHeadings: analysis.overallAnalysis.keywordOptimizedHeadings,
      };
    });

    const averageHeadingCount = competitorAnalyses.length > 0
      ? Math.round(competitorAnalyses.reduce((sum, comp) => sum + comp.headingCount, 0) / competitorAnalyses.length)
      : 0;

    const averageKeywordOptimization = competitorAnalyses.length > 0
      ? Math.round(competitorAnalyses.reduce((sum, comp) => sum + comp.keywordOptimization, 0) / competitorAnalyses.length)
      : 0;

    // Calculate ranking based on keyword optimization
    const allOptimizationScores = [
      currentAnalysis.overallAnalysis.averageOptimizationScore,
      ...competitorAnalyses.map(c => c.keywordOptimization)
    ];
    const sortedScores = [...allOptimizationScores].sort((a, b) => b - a);
    const ranking = sortedScores.indexOf(currentAnalysis.overallAnalysis.averageOptimizationScore) + 1;

    const competitorComparison = {
      averageHeadingCount,
      averageKeywordOptimization,
      ranking,
      recommendations: this.generateCompetitorRecommendations(
        currentAnalysis,
        averageHeadingCount,
        averageKeywordOptimization,
        ranking
      ),
    };

    return {
      ...currentAnalysis,
      competitorComparison,
    };
  }

  /**
   * Analyze individual heading
   */
  private analyzeHeading(
    heading: { level: number; text: string; position: number },
    allHeadings: Array<{ level: number; text: string; position: number }>,
    index: number
  ): HeadingOptimizationResult {
    const level = heading.level as 1 | 2 | 3 | 4 | 5 | 6;
    const text = heading.text.trim();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;

    // Keyword analysis
    const keywordAnalysis = this.analyzeHeadingKeywords(text);
    
    // Structure analysis
    const structure = this.analyzeHeadingStructure(heading, allHeadings, index);
    
    // SEO metrics
    const seoMetrics = this.analyzeHeadingSEO(text, level, allHeadings);
    
    // Optimization analysis
    const optimization = this.calculateHeadingOptimization(
      text,
      level,
      keywordAnalysis,
      structure,
      seoMetrics
    );

    return {
      level,
      text,
      wordCount,
      characterCount,
      keywordAnalysis,
      optimization,
      structure,
      seoMetrics,
    };
  }

  /**
   * Analyze keywords in heading
   */
  private analyzeHeadingKeywords(text: string) {
    const normalizedText = this.options.caseSensitive ? text : text.toLowerCase();
    const normalizedKeyword = this.options.caseSensitive ? this.options.primaryKeyword : this.options.primaryKeyword.toLowerCase();
    
    const containsPrimaryKeyword = normalizedText.includes(normalizedKeyword);
    
    const containsKeywordVariations = this.options.keywordVariations.filter(variation => {
      const normalizedVariation = this.options.caseSensitive ? variation : variation.toLowerCase();
      return normalizedText.includes(normalizedVariation);
    });

    // Calculate keyword density
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const keywordWords = this.options.primaryKeyword.split(/\s+/).filter(word => word.length > 0);
    let keywordCount = 0;
    
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const slice = words.slice(i, i + keywordWords.length).join(' ');
      const normalizedSlice = this.options.caseSensitive ? slice : slice.toLowerCase();
      if (normalizedSlice === normalizedKeyword) {
        keywordCount++;
      }
    }
    
    const keywordDensity = words.length > 0 ? (keywordCount / words.length) * 100 : 0;

    // Determine keyword position
    let keywordPosition: 'beginning' | 'middle' | 'end' | 'not_found' = 'not_found';
    if (containsPrimaryKeyword) {
      const keywordIndex = normalizedText.indexOf(normalizedKeyword);
      const textLength = text.length;
      
      if (keywordIndex < textLength * 0.3) {
        keywordPosition = 'beginning';
      } else if (keywordIndex > textLength * 0.7) {
        keywordPosition = 'end';
      } else {
        keywordPosition = 'middle';
      }
    }

    return {
      containsPrimaryKeyword,
      containsKeywordVariations,
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      keywordPosition,
    };
  }

  /**
   * Analyze heading structure
   */
  private analyzeHeadingStructure(
    heading: { level: number; text: string; position: number },
    allHeadings: Array<{ level: number; text: string; position: number }>,
    index: number
  ) {
    const level = heading.level;
    const position = heading.position;

    // Check hierarchy
    let isProperHierarchy = true;
    let parentLevel: number | undefined;
    
    if (index > 0) {
      const previousHeading = allHeadings[index - 1];
      if (level > previousHeading.level + 1) {
        isProperHierarchy = false;
      }
      
      // Find parent level
      for (let i = index - 1; i >= 0; i--) {
        if (allHeadings[i].level < level) {
          parentLevel = allHeadings[i].level;
          break;
        }
      }
    }

    // Count children
    let childrenCount = 0;
    for (let i = index + 1; i < allHeadings.length; i++) {
      const nextHeading = allHeadings[i];
      if (nextHeading.level <= level) {
        break;
      }
      if (nextHeading.level === level + 1) {
        childrenCount++;
      }
    }

    const hasSubheadings = childrenCount > 0;

    return {
      position,
      isProperHierarchy,
      hasSubheadings,
      parentLevel,
      childrenCount,
    };
  }

  /**
   * Analyze heading SEO metrics
   */
  private analyzeHeadingSEO(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    allHeadings: Array<{ level: number; text: string; position: number }>
  ) {
    const characterCount = text.length;
    const optimalLength = this.options.optimalLengths[`h${level}` as keyof typeof this.options.optimalLengths] || 
                         this.options.optimalLengths.h3;

    // Length analysis
    let length: 'too_short' | 'optimal' | 'too_long';
    if (characterCount < optimalLength.min) {
      length = 'too_short';
    } else if (characterCount > optimalLength.max) {
      length = 'too_long';
    } else {
      length = 'optimal';
    }

    // Readability score
    const readability = this.calculateReadabilityScore(text);
    
    // Clickworthiness score
    const clickworthiness = this.options.analyzeClickworthiness 
      ? this.calculateClickworthinessScore(text, level)
      : 50;

    // Uniqueness check
    const uniqueness = this.options.checkUniqueness
      ? !allHeadings.some(h => h.text.toLowerCase() === text.toLowerCase() && h.text !== text)
      : true;

    return {
      length,
      readability,
      clickworthiness,
      uniqueness,
    };
  }

  /**
   * Calculate heading optimization score
   */
  private calculateHeadingOptimization(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    keywordAnalysis: any,
    structure: any,
    seoMetrics: any
  ) {
    let score = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Keyword optimization (40 points)
    if (keywordAnalysis.containsPrimaryKeyword) {
      score += 30;
      if (keywordAnalysis.keywordPosition === 'beginning') {
        score += 10;
      } else if (keywordAnalysis.keywordPosition === 'middle') {
        score += 5;
      }
    } else {
      issues.push('Primary keyword not found in heading');
      recommendations.push('Include the primary keyword in the heading for better SEO');
    }

    // Length optimization (20 points)
    if (seoMetrics.length === 'optimal') {
      score += 20;
    } else if (seoMetrics.length === 'too_short') {
      score += 10;
      issues.push('Heading is too short');
      recommendations.push('Make the heading more descriptive and detailed');
    } else {
      score += 5;
      issues.push('Heading is too long');
      recommendations.push('Shorten the heading for better readability');
    }

    // Structure optimization (20 points)
    if (structure.isProperHierarchy) {
      score += 15;
    } else {
      issues.push('Improper heading hierarchy');
      recommendations.push('Follow proper heading hierarchy (H1 → H2 → H3)');
    }

    if (level <= 3 && structure.hasSubheadings) {
      score += 5;
    }

    // Readability (10 points)
    score += Math.round(seoMetrics.readability * 0.1);

    // Clickworthiness (10 points)
    score += Math.round(seoMetrics.clickworthiness * 0.1);

    // Uniqueness bonus
    if (seoMetrics.uniqueness) {
      score += 5;
    } else {
      issues.push('Duplicate heading text found');
      recommendations.push('Make heading text unique');
    }

    const isOptimal = score >= 80;

    return {
      score: Math.min(100, score),
      isOptimal,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(text: string): number {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Optimal word length is 4-6 characters
    let score = 100;
    if (avgWordLength < 3 || avgWordLength > 8) {
      score -= 30;
    } else if (avgWordLength < 4 || avgWordLength > 6) {
      score -= 15;
    }

    // Penalize very long headings
    if (words.length > 10) {
      score -= 20;
    }

    // Bonus for action words
    const actionWords = ['how', 'what', 'why', 'when', 'where', 'guide', 'tips', 'best', 'top'];
    if (actionWords.some(word => text.toLowerCase().includes(word))) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate clickworthiness score
   */
  private calculateClickworthinessScore(text: string, level: number): number {
    let score = 50; // Base score

    const lowerText = text.toLowerCase();

    // Power words
    const powerWords = [
      'ultimate', 'complete', 'essential', 'proven', 'secret', 'exclusive',
      'amazing', 'incredible', 'powerful', 'effective', 'simple', 'easy'
    ];
    if (powerWords.some(word => lowerText.includes(word))) {
      score += 15;
    }

    // Numbers
    if (/\d+/.test(text)) {
      score += 10;
    }

    // Questions
    if (text.includes('?')) {
      score += 10;
    }

    // Emotional words
    const emotionalWords = ['love', 'hate', 'fear', 'surprise', 'joy', 'anger'];
    if (emotionalWords.some(word => lowerText.includes(word))) {
      score += 10;
    }

    // Urgency words
    const urgencyWords = ['now', 'today', 'immediately', 'urgent', 'quick', 'fast'];
    if (urgencyWords.some(word => lowerText.includes(word))) {
      score += 10;
    }

    // Benefit-focused
    const benefitWords = ['save', 'earn', 'gain', 'improve', 'increase', 'boost'];
    if (benefitWords.some(word => lowerText.includes(word))) {
      score += 10;
    }

    // Penalty for generic headings
    const genericWords = ['introduction', 'conclusion', 'overview', 'summary'];
    if (genericWords.some(word => lowerText.includes(word))) {
      score -= 15;
    }

    // Level-based adjustments
    if (level === 1) {
      score += 5; // H1 should be more clickworthy
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall analysis
   */
  private calculateOverallAnalysis(headings: HeadingOptimizationResult[]) {
    const totalHeadings = headings.length;
    const h1Count = headings.filter(h => h.level === 1).length;
    const keywordOptimizedHeadings = headings.filter(h => h.keywordAnalysis.containsPrimaryKeyword).length;
    
    const averageOptimizationScore = totalHeadings > 0
      ? Math.round(headings.reduce((sum, h) => sum + h.optimization.score, 0) / totalHeadings)
      : 0;

    // Calculate hierarchy score
    const properHierarchyCount = headings.filter(h => h.structure.isProperHierarchy).length;
    const hierarchyScore = totalHeadings > 0 ? Math.round((properHierarchyCount / totalHeadings) * 100) : 100;

    // Calculate distribution score
    const levels = [1, 2, 3, 4, 5, 6];
    const levelCounts = levels.map(level => headings.filter(h => h.level === level).length);
    const nonEmptyLevels = levelCounts.filter(count => count > 0).length;
    const distributionScore = Math.min(100, nonEmptyLevels * 25); // Max score for 4+ levels

    return {
      totalHeadings,
      h1Count,
      keywordOptimizedHeadings,
      averageOptimizationScore,
      hierarchyScore,
      distributionScore,
    };
  }

  /**
   * Analyze keyword distribution across heading levels
   */
  private analyzeKeywordDistribution(headings: HeadingOptimizationResult[]) {
    const h1Keywords = headings.filter(h => h.level === 1 && h.keywordAnalysis.containsPrimaryKeyword).length;
    const h2Keywords = headings.filter(h => h.level === 2 && h.keywordAnalysis.containsPrimaryKeyword).length;
    const h3Keywords = headings.filter(h => h.level === 3 && h.keywordAnalysis.containsPrimaryKeyword).length;
    const totalKeywordHeadings = h1Keywords + h2Keywords + h3Keywords;

    // Calculate distribution balance
    const totalMainHeadings = headings.filter(h => h.level <= 3).length;
    const distributionBalance = totalMainHeadings > 0 
      ? Math.round((totalKeywordHeadings / totalMainHeadings) * 100)
      : 0;

    return {
      h1Keywords,
      h2Keywords,
      h3Keywords,
      totalKeywordHeadings,
      distributionBalance,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    headings: HeadingOptimizationResult[],
    overallAnalysis: any,
    keywordDistribution: any
  ): string[] {
    const recommendations: string[] = [];

    // H1 recommendations
    if (overallAnalysis.h1Count === 0) {
      recommendations.push('Add an H1 heading as the main title of your content');
    } else if (overallAnalysis.h1Count > 1) {
      recommendations.push('Use only one H1 heading per page for better SEO');
    }

    // Keyword optimization recommendations
    if (keywordDistribution.totalKeywordHeadings === 0) {
      recommendations.push('Include your primary keyword in at least one heading');
    } else if (keywordDistribution.distributionBalance < 30) {
      recommendations.push('Increase keyword usage in headings for better SEO optimization');
    }

    // Hierarchy recommendations
    if (overallAnalysis.hierarchyScore < 80) {
      recommendations.push('Improve heading hierarchy by following proper H1 → H2 → H3 structure');
    }

    // Length recommendations
    const tooShortHeadings = headings.filter(h => h.seoMetrics.length === 'too_short').length;
    const tooLongHeadings = headings.filter(h => h.seoMetrics.length === 'too_long').length;
    
    if (tooShortHeadings > 0) {
      recommendations.push(`Make ${tooShortHeadings} heading(s) more descriptive and detailed`);
    }
    
    if (tooLongHeadings > 0) {
      recommendations.push(`Shorten ${tooLongHeadings} heading(s) for better readability`);
    }

    // Overall optimization
    if (overallAnalysis.averageOptimizationScore < 70) {
      recommendations.push('Improve overall heading optimization by including keywords and following best practices');
    }

    return recommendations;
  }

  /**
   * Generate competitor comparison recommendations
   */
  private generateCompetitorRecommendations(
    currentAnalysis: HeadingOptimizationAnalysisResult,
    averageHeadingCount: number,
    averageKeywordOptimization: number,
    ranking: number
  ): string[] {
    const recommendations: string[] = [];

    if (ranking > 3) {
      recommendations.push('Your heading optimization is below top competitors - focus on keyword inclusion');
    }

    if (currentAnalysis.overallAnalysis.totalHeadings < averageHeadingCount * 0.8) {
      recommendations.push(`Add more headings to match competitors (average: ${averageHeadingCount})`);
    }

    if (currentAnalysis.overallAnalysis.averageOptimizationScore < averageKeywordOptimization - 10) {
      recommendations.push('Improve keyword optimization in headings to match competitor performance');
    }

    if (ranking === 1) {
      recommendations.push('Excellent heading optimization compared to competitors - maintain this level');
    }

    return recommendations;
  }
}

// Factory function
export const createHeadingOptimizationAnalyzer = (options: HeadingOptimizationOptions): HeadingOptimizationAnalyzer => {
  return new HeadingOptimizationAnalyzer(options);
};

// Default export
export default HeadingOptimizationAnalyzer;
