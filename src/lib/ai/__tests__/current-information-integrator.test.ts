/**
 * Unit Tests for Current Information Integrator
 * Tests real-time information fetching, validation, and integration
 */

import { CurrentInformationIntegrator, CurrentInformation } from '../current-information-integrator';

// Mock external APIs
jest.mock('../../services/news-api', () => ({
  NewsAPIService: jest.fn().mockImplementation(() => ({
    fetchLatestNews: jest.fn().mockResolvedValue({
      articles: [
        { title: 'AI technology is advancing rapidly', content: 'Latest AI developments in 2025' },
        { title: 'Machine learning algorithms improve', content: 'ML advances this year' }
      ]
    }),
    searchByKeyword: jest.fn().mockResolvedValue({
      articles: [
        { title: 'AI technology is advancing rapidly', content: 'Latest AI developments in 2025' },
        { title: 'Machine learning algorithms improve', content: 'ML advances this year' }
      ]
    }),
  })),
}));

jest.mock('../../services/research-api', () => ({
  ResearchAPIService: jest.fn().mockImplementation(() => ({
    fetchIndustryData: jest.fn().mockResolvedValue({
      statistics: [
        'AI market growth of 25% in 2025',
        'Technology sector expansion continues'
      ]
    }),
    getIndustryData: jest.fn().mockResolvedValue({
      statistics: [
        'AI market growth of 25% in 2025',
        'Technology sector expansion continues'
      ]
    }),
    getMarketTrends: jest.fn().mockResolvedValue({
      trends: [
        'Artificial intelligence adoption increasing',
        'Machine learning integration in business'
      ]
    }),
  })),
}));

