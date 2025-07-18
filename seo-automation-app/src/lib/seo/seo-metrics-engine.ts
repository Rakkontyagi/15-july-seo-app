/**
 * SEO Metrics Analysis Engine for SEO Automation App
 * Orchestrates comprehensive SEO analysis using all specialized analyzers
 */

import { WordCountAnalyzer, WordCountAnalysisResult } from './word-count-analyzer';
import { KeywordDensityAnalyzer, KeywordDensityAnalysisResult } from './keyword-density-analyzer';
import { HeadingOptimizationAnalyzer, HeadingOptimizationAnalysisResult } from './heading-optimization-analyzer';
import { LSIKeywordExtractor, LSIKeywordExtractionResult } from './lsi-keyword-extractor';
import { EntityRecognizer, EntityRecognitionResult } from './entity-recognizer';
import { ContentStructureAnalyzer, ContentStructureAnalysisResult } from './content-structure-analyzer';
import { MetaTagAnalyzer, MetaTagAnalysisResult } from './meta-tag-analyzer';

export interface SEOMetricsAnalysisResult {
  overview: {
    overallScore: number; // 0-100
    contentQuality: number; // 0-100
    technicalSEO: number; // 0-100
    keywordOptimization: number; // 0-100
    userExperience: number; // 0-100
    competitiveness: number; // 0-100
  };
  
  wordCount: WordCountAnalysisResult;
  keywordDensity: KeywordDensityAnalysisResult;
  headingOptimization: HeadingOptimizationAnalysisResult;
  lsiKeywords: LSIKeywordExtractionResult;
  entities: EntityRecognitionResult;
  contentStructure: ContentStructureAnalysisResult;
  metaTags: MetaTagAnalysisResult;
  
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  actionPlan: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'content' | 'technical' | 'keywords' | 'structure' | 'meta';
    action: string;
    impact: number; // 0-100
    effort: number; // 0-100
    timeframe: 'immediate' | 'short_term' | 'long_term';
  }>;
  
  competitorAnalysis?: {
    positionVsCompetitors: number; // 1-based ranking
    gapAnalysis: Array<{
      area: string;
      gap: number; // -100 to 100
      recommendation: string;
    }>;
    opportunities: string[];
  };
  
  recommendations: string[];
  
  metadata: {
    analyzedAt: string;
    processingTime: number;
    contentLength: number;
    analysisDepth: 'basic' | 'standard' | 'comprehensive';
  };
}

export interface SEOMetricsEngineOptions {
  primaryKeyword: string;
  targetKeywords?: string[];
  brandName?: string;
  competitorUrls?: string[];
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  includeCompetitorAnalysis?: boolean;
  customWeights?: {
    content: number;
    technical: number;
    keywords: number;
    structure: number;
    meta: number;
  };
  language?: string;
}

const DEFAULT_OPTIONS: Required<SEOMetricsEngineOptions> = {
  primaryKeyword: '',
  targetKeywords: [],
  brandName: '',
  competitorUrls: [],
  analysisDepth: 'standard',
  includeCompetitorAnalysis: false,
  customWeights: {
    content: 0.25,
    technical: 0.20,
    keywords: 0.25,
    structure: 0.15,
    meta: 0.15,
  },
  language: 'en',
};

export class SEOMetricsEngine {
  private options: Required<SEOMetricsEngineOptions>;
  private wordCountAnalyzer: WordCountAnalyzer;
  private keywordDensityAnalyzer: KeywordDensityAnalyzer;
  private headingOptimizationAnalyzer: HeadingOptimizationAnalyzer;
  private lsiKeywordExtractor: LSIKeywordExtractor;
  private entityRecognizer: EntityRecognizer;
  private contentStructureAnalyzer: ContentStructureAnalyzer;
  private metaTagAnalyzer: MetaTagAnalyzer;

