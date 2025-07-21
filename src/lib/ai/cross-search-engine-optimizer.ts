/**
 * Cross-Search-Engine Optimizer
 * Implements FR11: Optimization for Google, Bing, DuckDuckGo, Yahoo
 */

export interface SearchEngineOptimization {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  specificOptimizations: Record<string, any>;
}

export interface CrossEngineOptimizationResult {
  googleScore: number;
  bingScore: number;
  duckDuckGoScore: number;
  yahooScore: number;
  overallOptimization: number;
  recommendations: string[];
  authorityRankingPotential: number;
  engineSpecificOptimizations: {
    google: SearchEngineOptimization;
    bing: SearchEngineOptimization;
    duckDuckGo: SearchEngineOptimization;
    yahoo: SearchEngineOptimization;
  };
}

export interface ContentAnalysis {
  wordCount: number;
  keywordDensity: Record<string, number>;
  headingStructure: HeadingAnalysis[];
  readabilityScore: number;
  technicalSEO: TechnicalSEOAnalysis;
  semanticAnalysis: SemanticAnalysis;
}

export interface HeadingAnalysis {
  level: number;
  text: string;
  keywordPresence: boolean;
  position: number;
}

export interface TechnicalSEOAnalysis {
  metaTitle: string | null;
  metaDescription: string | null;
  structuredData: boolean;
  internalLinks: number;
  externalLinks: number;
  imageOptimization: number;
}

export interface SemanticAnalysis {
  topicCoverage: number;
  entityMentions: string[];
  semanticKeywords: string[];
  contextualRelevance: number;
}

export class CrossSearchEngineOptimizer {
  private readonly GOOGLE_WEIGHTS = {
    content: 0.35,
    technical: 0.25,
    authority: 0.20,
    user_experience: 0.20,
  };

  private readonly BING_WEIGHTS = {
    content: 0.30,
    technical: 0.30,
    social_signals: 0.20,
    domain_authority: 0.20,
  };

  private readonly DUCKDUCKGO_WEIGHTS = {
    content: 0.40,
    privacy: 0.25,
    technical: 0.20,
    freshness: 0.15,
  };

  private readonly YAHOO_WEIGHTS = {
    content: 0.35,
    technical: 0.25,
    backlinks: 0.25,
    brand_signals: 0.15,
  };

  /**
   * Optimize content for all major search engines
   */
  async optimizeForAllSearchEngines(content: string, targetKeywords: string[] = []): Promise<CrossEngineOptimizationResult> {
    // Analyze content comprehensively
    const contentAnalysis = await this.analyzeContent(content, targetKeywords);

    // Optimize for each search engine
    const googleOptimization = await this.optimizeForGoogle(content, contentAnalysis);
    const bingOptimization = await this.optimizeForBing(content, contentAnalysis);
    const duckDuckGoOptimization = await this.optimizeForDuckDuckGo(content, contentAnalysis);
    const yahooOptimization = await this.optimizeForYahoo(content, contentAnalysis);

    // Calculate overall optimization score
    const overallOptimization = this.calculateOverallScore([
      googleOptimization,
      bingOptimization,
      duckDuckGoOptimization,
      yahooOptimization,
    ]);

    // Generate cross-engine recommendations
    const recommendations = this.generateCrossEngineRecommendations(content, [
      googleOptimization,
      bingOptimization,
      duckDuckGoOptimization,
      yahooOptimization,
    ]);

    // Assess authority ranking potential
    const authorityRankingPotential = this.assessAuthorityRankingPotential(content, contentAnalysis);

    return {
      googleScore: googleOptimization.score,
      bingScore: bingOptimization.score,
      duckDuckGoScore: duckDuckGoOptimization.score,
      yahooScore: yahooOptimization.score,
      overallOptimization,
      recommendations,
      authorityRankingPotential,
      engineSpecificOptimizations: {
        google: googleOptimization,
        bing: bingOptimization,
        duckDuckGo: duckDuckGoOptimization,
        yahoo: yahooOptimization,
      },
    };
  }

