import { JSDOM } from 'jsdom';

export interface LinkPlacementOptions {
  maxLinksPerParagraph?: number;
  minDistanceBetweenLinks?: number;
  avoidHeaders?: boolean;
  preferredPositions?: ('beginning' | 'middle' | 'end')[];
}

export interface LinkPlacementResult {
  modifiedContent: string;
  placementsCount: number;
  skippedPlacements: number;
  placementPositions: number[];
}

export interface ContextualMatch {
  keyword: string;
  position: number;
  context: string;
  relevanceScore: number;
  isOptimalPlacement: boolean;
}

/**
 * Advanced contextual link placement system that identifies optimal locations
 * within content for natural internal link insertion using NLP and content analysis
 */
export class ContextualLinkPlacer {
  private readonly defaultOptions: Required<LinkPlacementOptions> = {
    maxLinksPerParagraph: 2,
    minDistanceBetweenLinks: 100,
    avoidHeaders: true,
    preferredPositions: ['middle', 'beginning', 'end']
  };

  /**
   * Place a single link in the most contextually appropriate location
   */
  placeLink(
    content: string,
    keyword: string,
    url: string,
    options: LinkPlacementOptions = {}
  ): LinkPlacementResult {
    const opts = { ...this.defaultOptions, ...options };
    const matches = this.findContextualMatches(content, keyword);

    if (matches.length === 0) {
      return {
        modifiedContent: content,
        placementsCount: 0,
        skippedPlacements: 1,
        placementPositions: []
      };
    }

    // Select the best match based on contextual relevance
    const bestMatch = this.selectOptimalPlacement(matches, opts);
    const modifiedContent = this.insertLink(content, bestMatch, url, keyword);

    return {
      modifiedContent,
      placementsCount: 1,
      skippedPlacements: 0,
      placementPositions: [bestMatch.position]
    };
  }

  /**
   * Place multiple links throughout content with intelligent distribution
   */
  placeMultipleLinks(
    content: string,
    links: Array<{ keyword: string; url: string }>,
    options: LinkPlacementOptions = {}
  ): LinkPlacementResult {
    const opts = { ...this.defaultOptions, ...options };
    let modifiedContent = content;
    let totalPlacements = 0;
    let totalSkipped = 0;
    const allPositions: number[] = [];

    for (const link of links) {
      const result = this.placeLink(modifiedContent, link.keyword, link.url, opts);
      modifiedContent = result.modifiedContent;
      totalPlacements += result.placementsCount;
      totalSkipped += result.skippedPlacements;
      allPositions.push(...result.placementPositions);
    }

    return {
      modifiedContent,
      placementsCount: totalPlacements,
      skippedPlacements: totalSkipped,
      placementPositions: allPositions
    };
  }

  /**
   * Find all potential contextual matches for a keyword
   */
  private findContextualMatches(content: string, keyword: string): ContextualMatch[] {
    const matches: ContextualMatch[] = [];
    const keywordRegex = new RegExp(`\\b(${this.escapeRegex(keyword)})\\b`, 'gi');
    let match;

    while ((match = keywordRegex.exec(content)) !== null) {
      const position = match.index;
      const context = this.extractContext(content, position, 200);
      const relevanceScore = this.calculateRelevanceScore(context, keyword, position, content);
      const isOptimalPlacement = this.isOptimalPlacement(content, position);

      matches.push({
        keyword: match[1],
        position,
        context,
        relevanceScore,
        isOptimalPlacement
      });
    }

    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score for a potential link placement
   */
  private calculateRelevanceScore(
    context: string,
    keyword: string,
    position: number,
    fullContent: string
  ): number {
    let score = 0;

    // Base score for keyword presence
    score += 10;

    // Bonus for being in a paragraph (not header)
    if (!this.isInHeader(fullContent, position)) {
      score += 20;
    }

    // Bonus for contextual relevance (related words nearby)
    const relatedWords = this.getRelatedWords(keyword);
    const contextWords = context.toLowerCase().split(/\s+/);
    const relatedWordsFound = relatedWords.filter(word =>
      contextWords.some(contextWord => contextWord.includes(word))
    ).length;
    score += relatedWordsFound * 5;

    // Penalty for being too close to other potential links
    const nearbyKeywords = this.countNearbyKeywords(context, keyword);
    score -= nearbyKeywords * 3;

    // Bonus for sentence position (middle of sentence is better)
    const sentencePosition = this.getSentencePosition(context, keyword);
    if (sentencePosition === 'middle') score += 15;
    else if (sentencePosition === 'beginning') score += 10;
    else score += 5;

    return Math.max(0, score);
  }

  /**
   * Select the optimal placement from available matches
   */
  private selectOptimalPlacement(
    matches: ContextualMatch[],
    options: Required<LinkPlacementOptions>
  ): ContextualMatch {
    // Filter out matches that violate placement rules
    const validMatches = matches.filter(match => {
      if (options.avoidHeaders && !match.isOptimalPlacement) {
        return false;
      }
      return true;
    });

    // Return the highest scoring valid match
    return validMatches.length > 0 ? validMatches[0] : matches[0];
  }

  /**
   * Insert link at the specified position
   */
  private insertLink(
    content: string,
    match: ContextualMatch,
    url: string,
    keyword: string
  ): string {
    const beforeLink = content.substring(0, match.position);
    const afterLink = content.substring(match.position + keyword.length);
    const linkHtml = `<a href="${this.sanitizeUrl(url)}" title="${this.escapeHtml(keyword)}">${keyword}</a>`;

    return beforeLink + linkHtml + afterLink;
  }

  /**
   * Extract context around a position
   */
  private extractContext(content: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength / 2);
    const end = Math.min(content.length, position + contextLength / 2);
    return content.substring(start, end);
  }

