
import { JSDOM } from 'jsdom';

export interface LinkDistributionOptions {
  maxLinksPerPage?: number;
  maxLinksPerParagraph?: number;
  minDistanceBetweenLinks?: number;
  preferredLinkDensity?: number; // Links per 100 words
  avoidLinkClusters?: boolean;
  respectExistingLinks?: boolean;
  balanceAnchorTextTypes?: boolean;
}

export interface LinkToPlace {
  keyword: string;
  url: string;
  priority: number;
  anchorTextType: 'exact' | 'partial' | 'branded' | 'generic' | 'lsi';
  targetSection?: string;
}

export interface LinkPlacement {
  keyword: string;
  url: string;
  position: number;
  paragraph: number;
  section: string;
  confidence: number;
  reason: string;
}

export interface DistributionResult {
  optimizedContent: string;
  placedLinks: LinkPlacement[];
  skippedLinks: Array<{ link: LinkToPlace; reason: string }>;
  distributionScore: number;
  recommendations: string[];
  statistics: DistributionStatistics;
}

export interface DistributionStatistics {
  totalLinksPlaced: number;
  linkDensity: number;
  averageDistanceBetweenLinks: number;
  paragraphsWithLinks: number;
  sectionsWithLinks: number;
  anchorTextTypeDistribution: Record<string, number>;
}

export interface ContentSection {
  title: string;
  content: string;
  startPosition: number;
  endPosition: number;
  paragraphs: ContentParagraph[];
  importance: number;
}

export interface ContentParagraph {
  content: string;
  startPosition: number;
  endPosition: number;
  wordCount: number;
  existingLinks: number;
  linkCapacity: number;
}

/**
 * Advanced link distribution optimizer that balances internal links throughout
 * content for maximum SEO value while maintaining natural reading flow and
 * avoiding over-optimization penalties
 */
export class LinkDistributionOptimizer {
  private readonly defaultOptions: Required<LinkDistributionOptions> = {
    maxLinksPerPage: 100,
    maxLinksPerParagraph: 2,
    minDistanceBetweenLinks: 50, // words
    preferredLinkDensity: 2, // 2 links per 100 words
    avoidLinkClusters: true,
    respectExistingLinks: true,
    balanceAnchorTextTypes: true
  };

  /**
   * Optimize link distribution throughout content
   */
  optimizeLinkDistribution(
    content: string,
    links: LinkToPlace[],
    options: LinkDistributionOptions = {}
  ): DistributionResult {
    const opts = { ...this.defaultOptions, ...options };

    // Analyze content structure
    const sections = this.analyzeContentStructure(content);
    const existingLinks = this.extractExistingLinks(content);

    // Sort links by priority
    const sortedLinks = [...links].sort((a, b) => b.priority - a.priority);

    // Calculate optimal distribution
    const distributionPlan = this.calculateOptimalDistribution(
      sections,
      sortedLinks,
      existingLinks,
      opts
    );

    // Place links according to plan
    const placementResult = this.executeLinkPlacement(
      content,
      distributionPlan,
      opts
    );

    // Calculate statistics and recommendations
    const statistics = this.calculateDistributionStatistics(
      placementResult.placedLinks,
      content
    );
    const recommendations = this.generateRecommendations(
      statistics,
      placementResult.skippedLinks,
      opts
    );
    const distributionScore = this.calculateDistributionScore(statistics, opts);

    return {
      optimizedContent: placementResult.optimizedContent,
      placedLinks: placementResult.placedLinks,
      skippedLinks: placementResult.skippedLinks,
      distributionScore,
      recommendations,
      statistics
    };
  }

  /**
   * Simple link distribution (backward compatibility)
   */
  optimizeLinkDistributionSimple(
    content: string,
    links: { keyword: string; url: string }[]
  ): string {
    const linksToPLace: LinkToPlace[] = links.map((link, index) => ({
      ...link,
      priority: 1,
      anchorTextType: 'exact' as const
    }));

    const result = this.optimizeLinkDistribution(content, linksToPLace, {
      maxLinksPerParagraph: 1,
      balanceAnchorTextTypes: false
    });

    return result.optimizedContent;
  }

