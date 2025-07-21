import { SERPAnalysisService, GOOGLE_DOMAINS, COUNTRY_CODES } from '../serp-analysis.service';
import { SerperClient } from '../serper-client';

// Mock SerperClient
jest.mock('../serper-client');

describe('SERPAnalysisService', () => {
  let serpAnalysisService: SERPAnalysisService;
  let mockSerperClient: jest.Mocked<SerperClient>;

  beforeEach(() => {
    mockSerperClient = {
      search: jest.fn(),
      checkQuota: jest.fn()
    } as any;

    serpAnalysisService = new SERPAnalysisService(mockSerperClient);
  });

  describe('analyzeKeyword', () => {
    const mockSearchResponse = {
      organic: [
        {
          position: 1,
          title: 'Best SEO Practices 2024',
          link: 'https://example.com/seo',
          snippet: 'Learn the best SEO practices...'
        },
        {
          position: 2,
          title: 'SEO Guide - Example',
          link: 'https://example.org/guide',
          snippet: 'Complete SEO guide...'
        },
        {
          position: 3,
          title: 'Ad - SEO Tools',
          link: 'https://ads.google.com/seo-tools',
          snippet: 'Buy SEO tools...'
        }
      ],
      relatedSearches: [
        { query: 'SEO tips' },
        { query: 'SEO tools' }
      ],
      peopleAlsoAsk: [
        {
          question: 'What is SEO?',
          snippet: 'SEO stands for Search Engine Optimization...'
        }
      ]
    };

    it('should analyze keyword with correct parameters', async () => {
      mockSerperClient.search.mockResolvedValue(mockSearchResponse);

      const result = await serpAnalysisService.analyzeKeyword({
        keyword: 'SEO best practices',
        location: 'United States',
        numResults: 5
      });

      expect(mockSerperClient.search).toHaveBeenCalledWith({
        keyword: 'SEO best practices',
        country: 'us',
        domain: 'google.com',
        num: 10
      });

      expect(result.keyword).toBe('SEO best practices');
      expect(result.location).toBe('united states');
      expect(result.googleDomain).toBe('google.com');
      expect(result.topResults).toHaveLength(2); // Excludes ad
    });

    it('should filter out non-organic results', async () => {
      mockSerperClient.search.mockResolvedValue(mockSearchResponse);

      const result = await serpAnalysisService.analyzeKeyword({
        keyword: 'SEO',
        location: 'US',
        onlyOrganic: true
      });

      const urls = result.topResults.map(r => r.url);
      expect(urls).not.toContain('https://ads.google.com/seo-tools');
      expect(result.topResults.every(r => r.isOrganic)).toBe(true);
    });

    it('should handle different location formats', async () => {
      mockSerperClient.search.mockResolvedValue(mockSearchResponse);

      const result = await serpAnalysisService.analyzeKeyword({
        keyword: 'SEO',
        location: 'UAE'
      });

      expect(result.googleDomain).toBe('google.ae');
      expect(mockSerperClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'ae',
          domain: 'google.ae'
        })
      );
    });

    it('should exclude specified domains', async () => {
      mockSerperClient.search.mockResolvedValue(mockSearchResponse);

      const result = await serpAnalysisService.analyzeKeyword({
        keyword: 'SEO',
        location: 'US',
        excludeDomains: ['example.com']
      });

      const domains = result.topResults.map(r => r.domain);
      expect(domains).not.toContain('example.com');
    });

    it('should assess content quality', async () => {
      mockSerperClient.search.mockResolvedValue({
        organic: [
          {
            position: 1,
            title: 'High Quality SEO Guide with Good Title Length',
            link: 'https://example.com/guide',
            snippet: 'This is a comprehensive snippet with plenty of useful information about SEO best practices.',
            date: '2024-01-15',
            sitelinks: [{ title: 'Section 1', link: 'https://example.com/guide#1' }]
          },
          {
            position: 2,
            title: 'Short',
            link: 'https://example.org/seo',
            snippet: 'Brief'
          }
        ],
        relatedSearches: [],
        peopleAlsoAsk: []
      });

      const result = await serpAnalysisService.analyzeKeyword({
        keyword: 'SEO',
        location: 'US'
      });

      expect(result.topResults[0].contentQuality).toBe('high');
      expect(result.topResults[1].contentQuality).toBe('low');
    });
  });

  describe('compareRegionalResults', () => {
    it('should analyze keyword across multiple locations', async () => {
      const mockUSResponse = {
        organic: [{ position: 1, title: 'US Result', link: 'https://us.example.com' }],
        relatedSearches: [],
        peopleAlsoAsk: []
      };

      const mockUKResponse = {
        organic: [{ position: 1, title: 'UK Result', link: 'https://uk.example.com' }],
        relatedSearches: [],
        peopleAlsoAsk: []
      };

      mockSerperClient.search
        .mockResolvedValueOnce(mockUSResponse)
        .mockResolvedValueOnce(mockUKResponse);

      const results = await serpAnalysisService.compareRegionalResults(
        'SEO',
        ['United States', 'United Kingdom']
      );

      expect(Object.keys(results)).toEqual(['United States', 'United Kingdom']);
      expect(results['United States'].googleDomain).toBe('google.com');
      expect(results['United Kingdom'].googleDomain).toBe('google.co.uk');
    });

    it('should handle errors gracefully for individual locations', async () => {
      mockSerperClient.search
        .mockResolvedValueOnce({
          organic: [{ position: 1, title: 'US Result', link: 'https://us.example.com' }],
          relatedSearches: [],
          peopleAlsoAsk: []
        })
        .mockRejectedValueOnce(new Error('API Error'));

      const results = await serpAnalysisService.compareRegionalResults(
        'SEO',
        ['United States', 'United Kingdom']
      );

      expect(Object.keys(results)).toEqual(['United States']);
      expect(results['United Kingdom']).toBeUndefined();
    });
  });

  describe('validateResultAccessibility', () => {
    it('should validate URL accessibility', async () => {
      const urls = [
        'https://example.com/page1',
        'http://example.org/page2',
        'ftp://invalid.com/file',
        'not-a-url'
      ];

      const accessibility = await serpAnalysisService.validateResultAccessibility(urls);

      expect(accessibility['https://example.com/page1']).toBe(true);
      expect(accessibility['http://example.org/page2']).toBe(true);
      expect(accessibility['ftp://invalid.com/file']).toBe(false);
      expect(accessibility['not-a-url']).toBe(false);
    });
  });

  describe('domain mappings', () => {
    it('should have correct Google domain mappings', () => {
      expect(GOOGLE_DOMAINS['united states']).toBe('google.com');
      expect(GOOGLE_DOMAINS['uae']).toBe('google.ae');
      expect(GOOGLE_DOMAINS['united kingdom']).toBe('google.co.uk');
      expect(GOOGLE_DOMAINS['germany']).toBe('google.de');
    });

    it('should have correct country code mappings', () => {
      expect(COUNTRY_CODES['united states']).toBe('us');
      expect(COUNTRY_CODES['uae']).toBe('ae');
      expect(COUNTRY_CODES['united kingdom']).toBe('gb');
      expect(COUNTRY_CODES['germany']).toBe('de');
    });
  });
});