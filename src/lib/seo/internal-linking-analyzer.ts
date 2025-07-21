import { SitemapParser, SitemapUrl } from './sitemap-parser';
import { PageContentAnalyzer, PageContentAnalysisResult } from './page-content-analyzer';
import { findSemanticConnections, LsiKeyword } from './lsi-keyword-extractor';

export interface PageData {
  url: string;
  content?: string; // To be filled by content fetching
  headings?: Array<{ level: number; text: string }>; // To be filled by content parsing
  analysisResult?: PageContentAnalysisResult; // New: Store content analysis result
}

export interface TopicalRelationship {
  sourceUrl: string;
  targetUrl: string;
  commonLsiKeywords: Array<{ term: string; relevance1: number; relevance2: number }>;
  relevanceScore: number; // Based on common LSI keywords
}

export class InternalLinkingAnalyzer {
  private sitemapParser: SitemapParser;
  private pageContentAnalyzer: PageContentAnalyzer;

  constructor() {
    this.sitemapParser = new SitemapParser();
    this.pageContentAnalyzer = new PageContentAnalyzer();
  }

  /**
   * Discovers all pages from a given sitemap URL or robots.txt and fetches/analyzes their content.
   * @param entryPoint The URL of a sitemap, sitemap index, or a domain to check robots.txt.
   * @returns A list of PageData objects with URLs and content analysis results.
   */
  async discoverAndAnalyzePages(entryPoint: string): Promise<PageData[]> {
    let sitemapUrls: SitemapUrl[] = [];

    if (entryPoint.endsWith('/robots.txt')) {
      const domain = new URL(entryPoint).hostname;
      const discoveredSitemaps = await this.sitemapParser.discoverSitemapsFromRobotsTxt(domain);
      for (const sitemapUrl of discoveredSitemaps) {
        sitemapUrls = sitemapUrls.concat(await this.sitemapParser.fetchAndParseSitemap(sitemapUrl));
      }
    } else if (entryPoint.endsWith('.xml') || entryPoint.includes('sitemap')) {
      sitemapUrls = await this.sitemapParser.fetchAndParseSitemap(entryPoint);
    } else {
      const domain = new URL(entryPoint).hostname;
      const discoveredSitemaps = await this.sitemapParser.discoverSitemapsFromRobotsTxt(domain);
      if (discoveredSitemaps.length > 0) {
        for (const sitemapUrl of discoveredSitemaps) {
          sitemapUrls = sitemapUrls.concat(await this.sitemapParser.fetchAndParseSitemap(sitemapUrl));
        }
      } else {
        console.warn(`No sitemap found for ${entryPoint}. Cannot discover pages.`);
        return [];
      }
    }

    const pages: PageData[] = [];
    for (const sitemapUrl of sitemapUrls) {
      const url = sitemapUrl.loc;
      // Placeholder for fetching actual page content
      // In a real scenario, this would involve a web scraper (e.g., Firecrawl)
      const content = await this.fetchPageContent(url); 
      
      if (content) {
        const analysisResult = await this.pageContentAnalyzer.analyze(url, content);
        pages.push({
          url,
          content,
          analysisResult,
          // Headings would be extracted during content fetching/parsing
          // For now, assume they are part of the content analysis result or extracted separately
        });
      }
    }
    return pages;
  }

  /**
   * Placeholder for fetching actual page content.
   * In a real application, this would use a web scraping service.
   * @param url The URL of the page to fetch.
   * @returns The content of the page as a string, or null if fetching fails.
   */
  private async fetchPageContent(url: string): Promise<string | null> {
    try {
      // Simulate network delay and content fetching
      await new Promise(resolve => setTimeout(resolve, 500)); 
      // Return dummy content for demonstration
      return `This is the content of ${url}. It talks about SEO, content marketing, and digital strategy.`;
    } catch (error) {
      console.error(`Failed to fetch content for ${url}:`, error);
      return null;
    }
  }

  /**
   * Identifies topical relationships between pages based on common LSI keywords.
   * @param pages A list of PageData objects with content analysis results.
   * @returns A list of identified topical relationships.
   */
  identifyTopicalRelationships(pages: PageData[]): TopicalRelationship[] {
    const relationships: TopicalRelationship[] = [];

    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        const page1 = pages[i];
        const page2 = pages[j];

        if (page1.analysisResult && page2.analysisResult) {
          const commonLsiKeywords = findSemanticConnections(
            page1.analysisResult.lsiKeywords,
            page2.analysisResult.lsiKeywords
          );

          if (commonLsiKeywords.length > 0) {
            // Simple relevance score: sum of relevance of common LSI keywords
            const relevanceScore = commonLsiKeywords.reduce((sum, lsi) => sum + lsi.relevance1 + lsi.relevance2, 0);
            relationships.push({
              sourceUrl: page1.url,
              targetUrl: page2.url,
              commonLsiKeywords,
              relevanceScore: Number(relevanceScore.toFixed(2)),
            });
          }
        }
      }
    }
    return relationships.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}