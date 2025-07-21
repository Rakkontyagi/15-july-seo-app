
import { SERPAnalysisService, SERPAnalysisResult } from '../serp/serp-analysis.service';
import { RegionalIntelligenceAnalyzer, RegionalCompetitor } from './regional-intelligence';

export interface LocalCompetitorAnalysisResult {
  region: string;
  keyword: string;
  localMarketLeaders: RegionalCompetitor[];
  regionalRankingAnalysis: RegionalCompetitor[];
  localCompetitionAssessment: string; // e.g., 'High', 'Medium', 'Low'
  regionalMarketShareAnalysis: Array<{ domain: string; estimatedShare: number }>;
  recommendations: string[];
}

export class LocalCompetitorIdentifier {
  private serpAnalysisService: SERPAnalysisService;
  private regionalIntelligenceAnalyzer: RegionalIntelligenceAnalyzer;

  constructor(serpAnalysisService: SERPAnalysisService, regionalIntelligenceAnalyzer: RegionalIntelligenceAnalyzer) {
    this.serpAnalysisService = serpAnalysisService;
    this.regionalIntelligenceAnalyzer = regionalIntelligenceAnalyzer;
  }

  /**
   * Identifies local competitors and provides analysis for a given region and keyword.
   * @param region The target geographic region.
   * @param keyword The keyword for analysis.
   * @returns Local competitor analysis results.
   */
  async identifyLocalCompetitors(region: string, keyword: string): Promise<LocalCompetitorAnalysisResult> {
    const recommendations: string[] = [];

    // 1. Region-specific competitor discovery (via SERP analysis)
    const serpResults = await this.serpAnalysisService.analyzeKeyword({
      keyword,
      location: region,
      numResults: 10, // Get more results for better competitor identification
    });

    const regionalCompetitors = this.regionalIntelligenceAnalyzer.discoverRegionalCompetitors(serpResults);

    // 2. Local market leader identification (top 3-5 competitors)
    const localMarketLeaders = regionalCompetitors.slice(0, 5);
    if (localMarketLeaders.length === 0) {
      recommendations.push('No significant local market leaders identified for this keyword and region.');
    }

    // 3. Regional ranking analysis (already part of serpResults.topResults)
    const regionalRankingAnalysis = regionalCompetitors;

    // 4. Local competition assessment (simplified: based on number of strong competitors)
    let localCompetitionAssessment: string = 'Low';
    if (localMarketLeaders.length >= 3 && localMarketLeaders[0].rank <= 3) {
      localCompetitionAssessment = 'High';
    } else if (localMarketLeaders.length >= 1 && localMarketLeaders[0].rank <= 5) {
      localCompetitionAssessment = 'Medium';
    }

    // 5. Regional market share analysis (placeholder - requires more data)
    const regionalMarketShareAnalysis: Array<{ domain: string; estimatedShare: number }> = [];
    localMarketLeaders.forEach((comp, index) => {
      // Simulate market share based on rank
      regionalMarketShareAnalysis.push({
        domain: comp.domain,
        estimatedShare: Number((20 / (index + 1)).toFixed(2)), // Higher rank, higher share
      });
    });

    if (localCompetitionAssessment === 'High') {
      recommendations.push('The local market is highly competitive. Focus on niche keywords or unique value propositions.');
    }

    return {
      region,
      keyword,
      localMarketLeaders,
      regionalRankingAnalysis,
      localCompetitionAssessment,
      regionalMarketShareAnalysis,
      recommendations,
    };
  }
}
