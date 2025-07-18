/**
 * Content Structure Analysis System for SEO Automation App
 * Analyzes content organization, flow, and structural patterns for SEO optimization
 */

import { z } from 'zod';
import { countWords } from './word-count'; // Assuming word-count.ts exists and exports countWords
import { calculateKeywordDensity } from './keyword-analyzer'; // Assuming keyword-analyzer.ts exists

export interface ContentSection {
  type: 'introduction' | 'main_content' | 'conclusion' | 'sidebar' | 'navigation' | 'footer' | 'unknown';
  content: string;
  wordCount: number;
  headings: Array<{ level: number; text: string }>;
  keywordDensity: number;
  position: number; // Index of the section in the content
}

export interface ContentPattern {
  type: 'list' | 'numbered_list' | 'table' | 'quote' | 'code' | 'faq' | 'steps' | 'comparison' | 'testimonial' | 'image_gallery' | 'video_embed';
  count: number;
  examples: string[];
  seoValue: number; // 0-100
}

export interface ContentFlow {
  sections: ContentSection[];
  transitions: Array<{
    from: string; // Heading text or section type
    to: string;   // Heading text or section type
    strength: number; // 0-100, based on semantic connection
    keywords: string[]; // Keywords linking the sections
  }>;
  logicalProgression: boolean; // True if sections follow a logical order
  topicCoverage: number; // 0-100, how comprehensively the topic is covered
}

export interface ContentHierarchy {
  depth: number;
  balance: number; // 0-100, even distribution of headings
  consistency: number; // 0-100, consistent use of heading levels
  issues: string[]; // e.g., "Skipped H2 after H1"
}

export interface ContentSEOAnalysis {
  hasIntroduction: boolean;
  hasConclusion: boolean;
  hasCallToAction: boolean;
  keywordDistribution: Array<{
    section: string;
    density: number;
    prominence: number;
  }>;
  internalLinking: {
    count: number;
    distribution: number; // 0-100, how evenly links are distributed
    anchorTextQuality: number; // 0-100, relevance of anchor texts
  };
  metaTagsPresent: boolean;
  schemaMarkupDetected: boolean;
}

export interface ContentStructureAnalysisResult {
  overview: {
    totalSections: number;
    averageSectionLength: number;
    structureScore: number; // 0-100
    readabilityScore: number; // 0-100 (from word-analysis)
    seoOptimization: number; // 0-100
  };
  sections: ContentSection[];
  patterns: ContentPattern[];
  flow: ContentFlow;
  hierarchy: ContentHierarchy;
  seoAnalysis: ContentSEOAnalysis;
  recommendations: string[];
}

export interface ContentStructureAnalysisOptions {
  primaryKeyword?: string;
  targetKeywords?: string[];
  minSectionLength?: number;
  maxSectionLength?: number;
  analyzeKeywordDistribution?: boolean;
  checkInternalLinking?: boolean;
  language?: string;
}

const DEFAULT_OPTIONS: Required<ContentStructureAnalysisOptions> = {
  primaryKeyword: '',
  targetKeywords: [],
  minSectionLength: 100,
  maxSectionLength: 2000,
  analyzeKeywordDistribution: true,
  checkInternalLinking: true,
  language: 'en',
};

export class ContentStructureAnalyzer {
  private options: Required<ContentStructureAnalysisOptions>;

