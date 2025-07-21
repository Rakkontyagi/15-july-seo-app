import { SerperClient, SerperSearchOptions, SerperOrganicResult } from './serper-client';
import { ScrapingBeeClient, ScrapingBeeSearchOptions, ScrapingBeeOrganicResult } from './scrapingbee-client';
import { z } from 'zod';

// Regional domain mapping
export const GOOGLE_DOMAINS: Record<string, string> = {
  'united states': 'google.com',
  'us': 'google.com',
  'united arab emirates': 'google.ae',
  'uae': 'google.ae',
  'united kingdom': 'google.co.uk',
  'uk': 'google.co.uk',
  'australia': 'google.com.au',
  'au': 'google.com.au',
  'canada': 'google.ca',
  'ca': 'google.ca',
  'germany': 'google.de',
  'de': 'google.de',
  'france': 'google.fr',
  'fr': 'google.fr',
  'india': 'google.co.in',
  'in': 'google.co.in',
  'japan': 'google.co.jp',
  'jp': 'google.co.jp',
  'brazil': 'google.com.br',
  'br': 'google.com.br'
};

// Country codes mapping
export const COUNTRY_CODES: Record<string, string> = {
  'united states': 'us',
  'united arab emirates': 'ae',
  'uae': 'ae',
  'united kingdom': 'gb',
  'uk': 'gb',
  'australia': 'au',
  'canada': 'ca',
  'germany': 'de',
  'france': 'fr',
  'india': 'in',
  'japan': 'jp',
  'brazil': 'br'
};

// SERP Analysis result types
export interface SERPResult {
  position: number;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  isOrganic: boolean;
  contentQuality?: 'high' | 'medium' | 'low';
}

export interface SERPAnalysisResult {
  keyword: string;
  location: string;
  googleDomain: string;
  timestamp: string;
  topResults: SERPResult[];
  relatedQueries: string[];
  peopleAlsoAsk: Array<{
    question: string;
    snippet?: string;
  }>;
  totalResults: number;
}

export interface SERPAnalysisOptions {
  keyword: string;
  location: string;
  numResults?: number;
  excludeDomains?: string[];
  onlyOrganic?: boolean;
}

// Placeholder for SerpApi client if it doesn't exist yet
class SerpApiClient {
  async search(options: any): Promise<any> {
    console.warn('SerpApi client is a placeholder. Implement actual SerpApi integration.');
    throw new Error('SerpApi not implemented');
  }
}

export class SERPAnalysisService {
  private serperClient: SerperClient;
  private scrapingBeeClient: ScrapingBeeClient;
  private serpApiClient: SerpApiClient; // Primary fallback

  private activeProvider: 'serper' | 'serpapi' | 'scrapingbee' = 'serper';
  private providerHealth: { [key: string]: boolean } = {
    serper: true,
    serpapi: true,
    scrapingbee: true,
  };

  constructor(serperClient: SerperClient, scrapingBeeClient: ScrapingBeeClient, serpApiClient?: SerpApiClient) {
    this.serperClient = serperClient;
    this.scrapingBeeClient = scrapingBeeClient;
    this.serpApiClient = serpApiClient || new SerpApiClient(); // Use provided or placeholder
  }

  private async checkProviderHealth(provider: 'serper' | 'serpapi' | 'scrapingbee'): Promise<boolean> {
    // In a real scenario, this would ping the API or check recent success rates
    // For now, it just returns the stored health status
    return this.providerHealth[provider];
  }

  private async switchProvider(): Promise<void> {
    if (this.activeProvider === 'serper' && this.providerHealth.serpapi) {
      this.activeProvider = 'serpapi';
      console.warn('Switched to SerpApi as primary fallback.');
    } else if (this.activeProvider === 'serpapi' && this.providerHealth.scrapingbee) {
      this.activeProvider = 'scrapingbee';
      console.warn('Switched to ScrapingBee as secondary fallback.');
    } else if (this.activeProvider === 'serper' && this.providerHealth.scrapingbee) {
      this.activeProvider = 'scrapingbee';
      console.warn('SerpApi unhealthy, switched directly to ScrapingBee.');
    } else {
      console.error('All SERP providers are unhealthy or exhausted.');
      throw new Error('No healthy SERP providers available.');
    }
  }

