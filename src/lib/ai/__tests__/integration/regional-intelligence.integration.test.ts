/**
 * Integration Tests for Regional Intelligence System
 * Tests end-to-end regional analysis workflows and API integrations
 */

import { RegionalIntelligenceAnalyzer } from '../../regional-intelligence';
import { CurrentInformationIntegrator } from '../../current-information-integrator';
import { CulturalAdapter } from '../../cultural-adapter';
import { LocalSearchAnalyzer } from '../../local-search-analyzer';
import { SERPAnalysisService } from '../../../serp/serp-analysis.service';

// Mock external services for integration testing
jest.mock('../../../serp/serp-analysis.service');
jest.mock('../../../services/news-api');
jest.mock('../../../services/research-api');

describe('Regional Intelligence Integration', () => {
  let regionalAnalyzer: RegionalIntelligenceAnalyzer;
  let currentInfoIntegrator: CurrentInformationIntegrator;
  let culturalAdapter: CulturalAdapter;
  let localSearchAnalyzer: LocalSearchAnalyzer;
  let mockSerpService: jest.Mocked<SERPAnalysisService>;

  beforeEach(() => {
    mockSerpService = {
      analyzeKeyword: jest.fn(),
      compareRegionalResults: jest.fn(),
      extractTopResults: jest.fn(),
    } as any;

    regionalAnalyzer = new RegionalIntelligenceAnalyzer(mockSerpService);
    currentInfoIntegrator = new CurrentInformationIntegrator();
    culturalAdapter = new CulturalAdapter();
    localSearchAnalyzer = new LocalSearchAnalyzer();

    jest.clearAllMocks();
  });

  describe('End-to-End Regional Content Analysis', () => {
    it('should perform complete regional analysis workflow', async () => {
      // Mock SERP data
      const mockSerpResult = {
        keyword: 'SEO services',
        location: 'UAE',
        topResults: [
          {
            position: 1,
            title: 'Best SEO Services Dubai',
            url: 'https://dubai-seo.com',
            domain: 'dubai-seo.com',
            snippet: 'Professional SEO services in Dubai',
            headings: ['H1: SEO Services Dubai'],
            wordCount: 2000,
            keywordDensity: 2.5,
            lsiKeywords: ['Dubai', 'optimization', 'ranking'],
            entities: ['Dubai', 'UAE', 'Google'],
            metaTags: {
              title: 'SEO Services Dubai',
              description: 'Professional SEO in Dubai',
              keywords: 'SEO, Dubai, services'
            }
          }
        ],
        relatedSearches: ['SEO Dubai', 'digital marketing UAE'],
        peopleAlsoAsk: ['How to do SEO in Dubai?'],
        totalResults: 850000,
        searchTime: 0.42
      };

      mockSerpService.analyzeKeyword.mockResolvedValue(mockSerpResult);

      // Step 1: Regional SERP Analysis
      const serpAnalysis = await regionalAnalyzer.analyzeRegionalSERP({
        keyword: 'SEO services',
        location: 'UAE',
        language: 'en',
        device: 'desktop'
      });

      expect(serpAnalysis).toBeDefined();
      expect(serpAnalysis.location).toBe('UAE');

      // Step 2: Competitor Discovery
      const competitors = regionalAnalyzer.discoverRegionalCompetitors(serpAnalysis);
      expect(competitors).toHaveLength(1);
      expect(competitors[0].domain).toBe('dubai-seo.com');

      // Step 3: Local Search Pattern Analysis
      const searchPatterns = localSearchAnalyzer.analyze('UAE', 'SEO services');
      expect(searchPatterns.regionalSearchBehavior).toContain('High mobile search usage.');

      // Step 4: Current Information Integration
      const currentInfo = await currentInfoIntegrator.fetchCurrentInformation('SEO services', 'digital marketing');
      expect(currentInfo.facts2025).toBeDefined();
      expect(currentInfo.recentDevelopments).toBeDefined();

      // Step 5: Cultural Adaptation
      const culturalAnalysis = culturalAdapter.adaptContentCulturally(
        'Professional SEO services for your business growth',
        'UAE',
        'professional'
      );
      expect(culturalAnalysis.culturalRelevanceScore).toBeGreaterThan(70);

      // Verify integration points
      expect(mockSerpService.analyzeKeyword).toHaveBeenCalledWith({
        keyword: 'SEO services',
        location: 'UAE',
        language: 'en',
        device: 'desktop',
        googleDomain: 'google.ae',
        country: 'ae'
      });
    });

    it('should handle multi-region comparison workflow', async () => {
      const regions = ['UAE', 'UK', 'US'];
      const keyword = 'digital marketing';

      // Mock different regional results
      const mockResults = regions.map(region => ({
        keyword,
        location: region,
        topResults: [
          {
            position: 1,
            title: `${region} Digital Marketing`,
            url: `https://${region.toLowerCase()}-marketing.com`,
            domain: `${region.toLowerCase()}-marketing.com`,
            snippet: `Digital marketing services in ${region}`,
            headings: [`H1: Digital Marketing ${region}`],
            wordCount: 2000,
            keywordDensity: 2.0,
            lsiKeywords: ['marketing', 'digital', region.toLowerCase()],
            entities: [region, 'marketing'],
            metaTags: {
              title: `Digital Marketing ${region}`,
              description: `Marketing services in ${region}`,
              keywords: `marketing, ${region}`
            }
          }
        ],
        relatedSearches: [`marketing ${region}`],
        peopleAlsoAsk: [`How to do marketing in ${region}?`],
        totalResults: 500000,
        searchTime: 0.3
      }));

      mockSerpService.analyzeKeyword
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      // Analyze each region
      const regionalAnalyses = await Promise.all(
        regions.map(region => 
          regionalAnalyzer.analyzeRegionalSERP({
            keyword,
            location: region,
            language: 'en',
            device: 'desktop'
          })
        )
      );

      // Verify all regions were analyzed
      expect(regionalAnalyses).toHaveLength(3);
      regionalAnalyses.forEach((analysis, index) => {
        expect(analysis.location).toBe(regions[index]);
        expect(analysis.topResults).toHaveLength(1);
      });

      // Compare cultural adaptations across regions
      const culturalAnalyses = regions.map(region =>
        culturalAdapter.adaptContentCulturally(
          'Professional digital marketing services',
          region,
          'professional'
        )
      );

      // Verify different cultural recommendations
      expect(culturalAnalyses[0].localMarketAdaptationSuggestions.some(suggestion =>
        suggestion.includes('Arabic keywords')
      )).toBe(true);
      expect(culturalAnalyses[1].localMarketAdaptationSuggestions.some(suggestion =>
        suggestion.includes('British English')
      )).toBe(true);
      expect(culturalAnalyses[2].localMarketAdaptationSuggestions.some(suggestion =>
        suggestion.includes('American English')
      )).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle SERP API failures gracefully', async () => {
      mockSerpService.analyzeKeyword.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await regionalAnalyzer.analyzeRegionalSERP({
        keyword: 'SEO services',
        location: 'UAE',
        language: 'en',
        device: 'desktop'
      });

      // Should return fallback data instead of throwing
      expect(result).toBeDefined();
      expect(result.keyword).toBe('SEO services');
      expect(result.location).toBe('UAE');

      // Verify fallback mechanisms can still work
      const localAnalysis = localSearchAnalyzer.analyze('UAE', 'SEO services');
      expect(localAnalysis).toBeDefined();

      const culturalAnalysis = culturalAdapter.adaptContentCulturally(
        'SEO services content',
        'UAE',
        'professional'
      );
      expect(culturalAnalysis).toBeDefined();
    });

    it('should handle partial service failures', async () => {
      // SERP service works but current info service fails
      const mockSerpResult = {
        keyword: 'SEO services',
        location: 'UAE',
        topResults: [],
        relatedSearches: [],
        peopleAlsoAsk: [],
        totalResults: 0,
        searchTime: 0.1
      };

      mockSerpService.analyzeKeyword.mockResolvedValue(mockSerpResult);

      // Mock current info service failure
      jest.spyOn(currentInfoIntegrator, 'fetchCurrentInformation')
        .mockRejectedValue(new Error('News API unavailable'));

      // SERP analysis should still work
      const serpAnalysis = await regionalAnalyzer.analyzeRegionalSERP({
        keyword: 'SEO services',
        location: 'UAE',
        language: 'en',
        device: 'desktop'
      });

      expect(serpAnalysis).toBeDefined();

      // Current info should fail
      await expect(
        currentInfoIntegrator.fetchCurrentInformation('SEO services', 'marketing')
      ).rejects.toThrow('News API unavailable');

      // But other services should continue working
      const localAnalysis = localSearchAnalyzer.analyze('UAE', 'SEO services');
      expect(localAnalysis).toBeDefined();
    });
  });

  describe('Data Flow and Integration Points', () => {
    it('should properly integrate SERP data with cultural analysis', async () => {
      const mockSerpResult = {
        keyword: 'restaurant marketing',
        location: 'UAE',
        topResults: [
          {
            position: 1,
            title: 'Halal Restaurant Marketing Dubai',
            url: 'https://halal-marketing.ae',
            domain: 'halal-marketing.ae',
            snippet: 'Halal restaurant marketing services in Dubai',
            headings: ['H1: Halal Restaurant Marketing'],
            wordCount: 1800,
            keywordDensity: 3.0,
            lsiKeywords: ['halal', 'restaurant', 'Dubai'],
            entities: ['Dubai', 'UAE', 'halal'],
            metaTags: {
              title: 'Halal Restaurant Marketing',
              description: 'Marketing for halal restaurants',
              keywords: 'halal, restaurant, marketing'
            }
          }
        ],
        relatedSearches: ['halal marketing Dubai'],
        peopleAlsoAsk: ['How to market halal restaurants?'],
        totalResults: 125000,
        searchTime: 0.35
      };

      mockSerpService.analyzeKeyword.mockResolvedValue(mockSerpResult);

      // Get SERP data
      const serpAnalysis = await regionalAnalyzer.analyzeRegionalSERP({
        keyword: 'restaurant marketing',
        location: 'UAE',
        language: 'en',
        device: 'desktop'
      });

      // Extract content themes from SERP results
      const contentThemes = serpAnalysis.topResults.map(result => result.snippet).join(' ');

      // Apply cultural analysis to the content themes
      const culturalAnalysis = culturalAdapter.adaptContentCulturally(
        contentThemes,
        'UAE',
        'professional'
      );

      // Verify cultural analysis considers the halal/restaurant context
      expect(culturalAnalysis.culturalRelevanceScore).toBeGreaterThan(80);
      expect(culturalAnalysis.culturalSensitivityIssues).toHaveLength(0); // Halal content should be appropriate
    });

    it('should integrate current information with regional patterns', async () => {
      // Get current information
      const currentInfo = await currentInfoIntegrator.fetchCurrentInformation(
        'AI marketing',
        'technology'
      );

      // Get regional patterns
      const regionalPatterns = localSearchAnalyzer.analyze('UAE', 'AI marketing');

      // Format current info for prompt
      const formattedInfo = currentInfoIntegrator.formatForPrompt(currentInfo);

      // Verify integration points
      expect(formattedInfo).toContain('2025');
      expect(regionalPatterns.regionalSearchBehavior.some(behavior =>
        behavior.includes('High mobile search usage')
      )).toBe(true);

      // Simulate content generation that uses both
      const integratedContent = `
        ${formattedInfo}
        
        Regional Considerations for UAE:
        ${regionalPatterns.recommendations.join(', ')}
      `;

      expect(integratedContent).toContain('2025');
      expect(integratedContent).toContain('mobile-first design');
    });
  });

  describe('Performance and Caching', () => {
    it('should handle concurrent regional analyses efficiently', async () => {
      const regions = ['UAE', 'UK', 'US', 'AU'];
      const keyword = 'SEO optimization';

      // Mock responses for all regions
      regions.forEach((region, index) => {
        mockSerpService.analyzeKeyword.mockResolvedValueOnce({
          keyword,
          location: region,
          topResults: [],
          relatedSearches: [],
          peopleAlsoAsk: [],
          totalResults: 100000 + index,
          searchTime: 0.2 + index * 0.1
        });
      });

      const startTime = Date.now();

      // Run concurrent analyses
      const analyses = await Promise.all(
        regions.map(region =>
          regionalAnalyzer.analyzeRegionalSERP({
            keyword,
            location: region,
            language: 'en',
            device: 'desktop'
          })
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all analyses completed
      expect(analyses).toHaveLength(4);
      analyses.forEach((analysis, index) => {
        expect(analysis.location).toBe(regions[index]);
      });

      // Performance should be reasonable (concurrent, not sequential)
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