  /**
   * Analyze content comprehensively
   */
  private async analyzeContent(content: string, targetKeywords: string[]): Promise<ContentAnalysis> {
    const words = content.split(/\s+/);
    const wordCount = words.length;

    // Calculate keyword density
    const keywordDensity: Record<string, number> = {};
    for (const keyword of targetKeywords) {
      const keywordCount = this.countKeywordOccurrences(content, keyword);
      keywordDensity[keyword] = (keywordCount / wordCount) * 100;
    }

    // Analyze heading structure
    const headingStructure = this.analyzeHeadingStructure(content, targetKeywords);

    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(content);

    // Analyze technical SEO elements
    const technicalSEO = this.analyzeTechnicalSEO(content);

    // Perform semantic analysis
    const semanticAnalysis = this.performSemanticAnalysis(content, targetKeywords);

    return {
      wordCount,
      keywordDensity,
      headingStructure,
      readabilityScore,
      technicalSEO,
      semanticAnalysis,
    };
  }

  /**
   * Optimize for Google's ranking factors
   */
  private async optimizeForGoogle(content: string, analysis: ContentAnalysis): Promise<SearchEngineOptimization> {
    const optimizations: Record<string, any> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Content quality assessment
    const contentScore = this.assessGoogleContentQuality(analysis);
    optimizations.contentQuality = contentScore;

    if (contentScore > 0.8) {
      strengths.push('High-quality, comprehensive content');
    } else {
      weaknesses.push('Content quality needs improvement');
      recommendations.push('Enhance content depth and comprehensiveness');
    }

    // Technical SEO assessment
    const technicalScore = this.assessGoogleTechnicalSEO(analysis);
    optimizations.technicalSEO = technicalScore;

    if (technicalScore > 0.8) {
      strengths.push('Strong technical SEO foundation');
    } else {
      weaknesses.push('Technical SEO optimization needed');
      recommendations.push('Improve meta tags, structured data, and page structure');
    }

    // User experience factors
    const uxScore = this.assessGoogleUserExperience(analysis);
    optimizations.userExperience = uxScore;

    if (uxScore > 0.8) {
      strengths.push('Excellent user experience signals');
    } else {
      weaknesses.push('User experience optimization needed');
      recommendations.push('Improve readability and content structure');
    }

    // Authority signals
    const authorityScore = this.assessGoogleAuthority(analysis);
    optimizations.authority = authorityScore;

    if (authorityScore > 0.7) {
      strengths.push('Strong authority signals');
    } else {
      weaknesses.push('Authority signals need strengthening');
      recommendations.push('Add more authoritative sources and expert insights');
    }

    const overallScore = (
      contentScore * this.GOOGLE_WEIGHTS.content +
      technicalScore * this.GOOGLE_WEIGHTS.technical +
      authorityScore * this.GOOGLE_WEIGHTS.authority +
      uxScore * this.GOOGLE_WEIGHTS.user_experience
    );

    return {
      score: Number(overallScore.toFixed(3)),
      strengths,
      weaknesses,
      recommendations,
      specificOptimizations: optimizations,
    };
  }

  /**
   * Optimize for Bing's ranking factors
   */
  private async optimizeForBing(content: string, analysis: ContentAnalysis): Promise<SearchEngineOptimization> {
    const optimizations: Record<string, any> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Content relevance (Bing values exact keyword matches more)
    const contentScore = this.assessBingContentRelevance(analysis);
    optimizations.contentRelevance = contentScore;

    // Technical SEO (Bing is more sensitive to technical issues)
    const technicalScore = this.assessBingTechnicalSEO(analysis);
    optimizations.technicalSEO = technicalScore;

    // Social signals (Bing considers social media more heavily)
    const socialScore = this.assessBingSocialSignals(content);
    optimizations.socialSignals = socialScore;

    // Domain authority (Bing values established domains)
    const domainScore = this.assessBingDomainAuthority(analysis);
    optimizations.domainAuthority = domainScore;

    const overallScore = (
      contentScore * this.BING_WEIGHTS.content +
      technicalScore * this.BING_WEIGHTS.technical +
      socialScore * this.BING_WEIGHTS.social_signals +
      domainScore * this.BING_WEIGHTS.domain_authority
    );

    // Generate Bing-specific recommendations
    if (contentScore < 0.7) {
      recommendations.push('Increase exact keyword match density for Bing optimization');
    }
    if (technicalScore < 0.8) {
      recommendations.push('Fix technical SEO issues - Bing is sensitive to technical problems');
    }

    return {
      score: Number(overallScore.toFixed(3)),
      strengths,
      weaknesses,
      recommendations,
      specificOptimizations: optimizations,
    };
  }

