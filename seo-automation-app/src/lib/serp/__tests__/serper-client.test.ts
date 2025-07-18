import { SerperClient } from '../serper-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SerperClient', () => {
  let serperClient: SerperClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    serperClient = new SerperClient(mockApiKey);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      expect(() => new SerperClient('')).toThrow('Serper API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(() => new SerperClient(mockApiKey)).not.toThrow();
    });
  });

  describe('search', () => {
    const mockSearchOptions = {
      keyword: 'SEO best practices',
      location: 'United States',
      country: 'us',
      num: 5
    };

    const mockResponse = {
      data: {
        organic: [
          {
            position: 1,
            title: 'SEO Best Practices Guide',
            link: 'https://example.com/seo-guide',
            snippet: 'Complete guide to SEO...'
          }
        ],
        peopleAlsoAsk: [
          {
            question: 'What are SEO best practices?',
            snippet: 'SEO best practices include...'
          }
        ],
        relatedSearches: [
          { query: 'SEO tips 2024' }
        ],
        searchParameters: {
          q: 'SEO best practices',
          gl: 'us',
          num: 5
        }
      }
    };

    beforeEach(() => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn(),
        get: jest.fn()
      } as any);
    });

    it('should perform successful search', async () => {
      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        get: jest.fn()
      } as any);

      const client = new SerperClient(mockApiKey);
      const result = await client.search(mockSearchOptions);

      expect(result).toEqual(mockResponse.data);
      expect(result.organic).toHaveLength(1);
      expect(result.organic[0].title).toBe('SEO Best Practices Guide');
    });

    it('should handle invalid API key error', async () => {
      const mockPost = jest.fn().mockRejectedValue({
        isAxiosError: true,
        response: { status: 403 }
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        get: jest.fn()
      } as any);

      const client = new SerperClient(mockApiKey);
      await expect(client.search(mockSearchOptions))
        .rejects.toThrow('Invalid Serper API key or quota exceeded');
    });

    it('should handle rate limit error', async () => {
      const mockPost = jest.fn().mockRejectedValue({
        isAxiosError: true,
        response: { status: 429 }
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        get: jest.fn()
      } as any);

      const client = new SerperClient(mockApiKey);
      await expect(client.search(mockSearchOptions))
        .rejects.toThrow('Serper API rate limit exceeded');
    });

    it('should include domain parameter when provided', async () => {
      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        get: jest.fn()
      } as any);

      const client = new SerperClient(mockApiKey);
      await client.search({
        ...mockSearchOptions,
        domain: 'google.ae'
      });

      expect(mockPost).toHaveBeenCalledWith('/search', expect.objectContaining({
        google_domain: 'google.ae'
      }));
    });
  });

  describe('checkQuota', () => {
    it('should return quota information', async () => {
      const mockQuotaResponse = {
        data: {
          searches_used: 100,
          searches_limit: 1000
        }
      };

      const mockGet = jest.fn().mockResolvedValue(mockQuotaResponse);
      mockedAxios.create.mockReturnValue({
        post: jest.fn(),
        get: mockGet
      } as any);

      const client = new SerperClient(mockApiKey);
      const quota = await client.checkQuota();

      expect(quota).toEqual({
        used: 100,
        limit: 1000
      });
    });

    it('should handle quota check errors gracefully', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      mockedAxios.create.mockReturnValue({
        post: jest.fn(),
        get: mockGet
      } as any);

      const client = new SerperClient(mockApiKey);
      const quota = await client.checkQuota();

      expect(quota).toEqual({
        used: 0,
        limit: 0
      });
    });
  });
});