  constructor(options: SEOMetricsEngineOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize analyzers
    this.wordCountAnalyzer = new WordCountAnalyzer({
      language: this.options.language,
      analyzeComplexity: this.options.analysisDepth !== 'basic',
    });
    
    this.keywordDensityAnalyzer = new KeywordDensityAnalyzer({
      primaryKeyword: this.options.primaryKeyword,
      keywordVariations: this.generateKeywordVariations(this.options.primaryKeyword),
      relatedKeywords: this.options.targetKeywords,
      language: this.options.language,
    });
    
    this.headingOptimizationAnalyzer = new HeadingOptimizationAnalyzer({
      primaryKeyword: this.options.primaryKeyword,
      keywordVariations: this.generateKeywordVariations(this.options.primaryKeyword),
      relatedKeywords: this.options.targetKeywords,
      language: this.options.language,
    });
    
    this.lsiKeywordExtractor = new LSIKeywordExtractor({
      primaryKeyword: this.options.primaryKeyword,
      language: this.options.language,
      maxResults: this.options.analysisDepth === 'comprehensive' ? 100 : 50,
    });
    
    this.entityRecognizer = new EntityRecognizer({
      brandNames: this.options.brandName ? [this.options.brandName] : [],
      language: this.options.language,
    });
    
    this.contentStructureAnalyzer = new ContentStructureAnalyzer({
      primaryKeyword: this.options.primaryKeyword,
      targetKeywords: this.options.targetKeywords,
      language: this.options.language,
    });
    
    this.metaTagAnalyzer = new MetaTagAnalyzer({
      primaryKeyword: this.options.primaryKeyword,
      targetKeywords: this.options.targetKeywords,
      brandName: this.options.brandName,
      language: this.options.language,
    });
  }

  /**
   * Perform comprehensive SEO analysis
   */
  async analyzeSEOMetrics(
    content: string,
    html?: string,
    headings?: Array<{ level: number; text: string; position: number }>
  ): Promise<SEOMetricsAnalysisResult> {
    const startTime = Date.now();

    // Run all analyses
    const wordCount = this.wordCountAnalyzer.analyzeContent(content);
    
    const keywordDensity = this.keywordDensityAnalyzer.analyzeContent(
      content,
      this.extractTitle(html),
      headings?.map(h => h.text),
      this.extractMetaDescription(html)
    );
    
    const headingOptimization = headings ? 
      this.headingOptimizationAnalyzer.analyzeHeadings(headings) :
      { headings: [], overallAnalysis: { totalHeadings: 0, h1Count: 0, keywordOptimizedHeadings: 0, averageOptimizationScore: 0, hierarchyScore: 0, distributionScore: 0 }, keywordDistribution: { h1Keywords: 0, h2Keywords: 0, h3Keywords: 0, totalKeywordHeadings: 0, distributionBalance: 0 }, recommendations: [] };
    
    const lsiKeywords = this.lsiKeywordExtractor.extractLSIKeywords(content);
    
    const entities = this.entityRecognizer.recognizeEntities(content);
    
    const contentStructure = this.contentStructureAnalyzer.analyzeStructure(content, headings);
    
    const metaTags = html ? this.metaTagAnalyzer.analyzeMetaTags(html) : {
      tags: [],
      analysis: {
        title: { present: false, length: 0, isOptimal: false, keywordPresence: false, brandPresence: false, issues: [], recommendations: [] },
        description: { present: false, length: 0, isOptimal: false, keywordPresence: false, callToActionPresence: false, issues: [], recommendations: [] },
        openGraph: { present: false, completeness: 0, requiredTags: [], missingTags: [], issues: [] },
        twitterCard: { present: false, completeness: 0, issues: [] },
        technical: { canonical: false, robots: false, viewport: false, charset: false, issues: [] }
      },
      scores: { overall: 0, basicSEO: 0, socialMedia: 0, technical: 0 },
      recommendations: []
    };

    // Calculate overview scores
    const overview = this.calculateOverviewScores({
      wordCount,
      keywordDensity,
      headingOptimization,
      lsiKeywords,
      entities,
      contentStructure,
      metaTags,
    });

    // Generate insights
    const insights = this.generateInsights({
      wordCount,
      keywordDensity,
      headingOptimization,
      lsiKeywords,
      entities,
      contentStructure,
      metaTags,
      overview,
    });

    // Create action plan
    const actionPlan = this.createActionPlan({
      wordCount,
      keywordDensity,
      headingOptimization,
      lsiKeywords,
      entities,
      contentStructure,
      metaTags,
      overview,
    });

    // Aggregate recommendations
    const recommendations = this.aggregateRecommendations({
      wordCount,
      keywordDensity,
      headingOptimization,
      lsiKeywords,
      entities,
      contentStructure,
      metaTags,
    });

    const processingTime = Date.now() - startTime;

    return {
      overview,
      wordCount,
      keywordDensity,
      headingOptimization,
      lsiKeywords,
      entities,
      contentStructure,
      metaTags,
      insights,
      actionPlan,
      recommendations,
      metadata: {
        analyzedAt: new Date().toISOString(),
        processingTime,
        contentLength: content.length,
        analysisDepth: this.options.analysisDepth,
      },
    };
  }