  constructor(options: ContentStructureAnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze content structure
   */
  analyzeStructure(content: string, headings: Array<{ level: number; text: string; position: number }>): ContentStructureAnalysisResult {
    const cleanContent = this.cleanContent(content);

    // Extract sections
    const sections = this.extractSections(cleanContent, headings);

    // Identify patterns
    const patterns = this.identifyPatterns(cleanContent);

    // Analyze content flow
    const flow = this.analyzeContentFlow(sections, headings, cleanContent);

    // Analyze hierarchy
    const hierarchy = this.analyzeHierarchy(headings);

    // Perform SEO analysis
    const seoAnalysis = this.performSEOAnalysis(sections, cleanContent);

    // Calculate overview metrics
    const overview = this.calculateOverview(sections, patterns, flow, hierarchy, seoAnalysis);

    // Generate recommendations
    const recommendations = this.generateRecommendations(overview, sections, patterns, flow, hierarchy, seoAnalysis);

    return {
      overview,
      sections,
      patterns,
      flow,
      hierarchy,
      seoAnalysis,
      recommendations,
    };
  }

  /**
   * Clean content for analysis
   */
  private cleanContent(content: string): string {
    // Remove multiple spaces, trim, etc.
    return content
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract content sections based on headings
   */
  private extractSections(content: string, headings: Array<{ level: number; text: string; position: number }>): ContentSection[] {
    const sections: ContentSection[] = [];
    let currentContent = content;
    let currentPositionOffset = 0;

    if (!headings || headings.length === 0) {
      // No headings - treat as single main content section
      sections.push({
        type: 'main_content',
        content: currentContent,
        wordCount: countWords(currentContent),
        headings: [],
        keywordDensity: this.calculateKeywordDensity(currentContent),
        position: 0,
      });
      return sections;
    }

    // Handle content before the first heading
    if (headings[0].position > 0) {
      const introContent = content.substring(0, headings[0].position).trim();
      if (introContent.length > 0) {
        sections.push({
          type: 'introduction',
          content: introContent,
          wordCount: countWords(introContent),
          headings: [],
          keywordDensity: this.calculateKeywordDensity(introContent),
          position: 0,
        });
      }
    }

    // Process sections based on headings
    headings.forEach((heading, index) => {
      const startOfSection = heading.position;
      const endOfSection = (index + 1 < headings.length) ? headings[index + 1].position : content.length;
      
      const sectionContent = content.substring(startOfSection, endOfSection).trim();
      const sectionType = this.classifySectionType(heading.text, sectionContent, index, headings.length);

      if (sectionContent.length > 0) {
        sections.push({
          type: sectionType,
          content: sectionContent,
          wordCount: countWords(sectionContent),
          headings: [{ level: heading.level, text: heading.text }], // Only include the main heading for this section
          keywordDensity: this.calculateKeywordDensity(sectionContent),
          position: sections.length, // Assign a new position based on sections array
        });
      }
    });

    return sections;
  }

  /**
   * Classify section type based on heading and content
   */
  private classifySectionType(headingText: string, content: string, position: number, totalHeadings: number): ContentSection['type'] {
    const lowerHeading = headingText.toLowerCase();

    // Introduction indicators
    if (position === 0 && (lowerHeading.includes('introduction') || lowerHeading.includes('overview') || lowerHeading.includes('what is'))) {
      return 'introduction';
    }

    // Conclusion indicators
    if (position === totalHeadings - 1 && (lowerHeading.includes('conclusion') || lowerHeading.includes('summary') || lowerHeading.includes('final thoughts'))) {
      return 'conclusion';
    }

    // FAQ indicators
    if (lowerHeading.includes('faq') || lowerHeading.includes('frequently asked questions')) {
      return 'main_content'; // FAQs are usually main content
    }

    // Very basic check for navigation/footer/sidebar based on common keywords
    if (lowerHeading.includes('menu') || lowerHeading.includes('navigation') || lowerHeading.includes('links')) {
      return 'navigation';
    }
    if (lowerHeading.includes('footer') || lowerHeading.includes('contact us') || lowerHeading.includes('privacy policy')) {
      return 'footer';
    }
    if (lowerHeading.includes('sidebar') || lowerHeading.includes('related posts') || lowerHeading.includes('recent articles')) {
      return 'sidebar';
    }

    return 'main_content';
  }

  /**
   * Calculate keyword density for content
   */
  private calculateKeywordDensity(content: string): number {
    if (!this.options.primaryKeyword) return 0;
    return calculateKeywordDensity(content, this.options.primaryKeyword);
  }

  /**
   * Identify content patterns (lists, tables, quotes, etc.)
   */
  private identifyPatterns(content: string): ContentPattern[] {
    const patterns: ContentPattern[] = [];

    // Lists (unordered and ordered)
    const listMatches = content.match(/^(?:\s*[-*+]\s+.+|\s*\d+\.\s+.+)$/gm) || [];
    if (listMatches.length > 0) {
      patterns.push({
        type: 'list',
        count: listMatches.length,
        examples: listMatches.slice(0, 3),
        seoValue: 75,
      });
    }

    // Tables (simplified detection based on markdown table syntax)
    const tableMatches = content.match(/\|.+\|\n\|[-:]+\|/g) || [];
    if (tableMatches.length > 0) {
      patterns.push({
        type: 'table',
        count: tableMatches.length,
        examples: tableMatches.slice(0, 1),
        seoValue: 85,
      });
    }

    // Quotes
    const quoteMatches = content.match(/^>\s+.+$/gm) || [];
    if (quoteMatches.length > 0) {
      patterns.push({
        type: 'quote',
        count: quoteMatches.length,
        examples: quoteMatches.slice(0, 3),
        seoValue: 70,
      });
    }

    // Code blocks
    const codeMatches = content.match(/```[\s\S]*?```/g) || [];
    if (codeMatches.length > 0) {
      patterns.push({
        type: 'code',
        count: codeMatches.length,
        examples: codeMatches.slice(0, 1).map(code => code.substring(0, 100) + '...'),
        seoValue: 60,
      });
    }

    // FAQ patterns (simple Q&A)
    const faqMatches = content.match(/(?:Q:|Question:)[\s\S]*?(?:A:|Answer:)/gi) || [];
    if (faqMatches.length > 0) {
      patterns.push({
        type: 'faq',
        count: faqMatches.length,
        examples: faqMatches.slice(0, 3),
        seoValue: 90,
      });
    }

    // Steps/How-to
    const stepMatches = content.match(/(?:Step \d+|How to|First, |Next, |Finally, ).+/gi) || [];
    if (stepMatches.length > 0) {
      patterns.push({
        type: 'steps',
        count: stepMatches.length,
        examples: stepMatches.slice(0, 3),
        seoValue: 85,
      });
    }

    // Image galleries (placeholder - would need HTML parsing)
    // const imageGalleryMatches = content.match(/<div class="image-gallery">/g) || [];
    // if (imageGalleryMatches.length > 0) {
    //   patterns.push({
    //     type: 'image_gallery',
    //     count: imageGalleryMatches.length,
    //     examples: ['Detected image gallery structure'],
    //     seoValue: 80,
    //   });
    // }

    // Video embeds (placeholder - would need HTML parsing)
    // const videoEmbedMatches = content.match(/<iframe src="https:\/\/(?:www\.youtube\.com|player\.vimeo\.com)\/embed\//g) || [];
    // if (videoEmbedMatches.length > 0) {
    //   patterns.push({
    //     type: 'video_embed',
    //     count: videoEmbedMatches.length,
    //     examples: ['Detected video embed'],
    //     seoValue: 90,
    //   });
    // }

    return patterns;
  }

  /**
   * Analyze content flow and logical progression
   */
  private analyzeContentFlow(sections: ContentSection[], headings: Array<{ level: number; text: string; position: number }>, fullContent: string): ContentFlow {
    const transitions: ContentFlow['transitions'] = [];
    let logicalProgression = true;
    let topicCoverageScore = 0;

    // Simple logical progression: check if sections generally follow H1 -> H2 -> H3...
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1) {
        logicalProgression = false; // Skipped a level
        break;
      }
    }

    // Topic coverage: very basic, based on number of main content sections
    const mainContentSections = sections.filter(s => s.type === 'main_content');
    if (mainContentSections.length > 3) { // Arbitrary threshold for good coverage
      topicCoverageScore = 75;
    } else if (mainContentSections.length > 0) {
      topicCoverageScore = 50;
    }

    // Analyze transitions between sections (simplified)
    for (let i = 0; i < sections.length - 1; i++) {
      const fromSection = sections[i];
      const toSection = sections[i + 1];
      
      // For simplicity, keywords are just the primary keyword if present in both sections
      const transitionKeywords: string[] = [];
      if (this.options.primaryKeyword && fromSection.content.includes(this.options.primaryKeyword) && toSection.content.includes(this.options.primaryKeyword)) {
        transitionKeywords.push(this.options.primaryKeyword);
      }

      transitions.push({
        from: fromSection.headings.length > 0 ? fromSection.headings[0].text : fromSection.type,
        to: toSection.headings.length > 0 ? toSection.headings[0].text : toSection.type,
        strength: 70, // Placeholder, would need semantic analysis
        keywords: transitionKeywords,
      });
    }

    return {
      sections, // Re-use the sections array
      transitions,
      logicalProgression,
      topicCoverage: topicCoverageScore,
    };
  }