  /**
   * Optimize for DuckDuckGo's ranking factors
   */
  private async optimizeForDuckDuckGo(content: string, analysis: ContentAnalysis): Promise<SearchEngineOptimization> {
    const optimizations: Record<string, any> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Content quality (DuckDuckGo values high-quality, informative content)
    const contentScore = this.assessDuckDuckGoContentQuality(analysis);
    optimizations.contentQuality = contentScore;

    // Privacy compliance (DuckDuckGo values privacy-friendly sites)
    const privacyScore = this.assessDuckDuckGoPrivacy(content);
    optimizations.privacy = privacyScore;

    // Technical optimization
    const technicalScore = this.assessDuckDuckGoTechnical(analysis);
    optimizations.technical = technicalScore;

    // Content freshness
    const freshnessScore = this.assessDuckDuckGoFreshness(content);
    optimizations.freshness = freshnessScore;

    const overallScore = (
      contentScore * this.DUCKDUCKGO_WEIGHTS.content +
      privacyScore * this.DUCKDUCKGO_WEIGHTS.privacy +
      technicalScore * this.DUCKDUCKGO_WEIGHTS.technical +
      freshnessScore * this.DUCKDUCKGO_WEIGHTS.freshness
    );

    if (privacyScore > 0.8) {
      strengths.push('Privacy-friendly content structure');
    } else {
      recommendations.push('Ensure privacy compliance and avoid tracking elements');
    }

    return {
      score: Number(overallScore.toFixed(3)),
      strengths,
      weaknesses,
      recommendations,
      specificOptimizations: optimizations,
    };
  }

  /**
   * Optimize for Yahoo's ranking factors
   */
  private async optimizeForYahoo(content: string, analysis: ContentAnalysis): Promise<SearchEngineOptimization> {
    const optimizations: Record<string, any> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Content quality
    const contentScore = this.assessYahooContentQuality(analysis);
    optimizations.contentQuality = contentScore;

    // Technical SEO
    const technicalScore = this.assessYahooTechnicalSEO(analysis);
    optimizations.technicalSEO = technicalScore;

    // Backlink profile
    const backlinkScore = this.assessYahooBacklinks(analysis);
    optimizations.backlinks = backlinkScore;

    // Brand signals
    const brandScore = this.assessYahooBrandSignals(content);
    optimizations.brandSignals = brandScore;

    const overallScore = (
      contentScore * this.YAHOO_WEIGHTS.content +
      technicalScore * this.YAHOO_WEIGHTS.technical +
      backlinkScore * this.YAHOO_WEIGHTS.backlinks +
      brandScore * this.YAHOO_WEIGHTS.brand_signals
    );

    return {
      score: Number(overallScore.toFixed(3)),
      strengths,
      weaknesses,
      recommendations,
      specificOptimizations: optimizations,
    };
  }

  // Helper methods for content analysis
  private countKeywordOccurrences(content: string, keyword: string): number {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return (content.match(regex) || []).length;
  }

  private analyzeHeadingStructure(content: string, targetKeywords: string[]): HeadingAnalysis[] {
    const headings: HeadingAnalysis[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const keywordPresence = targetKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      headings.push({
        level,
        text,
        keywordPresence,
        position: match.index,
      });
    }

    return headings;
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified Flesch Reading Ease calculation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);

    if (sentences === 0 || words === 0) return 0;

    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert to 0-1 scale
    return Math.max(0, Math.min(1, fleschScore / 100));
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    for (const word of words) {
      const vowels = word.match(/[aeiouy]+/g);
      syllableCount += vowels ? vowels.length : 1;
    }

