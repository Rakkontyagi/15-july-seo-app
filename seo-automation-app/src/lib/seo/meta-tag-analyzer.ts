/**
 * Meta Tag Analysis System for SEO Automation App
 * Analyzes and optimizes HTML meta tags for SEO performance
 */

import { z } from 'zod';
import { JSDOM } from 'jsdom';

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  type: 'title' | 'description' | 'keywords' | 'robots' | 'canonical' | 'og' | 'twitter' | 'schema' | 'other';
  isOptimal: boolean;
  issues: string[];
  recommendations: string[];
  seoValue: number; // 0-100
}

export interface MetaTagAnalysisResult {
  tags: MetaTag[];
  analysis: {
    title: {
      present: boolean;
      length: number;
      isOptimal: boolean;
      keywordPresence: boolean;
      brandPresence: boolean;
      issues: string[];
      recommendations: string[];
    };
    description: {
      present: boolean;
      length: number;
      isOptimal: boolean;
      keywordPresence: boolean;
      callToActionPresence: boolean;
      issues: string[];
      recommendations: string[];
    };
    openGraph: {
      present: boolean;
      completeness: number; // 0-100
      requiredTags: string[];
      missingTags: string[];
      issues: string[];
    };
    twitterCard: {
      present: boolean;
      cardType?: string;
      completeness: number; // 0-100
      issues: string[];
    };
    technical: {
      canonical: boolean;
      robots: boolean;
      viewport: boolean;
      charset: boolean;
      issues: string[];
    };
  };
  scores: {
    overall: number; // 0-100
    basicSEO: number; // 0-100
    socialMedia: number; // 0-100
    technical: number; // 0-100
  };
  competitorComparison?: {
    titleLengthComparison: number;
    descriptionLengthComparison: number;
    keywordUsageComparison: number;
    socialMediaComparison: number;
    recommendations: string[];
  };
  recommendations: string[];
}

export interface MetaTagAnalysisOptions {
  primaryKeyword?: string;
  targetKeywords?: string[];
  brandName?: string;
  siteUrl?: string;
  optimalTitleLength?: { min: number; max: number };
  optimalDescriptionLength?: { min: number; max: number };
  checkSocialMedia?: boolean;
  checkTechnicalTags?: boolean;
  language?: string;
}

const DEFAULT_OPTIONS: Required<MetaTagAnalysisOptions> = {
  primaryKeyword: '',
  targetKeywords: [],
  brandName: '',
  siteUrl: '',
  optimalTitleLength: { min: 30, max: 60 },
  optimalDescriptionLength: { min: 120, max: 160 },
  checkSocialMedia: true,
  checkTechnicalTags: true,
  language: 'en',
};

export class MetaTagAnalyzer {
  private options: Required<MetaTagAnalysisOptions>;

  constructor(options: MetaTagAnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze meta tags from HTML
   */
  analyzeMetaTags(html: string): MetaTagAnalysisResult {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract all meta tags
    const tags = this.extractMetaTags(document);

    // Analyze specific tag types
    const analysis = {
      title: this.analyzeTitle(document),
      description: this.analyzeDescription(document),
      openGraph: this.analyzeOpenGraph(document),
      twitterCard: this.analyzeTwitterCard(document),
      technical: this.analyzeTechnicalTags(document),
    };

    // Calculate scores
    const scores = this.calculateScores(analysis);

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, scores);

    return {
      tags,
      analysis,
      scores,
      recommendations,
    };
  }