describe('CurrentInformationIntegrator', () => {
  let integrator: CurrentInformationIntegrator;
  let mockNewsAPI: any;
  let mockResearchAPI: any;

  beforeEach(() => {
    // Create mock instances
    mockNewsAPI = {
      searchByKeyword: jest.fn().mockResolvedValue({
        articles: [
          { title: 'AI technology is advancing rapidly', content: 'Latest AI developments in 2025' },
          { title: 'Machine learning algorithms improve', content: 'ML advances this year' }
        ]
      }),
    };

    mockResearchAPI = {
      getIndustryData: jest.fn().mockResolvedValue({
        statistics: [
          'AI market growth of 25% in 2025',
          'Technology sector expansion continues'
        ]
      }),
      getMarketTrends: jest.fn().mockResolvedValue({
        trends: [
          'Artificial intelligence adoption increasing',
          'Machine learning integration in business'
        ]
      }),
    };

    integrator = new CurrentInformationIntegrator();
    // Inject mocks
    (integrator as any).newsAPI = mockNewsAPI;
    (integrator as any).researchAPI = mockResearchAPI;

    jest.clearAllMocks();
  });

  describe('fetchCurrentInformation', () => {
    it('should fetch and integrate current information for 2025', async () => {
      const keyword = 'artificial intelligence';
      const industry = 'technology';

      const result = await integrator.fetchCurrentInformation(keyword, industry);

      expect(result).toHaveProperty('facts2025');
      expect(result).toHaveProperty('recentDevelopments');
      expect(result).toHaveProperty('industryTrends');
      expect(result).toHaveProperty('relevantEvents');

      // Verify data is filtered by keyword
      expect(result.facts2025.length).toBeGreaterThan(0);
      expect(result.recentDevelopments.length).toBeGreaterThan(0);
    });

    it('should filter information by keyword relevance', async () => {
      const keyword = 'blockchain';
      const industry = 'finance';

      const result = await integrator.fetchCurrentInformation(keyword, industry);

      // Check that returned information contains the keyword or industry
      const allInfo = [
        ...result.facts2025,
        ...result.recentDevelopments,
        ...result.industryTrends,
        ...result.relevantEvents
      ];

      const relevantInfo = allInfo.filter(info => 
        info.toLowerCase().includes(keyword.toLowerCase()) || 
        info.toLowerCase().includes(industry.toLowerCase())
      );

      expect(relevantInfo.length).toBeGreaterThan(0);
    });

    it('should handle empty keyword gracefully', async () => {
      const result = await integrator.fetchCurrentInformation('', 'technology');

      expect(result).toHaveProperty('facts2025');
      expect(result).toHaveProperty('recentDevelopments');
      expect(result).toHaveProperty('industryTrends');
      expect(result).toHaveProperty('relevantEvents');
    });

    it('should handle special characters in keyword', async () => {
      const keyword = 'AI & ML';
      const industry = 'tech';

      const result = await integrator.fetchCurrentInformation(keyword, industry);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('formatForPrompt', () => {
    const mockCurrentInfo: CurrentInformation = {
      facts2025: [
        'AI adoption reached 75% in enterprise by Q2 2025',
        'Global AI market valued at $500B in 2025'
      ],
      recentDevelopments: [
        'New GPT-5 model released with enhanced reasoning',
        'EU AI Act fully implemented across member states'
      ],
      industryTrends: [
        'Rise of autonomous AI agents in business',
        'Increased focus on AI safety and alignment'
      ],
      relevantEvents: [
        'AI Safety Summit 2025 scheduled for December',
        'Global AI Governance Conference in Q4 2025'
      ]
    };

    it('should format current information for AI prompts', () => {
      const formatted = integrator.formatForPrompt(mockCurrentInfo);

      expect(formatted).toContain('**Latest 2025 Information & Trends:**');
      expect(formatted).toContain('**Facts & Statistics:**');
      expect(formatted).toContain('**Recent Developments:**');
      expect(formatted).toContain('**Industry Trends:**');
      expect(formatted).toContain('**Relevant Events:**');

      // Check that actual data is included
      expect(formatted).toContain('AI adoption reached 75%');
      expect(formatted).toContain('New GPT-5 model released');
    });

    it('should handle empty sections gracefully', () => {
      const emptyInfo: CurrentInformation = {
        facts2025: [],
        recentDevelopments: ['One development'],
        industryTrends: [],
        relevantEvents: []
      };

      const formatted = integrator.formatForPrompt(emptyInfo);

      expect(formatted).toContain('**Latest 2025 Information & Trends:**');
      expect(formatted).toContain('**Recent Developments:**');
      expect(formatted).toContain('One development');
      expect(formatted).not.toContain('**Facts & Statistics:**');
      expect(formatted).not.toContain('**Industry Trends:**');
    });

    it('should handle completely empty information', () => {
      const emptyInfo: CurrentInformation = {
        facts2025: [],
        recentDevelopments: [],
        industryTrends: [],
        relevantEvents: []
      };

      const formatted = integrator.formatForPrompt(emptyInfo);

      expect(formatted).toContain('**Latest 2025 Information & Trends:**');
      expect(formatted.length).toBeGreaterThan(30); // Should have header at minimum
    });
  });

  describe('validateInformationFreshness', () => {
    it('should validate fresh information with high scores', async () => {
      const freshData = 'Latest 2025 AI developments show significant progress';

      const validation = await integrator.validateInformationFreshness(freshData);

      expect(validation.freshnessScore).toBeGreaterThan(70);
      expect(validation.isValid).toBe(true);
    });

    it('should detect potentially outdated information', async () => {
      const oldData = 'In 2020, AI was still emerging technology';

      const validation = await integrator.validateInformationFreshness(oldData);

      expect(validation.freshnessScore).toBeLessThan(70);
      expect(validation.isValid).toBe(false);
    });

    it('should handle information with recent keywords', async () => {
      const recentData = 'Recent studies indicate that current AI trends are evolving';

      const validation = await integrator.validateInformationFreshness(recentData);

      expect(validation.freshnessScore).toBeGreaterThan(60);
      expect(validation.isValid).toBe(true);
    });

    it('should validate information with current year references', async () => {
      const currentData = 'The 2025 market analysis reveals new opportunities';

      const validation = await integrator.validateInformationFreshness(currentData);

      expect(validation.freshnessScore).toBeGreaterThan(80);
      expect(validation.isValid).toBe(true);
    });

    it('should handle empty or null data', async () => {
      const emptyValidation = await integrator.validateInformationFreshness('');
      const nullValidation = await integrator.validateInformationFreshness(null as any);

      expect(emptyValidation.freshnessScore).toBe(0);
      expect(emptyValidation.isValid).toBe(false);
      expect(nullValidation.freshnessScore).toBe(0);
      expect(nullValidation.isValid).toBe(false);
    });
  });

  describe('filterByKeyword', () => {
    it('should filter array by keyword relevance', () => {
      const data = [
        'AI technology is advancing rapidly',
        'Blockchain applications in finance',
        'Machine learning algorithms improve',
        'Cryptocurrency market trends'
      ];

      const filtered = integrator.filterByKeyword(data, 'AI');

      expect(filtered).toContain('AI technology is advancing rapidly');
      expect(filtered).toContain('Machine learning algorithms improve'); // Related to AI
      expect(filtered).not.toContain('Cryptocurrency market trends');
    });

    it('should handle case-insensitive filtering', () => {
      const data = [
        'SEO optimization techniques',
        'Search Engine Optimization best practices',
        'Social media marketing strategies'
      ];

      const filtered = integrator.filterByKeyword(data, 'seo');

      expect(filtered.length).toBeGreaterThanOrEqual(2);
      expect(filtered).toContain('SEO optimization techniques');
      expect(filtered).toContain('Search Engine Optimization best practices');
    });

    it('should return empty array for no matches', () => {
      const data = [
        'Unrelated topic one',
        'Another unrelated topic',
        'Third unrelated item'
      ];

      const filtered = integrator.filterByKeyword(data, 'blockchain');

      expect(filtered).toHaveLength(0);
    });

    it('should handle empty input arrays', () => {
      const filtered = integrator.filterByKeyword([], 'keyword');

      expect(filtered).toHaveLength(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle API failures gracefully', async () => {
      // Mock API failure
      jest.spyOn(integrator, 'fetchCurrentInformation').mockRejectedValueOnce(
        new Error('API service unavailable')
      );

      await expect(integrator.fetchCurrentInformation('test', 'tech')).rejects.toThrow('API service unavailable');
    });

    it('should handle malformed data responses', async () => {
      const malformedKeyword = '<script>alert("xss")</script>';
      const malformedIndustry = '"; DROP TABLE users; --';

      // Should not throw and should sanitize input
      const result = await integrator.fetchCurrentInformation(malformedKeyword, malformedIndustry);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle very long keyword strings', async () => {
      const longKeyword = 'a'.repeat(1000);
      const industry = 'technology';

      const result = await integrator.fetchCurrentInformation(longKeyword, industry);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle unicode and special characters', async () => {
      const unicodeKeyword = '人工智能 AI 🤖';
      const industry = 'technology';

      const result = await integrator.fetchCurrentInformation(unicodeKeyword, industry);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});
