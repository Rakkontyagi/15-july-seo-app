/**
 * SERP Analysis Service
 * Analyzes search engine results and competitor content
 */

import { logger } from '../logging/logger';
import { SerpAnalysisResult, CompetitorResult, GenerationProgress } from './types';

export class SerpAnalysisService {
  private serperApiKey: string;
  private firecrawlApiKey: string;

  constructor() {
    this.serperApiKey = process.env.SERPER_API_KEY || '';
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY || '';
  }

  /**
   * Perform comprehensive SERP analysis
   */
  async analyzeSERP(
    keyword: string,
    location: string = 'United States',
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<SerpAnalysisResult> {
    try {
      logger.info('Starting SERP analysis', { keyword, location });

      // Report progress
      onProgress?.({
        stage: 'serp_analysis',
        progress: 10,
        message: 'Analyzing search results...',
        timestamp: new Date().toISOString()
      });

      // Get search results from Serper.dev
      const searchResults = await this.getSearchResults(keyword, location);

      onProgress?.({
        stage: 'serp_analysis',
        progress: 40,
        message: 'Processing competitor results...',
        timestamp: new Date().toISOString()
      });

      // Process and normalize results
      const topResults = await this.processCompetitorResults(searchResults.organic?.slice(0, 5) || []);

      onProgress?.({
        stage: 'serp_analysis',
        progress: 70,
        message: 'Extracting related queries...',
        timestamp: new Date().toISOString()
      });

      const result: SerpAnalysisResult = {
        keyword,
        location,
        topResults,
        relatedQueries: searchResults.relatedSearches || [],
        peopleAlsoAsk: searchResults.peopleAlsoAsk?.map((q: any) => q.question) || [],
        timestamp: new Date().toISOString()
      };

      onProgress?.({
        stage: 'serp_analysis',
        progress: 100,
        message: 'SERP analysis completed',
        timestamp: new Date().toISOString()
      });

      logger.info('SERP analysis completed', { keyword, resultCount: topResults.length });
      return result;

    } catch (error) {
      logger.error('SERP analysis failed', { error, keyword, location });
      throw new Error(`SERP analysis failed: ${error.message}`);
    }
  }

  /**
   * Get search results from Serper.dev API
   */
  private async getSearchResults(keyword: string, location: string): Promise<any> {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': this.serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: keyword,
        gl: this.getCountryCode(location),
        hl: 'en',
        num: 10,
        type: 'search'
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Process competitor results and extract content
   */
  private async processCompetitorResults(results: any[]): Promise<CompetitorResult[]> {
    const competitorResults: CompetitorResult[] = [];

    for (const [index, result] of results.entries()) {
      try {
        const competitorResult: CompetitorResult = {
          position: index + 1,
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          domain: this.extractDomain(result.link || ''),
        };

        // Extract content using Firecrawl if available
        if (this.firecrawlApiKey) {
          const content = await this.extractContentFromUrl(result.link);
          if (content) {
            competitorResult.content = content.text;
            competitorResult.wordCount = this.countWords(content.text);
            competitorResult.headings = content.headings || [];
            competitorResult.images = content.images || [];
            competitorResult.keywordDensity = this.calculateKeywordDensity(content.text, '');
            competitorResult.readabilityScore = this.calculateReadabilityScore(content.text);
          }
        }

        competitorResults.push(competitorResult);
      } catch (error) {
        logger.warn('Failed to process competitor result', { error, url: result.link });
        // Continue with basic information
        competitorResults.push({
          position: index + 1,
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          domain: this.extractDomain(result.link || ''),
        });
      }
    }

    return competitorResults;
  }

  /**
   * Extract content from URL using Firecrawl
   */
  private async extractContentFromUrl(url: string): Promise<any> {
    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img'],
          excludeTags: ['nav', 'footer', 'aside', 'script', 'style'],
          waitFor: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.data?.markdown || '',
        headings: this.extractHeadings(data.data?.markdown || ''),
        images: this.extractImages(data.data?.html || '')
      };
    } catch (error) {
      logger.warn('Failed to extract content from URL', { error, url });
      return null;
    }
  }

  /**
   * Extract headings from markdown content
   */
  private extractHeadings(markdown: string): string[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: string[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      headings.push(match[2].trim());
    }

    return headings;
  }

  /**
   * Extract images from HTML content
   */
  private extractImages(html: string): string[] {
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const images: string[] = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(text: string, keyword: string): number {
    if (!text || !keyword) return 0;

    const words = text.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    let keywordCount = 0;

    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const phrase = words.slice(i, i + keywordWords.length).join(' ');
      if (phrase === keyword.toLowerCase()) {
        keywordCount++;
      }
    }

    return (keywordCount / words.length) * 100;
  }

  /**
   * Calculate readability score (simplified Flesch Reading Ease)
   */
  private calculateReadabilityScore(text: string): number {
    if (!text) return 0;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (simplified)
   */
  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    return Math.max(1, count);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Get country code for location
   */
  private getCountryCode(location: string): string {
    const locationMap: { [key: string]: string } = {
      'United States': 'us',
      'United Kingdom': 'uk',
      'Canada': 'ca',
      'Australia': 'au',
      'Germany': 'de',
      'France': 'fr',
      'Spain': 'es',
      'Italy': 'it',
      'Netherlands': 'nl',
      'India': 'in',
      'Japan': 'jp',
      'Brazil': 'br',
      'Mexico': 'mx',
      'Argentina': 'ar',
      'South Africa': 'za',
      'UAE': 'ae',
      'Saudi Arabia': 'sa',
      'Singapore': 'sg',
      'Thailand': 'th',
      'Malaysia': 'my'
    };

    return locationMap[location] || 'us';
  }
}