  /**
   * Compare with competitor meta tags
   */
  compareWithCompetitors(
    currentAnalysis: MetaTagAnalysisResult,
    competitorHtmls: Array<{ url: string; html: string }>
  ): MetaTagAnalysisResult {
    const competitorAnalyses = competitorHtmls.map(({ url, html }) => ({
      url,
      analysis: this.analyzeMetaTags(html),
    }));

    // Calculate comparisons
    const titleLengths = competitorAnalyses.map(c => c.analysis.analysis.title.length);
    const avgTitleLength = titleLengths.reduce((sum, len) => sum + len, 0) / titleLengths.length;
    const titleLengthComparison = currentAnalysis.analysis.title.length - avgTitleLength;

    const descriptionLengths = competitorAnalyses.map(c => c.analysis.analysis.description.length);
    const avgDescriptionLength = descriptionLengths.reduce((sum, len) => sum + len, 0) / descriptionLengths.length;
    const descriptionLengthComparison = currentAnalysis.analysis.description.length - avgDescriptionLength;

    // Keyword usage comparison
    const competitorKeywordUsage = competitorAnalyses.filter(c =>
      c.analysis.analysis.title.keywordPresence || c.analysis.analysis.description.keywordPresence
    ).length;
    const keywordUsageComparison = (currentAnalysis.analysis.title.keywordPresence ||
                                   currentAnalysis.analysis.description.keywordPresence) ? 1 : 0;

    // Social media comparison
    const competitorSocialMedia = competitorAnalyses.filter(c =>
      c.analysis.analysis.openGraph.present || c.analysis.analysis.twitterCard.present
    ).length;
    const socialMediaComparison = (currentAnalysis.analysis.openGraph.present ||
                                  currentAnalysis.analysis.twitterCard.present) ? 1 : 0;

    const competitorComparison = {
      titleLengthComparison: Math.round(titleLengthComparison),
      descriptionLengthComparison: Math.round(descriptionLengthComparison),
      keywordUsageComparison: keywordUsageComparison - (competitorKeywordUsage / competitorAnalyses.length),
      socialMediaComparison: socialMediaComparison - (competitorSocialMedia / competitorAnalyses.length),
      recommendations: this.generateCompetitorRecommendations(
        titleLengthComparison,
        descriptionLengthComparison,
        keywordUsageComparison,
        socialMediaComparison
      ),
    };

    return {
      ...currentAnalysis,
      competitorComparison,
    };
  }

  /**
   * Extract all meta tags from document
   */
  private extractMetaTags(document: Document): MetaTag[] {
    const tags: MetaTag[] = [];

    // Title tag
    const titleElement = document.querySelector('title');
    if (titleElement) {
      tags.push(this.analyzeMetaTag({
        type: 'title',
        content: titleElement.textContent || '',
      }));
    }

    // Meta tags
    const metaElements = document.querySelectorAll('meta');
    metaElements.forEach(meta => {
      const name = meta.getAttribute('name');
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content') || '';

      if (name || property) {
        tags.push(this.analyzeMetaTag({
          name,
          property,
          content,
          type: this.classifyMetaTag(name, property),
        }));
      }
    });

    // Link tags (canonical, etc.)
    const linkElements = document.querySelectorAll('link[rel="canonical"]');
    linkElements.forEach(link => {
      const href = link.getAttribute('href') || '';
      tags.push(this.analyzeMetaTag({
        type: 'canonical',
        content: href,
      }));
    });

    return tags;
  }

  /**
   * Classify meta tag type
   */
  private classifyMetaTag(name?: string | null, property?: string | null): MetaTag['type'] {
    if (name) {
      if (name === 'description') return 'description';
      if (name === 'keywords') return 'keywords';
      if (name === 'robots') return 'robots';
      if (name.startsWith('twitter:')) return 'twitter';
    }

    if (property) {
      if (property.startsWith('og:')) return 'og';
    }

    return 'other';
  }

  /**
   * Analyze individual meta tag
   */
  private analyzeMetaTag(tagData: Partial<MetaTag>): MetaTag {
    const tag: MetaTag = {
      name: tagData.name || undefined,
      property: tagData.property || undefined,
      content: tagData.content || '',
      type: tagData.type || 'other',
      isOptimal: false,
      issues: [],
      recommendations: [],
      seoValue: 50,
    };

    // Analyze based on type
    switch (tag.type) {
      case 'title':
        this.analyzeTitleTag(tag);
        break;
      case 'description':
        this.analyzeDescriptionTag(tag);
        break;
      case 'keywords':
        this.analyzeKeywordsTag(tag);
        break;
      case 'robots':
        this.analyzeRobotsTag(tag);
        break;
      case 'og':
        this.analyzeOGTag(tag);
        break;
      case 'twitter':
        this.analyzeTwitterTag(tag);
        break;
      default:
        tag.seoValue = 30;
    }

    tag.isOptimal = tag.issues.length === 0;
    return tag;
  }