    return syllableCount;
  }

  private analyzeTechnicalSEO(content: string): TechnicalSEOAnalysis {
    // Extract meta information (simplified)
    const metaTitle = this.extractMetaTitle(content);
    const metaDescription = this.extractMetaDescription(content);
    const structuredData = this.hasStructuredData(content);
    const internalLinks = this.countInternalLinks(content);
    const externalLinks = this.countExternalLinks(content);
    const imageOptimization = this.assessImageOptimization(content);

    return {
      metaTitle,
      metaDescription,
      structuredData,
      internalLinks,
      externalLinks,
      imageOptimization,
    };
  }

  private performSemanticAnalysis(content: string, targetKeywords: string[]): SemanticAnalysis {
    // Simplified semantic analysis
    const topicCoverage = this.assessTopicCoverage(content, targetKeywords);
    const entityMentions = this.extractEntityMentions(content);
    const semanticKeywords = this.extractSemanticKeywords(content, targetKeywords);
    const contextualRelevance = this.assessContextualRelevance(content, targetKeywords);

    return {
      topicCoverage,
      entityMentions,
      semanticKeywords,
      contextualRelevance,
    };
  }

  // Assessment methods for different search engines
  private assessGoogleContentQuality(analysis: ContentAnalysis): number {
    let score = 0;
    
    // Word count factor
    if (analysis.wordCount >= 1500) score += 0.3;
    else if (analysis.wordCount >= 1000) score += 0.2;
    else if (analysis.wordCount >= 500) score += 0.1;

    // Readability factor
    score += analysis.readabilityScore * 0.3;

    // Semantic coverage
    score += analysis.semanticAnalysis.topicCoverage * 0.4;

    return Math.min(1, score);
  }

  private assessGoogleTechnicalSEO(analysis: ContentAnalysis): number {
    let score = 0;

    if (analysis.technicalSEO.metaTitle) score += 0.2;
    if (analysis.technicalSEO.metaDescription) score += 0.2;
    if (analysis.technicalSEO.structuredData) score += 0.3;
    
    score += Math.min(0.3, analysis.technicalSEO.imageOptimization);

    return score;
  }

  private assessGoogleUserExperience(analysis: ContentAnalysis): number {
    return analysis.readabilityScore;
  }

  private assessGoogleAuthority(analysis: ContentAnalysis): number {
    // Simplified authority assessment
    return Math.min(1, analysis.technicalSEO.externalLinks * 0.1);
  }

  // Simplified implementations for other search engines
  private assessBingContentRelevance(analysis: ContentAnalysis): number {
    return this.assessGoogleContentQuality(analysis);
  }

  private assessBingTechnicalSEO(analysis: ContentAnalysis): number {
    return this.assessGoogleTechnicalSEO(analysis);
  }

  private assessBingSocialSignals(content: string): number {
    // Check for social sharing elements
    const socialIndicators = ['share', 'tweet', 'facebook', 'linkedin'];
    let score = 0;
    
    for (const indicator of socialIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        score += 0.25;
      }
    }
    
    return Math.min(1, score);
  }

  private assessBingDomainAuthority(analysis: ContentAnalysis): number {
    return Math.min(1, analysis.technicalSEO.externalLinks * 0.05);
  }

  private assessDuckDuckGoContentQuality(analysis: ContentAnalysis): number {
    return this.assessGoogleContentQuality(analysis);
  }

  private assessDuckDuckGoPrivacy(content: string): number {
    // Check for privacy-friendly elements
    const privacyIndicators = ['privacy', 'gdpr', 'cookie policy', 'data protection'];
    let score = 0.5; // Base score
    
    for (const indicator of privacyIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        score += 0.125;
      }
    }
    
    return Math.min(1, score);
  }

  private assessDuckDuckGoTechnical(analysis: ContentAnalysis): number {
    return this.assessGoogleTechnicalSEO(analysis);
  }

  private assessDuckDuckGoFreshness(content: string): number {
    const currentYear = new Date().getFullYear();
    if (content.includes(currentYear.toString())) {
      return 1.0;
    }
    if (content.includes((currentYear - 1).toString())) {
      return 0.8;
    }
    return 0.5;
  }

  private assessYahooContentQuality(analysis: ContentAnalysis): number {
    return this.assessGoogleContentQuality(analysis);
  }

  private assessYahooTechnicalSEO(analysis: ContentAnalysis): number {
    return this.assessGoogleTechnicalSEO(analysis);
  }

  private assessYahooBacklinks(analysis: ContentAnalysis): number {
    return Math.min(1, analysis.technicalSEO.externalLinks * 0.1);
  }

  private assessYahooBrandSignals(content: string): number {
    const brandIndicators = ['brand', 'company', 'official', 'trademark'];
    let score = 0;
    
    for (const indicator of brandIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        score += 0.25;
      }
    }
    
    return Math.min(1, score);
  }

  // Utility methods
  private calculateOverallScore(optimizations: SearchEngineOptimization[]): number {
    const totalScore = optimizations.reduce((sum, opt) => sum + opt.score, 0);
    return Number((totalScore / optimizations.length).toFixed(3));
  }

  private generateCrossEngineRecommendations(content: string, optimizations: SearchEngineOptimization[]): string[] {
    const recommendations: string[] = [];

    // Find common weaknesses
    const commonWeaknesses = this.findCommonWeaknesses(optimizations);
    recommendations.push(...commonWeaknesses);

    // Add engine-specific high-impact recommendations
    const highImpactRecs = this.findHighImpactRecommendations(optimizations);
    recommendations.push(...highImpactRecs);

    // Add general recommendations if none found
    if (recommendations.length === 0) {
      const avgScore = this.calculateOverallScore(optimizations);
      if (avgScore < 0.8) {
        recommendations.push('Improve overall content quality and technical SEO');
      }
      if (avgScore < 0.6) {
        recommendations.push('Enhance keyword optimization and content structure');
      }
      recommendations.push('Optimize for cross-search-engine compatibility');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private assessAuthorityRankingPotential(content: string, analysis: ContentAnalysis): number {
    let potential = 0;

    // Content depth
    if (analysis.wordCount >= 2000) potential += 0.3;
    
    // Technical optimization
    if (analysis.technicalSEO.structuredData) potential += 0.2;
    
    // External authority signals
    potential += Math.min(0.3, analysis.technicalSEO.externalLinks * 0.05);
    
    // Semantic richness
    potential += analysis.semanticAnalysis.topicCoverage * 0.2;

    return Math.min(1, potential);
  }

  // Simplified helper methods
  private extractMetaTitle(content: string): string | null {
    const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1] : null;
  }

  private extractMetaDescription(content: string): string | null {
    const match = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    return match ? match[1] : null;
  }

  private hasStructuredData(content: string): boolean {
    return content.includes('application/ld+json') || content.includes('schema.org');
  }

  private countInternalLinks(content: string): number {
    const matches = content.match(/\[([^\]]+)\]\((?!https?:\/\/)[^)]+\)/g);
    return matches ? matches.length : 0;
  }

  private countExternalLinks(content: string): number {
    const matches = content.match(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g);
    return matches ? matches.length : 0;
  }

  private assessImageOptimization(content: string): number {
    const images = content.match(/!\[([^\]]*)\]\([^)]+\)/g);
    if (!images) return 0;

    let optimizedCount = 0;
    for (const image of images) {
      if (image.includes('alt=') || image.match(/!\[.+\]/)) {
        optimizedCount++;
      }
    }

    return images.length > 0 ? optimizedCount / images.length : 0;
  }

  private assessTopicCoverage(content: string, targetKeywords: string[]): number {
    let coverage = 0;
    for (const keyword of targetKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        coverage += 1;
      }
    }
    return targetKeywords.length > 0 ? coverage / targetKeywords.length : 0;
  }

  private extractEntityMentions(content: string): string[] {
    // Simplified entity extraction
    const entities = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return [...new Set(entities)].slice(0, 10); // Top 10 unique entities
  }

  private extractSemanticKeywords(content: string, targetKeywords: string[]): string[] {
    // Simplified semantic keyword extraction
    const words = content.toLowerCase().split(/\s+/);
    const semanticKeywords: string[] = [];
    
    for (const keyword of targetKeywords) {
      const relatedWords = words.filter(word => 
        word.includes(keyword.toLowerCase()) && word !== keyword.toLowerCase()
      );
      semanticKeywords.push(...relatedWords);
    }
    
    return [...new Set(semanticKeywords)].slice(0, 20);
  }

  private assessContextualRelevance(content: string, targetKeywords: string[]): number {
    // Simplified contextual relevance assessment
    let relevanceScore = 0;
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const keywordsInSentence = targetKeywords.filter(keyword =>
        sentence.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (keywordsInSentence > 0) {
        relevanceScore += keywordsInSentence / targetKeywords.length;
      }
    }
    
    return Math.min(1, relevanceScore / sentences.length);
  }

  private findCommonWeaknesses(optimizations: SearchEngineOptimization[]): string[] {
    const weaknessCount: Record<string, number> = {};
    
    for (const opt of optimizations) {
      for (const weakness of opt.weaknesses) {
        weaknessCount[weakness] = (weaknessCount[weakness] || 0) + 1;
      }
    }
    
    return Object.entries(weaknessCount)
      .filter(([_, count]) => count >= 2) // Appears in at least 2 engines
      .map(([weakness, _]) => weakness);
  }

  private findHighImpactRecommendations(optimizations: SearchEngineOptimization[]): string[] {
    const recCount: Record<string, number> = {};
    
    for (const opt of optimizations) {
      for (const rec of opt.recommendations) {
        recCount[rec] = (recCount[rec] || 0) + 1;
      }
    }
    
    return Object.entries(recCount)
      .filter(([_, count]) => count >= 2)
      .map(([rec, _]) => rec);
  }
}