  /**
   * Analyze with competitor comparison
   */
  async analyzeWithCompetitors(
    content: string,
    html?: string,
    headings?: Array<{ level: number; text: string; position: number }>,
    competitorData?: Array<{ url: string; content: string; html?: string; headings?: Array<{ level: number; text: string; position: number }> }>
  ): Promise<SEOMetricsAnalysisResult> {
    // First perform standard analysis
    const baseAnalysis = await this.analyzeSEOMetrics(content, html, headings);

    if (!competitorData || competitorData.length === 0) {
      return baseAnalysis;
    }

    // Perform competitor comparisons
    const wordCountComparison = this.wordCountAnalyzer.compareWithCompetitors(
      content,
      competitorData.map(c => ({ url: c.url, content: c.content }))
    );

    const keywordDensityComparison = this.keywordDensityAnalyzer.compareWithCompetitors(
      baseAnalysis.keywordDensity,
      competitorData.map(c => ({
        url: c.url,
        content: c.content,
        title: this.extractTitle(c.html),
        headings: c.headings?.map(h => h.text),
        metaDescription: this.extractMetaDescription(c.html),
      }))
    );

    const headingComparison = headings ? this.headingOptimizationAnalyzer.compareWithCompetitors(
      baseAnalysis.headingOptimization,
      competitorData.filter(c => c.headings).map(c => ({
        url: c.url,
        headings: c.headings!,
      }))
    ) : baseAnalysis.headingOptimization;

    const lsiComparison = this.lsiKeywordExtractor.compareWithCompetitors(
      baseAnalysis.lsiKeywords,
      competitorData.map(c => ({ url: c.url, content: c.content }))
    );

    const metaTagComparison = html ? this.metaTagAnalyzer.compareWithCompetitors(
      baseAnalysis.metaTags,
      competitorData.filter(c => c.html).map(c => ({
        url: c.url,
        html: c.html!,
      }))
    ) : baseAnalysis.metaTags;

    // Generate competitor analysis
    const competitorAnalysis = this.generateCompetitorAnalysis({
      wordCount: wordCountComparison,
      keywordDensity: keywordDensityComparison,
      headingOptimization: headingComparison,
      lsiKeywords: lsiComparison,
      metaTags: metaTagComparison,
    });

    return {
      ...baseAnalysis,
      wordCount: wordCountComparison,
      keywordDensity: keywordDensityComparison,
      headingOptimization: headingComparison,
      lsiKeywords: lsiComparison,
      metaTags: metaTagComparison,
      competitorAnalysis,
    };
  }