  /**
   * Analyze title tag
   */
  private analyzeTitleTag(tag: MetaTag): void {
    const length = tag.content.length;
    const { min, max } = this.options.optimalTitleLength;

    tag.seoValue = 90; // High SEO value

    if (length === 0) {
      tag.issues.push('Title is empty');
      tag.recommendations.push('Add a descriptive title');
      tag.seoValue = 0;
    } else if (length < min) {
      tag.issues.push(`Title too short (${length} characters)`);
      tag.recommendations.push(`Expand title to at least ${min} characters`);
      tag.seoValue = 60;
    } else if (length > max) {
      tag.issues.push(`Title too long (${length} characters)`);
      tag.recommendations.push(`Shorten title to under ${max} characters`);
      tag.seoValue = 70;
    }

    // Check keyword presence
    if (this.options.primaryKeyword && !tag.content.toLowerCase().includes(this.options.primaryKeyword.toLowerCase())) {
      tag.issues.push('Primary keyword not found in title');
      tag.recommendations.push('Include primary keyword in title');
      tag.seoValue -= 20;
    }

    // Check brand presence
    if (this.options.brandName && !tag.content.toLowerCase().includes(this.options.brandName.toLowerCase())) {
      tag.recommendations.push('Consider including brand name in title');
    }
  }

  /**
   * Analyze description tag
   */
  private analyzeDescriptionTag(tag: MetaTag): void {
    const length = tag.content.length;
    const { min, max } = this.options.optimalDescriptionLength;

    tag.seoValue = 85; // High SEO value

    if (length === 0) {
      tag.issues.push('Meta description is empty');
      tag.recommendations.push('Add a compelling meta description');
      tag.seoValue = 0;
    } else if (length < min) {
      tag.issues.push(`Meta description too short (${length} characters)`);
      tag.recommendations.push(`Expand description to at least ${min} characters`);
      tag.seoValue = 60;
    } else if (length > max) {
      tag.issues.push(`Meta description too long (${length} characters)`);
      tag.recommendations.push(`Shorten description to under ${max} characters`);
      tag.seoValue = 70;
    }

    // Check keyword presence
    if (this.options.primaryKeyword && !tag.content.toLowerCase().includes(this.options.primaryKeyword.toLowerCase())) {
      tag.issues.push('Primary keyword not found in description');
      tag.recommendations.push('Include primary keyword in description');
      tag.seoValue -= 15;
    }

    // Check for call-to-action
    const ctaWords = ['learn', 'discover', 'find', 'get', 'try', 'start', 'explore', 'see'];
    const hasCTA = ctaWords.some(word => tag.content.toLowerCase().includes(word));
    if (!hasCTA) {
      tag.recommendations.push('Consider adding a call-to-action to improve click-through rate');
    }
  }

  /**
   * Analyze keywords tag
   */
  private analyzeKeywordsTag(tag: MetaTag): void {
    tag.seoValue = 20; // Low SEO value (deprecated)
    tag.issues.push('Keywords meta tag is deprecated and ignored by search engines');
    tag.recommendations.push('Remove keywords meta tag and focus on content optimization');
  }

  /**
   * Analyze robots tag
   */
  private analyzeRobotsTag(tag: MetaTag): void {
    tag.seoValue = 70;

    const content = tag.content.toLowerCase();
    if (content.includes('noindex')) {
      tag.issues.push('Page is set to noindex');
      tag.recommendations.push('Remove noindex if you want the page to be indexed');
    }

    if (content.includes('nofollow')) {
      tag.issues.push('Page is set to nofollow');
      tag.recommendations.push('Remove nofollow if you want links to be followed');
    }
  }

  /**
   * Analyze Open Graph tag
   */
  private analyzeOGTag(tag: MetaTag): void {
    tag.seoValue = 60;

    if (!tag.content) {
      tag.issues.push('Open Graph tag has no content');
      tag.recommendations.push('Add content to Open Graph tag');
    }
  }