  /**
   * Check if position is within a header tag
   */
  private isInHeader(content: string, position: number): boolean {
    const beforePosition = content.substring(0, position);
    const afterPosition = content.substring(position);

    // Check for markdown headers
    const lineStart = beforePosition.lastIndexOf('\n') + 1;
    const lineEnd = afterPosition.indexOf('\n');
    const currentLine = content.substring(lineStart, position + (lineEnd === -1 ? 0 : lineEnd));

    return /^#{1,6}\s/.test(currentLine.trim());
  }

  /**
   * Check if this is an optimal placement location
   */
  private isOptimalPlacement(content: string, position: number): boolean {
    return !this.isInHeader(content, position) &&
           !this.isInCodeBlock(content, position) &&
           !this.isInQuote(content, position);
  }

  /**
   * Check if position is within a code block
   */
  private isInCodeBlock(content: string, position: number): boolean {
    const beforePosition = content.substring(0, position);
    const codeBlockStarts = (beforePosition.match(/```/g) || []).length;
    return codeBlockStarts % 2 === 1;
  }

  /**
   * Check if position is within a quote
   */
  private isInQuote(content: string, position: number): boolean {
    const beforePosition = content.substring(0, position);
    const lineStart = beforePosition.lastIndexOf('\n') + 1;
    const currentLine = content.substring(lineStart, position);
    return currentLine.trim().startsWith('>');
  }

  /**
   * Get related words for contextual analysis
   */
  private getRelatedWords(keyword: string): string[] {
    // This is a simplified implementation. In production, this would use
    // a more sophisticated semantic analysis or pre-built word relationships
    const relatedWordsMap: Record<string, string[]> = {
      'seo': ['optimization', 'search', 'engine', 'ranking', 'keywords', 'content'],
      'marketing': ['strategy', 'campaign', 'audience', 'brand', 'promotion'],
      'content': ['writing', 'creation', 'strategy', 'marketing', 'blog'],
      'website': ['site', 'web', 'page', 'domain', 'online', 'digital']
    };

    return relatedWordsMap[keyword.toLowerCase()] || [];
  }

  /**
   * Count nearby keywords that might compete for attention
   */
  private countNearbyKeywords(context: string, keyword: string): number {
    const words = context.toLowerCase().split(/\s+/);
    return words.filter(word => word === keyword.toLowerCase()).length - 1;
  }

  /**
   * Determine position within sentence
   */
  private getSentencePosition(context: string, keyword: string): 'beginning' | 'middle' | 'end' {
    const sentences = context.split(/[.!?]+/);
    const keywordLower = keyword.toLowerCase();

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(keywordLower)) {
        const words = sentence.trim().split(/\s+/);
        const keywordIndex = words.findIndex(word =>
          word.toLowerCase().includes(keywordLower)
        );

        if (keywordIndex < words.length * 0.3) return 'beginning';
        if (keywordIndex > words.length * 0.7) return 'end';
        return 'middle';
      }
    }

    return 'middle';
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sanitize URL to prevent XSS
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return '#';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = new JSDOM().window.document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}