  /**
   * Calculate overview scores
   */
  private calculateOverviewScores(analyses: any) {
    const weights = this.options.customWeights;

    // Content quality score
    const contentQuality = Math.round(
      (analyses.wordCount.contentDepth.score * 0.4) +
      (analyses.lsiKeywords.topicCoverage.score * 0.3) +
      (analyses.entities.statistics.averageConfidence * 0.3)
    );

    // Technical SEO score
    const technicalSEO = Math.round(
      (analyses.metaTags.scores.technical * 0.4) +
      (analyses.contentStructure.overview.structureScore * 0.3) +
      (analyses.headingOptimization.overallAnalysis.hierarchyScore * 0.3)
    );

    // Keyword optimization score
    const keywordOptimization = Math.round(
      (analyses.keywordDensity.overallDensity.isOptimal ? 100 : 50) * 0.4 +
      (analyses.headingOptimization.overallAnalysis.averageOptimizationScore * 0.3) +
      (analyses.lsiKeywords.topicCoverage.score * 0.3)
    );

    // User experience score
    const userExperience = Math.round(
      (analyses.contentStructure.overview.readabilityScore * 0.4) +
      (analyses.wordCount.readingTime.average <= 10 ? 100 : Math.max(0, 100 - (analyses.wordCount.readingTime.average - 10) * 5)) * 0.3 +
      (analyses.contentStructure.overview.structureScore * 0.3)
    );

    // Competitiveness score (placeholder - would need competitor data)
    const competitiveness = 75; // Default value

    // Overall score
    const overallScore = Math.round(
      (contentQuality * weights.content) +
      (technicalSEO * weights.technical) +
      (keywordOptimization * weights.keywords) +
      (userExperience * weights.structure) +
      (analyses.metaTags.scores.overall * weights.meta)
    );

    return {
      overallScore,
      contentQuality,
      technicalSEO,
      keywordOptimization,
      userExperience,
      competitiveness,
    };
  }

  /**
   * Generate insights using SWOT analysis
   */
  private generateInsights(data: any) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Analyze strengths
    if (data.overview.contentQuality >= 80) {
      strengths.push('High-quality, comprehensive content');
    }
    if (data.keywordDensity.overallDensity.isOptimal) {
      strengths.push('Optimal keyword density');
    }
    if (data.headingOptimization.overallAnalysis.averageOptimizationScore >= 80) {
      strengths.push('Well-optimized heading structure');
    }
    if (data.metaTags.scores.overall >= 80) {
      strengths.push('Comprehensive meta tag optimization');
    }

    // Analyze weaknesses
    if (data.overview.contentQuality < 60) {
      weaknesses.push('Content quality needs improvement');
    }
    if (!data.keywordDensity.overallDensity.isOptimal) {
      weaknesses.push('Keyword density not optimal');
    }
    if (data.headingOptimization.overallAnalysis.hierarchyScore < 70) {
      weaknesses.push('Poor heading hierarchy structure');
    }
    if (data.metaTags.scores.basicSEO < 70) {
      weaknesses.push('Basic SEO meta tags need optimization');
    }

    // Analyze opportunities
    if (data.lsiKeywords.topicCoverage.missingTopics.length > 0) {
      opportunities.push(`Expand content to cover: ${data.lsiKeywords.topicCoverage.missingTopics.slice(0, 3).join(', ')}`);
    }
    if (data.entities.seoAnalysis.authorityEntities.length < 3) {
      opportunities.push('Include more authoritative entities for credibility');
    }
    if (data.contentStructure.patterns.length < 3) {
      opportunities.push('Add more structured content patterns (lists, FAQs, tables)');
    }
    if (data.metaTags.scores.socialMedia < 60) {
      opportunities.push('Improve social media optimization');
    }

    // Analyze threats (competitive disadvantages)
    if (data.wordCount.totalWords < 1000) {
      threats.push('Content may be too short compared to comprehensive competitors');
    }
    if (data.overview.technicalSEO < 70) {
      threats.push('Technical SEO issues may hurt search rankings');
    }