  /**
   * Analyze content structure for optimal link placement
   */
  private analyzeContentStructure(content: string): ContentSection[] {
    const sections: ContentSection[] = [];

    // Split content by headers
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = [...content.matchAll(headerRegex)];

    if (matches.length === 0) {
      // No headers, treat entire content as one section
      sections.push(this.createContentSection('Main Content', content, 0, content.length));
    } else {
      let lastPosition = 0;

      matches.forEach((match, index) => {
        const headerLevel = match[1].length;
        const headerTitle = match[2];
        const headerPosition = match.index!;

        // Add previous section if exists
        if (headerPosition > lastPosition) {
          const sectionContent = content.substring(lastPosition, headerPosition);
          if (sectionContent.trim()) {
            sections.push(this.createContentSection(
              `Section ${sections.length + 1}`,
              sectionContent,
              lastPosition,
              headerPosition
            ));
          }
        }

        // Determine section end
        const nextHeaderIndex = index + 1 < matches.length ? matches[index + 1].index! : content.length;
        const sectionContent = content.substring(headerPosition, nextHeaderIndex);

        sections.push(this.createContentSection(
          headerTitle,
          sectionContent,
          headerPosition,
          nextHeaderIndex
        ));

        lastPosition = nextHeaderIndex;
      });
    }

    return sections.filter(section => section.content.trim().length > 0);
  }

  /**
   * Create content section with paragraph analysis
   */
  private createContentSection(
    title: string,
    content: string,
    startPosition: number,
    endPosition: number
  ): ContentSection {
    const paragraphs = this.analyzeParagraphs(content, startPosition);
    const importance = this.calculateSectionImportance(title, content, startPosition);

    return {
      title,
      content,
      startPosition,
      endPosition,
      paragraphs,
      importance
    };
  }

  /**
   * Analyze paragraphs within content
   */
  private analyzeParagraphs(content: string, basePosition: number): ContentParagraph[] {
    const paragraphs: ContentParagraph[] = [];
    const paragraphTexts = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    let currentPosition = basePosition;

    paragraphTexts.forEach(paragraphText => {
      const trimmedText = paragraphText.trim();
      const wordCount = trimmedText.split(/\s+/).length;
      const existingLinks = (trimmedText.match(/<a\s+[^>]*href/gi) || []).length;
      const linkCapacity = Math.max(0, Math.floor(wordCount / 50) - existingLinks); // 1 link per 50 words

      const startPos = content.indexOf(trimmedText, currentPosition - basePosition) + basePosition;
      const endPos = startPos + trimmedText.length;

      paragraphs.push({
        content: trimmedText,
        startPosition: startPos,
        endPosition: endPos,
        wordCount,
        existingLinks,
        linkCapacity
      });

      currentPosition = endPos;
    });

    return paragraphs;
  }