  async analyzeKeyword(options: SERPAnalysisOptions): Promise<SERPAnalysisResult> {
    const { keyword, location, numResults = 5, excludeDomains = [], onlyOrganic = true } = options;

    // Normalize location and get Google domain
    const normalizedLocation = location.toLowerCase();
    const googleDomain = GOOGLE_DOMAINS[normalizedLocation] || 'google.com';
    const countryCode = COUNTRY_CODES[normalizedLocation] || 'us';

    const searchOptions: SerperSearchOptions = {
      keyword,
      country: countryCode,
      domain: googleDomain,
      num: Math.max(numResults * 2, 10) // Get extra results for filtering
    };

    let searchResponse: any;
    let currentProviderAttempted: 'serper' | 'serpapi' | 'scrapingbee' = this.activeProvider;

    for (let i = 0; i < 3; i++) { // Try up to 3 providers
      try {
        if (currentProviderAttempted === 'serper' && await this.checkProviderHealth('serper')) {
          searchResponse = await this.serperClient.search(searchOptions);
          this.activeProvider = 'serper'; // Confirm active provider
          break;
        } else if (currentProviderAttempted === 'serpapi' && await this.checkProviderHealth('serpapi')) {
          // Map SerperSearchOptions to SerpApi options if needed
          searchResponse = await this.serpApiClient.search(searchOptions);
          this.activeProvider = 'serpapi';
          break;
        } else if (currentProviderAttempted === 'scrapingbee' && await this.checkProviderHealth('scrapingbee')) {
          // Map SerperSearchOptions to ScrapingBee options if needed
          const scrapingBeeOptions: ScrapingBeeSearchOptions = {
            keyword,
            country: countryCode,
            num: Math.max(numResults * 2, 10)
          };
          searchResponse = await this.scrapingBeeClient.search(scrapingBeeOptions);
          this.activeProvider = 'scrapingbee';
          break;
        } else {
          // Mark current provider as unhealthy and try to switch
          this.providerHealth[currentProviderAttempted] = false;
          await this.switchProvider();
          currentProviderAttempted = this.activeProvider; // Update for next loop iteration
        }
      } catch (error) {
        console.warn(`Provider ${currentProviderAttempted} failed:`, error);
        this.providerHealth[currentProviderAttempted] = false; // Mark as unhealthy
        await this.switchProvider();
        currentProviderAttempted = this.activeProvider; // Update for next loop iteration
      }
    }

    if (!searchResponse) {
      throw new Error('Failed to get SERP results from any provider.');
    }

    // Process and filter results based on the provider that succeeded
    let processedResults: SERPResult[];
    let relatedQueries: string[] = [];
    let peopleAlsoAsk: Array<{ question: string; snippet?: string }> = [];
    let totalResults: number = 0;

    if (this.activeProvider === 'serper') {
      processedResults = this.processSearchResults(
        searchResponse.organic,
        {
          excludeDomains,
          onlyOrganic,
          limit: numResults
        }
      );
      relatedQueries = searchResponse.relatedSearches?.map((r: any) => r.query) || [];
      peopleAlsoAsk = searchResponse.peopleAlsoAsk?.map((q: any) => ({
        question: q.question,
        snippet: q.snippet
      })) || [];
      totalResults = searchResponse.organic.length;
    } else if (this.activeProvider === 'serpapi') {
      // Assuming SerpApi response structure is similar to Serper for processing
      processedResults = this.processSearchResults(
        searchResponse.organic_results || [], // Adjust based on actual SerpApi response
        {
          excludeDomains,
          onlyOrganic,
          limit: numResults
        }
      );
      relatedQueries = searchResponse.related_searches?.map((r: any) => r.query) || [];
      peopleAlsoAsk = searchResponse.answer_box?.people_also_ask?.map((q: any) => ({
        question: q.question,
        snippet: q.snippet
      })) || [];
      totalResults = searchResponse.organic_results?.length || 0;
    } else if (this.activeProvider === 'scrapingbee') {
      processedResults = this.processScrapingBeeResults(
        searchResponse.organic_results,
        {
          excludeDomains,
          onlyOrganic,
          limit: numResults
        }
      );
      relatedQueries = searchResponse.related_searches?.map((r: any) => r.query) || [];
      peopleAlsoAsk = searchResponse.people_also_ask?.map((q: any) => ({
        question: q
      })) || [];
      totalResults = searchResponse.organic_results.length;
    }

    return {
      keyword,
      location: normalizedLocation,
      googleDomain,
      timestamp: new Date().toISOString(),
      topResults: processedResults,
      relatedQueries,
      peopleAlsoAsk,
      totalResults
    };
  }