    return {
      strengths,
      weaknesses,
      opportunities,
      threats,
    };
  }

  /**
   * Create prioritized action plan
   */
  private createActionPlan(data: any) {
    const actions: SEOMetricsAnalysisResult['actionPlan'] = [];

    // High priority actions
    if (!data.keywordDensity.overallDensity.isOptimal) {
      actions.push({
        priority: 'high',
        category: 'keywords',
        action: 'Optimize keyword density to fall within 1-3% range',
        impact: 85,
        effort: 60,
        timeframe: 'immediate',
      });
    }

    if (data.metaTags.analysis.title.issues.length > 0) {
      actions.push({
        priority: 'high',
        category: 'meta',
        action: 'Fix title tag issues for better search visibility',
        impact: 90,
        effort: 30,
        timeframe: 'immediate',
      });
    }

    if (data.metaTags.analysis.description.issues.length > 0) {
      actions.push({
        priority: 'high',
        category: 'meta',
        action: 'Optimize meta description for better click-through rates',
        impact: 80,
        effort: 40,
        timeframe: 'immediate',
      });
    }

    // Medium priority actions
    if (data.headingOptimization.overallAnalysis.hierarchyScore < 80) {
      actions.push({
        priority: 'medium',
        category: 'structure',
        action: 'Improve heading hierarchy and structure',
        impact: 70,
        effort: 70,
        timeframe: 'short_term',
      });
    }

    if (data.lsiKeywords.topicCoverage.score < 70) {
      actions.push({
        priority: 'medium',
        category: 'content',
        action: 'Expand content with related semantic keywords',
        impact: 75,
        effort: 80,
        timeframe: 'short_term',
      });
    }

    if (data.contentStructure.overview.structureScore < 70) {
      actions.push({
        priority: 'medium',
        category: 'structure',
        action: 'Improve content organization and flow',
        impact: 65,
        effort: 75,
        timeframe: 'short_term',
      });
    }

    // Low priority actions
    if (data.entities.seoAnalysis.authorityEntities.length < 5) {
      actions.push({
        priority: 'low',
        category: 'content',
        action: 'Include more authoritative entities and references',
        impact: 60,
        effort: 50,
        timeframe: 'long_term',
      });
    }

    if (data.metaTags.scores.socialMedia < 80) {
      actions.push({
        priority: 'low',
        category: 'technical',
        action: 'Add comprehensive social media meta tags',
        impact: 55,
        effort: 40,
        timeframe: 'short_term',
      });
    }

    // Sort by priority and impact
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.impact - a.impact;
    });
  }

  /**
   * Aggregate recommendations from all analyzers
   */
  private aggregateRecommendations(analyses: any): string[] {
    const recommendations: string[] = [];

    // Word count recommendations
    if (analyses.wordCount.comparison?.recommendations) {
      recommendations.push(...analyses.wordCount.comparison.recommendations);
    }

    // Keyword density recommendations
    recommendations.push(...analyses.keywordDensity.overallDensity.recommendations);

    // Heading optimization recommendations
    recommendations.push(...analyses.headingOptimization.recommendations);

    // LSI keywords recommendations
    recommendations.push(...analyses.lsiKeywords.topicCoverage.recommendations);

    // Entity recognition recommendations
    recommendations.push(...analyses.entities.seoAnalysis.recommendations);

    // Content structure recommendations
    recommendations.push(...analyses.contentStructure.recommendations);

    // Meta tags recommendations
    recommendations.push(...analyses.metaTags.recommendations);

    // Remove duplicates and prioritize
    const uniqueRecommendations = [...new Set(recommendations)];

    // Sort by importance (basic heuristic)
    return uniqueRecommendations.sort((a, b) => {
      const highPriorityKeywords = ['title', 'description', 'keyword', 'h1'];
      const aHasPriority = highPriorityKeywords.some(keyword => a.toLowerCase().includes(keyword));
      const bHasPriority = highPriorityKeywords.some(keyword => b.toLowerCase().includes(keyword));

      if (aHasPriority && !bHasPriority) return -1;
      if (!aHasPriority && bHasPriority) return 1;
      return 0;
    });
  }

  /**
   * Generate competitor analysis
   */
  private generateCompetitorAnalysis(comparisons: any) {
    const gaps: Array<{ area: string; gap: number; recommendation: string }> = [];
    const opportunities: string[] = [];

    // Analyze word count comparison
    if (comparisons.wordCount.comparison) {
      const wordCountGap = comparisons.wordCount.comparison.averageWordCount - comparisons.wordCount.current.totalWords;
      if (Math.abs(wordCountGap) > 200) {
        gaps.push({
          area: 'Content Length',
          gap: wordCountGap > 0 ? -30 : 30,
          recommendation: wordCountGap > 0 ? 'Expand content to match competitor depth' : 'Content length is competitive',
        });
      }
    }

    // Analyze keyword density comparison
    if (comparisons.keywordDensity.competitorComparison) {
      const keywordGap = comparisons.keywordDensity.competitorComparison.averageDensity - comparisons.keywordDensity.primaryKeyword.density;
      if (Math.abs(keywordGap) > 0.5) {
        gaps.push({
          area: 'Keyword Density',
          gap: keywordGap > 0 ? -20 : 20,
          recommendation: keywordGap > 0 ? 'Increase keyword usage to match competitors' : 'Keyword density is competitive',
        });
      }
    }

    // Analyze heading optimization comparison
    if (comparisons.headingOptimization.competitorComparison) {
      const headingGap = comparisons.headingOptimization.competitorComparison.averageKeywordOptimization - comparisons.headingOptimization.overallAnalysis.averageOptimizationScore;
      if (headingGap > 10) {
        gaps.push({
          area: 'Heading Optimization',
          gap: -25,
          recommendation: 'Improve keyword usage in headings to match competitors',
        });
      }
    }

    // Analyze LSI keywords comparison
    if (comparisons.lsiKeywords.competitorComparison) {
      if (comparisons.lsiKeywords.competitorComparison.coverageComparison < -20) {
        gaps.push({
          area: 'Semantic Coverage',
          gap: -30,
          recommendation: 'Expand semantic keyword coverage to match competitors',
        });
      }

      if (comparisons.lsiKeywords.competitorComparison.missingKeywords.length > 10) {
        opportunities.push(`Add competitor LSI keywords: ${comparisons.lsiKeywords.competitorComparison.missingKeywords.slice(0, 5).join(', ')}`);
      }
    }

    // Analyze meta tags comparison
    if (comparisons.metaTags.competitorComparison) {
      if (comparisons.metaTags.competitorComparison.socialMediaComparison < 0) {
        gaps.push({
          area: 'Social Media Optimization',
          gap: -15,
          recommendation: 'Add social media meta tags to match competitor optimization',
        });
      }
    }

    // Calculate overall position
    const totalGaps = gaps.reduce((sum, gap) => sum + Math.abs(gap.gap), 0);
    const positionVsCompetitors = totalGaps < 50 ? 1 : totalGaps < 100 ? 2 : 3;

    // Generate opportunities
    if (gaps.length === 0) {
      opportunities.push('Your content is well-optimized compared to competitors');
    } else {
      opportunities.push('Focus on addressing the identified gaps to improve competitive position');
    }

    return {
      positionVsCompetitors,
      gapAnalysis: gaps,
      opportunities,
    };
  }

  /**
   * Generate keyword variations
   */
  private generateKeywordVariations(keyword: string): string[] {
    if (!keyword) return [];

    const variations: string[] = [];
    const words = keyword.toLowerCase().split(' ');

    // Add plural/singular forms
    words.forEach(word => {
      if (word.endsWith('s')) {
        variations.push(word.slice(0, -1));
      } else {
        variations.push(word + 's');
      }
    });

    // Add common variations
    variations.push(keyword.toLowerCase());
    variations.push(keyword.toUpperCase());

    // Add hyphenated version
    if (words.length > 1) {
      variations.push(words.join('-'));
    }

    return [...new Set(variations)];
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html?: string): string | undefined {
    if (!html) return undefined;

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : undefined;
  }

  /**
   * Extract meta description from HTML
   */
  private extractMetaDescription(html?: string): string | undefined {
    if (!html) return undefined;

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    return descMatch ? descMatch[1].trim() : undefined;
  }
}

// Factory function
export const createSEOMetricsEngine = (options: SEOMetricsEngineOptions): SEOMetricsEngine => {
  return new SEOMetricsEngine(options);
};

// Default export
export default SEOMetricsEngine;
