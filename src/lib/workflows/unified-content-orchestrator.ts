/**
 * Unified Content Orchestrator
 * Connects all existing components into a single workflow for SEO-optimized content generation
 * Implements PM recommendations for end-to-end workflow integration
 */

import { getUnifiedSERPService } from '@/lib/serp/unified-serp.service';
import { CompetitorDataAverager } from '@/lib/content/competitor-data-averager';
import { AIContentGenerator } from '@/lib/ai/content-generator';
import { KeywordDensityMatcher } from '@/lib/content/keyword-density-matcher';
import { FirecrawlService } from '@/lib/integrations/firecrawl-service';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Types
export interface OptimizedContentRequest {
  keyword: string;
  location: string;
  contentType?: 'service_page' | 'blog_post' | 'product_page' | 'landing_page';
  customizations?: {
    tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
    targetAudience?: 'business_owners' | 'consumers' | 'professionals' | 'general';
    wordCount?: number;
    industry?: string;
    companyName?: string;
    websiteUrl?: string;
  };
  options?: {
    includeImages?: boolean;
    includeInternalLinks?: boolean;
    includeOutboundLinks?: boolean;
    generateMetaTags?: boolean;
    optimizeForFeaturedSnippets?: boolean;
  };
}

export interface OptimizedContentResult {
  content: string;
  metaTags: {
    title: string;
    description: string;
    keywords: string[];
  };
  seoMetrics: {
    keywordDensity: number;
    targetDensity: number;
    densityAccuracy: number;
    headingOptimization: number;
    readabilityScore: number;
    overallScore: number;
    lsiKeywordsUsed: number;
    entitiesIntegrated: number;
  };
  benchmarks: {
    averageWordCount: number;
    averageHeadings: number;
    averageKeywordDensity: number;
    averageOptimizedHeadings: number;
    lsiKeywords: string[];
    entities: string[];
    variations: string[];
  };
  competitorAnalysis: {
    topCompetitors: Array<{
      url: string;
      title: string;
      wordCount: number;
      keywordDensity: number;
      headingCount: number;
      optimizedHeadings: number;
    }>;
    averageMetrics: {
      wordCount: number;
      keywordDensity: number;
      headingCount: number;
      optimizedHeadings: number;
    };
    insights: string[];
  };
  qualityAnalysis: {
    humanWritingScore: number;
    aiDetectionRisk: 'low' | 'medium' | 'high';
    eeAtScore: number;
    nlpFriendliness: number;
    grammarScore: number;
    overallQuality: number;
  };
  processingTime: number;
  generationId: string;
}

export interface CompetitorContent {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  keywordDensity: number;
  headings: Array<{
    level: number;
    text: string;
    optimized: boolean;
  }>;
  lsiKeywords: string[];
  entities: string[];
  metaDescription?: string;
  extractedAt: string;
}

// Main Orchestrator Class
export class UnifiedContentOrchestrator {
  private serpAnalysisService: any;
  private competitorAverager: CompetitorDataAverager;
  private contentGenerator: AIContentGenerator;
  private densityMatcher: KeywordDensityMatcher;
  private firecrawlService: FirecrawlService;

  constructor() {
    this.serpAnalysisService = getUnifiedSERPService();
    this.competitorAverager = new CompetitorDataAverager();
    this.contentGenerator = new AIContentGenerator();
    this.densityMatcher = new KeywordDensityMatcher();
    this.firecrawlService = new FirecrawlService();
  }

