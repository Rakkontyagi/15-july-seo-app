/**
 * Unit Tests for Regional Intelligence Analyzer
 * Tests regional SERP analysis, competitor discovery, and ranking comparison
 */

import { RegionalIntelligenceAnalyzer, RegionalCompetitor, RegionalRankingComparison } from '../regional-intelligence';
import { SERPAnalysisService, SERPAnalysisResult, SERPAnalysisOptions } from '../../serp/serp-analysis.service';

// Mock the SERP Analysis Service
jest.mock('../../serp/serp-analysis.service');

describe('RegionalIntelligenceAnalyzer', () => {
  let analyzer: RegionalIntelligenceAnalyzer;
  let mockSerpAnalysisService: jest.Mocked<SERPAnalysisService>;

  beforeEach(() => {
    mockSerpAnalysisService = {
      analyzeKeyword: jest.fn(),
      compareRegionalResults: jest.fn(),
      extractTopResults: jest.fn(),
    } as any;

    analyzer = new RegionalIntelligenceAnalyzer(mockSerpAnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeRegionalSERP', () => {
    const mockSerpResult: SERPAnalysisResult = {
      keyword: 'SEO optimization',
      location: 'UAE',
      topResults: [
        {
          position: 1,
          title: 'Best SEO Guide UAE',
          url: 'https://example-uae.com/seo',
          domain: 'example-uae.com',
          snippet: 'Complete SEO guide for UAE market',
          headings: ['H1: SEO Guide', 'H2: UAE Market'],
          wordCount: 2500,
          keywordDensity: 2.5,
          lsiKeywords: ['optimization', 'ranking', 'Dubai'],
          entities: ['UAE', 'Dubai', 'Google'],
          metaTags: {
            title: 'SEO Guide UAE',
            description: 'Best SEO practices for UAE',
            keywords: 'SEO, UAE, Dubai'
          }
        },
        {
          position: 2,
          title: 'Dubai SEO Services',
          url: 'https://dubai-seo.com/services',
          domain: 'dubai-seo.com',
          snippet: 'Professional SEO services in Dubai',
          headings: ['H1: SEO Services', 'H2: Dubai'],
          wordCount: 1800,
          keywordDensity: 3.2,
          lsiKeywords: ['services', 'Dubai', 'marketing'],
          entities: ['Dubai', 'UAE', 'SEO'],
          metaTags: {
            title: 'Dubai SEO Services',
            description: 'Professional SEO in Dubai',
            keywords: 'SEO, Dubai, services'
          }
        }
      ],
      relatedSearches: ['SEO Dubai', 'UAE digital marketing'],
      peopleAlsoAsk: ['How to do SEO in UAE?', 'Best SEO practices Dubai'],
      totalResults: 1250000,
      searchTime: 0.45
    };

    it('should perform location-specific SERP analysis', async () => {
      const options: SERPAnalysisOptions = {
        keyword: 'SEO optimization',
        location: 'UAE',
        language: 'en',
        device: 'desktop'
      };

      mockSerpAnalysisService.analyzeKeyword.mockResolvedValue(mockSerpResult);

      const result = await analyzer.analyzeRegionalSERP(options);

      expect(mockSerpAnalysisService.analyzeKeyword).toHaveBeenCalledWith({
        ...options,
        googleDomain: 'google.ae',
        country: 'ae',
      });
      expect(result).toEqual(mockSerpResult);
    });

    it('should handle unknown location with fallback to US', async () => {
      const options: SERPAnalysisOptions = {
        keyword: 'SEO optimization',
        location: 'unknown-country',
        language: 'en',
        device: 'desktop'
      };

      mockSerpAnalysisService.analyzeKeyword.mockResolvedValue(mockSerpResult);

      await analyzer.analyzeRegionalSERP(options);

      expect(mockSerpAnalysisService.analyzeKeyword).toHaveBeenCalledWith({
        ...options,
        googleDomain: 'google.com',
        country: 'us',
      });
    });

    it('should handle API errors gracefully', async () => {
      const options: SERPAnalysisOptions = {
        keyword: 'SEO optimization',
        location: 'UAE',
        language: 'en',
        device: 'desktop'
      };

      const apiError = new Error('SERP API rate limit exceeded');
      mockSerpAnalysisService.analyzeKeyword.mockRejectedValue(apiError);

      await expect(analyzer.analyzeRegionalSERP(options)).rejects.toThrow('SERP API rate limit exceeded');
    });
  });

  describe('discoverRegionalCompetitors', () => {
    const mockSerpResult: SERPAnalysisResult = {
      keyword: 'SEO optimization',
      location: 'UAE',
      topResults: [
        {
          position: 1,
          title: 'Best SEO Guide UAE',
          url: 'https://example-uae.com/seo',
          domain: 'example-uae.com',
          snippet: 'Complete SEO guide for UAE market',
          headings: ['H1: SEO Guide'],
          wordCount: 2500,
          keywordDensity: 2.5,
          lsiKeywords: ['optimization'],
          entities: ['UAE'],
          metaTags: { title: 'SEO Guide UAE', description: 'Best SEO practices', keywords: 'SEO, UAE' }
        }
      ],
      relatedSearches: [],
      peopleAlsoAsk: [],
      totalResults: 1000000,
      searchTime: 0.3
    };

    it('should discover regional competitors from SERP results', () => {
      const competitors = analyzer.discoverRegionalCompetitors(mockSerpResult);

      expect(competitors).toHaveLength(1);
      expect(competitors[0]).toEqual({
        domain: 'example-uae.com',
        rank: 1,
        url: 'https://example-uae.com/seo',
        title: 'Best SEO Guide UAE',
      });
    });

    it('should handle empty SERP results', () => {
      const emptySerpResult: SERPAnalysisResult = {
        ...mockSerpResult,
        topResults: []
      };

      const competitors = analyzer.discoverRegionalCompetitors(emptySerpResult);

      expect(competitors).toHaveLength(0);
    });
  });

  describe('compareRegionalRankings', () => {
    const mockSerpResult: SERPAnalysisResult = {
      keyword: 'SEO optimization',
      location: 'UAE',
      topResults: [
        {
          position: 1,
          title: 'Competitor 1',
          url: 'https://comp1.com',
          domain: 'comp1.com',
          snippet: 'SEO guide',
          headings: ['H1: SEO'],
          wordCount: 2000,
          keywordDensity: 2.0,
          lsiKeywords: ['optimization'],
          entities: ['SEO'],
          metaTags: { title: 'SEO Guide', description: 'SEO practices', keywords: 'SEO' }
        },
        {
          position: 3,
          title: 'Competitor 2',
          url: 'https://comp2.com',
          domain: 'comp2.com',
          snippet: 'SEO tips',
          headings: ['H1: Tips'],
          wordCount: 1500,
          keywordDensity: 1.8,
          lsiKeywords: ['tips'],
          entities: ['SEO'],
          metaTags: { title: 'SEO Tips', description: 'SEO tips', keywords: 'SEO' }
        }
      ],
      relatedSearches: [],
      peopleAlsoAsk: [],
      totalResults: 1000000,
      searchTime: 0.3
    };

    it('should compare regional rankings with user site rank', () => {
      const comparison = analyzer.compareRegionalRankings(
        'SEO optimization',
        'UAE',
        mockSerpResult,
        2 // User's site rank
      );

      expect(comparison).toEqual({
        location: 'UAE',
        keyword: 'SEO optimization',
        yourRank: 2,
        competitors: [
          { domain: 'comp1.com', rank: 1, url: 'https://comp1.com', title: 'Competitor 1' },
          { domain: 'comp2.com', rank: 3, url: 'https://comp2.com', title: 'Competitor 2' }
        ],
        averageCompetitorRank: 2.0,
        rankingDifference: 0
      });
    });

    it('should compare regional rankings without user site rank', () => {
      const comparison = analyzer.compareRegionalRankings(
        'SEO optimization',
        'UAE',
        mockSerpResult
      );

      expect(comparison.yourRank).toBeUndefined();
      expect(comparison.rankingDifference).toBeUndefined();
      expect(comparison.averageCompetitorRank).toBe(2.0);
    });

    it('should handle empty competitor results', () => {
      const emptySerpResult: SERPAnalysisResult = {
        ...mockSerpResult,
        topResults: []
      };

      const comparison = analyzer.compareRegionalRankings(
        'SEO optimization',
        'UAE',
        emptySerpResult,
        5
      );

      expect(comparison.competitors).toHaveLength(0);
      expect(comparison.averageCompetitorRank).toBe(0);
      expect(comparison.rankingDifference).toBeUndefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed SERP results', () => {
      const malformedResult = {
        keyword: 'test',
        location: 'UAE',
        topResults: [
          { position: 1, title: null, url: '', domain: undefined } // Malformed data
        ]
      } as any;

      expect(() => analyzer.discoverRegionalCompetitors(malformedResult)).not.toThrow();
    });

    it('should normalize location strings consistently', async () => {
      const options: SERPAnalysisOptions = {
        keyword: 'SEO optimization',
        location: 'UNITED ARAB EMIRATES',
        language: 'en',
        device: 'desktop'
      };

      mockSerpAnalysisService.analyzeKeyword.mockResolvedValue({} as any);

      await analyzer.analyzeRegionalSERP(options);

      expect(mockSerpAnalysisService.analyzeKeyword).toHaveBeenCalledWith(
        expect.objectContaining({
          googleDomain: 'google.ae',
          country: 'ae'
        })
      );
    });
  });
});
