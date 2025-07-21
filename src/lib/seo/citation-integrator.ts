import { URL } from 'url';

export interface Citation {
  text: string; // The text that needs a citation
  source: string; // The source of the information (e.g., URL, book title)
  format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'url'; // Citation style
  formattedCitation?: string; // The generated formatted citation
  author?: string; // Author name if available
  title?: string; // Title of the source
  year?: number; // Publication year
  accessDate?: Date; // Date accessed for web sources
  doi?: string; // DOI if available
  isbn?: string; // ISBN for books
}

export interface CitationIntegrationOptions {
  style?: Citation['format'];
  includeAccessDate?: boolean;
  linkCitations?: boolean;
  validateSources?: boolean;
  maxCitationsPerParagraph?: number;
  preferInlineCitations?: boolean;
}

export interface CitationIntegrationResult {
  content: string;
  citationsAdded: number;
  citationsSkipped: number;
  bibliography: string[];
  warnings: string[];
  recommendations: string[];
}

export interface SourceMetadata {
  url?: string;
  title?: string;
  author?: string;
  publishDate?: Date;
  domain?: string;
  isAuthoritative?: boolean;
  credibilityScore?: number;
}

/**
 * Advanced citation integration system that includes proper attribution and
 * reference formatting for authoritative sources with support for multiple
 * citation styles and automatic source validation
 */
export class CitationIntegrator {
  private readonly defaultOptions: Required<CitationIntegrationOptions> = {
    style: 'apa',
    includeAccessDate: true,
    linkCitations: true,
    validateSources: true,
    maxCitationsPerParagraph: 3,
    preferInlineCitations: true
  };

  private citationCounter = 1;
  private bibliography: Map<string, Citation> = new Map();