  /**
   * Extract existing links from content
   */
  private extractExistingLinks(content: string): Array<{ url: string; text: string; position: number }> {
    const links: Array<{ url: string; text: string; position: number }> = [];
    const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        url: match[1],
        text: match[2],
        position: match.index
      });
    }

    return links;
  }

  /**
   * Calculate optimal distribution plan
   */
  private calculateOptimalDistribution(
    sections: ContentSection[],
    links: LinkToPlace[],
    existingLinks: Array<{ url: string; text: string; position: number }>,
    options: Required<LinkDistributionOptions>
  ): Array<{ link: LinkToPlace; section: ContentSection; paragraph: ContentParagraph; position: number }> {
    const distributionPlan: Array<{
      link: LinkToPlace;
      section: ContentSection;
      paragraph: ContentParagraph;
      position: number
    }> = [];

    // Calculate total content capacity
    const totalCapacity = sections.reduce((sum, section) =>
      sum + section.paragraphs.reduce((pSum, p) => pSum + p.linkCapacity, 0), 0
    );

    if (totalCapacity === 0) return distributionPlan;

    // Distribute links across sections based on importance and capacity
    const sectionAllocations = this.allocateLinksToSections(sections, links, options);

    sectionAllocations.forEach(allocation => {
      const { section, allocatedLinks } = allocation;

      allocatedLinks.forEach(link => {
        const bestParagraph = this.findBestParagraphForLink(section, link, existingLinks, options);

        if (bestParagraph) {
          const position = this.findOptimalPositionInParagraph(bestParagraph, link, options);

          distributionPlan.push({
            link,
            section,
            paragraph: bestParagraph,
            position
          });
        }
      });
    });

    return distributionPlan;
  }

  /**
   * Allocate links to sections based on relevance and capacity
   */
  private allocateLinksToSections(
    sections: ContentSection[],
    links: LinkToPlace[],
    options: Required<LinkDistributionOptions>
  ): Array<{ section: ContentSection; allocatedLinks: LinkToPlace[] }> {
    const allocations: Array<{ section: ContentSection; allocatedLinks: LinkToPlace[] }> = [];

    sections.forEach(section => {
      const sectionCapacity = section.paragraphs.reduce((sum, p) => sum + p.linkCapacity, 0);
      const relevantLinks = this.findRelevantLinksForSection(section, links);

      // Limit links based on section capacity and options
      const maxLinksForSection = Math.min(
        sectionCapacity,
        Math.floor(section.content.split(/\s+/).length * options.preferredLinkDensity / 100)
      );

      const allocatedLinks = relevantLinks.slice(0, maxLinksForSection);

      if (allocatedLinks.length > 0) {
        allocations.push({ section, allocatedLinks });
      }
    });

    return allocations;
  }

  /**
   * Find relevant links for a section
   */
  private findRelevantLinksForSection(section: ContentSection, links: LinkToPlace[]): LinkToPlace[] {
    return links.filter(link => {
      // Check if link's target section matches
      if (link.targetSection && !section.title.toLowerCase().includes(link.targetSection.toLowerCase())) {
        return false;
      }

      // Check if keyword appears in section content
      const keywordRegex = new RegExp(`\\b${this.escapeRegex(link.keyword)}\\b`, 'i');
      return keywordRegex.test(section.content);
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find best paragraph for link placement
   */
  private findBestParagraphForLink(
    section: ContentSection,
    link: LinkToPlace,
    existingLinks: Array<{ url: string; text: string; position: number }>,
    options: Required<LinkDistributionOptions>
  ): ContentParagraph | null {
    const candidateParagraphs = section.paragraphs.filter(p => {
      // Must have capacity
      if (p.linkCapacity <= 0) return false;

      // Must contain keyword
      const keywordRegex = new RegExp(`\\b${this.escapeRegex(link.keyword)}\\b`, 'i');
      if (!keywordRegex.test(p.content)) return false;

      // Check distance from existing links
      if (options.avoidLinkClusters) {
        const nearbyLinks = existingLinks.filter(existingLink =>
          Math.abs(existingLink.position - p.startPosition) < options.minDistanceBetweenLinks * 5 // Approximate word distance
        );
        if (nearbyLinks.length > 0) return false;
      }

      return true;
    });

    if (candidateParagraphs.length === 0) return null;

    // Score paragraphs and return the best one
    return candidateParagraphs.reduce((best, current) => {
      const bestScore = this.scoreParagraphForLink(best, link);
      const currentScore = this.scoreParagraphForLink(current, link);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Score paragraph suitability for link placement
   */
  private scoreParagraphForLink(paragraph: ContentParagraph, link: LinkToPlace): number {
    let score = 0;

    // Base score for having capacity
    score += paragraph.linkCapacity * 10;

    // Bonus for keyword frequency
    const keywordRegex = new RegExp(`\\b${this.escapeRegex(link.keyword)}\\b`, 'gi');
    const keywordMatches = paragraph.content.match(keywordRegex) || [];
    score += Math.min(keywordMatches.length * 5, 20); // Cap at 20 points

    // Bonus for paragraph length (longer paragraphs are better for links)
    score += Math.min(paragraph.wordCount / 10, 15);

    // Penalty for existing links
    score -= paragraph.existingLinks * 5;

    return score;
  }

  /**
   * Find optimal position within paragraph for link
   */
  private findOptimalPositionInParagraph(
    paragraph: ContentParagraph,
    link: LinkToPlace,
    options: Required<LinkDistributionOptions>
  ): number {
    const keywordRegex = new RegExp(`\\b${this.escapeRegex(link.keyword)}\\b`, 'i');
    const match = paragraph.content.match(keywordRegex);

    if (match && match.index !== undefined) {
      return paragraph.startPosition + match.index;
    }

    // Fallback to middle of paragraph
    return paragraph.startPosition + Math.floor(paragraph.content.length / 2);
  }

  /**
   * Execute link placement according to distribution plan
   */
  private executeLinkPlacement(
    content: string,
    distributionPlan: Array<{ link: LinkToPlace; section: ContentSection; paragraph: ContentParagraph; position: number }>,
    options: Required<LinkDistributionOptions>
  ): { optimizedContent: string; placedLinks: LinkPlacement[]; skippedLinks: Array<{ link: LinkToPlace; reason: string }> } {
    let optimizedContent = content;
    const placedLinks: LinkPlacement[] = [];
    const skippedLinks: Array<{ link: LinkToPlace; reason: string }> = [];

    // Sort by position (descending) to avoid position shifts during insertion
    const sortedPlan = distributionPlan.sort((a, b) => b.position - a.position);

    sortedPlan.forEach(({ link, section, paragraph, position }) => {
      try {
        const linkHtml = this.createLinkHtml(link);
        const keywordRegex = new RegExp(`\\b(${this.escapeRegex(link.keyword)})\\b`, 'i');

        // Find the keyword at the calculated position
        const beforePosition = optimizedContent.substring(0, position);
        const afterPosition = optimizedContent.substring(position);
        const keywordMatch = afterPosition.match(keywordRegex);

        if (keywordMatch && keywordMatch.index !== undefined) {
          const actualPosition = position + keywordMatch.index;
          const beforeLink = optimizedContent.substring(0, actualPosition);
          const afterLink = optimizedContent.substring(actualPosition + link.keyword.length);

          optimizedContent = beforeLink + linkHtml + afterLink;

          placedLinks.push({
            keyword: link.keyword,
            url: link.url,
            position: actualPosition,
            paragraph: section.paragraphs.indexOf(paragraph),
            section: section.title,
            confidence: 0.8, // Would calculate based on various factors
            reason: 'Optimal placement based on content analysis'
          });
        } else {
          skippedLinks.push({
            link,
            reason: 'Keyword not found at calculated position'
          });
        }
      } catch (error) {
        skippedLinks.push({
          link,
          reason: `Placement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    });

    return { optimizedContent, placedLinks, skippedLinks };
  }

  /**
   * Create HTML for link
   */
  private createLinkHtml(link: LinkToPlace): string {
    const sanitizedUrl = this.sanitizeUrl(link.url);
    const sanitizedKeyword = this.escapeHtml(link.keyword);

    return `<a href="${sanitizedUrl}" title="${sanitizedKeyword}">${link.keyword}</a>`;
  }

  /**
   * Calculate distribution statistics
   */
  private calculateDistributionStatistics(
    placedLinks: LinkPlacement[],
    content: string
  ): DistributionStatistics {
    const totalWords = content.split(/\s+/).length;
    const linkDensity = (placedLinks.length / totalWords) * 100;

    // Calculate average distance between links
    const positions = placedLinks.map(link => link.position).sort((a, b) => a - b);
    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      totalDistance += positions[i] - positions[i - 1];
    }
    const averageDistanceBetweenLinks = positions.length > 1 ? totalDistance / (positions.length - 1) : 0;

    // Count paragraphs and sections with links
    const paragraphsWithLinks = new Set(placedLinks.map(link => link.paragraph)).size;
    const sectionsWithLinks = new Set(placedLinks.map(link => link.section)).size;

    // Anchor text type distribution (simplified)
    const anchorTextTypeDistribution: Record<string, number> = {
      exact: placedLinks.length, // Simplified - all are exact for now
      partial: 0,
      branded: 0,
      generic: 0,
      lsi: 0
    };

    return {
      totalLinksPlaced: placedLinks.length,
      linkDensity,
      averageDistanceBetweenLinks,
      paragraphsWithLinks,
      sectionsWithLinks,
      anchorTextTypeDistribution
    };
  }

  /**
   * Generate recommendations based on distribution results
   */
  private generateRecommendations(
    statistics: DistributionStatistics,
    skippedLinks: Array<{ link: LinkToPlace; reason: string }>,
    options: Required<LinkDistributionOptions>
  ): string[] {
    const recommendations: string[] = [];

    if (statistics.linkDensity > options.preferredLinkDensity * 1.5) {
      recommendations.push('Link density is higher than recommended. Consider reducing the number of links.');
    }

    if (statistics.linkDensity < options.preferredLinkDensity * 0.5) {
      recommendations.push('Link density is lower than optimal. Consider adding more internal links.');
    }

    if (statistics.averageDistanceBetweenLinks < options.minDistanceBetweenLinks) {
      recommendations.push('Links are too close together. Increase spacing between links for better user experience.');
    }

    if (skippedLinks.length > 0) {
      recommendations.push(`${skippedLinks.length} links could not be placed. Review content for better keyword integration.`);
    }

    if (statistics.sectionsWithLinks < 2) {
      recommendations.push('Links are concentrated in few sections. Distribute links more evenly across content.');
    }

    return recommendations;
  }

  /**
   * Calculate overall distribution score
   */
  private calculateDistributionScore(
    statistics: DistributionStatistics,
    options: Required<LinkDistributionOptions>
  ): number {
    let score = 100;

    // Penalty for poor link density
    const densityDiff = Math.abs(statistics.linkDensity - options.preferredLinkDensity);
    score -= Math.min(densityDiff * 5, 30);

    // Penalty for poor distribution
    if (statistics.sectionsWithLinks < 2) score -= 20;
    if (statistics.averageDistanceBetweenLinks < options.minDistanceBetweenLinks) score -= 15;

    // Bonus for good distribution
    if (statistics.paragraphsWithLinks > 3) score += 10;
    if (statistics.sectionsWithLinks > 2) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  // Helper methods
  private calculateSectionImportance(title: string, content: string, position: number): number {
    let importance = 0.5; // Base importance

    // Higher importance for sections appearing earlier
    importance += Math.max(0, 0.3 - (position / 10000));

    // Higher importance for longer sections
    importance += Math.min(0.2, content.length / 5000);

    // Higher importance for sections with certain keywords
    const importantKeywords = ['introduction', 'overview', 'main', 'key', 'important', 'primary'];
    if (importantKeywords.some(keyword => title.toLowerCase().includes(keyword))) {
      importance += 0.2;
    }

    return Math.min(1, importance);
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return '#';
    }
  }

  private escapeHtml(text: string): string {
    const div = new JSDOM().window.document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