  /**
   * Analyze Twitter tag
   */
  private analyzeTwitterTag(tag: MetaTag): void {
    tag.seoValue = 55;

    if (!tag.content) {
      tag.issues.push('Twitter tag has no content');
      tag.recommendations.push('Add content to Twitter tag');
    }
  }

  /**
   * Analyze title element
   */
  private analyzeTitle(document: Document) {
    const titleElement = document.querySelector('title');
    const content = titleElement?.textContent || '';
    const length = content.length;

    const present = !!titleElement;
    const isOptimal = length >= this.options.optimalTitleLength.min &&
                     length <= this.options.optimalTitleLength.max;

    const keywordPresence = this.options.primaryKeyword ?
      content.toLowerCase().includes(this.options.primaryKeyword.toLowerCase()) : false;

    const brandPresence = this.options.brandName ?
      content.toLowerCase().includes(this.options.brandName.toLowerCase()) : false;

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!present) {
      issues.push('Title tag is missing');
      recommendations.push('Add a title tag to the page');
    } else if (length === 0) {
      issues.push('Title tag is empty');
      recommendations.push('Add content to the title tag');
    } else {
      if (length < this.options.optimalTitleLength.min) {
        issues.push('Title is too short');
        recommendations.push(`Expand title to at least ${this.options.optimalTitleLength.min} characters`);
      } else if (length > this.options.optimalTitleLength.max) {
        issues.push('Title is too long');
        recommendations.push(`Shorten title to under ${this.options.optimalTitleLength.max} characters`);
      }

      if (!keywordPresence && this.options.primaryKeyword) {
        issues.push('Primary keyword not in title');
        recommendations.push('Include primary keyword in title');
      }

      if (!brandPresence && this.options.brandName) {
        recommendations.push('Consider including brand name in title');
      }
    }