  /**
   * Integrates citations into content with comprehensive formatting and validation
   */
  integrateCitations(
    content: string,
    citations: Citation[],
    options: CitationIntegrationOptions = {}
  ): CitationIntegrationResult {
    const opts = { ...this.defaultOptions, ...options };
    this.citationCounter = 1;
    this.bibliography.clear();

    let modifiedContent = content;
    let citationsAdded = 0;
    let citationsSkipped = 0;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate and process citations
    const validatedCitations = this.validateCitations(citations, opts);

    // Sort citations by text length (longer first) to avoid partial replacements
    const sortedCitations = validatedCitations.sort((a, b) => b.text.length - a.text.length);

    for (const citation of sortedCitations) {
      try {
        const result = this.integrateSingleCitation(modifiedContent, citation, opts);

        if (result.success) {
          modifiedContent = result.content;
          citationsAdded++;
          this.bibliography.set(citation.source, citation);
        } else {
          citationsSkipped++;
          warnings.push(`Failed to integrate citation for "${citation.text}": ${result.reason}`);
        }
      } catch (error) {
        citationsSkipped++;
        warnings.push(`Error integrating citation for "${citation.text}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Generate bibliography
    const bibliography = this.generateBibliography(Array.from(this.bibliography.values()), opts.style);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(citationsAdded, citationsSkipped, content));

    return {
      content: modifiedContent,
      citationsAdded,
      citationsSkipped,
      bibliography,
      warnings,
      recommendations
    };
  }

  /**
   * Automatically detect claims that need citations
   */
  detectClaimsNeedingCitations(content: string): string[] {
    const claims: string[] = [];

    // Patterns that typically need citations
    const claimPatterns = [
      /studies show that/gi,
      /research indicates/gi,
      /according to experts/gi,
      /data reveals/gi,
      /statistics show/gi,
      /\d+% of/gi, // Percentage claims
      /in \d{4}/gi, // Year references
      /recent findings/gi,
      /evidence suggests/gi
    ];

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();

      // Check if sentence contains claim patterns
      const needsCitation = claimPatterns.some(pattern => pattern.test(trimmedSentence));

      // Check if sentence already has a citation
      const hasCitation = /\[[^\]]+\]|\([^)]+\)|\{[^}]+\}/.test(trimmedSentence);

      if (needsCitation && !hasCitation && trimmedSentence.length > 20) {
        claims.push(trimmedSentence);
      }
    });

    return claims;
  }

  /**
   * Extract source metadata from URL
   */
  async extractSourceMetadata(url: string): Promise<SourceMetadata> {
    const metadata: SourceMetadata = { url };

    try {
      const urlObj = new URL(url);
      metadata.domain = urlObj.hostname;

      // Determine if source is authoritative based on domain
      metadata.isAuthoritative = this.isAuthoritativeDomain(urlObj.hostname);
      metadata.credibilityScore = this.calculateDomainCredibility(urlObj.hostname);

      // In a real implementation, this would fetch and parse the page
      // For now, we'll extract basic info from the URL
      const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
      if (pathSegments.length > 0) {
        metadata.title = pathSegments[pathSegments.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]+$/, '') // Remove file extension
          .replace(/\b\w/g, l => l.toUpperCase()); // Title case
      }

    } catch (error) {
      // Invalid URL, treat as non-web source
      metadata.title = url;
      metadata.isAuthoritative = false;
      metadata.credibilityScore = 30;
    }

    return metadata;
  }

  /**
   * Validate citations before integration
   */
  private validateCitations(
    citations: Citation[],
    options: Required<CitationIntegrationOptions>
  ): Citation[] {
    return citations.filter(citation => {
      // Basic validation
      if (!citation.text || !citation.source) {
        return false;
      }

      // URL validation for web sources
      if (citation.source.startsWith('http')) {
        try {
          new URL(citation.source);
        } catch {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Integrate a single citation into content
   */
  private integrateSingleCitation(
    content: string,
    citation: Citation,
    options: Required<CitationIntegrationOptions>
  ): { success: boolean; content: string; reason?: string } {

    // Check if text exists in content
    const textRegex = new RegExp(this.escapeRegExp(citation.text), 'gi');
    const matches = content.match(textRegex);

    if (!matches) {
      return {
        success: false,
        content,
        reason: 'Citation text not found in content'
      };
    }

    // Format the citation
    const formattedCitation = this.formatCitation(citation, options.style);
    citation.formattedCitation = formattedCitation;

    // Find the best location to insert citation
    const insertionResult = this.findOptimalInsertionPoint(content, citation.text, options);

    if (!insertionResult.success) {
      return {
        success: false,
        content,
        reason: insertionResult.reason
      };
    }

    // Insert citation
    const modifiedContent = this.insertCitationAtPosition(
      content,
      citation.text,
      formattedCitation,
      insertionResult.position!,
      options
    );

    return { success: true, content: modifiedContent };
  }

  /**
   * Format a citation according to the specified style
   */
  private formatCitation(citation: Citation, style: Citation['format']): string {
    const citationNumber = this.citationCounter++;

    switch (style) {
      case 'apa':
        return this.formatAPACitation(citation);

      case 'mla':
        return this.formatMLACitation(citation);

      case 'chicago':
        return this.formatChicagoCitation(citation);

      case 'ieee':
        return this.formatIEEECitation(citation, citationNumber);

      case 'harvard':
        return this.formatHarvardCitation(citation);

      case 'url':
      default:
        return this.formatURLCitation(citation);
    }
  }

  /**
   * Format APA style citation
   */
  private formatAPACitation(citation: Citation): string {
    if (citation.source.startsWith('http')) {
      const domain = this.extractDomain(citation.source);
      const year = citation.year || new Date().getFullYear();
      const author = citation.author || domain;

      return ` (${author}, ${year})`;
    }

    const author = citation.author || 'Unknown Author';
    const year = citation.year || new Date().getFullYear();
    return ` (${author}, ${year})`;
  }

  /**
   * Format MLA style citation
   */
  private formatMLACitation(citation: Citation): string {
    if (citation.author) {
      return ` (${citation.author})`;
    }

    if (citation.source.startsWith('http')) {
      const domain = this.extractDomain(citation.source);
      return ` (${domain})`;
    }

    return ` (${citation.source})`;
  }

  /**
   * Format Chicago style citation
   */
  private formatChicagoCitation(citation: Citation): string {
    const citationNumber = this.citationCounter;
    return `<sup>${citationNumber}</sup>`;
  }

  /**
   * Format IEEE style citation
   */
  private formatIEEECitation(citation: Citation, number: number): string {
    return `[${number}]`;
  }

  /**
   * Format Harvard style citation
   */
  private formatHarvardCitation(citation: Citation): string {
    const author = citation.author || this.extractDomain(citation.source);
    const year = citation.year || new Date().getFullYear();
    return ` (${author} ${year})`;
  }

  /**
   * Format URL style citation
   */
  private formatURLCitation(citation: Citation): string {
    if (citation.source.startsWith('http')) {
      const domain = this.extractDomain(citation.source);
      return ` [Source: ${domain}]`;
    }
    return ` [Source: ${citation.source}]`;
  }

  /**
   * Find optimal insertion point for citation
   */
  private findOptimalInsertionPoint(
    content: string,
    text: string,
    options: Required<CitationIntegrationOptions>
  ): { success: boolean; position?: number; reason?: string } {

    const textIndex = content.toLowerCase().indexOf(text.toLowerCase());
    if (textIndex === -1) {
      return { success: false, reason: 'Text not found in content' };
    }

    // Find the end of the sentence containing the text
    const afterText = content.substring(textIndex + text.length);
    const sentenceEndMatch = afterText.match(/[.!?]/);

    if (!sentenceEndMatch) {
      return { success: false, reason: 'Could not find sentence boundary' };
    }

    const insertionPoint = textIndex + text.length + sentenceEndMatch.index!;

    // Check if this paragraph already has too many citations
    if (options.maxCitationsPerParagraph > 0) {
      const paragraphStart = content.lastIndexOf('\n\n', textIndex);
      const paragraphEnd = content.indexOf('\n\n', textIndex);
      const paragraph = content.substring(
        paragraphStart === -1 ? 0 : paragraphStart,
        paragraphEnd === -1 ? content.length : paragraphEnd
      );

      const existingCitations = (paragraph.match(/\[[^\]]+\]|\([^)]+\)/g) || []).length;
      if (existingCitations >= options.maxCitationsPerParagraph) {
        return { success: false, reason: 'Paragraph already has maximum citations' };
      }
    }

    return { success: true, position: insertionPoint };
  }

  /**
   * Insert citation at specific position
   */
  private insertCitationAtPosition(
    content: string,
    text: string,
    citation: string,
    position: number,
    options: Required<CitationIntegrationOptions>
  ): string {
    const before = content.substring(0, position);
    const after = content.substring(position);

    // Add link if requested and citation contains URL
    let formattedCitation = citation;
    if (options.linkCitations && citation.includes('Source:')) {
      const urlMatch = citation.match(/Source:\s*([^\]]+)/);
      if (urlMatch) {
        const url = urlMatch[1].trim();
        formattedCitation = citation.replace(
          urlMatch[0],
          `Source: <a href="${url}" target="_blank" rel="noopener noreferrer">${this.extractDomain(url)}</a>`
        );
      }
    }

    return before + formattedCitation + after;
  }

  /**
   * Generate bibliography from citations
   */
  private generateBibliography(citations: Citation[], style: Citation['format']): string[] {
    return citations.map((citation, index) => {
      switch (style) {
        case 'apa':
          return this.generateAPABibliographyEntry(citation);
        case 'mla':
          return this.generateMLABibliographyEntry(citation);
        case 'chicago':
          return this.generateChicagoBibliographyEntry(citation, index + 1);
        case 'ieee':
          return this.generateIEEEBibliographyEntry(citation, index + 1);
        default:
          return `${citation.source}`;
      }
    });
  }

  /**
   * Generate APA bibliography entry
   */
  private generateAPABibliographyEntry(citation: Citation): string {
    const author = citation.author || 'Unknown Author';
    const year = citation.year || new Date().getFullYear();
    const title = citation.title || 'Untitled';

    if (citation.source.startsWith('http')) {
      const domain = this.extractDomain(citation.source);
      return `${author}. (${year}). ${title}. ${domain}. Retrieved from ${citation.source}`;
    }

    return `${author}. (${year}). ${title}.`;
  }

  /**
   * Generate MLA bibliography entry
   */
  private generateMLABibliographyEntry(citation: Citation): string {
    const author = citation.author || 'Unknown Author';
    const title = citation.title || 'Untitled';

    if (citation.source.startsWith('http')) {
      const domain = this.extractDomain(citation.source);
      const accessDate = citation.accessDate || new Date();
      return `${author}. "${title}." ${domain}, ${accessDate.toLocaleDateString()}. Web.`;
    }

    return `${author}. "${title}."`;
  }

  /**
   * Generate Chicago bibliography entry
   */
  private generateChicagoBibliographyEntry(citation: Citation, number: number): string {
    const author = citation.author || 'Unknown Author';
    const title = citation.title || 'Untitled';

    return `${number}. ${author}, "${title}," accessed ${new Date().toLocaleDateString()}, ${citation.source}.`;
  }

  /**
   * Generate IEEE bibliography entry
   */
  private generateIEEEBibliographyEntry(citation: Citation, number: number): string {
    const author = citation.author || 'Unknown Author';
    const title = citation.title || 'Untitled';

    return `[${number}] ${author}, "${title}," ${citation.source}`;
  }

  /**
   * Generate recommendations based on citation integration results
   */
  private generateRecommendations(
    citationsAdded: number,
    citationsSkipped: number,
    content: string
  ): string[] {
    const recommendations: string[] = [];
    const wordCount = content.split(/\s+/).length;
    const citationDensity = citationsAdded / (wordCount / 100); // Citations per 100 words

    if (citationDensity < 0.5) {
      recommendations.push('Consider adding more citations to improve content credibility');
    }

    if (citationDensity > 3) {
      recommendations.push('Citation density is high - ensure citations are necessary and not overwhelming');
    }

    if (citationsSkipped > 0) {
      recommendations.push(`${citationsSkipped} citations could not be integrated - review citation text and content alignment`);
    }

    if (citationsAdded === 0) {
      recommendations.push('No citations were added - verify that citation text matches content exactly');
    }

    return recommendations;
  }

  // Helper methods
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private isAuthoritativeDomain(domain: string): boolean {
    const authoritativeTLDs = ['.gov', '.edu', '.org'];
    const authoritativeDomains = [
      'wikipedia.org',
      'scholar.google.com',
      'pubmed.ncbi.nlm.nih.gov',
      'jstor.org',
      'nature.com',
      'science.org'
    ];

    return authoritativeTLDs.some(tld => domain.endsWith(tld)) ||
           authoritativeDomains.some(authDomain => domain.includes(authDomain));
  }

  private calculateDomainCredibility(domain: string): number {
    if (domain.endsWith('.gov')) return 95;
    if (domain.endsWith('.edu')) return 90;
    if (domain.includes('wikipedia.org')) return 85;
    if (domain.endsWith('.org')) return 75;
    if (this.isAuthoritativeDomain(domain)) return 80;
    return 50; // Default credibility
  }
}