  async generateOptimizedContent(request: OptimizedContentRequest): Promise<OptimizedContentResult> {
    const startTime = Date.now();
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🚀 Starting optimized content generation for "${request.keyword}" in ${request.location}`);
      console.log(`Generation ID: ${generationId}`);

      // Step 1: SERP Analysis - Get top competitors
      console.log(`🔍 Step 1: Analyzing SERP for "${request.keyword}" in ${request.location}`);
      const serpResults = await this.performSERPAnalysis(request.keyword, request.location);

      // Step 2: Extract competitor content
      console.log(`📄 Step 2: Extracting content from ${serpResults.results.length} competitors`);
      const competitorContent = await this.extractCompetitorContent(serpResults.results);

      // Step 3: Calculate precise benchmarks
      console.log(`📊 Step 3: Calculating competitor benchmarks`);
      const benchmarks = await this.calculateBenchmarks(competitorContent, request.keyword);

      // Step 4: Generate optimized content
      console.log(`🤖 Step 4: Generating optimized content`);
      const generatedContent = await this.generateContent(request, benchmarks);

      // Step 5: Validate and optimize content
      console.log(`✅ Step 5: Validating content optimization`);
      const validation = await this.validateContent(generatedContent, request.keyword, benchmarks);

      // Step 6: Generate meta tags and final optimization
      console.log(`🏷️ Step 6: Generating meta tags and final optimization`);
      const metaTags = await this.generateMetaTags(generatedContent.content, request.keyword);

      const processingTime = Date.now() - startTime;
      console.log(`🎉 Content generation completed in ${processingTime}ms`);

      // Track performance metrics
      performanceMonitor.trackAPICall({
        endpoint: 'unified_content_generation',
        method: 'POST',
        duration: processingTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
      });

      return {
        content: generatedContent.content,
        metaTags,
        seoMetrics: {
          keywordDensity: validation.actualDensity,
          targetDensity: benchmarks.averageKeywordDensity,
          densityAccuracy: validation.densityAccuracy,
          headingOptimization: validation.headingOptimization,
          readabilityScore: generatedContent.qualityAnalysis.readabilityScore,
          overallScore: generatedContent.qualityAnalysis.overallScore,
          lsiKeywordsUsed: validation.lsiKeywordsUsed,
          entitiesIntegrated: validation.entitiesIntegrated,
        },
        benchmarks: {
          averageWordCount: benchmarks.averageWordCount,
          averageHeadings: benchmarks.averageHeadings,
          averageKeywordDensity: benchmarks.averageKeywordDensity,
          averageOptimizedHeadings: benchmarks.averageOptimizedHeadings,
          lsiKeywords: benchmarks.lsiKeywords,
          entities: benchmarks.entities,
          variations: benchmarks.variations,
        },
        competitorAnalysis: {
          topCompetitors: competitorContent.map(comp => ({
            url: comp.url,
            title: comp.title,
            wordCount: comp.wordCount,
            keywordDensity: comp.keywordDensity,
            headingCount: comp.headings.length,
            optimizedHeadings: comp.headings.filter(h => h.optimized).length,
          })),
          averageMetrics: {
            wordCount: benchmarks.averageWordCount,
            keywordDensity: benchmarks.averageKeywordDensity,
            headingCount: benchmarks.averageHeadings,
            optimizedHeadings: benchmarks.averageOptimizedHeadings,
          },
          insights: this.generateCompetitorInsights(competitorContent, benchmarks),
        },
        qualityAnalysis: {
          humanWritingScore: generatedContent.qualityAnalysis.humanWritingScore,
          aiDetectionRisk: generatedContent.qualityAnalysis.aiDetectionRisk,
          eeAtScore: generatedContent.qualityAnalysis.eeAtScore,
          nlpFriendliness: generatedContent.qualityAnalysis.nlpFriendliness,
          grammarScore: generatedContent.qualityAnalysis.grammarScore,
          overallQuality: generatedContent.qualityAnalysis.overallScore,
        },
        processingTime,
        generationId,
      };

    } catch (error) {
      console.error('Content generation failed:', error);
      
      // Track error metrics
      performanceMonitor.trackAPICall({
        endpoint: 'unified_content_generation',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  private async performSERPAnalysis(keyword: string, location: string): Promise<any> {
    try {
      const results = await this.serpAnalysisService.analyzeKeyword({
        keyword,
        location,
        numResults: 5,
        onlyOrganic: true,
        includeAnswerBox: true,
        includePeopleAlsoAsk: true,
      });

      if (!results || !results.results || results.results.length === 0) {
        throw new Error('No SERP results found for the given keyword');
      }

      return results;
    } catch (error) {
      console.error('SERP analysis failed:', error);
      throw new Error(`SERP analysis failed: ${error.message}`);
    }
  }

  private async extractCompetitorContent(serpResults: any[]): Promise<CompetitorContent[]> {
    const competitorUrls = serpResults
      .filter(result => result.url && !result.url.includes('youtube.com'))
      .slice(0, 5)
      .map(result => result.url);

    if (competitorUrls.length === 0) {
      throw new Error('No valid competitor URLs found');
    }

    const results = await Promise.allSettled(
      competitorUrls.map(url => this.extractSingleCompetitor(url))
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<CompetitorContent> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    if (successfulResults.length === 0) {
      throw new Error('Failed to extract content from any competitor');
    }

    console.log(`✅ Successfully extracted ${successfulResults.length}/${competitorUrls.length} competitor pages`);
    return successfulResults;
  }

  private async extractSingleCompetitor(url: string): Promise<CompetitorContent | null> {
    try {
      console.log(`📄 Extracting content from: ${url}`);
      
      const scrapedData = await this.firecrawlService.scrapeContent(url);
      
      if (!scrapedData || !scrapedData.content) {
        console.warn(`⚠️ No content extracted from ${url}`);
        return null;
      }

      const content = this.cleanContent(scrapedData.content);
      const headings = this.extractHeadings(content);
      const wordCount = this.calculateWordCount(content);
      
      return {
        url,
        title: scrapedData.title || 'Untitled',
        content,
        headings,
        wordCount,
        keywordDensity: 0, // Will be calculated in benchmarks
        lsiKeywords: this.extractLSIKeywords(content),
        entities: this.extractEntities(content),
        metaDescription: scrapedData.description,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to extract content from ${url}:`, error);
      return null;
    }
  }

  private cleanContent(rawContent: string): string {
    // Remove HTML tags, scripts, styles, and navigation elements
    return rawContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractHeadings(content: string): Array<{level: number; text: string; optimized: boolean}> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{level: number; text: string; optimized: boolean}> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        optimized: false // Will be determined by keyword analysis
      });
    }

    return headings;
  }

  private calculateWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractLSIKeywords(content: string): string[] {
    // Simple LSI extraction - in production, use more sophisticated NLP
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
      }
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private extractEntities(content: string): string[] {
    // Simple entity extraction - in production, use NER models
    const entityPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Proper nouns (names, places)
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\d{4}\b/g, // Years
    ];

    const entities = new Set<string>();
    entityPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => entities.add(match));
    });

    return Array.from(entities).slice(0, 10);
  }

  private async calculateBenchmarks(competitorContent: CompetitorContent[], keyword: string): Promise<any> {
    // Calculate keyword density for each competitor
    competitorContent.forEach(comp => {
      comp.keywordDensity = this.calculateKeywordDensity(comp.content, keyword);
      comp.headings.forEach(heading => {
        heading.optimized = heading.text.toLowerCase().includes(keyword.toLowerCase());
      });
    });

    // Calculate averages
    const averageWordCount = Math.round(
      competitorContent.reduce((sum, comp) => sum + comp.wordCount, 0) / competitorContent.length
    );

    const averageHeadings = Math.round(
      competitorContent.reduce((sum, comp) => sum + comp.headings.length, 0) / competitorContent.length
    );

    const averageKeywordDensity = Number(
      (competitorContent.reduce((sum, comp) => sum + comp.keywordDensity, 0) / competitorContent.length).toFixed(2)
    );

    const averageOptimizedHeadings = Math.round(
      competitorContent.reduce((sum, comp) => 
        sum + comp.headings.filter(h => h.optimized).length, 0
      ) / competitorContent.length
    );

    // Collect all LSI keywords and entities
    const allLSIKeywords = new Set<string>();
    const allEntities = new Set<string>();
    
    competitorContent.forEach(comp => {
      comp.lsiKeywords.forEach(keyword => allLSIKeywords.add(keyword));
      comp.entities.forEach(entity => allEntities.add(entity));
    });

    // Generate keyword variations
    const variations = this.generateKeywordVariations(keyword);

    return {
      averageWordCount,
      averageHeadings,
      averageKeywordDensity,
      averageOptimizedHeadings,
      lsiKeywords: Array.from(allLSIKeywords).slice(0, 15),
      entities: Array.from(allEntities).slice(0, 10),
      variations,
    };
  }

  private calculateKeywordDensity(content: string, keyword: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    
    let keywordCount = 0;
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const phrase = words.slice(i, i + keywordWords.length).join(' ');
      if (phrase === keyword.toLowerCase()) {
        keywordCount++;
      }
    }

    return Number(((keywordCount / words.length) * 100).toFixed(2));
  }

  private generateKeywordVariations(keyword: string): string[] {
    const variations = new Set<string>();
    const words = keyword.split(' ');
    
    // Add singular/plural variations
    variations.add(keyword);
    variations.add(keyword + 's');
    
    // Add word order variations
    if (words.length > 1) {
      variations.add(words.reverse().join(' '));
    }
    
    // Add common variations based on keyword type
    if (keyword.includes('movers')) {
      variations.add(keyword.replace('movers', 'moving companies'));
      variations.add(keyword.replace('movers', 'relocation services'));
      variations.add(keyword.replace('movers', 'moving services'));
    }
    
    return Array.from(variations).slice(0, 8);
  }

  private async generateContent(request: OptimizedContentRequest, benchmarks: any): Promise<any> {
    const contentRequest = {
      keyword: request.keyword,
      industry: request.customizations?.industry || 'moving_services',
      targetAudience: request.customizations?.targetAudience || 'business_owners',
      tone: request.customizations?.tone || 'professional',
      wordCount: request.customizations?.wordCount || benchmarks.averageWordCount,
      targetKeywordDensity: benchmarks.averageKeywordDensity,
      targetOptimizedHeadingsCount: benchmarks.averageOptimizedHeadings,
      lsiKeywords: benchmarks.lsiKeywords,
      entities: benchmarks.entities,
      variations: benchmarks.variations,
      contentType: request.contentType || 'service_page',
      competitorInsights: this.formatCompetitorInsights(benchmarks),
    };

    return await this.contentGenerator.generate(contentRequest);
  }

  private async validateContent(generatedContent: any, keyword: string, benchmarks: any): Promise<any> {
    const actualDensity = this.calculateKeywordDensity(generatedContent.content, keyword);
    const headingOptimization = this.countOptimizedHeadings(generatedContent.content, keyword);
    
    const densityAccuracy = Math.max(0, 100 - Math.abs(actualDensity - benchmarks.averageKeywordDensity) * 10);
    
    return {
      actualDensity,
      densityAccuracy,
      headingOptimization,
      lsiKeywordsUsed: this.countLSIKeywordsUsed(generatedContent.content, benchmarks.lsiKeywords),
      entitiesIntegrated: this.countEntitiesUsed(generatedContent.content, benchmarks.entities),
    };
  }

  private countOptimizedHeadings(content: string, keyword: string): number {
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    const headings = content.match(headingRegex) || [];
    return headings.filter(heading => 
      heading.toLowerCase().includes(keyword.toLowerCase())
    ).length;
  }

  private countLSIKeywordsUsed(content: string, lsiKeywords: string[]): number {
    const contentLower = content.toLowerCase();
    return lsiKeywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    ).length;
  }

  private countEntitiesUsed(content: string, entities: string[]): number {
    return entities.filter(entity => 
      content.includes(entity)
    ).length;
  }

  private async generateMetaTags(content: string, keyword: string): Promise<any> {
    const title = this.extractTitle(content) || `${keyword} - Professional Services`;
    const description = this.generateMetaDescription(content, keyword);
    const keywords = this.extractKeywords(content, keyword);

    return {
      title: title.length > 60 ? title.substring(0, 57) + '...' : title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      keywords,
    };
  }

  private extractTitle(content: string): string | null {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : null;
  }

  private generateMetaDescription(content: string, keyword: string): string {
    const sentences = content.split('.').filter(s => s.trim().length > 0);
    const keywordSentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase()));
    
    if (keywordSentence) {
      return keywordSentence.trim() + '.';
    }
    
    return sentences.slice(0, 2).join('.').trim() + '.';
  }

  private extractKeywords(content: string, primaryKeyword: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
      }
    });

    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);

    return [primaryKeyword, ...topKeywords].slice(0, 10);
  }

  private formatCompetitorInsights(benchmarks: any): string {
    return `
Based on analysis of top 5 competitors:
- Average word count: ${benchmarks.averageWordCount}
- Average keyword density: ${benchmarks.averageKeywordDensity}%
- Average headings: ${benchmarks.averageHeadings}
- Average optimized headings: ${benchmarks.averageOptimizedHeadings}
- Key LSI keywords: ${benchmarks.lsiKeywords.slice(0, 5).join(', ')}
- Important entities: ${benchmarks.entities.slice(0, 3).join(', ')}
    `.trim();
  }

  private generateCompetitorInsights(competitorContent: CompetitorContent[], benchmarks: any): string[] {
    const insights = [];
    
    insights.push(`Top competitors average ${benchmarks.averageWordCount} words per page`);
    insights.push(`Optimal keyword density is ${benchmarks.averageKeywordDensity}% based on top performers`);
    insights.push(`Successful pages use ${benchmarks.averageOptimizedHeadings} keyword-optimized headings`);
    insights.push(`Common LSI keywords: ${benchmarks.lsiKeywords.slice(0, 3).join(', ')}`);
    
    if (benchmarks.entities.length > 0) {
      insights.push(`Important entities to include: ${benchmarks.entities.slice(0, 2).join(', ')}`);
    }

    return insights;
  }
}

// Export singleton instance
export const unifiedContentOrchestrator = new UnifiedContentOrchestrator();