  /**
   * Analyze heading hierarchy
   */
  private analyzeHierarchy(headings: Array<{ level: number; text: string; position: number }>): ContentHierarchy {
    let depth = 0;
    let balanceScore = 100;
    let consistencyScore = 100;
    const issues: string[] = [];

    if (headings.length === 0) {
      return { depth: 0, balance: 0, consistency: 0, issues: ['No headings found.'] };
    }

    // Calculate depth
    depth = Math.max(...headings.map(h => h.level));

    // Check for skipped heading levels (e.g., H1 directly to H3)
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1) {
        issues.push(`Skipped heading level: H${headings[i - 1].level} followed by H${headings[i].level}`);
        consistencyScore -= 20; // Penalize inconsistency
      }
    }

    // Check for multiple H1s
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count > 1) {
      issues.push(`Multiple H1 headings found (${h1Count}). Only one H1 is recommended.`);
      consistencyScore -= 20;
    } else if (h1Count === 0) {
      issues.push('No H1 heading found. An H1 is recommended for main topic.');
      consistencyScore -= 20;
    }

    // Balance: Check distribution of heading levels (simplified)
    const levelCounts: Record<number, number> = {};
    headings.forEach(h => {
      levelCounts[h.level] = (levelCounts[h.level] || 0) + 1;
    });

    // If only H1s and H2s, balance might be lower than if H3s, H4s are also used
    if (depth > 2 && (levelCounts[3] === undefined || levelCounts[4] === undefined)) {
      balanceScore -= 20; // Encourage deeper hierarchy for complex topics
    }

    consistencyScore = Math.max(0, consistencyScore);
    balanceScore = Math.max(0, balanceScore);

    return {
      depth,
      balance: balanceScore,
      consistency: consistencyScore,
      issues,
    };
  }

  /**
   * Perform SEO-specific analysis on content structure
   */
  private performSEOAnalysis(sections: ContentSection[], fullContent: string): ContentSEOAnalysis {
    let hasIntroduction = false;
    let hasConclusion = false;
    let hasCallToAction = false;
    const keywordDistribution: ContentSEOAnalysis['keywordDistribution'] = [];
    let internalLinkCount = 0;
    let internalLinkDistribution = 0; // Placeholder
    let anchorTextQuality = 0; // Placeholder

    // Check for introduction and conclusion sections
    hasIntroduction = sections.some(s => s.type === 'introduction');
    hasConclusion = sections.some(s => s.type === 'conclusion');

    // Check for Call to Action (simplified)
    if (fullContent.toLowerCase().includes('learn more') || fullContent.toLowerCase().includes('buy now') || fullContent.toLowerCase().includes('sign up')) {
      hasCallToAction = true;
    }

    // Keyword distribution per section
    sections.forEach(section => {
      if (this.options.primaryKeyword) {
        keywordDistribution.push({
          section: section.headings.length > 0 ? section.headings[0].text : section.type,
          density: section.keywordDensity,
          prominence: 0, // This would require more detailed analysis within each section
        });
      }
    });

    // Internal linking (simplified - just count links for now)
    const internalLinks = (fullContent.match(/<a\s+(?:[^>]*?\s+)?href=["'](?!(?:http|ftp)s?:\/\/)[^"']+["']/gi) || []).length;
    internalLinkCount = internalLinks;
    // Further analysis needed for distribution and anchor text quality

    // Meta tags and schema markup detection (simplified - assumes external analysis or presence)
    const metaTagsPresent = true; // Assumed from meta-tag-analyzer
    const schemaMarkupDetected = fullContent.includes('<script type="application/ld+json">'); // Simple check

    return {
      hasIntroduction,
      hasConclusion,
      hasCallToAction,
      keywordDistribution,
      internalLinking: {
        count: internalLinkCount,
        distribution: internalLinkDistribution,
        anchorTextQuality: anchorTextQuality,
      },
      metaTagsPresent,
      schemaMarkupDetected,
    };
  }

  /**
   * Calculate overall overview metrics
   */
  private calculateOverview(
    sections: ContentSection[],
    patterns: ContentPattern[],
    flow: ContentFlow,
    hierarchy: ContentHierarchy,
    seoAnalysis: ContentSEOAnalysis
  ): ContentStructureAnalysisResult['overview'] {
    const totalSections = sections.length;
    const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);
    const averageSectionLength = totalSections > 0 ? totalWordCount / totalSections : 0;

    // Structure Score: Combine hierarchy, flow, and pattern usage
    let structureScore = 0;
    structureScore += hierarchy.balance * 0.3;
    structureScore += hierarchy.consistency * 0.3;
    if (flow.logicalProgression) structureScore += 20;
    if (patterns.length > 0) structureScore += 20;
    structureScore = Math.min(100, structureScore);

    // Readability Score: Placeholder, would come from word-analysis
    const readabilityScore = 70; // Assuming average readability

    // SEO Optimization Score: Combine various SEO aspects
    let seoOptimization = 0;
    if (seoAnalysis.hasIntroduction) seoOptimization += 10;
    if (seoAnalysis.hasConclusion) seoOptimization += 10;
    if (seoAnalysis.hasCallToAction) seoOptimization += 10;
    if (seoAnalysis.metaTagsPresent) seoOptimization += 10;
    if (seoAnalysis.schemaMarkupDetected) seoOptimization += 10;
    seoOptimization += (seoAnalysis.internalLinking.count > 0 ? 20 : 0); // Basic internal linking score
    // Add more based on keyword distribution, prominence etc.
    seoOptimization = Math.min(100, seoOptimization);

    return {
      totalSections,
      averageSectionLength,
      structureScore,
      readabilityScore,
      seoOptimization,
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    overview: ContentStructureAnalysisResult['overview'],
    sections: ContentSection[],
    patterns: ContentPattern[],
    flow: ContentFlow,
    hierarchy: ContentHierarchy,
    seoAnalysis: ContentSEOAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (hierarchy.issues.length > 0) {
      recommendations.push(`Address heading hierarchy issues: ${hierarchy.issues.join(', ')}`);
    }
    if (!flow.logicalProgression) {
      recommendations.push('Improve logical progression of content sections. Ensure a clear flow from one topic to the next.');
    }
    if (flow.topicCoverage < 70) {
      recommendations.push('Consider expanding topic coverage. Add more detailed sections or sub-topics.');
    }
    if (!seoAnalysis.hasIntroduction) {
      recommendations.push('Add a clear introduction section to set context for the reader.');
    }
    if (!seoAnalysis.hasConclusion) {
      recommendations.push('Include a concise conclusion to summarize key takeaways.');
    }
    if (!seoAnalysis.hasCallToAction) {
      recommendations.push('Consider adding a clear Call to Action (CTA) to guide user behavior.');
    }
    if (seoAnalysis.internalLinking.count === 0) {
      recommendations.push('Add internal links to relevant pages on your site to improve SEO and user navigation.');
    }
    if (!seoAnalysis.schemaMarkupDetected) {
      recommendations.push('Implement relevant Schema Markup (e.g., Article, FAQPage) to enhance search engine understanding.');
    }
    if (overview.averageSectionLength < this.options.minSectionLength) {
      recommendations.push(`Some sections might be too short. Consider expanding content to at least ${this.options.minSectionLength} words per main section.`);
    }
    if (overview.averageSectionLength > this.options.maxSectionLength) {
      recommendations.push(`Some sections might be too long. Consider breaking down lengthy sections into smaller, more digestible parts (e.g., using more subheadings).`);
    }
    if (patterns.length < 3) { // Arbitrary threshold for pattern variety
      recommendations.push('Vary content patterns (e.g., add lists, tables, quotes, or FAQs) to improve readability and engagement.');
    }

    return recommendations;
  }
}