  private processSearchResults(
    organicResults: SerperOrganicResult[],
    filters: {
      excludeDomains: string[];
      onlyOrganic: boolean;
      limit: number;
    }
  ): SERPResult[] {
    const processedResults: SERPResult[] = [];

    for (const result of organicResults) {
      // Extract domain from URL
      const domain = this.extractDomain(result.link);

      // Apply filters
      if (filters.excludeDomains.includes(domain)) {
        continue;
      }

      // Check if result is truly organic (not ads, shopping, etc.)
      const isOrganic = this.isOrganicResult(result);
      if (filters.onlyOrganic && !isOrganic) {
        continue;
      }

      // Assess content quality based on various factors
      const contentQuality = this.assessContentQuality(result);

      processedResults.push({
        position: result.position,
        title: result.title,
        url: result.link,
        domain,
        snippet: result.snippet,
        isOrganic,
        contentQuality
      });

      if (processedResults.length >= filters.limit) {
        break;
      }
    }

    return processedResults;
  }

  private processScrapingBeeResults(
    organicResults: ScrapingBeeOrganicResult[],
    filters: {
      excludeDomains: string[];
      onlyOrganic: boolean;
      limit: number;
    }
  ): SERPResult[] {
    const processedResults: SERPResult[] = [];
    let position = 1;

    for (const result of organicResults) {
      // Extract domain from URL
      const domain = this.extractDomain(result.url);

      // Apply filters
      if (filters.excludeDomains.includes(domain)) {
        continue;
      }

      processedResults.push({
        position: position++,
        title: result.title,
        url: result.url,
        domain,
        snippet: result.snippet,
        isOrganic: true, // ScrapingBee only returns organic results
        contentQuality: 'medium' // Cannot assess quality from ScrapingBee
      });

      if (processedResults.length >= filters.limit) {
        break;
      }
    }

    return processedResults;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private isOrganicResult(result: SerperOrganicResult): boolean {
    const url = result.link.toLowerCase();
    const title = result.title.toLowerCase();

    // Check for common non-organic indicators
    const nonOrganicIndicators = [
      'shopping.google',
      'ads.google',
      'youtube.com/ads',
      'sponsored',
      'ad |',
      '| ad'
    ];

    return !nonOrganicIndicators.some(indicator => 
      url.includes(indicator) || title.includes(indicator)
    );
  }

  private assessContentQuality(result: SerperOrganicResult): 'high' | 'medium' | 'low' {
    // Simple quality assessment based on available data
    const hasSnippet = !!result.snippet && result.snippet.length > 50;
    const hasDate = !!result.date;
    const hasSitelinks = !!result.sitelinks && result.sitelinks.length > 0;
    const titleLength = result.title.length;

    let score = 0;
    if (hasSnippet) score += 2;
    if (hasDate) score += 1;
    if (hasSitelinks) score += 2;
    if (titleLength > 20 && titleLength < 70) score += 1;

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  async compareRegionalResults(
    keyword: string,
    locations: string[]
  ): Promise<Record<string, SERPAnalysisResult>> {
    const results: Record<string, SERPAnalysisResult> = {};

    // Analyze keyword for each location
    for (const location of locations) {
      try {
        results[location] = await this.analyzeKeyword({ keyword, location });
      } catch (error) {
        console.error(`Failed to analyze ${keyword} for ${location}:`, error);
      }
    }

    return results;
  }

  async validateResultAccessibility(urls: string[]): Promise<Record<string, boolean>> {
    const accessibility: Record<string, boolean> = {};

    // For now, we'll do a simple validation
    // In production, you'd want to actually try to fetch these URLs
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        // Basic validation - check if URL is properly formed
        accessibility[url] = urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
      } catch {
        accessibility[url] = false;
      }
    }

    return accessibility;
  }
}