    return {
      present,
      length,
      isOptimal,
      keywordPresence,
      brandPresence,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze meta description
   */
  private analyzeDescription(document: Document) {
    const descElement = document.querySelector('meta[name="description"]');
    const content = descElement?.getAttribute('content') || '';
    const length = content.length;

    const present = !!descElement;
    const isOptimal = length >= this.options.optimalDescriptionLength.min &&
                     length <= this.options.optimalDescriptionLength.max;

    const keywordPresence = this.options.primaryKeyword ?
      content.toLowerCase().includes(this.options.primaryKeyword.toLowerCase()) : false;

    const ctaWords = ['learn', 'discover', 'find', 'get', 'try', 'start', 'explore'];
    const callToActionPresence = ctaWords.some(word => content.toLowerCase().includes(word));

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!present) {
      issues.push('Meta description is missing');
      recommendations.push('Add a meta description to the page');
    } else if (length === 0) {
      issues.push('Meta description is empty');
      recommendations.push('Add content to the meta description');
    } else {
      if (length < this.options.optimalDescriptionLength.min) {
        issues.push('Description is too short');
        recommendations.push(`Expand description to at least ${this.options.optimalDescriptionLength.min} characters`);
      } else if (length > this.options.optimalDescriptionLength.max) {
        issues.push('Description is too long');
        recommendations.push(`Shorten description to under ${this.options.optimalDescriptionLength.max} characters`);
      }

      if (!keywordPresence && this.options.primaryKeyword) {
        issues.push('Primary keyword not in description');
        recommendations.push('Include primary keyword in description');
      }

      if (!callToActionPresence) {
        recommendations.push('Consider adding a call-to-action to improve CTR');
      }
    }

    return {
      present,
      length,
      isOptimal,
      keywordPresence,
      callToActionPresence,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze Open Graph tags
   */
  private analyzeOpenGraph(document: Document) {
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    const present = ogTags.length > 0;

    const requiredTags = ['og:title', 'og:description', 'og:image', 'og:url'];
    const foundTags: string[] = [];
    const issues: string[] = [];

    ogTags.forEach(tag => {
      const property = tag.getAttribute('property');
      if (property) {
        foundTags.push(property);
      }
    });

    const missingTags = requiredTags.filter(tag => !foundTags.includes(tag));
    const completeness = ((requiredTags.length - missingTags.length) / requiredTags.length) * 100;

    if (!present) {
      issues.push('No Open Graph tags found');
    } else {
      missingTags.forEach(tag => {
        issues.push(`Missing ${tag} tag`);
      });
    }

    return {
      present,
      completeness: Math.round(completeness),
      requiredTags,
      missingTags,
      issues,
    };
  }

  /**
   * Analyze Twitter Card tags
   */
  private analyzeTwitterCard(document: Document) {
    const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    const present = twitterTags.length > 0;
    const issues: string[] = [];

    let cardType: string | undefined;
    const foundTags: string[] = [];

    twitterTags.forEach(tag => {
      const name = tag.getAttribute('name');
      if (name) {
        foundTags.push(name);
        if (name === 'twitter:card') {
          cardType = tag.getAttribute('content') || undefined;
        }
      }
    });

    const requiredTags = ['twitter:card', 'twitter:title', 'twitter:description'];
    const missingTags = requiredTags.filter(tag => !foundTags.includes(tag));
    const completeness = ((requiredTags.length - missingTags.length) / requiredTags.length) * 100;

    if (!present) {
      issues.push('No Twitter Card tags found');
    } else {
      missingTags.forEach(tag => {
        issues.push(`Missing ${tag} tag`);
      });
    }

    return {
      present,
      cardType,
      completeness: Math.round(completeness),
      issues,
    };
  }

  /**
   * Analyze technical tags
   */
  private analyzeTechnicalTags(document: Document) {
    const canonical = !!document.querySelector('link[rel="canonical"]');
    const robots = !!document.querySelector('meta[name="robots"]');
    const viewport = !!document.querySelector('meta[name="viewport"]');
    const charset = !!document.querySelector('meta[charset]') || !!document.querySelector('meta[http-equiv="Content-Type"]');

    const issues: string[] = [];

    if (!canonical) {
      issues.push('Missing canonical URL');
    }

    if (!viewport) {
      issues.push('Missing viewport meta tag');
    }

    if (!charset) {
      issues.push('Missing charset declaration');
    }

    return {
      canonical,
      robots,
      viewport,
      charset,
      issues,
    };
  }

  /**
   * Calculate scores
   */
  private calculateScores(analysis: any) {
    // Basic SEO score
    let basicSEO = 0;
    if (analysis.title.present && analysis.title.isOptimal) basicSEO += 50;
    if (analysis.description.present && analysis.description.isOptimal) basicSEO += 50;

    // Social media score
    let socialMedia = 0;
    socialMedia += analysis.openGraph.completeness * 0.6;
    socialMedia += analysis.twitterCard.completeness * 0.4;

    // Technical score
    let technical = 0;
    if (analysis.technical.canonical) technical += 25;
    if (analysis.technical.viewport) technical += 25;
    if (analysis.technical.charset) technical += 25;
    if (analysis.technical.robots) technical += 25;

    // Overall score
    const overall = Math.round((basicSEO + socialMedia + technical) / 3);

    return {
      overall,
      basicSEO: Math.round(basicSEO),
      socialMedia: Math.round(socialMedia),
      technical: Math.round(technical),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analysis: any, scores: any): string[] {
    const recommendations: string[] = [];

    // Title recommendations
    if (analysis.title.issues.length > 0) {
      recommendations.push(...analysis.title.recommendations);
    }

    // Description recommendations
    if (analysis.description.issues.length > 0) {
      recommendations.push(...analysis.description.recommendations);
    }

    // Open Graph recommendations
    if (analysis.openGraph.completeness < 100) {
      recommendations.push('Complete Open Graph tags for better social media sharing');
      if (analysis.openGraph.missingTags.length > 0) {
        recommendations.push(`Add missing Open Graph tags: ${analysis.openGraph.missingTags.join(', ')}`);
      }
    }

    // Twitter Card recommendations
    if (analysis.twitterCard.completeness < 100) {
      recommendations.push('Add Twitter Card tags for better Twitter sharing');
    }

    // Technical recommendations
    if (analysis.technical.issues.length > 0) {
      recommendations.push(...analysis.technical.issues.map((issue: string) => `Fix: ${issue}`));
    }

    // Score-based recommendations
    if (scores.overall < 70) {
      recommendations.push('Improve overall meta tag optimization for better SEO performance');
    }

    if (scores.basicSEO < 80) {
      recommendations.push('Focus on optimizing title and description tags for better search visibility');
    }

    if (scores.socialMedia < 60) {
      recommendations.push('Add social media meta tags to improve sharing appearance');
    }

    return recommendations;
  }

  /**
   * Generate competitor comparison recommendations
   */
  private generateCompetitorRecommendations(
    titleLengthComparison: number,
    descriptionLengthComparison: number,
    keywordUsageComparison: number,
    socialMediaComparison: number
  ): string[] {
    const recommendations: string[] = [];

    if (titleLengthComparison < -10) {
      recommendations.push('Consider expanding your title to match competitor length');
    } else if (titleLengthComparison > 10) {
      recommendations.push('Consider shortening your title for better display in search results');
    }

    if (descriptionLengthComparison < -20) {
      recommendations.push('Expand your meta description to provide more compelling information');
    } else if (descriptionLengthComparison > 20) {
      recommendations.push('Shorten your meta description to avoid truncation in search results');
    }

    if (keywordUsageComparison < 0) {
      recommendations.push('Improve keyword usage in title and description to match competitors');
    }

    if (socialMediaComparison < 0) {
      recommendations.push('Add social media meta tags to match competitor social optimization');
    }

    if (titleLengthComparison === 0 && descriptionLengthComparison === 0 &&
        keywordUsageComparison >= 0 && socialMediaComparison >= 0) {
      recommendations.push('Your meta tags are well-optimized compared to competitors');
    }

    return recommendations;
  }
}

// Factory function
export const createMetaTagAnalyzer = (options?: MetaTagAnalysisOptions): MetaTagAnalyzer => {
  return new MetaTagAnalyzer(options);
};

// Default export
export default MetaTagAnalyzer;

// Legacy interface for backward compatibility
export interface MetaTags {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  schemaMarkupDetected: boolean;
}

// Legacy function for backward compatibility
export function analyzeMetaTags(html: string): MetaTags {
  if (!html) {
    return { schemaMarkupDetected: false };
  }

  const analyzer = new MetaTagAnalyzer();
  const result = analyzer.analyzeMetaTags(html);

  // Extract legacy format data
  const titleTag = result.tags.find(tag => tag.type === 'title');
  const descriptionTag = result.tags.find(tag => tag.type === 'description');
  const keywordsTag = result.tags.find(tag => tag.type === 'keywords');
  const canonicalTag = result.tags.find(tag => tag.type === 'canonical');

  const ogTags = result.tags.filter(tag => tag.type === 'og');
  const twitterTags = result.tags.filter(tag => tag.type === 'twitter');

  const metaTags: MetaTags = {
    title: titleTag?.content,
    description: descriptionTag?.content,
    keywords: keywordsTag?.content,
    canonicalUrl: canonicalTag?.content,
    schemaMarkupDetected: result.tags.some(tag => tag.type === 'schema'),
  };

  // Extract Open Graph tags
  ogTags.forEach(tag => {
    if (tag.property === 'og:title') metaTags.ogTitle = tag.content;
    if (tag.property === 'og:description') metaTags.ogDescription = tag.content;
    if (tag.property === 'og:image') metaTags.ogImage = tag.content;
    if (tag.property === 'og:url') metaTags.ogUrl = tag.content;
  });

  // Extract Twitter tags
  twitterTags.forEach(tag => {
    if (tag.name === 'twitter:card') metaTags.twitterCard = tag.content;
    if (tag.name === 'twitter:title') metaTags.twitterTitle = tag.content;
    if (tag.name === 'twitter:description') metaTags.twitterDescription = tag.content;
    if (tag.name === 'twitter:image') metaTags.twitterImage = tag.content;
  });

  return metaTags;
}