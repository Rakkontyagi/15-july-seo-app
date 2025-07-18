
import { GOOGLE_DOMAINS, COUNTRY_CODES, SERPAnalysisService, SERPAnalysisResult, SERPAnalysisOptions } from '../serp/serp-analysis.service';

export interface RegionalCompetitor {
  domain: string;
  rank: number;
  url: string;
  title: string;
}

export interface RegionalRankingComparison {
  location: string;
  keyword: string;
  yourRank?: number; // Your site's rank if available
  competitors: RegionalCompetitor[];
  averageCompetitorRank: number;
  rankingDifference?: number; // Your rank vs average competitor rank
}

export class RegionalIntelligenceAnalyzer {
  private serpAnalysisService: SERPAnalysisService;

  constructor(serpAnalysisService: SERPAnalysisService) {
    this.serpAnalysisService = serpAnalysisService;
  }

  /**
   * Provides region-to-domain mapping.
   * @param region The region name (e.g., "US", "United Kingdom").
   * @returns The corresponding Google domain (e.g., "google.com", "google.co.uk").
   */
  getGoogleDomainForRegion(region: string): string | undefined {
    return GOOGLE_DOMAINS[region.toLowerCase()];
  }

  /**
   * Performs location-specific SERP analysis.
   * @param options SERP analysis options including keyword and location.
   * @returns SERP analysis results for the specified region.
   */
  async analyzeRegionalSERP(options: SERPAnalysisOptions): Promise<SERPAnalysisResult> {
    const normalizedLocation = options.location.toLowerCase();
    const googleDomain = GOOGLE_DOMAINS[normalizedLocation] || 'google.com';
    const countryCode = COUNTRY_CODES[normalizedLocation] || 'us';

    return this.serpAnalysisService.analyzeKeyword({
      ...options,
      googleDomain,
      country: countryCode,
    });
  }

  /**
   * Discovers regional competitors based on SERP analysis.
   * @param serpResults SERP analysis results.
   * @returns A list of regional competitors.
   */
  discoverRegionalCompetitors(serpResults: SERPAnalysisResult): RegionalCompetitor[] {
    return serpResults.topResults.map(result => ({
      domain: result.domain,
      rank: result.position,
      url: result.url,
      title: result.title,
    }));
  }

  /**
   * Compares regional rankings.
   * @param keyword The keyword being analyzed.
   * @param location The location being analyzed.
   * @param serpResults SERP analysis results for the location.
   * @param yourSiteRank Optional: Your site's rank for the keyword in this location.
   * @returns Regional ranking comparison data.
   */
  compareRegionalRankings(
    keyword: string,
    location: string,
    serpResults: SERPAnalysisResult,
    yourSiteRank?: number
  ): RegionalRankingComparison {
    const competitors = this.discoverRegionalCompetitors(serpResults);
    const totalCompetitorRank = competitors.reduce((sum, comp) => sum + comp.rank, 0);
    const averageCompetitorRank = competitors.length > 0 ? totalCompetitorRank / competitors.length : 0;

    let rankingDifference: number | undefined;
    if (yourSiteRank !== undefined) {
      rankingDifference = yourSiteRank - averageCompetitorRank;
    }

    return {
      location,
      keyword,
      yourRank: yourSiteRank,
      competitors,
      averageCompetitorRank: Number(averageCompetitorRank.toFixed(2)),
      rankingDifference: rankingDifference ? Number(rankingDifference.toFixed(2)) : undefined,
    };
  }
}
